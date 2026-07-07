import { Injectable } from '@nestjs/common'
import type {
  RecommendationRequest,
  RecommendationResult,
  Candidate,
  StrategyType,
  ProductSnapshot
} from './recommend.entity'
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

/**
 * Phase-40 T170: RecommendationEngine (推荐主引擎)
 *
 * 流程:
 *  1. 缓存命中检查
 *  2. 冷启动检测 → 调整策略集
 *  3. 多策略并行执行
 *  4. 评分融合 (加权平均)
 *  5. 多样性打散 (MMR)
 *  6. 业务过滤 (排除已购/缺货)
 *  7. 缓存写入
 */

@Injectable()
export class RecommendationEngine {
  private readonly DEFAULT_STRATEGIES: StrategyType[] = [
    'item-cf', 'user-cf', 'popular', 'recently-viewed', 'personalized'
  ]

  constructor(
    private readonly scoring: ScoringService,
    private readonly diversification: DiversificationService,
    private readonly coldStart: ColdStartService,
    private readonly cache: RecommendCacheService,
    private readonly productAdapter: ProductAdapter,
    private readonly purchaseAdapter: PurchaseHistoryAdapter,
    private readonly prefAdapter: MemberPreferenceAdapter,
    private readonly itemCF: ItemCFStrategy,
    private readonly userCF: UserCFStrategy,
    private readonly popular: PopularStrategy,
    private readonly recentlyViewed: RecentlyViewedStrategy,
    private readonly personalized: PersonalizedStrategy
  ) {}

  async recommend(req: RecommendationRequest): Promise<RecommendationResult> {
    const startTime = Date.now()

    // 1. 缓存命中检查
    const cacheKey = this.cache.fingerprint(req)
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return {
        ...cached,
        metadata: { ...cached.metadata, cached: true }
      }
    }

    const strategies = req.strategies ?? this.DEFAULT_STRATEGIES
    const limit = req.limit ?? 10
    const excludePurchased = req.excludePurchased !== false  // default true
    const excludeOutOfStock = req.excludeOutOfStock !== false  // default true
    const diversify = req.diversify !== false  // default true

    // 2. 冷启动检测
    const purchaseCount = req.memberId
      ? this.purchaseAdapter.queryMemberPurchases(req.tenantId, req.memberId).length
      : 0
    const viewCount = req.memberId
      ? this.purchaseAdapter.queryMemberViews(req.tenantId, req.memberId).length
      : 0
    const lifecycleStage = req.memberId
      ? this.prefAdapter.query(req.tenantId, req.memberId)?.lifecycleStage
      : undefined
    const csDecision = this.coldStart.detect({
      hasMemberId: !!req.memberId,
      purchaseCount,
      viewCount,
      lifecycleStage
    })

    // 3. 业务过滤集合
    const excludeItemIds = new Set<string>()
    if (excludePurchased && req.memberId) {
      for (const id of this.purchaseAdapter.queryPurchasedItemIds(req.tenantId, req.memberId)) {
        excludeItemIds.add(id)
      }
    }
    if (excludeOutOfStock) {
      for (const p of this.productAdapter.query(req.tenantId)) {
        if (!p.available) excludeItemIds.add(p.id)
      }
    }
    if (req.contextItemId) excludeItemIds.add(req.contextItemId)

    // 4. 计算策略权重
    const memberPrefs = req.memberId
      ? this.prefAdapter.query(req.tenantId, req.memberId) ?? undefined
      : undefined
    const weights = this.scoring.computeWeights(strategies, {
      baseScore: 1.0,
      strategyWeights: ScoringService.DEFAULT_WEIGHTS,
      memberPreferences: memberPrefs,
      targetItemCategory: req.contextItemId
        ? this.productAdapter.query(req.tenantId, [req.contextItemId])[0]?.category
        : undefined
    })

    // 5. 多策略执行
    const candidatesByStrategy: Record<StrategyType, Candidate[]> = {
      'item-cf': [],
      'user-cf': [],
      'popular': [],
      'recently-viewed': [],
      'personalized': []
    }
    const strategiesApplied: StrategyType[] = []

    if (strategies.includes('item-cf') && req.contextItemId && req.memberId) {
      candidatesByStrategy['item-cf'] = this.itemCF.recommend(
        req.tenantId, req.contextItemId,
        this.productAdapter, this.purchaseAdapter, limit * 2
      )
      strategiesApplied.push('item-cf')
    }

    if (strategies.includes('user-cf') && req.memberId && !csDecision.isColdStart) {
      candidatesByStrategy['user-cf'] = this.userCF.recommend(
        req.tenantId, req.memberId,
        this.productAdapter, this.purchaseAdapter, limit * 2
      )
      strategiesApplied.push('user-cf')
    }

    if (strategies.includes('popular')) {
      candidatesByStrategy['popular'] = this.popular.recommend(
        req.tenantId, this.productAdapter, this.purchaseAdapter,
        limit * 2, excludeItemIds
      )
      strategiesApplied.push('popular')
    }

    if (strategies.includes('recently-viewed') && req.memberId) {
      candidatesByStrategy['recently-viewed'] = this.recentlyViewed.recommend(
        req.tenantId, req.memberId,
        this.productAdapter, this.purchaseAdapter,
        limit * 2, excludeItemIds, req.contextItemId
      )
      strategiesApplied.push('recently-viewed')
    }

    if (strategies.includes('personalized') && req.memberId) {
      candidatesByStrategy['personalized'] = this.personalized.recommend(
        req.tenantId, req.memberId,
        this.productAdapter, this.prefAdapter,
        limit * 2, excludeItemIds
      )
      strategiesApplied.push('personalized')
    }

    // 6. 评分融合
    let fused = this.scoring.fuse(candidatesByStrategy, weights)

    // 7. 应用额外 filters
    if (req.filters?.categories) {
      const allProducts = this.productAdapter.query(req.tenantId)
      const productMap = new Map(allProducts.map(p => [p.id, p]))
      fused = fused.filter(c => {
        const p = productMap.get(c.itemId)
        return p && req.filters!.categories!.includes(p.category)
      })
    }
    if (req.filters?.priceRange) {
      const [min, max] = req.filters.priceRange
      const allProducts = this.productAdapter.query(req.tenantId)
      const productMap = new Map(allProducts.map(p => [p.id, p]))
      fused = fused.filter(c => {
        const p = productMap.get(c.itemId)
        return p && p.priceCents >= min && p.priceCents <= max
      })
    }

    // 8. 多样性打散
    if (diversify && fused.length > 0) {
      const allProducts = this.productAdapter.query(req.tenantId)
      const productMap = new Map(allProducts.map(p => [p.id, p] as [string, ProductSnapshot]))
      fused = this.diversification.rerank(fused, productMap, limit)
    } else {
      fused = fused.slice(0, limit)
    }

    const result: RecommendationResult = {
      request: req,
      candidates: fused,
      fallbackUsed: csDecision.isColdStart ? csDecision.fallbackStrategy : undefined,
      metadata: {
        strategiesApplied,
        totalCandidates: fused.length,
        filteredOut: candidatesByStrategy['item-cf'].length +
                     candidatesByStrategy['user-cf'].length +
                     candidatesByStrategy['popular'].length +
                     candidatesByStrategy['recently-viewed'].length +
                     candidatesByStrategy['personalized'].length - fused.length,
        executionMs: Date.now() - startTime,
        cached: false,
        generatedAt: new Date().toISOString()
      }
    }

    // 9. 缓存写入
    this.cache.set(cacheKey, result)

    return result
  }
}