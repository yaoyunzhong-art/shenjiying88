import { createHash, randomUUID } from 'node:crypto'
import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common'
import { RedisService } from '../../infrastructure/redis/redis.module'
import { MarketingMetricsService } from '../marketing-metrics/marketing-metrics.service'
import { MemberService } from '../member/member.service'
import type { CashierOrder, CashierPayment } from '../cashier/cashier.entity'
import type { LytOrderSnapshot, LytPaymentSnapshot } from '../transactions/transactions.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  type BlindboxAuditIntegrityReport,
  type BlindboxDrawAuditPage,
  BlindboxQuotaExecutionMode,
  BlindboxRewardTier,
  type BlindboxDrawAuditLog,
  BlindboxFulfillmentStatus,
  type BlindboxMemberOverview,
  CouponDiscountType,
  CouponRedemptionStatus,
  LoyaltyPlanStatus,
  LoyaltySettlementStatus,
  type BlindboxCaseGuarantee,
  type BlindboxFulfillment,
  type BlindboxPlan,
  type BlindboxProbabilityOverview,
  type BlindboxProbabilityDisclosureEntry,
  type BlindboxRewardEntry,
  type BlindboxRewardResult,
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
const blindboxDrawAuditStore = new Map<string, BlindboxDrawAuditLog>()

const BLINDBOX_QUOTA_DECREMENT_LUA = `
local current = redis.call('GET', KEYS[1])
if not current then
  return {-2, -2}
end

current = tonumber(current)
local quantity = tonumber(ARGV[1])
if current < quantity then
  return {0, current}
end

local nextQuota = current - quantity
redis.call('SET', KEYS[1], nextQuota)
return {1, current, nextQuota}
`

const BLINDBOX_OFFICIAL_TIER_ORDER = [
  BlindboxRewardTier.Standard,
  BlindboxRewardTier.Hot,
  BlindboxRewardTier.Hidden,
  BlindboxRewardTier.SuperHidden
] as const

const BLINDBOX_OFFICIAL_TIER_PROBABILITY: Record<BlindboxRewardTier, number> = {
  [BlindboxRewardTier.Standard]: 70,
  [BlindboxRewardTier.Hot]: 20,
  [BlindboxRewardTier.Hidden]: 8,
  [BlindboxRewardTier.SuperHidden]: 2
}

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name)

  constructor(
    @Inject(MemberService) private readonly memberService: MemberService,
    @Optional() @Inject(RedisService) private readonly redisService?: RedisService,
    @Optional() @Inject(MarketingMetricsService) private readonly marketingMetricsService?: MarketingMetricsService
  ) {}

  private inferBlindboxRewardTier(index: number, size: number): BlindboxRewardTier {
    if (size === 4) {
      return [
        BlindboxRewardTier.Standard,
        BlindboxRewardTier.Hot,
        BlindboxRewardTier.Hidden,
        BlindboxRewardTier.SuperHidden
      ][index]!
    }
    return BlindboxRewardTier.Standard
  }

  private normalizeBlindboxRewardPool(
    rewardPool: Array<{ sku: string; weight: number; label: string; tier?: BlindboxRewardTier }>
  ): BlindboxRewardEntry[] {
    const hasExplicitTier = rewardPool.some((reward) => reward.tier != null)
    if (hasExplicitTier && rewardPool.some((reward) => reward.tier == null)) {
      throw new BadRequestException('Blindbox rewardPool tiers must be either all specified or all omitted')
    }
    return rewardPool.map((reward, index) => ({
      sku: reward.sku,
      weight: reward.weight,
      label: reward.label,
      tier: reward.tier ?? this.inferBlindboxRewardTier(index, rewardPool.length)
    }))
  }

  private buildBlindboxProbabilityDisclosure(
    rewardPool: BlindboxRewardEntry[]
  ): BlindboxProbabilityDisclosureEntry[] {
    const grouped = rewardPool.reduce((acc, reward) => {
      const existing = acc.get(reward.tier) ?? { tier: reward.tier, weight: 0, probabilityPct: 0 }
      existing.weight += reward.weight
      acc.set(reward.tier, existing)
      return acc
    }, new Map<BlindboxRewardTier, BlindboxProbabilityDisclosureEntry>())
    const totalWeight = rewardPool.reduce((sum, reward) => sum + reward.weight, 0)
    return Array.from(grouped.values())
      .map((entry) => ({
        ...entry,
        probabilityPct: totalWeight <= 0 ? 0 : Number(((entry.weight / totalWeight) * 100).toFixed(2))
      }))
      .sort(
        (left, right) =>
          BLINDBOX_OFFICIAL_TIER_ORDER.indexOf(left.tier) - BLINDBOX_OFFICIAL_TIER_ORDER.indexOf(right.tier)
      )
  }

  private validateBlindboxOfficialTierDistribution(rewardPool: BlindboxRewardEntry[]): void {
    const tiers = new Set(rewardPool.map((reward) => reward.tier))
    const isOfficialFourTierPool = BLINDBOX_OFFICIAL_TIER_ORDER.every((tier) => tiers.has(tier))
    if (!isOfficialFourTierPool) {
      return
    }

    const disclosure = this.buildBlindboxProbabilityDisclosure(rewardPool)
    for (const entry of disclosure) {
      const expectedProbabilityPct = BLINDBOX_OFFICIAL_TIER_PROBABILITY[entry.tier]
      if (Math.abs(entry.probabilityPct - expectedProbabilityPct) > 0.01) {
        throw new BadRequestException(
          `Blindbox official four-tier probability mismatch for ${entry.tier}: expected ${expectedProbabilityPct}%, got ${entry.probabilityPct}%`
        )
      }
    }
  }

  private validateBlindboxCaseGuarantee(
    caseGuarantee: BlindboxCaseGuarantee | undefined,
    rewardPool: BlindboxRewardEntry[]
  ): void {
    if (!caseGuarantee) {
      return
    }
    if (caseGuarantee.caseSize <= 0) {
      throw new BadRequestException('Blindbox caseGuarantee.caseSize must be positive')
    }
    if (!rewardPool.some((reward) => reward.tier === caseGuarantee.guaranteedTier)) {
      throw new BadRequestException(`Blindbox rewardPool missing guaranteed tier: ${caseGuarantee.guaranteedTier}`)
    }
    if (caseGuarantee.distinctRewards) {
      const distinctSkuCount = new Set(rewardPool.map((reward) => reward.sku)).size
      if (distinctSkuCount < caseGuarantee.caseSize) {
        throw new BadRequestException(
          `Blindbox rewardPool distinct sku count ${distinctSkuCount} cannot satisfy case guarantee size ${caseGuarantee.caseSize}`
        )
      }
    }
  }

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

  private buildLegacyBlindboxRewards(blindboxPlanId: string, quantity: number): BlindboxRewardResult[] {
    return Array.from({ length: Math.max(1, quantity) }, (_value, index) => ({
      sku: this.buildRewardSku(blindboxPlanId, index + 1),
      label: `reward-${index + 1}`,
      tier: BlindboxRewardTier.Standard
    }))
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
    try {
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
    } catch {
      // Local smoke should continue even when member persistence tables are absent.
    }

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

    this.marketingMetricsService?.recordHistogram(
      'order_value',
      settlementInput.amount,
      settlementInput.tenantContext.tenantId
    )

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
      this.marketingMetricsService?.incrCouponRedemption(
        false,
        settlementInput.tenantContext.tenantId
      )
    }

    if (settlementInput.blindboxPlanId) {
      const rewards = this.buildLegacyBlindboxRewards(
        settlementInput.blindboxPlanId,
        settlementInput.blindboxQuantity ?? 1
      )
      const auditLogId = `blindbox-audit-${randomUUID()}`
      const fulfillment: BlindboxFulfillment = {
        fulfillmentId: `blindbox-${randomUUID()}`,
        tenantContext: settlementInput.tenantContext,
        orderId: settlementInput.orderId,
        paymentId: settlementInput.paymentId,
        memberId: settlementInput.memberId,
        blindboxPlanId: settlementInput.blindboxPlanId,
        quantity: settlementInput.blindboxQuantity ?? 1,
        rewardSku: rewards[0]!.sku,
        rewards,
        quotaExecutionMode: BlindboxQuotaExecutionMode.InMemoryFallback,
        auditLogId,
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
      try {
        await this.memberService.rollbackPoints(order.memberId, rollbackPoints, order.tenantContext)
      } catch {
        // Local smoke should continue even when member persistence tables are absent.
      }
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
          rewards: originalFulfillment.rewards,
          guaranteeApplied: originalFulfillment.guaranteeApplied,
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
      throw new BadRequestException('Coupon discountValue must be positive')
    }
    if (input.totalQuota <= 0) {
      throw new BadRequestException('Coupon totalQuota must be positive')
    }
    if (input.perMemberLimit <= 0) {
      throw new BadRequestException('Coupon perMemberLimit must be positive')
    }
    if (input.discountType === CouponDiscountType.Percentage && input.discountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100')
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
      throw new NotFoundException(`Coupon plan not found: ${planId}`)
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
    rewardPool: Array<{ sku: string; weight: number; label: string; tier?: BlindboxRewardTier }>
    caseGuarantee?: BlindboxCaseGuarantee
    validFrom: string
    validUntil: string
  }): BlindboxPlan {
    if (input.unitPrice < 0) {
      throw new BadRequestException('Blindbox unitPrice must be non-negative')
    }
    if (input.totalQuota <= 0) {
      throw new BadRequestException('Blindbox totalQuota must be positive')
    }
    if (input.rewardPool.length === 0) {
      throw new BadRequestException('Blindbox rewardPool must contain at least one reward')
    }
    const normalizedRewardPool = this.normalizeBlindboxRewardPool(input.rewardPool)
    const totalWeight = normalizedRewardPool.reduce((sum, r) => sum + r.weight, 0)
    if (totalWeight <= 0) {
      throw new BadRequestException('Blindbox rewardPool weights must sum to a positive number')
    }
    this.validateBlindboxOfficialTierDistribution(normalizedRewardPool)
    this.validateBlindboxCaseGuarantee(input.caseGuarantee, normalizedRewardPool)
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
      rewardPool: normalizedRewardPool,
      probabilityDisclosure: this.buildBlindboxProbabilityDisclosure(normalizedRewardPool),
      caseGuarantee: input.caseGuarantee,
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
      throw new NotFoundException(`Blindbox plan not found: ${planIdOrCode}`)
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

  getBlindboxProbabilityOverview(
    planIdOrCode: string,
    tenantId: string,
    options?: { historyOffset?: number; historyLimit?: number }
  ): BlindboxProbabilityOverview | undefined {
    const plan = this.getBlindboxPlan(planIdOrCode, tenantId)
      ?? this.getBlindboxPlanByCode(planIdOrCode, tenantId)
    if (!plan) {
      return undefined
    }
    const historyOffset = Math.max(0, options?.historyOffset ?? 0)
    const historyLimit = Math.min(50, Math.max(1, options?.historyLimit ?? 10))
    const allDrawRecords = this.listBlindboxDrawAuditLogs(tenantId, { planId: plan.planId })
    const recentDrawRecords = allDrawRecords.slice(historyOffset, historyOffset + historyLimit)
    return {
      planId: plan.planId,
      blindboxPlanId: plan.blindboxPlanId,
      title: plan.title,
      status: plan.status,
      totalQuota: plan.totalQuota,
      remainingQuota: plan.remainingQuota,
      probabilityDisclosure: plan.probabilityDisclosure ?? [],
      recentDrawRecordTotal: allDrawRecords.length,
      historyLimitApplied: historyLimit,
      hasMoreRecentDrawRecords: historyOffset + recentDrawRecords.length < allDrawRecords.length,
      recentDrawRecords,
      caseGuarantee: plan.caseGuarantee,
      updatedAt: plan.updatedAt
    }
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
      throw new NotFoundException(`Coupon plan not found: ${input.planId}`)
    }
    if (plan.status !== LoyaltyPlanStatus.Active) {
      throw new ConflictException(`Coupon plan is not active: ${input.planId} (status=${plan.status})`)
    }
    const nowIso = new Date().toISOString()
    if (nowIso < plan.validFrom || nowIso > plan.validUntil) {
      throw new ConflictException(`Coupon plan is outside its validity window: ${input.planId}`)
    }
    if (plan.remainingQuota <= 0) {
      throw new ConflictException(`Coupon plan quota exhausted: ${input.planId}`)
    }
    const memberRedemptions = Array.from(couponRedemptionStore.values()).filter(
      (r) =>
        r.tenantContext.tenantId === input.tenantContext.tenantId &&
        r.memberId === input.memberId &&
        r.couponCode === plan.code
    )
    if (memberRedemptions.length >= plan.perMemberLimit) {
      throw new ConflictException(`Member has reached per-member limit for coupon plan: ${input.planId}`)
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
    this.marketingMetricsService?.incrCouponIssued(1, input.tenantContext.tenantId)
    return redemption
  }

  private pickBlindboxRewardFromPool(rewardPool: BlindboxRewardEntry[]): BlindboxRewardResult {
    const totalWeight = rewardPool.reduce((sum, reward) => sum + reward.weight, 0)
    let roll = Math.random() * totalWeight
    for (const reward of rewardPool) {
      roll -= reward.weight
      if (roll <= 0) {
        return { sku: reward.sku, label: reward.label, tier: reward.tier }
      }
    }
    const fallback = rewardPool[rewardPool.length - 1]!
    return { sku: fallback.sku, label: fallback.label, tier: fallback.tier }
  }

  private drawBlindboxRewards(plan: BlindboxPlan, quantity: number): {
    rewards: BlindboxRewardResult[]
    guaranteeApplied: boolean
  } {
    const rewards: BlindboxRewardResult[] = []
    const usedSkus = new Set<string>()
    const caseGuarantee = plan.caseGuarantee && quantity >= plan.caseGuarantee.caseSize
      ? plan.caseGuarantee
      : undefined

    for (let index = 0; index < quantity; index += 1) {
      const candidatePool = caseGuarantee?.distinctRewards
        ? plan.rewardPool.filter((reward) => !usedSkus.has(reward.sku))
        : plan.rewardPool
      const poolToUse = candidatePool.length > 0 ? candidatePool : plan.rewardPool
      const pick = this.pickBlindboxRewardFromPool(poolToUse)
      rewards.push(pick)
      usedSkus.add(pick.sku)
    }

    if (!caseGuarantee) {
      return { rewards, guaranteeApplied: false }
    }

    if (rewards.some((reward) => reward.tier === caseGuarantee.guaranteedTier)) {
      return { rewards, guaranteeApplied: false }
    }

    const guaranteePool = plan.rewardPool.filter(
      (reward) =>
        reward.tier === caseGuarantee.guaranteedTier &&
        (!caseGuarantee.distinctRewards || !usedSkus.has(reward.sku))
    )
    const fallbackGuaranteePool = guaranteePool.length > 0
      ? guaranteePool
      : plan.rewardPool.filter((reward) => reward.tier === caseGuarantee.guaranteedTier)
    const forcedReward = this.pickBlindboxRewardFromPool(fallbackGuaranteePool)
    rewards[rewards.length - 1] = forcedReward
    return { rewards, guaranteeApplied: true }
  }

  private listBlindboxDrawAuditLogsAscending(tenantId: string): BlindboxDrawAuditLog[] {
    return Array.from(blindboxDrawAuditStore.values())
      .filter((entry) => entry.tenantContext.tenantId === tenantId)
      .sort((a, b) => a.sequence - b.sequence)
  }

  private buildBlindboxAuditHash(input: {
    auditLogId: string
    sequence: number
    tenantContext: RequestTenantContext
    memberId: string
    planId: string
    quantity: number
    quotaBefore: number
    quotaAfter: number
    quotaExecutionMode: BlindboxQuotaExecutionMode
    previousAuditLogId?: string
    previousHash?: string
    createdAt: string
    rewards: BlindboxRewardResult[]
  }): string {
    const payload = JSON.stringify({
      auditLogId: input.auditLogId,
      sequence: input.sequence,
      tenantId: input.tenantContext.tenantId,
      brandId: input.tenantContext.brandId ?? null,
      storeId: input.tenantContext.storeId ?? null,
      marketCode: input.tenantContext.marketCode ?? null,
      memberId: input.memberId,
      planId: input.planId,
      quantity: input.quantity,
      quotaBefore: input.quotaBefore,
      quotaAfter: input.quotaAfter,
      quotaExecutionMode: input.quotaExecutionMode,
      previousAuditLogId: input.previousAuditLogId ?? null,
      previousHash: input.previousHash ?? null,
      createdAt: input.createdAt,
      rewards: input.rewards.map((reward) => ({
        sku: reward.sku,
        label: reward.label,
        tier: reward.tier
      }))
    })
    return createHash('sha256').update(payload).digest('hex')
  }

  private createImmutableBlindboxAuditLog(input: Omit<BlindboxDrawAuditLog, 'auditHash'>): BlindboxDrawAuditLog {
    const rewards = Object.freeze(
      input.rewards.map((reward) => Object.freeze({ ...reward }))
    ) as BlindboxRewardResult[]
    const auditHash = this.buildBlindboxAuditHash({
      ...input,
      rewards
    })

    return Object.freeze({
      ...input,
      rewards,
      auditHash
    })
  }

  private finalizeBlindboxIssue(input: {
    tenantContext: RequestTenantContext
    memberId: string
    plan: BlindboxPlan
    quantity: number
    quotaBefore: number
    quotaAfter: number
    executionMode: BlindboxQuotaExecutionMode
    createdAt: string
  }): BlindboxFulfillment {
    const { rewards, guaranteeApplied } = this.drawBlindboxRewards(input.plan, input.quantity)
    const auditLogId = `blindbox-audit-${randomUUID()}`
    const previousAuditLog = this.listBlindboxDrawAuditLogsAscending(input.tenantContext.tenantId).at(-1)
    const fulfillment: BlindboxFulfillment = {
      fulfillmentId: `blindbox-${randomUUID()}`,
      tenantContext: input.tenantContext,
      orderId: `pending-${input.memberId}-${input.plan.blindboxPlanId}-${Date.now()}`,
      paymentId: `pending-${input.memberId}-${input.plan.blindboxPlanId}-${Date.now()}`,
      memberId: input.memberId,
      blindboxPlanId: input.plan.blindboxPlanId,
      quantity: input.quantity,
      rewardSku: rewards[0]!.sku,
      rewards,
      guaranteeApplied,
      quotaExecutionMode: input.executionMode,
      auditLogId,
      status: BlindboxFulfillmentStatus.Fulfilled,
      createdAt: input.createdAt
    }
    blindboxFulfillmentStore.set(fulfillment.fulfillmentId, fulfillment)

    const auditLog: Omit<BlindboxDrawAuditLog, 'auditHash'> = {
      auditLogId,
      sequence: (previousAuditLog?.sequence ?? 0) + 1,
      tenantContext: input.tenantContext,
      memberId: input.memberId,
      planId: input.plan.planId,
      quantity: input.quantity,
      quotaBefore: input.quotaBefore,
      quotaAfter: input.quotaAfter,
      quotaExecutionMode: input.executionMode,
      previousAuditLogId: previousAuditLog?.auditLogId,
      previousHash: previousAuditLog?.auditHash,
      createdAt: input.createdAt,
      rewards
    }
    blindboxDrawAuditStore.set(auditLogId, this.createImmutableBlindboxAuditLog(auditLog))

    return fulfillment
  }

  listBlindboxDrawAuditLogs(
    tenantId: string,
    query?: { memberId?: string; planId?: string; blindboxPlanId?: string }
  ): BlindboxDrawAuditLog[] {
    let entries = this.listBlindboxDrawAuditLogsAscending(tenantId)

    if (query?.memberId) {
      entries = entries.filter((entry) => entry.memberId === query.memberId)
    }

    const resolvedPlanId = query?.planId
      ?? (query?.blindboxPlanId
        ? this.getBlindboxPlanByCode(query.blindboxPlanId, tenantId)?.planId
        : undefined)

    if (resolvedPlanId) {
      entries = entries.filter((entry) => entry.planId === resolvedPlanId)
    }

    return entries.sort((a, b) => b.sequence - a.sequence)
  }

  listBlindboxDrawAuditLogPage(
    tenantId: string,
    query?: {
      memberId?: string
      planId?: string
      blindboxPlanId?: string
      offset?: number
      limit?: number
    }
  ): BlindboxDrawAuditPage {
    const entries = this.listBlindboxDrawAuditLogs(tenantId, query)
    const offset = Math.max(0, query?.offset ?? 0)
    const limit = Math.max(1, query?.limit ?? 20)
    const items = entries.slice(offset, offset + limit)

    return {
      items,
      total: entries.length,
      offset,
      limit,
      hasMore: offset + items.length < entries.length
    }
  }

  getBlindboxMemberOverview(tenantId: string, memberId: string): BlindboxMemberOverview {
    const fulfillments = this.listBlindboxFulfillments(tenantId)
      .filter((entry) => entry.memberId === memberId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const drawLogs = this.listBlindboxDrawAuditLogs(tenantId, { memberId })
    const latestFulfillment = fulfillments[0]
    const latestReward = latestFulfillment?.rewards?.[0]

    return {
      memberId,
      totalFulfillments: fulfillments.length,
      totalDrawQuantity: fulfillments.reduce((sum, entry) => sum + entry.quantity, 0),
      guaranteeHitCount: fulfillments.filter((entry) => entry.guaranteeApplied).length,
      totalSpentQuota: drawLogs.reduce((sum, entry) => sum + entry.quantity, 0),
      latestBlindboxPlanId: latestFulfillment?.blindboxPlanId,
      latestRewardSku: latestReward?.sku ?? latestFulfillment?.rewardSku,
      latestRewardTier: latestReward?.tier,
      lastFulfillmentAt: latestFulfillment?.createdAt,
      lastAuditAt: drawLogs[0]?.createdAt
    }
  }

  getBlindboxDrawAuditIntegrityReport(tenantId: string): BlindboxAuditIntegrityReport {
    const entries = this.listBlindboxDrawAuditLogsAscending(tenantId)
    const checkedAt = new Date().toISOString()

    let previousAuditLogId: string | undefined
    let previousHash: string | undefined

    for (const entry of entries) {
      if (entry.previousAuditLogId !== previousAuditLogId) {
        return {
          valid: false,
          totalLogs: entries.length,
          checkedAt,
          lastAuditLogId: previousAuditLogId,
          lastHash: previousHash,
          brokenAuditLogId: entry.auditLogId,
          expectedHash: previousHash,
          actualHash: entry.previousHash,
          reason: 'previous link mismatch'
        }
      }

      if (entry.previousHash !== previousHash) {
        return {
          valid: false,
          totalLogs: entries.length,
          checkedAt,
          lastAuditLogId: previousAuditLogId,
          lastHash: previousHash,
          brokenAuditLogId: entry.auditLogId,
          expectedHash: previousHash,
          actualHash: entry.previousHash,
          reason: 'previous hash mismatch'
        }
      }

      const expectedHash = this.buildBlindboxAuditHash({
        auditLogId: entry.auditLogId,
        sequence: entry.sequence,
        tenantContext: entry.tenantContext,
        memberId: entry.memberId,
        planId: entry.planId,
        quantity: entry.quantity,
        quotaBefore: entry.quotaBefore,
        quotaAfter: entry.quotaAfter,
        quotaExecutionMode: entry.quotaExecutionMode,
        previousAuditLogId: entry.previousAuditLogId,
        previousHash: entry.previousHash,
        createdAt: entry.createdAt,
        rewards: entry.rewards
      })

      if (entry.auditHash !== expectedHash) {
        return {
          valid: false,
          totalLogs: entries.length,
          checkedAt,
          lastAuditLogId: previousAuditLogId,
          lastHash: previousHash,
          brokenAuditLogId: entry.auditLogId,
          expectedHash,
          actualHash: entry.auditHash,
          reason: 'audit hash mismatch'
        }
      }

      previousAuditLogId = entry.auditLogId
      previousHash = entry.auditHash
    }

    return {
      valid: true,
      totalLogs: entries.length,
      checkedAt,
      lastAuditLogId: previousAuditLogId,
      lastHash: previousHash
    }
  }

  private getBlindboxQuotaRedisKey(plan: BlindboxPlan): string {
    return `loyalty:blindbox:quota:${plan.tenantContext.tenantId}:${plan.planId}`
  }

  private isRedisReady(): boolean {
    return this.redisService?.client?.status === 'ready'
  }

  private async ensureBlindboxQuotaRedisSnapshot(plan: BlindboxPlan): Promise<void> {
    if (!this.isRedisReady()) {
      return
    }
    await this.redisService!.client.set(
      this.getBlindboxQuotaRedisKey(plan),
      String(plan.remainingQuota),
      'NX'
    )
  }

  private async reserveBlindboxQuotaWithRedis(plan: BlindboxPlan, quantity: number): Promise<{
    quotaBefore: number
    quotaAfter: number
    executionMode: BlindboxQuotaExecutionMode
  }> {
    await this.ensureBlindboxQuotaRedisSnapshot(plan)
    const response = await this.redisService!.client.eval(
      BLINDBOX_QUOTA_DECREMENT_LUA,
      1,
      this.getBlindboxQuotaRedisKey(plan),
      String(quantity)
    ) as [number, number, number?]
    const status = Number(response[0] ?? -2)
    if (status === 1) {
      return {
        quotaBefore: Number(response[1]),
        quotaAfter: Number(response[2]),
        executionMode: BlindboxQuotaExecutionMode.RedisLua
      }
    }
    if (status === 0) {
      throw new ConflictException(
        `Blindbox plan insufficient quota: requested=${quantity}, remaining=${Number(response[1] ?? 0)}`
      )
    }
    throw new NotFoundException(`Blindbox redis quota snapshot missing: ${plan.planId}`)
  }

  private reserveBlindboxQuotaInMemory(plan: BlindboxPlan, quantity: number): {
    quotaBefore: number
    quotaAfter: number
    executionMode: BlindboxQuotaExecutionMode
  } {
    if (plan.remainingQuota < quantity) {
      throw new ConflictException(
        `Blindbox plan insufficient quota: requested=${quantity}, remaining=${plan.remainingQuota}`
      )
    }
    const quotaBefore = plan.remainingQuota
    plan.remainingQuota -= quantity
    return {
      quotaBefore,
      quotaAfter: plan.remainingQuota,
      executionMode: BlindboxQuotaExecutionMode.InMemoryFallback
    }
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
      throw new NotFoundException(`Blindbox plan not found: ${input.planId}`)
    }
    if (plan.status !== LoyaltyPlanStatus.Active) {
      throw new ConflictException(`Blindbox plan is not active: ${input.planId} (status=${plan.status})`)
    }
    const nowIso = new Date().toISOString()
    if (nowIso < plan.validFrom || nowIso > plan.validUntil) {
      throw new ConflictException(`Blindbox plan is outside its validity window: ${input.planId}`)
    }
    const quantity = Math.max(1, input.quantity ?? 1)
    const quotaReservation = this.reserveBlindboxQuotaInMemory(plan, quantity)
    plan.updatedAt = nowIso
    blindboxPlanStore.set(plan.planId, plan)
    return this.finalizeBlindboxIssue({
      tenantContext: input.tenantContext,
      memberId: input.memberId,
      plan,
      quantity,
      quotaBefore: quotaReservation.quotaBefore,
      quotaAfter: quotaReservation.quotaAfter,
      executionMode: quotaReservation.executionMode,
      createdAt: nowIso
    })
  }

  async issueBlindboxFromPlanAtomically(input: {
    tenantContext: RequestTenantContext
    memberId: string
    planId: string
    quantity?: number
  }): Promise<BlindboxFulfillment> {
    const plan =
      blindboxPlanStore.get(input.planId)
      ?? this.getBlindboxPlanByCode(input.planId, input.tenantContext.tenantId)
    if (!plan || plan.tenantContext.tenantId !== input.tenantContext.tenantId) {
      throw new NotFoundException(`Blindbox plan not found: ${input.planId}`)
    }
    if (plan.status !== LoyaltyPlanStatus.Active) {
      throw new ConflictException(`Blindbox plan is not active: ${input.planId} (status=${plan.status})`)
    }
    const nowIso = new Date().toISOString()
    if (nowIso < plan.validFrom || nowIso > plan.validUntil) {
      throw new ConflictException(`Blindbox plan is outside its validity window: ${input.planId}`)
    }
    const quantity = Math.max(1, input.quantity ?? 1)
    try {
      if (this.isRedisReady()) {
        const quotaReservation = await this.reserveBlindboxQuotaWithRedis(plan, quantity)
        plan.remainingQuota = quotaReservation.quotaAfter
        plan.updatedAt = nowIso
        blindboxPlanStore.set(plan.planId, plan)
        return this.finalizeBlindboxIssue({
          tenantContext: input.tenantContext,
          memberId: input.memberId,
          plan,
          quantity,
          quotaBefore: quotaReservation.quotaBefore,
          quotaAfter: quotaReservation.quotaAfter,
          executionMode: quotaReservation.executionMode,
          createdAt: nowIso
        })
      }
    } catch (error) {
      this.logger.warn(`Blindbox redis Lua fallback to memory: ${(error as Error).message}`)
    }
    return this.issueBlindboxFromPlan(input)
  }

  resetLoyaltyStoresForTests(): void {
    pointsLedgerStore.clear()
    couponRedemptionStore.clear()
    blindboxFulfillmentStore.clear()
    blindboxDrawAuditStore.clear()
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
