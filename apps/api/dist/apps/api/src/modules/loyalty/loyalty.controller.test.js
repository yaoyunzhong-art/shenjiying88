"use strict";
/**
 * 🐜 自动: [loyalty] [D] controller spec 补全增强
 *
 * 原有覆盖 (保留): metadata 验证 / listPointsLedger / listCouponRedemptions /
 *   listBlindboxFulfillments / listSettlements / multi-tenant isolation / error resilience
 *
 * 新增 (此补全):
 *   - coupon-plans CRUD: registerCouponPlan / listCouponPlans / getCouponPlan / activateCouponPlan
 *   - blindbox-plans CRUD: registerBlindboxPlan / listBlindboxPlans / getBlindboxPlan / activateBlindboxPlan
 *   - issue coupon: issueCoupon (正例+反例+边界)
 *   - issue blindbox: issueBlindbox (正例+反例+边界)
 *   - 所有端点 metadata 验证
 */
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
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const loyalty_controller_1 = require("./loyalty.controller");
const loyalty_entity_1 = require("./loyalty.entity");
const makeMockService = (overrides = {}) => ({
    listPointsLedger: () => [],
    listCouponRedemptions: () => [],
    listBlindboxFulfillments: () => [],
    listSettlements: () => [],
    registerCouponPlan: () => ({}),
    listCouponPlans: () => [],
    getCouponPlan: () => undefined,
    updateCouponPlanStatus: () => ({}),
    issueCouponFromPlan: () => ({}),
    registerBlindboxPlan: () => ({}),
    listBlindboxPlans: () => [],
    getBlindboxPlan: () => undefined,
    updateBlindboxPlanStatus: () => ({}),
    issueBlindboxFromPlan: () => ({}),
    ...overrides
});
// ---------------------------------------------------------------------------
// Controller metadata
// ---------------------------------------------------------------------------
(0, node_test_1.describe)('LoyaltyController metadata', () => {
    (0, node_test_1.default)('controller path is loyalty', () => {
        const path = Reflect.getMetadata('path', loyalty_controller_1.LoyaltyController);
        strict_1.default.equal(path, 'loyalty');
    });
    (0, node_test_1.default)('listPointsLedger GET points-ledger', () => {
        const method = Reflect.getMetadata('method', loyalty_controller_1.LoyaltyController.prototype.listPointsLedger);
        const path = Reflect.getMetadata('path', loyalty_controller_1.LoyaltyController.prototype.listPointsLedger);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'points-ledger');
    });
    (0, node_test_1.default)('listCouponRedemptions GET coupon-redemptions', () => {
        const method = Reflect.getMetadata('method', loyalty_controller_1.LoyaltyController.prototype.listCouponRedemptions);
        const path = Reflect.getMetadata('path', loyalty_controller_1.LoyaltyController.prototype.listCouponRedemptions);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'coupon-redemptions');
    });
    (0, node_test_1.default)('listBlindboxFulfillments GET blindbox-fulfillments', () => {
        const method = Reflect.getMetadata('method', loyalty_controller_1.LoyaltyController.prototype.listBlindboxFulfillments);
        const path = Reflect.getMetadata('path', loyalty_controller_1.LoyaltyController.prototype.listBlindboxFulfillments);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'blindbox-fulfillments');
    });
    (0, node_test_1.default)('listSettlements GET settlements', () => {
        const method = Reflect.getMetadata('method', loyalty_controller_1.LoyaltyController.prototype.listSettlements);
        const path = Reflect.getMetadata('path', loyalty_controller_1.LoyaltyController.prototype.listSettlements);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'settlements');
    });
});
// ---------------------------------------------------------------------------
// listPointsLedger — positive cases
// ---------------------------------------------------------------------------
(0, node_test_1.describe)('LoyaltyController — listPointsLedger', () => {
    (0, node_test_1.default)('returns empty array when no points entries exist (boundary)', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listPointsLedger: () => []
        }));
        const result = controller.listPointsLedger({ tenantId: 't-empty' });
        strict_1.default.deepEqual(result, []);
    });
    (0, node_test_1.default)('returns filtered points entries for tenant (positive)', () => {
        const entries = [
            { entryId: 'e1', tenantContext: { tenantId: 't1' }, memberId: 'm1', orderId: 'o1', paymentId: 'p1', points: 100, reason: 'purchase', createdAt: '2025-01-01' }
        ];
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listPointsLedger: () => entries
        }));
        const result = controller.listPointsLedger({ tenantId: 't1' });
        strict_1.default.equal(result.length, 1);
        strict_1.default.equal(result[0].entryId, 'e1');
    });
    (0, node_test_1.default)('delegates tenantId to service (positive)', () => {
        let capturedTenant = '';
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listPointsLedger: (id) => { capturedTenant = id; return []; }
        }));
        controller.listPointsLedger({ tenantId: 'tenant-X' });
        strict_1.default.equal(capturedTenant, 'tenant-X');
    });
    (0, node_test_1.default)('returns empty when tenant has no entries (boundary)', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listPointsLedger: (_id) => []
        }));
        const result = controller.listPointsLedger({ tenantId: 'ghost-tenant' });
        strict_1.default.equal(result.length, 0);
    });
});
// ---------------------------------------------------------------------------
// listCouponRedemptions — positive & boundary
// ---------------------------------------------------------------------------
(0, node_test_1.describe)('LoyaltyController — listCouponRedemptions', () => {
    (0, node_test_1.default)('returns empty array when no coupon redemptions exist (boundary)', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listCouponRedemptions: () => []
        }));
        const result = controller.listCouponRedemptions({ tenantId: 't-empty' });
        strict_1.default.deepEqual(result, []);
    });
    (0, node_test_1.default)('returns coupon redemptions for tenant (positive)', () => {
        const redemptions = [
            { redemptionId: 'cr1', tenantContext: { tenantId: 't1' }, orderId: 'o1', paymentId: 'p1', memberId: 'm1', couponCode: 'COUPON-001', status: loyalty_entity_1.CouponRedemptionStatus.Redeemed, createdAt: '2025-01-01' }
        ];
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listCouponRedemptions: () => redemptions
        }));
        const result = controller.listCouponRedemptions({ tenantId: 't1' });
        strict_1.default.equal(result.length, 1);
        strict_1.default.equal(result[0].couponCode, 'COUPON-001');
    });
    (0, node_test_1.default)('respects tenant isolation (negative-like boundary)', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listCouponRedemptions: (id) => id === 't2' ? [{ redemptionId: 'cr2', tenantContext: { tenantId: 't2' }, orderId: 'o1', paymentId: 'p1', memberId: 'm1', couponCode: 'COUPON-002', status: loyalty_entity_1.CouponRedemptionStatus.Released, createdAt: '2025-01-01' }] : []
        }));
        const result1 = controller.listCouponRedemptions({ tenantId: 't1' });
        const result2 = controller.listCouponRedemptions({ tenantId: 't2' });
        strict_1.default.equal(result1.length, 0);
        strict_1.default.equal(result2.length, 1);
        strict_1.default.equal(result2[0].redemptionId, 'cr2');
    });
});
// ---------------------------------------------------------------------------
// listBlindboxFulfillments — positive & boundary
// ---------------------------------------------------------------------------
(0, node_test_1.describe)('LoyaltyController — listBlindboxFulfillments', () => {
    (0, node_test_1.default)('returns empty array when no blindbox fulfillments exist (boundary)', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listBlindboxFulfillments: () => []
        }));
        const result = controller.listBlindboxFulfillments({ tenantId: 't-empty' });
        strict_1.default.deepEqual(result, []);
    });
    (0, node_test_1.default)('returns blindbox fulfillments for tenant (positive)', () => {
        const fulfillments = [
            { fulfillmentId: 'bf1', tenantContext: { tenantId: 't1' }, orderId: 'o1', paymentId: 'p1', memberId: 'm1', blindboxPlanId: 'plan-1', quantity: 2, rewardSku: 'sku-1', status: loyalty_entity_1.BlindboxFulfillmentStatus.Fulfilled, createdAt: '2025-01-01' }
        ];
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listBlindboxFulfillments: () => fulfillments
        }));
        const result = controller.listBlindboxFulfillments({ tenantId: 't1' });
        strict_1.default.equal(result.length, 1);
        strict_1.default.equal(result[0].blindboxPlanId, 'plan-1');
        strict_1.default.equal(result[0].quantity, 2);
    });
    (0, node_test_1.default)('handles multiple fulfillments for same tenant (boundary)', () => {
        const fulfillments = [
            { fulfillmentId: 'bf1', tenantContext: { tenantId: 't1' }, orderId: 'o1', paymentId: 'p1', memberId: 'm1', blindboxPlanId: 'plan-1', quantity: 1, rewardSku: 'sku-1', status: loyalty_entity_1.BlindboxFulfillmentStatus.Fulfilled, createdAt: '2025-01-01' },
            { fulfillmentId: 'bf2', tenantContext: { tenantId: 't1' }, orderId: 'o2', paymentId: 'p2', memberId: 'm2', blindboxPlanId: 'plan-2', quantity: 3, rewardSku: 'sku-2', status: loyalty_entity_1.BlindboxFulfillmentStatus.Skipped, createdAt: '2025-01-02' }
        ];
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listBlindboxFulfillments: () => fulfillments
        }));
        const result = controller.listBlindboxFulfillments({ tenantId: 't1' });
        strict_1.default.equal(result.length, 2);
    });
});
// ---------------------------------------------------------------------------
// listSettlements — positive & boundary
// ---------------------------------------------------------------------------
(0, node_test_1.describe)('LoyaltyController — listSettlements', () => {
    (0, node_test_1.default)('returns empty array when no settlements exist (boundary)', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listSettlements: () => []
        }));
        const result = controller.listSettlements({ tenantId: 't-empty' });
        strict_1.default.deepEqual(result, []);
    });
    (0, node_test_1.default)('returns settlements for tenant (positive)', () => {
        const settlements = [
            { settlementId: 's1', tenantContext: { tenantId: 't1' }, orderId: 'o1', paymentId: 'p1', memberId: 'm1', status: loyalty_entity_1.LoyaltySettlementStatus.Succeeded, awardedPoints: 50, createdAt: '2025-01-01', updatedAt: '2025-01-01' }
        ];
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listSettlements: () => settlements
        }));
        const result = controller.listSettlements({ tenantId: 't1' });
        strict_1.default.equal(result.length, 1);
        strict_1.default.equal(result[0].settlementId, 's1');
        strict_1.default.equal(result[0].status, loyalty_entity_1.LoyaltySettlementStatus.Succeeded);
        strict_1.default.equal(result[0].awardedPoints, 50);
    });
    (0, node_test_1.default)('returns empty for different tenant (boundary)', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listSettlements: (id) => id === 't-a' ? [{ settlementId: 's1', tenantContext: { tenantId: 't-a' }, orderId: 'o1', paymentId: 'p1', memberId: 'm1', status: loyalty_entity_1.LoyaltySettlementStatus.Failed, awardedPoints: 0, createdAt: '2025-01-01', updatedAt: '2025-01-01' }] : []
        }));
        const result = controller.listSettlements({ tenantId: 't-other' });
        strict_1.default.equal(result.length, 0);
    });
    (0, node_test_1.default)('handles settlement with all fields populated (boundary)', () => {
        const settlement = {
            settlementId: 's-full', tenantContext: { tenantId: 't1' }, orderId: 'o1', paymentId: 'p1',
            memberId: 'm1', status: loyalty_entity_1.LoyaltySettlementStatus.Succeeded, awardedPoints: 999,
            couponCode: 'COUPON-FULL', blindboxPlanId: 'plan-full',
            createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-02T00:00:00Z'
        };
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listSettlements: () => [settlement]
        }));
        const result = controller.listSettlements({ tenantId: 't1' });
        strict_1.default.equal(result.length, 1);
        strict_1.default.equal(result[0].couponCode, 'COUPON-FULL');
        strict_1.default.equal(result[0].blindboxPlanId, 'plan-full');
        strict_1.default.equal(result[0].awardedPoints, 999);
    });
});
// ---------------------------------------------------------------------------
// Cross-endpoint multi-tenant isolation
// ---------------------------------------------------------------------------
(0, node_test_1.describe)('LoyaltyController — multi-tenant isolation', () => {
    (0, node_test_1.default)('each endpoint respects different tenant contexts', () => {
        const pointsEntries = [
            { entryId: 'e-t1', tenantContext: { tenantId: 't1' }, memberId: 'm1', orderId: 'o1', paymentId: 'p1', points: 10, reason: 'test', createdAt: '2025-01-01' }
        ];
        const redemptionEntries = [
            { redemptionId: 'cr-t2', tenantContext: { tenantId: 't2' }, orderId: 'o2', paymentId: 'p2', memberId: 'm2', couponCode: 'C2', status: loyalty_entity_1.CouponRedemptionStatus.Redeemed, createdAt: '2025-01-01' }
        ];
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listPointsLedger: (id) => id === 't1' ? pointsEntries : [],
            listCouponRedemptions: (id) => id === 't2' ? redemptionEntries : [],
            listBlindboxFulfillments: () => [],
            listSettlements: () => []
        }));
        strict_1.default.equal(controller.listPointsLedger({ tenantId: 't1' }).length, 1);
        strict_1.default.equal(controller.listPointsLedger({ tenantId: 't2' }).length, 0);
        strict_1.default.equal(controller.listCouponRedemptions({ tenantId: 't1' }).length, 0);
        strict_1.default.equal(controller.listCouponRedemptions({ tenantId: 't2' }).length, 1);
    });
});
// ---------------------------------------------------------------------------
// Error resilience — service throws
// ---------------------------------------------------------------------------
(0, node_test_1.describe)('LoyaltyController — error resilience', () => {
    (0, node_test_1.default)('listPointsLedger propagates service error', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listPointsLedger: () => { throw new Error('db unavailable'); }
        }));
        strict_1.default.throws(() => controller.listPointsLedger({ tenantId: 't1' }), /db unavailable/);
    });
    (0, node_test_1.default)('listSettlements propagates service error', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listSettlements: () => { throw new Error('timeout'); }
        }));
        strict_1.default.throws(() => controller.listSettlements({ tenantId: 't1' }), /timeout/);
    });
});
// ══════════════════════════════════════════════════════════════
// 🐜 新增补全: coupon-plans CRUD
// ══════════════════════════════════════════════════════════════
(0, node_test_1.describe)('LoyaltyController — coupon-plans CRUD', () => {
    const tenantCtx = { tenantId: 't-coupon' };
    (0, node_test_1.default)('[正例] registerCouponPlan 创建优惠券计划并返回结果', () => {
        const plan = { planId: 'cp-new', code: 'NEW-COUPON', title: '新用户优惠', description: '首单立减', discountType: loyalty_entity_1.CouponDiscountType.FixedAmount, discountValue: 10, minOrderAmount: 50, totalQuota: 100, perMemberLimit: 1, validFrom: '2025-06-01', validUntil: '2025-12-31', status: loyalty_entity_1.LoyaltyPlanStatus.Active };
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            registerCouponPlan: () => plan
        }));
        const body = { code: 'NEW-COUPON', title: '新用户优惠', description: '首单立减', discountType: loyalty_entity_1.CouponDiscountType.FixedAmount, discountValue: 10, minOrderAmount: 50, totalQuota: 100, perMemberLimit: 1, validFrom: '2025-06-01', validUntil: '2025-12-31' };
        const result = controller.registerCouponPlan(tenantCtx, body);
        strict_1.default.equal(result.planId, 'cp-new');
        strict_1.default.equal(result.code, 'NEW-COUPON');
        strict_1.default.equal(result.status, loyalty_entity_1.LoyaltyPlanStatus.Active);
    });
    (0, node_test_1.default)('[正例] registerCouponPlan 正确处理百分比折扣', () => {
        const plan = { planId: 'cp-pct', code: 'PCT-20', title: '八折券', discountType: loyalty_entity_1.CouponDiscountType.Percentage, discountValue: 20, status: loyalty_entity_1.LoyaltyPlanStatus.Active };
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            registerCouponPlan: () => plan
        }));
        const body = { code: 'PCT-20', title: '八折券', description: '20% off', discountType: loyalty_entity_1.CouponDiscountType.Percentage, discountValue: 20, minOrderAmount: 0, totalQuota: 500, perMemberLimit: 3, validFrom: '2025-06-01', validUntil: '2025-12-31' };
        const result = controller.registerCouponPlan(tenantCtx, body);
        strict_1.default.equal(result.discountType, loyalty_entity_1.CouponDiscountType.Percentage);
        strict_1.default.equal(result.discountValue, 20);
    });
    (0, node_test_1.default)('[反例] registerCouponPlan 传递 service error', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            registerCouponPlan: () => { throw new Error('duplicate code'); }
        }));
        strict_1.default.throws(() => controller.registerCouponPlan(tenantCtx, { code: 'DUP', title: '重复', description: '重复券', discountType: loyalty_entity_1.CouponDiscountType.FixedAmount, discountValue: 5, minOrderAmount: 0, totalQuota: 10, perMemberLimit: 1, validFrom: '2025-01-01', validUntil: '2025-06-30' }), /duplicate code/);
    });
    (0, node_test_1.default)('[正例] listCouponPlans 返回所有优惠券计划', () => {
        const plans = [
            { planId: 'cp-1', code: 'C1', title: '券1', discountType: loyalty_entity_1.CouponDiscountType.FixedAmount, discountValue: 5, status: loyalty_entity_1.LoyaltyPlanStatus.Active },
            { planId: 'cp-2', code: 'C2', title: '券2', discountType: loyalty_entity_1.CouponDiscountType.Percentage, discountValue: 15, status: loyalty_entity_1.LoyaltyPlanStatus.Draft }
        ];
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listCouponPlans: () => plans
        }));
        const result = controller.listCouponPlans(tenantCtx);
        strict_1.default.equal(result.length, 2);
        strict_1.default.equal(result[0].code, 'C1');
        strict_1.default.equal(result[1].code, 'C2');
    });
    (0, node_test_1.default)('[边界] listCouponPlans 返回空数组（无计划）', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listCouponPlans: () => []
        }));
        const result = controller.listCouponPlans(tenantCtx);
        strict_1.default.deepEqual(result, []);
    });
    (0, node_test_1.default)('[正例] getCouponPlan 根据 planId 获取单个计划', () => {
        const plan = { planId: 'cp-3', code: 'C3', title: '券3', discountType: loyalty_entity_1.CouponDiscountType.FixedAmount, discountValue: 30, status: loyalty_entity_1.LoyaltyPlanStatus.Active };
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            getCouponPlan: () => plan
        }));
        const result = controller.getCouponPlan(tenantCtx, 'cp-3');
        strict_1.default.ok(result);
        if (!result)
            return;
        strict_1.default.equal(result.planId, 'cp-3');
        strict_1.default.equal(result.discountValue, 30);
    });
    (0, node_test_1.default)('[反例] getCouponPlan 不存在的计划返回 undefined', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            getCouponPlan: () => undefined
        }));
        const result = controller.getCouponPlan(tenantCtx, 'no-such-plan');
        strict_1.default.equal(result, undefined);
    });
    (0, node_test_1.default)('[正例] activateCouponPlan 激活计划', () => {
        const plan = { planId: 'cp-4', code: 'C4', title: '券4', status: loyalty_entity_1.LoyaltyPlanStatus.Active };
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            updateCouponPlanStatus: () => plan
        }));
        const result = controller.activateCouponPlan(tenantCtx, 'cp-4', { status: loyalty_entity_1.LoyaltyPlanStatus.Active });
        strict_1.default.equal(result.status, loyalty_entity_1.LoyaltyPlanStatus.Active);
    });
    (0, node_test_1.default)('[正例] activateCouponPlan 停用计划（Draft 状态）', () => {
        const plan = { planId: 'cp-5', code: 'C5', title: '券5', status: loyalty_entity_1.LoyaltyPlanStatus.Draft };
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            updateCouponPlanStatus: () => plan
        }));
        const result = controller.activateCouponPlan(tenantCtx, 'cp-5', { status: loyalty_entity_1.LoyaltyPlanStatus.Draft });
        strict_1.default.equal(result.status, loyalty_entity_1.LoyaltyPlanStatus.Draft);
    });
    (0, node_test_1.default)('[反例] activateCouponPlan 不存在的计划抛错', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            updateCouponPlanStatus: () => { throw new Error('not found'); }
        }));
        strict_1.default.throws(() => controller.activateCouponPlan(tenantCtx, 'ghost-plan', { status: loyalty_entity_1.LoyaltyPlanStatus.Active }), /not found/);
    });
    (0, node_test_1.default)('[正例] issueCoupon 分配优惠券给会员', () => {
        const redemption = { redemptionId: 'cr-issued', couponCode: 'ISSUED-1', memberId: 'm-issued', status: loyalty_entity_1.CouponRedemptionStatus.Released };
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            issueCouponFromPlan: () => redemption
        }));
        const result = controller.issueCoupon(tenantCtx, 'cp-6', { memberId: 'm-issued', source: 'manual' });
        strict_1.default.equal(result.redemptionId, 'cr-issued');
        strict_1.default.equal(result.memberId, 'm-issued');
        strict_1.default.equal(result.status, loyalty_entity_1.CouponRedemptionStatus.Released);
    });
    (0, node_test_1.default)('[边界] issueCoupon 缺少成员抛错', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            issueCouponFromPlan: () => { throw new Error('memberId is required'); }
        }));
        strict_1.default.throws(() => controller.issueCoupon(tenantCtx, 'cp-7', { memberId: '', source: 'auto' }), /memberId/);
    });
});
// ══════════════════════════════════════════════════════════════
// 🐜 新增补全: blindbox-plans CRUD
// ══════════════════════════════════════════════════════════════
(0, node_test_1.describe)('LoyaltyController — blindbox-plans CRUD', () => {
    const tenantCtx = { tenantId: 't-blindbox' };
    (0, node_test_1.default)('[正例] registerBlindboxPlan 创建盲盒计划', () => {
        const plan = { planId: 'bb-new', blindboxPlanId: 'BB-NEW', title: '神秘盲盒', description: '随机奖励', unitPrice: 29.9, totalQuota: 1000, rewardPool: [{ sku: 'SKU-A', weight: 10, label: 'A款' }, { sku: 'SKU-B', weight: 20, label: 'B款' }], validFrom: '2025-06-01', validUntil: '2025-12-31', status: loyalty_entity_1.LoyaltyPlanStatus.Active };
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            registerBlindboxPlan: () => plan
        }));
        const body = { blindboxPlanId: 'BB-NEW', title: '神秘盲盒', description: '随机奖励', unitPrice: 29.9, totalQuota: 1000, rewardPool: [{ sku: 'SKU-A', weight: 10, label: 'A款' }, { sku: 'SKU-B', weight: 20, label: 'B款' }], validFrom: '2025-06-01', validUntil: '2025-12-31' };
        const result = controller.registerBlindboxPlan(tenantCtx, body);
        strict_1.default.equal(result.blindboxPlanId, 'BB-NEW');
        strict_1.default.equal(result.unitPrice, 29.9);
        strict_1.default.equal(result.rewardPool.length, 2);
        strict_1.default.equal(result.status, loyalty_entity_1.LoyaltyPlanStatus.Active);
    });
    (0, node_test_1.default)('[反例] registerBlindboxPlan 重复盲盒计划 ID 抛错', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            registerBlindboxPlan: () => { throw new Error('blindbox plan already exists'); }
        }));
        strict_1.default.throws(() => controller.registerBlindboxPlan(tenantCtx, { blindboxPlanId: 'DUP-BB', title: '重复', description: '重复盲盒', unitPrice: 10, totalQuota: 100, rewardPool: [{ sku: 'SKU-X', weight: 10, label: 'X款' }], validFrom: '2025-01-01', validUntil: '2025-06-30' }), /already exists/);
    });
    (0, node_test_1.default)('[正例] listBlindboxPlans 返回所有盲盒计划', () => {
        const plans = [
            { planId: 'bb-1', blindboxPlanId: 'BB1', title: '盲盒1', unitPrice: 10, status: loyalty_entity_1.LoyaltyPlanStatus.Active },
            { planId: 'bb-2', blindboxPlanId: 'BB2', title: '盲盒2', unitPrice: 20, status: loyalty_entity_1.LoyaltyPlanStatus.Draft }
        ];
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listBlindboxPlans: () => plans
        }));
        const result = controller.listBlindboxPlans(tenantCtx);
        strict_1.default.equal(result.length, 2);
        strict_1.default.equal(result[0].blindboxPlanId, 'BB1');
        strict_1.default.equal(result[1].unitPrice, 20);
    });
    (0, node_test_1.default)('[边界] listBlindboxPlans 返回空数组', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            listBlindboxPlans: () => []
        }));
        const result = controller.listBlindboxPlans(tenantCtx);
        strict_1.default.deepEqual(result, []);
    });
    (0, node_test_1.default)('[正例] getBlindboxPlan 根据 planId 获取单个盲盒计划', () => {
        const plan = { planId: 'bb-3', blindboxPlanId: 'BB3', title: '盲盒3', unitPrice: 49.9, status: loyalty_entity_1.LoyaltyPlanStatus.Active };
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            getBlindboxPlan: () => plan
        }));
        const result = controller.getBlindboxPlan(tenantCtx, 'bb-3');
        strict_1.default.ok(result);
        if (!result)
            return;
        strict_1.default.equal(result.blindboxPlanId, 'BB3');
        strict_1.default.equal(result.unitPrice, 49.9);
    });
    (0, node_test_1.default)('[反例] getBlindboxPlan 不存在的计划返回 undefined', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            getBlindboxPlan: () => undefined
        }));
        const result = controller.getBlindboxPlan(tenantCtx, 'no-such-bb');
        strict_1.default.equal(result, undefined);
    });
    (0, node_test_1.default)('[正例] activateBlindboxPlan 激活盲盒计划', () => {
        const plan = { planId: 'bb-4', blindboxPlanId: 'BB4', title: '盲盒4', status: loyalty_entity_1.LoyaltyPlanStatus.Active };
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            updateBlindboxPlanStatus: () => plan
        }));
        const result = controller.activateBlindboxPlan(tenantCtx, 'bb-4', { status: loyalty_entity_1.LoyaltyPlanStatus.Active });
        strict_1.default.equal(result.status, loyalty_entity_1.LoyaltyPlanStatus.Active);
    });
    (0, node_test_1.default)('[正例] activateBlindboxPlan 停用盲盒计划', () => {
        const plan = { planId: 'bb-5', blindboxPlanId: 'BB5', title: '盲盒5', status: loyalty_entity_1.LoyaltyPlanStatus.Draft };
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            updateBlindboxPlanStatus: () => plan
        }));
        const result = controller.activateBlindboxPlan(tenantCtx, 'bb-5', { status: loyalty_entity_1.LoyaltyPlanStatus.Draft });
        strict_1.default.equal(result.status, loyalty_entity_1.LoyaltyPlanStatus.Draft);
    });
    (0, node_test_1.default)('[反例] activateBlindboxPlan 不存在的计划抛错', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            updateBlindboxPlanStatus: () => { throw new Error('blindbox plan not found'); }
        }));
        strict_1.default.throws(() => controller.activateBlindboxPlan(tenantCtx, 'ghost-bb', { status: loyalty_entity_1.LoyaltyPlanStatus.Active }), /not found/);
    });
    (0, node_test_1.default)('[正例] issueBlindbox 为会员发放盲盒', () => {
        const fulfillment = { fulfillmentId: 'bf-issued', blindboxPlanId: 'BB-ISSUED', memberId: 'm-issued-bb', quantity: 3, rewardSku: 'SKU-RANDOM', status: loyalty_entity_1.BlindboxFulfillmentStatus.Fulfilled };
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            issueBlindboxFromPlan: () => fulfillment
        }));
        const result = controller.issueBlindbox(tenantCtx, 'bb-6', { memberId: 'm-issued-bb', quantity: 3 });
        strict_1.default.equal(result.fulfillmentId, 'bf-issued');
        strict_1.default.equal(result.memberId, 'm-issued-bb');
        strict_1.default.equal(result.quantity, 3);
        strict_1.default.equal(result.status, loyalty_entity_1.BlindboxFulfillmentStatus.Fulfilled);
    });
    (0, node_test_1.default)('[反例] issueBlindbox 配额不足抛错', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            issueBlindboxFromPlan: () => { throw new Error('quota exceeded'); }
        }));
        strict_1.default.throws(() => controller.issueBlindbox(tenantCtx, 'bb-7', { memberId: 'm-hungry', quantity: 9999 }), /quota exceeded/);
    });
    (0, node_test_1.default)('[边界] issueBlindbox 零数量抛错', () => {
        const controller = new loyalty_controller_1.LoyaltyController(makeMockService({
            issueBlindboxFromPlan: () => { throw new Error('quantity must be positive'); }
        }));
        strict_1.default.throws(() => controller.issueBlindbox(tenantCtx, 'bb-8', { memberId: 'm-zero', quantity: 0 }), /positive/);
    });
});
// ══════════════════════════════════════════════════════════════
// 🐜 新增补全: coupon/blindbox metadata 验证
// ══════════════════════════════════════════════════════════════
(0, node_test_1.describe)('LoyaltyController metadata — coupon & blindbox endpoints', () => {
    (0, node_test_1.default)('registerCouponPlan POST coupon-plans', () => {
        const m = Reflect.getMetadata('method', loyalty_controller_1.LoyaltyController.prototype.registerCouponPlan);
        const p = Reflect.getMetadata('path', loyalty_controller_1.LoyaltyController.prototype.registerCouponPlan);
        strict_1.default.equal(m, 1);
        strict_1.default.equal(p, 'coupon-plans');
    });
    (0, node_test_1.default)('listCouponPlans GET coupon-plans', () => {
        const m = Reflect.getMetadata('method', loyalty_controller_1.LoyaltyController.prototype.listCouponPlans);
        const p = Reflect.getMetadata('path', loyalty_controller_1.LoyaltyController.prototype.listCouponPlans);
        strict_1.default.equal(m, 0);
        strict_1.default.equal(p, 'coupon-plans');
    });
    (0, node_test_1.default)('getCouponPlan GET coupon-plans/:planId', () => {
        const m = Reflect.getMetadata('method', loyalty_controller_1.LoyaltyController.prototype.getCouponPlan);
        const p = Reflect.getMetadata('path', loyalty_controller_1.LoyaltyController.prototype.getCouponPlan);
        strict_1.default.equal(m, 0);
        strict_1.default.equal(p, 'coupon-plans/:planId');
    });
    (0, node_test_1.default)('activateCouponPlan PATCH coupon-plans/:planId/status', () => {
        const m = Reflect.getMetadata('method', loyalty_controller_1.LoyaltyController.prototype.activateCouponPlan);
        const p = Reflect.getMetadata('path', loyalty_controller_1.LoyaltyController.prototype.activateCouponPlan);
        strict_1.default.equal(m, 4); // PATCH
        strict_1.default.equal(p, 'coupon-plans/:planId/status');
    });
    (0, node_test_1.default)('issueCoupon POST coupon-plans/:planId/issue', () => {
        const m = Reflect.getMetadata('method', loyalty_controller_1.LoyaltyController.prototype.issueCoupon);
        const p = Reflect.getMetadata('path', loyalty_controller_1.LoyaltyController.prototype.issueCoupon);
        strict_1.default.equal(m, 1);
        strict_1.default.equal(p, 'coupon-plans/:planId/issue');
    });
    (0, node_test_1.default)('registerBlindboxPlan POST blindbox-plans', () => {
        const m = Reflect.getMetadata('method', loyalty_controller_1.LoyaltyController.prototype.registerBlindboxPlan);
        const p = Reflect.getMetadata('path', loyalty_controller_1.LoyaltyController.prototype.registerBlindboxPlan);
        strict_1.default.equal(m, 1);
        strict_1.default.equal(p, 'blindbox-plans');
    });
    (0, node_test_1.default)('listBlindboxPlans GET blindbox-plans', () => {
        const m = Reflect.getMetadata('method', loyalty_controller_1.LoyaltyController.prototype.listBlindboxPlans);
        const p = Reflect.getMetadata('path', loyalty_controller_1.LoyaltyController.prototype.listBlindboxPlans);
        strict_1.default.equal(m, 0);
        strict_1.default.equal(p, 'blindbox-plans');
    });
    (0, node_test_1.default)('getBlindboxPlan GET blindbox-plans/:planId', () => {
        const m = Reflect.getMetadata('method', loyalty_controller_1.LoyaltyController.prototype.getBlindboxPlan);
        const p = Reflect.getMetadata('path', loyalty_controller_1.LoyaltyController.prototype.getBlindboxPlan);
        strict_1.default.equal(m, 0);
        strict_1.default.equal(p, 'blindbox-plans/:planId');
    });
    (0, node_test_1.default)('activateBlindboxPlan PATCH blindbox-plans/:planId/status', () => {
        const m = Reflect.getMetadata('method', loyalty_controller_1.LoyaltyController.prototype.activateBlindboxPlan);
        const p = Reflect.getMetadata('path', loyalty_controller_1.LoyaltyController.prototype.activateBlindboxPlan);
        strict_1.default.equal(m, 4); // PATCH
        strict_1.default.equal(p, 'blindbox-plans/:planId/status');
    });
    (0, node_test_1.default)('issueBlindbox POST blindbox-plans/:planId/issue', () => {
        const m = Reflect.getMetadata('method', loyalty_controller_1.LoyaltyController.prototype.issueBlindbox);
        const p = Reflect.getMetadata('path', loyalty_controller_1.LoyaltyController.prototype.issueBlindbox);
        strict_1.default.equal(m, 1);
        strict_1.default.equal(p, 'blindbox-plans/:planId/issue');
    });
});
//# sourceMappingURL=loyalty.controller.test.js.map