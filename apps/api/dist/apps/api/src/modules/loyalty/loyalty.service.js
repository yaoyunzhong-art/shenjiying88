"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoyaltyService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const member_service_1 = require("../member/member.service");
const loyalty_entity_1 = require("./loyalty.entity");
const pointsLedgerStore = new Map();
const couponRedemptionStore = new Map();
const blindboxFulfillmentStore = new Map();
const settlementStore = new Map();
const couponPlanStore = new Map();
const blindboxPlanStore = new Map();
let LoyaltyService = class LoyaltyService {
    memberService;
    constructor(memberService) {
        this.memberService = memberService;
    }
    buildOrderSettlementInput(order, payment) {
        const tenantContext = order.tenantContext;
        const memberId = order.memberId;
        if (!memberId) {
            throw new Error(`Order ${'orderId' in order ? order.orderId : order.externalOrderId} missing memberId`);
        }
        return {
            tenantContext,
            memberId,
            orderId: 'orderId' in order ? order.orderId : order.externalOrderId,
            paymentId: 'paymentId' in payment ? payment.paymentId : payment.externalPaymentId,
            amount: 'amount' in payment ? payment.amount : 0,
            channel: 'channel' in payment ? payment.channel : payment.paymentChannel,
            paidAt: 'completedAt' in payment
                ? payment.completedAt ?? payment.updatedAt
                : ('paidAt' in payment ? payment.paidAt : undefined),
            couponCode: 'couponCode' in order ? order.couponCode : order.couponCode,
            blindboxPlanId: 'blindboxPlanId' in order ? order.blindboxPlanId : order.blindboxPlanId,
            blindboxQuantity: 'blindboxQuantity' in order ? order.blindboxQuantity : order.blindboxQuantity
        };
    }
    buildRewardSku(blindboxPlanId, quantity) {
        return `${blindboxPlanId}-reward-${Math.max(1, quantity)}`;
    }
    listPointsLedger(tenantId) {
        return Array.from(pointsLedgerStore.values()).filter((entry) => entry.tenantContext.tenantId === tenantId);
    }
    listCouponRedemptions(tenantId) {
        return Array.from(couponRedemptionStore.values()).filter((entry) => entry.tenantContext.tenantId === tenantId);
    }
    listBlindboxFulfillments(tenantId) {
        return Array.from(blindboxFulfillmentStore.values()).filter((entry) => entry.tenantContext.tenantId === tenantId);
    }
    listSettlements(tenantId) {
        return Array.from(settlementStore.values()).filter((entry) => entry.tenantContext.tenantId === tenantId);
    }
    getSettlement(orderId, tenantId) {
        const settlement = settlementStore.get(orderId);
        if (!settlement || settlement.tenantContext.tenantId !== tenantId) {
            return undefined;
        }
        return settlement;
    }
    listPointsLedgerForOrder(orderId, tenantId) {
        return this.listPointsLedger(tenantId).filter((entry) => entry.orderId === orderId);
    }
    listCouponRedemptionsForOrder(orderId, tenantId) {
        return this.listCouponRedemptions(tenantId).filter((entry) => entry.orderId === orderId);
    }
    listBlindboxFulfillmentsForOrder(orderId, tenantId) {
        return this.listBlindboxFulfillments(tenantId).filter((entry) => entry.orderId === orderId);
    }
    getReversedPoints(orderId, tenantId) {
        return Math.abs(this.listPointsLedgerForOrder(orderId, tenantId)
            .filter((entry) => entry.points < 0)
            .reduce((sum, entry) => sum + entry.points, 0));
    }
    listBlindboxRollbackRecords(orderId, tenantId) {
        return this.listBlindboxFulfillmentsForOrder(orderId, tenantId)
            .filter((entry) => entry.status === loyalty_entity_1.BlindboxFulfillmentStatus.Revoked);
    }
    async settlePaidOrder(order, payment) {
        const settlementInput = this.buildOrderSettlementInput(order, payment);
        const existing = settlementStore.get(settlementInput.orderId);
        if (existing?.status === loyalty_entity_1.LoyaltySettlementStatus.Succeeded) {
            return existing;
        }
        const now = settlementInput.paidAt ?? new Date().toISOString();
        const awardedPoints = Math.max(1, Math.floor(settlementInput.amount));
        await this.memberService.awardPoints(settlementInput.memberId, awardedPoints, settlementInput.tenantContext);
        await this.memberService.recordPaymentActivity({
            memberId: settlementInput.memberId,
            tenantContext: settlementInput.tenantContext,
            orderId: settlementInput.orderId,
            amount: settlementInput.amount,
            paidAt: now,
            channel: settlementInput.channel,
            source: 'orderId' in order ? 'cashier' : 'lyt-snapshot'
        });
        const pointsEntry = {
            entryId: `points-${(0, node_crypto_1.randomUUID)()}`,
            tenantContext: settlementInput.tenantContext,
            memberId: settlementInput.memberId,
            orderId: settlementInput.orderId,
            paymentId: settlementInput.paymentId,
            points: awardedPoints,
            reason: 'cashier.payment-succeeded',
            createdAt: now
        };
        pointsLedgerStore.set(pointsEntry.entryId, pointsEntry);
        if (settlementInput.couponCode) {
            const coupon = {
                redemptionId: `coupon-${(0, node_crypto_1.randomUUID)()}`,
                tenantContext: settlementInput.tenantContext,
                orderId: settlementInput.orderId,
                paymentId: settlementInput.paymentId,
                memberId: settlementInput.memberId,
                couponCode: settlementInput.couponCode,
                status: loyalty_entity_1.CouponRedemptionStatus.Redeemed,
                createdAt: now
            };
            couponRedemptionStore.set(coupon.redemptionId, coupon);
        }
        if (settlementInput.blindboxPlanId) {
            const fulfillment = {
                fulfillmentId: `blindbox-${(0, node_crypto_1.randomUUID)()}`,
                tenantContext: settlementInput.tenantContext,
                orderId: settlementInput.orderId,
                paymentId: settlementInput.paymentId,
                memberId: settlementInput.memberId,
                blindboxPlanId: settlementInput.blindboxPlanId,
                quantity: settlementInput.blindboxQuantity ?? 1,
                rewardSku: this.buildRewardSku(settlementInput.blindboxPlanId, settlementInput.blindboxQuantity ?? 1),
                status: loyalty_entity_1.BlindboxFulfillmentStatus.Fulfilled,
                createdAt: now
            };
            blindboxFulfillmentStore.set(fulfillment.fulfillmentId, fulfillment);
        }
        const settlement = {
            settlementId: existing?.settlementId ?? `settlement-${(0, node_crypto_1.randomUUID)()}`,
            tenantContext: settlementInput.tenantContext,
            orderId: settlementInput.orderId,
            paymentId: settlementInput.paymentId,
            memberId: settlementInput.memberId,
            status: loyalty_entity_1.LoyaltySettlementStatus.Succeeded,
            awardedPoints,
            couponCode: settlementInput.couponCode,
            blindboxPlanId: settlementInput.blindboxPlanId,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now
        };
        settlementStore.set(settlementInput.orderId, settlement);
        return settlement;
    }
    async settleFailedOrder(order, payment) {
        const settlementInput = this.buildOrderSettlementInput(order, payment);
        const existing = settlementStore.get(settlementInput.orderId);
        const now = new Date().toISOString();
        if (settlementInput.couponCode) {
            const coupon = {
                redemptionId: `coupon-${(0, node_crypto_1.randomUUID)()}`,
                tenantContext: settlementInput.tenantContext,
                orderId: settlementInput.orderId,
                paymentId: settlementInput.paymentId,
                memberId: settlementInput.memberId,
                couponCode: settlementInput.couponCode,
                status: loyalty_entity_1.CouponRedemptionStatus.Released,
                createdAt: now
            };
            couponRedemptionStore.set(coupon.redemptionId, coupon);
        }
        const settlement = {
            settlementId: existing?.settlementId ?? `settlement-${(0, node_crypto_1.randomUUID)()}`,
            tenantContext: settlementInput.tenantContext,
            orderId: settlementInput.orderId,
            paymentId: settlementInput.paymentId,
            memberId: settlementInput.memberId,
            status: loyalty_entity_1.LoyaltySettlementStatus.Failed,
            awardedPoints: 0,
            couponCode: settlementInput.couponCode,
            blindboxPlanId: settlementInput.blindboxPlanId,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now
        };
        settlementStore.set(settlementInput.orderId, settlement);
        return settlement;
    }
    async settlePaidOrderFromSnapshots(order, payment) {
        return this.settlePaidOrder(order, payment);
    }
    async settleFailedOrderFromSnapshots(order, payment) {
        return this.settleFailedOrder(order, payment);
    }
    async applyRefund(order, payment, refundAmount, options) {
        if (refundAmount <= 0) {
            throw new Error('Refund amount must be positive');
        }
        const settlement = settlementStore.get(order.orderId);
        if (!settlement || settlement.status !== loyalty_entity_1.LoyaltySettlementStatus.Succeeded) {
            return {
                reversedPoints: 0,
                releasedCoupon: false,
                revokedBlindbox: false
            };
        }
        const now = new Date().toISOString();
        const alreadyReversedPoints = this.getReversedPoints(order.orderId, order.tenantContext.tenantId);
        const availableRollbackPoints = Math.max(0, settlement.awardedPoints - alreadyReversedPoints);
        const rollbackPoints = Math.min(availableRollbackPoints, Math.max(0, Math.floor(refundAmount)));
        if (rollbackPoints > 0) {
            await this.memberService.rollbackPoints(order.memberId, rollbackPoints, order.tenantContext);
            const pointsEntry = {
                entryId: `points-${(0, node_crypto_1.randomUUID)()}`,
                tenantContext: order.tenantContext,
                memberId: order.memberId,
                orderId: order.orderId,
                paymentId: payment.paymentId,
                points: -rollbackPoints,
                reason: 'transaction.refund-completed',
                createdAt: now
            };
            pointsLedgerStore.set(pointsEntry.entryId, pointsEntry);
        }
        let releasedCoupon = false;
        const couponReleased = order.couponCode
            ? this.listCouponRedemptionsForOrder(order.orderId, order.tenantContext.tenantId)
                .some((entry) => entry.status === loyalty_entity_1.CouponRedemptionStatus.Released)
            : false;
        if (order.couponCode && !couponReleased) {
            const coupon = {
                redemptionId: `coupon-${(0, node_crypto_1.randomUUID)()}`,
                tenantContext: order.tenantContext,
                orderId: order.orderId,
                paymentId: payment.paymentId,
                memberId: order.memberId,
                couponCode: order.couponCode,
                status: loyalty_entity_1.CouponRedemptionStatus.Released,
                createdAt: now
            };
            couponRedemptionStore.set(coupon.redemptionId, coupon);
            releasedCoupon = true;
        }
        let revokedBlindbox = false;
        const shouldRevokeBlindbox = Boolean(options?.revokeBlindbox && order.blindboxPlanId);
        const blindboxAlreadyRevoked = shouldRevokeBlindbox &&
            this.listBlindboxRollbackRecords(order.orderId, order.tenantContext.tenantId).length > 0;
        if (shouldRevokeBlindbox && !blindboxAlreadyRevoked) {
            const originalFulfillment = this.listBlindboxFulfillmentsForOrder(order.orderId, order.tenantContext.tenantId).find((entry) => entry.status === loyalty_entity_1.BlindboxFulfillmentStatus.Fulfilled);
            if (originalFulfillment) {
                const rollbackRecord = {
                    fulfillmentId: `blindbox-${(0, node_crypto_1.randomUUID)()}`,
                    tenantContext: order.tenantContext,
                    orderId: order.orderId,
                    paymentId: payment.paymentId,
                    memberId: order.memberId,
                    blindboxPlanId: order.blindboxPlanId,
                    quantity: originalFulfillment.quantity,
                    rewardSku: originalFulfillment.rewardSku,
                    status: loyalty_entity_1.BlindboxFulfillmentStatus.Revoked,
                    relatedFulfillmentId: originalFulfillment.fulfillmentId,
                    reason: 'transaction.full-refund',
                    createdAt: now
                };
                blindboxFulfillmentStore.set(rollbackRecord.fulfillmentId, rollbackRecord);
                revokedBlindbox = true;
            }
        }
        return {
            reversedPoints: rollbackPoints,
            releasedCoupon,
            revokedBlindbox
        };
    }
    // ── CouponPlan / BlindboxPlan management ───────────────────────────
    registerCouponPlan(input) {
        if (input.discountValue <= 0) {
            throw new Error('Coupon discountValue must be positive');
        }
        if (input.totalQuota <= 0) {
            throw new Error('Coupon totalQuota must be positive');
        }
        if (input.perMemberLimit <= 0) {
            throw new Error('Coupon perMemberLimit must be positive');
        }
        if (input.discountType === loyalty_entity_1.CouponDiscountType.Percentage && input.discountValue > 100) {
            throw new Error('Percentage discount cannot exceed 100');
        }
        const now = new Date().toISOString();
        const plan = {
            planId: `coupon-plan-${(0, node_crypto_1.randomUUID)()}`,
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
            status: loyalty_entity_1.LoyaltyPlanStatus.Draft,
            createdAt: now,
            updatedAt: now
        };
        couponPlanStore.set(plan.planId, plan);
        return plan;
    }
    updateCouponPlanStatus(planId, status, tenantId) {
        const plan = couponPlanStore.get(planId);
        if (!plan || plan.tenantContext.tenantId !== tenantId) {
            throw new Error(`Coupon plan not found: ${planId}`);
        }
        plan.status = status;
        plan.updatedAt = new Date().toISOString();
        couponPlanStore.set(planId, plan);
        return plan;
    }
    listCouponPlans(tenantId) {
        return Array.from(couponPlanStore.values()).filter((plan) => plan.tenantContext.tenantId === tenantId);
    }
    getCouponPlan(planId, tenantId) {
        const plan = couponPlanStore.get(planId);
        if (!plan || plan.tenantContext.tenantId !== tenantId)
            return undefined;
        return plan;
    }
    getCouponPlanByCode(code, tenantId) {
        return Array.from(couponPlanStore.values()).find((plan) => plan.tenantContext.tenantId === tenantId && plan.code === code);
    }
    registerBlindboxPlan(input) {
        if (input.unitPrice < 0) {
            throw new Error('Blindbox unitPrice must be non-negative');
        }
        if (input.totalQuota <= 0) {
            throw new Error('Blindbox totalQuota must be positive');
        }
        if (input.rewardPool.length === 0) {
            throw new Error('Blindbox rewardPool must contain at least one reward');
        }
        const totalWeight = input.rewardPool.reduce((sum, r) => sum + r.weight, 0);
        if (totalWeight <= 0) {
            throw new Error('Blindbox rewardPool weights must sum to a positive number');
        }
        const now = new Date().toISOString();
        const plan = {
            planId: `blindbox-plan-${(0, node_crypto_1.randomUUID)()}`,
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
            status: loyalty_entity_1.LoyaltyPlanStatus.Draft,
            createdAt: now,
            updatedAt: now
        };
        blindboxPlanStore.set(plan.planId, plan);
        return plan;
    }
    updateBlindboxPlanStatus(planIdOrCode, status, tenantId) {
        const plan = blindboxPlanStore.get(planIdOrCode)
            ?? this.getBlindboxPlanByCode(planIdOrCode, tenantId);
        if (!plan || plan.tenantContext.tenantId !== tenantId) {
            throw new Error(`Blindbox plan not found: ${planIdOrCode}`);
        }
        plan.status = status;
        plan.updatedAt = new Date().toISOString();
        blindboxPlanStore.set(plan.planId, plan);
        return plan;
    }
    listBlindboxPlans(tenantId) {
        return Array.from(blindboxPlanStore.values()).filter((plan) => plan.tenantContext.tenantId === tenantId);
    }
    getBlindboxPlan(planId, tenantId) {
        const plan = blindboxPlanStore.get(planId);
        if (!plan || plan.tenantContext.tenantId !== tenantId)
            return undefined;
        return plan;
    }
    getBlindboxPlanByCode(blindboxPlanId, tenantId) {
        return Array.from(blindboxPlanStore.values()).find((plan) => plan.tenantContext.tenantId === tenantId && plan.blindboxPlanId === blindboxPlanId);
    }
    // ── Plan-driven issuance ───────────────────────────────────────────
    issueCouponFromPlan(input) {
        const plan = couponPlanStore.get(input.planId);
        if (!plan || plan.tenantContext.tenantId !== input.tenantContext.tenantId) {
            throw new Error(`Coupon plan not found: ${input.planId}`);
        }
        if (plan.status !== loyalty_entity_1.LoyaltyPlanStatus.Active) {
            throw new Error(`Coupon plan is not active: ${input.planId} (status=${plan.status})`);
        }
        const nowIso = new Date().toISOString();
        if (nowIso < plan.validFrom || nowIso > plan.validUntil) {
            throw new Error(`Coupon plan is outside its validity window: ${input.planId}`);
        }
        if (plan.remainingQuota <= 0) {
            throw new Error(`Coupon plan quota exhausted: ${input.planId}`);
        }
        const memberRedemptions = Array.from(couponRedemptionStore.values()).filter((r) => r.tenantContext.tenantId === input.tenantContext.tenantId &&
            r.memberId === input.memberId &&
            r.couponCode === plan.code);
        if (memberRedemptions.length >= plan.perMemberLimit) {
            throw new Error(`Member has reached per-member limit for coupon plan: ${input.planId}`);
        }
        plan.remainingQuota -= 1;
        plan.updatedAt = nowIso;
        couponPlanStore.set(plan.planId, plan);
        const redemption = {
            redemptionId: `coupon-${(0, node_crypto_1.randomUUID)()}`,
            tenantContext: input.tenantContext,
            orderId: `pending-${input.memberId}-${plan.code}-${Date.now()}`,
            paymentId: `pending-${input.memberId}-${plan.code}-${Date.now()}`,
            memberId: input.memberId,
            couponCode: plan.code,
            status: loyalty_entity_1.CouponRedemptionStatus.Redeemed,
            createdAt: nowIso
        };
        couponRedemptionStore.set(redemption.redemptionId, redemption);
        return redemption;
    }
    pickBlindboxReward(plan) {
        const totalWeight = plan.rewardPool.reduce((sum, r) => sum + r.weight, 0);
        let roll = Math.random() * totalWeight;
        for (const reward of plan.rewardPool) {
            roll -= reward.weight;
            if (roll <= 0) {
                return { sku: reward.sku, label: reward.label };
            }
        }
        const fallback = plan.rewardPool[plan.rewardPool.length - 1];
        return { sku: fallback.sku, label: fallback.label };
    }
    issueBlindboxFromPlan(input) {
        const plan = blindboxPlanStore.get(input.planId)
            ?? this.getBlindboxPlanByCode(input.planId, input.tenantContext.tenantId);
        if (!plan || plan.tenantContext.tenantId !== input.tenantContext.tenantId) {
            throw new Error(`Blindbox plan not found: ${input.planId}`);
        }
        if (plan.status !== loyalty_entity_1.LoyaltyPlanStatus.Active) {
            throw new Error(`Blindbox plan is not active: ${input.planId} (status=${plan.status})`);
        }
        const nowIso = new Date().toISOString();
        if (nowIso < plan.validFrom || nowIso > plan.validUntil) {
            throw new Error(`Blindbox plan is outside its validity window: ${input.planId}`);
        }
        const quantity = Math.max(1, input.quantity ?? 1);
        if (plan.remainingQuota < quantity) {
            throw new Error(`Blindbox plan insufficient quota: requested=${quantity}, remaining=${plan.remainingQuota}`);
        }
        plan.remainingQuota -= quantity;
        plan.updatedAt = nowIso;
        blindboxPlanStore.set(plan.planId, plan);
        const pick = this.pickBlindboxReward(plan);
        const fulfillment = {
            fulfillmentId: `blindbox-${(0, node_crypto_1.randomUUID)()}`,
            tenantContext: input.tenantContext,
            orderId: `pending-${input.memberId}-${plan.blindboxPlanId}-${Date.now()}`,
            paymentId: `pending-${input.memberId}-${plan.blindboxPlanId}-${Date.now()}`,
            memberId: input.memberId,
            blindboxPlanId: plan.blindboxPlanId,
            quantity,
            rewardSku: pick.sku,
            status: loyalty_entity_1.BlindboxFulfillmentStatus.Fulfilled,
            createdAt: nowIso
        };
        blindboxFulfillmentStore.set(fulfillment.fulfillmentId, fulfillment);
        return fulfillment;
    }
    resetLoyaltyStoresForTests() {
        pointsLedgerStore.clear();
        couponRedemptionStore.clear();
        blindboxFulfillmentStore.clear();
        settlementStore.clear();
        couponPlanStore.clear();
        blindboxPlanStore.clear();
    }
    // ── Read aggregates (consumed by analytics) ────────────────────────
    getLoyaltySummary(input) {
        const matchesScope = (ctx) => {
            if (ctx.tenantId !== input.tenantId)
                return false;
            if (input.brandId && ctx.brandId !== input.brandId)
                return false;
            if (input.storeId && ctx.storeId !== input.storeId)
                return false;
            return true;
        };
        const settlements = Array.from(settlementStore.values()).filter((s) => matchesScope(s.tenantContext));
        const coupons = Array.from(couponRedemptionStore.values()).filter((r) => matchesScope(r.tenantContext));
        const blindboxes = Array.from(blindboxFulfillmentStore.values()).filter((f) => matchesScope(f.tenantContext));
        const points = Array.from(pointsLedgerStore.values()).filter((p) => matchesScope(p.tenantContext));
        return {
            settlementCount: settlements.length,
            settlementSuccessCount: settlements.filter((s) => s.status === loyalty_entity_1.LoyaltySettlementStatus.Succeeded).length,
            couponRedemptionCount: coupons.length,
            blindboxFulfillmentCount: blindboxes.length,
            pointsIn: points.filter((p) => p.points > 0).reduce((sum, p) => sum + p.points, 0),
            pointsOut: points.filter((p) => p.points < 0).reduce((sum, p) => sum + Math.abs(p.points), 0)
        };
    }
};
exports.LoyaltyService = LoyaltyService;
exports.LoyaltyService = LoyaltyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [member_service_1.MemberService])
], LoyaltyService);
//# sourceMappingURL=loyalty.service.js.map