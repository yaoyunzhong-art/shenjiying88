/**
 * AI Marketing API 契约定义
 *
 * 本契约声明 ai-marketing 模块提供的接口及其输入输出结构。
 * 用于 API 提供方与消费方之间的协议约定。
 */

// ─── ROI API ───────────────────────────────────────────────────

export interface ROICalculateRequest {
  campaignId: string
}

export interface ROICalculateResponse {
  success: boolean
  data?: {
    campaignId: string
    revenue: number
    cost: number
    roi: number
    roiPercent: number
    profit: number
    isPositive: boolean
  }
  message?: string
}

export interface ROICompareRequest {
  campaignIds: string[]
}

export interface ROIProjectRequest {
  type: 'brand' | 'performance' | 'social' | 'email' | 'promotion' | 'kOL'
  budget: number
  expectedCPM?: number
  expectedCTR?: number
  expectedConversionRate?: number
  averageOrderValue?: number
}

export interface ROIProjectResponse {
  success: boolean
  data?: {
    minROI: number
    maxROI: number
    expectedROI: number
  }
}

// ─── Copywriting API ───────────────────────────────────────────

export interface CopyGenerateRequest {
  product: string
  goal: 'awareness' | 'conversion' | 'retention' | 're-engagement'
  audience: string
  tone?: 'formal' | 'casual' | 'humorous' | 'inspirational'
  length?: 'short' | 'medium' | 'long'
  cta?: string
}

export interface HeadlineOptimizeRequest {
  headline: string
}

export interface LocalizeCopyRequest {
  headline: string
  body: string
  cta: string
  taglines: string[]
  locale: 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP'
}

export interface ABTestRequest {
  brief: CopyGenerateRequest
  count: number
}

// ─── Campaign Planning API ─────────────────────────────────────

export interface SuggestCampaignRequest {
  goal: 'awareness' | 'conversion' | 'retention' | 'brand'
  budget: number
  audience: string
}

export interface PlanTimelineRequest {
  goal: 'awareness' | 'conversion' | 'retention' | 'brand'
}

export interface ReachEstimateRequest {
  audience: number
  channel: string
}

// ─── Analysis API ──────────────────────────────────────────────

export interface MarketingAnalysisRequest {
  campaignId: string
  includeROI?: boolean
  includeTimeline?: boolean
  includeReach?: boolean
}
