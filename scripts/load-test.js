// ═══════════════════════════════════════════════════════════════
// 神机营 SaaS — 压力测试脚本 (k6)
// 用法: k6 run scripts/load-test.js
//
// ⚠️ 安全门控（2026-07-29 事故后强制）
//   - 默认 BASE_URL = http://localhost:3145 (本地 API)
//   - 生产 URL (sportsant.net) 必须显式 ALLOW_PROD=1
//   - VU > 100 必须显式 ALLOW_HV=1
//   - DURATION > 5m 必须显式 ALLOW_LT=1
// ═══════════════════════════════════════════════════════════════
import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Trend, Rate, Counter } from 'k6/metrics'

// ── 可配置参数 ──────────────────────────────────────────────
const RAW_BASE_URL = __ENV.BASE_URL || 'http://localhost:3145'
const VUS = parseInt(__ENV.VUS || '10')        // 并发用户
const DURATION = __ENV.DURATION || '30s'       // 持续时间
const RAMP_UP = __ENV.RAMP_UP || '5s'          // 爬坡时间
const ALLOW_PROD = __ENV.ALLOW_PROD === '1'    // 生产白名单开关
const ALLOW_HV = __ENV.ALLOW_HV === '1'        // 高 VU 白名单开关
const ALLOW_LT = __ENV.ALLOW_LT === '1'        // 长时间白名单开关

// ── 安全门控 ────────────────────────────────────────────────
// 用字符串匹配代替 new URL()，避免 k6/Go runtime 解析差异
const PROD_HOSTS = ['api.sportsant.net', 'admin.sportsant.net', 'store.sportsant.net', 'tob.sportsant.net', 'sportsant.net']
const PRIVATE_PREFIXES = ['localhost', '127.0.0.1', 'k3d', '0.0.0.0', '10.', '192.168.', 'staging.']

function extractHost(url) {
  if (!url) return ''
  // 去掉 protocol
  const noProto = url.replace(/^https?:\/\//, '')
  // 去掉 path
  const slashIdx = noProto.indexOf('/')
  return slashIdx >= 0 ? noProto.substring(0, slashIdx) : noProto
}

function isProdHost(url) {
  const host = extractHost(url).toLowerCase()
  if (!host) return false
  for (const p of PROD_HOSTS) {
    if (host === p || host.endsWith('.' + p)) return true
  }
  return host.includes('sportsant.net')
}

function isPrivateHost(url) {
  const host = extractHost(url).toLowerCase()
  if (!host) return false
  for (const p of PRIVATE_PREFIXES) {
    if (host === p || host.startsWith(p)) return true
  }
  return false
}

// ── 门控顺序: prod (ALLOW_PROD) / private / 拒绝 ──
if (isProdHost(RAW_BASE_URL) && !ALLOW_PROD) {
  throw new Error(
    `\n🚨 安全门控: BASE_URL=${RAW_BASE_URL} 是生产域名!\n` +
    `   必须显式传 ALLOW_PROD=1 才能跑生产压测。\n` +
    `   推荐: k6 run -e BASE_URL=http://localhost:3145 ...  (本地优先)\n` +
    `   例外: k6 run -e BASE_URL=${RAW_BASE_URL} -e ALLOW_PROD=1 ...  (报备后)\n`
  )
}

if (!isProdHost(RAW_BASE_URL) && !isPrivateHost(RAW_BASE_URL)) {
  throw new Error(
    `\n🚨 安全门控: BASE_URL=${RAW_BASE_URL} 不是内网地址!\n` +
    `   仅允许 localhost / 127.0.0.1 / k3d / 10.0.0.* / 192.168.* 段。\n` +
    `   生产请用 ALLOW_PROD=1 显式打开。\n`
  )
}

if (VUS > 100 && !ALLOW_HV) {
  throw new Error(
    `\n🚨 安全门控: VUS=${VUS} > 100!\n` +
    `   高并发压测必须显式传 ALLOW_HV=1。\n`
  )
}

const durSec = String(DURATION).match(/^(\d+)([smh])/) ? parseInt(String(DURATION).match(/^(\d+)/)[1]) * ({s: 1, m: 60, h: 3600}[String(DURATION).match(/^(\d+)([smh])/)[2]] || 1) : 0
if (durSec > 300 && !ALLOW_LT) {
  throw new Error(
    `\n🚨 安全门控: DURATION=${DURATION} > 5min!\n` +
    `   长时间压测必须显式传 ALLOW_LT=1。\n`
  )
}

const BASE_URL = RAW_BASE_URL
const SAFE_MODE = isProdHost(BASE_URL) ? '🚨 PRODUCTION' : '🟢 LOCAL'

console.log(`\n🔒 压测模式: ${SAFE_MODE}`)
console.log(`   BASE_URL: ${BASE_URL}`)
console.log(`   VUS: ${VUS}`)
console.log(`   DURATION: ${DURATION}`)
if (isProdHost(BASE_URL)) {
  console.log(`   ⚠️  ALLOW_PROD=1 已开启 — 这是生产压测，请确认已报备`)
}

// ── 自定义指标 ──────────────────────────────────────────────
const healthLatency = new Trend('health_latency_ms')
const orderLatency = new Trend('order_latency_ms')
const verifyLatency = new Trend('verify_latency_ms')
const errorRate = new Rate('error_rate')
const successCount = new Counter('success_count')

export const options = {
  stages: [
    { duration: RAMP_UP, target: VUS },
    { duration: DURATION, target: VUS },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],   // 95%的请求 < 2s
    http_req_failed: ['rate<0.05'],       // 失败率 < 5%
    'health_latency_ms': ['p(95)<500'],
    'order_latency_ms': ['p(95)<3000'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
}

const HEADERS = {
  'Content-Type': 'application/json',
  'x-tenant-id': 'load-test-tenant',
}

// ── 主测试 ──────────────────────────────────────────────────

export default function () {
  group('1. 健康检查', () => {
    const start = Date.now()
    const res = http.get(`${BASE_URL}/api/v1/health/ping`, { headers: HEADERS })
    healthLatency.add(Date.now() - start)

    const ok = check(res, {
      'health/ping 200': (r) => r.status === 200,
      'health/ping alive': (r) => r.body.includes('true') || r.body.includes('alive'),
    })

    if (ok) successCount.add(1)
    else errorRate.add(1)

    sleep(0.1)
  })

  group('2. 收银下单', () => {
    const payload = JSON.stringify({
      items: [{ skuId: 'LOAD-TEST-001', title: '测试商品', quantity: 1, price: 1 }],
      memberId: `load-test-user-${__VU}`,
      currency: 'CNY',
    })

    const start = Date.now()
    const res = http.post(`${BASE_URL}/api/v1/cashier/orders`, payload, { headers: HEADERS })
    orderLatency.add(Date.now() - start)

    const ok = check(res, {
      'order 2xx': (r) => r.status === 200 || r.status === 201,
    })

    if (ok) successCount.add(1)
    else errorRate.add(1)

    sleep(1)
  })

  group('3. 未成年身份校验', () => {
    const payload = JSON.stringify({
      tenantId: 'load-test-tenant',
      memberId: `load-test-member-${__VU}`,
      method: 'id_card',
      identityNumber: '110101200901010000',
      name: `测试用户${__VU}`,
      birthday: '2009-01-01',
    })

    const start = Date.now()
    const res = http.post(`${BASE_URL}/api/v1/minor-protection/verify`, payload, { headers: HEADERS })
    verifyLatency.add(Date.now() - start)

    const ok = check(res, {
      'verify 2xx': (r) => r.status === 200 || r.status === 201,
    })

    if (ok) successCount.add(1)
    else errorRate.add(1)

    sleep(0.5)
  })

  sleep(1)
}

// ── 结果导出 ──────────────────────────────────────────────────

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    config: { baseUrl: BASE_URL, vus: VUS, duration: DURATION },
    metrics: {
      health: {
        avg_ms: data.metrics.health_latency_ms?.values?.avg,
        p95_ms: data.metrics.health_latency_ms?.values?.['p(95)'],
        p99_ms: data.metrics.health_latency_ms?.values?.['p(99)'],
      },
      order: {
        avg_ms: data.metrics.order_latency_ms?.values?.avg,
        p95_ms: data.metrics.order_latency_ms?.values?.['p(95)'],
        p99_ms: data.metrics.order_latency_ms?.values?.['p(99)'],
      },
      verify: {
        avg_ms: data.metrics.verify_latency_ms?.values?.avg,
        p95_ms: data.metrics.verify_latency_ms?.values?.['p(95)'],
      },
      http: {
        total_requests: data.metrics.http_reqs?.values?.count,
        failed_rate: data.metrics.http_req_failed?.values?.rate,
        avg_duration_ms: data.metrics.http_req_duration?.values?.avg,
        p95_duration_ms: data.metrics.http_req_duration?.values?.['p(95)'],
      },
    },
    verdict: (data.metrics.http_req_failed?.values?.rate || 0) < 0.05 ? 'PASS' : 'FAIL',
  }

  return {
    'stdout': `\n📊 压测结果\n  请求总数: ${summary.metrics.http.total_requests}\n  失败率: ${((summary.metrics.http.failed_rate || 0) * 100).toFixed(2)}%\n  健康检查 P95: ${summary.metrics.health.p95_ms?.toFixed(0)}ms\n  下单 P95: ${summary.metrics.order.p95_ms?.toFixed(0)}ms\n  判据: ${summary.verdict}\n`,
    'load-test-results.json': JSON.stringify(summary, null, 2),
  }
}
