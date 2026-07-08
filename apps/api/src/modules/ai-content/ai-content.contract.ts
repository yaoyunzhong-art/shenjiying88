/**
 * 🐜 自动: [ai-content] [A] contract 补全
 *
 * AI 内容模块：跨模块合约类型
 * 定义 ai-content 模块对外暴露的稳定合约接口，
 * 供其他模块（ai-push, ai-rag, ai-recommend, campaign 等）消费。
 */
import type {
  TeamBuildingReport,
  ModerationResult,
  VideoFingerprint,
  PerformanceComparison,
  Violation,
} from './ai-content.entity'

/**
 * 团建报告合约（跨模块安全子集）
 */
export interface TeamBuildingReportContract {
  id: string
  eventId: string
  summary: string
  highlights: string[]
  stats: {
    participationRate: number
    avgDuration: number
    topActivity: string
  }
  createdAt: string
}

/**
 * 内容审核结果合约（跨模块安全子集）
 */
export interface ModerationResultContract {
  passed: boolean
  violations: Array<{
    type: 'political' | 'violence' | 'advertising' | 'other'
    severity: 'low' | 'medium' | 'high'
    description: string
  }>
  flagged: boolean
}

/**
 * 视频去重合约
 */
export interface VideoDeduplicationContract {
  videoId: string
  duplicates: Array<{
    videoId: string
    similarity: number
  }>
}

/**
 * 进步分析合约
 */
export interface PerformanceComparisonContract {
  before: number
  after: number
  improvement: number
  improvementPercent: number
}

/**
 * AI 内容生成请求合约
 */
export interface AiContentGenerateRequestContract {
  eventId: string
  template?: 'general' | 'detailed' | 'brief'
}

/**
 * AI 内容生成响应合约
 */
export interface AiContentGenerateResponseContract {
  id: string
  eventId: string
  report: TeamBuildingReportContract
  generatedAt: string
}

/**
 * 批量审核请求合约
 */
export interface BatchModerationRequestContract {
  items: Array<{
    id: string
    content: string
    type: 'text' | 'image_description'
  }>
}

/**
 * 批量审核响应合约
 */
export interface BatchModerationResponseContract {
  results: Array<{
    id: string
    passed: boolean
    violations: Violation[]
  }>
}

/**
 * 进步分析请求合约
 */
export interface ProgressAnalysisRequestContract {
  memberId: string
  metric: string
  beforePeriod: string
  afterPeriod: string
}

/**
 * 模块概览统计合约
 */
export interface AiContentModuleStatsContract {
  totalReportsGenerated: number
  totalContentModerated: number
  totalVideosProcessed: number
  totalMembersAnalyzed: number
  currentReviewQueueSize: number
}

/**
 * 审核队列项合约
 */
export interface ReviewQueueItemContract {
  contentId: string
  content: string
  type: 'text' | 'image_description'
  violations: Violation[]
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
}
