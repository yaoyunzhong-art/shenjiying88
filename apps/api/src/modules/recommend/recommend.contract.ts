import type {
  Candidate,
  RecommendationRequest,
  RecommendationResult,
  StrategyType,
  LifecycleStage,
  ProductSnapshot,
  PurchaseHistory,
  ViewHistory,
  MemberPreference,
  ScoringContext,
} from './recommend.entity'

/**
 * Phase-40 T170: Recommend Contract
 *
 * API 契约定义，确保前端/后端类型一致。
 */

// ---------- Request Contracts ----------

export interface RecommendRequestContract {
  tenantId: string
  memberId?: string
  contextItemId?: string
  strategies?: StrategyType[]
  limit?: number
  excludePurchased?: boolean
  excludeOutOfStock?: boolean
  diversify?: boolean
  filters?: {
    categories?: string[]
    priceRange?: [number, number]
    tags?: string[]
  }
}

export interface TrackViewContract {
  tenantId: string
  memberId: string
  itemId: string
  durationMs?: number
}

export interface TrackPurchaseContract {
  tenantId: string
  memberId: string
  itemId: string
  quantity: number
  amountCents: number
  category: string
}

export interface UpdatePreferencesContract {
  tenantId: string
  memberId: string
  favoriteCategories?: string[]
  favoriteTags?: string[]
}

export interface CacheInvalidateContract {
  tenantId: string
}

// ---------- Response Contracts ----------

export interface CandidateContract extends Candidate {}

export interface RecommendationResultContract {
  request: RecommendRequestContract
  candidates: CandidateContract[]
  fallbackUsed?: StrategyType
  metadata: {
    strategiesApplied: StrategyType[]
    totalCandidates: number
    filteredOut: number
    executionMs: number
    cached: boolean
    generatedAt: string
  }
}

export interface CacheStatsContract {
  size: number
  maxEntries: number
}

export interface HealthContract {
  status: 'ok' | 'degraded'
  stats: CacheStatsContract
}

export interface ErrorContract {
  statusCode: number
  message: string
  error?: string
}

// ---------- Converters ----------

export function toRequestContract(req: RecommendationRequest): RecommendRequestContract {
  return {
    tenantId: req.tenantId,
    memberId: req.memberId,
    contextItemId: req.contextItemId,
    strategies: req.strategies,
    limit: req.limit,
    excludePurchased: req.excludePurchased,
    excludeOutOfStock: req.excludeOutOfStock,
    diversify: req.diversify,
    filters: req.filters,
  }
}

export function toResultContract(result: RecommendationResult): RecommendationResultContract {
  return {
    request: result.request ? {
      tenantId: result.request.tenantId,
      memberId: result.request.memberId,
      contextItemId: result.request.contextItemId,
      strategies: result.request.strategies,
      limit: result.request.limit,
      excludePurchased: result.request.excludePurchased,
      excludeOutOfStock: result.request.excludeOutOfStock,
      diversify: result.request.diversify,
      filters: result.request.filters,
    } : { tenantId: '' },
    candidates: result.candidates.map(c => ({
      itemId: c.itemId,
      score: c.score,
      reasoning: c.reasoning,
      strategy: c.strategy,
      metadata: c.metadata,
    })),
    fallbackUsed: result.fallbackUsed,
    metadata: { ...result.metadata },
  }
}
