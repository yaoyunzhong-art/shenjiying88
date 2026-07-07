import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🦞 龙虾哥测试第二段
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 * 8角色视角·MultiRegion多区域模块扩展角色测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MultiRegionService } from './multi-region.service'

const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

function makeSvc(): MultiRegionService {
  const svc = new MultiRegionService()
  // Clear default endpoints so tests are independent
  ;(svc as any).endpoints.clear()
  return svc
}

// ════════════ 👔店长 ════════════
describe(`${ROLES.TenantAdmin} 多区域角色测试`, () => {
  it('店长可注册新区域', () => {
    const svc = makeSvc()
    svc.registerEndpoint({ region: 'cn-east' as any, baseUrl: 'https://east.api', latencyMs: 10, enabled: true })
    const ep = svc.getEndpoint('cn-east' as any)
    assert.ok(ep)
    assert.equal(ep?.region, 'cn-east')
  })

  it('店长可列出所有区域', () => {
    const svc = makeSvc()
    svc.registerEndpoint({ region: 'cn-east' as any, baseUrl: 'https://east.api', latencyMs: 10, enabled: true })
    svc.registerEndpoint({ region: 'cn-west' as any, baseUrl: 'https://west.api', latencyMs: 15, enabled: true })
    const list = svc.listEndpoints()
    assert.equal(list.length, 2)
  })
})

// ════════════ 🛒前台 ════════════
describe(`${ROLES.Reception} 多区域角色测试`, () => {
  it('前台可查询特定区域端点', () => {
    const svc = makeSvc()
    svc.registerEndpoint({ region: 'cn-east' as any, baseUrl: 'https://east.api', latencyMs: 10, enabled: true })
    const ep = svc.getEndpoint('cn-east' as any)
    assert.ok(ep)
    assert.equal(ep?.baseUrl, 'https://east.api')
  })

  it('前台路由查询最近区域', () => {
    const svc = makeSvc()
    svc.registerEndpoint({ region: 'cn-east' as any, baseUrl: 'https://east.api', latencyMs: 5, enabled: true })
    svc.registerEndpoint({ region: 'cn-west' as any, baseUrl: 'https://west.api', latencyMs: 20, enabled: true })
    const route = svc.route('192.168.1.1')
    assert.ok(route.primaryRegion)
  })
})

// ════════════ 👥HR ════════════
describe(`${ROLES.HR} 多区域角色测试`, () => {
  it('HR跨区域租户固定', () => {
    const svc = makeSvc()
    svc.registerEndpoint({ region: 'cn-east' as any, baseUrl: 'https://east.api', latencyMs: 5, enabled: true })
    svc.pinTenantToRegion('t-hr', 'cn-east' as any)
    const route = svc.route('10.0.0.1', 't-hr')
    assert.equal(route.primaryRegion, 'cn-east')
    assert.equal(route.reason, 'tenant-pin')
  })

  it('HR可列出固定租户', () => {
    const svc = makeSvc()
    svc.pinTenantToRegion('t-hr', 'cn-east' as any)
    const pinned = svc.listPinnedTenants()
    assert.ok(pinned.some(p => p.tenantId === 't-hr'))
  })
})

// ════════════ 🔧安监 ════════════
describe(`${ROLES.Safety} 多区域角色测试`, () => {
  it('安监可设置区域健康状态', () => {
    const svc = makeSvc()
    svc.registerEndpoint({ region: 'cn-east' as any, baseUrl: 'https://east.api', latencyMs: 10, enabled: true })
    svc.setRegionHealth('cn-east' as any, 'down')
    assert.equal(svc.getRegionHealth('cn-east' as any), 'down')
  })

  it('安监可检查区域迁移可行性', () => {
    const svc = makeSvc()
    svc.pinTenantToRegion('t-safety', 'cn-east' as any)
    // 钉住 cn-east, 只能迁移到同一区域
    const ok = svc.canMigrateToRegion('t-safety', 'cn-east' as any)
    assert.equal(ok, true)
    const no = svc.canMigrateToRegion('t-safety', 'cn-west' as any)
    assert.equal(no, false)
  })
})

// ════════════ 🎮导玩员 ════════════
describe(`${ROLES.Guide} 多区域角色测试`, () => {
  it('导玩员可查询本区域路由', () => {
    const svc = makeSvc()
    svc.registerEndpoint({ region: 'cn-east' as any, baseUrl: 'https://east.api', latencyMs: 5, enabled: true })
    const route = svc.route('192.168.0.1', 't-guide')
    assert.ok(route.primaryRegion)
  })

  it('导玩员可获取区域健康状态', () => {
    const svc = makeSvc()
    svc.setRegionHealth('cn', 'healthy')
    const health = svc.getRegionHealth('cn')
    assert.equal(health, 'healthy')
  })
})

// ════════════ 🎯运行专员 ════════════
describe(`${ROLES.Ops} 多区域角色测试`, () => {
  it('运行专员可查询默认 fallback 链', () => {
    const svc = makeSvc()
    // 使用默认注册的区域 cn/us/eu/jp
    const route = svc.route('10.0.0.1')
    assert.ok(Array.isArray(route.fallbacks))
  })

  it('运行专员可设置并读取降级状态', () => {
    const svc = makeSvc()
    svc.setRegionHealth('cn' as any, 'degraded')
    assert.equal(svc.getRegionHealth('cn'), 'degraded')
  })
})

// ════════════ 🤝团建 ════════════
describe(`${ROLES.Teambuilding} 多区域角色测试`, () => {
  it('团建可检查活动路由', () => {
    const svc = makeSvc()
    svc.registerEndpoint({ region: 'cn-east' as any, baseUrl: 'https://east.api', latencyMs: 5, enabled: true })
    const route = svc.route('10.0.0.5', 't-team')
    assert.ok(route.primaryRegion)
  })

  it('团建可取消租户固定', () => {
    const svc = makeSvc()
    svc.pinTenantToRegion('t-team', 'cn-east' as any)
    svc.unpinTenant('t-team')
    const route = svc.route('10.0.0.5', 't-team')
    assert.notEqual(route.reason, 'tenant-pin')
  })
})

// ════════════ 📢营销 ════════════
describe(`${ROLES.Marketing} 多区域角色测试`, () => {
  it('营销可基于延迟路由', () => {
    const svc = makeSvc()
    svc.resetForTests()
    svc.registerEndpoint({ region: 'cn', baseUrl: 'https://cn.api', latencyMs: 50, enabled: true })
    // routeByLatency 从 ALL_REGIONS 中筛选 healthy → 需确保默认全 healthy
    const route = svc.routeByLatency()
    assert.ok(route.primaryRegion)
  })

  it('营销可检查租户迁移可行性', () => {
    const svc = makeSvc()
    svc.pinTenantToRegion('t-mkt', 'cn')
    const ok = svc.canMigrateToRegion('t-mkt', 'cn')
    assert.equal(ok, true)
    const no = svc.canMigrateToRegion('t-mkt', 'us')
    assert.equal(no, false)
  })
})
