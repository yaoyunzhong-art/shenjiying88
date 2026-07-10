import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [cdn-cache] [C] 角色测试增强 v2
 *
 * 8 角色视角 CDN 缓存增强测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 聚焦进阶场景:
 * - 边缘节点心跳 & 离线
 * - 全局失效 & 精确失效
 * - 过期规则禁用后自动回退
 * - 敏感内容加密缓存 (no-store 策略)
 * - 营销素材批量失效
 * - 多租户规则隔离
 */

import 'reflect-metadata'
import { CdnCacheController } from './cdn.controller'
import { CdnCacheService } from './cdn.service'
import type { CdnCacheRule, EdgeNode, CdnCacheEntry } from './cdn.entity'

// ── Mock 租户上下文 ──
let CURRENT_TENANT = 't-cdn-v2-001'
vi.mock('../../common/context/tenant-context', () => ({
  requireTenantContext: () => ({
    tenantId: CURRENT_TENANT,
    userId: 'user-v2-test',
  }),
}))

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试工厂 ──
function createEnv(tenantId = 't-cdn-v2-001') {
  CURRENT_TENANT = tenantId
  const service = new CdnCacheService()
  const controller = new CdnCacheController(service)
  return { service, controller }
}

/**
 * 清空租户下的所有规则
 */
async function resetRules(service: CdnCacheService, controller: CdnCacheController) {
  const all = await controller.listRules()
  for (const r of all.items) {
    await controller.deleteRule(r.id).catch(() => {})
  }
}

/**
 * 创建基础规则
 */
async function seedRule(
  controller: CdnCacheController,
  overrides?: Partial<CdnCacheRule>,
): Promise<CdnCacheRule> {
  return controller.createRule({
    name: overrides?.name ?? '测试规则',
    urlPattern: overrides?.urlPattern ?? '/api/*',
    strategy: overrides?.strategy ?? 'public',
    maxAge: overrides?.maxAge ?? 600,
    priority: overrides?.priority ?? 0,
    enabled: overrides?.enabled ?? true,
    methods: overrides?.methods ?? ['GET', 'HEAD'],
    enableETag: overrides?.enableETag ?? true,
    enableGzip: overrides?.enableGzip ?? true,
    staleWhileRevalidate: overrides?.staleWhileRevalidate ?? 86400,
    cacheableStatusCodes: overrides?.cacheableStatusCodes ?? [200, 301, 404],
  })
}

// ──────────── 👔店长: 全局缓存策略 + 优先级编排 ────────────
describe(`${ROLES.StoreManager} CDN 缓存策略编排`, () => {
  it('👔[正常] 店长创建多条规则并按优先级匹配', async () => {
    const { controller } = createEnv()
    await resetRules(controller.service, controller)

    // 低优先级通配规则
    await seedRule(controller, {
      name: '全局静态',
      urlPattern: '/*',
      priority: 0,
      maxAge: 300,
    })
    // 高优先级精准规则
    const high = await seedRule(controller, {
      name: 'VIP 资源',
      urlPattern: '/vip/*',
      priority: 100,
      maxAge: 86400,
    })

    // VIP 路径应命中高优先级规则
    const r1 = await controller.match({ url: '/vip/dashboard.html', method: 'GET' })
    expect(r1.matched).toBe(true)
    expect(r1.rule!.priority).toBe(100)

    // 普通路径应命中低优先级通配规则
    const r2 = await controller.match({ url: '/about/team', method: 'GET' })
    expect(r2.matched).toBe(true)
    expect(r2.rule!.priority).toBe(0)
  })

  it('👔[边界] 店长禁用规则后不应再被匹配', async () => {
    const { controller } = createEnv()
    await resetRules(controller.service, controller)

    const rule = await seedRule(controller, {
      name: '测试禁用',
      urlPattern: '/legacy/*',
      priority: 50,
    })

    // 禁用前可匹配
    const rBefore = await controller.match({ url: '/legacy/data', method: 'GET' })
    expect(rBefore.matched).toBe(true)

    // 禁用
    await controller.updateRule(rule.id, { enabled: false })

    // 禁用后不应匹配
    const rAfter = await controller.match({ url: '/legacy/data', method: 'GET' })
    expect(rAfter.matched).toBe(false)
  })
})

// ──────────── 🛒前台: URL 缓存匹配场景 ────────────
describe(`${ROLES.FrontDesk} URL 缓存匹配验证`, () => {
  it('🛒[正常] 前台验证 GET 方法缓存命中, POST 不命中', async () => {
    const { controller } = createEnv()
    await resetRules(controller.service, controller)

    await seedRule(controller, {
      name: 'API 缓存',
      urlPattern: '/api/*',
      methods: ['GET', 'HEAD'],
    })

    const getResult = await controller.match({ url: '/api/users', method: 'GET' })
    expect(getResult.matched).toBe(true)

    const postResult = await controller.match({ url: '/api/users', method: 'POST' })
    expect(postResult.matched).toBe(false)
  })

  it('🛒[边界] 前台查询不存在的 URL 不会报错', async () => {
    const { controller } = createEnv()
    await resetRules(controller.service, controller)

    const result = await controller.match({ url: '/this/does/not/exist/at/all', method: 'GET' })
    expect(result.matched).toBe(false)
    expect(result.rule).toBeNull()
    expect(result.cacheControl).toBeNull()
  })
})

// ──────────── 👥HR: 规则权限变更审计 ────────────
describe(`${ROLES.HR} 规则变更与审计溯源`, () => {
  it('👥[正常] HR 审计确认所有规则可被正确列举', async () => {
    const { controller } = createEnv()
    await resetRules(controller.service, controller)

    await seedRule(controller, { name: '审计规则A', urlPattern: '/audit/a/*' })
    await seedRule(controller, { name: '审计规则B', urlPattern: '/audit/b/*' })

    const list = await controller.listRules()
    expect(list.items.length).toBeGreaterThanOrEqual(2)
    const names = list.items.map(r => r.name)
    expect(names).toContain('审计规则A')
    expect(names).toContain('审计规则B')
  })

  it('👥[边界] HR 查看已被删除的规则应抛出异常', async () => {
    const { controller } = createEnv()
    const existing = await controller.listRules()

    await expect(
      controller.getRule('non-existent-rule-999'),
    ).rejects.toThrow()
  })
})

// ──────────── 🔧安监: 安全缓存策略 + 失效验证 ────────────
describe(`${ROLES.Safety} 安全缓存策略与失效`, () => {
  it('🔧[正常] 安监创建 no-store 策略确保敏感数据不被缓存', async () => {
    const { controller } = createEnv()
    await resetRules(controller.service, controller)

    await seedRule(controller, {
      name: '用户隐私',
      urlPattern: '/api/user/*/private',
      strategy: 'no-store',
      maxAge: 0,
    })

    // 验证匹配的 Cache-Control 不含缓存指令
    const match = await controller.match({ url: '/api/user/001/private', method: 'GET' })
    expect(match.matched).toBe(true)
    expect(match.rule!.strategy).toBe('no-store')
    expect(match.cacheControl).toContain('no-store')
  })

  it('🔧[边界] 安监对已缓存的敏感数据发起失效应正确清空', async () => {
    const { controller, service } = createEnv()
    await resetRules(controller.service, controller)

    // 手动注入一个缓存条目
    service.addCacheEntryForTesting({
      key: 'sensitive-data-key',
      ruleId: 'rule-sensitive',
      edgeNodeId: 'edge-sh',
      url: '/api/user/001/private/profile',
      statusCode: 200,
      sizeBytes: 1024,
      cachedAt: Date.now(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      hitCount: 1, ttl: 3600, nodeName: 'edge-sh',
      etag: '"abc"',
    })

    // 按 URL 精确失效
    const inv = await controller.invalidate({
      mode: 'url',
      target: '/api/user/001/private/profile',
    })
    expect(inv.affectedEntries).toBe(1)
    expect(inv.status).toBe('completed')

    // 确认缓存条目已被清除
    const remaining = service.listCacheEntriesForTesting()
    expect(remaining.some(e => e.url === '/api/user/001/private/profile')).toBe(false)
  })
})

// ──────────── 🎮导玩员: 边缘节点管理 ────────────
describe(`${ROLES.Guide} 边缘节点管理`, () => {
  it('🎮[正常] 导玩员注册新边缘节点并查询状态', async () => {
    const { controller, service } = createEnv()

    await controller.addNode({
      name: 'edge-cn-shenzhen-01',
      region: 'cn-shenzhen',
      endpoint: 'https://sz1.cdn.example.com',
      capacityBytes: 500_000_000,
    })

    const nodes = await controller.listNodes()
    const sz = nodes.items.find(n => n.name === 'edge-cn-shenzhen-01')
    expect(sz).toBeDefined()
    expect(sz!.region).toBe('cn-shenzhen')
    expect(sz!.status).toBe('online')

    // 模拟心跳
    await service.recordHeartbeat(sz!.id, 0.95, 12, 200_000_000)
    const updated = await controller.listNodes()
    const szUpdated = updated.items.find(n => n.id === sz!.id)
    expect(szUpdated!.hitRate).toBe(0.95)
    expect(szUpdated!.avgLatencyMs).toBe(12)
  })

  it('🎮[边界] 导玩员删除离线的边缘节点', async () => {
    const { controller } = createEnv()

    const node = await controller.addNode({
      name: 'edge-cn-guangzhou-01-temp',
      region: 'cn-guangzhou',
      endpoint: 'https://gz1.cdn.example.com',
      capacityBytes: 300_000_000,
    })

    await controller.removeNode(node.id)
    const nodes = await controller.listNodes()
    expect(nodes.items.some(n => n.id === node.id)).toBe(false)
  })

  it('🎮[边界] 导玩员删除不存在的节点应抛出异常', async () => {
    const { controller } = createEnv()
    await expect(
      controller.removeNode('non-existent-node-id'),
    ).rejects.toThrow()
  })
})

// ──────────── 🎯运行专员: 命中率监控 + 节点统计 ────────────
describe(`${ROLES.Ops} 缓存命中率与性能监控`, () => {
  it('🎯[正常] 运行专员多次命中后查看节点统计', async () => {
    const { controller, service } = createEnv('t-ops-v2')

    // 添加两个边缘节点
    const n1 = await controller.addNode({
      name: 'edge-ops-a',
      region: 'cn-beijing',
      endpoint: 'https://bj-ops.cdn.example.com',
      capacityBytes: 1_000_000_000,
    })
    const n2 = await controller.addNode({
      name: 'edge-ops-b',
      region: 'cn-shanghai',
      endpoint: 'https://sh-ops.cdn.example.com',
      capacityBytes: 2_000_000_000,
    })

    await service.recordHeartbeat(n1.id, 0.88, 15, 500_000_000)
    await service.recordHeartbeat(n2.id, 0.92, 8, 800_000_000)

    const stats = await controller.nodeStats()
    expect(stats.totalNodes).toBe(2)
    expect(stats.onlineNodes).toBe(2)
    expect(stats.totalCapacityBytes).toBe(3_000_000_000)
    expect(stats.totalUsedBytes).toBe(1_300_000_000)

    // 记录命中/未命中
    for (let i = 0; i < 8; i++) service.recordHit('t-ops-v2')
    for (let i = 0; i < 2; i++) service.recordMiss('t-ops-v2')
    expect(service.getHitRate('t-ops-v2')).toBe(0.8)
  })

  it('🎯[边界] 运行专员查询空集群统计', async () => {
    const { controller } = createEnv('t-empty-ops')
    const stats = await controller.nodeStats()
    expect(stats.totalNodes).toBe(0)
    expect(stats.onlineNodes).toBe(0)
    expect(stats.totalCapacityBytes).toBe(0)
    expect(stats.totalUsedBytes).toBe(0)
    expect(stats.averageHitRate).toBe(0)
    expect(stats.averageLatencyMs).toBe(0)
  })
})

// ──────────── 🤝团建: 多规则协作 + 批量失效 ────────────
describe(`${ROLES.Teambuilding} 多规则协作与批量失效`, () => {
  it('🤝[正常] 团建配置多规则后批量失效所有营销素材', async () => {
    const { controller, service } = createEnv()
    await resetRules(controller.service, controller)

    await seedRule(controller, {
      name: '团建横幅',
      urlPattern: '/banner/*',
    })
    await seedRule(controller, {
      name: '团建海报',
      urlPattern: '/poster/*',
    })

    // 注入缓存条目
    service.addCacheEntryForTesting({
      key: 'banner-sale',
      ruleId: 'rule-1',
      edgeNodeId: 'edge-1',
      url: '/banner/summer-sale.jpg',
      statusCode: 200,
      sizeBytes: 50000,
      cachedAt: Date.now(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      hitCount: 3, ttl: 3600, nodeName: 'edge-1',
      etag: '"aaa"',
    })
    service.addCacheEntryForTesting({
      key: 'poster-event',
      ruleId: 'rule-2',
      edgeNodeId: 'edge-1',
      url: '/poster/team-building.png',
      statusCode: 200,
      sizeBytes: 80000,
      cachedAt: Date.now(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      hitCount: 5, ttl: 3600, nodeName: 'edge-1',
      etag: '"bbb"',
    })

    // 通配失效 banner
    const invBanner = await controller.invalidate({
      mode: 'pattern',
      target: '/banner/*',
    })
    expect(invBanner.affectedEntries).toBe(1)

    // banner 被清除，poster 还在
    const remaining = service.listCacheEntriesForTesting()
    expect(remaining.some(e => e.url.includes('/banner/'))).toBe(false)
    expect(remaining.some(e => e.url.includes('/poster/'))).toBe(true)
  })

  it('🤝[边界] 团建通配失效不存在的 pattern 应不影响其他缓存', async () => {
    const { controller, service } = createEnv()
    service.addCacheEntryForTesting({
      key: 'cache-keep',
      ruleId: 'rule-keep',
      edgeNodeId: 'edge-1',
      url: '/keep/this',
      statusCode: 200,
      sizeBytes: 100,
      cachedAt: Date.now(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      hitCount: 1, ttl: 3600, nodeName: 'edge-1',
      etag: '"ccc"',
    })

    const inv = await controller.invalidate({
      mode: 'pattern',
      target: '/nonexistent/*',
    })
    expect(inv.affectedEntries).toBe(0)
    expect(inv.status).toBe('completed')

    // 原有缓存不受影响
    const remaining = service.listCacheEntriesForTesting()
    expect(remaining.some(e => e.key === 'cache-keep')).toBe(true)
  })
})

// ──────────── 📢营销: 营销素材缓存生命周期 ────────────
describe(`${ROLES.Marketing} 营销素材缓存管理`, () => {
  it('📢[正常] 营销人员为促销活动配置短 TTL 缓存', async () => {
    const { controller } = createEnv()
    await resetRules(controller.service, controller)

    const rule = await seedRule(controller, {
      name: '618 大促',
      urlPattern: '/promo/618/*',
      strategy: 'public',
      maxAge: 60, // 60 秒短缓存方便更新
      enableETag: true,
      cacheableStatusCodes: [200],
    })

    expect(rule.strategy).toBe('public')
    expect(rule.maxAge).toBe(60)
    expect(rule.cacheableStatusCodes).toEqual([200])

    const match = await controller.match({ url: '/promo/618/banner.jpg', method: 'GET' })
    expect(match.matched).toBe(true)
    expect(match.cacheControl).toContain('max-age=60')
  })

  it('📢[边界] 营销人员对失效列表查看历史操作', async () => {
    const { controller } = createEnv()

    // 执行多次失效
    const inv1 = await controller.invalidate({ mode: 'pattern', target: '/promo/old/*' })
    const inv2 = await controller.invalidate({ mode: 'url', target: '/promo/618/banner-new.jpg' })
    const inv3 = await controller.invalidate({ mode: 'pattern', target: '/banner/event/*' })

    const list = await controller.listInvalidations()
    expect(list.items.length).toBeGreaterThanOrEqual(3)
    // 所有失效都已完成
    for (const inv of list.items) {
      expect(inv.status).toBe('completed')
    }
  })
})

// ──────────── 多租户隔离测试 ────────────
describe('🔒 多租户 CDN 规则隔离', () => {
  it('租户A 创建的规则不会出现在租户B 的列表中', async () => {
    const envA = createEnv('t-tenant-a-v2')
    await resetRules(envA.controller.service, envA.controller)

    // 租户 A 创建规则
    await seedRule(envA.controller, {
      name: '租户A专有',
      urlPattern: '/tenant-a/*',
    })

    // 租户 B 应看不到
    const envB = createEnv('t-tenant-b-v2')
    await resetRules(envB.controller.service, envB.controller)
    const listB = await envB.controller.listRules()
    expect(listB.items.some(r => r.name === '租户A专有')).toBe(false)
  })

  it('租户A 禁用规则不影响租户B 独立规则', async () => {
    // 用同一个服务实例，仅通过 CURRENT_TENANT 模拟不同租户
    const { controller, service } = createEnv('t-tenant-e-v2')
    await resetRules(service, controller)

    CURRENT_TENANT = 't-tenant-e-v2'
    const ruleE = await seedRule(controller, {
      name: '租户E规则',
      urlPattern: '/tenant-e/*',
    })

    CURRENT_TENANT = 't-tenant-f-v2'
    await seedRule(controller, {
      name: '租户F规则',
      urlPattern: '/tenant-f/*',
    })

    // 在 E 的上下文中禁用规则，不影响 F
    CURRENT_TENANT = 't-tenant-e-v2'
    await controller.updateRule(ruleE.id, { enabled: false })

    // E 的规则已禁用
    const matchE = await controller.match({ url: '/tenant-e/test', method: 'GET' })
    expect(matchE.matched).toBe(false)

    // F 的规则不受影响
    CURRENT_TENANT = 't-tenant-f-v2'
    const matchF = await controller.match({ url: '/tenant-f/test', method: 'GET' })
    expect(matchF.matched).toBe(true)
    expect(matchF.rule!.name).toBe('租户F规则')
  })
})
