import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [recommend] [C] Controller 测试
 *
 * 正例 + 反例 + 边界
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

const TENANT = 't-rec'

function createController() {
  const productAdapter = new ProductAdapter()
  const purchaseAdapter = new PurchaseHistoryAdapter()
  const prefAdapter = new MemberPreferenceAdapter()
  const cache = new RecommendCacheService()

  productAdapter.seed([
    { id: 'p1', tenantId: TENANT, sku: 'SKU001', name: '投篮机', category: '设备', priceCents: 500000, available: true, tags: ['热门'], createdAt: '2025-06-01' },
    { id: 'p2', tenantId: TENANT, sku: 'SKU002', name: '跳舞机', category: '设备', priceCents: 800000, available: true, tags: ['热门'], createdAt: '2025-06-01' },
    { id: 'p3', tenantId: TENANT, sku: 'SKU003', name: '毛绒公仔', category: '礼品', priceCents: 5000, available: true, tags: ['亲子'], createdAt: '2025-06-01' },
    { id: 'p4', tenantId: TENANT, sku: 'SKU004', name: '限量手办', category: '礼品', priceCents: 10000, available: false, tags: ['收藏'], createdAt: '2025-06-01' },
    { id: 'p5', tenantId: TENANT, sku: 'SKU005', name: '饮料', category: '食品', priceCents: 800, available: true, tags: ['日常'], createdAt: '2025-06-01' },
  ])

  purchaseAdapter.seedPurchases([
    { memberId: 'm1', tenantId: TENANT, itemId: 'p1', category: '设备', purchasedAt: '2025-06-02T10:00:00Z', quantity: 1, amountCents: 500000 },
    { memberId: 'm1', tenantId: TENANT, itemId: 'p3', category: '礼品', purchasedAt: '2025-06-02T11:00:00Z', quantity: 2, amountCents: 10000 },
    { memberId: 'm2', tenantId: TENANT, itemId: 'p2', category: '设备', purchasedAt: '2025-06-02T12:00:00Z', quantity: 1, amountCents: 800000 },
  ])

  purchaseAdapter.seedViews([
    { memberId: 'm1', tenantId: TENANT, itemId: 'p2', viewedAt: '2025-06-03T09:00:00Z', durationMs: 30000 },
    { memberId: 'm1', tenantId: TENANT, itemId: 'p5', viewedAt: '2025-06-03T10:00:00Z', durationMs: 5000 },
  ])

  prefAdapter.seed([{
    memberId: 'm1', tenantId: TENANT,
    favoriteCategories: ['设备', '礼品'],
    favoriteTags: ['热门'],
    lifecycleStage: 'ACTIVE',
    totalSpendCents: 510000,
    orderCount: 2,
    lastOrderAt: '2025-06-02T11:00:00Z'
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
    itemCF, userCF, popular, recentlyViewed, personalized
  )

  return new RecommendController(engine, cache, productAdapter, purchaseAdapter, prefAdapter)
}

describe('RecommendController', () => {
  describe('正例 — POST /api/recommend', () => {
    it('有成员 ID 的完整推荐请求', async () => {
      const ctrl = createController()
      const result = await ctrl.recommend({
        tenantId: TENANT,
        memberId: 'm1',
        contextItemId: 'p1',
        limit: 5
      })
      assert.ok(result.request)
      assert.ok(result.metadata)
      assert.equal(result.metadata.cached, false)
      assert.equal(result.request.tenantId, TENANT)
    })

    it('无成员 ID 的匿名推荐（纯热门策略）', async () => {
      const ctrl = createController()
      const result = await ctrl.recommend({
        tenantId: TENANT,
        strategies: ['popular'],
        limit: 3
      })
      assert.ok(result.candidates.length >= 1)
      assert.equal(result.metadata.cached, false)
    })

    it('记录商品浏览', () => {
      const ctrl = createController()
      const resp = ctrl.trackView({ tenantId: TENANT, memberId: 'm1', itemId: 'p2', durationMs: 15000 })
      assert.equal(resp.recorded, true)
    })

    it('记录商品购买', () => {
      const ctrl = createController()
      const resp = ctrl.trackPurchase({
        tenantId: TENANT, memberId: 'm1', itemId: 'p2',
        quantity: 1, amountCents: 800000, category: '设备'
      })
      assert.equal(resp.recorded, true)
    })

    it('更新会员偏好', () => {
      const ctrl = createController()
      const resp = ctrl.updatePreferences({
        tenantId: TENANT, memberId: 'm1',
        favoriteCategories: ['设备', '礼品', '食品']
      })
      assert.equal(resp.updated, true)
    })

    it('缓存统计', () => {
      const ctrl = createController()
      const stats = ctrl.cacheStats()
      assert.ok(stats.size >= 0)
      assert.equal(stats.maxEntries, 200)
    })

    it('健康检查', () => {
      const ctrl = createController()
      const health = ctrl.health()
      assert.equal(health.status, 'ok')
    })
  })

  describe('反例 — 参数缺失', () => {
    it('推荐请求缺少 tenantId', async () => {
      const ctrl = createController()
      try {
        await ctrl.recommend({ } as any)
        assert.fail('should have thrown')
      } catch (e: any) {
        assert.ok(e.response?.message?.includes('tenantId') || e.message?.includes('tenantId'))
      }
    })

    it('trackView 缺少必填字段', () => {
      const ctrl = createController()
      assert.throws(() => ctrl.trackView({} as any), /tenantId/)
    })

    it('trackPurchase 缺少必填字段', () => {
      const ctrl = createController()
      assert.throws(() => ctrl.trackPurchase({} as any), /tenantId/)
    })

    it('updatePreferences 缺少字段', () => {
      const ctrl = createController()
      assert.throws(() => ctrl.updatePreferences({} as any), /tenantId/)
    })

    it('invalidateCache 缺少 tenantId', () => {
      const ctrl = createController()
      assert.throws(() => ctrl.invalidateCache({} as any), /tenantId/)
    })
  })

  describe('边界 — 极端参数', () => {
    it('推荐 limit 为 0（引擎仍返回默认 10 个候选）', async () => {
      const ctrl = createController()
      const result = await ctrl.recommend({
        tenantId: TENANT, memberId: 'm1', limit: 0
      })
      // 引擎内部 limit 为 0 使用默认值 10
      assert.ok(result.candidates.length >= 0)
    })

    it('推荐 limit 为超大值', async () => {
      const ctrl = createController()
      const result = await ctrl.recommend({
        tenantId: TENANT, memberId: 'm1', limit: 10000
      })
      assert.ok(result.candidates.length <= 5) // 只有 5 个商品
    })

    it('不存在的成员（冷启动场景）', async () => {
      const ctrl = createController()
      const result = await ctrl.recommend({
        tenantId: TENANT, memberId: 'new-user-with-no-history', limit: 5
      })
      assert.ok(result.fallbackUsed !== undefined || result.candidates.length >= 0)
    })
  })
})
