import {
  TeamBuildingEvent,
  TeamBuildingReport,
  ModerationResult,
  Violation,
  VideoFingerprint,
  PerformanceMetric,
  PerformanceComparison,
  ContentType,
} from './ai-content.service'

export {
  TeamBuildingEvent,
  TeamBuildingReport,
  ModerationResult,
  Violation,
  VideoFingerprint,
  PerformanceMetric,
  PerformanceComparison,
  ContentType,
}

/**
 * AI 内容生成请求
 */
export interface AiContentGenerateRequest {
  eventId: string
  template?: 'general' | 'detailed' | 'brief'
}

/**
 * AI 内容生成响应
 */
export interface AiContentGenerateResponse {
  id: string
  eventId: string
  report: TeamBuildingReport
  generatedAt: string
}

/**
 * 内容审核请求
 */
export interface ContentModerationRequest {
  content: string
  type: ContentType
}

/**
 * 视频去重请求
 */
export interface VideoDeduplicationRequest {
  videoId: string
  targetVideoIds?: string[]
}

/**
 * 视频去重响应
 */
export interface VideoDeduplicationResponse {
  videoId: string
  duplicates: { videoId: string; similarity: number }[]
}

/**
 * 进步分析请求
 */
export interface ProgressAnalysisRequest {
  memberId: string
  metric: string
  beforePeriod: string
  afterPeriod: string
}

/**
 * 内容审核队列项
 */
export interface ReviewQueueItem {
  contentId: string
  content: string
  type: ContentType
  violations: Violation[]
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

/**
 * 批量审核请求
 */
export interface BatchModerationRequest {
  items: { id: string; content: string; type: ContentType }[]
}

/**
 * 批量审核响应
 */
export interface BatchModerationResponse {
  results: { id: string; passed: boolean; violations: Violation[] }[]
}

/**
 * 全模块概览统计
 */
export interface AiContentModuleStats {
  totalReportsGenerated: number
  totalContentModerated: number
  totalVideosProcessed: number
  totalMembersAnalyzed: number
  currentReviewQueueSize: number
}
