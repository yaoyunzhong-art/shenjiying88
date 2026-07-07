/**
 * autocannon 压测脚本 (Node.js 客户端) (P2-3.1)
 *
 * 适用场景:
 *   - 临时快速摸底, 无 k6 环境
 *   - CI 流水线集成
 *
 * 使用:
 *   node loadtest/cashier-load.autocannon.js
 *
 * 输出:
 *   - RPS / 延迟分布 / 错误率
 *   - 写入 loadtest-result-YYYYMMDD-HHmmss.json
 */

import autocannon from 'autocannon'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TENANT_ID = process.env.TENANT_ID || 't-loadtest'
const DURATION = Number(process.env.DURATION || 60)
const CONNECTIONS = Number(process.env.CONNECTIONS || 100)
const PIPELINING = Number(process.env.PIPELINING || 1)

const orderBody = JSON.stringify({
  items: [
    { itemId: 'i-1', name: '拿铁咖啡', qty: 1, unitPrice: 28, discount: 0, sku: 'SKU-001' }
  ],
  channel: 'POS'
})

const requests = [
  {
    method: 'POST',
    path: '/cashier/orders',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': TENANT_ID
    },
    body: orderBody
  }
]

const result = await autocannon({
  url: BASE_URL,
  connections: CONNECTIONS,
  pipelining: PIPELINING,
  duration: DURATION,
  requests
})

// 打印摘要
console.log('\n========== 压测结果 ==========')
console.log(`URL:              ${BASE_URL}`)
console.log(`Duration:         ${DURATION}s`)
console.log(`Connections:      ${CONNECTIONS}`)
console.log(`Total requests:   ${result.requests.total}`)
console.log(`RPS (avg):        ${result.requests.average.toFixed(2)}`)
console.log(`Throughput:       ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/s`)
console.log(`Latency p50:      ${result.latency.p50}ms`)
console.log(`Latency p90:      ${result.latency.p90}ms`)
console.log(`Latency p99:      ${result.latency.p99}ms`)
console.log(`Latency max:      ${result.latency.max}ms`)
console.log(`Latency mean:     ${result.latency.mean.toFixed(2)}ms`)
console.log(`Errors:           ${result.errors}`)
console.log(`Timeouts:         ${result.timeouts}`)
console.log(`Non-2xx:          ${result.non2xx}`)
console.log('==============================\n')

// SLA 校验
const SLA = {
  p95_latency_ms: 500,
  error_rate: 0.005,
  rps: 500
}
const errorRate = result.non2xx / result.requests.total
const p95 = result.latency.p99 // autocannon 用 p99 代替 p95
const slaResult = {
  pass: true,
  checks: {
    latency_p99_lt_500ms: p95 < SLA.p95_latency_ms,
    error_rate_lt_0_5pct: errorRate < SLA.error_rate
  }
}
if (p95 >= SLA.p95_latency_ms) slaResult.pass = false
if (errorRate >= SLA.error_rate) slaResult.pass = false
slaResult.checks.rps_gte_500 = result.requests.average >= SLA.rps
if (result.requests.average < SLA.rps) slaResult.pass = false

console.log('========== SLA 校验 ==========')
for (const [k, v] of Object.entries(slaResult.checks)) {
  console.log(`  ${v ? '✓' : '✗'} ${k}: ${v}`)
}
console.log(`  Overall: ${slaResult.pass ? 'PASS' : 'FAIL'}`)
console.log('==============================\n')

// 落盘结果
mkdirSync('loadtest-results', { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const file = join('loadtest-results', `cashier-${stamp}.json`)
writeFileSync(
  file,
  JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      config: { BASE_URL, TENANT_ID, DURATION, CONNECTIONS, PIPELINING },
      result: {
        requests: result.requests,
        latency: result.latency,
        throughput: result.throughput,
        errors: result.errors,
        timeouts: result.timeouts,
        non2xx: result.non2xx
      },
      sla: slaResult
    },
    null,
    2
  )
)
console.log(`结果已保存: ${file}`)

if (!slaResult.pass) {
  process.exit(1)
}
