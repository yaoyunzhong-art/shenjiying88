/**
 * Phase-42 T172: Marketing Contract 跨模块契约类型
 *
 * 稳定的跨模块通信接口，其他模块通过此契约消费营销数据。
 */

import type {
  RFMProfile,
  RFMStats,
  RFMSegmentType,
  ABExperiment,
  ABResult,
  CampaignROI,
  FrequencyCapStatus,
  CouponIssueRecord,
} from './marketing.entity'

/** RFM 合约（对外安全子集） */
export interface RFMProfileContract {
  memberId: string
  segment: RFMSegmentType
  recencyDays: number
  frequencyHigh: boolean
  monetaryHigh: boolean
}

/** A/B 实验合约 */
export interface ABExperimentContract {
  id: string
  name: string
  status: string
  result?: ABResult
  pValue?: number
}

/** 优惠券发放合约 */
export interface CouponIssueContract {
  id: string
  memberId: string
  couponSegment: string
  issuedAt: string
  expiresAt: string
}

/** ROI 合约 */
export interface CampaignROIContract {
  campaignId: string
  roi: number
  conversionRate: number
  cpaCents: number
  periodDays: number
}

/** 频控合约 */
export interface FrequencyCapContract {
  memberId: string
  allowed: boolean
  nextAvailableAt?: string
}

/** 营销汇总合约 */
export interface MarketingSummaryContract {
  tenantId: string
  segmentDistribution: Record<RFMSegmentType, number>
  totalMembers: number
  activeExperiments: number
  recentCampaigns: number
  timestamp: string
}

// ─── Converter helpers ──────────────────────────────

/** 将内部 RFMProfile 转换为外部合约 */
export function toRFMProfileContract(profile: RFMProfile): RFMProfileContract {
  return {
    memberId: profile.memberId,
    segment: profile.segment,
    recencyDays: profile.daysSinceLastOrder,
    frequencyHigh: profile.frequency === 'HIGH',
    monetaryHigh: profile.monetary === 'HIGH',
  }
}

/** 将内部 ABExperiment 转换为外部合约 */
export function toABExperimentContract(exp: ABExperiment): ABExperimentContract {
  return {
    id: exp.id,
    name: exp.name,
    status: exp.status,
    result: exp.result,
    pValue: exp.pValue,
  }
}

/** 将内部 CouponIssueRecord 转换为外部合约 */
export function toCouponIssueContract(record: CouponIssueRecord): CouponIssueContract {
  return {
    id: record.id,
    memberId: record.memberId,
    couponSegment: record.couponSegment,
    issuedAt: record.issuedAt,
    expiresAt: record.expiresAt,
  }
}

/** 将内部 CampaignROI 转换为外部合约 */
export function toCampaignROIContract(roi: CampaignROI): CampaignROIContract {
  return {
    campaignId: roi.campaignId,
    roi: roi.roi,
    conversionRate: roi.conversionRate,
    cpaCents: roi.cpaCents,
    periodDays: roi.periodDays,
  }
}

/** 将内部 FrequencyCapStatus 转换为外部合约 */
export function toFrequencyCapContract(cap: FrequencyCapStatus): FrequencyCapContract {
  return {
    memberId: cap.memberId,
    allowed: cap.allowed,
    nextAvailableAt: cap.nextAvailableAt,
  }
}
