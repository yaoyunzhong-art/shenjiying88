import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 性能压测 V10 Day 13
 *
 * 用 mock HTTP server + 并发 Promise 模拟 N 并发请求
 * 测量 P50/P95/P99 latency + throughput
 *
 * 不依赖 autocannon/k6 等外部工具,纯 Node.js 原生压测
 */

import assert from 'node:assert/strict'
import * as http from 'node:http'
import { AiModelConfigService } from '../modules/ai-model-config/ai-model-config.service'
import { TenantConfigService } from '../modules/tenant-config/tenant-config.service'
import { OpenApiService } from '../modules/open-api/open-api.service'
import { ReportService } from '../modules/report/report.service'
import { CanaryService } from '../modules/canary/canary.service'
import { runWithTenant } from '../common/context/tenant-context'

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => resolve(body))
  })
}

function createMockServer() {
  const aiService = new AiModelConfigService()
  const tenantService = new TenantConfigService()
  const openApiService = new OpenApiService()
  const reportService = new ReportService()
  const canaryService = new CanaryService()

  const defaultCtx = {
    tenantId: 'tenant-A',
    storeId: 'store-001',
    userId: 'admin',
    role: 'tenant_admin' as const,
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
    res.setHeader('Content-Type', 'application/json')
    try {
      await runWithTenant(defaultCtx, async () => {
        if (url.pathname === '/ai/presets' && req.method === 'GET') {
          res.end(JSON.stringify({ items: aiService.listPresets() }))
          return
        }
        if (url.pathname === '/tenant/config' && req.method === 'GET') {
          const items = await tenantService.getConfigs({ level: 'tenant' })
          res.end(JSON.stringify({ items }))
          return
        }
        if (url.pathname === '/canary/list' && req.method === 'GET') {
          res.end(JSON.stringify({ items: canaryService.listExperiments() }))
          return
        }
        if (url.pathname === '/report/list' && req.method === 'GET') {
          res.end(JSON.stringify({ items: reportService.listReports() }))
          return
        }
        if (url.pathname === '/open/auth/token' && req.method === 'POST') {
          const body = await readBody(req)
          const params = new URLSearchParams(body)
          const token = await openApiService.authenticate(
            params.get('client_id') ?? '',
            params.get('client_secret') ?? '',
            (params.get('scope') ?? '').split(' ').filter(Boolean),
          )
          res.end(JSON.stringify({ accessToken: token.accessToken }))
          return
        }
        res.statusCode = 404
        res.end('{}')
      })
    } catch (err: any) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: err.message }))
    }
  })

  return { server }
}

async function httpGet(url: string): Promise<{ status: number; latency: number }> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    http.get(url, (res) => {
      res.on('data', () => null)
      res.on('end', () => resolve({ status: res.statusCode ?? 0, latency: Date.now() - start }))
    }).on('error', reject)
  })
}

async function httpPost(url: string, formData: Record<string, string>): Promise<{ status: number; latency: number }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const body = new URLSearchParams(formData).toString()
    const start = Date.now()
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        res.on('data', () => null)
        res.on('end', () => resolve({ status: res.statusCode ?? 0, latency: Date.now() - start }))
      },
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

interface BenchResult {
  total: number
  ok: number
  fail: number
  durationMs: number
  rps: number
  p50: number
  p95: number
  p99: number
  max: number
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(Math.ceil((p / 100) * sorted.length) - 1, sorted.length - 1)
  return sorted[Math.max(0, idx)]
}

async function bench(fn: () => Promise<unknown>, concurrency: number, total: number): Promise<BenchResult> {
  const latencies: number[] = []
  let ok = 0
  let fail = 0
  const start = Date.now()

  // 用批次触发避免一次性 new Promise 太多
  const batchSize = concurrency
  const batches = Math.ceil(total / batchSize)
  for (let b = 0; b < batches; b++) {
    const n = Math.min(batchSize, total - b * batchSize)
    const promises: Promise<unknown>[] = []
    for (let i = 0; i < n; i++) {
      promises.push(
        fn()
          .then((res: any) => {
            latencies.push(res.latency)
            if (res.status >= 200 && res.status < 300) ok++
            else fail++
          })
          .catch(() => fail++),
      )
    }
    await Promise.all(promises)
  }

  const durationMs = Date.now() - start
  latencies.sort((a, b) => a - b)
  return {
    total,
    ok,
    fail,
    durationMs,
    rps: Math.round((total / durationMs) * 1000),
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    max: latencies[latencies.length - 1] ?? 0,
  }
}

describe('性能压测 V10 Day 13', () => {
  let server: http.Server
  let baseUrl: string

  beforeAll(async () => {
    const created = createMockServer()
    server = created.server
    await new Promise<void>((resolve) => server.listen(0, () => resolve()))
    const port = (server.address() as any).port
    baseUrl = `http://127.0.0.1:${port}`
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  })

  it('AI 预设列表 - 100 并发 / 1000 请求', async () => {
    const r = await bench(() => httpGet(`${baseUrl}/ai/presets`), 100, 1000)
    console.log(`[AI/presets] RPS=${r.rps} p50=${r.p50}ms p95=${r.p95}ms p99=${r.p99}ms max=${r.max}ms (${r.ok}/${r.total})`)
    assert.equal(r.ok, 1000)
    assert.ok(r.rps > 500, `RPS 应该 > 500,实际 ${r.rps}`)
  })

  it('三级配置查询 - 50 并发 / 500 请求', async () => {
    const r = await bench(() => httpGet(`${baseUrl}/tenant/config`), 50, 500)
    console.log(`[TenantCfg] RPS=${r.rps} p50=${r.p50}ms p95=${r.p95}ms p99=${r.p99}ms max=${r.max}ms (${r.ok}/${r.total})`)
    assert.equal(r.ok, 500)
    assert.ok(r.rps > 300, `RPS 应该 > 300,实际 ${r.rps}`)
  })

  it('OAuth token - 20 并发 / 200 请求', async () => {
    const r = await bench(
      () =>
        httpPost(`${baseUrl}/open/auth/token`, {
          grant_type: 'client_credentials',
          client_id: 'cli-merchant-001',
          client_secret: 'test-secret',
          scope: 'sync:read',
        }),
      20,
      200,
    )
    console.log(`[OAuth] RPS=${r.rps} p50=${r.p50}ms p95=${r.p95}ms p99=${r.p99}ms max=${r.max}ms (${r.ok}/${r.total})`)
    assert.equal(r.ok, 200)
    assert.ok(r.rps > 100, `RPS 应该 > 100,实际 ${r.rps}`)
  })

  it('灰度列表 - 50 并发 / 500 请求', async () => {
    const r = await bench(() => httpGet(`${baseUrl}/canary/list`), 50, 500)
    console.log(`[Canary] RPS=${r.rps} p50=${r.p50}ms p95=${r.p95}ms p99=${r.p99}ms max=${r.max}ms (${r.ok}/${r.total})`)
    assert.equal(r.ok, 500)
    assert.ok(r.rps > 300)
  })

  it('报表列表 - 50 并发 / 500 请求', async () => {
    const r = await bench(() => httpGet(`${baseUrl}/report/list`), 50, 500)
    console.log(`[Report] RPS=${r.rps} p50=${r.p50}ms p95=${r.p95}ms p99=${r.p99}ms max=${r.max}ms (${r.ok}/${r.total})`)
    assert.equal(r.ok, 500)
    assert.ok(r.rps > 300)
  })

  it('混合负载 (AI + Tenant + Report 并发)', async () => {
    const tasks = [
      () => httpGet(`${baseUrl}/ai/presets`),
      () => httpGet(`${baseUrl}/tenant/config`),
      () => httpGet(`${baseUrl}/report/list`),
    ]
    const start = Date.now()
    const promises: Promise<unknown>[] = []
    for (let i = 0; i < 300; i++) {
      promises.push(tasks[i % tasks.length]())
    }
    const results = await Promise.all(promises)
    const duration = Date.now() - start
    const ok = results.filter((r: any) => r.status === 200).length
    console.log(`[MIXED] 300 req in ${duration}ms (${Math.round((300 / duration) * 1000)} RPS) ok=${ok}/300`)
    assert.equal(ok, 300)
    assert.ok(duration < 5000, `混合负载应 < 5s,实际 ${duration}ms`)
  })
})
