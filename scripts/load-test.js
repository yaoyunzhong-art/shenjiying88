// ═══════════════════════════════════════════════════════════════
// 神机营 SaaS — 压力测试脚本 (k6)
// 用法: k6 run scripts/load-test.js
// ═══════════════════════════════════════════════════════════════
import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Trend, Rate, Counter } from 'k6/metrics'

// ── 可配置参数 ──────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'https://api.sportsant.net'
const VUS = parseInt(__ENV.VUS || '10')        // 并发用户
const DURATION = __ENV.DURATION || '30s'       // 持续时间
const RAMP_UP = __ENV.RAMP_UP || '5s'          // 爬坡时间

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
