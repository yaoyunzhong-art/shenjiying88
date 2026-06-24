"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toLoyaltySettlementContract = toLoyaltySettlementContract;
exports.toPointsLedgerContract = toPointsLedgerContract;
exports.toCouponRedemptionContract = toCouponRedemptionContract;
exports.toBlindboxFulfillmentContract = toBlindboxFulfillmentContract;
exports.toCouponPlanContract = toCouponPlanContract;
exports.toBlindboxPlanContract = toBlindboxPlanContract;
exports.toLoyaltyOrderSummaryContract = toLoyaltyOrderSummaryContract;
/**
 * Convert internal LoyaltyOrderSettlement to cross-module contract.
 * Strips tenantContext for safe external exposure.
 */
function toLoyaltySettlementContract(settlement) {
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
    };
}
/**
 * Convert internal PointsLedgerEntry to cross-module contract.
 */
function toPointsLedgerContract(entry) {
    return {
        entryId: entry.entryId,
        memberId: entry.memberId,
        orderId: entry.orderId,
        paymentId: entry.paymentId,
        points: entry.points,
        reason: entry.reason,
        createdAt: entry.createdAt,
    };
}
/**
 * Convert internal CouponRedemption to cross-module contract.
 */
function toCouponRedemptionContract(redemption) {
    return {
        redemptionId: redemption.redemptionId,
        orderId: redemption.orderId,
        paymentId: redemption.paymentId,
        memberId: redemption.memberId,
        couponCode: redemption.couponCode,
        status: redemption.status,
        createdAt: redemption.createdAt,
    };
}
/**
 * Convert internal BlindboxFulfillment to cross-module contract.
 */
function toBlindboxFulfillmentContract(fulfillment) {
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
    };
}
/**
 * Convert internal CouponPlan to cross-module contract.
 */
function toCouponPlanContract(plan) {
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
    };
}
/**
 * Convert internal BlindboxPlan to cross-module contract.
 */
function toBlindboxPlanContract(plan) {
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
    };
}
/**
 * Build a loyalty order summary contract from individual related entities.
 */
function toLoyaltyOrderSummaryContract(params) {
    if (!params.settlement) {
        throw new Error('Cannot build loyalty order summary without a settlement');
    }
    return {
        orderId: params.settlement.orderId,
        settlement: toLoyaltySettlementContract(params.settlement),
        pointsEntries: params.pointsEntries.map(toPointsLedgerContract),
        couponRedemptions: params.couponRedemptions.map(toCouponRedemptionContract),
        blindboxFulfillments: params.blindboxFulfillments.map(toBlindboxFulfillmentContract),
    };
}
//# sourceMappingURL=loyalty.contract.js.map