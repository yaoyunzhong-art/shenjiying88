/**
 * 🐜 自动: [ai-recommend] [A] contract 补全
 *
 * AI 推荐引擎：跨模块合约类型
 * 定义 ai-recommend 模块对外暴露的稳定合约接口，
 * 供其他模块（ai-insight, ai-rule-engine, observability, campaign 等）消费。
 */
import type {
  Recommendation,
  UserProfile,
  ItemScore,
  RecommendationStrategy,
  StrategyWeightFactor,
  GenerateRecommendationsInput,
  GenerateRecommendationsOutput,
  RecommendType,
  RecommendationStatus,
  VisitFrequency,
  InteractionType,
  ScoreItemType,
} from './ai-recommend.entity'

/**
 * 推荐结果合约（跨模块安全子集）
 */
export interface RecommendationContract {
  id: string
  tenantId: string
  storeId?: string
  memberId?: string
  type: RecommendType
  itemId: string
  itemName: string
  score: number
  reason: string
  strategy: string
  status: RecommendationStatus
  expiresAt: string
  createdAt: string
}

/**
 * 用户画像合约（跨模块安全子集）
 */
export interface UserProfileContract {
  id: string
  memberId: string
  tenantId: string
  preferences: {
    gameTypes: string[]
    priceRange: { min: number; max: number }
    visitFrequency: VisitFrequency
    avgSpend: number
    favoriteTimeSlot: string
  }
  behaviorTags: string[]
  lastUpdated: string
}

/**
 * 物品评分合约（跨模块安全子集）
 */
export interface ItemScoreContract {
  id: string
  memberId: string
  itemId: string
  itemType: ScoreItemType
  rating: number
  interaction: InteractionType
  weight: number
  createdAt: string
}

/**
 * 推荐策略合约（跨模块安全子集）
 */
export interface RecommendationStrategyContract {
  id: string
  name: string
  description: string
  targetType: RecommendType
  config: {
    weights: StrategyWeightFactor[]
    fallbackStrategy?: string
    minScore?: number
    maxResults?: number
  }
  isEnabled: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 推荐生成输出合约（跨模块安全子集）
 */
export interface GenerateRecommendationsOutputContract {
  strategy: string
  fallbackStrategy?: string
  items: RecommendationContract[]
  executionTimeMs: number
  timestamp: string
}

// ─── Contract 映射器 ─────────────────────────────────

/** 实体 -> 合约映射 */
export function toRecommendationContract(entity: Recommendation): RecommendationContract {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    storeId: entity.storeId,
    memberId: entity.memberId,
    type: entity.type,
    itemId: entity.itemId,
    itemName: entity.itemName,
    score: entity.score,
    reason: entity.reason,
    strategy: entity.strategy,
    status: entity.status,
    expiresAt: entity.expiresAt,
    createdAt: entity.createdAt,
  }
}

/** 实体 -> 合约映射 */
export function toUserProfileContract(entity: UserProfile): UserProfileContract {
  return {
    id: entity.id,
    memberId: entity.memberId,
    tenantId: entity.tenantId,
    preferences: {
      gameTypes: [...entity.preferences.gameTypes],
      priceRange: { ...entity.preferences.priceRange },
      visitFrequency: entity.preferences.visitFrequency,
      avgSpend: entity.preferences.avgSpend,
      favoriteTimeSlot: entity.preferences.favoriteTimeSlot,
    },
    behaviorTags: [...entity.behaviorTags],
    lastUpdated: entity.lastUpdated,
  }
}

/** 实体 -> 合约映射 */
export function toItemScoreContract(entity: ItemScore): ItemScoreContract {
  return {
    id: entity.id,
    memberId: entity.memberId,
    itemId: entity.itemId,
    itemType: entity.itemType,
    rating: entity.rating,
    interaction: entity.interaction,
    weight: entity.weight,
    createdAt: entity.createdAt,
  }
}

/** 实体 -> 合约映射 */
export function toRecommendationStrategyContract(
  entity: RecommendationStrategy,
): RecommendationStrategyContract {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    targetType: entity.targetType,
    config: {
      weights: entity.config.weights.map((w) => ({ ...w })),
      fallbackStrategy: entity.config.fallbackStrategy,
      minScore: entity.config.minScore,
      maxResults: entity.config.maxResults,
    },
    isEnabled: entity.isEnabled,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  }
}

/** 推荐生成输出 -> 合约映射 */
export function toGenerateRecommendationsOutputContract(
  output: GenerateRecommendationsOutput,
): GenerateRecommendationsOutputContract {
  return {
    strategy: output.strategy,
    fallbackStrategy: output.fallbackStrategy,
    items: output.items.map(toRecommendationContract),
    executionTimeMs: output.executionTimeMs,
    timestamp: output.timestamp,
  }
}

/** 批量映射 */
export function toRecommendationContracts(entities: Recommendation[]): RecommendationContract[] {
  return entities.map(toRecommendationContract)
}

/** 批量映射 */
export function toItemScoreContracts(entities: ItemScore[]): ItemScoreContract[] {
  return entities.map(toItemScoreContract)
}

/** 批量映射 */
export function toRecommendationStrategyContracts(
  entities: RecommendationStrategy[],
): RecommendationStrategyContract[] {
  return entities.map(toRecommendationStrategyContract)
}
