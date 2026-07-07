import { Injectable } from '@nestjs/common'
import { RecommendationEngine } from './recommendation.engine'
import { ScoringService } from './scoring.service'
import { DiversificationService } from './diversification.service'
import { ColdStartService } from './cold-start.service'
import { RecommendCacheService } from './recommend-cache.service'
import { ProductAdapter } from './datasources/product.adapter'
import { PurchaseHistoryAdapter } from './datasources/purchase-history.adapter'
import { MemberPreferenceAdapter } from './datasources/member-preference.adapter'
import type {
  RecommendationRequest,
  RecommendationResult,
  ProductSnapshot,
  Candidate,
  StrategyType,
  PurchaseHistory,
  ViewHistory,
  MemberPreference,
} from './recommend.entity'

/**
 * Phase-40 T170: RecommendService
 *
 * 推荐模块聚合业务服务层
 * 封装推荐引擎 + 打分 + 多样性 + 缓存 + 冷启动 完整链路
 *
 * 提供方法:
 *  - getRecommendation()      统一推荐入口（委托引擎）
 *  - getRecommendationWith()  带参数精细推荐
 *  - getStrategyBreakdown()   策略分解分析
 *  - getMemberProfile()       会员画像聚合
 *  - getMemberInsights()      会员洞察摘要
 *  - refreshProfile()         刷新会员画像缓存
 *  - mergeRecommendations()   合并多源推荐
 *  - warmupStrategies()       策略预热（新会员冷启动）
 */

@Injectable()
export class RecommendService {
  constructor(
    private readonly engine: RecommendationEngine,
    private readonly scoringService: ScoringService,
    private readonly diversificationService: DiversificationService,
    private readonly coldStartService: ColdStartService,
    private readonly cache: RecommendCacheService,
    private readonly productAdapter: ProductAdapter,
    private readonly purchaseAdapter: PurchaseHistoryAdapter,
    private readonly prefAdapter: MemberPreferenceAdapter,
  ) {}

  /**
   * 统一推荐入口
   * 委托 RecommendationEngine.recommend() 完成完整链路
   */
  async getRecommendation(req: RecommendationRequest): Promise<RecommendationResult> {
    const result = await this.engine.recommend(req)
    return result
  }

  /**
   * 带显式参数控制的部分推荐
   */
  async getRecommendationWith(
    tenantId: string,
    memberId: string,
    options?: {
      strategies?: StrategyType[]
      limit?: number
      categories?: string[]
    },
  ): Promise<RecommendationResult> {
    return this.getRecommendation({
      tenantId,
      memberId,
      strategies: options?.strategies,
      limit: options?.limit ?? 10,
      filters: options?.categories ? { categories: options.categories } : undefined,
    })
  }

  /**
   * 策略分解：各策略各自的推荐结果
   */
  async getStrategyBreakdown(
    tenantId: string,
    memberId: string,
  ): Promise<Record<StrategyType, Candidate[]>> {
    const strategies: StrategyType[] = [
      'item-cf',
      'user-cf',
      'popular',
      'recently-viewed',
      'personalized',
    ]

    const breakdown: Record<string, Candidate[]> = {}
    for (const strategy of strategies) {
      const result = await this.engine.recommend({
        tenantId,
        memberId,
        strategies: [strategy],
        limit: 5,
        diversify: false,
        excludePurchased: true,
      })
      breakdown[strategy] = result.candidates
    }

    return breakdown as Record<StrategyType, Candidate[]>
  }

  /**
   * 会员画像聚合
   */
  async getMemberProfile(
    tenantId: string,
    memberId: string,
  ): Promise<{
    preference: MemberPreference | null
    recentViews: ViewHistory[]
    purchaseHistory: PurchaseHistory[]
  }> {
    const preference = this.prefAdapter.query(tenantId, memberId)
    const recentViews = this.purchaseAdapter.queryMemberViews(tenantId, memberId)
    const purchaseHistory = this.purchaseAdapter.queryMemberPurchases(tenantId, memberId)

    return { preference, recentViews, purchaseHistory }
  }

  /**
   * 会员洞察摘要（给运营用）
   */
  async getMemberInsights(tenantId: string, memberId: string): Promise<{
    topCategory: string | null
    totalSpendCents: number
    orderCount: number
    estimatedStage: string
    recommendedStrategies: StrategyType[]
  }> {
    const pref = this.prefAdapter.query(tenantId, memberId)
    if (!pref) {
      return {
        topCategory: null,
        totalSpendCents: 0,
        orderCount: 0,
        estimatedStage: 'NEW',
        recommendedStrategies: ['popular'],
      }
    }

    const topCategory =
      pref.favoriteCategories.length > 0 ? pref.favoriteCategories[0] : null

    const strategies: StrategyType[] = []
    if (pref.orderCount > 0) strategies.push('user-cf', 'item-cf')
    if (pref.favoriteCategories.length > 0) strategies.push('personalized')
    strategies.push('popular')

    return {
      topCategory,
      totalSpendCents: pref.totalSpendCents,
      orderCount: pref.orderCount,
      estimatedStage: pref.lifecycleStage,
      recommendedStrategies: [...new Set(strategies)],
    }
  }

  /**
   * 刷新会员画像缓存
   */
  refreshProfile(tenantId: string, memberId: string): boolean {
    this.cache.invalidate(tenantId)
    const pref = this.prefAdapter.query(tenantId, memberId)
    if (pref) {
      this.cache.set(`pref:${tenantId}:${memberId}`, pref as any)
      return true
    }
    return false
  }

  /**
   * 合并多源推荐结果（去重、打分重排序）
   */
  mergeRecommendations(
    results: RecommendationResult[],
    limit: number = 10,
  ): Candidate[] {
    const seen = new Set<string>()
    const merged: Candidate[] = []

    for (const result of results) {
      for (const candidate of result.candidates) {
        if (!seen.has(candidate.itemId)) {
          seen.add(candidate.itemId)
          merged.push(candidate)
        }
      }
    }

    // 按 score 降序
    merged.sort((a, b) => b.score - a.score)

    return merged.slice(0, limit)
  }

  /**
   * 策略预热：为新注册会员初始化冷启动策略
   */
  async warmupStrategies(
    tenantId: string,
    memberId: string,
    initialCategories?: string[],
  ): Promise<{ warmed: boolean; strategiesLoaded: number }> {
    // 创建初始偏好
    const existing = this.prefAdapter.query(tenantId, memberId)
    if (!existing) {
      this.prefAdapter.update({
        memberId,
        tenantId,
        favoriteCategories: initialCategories ?? [],
        favoriteTags: [],
        lifecycleStage: 'NEW',
        totalSpendCents: 0,
        orderCount: 0,
      } as MemberPreference)
    }

    // 预热热门推荐缓存
    const popularResult = await this.engine.recommend({
      tenantId,
      memberId,
      strategies: ['popular'],
      limit: 20,
      diversify: true,
    })

    this.cache.set(`warmup:${tenantId}:${memberId}`, popularResult)
    return { warmed: true, strategiesLoaded: popularResult.candidates.length }
  }
}
