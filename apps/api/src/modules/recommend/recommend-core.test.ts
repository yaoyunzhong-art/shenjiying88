import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { ScoringService } from './scoring.service'
import { DiversificationService } from './diversification.service'
import { ColdStartService } from './cold-start.service'
import { RecommendCacheService } from './recommend-cache.service'
import type { Candidate, ProductSnapshot } from './recommend.entity'

describe('Recommend 核心服务测试', () => {
  // ============================================================
  // ScoringService
  // ============================================================
  describe('SCORING-1: normalize', () => {
    const s = new ScoringService()
    it('min=max 返回 1', () => assert.equal(s.normalize(5, 5, 5), 1))
    it('value=min 返回 0', () => assert.equal(s.normalize(0, 0, 10), 0))
    it('value=max 返回 1', () => assert.equal(s.normalize(10, 0, 10), 1))
    it('value=midpoint 返回 0.5', () => assert.equal(s.normalize(5, 0, 10), 0.5))
    it('value<min 返回 0', () => assert.equal(s.normalize(-5, 0, 10), 0))
    it('value>max 返回 1', () => assert.equal(s.normalize(20, 0, 10), 1))
  })

  describe('SCORING-2: fuse 加权融合', () => {
    const s = new ScoringService()
    it('空候选返回空数组', () => {
      const out = s.fuse({
        'item-cf': [], 'user-cf': [], 'popular': [], 'recently-viewed': [], 'personalized': []
      })
      assert.equal(out.length, 0)
    })

    it('单策略 candidate 加权', () => {
      const c: Candidate = { itemId: 'X', score: 0.5, reasoning: 'test', strategy: 'popular' }
      const out = s.fuse({ 'item-cf': [], 'user-cf': [], 'popular': [c], 'recently-viewed': [], 'personalized': [] })
      assert.equal(out.length, 1)
      assert.equal(out[0].itemId, 'X')
      assert.ok(out[0].score > 0)
    })

    it('多策略同一 itemId 累加', () => {
      const c1: Candidate = { itemId: 'X', score: 0.5, reasoning: 'item-cf reason', strategy: 'item-cf' }
      const c2: Candidate = { itemId: 'X', score: 0.3, reasoning: 'popular reason', strategy: 'popular' }
      const out = s.fuse({
        'item-cf': [c1], 'user-cf': [], 'popular': [c2], 'recently-viewed': [], 'personalized': []
      })
      assert.equal(out.length, 1)
      assert.match(out[0].reasoning, /item-cf reason/)
      assert.match(out[0].reasoning, /popular reason/)
    })

    it('按 score 降序排序', () => {
      const c1: Candidate = { itemId: 'A', score: 0.3, reasoning: 'low', strategy: 'popular' }
      const c2: Candidate = { itemId: 'B', score: 0.7, reasoning: 'high', strategy: 'popular' }
      const out = s.fuse({ 'item-cf': [], 'user-cf': [], 'popular': [c1, c2], 'recently-viewed': [], 'personalized': [] })
      assert.equal(out[0].itemId, 'B')
      assert.equal(out[1].itemId, 'A')
    })
  })

  describe('SCORING-3: computeWeights 冷启动/活跃/休眠', () => {
    const s = new ScoringService()
    const allStrategies: any[] = ['item-cf', 'user-cf', 'popular', 'recently-viewed', 'personalized']

    it('无 context → 默认权重', () => {
      const w = s.computeWeights(allStrategies)
      assert.ok(Math.abs(w['item-cf'] - 0.35) < 0.01)
    })

    it('NEW lifecycle → Popular 主导', () => {
      const w = s.computeWeights(allStrategies, {
        baseScore: 1.0,
        strategyWeights: ScoringService.DEFAULT_WEIGHTS,
        memberPreferences: {
          memberId: 'm1', tenantId: 'T', favoriteCategories: [], favoriteTags: [],
          lifecycleStage: 'NEW', totalSpendCents: 0, orderCount: 0
        }
      })
      assert.ok(w['popular'] > w['item-cf'], 'popular should dominate for NEW')
    })

    it('ACTIVE lifecycle → Personalized 主导', () => {
      const w = s.computeWeights(allStrategies, {
        baseScore: 1.0,
        strategyWeights: ScoringService.DEFAULT_WEIGHTS,
        memberPreferences: {
          memberId: 'm1', tenantId: 'T', favoriteCategories: [], favoriteTags: [],
          lifecycleStage: 'ACTIVE', totalSpendCents: 10000, orderCount: 5
        }
      })
      assert.ok(w['personalized'] >= w['popular'])
    })

    it('DORMANT lifecycle → Popular + Personalized', () => {
      const w = s.computeWeights(allStrategies, {
        baseScore: 1.0,
        strategyWeights: ScoringService.DEFAULT_WEIGHTS,
        memberPreferences: {
          memberId: 'm1', tenantId: 'T', favoriteCategories: [], favoriteTags: [],
          lifecycleStage: 'DORMANT', totalSpendCents: 5000, orderCount: 2
        }
      })
      assert.ok(w['popular'] >= w['item-cf'])
    })

    it('只返回请求的策略', () => {
      // 传 context 让 computeWeights 走过滤分支
      const w = s.computeWeights(['popular'], {
        baseScore: 1.0,
        strategyWeights: ScoringService.DEFAULT_WEIGHTS
      })
      assert.ok(typeof w['popular'] === 'number')
      assert.ok(w['item-cf'] === undefined)
    })
  })

  // ============================================================
  // DiversificationService (MMR)
  // ============================================================
  describe('DIV-1: MMR 多样性打散', () => {
    const d = new DiversificationService()

    const products: ProductSnapshot[] = [
      { id: 'A', tenantId: 'T', sku: 'A', name: 'A', category: 'cat1', priceCents: 1000, available: true, tags: [] },
      { id: 'B', tenantId: 'T', sku: 'B', name: 'B', category: 'cat1', priceCents: 1100, available: true, tags: [] },
      { id: 'C', tenantId: 'T', sku: 'C', name: 'C', category: 'cat2', priceCents: 2000, available: true, tags: [] },
      { id: 'D', tenantId: 'T', sku: 'D', name: 'D', category: 'cat3', priceCents: 3000, available: true, tags: [] }
    ]
    const productMap = new Map(products.map(p => [p.id, p]))

    it('空候选返回空', () => {
      assert.equal(d.rerank([], productMap, 5).length, 0)
    })

    it('topN >= candidates 全部返回', () => {
      const cs: Candidate[] = [
        { itemId: 'A', score: 0.5, reasoning: 'r', strategy: 'popular' },
        { itemId: 'B', score: 0.4, reasoning: 'r', strategy: 'popular' }
      ]
      assert.equal(d.rerank(cs, productMap, 5).length, 2)
    })

    it('同类目商品被排后 (多样性验证)', () => {
      // A 类目 cat1 分数高, MMR 应避免同类连续
      const cs: Candidate[] = [
        { itemId: 'A', score: 0.9, reasoning: 'r', strategy: 'popular' },
        { itemId: 'B', score: 0.85, reasoning: 'r', strategy: 'popular' },
        { itemId: 'C', score: 0.8, reasoning: 'r', strategy: 'popular' }
      ]
      const out = d.rerank(cs, productMap, 3)
      assert.equal(out.length, 3)
      // A 排第 1 (最高分), 后两位应避免完全同类
      assert.equal(out[0].itemId, 'A')
      // 至少有 1 个不同类目在 out[1..2]
      const outIds = [out[1].itemId, out[2].itemId]
      const hasNonCat1 = outIds.some(id => {
        const p = productMap.get(id)
        return p && p.category !== 'cat1'
      })
      assert.ok(hasNonCat1, 'MMR should bring non-cat1 items forward')
    })

    it('topN=1 返回最高分', () => {
      const cs: Candidate[] = [
        { itemId: 'A', score: 0.5, reasoning: 'r', strategy: 'popular' },
        { itemId: 'B', score: 0.7, reasoning: 'r', strategy: 'popular' }
      ]
      const out = d.rerank(cs, productMap, 1)
      assert.equal(out.length, 1)
      assert.equal(out[0].itemId, 'B')
    })
  })

  // ============================================================
  // ColdStartService
  // ============================================================
  describe('COLD-1: detect 冷启动检测', () => {
    const c = new ColdStartService()
    it('匿名访问 → cold start', () => {
      const d = c.detect({ hasMemberId: false, purchaseCount: 0, viewCount: 0 })
      assert.equal(d.isColdStart, true)
      assert.equal(d.fallbackStrategy, 'popular-heatmap')
    })

    it('新会员 → cold start', () => {
      const d = c.detect({ hasMemberId: true, purchaseCount: 0, viewCount: 0, lifecycleStage: 'NEW' })
      assert.equal(d.isColdStart, true)
      assert.equal(d.reason, '新会员无历史')
    })

    it('购买 < 3 → cold start', () => {
      const d = c.detect({ hasMemberId: true, purchaseCount: 2, viewCount: 10, lifecycleStage: 'ACTIVE' })
      assert.equal(d.isColdStart, true)
      assert.match(d.reason!, /购买历史/)
    })

    it('浏览 < 5 → cold start', () => {
      const d = c.detect({ hasMemberId: true, purchaseCount: 5, viewCount: 3, lifecycleStage: 'ACTIVE' })
      assert.equal(d.isColdStart, true)
      assert.match(d.reason!, /浏览历史/)
    })

    it('活跃会员充足历史 → 非 cold start', () => {
      const d = c.detect({ hasMemberId: true, purchaseCount: 10, viewCount: 20, lifecycleStage: 'ACTIVE' })
      assert.equal(d.isColdStart, false)
    })
  })

  describe('COLD-2: canItemCF', () => {
    const c = new ColdStartService()
    it('无 contextItemId → false', () => {
      assert.equal(c.canItemCF({ hasContextItemId: false, itemPurchaseCount: 10 }), false)
    })
    it('itemPurchaseCount < 2 → false', () => {
      assert.equal(c.canItemCF({ hasContextItemId: true, itemPurchaseCount: 1 }), false)
    })
    it('充足数据 → true', () => {
      assert.equal(c.canItemCF({ hasContextItemId: true, itemPurchaseCount: 5 }), true)
    })
  })

  // ============================================================
  // RecommendCacheService
  // ============================================================
  describe('CACHE-1: fingerprint', () => {
    let cache: RecommendCacheService
    beforeEach(() => { cache = new RecommendCacheService() })

    it('同请求同 key', () => {
      const req = { tenantId: 'T', memberId: 'm1', limit: 10 } as any
      assert.equal(cache.fingerprint(req), cache.fingerprint(req))
    })

    it('不同 memberId 不同 key', () => {
      assert.notEqual(
        cache.fingerprint({ tenantId: 'T', memberId: 'm1' } as any),
        cache.fingerprint({ tenantId: 'T', memberId: 'm2' } as any)
      )
    })

    it('不同 limit 不同 key', () => {
      assert.notEqual(
        cache.fingerprint({ tenantId: 'T', limit: 5 } as any),
        cache.fingerprint({ tenantId: 'T', limit: 10 } as any)
      )
    })

    it('key 长度 32', () => {
      assert.equal(cache.fingerprint({ tenantId: 'T' } as any).length, 32)
    })
  })

  describe('CACHE-2: get/set', () => {
    let cache: RecommendCacheService
    beforeEach(() => { cache = new RecommendCacheService() })

    it('未命中返回 null', () => {
      assert.equal(cache.get('nope'), null)
    })

    it('写入后命中', () => {
      const result = {
        request: { tenantId: 'T' } as any,
        candidates: [],
        metadata: { strategiesApplied: [], totalCandidates: 0, filteredOut: 0, executionMs: 1, cached: false, generatedAt: '2024-01-01' }
      }
      cache.set('k', result)
      const got = cache.get('k')
      assert.ok(got)
      assert.equal(got!.metadata.cached, true)
    })

    it('TTL 过期', (_done: any) => {
      const result = {
        request: { tenantId: 'T' } as any,
        candidates: [],
        metadata: { strategiesApplied: [], totalCandidates: 0, filteredOut: 0, executionMs: 1, cached: false, generatedAt: '2024-01-01' }
      }
      cache.set('k', result, 30)
      setTimeout(() => {
        assert.equal(cache.get('k'), null)
        _done()
      }, 50)
    })
  })

  describe('CACHE-3: LRU + invalidate', () => {
    let cache: RecommendCacheService
    beforeEach(() => { cache = new RecommendCacheService() })

    it('LRU 200 上限', () => {
      for (let i = 0; i < 210; i++) {
        cache.set(`k${i}`, {
          request: { tenantId: 'T' } as any,
          candidates: [],
          metadata: { strategiesApplied: [], totalCandidates: 0, filteredOut: 0, executionMs: 1, cached: false, generatedAt: '' }
        })
      }
      assert.ok(cache.stats().size <= 200)
    })

    it('按 tenantId 失效', () => {
      cache.set('a', { request: { tenantId: 'T1' } as any, candidates: [], metadata: { strategiesApplied: [], totalCandidates: 0, filteredOut: 0, executionMs: 1, cached: false, generatedAt: '' } })
      cache.set('b', { request: { tenantId: 'T1' } as any, candidates: [], metadata: { strategiesApplied: [], totalCandidates: 0, filteredOut: 0, executionMs: 1, cached: false, generatedAt: '' } })
      cache.set('c', { request: { tenantId: 'T2' } as any, candidates: [], metadata: { strategiesApplied: [], totalCandidates: 0, filteredOut: 0, executionMs: 1, cached: false, generatedAt: '' } })
      const n = cache.invalidate('T1')
      assert.equal(n, 2)
      assert.ok(cache.get('c'))  // T2 应保留
    })

    it('stats 报告 maxEntries=200', () => {
      assert.equal(cache.stats().maxEntries, 200)
    })
  })
})