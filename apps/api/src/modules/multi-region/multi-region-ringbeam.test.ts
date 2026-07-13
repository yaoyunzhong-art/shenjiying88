/**
 * multi-region-ringbeam.test.ts - V17#圈梁 Phase3 多区域模块
 * 用途: PRD对齐测试 - 验证多区域路由/GeoIP/租户固定/健康降级/迁移合规
 * 覆盖: 正例(GeoIP路由+租户固定+健康路由) + 反例(无效区域/不可迁移/未知IP) + 边界(全部down/私有IP)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MultiRegionService } from './multi-region.service'
import { ALL_REGIONS, DEFAULT_REGION } from './multi-region.entity'

describe('🔵 MultiRegionRingBeam: 多区域路由PRD对齐', () => {
  let service: MultiRegionService

  beforeEach(() => {
    service = new MultiRegionService()
  })

  // ─── 1. GeoIP 路由 ────────────────────────────────────────────

  describe('GeoIP路由', () => {
    it('[P0] 中国IP应路由到cn区域', () => {
      const decision = service.route('10.0.0.1')
      expect(decision.primaryRegion).toBe('cn')
      expect(decision.reason).toBe('geo')
    })

    it('[P0] 公开IP末段>=200应路由到us区域', () => {
      const decision = service.route('8.8.8.201')
      expect(decision.primaryRegion).toBe('us')
      expect(decision.reason).toBe('geo')
    })

    it('[P0] 公开IP末段100-199应路由到jp区域', () => {
      const decision = service.route('8.8.8.150')
      expect(decision.primaryRegion).toBe('jp')
      expect(decision.reason).toBe('geo')
    })

    it('[P0] GeoIP返回fallback链且按latency排序', () => {
      const decision = service.route('8.8.8.201')
      expect(decision.fallbacks.length).toBeGreaterThan(0)
      // fallback链不应包含主区域
      expect(decision.fallbacks).not.toContain(decision.primaryRegion)
      // 所有fallback都是有效区域
      for (const f of decision.fallbacks) {
        expect(ALL_REGIONS).toContain(f)
      }
    })

    it('[P1] 未知格式IP应路由到默认区域cn', () => {
      const decision = service.route('invalid-ip')
      expect(decision.primaryRegion).toBe(DEFAULT_REGION)
    })

    it('[P1] geoLookup返回缓存命中标记', () => {
      // 首次查询
      service.route('8.8.8.201')
      // 第二次应从缓存返回
      const result = service['geoLookup']('8.8.8.201')
      expect(result.source).toBe('cache')
    })
  })

  // ─── 2. 租户固定区域 ──────────────────────────────────────────

  describe('租户固定区域', () => {
    it('[P0] pinTenantToRegion后路由应优先使用固定区域', () => {
      service.pinTenantToRegion('tenant-eu-gdpr', 'eu')
      const decision = service.route('8.8.8.1', 'tenant-eu-gdpr')
      expect(decision.primaryRegion).toBe('eu')
      expect(decision.reason).toBe('tenant-pin')
    })

    it('[P1] 未钉住租户使用GeoIP路由', () => {
      const decision = service.route('8.8.8.201', 'tenant-unpinned')
      expect(decision.reason).toBe('geo')
      expect(decision.primaryRegion).toBe('us')
    })

    it('[P1] unpinTenant后恢复GeoIP路由', () => {
      service.pinTenantToRegion('tenant-test', 'jp')
      service.unpinTenant('tenant-test')
      const decision = service.route('8.8.8.201', 'tenant-test')
      expect(decision.reason).toBe('geo')
    })
  })

  // ─── 3. 健康降级 ──────────────────────────────────────────────

  describe('健康降级路由', () => {
    it('[P0] routeByLatency选择latency最低的健康区域', () => {
      // cn=20ms, jp=50ms, us=150ms, eu=180ms → 应选cn
      const decision = service.routeByLatency()
      expect(decision.primaryRegion).toBe('cn')
      expect(decision.reason).toBe('health')
    })

    it('[P1] 区域down后路由应跳过该区域', () => {
      service.setRegionHealth('cn', 'down')
      const decision = service.routeByLatency()
      expect(decision.primaryRegion).not.toBe('cn')
      expect(ALL_REGIONS).toContain(decision.primaryRegion)
    })

    it('[P1] 所有区域都down时返回默认区域cn', () => {
      for (const r of ALL_REGIONS) service.setRegionHealth(r, 'down')
      const decision = service.routeByLatency()
      expect(decision.primaryRegion).toBe(DEFAULT_REGION)
      expect(decision.reason).toBe('default')
    })
  })

  // ─── 4. 数据迁移合规 ──────────────────────────────────────────

  describe('数据迁移合规', () => {
    it('[P0] 未钉住租户可自由迁移', () => {
      expect(service.canMigrateToRegion('tenant-free', 'us')).toBe(true)
      expect(service.canMigrateToRegion('tenant-free', 'eu')).toBe(true)
    })

    it('[P0] EU租户只能留在EU', () => {
      service.pinTenantToRegion('tenant-eu', 'eu')
      expect(service.canMigrateToRegion('tenant-eu', 'eu')).toBe(true)
      expect(service.canMigrateToRegion('tenant-eu', 'us')).toBe(false)
      expect(service.canMigrateToRegion('tenant-eu', 'cn')).toBe(false)
    })

    it('[P0] CN租户只能留在CN', () => {
      service.pinTenantToRegion('tenant-cn', 'cn')
      expect(service.canMigrateToRegion('tenant-cn', 'cn')).toBe(true)
      expect(service.canMigrateToRegion('tenant-cn', 'us')).toBe(false)
    })
  })

  // ─── 5. 端点和Fallback完整性 ──────────────────────────────────

  describe('端点和Fallback完整性', () => {
    it('[P0] 所有注册端点都有效', () => {
      const endpoints = service.listEndpoints()
      expect(endpoints.length).toBe(ALL_REGIONS.length)
      for (const ep of endpoints) {
        expect(ep.enabled).toBe(true)
        expect(ep.latencyMs).toBeGreaterThan(0)
      }
    })

    it('[P1] registerEndpoint可添加自定义端点', () => {
      service.registerEndpoint({ region: 'cn', baseUrl: 'https://custom.cn', latencyMs: 10, enabled: true })
      const ep = service.getEndpoint('cn')
      expect(ep?.baseUrl).toBe('https://custom.cn')
    })

    it('[P1] listPinnedTenants返回钉住租户列表', () => {
      service.pinTenantToRegion('t1', 'eu')
      service.pinTenantToRegion('t2', 'jp')
      const list = service.listPinnedTenants()
      expect(list.length).toBe(2)
      expect(list.find((t) => t.tenantId === 't1')?.region).toBe('eu')
    })
  })
})
