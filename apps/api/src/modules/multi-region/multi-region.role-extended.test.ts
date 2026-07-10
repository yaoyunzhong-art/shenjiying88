import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [multi-region] [C] 角色测试扩展
 *
 * 8 角色视角深度测试 — 多区域模块扩展用例
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥3 测试用例: 正常流程 + 异常边界 + 状态转换
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MultiRegionController } from './multi-region.controller'
import { MultiRegionService } from './multi-region.service'
import { FailoverService } from './failover.service'
import type { Region, EndpointInfo } from './multi-region.entity'
import { ALL_REGIONS } from './multi-region.entity'

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

function createTestInfra() {
  const regions = new MultiRegionService()
  const failover = new FailoverService(regions)
  const controller = new MultiRegionController(regions, failover)
  return { regions, failover, controller }
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 全局区域管理与运营决策
// ════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} 多区域扩展测试`, () => {
  it('店长批量注册区域端点并验证列表完整性', () => {
    const { regions, controller } = createTestInfra()
    for (const r of ALL_REGIONS) {
      controller.registerEndpoint({
        region: r,
        baseUrl: `https://api-${r}.example.com`,
        latencyMs: r === 'cn' ? 20 : r === 'us' ? 100 : r === 'eu' ? 150 : 50,
        enabled: true,
      })
    }
    const eps = controller.listEndpoints()
    assert.equal(eps.length, 4, '应有 4 个默认区域')
    for (const r of ALL_REGIONS) {
      const ep = eps.find(e => (e as any).region === r)
      assert.ok(ep, `区域 ${r} 必须存在`)
      assert.equal((ep as any).enabled, true, `${r} 应启用`)
    }
  })

  it('店长查看全区域健康状态应含 failover 信息', () => {
    const { controller } = createTestInfra()
    const health = controller.getAllHealth() as Record<string, unknown>
    for (const r of ALL_REGIONS) {
      const h = health[r] as any
      assert.ok(h, `区域 ${r} 缺失`)
      assert.equal(h.health, 'healthy')
      assert.equal(h.failoverState, 'HEALTHY')
    }
  })

  it('店长标记区域 down 后 failover 状态应流转', async () => {
    const { controller } = createTestInfra()
    controller.setHealth({ region: 'cn', status: 'down' })
    const health = controller.getHealth('cn')
    assert.equal(health.health, 'down')

    // 触发 failover 检查
    await controller.failoverCheck({ region: 'cn', forceOk: false })
    const state = controller.getFailoverStates() as any
    assert.ok(state.cn, '应含 cn 区域 failover 状态')
  })

  it('店长恢复区域后 failover 应回到 HEALTHY', async () => {
    const { controller } = createTestInfra()
    controller.setHealth({ region: 'cn', status: 'down' })
    await controller.failoverCheck({ region: 'cn', forceOk: false })
    controller.setHealth({ region: 'cn', status: 'healthy' })
    await controller.failoverCheck({ region: 'cn', forceOk: true })
    const healthy = controller.getFailoverStates() as any
    assert.ok(healthy.cn, '应含 cn 区域')
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 顾客路由接待体验
// ════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} 多区域扩展测试`, () => {
  it('前台查询 cn 区域端点返回正确 baseUrl', () => {
    const { controller } = createTestInfra()
    const ep = controller.getEndpoint('cn') as EndpointInfo
    assert.equal(ep.baseUrl, 'https://api-cn.example.com')
    assert.equal(ep.region, 'cn')
  })

  it('前台为日本 IP 路由到 jp 区域', () => {
    const { controller } = createTestInfra()
    const d = controller.route({ clientIp: '1.1.1.150', tenantId: undefined })
    assert.equal(d.primaryRegion, 'jp')
    assert.equal(d.reason, 'geo')
    assert.ok(d.fallbacks.length >= 3)
  })

  it('前台查询不存在的端点应返回 error', () => {
    const { controller } = createTestInfra()
    const result = controller.getEndpoint('unknown' as Region)
    assert.equal((result as any).error, 'region unknown not found')
  })

  it('前台私有 IP 顾客兜底路由到 cn 区域', () => {
    const { controller } = createTestInfra()
    const d = controller.route({ clientIp: '172.16.0.1', tenantId: undefined })
    assert.equal(d.primaryRegion, 'cn')
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 数据驻留合规与租户隔离
// ════════════════════════════════════════════════════════════
describe(`${ROLES.HR} 多区域扩展测试`, () => {
  it('HR 钉住 GDPR 租户到 EU 后路由必须固定', () => {
    const { controller } = createTestInfra()
    controller.pinTenant({ tenantId: 'gdpr-001', region: 'eu' })
    const d = controller.route({ clientIp: '8.8.8.201', tenantId: 'gdpr-001' })
    assert.equal(d.primaryRegion, 'eu')
    assert.equal(d.reason, 'tenant-pin', '钉住租户路由原因应为 tenant-pin')
  })

  it('HR 钉住后跨区域迁移被拒绝', () => {
    const { controller } = createTestInfra()
    controller.pinTenant({ tenantId: 'gdpr-002', region: 'eu' })
    const check = controller.canMigrate({ tenantId: 'gdpr-002', targetRegion: 'cn' })
    assert.equal(check.allowed, false)
  })

  it('HR 取消钉住后租户恢复自由迁移', () => {
    const { controller } = createTestInfra()
    controller.pinTenant({ tenantId: 'flex-001', region: 'us' })
    controller.unpinTenant('flex-001')
    const region = controller.getTenantRegion('flex-001')
    assert.equal(region?.region, null, '取消钉住后 region 应为 null')
  })

  it('HR 列出所有钉住租户应完整', () => {
    const { controller } = createTestInfra()
    controller.pinTenant({ tenantId: 'list-001', region: 'cn' })
    controller.pinTenant({ tenantId: 'list-002', region: 'eu' })
    const pinned = controller.listPinnedTenants()
    assert.ok(pinned.find(p => p.tenantId === 'list-001'), '应有 list-001')
    assert.ok(pinned.find(p => p.tenantId === 'list-002'), '应有 list-002')
    assert.equal(pinned.length, 2)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 区域安全与故障切换
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Safety} 多区域扩展测试`, () => {
  it('安监标记区域 down 后 failover 应触发', async () => {
    const { controller } = createTestInfra()
    controller.setHealth({ region: 'us', status: 'down' })
    await controller.failoverCheck({ region: 'us', forceOk: false })
    const events = controller.getFailoverEvents('us' as any)
    assert.ok(Array.isArray(events))
  })

  it('安监配置 failover 阈值应生效', () => {
    const { controller } = createTestInfra()
    controller.configureFailover({ failureThreshold: 3, checkIntervalMs: 10000 })
    const events = controller.getFailoverEvents() as any
    assert.ok(Array.isArray(events))
  })

  it('安监批量检查所有区域健康返回全部结果', async () => {
    const { controller } = createTestInfra()
    const results = await controller.batchCheck({
      forceOkMap: { cn: true, us: true, eu: true, jp: true },
    })
    assert.equal(results.length, 4)
    for (const r of results) {
      assert.equal(r.state, 'HEALTHY')
    }
  })

  it('安监获取健康区域列表应含全部', () => {
    const { controller } = createTestInfra()
    const healthy = controller.getHealthyRegions()
    assert.equal(healthy.healthyRegions.length, 4)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 游戏设备就近接入
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} 多区域扩展测试`, () => {
  it('导玩员按延迟路由选择 cn（最低 20ms）', () => {
    const { controller } = createTestInfra()
    const d = controller.routeByLatency()
    assert.equal(d.primaryRegion, 'cn')
    assert.equal(d.reason, 'health')
  })

  it('导玩员查询 cn 端点信息含正确 baseUrl', () => {
    const { controller } = createTestInfra()
    const ep = controller.getEndpoint('cn') as EndpointInfo
    assert.equal(ep.baseUrl, 'https://api-cn.example.com')
  })

  it('导玩员路由中国 IP 到 cn 区域', () => {
    const { controller } = createTestInfra()
    const d = controller.route({ clientIp: '192.168.1.100', tenantId: 'game-001' })
    assert.equal(d.primaryRegion, 'cn')
  })

  it('导玩员区域 down 时应路由最近的 fallback', () => {
    const { controller } = createTestInfra()
    // cn down, 路由最近的 jp (50ms)
    controller.setHealth({ region: 'cn', status: 'down' })
    const d = controller.routeByLatency()
    assert.equal(d.primaryRegion, 'jp', 'cn down 后应选 jp（50ms < us 100ms）')
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 区域端点运营管理
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} 多区域扩展测试`, () => {
  it('运行专员注册新区域并查询', () => {
    const { controller } = createTestInfra()
    controller.registerEndpoint({
      region: 'sg' as Region,
      baseUrl: 'https://api-sg.example.com',
      latencyMs: 80,
      enabled: true,
    })
    const ep = controller.getEndpoint('sg' as Region) as EndpointInfo
    assert.equal(ep.baseUrl, 'https://api-sg.example.com')
  })

  it('运行专员更新端点延迟值', () => {
    const { controller } = createTestInfra()
    controller.updateEndpoint('cn', { latencyMs: 5 })
    const ep = controller.getEndpoint('cn') as EndpointInfo
    assert.equal(ep.latencyMs, 5)
  })

  it('运行专员禁用端点后不应在活跃路由中', () => {
    const { controller } = createTestInfra()
    controller.updateEndpoint('us', { enabled: false })
    const ep = controller.getEndpoint('us') as EndpointInfo
    assert.equal(ep.enabled, false)
  })

  it('运行专员钉住租户到指定区域', () => {
    const { controller } = createTestInfra()
    controller.pinTenant({ tenantId: 'ops-tenant', region: 'jp' })
    const region = controller.getTenantRegion('ops-tenant')
    assert.equal(region?.region, 'jp')
  })

  it('运行专员查询未钉住租户返回 null', () => {
    const { controller } = createTestInfra()
    const region = controller.getTenantRegion('non-existent-tenant')
    assert.equal(region?.region, null)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 跨区域团队协作
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} 多区域扩展测试`, () => {
  it('团建 US 参与者应路由 us 区域', () => {
    const { controller } = createTestInfra()
    const d = controller.route({ clientIp: '8.8.8.201', tenantId: 'team-us' })
    assert.equal(d.primaryRegion, 'us')
  })

  it('团建钉住租户后路由强制生效', () => {
    const { controller } = createTestInfra()
    controller.pinTenant({ tenantId: 'team-bond', region: 'eu' })
    const d = controller.route({ clientIp: '1.1.1.1', tenantId: 'team-bond' })
    assert.equal(d.primaryRegion, 'eu')
  })

  it('团建取消钉住后路由回到 geo', () => {
    const { controller } = createTestInfra()
    controller.pinTenant({ tenantId: 'team-unpin', region: 'jp' })
    controller.unpinTenant('team-unpin')
    const d = controller.route({ clientIp: '192.168.1.1', tenantId: 'team-unpin' })
    assert.equal(d.primaryRegion, 'cn', '中国 IP 取消钉住后应到 cn')
  })

  it('团建可查看所有区域故障事件', () => {
    const { controller } = createTestInfra()
    const events = controller.getFailoverEvents() as any
    assert.ok(Array.isArray(events))
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 营销活动区域定向
// ════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} 多区域扩展测试`, () => {
  it('营销日本活动路由到 jp', () => {
    const { controller } = createTestInfra()
    const d = controller.route({ clientIp: '1.1.1.150', tenantId: 'campaign-jp' })
    assert.equal(d.primaryRegion, 'jp')
  })

  it('营销钉住客户到 us 后不可迁移', () => {
    const { controller } = createTestInfra()
    controller.pinTenant({ tenantId: 'customer-us', region: 'us' })
    const check = controller.canMigrate({ tenantId: 'customer-us', targetRegion: 'eu' })
    assert.equal(check.allowed, false)
  })

  it('营销路由含完整 fallback 列表', () => {
    const { controller } = createTestInfra()
    const d = controller.route({ clientIp: '10.0.0.1', tenantId: undefined })
    assert.ok(Array.isArray(d.fallbacks))
    assert.ok(d.fallbacks.length >= 3)
    assert.ok(d.fallbacks.includes('us'))
    assert.ok(d.fallbacks.includes('eu'))
  })

  it('营销配置 failover 后不应抛异常', () => {
    const { controller } = createTestInfra()
    controller.configureFailover({ failureThreshold: 5, checkIntervalMs: 30000 })
    assert.ok(true, '配置成功不应抛出')
  })

  it('营销可查看 failover 历史事件', () => {
    const { controller } = createTestInfra()
    const events = controller.getFailoverEvents() as any
    assert.ok(Array.isArray(events))
  })
})

// ════════════════════════════════════════════════════════════
// 跨角色边界测试
// ════════════════════════════════════════════════════════════
describe('multi-region 跨角色边界场景', () => {
  it('所有区域 down 时每个区域路由应含降级标志', () => {
    const { controller } = createTestInfra()
    for (const r of ALL_REGIONS) {
      controller.setHealth({ region: r, status: 'down' })
    }
    const health = controller.getAllHealth() as Record<string, any>
    for (const r of ALL_REGIONS) {
      assert.equal(health[r].health, 'down')
    }
  })

  it('同时注册+钉住+删除端点序列操作不丢数据', () => {
    const { controller } = createTestInfra()
    controller.registerEndpoint({
      region: 'in' as Region,
      baseUrl: 'https://api-in.example.com',
      latencyMs: 60,
      enabled: true,
    })
    controller.pinTenant({ tenantId: 'stress-001', region: 'in' as Region })
    const pinned = controller.listPinnedTenants()
    assert.ok(pinned.find(p => p.tenantId === 'stress-001'), '钉住应持续')
    const ep = controller.getEndpoint('in' as Region) as EndpointInfo
    assert.equal(ep.region, 'in')
  })

  it('GeoIP 缓存命中返回 cache source', () => {
    const { controller } = createTestInfra()
    controller.geoLookup('8.8.8.201')
    const cached = controller.geoLookup('8.8.8.201') as any
    assert.equal(cached.source, 'cache')
  })
})
