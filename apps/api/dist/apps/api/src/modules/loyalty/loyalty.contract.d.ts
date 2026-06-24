import type { LoyaltyOrderSettlement, PointsLedgerEntry, CouponRedemption, BlindboxFulfillment, CouponPlan, BlindboxPlan, LoyaltySettlementStatus, CouponRedemptionStatus, BlindboxFulfillmentStatus, CouponDiscountType, LoyaltyPlanStatus } from './loyalty.entity';
/**
 * Contract types for loyalty module cross-boundary communication.
 * These are the stable surface that other modules consume.
 */
/** External contract for loyalty settlement (cross-module safe subset) */
export interface LoyaltySettlementContract {
    settlementId: string;
    orderId: string;
    paymentId: string;
    memberId: string;
    status: LoyaltySettlementStatus;
    awardedPoints: number;
    couponCode?: string;
    blindboxPlanId?: string;
    createdAt: string;
}
/** External contract for points ledger entry */
export interface PointsLedgerContract {
    entryId: string;
    memberId: string;
    orderId: string;
    paymentId: string;
    points: number;
    reason: string;
    createdAt: string;
}
/** External contract for coupon redemption */
export interface CouponRedemptionContract {
    redemptionId: string;
    orderId: string;
    paymentId: string;
    memberId: string;
    couponCode: string;
    status: CouponRedemptionStatus;
    createdAt: string;
}
/** External contract for blindbox fulfillment */
export interface BlindboxFulfillmentContract {
    fulfillmentId: string;
    orderId: string;
    paymentId: string;
    memberId: string;
    blindboxPlanId: string;
    quantity: number;
    rewardSku: string;
    status: BlindboxFulfillmentStatus;
    createdAt: string;
}
/** External contract for coupon plan */
export interface CouponPlanContract {
    planId: string;
    code: string;
    title: string;
    description?: string;
    discountType: CouponDiscountType;
    discountValue: number;
    minOrderAmount?: number;
    totalQuota: number;
    remainingQuota: number;
    perMemberLimit: number;
    validFrom: string;
    validUntil: string;
    status: LoyaltyPlanStatus;
}
/** External contract for blindbox plan */
export interface BlindboxPlanContract {
    planId: string;
    blindboxPlanId: string;
    title: string;
    description?: string;
    unitPrice: number;
    totalQuota: number;
    remainingQuota: number;
    validFrom: string;
    validUntil: string;
    status: LoyaltyPlanStatus;
}
/** Summary of loyalty activity for a given order */
export interface LoyaltyOrderSummaryContract {
    orderId: string;
    settlement?: LoyaltySettlementContract;
    pointsEntries: PointsLedgerContract[];
    couponRedemptions: CouponRedemptionContract[];
    blindboxFulfillments: BlindboxFulfillmentContract[];
}
/**
 * Convert internal LoyaltyOrderSettlement to cross-module contract.
 * Strips tenantContext for safe external exposure.
 */
export declare function toLoyaltySettlementContract(settlement: LoyaltyOrderSettlement): LoyaltySettlementContract;
/**
 * Convert internal PointsLedgerEntry to cross-module contract.
 */
export declare function toPointsLedgerContract(entry: PointsLedgerEntry): PointsLedgerContract;
/**
 * Convert internal CouponRedemption to cross-module contract.
 */
export declare function toCouponRedemptionContract(redemption: CouponRedemption): CouponRedemptionContract;
/**
 * Convert internal BlindboxFulfillment to cross-module contract.
 */
export declare function toBlindboxFulfillmentContract(fulfillment: BlindboxFulfillment): BlindboxFulfillmentContract;
/**
 * Convert internal CouponPlan to cross-module contract.
 */
export declare function toCouponPlanContract(plan: CouponPlan): CouponPlanContract;
/**
 * Convert internal BlindboxPlan to cross-module contract.
 */
export declare function toBlindboxPlanContract(plan: BlindboxPlan): BlindboxPlanContract;
/**
 * Build a loyalty order summary contract from individual related entities.
 */
export declare function toLoyaltyOrderSummaryContract(params: {
    settlement?: LoyaltyOrderSettlement;
    pointsEntries: PointsLedgerEntry[];
    couponRedemptions: CouponRedemption[];
    blindboxFulfillments: BlindboxFulfillment[];
}): LoyaltyOrderSummaryContract;
//# sourceMappingURL=loyalty.contract.d.ts.map