/**
 * Recommender 模块 - 实体定义
 *
 * 基于 Champion context + RAG 的知识推荐引擎
 * 关联: phase-19-intelligence/spec.md §Phase 3
 */

// ============ 跨模块合约补全 ============

/** 推荐结果合约实体 (跨模块安全子集) */
export interface Recommendation {
  id: string
  name: string
  score: number
  reason: string
  strategy: RecommendationStrategy
  expiresAt?: Date
}

/** 推荐请求合约实体 (跨模块安全子集) */
export interface RecommendationRequest {
  module: string
  context?: {
    files?: string[]
    description?: string
  }
  topK?: number
}

/** 推荐策略 (跨模块合约) */
export type RecommendationStrategy = 'semantic' | 'recency' | 'champion_affinity' | 'hybrid'

// ============ 原始定义 ============

/** Champion 角色 */
export type ChampionRole = 'CHAMPION' | 'APPROVER'

/** 贡献类型 */
export type ContributionKind = 'COMMIT' | 'RFC' | 'REVIEW'

/** 推荐状态 */
export type RecommendationStatus = 'pending' | 'read' | 'adopted' | 'dismissed'

/** 推荐置信度等级 */
export type ConfidenceLevel = 'high' | 'medium' | 'low'

/**
 * Champion 摘要
 */
export interface ChampionSummary {
  championId: string
  name: string
  role: ChampionRole
  totalScore: number
  topModules: string[]
  recentContributions: Array<{
    kind: ContributionKind
    refId: string
    occurredAt: string
    weight: number
  }>
}

/**
 * 推荐上下文
 */
export interface RecommendationContext {
  champion: ChampionSummary
  currentTask: {
    branch?: string
    files: string[]
    module: string
    description?: string
  }
  relatedChampions: ChampionSummary[]
  recentSummary: {
    totalContributions: number
    byKind: Record<string, number>
    topRefIds: string[]
  }
  builtAt: string
}

/**
 * 排序后的检索结果
 */
export interface RankedResult {
  chunkId: string
  sourcePath: string
  content: string
  title?: string
  section?: string
  kind?: string
  scores: {
    semantic: number
    recency: number
    championAffinity: number
  }
  totalScore: number
  reason: string
}

/**
 * 最终推荐项
 */
export interface RecommendationItem {
  rank: number
  chunkId: string
  sourcePath: string
  title?: string
  section?: string
  reason: string
  confidence: number
  content: string
  status: RecommendationStatus
  createdAt: string
}

/**
 * 推荐响应
 */
export interface RecommendResponse {
  context: RecommendationContext
  recommendations: RecommendationItem[]
  adoptionRate?: number
}

/**
 * 推荐日志（审计追踪）
 */
export interface RecommendationLog {
  id: string
  championId: string
  module: string
  recommendationsCount: number
  adoptedCount: number
  executedAt: string
  executionTimeMs: number
}
