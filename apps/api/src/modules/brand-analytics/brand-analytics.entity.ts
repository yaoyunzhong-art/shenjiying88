/**
 * 品牌分析模块 - 实体/类型定义
 * 
 * 涵盖 KPI、渠道归因、品牌声量、竞品对比、品牌健康度、内容表现、报告生成
 */

// ── KPI 指标 ─────────────────────────────────────────────────────────────────

export interface BrandKPIMetrics {
  impressions: number          // 曝光量
  clicks: number               // 点击量
  clickRate: number            // 点击率 (CTR)
  conversions: number          // 转化数
  conversionRate: number       // 转化率
  engagementRate: number       // 互动率
  shareCount: number           // 分享数
  commentCount: number         // 评论数
  likeCount: number            // 点赞数
  avgEngagementTime: number    // 平均互动时长(秒)
  bounceRate: number           // 跳出率
  costPerClick: number         // 单次点击成本
  costPerMille: number         // 千次展示成本
  returnOnAdSpend: number      // 广告回报率 ROAS
}

export interface BrandKPI {
  brandId: string
  tenantId: string
  date: string                 // YYYY-MM-DD
  metrics: BrandKPIMetrics
}

// ── 渠道归因 ─────────────────────────────────────────────────────────────────

export interface ChannelAttribution {
  channel: string              // 'social' | 'search' | 'email' | 'display' | 'direct' | 'referral' | 'organic'
  channelName: string
  touchpoints: number
  firstTouchConversions: number
  lastTouchConversions: number
  linearConversions: number
  timeDecayConversions: number
  attributedRevenue: number
  attributedConversions: number
  conversionValue: number
}

export type AttributionModel =
  | 'first_touch'
  | 'last_touch'
  | 'linear'
  | 'time_decay'
  | 'position_based'

// ── 品牌声量 ─────────────────────────────────────────────────────────────────

export interface BrandMention {
  id: string
  brandId: string
  date: string
  platform: string             // 'weibo' | 'douyin' | 'xiaohongshu' | 'bilibili' | 'wechat' | 'zhihu'
  mentionCount: number
  positiveCount: number
  negativeCount: number
  neutralCount: number
  sentimentScore: number       // -1.0 to 1.0
  topKeywords: { keyword: string; count: number }[]
  topMentions: { title: string; url: string; sentiment: string }[]
}

// ── 竞品对比 ─────────────────────────────────────────────────────────────────

export interface CompetitorComparison {
  brandId: string
  brandName: string
  dateRange: { start: string; end: string }
  metrics: {
    brandAwareness: number
    marketShare: number
    engagementRate: number
    sentimentScore: number
    contentVolume: number
    followerGrowth: number
  }
  trends: { date: string; metric: string; value: number }[]
}

// ── 品牌健康度 ───────────────────────────────────────────────────────────────

export interface HealthDimension {
  score: number
  trend: 'up' | 'down' | 'stable'
  description: string
}

export interface BrandHealthScore {
  brandId: string
  overallScore: number          // 0-100
  dimensions: {
    awareness: HealthDimension
    engagement: HealthDimension
    reputation: HealthDimension
    loyalty: HealthDimension
    content: HealthDimension
  }
  lastUpdated: Date
}

// ── 内容表现 ─────────────────────────────────────────────────────────────────

export interface ContentPerformance {
  contentId: string
  contentType: 'image' | 'video' | 'article' | 'live' | 'audio'
  title: string
  platform: string
  publishDate: string
  metrics: {
    views: number
    likes: number
    shares: number
    comments: number
    saves: number
    avgWatchTime: number
    completionRate: number
  }
  qualityScore: number
  suggestedImprovements: string[]
}

// ── 分析报告 ─────────────────────────────────────────────────────────────────

export interface BrandAnalyticsReport {
  id: string
  brandId: string
  tenantId: string
  reportType: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  dateRange: { start: string; end: string }
  summary: string
  kpiSummary: BrandKPI
  channelAttribution: ChannelAttribution[]
  brandMentions: BrandMention[]
  healthScore: BrandHealthScore
  topContent: ContentPerformance[]
  recommendations: string[]
  generatedAt: Date
}

// ── 分析查询 ─────────────────────────────────────────────────────────────────

export interface AnalyticsQuery {
  brandId: string
  startDate: string
  endDate: string
  granularity: 'day' | 'week' | 'month'
  channels?: string[]
  platforms?: string[]
}

// ── 趋势数据 ─────────────────────────────────────────────────────────────────

export interface TrendDataPoint {
  date: string
  value: number
  metric: string
}

// ── 市场占比 ─────────────────────────────────────────────────────────────────

export interface MarketShareData {
  brandId: string
  brandName: string
  share: number
  categoryTotal: number
  rank: number
}

// ── ROI 计算结果 ────────────────────────────────────────────────────────────

export interface ROICalculation {
  brandId: string
  startDate: string
  endDate: string
  totalCost: number
  totalRevenue: number
  roi: number           // 百分比
  roas: number          // 广告回报率 (倍数)
  netProfit: number
}

// ── 归因模型比较结果 ────────────────────────────────────────────────────────

export interface AttributionModelComparison {
  model: AttributionModel
  channels: { channel: string; attributedConversions: number; attributedRevenue: number }[]
  totalAttributedConversions: number
  totalAttributedRevenue: number
}

// ── 内容类型枚举 ─────────────────────────────────────────────────────────────

export type ContentType = 'image' | 'video' | 'article' | 'live' | 'audio'

// ── 报告类型枚举 ─────────────────────────────────────────────────────────────

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'quarterly'

// ── 粒度类型枚举 ─────────────────────────────────────────────────────────────

export type Granularity = 'day' | 'week' | 'month'

// ── 渠道枚举列表 ─────────────────────────────────────────────────────────────

export const CHANNELS = ['social', 'search', 'email', 'display', 'direct', 'referral', 'organic'] as const

export type Channel = typeof CHANNELS[number]

export const CHANNEL_NAMES: Record<Channel, string> = {
  social: '社交媒体',
  search: '搜索引擎',
  email: '电子邮件',
  display: '展示广告',
  direct: '直接访问',
  referral: '引荐流量',
  organic: '自然搜索',
}

// ── 平台枚举列表 ─────────────────────────────────────────────────────────────

export const PLATFORMS = ['weibo', 'douyin', 'xiaohongshu', 'bilibili', 'wechat', 'zhihu'] as const

export type Platform = typeof PLATFORMS[number]

export const PLATFORM_NAMES: Record<Platform, string> = {
  weibo: '微博',
  douyin: '抖音',
  xiaohongshu: '小红书',
  bilibili: 'B站',
  wechat: '微信',
  zhihu: '知乎',
}
