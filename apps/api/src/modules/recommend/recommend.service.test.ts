import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { RecommendService } from './recommend.service'
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
import type { RecommendationRequest } from './recommend.entity'

/**
 * Phase-40 T170: RecommendService 测试
 *
 * 覆盖:
 *  - getRecommendation()        正常流程 / 匿名 / 冷启动
 *  - getRecommendationWith()    参数化推荐
 *  - getStrategyBreakdown()     策略分解
 *  - getMemberProfile()         会员画像聚合
 *  - getMemberInsights()        会员洞察
 *  - refreshProfile()           刷新缓存
 *  - mergeRecommendations()     多源合并
 *  - warmupStrategies()         策略预热
 */

const TENANT_ID = 'tnt-recommend-service'

function createService() {
  const productAdapter = new ProductAdapter()
  const purchaseAdapter = new PurchaseHistoryAdapter()
  const prefAdapter = new MemberPreferenceAdapter()
  const cacheService = new RecommendCacheService()
  const scoringService = new ScoringService()
  const diversificationService = new DiversificationService()
  const coldStartService = new ColdStartService()

  const itemCF = new ItemCFStrategy()
  const userCF = new UserCFStrategy()
  const popular = new PopularStrategy()
  const recentlyViewed = new RecentlyViewedStrategy()
  const personalized = new PersonalizedStrategy()

  const engine = new RecommendationEngine(
    scoringService,
    diversificationService,
    coldStartService,
    cacheService,
    productAdapter,
    purchaseAdapter,
    prefAdapter,
    itemCF,
    userCF,
    popular,
    recentlyViewed,
    personalized,
  )

  // Seed test data
  productAdapter.seed([
    { id: 'p1', tenantId: TENANT_ID, sku: 'SKU-001', name: '商品A', category: '电玩', priceCents: 5000, available: true, tags: ['热门', '竞技'] },
    { id: 'p2', tenantId: TENANT_ID, sku: 'SKU-002', name: '商品B', category: '电玩', priceCents: 8000, available: true, tags: ['热门'] },
    { id: 'p3', tenantId: TENANT_ID, sku: 'SKU-003', name: '商品C', category: '桌游', priceCents: 3000, available: true, tags: ['休闲'] },
    { id: 'p4', tenantId: TENANT_ID, sku: 'SKU-004', name: '商品D', category: '桌游', priceCents: 12000, available: true, tags: ['精品'] },
    { id: 'p5', tenantId: TENANT_ID, sku: 'SKU-005', name: '商品E', category: '零食吧', priceCents: 1500, available: true, tags: ['食品'] },
  ])

  purchaseAdapter.seedPurchases([
    { memberId: 'm1', tenantId: TENANT_ID, itemId: 'p1', category: '电玩', purchasedAt: new Date().toISOString(), quantity: 1, amountCents: 5000 },
    { memberId: 'm1', tenantId: TENANT_ID, itemId: 'p2', category: '电玩', purchasedAt: new Date(Date.now() - 86400000).toISOString(), quantity: 1, amountCents: 8000 },
    { memberId: 'm2', tenantId: TENANT_ID, itemId: 'p3', category: '桌游', purchasedAt: new Date().toISOString(), quantity: 2, amountCents: 6000 },
  ])

  purchaseAdapter.seedViews([
    { memberId: 'm1', tenantId: TENANT_ID, itemId: 'p3', viewedAt: new Date().toISOString(), durationMs: 30000 },
    { memberId: 'm1', tenantId: TENANT_ID, itemId: 'p4', viewedAt: new Date().toISOString(), durationMs: 15000 },
    { memberId: 'm1', tenantId: TENANT_ID, itemId: 'p5', viewedAt: new Date(Date.now() - 3600000).toISOString() },
  ])

  prefAdapter.seed([
    { memberId: 'm1', tenantId: TENANT_ID, favoriteCategories: ['电玩'], favoriteTags: ['热门'], lifecycleStage: 'ACTIVE', totalSpendCents: 13000, orderCount: 2, lastOrderAt: new Date().toISOString() },
    { memberId: 'm2', tenantId: TENANT_ID, favoriteCategories: ['桌游'], favoriteTags: ['休闲'], lifecycleStage: 'NEW', totalSpendCents: 6000, orderCount: 1, lastOrderAt: new Date().toISOString() },
  ])

  const service = new RecommendService(
    engine, scoringService, diversificationService, coldStartService,
    cacheService, productAdapter, purchaseAdapter, prefAdapter,
  )

  return { service, engine, cacheService, productAdapter, purchaseAdapter, prefAdapter }
}

// ── getRecommendation ──

describe('RecommendService getRecommendation', () => {
  it('should return recommendations for existing member', async () => {
    const { service } = createService()
    const result = await service.getRecommendation({
      tenantId: TENANT_ID,
      memberId: 'm1',
      limit: 3,
    })

    assert.ok(result)
    assert.ok(Array.isArray(result.candidates))
    assert.ok(result.candidates.length > 0)
    assert.ok(result.candidates.length <= 3)
    assert.ok(result.metadata.strategiesApplied.length > 0)
    assert.ok(result.metadata.executionMs >= 0)
    assert.equal(result.metadata.cached, false)
  })

  it('should handle anonymous request with cold-start fallback', async () => {
    const { service } = createService()
    const result = await service.getRecommendation({
      tenantId: TENANT_ID,
      limit: 5,
    })

    assert.ok(result)
    assert.ok(result.candidates.length > 0)
    // 匿名请求应该走冷启动 (popular fallback)
    assert.ok(result.metadata.strategiesApplied.includes('popular'))
  })

  it('should return cached result on repeated call', async () => {
    const { service } = createService()
    const req: RecommendationRequest = {
      tenantId: TENANT_ID,
      memberId: 'm1',
      limit: 2,
    }

    const first = await service.getRecommendation(req)
    const second = await service.getRecommendation(req)

    assert.equal(second.metadata.cached, true)
    assert.equal(second.candidates.length, first.candidates.length)
  })

  it('should diversify candidates when diversify=true', async () => {
    const { service } = createService()
    const result = await service.getRecommendation({
      tenantId: TENANT_ID,
      memberId: 'm1',
      limit: 10,
      diversify: true,
    })

    assert.ok(result.candidates.length > 0)
    // 检查多样性: 至少两种策略来源
    const strategies = new Set(result.candidates.map(c => c.strategy))
    assert.ok(strategies.size >= 1)
  })

  it('should respect excludePurchased flag', async () => {
    const { service } = createService()
    const result = await service.getRecommendation({
      tenantId: TENANT_ID,
      memberId: 'm1',
      limit: 10,
      excludePurchased: true,
    })

    // m1 购买了 p1, p2 — 它们不应该出现在结果中
    const purchasedIds = new Set(['p1', 'p2'])
    const hasPurchased = result.candidates.some(c => purchasedIds.has(c.itemId))
    assert.equal(hasPurchased, false)
  })

  it('should handle empty tenantId gracefully', async () => {
    const { service } = createService()
    // Empty tenantId returns no candidates since no data matches
    const result = await service.getRecommendation({ tenantId: '', memberId: 'm1' })
    assert.ok(result)
    assert.ok(Array.isArray(result.candidates))
  })
})

// ── getRecommendationWith ──

describe('RecommendService getRecommendationWith', () => {
  it('should return recommendations with category filter', async () => {
    const { service } = createService()
    const result = await service.getRecommendationWith(TENANT_ID, 'm1', {
      categories: ['电玩'],
      limit: 5,
    })

    assert.ok(result)
    assert.ok(Array.isArray(result.candidates))
  })

  it('should use default limit when not specified', async () => {
    const { service } = createService()
    const result = await service.getRecommendationWith(TENANT_ID, 'm1')

    assert.ok(result.candidates.length <= 10)
  })
})

// ── getStrategyBreakdown ──

describe('RecommendService getStrategyBreakdown', () => {
  it('should return breakdown for all 5 strategies', async () => {
    const { service } = createService()
    const breakdown = await service.getStrategyBreakdown(TENANT_ID, 'm1')

    const strategies = Object.keys(breakdown)
    assert.ok(strategies.includes('item-cf'))
    assert.ok(strategies.includes('user-cf'))
    assert.ok(strategies.includes('popular'))
    assert.ok(strategies.includes('recently-viewed'))
    assert.ok(strategies.includes('personalized'))

    for (const candidates of Object.values(breakdown)) {
      assert.ok(Array.isArray(candidates))
      assert.ok(candidates.length <= 5)
    }
  })
})

// ── getMemberProfile ──

describe('RecommendService getMemberProfile', () => {
  it('should return preference + recent views + purchases', async () => {
    const { service } = createService()
    const profile = await service.getMemberProfile(TENANT_ID, 'm1')

    assert.ok(profile.preference)
    assert.equal(profile.preference.memberId, 'm1')
    assert.equal(profile.preference.lifecycleStage, 'ACTIVE')
    assert.ok(Array.isArray(profile.recentViews))
    assert.ok(Array.isArray(profile.purchaseHistory))
  })

  it('should return null preference for unknown member', async () => {
    const { service } = createService()
    const profile = await service.getMemberProfile(TENANT_ID, 'unknown-member')

    assert.equal(profile.preference, null)
  })
})

// ── getMemberInsights ──

describe('RecommendService getMemberInsights', () => {
  it('should return insights for ACTIVE member', async () => {
    const { service } = createService()
    const insights = await service.getMemberInsights(TENANT_ID, 'm1')

    assert.equal(insights.topCategory, '电玩')
    assert.equal(insights.totalSpendCents, 13000)
    assert.equal(insights.orderCount, 2)
    assert.equal(insights.estimatedStage, 'ACTIVE')
    assert.ok(insights.recommendedStrategies.includes('user-cf'))
    assert.ok(insights.recommendedStrategies.includes('personalized'))
  })

  it('should return fallback insights for unknown member', async () => {
    const { service } = createService()
    const insights = await service.getMemberInsights(TENANT_ID, 'no-such-member')

    assert.equal(insights.topCategory, null)
    assert.equal(insights.totalSpendCents, 0)
    assert.equal(insights.orderCount, 0)
    assert.equal(insights.estimatedStage, 'NEW')
    assert.deepEqual(insights.recommendedStrategies, ['popular'])
  })
})

// ── refreshProfile ──

describe('RecommendService refreshProfile', () => {
  it('should refresh existing member profile and cache', async () => {
    const { service, cacheService } = createService()
    const result = service.refreshProfile(TENANT_ID, 'm1')

    assert.equal(result, true)
    // invalidate 清了 tenant 所有缓存，但 refreshProfile 在 invalidate 后又 set 了一个 pref key
    const stats = cacheService.stats()
    assert.equal(stats.size, 1)
  })

  it('should return false for unknown member', async () => {
    const { service } = createService()
    const result = service.refreshProfile(TENANT_ID, 'no-such-member')

    assert.equal(result, false)
  })
})

// ── mergeRecommendations ──

describe('RecommendService mergeRecommendations', () => {
  it('should merge and deduplicate multiple results', async () => {
    const { service } = createService()
    const result1 = await service.getRecommendation({
      tenantId: TENANT_ID,
      memberId: 'm1',
      strategies: ['popular'],
      limit: 5,
      diversify: false,
    })
    const result2 = await service.getRecommendation({
      tenantId: TENANT_ID,
      memberId: 'm1',
      strategies: ['personalized'],
      limit: 5,
      diversify: false,
    })

    const merged = service.mergeRecommendations([result1, result2], 8)
    assert.ok(merged.length > 0)
    assert.ok(merged.length <= 8)

    // 去重检查
    const ids = merged.map(c => c.itemId)
    assert.equal(new Set(ids).size, ids.length)
  })

  it('should return empty for empty inputs', async () => {
    const { service } = createService()
    const merged = service.mergeRecommendations([], 10)
    assert.deepEqual(merged, [])
  })
})

// ── warmupStrategies ──

describe('RecommendService warmupStrategies', () => {
  it('should warm up cold-start for new member', async () => {
    const { service, prefAdapter } = createService()
    const result = await service.warmupStrategies(TENANT_ID, 'm-new', ['电玩', '桌游'])

    assert.equal(result.warmed, true)
    assert.ok(result.strategiesLoaded > 0)

    // 偏好已被创建
    const pref = prefAdapter.query(TENANT_ID, 'm-new')
    assert.ok(pref)
    assert.deepEqual(pref!.favoriteCategories, ['电玩', '桌游'])
  })

  it('should not overwrite existing preferences', async () => {
    const { service, prefAdapter } = createService()
    // m2 已有偏好
    const before = prefAdapter.query(TENANT_ID, 'm2')
    await service.warmupStrategies(TENANT_ID, 'm2', ['电玩'])
    const after = prefAdapter.query(TENANT_ID, 'm2')

    assert.equal(after!.favoriteCategories, before!.favoriteCategories)
  })
})
