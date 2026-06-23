import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { MemberService } from '../member/member.service'
import type { CashierOrder, CashierPayment } from '../cashier/cashier.entity'
import type { LytOrderSnapshot, LytPaymentSnapshot } from '../transactions/transactions.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  BlindboxFulfillmentStatus,
  CouponDiscountType,
  CouponRedemptionStatus,
  LoyaltyPlanStatus,
  LoyaltySettlementStatus,
  type BlindboxFulfillment,
  type BlindboxPlan,
  type CouponPlan,
  type CouponRedemption,
  type LoyaltyOrderSettlement,
  type PointsLedgerEntry
} from './loyalty.entity'

const pointsLedgerStore = new Map<string, PointsLedgerEntry>()
const couponRedemptionStore = new Map<string, CouponRedemption>()
const blindboxFulfillmentStore = new Map<string, BlindboxFulfillment>()
const settlementStore = new Map<string, LoyaltyOrderSettlement>()
const couponPlanStore = new Map<string, CouponPlan>()
const blindboxPlanStore = new Map<string, BlindboxPlan>()

@Injectable()
export class LoyaltyService {
  constructor(private readonly memberService: MemberService) {}

  private buildOrderSettlementInput(
    order: CashierOrder | LytOrderSnapshot,
    payment: CashierPayment | LytPaymentSnapshot
  ) {
    const tenantContext = order.tenantContext
    const memberId = order.memberId
    if (!memberId) {
      throw new Error(`Order ${'orderId' in order ? order.orderId : order.externalOrderId} missing memberId`)
    }

    return {
      tenantContext,
      memberId,
      orderId: 'orderId' in order ? order.orderId : order.externalOrderId,
      paymentId: 'paymentId' in payment ? payment.paymentId : payment.externalPaymentId,
      amount: 'amount' in payment ? payment.amount : 0,
      channel: 'channel' in payment ? payment.channel : payment.paymentChannel,
      paidAt:
        'completedAt' in payment
          ? payment.completedAt ?? payment.updatedAt
          : ('paidAt' in payment ? payment.paidAt : undefined),
      couponCode: 'couponCode' in order ? order.couponCode : order.couponCode,
      blindboxPlanId: 'blindboxPlanId' in order ? order.blindboxPlanId : order.blindboxPlanId,
      blindboxQuantity: 'blindboxQuantity' in order ? order.blindboxQuantity : order.blindboxQuantity
    }
  }

  private buildRewardSku(blindboxPlanId: string, quantity: number) {
    return `${blindboxPlanId}-reward-${Math.max(1, quantity)}`
  }

  listPointsLedger(tenantId: string): PointsLedgerEntry[] {
    return Array.from(pointsLedgerStore.values()).filter(
      (entry) => entry.tenantContext.tenantId === tenantId
    )
  }

  listCouponRedemptions(tenantId: string): CouponRedemption[] {
    return Array.from(couponRedemptionStore.values()).filter(
      (entry) => entry.tenantContext.tenantId === tenantId
    )
  }

  listBlindboxFulfillments(tenantId: string): BlindboxFulfillment[] {
    return Array.from(blindboxFulfillmentStore.values()).filter(
      (entry) => entry.tenantContext.tenantId === tenantId
    )
  }

  listSettlements(tenantId: string): LoyaltyOrderSettlement[] {
    return Array.from(settlementStore.values()).filter(
      (entry) => entry.tenantContext.tenantId === tenantId
    )
  }

  getSettlement(orderId: string, tenantId: string): LoyaltyOrderSettlement | undefined {
    const settlement = settlementStore.get(orderId)
    if (!settlement || settlement.tenantContext.tenantId !== tenantId) {
      return undefined
    }
    return settlement
  }

  listPointsLedgerForOrder(orderId: string, tenantId: string): PointsLedgerEntry[] {
    return this.listPointsLedger(tenantId).filter((entry) => entry.orderId === orderId)
  }

  listCouponRedemptionsForOrder(orderId: string, tenantId: string): CouponRedemption[] {
    return this.listCouponRedemptions(tenantId).filter((entry) => entry.orderId === orderId)
  }

  listBlindboxFulfillmentsForOrder(orderId: string, tenantId: string): BlindboxFulfillment[] {
    return this.listBlindboxFulfillments(tenantId).filter((entry) => entry.orderId === orderId)
  }

  private getReversedPoints(orderId: string, tenantId: string) {
    return Math.abs(
      this.listPointsLedgerForOrder(orderId, tenantId)
        .filter((entry) => entry.points < 0)
        .reduce((sum, entry) => sum + entry.points, 0)
    )
  }

  private listBlindboxRollbackRecords(orderId: string, tenantId: string) {
    return this.listBlindboxFulfillmentsForOrder(orderId, tenantId)
      .filter((entry) => entry.status === BlindboxFulfillmentStatus.Revoked)
  }

  async settlePaidOrder(order: CashierOrder | LytOrderSnapshot, payment: CashierPayment | LytPaymentSnapshot) {
    const settlementInput = this.buildOrderSettlementInput(order, payment)
    const existing = settlementStore.get(settlementInput.orderId)
    if (existing?.status === LoyaltySettlementStatus.Succeeded) {
      return existing
    }

    const now = settlementInput.paidAt ?? new Date().toISOString()
    const awardedPoints = Math.max(1, Math.floor(settlementInput.amount))
    await this.memberService.awardPoints(settlementInput.memberId, awardedPoints, settlementInput.tenantContext)
    await this.memberService.recordPaymentActivity({
      memberId: settlementInput.memberId,
      tenantContext: settlementInput.tenantContext,
      orderId: settlementInput.orderId,
      amount: settlementInput.amount,
      paidAt: now,
      channel: settlementInput.channel,
      source: 'orderId' in order ? 'cashier' : 'lyt-snapshot'
    })

    const pointsEntry: PointsLedgerEntry = {
      entryId: `points-${randomUUID()}`,
      tenantContext: settlementInput.tenantContext,
      memberId: settlementInput.memberId,
      orderId: settlementInput.orderId,
      paymentId: settlementInput.paymentId,
      points: awardedPoints,
      reason: 'cashier.payment-succeeded',
      createdAt: now
    }
    pointsLedgerStore.set(pointsEntry.entryId, pointsEntry)

    if (settlementInput.couponCode) {
      const coupon: CouponRedemption = {
        redemptionId: `coupon-${randomUUID()}`,
        tenantContext: settlementInput.tenantContext,
        orderId: settlementInput.orderId,
        paymentId: settlementInput.paymentId,
        memberId: settlementInput.memberId,
        couponCode: settlementInput.couponCode,
        status: CouponRedemptionStatus.Redeemed,
        createdAt: now
      }
      couponRedemptionStore.set(coupon.redemptionId, coupon)
    }

    if (settlementInput.blindboxPlanId) {
      const fulfillment: BlindboxFulfillment = {
        fulfillmentId: `blindbox-${randomUUID()}`,
        tenantContext: settlementInput.tenantContext,
        orderId: settlementInput.orderId,
        paymentId: settlementInput.paymentId,
        memberId: settlementInput.memberId,
        blindboxPlanId: settlementInput.blindboxPlanId,
        quantity: settlementInput.blindboxQuantity ?? 1,
        rewardSku: this.buildRewardSku(settlementInput.blindboxPlanId, settlementInput.blindboxQuantity ?? 1),
        status: BlindboxFulfillmentStatus.Fulfilled,
        createdAt: now
      }
      blindboxFulfillmentStore.set(fulfillment.fulfillmentId, fulfillment)
    }

    const settlement: LoyaltyOrderSettlement = {
      settlementId: existing?.settlementId ?? `settlement-${randomUUID()}`,
      tenantContext: settlementInput.tenantContext,
      orderId: settlementInput.orderId,
      paymentId: settlementInput.paymentId,
      memberId: settlementInput.memberId,
      status: LoyaltySettlementStatus.Succeeded,
      awardedPoints,
      couponCode: settlementInput.couponCode,
      blindboxPlanId: settlementInput.blindboxPlanId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    }
    settlementStore.set(settlementInput.orderId, settlement)
    return settlement
  }

  async settleFailedOrder(order: CashierOrder | LytOrderSnapshot, payment: CashierPayment | LytPaymentSnapshot) {
    const settlementInput = this.buildOrderSettlementInput(order, payment)
    const existing = settlementStore.get(settlementInput.orderId)
    const now = new Date().toISOString()

    if (settlementInput.couponCode) {
      const coupon: CouponRedemption = {
        redemptionId: `coupon-${randomUUID()}`,
        tenantContext: settlementInput.tenantContext,
        orderId: settlementInput.orderId,
        paymentId: settlementInput.paymentId,
        memberId: settlementInput.memberId,
        couponCode: settlementInput.couponCode,
        status: CouponRedemptionStatus.Released,
        createdAt: now
      }
      couponRedemptionStore.set(coupon.redemptionId, coupon)
    }

    const settlement: LoyaltyOrderSettlement = {
      settlementId: existing?.settlementId ?? `settlement-${randomUUID()}`,
      tenantContext: settlementInput.tenantContext,
      orderId: settlementInput.orderId,
      paymentId: settlementInput.paymentId,
      memberId: settlementInput.memberId,
      status: LoyaltySettlementStatus.Failed,
      awardedPoints: 0,
      couponCode: settlementInput.couponCode,
      blindboxPlanId: settlementInput.blindboxPlanId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    }
    settlementStore.set(settlementInput.orderId, settlement)
    return settlement
  }

  async settlePaidOrderFromSnapshots(order: LytOrderSnapshot, payment: LytPaymentSnapshot) {
    return this.settlePaidOrder(order, payment)
  }

  async settleFailedOrderFromSnapshots(order: LytOrderSnapshot, payment: LytPaymentSnapshot) {
    return this.settleFailedOrder(order, payment)
  }

  async applyRefund(
    order: CashierOrder,
    payment: CashierPayment,
    refundAmount: number,
    options?: { revokeBlindbox?: boolean }
  ) {
    if (refundAmount <= 0) {
      throw new Error('Refund amount must be positive')
    }

    const settlement = settlementStore.get(order.orderId)
    if (!settlement || settlement.status !== LoyaltySettlementStatus.Succeeded) {
      return {
        reversedPoints: 0,
        releasedCoupon: false,
        revokedBlindbox: false
      }
    }

    const now = new Date().toISOString()
    const alreadyReversedPoints = this.getReversedPoints(order.orderId, order.tenantContext.tenantId)
    const availableRollbackPoints = Math.max(0, settlement.awardedPoints - alreadyReversedPoints)
    const rollbackPoints = Math.min(availableRollbackPoints, Math.max(0, Math.floor(refundAmount)))

    if (rollbackPoints > 0) {
      await this.memberService.rollbackPoints(order.memberId, rollbackPoints, order.tenantContext)
      const pointsEntry: PointsLedgerEntry = {
        entryId: `points-${randomUUID()}`,
        tenantContext: order.tenantContext,
        memberId: order.memberId,
        orderId: order.orderId,
        paymentId: payment.paymentId,
        points: -rollbackPoints,
        reason: 'transaction.refund-completed',
        createdAt: now
      }
      pointsLedgerStore.set(pointsEntry.entryId, pointsEntry)
    }

    let releasedCoupon = false
    const couponReleased = order.couponCode
      ? this.listCouponRedemptionsForOrder(order.orderId, order.tenantContext.tenantId)
        .some((entry) => entry.status === CouponRedemptionStatus.Released)
      : false

    if (order.couponCode && !couponReleased) {
      const coupon: CouponRedemption = {
        redemptionId: `coupon-${randomUUID()}`,
        tenantContext: order.tenantContext,
        orderId: order.orderId,
        paymentId: payment.paymentId,
        memberId: order.memberId,
        couponCode: order.couponCode,
        status: CouponRedemptionStatus.Released,
        createdAt: now
      }
      couponRedemptionStore.set(coupon.redemptionId, coupon)
      releasedCoupon = true
    }

    let revokedBlindbox = false
    const shouldRevokeBlindbox = Boolean(options?.revokeBlindbox && order.blindboxPlanId)
    const blindboxAlreadyRevoked =
      shouldRevokeBlindbox &&
      this.listBlindboxRollbackRecords(order.orderId, order.tenantContext.tenantId).length > 0

    if (shouldRevokeBlindbox && !blindboxAlreadyRevoked) {
      const originalFulfillment = this.listBlindboxFulfillmentsForOrder(
        order.orderId,
        order.tenantContext.tenantId
      ).find((entry) => entry.status === BlindboxFulfillmentStatus.Fulfilled)

      if (originalFulfillment) {
        const rollbackRecord: BlindboxFulfillment = {
          fulfillmentId: `blindbox-${randomUUID()}`,
          tenantContext: order.tenantContext,
          orderId: order.orderId,
          paymentId: payment.paymentId,
          memberId: order.memberId,
          blindboxPlanId: order.blindboxPlanId!,
          quantity: originalFulfillment.quantity,
          rewardSku: originalFulfillment.rewardSku,
          status: BlindboxFulfillmentStatus.Revoked,
          relatedFulfillmentId: originalFulfillment.fulfillmentId,
          reason: 'transaction.full-refund',
          createdAt: now
        }
        blindboxFulfillmentStore.set(rollbackRecord.fulfillmentId, rollbackRecord)
        revokedBlindbox = true
      }
    }

    return {
      reversedPoints: rollbackPoints,
      releasedCoupon,
      revokedBlindbox
    }
  }

  // ── CouponPlan / BlindboxPlan management ───────────────────────────

  registerCouponPlan(input: {
    tenantContext: RequestTenantContext
    code: string
    title: string
    description?: string
    discountType: CouponDiscountType
    discountValue: number
    minOrderAmount?: number
    totalQuota: number
    perMemberLimit: number
    validFrom: string
    validUntil: string
  }): CouponPlan {
    if (input.discountValue <= 0) {
      throw new Error('Coupon discountValue must be positive')
    }
    if (input.totalQuota <= 0) {
      throw new Error('Coupon totalQuota must be positive')
    }
    if (input.perMemberLimit <= 0) {
      throw new Error('Coupon perMemberLimit must be positive')
    }
    if (input.discountType === CouponDiscountType.Percentage && input.discountValue > 100) {
      throw new Error('Percentage discount cannot exceed 100')
    }
    const now = new Date().toISOString()
    const plan: CouponPlan = {
      planId: `coupon-plan-${randomUUID()}`,
      tenantContext: input.tenantContext,
      code: input.code,
      title: input.title,
      description: input.description,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrderAmount: input.minOrderAmount,
      totalQuota: input.totalQuota,
      remainingQuota: input.totalQuota,
      perMemberLimit: input.perMemberLimit,
      validFrom: input.validFrom,
      validUntil: input.validUntil,
      status: LoyaltyPlanStatus.Draft,
      createdAt: now,
      updatedAt: now
    }
    couponPlanStore.set(plan.planId, plan)
    return plan
  }

  updateCouponPlanStatus(planId: string, status: LoyaltyPlanStatus, tenantId: string): CouponPlan {
    const plan = couponPlanStore.get(planId)
    if (!plan || plan.tenantContext.tenantId !== tenantId) {
      throw new Error(`Coupon plan not found: ${planId}`)
    }
    plan.status = status
    plan.updatedAt = new Date().toISOString()
    couponPlanStore.set(planId, plan)
    return plan
  }

  listCouponPlans(tenantId: string): CouponPlan[] {
    return Array.from(couponPlanStore.values()).filter(
      (plan) => plan.tenantContext.tenantId === tenantId
    )
  }

  getCouponPlan(planId: string, tenantId: string): CouponPlan | undefined {
    const plan = couponPlanStore.get(planId)
    if (!plan || plan.tenantContext.tenantId !== tenantId) return undefined
    return plan
  }

  getCouponPlanByCode(code: string, tenantId: string): CouponPlan | undefined {
    return Array.from(couponPlanStore.values()).find(
      (plan) => plan.tenantContext.tenantId === tenantId && plan.code === code
    )
  }

  registerBlindboxPlan(input: {
    tenantContext: RequestTenantContext
    blindboxPlanId: string
    title: string
    description?: string
    unitPrice: number
    totalQuota: number
    rewardPool: Array<{ sku: string; weight: number; label: string }>
    validFrom: string
    validUntil: string
  }): BlindboxPlan {
    if (input.unitPrice < 0) {
      throw new Error('Blindbox unitPrice must be non-negative')
    }
    if (input.totalQuota <= 0) {
      throw new Error('Blindbox totalQuota must be positive')
    }
    if (input.rewardPool.length === 0) {
      throw new Error('Blindbox rewardPool must contain at least one reward')
    }
    const totalWeight = input.rewardPool.reduce((sum, r) => sum + r.weight, 0)
    if (totalWeight <= 0) {
      throw new Error('Blindbox rewardPool weights must sum to a positive number')
    }
    const now = new Date().toISOString()
    const plan: BlindboxPlan = {
      planId: `blindbox-plan-${randomUUID()}`,
      tenantContext: input.tenantContext,
      blindboxPlanId: input.blindboxPlanId,
      title: input.title,
      description: input.description,
      unitPrice: input.unitPrice,
      totalQuota: input.totalQuota,
      remainingQuota: input.totalQuota,
      rewardPool: input.rewardPool,
      validFrom: input.validFrom,
      validUntil: input.validUntil,
      status: LoyaltyPlanStatus.Draft,
      createdAt: now,
      updatedAt: now
    }
    blindboxPlanStore.set(plan.planId, plan)
    return plan
  }

  updateBlindboxPlanStatus(planIdOrCode: string, status: LoyaltyPlanStatus, tenantId: string): BlindboxPlan {
    const plan =
      blindboxPlanStore.get(planIdOrCode)
      ?? this.getBlindboxPlanByCode(planIdOrCode, tenantId)
    if (!plan || plan.tenantContext.tenantId !== tenantId) {
      throw new Error(`Blindbox plan not found: ${planIdOrCode}`)
    }
    plan.status = status
    plan.updatedAt = new Date().toISOString()
    blindboxPlanStore.set(plan.planId, plan)
    return plan
  }

  listBlindboxPlans(tenantId: string): BlindboxPlan[] {
    return Array.from(blindboxPlanStore.values()).filter(
      (plan) => plan.tenantContext.tenantId === tenantId
    )
  }

  getBlindboxPlan(planId: string, tenantId: string): BlindboxPlan | undefined {
    const plan = blindboxPlanStore.get(planId)
    if (!plan || plan.tenantContext.tenantId !== tenantId) return undefined
    return plan
  }

  getBlindboxPlanByCode(blindboxPlanId: string, tenantId: string): BlindboxPlan | undefined {
    return Array.from(blindboxPlanStore.values()).find(
      (plan) => plan.tenantContext.tenantId === tenantId && plan.blindboxPlanId === blindboxPlanId
    )
  }

  // ── Plan-driven issuance ───────────────────────────────────────────

  issueCouponFromPlan(input: {
    tenantContext: RequestTenantContext
    memberId: string
    planId: string
    source?: string
  }): CouponRedemption {
    const plan = couponPlanStore.get(input.planId)
    if (!plan || plan.tenantContext.tenantId !== input.tenantContext.tenantId) {
      throw new Error(`Coupon plan not found: ${input.planId}`)
    }
    if (plan.status !== LoyaltyPlanStatus.Active) {
      throw new Error(`Coupon plan is not active: ${input.planId} (status=${plan.status})`)
    }
    const nowIso = new Date().toISOString()
    if (nowIso < plan.validFrom || nowIso > plan.validUntil) {
      throw new Error(`Coupon plan is outside its validity window: ${input.planId}`)
    }
    if (plan.remainingQuota <= 0) {
      throw new Error(`Coupon plan quota exhausted: ${input.planId}`)
    }
    const memberRedemptions = Array.from(couponRedemptionStore.values()).filter(
      (r) =>
        r.tenantContext.tenantId === input.tenantContext.tenantId &&
        r.memberId === input.memberId &&
        r.couponCode === plan.code
    )
    if (memberRedemptions.length >= plan.perMemberLimit) {
      throw new Error(`Member has reached per-member limit for coupon plan: ${input.planId}`)
    }
    plan.remainingQuota -= 1
    plan.updatedAt = nowIso
    couponPlanStore.set(plan.planId, plan)

    const redemption: CouponRedemption = {
      redemptionId: `coupon-${randomUUID()}`,
      tenantContext: input.tenantContext,
      orderId: `pending-${input.memberId}-${plan.code}-${Date.now()}`,
      paymentId: `pending-${input.memberId}-${plan.code}-${Date.now()}`,
      memberId: input.memberId,
      couponCode: plan.code,
      status: CouponRedemptionStatus.Redeemed,
      createdAt: nowIso
    }
    couponRedemptionStore.set(redemption.redemptionId, redemption)
    return redemption
  }

  private pickBlindboxReward(plan: BlindboxPlan): { sku: string; label: string } {
    const totalWeight = plan.rewardPool.reduce((sum, r) => sum + r.weight, 0)
    let roll = Math.random() * totalWeight
    for (const reward of plan.rewardPool) {
      roll -= reward.weight
      if (roll <= 0) {
        return { sku: reward.sku, label: reward.label }
      }
    }
    const fallback = plan.rewardPool[plan.rewardPool.length - 1]!
    return { sku: fallback.sku, label: fallback.label }
  }

  issueBlindboxFromPlan(input: {
    tenantContext: RequestTenantContext
    memberId: string
    planId: string
    quantity?: number
  }): BlindboxFulfillment {
    const plan =
      blindboxPlanStore.get(input.planId)
      ?? this.getBlindboxPlanByCode(input.planId, input.tenantContext.tenantId)
    if (!plan || plan.tenantContext.tenantId !== input.tenantContext.tenantId) {
      throw new Error(`Blindbox plan not found: ${input.planId}`)
    }
    if (plan.status !== LoyaltyPlanStatus.Active) {
      throw new Error(`Blindbox plan is not active: ${input.planId} (status=${plan.status})`)
    }
    const nowIso = new Date().toISOString()
    if (nowIso < plan.validFrom || nowIso > plan.validUntil) {
      throw new Error(`Blindbox plan is outside its validity window: ${input.planId}`)
    }
    const quantity = Math.max(1, input.quantity ?? 1)
    if (plan.remainingQuota < quantity) {
      throw new Error(
        `Blindbox plan insufficient quota: requested=${quantity}, remaining=${plan.remainingQuota}`
      )
    }
    plan.remainingQuota -= quantity
    plan.updatedAt = nowIso
    blindboxPlanStore.set(plan.planId, plan)

    const pick = this.pickBlindboxReward(plan)
    const fulfillment: BlindboxFulfillment = {
      fulfillmentId: `blindbox-${randomUUID()}`,
      tenantContext: input.tenantContext,
      orderId: `pending-${input.memberId}-${plan.blindboxPlanId}-${Date.now()}`,
      paymentId: `pending-${input.memberId}-${plan.blindboxPlanId}-${Date.now()}`,
      memberId: input.memberId,
      blindboxPlanId: plan.blindboxPlanId,
      quantity,
      rewardSku: pick.sku,
      status: BlindboxFulfillmentStatus.Fulfilled,
      createdAt: nowIso
    }
    blindboxFulfillmentStore.set(fulfillment.fulfillmentId, fulfillment)
    return fulfillment
  }

  resetLoyaltyStoresForTests(): void {
    pointsLedgerStore.clear()
    couponRedemptionStore.clear()
    blindboxFulfillmentStore.clear()
    settlementStore.clear()
    couponPlanStore.clear()
    blindboxPlanStore.clear()
  }

  // ── Read aggregates (consumed by analytics) ────────────────────────

  getLoyaltySummary(input: {
    tenantId: string
    brandId?: string
    storeId?: string
  }): {
    settlementCount: number
    settlementSuccessCount: number
    couponRedemptionCount: number
    blindboxFulfillmentCount: number
    pointsIn: number
    pointsOut: number
  } {
    const matchesScope = (ctx: RequestTenantContext): boolean => {
      if (ctx.tenantId !== input.tenantId) return false
      if (input.brandId && ctx.brandId !== input.brandId) return false
      if (input.storeId && ctx.storeId !== input.storeId) return false
      return true
    }
    const settlements = Array.from(settlementStore.values()).filter((s) => matchesScope(s.tenantContext))
    const coupons = Array.from(couponRedemptionStore.values()).filter((r) => matchesScope(r.tenantContext))
    const blindboxes = Array.from(blindboxFulfillmentStore.values()).filter((f) => matchesScope(f.tenantContext))
    const points = Array.from(pointsLedgerStore.values()).filter((p) => matchesScope(p.tenantContext))

    return {
      settlementCount: settlements.length,
      settlementSuccessCount: settlements.filter((s) => s.status === LoyaltySettlementStatus.Succeeded).length,
      couponRedemptionCount: coupons.length,
      blindboxFulfillmentCount: blindboxes.length,
      pointsIn: points.filter((p) => p.points > 0).reduce((sum, p) => sum + p.points, 0),
      pointsOut: points.filter((p) => p.points < 0).reduce((sum, p) => sum + Math.abs(p.points), 0)
    }
  }
}
