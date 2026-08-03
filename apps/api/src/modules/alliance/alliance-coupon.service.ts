/**
 * alliance-coupon.service.ts — WP-17B 联盟券互推 (BS-0220~BS-0221)
 *
 * 功能：
 *  - 跨品牌优惠券发放与核销
 *  - 优惠券结算逻辑
 */
import { Injectable, Logger } from '@nestjs/common'
import type { Grade } from './alliance-grade.service'
import { AllianceTierService } from './alliance-tier.service'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CrossBrandCoupon {
  couponId: string
  /** 发放方伙伴 ID */
  issuerPartnerId: string
  issuerPartnerName: string
  /** 面额（分） */
  denomination: number
  /** 最低消费门槛（分） */
  minSpend: number
  /** 有效开始日期 */
  validFrom: string
  /** 有效结束日期 */
  validTo: string
  /** 可核销的伙伴 ID 列表 */
  acceptedPartnerIds: string[]
  /** 当前状态 */
  status: 'active' | 'redeemed' | 'expired' | 'cancelled'
  /** 优惠券描述 */
  description: string
  createdAt: string
}

export interface CouponIssueRequest {
  issuerPartnerId: string
  issuerPartnerName: string
  denomination: number
  minSpend: number
  validFrom: string
  validTo: string
  acceptedPartnerIds: string[]
  description: string
}

export interface CouponRedemption {
  couponId: string
  partnerId: string
  partnerName: string
  orderId: string
  memberId: string
  orderAmount: number
  discountApplied: number
  redeemedAt: string
}

export interface CouponSettlement {
  couponId: string
  denomination: number
  totalDiscountApplied: number
  issuerPartnerId: string
  redeemPartnerId: string
  /** 发起方应支付额（分） */
  issuerPayAmount: number
  /** 核销方应收额（分） */
  redeemReceiveAmount: number
  /** 平台佣金（分） */
  platformCommission: number
  /** 结算状态 */
  status: 'pending' | 'settled' | 'disputed'
  createdAt: string
  settledAt?: string
}

export interface PartnerCouponStats {
  partnerId: string
  totalIssued: number
  totalRedeemed: number
  totalDiscountAmount: number
  pendingSettlement: number
  settledAmount: number
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class AllianceCouponService {
  private readonly logger = new Logger(AllianceCouponService.name)

  private coupons = new Map<string, CrossBrandCoupon>()
  private redemptions = new Map<string, CouponRedemption[]>()
  private settlements = new Map<string, CouponSettlement>()

  // 模拟的伙伴等级缓存
  private partnerGrades = new Map<string, Grade>()

  constructor(private readonly tierService: AllianceTierService) {}

  /**
   * 设置（模拟）伙伴等级
   */
  setPartnerGrade(partnerId: string, grade: Grade): void {
    this.partnerGrades.set(partnerId, grade)
  }

  /**
   * 获取伙伴等级
   */
  private getGrade(partnerId: string): Grade {
    return this.partnerGrades.get(partnerId) ?? 'C'
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 优惠券发放
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 发放跨品牌优惠券
   */
  issueCoupon(req: CouponIssueRequest): CrossBrandCoupon {
    if (!req.issuerPartnerId || !req.denomination || req.denomination <= 0) {
      throw new CouponError('INVALID_PARAMS', 'issuerPartnerId and positive denomination required')
    }
    if (!req.acceptedPartnerIds || req.acceptedPartnerIds.length === 0) {
      throw new CouponError('INVALID_PARAMS', 'at least one accepted partner required')
    }
    if (new Date(req.validFrom) >= new Date(req.validTo)) {
      throw new CouponError('INVALID_DATE_RANGE', 'validFrom must be before validTo')
    }

    const couponId = `coupon-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const coupon: CrossBrandCoupon = {
      couponId,
      issuerPartnerId: req.issuerPartnerId,
      issuerPartnerName: req.issuerPartnerName,
      denomination: req.denomination,
      minSpend: req.minSpend,
      validFrom: req.validFrom,
      validTo: req.validTo,
      acceptedPartnerIds: req.acceptedPartnerIds,
      status: 'active',
      description: req.description,
      createdAt: new Date().toISOString(),
    }
    this.coupons.set(couponId, coupon)
    this.logger.log(`Coupon issued: ${couponId} by ${req.issuerPartnerId} denom=${req.denomination}`)
    return coupon
  }

  /**
   * 获取优惠券
   */
  getCoupon(couponId: string): CrossBrandCoupon | undefined {
    return this.coupons.get(couponId)
  }

  /**
   * 列出指定伙伴发放的优惠券
   */
  listIssuedCoupons(partnerId: string): CrossBrandCoupon[] {
    return Array.from(this.coupons.values()).filter((c) => c.issuerPartnerId === partnerId)
  }

  /**
   * 列出指定伙伴可核销的优惠券
   */
  listRedeemableCoupons(partnerId: string): CrossBrandCoupon[] {
    return Array.from(this.coupons.values()).filter(
      (c) => c.status === 'active' && c.acceptedPartnerIds.includes(partnerId) && new Date(c.validTo) > new Date(),
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 优惠券核销
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 核销优惠券
   */
  redeemCoupon(couponId: string, partnerId: string, partnerName: string, orderId: string, memberId: string, orderAmount: number): CouponRedemption {
    const coupon = this.coupons.get(couponId)
    if (!coupon) {
      throw new CouponError('COUPON_NOT_FOUND', `coupon ${couponId} not found`)
    }
    if (coupon.status !== 'active') {
      throw new CouponError('COUPON_NOT_ACTIVE', `coupon ${couponId} is ${coupon.status}`)
    }
    if (!coupon.acceptedPartnerIds.includes(partnerId)) {
      throw new CouponError('PARTNER_NOT_ACCEPTED', `partner ${partnerId} not in accepted list`)
    }
    if (new Date(coupon.validTo) < new Date()) {
      throw new CouponError('COUPON_EXPIRED', `coupon ${couponId} expired`)
    }
    if (orderAmount < coupon.minSpend) {
      throw new CouponError('MIN_SPEND_NOT_MET', `order ${orderAmount} < minSpend ${coupon.minSpend}`)
    }

    // 计算实际优惠（不能超过订单金额）
    const discountApplied = Math.min(coupon.denomination, orderAmount)

    // 更新券状态
    coupon.status = 'redeemed'

    const redemption: CouponRedemption = {
      couponId,
      partnerId,
      partnerName,
      orderId,
      memberId,
      orderAmount,
      discountApplied,
      redeemedAt: new Date().toISOString(),
    }

    const redemptions = this.redemptions.get(couponId) ?? []
    redemptions.push(redemption)
    this.redemptions.set(couponId, redemptions)

    // 自动创建结算记录
    this.createSettlement(coupon, partnerId, discountApplied)

    this.logger.log(`Coupon redeemed: ${couponId} at ${partnerId} discount=${discountApplied}`)
    return redemption
  }

  /**
   * 取消优惠券
   */
  cancelCoupon(couponId: string): CrossBrandCoupon {
    const coupon = this.coupons.get(couponId)
    if (!coupon) {
      throw new CouponError('COUPON_NOT_FOUND', `coupon ${couponId} not found`)
    }
    if (coupon.status !== 'active') {
      throw new CouponError('COUPON_NOT_ACTIVE', `coupon ${couponId} is ${coupon.status}, cannot cancel`)
    }
    coupon.status = 'cancelled'
    this.logger.log(`Coupon cancelled: ${couponId}`)
    return coupon
  }

  /**
   * 获取优惠券的核销记录
   */
  getRedemptionHistory(couponId: string): CouponRedemption[] {
    return this.redemptions.get(couponId) ?? []
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 优惠券结算
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 创建结算记录
   */
  private createSettlement(coupon: CrossBrandCoupon, redeemPartnerId: string, discountApplied: number): CouponSettlement {
    // 根据发放方等级计算平台佣金
    const issuerGrade = this.getGrade(coupon.issuerPartnerId)
    const commission = this.tierService.calculateCouponCommission(issuerGrade, discountApplied)

    // 核销方应收 = 优惠券面额 - 平台佣金
    const redeemReceive = discountApplied - commission

    const settlementId = `stl-cpn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const settlement: CouponSettlement = {
      couponId: coupon.couponId,
      denomination: coupon.denomination,
      totalDiscountApplied: discountApplied,
      issuerPartnerId: coupon.issuerPartnerId,
      redeemPartnerId,
      issuerPayAmount: discountApplied,
      redeemReceiveAmount: redeemReceive,
      platformCommission: commission,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    this.settlements.set(settlementId, settlement)
    return settlement
  }

  /**
   * 查询优惠券结算记录
   */
  getCouponSettlement(couponId: string): CouponSettlement | undefined {
    return Array.from(this.settlements.values()).find((s) => s.couponId === couponId)
  }

  /**
   * 结算优惠券（标记为已结算）
   */
  settleCoupon(couponId: string): CouponSettlement {
    const settlement = Array.from(this.settlements.values()).find((s) => s.couponId === couponId)
    if (!settlement) {
      throw new CouponError('SETTLEMENT_NOT_FOUND', `settlement for coupon ${couponId} not found`)
    }
    if (settlement.status !== 'pending') {
      throw new CouponError('SETTLEMENT_ALREADY_SETTLED', `settlement for ${couponId} already ${settlement.status}`)
    }
    settlement.status = 'settled'
    settlement.settledAt = new Date().toISOString()
    this.logger.log(`Coupon settlement completed: ${couponId}`)
    return settlement
  }

  /**
   * 获取伙伴的优惠券统计
   */
  getPartnerCouponStats(partnerId: string): PartnerCouponStats {
    const issued = Array.from(this.coupons.values()).filter((c) => c.issuerPartnerId === partnerId)
    const issuedRedeemed = issued.filter((c) => c.status === 'redeemed')

    // 作为核销方
    const allRedemptions = Array.from(this.redemptions.values()).flat()
    const partnerRedemptions = allRedemptions.filter((r) => r.partnerId === partnerId)

    // 结算相关
    const partnerSettlements = Array.from(this.settlements.values()).filter(
      (s) => s.issuerPartnerId === partnerId || s.redeemPartnerId === partnerId,
    )
    const pendingSettlement = partnerSettlements
      .filter((s) => s.status === 'pending')
      .reduce((sum, s) => sum + s.totalDiscountApplied, 0)
    const settledAmount = partnerSettlements
      .filter((s) => s.status === 'settled')
      .reduce((sum, s) => sum + (s.issuerPartnerId === partnerId ? s.issuerPayAmount : s.redeemReceiveAmount), 0)

    return {
      partnerId,
      totalIssued: issued.length,
      totalRedeemed: issuedRedeemed.length,
      totalDiscountAmount: partnerRedemptions.reduce((sum, r) => sum + r.discountApplied, 0),
      pendingSettlement,
      settledAmount,
    }
  }

  /**
   * 获取所有待结算记录
   */
  getPendingSettlements(): CouponSettlement[] {
    return Array.from(this.settlements.values()).filter((s) => s.status === 'pending')
  }

  /**
   * 清除所有数据（测试用）
   */
  clearAll(): void {
    this.coupons.clear()
    this.redemptions.clear()
    this.settlements.clear()
  }
}

// ── Error ─────────────────────────────────────────────────────────────────────

export class CouponError extends Error {
  constructor(
    public readonly code:
      | 'INVALID_PARAMS'
      | 'INVALID_DATE_RANGE'
      | 'COUPON_NOT_FOUND'
      | 'COUPON_NOT_ACTIVE'
      | 'COUPON_EXPIRED'
      | 'PARTNER_NOT_ACCEPTED'
      | 'MIN_SPEND_NOT_MET'
      | 'SETTLEMENT_NOT_FOUND'
      | 'SETTLEMENT_ALREADY_SETTLED',
    message: string,
  ) {
    super(message)
    this.name = 'CouponError'
  }
}
