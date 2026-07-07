import {
  Campaign,
  CampaignType,
  Channel,
  GeneratedCopy,
  ROIResult,
  BudgetAllocation,
  TimelineMilestone,
  ReachEstimate,
} from './ai-marketing-cmo.service'

export {
  Campaign,
  CampaignType,
  Channel,
  GeneratedCopy,
  ROIResult,
  BudgetAllocation,
  TimelineMilestone,
  ReachEstimate,
}

/**
 * AI 营销分析请求
 */
export interface MarketingAnalysisRequest {
  campaignId: string
  includeROI?: boolean
  includeTimeline?: boolean
  includeReach?: boolean
}

/**
 * AI 营销分析响应
 */
export interface MarketingAnalysisResponse {
  campaignId: string
  campaignName: string
  roi?: ROIResult | null
  timeline?: TimelineMilestone[]
  reach?: ReachEstimate[]
  analyzedAt: string
}

/**
 * 文案生成批处理项
 */
export interface BatchCopyItem {
  product: string
  goal: 'awareness' | 'conversion' | 'retention' | 're-engagement'
  audience: string
  tone?: 'formal' | 'casual' | 'humorous' | 'inspirational'
  length?: 'short' | 'medium' | 'long'
}

/**
 * 文案生成批处理响应
 */
export interface BatchCopyResponse {
  items: GeneratedCopy[]
  totalGenerated: number
  generatedAt: string
}

/**
 * 活动对比结果
 */
export interface CampaignComparison {
  campaignId: string
  campaignName: string
  roiPercent: number
  revenue: number
  cost: number
  rank: number
}

/**
 * 全模块概览统计
 */
export interface AIMarketingModuleStats {
  totalCampaigns: number
  totalRevenue: number
  totalCost: number
  averageROI: number
  positiveCampaigns: number
  negativeCampaigns: number
}
