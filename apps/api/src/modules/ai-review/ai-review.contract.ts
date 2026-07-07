/**
 * 🐜 自动: [ai-review] [A] contract 补全
 *
 * AI Code Review：跨模块合约类型
 * 定义 ai-review 模块对外暴露的稳定合约接口，
 * 供其他模块（ai-diagnosis, ai-insight, observability 等）消费。
 */
import type {
  ReviewRequest,
  ReviewResponse,
  ReviewIssue,
  ReviewSummary,
  ReviewConfig,
  ReviewRecord,
  CodeLanguage,
  ReviewCategory,
  ReviewSeverity,
  ReviewStatus,
  LLMProviderName,
} from './ai-review.entity'

// ─── 合约子集 ──────────────────────────────────────────────────────────

/**
 * 评审请求合约（跨模块安全子集）
 */
export interface ReviewRequestContract {
  repositoryType: string
  repository: string
  pullRequestId: string | number
  title: string
  description: string
  fileCount: number
  author: string
  requestedAt: string
  categories?: ReviewCategory[]
}

/**
 * 评审响应合约（跨模块安全子集）
 */
export interface ReviewResponseContract {
  id: string
  repository: string
  pullRequestId: string | number
  overallScore: number
  issueCount: number
  criticalCount: number
  majorCount: number
  summary: string
  needsApproverReview: boolean
  status: ReviewStatus
  latencyMs: number
  cacheHit: boolean
  completedAt: string
}

/**
 * 评审问题合约（跨模块安全子集）
 */
export interface ReviewIssueContract {
  id: string
  category: ReviewCategory
  severity: ReviewSeverity
  message: string
  filePath: string
  lineStart?: number
  lineEnd?: number
  suggestion?: string
}

/**
 * 评审摘要统计合约（跨模块安全子集）
 */
export interface ReviewSummaryContract {
  totalReviews: number
  successfulReviews: number
  totalIssues: number
  issuesBySeverity: Record<ReviewSeverity, number>
  issuesByCategory: Record<ReviewCategory, number>
  averageScore: number
  averageLatencyMs: number
  cacheHitRate: number
  periodStart: string
  periodEnd: string
}

/**
 * 评审配置合约（跨模块安全子集）
 */
export interface ReviewConfigContract {
  id: string
  tenantId: string
  repository: string
  enabled: boolean
  triggerLabels?: string[]
  triggerBranches?: string[]
  triggerFilePatterns?: string[]
  ignorePatterns?: string[]
  minSeverity?: ReviewSeverity
  categories?: ReviewCategory[]
  createdAt: string
  updatedAt: string
}

/**
 * 评审历史合约（跨模块安全子集）
 */
export interface ReviewRecordContract {
  id: string
  tenantId: string
  repository: string
  pullRequestId: string | number
  status: ReviewStatus
  overallScore: number
  issueCount: number
  createdAt: string
  completedAt?: string
}

/**
 * LLM Provider 使用统计合约（跨模块安全子集）
 */
export interface LLMUsageContract {
  providerName: LLMProviderName
  inputTokens: number
  outputTokens: number
  costUsd: number
  latencyMs: number
}

/**
 * 健康检查合约
 */
export interface HealthcheckContract {
  ok: boolean
  defaultProvider: string
  budgetUtilization: number
  cacheEnabled: boolean
}

// ─── Contract 映射器 ──────────────────────────────────────────────────

/** 实体 -> 合约映射 */
export function toReviewResponseContract(entity: ReviewResponse): ReviewResponseContract {
  return {
    id: entity.id,
    repository: entity.request.repository,
    pullRequestId: entity.request.pullRequestId,
    overallScore: entity.overallScore,
    issueCount: entity.issues.length,
    criticalCount: entity.issues.filter((i) => i.severity === 'critical').length,
    majorCount: entity.issues.filter((i) => i.severity === 'major').length,
    summary: entity.summary,
    needsApproverReview: entity.needsApproverReview,
    status: entity.status,
    latencyMs: entity.latencyMs,
    cacheHit: entity.cacheHit,
    completedAt: entity.completedAt,
  }
}

/** 实体 -> 合约映射 */
export function toReviewIssueContract(entity: ReviewIssue): ReviewIssueContract {
  return {
    id: entity.id,
    category: entity.category,
    severity: entity.severity,
    message: entity.message,
    filePath: entity.filePath,
    lineStart: entity.lineStart,
    lineEnd: entity.lineEnd,
    suggestion: entity.suggestion,
  }
}

/** 实体 -> 合约映射 */
export function toReviewSummaryContract(entity: ReviewSummary): ReviewSummaryContract {
  return {
    totalReviews: entity.totalReviews,
    successfulReviews: entity.successfulReviews,
    totalIssues: entity.totalIssues,
    issuesBySeverity: { ...entity.issuesBySeverity },
    issuesByCategory: { ...entity.issuesByCategory },
    averageScore: entity.averageScore,
    averageLatencyMs: entity.averageLatencyMs,
    cacheHitRate: entity.cacheHitRate,
    periodStart: entity.periodStart,
    periodEnd: entity.periodEnd,
  }
}

/** 实体 -> 合约映射 */
export function toReviewConfigContract(entity: ReviewConfig): ReviewConfigContract {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    repository: entity.repository,
    enabled: entity.enabled,
    triggerLabels: entity.triggerOn.labels,
    triggerBranches: entity.triggerOn.branches,
    triggerFilePatterns: entity.triggerOn.filePatterns,
    ignorePatterns: entity.ignorePatterns,
    minSeverity: entity.minSeverity,
    categories: entity.categories,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  }
}

/** 实体 -> 合约映射 */
export function toReviewRecordContract(entity: ReviewRecord): ReviewRecordContract {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    repository: entity.repository,
    pullRequestId: entity.pullRequestId,
    status: entity.status,
    overallScore: entity.overallScore,
    issueCount: entity.issueCount,
    createdAt: entity.createdAt,
    completedAt: entity.completedAt,
  }
}

// ─── 批量映射 ─────────────────────────────────────────────────────────

export function toReviewResponseContracts(entities: ReviewResponse[]): ReviewResponseContract[] {
  return entities.map(toReviewResponseContract)
}

export function toReviewIssueContracts(entities: ReviewIssue[]): ReviewIssueContract[] {
  return entities.map(toReviewIssueContract)
}

export function toReviewRecordContracts(entities: ReviewRecord[]): ReviewRecordContract[] {
  return entities.map(toReviewRecordContract)
}
