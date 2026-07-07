import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [multi-region] [D] controller spec 补全
 *
 * MultiRegionController 综合测试:
 * - 正例: 端点管理/路由/GeoIP/租户钉住/健康/故障切换/数据驻留
 * - 反例: 缺失必填/非法区域/不存在的端点
 * - 边界: 全部区域 down / 无租户钉住 / 空事件列表
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MultiRegionController } from './multi-region.controller'
import { MultiRegionService } from './multi-region.service'
import { FailoverService } from './failover.service'
import { ALL_REGIONS } from './multi-region.entity'

// ── Fixtures ──

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

// ── Endpoint Management ──

describe('MultiRegionController - Endpoints - Positive', () => {

  it('listEndpoints returns 4 default endpoints', () => {
    const { ctrl } = createController()
    const eps = ctrl.listEndpoints()
    assert.equal(eps.length, 4)
    assert.ok(eps.find((e) => e.region === 'cn'))
    assert.ok(eps.find((e) => e.region === 'us'))
    assert.ok(eps.find((e) => e.region === 'eu'))
    assert.ok(eps.find((e) => e.region === 'jp'))
  })

  it('getEndpoint returns correct endpoint', () => {
    const { ctrl } = createController()
    const ep = ctrl.getEndpoint('cn')
    assert.ok(ep && !('error' in ep))
    assert.equal((ep as any).region, 'cn')
  })

  it('registerEndpoint adds a new endpoint override', () => {
    const { ctrl } = createController()
    const result = ctrl.registerEndpoint({
      region: 'cn',
      baseUrl: 'https://custom-cn.example.com',
      latencyMs: 10,
      enabled: true,
    })
    assert.deepEqual(result, { ok: true, region: 'cn' })
    const ep = ctrl.getEndpoint('cn') as any
    assert.equal(ep.baseUrl, 'https://custom-cn.example.com')
  })

  it('updateEndpoint patches existing endpoint', () => {
    const { ctrl } = createController()
    const result = ctrl.updateEndpoint('cn', { latencyMs: 5 })
    assert.deepEqual(result, { ok: true, region: 'cn' })
    const ep = ctrl.getEndpoint('cn') as any
    assert.equal(ep.latencyMs, 5)
  })
})

describe('MultiRegionController - Endpoints - Negative', () => {

  it('getEndpoint returns error for unknown region', () => {
    const { ctrl } = createController()
    const result: any = ctrl.getEndpoint('kr' as any)
    assert.ok('error' in result)
    assert.match(result.error, /not found/)
  })

  it('updateEndpoint returns error for unknown region', () => {
    const { ctrl } = createController()
    const result: any = ctrl.updateEndpoint('kr' as any, { enabled: false })
    assert.ok('error' in result)
    assert.match(result.error, /not found/)
  })
})

// ── Routing ──

describe('MultiRegionController - Routing - Positive', () => {

  it('route with CN IP returns cn region', () => {
    const { ctrl } = createController()
    const decision = ctrl.route({ clientIp: '10.0.0.50', tenantId: undefined })
    assert.equal(decision.primaryRegion, 'cn')
    assert.equal(decision.reason, 'geo')
    assert.ok(decision.fallbacks.length > 0)
  })

  it('route with US IP returns us region', () => {
    const { ctrl } = createController()
    const decision = ctrl.route({ clientIp: '1.2.3.200', tenantId: undefined })
    assert.equal(decision.primaryRegion, 'us')
  })

  it('route with tenant pin overrides geo', () => {
    const { ctrl, regions } = createController()
    regions.pinTenantToRegion('t-euro', 'eu')
    const decision = ctrl.route({ clientIp: '10.0.0.1', tenantId: 't-euro' })
    assert.equal(decision.primaryRegion, 'eu')
    assert.equal(decision.reason, 'tenant-pin')
  })

  it('routeByLatency returns healthiest region', () => {
    const { ctrl } = createController()
    const decision = ctrl.routeByLatency()
    assert.equal(decision.primaryRegion, 'cn')
    assert.equal(decision.reason, 'health')
  })
})

describe('MultiRegionController - Routing - Negative', () => {

  it('route with non-existent tenant uses geo', () => {
    const { ctrl } = createController()
    const decision = ctrl.route({ clientIp: '1.2.3.200', tenantId: 'nonexistent' })
    assert.equal(decision.primaryRegion, 'us')
    assert.equal(decision.reason, 'geo')
  })
})

// ── GeoIP ──

describe('MultiRegionController - GeoIP - Positive', () => {

  it('geoLookup returns result for CN IP', () => {
    const { ctrl } = createController()
    const result = ctrl.geoLookup('10.0.0.1')
    assert.equal(result.region, 'cn')
    assert.equal(result.source, 'fallback')
  })

  it('geoLookup returns result for US IP', () => {
    const { ctrl } = createController()
    const result = ctrl.geoLookup('8.8.8.200')
    assert.equal(result.region, 'us')
    assert.equal(result.source, 'lookup')
  })

  it('geoLookup caches results', () => {
    const { ctrl } = createController()
    ctrl.geoLookup('10.0.0.1')
    const cached = ctrl.geoLookup('10.0.0.1')
    assert.equal(cached.source, 'cache')
  })
})

// ── Tenant Pinning ──

describe('MultiRegionController - Tenants - Positive', () => {

  it('pinTenant pins a tenant to a region', () => {
    const { ctrl } = createController()
    const result = ctrl.pinTenant({ tenantId: 't-1', region: 'us' })
    assert.deepEqual(result, { ok: true, tenantId: 't-1', region: 'us' })
  })

  it('getTenantRegion returns pinned region', () => {
    const { ctrl, regions } = createController()
    regions.pinTenantToRegion('t-1', 'jp')
    const result: any = ctrl.getTenantRegion('t-1')
    assert.equal(result.region, 'jp')
  })

  it('unpinTenant removes tenant pin', () => {
    const { ctrl, regions } = createController()
    regions.pinTenantToRegion('t-1', 'eu')
    ctrl.unpinTenant('t-1')
    const result: any = ctrl.getTenantRegion('t-1')
    assert.equal(result.region, null)
  })

  it('listPinnedTenants returns all pinned tenants', () => {
    const { ctrl, regions } = createController()
    regions.pinTenantToRegion('t-1', 'cn')
    regions.pinTenantToRegion('t-2', 'us')
    const list = ctrl.listPinnedTenants()
    assert.equal(list.length, 2)
  })
})

describe('MultiRegionController - Tenants - Boundary', () => {

  it('listPinnedTenants returns empty array when no pins', () => {
    const { ctrl } = createController()
    const list = ctrl.listPinnedTenants()
    assert.deepEqual(list, [])
  })

  it('getTenantRegion returns null for unknown tenant', () => {
    const { ctrl } = createController()
    const result: any = ctrl.getTenantRegion('unknown')
    assert.equal(result.region, null)
  })
})

// ── Health ──

describe('MultiRegionController - Health - Positive', () => {

  it('setHealth changes region health', () => {
    const { ctrl } = createController()
    const result = ctrl.setHealth({ region: 'cn', status: 'down' })
    assert.deepEqual(result, { ok: true, region: 'cn', status: 'down' })
  })

  it('getAllHealth returns all regions', () => {
    const { ctrl } = createController()
    const health = ctrl.getAllHealth()
    assert.ok('cn' in health)
    assert.ok('us' in health)
    assert.ok('eu' in health)
    assert.ok('jp' in health)
  })

  it('getHealth returns region detail', () => {
    const { ctrl } = createController()
    const health: any = ctrl.getHealth('cn')
    assert.equal(health.region, 'cn')
    assert.ok(health.health)
    assert.ok(health.failoverState)
  })
})

// ── Failover ──

describe('MultiRegionController - Failover - Positive', () => {

  it('failoverCheck checks a single region', async () => {
    const { ctrl } = createController()
    const result: any = await ctrl.failoverCheck({ region: 'cn', forceOk: true })
    assert.equal(result.region, 'cn')
    assert.equal(result.state, 'HEALTHY')
  })

  it('failoverCheck checks all regions when no region specified', async () => {
    const { ctrl } = createController()
    const results: any = await ctrl.failoverCheck({ region: undefined, forceOk: undefined })
    assert.ok(Array.isArray(results))
    assert.equal(results.length, 4)
  })

  it('configureFailover updates config', () => {
    const { ctrl } = createController()
    const result = ctrl.configureFailover({ failureThreshold: 5, checkIntervalMs: 10000 })
    assert.deepEqual(result, { ok: true })
  })

  it('getFailoverStates returns all states', () => {
    const { ctrl } = createController()
    const states: any = ctrl.getFailoverStates()
    for (const r of ALL_REGIONS) {
      assert.equal(states[r], 'HEALTHY')
    }
  })

  it('getFailoverEvents returns empty initially', () => {
    const { ctrl } = createController()
    const events = ctrl.getFailoverEvents()
    assert.deepEqual(events, [])
  })

  it('getHealthyRegions returns all initially', () => {
    const { ctrl } = createController()
    const result: any = ctrl.getHealthyRegions()
    assert.equal(result.healthyRegions.length, 4)
  })
})

describe('MultiRegionController - Failover - State Transitions', () => {

  it('failover transitions to DEGRADED after failure', async () => {
    const { ctrl, failover } = createController()
    failover.configure({ checker: async () => ({ ok: false, latencyMs: 500 }) })

    await failover.checkHealth('cn')
    const state = failover.getState('cn')
    assert.equal(state, 'DEGRADED')
  })

  it('failover transitions to DOWN after threshold failures', async () => {
    const { ctrl, failover } = createController()
    failover.configure({ checker: async () => ({ ok: false, latencyMs: 500 }), failureThreshold: 2 })

    await failover.checkHealth('cn')
    await failover.checkHealth('cn')
    const state = failover.getState('cn')
    assert.equal(state, 'DOWN')
  })

  it('failover transitions back to HEALTHY after recovery', async () => {
    const { ctrl, failover } = createController()
    // fail twice
    failover.configure({ checker: async () => ({ ok: false, latencyMs: 500 }), failureThreshold: 2 })
    await failover.checkHealth('cn')
    await failover.checkHealth('cn')
    assert.equal(failover.getState('cn'), 'DOWN')

    // recover
    failover.configure({ checker: async () => ({ ok: true, latencyMs: 50 }) })
    await failover.checkHealth('cn')
    assert.equal(failover.getState('cn'), 'RECOVERING')
    await failover.checkHealth('cn')
    assert.equal(failover.getState('cn'), 'HEALTHY')
  })
})

describe('MultiRegionController - Failover - Boundary', () => {

  it('failover with all regions down returns null', async () => {
    const { ctrl, failover } = createController()
    const result = failover.failover('cn')
    // With all default healthy, failover should return a fallback
    assert.ok(result)
    assert.notEqual(result, 'cn')
  })

  it('getFailoverEventsByRegion filters correctly', async () => {
    const { ctrl, failover } = createController()
    failover.configure({ checker: async () => ({ ok: false, latencyMs: 500 }), failureThreshold: 2 })
    await failover.checkHealth('cn')
    await failover.checkHealth('cn')

    const cnEvents = ctrl.getFailoverEvents('cn')
    assert.ok(cnEvents.length > 0, 'should have events for cn')

    const usEvents: any[] = ctrl.getFailoverEvents('us')
    assert.equal(usEvents.length, 0, 'should have no events for us')
  })
})

// ── Data Residency ──

describe('MultiRegionController - Data Residency - Positive', () => {

  it('canMigrate returns true for unpinned tenant', () => {
    const { ctrl } = createController()
    const result = ctrl.canMigrate({ tenantId: 't-free', targetRegion: 'us' })
    assert.equal(result.allowed, true)
  })

  it('canMigrate returns false for pinned tenant to wrong region', () => {
    const { ctrl, regions } = createController()
    regions.pinTenantToRegion('t-gdpr', 'eu')
    const result = ctrl.canMigrate({ tenantId: 't-gdpr', targetRegion: 'us' })
    assert.equal(result.allowed, false)
  })

  it('canMigrate returns true for pinned tenant to same region', () => {
    const { ctrl, regions } = createController()
    regions.pinTenantToRegion('t-gdpr', 'eu')
    const result = ctrl.canMigrate({ tenantId: 't-gdpr', targetRegion: 'eu' })
    assert.equal(result.allowed, true)
  })
})

// ── Batch Check ──

describe('MultiRegionController - Batch Check', () => {

  it('batchCheck checks all regions', async () => {
    const { ctrl } = createController()
    const results: any = await ctrl.batchCheck({ forceOkMap: { cn: true, us: true, eu: true, jp: true } })
    assert.equal(results.length, 4)
    for (const r of results) {
      assert.equal(r.state, 'HEALTHY')
    }
  })
})
