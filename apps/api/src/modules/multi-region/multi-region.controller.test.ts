import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [multi-region] [D] controller.test.ts 补全
 *
 * MultiRegionController 验证测试:
 * - 路由 metadata: 路径 + HTTP method + 参数装饰器
 * - 正例: 端点管理/路由/GeoIP/租户钉住/健康/故障切换/数据驻留/批量检查
 * - 反例: 未知区域/不存在的端点/已钉住租户迁移/无健康区域路由
 * - 边界: 空事件/空租户列表/全区域 DOWN/区域恢复流程
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MultiRegionController } from './multi-region.controller'
import { MultiRegionService } from './multi-region.service'
import { FailoverService } from './failover.service'
import {
  ALL_REGIONS,
  DEFAULT_REGION,
  type Region,
} from './multi-region.entity'

// ── Helpers ──

function createController(): {
  ctrl: MultiRegionController
  regions: MultiRegionService
  failover: FailoverService
} {
  const regions = new MultiRegionService()
  const failover = new FailoverService(regions)
  const ctrl = new MultiRegionController(regions, failover)
  return { ctrl, regions, failover }
}

// ═══════════════════════════════════════════════════
// Route Metadata
// ═══════════════════════════════════════════════════

describe('MultiRegionController Route Metadata', () => {

  it('controller path 为 multi-region', () => {
    const path = Reflect.getMetadata('path', MultiRegionController)
    assert.equal(path, 'multi-region')
  })

  const routes: Array<{ key: string; expectedMethod: number; expectedPath: string }> = [
    { key: 'listEndpoints',           expectedMethod: 0 /* GET */,   expectedPath: 'endpoints' },
    { key: 'getEndpoint',             expectedMethod: 0 /* GET */,   expectedPath: 'endpoints/:region' },
    { key: 'registerEndpoint',        expectedMethod: 1 /* POST */,  expectedPath: 'endpoints' },
    { key: 'updateEndpoint',          expectedMethod: 4 /* PATCH */, expectedPath: 'endpoints/:region' },
    { key: 'route',                   expectedMethod: 0 /* GET */,   expectedPath: 'route' },
    { key: 'routeByLatency',          expectedMethod: 0 /* GET */,   expectedPath: 'route/latency' },
    { key: 'geoLookup',               expectedMethod: 0 /* GET */,   expectedPath: 'geo/:ip' },
    { key: 'pinTenant',               expectedMethod: 1 /* POST */,  expectedPath: 'tenants/pin' },
    { key: 'unpinTenant',             expectedMethod: 3 /* DELETE */,expectedPath: 'tenants/:tenantId/pin' },
    { key: 'listPinnedTenants',       expectedMethod: 0 /* GET */,   expectedPath: 'tenants' },
    { key: 'getTenantRegion',         expectedMethod: 0 /* GET */,   expectedPath: 'tenants/:tenantId/region' },
    { key: 'setHealth',               expectedMethod: 1 /* POST */,  expectedPath: 'health' },
    { key: 'getAllHealth',            expectedMethod: 0 /* GET */,   expectedPath: 'health' },
    { key: 'getHealth',               expectedMethod: 0 /* GET */,   expectedPath: 'health/:region' },
    { key: 'failoverCheck',           expectedMethod: 1 /* POST */,  expectedPath: 'failover/check' },
    { key: 'configureFailover',       expectedMethod: 1 /* POST */,  expectedPath: 'failover/configure' },
    { key: 'getFailoverStates',       expectedMethod: 0 /* GET */,   expectedPath: 'failover/state' },
    { key: 'getFailoverEvents',       expectedMethod: 0 /* GET */,   expectedPath: 'failover/events' },
    { key: 'getHealthyRegions',       expectedMethod: 0 /* GET */,   expectedPath: 'failover/healthy' },
    { key: 'canMigrate',              expectedMethod: 0 /* GET */,   expectedPath: 'can-migrate' },
    { key: 'batchCheck',              expectedMethod: 1 /* POST */,  expectedPath: 'failover/batch-check' },
  ]

  for (const { key, expectedMethod, expectedPath } of routes) {
    it(`${key} -> ${expectedMethod === 0 ? 'GET' : expectedMethod === 1 ? 'POST' : expectedMethod === 2 ? 'DELETE' : 'PATCH'} ${expectedPath}`, () => {
      const handler = (MultiRegionController.prototype as any)[key]
        ?? Object.getOwnPropertyDescriptor(MultiRegionController.prototype, key)?.value
      assert.ok(handler, `handler ${key} not found`)
      const method = Reflect.getMetadata('method', handler)
      assert.equal(method, expectedMethod, `${key} method mismatch`)
      const path = Reflect.getMetadata('path', handler)
      assert.equal(path, expectedPath, `${key} path mismatch`)
    })
  }
})

// ═══════════════════════════════════════════════════
// 1. Endpoint Management — 端点管理
// ═══════════════════════════════════════════════════

describe('Endpoint Management — Positive', () => {

  it('listEndpoints 返回 4 个默认端点', () => {
    const { ctrl } = createController()
    const eps = ctrl.listEndpoints()
    assert.equal(eps.length, 4)
    for (const r of ALL_REGIONS) {
      assert.ok(eps.find((e) => e.region === r), `missing ${r}`)
    }
  })

  it('getEndpoint 返回指定区域端点', () => {
    const { ctrl } = createController()
    const ep = ctrl.getEndpoint('cn')
    assert.ok(ep && !('error' in (ep as any)))
    assert.equal((ep as any).region, 'cn')
    assert.ok((ep as any).baseUrl, 'has baseUrl')
  })

  it('registerEndpoint 覆盖已有端点', () => {
    const { ctrl } = createController()
    const result = ctrl.registerEndpoint({
      region: 'cn',
      baseUrl: 'https://custom.cn/api',
      latencyMs: 5,
      enabled: false,
    })
    assert.deepEqual(result, { ok: true, region: 'cn' })
    const ep = ctrl.getEndpoint('cn') as any
    assert.equal(ep.baseUrl, 'https://custom.cn/api')
    assert.equal(ep.enabled, false)
  })

  it('registerEndpoint 默认 enabled=true', () => {
    const { ctrl } = createController()
    ctrl.registerEndpoint({ region: 'jp', baseUrl: 'https://new.jp/api', latencyMs: 10 })
    const ep = ctrl.getEndpoint('jp') as any
    assert.equal(ep.enabled, true)
  })

  it('updateEndpoint 部分更新端点', () => {
    const { ctrl } = createController()
    const result = ctrl.updateEndpoint('eu', { latencyMs: 90, enabled: false })
    assert.deepEqual(result, { ok: true, region: 'eu' })
    const ep = ctrl.getEndpoint('eu') as any
    assert.equal(ep.latencyMs, 90)
    assert.equal(ep.enabled, false)
  })
})

describe('Endpoint Management — Negative', () => {

  it('getEndpoint 未知区域返回 error', () => {
    const { ctrl } = createController()
    const result = ctrl.getEndpoint('kr' as Region)
    assert.ok((result as any).error)
    assert.match((result as any).error, /not found/)
  })

  it('updateEndpoint 未知区域返回 error', () => {
    const { ctrl } = createController()
    const result = ctrl.updateEndpoint('kr' as Region, { enabled: true })
    assert.ok((result as any).error)
    assert.match((result as any).error, /not found/)
  })
})

// ═══════════════════════════════════════════════════
// 2. Routing — 路由
// ═══════════════════════════════════════════════════

describe('Routing — Positive', () => {

  it('route 私有 IP → cn', () => {
    const { ctrl } = createController()
    const d = ctrl.route({ clientIp: '10.0.0.99', tenantId: undefined })
    assert.equal(d.primaryRegion, 'cn')
    assert.equal(d.reason, 'geo')
    assert.ok(d.fallbacks.length === 3)
  })

  it('route 美国 IP → us', () => {
    const { ctrl } = createController()
    const d = ctrl.route({ clientIp: '8.8.8.201', tenantId: undefined })
    assert.equal(d.primaryRegion, 'us')
    assert.equal(d.reason, 'geo')
  })

  it('route 日本 IP → jp', () => {
    const { ctrl } = createController()
    const d = ctrl.route({ clientIp: '1.1.1.150', tenantId: undefined })
    assert.equal(d.primaryRegion, 'jp')
  })

  it('route 租户钉住覆盖 Geo', () => {
    const { ctrl, regions } = createController()
    regions.pinTenantToRegion('t-gdpr', 'eu')
    const d = ctrl.route({ clientIp: '10.0.0.1', tenantId: 't-gdpr' })
    assert.equal(d.primaryRegion, 'eu')
    assert.equal(d.reason, 'tenant-pin')
  })

  it('routeByLatency 返回延迟最低的健康区域', () => {
    const { ctrl } = createController()
    const d = ctrl.routeByLatency()
    assert.equal(d.primaryRegion, 'cn') // cn latency=20
    assert.equal(d.reason, 'health')
  })
})

describe('Routing — Negative & Boundary', () => {

  it('route 不存在的租户 → 使用 Geo', () => {
    const { ctrl } = createController()
    const d = ctrl.route({ clientIp: '8.8.8.250', tenantId: 'ghost-tenant' })
    assert.equal(d.primaryRegion, 'us')
    assert.equal(d.reason, 'geo')
  })

  it('routeByLatency 所有区域 down → 兜底到 DEFAULT_REGION', () => {
    const { ctrl, regions } = createController()
    for (const r of ALL_REGIONS) regions.setRegionHealth(r, 'down')
    const d = ctrl.routeByLatency()
    assert.equal(d.primaryRegion, DEFAULT_REGION)
    assert.equal(d.reason, 'default')
  })
})

// ═══════════════════════════════════════════════════
// 3. GeoIP — 地理定位
// ═══════════════════════════════════════════════════

describe('GeoIP — Positive', () => {

  it('geoLookup 私有 IP 返回 cn', () => {
    const { ctrl } = createController()
    const r = ctrl.geoLookup('192.168.1.1')
    assert.equal(r.region, 'cn')
  })

  it('geoLookup 美国 IP 返回 us (source=lookup)', () => {
    const { ctrl } = createController()
    const r = ctrl.geoLookup('8.8.8.202')
    assert.equal(r.region, 'us')
    assert.equal(r.source, 'lookup')
  })

  it('geoLookup 缓存命中 source=cache', () => {
    const { ctrl } = createController()
    ctrl.geoLookup('10.0.0.1')
    const r = ctrl.geoLookup('10.0.0.1')
    assert.equal(r.source, 'cache')
  })
})

describe('GeoIP — Negative', () => {

  it('geoLookup 畸形 IP 返回 ZZ/fallback', () => {
    const { ctrl } = createController()
    const r = ctrl.geoLookup('not-an-ip')
    assert.equal(r.region, 'cn')
  })
})

// ═══════════════════════════════════════════════════
// 4. Tenant Pinning — 租户钉住
// ═══════════════════════════════════════════════════

describe('Tenant Pinning — Positive', () => {

  it('pinTenant 钉住租户到区域', () => {
    const { ctrl } = createController()
    const result = ctrl.pinTenant({ tenantId: 't-42', region: 'jp' })
    assert.deepEqual(result, { ok: true, tenantId: 't-42', region: 'jp' })
  })

  it('getTenantRegion 返回已钉住区域', () => {
    const { ctrl, regions } = createController()
    regions.pinTenantToRegion('t-pinned', 'us')
    const r = ctrl.getTenantRegion('t-pinned') as any
    assert.equal(r.tenantId, 't-pinned')
    assert.equal(r.region, 'us')
  })

  it('unpinTenant 移除钉住', () => {
    const { ctrl, regions } = createController()
    regions.pinTenantToRegion('t-1', 'eu')
    ctrl.unpinTenant('t-1')
    const r = ctrl.getTenantRegion('t-1') as any
    assert.equal(r.region, null)
  })

  it('listPinnedTenants 列出已钉住租户', () => {
    const { ctrl, regions } = createController()
    regions.pinTenantToRegion('t-a', 'cn')
    regions.pinTenantToRegion('t-b', 'us')
    regions.pinTenantToRegion('t-c', 'eu')
    const list = ctrl.listPinnedTenants()
    assert.equal(list.length, 3)
    assert.ok(list.every((item) => item.tenantId && item.region))
  })
})

describe('Tenant Pinning — Boundary', () => {

  it('listPinnedTenants 无租户时返回空数组', () => {
    const { ctrl } = createController()
    assert.deepEqual(ctrl.listPinnedTenants(), [])
  })

  it('getTenantRegion 未知租户返回 null', () => {
    const { ctrl } = createController()
    const r = ctrl.getTenantRegion('unknown') as any
    assert.equal(r.region, null)
  })
})

// ═══════════════════════════════════════════════════
// 5. Health — 健康
// ═══════════════════════════════════════════════════

describe('Health — Positive', () => {

  it('setHealth 修改区域健康', () => {
    const { ctrl } = createController()
    const result = ctrl.setHealth({ region: 'us', status: 'down' })
    assert.deepEqual(result, { ok: true, region: 'us', status: 'down' })
  })

  it('getAllHealth 返回所有区域健康+故障状态', () => {
    const { ctrl } = createController()
    const all = ctrl.getAllHealth() as Record<string, any>
    for (const r of ALL_REGIONS) {
      assert.ok(r in all, `missing ${r}`)
      assert.ok(all[r].health !== undefined)
      assert.ok(all[r].failoverState !== undefined)
    }
  })

  it('getHealth 返回单个区域详情', () => {
    const { ctrl } = createController()
    const h = ctrl.getHealth('cn') as any
    assert.equal(h.region, 'cn')
    assert.equal(h.health, 'healthy')
    assert.equal(h.failoverState, 'HEALTHY')
  })
})

// ═══════════════════════════════════════════════════
// 6. Failover — 故障切换
// ═══════════════════════════════════════════════════

describe('Failover — Positive', () => {

  it('failoverCheck 单个区域返回健康结果', async () => {
    const { ctrl } = createController()
    const r = await ctrl.failoverCheck({ region: 'cn', forceOk: true }) as any
    assert.equal(r.region, 'cn')
    assert.equal(r.state, 'HEALTHY')
  })

  it('failoverCheck 不指定区域时检查全部', async () => {
    const { ctrl } = createController()
    const results = await ctrl.failoverCheck({ region: undefined }) as any[]
    assert.equal(results.length, 4)
    assert.ok(results.every((r: any) => r.state === 'HEALTHY'))
  })

  it('configureFailover 更新配置', () => {
    const { ctrl } = createController()
    const result = ctrl.configureFailover({ failureThreshold: 5, checkIntervalMs: 30_000 })
    assert.deepEqual(result, { ok: true })
  })

  it('getFailoverStates 返回全部区域状态', () => {
    const { ctrl } = createController()
    const states = ctrl.getFailoverStates()
    for (const r of ALL_REGIONS) {
      assert.equal(states[r], 'HEALTHY')
    }
  })

  it('getFailoverEvents 初始为空', () => {
    const { ctrl } = createController()
    assert.deepEqual(ctrl.getFailoverEvents(), [])
  })

  it('getHealthyRegions 初始返回全部 4 个区域', () => {
    const { ctrl } = createController()
    const hr = ctrl.getHealthyRegions()
    assert.equal(hr.healthyRegions.length, 4)
    for (const r of ALL_REGIONS) {
      assert.ok(hr.healthyRegions.includes(r))
    }
  })
})

describe('Failover — State Transitions', () => {

  it('失败 1 次 → DEGRADED', async () => {
    const { failover } = createController()
    failover.configure({ checker: async () => ({ ok: false, latencyMs: 500 }) })
    const r = await failover.checkHealth('cn')
    assert.equal(r.state, 'DEGRADED')
  })

  it('失败 N 次 → DOWN', async () => {
    const { failover } = createController()
    failover.configure({ checker: async () => ({ ok: false, latencyMs: 999 }), failureThreshold: 2 })
    await failover.checkHealth('cn')
    const r = await failover.checkHealth('cn')
    assert.equal(r.state, 'DOWN')
  })

  it('恢复 → RECOVERING → HEALTHY', async () => {
    const { failover } = createController()
    failover.configure({ checker: async () => ({ ok: false, latencyMs: 500 }), failureThreshold: 2 })
    await failover.checkHealth('cn')
    await failover.checkHealth('cn')
    assert.equal(failover.getState('cn'), 'DOWN')

    failover.configure({ checker: async () => ({ ok: true, latencyMs: 10 }) })
    const r1 = await failover.checkHealth('cn')
    assert.equal(r1.state, 'RECOVERING')
    const r2 = await failover.checkHealth('cn')
    assert.equal(r2.state, 'HEALTHY')
  })
})

describe('Failover — Boundary', () => {

  it('全部区域 DOWN → failover 返回 null', async () => {
    const { failover } = createController()
    failover.configure({ checker: async () => ({ ok: false, latencyMs: 999 }), failureThreshold: 1 })
    // 将所有区域设为 DOWN
    for (const r of ALL_REGIONS) {
      await failover.checkHealth(r)
    }
    for (const r of ALL_REGIONS) {
      assert.equal(failover.getState(r), 'DOWN', `${r} should be DOWN`)
    }
    // 从 DOWN 区域 failover 应返回 null (没有健康区域)
    const result = failover.failover('cn')
    assert.equal(result, null, 'no healthy regions left')
  })

  it('getFailoverEvents 按区域过滤', async () => {
    const { ctrl, failover } = createController()
    failover.configure({ checker: async () => ({ ok: false, latencyMs: 500 }), failureThreshold: 1 })
    await failover.checkHealth('cn')

    const allEvents = ctrl.getFailoverEvents()
    assert.ok(allEvents.length > 0)

    const cnEvents = ctrl.getFailoverEvents('cn') as any[]
    assert.ok(cnEvents.length > 0)

    const usEvents = ctrl.getFailoverEvents('us') as any[]
    assert.equal(usEvents.length, 0)
  })

  it('区域从 DEGRADED 恢复 — 连续 2 次 ok', async () => {
    const { failover } = createController()
    failover.configure({ checker: async () => ({ ok: false, latencyMs: 500 }), failureThreshold: 3 })

    // 1 failure → DEGRADED
    await failover.checkHealth('cn')
    assert.equal(failover.getState('cn'), 'DEGRADED')

    // 恢复
    failover.configure({ checker: async () => ({ ok: true, latencyMs: 10 }) })
    const r = await failover.checkHealth('cn')
    assert.equal(r.state, 'HEALTHY') // from DEGRADED → HEALTHY when failures=0
  })
})

// ═══════════════════════════════════════════════════
// 7. Data Residency — 数据驻留
// ═══════════════════════════════════════════════════

describe('Data Residency — Positive', () => {

  it('canMigrate 未钉住租户 → true', () => {
    const { ctrl } = createController()
    const r = ctrl.canMigrate({ tenantId: 't-free', targetRegion: 'jp' })
    assert.equal(r.allowed, true)
  })

  it('canMigrate 钉住同一区域 → true', () => {
    const { ctrl, regions } = createController()
    regions.pinTenantToRegion('t-hold', 'cn')
    const r = ctrl.canMigrate({ tenantId: 't-hold', targetRegion: 'cn' })
    assert.equal(r.allowed, true)
  })
})

describe('Data Residency — Negative', () => {

  it('canMigrate 钉住 EU 的租户不能迁到 US', () => {
    const { ctrl, regions } = createController()
    regions.pinTenantToRegion('t-gdpr', 'eu')
    const r = ctrl.canMigrate({ tenantId: 't-gdpr', targetRegion: 'us' })
    assert.equal(r.allowed, false, 'GDPR tenant must stay in EU')
  })

  it('canMigrate 钉住 CN 的租户不能迁到 JP', () => {
    const { ctrl, regions } = createController()
    regions.pinTenantToRegion('t-psl', 'cn')
    const r = ctrl.canMigrate({ tenantId: 't-psl', targetRegion: 'jp' })
    assert.equal(r.allowed, false, 'CN data sovereignty')
  })
})

// ═══════════════════════════════════════════════════
// 8. Batch Check — 批量健康检查
// ═══════════════════════════════════════════════════

describe('Batch Check', () => {

  it('batchCheck 全部强制 ok', async () => {
    const { ctrl } = createController()
    const results = await ctrl.batchCheck({
      forceOkMap: { cn: true, us: true, eu: true, jp: true },
    }) as any[]
    assert.equal(results.length, 4)
    for (const r of results) {
      assert.equal(r.state, 'HEALTHY')
    }
  })

  it('batchCheck 部分区域强制 fail', async () => {
    const { ctrl } = createController()
    const results = await ctrl.batchCheck({
      forceOkMap: { cn: true, us: false, eu: true, jp: false },
    }) as any[]
    assert.equal(results.length, 4)
    assert.equal(results.find((r: any) => r.region === 'us')?.state, 'DEGRADED')
    assert.equal(results.find((r: any) => r.region === 'jp')?.state, 'DEGRADED')
  })
})
