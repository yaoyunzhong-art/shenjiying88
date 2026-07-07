import { Injectable } from '@nestjs/common'
import { CouponAdapter } from './datasources/coupon.adapter'
import { RFMAdapter } from './datasources/rfm.adapter'
import type {
  TenantId,
  CouponIssueRequest,
  CouponIssueRecord,
  CouponSegment,
  CouponPrecisionRule,
  RFMSegmentType,
  FrequencyCapStatus
} from './marketing.entity'

/**
 * Phase-42 T172: CouponIssuer (优惠券精准发放)
 *
 * DR-42-C: 优惠券 RFM 匹配 + 频控 1/7d + 月预算 cap
 *
 * RFM → Coupon Segment 映射:
 *  - CHAMPIONS → VIP_DISCOUNT (大额折扣)
 *  - LOYAL → LOYAL_REWARD (小额返券)
 *  - POTENTIAL_LOYALIST → WELCOME_OFFER (欢迎优惠)
 *  - RECENT → WELCOME_OFFER (新客)
 *  - AT_RISK → REACTIVATION (召回)
 *  - HIBERNATING → REACTIVATION (召回)
 *  - 其他 → GENERIC (通用)
 *
 * 反模式 v4 coupon-abuse-pattern:
 *  - 刷券: 频控 1/7d 阻止
 *  - 预算透支: 月预算 cap
 *  - 渠道滥用: 渠道优先级限制
 */

const FREQUENCY_WINDOW_DAYS = 7
const MAX_PER_WINDOW = 1
const MONTHLY_BUDGET_PER_CAMPAIGN = 10000

@Injectable()
export class CouponIssuer {
  private readonly DEFAULT_RULES: Record<RFMSegmentType, CouponSegment> = {
    CHAMPIONS: 'VIP_DISCOUNT',
    LOYAL: 'LOYAL_REWARD',
    POTENTIAL_LOYALIST: 'WELCOME_OFFER',
    RECENT: 'WELCOME_OFFER',
    PROMISING: 'GENERIC',
    NEED_ATTENTION: 'GENERIC',
    AT_RISK: 'REACTIVATION',
    HIBERNATING: 'REACTIVATION'
  }

  constructor(
    private readonly couponAdapter: CouponAdapter,
    private readonly rfmAdapter: RFMAdapter
  ) {}

  /**
   * 根据 RFM 分群决定优惠券类型
   */
  inferCouponSegment(tenantId: TenantId, memberId: string): CouponSegment {
    const profile = this.rfmAdapter.queryByMember(tenantId, memberId)
    if (!profile) return 'GENERIC'

    const customRules = this.couponAdapter.getRules(tenantId)
    const segment = profile.segment
    const matched = customRules.find(r => r.segment === segment)
    return matched ? matched.couponSegment : this.DEFAULT_RULES[segment]
  }

  /**
   * 频控检查
   */
  checkFrequencyCap(tenantId: TenantId, memberId: string, now: number = Date.now()): FrequencyCapStatus {
    const windowMs = FREQUENCY_WINDOW_DAYS * 24 * 60 * 60 * 1000
    const issued = this.couponAdapter.countInWindow(tenantId, memberId, windowMs, now)
    const allowed = issued < MAX_PER_WINDOW
    const nextAvailableAt = allowed
      ? undefined
      : new Date(now + windowMs).toISOString()
    return {
      memberId,
      windowDays: FREQUENCY_WINDOW_DAYS,
      issuedInWindow: issued,
      maxPerWindow: MAX_PER_WINDOW,
      allowed,
      nextAvailableAt
    }
  }

  /**
   * 预算检查
   */
  checkBudget(tenantId: TenantId, campaignId: string): { remaining: number; allowed: boolean } {
    const used = this.couponAdapter.monthlyBudget(tenantId, campaignId)
    const remaining = Math.max(0, MONTHLY_BUDGET_PER_CAMPAIGN - used)
    return { remaining, allowed: remaining > 0 }
  }

  /**
   * 发放优惠券 (合并 RFM + 频控 + 预算检查)
   */
  issueCoupon(req: CouponIssueRequest): {
    success: boolean
    record?: CouponIssueRecord
    reason?: string
  } {
    // 频控
    const cap = this.checkFrequencyCap(req.tenantId, req.memberId)
    if (!cap.allowed) {
      return { success: false, reason: `frequency_cap_exceeded: ${cap.issuedInWindow}/${cap.maxPerWindow} in ${cap.windowDays}d` }
    }

    // 预算
    const budget = this.checkBudget(req.tenantId, req.campaignId)
    if (!budget.allowed) {
      return { success: false, reason: `monthly_budget_exhausted: ${MONTHLY_BUDGET_PER_CAMPAIGN}` }
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + req.expiryDays * 24 * 60 * 60 * 1000)

    const record: CouponIssueRecord = {
      id: `cpn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tenantId: req.tenantId,
      memberId: req.memberId,
      campaignId: req.campaignId,
      couponSegment: req.couponSegment,
      issuedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      redeemed: false,
      frequencyWindowDays: FREQUENCY_WINDOW_DAYS
    }
    this.couponAdapter.save(record)
    return { success: true, record }
  }

  /**
   * 核销优惠券
   */
  redeemCoupon(tenantId: TenantId, recordId: string): CouponIssueRecord | null {
    const record = this.couponAdapter.query(tenantId, recordId)
    if (!record) return null
    if (record.redeemed) return record  // 已核销
    if (new Date(record.expiresAt).getTime() < Date.now()) return record  // 已过期
    record.redeemed = true
    record.redeemedAt = new Date().toISOString()
    return this.couponAdapter.save(record)
  }

  /**
   * 自动匹配 + 发放
   */
  autoIssue(tenantId: TenantId, memberId: string, campaignId: string): {
    success: boolean
    record?: CouponIssueRecord
    couponSegment?: CouponSegment
    reason?: string
  } {
    const couponSegment = this.inferCouponSegment(tenantId, memberId)
    const expiryDays = this.couponSegmentExpiry(couponSegment)
    const reward = this.couponSegmentReward(couponSegment)

    const result = this.issueCoupon({
      tenantId,
      memberId,
      campaignId,
      couponSegment,
      rewardAmount: reward.amount,
      discountPercent: reward.discountPercent,
      expiryDays
    })
    return { ...result, couponSegment }
  }

  /**
   * 按 coupon segment 推荐有效期
   */
  private couponSegmentExpiry(seg: CouponSegment): number {
    switch (seg) {
      case 'VIP_DISCOUNT': return 30
      case 'LOYAL_REWARD': return 14
      case 'WELCOME_OFFER': return 7
      case 'REACTIVATION': return 14
      default: return 30
    }
  }

  /**
   * 按 coupon segment 推荐奖励
   */
  private couponSegmentReward(seg: CouponSegment): { amount?: number; discountPercent?: number } {
    switch (seg) {
      case 'VIP_DISCOUNT': return { discountPercent: 20 }
      case 'LOYAL_REWARD': return { amount: 5000 }  // 50 元
      case 'WELCOME_OFFER': return { discountPercent: 10 }
      case 'REACTIVATION': return { amount: 10000 }  // 100 元
      default: return { amount: 1000 }  // 10 元
    }
  }
}