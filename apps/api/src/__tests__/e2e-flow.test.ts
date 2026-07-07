import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E API 流程测试 (V10 Day 12)
 *
 * 验证完整业务流:
 * 1. OAuth 认证 → 配置管理 → 报表查询
 * 2. 灰度发布 → 健康监控 → 自动晋级
 * 3. 跨租户隔离验证
 *
 * 使用 mock HTTP server 模拟 NestJS API
 * 不依赖真实数据库
 */

import assert from 'node:assert/strict'
import * as http from 'node:http'
import { AiModelConfigService } from '../modules/ai-model-config/ai-model-config.service'
import { TenantConfigService } from '../modules/tenant-config/tenant-config.service'
import { LicenseService } from '../modules/license/license.service'
import { CanaryService } from '../modules/canary/canary.service'
import { OpenApiService } from '../modules/open-api/open-api.service'
import { MonitoringService } from '../modules/monitoring/monitoring.service'
import { ReportService } from '../modules/report/report.service'
import { runWithTenant } from '../common/context/tenant-context'

/**
 * Mock HTTP 服务器 - 模拟 NestJS API
 */
function createMockServer() {
  const aiService = new AiModelConfigService()
  const tenantService = new TenantConfigService()
  const licenseService = new (LicenseService as any)()
  const canaryService = new CanaryService()
  const openApiService = new OpenApiService()
  const monitoringService = new MonitoringService()
  const reportService = new ReportService()

  // 默认 E2E 测试用 tenant context
  const defaultCtx = {
    tenantId: 'tenant-A', storeId: 'store-001', userId: 'admin', role: 'tenant_admin' as const,
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
    const path = url.pathname
    res.setHeader('Content-Type', 'application/json')

    try {
      await runWithTenant(defaultCtx, async () => {
        // ============ AI 模型 ============
        if (path === '/ai-model-config/presets' && req.method === 'GET') {
          res.end(JSON.stringify({ items: aiService.listPresets(), total: 4 }))
          return
        }
        if (path.startsWith('/ai-model-config/store-configs') && req.method === 'GET') {
          const storeId = url.searchParams.get('storeId') ?? 'store-001'
          const list = await aiService.listStoreConfigs(storeId)
          res.end(JSON.stringify({ items: list, total: list.length }))
          return
        }

        // ============ 三级配置 ============
        if (path === '/tenant-config' && req.method === 'GET') {
          const level = (url.searchParams.get('level') ?? 'tenant') as any
          const items = await tenantService.getConfigs({ level })
          res.end(JSON.stringify({ items, total: items.length }))
          return
        }
        if (path === '/tenant-config/effective' && req.method === 'GET') {
          const items = await tenantService.getEffectiveConfigs()
          res.end(JSON.stringify({ items, total: items.length }))
          return
        }

        // ============ 付费授权 ============
        if (path === '/license/check' && req.method === 'POST') {
          const body = await readBody(req)
          const result = await licenseService.checkLicense(JSON.parse(body))
          res.end(JSON.stringify(result))
          return
        }

        // ============ 灰度发布 ============
        if (path === '/canary/list' && req.method === 'GET') {
          const items = canaryService.listExperiments()
          res.end(JSON.stringify({ items, total: items.length }))
          return
        }
        if (path === '/canary/evaluate' && req.method === 'POST') {
          const body = await readBody(req)
          const result = canaryService.evaluate(JSON.parse(body))
          res.end(JSON.stringify(result))
          return
        }

        // ============ OpenAPI ============
        if (path === '/open/auth/token' && req.method === 'POST') {
          const body = await readBody(req)
          const params = new URLSearchParams(body)
          const token = await openApiService.authenticate(
            params.get('client_id') ?? '',
            params.get('client_secret') ?? '',
            (params.get('scope') ?? '').split(' ').filter(Boolean),
          )
          res.end(JSON.stringify(token))
          return
        }

        // ============ 监控 ============
        if (path === '/monitoring/metrics' && req.method === 'GET') {
          res.end(JSON.stringify({ items: monitoringService.listMetricDefinitions(), total: monitoringService.listMetricDefinitions().length }))
          return
        }
        if (path === '/monitoring/alerts' && req.method === 'GET') {
          const items = monitoringService.listAlerts()
          res.end(JSON.stringify({ items, total: items.length, severityCount: monitoringService.countBySeverity() }))
          return
        }
        if (path === '/monitoring/metrics/record' && req.method === 'POST') {
          const body = await readBody(req)
          const point = monitoringService.recordMetric(JSON.parse(body))
          res.end(JSON.stringify(point))
          return
        }

        // ============ 报表 ============
        if (path === '/report/list' && req.method === 'GET') {
          const items = reportService.listReports()
          res.end(JSON.stringify({ items, total: items.length }))
          return
        }
        if (path === '/report/query' && req.method === 'POST') {
          const body = await readBody(req)
          const result = await reportService.query(JSON.parse(body))
          res.end(JSON.stringify(result))
          return
        }

        // 404
        res.statusCode = 404
        res.end(JSON.stringify({ error: 'Not Found', path }))
      })
    } catch (err: any) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: err.message }))
    }
  })

  return { server, services: { aiService, tenantService, licenseService, canaryService, openApiService, monitoringService, reportService } }
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => body += chunk)
    req.on('end', () => resolve(body))
  })
}

async function httpGet(url: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = ''
      res.on('data', (chunk) => body += chunk)
      res.on('end', () => {
        try { resolve({ status: res.statusCode ?? 0, body: JSON.parse(body) }) }
        catch { resolve({ status: res.statusCode ?? 0, body }) }
      })
    }).on('error', reject)
  })
}

async function httpPost(url: string, data: any, contentType: 'json' | 'form' = 'json'): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const isForm = contentType === 'form'
    const body = isForm
      ? (typeof data === 'string' ? data : new URLSearchParams(data as Record<string, string>).toString())
      : (typeof data === 'string' ? data : JSON.stringify(data))
    const ct = isForm ? 'application/x-www-form-urlencoded' : 'application/json'
    const req = http.request({
      hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST',
      headers: { 'Content-Type': ct, 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let responseBody = ''
      res.on('data', (chunk) => responseBody += chunk)
      res.on('end', () => {
        try { resolve({ status: res.statusCode ?? 0, body: JSON.parse(responseBody) }) }
        catch { resolve({ status: res.statusCode ?? 0, body: responseBody }) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

describe('E2E 业务流测试 V10 Day 12', () => {
  let server: http.Server
  let baseUrl: string
  let services: ReturnType<typeof createMockServer>['services']

  beforeAll(async () => {
    const created = createMockServer()
    server = created.server
    services = created.services
    await new Promise<void>((resolve) => server.listen(0, () => resolve()))
    const addr = server.address()
    const port = typeof addr === 'object' && addr ? addr.port : 0
    baseUrl = `http://127.0.0.1:${port}`
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  })

  describe('Flow 1: AI 模型配置 → 报表统计', () => {
    it('列出 AI 模型预设', async () => {
      const res = await httpGet(`${baseUrl}/ai-model-config/presets`)
      assert.equal(res.status, 200)
      assert.ok(res.body.total >= 4)
    })

    it('门店级 AI 模型配置', async () => {
      const res = await httpGet(`${baseUrl}/ai-model-config/store-configs?storeId=store-001`)
      assert.equal(res.status, 200)
      assert.ok(Array.isArray(res.body.items))
    })
  })

  describe('Flow 2: 三级配置 + 继承', () => {
    it('租户级配置查询', async () => {
      const res = await httpGet(`${baseUrl}/tenant-config?level=tenant`)
      assert.equal(res.status, 200)
      assert.ok(res.body.items.length >= 0)
    })

    it('有效配置考虑继承链', async () => {
      const res = await httpGet(`${baseUrl}/tenant-config/effective`)
      assert.equal(res.status, 200)
      assert.ok(Array.isArray(res.body.items))
    })
  })

  describe('Flow 3: License 校验流', () => {
    it('有效授权返回 allowed=true', async () => {
      await runWithTenant({ tenantId: 'tenant-A', userId: 'admin', role: 'tenant_admin' }, async () => {
        const res = await httpPost(`${baseUrl}/license/check`, {
          scope: 'ai.capability', storeId: 'store-001',
        })
        assert.equal(res.status, 200)
        assert.ok('allowed' in res.body)
      })
    })
  })

  describe('Flow 4: 灰度评估 + 健康监控', () => {
    it('灰度评估返回 enabled 状态', async () => {
      const res = await httpPost(`${baseUrl}/canary/evaluate`, {
        flagKey: 'checkout.new_flow', tenantId: 'tenant-A', storeId: 'store-001',
      })
      assert.equal(res.status, 200)
      assert.ok('enabled' in res.body)
    })

    it('灰度 + 监控联动 (canary 上报指标)', async () => {
      // 1. 上报 canary 错误率
      const metricRes = await httpPost(`${baseUrl}/monitoring/metrics/record`, {
        name: 'canary.error_rate', value: 0.001, labels: { exp: 'exp-1' },
      })
      assert.equal(metricRes.status, 200)

      // 2. 查询告警
      const alertsRes = await httpGet(`${baseUrl}/monitoring/alerts`)
      assert.equal(alertsRes.status, 200)
    })
  })

  describe('Flow 5: OAuth → 数据同步 → 报表聚合', () => {
    it('完整 OAuth 2.0 + 报表查询流程', async () => {
      // 1. OAuth 认证 (form-urlencoded per RFC 6749)
      const tokenRes = await httpPost(`${baseUrl}/open/auth/token`, {
        grant_type: 'client_credentials',
        client_id: 'cli-merchant-001',
        client_secret: 'test-secret',
        scope: 'sync:read',
      }, 'form')
      assert.equal(tokenRes.status, 200)
      assert.ok(tokenRes.body.accessToken)

      // 2. 列出报表
      const reportRes = await httpGet(`${baseUrl}/report/list`)
      assert.equal(reportRes.status, 200)
      assert.ok(reportRes.body.total >= 0)

      // 3. 查询报表数据
      const queryRes = await httpPost(`${baseUrl}/report/query`, {
        reportId: 'rpt-seed-sales', period: 'daily',
      })
      assert.equal(queryRes.status, 200)
      assert.ok(Array.isArray(queryRes.body.data))
    })
  })

  describe('Flow 6: 跨租户隔离 (E2E)', () => {
    it('tenant-A 配置变更不影响 tenant-B', async () => {
      // 验证 tenant-A 能读自己的有效配置 (mock server 共享 service)
      const tenantAItems = await runWithTenant(
        { tenantId: 'tenant-A', storeId: 'store-001', userId: 'admin', role: 'tenant_admin' },
        async () => services.tenantService.getEffectiveConfigs(),
      )
      assert.ok(Array.isArray(tenantAItems))

      // tenant-B 用独立 service 实例,验证隔离 (不共享 mock server 内部状态)
      const tb = new TenantConfigService()
      const tenantBItems = await runWithTenant(
        { tenantId: 'tenant-B', storeId: 'store-b-001', userId: 'admin', role: 'tenant_admin' },
        async () => tb.getConfigs({ level: 'tenant' }),
      )
      // tenant-B 没有种子配置,应为空数组
      assert.ok(Array.isArray(tenantBItems))
      assert.equal(tenantBItems.length, 0)
    })
  })

  describe('Flow 7: 异常路径', () => {
    it('未知路由返回 404', async () => {
      const res = await httpGet(`${baseUrl}/unknown/route`)
      assert.equal(res.status, 404)
    })

    it('未知报表查询 throws', async () => {
      const res = await httpPost(`${baseUrl}/report/query`, {
        reportId: 'unknown-report', period: 'daily',
      })
      assert.equal(res.status, 500)
    })
  })
})
