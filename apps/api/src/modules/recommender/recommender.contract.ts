/**
 * 🐜 自动: [recommender] [A] contract 补全
 *
 * Recommender：跨模块合约类型
 * 定义 recommender 模块对外暴露的稳定合约接口。
 */
import type {
  Recommendation,
  RecommendationRequest,
  RecommendationStrategy,
} from './recommender.entity'

export interface RecommendationContract {
  id: string
  name: string
  score: number
  reason: string
  strategy: RecommendationStrategy
  expiresAt?: string
}

export function toRecommendationContract(full: Recommendation): RecommendationContract {
  return {
    id: full.id,
    name: full.name,
    score: full.score,
    reason: full.reason,
    strategy: full.strategy,
    expiresAt: full.expiresAt?.toISOString(),
  }
}

export type { Recommendation, RecommendationRequest, RecommendationStrategy }
