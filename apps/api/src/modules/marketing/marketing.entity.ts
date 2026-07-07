/**
 * Phase-42 T172: 智能营销实体 (RFM + AB + Coupon + Attribution)
 *
 * DR-42 决策链:
 *  - A: RFM 3 维度 → 8 分群
 *  - B: A/B 50/50 hash(memberId)%2
 *  - C: 优惠券 RFM 匹配 + 频控 1/7d
 *  - D: 渠道优先级 in-app > wechat > SMS
 *  - E: 归因 V1 = last non-direct
 *  - F: 多租户隔离
 */

export type TenantId = string

// ─── RFM 模型 ────────────────────────────────────────

export type RFMRecency = 'RECENT_30D' | 'RECENT_60D' | 'RECENT_90D' | 'OVER_90D'
export type RFMFrequency = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
export type RFMMonetary = 'HIGH' | 'MEDIUM' | 'LOW'

/**
 * 8 个 RFM 分群
 */
export type RFMSegmentType =
  | 'CHAMPIONS'
  | 'LOYAL'
  | 'POTENTIAL_LOYALIST'
  | 'RECENT'
  | 'PROMISING'
  | 'NEED_ATTENTION'
  | 'AT_RISK'
  | 'HIBERNATING'

export interface RFMProfile {
  id: string
  tenantId: TenantId
  memberId: string
  recency: RFMRecency
  frequency: RFMFrequency
  monetary: RFMMonetary
  segment: RFMSegmentType
  daysSinceLastOrder: number
  orderCount90d: number
  totalSpendCents: number
  computedAt: string
  updatedAt: string
}

export interface RFMStats {
  totalMembers: number
  segmentDistribution: Record<RFMSegmentType, number>
  avgRecencyDays: number
  avgFrequency: number
  avgMonetaryCents: number
}

// ─── A/B 测试 ────────────────────────────────────────

export type ABVariantType = 'A' | 'B'
export type ABResult = 'A' | 'B' | 'INCONCLUSIVE'

export interface ABVariant {
  id: string
  name: string
  content: string
  rewardType: 'COUPON' | 'POINTS' | 'DISCOUNT'
  rewardValue: number
}

export interface ABExperiment {
  id: string
  tenantId: TenantId
  campaignId: string
  name: string
  variantA: ABVariant
  variantB: ABVariant
  trafficSplit: number
  minSampleSize: number
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'ENDED'
  startAt: string
  endAt?: string
  metrics: ABMetrics
  result?: ABResult
  pValue?: number
  createdAt: string
}

export interface ABMetrics {
  sentA: number
  sentB: number
  clickedA: number
  clickedB: number
  convertedA: number
  convertedB: number
  revenueCentsA: number
  revenueCentsB: number
}

export interface ABAssignment {
  experimentId: string
  memberId: string
  variant: ABVariantType
  assignedAt: string
}

// ─── 优惠券精准 ────────────────────────────────────────

export type CouponSegment =
  | 'VIP_DISCOUNT'
  | 'LOYAL_REWARD'
  | 'WELCOME_OFFER'
  | 'REACTIVATION'
  | 'GENERIC'

export interface CouponPrecisionRule {
  id: string
  tenantId: TenantId
  segment: RFMSegmentType
  couponSegment: CouponSegment
  enabled: boolean
  rewardAmount?: number
  discountPercent?: number
  expiryDays: number
}

export interface CouponIssueRequest {
  tenantId: TenantId
  memberId: string
  campaignId: string
  couponSegment: CouponSegment
  rewardAmount?: number
  discountPercent?: number
  expiryDays: number
}

export interface CouponIssueRecord {
  id: string
  tenantId: TenantId
  memberId: string
  campaignId: string
  couponSegment: CouponSegment
  issuedAt: string
  expiresAt: string
  redeemed: boolean
  redeemedAt?: string
  frequencyWindowDays: number
}

export interface FrequencyCapStatus {
  memberId: string
  windowDays: number
  issuedInWindow: number
  maxPerWindow: number
  allowed: boolean
  nextAvailableAt?: string
}

// ─── ROI + 归因 ────────────────────────────────────────

export interface CampaignROI {
  campaignId: string
  campaignName: string
  sent: number
  clicked: number
  converted: number
  revenueCents: number
  costCents: number
  roi: number
  conversionRate: number
  ctr: number
  cpaCents: number
  periodDays: number
}

export interface TouchPoint {
  id: string
  memberId: string
  campaignId?: string
  channel: 'IN_APP' | 'WECHAT' | 'SMS' | 'DIRECT' | 'ORGANIC'
  event: 'IMPRESSION' | 'CLICK' | 'CONVERSION'
  timestamp: string
  revenueCents?: number
}

export interface AttributionResult {
  memberId: string
  conversionId: string
  revenueCents: number
  lastNonDirectTouch?: TouchPoint
  attributedCampaignId?: string
  attributedChannel?: string
  touchPoints: TouchPoint[]
  attributionWeights?: Record<string, number>
}