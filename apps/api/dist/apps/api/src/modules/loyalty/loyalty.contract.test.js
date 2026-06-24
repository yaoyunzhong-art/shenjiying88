"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const loyalty_contract_1 = require("./loyalty.contract");
const loyalty_entity_1 = require("./loyalty.entity");
// ── 辅助工厂 ──
function makeTenantCtx(tenantId = 'tenant-demo') {
    return {
        tenantId,
        marketCode: 'cn-mainland',
    };
}
function makeSettlement(overrides) {
    return {
        settlementId: 'settlement-001',
        tenantContext: makeTenantCtx(),
        orderId: 'order-001',
        paymentId: 'payment-001',
        memberId: 'member-001',
        status: loyalty_entity_1.LoyaltySettlementStatus.Succeeded,
        awardedPoints: 100,
        couponCode: 'SUMMER2026',
        blindboxPlanId: 'bb-bronze',
        createdAt: '2026-06-23T10:00:00.000Z',
        updatedAt: '2026-06-23T10:00:01.000Z',
        ...overrides,
    };
}
function makePointsEntry(overrides) {
    return {
        entryId: 'points-entry-001',
        tenantContext: makeTenantCtx(),
        memberId: 'member-001',
        orderId: 'order-001',
        paymentId: 'payment-001',
        points: 50,
        reason: '消费积分',
        createdAt: '2026-06-23T10:00:01.000Z',
        ...overrides,
    };
}
function makeCouponRedemption(overrides) {
    return {
        redemptionId: 'redeem-001',
        tenantContext: makeTenantCtx(),
        orderId: 'order-001',
        paymentId: 'payment-001',
        memberId: 'member-001',
        couponCode: 'SUMMER2026',
        status: loyalty_entity_1.CouponRedemptionStatus.Redeemed,
        createdAt: '2026-06-23T10:00:01.000Z',
        ...overrides,
    };
}
function makeBlindboxFulfillment(overrides) {
    return {
        fulfillmentId: 'ff-001',
        tenantContext: makeTenantCtx(),
        orderId: 'order-001',
        paymentId: 'payment-001',
        memberId: 'member-001',
        blindboxPlanId: 'bb-bronze',
        quantity: 3,
        rewardSku: 'bb-bronze-reward-1',
        status: loyalty_entity_1.BlindboxFulfillmentStatus.Fulfilled,
        createdAt: '2026-06-23T10:00:01.000Z',
        ...overrides,
    };
}
function makeCouponPlan(overrides) {
    return {
        planId: 'plan-coupon-001',
        tenantContext: makeTenantCtx(),
        code: 'SUMMER2026',
        title: '夏季满减券',
        description: '满200减30元',
        discountType: loyalty_entity_1.CouponDiscountType.FixedAmount,
        discountValue: 30,
        minOrderAmount: 200,
        totalQuota: 1000,
        remainingQuota: 850,
        perMemberLimit: 3,
        validFrom: '2026-06-01T00:00:00.000Z',
        validUntil: '2026-08-31T23:59:59.000Z',
        status: loyalty_entity_1.LoyaltyPlanStatus.Active,
        createdAt: '2026-05-15T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
        ...overrides,
    };
}
function makeBlindboxPlan(overrides) {
    return {
        planId: 'plan-bb-001',
        tenantContext: makeTenantCtx(),
        blindboxPlanId: 'bb-bronze',
        title: '青铜盲盒',
        description: '保底青铜，有概率开出白银奖励',
        unitPrice: 30,
        totalQuota: 500,
        remainingQuota: 480,
        rewardPool: [
            { sku: 'reward-a', weight: 0.6, label: '10积分' },
            { sku: 'reward-b', weight: 0.3, label: '优惠券5元' },
            { sku: 'reward-c', weight: 0.1, label: '白银盲盒' },
        ],
        validFrom: '2026-06-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z',
        status: loyalty_entity_1.LoyaltyPlanStatus.Active,
        createdAt: '2026-05-15T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
        ...overrides,
    };
}
// ──────────── toLoyaltySettlementContract ────────────
(0, node_test_1.describe)('toLoyaltySettlementContract', () => {
    (0, node_test_1.default)('成功结算转换：保留核心字段、剥离 tenantContext', () => {
        const settlement = makeSettlement();
        const contract = (0, loyalty_contract_1.toLoyaltySettlementContract)(settlement);
        strict_1.default.equal(contract.settlementId, 'settlement-001');
        strict_1.default.equal(contract.orderId, 'order-001');
        strict_1.default.equal(contract.paymentId, 'payment-001');
        strict_1.default.equal(contract.memberId, 'member-001');
        strict_1.default.equal(contract.status, loyalty_entity_1.LoyaltySettlementStatus.Succeeded);
        strict_1.default.equal(contract.awardedPoints, 100);
        strict_1.default.equal(contract.couponCode, 'SUMMER2026');
        strict_1.default.equal(contract.blindboxPlanId, 'bb-bronze');
        strict_1.default.equal(contract.createdAt, '2026-06-23T10:00:00.000Z');
        // @ts-expect-error tenantContext 不属于 contract
        strict_1.default.equal(contract.tenantContext, undefined);
    });
    (0, node_test_1.default)('失败结算转换：status 为 FAILED 且 awardedPoints 可能为 0', () => {
        const settlement = makeSettlement({
            status: loyalty_entity_1.LoyaltySettlementStatus.Failed,
            awardedPoints: 0,
            couponCode: undefined,
            blindboxPlanId: undefined,
        });
        const contract = (0, loyalty_contract_1.toLoyaltySettlementContract)(settlement);
        strict_1.default.equal(contract.status, loyalty_entity_1.LoyaltySettlementStatus.Failed);
        strict_1.default.equal(contract.awardedPoints, 0);
        strict_1.default.equal(contract.couponCode, undefined);
        strict_1.default.equal(contract.blindboxPlanId, undefined);
    });
    (0, node_test_1.default)('结算合同 round-trip：转换后关键字段与原实体一致', () => {
        const settlement = makeSettlement();
        const contract = (0, loyalty_contract_1.toLoyaltySettlementContract)(settlement);
        strict_1.default.equal(contract.settlementId, settlement.settlementId);
        strict_1.default.equal(contract.orderId, settlement.orderId);
        strict_1.default.equal(contract.paymentId, settlement.paymentId);
        strict_1.default.equal(contract.memberId, settlement.memberId);
        strict_1.default.equal(contract.status, settlement.status);
        strict_1.default.equal(contract.awardedPoints, settlement.awardedPoints);
    });
});
// ──────────── toPointsLedgerContract ────────────
(0, node_test_1.describe)('toPointsLedgerContract', () => {
    (0, node_test_1.default)('积分账本条目转换：剥离 tenantContext', () => {
        const entry = makePointsEntry();
        const contract = (0, loyalty_contract_1.toPointsLedgerContract)(entry);
        strict_1.default.equal(contract.entryId, 'points-entry-001');
        strict_1.default.equal(contract.memberId, 'member-001');
        strict_1.default.equal(contract.orderId, 'order-001');
        strict_1.default.equal(contract.points, 50);
        strict_1.default.equal(contract.reason, '消费积分');
        // @ts-expect-error tenantContext 不属于 contract
        strict_1.default.equal(contract.tenantContext, undefined);
    });
    (0, node_test_1.default)('负积分条目（积分扣减）', () => {
        const entry = makePointsEntry({ points: -30, reason: '积分兑换扣减' });
        const contract = (0, loyalty_contract_1.toPointsLedgerContract)(entry);
        strict_1.default.equal(contract.points, -30);
        strict_1.default.equal(contract.reason, '积分兑换扣减');
    });
    (0, node_test_1.default)('零积分条目（边界）', () => {
        const entry = makePointsEntry({ points: 0, reason: '零积分记录' });
        const contract = (0, loyalty_contract_1.toPointsLedgerContract)(entry);
        strict_1.default.equal(contract.points, 0);
    });
});
// ──────────── toCouponRedemptionContract ────────────
(0, node_test_1.describe)('toCouponRedemptionContract', () => {
    (0, node_test_1.default)('已核销优惠券转换', () => {
        const redemption = makeCouponRedemption();
        const contract = (0, loyalty_contract_1.toCouponRedemptionContract)(redemption);
        strict_1.default.equal(contract.redemptionId, 'redeem-001');
        strict_1.default.equal(contract.couponCode, 'SUMMER2026');
        strict_1.default.equal(contract.status, loyalty_entity_1.CouponRedemptionStatus.Redeemed);
        strict_1.default.equal(contract.memberId, 'member-001');
        // @ts-expect-error tenantContext 不属于 contract
        strict_1.default.equal(contract.tenantContext, undefined);
    });
    (0, node_test_1.default)('已释放优惠券转换（订单取消后退还）', () => {
        const redemption = makeCouponRedemption({
            redemptionId: 'redeem-002',
            status: loyalty_entity_1.CouponRedemptionStatus.Released,
        });
        const contract = (0, loyalty_contract_1.toCouponRedemptionContract)(redemption);
        strict_1.default.equal(contract.status, loyalty_entity_1.CouponRedemptionStatus.Released);
    });
});
// ──────────── toBlindboxFulfillmentContract ────────────
(0, node_test_1.describe)('toBlindboxFulfillmentContract', () => {
    (0, node_test_1.default)('盲盒已兑现转换', () => {
        const fulfillment = makeBlindboxFulfillment();
        const contract = (0, loyalty_contract_1.toBlindboxFulfillmentContract)(fulfillment);
        strict_1.default.equal(contract.fulfillmentId, 'ff-001');
        strict_1.default.equal(contract.blindboxPlanId, 'bb-bronze');
        strict_1.default.equal(contract.quantity, 3);
        strict_1.default.equal(contract.rewardSku, 'bb-bronze-reward-1');
        strict_1.default.equal(contract.status, loyalty_entity_1.BlindboxFulfillmentStatus.Fulfilled);
        // @ts-expect-error tenantContext 不属于 contract
        strict_1.default.equal(contract.tenantContext, undefined);
    });
    (0, node_test_1.default)('盲盒已跳过转换（库存不足）', () => {
        const fulfillment = makeBlindboxFulfillment({
            fulfillmentId: 'ff-002',
            rewardSku: '',
            status: loyalty_entity_1.BlindboxFulfillmentStatus.Skipped,
        });
        const contract = (0, loyalty_contract_1.toBlindboxFulfillmentContract)(fulfillment);
        strict_1.default.equal(contract.status, loyalty_entity_1.BlindboxFulfillmentStatus.Skipped);
        strict_1.default.equal(contract.rewardSku, '');
    });
    (0, node_test_1.default)('盲盒已撤销转换', () => {
        const fulfillment = makeBlindboxFulfillment({
            fulfillmentId: 'ff-003',
            status: loyalty_entity_1.BlindboxFulfillmentStatus.Revoked,
        });
        const contract = (0, loyalty_contract_1.toBlindboxFulfillmentContract)(fulfillment);
        strict_1.default.equal(contract.status, loyalty_entity_1.BlindboxFulfillmentStatus.Revoked);
    });
});
// ──────────── toCouponPlanContract ────────────
(0, node_test_1.describe)('toCouponPlanContract', () => {
    (0, node_test_1.default)('优惠券计划转换：保留业务字段，剥离租户上下文', () => {
        const plan = makeCouponPlan();
        const contract = (0, loyalty_contract_1.toCouponPlanContract)(plan);
        strict_1.default.equal(contract.planId, 'plan-coupon-001');
        strict_1.default.equal(contract.code, 'SUMMER2026');
        strict_1.default.equal(contract.title, '夏季满减券');
        strict_1.default.equal(contract.discountType, loyalty_entity_1.CouponDiscountType.FixedAmount);
        strict_1.default.equal(contract.discountValue, 30);
        strict_1.default.equal(contract.minOrderAmount, 200);
        strict_1.default.equal(contract.totalQuota, 1000);
        strict_1.default.equal(contract.remainingQuota, 850);
        strict_1.default.equal(contract.perMemberLimit, 3);
        strict_1.default.equal(contract.status, loyalty_entity_1.LoyaltyPlanStatus.Active);
        // @ts-expect-error tenantContext 不属于 contract
        strict_1.default.equal(contract.tenantContext, undefined);
    });
    (0, node_test_1.default)('百分比折扣优惠券计划', () => {
        const plan = makeCouponPlan({
            planId: 'plan-coupon-pct',
            code: 'PCT10',
            title: '全场九折',
            discountType: loyalty_entity_1.CouponDiscountType.Percentage,
            discountValue: 10,
            minOrderAmount: undefined,
        });
        const contract = (0, loyalty_contract_1.toCouponPlanContract)(plan);
        strict_1.default.equal(contract.discountType, loyalty_entity_1.CouponDiscountType.Percentage);
        strict_1.default.equal(contract.discountValue, 10);
        strict_1.default.equal(contract.minOrderAmount, undefined);
    });
    (0, node_test_1.default)('已暂停优惠券计划', () => {
        const plan = makeCouponPlan({ status: loyalty_entity_1.LoyaltyPlanStatus.Paused });
        const contract = (0, loyalty_contract_1.toCouponPlanContract)(plan);
        strict_1.default.equal(contract.status, loyalty_entity_1.LoyaltyPlanStatus.Paused);
    });
    (0, node_test_1.default)('已过期优惠券计划', () => {
        const plan = makeCouponPlan({
            status: loyalty_entity_1.LoyaltyPlanStatus.Expired,
            remainingQuota: 0,
        });
        const contract = (0, loyalty_contract_1.toCouponPlanContract)(plan);
        strict_1.default.equal(contract.status, loyalty_entity_1.LoyaltyPlanStatus.Expired);
        strict_1.default.equal(contract.remainingQuota, 0);
    });
});
// ──────────── toBlindboxPlanContract ────────────
(0, node_test_1.describe)('toBlindboxPlanContract', () => {
    (0, node_test_1.default)('盲盒计划转换：剥离租户上下文和奖励池详情', () => {
        const plan = makeBlindboxPlan();
        const contract = (0, loyalty_contract_1.toBlindboxPlanContract)(plan);
        strict_1.default.equal(contract.planId, 'plan-bb-001');
        strict_1.default.equal(contract.blindboxPlanId, 'bb-bronze');
        strict_1.default.equal(contract.title, '青铜盲盒');
        strict_1.default.equal(contract.description, '保底青铜，有概率开出白银奖励');
        strict_1.default.equal(contract.unitPrice, 30);
        strict_1.default.equal(contract.totalQuota, 500);
        strict_1.default.equal(contract.remainingQuota, 480);
        strict_1.default.equal(contract.status, loyalty_entity_1.LoyaltyPlanStatus.Active);
        // @ts-expect-error tenantContext 不属于 contract
        strict_1.default.equal(contract.tenantContext, undefined);
        // @ts-expect-error rewardPool 不属于 contract (内部细节)
        strict_1.default.equal(contract.rewardPool, undefined);
    });
    (0, node_test_1.default)('草稿状态盲盒计划', () => {
        const plan = makeBlindboxPlan({ status: loyalty_entity_1.LoyaltyPlanStatus.Draft });
        const contract = (0, loyalty_contract_1.toBlindboxPlanContract)(plan);
        strict_1.default.equal(contract.status, loyalty_entity_1.LoyaltyPlanStatus.Draft);
    });
});
// ──────────── toLoyaltyOrderSummaryContract ────────────
(0, node_test_1.describe)('toLoyaltyOrderSummaryContract', () => {
    (0, node_test_1.default)('完整订单摘要：含结算、积分、核销、盲盒', () => {
        const settlement = makeSettlement();
        const summary = (0, loyalty_contract_1.toLoyaltyOrderSummaryContract)({
            settlement,
            pointsEntries: [makePointsEntry()],
            couponRedemptions: [makeCouponRedemption()],
            blindboxFulfillments: [makeBlindboxFulfillment()],
        });
        strict_1.default.equal(summary.orderId, 'order-001');
        strict_1.default.ok(summary.settlement);
        strict_1.default.equal(summary.settlement.awardedPoints, 100);
        strict_1.default.equal(summary.pointsEntries.length, 1);
        strict_1.default.equal(summary.pointsEntries[0].points, 50);
        strict_1.default.equal(summary.couponRedemptions.length, 1);
        strict_1.default.equal(summary.couponRedemptions[0].couponCode, 'SUMMER2026');
        strict_1.default.equal(summary.blindboxFulfillments.length, 1);
        strict_1.default.equal(summary.blindboxFulfillments[0].blindboxPlanId, 'bb-bronze');
    });
    (0, node_test_1.default)('订单摘要多条目：3 条积分记录 + 2 个盲盒兑现', () => {
        const settlement = makeSettlement();
        const summary = (0, loyalty_contract_1.toLoyaltyOrderSummaryContract)({
            settlement,
            pointsEntries: [
                makePointsEntry({ entryId: 'pe-1', points: 10 }),
                makePointsEntry({ entryId: 'pe-2', points: 20 }),
                makePointsEntry({ entryId: 'pe-3', points: 30 }),
            ],
            couponRedemptions: [],
            blindboxFulfillments: [
                makeBlindboxFulfillment({ fulfillmentId: 'ff-1' }),
                makeBlindboxFulfillment({ fulfillmentId: 'ff-2', rewardSku: 'bb-bronze-reward-2' }),
            ],
        });
        strict_1.default.equal(summary.pointsEntries.length, 3);
        strict_1.default.equal(summary.blindboxFulfillments.length, 2);
        strict_1.default.equal(summary.couponRedemptions.length, 0);
    });
    (0, node_test_1.default)('无结算时抛错', () => {
        strict_1.default.throws(() => (0, loyalty_contract_1.toLoyaltyOrderSummaryContract)({
            settlement: undefined,
            pointsEntries: [],
            couponRedemptions: [],
            blindboxFulfillments: [],
        }), /Cannot build loyalty order summary without a settlement/);
    });
    (0, node_test_1.default)('空数组也能构建摘要', () => {
        const settlement = makeSettlement({ couponCode: undefined, blindboxPlanId: undefined });
        const summary = (0, loyalty_contract_1.toLoyaltyOrderSummaryContract)({
            settlement,
            pointsEntries: [],
            couponRedemptions: [],
            blindboxFulfillments: [],
        });
        strict_1.default.equal(summary.orderId, 'order-001');
        strict_1.default.equal(summary.pointsEntries.length, 0);
        strict_1.default.equal(summary.couponRedemptions.length, 0);
        strict_1.default.equal(summary.blindboxFulfillments.length, 0);
        strict_1.default.equal(summary.settlement?.couponCode, undefined);
    });
});
//# sourceMappingURL=loyalty.contract.test.js.map