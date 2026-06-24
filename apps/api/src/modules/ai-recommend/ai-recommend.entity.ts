/**
 * AI 推荐引擎 - 实体定义
 *
 * 推荐类型：game | product | activity | coupon | svip
 * 推荐策略：热门推荐、协同过滤、内容推荐、混合推荐
 */

/** 推荐项类型 */
export type RecommendType = 'game' | 'product' | 'activity' | 'coupon' | 'svip'

/** 推荐结果状态 */
export type RecommendationStatus = 'active' | 'clicked' | 'converted' | 'expired'

/** 用户访问频率 */
export type VisitFrequency = 'daily' | 'weekly' | 'monthly' | 'occasional'

/** 交互类型 */
export type InteractionType = 'view' | 'click' | 'purchase' | 'play'

/** 物品类型（用于评分） */
export type ScoreItemType = 'game' | 'product' | 'activity'

/**
 * 推荐结果
 */
export interface Recommendation {
  /** 推荐唯一标识 */
  id: string
  /** 租户 ID */
  tenantId: string
  /** 门店 ID（可选，全局推荐不限定） */
  storeId?: string
  /** 会员 ID（可选，个性化推荐必填） */
  memberId?: string
  /** 推荐类型 */
  type: RecommendType
  /** 被推荐项的 ID */
  itemId: string
  /** 被推荐项的名称 */
  itemName: string
  /** 推荐分数 0-100 */
  score: number
  /** 推荐理由（人类可读） */
  reason: string
  /** 使用的推荐策略名 */
  strategy: string
  /** 推荐状态 */
  status: RecommendationStatus
  /** 过期时间 */
  expiresAt: string
  /** 创建时间 */
  createdAt: string
}

/**
 * 用户画像（轻量版，供推荐引擎消费）
 */
export interface UserProfile {
  /** 画像唯一标识 */
  id: string
  /** 关联会员 ID */
  memberId: string
  /** 租户 ID */
  tenantId: string
  /** 偏好设置 */
  preferences: {
    /** 偏好游戏类型 */
    gameTypes: string[]
    /** 价格区间 */
    priceRange: { min: number; max: number }
    /** 访问频率 */
    visitFrequency: VisitFrequency
    /** 平均消费金额 */
    avgSpend: number
    /** 偏好时间段 e.g. "18:00-22:00" */
    favoriteTimeSlot: string
  }
  /** 行为标签 */
  behaviorTags: string[]
  /** 最后更新时间 */
  lastUpdated: string
}

/**
 * 物品评分（协同过滤基础数据）
 */
export interface ItemScore {
  /** 评分唯一标识 */
  id: string
  /** 会员 ID */
  memberId: string
  /** 物品 ID */
  itemId: string
  /** 物品类型 */
  itemType: ScoreItemType
  /** 评分 1-5 */
  rating: number
  /** 交互行为 */
  interaction: InteractionType
  /** 交互权重（用于加权计算） */
  weight: number
  /** 创建时间 */
  createdAt: string
}

/**
 * 推荐策略配置中的权重因子
 */
export interface StrategyWeightFactor {
  /** 因子名称 */
  factor: string
  /** 因子权重 */
  weight: number
}

/**
 * 推荐策略
 */
export interface RecommendationStrategy {
  /** 策略唯一标识 */
  id: string
  /** 策略名称 */
  name: string
  /** 策略描述 */
  description: string
  /** 目标推荐类型 */
  targetType: RecommendType
  /** 策略配置 */
  config: {
    /** 各因子权重 */
    weights: StrategyWeightFactor[]
    /** 兜底策略名（当前策略无结果时回退） */
    fallbackStrategy?: string
    /** 最低推荐分数阈值 */
    minScore?: number
    /** 最大推荐结果数 */
    maxResults?: number
  }
  /** 是否启用 */
  isEnabled: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/**
 * 推荐生成请求参数
 */
export interface GenerateRecommendationsInput {
  /** 策略 ID */
  strategyId: string
  /** 会员 ID（个性化推荐） */
  memberId?: string
  /** 门店 ID */
  storeId?: string
  /** 推荐类型覆盖 */
  type?: RecommendType
  /** 最大结果数覆盖 */
  limit?: number
}

/**
 * 推荐生成结果
 */
export interface GenerateRecommendationsOutput {
  /** 使用的策略 */
  strategy: string
  /** 实际回退到的策略（如果有） */
  fallbackStrategy?: string
  /** 生成的推荐列表 */
  items: Recommendation[]
  /** 总耗时 ms */
  executionTimeMs: number
  /** 生成时间 */
  timestamp: string
}
