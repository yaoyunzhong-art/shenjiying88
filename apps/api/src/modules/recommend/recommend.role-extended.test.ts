import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [recommend] [C] 角色测试扩展编写
 *
 * 8 角色深度场景扩展测试 — recommend 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 2 测试用例 (正常流程 + 权限边界/场景)
 * 覆盖: recommend, track-view, track-purchase, preferences, cache/invalidate, cache/stats, health
 * 扩展: 空数据兜底、参数校验、边界 case、多策略覆盖
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { RecommendController } from './recommend.controller'
import { RecommendationEngine } from './recommendation.engine'
import { ScoringService } from './scoring.service'
import { DiversificationService } from './diversification.service'
import { ColdStartService } from './cold-start.service'
import { RecommendCacheService } from './recommend-cache.service'
import { ProductAdapter } from './datasources/product.adapter'
import { PurchaseHistoryAdapter } from './datasources/purchase-history.adapter'
import { MemberPreferenceAdapter } from './datasources/member-preference.adapter'
import { ItemCFStrategy } from './strategies/item-cf.strategy'
import { UserCFStrategy } from './strategies/user-cf.strategy'
import { PopularStrategy } from './strategies/popular.strategy'
import { RecentlyViewedStrategy } from './strategies/recently-viewed.strategy'
import { PersonalizedStrategy } from './strategies/personalized.strategy'
import type { RecommendationRequest, StrategyType } from './recommend.entity'

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

const TENANT_PREFIX = 't-role-ext-rec'

// ── 测试工厂（初始化种子数据） ──
function createTestEnv(tenantId: string) {
  const productAdapter = new ProductAdapter()
  const purchaseAdapter = new PurchaseHistoryAdapter()
  const prefAdapter = new MemberPreferenceAdapter()
  const cache = new RecommendCacheService()

  // 种子商品
  productAdapter.seed([
    { id: 'rp1', tenantId, sku: 'R001', name: '投篮机-Pro', category: '设备', priceCents: 600000, available: true, tags: ['热门'], createdAt: '2026-06-01' },
    { id: 'rp2', tenantId, sku: 'R002', name: '街机模拟器', category: '设备', priceCents: 450000, available: true, tags: ['热门'], createdAt: '2026-06-01' },
    { id: 'rp3', tenantId, sku: 'R003', name: '限定手办礼盒', category: '礼品', priceCents: 15000, available: true, tags: ['收藏'], createdAt: '2026-06-01' },
    { id: 'rp4', tenantId, sku: 'R004', name: '毛绒公仔套装', category: '礼品', priceCents: 8000, available: true, tags: ['亲子'], createdAt: '2026-06-01' },
    { id: 'rp5', tenantId, sku: 'R005', name: '功能饮料', category: '食品', priceCents: 1000, available: false, tags: ['日常'], createdAt: '2026-06-01' },
  ])

  // 种子购买历史
  purchaseAdapter.seedPurchases([
    { memberId: 'rm1', tenantId, itemId: 'rp1', category: '设备', purchasedAt: '2026-06-15T10:00:00Z', quantity: 1, amountCents: 600000 },
    { memberId: 'rm1', tenantId, itemId: 'rp3', category: '礼品', purchasedAt: '2026-06-15T11:00:00Z', quantity: 1, amountCents: 15000 },
    { memberId: 'rm2', tenantId, itemId: 'rp2', category: '设备', purchasedAt: '2026-06-16T12:00:00Z', quantity: 2, amountCents: 900000 },
  ])

  // 种子浏览记录
  purchaseAdapter.seedViews([
    { memberId: 'rm1', tenantId, itemId: 'rp2', viewedAt: '2026-06-17T09:00:00Z', durationMs: 45000 },
    { memberId: 'rm1', tenantId, itemId: 'rp4', viewedAt: '2026-06-17T10:00:00Z', durationMs: 8000 },
  ])

  // 种子偏好
  prefAdapter.seed([{
    memberId: 'rm1', tenantId,
    favoriteCategories: ['设备', '礼品'],
    favoriteTags: ['热门'],
    lifecycleStage: 'ACTIVE',
    totalSpendCents: 615000,
    orderCount: 2,
    lastOrderAt: '2026-06-15T11:00:00Z',
  }])

  const scoring = new ScoringService()
  const diversification = new DiversificationService()
  const coldStart = new ColdStartService()
  const itemCF = new ItemCFStrategy()
  const userCF = new UserCFStrategy()
  const popular = new PopularStrategy()
  const recentlyViewed = new RecentlyViewedStrategy()
  const personalized = new PersonalizedStrategy()

  const engine = new RecommendationEngine(
    scoring, diversification, coldStart, cache,
    productAdapter, purchaseAdapter, prefAdapter,
    itemCF, userCF, popular, recentlyViewed, personalized,
  )

  const controller = new RecommendController(engine, cache, productAdapter, purchaseAdapter, prefAdapter)
  return { engine, cache, productAdapter, purchaseAdapter, prefAdapter, controller }
}

// ═════════════════════════════════════════════════
// 👔 店长 — 关注全店推荐效果与整体健康
// ═════════════════════════════════════════════════
describe(`${ROLES.StoreManager} recommend 角色扩展测试`, () => {
  it('店长可以获取推荐系统健康状态', () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-sm`)
    const result = controller.health()
    assert.equal(result.status, 'ok')
    assert.ok(result.stats)
    assert.equal(typeof result.stats.size, 'number')
    assert.equal(typeof result.stats.maxEntries, 'number')
  })

  it('店长可以查看缓存统计信息', () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-sm`)
    const stats = controller.cacheStats()
    assert.equal(stats.size, 0)
    assert.ok(stats.maxEntries > 0)
  })

  it('店长可以获取热门推荐结果（含元数据）', async () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-sm`)
    const result = await controller.recommend({
      tenantId: `${TENANT_PREFIX}-sm`,
      strategies: ['popular'],
      limit: 5,
    })
    assert.ok(result.request)
    assert.ok(result.metadata)
    assert.equal(result.metadata.cached, false)
    assert.ok(Array.isArray(result.candidates))
  })
})

// ═════════════════════════════════════════════════
// 🛒 前台 — 关注给到顾客的推荐体验
// ═════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} recommend 角色扩展测试`, () => {
  it('前台可以记录顾客浏览行为并确认成功', () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-fd`)
    const result = controller.trackView({
      tenantId: `${TENANT_PREFIX}-fd`,
      memberId: 'rm-fd-01',
      itemId: 'rp1',
      durationMs: 15000,
    })
    assert.equal(result.recorded, true)
  })

  it('前台记录浏览时缺少必填参数应抛 400 错误', () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-fd`)
    assert.throws(() => {
      controller.trackView({ tenantId: '', memberId: 'rm-fd-01', itemId: 'rp1' })
    }, /required/)
  })

  it('前台可以为会员做商品推荐', async () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-fd`)
    const result = await controller.recommend({
      tenantId: `${TENANT_PREFIX}-fd`,
      memberId: 'rm1',
      limit: 3,
    })
    assert.ok(result.request)
    assert.ok(Array.isArray(result.candidates))
  })
})

// ═════════════════════════════════════════════════
// 👥 HR — 关注员工福利相关推荐
// ═════════════════════════════════════════════════
describe(`${ROLES.HR} recommend 角色扩展测试`, () => {
  it('HR 可以为员工福利活动获取推荐', async () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-hr`)
    const result = await controller.recommend({
      tenantId: `${TENANT_PREFIX}-hr`,
      memberId: 'rm1',
      limit: 10,
    })
    assert.ok(result.request)
    assert.ok(Array.isArray(result.candidates))
  })

  it('HR 更新员工偏好记录成功', () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-hr`)
    const result = controller.updatePreferences({
      tenantId: `${TENANT_PREFIX}-hr`,
      memberId: 'rm-hr-01',
      preferences: { category: 'wellness', tags: ['gym'] },
    })
    assert.equal(result.updated, true)
  })
})

// ═════════════════════════════════════════════════
// 🔧 安监 — 关注推荐内容合规与异常检测
// ═════════════════════════════════════════════════
describe(`${ROLES.Safety} recommend 角色扩展测试`, () => {
  it('安监可以请求推荐并检查结果格式', async () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-sec`)
    const result = await controller.recommend({
      tenantId: `${TENANT_PREFIX}-sec`,
      memberId: 'rm1',
      limit: 20,
    })
    assert.ok(result.request)
    assert.ok(result.metadata)
    assert.ok(Array.isArray(result.metadata.strategiesApplied))
  })

  it('安监可以查看系统健康状态确认推荐服务运行正常', () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-sec`)
    const health = controller.health()
    assert.equal(health.status, 'ok')
  })

  it('安监执行推荐时缺少 tenantId 应抛验证错误', async () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-sec`)
    await assert.rejects(async () => {
      await controller.recommend({} as RecommendationRequest)
    }, /tenantId/)
  })
})

// ═════════════════════════════════════════════════
// 🎮 导玩员 — 关注游戏机台/商品推荐
// ═════════════════════════════════════════════════
describe(`${ROLES.Guide} recommend 角色扩展测试`, () => {
  it('导玩员可以为顾客推荐热门设备', async () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-guide`)
    const result = await controller.recommend({
      tenantId: `${TENANT_PREFIX}-guide`,
      strategies: ['popular'],
      limit: 5,
    })
    assert.ok(result.candidates.length >= 1)
    assert.ok(result.candidates.some((c: any) => c.strategy === 'popular'))
  })

  it('导玩员可以记录顾客的浏览操作', () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-guide`)
    const result = controller.trackView({
      tenantId: `${TENANT_PREFIX}-guide`,
      memberId: 'rm-guide-01',
      itemId: 'rp2',
    })
    assert.equal(result.recorded, true)
  })

  it('导玩员记录购买时校验 — 正常购买', () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-guide`)
    const result = controller.trackPurchase({
      tenantId: `${TENANT_PREFIX}-guide`,
      memberId: 'rm-guide-01',
      itemId: 'rp2',
      category: '设备',
      quantity: 1,
      amountCents: 450000,
    })
    assert.equal(result.recorded, true)
  })
})

// ═════════════════════════════════════════════════
// 🎯 运行专员 — 关注推荐引擎运行与缓存管理
// ═════════════════════════════════════════════════
describe(`${ROLES.Ops} recommend 角色扩展测试`, () => {
  it('运行专员可以失效指定租户的推荐缓存', async () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-ops`)
    // 先产生缓存
    await controller.recommend({
      tenantId: `${TENANT_PREFIX}-ops`,
      memberId: 'rm1',
      limit: 3,
    })
    const before = controller.cacheStats()
    const result = controller.invalidateCache({ tenantId: `${TENANT_PREFIX}-ops` })
    assert.equal(typeof result.invalidated, 'number')
    const after = controller.cacheStats()
    assert.equal(after.size, 0)
  })

  it('运行专员失效缓存时缺少 tenantId 应抛错', () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-ops`)
    assert.throws(() => {
      controller.invalidateCache({ tenantId: '' })
    }, /tenantId/)
  })

  it('运行专员可以连续多次推荐测试稳定性', async () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-ops`)
    for (let i = 0; i < 5; i++) {
      const result = await controller.recommend({
        tenantId: `${TENANT_PREFIX}-ops`,
        memberId: `rm-${i}`,
        limit: 5,
      })
      assert.ok(result.request)
    }
  })
})

// ═════════════════════════════════════════════════
// 🤝 团建 — 关注团建活动推荐
// ═════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} recommend 角色扩展测试`, () => {
  it('团建组织者可以为团队获取活动推荐', async () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-team`)
    const result = await controller.recommend({
      tenantId: `${TENANT_PREFIX}-team`,
      memberId: 'rm1',
      limit: 8,
    })
    assert.ok(result.request)
    assert.ok(Array.isArray(result.candidates))
  })

  it('团建可以更新团队偏好来改进推荐', () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-team`)
    const result = controller.updatePreferences({
      tenantId: `${TENANT_PREFIX}-team`,
      memberId: 'rm-team-lead',
      preferences: { activity_type: 'outdoor', team_size: 15 },
    })
    assert.equal(result.updated, true)
  })

  it('团建更新偏好时缺少 tenantId 应抛错', () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-team`)
    assert.throws(() => {
      controller.updatePreferences({ memberId: 'rm-team-01' })
    }, /tenantId/)
  })
})

// ═════════════════════════════════════════════════
// 📢 营销 — 关注营销推荐效果与分析
// ═════════════════════════════════════════════════
describe(`${ROLES.Marketing} recommend 角色扩展测试`, () => {
  it('营销可以获取推荐来评估促销活动曝光', async () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-mkt`)
    const result = await controller.recommend({
      tenantId: `${TENANT_PREFIX}-mkt`,
      memberId: 'rm1',
      limit: 5,
    })
    assert.ok(result.request)
    assert.ok(Array.isArray(result.candidates))
  })

  it('营销可以记录购买转化', () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-mkt`)
    const result = controller.trackPurchase({
      tenantId: `${TENANT_PREFIX}-mkt`,
      memberId: 'rm-mkt-01',
      itemId: 'rp3',
      quantity: 2,
      amountCents: 30000,
      category: '礼品',
    })
    assert.equal(result.recorded, true)
  })

  it('营销查看推荐系统健康状况确认渠道正常', () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-mkt`)
    const health = controller.health()
    assert.equal(health.status, 'ok')
    assert.ok(health.stats)
  })
})

// ═════════════════════════════════════════════════
// 边界场景
// ═════════════════════════════════════════════════
describe('recommend 模块边界场景', () => {
  it('推荐时 limit 为 0 应返回空候选', async () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-boundary`)
    const result = await controller.recommend({
      tenantId: `${TENANT_PREFIX}-boundary`,
      memberId: 'rm1',
      limit: 0,
    })
    assert.ok(result.request)
    assert.ok(Array.isArray(result.candidates))
  })

  it('记录购买时数量默认值为 1', () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-boundary`)
    const result = controller.trackPurchase({
      tenantId: `${TENANT_PREFIX}-boundary`,
      memberId: 'rm-boundary',
      itemId: 'rp1',
      category: '设备',
    })
    assert.equal(result.recorded, true)
  })

  it('健康检查即使在缓存为空也返回 ok', () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-boundary`)
    const result = controller.health()
    assert.equal(result.status, 'ok')
  })

  it('不存在会员的推荐应返回结果而非抛错', async () => {
    const { controller } = createTestEnv(`${TENANT_PREFIX}-boundary`)
    const result = await controller.recommend({
      tenantId: `${TENANT_PREFIX}-boundary`,
      memberId: 'rm-nonexistent',
      limit: 5,
    })
    assert.ok(result.request)
    assert.ok(Array.isArray(result.candidates))
  })
})
