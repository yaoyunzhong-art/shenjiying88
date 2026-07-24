/**
 * brand-operations.channel-kpi.entity.ts
 * P-47 品牌运营 — 品牌渠道 + KPI指标
 *
 * BrandChannel: 品牌推广/投放渠道配置（线上/线下/社交媒体等）
 * BrandKPI: 品牌运营 KPI 指标跟踪（曝光/转化/ROI等）
 */

// ── 品牌渠道 ──────────────────────────────────────────────────────────────

export type ChannelType = 'social_media' | 'search_engine' | 'display_ad' | 'offline_store' | 'email' | 'sms' | 'app_push' | 'affiliate' | 'other'

export type ChannelStatus = 'active' | 'inactive' | 'paused'

export interface ChannelConfig {
  /** 渠道账号/ID */
  accountId?: string
  /** API Key / Token */
  apiKey?: string
  /** 回调/Webhook URL */
  webhookUrl?: string
  /** 每日预算上限（分） */
  dailyBudget?: number
  /** 每月预算上限（分） */
  monthlyBudget?: number
  /** 投放时段配置 */
  schedule?: string
  /** 目标人群定向配置 */
  targetingConfig?: Record<string, string>
}

export interface BrandChannel {
  id: string
  tenantId: string
  brandId: string
  /** 渠道名称 */
  name: string
  /** 渠道类型 */
  type: ChannelType
  /** 渠道状态 */
  status: ChannelStatus
  /** 渠道配置 */
  config?: ChannelConfig
  /** 联系人 */
  contactName?: string
  /** 联系电话 */
  contactPhone?: string
  /** 备注 */
  notes?: string
  /** 负责运营人员ID */
  operatorId?: string
  operatorName?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ── 品牌KPI指标 ──────────────────────────────────────────────────────────

export type KpiCategory = 'exposure' | 'engagement' | 'conversion' | 'revenue' | 'retention' | 'brand_awareness'

export type KpiPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export interface KpiTarget {
  /** 目标值 */
  target: number
  /** 实际值 */
  actual: number
  /** 达标率 */
  achievementRate: number
}

export interface BrandKPI {
  id: string
  tenantId: string
  brandId: string
  /** KPI 名称 */
  name: string
  /** KPI 分类 */
  category: KpiCategory
  /** 统计周期 */
  period: KpiPeriod
  /** 周期起始 */
  periodStart: string
  /** 周期结束 */
  periodEnd: string
  /** 目标值 */
  targetValue: number
  /** 实际值 */
  actualValue: number
  /** 达标率（%） */
  achievementRate: number
  /** 数据源 */
  source?: string
  /** 备注 */
  notes?: string
  /** 关联渠道ID（可选） */
  channelId?: string
  /** 关联活动ID（可选） */
  campaignId?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ── KPI 汇总 ─────────────────────────────────────────────────────────────

export interface BrandKPISummary {
  totalKpis: number
  byCategory: Record<KpiCategory, { count: number; avgAchievement: number }>
  exposure: { impressions: number; reach: number }
  engagement: { likes: number; shares: number; comments: number }
  conversion: { conversions: number; conversionRate: number }
  revenue: { revenue: number; roi: number }
  topChannels: Array<{ channelId: string; channelName: string; impressions: number; conversions: number }>
}
