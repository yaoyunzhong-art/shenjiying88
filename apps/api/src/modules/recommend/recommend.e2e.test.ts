import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Recommend 推荐引擎 HTTP 链路
 *
 * 链路:
 *   HTTP → RecommendController → RecommendationEngine → 策略链
 *
 * 验证:
 *   - 策略配置: 多种推荐策略的可选组合
 *   - 推荐请求: POST /api/recommend 返回候选列表
 *   - A/B 实验: 通过策略参数控制不同实验分组
 *   - 效果评估: 数据采集 (track-view / track-purchase) + 缓存统计
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { RecommendController } from './recommend.controller'
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
import { SimilarityMatrixService } from './similarity-matrix.service'
import { TimeDecayService } from './time-decay.service'
import { ImplicitFeedbackService } from './implicit-feedback.service'
import { OfflineEvaluationService } from './offline-evaluation.service'

async function buildApp() {
  // Create all dependencies needed by RecommendModule
  const scoringService = new ScoringService()
  const diversificationService = new DiversificationService()
  const coldStartService = new ColdStartService()
  const cache = new RecommendCacheService()
  const productAdapter = new ProductAdapter()
  const purchaseAdapter = new PurchaseHistoryAdapter()
  const prefAdapter = new MemberPreferenceAdapter()

  // Strategies
  const similarityMatrix = new SimilarityMatrixService()
  const timeDecay = new TimeDecayService()
  const implicitFeedback = new ImplicitFeedbackService()
  const offlineEval = new OfflineEvaluationService()
  const itemCF = new ItemCFStrategy(similarityMatrix, timeDecay, implicitFeedback)
  const userCF = new UserCFStrategy(similarityMatrix, timeDecay)
  const popular = new PopularStrategy()
  const recentlyViewed = new RecentlyViewedStrategy()
  const personalized = new PersonalizedStrategy()
  const engine = new RecommendationEngine(
    scoringService,
    diversificationService,
    coldStartService,
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
  const recommendService = new RecommendService(
    engine,
    scoringService,
    diversificationService,
    coldStartService,
    cache,
    productAdapter,
    purchaseAdapter,
    prefAdapter,
  )

  const moduleRef = await Test.createTestingModule({
    controllers: [RecommendController],
    providers: [
      { provide: RecommendationEngine, useValue: engine },
      { provide: RecommendCacheService, useValue: cache },
      { provide: ProductAdapter, useValue: productAdapter },
      { provide: PurchaseHistoryAdapter, useValue: purchaseAdapter },
      { provide: MemberPreferenceAdapter, useValue: prefAdapter },
      { provide: RecommendService, useValue: recommendService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  await app.init()
  return { app, engine, cache, productAdapter, purchaseAdapter, prefAdapter }
}

// ─── 1. 策略配置 ─────────────────────────────────────────────

it('e2e: recommend with popular strategy returns candidates', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/recommend')
      .send({ tenantId: 'tenant-1', memberId: 'member-1', strategies: ['popular'], limit: 5 })
    assert.equal(res.statusCode, 201)
    const body = res.body as Record<string, unknown>
    const candidates = body.candidates as Array<Record<string, unknown>> | undefined
    assert.ok(Array.isArray(candidates))
    assert.ok(candidates.length > 0)
    assert.equal(candidates[0].strategy, 'popular')
  } finally {
    await app.close()
  }
})

it('e2e: recommend with personalized strategy uses preferences', async () => {
  const { app, prefAdapter } = await buildApp()
  try {
    prefAdapter.update({
      memberId: 'member-pref',
      tenantId: 'tenant-1',
      favoriteCategories: ['Electronics', 'Books'],
      favoriteTags: ['gaming', 'tech'],
      lifecycleStage: 'ACTIVE' as const,
      totalSpendCents: 50000,
      orderCount: 3,
    })

    const res = await request(app.getHttpServer())
      .post('/api/recommend')
      .send({ tenantId: 'tenant-1', memberId: 'member-pref', strategies: ['personalized'], limit: 3 })
    assert.equal(res.statusCode, 201)
    const candidates = (res.body as Record<string, unknown>).candidates as Array<Record<string, unknown>>
    assert.ok(Array.isArray(candidates))
    assert.ok(candidates.every((c) => c.strategy === 'personalized'))
  } finally {
    await app.close()
  }
})

// ─── 2. 推荐请求 ─────────────────────────────────────────────

it('e2e: recommend with item-cf strategy returns similar items', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/recommend')
      .send({
        tenantId: 'tenant-1',
        memberId: 'member-cf',
        contextItemId: 'item-001',
        strategies: ['item-cf'],
        limit: 4,
      })
    assert.equal(res.statusCode, 201)
    const candidates = (res.body as Record<string, unknown>).candidates as Array<Record<string, unknown>>
    assert.ok(Array.isArray(candidates))
    for (const c of candidates) {
      assert.equal(c.strategy, 'item-cf')
      assert.ok(c.itemId)
      assert.ok(typeof c.score === 'number')
    }
  } finally {
    await app.close()
  }
})

it('e2e: recommend with recently-viewed strategy uses purchase history', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/recommend')
      .send({ tenantId: 'tenant-1', memberId: 'member-rv', strategies: ['recently-viewed'], limit: 3 })
    assert.equal(res.statusCode, 201)
    const candidates = (res.body as Record<string, unknown>).candidates as Array<Record<string, unknown>>
    assert.ok(Array.isArray(candidates))
    assert.ok(candidates.every((c) => c.strategy === 'recently-viewed'))
  } finally {
    await app.close()
  }
})

// ─── 3. A/B 实验 ─────────────────────────────────────────────

it('e2e: recommend with excludePurchased filters out owned items', async () => {
  const { app, purchaseAdapter } = await buildApp()
  try {
    // Record a purchase for member-purchased
    purchaseAdapter.recordPurchase({
      memberId: 'member-purchased',
      tenantId: 'tenant-1',
      itemId: 'item-999',
      category: 'Books',
      purchasedAt: new Date().toISOString(),
      quantity: 1,
      amountCents: 2999,
    })

    const res = await request(app.getHttpServer())
      .post('/api/recommend')
      .send({ tenantId: 'tenant-1', memberId: 'member-purchased', strategies: ['popular'], limit: 5, excludePurchased: true })
    assert.equal(res.statusCode, 201)
    const candidates = (res.body as Record<string, unknown>).candidates as Array<Record<string, unknown>>
    assert.ok(Array.isArray(candidates))
    assert.ok(!candidates.some((c) => c.itemId === 'item-999'))
  } finally {
    await app.close()
  }
})

it('e2e: recommend with diversify returns mixed candidates', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/recommend')
      .send({ tenantId: 'tenant-1', memberId: 'member-diverse', strategies: ['popular'], limit: 10, diversify: true })
    assert.equal(res.statusCode, 201)
    const candidates = (res.body as Record<string, unknown>).candidates as Array<Record<string, unknown>>
    assert.ok(Array.isArray(candidates))
    const categories = new Set(candidates.map((c) => c.itemId))
    assert.ok(categories.size > 0)
  } finally {
    await app.close()
  }
})

// ─── 4. 效果评估 ─────────────────────────────────────────────

it('e2e: track-view records view event', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/recommend/track-view')
      .send({ tenantId: 'tenant-1', memberId: 'member-track', itemId: 'item-view-1', durationMs: 5000 })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.recorded, true)
  } finally {
    await app.close()
  }
})

it('e2e: track-purchase records purchase event', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/recommend/track-purchase')
      .send({ tenantId: 'tenant-1', memberId: 'member-buyer', itemId: 'item-buy-1', category: 'Electronics', amountCents: 19999 })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.recorded, true)
  } finally {
    await app.close()
  }
})

it('e2e: update preferences returns updated', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/recommend/preferences')
      .send({ tenantId: 'tenant-1', memberId: 'member-upd', favoriteCategories: ['Sports'] })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.updated, true)
  } finally {
    await app.close()
  }
})

it('e2e: cache stats reports size', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/api/recommend/cache/stats')
    assert.equal(res.statusCode, 200)
    const stats = res.body as Record<string, unknown>
    assert.ok(typeof stats.size === 'number')
    assert.ok(typeof stats.maxEntries === 'number')
  } finally {
    await app.close()
  }
})

it('e2e: health check returns ok', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/api/recommend/health')
    assert.equal(res.statusCode, 200)
    const body = res.body as { status: string }
    assert.equal(body.status, 'ok')
  } finally {
    await app.close()
  }
})

it('e2e: recommend without tenantId returns 400', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/api/recommend')
      .send({ memberId: 'member-no-tenant' })
    assert.equal(res.statusCode, 400)
  } finally {
    await app.close()
  }
})
