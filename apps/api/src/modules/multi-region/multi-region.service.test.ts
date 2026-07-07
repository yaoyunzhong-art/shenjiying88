import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [multi-region] [A] service test 补全
 *
 * MultiRegionService 单元测试:
 * - 端点管理: 注册/查询/列表
 * - GeoIP: 私有IP/公开IP/缓存
 * - 租户钉住: 钉住/解钉/查询
 * - 健康: 设置/查询
 * - 路由: Geo路由/租户钉住路由/延迟路由
 * - 数据驻留: 迁移检查
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MultiRegionService } from './multi-region.service'
import { ALL_REGIONS } from './multi-region.entity'

describe('MultiRegionService', () => {
  let service: MultiRegionService

  beforeEach(() => {
    service = new MultiRegionService()
    service.resetForTests()
  })

  // ── Endpoint Management ──

  describe('Endpoint Management', () => {
    it('listEndpoints returns 4 default endpoints', () => {
      const eps = service.listEndpoints()
      assert.equal(eps.length, 4)
      const regions = eps.map((e) => e.region)
      assert.deepEqual(regions, ['cn', 'us', 'eu', 'jp'])
    })

    it('getEndpoint returns correct region', () => {
      const ep = service.getEndpoint('cn')
      assert.ok(ep)
      assert.equal(ep!.baseUrl, 'https://api-cn.example.com')
      assert.equal(ep!.latencyMs, 20)
      assert.ok(ep!.enabled)
    })

    it('getEndpoint returns undefined for unknown region', () => {
      const ep = service.getEndpoint('kr' as any)
      assert.equal(ep, undefined)
    })

    it('registerEndpoint overrides existing', () => {
      service.registerEndpoint({ region: 'cn', baseUrl: 'https://custom.cn', latencyMs: 5, enabled: true })
      const ep = service.getEndpoint('cn')!
      assert.equal(ep.baseUrl, 'https://custom.cn')
      assert.equal(ep.latencyMs, 5)
    })

    it('registerEndpoint adds new region', () => {
      service.registerEndpoint({ region: 'kr' as any, baseUrl: 'https://kr.api.com', latencyMs: 100, enabled: true })
      const ep = service.getEndpoint('kr' as any)
      assert.ok(ep)
      assert.equal(ep!.region, 'kr' as any)
    })
  })

  // ── GeoIP ──

  describe('GeoIP', () => {
    it('geoLookup returns fallback for private IP (10.x)', () => {
      const result = service.geoLookup('10.0.0.1')
      assert.equal(result.region, 'cn')
      assert.equal(result.source, 'fallback')
    })

    it('geoLookup returns fallback for private IP (192.168.x)', () => {
      const result = service.geoLookup('192.168.1.1')
      assert.equal(result.region, 'cn')
      assert.equal(result.source, 'fallback')
    })

    it('geoLookup returns US for IP ending >= 200', () => {
      const result = service.geoLookup('8.8.8.200')
      assert.equal(result.region, 'us')
      assert.equal(result.source, 'lookup')
    })

    it('geoLookup returns JP for IP ending 100-199', () => {
      const result = service.geoLookup('8.8.8.150')
      assert.equal(result.region, 'jp')
      assert.equal(result.source, 'lookup')
    })

    it('geoLookup returns CN for IP ending < 100', () => {
      const result = service.geoLookup('8.8.8.50')
      assert.equal(result.region, 'cn')
      assert.equal(result.source, 'lookup')
    })

    it('geoLookup caches results', () => {
      service.geoLookup('10.0.0.1')
      const cached = service.geoLookup('10.0.0.1')
      assert.equal(cached.source, 'cache')
    })
  })

  // ── Tenant Pinning ──

  describe('Tenant Pinning', () => {
    it('pinTenantToRegion pins tenant to region', () => {
      service.pinTenantToRegion('t-1', 'us')
      const region = service.getTenantRegion('t-1')
      assert.equal(region, 'us')
    })

    it('unpinTenant removes tenant pin', () => {
      service.pinTenantToRegion('t-1', 'eu')
      service.unpinTenant('t-1')
      const region = service.getTenantRegion('t-1')
      assert.equal(region, undefined)
    })

    it('getTenantRegion returns undefined for unknown tenant', () => {
      const region = service.getTenantRegion('unknown')
      assert.equal(region, undefined)
    })

    it('listPinnedTenants returns all pinned tenants', () => {
      service.pinTenantToRegion('t-1', 'cn')
      service.pinTenantToRegion('t-2', 'jp')
      const list = service.listPinnedTenants()
      assert.equal(list.length, 2)
      assert.ok(list.find((t) => t.tenantId === 't-1' && t.region === 'cn'))
      assert.ok(list.find((t) => t.tenantId === 't-2' && t.region === 'jp'))
    })

    it('listPinnedTenants returns empty when no pins', () => {
      const list = service.listPinnedTenants()
      assert.deepEqual(list, [])
    })
  })

  // ── Health ──

  describe('Health Management', () => {
    it('initial health is healthy for all regions', () => {
      for (const r of ALL_REGIONS) {
        assert.equal(service.getRegionHealth(r), 'healthy')
      }
    })

    it('setRegionHealth changes health state', () => {
      service.setRegionHealth('cn', 'down')
      assert.equal(service.getRegionHealth('cn'), 'down')
    })

    it('setRegionHealth to degraded', () => {
      service.setRegionHealth('us', 'degraded')
      assert.equal(service.getRegionHealth('us'), 'degraded')
    })

    it('getRegionHealth returns down for unknown region', () => {
      const health = service.getRegionHealth('kr' as any)
      assert.equal(health, 'down')
    })
  })

  // ── Routing ──

  describe('Routing', () => {
    it('route without tenant uses geo IP (non-tenant routes)', () => {
      const decision = service.route('10.0.0.1')
      assert.equal(decision.primaryRegion, 'cn')
      assert.equal(decision.reason, 'geo')
    })

    it('route with tenant pin overrides geo', () => {
      service.pinTenantToRegion('t-euro', 'eu')
      const decision = service.route('10.0.0.1', 't-euro')
      assert.equal(decision.primaryRegion, 'eu')
      assert.equal(decision.reason, 'tenant-pin')
    })

    it('route with US IP returns us', () => {
      const decision = service.route('1.2.3.200')
      assert.equal(decision.primaryRegion, 'us')
      assert.equal(decision.reason, 'geo')
    })

    it('route with JP IP returns jp', () => {
      const decision = service.route('1.2.3.150')
      assert.equal(decision.primaryRegion, 'jp')
    })

    it('route with no tenant uses geo', () => {
      const decision = service.route('10.0.0.1')
      assert.equal(decision.primaryRegion, 'cn')
      assert.equal(decision.reason, 'geo')
    })

    it('route with unknown tenant uses geo', () => {
      const decision = service.route('1.2.3.200', 'nonexistent')
      assert.equal(decision.primaryRegion, 'us')
      assert.equal(decision.reason, 'geo')
    })

    it('routeByLatency returns cn (lowest latency)', () => {
      const decision = service.routeByLatency()
      assert.equal(decision.primaryRegion, 'cn')
      assert.equal(decision.reason, 'health')
      assert.equal(decision.latencyHint, 20)
    })

    it('routeByLatency returns fallback when primary is down', () => {
      service.setRegionHealth('cn', 'down')
      const decision = service.routeByLatency()
      assert.notEqual(decision.primaryRegion, 'cn')
      assert.equal(decision.reason, 'health')
    })

    it('route decision includes fallbacks', () => {
      const decision = service.route('10.0.0.1')
      assert.ok(Array.isArray(decision.fallbacks))
      assert.ok(decision.fallbacks.length > 0)
    })
  })

  // ── Data Residency ──

  describe('Data Residency', () => {
    it('canMigrateToRegion returns true for unpinned tenant', () => {
      const allowed = service.canMigrateToRegion('t-free', 'us')
      assert.equal(allowed, true)
    })

    it('canMigrateToRegion returns false for EU tenant to non-EU', () => {
      service.pinTenantToRegion('t-gdpr', 'eu')
      const allowed = service.canMigrateToRegion('t-gdpr', 'us')
      assert.equal(allowed, false)
    })

    it('canMigrateToRegion returns true for EU tenant to EU', () => {
      service.pinTenantToRegion('t-gdpr', 'eu')
      const allowed = service.canMigrateToRegion('t-gdpr', 'eu')
      assert.equal(allowed, true)
    })

    it('canMigrateToRegion respects CN data residency', () => {
      service.pinTenantToRegion('t-cn', 'cn')
      assert.equal(service.canMigrateToRegion('t-cn', 'us'), false)
      assert.equal(service.canMigrateToRegion('t-cn', 'cn'), true)
    })
  })

  // ── resetForTests ──

  describe('resetForTests', () => {
    it('resets tenant pins', () => {
      service.pinTenantToRegion('t-1', 'us')
      service.resetForTests()
      assert.equal(service.getTenantRegion('t-1'), undefined)
    })

    it('resets health to healthy', () => {
      service.setRegionHealth('cn', 'down')
      service.resetForTests()
      assert.equal(service.getRegionHealth('cn'), 'healthy')
    })

    it('clears geo cache', () => {
      service.geoLookup('10.0.0.1')
      service.resetForTests()
      const result = service.geoLookup('10.0.0.1')
      assert.equal(result.source, 'fallback') // not 'cache' since reset cleared it
    })
  })
})
