"use strict";
/**
 * E2E-level: Loyalty 积分会员 service 层测试
 *
 * 链路:
 *   LoyaltyService
 *     → listPointsLedger / listCouponRedemptions / listBlindboxFulfillments / listSettlements
 *     → registerCouponPlan / listCouponPlans / getCouponPlan / activateCouponPlan / issueCoupon
 *     → registerBlindboxPlan / listBlindboxPlans / getBlindboxPlan / activateBlindboxPlan / issueBlindbox
 *     → settlePaidOrder / settleFailedOrder / refundRollback
 *
 * 验证:
 *   - 列表查询初始为空
 *   - 注册 Coupon Plan 后列表可查
 *   - Coupon Plan 状态激活
 *   - 发放优惠券成功
 *   - 注册盲盒计划
 *   - settlePaidOrder 创建积分、优惠券赎回、盲盒履约
 *   - settleFailedOrder 释放优惠券
 *   - 租户隔离
 *   - 边界: 无效 planId
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const loyalty_service_1 = require("./loyalty.service");
const loyalty_entity_1 = require("./loyalty.entity");
// ========== mock MemberService ==========
function mockMemberService() {
    return {
        awardPoints: async () => undefined,
        recordPaymentActivity: async () => undefined,
    };
}
// ========== helpers ==========
function makeTenant(id) {
    return { tenantId: id, brandId: '', storeId: '', marketCode: '' };
}
function createService() {
    return new loyalty_service_1.LoyaltyService(mockMemberService());
}
// ========== 列表 ==========
(0, node_test_1.default)('e2e: listPointsLedger is empty initially', () => {
    const svc = createService();
    const res = svc.listPointsLedger('tenant-A');
    strict_1.default.ok(Array.isArray(res));
    strict_1.default.equal(res.length, 0);
});
(0, node_test_1.default)('e2e: listCouponRedemptions is empty initially', () => {
    const svc = createService();
    const res = svc.listCouponRedemptions('tenant-A');
    strict_1.default.ok(Array.isArray(res));
    strict_1.default.equal(res.length, 0);
});
(0, node_test_1.default)('e2e: listBlindboxFulfillments is empty initially', () => {
    const svc = createService();
    const res = svc.listBlindboxFulfillments('tenant-A');
    strict_1.default.ok(Array.isArray(res));
    strict_1.default.equal(res.length, 0);
});
(0, node_test_1.default)('e2e: listSettlements is empty initially', () => {
    const svc = createService();
    const res = svc.listSettlements('tenant-A');
    strict_1.default.ok(Array.isArray(res));
    strict_1.default.equal(res.length, 0);
});
// ========== Coupon Plan ==========
(0, node_test_1.default)('e2e: registerCouponPlan then listCouponPlans returns it', () => {
    const svc = createService();
    const ctx = makeTenant('tenant-1');
    svc.registerCouponPlan({
        tenantContext: ctx,
        code: 'CPN-NEWYEAR',
        title: '新年优惠',
        discountType: loyalty_entity_1.CouponDiscountType.FixedAmount,
        discountValue: 50,
        totalQuota: 1000,
        perMemberLimit: 3,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z',
    });
    const plans = svc.listCouponPlans('tenant-1');
    strict_1.default.equal(plans.length, 1);
    strict_1.default.equal(plans[0].code, 'CPN-NEWYEAR');
});
(0, node_test_1.default)('e2e: getCouponPlan returns the correct plan', () => {
    const svc = createService();
    const ctx = makeTenant('tenant-2');
    const plan = svc.registerCouponPlan({
        tenantContext: ctx,
        code: 'CPN-SUMMER',
        title: '夏日特惠',
        discountType: loyalty_entity_1.CouponDiscountType.Percentage,
        discountValue: 15,
        totalQuota: 500,
        perMemberLimit: 1,
        validFrom: '2026-06-01T00:00:00.000Z',
        validUntil: '2026-08-31T23:59:59.000Z',
    });
    const found = svc.getCouponPlan(plan.planId, 'tenant-2');
    strict_1.default.equal(found.code, 'CPN-SUMMER');
    strict_1.default.equal(found.discountType, loyalty_entity_1.CouponDiscountType.Percentage);
    strict_1.default.equal(found.discountValue, 15);
});
(0, node_test_1.default)('e2e: activateCouponPlan changes status', () => {
    const svc = createService();
    const ctx = makeTenant('tenant-3');
    const plan = svc.registerCouponPlan({
        tenantContext: ctx,
        code: 'CPN-ACTIVE',
        title: '激活测试',
        discountType: loyalty_entity_1.CouponDiscountType.FixedAmount,
        discountValue: 10,
        totalQuota: 100,
        perMemberLimit: 2,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z',
    });
    strict_1.default.equal(plan.status, loyalty_entity_1.LoyaltyPlanStatus.Draft);
    const updated = svc.updateCouponPlanStatus(plan.planId, loyalty_entity_1.LoyaltyPlanStatus.Active, 'tenant-3');
    strict_1.default.equal(updated.status, loyalty_entity_1.LoyaltyPlanStatus.Active);
});
(0, node_test_1.default)('e2e: issueCouponFromPlan reduces remaining quota', () => {
    const svc = createService();
    const ctx = makeTenant('tenant-4');
    const plan = svc.registerCouponPlan({
        tenantContext: ctx,
        code: 'CPN-ISSUE',
        title: '发放测试',
        discountType: loyalty_entity_1.CouponDiscountType.FixedAmount,
        discountValue: 20,
        totalQuota: 100,
        perMemberLimit: 5,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z',
    });
    svc.updateCouponPlanStatus(plan.planId, loyalty_entity_1.LoyaltyPlanStatus.Active, 'tenant-4');
    const res = svc.issueCouponFromPlan({
        tenantContext: ctx,
        memberId: 'member-1',
        planId: plan.planId,
        source: 'manual',
    });
    strict_1.default.equal(res.status, 'REDEEMED');
    // remaining quota decreased
    const updatedPlan = svc.getCouponPlan(plan.planId, 'tenant-4');
    strict_1.default.equal(updatedPlan.remainingQuota, 99);
});
// ========== Blindbox Plan ==========
(0, node_test_1.default)('e2e: registerBlindboxPlan then listBlindboxPlans returns it', () => {
    const svc = createService();
    const ctx = makeTenant('tenant-5');
    svc.registerBlindboxPlan({
        tenantContext: ctx,
        blindboxPlanId: 'BB-MYSTERY',
        title: '神秘盲盒',
        unitPrice: 59,
        totalQuota: 200,
        rewardPool: [
            { sku: 'rare', weight: 10, label: '稀有款' },
            { sku: 'normal', weight: 90, label: '普通款' },
        ],
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z',
    });
    const plans = svc.listBlindboxPlans('tenant-5');
    strict_1.default.equal(plans.length, 1);
    strict_1.default.equal(plans[0].blindboxPlanId, 'BB-MYSTERY');
});
(0, node_test_1.default)('e2e: getBlindboxPlan returns correct plan', () => {
    const svc = createService();
    const ctx = makeTenant('tenant-6');
    const plan = svc.registerBlindboxPlan({
        tenantContext: ctx,
        blindboxPlanId: 'BB-GOLDEN',
        title: '黄金盲盒',
        unitPrice: 199,
        totalQuota: 50,
        rewardPool: [{ sku: 'gold', weight: 100, label: '金' }],
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z',
    });
    const found = svc.getBlindboxPlan(plan.planId, 'tenant-6');
    strict_1.default.equal(found.blindboxPlanId, 'BB-GOLDEN');
    strict_1.default.equal(found.unitPrice, 199);
});
(0, node_test_1.default)('e2e: activateBlindboxPlan changes status', () => {
    const svc = createService();
    const ctx = makeTenant('tenant-7');
    const plan = svc.registerBlindboxPlan({
        tenantContext: ctx,
        blindboxPlanId: 'BB-ACTIVE',
        title: '激活盲盒',
        unitPrice: 39,
        totalQuota: 100,
        rewardPool: [{ sku: 'sample', weight: 100, label: '样品' }],
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z',
    });
    strict_1.default.equal(plan.status, loyalty_entity_1.LoyaltyPlanStatus.Draft);
    const updated = svc.updateBlindboxPlanStatus(plan.planId, loyalty_entity_1.LoyaltyPlanStatus.Active, 'tenant-7');
    strict_1.default.equal(updated.status, loyalty_entity_1.LoyaltyPlanStatus.Active);
});
// ========== Tenant isolation ==========
(0, node_test_1.default)('e2e: tenant isolation - plan not visible in other tenant', () => {
    const svc = createService();
    svc.registerCouponPlan({
        tenantContext: makeTenant('tenant-A'),
        code: 'CPN-ONLY-A',
        title: 'Only A',
        discountType: loyalty_entity_1.CouponDiscountType.FixedAmount,
        discountValue: 10,
        totalQuota: 100,
        perMemberLimit: 1,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z',
    });
    const plansA = svc.listCouponPlans('tenant-A');
    const plansB = svc.listCouponPlans('tenant-B');
    strict_1.default.equal(plansA.length, 1);
    strict_1.default.equal(plansB.length, 0);
});
// ========== settlePaidOrder ==========
(0, node_test_1.default)('e2e: settlePaidOrder creates points ledger entry', async () => {
    const svc = createService();
    const ctx = makeTenant('tenant-settle');
    // settlePaidOrder 需要 CashierOrder/CashierPayment 形状
    const result = await svc.settlePaidOrder({
        tenantContext: ctx,
        orderId: 'order-001',
        memberId: 'member-001',
    }, {
        tenantContext: ctx,
        paymentId: 'pay-001',
        amount: 299,
        channel: 'wechat',
        completedAt: '2026-06-23T08:00:00.000Z',
    });
    strict_1.default.equal(result.status, 'SUCCEEDED');
    strict_1.default.equal(result.awardedPoints, 299);
    strict_1.default.equal(result.memberId, 'member-001');
    const ledger = svc.listPointsLedger('tenant-settle');
    strict_1.default.equal(ledger.length, 1);
    strict_1.default.equal(ledger[0].points, 299);
    strict_1.default.equal(ledger[0].memberId, 'member-001');
});
(0, node_test_1.default)('e2e: settlePaidOrder is idempotent for same order', async () => {
    const svc = createService();
    const ctx = makeTenant('tenant-idem');
    const order = { tenantContext: ctx, orderId: 'order-idem', memberId: 'member-002' };
    const payment = {
        tenantContext: ctx,
        paymentId: 'pay-idem',
        amount: 100,
        channel: 'alipay',
        completedAt: '2026-06-23T08:00:00.000Z',
    };
    const r1 = await svc.settlePaidOrder(order, payment);
    const r2 = await svc.settlePaidOrder(order, payment);
    strict_1.default.equal(r1.settlementId, r2.settlementId); // 幂等返回同一 settlement
    const ledger = svc.listPointsLedger('tenant-idem');
    strict_1.default.equal(ledger.length, 1); // 不会重复创建
});
// ========== settleFailedOrder ==========
(0, node_test_1.default)('e2e: settleFailedOrder creates CouponRedemption with Released status', async () => {
    const svc = createService();
    const ctx = makeTenant('tenant-fail');
    await svc.settleFailedOrder({
        tenantContext: ctx,
        orderId: 'order-fail-001',
        memberId: 'member-003',
        couponCode: 'CPN-FAIL-TEST',
    }, { tenantContext: ctx, paymentId: 'pay-fail-001', amount: 0 });
    const redemptions = svc.listCouponRedemptions('tenant-fail');
    strict_1.default.equal(redemptions.length, 1);
    strict_1.default.equal(redemptions[0].status, 'RELEASED');
    strict_1.default.equal(redemptions[0].couponCode, 'CPN-FAIL-TEST');
});
// ========== 边界 ==========
(0, node_test_1.default)('e2e: getCouponPlan with non-existent planId returns undefined', () => {
    const svc = createService();
    const result = svc.getCouponPlan('non-existent-plan', 'tenant-1');
    strict_1.default.equal(result, undefined);
});
(0, node_test_1.default)('e2e: settlePaidOrder without memberId throws', async () => {
    const svc = createService();
    const ctx = makeTenant('tenant-err');
    await strict_1.default.rejects(() => svc.settlePaidOrder({ tenantContext: ctx, orderId: 'order-no-member' }, { tenantContext: ctx, paymentId: 'pay-001', amount: 100 }));
});
(0, node_test_1.default)('e2e: issueCoupon beyond perMemberLimit throws', () => {
    const svc = createService();
    const ctx = makeTenant('tenant-limit');
    const plan = svc.registerCouponPlan({
        tenantContext: ctx,
        code: 'CPN-LIMIT',
        title: '限制测试',
        discountType: loyalty_entity_1.CouponDiscountType.FixedAmount,
        discountValue: 5,
        totalQuota: 10,
        perMemberLimit: 2,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z',
    });
    svc.updateCouponPlanStatus(plan.planId, loyalty_entity_1.LoyaltyPlanStatus.Active, 'tenant-limit');
    // 先发放 2 次，第三次应该失败
    svc.issueCouponFromPlan({ tenantContext: ctx, memberId: 'member-limit', planId: plan.planId, source: 'manual' });
    svc.issueCouponFromPlan({ tenantContext: ctx, memberId: 'member-limit', planId: plan.planId, source: 'manual' });
    const fn = () => svc.issueCouponFromPlan({ tenantContext: ctx, memberId: 'member-limit', planId: plan.planId, source: 'manual' });
    strict_1.default.throws(fn, /per-member limit/i);
});
//# sourceMappingURL=loyalty.e2e.test.js.map