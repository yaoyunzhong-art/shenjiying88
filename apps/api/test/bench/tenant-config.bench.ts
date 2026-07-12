// k6 压测: tenant-config getConfigs / getEffectiveConfigs
// 目标: 验证 P1-F1 二级索引优化效果
//
// 跑法:
//   cd apps/api
//   npm i -g k6 (或 brew install k6)
//   k6 run test/bench/tenant-config.bench.ts
//
// 环境:
//   - API baseUrl: http://localhost:3000 (本地启动)
//   - 1000 并发, 30s
//   - 3 个端点: getConfigs / getEffectiveConfigs / getConfig

import http from 'k6/http'
import { check } from 'k6'
import { Trend, Rate } from 'k6/metrics'

const getConfigsLatency = new Trend('getConfigs_latency', true)
const getEffectiveLatency = new Trend('getEffective_latency', true)
const getConfigLatency = new Trend('getConfig_latency', true)
const errorRate = new Rate('errors')

export const options = {
  stages: [
    { duration: '5s', target: 100 },  // 预热
    { duration: '10s', target: 500 }, // 升压
    { duration: '10s', target: 1000 }, // 峰值
    { duration: '5s', target: 0 },    // 降压
  ],
  thresholds: {
    // P1-F1 目标: P99 < 50ms (getConfigs / getConfig), < 80ms (getEffectiveConfigs)
    'getConfigs_latency': ['p(99)<50'],
    'getEffective_latency': ['p(99)<80'],
    'getConfig_latency': ['p(99)<50'],
    'errors': ['rate<0.01'],
  },
}

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000'
const TOKEN = __ENV.TEST_TOKEN || 'test-token-tenant-A'

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`,
  'x-tenant-id': 'tenant-A',
  'x-brand-id': 'tenant-A::brand-1',
  'x-store-id': 'store-001',
  'x-user-role': 'tenant_admin',
}

export default function () {
  // 1. getConfigs (store 级)
  const r1 = http.get(`${BASE_URL}/api/tenant-config/configs?level=store`, { headers })
  getConfigsLatency.add(r1.timings.duration)
  errorRate.add(r1.status !== 200)
  check(r1, { 'getConfigs 200': (r) => r.status === 200 })

  // 2. getEffectiveConfigs (无 category, 全量)
  const r2 = http.get(`${BASE_URL}/api/tenant-config/configs/effective`, { headers })
  getEffectiveLatency.add(r2.timings.duration)
  errorRate.add(r2.status !== 200)
  check(r2, { 'getEffective 200': (r) => r.status === 200 })

  // 3. getConfig (单 key)
  const r3 = http.get(`${BASE_URL}/api/tenant-config/configs/pos.tax_rate`, { headers })
  getConfigLatency.add(r3.timings.duration)
  errorRate.add(r3.status !== 200)
  check(r3, { 'getConfig 200': (r) => r.status === 200 })
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data),
  }
}

function textSummary(data) {
  const lines = []
  lines.push('═══════════════════════════════════════════════════')
  lines.push('  P1-F1 性能压测报告 · k6 baseline')
  lines.push('═══════════════════════════════════════════════════')
  lines.push('')

  for (const metric of ['getConfigs_latency', 'getEffective_latency', 'getConfig_latency']) {
    const m = data.metrics[metric]
    if (!m) continue
    const p50 = m.values['p(50)']
    const p95 = m.values['p(95)']
    const p99 = m.values['p(99)']
    const max = m.values.max
    const target = metric === 'getEffective_latency' ? 80 : 50
    const pass = p99 < target
    lines.push(`${metric}:`)
    lines.push(`  P50: ${p50.toFixed(2)}ms`)
    lines.push(`  P95: ${p95.toFixed(2)}ms`)
    lines.push(`  P99: ${p99.toFixed(2)}ms  ${pass ? '✅ PASS' : '❌ FAIL'} (目标 < ${target}ms)`)
    lines.push(`  Max: ${max.toFixed(2)}ms`)
    lines.push('')
  }

  const err = data.metrics.errors
  lines.push(`错误率: ${(err.values.rate * 100).toFixed(3)}% ${err.values.rate < 0.01 ? '✅' : '❌'}`)
  lines.push('')
  lines.push('═══════════════════════════════════════════════════')
  return lines.join('\n')
}
