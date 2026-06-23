import type {
  LoyaltyOrderSettlement,
  PointsLedgerEntry,
  CouponRedemption,
  BlindboxFulfillment,
  CouponPlan,
  BlindboxPlan,
  LoyaltySettlementStatus,
  CouponRedemptionStatus,
  BlindboxFulfillmentStatus,
  CouponDiscountType,
  LoyaltyPlanStatus,
} from './loyalty.entity'

/**
 * Contract types for loyalty module cross-boundary communication.
 * These are the stable surface that other modules consume.
 */

/** External contract for loyalty settlement (cross-module safe subset) */
export interface LoyaltySettlementContract {
  settlementId: string
  orderId: string
  paymentId: string
  memberId: string
  status: LoyaltySettlementStatus
  awardedPoints: number
  couponCode?: string
  blindboxPlanId?: string
  createdAt: string
}

/** External contract for points ledger entry */
export interface PointsLedgerContract {
  entryId: string
  memberId: string
  orderId: string
  paymentId: string
  points: number
  reason: string
  createdAt: string
}

/** External contract for coupon redemption */
export interface CouponRedemptionContract {
  redemptionId: string
  orderId: string
  paymentId: string
  memberId: string
  couponCode: string
  status: CouponRedemptionStatus
  createdAt: string
}

/** External contract for blindbox fulfillment */
export interface BlindboxFulfillmentContract {
  fulfillmentId: string
  orderId: string
  paymentId: string
  memberId: string
  blindboxPlanId: string
  quantity: number
  rewardSku: string
  status: BlindboxFulfillmentStatus
  createdAt: string
}

/** External contract for coupon plan */
export interface CouponPlanContract {
  planId: string
  code: string
  title: string
  description?: string
  discountType: CouponDiscountType
  discountValue: number
  minOrderAmount?: number
  totalQuota: number
  remainingQuota: number
  perMemberLimit: number
  validFrom: string
  validUntil: string
  status: LoyaltyPlanStatus
}

/** External contract for blindbox plan */
export interface BlindboxPlanContract {
  planId: string
  blindboxPlanId: string
  title: string
  description?: string
  unitPrice: number
  totalQuota: number
  remainingQuota: number
  validFrom: string
  validUntil: string
  status: LoyaltyPlanStatus
}

/** Summary of loyalty activity for a given order */
export interface LoyaltyOrderSummaryContract {
  orderId: string
  settlement?: LoyaltySettlementContract
  pointsEntries: PointsLedgerContract[]
  couponRedemptions: CouponRedemptionContract[]
  blindboxFulfillments: BlindboxFulfillmentContract[]
}

/**
 * Convert internal LoyaltyOrderSettlement to cross-module contract.
 * Strips tenantContext for safe external exposure.
 */
export function toLoyaltySettlementContract(
  settlement: LoyaltyOrderSettlement
): LoyaltySettlementContract {
  return {
    settlementId: settlement.settlementId,
    orderId: settlement.orderId,
    paymentId: settlement.paymentId,
    memberId: settlement.memberId,
    status: settlement.status,
    awardedPoints: settlement.awardedPoints,
    couponCode: settlement.couponCode,
    blindboxPlanId: settlement.blindboxPlanId,
    createdAt: settlement.createdAt,
  }
}

/**
 * Convert internal PointsLedgerEntry to cross-module contract.
 */
export function toPointsLedgerContract(
  entry: PointsLedgerEntry
): PointsLedgerContract {
  return {
    entryId: entry.entryId,
    memberId: entry.memberId,
    orderId: entry.orderId,
    paymentId: entry.paymentId,
    points: entry.points,
    reason: entry.reason,
    createdAt: entry.createdAt,
  }
}

/**
 * Convert internal CouponRedemption to cross-module contract.
 */
export function toCouponRedemptionContract(
  redemption: CouponRedemption
): CouponRedemptionContract {
  return {
    redemptionId: redemption.redemptionId,
    orderId: redemption.orderId,
    paymentId: redemption.paymentId,
    memberId: redemption.memberId,
    couponCode: redemption.couponCode,
    status: redemption.status,
    createdAt: redemption.createdAt,
  }
}

/**
 * Convert internal BlindboxFulfillment to cross-module contract.
 */
export function toBlindboxFulfillmentContract(
  fulfillment: BlindboxFulfillment
): BlindboxFulfillmentContract {
  return {
    fulfillmentId: fulfillment.fulfillmentId,
    orderId: fulfillment.orderId,
    paymentId: fulfillment.paymentId,
    memberId: fulfillment.memberId,
    blindboxPlanId: fulfillment.blindboxPlanId,
    quantity: fulfillment.quantity,
    rewardSku: fulfillment.rewardSku,
    status: fulfillment.status,
    createdAt: fulfillment.createdAt,
  }
}

/**
 * Convert internal CouponPlan to cross-module contract.
 */
export function toCouponPlanContract(
  plan: CouponPlan
): CouponPlanContract {
  return {
    planId: plan.planId,
    code: plan.code,
    title: plan.title,
    description: plan.description,
    discountType: plan.discountType,
    discountValue: plan.discountValue,
    minOrderAmount: plan.minOrderAmount,
    totalQuota: plan.totalQuota,
    remainingQuota: plan.remainingQuota,
    perMemberLimit: plan.perMemberLimit,
    validFrom: plan.validFrom,
    validUntil: plan.validUntil,
    status: plan.status,
  }
}

/**
 * Convert internal BlindboxPlan to cross-module contract.
 */
export function toBlindboxPlanContract(
  plan: BlindboxPlan
): BlindboxPlanContract {
  return {
    planId: plan.planId,
    blindboxPlanId: plan.blindboxPlanId,
    title: plan.title,
    description: plan.description,
    unitPrice: plan.unitPrice,
    totalQuota: plan.totalQuota,
    remainingQuota: plan.remainingQuota,
    validFrom: plan.validFrom,
    validUntil: plan.validUntil,
    status: plan.status,
  }
}

/**
 * Build a loyalty order summary contract from individual related entities.
 */
export function toLoyaltyOrderSummaryContract(params: {
  settlement?: LoyaltyOrderSettlement
  pointsEntries: PointsLedgerEntry[]
  couponRedemptions: CouponRedemption[]
  blindboxFulfillments: BlindboxFulfillment[]
}): LoyaltyOrderSummaryContract {
  if (!params.settlement) {
    throw new Error('Cannot build loyalty order summary without a settlement')
  }

  return {
    orderId: params.settlement.orderId,
    settlement: toLoyaltySettlementContract(params.settlement),
    pointsEntries: params.pointsEntries.map(toPointsLedgerContract),
    couponRedemptions: params.couponRedemptions.map(toCouponRedemptionContract),
    blindboxFulfillments: params.blindboxFulfillments.map(toBlindboxFulfillmentContract),
  }
}
