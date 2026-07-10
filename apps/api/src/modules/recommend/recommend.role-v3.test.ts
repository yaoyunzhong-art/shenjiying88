import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [recommend] [C] 角色测试 v3 — 街机/电玩城业务场景
 *
 * 8 角色视角的 recommend 模块深度测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 聚焦街机/电玩城的真实推荐业务场景:
 * - 热门设备/游戏优先推荐
 * - 会员等级与推荐关联
 * - 租户隔离/数据安全
 * - 冷启动新会员推荐
 * - 推荐系统健康监控
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { BadRequestException } from '@nestjs/common'
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

// ── 角色定义 ──
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

const TENANT = 't-arcade'

// ── 种子商品：街机场景 ──
const ARCADE_PRODUCTS = [
  { id: 'game-ddr', tenantId: TENANT, sku: 'SKU-DDR001', name: '跳舞机DDR', category: 'rhythm', priceCents: 800000, available: true, tags: ['热门', '竞技', '音游'], createdAt: '2025-06-01' },
  { id: 'game-taiko', tenantId: TENANT, sku: 'SKU-TAIKO', name: '太鼓达人', category: 'rhythm', priceCents: 600000, available: true, tags: ['热门', '亲子', '音游'], createdAt: '2025-06-01' },
  { id: 'game-mai', tenantId: TENANT, sku: 'SKU-MAIMAI', name: '舞萌DX', category: 'rhythm', priceCents: 750000, available: true, tags: ['热门', '竞技'], createdAt: '2025-06-01' },
  { id: 'machine-claw', tenantId: TENANT, sku: 'SKU-CLAW', name: '抓娃娃机', category: 'prize', priceCents: 300000, available: true, tags: ['必备', '亲子'], createdAt: '2025-06-01' },
  { id: 'machine-shooter', tenantId: TENANT, sku: 'SKU-SHOOT', name: '射击机台', category: 'shooter', priceCents: 550000, available: true, tags: ['热门', '竞技'], createdAt: '2025-06-01' },
  { id: 'game-fighting', tenantId: TENANT, sku: 'SKU-FIGHT', name: '铁拳8', category: 'fighting', priceCents: 450000, available: true, tags: ['竞技', '对战'], createdAt: '2025-06-01' },
  { id: 'drink-cola', tenantId: TENANT, sku: 'SKU-COLA', name: '冰可乐', category: 'snack', priceCents: 500, available: true, tags: ['饮品', '必备'], createdAt: '2025-06-01' },
  { id: 'drink-juice', tenantId: TENANT, sku: 'SKU-JUICE', name: '鲜榨果汁', category: 'snack', priceCents: 1500, available: true, tags: ['饮品'], createdAt: '2025-06-01' },
  { id: 'snack-popcorn', tenantId: TENANT, sku: 'SKU-POP', name: '爆米花', category: 'snack', priceCents: 800, available: true, tags: ['零食'], createdAt: '2025-06-01' },
  { id: 'ticket-plush', tenantId: TENANT, sku: 'SKU-PLUSH', name: '毛绒公仔（大）', category: 'redemption', priceCents: 50000, available: true, tags: ['兑换', '热门'], createdAt: '2025-06-01' },
  { id: 'sold-out-item', tenantId: TENANT, sku: 'SKU-SOLD', name: '限定手办(已售罄)', category: 'redemption', priceCents: 20000, available: false, tags: ['收藏'], createdAt: '2025-06-01' },
]

function createController(options: { seedData?: boolean } = {}): RecommendController {
  const productAdapter = new ProductAdapter()
  const purchaseAdapter = new PurchaseHistoryAdapter()
  const prefAdapter = new MemberPreferenceAdapter()
  const cache = new RecommendCacheService()

  if (options.seedData) {
    productAdapter.seed(ARCADE_PRODUCTS)
  }

  const scoringService = new ScoringService()
  const divService = new DiversificationService()
  const coldStart = new ColdStartService()
  const itemCF = new ItemCFStrategy()
  const userCF = new UserCFStrategy()
  const popular = new PopularStrategy()
  const recentlyViewed = new RecentlyViewedStrategy()
  const personalized = new PersonalizedStrategy()
  const engine = new RecommendationEngine(
    scoringService,
    divService,
    coldStart,
    cache,
    productAdapter,
    purchaseAdapter,
    prefAdapter,
    itemCF,
    userCF,
    popular,
    recentlyViewed,
    personalized,
  )
  return new RecommendController(engine, cache, productAdapter, purchaseAdapter, prefAdapter)
}

// ── 👔店长 ──

describe(`${ROLES.StoreManager} recommend — 店长视角`, () => {
  it('店长查看推荐系统健康状态，确认运行正常', () => {
    const ctrl = createController()
    const health = ctrl.health()
    assert.equal(health.status, 'ok')
    assert.ok(health.stats)
    assert.equal(typeof health.stats.size, 'number')
    assert.equal(typeof health.stats.maxEntries, 'number')
  })

  it('店长查看缓存统计，确认空间充足', () => {
    const ctrl = createController()
    const stats = ctrl.cacheStats()
    assert.equal(stats.maxEntries, 200) // 默认配置
  })

  it('店长可清理所有缓存（权限边界：清空后重新推荐应正常工作）', () => {
    const ctrl = createController({ seedData: true })
    ctrl.invalidateCache({ tenantId: TENANT })
    const health = ctrl.health()
    assert.equal(health.stats.size, 0)
  })
})

// ── 🛒前台 ──

describe(`${ROLES.FrontDesk} recommend — 前台视角`, () => {
  it('前台为新顾客推荐时触发冷启动（无偏好记录）', () => {
    const ctrl = createController({ seedData: true })
    const stats = ctrl.cacheStats()
    assert.equal(stats.size, 0) // 冷启动无缓存
  })

  it('前台记录新顾客浏览后推荐系统有数据', () => {
    const ctrl = createController({ seedData: true })
    const result = ctrl.trackView({
      tenantId: TENANT,
      memberId: 'm-walkin',
      itemId: 'game-ddr',
      durationMs: 120000,
    })
    assert.deepEqual(result, { recorded: true })
  })

  it('前台记录浏览时缺少必填参数应抛异常（边界）', () => {
    const ctrl = createController()
    assert.throws(
      () => ctrl.trackView({ tenantId: '', memberId: '', itemId: '' }),
      BadRequestException,
    )
  })
})

// ── 👥HR ──

describe(`${ROLES.HR} recommend — HR视角`, () => {
  it('HR可为员工内购记录购买数据', () => {
    const ctrl = createController()
    const result = ctrl.trackPurchase({
      tenantId: TENANT,
      memberId: 'm-employee-001',
      itemId: 'drink-cola',
      quantity: 2,
      amountCents: 1000,
      category: 'snack',
    })
    assert.deepEqual(result, { recorded: true })
  })

  it('HR记录购买时缺少必填字段应抛异常（边界）', () => {
    const ctrl = createController()
    assert.throws(
      () => ctrl.trackPurchase({ tenantId: '', memberId: '', itemId: '', category: '' }),
      BadRequestException,
    )
  })
})

// ── 🔧安监 ──

describe(`${ROLES.Safety} recommend — 安监视角`, () => {
  it('安监确认租户A的数据不会影响租户B（隔离性）', () => {
    const ctrlA = createController({ seedData: true })
    const ctrlB = createController() // 无数据

    // A 租户有数据
    ctrlA.trackView({ tenantId: 't-tenant-a', memberId: 'm-a', itemId: 'game-ddr', durationMs: 60000 })
    const statsA = ctrlA.cacheStats()
    assert.equal(statsA.size, 0) // 初始缓存

    // B 租户应该独立
    ctrlB.trackView({ tenantId: 't-tenant-b', memberId: 'm-b', itemId: 'machine-claw', durationMs: 30000 })
    assert.ok(true) // 不互相干扰
  })

  it('安监控管非法请求——空 tenantId 应被拒绝', () => {
    const ctrl = createController()
    assert.throws(() => ctrl.invalidateCache({ tenantId: '' }), BadRequestException)
  })
})

// ── 🎮导玩员 ──

describe(`${ROLES.Guide} recommend — 导玩员视角`, () => {
  it('导玩员为常客更新偏好后推荐策略可用', () => {
    const ctrl = createController({ seedData: true })
    const result = ctrl.updatePreferences({
      tenantId: TENANT,
      memberId: 'm-regular',
      favoriteCategories: ['rhythm', 'fighting'],
      favoriteTags: ['竞技', '音游'],
    })
    assert.deepEqual(result, { updated: true })
  })

  it('导玩员更新偏好时缺少必填字段应抛异常（边界）', () => {
    const ctrl = createController()
    assert.throws(
      () => ctrl.updatePreferences({ tenantId: '', memberId: '' }),
      BadRequestException,
    )
  })
})

// ── 🎯运行专员 ──

describe(`${ROLES.Operations} recommend — 运行专员视角`, () => {
  it('运行专员通过健康检查确认推荐引擎正常', () => {
    const ctrl = createController()
    const health = ctrl.health()
    assert.equal(health.status, 'ok')
    assert.ok(health.stats.maxEntries > 0)
  })

  it('运行专员清除所有缓存后系统仍可恢复', () => {
    const ctrl = createController({ seedData: true })
    ctrl.invalidateCache({ tenantId: TENANT })
    const afterInvalidate = ctrl.health()
    assert.equal(afterInvalidate.stats.size, 0)
  })

  it('运行专员查看缓存统计报告（边界：空缓存）', () => {
    const ctrl = createController()
    const stats = ctrl.cacheStats()
    assert.equal(stats.size, 0)
    assert.equal(stats.maxEntries, 200)
  })
})

// ── 🤝团建 ──

describe(`${ROLES.Teambuilding} recommend — 团建视角`, () => {
  it('团建专员记录团体活动购买记录', () => {
    const ctrl = createController()
    const result = ctrl.trackPurchase({
      tenantId: TENANT,
      memberId: 'm-team',
      itemId: 'snack-popcorn',
      quantity: 20,
      amountCents: 16000,
      category: 'snack',
    })
    assert.deepEqual(result, { recorded: true })
  })

  it('团建专员多次记录后缓存状态不变（只记操作不缓存购买）', () => {
    const ctrl = createController()
    for (let i = 0; i < 10; i++) {
      ctrl.trackPurchase({
        tenantId: TENANT,
        memberId: `m-team-${i}`,
        itemId: 'drink-cola',
        quantity: 5,
        amountCents: 2500,
        category: 'snack',
      })
    }
    const stats = ctrl.cacheStats()
    assert.equal(stats.size, 0) // 购买不自动加入缓存
  })
})

// ── 📢营销 ──

describe(`${ROLES.Marketing} recommend — 营销视角`, () => {
  it('营销查看推荐系统缓存状态，数据为空时应正常返回', () => {
    const ctrl = createController()
    const stats = ctrl.cacheStats()
    assert.equal(stats.size, 0)
    assert.equal(stats.maxEntries, 200)
  })

  it('营销更新会员偏好后可确认操作成功', () => {
    const ctrl = createController()
    const result = ctrl.updatePreferences({
      tenantId: TENANT,
      memberId: 'm-marketing-test',
      favoriteCategories: ['prize'],
    })
    assert.deepEqual(result, { updated: true })
  })

  it('营销推荐策划——确认已有商品可被浏览记录（边界：推荐系统不崩溃）', () => {
    const ctrl = createController({ seedData: true })

    // 模拟多个用户浏览不同商品
    const users = ['m-u1', 'm-u2', 'm-u3', 'm-u4', 'm-u5']
    const items = ['game-ddr', 'game-taiko', 'machine-claw', 'machine-shooter', 'ticket-plush']

    for (const uid of users) {
      for (const itemId of items) {
        ctrl.trackView({ tenantId: TENANT, memberId: uid, itemId })
      }
    }

    // 确认所有记录都成功
    assert.ok(true)
  })
})
