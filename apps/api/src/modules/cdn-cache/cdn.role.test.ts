import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
/**
 * 🐜 自动: [cdn-cache] [C] 角色测试
 *
 * 8 角色视角的 CDN 缓存模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import { CdnCacheController } from './cdn.controller'
import { CdnCacheService } from './cdn.service'
import type { CdnCacheRule, EdgeNode } from './cdn.entity'

// ── Mock 租户上下文 ──
vi.mock('../../common/context/tenant-context', () => ({
  requireTenantContext: () => ({
    tenantId: 't-cdn-role-001',
    userId: 'user-role-test',
  }),
}))

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试辅助 ──
function createEnv() {
  const service = new CdnCacheService()
  const controller = new CdnCacheController(service)
  return { service, controller }
}

async function seedBasicRule(
  service: CdnCacheService,
  overrides?: Partial<CdnCacheRule>,
): Promise<CdnCacheRule> {
  const rules = await service.listRules()
  // 清理已有规则
  for (const r of rules) {
    await service.deleteRule(r.id).catch(() => {})
  }
  return service.createRule({
    name: '静态资源缓存',
    urlPattern: '/static/*',
    strategy: 'public',
    maxAge: 3600,
    ...overrides,
  })
}

async function seedRuleWithState(
  service: CdnCacheService,
  state: Partial<CdnCacheRule>,
): Promise<CdnCacheRule> {
  const rules = await service.listRules()
  for (const r of rules) {
    await service.deleteRule(r.id).catch(() => {})
  }
  return service.createRule({
    name: state.name ?? '测试规则',
    urlPattern: state.urlPattern ?? '/api/*',
    strategy: state.strategy ?? 'public',
    maxAge: state.maxAge ?? 600,
    enabled: state.enabled ?? true,
  })
}

describe('🎯 CDN 缓存模块 · 8 角色场景测试', () => {
  // ══════════════════════════════════════
  // 👔 店长 · 全局缓存策略管理
  // ══════════════════════════════════════
  describe(`👔 ${ROLES.StoreManager} · 全局缓存策略管理`, () => {
    let env: ReturnType<typeof createEnv>

    beforeEach(() => {
      env = createEnv()
    })

    it('👔[正常] 店长创建全局缓存规则', async () => {
      const { controller } = env
      const rule = await controller.createRule({
        name: '门店首页缓存',
        urlPattern: '/index.html',
        strategy: 'public',
        maxAge: 300,
      })
      expect(rule).toBeDefined()
      expect(rule.name).toBe('门店首页缓存')
      expect(rule.strategy).toBe('public')
      expect(rule.maxAge).toBe(300)
    })

    it('👔[边界] 店长查看规则列表并调整优先级', async () => {
      const { service, controller } = env
      // 创建两条规则
      const r1 = await controller.createRule({
        name: '高优先级静态',
        urlPattern: '/static/*',
        priority: 100,
        maxAge: 86400,
      })
      const r2 = await controller.createRule({
        name: '默认 API',
        urlPattern: '/api/*',
        priority: 10,
        maxAge: 600,
      })
      // 调整 r2 优先级到最高
      const updated = await controller.updateRule(r2.id, { priority: 200 })
      expect(updated.priority).toBe(200)

      const rules = await controller.listRules()
      // 优先级从高到低排序 (响应通过 { items: [...] } 包装)
      expect(rules.items.length).toBeGreaterThanOrEqual(2)
      expect(rules.items[0].id).toBe(r2.id)
      expect(rules.items[0].priority).toBe(200)
    })
  })

  // ══════════════════════════════════════
  // 🛒 前台 · 缓存状态查看 & URL 匹配验证
  // ══════════════════════════════════════
  describe(`🛒 ${ROLES.FrontDesk} · 缓存状态查看 & URL 匹配验证`, () => {
    let env: ReturnType<typeof createEnv>

    beforeEach(() => {
      env = createEnv()
    })

    it('🛒[正常] 前台检查 URL 缓存匹配情况', async () => {
      const { service, controller } = env
      await seedBasicRule(service)
      // 测试匹配
      const matchResult = await controller.match({
        url: '/static/images/logo.png',
        method: 'GET',
      })
      expect(matchResult.matched).toBe(true)
      expect(matchResult.rule).not.toBeNull()
      expect(matchResult.rule!.name).toBe('静态资源缓存')
      expect(matchResult.cacheControl).toContain('max-age=3600')
    })

    it('🛒[边界] 前台查询不匹配的 URL 返回未匹配', async () => {
      const { service, controller } = env
      await seedBasicRule(service)
      const result = await controller.match({
        url: '/private/admin/config',
        method: 'DELETE',
      })
      expect(result.matched).toBe(false)
      expect(result.rule).toBeNull()
      expect(result.cacheControl).toBeNull()
    })
  })

  // ══════════════════════════════════════
  // 👥 HR · 人员权限相关（谁有权限创建/删除规则）
  // ══════════════════════════════════════
  describe(`👥 ${ROLES.HR} · 规则权限与操作溯源`, () => {
    let env: ReturnType<typeof createEnv>

    beforeEach(() => {
      env = createEnv()
    })

    it('👥[正常] HR 模拟管理员创建并确认规则存在', async () => {
      const { controller } = env
      await controller.createRule({
        name: 'API 报告缓存',
        urlPattern: '/api/reports/:id',
        strategy: 'private',
        maxAge: 60,
      })
      const rules = await controller.listRules()
      expect(rules.items.length).toBeGreaterThanOrEqual(1)
      expect(rules.items.some((r) => r.name === 'API 报告缓存')).toBe(true)
    })

    it('👥[边界] HR 模拟无法删除不存在规则', async () => {
      const { controller } = env
      await expect(
        (async () => {
          await controller.deleteRule('non-existent-rule-000')
        })(),
      ).rejects.toThrow()
    })
  })

  // ══════════════════════════════════════
  // 🔧 安监 · 缓存安全策略 & 失效
  // ══════════════════════════════════════
  describe(`🔧 ${ROLES.Security} · 缓存安全策略 & 失效`, () => {
    let env: ReturnType<typeof createEnv>

    beforeEach(() => {
      env = createEnv()
    })

    it('🔧[正常] 安监创建 no-store 安全策略并触发失效', async () => {
      const { controller } = env
      // 创建敏感路径 no-store 规则
      await controller.createRule({
        name: '用户敏感数据',
        urlPattern: '/api/user/*/profile',
        strategy: 'no-store',
        maxAge: 0,
      })
      // 主动失效缓存
      const invResult = await controller.invalidate({
        mode: 'pattern',
        target: '/api/user/*/profile',
      })
      expect(invResult).toBeDefined()
      expect(invResult.mode).toBe('pattern')
      expect(invResult.status).toBe('completed')
      expect(invResult.affectedEntries).toBeGreaterThanOrEqual(0)
    })

    it('🔧[边界] 安监禁止创建空 urlPattern 规则', async () => {
      const { controller } = env
      await expect(
        (async () => {
          await controller.createRule({
            name: '空模式',
            urlPattern: '',
            maxAge: 100,
          } as any)
        })(),
      ).rejects.toThrow()
    })
  })

  // ══════════════════════════════════════
  // 🎮 导玩员 · 边缘节点状态查看
  // ══════════════════════════════════════
  describe(`🎮 ${ROLES.Guide} · 边缘节点状态查看`, () => {
    let env: ReturnType<typeof createEnv>

    beforeEach(() => {
      env = createEnv()
    })

    it('🎮[正常] 导玩员查看边缘节点列表', async () => {
      const { service, controller } = env
      // 添加两个节点
      await controller.addNode({
        name: 'edge-cn-shanghai-01',
        region: 'cn-shanghai',
        endpoint: 'https://sh1.cdn.example.com',
        capacityBytes: 1_000_000_000,
      })
      await controller.addNode({
        name: 'edge-cn-beijing-01',
        region: 'cn-beijing',
        endpoint: 'https://bj1.cdn.example.com',
        capacityBytes: 2_000_000_000,
      })
      const nodes = await controller.listNodes()
      expect(nodes.items.length).toBeGreaterThanOrEqual(2)

      const stats = await controller.nodeStats()
      expect(stats.totalNodes).toBeGreaterThanOrEqual(2)
      expect(stats.onlineNodes).toBeGreaterThanOrEqual(2)
      expect(stats.totalCapacityBytes).toBeGreaterThanOrEqual(3_000_000_000)
    })

    it('🎮[边界] 导玩员查看空节点列表', async () => {
      const { service, controller } = env
      const nodes = await controller.listNodes()
      expect(nodes.items).toEqual([])

      const stats = await controller.nodeStats()
      expect(stats.totalNodes).toBe(0)
      expect(stats.onlineNodes).toBe(0)
    })
  })

  // ══════════════════════════════════════
  // 🎯 运行专员 · 缓存命中率 & 性能指标
  // ══════════════════════════════════════
  describe(`🎯 ${ROLES.Operations} · 缓存命中率 & 性能指标`, () => {
    let env: ReturnType<typeof createEnv>

    beforeEach(() => {
      env = createEnv()
    })

    it('🎯[正常] 运行专员记录命中并查看命中率', async () => {
      const { service, controller } = env
      // 创建规则
      await controller.createRule({
        name: '热门资源',
        urlPattern: '/hot/*',
        strategy: 'public',
        maxAge: 3600,
      })
      // 记录多次命中
      service.recordHit('t-cdn-role-001')
      service.recordHit('t-cdn-role-001')
      service.recordMiss('t-cdn-role-001')
      const hitRate = service.getHitRate('t-cdn-role-001')
      expect(hitRate).toBeCloseTo(2 / 3, 2)
    })

    it('🎯[边界] 运行专员空租户命中率为 0', async () => {
      const { service, controller } = env
      const hitRate = service.getHitRate('t-empty-tenant')
      expect(hitRate).toBe(0)
    })
  })

  // ══════════════════════════════════════
  // 🤝 团建 · 跨规则协作 & 多租户隔离
  // ══════════════════════════════════════
  describe(`🤝 ${ROLES.Teambuilding} · 多规则协作 & 隔离`, () => {
    let env: ReturnType<typeof createEnv>

    beforeEach(() => {
      env = createEnv()
    })

    it('🤝[正常] 团建创建多条互补规则', async () => {
      const { controller } = env
      await controller.createRule({
        name: '图片缓存',
        urlPattern: '*.jpg',
        strategy: 'public',
        maxAge: 86400,
      })
      await controller.createRule({
        name: 'JS 缓存',
        urlPattern: '*.js',
        strategy: 'immutable',
        maxAge: 31536000,
      })
      await controller.createRule({
        name: 'API 缓存',
        urlPattern: '/api/v1/*',
        strategy: 'private',
        maxAge: 60,
      })
      const rules = await controller.listRules()
      expect(rules.items.length).toBeGreaterThanOrEqual(3)
      // 验证匹配: 非特殊路径应匹配一般规则
      const matchResult1 = await controller.match({ url: '/api/v1/users', method: 'GET' })
      expect(matchResult1.matched).toBe(true)
    })

    it('🤝[边界] 团建禁用规则后不应该被匹配', async () => {
      const { service, controller } = env
      const rule = await controller.createRule({
        name: '临时禁用',
        urlPattern: '/temp/*',
        strategy: 'public',
        maxAge: 60,
      })
      // 禁用
      await controller.updateRule(rule.id, { enabled: false })
      const result = await controller.match({ url: '/temp/123', method: 'GET' })
      expect(result.matched).toBe(false)
    })
  })

  // ══════════════════════════════════════
  // 📢 营销 · 营销素材缓存 & 失效管理
  // ══════════════════════════════════════
  describe(`📢 ${ROLES.Marketing} · 营销素材缓存管理`, () => {
    let env: ReturnType<typeof createEnv>

    beforeEach(() => {
      env = createEnv()
    })

    it('📢[正常] 营销人员创建营销素材缓存规则', async () => {
      const { controller } = env
      const rule = await controller.createRule({
        name: '促销活动页',
        urlPattern: '/promo/2026-summer/*',
        strategy: 'public',
        maxAge: 600,
        cacheableStatusCodes: [200, 301],
        enableETag: true,
      })
      expect(rule.name).toBe('促销活动页')
      expect(rule.cacheableStatusCodes).toContain(200)
      expect(rule.enableETag).toBe(true)
    })

    it('📢[边界] 营销人员更新活动素材后主动失效旧缓存', async () => {
      const { service, controller } = env
      await controller.createRule({
        name: '首页 Banner',
        urlPattern: '/banner/*',
        strategy: 'public',
        maxAge: 3600,
      })

      // 添加一些缓存条目模拟已被缓存
      service.addCacheEntryForTesting({
        key: 'banner-summer',
        ruleId: 'test-rule',
        edgeNodeId: 'edge-test',
        url: '/banner/summer-2026.jpg',
        statusCode: 200,
        sizeBytes: 50000,
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        hitCount: 10,
        etag: 'W/"abc123"',
      })

      // 主动失效 banner 缓存
      const invResult = await controller.invalidate({
        mode: 'pattern',
        target: '/banner/*',
      })
      expect(invResult.status).toBe('completed')
      expect(invResult.affectedEntries).toBeGreaterThanOrEqual(1)
    })
  })
})
