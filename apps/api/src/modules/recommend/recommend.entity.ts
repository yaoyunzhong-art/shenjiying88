/**
 * Phase-40 T170: Recommend Entity
 *
 * 推荐模块核心类型:
 *  - RecommendationRequest: 推荐请求 (memberId, context, limit, filters)
 *  - RecommendationResult: 推荐结果 (candidates + metadata)
 *  - Candidate: 推荐候选 (itemId, score, reasoning, strategy)
 *  - Strategy: 策略类型 (5 种)
 *  - ScoringContext: 评分上下文 (用于多策略融合)
 */

export type StrategyType =
  | 'item-cf'          // 物品协同过滤
  | 'user-cf'          // 用户协同过滤
  | 'popular'          // 热门排行
  | 'recently-viewed'  // 最近浏览
  | 'personalized'     // 个性化

export type LifecycleStage = 'NEW' | 'ACTIVE' | 'DORMANT' | 'CHURNED'

export interface ProductSnapshot {
  id: string
  tenantId: string
  sku: string
  name: string
  category: string
  priceCents: number
  available: boolean
  tags?: string[]
  createdAt?: string
}

export interface PurchaseHistory {
  memberId: string
  tenantId: string
  itemId: string
  category: string
  purchasedAt: string
  quantity: number
  amountCents: number
}

export interface ViewHistory {
  memberId: string
  tenantId: string
  itemId: string
  viewedAt: string
  durationMs?: number
}

export interface MemberPreference {
  memberId: string
  tenantId: string
  favoriteCategories: string[]
  favoriteTags: string[]
  lifecycleStage: LifecycleStage
  totalSpendCents: number
  orderCount: number
  lastOrderAt?: string
}

export interface Candidate {
  itemId: string
  score: number           // 0..1 归一化分数
  reasoning: string       // 推荐理由
  strategy: StrategyType  // 来源策略
  metadata?: Record<string, any>
}

export interface RecommendationRequest {
  tenantId: string
  memberId?: string                       // 可选 (匿名推荐)
  contextItemId?: string                  // 上下文商品 (item-cf 需要)
  strategies?: StrategyType[]             // 指定策略 (默认全部)
  limit?: number                          // 返回数量 (默认 10)
  excludePurchased?: boolean              // 排除已购 (默认 true)
  excludeOutOfStock?: boolean             // 排除缺货 (默认 true)
  diversify?: boolean                     // 多样性打散 (默认 true)
  filters?: {
    categories?: string[]
    priceRange?: [number, number]
    tags?: string[]
  }
}

export interface RecommendationResult {
  request: RecommendationRequest
  candidates: Candidate[]
  fallbackUsed?: StrategyType              // 冷启动 fallback 策略
  metadata: {
    strategiesApplied: StrategyType[]
    totalCandidates: number
    filteredOut: number
    executionMs: number
    cached: boolean
    generatedAt: string
  }
}

export interface ScoringContext {
  baseScore: number
  strategyWeights: Record<StrategyType, number>
  memberPreferences?: MemberPreference
  targetItemCategory?: string
}