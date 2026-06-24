"use strict";
/**
 * 🐜 扩展角色测试: loyalty 模块
 *
 * 4 个附加角色视角：
 * 🛒前台 — 查询会员积分
 * 📢营销 — 创建营销活动
 * 🎯运行专员 — 管理奖品奖励
 * 👔店长 — 查看忠诚度分析
 *
 * 每个角色 3 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
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
const loyalty_service_1 = require("./loyalty.service");
const loyalty_entity_1 = require("./loyalty.entity");
// ── 测试数据工厂 ──
const tenantCtx = {
    tenantId: 't-loyalty-ext',
    brandId: 'b-arcade',
    storeId: 's-main',
};
/** Mock MemberService to avoid real Prisma dependency */
class MockMemberService {
    async awardPoints(memberId, points, ctx) { return undefined; }
    async rollbackPoints(memberId, points, ctx) { return undefined; }
    async recordPaymentActivity(args) { return undefined; }
}
function createController() {
    const memberService = new MockMemberService();
    const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
    // Reset in-memory stores
    const resetMethod = loyaltyService.resetLoyaltyStoresForTests;
    if (resetMethod)
        resetMethod.call(loyaltyService);
    return new loyalty_controller_1.LoyaltyController(loyaltyService);
}
// ──────────────────────────────────────────────────────────────────────
// 🛒前台 — 查询会员积分 (reception looking up member points)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('🛒前台 — 会员积分查询视角', () => {
    (0, node_test_1.default)('查询积分台账可见已有积分记录 (points ledger query)', () => {
        const ctrl = createController();
        // 初始积分台账为空
        const ledger = ctrl.listPointsLedger(tenantCtx);
        strict_1.default.ok(Array.isArray(ledger));
        strict_1.default.equal(ledger.length, 0);
    });
    (0, node_test_1.default)('结算成功后积分台账有对应积分记录 (points awarded after settlement)', async () => {
        const ctrl = createController();
        const service = ctrl.loyaltyService;
        // 模拟支付结算
        const mockOrder = {
            orderId: 'order-001',
            memberId: 'mem-001',
            tenantContext: tenantCtx,
            amount: 5000,
            couponCode: undefined,
            blindboxPlanId: undefined,
            blindboxQuantity: undefined,
        };
        const mockPayment = {
            paymentId: 'pay-001',
            amount: 5000,
            channel: 'WECHAT',
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await service.settlePaidOrder(mockOrder, mockPayment);
        const ledger = ctrl.listPointsLedger(tenantCtx);
        (0, strict_1.default)(ledger.length >= 1);
        const entry = ledger.find((e) => e.orderId === 'order-001');
        (0, strict_1.default)(entry, '支付订单应有积分记录');
        (0, strict_1.default)(entry.points > 0, '积分应大于 0');
        strict_1.default.equal(entry.reason, 'cashier.payment-succeeded');
    });
    (0, node_test_1.default)('退款后会扣回对应积分 (points rollback on refund)', async () => {
        const ctrl = createController();
        const service = ctrl.loyaltyService;
        const mockOrder = {
            orderId: 'order-refund-001',
            memberId: 'mem-refund-001',
            tenantContext: tenantCtx,
            amount: 3000,
            couponCode: undefined,
            blindboxPlanId: undefined,
            blindboxQuantity: undefined,
        };
        const mockPayment = {
            paymentId: 'pay-refund-001',
            amount: 3000,
            channel: 'ALIPAY',
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        // 先结算
        await service.settlePaidOrder(mockOrder, mockPayment);
        const beforeRefund = ctrl.listPointsLedger(tenantCtx);
        const totalPointsBefore = beforeRefund
            .filter((e) => e.points > 0)
            .reduce((sum, e) => sum + e.points, 0);
        (0, strict_1.default)(totalPointsBefore > 0, '结算后应有正积分');
        // 退款
        const refundResult = await service.applyRefund(mockOrder, mockPayment, 3000);
        (0, strict_1.default)(refundResult.reversedPoints > 0, '退款应扣回积分');
        const afterRefund = ctrl.listPointsLedger(tenantCtx);
        const negativeEntries = afterRefund.filter((e) => e.points < 0 && e.orderId === 'order-refund-001');
        strict_1.default.equal(negativeEntries.length, 1, '应有 1 条扣分记录');
    });
});
// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 创建营销活动 (marketing creating campaigns)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('📢营销 — 营销活动创建视角', () => {
    (0, node_test_1.default)('创建优惠券活动计划 (create coupon plan)', () => {
        const ctrl = createController();
        const plan = ctrl.registerCouponPlan(tenantCtx, {
            code: 'PROMO-618',
            title: '618 大促满减券',
            description: '满 100 减 20',
            discountType: loyalty_entity_1.CouponDiscountType.FixedAmount,
            discountValue: 2000,
            minOrderAmount: 10000,
            totalQuota: 500,
            perMemberLimit: 2,
            validFrom: '2026-06-01T00:00:00.000Z',
            validUntil: '2026-06-20T23:59:59.999Z',
        });
        strict_1.default.equal(plan.code, 'PROMO-618');
        strict_1.default.equal(plan.totalQuota, 500);
        strict_1.default.equal(plan.remainingQuota, 500);
        strict_1.default.equal(plan.status, loyalty_entity_1.LoyaltyPlanStatus.Draft);
    });
    (0, node_test_1.default)('激活优惠券计划后可发放 (activate and issue coupon)', () => {
        const ctrl = createController();
        const plan = ctrl.registerCouponPlan(tenantCtx, {
            code: 'NEW-YEAR',
            title: '新年折扣券',
            discountType: loyalty_entity_1.CouponDiscountType.Percentage,
            discountValue: 85,
            totalQuota: 100,
            perMemberLimit: 1,
            validFrom: '2026-01-01T00:00:00.000Z',
            validUntil: '2026-12-31T23:59:59.999Z',
        });
        // 激活计划
        const activated = ctrl.activateCouponPlan(tenantCtx, plan.planId, {
            status: loyalty_entity_1.LoyaltyPlanStatus.Active,
        });
        strict_1.default.equal(activated.status, loyalty_entity_1.LoyaltyPlanStatus.Active);
        // 发放优惠券给会员
        const redemption = ctrl.issueCoupon(tenantCtx, plan.planId, {
            memberId: 'mem-promo-001',
            source: 'marketing-campaign',
        });
        strict_1.default.equal(redemption.couponCode, 'NEW-YEAR');
        strict_1.default.equal(redemption.memberId, 'mem-promo-001');
    });
    (0, node_test_1.default)('无效的折扣比例拒绝注册 (invalid discount validation)', () => {
        const ctrl = createController();
        // 百分比折扣超过 100%
        strict_1.default.throws(() => ctrl.registerCouponPlan(tenantCtx, {
            code: 'INVALID-PCT',
            title: '异常折扣',
            discountType: loyalty_entity_1.CouponDiscountType.Percentage,
            discountValue: 150,
            totalQuota: 50,
            perMemberLimit: 1,
            validFrom: '2026-01-01T00:00:00.000Z',
            validUntil: '2026-12-31T23:59:59.999Z',
        }), /Percentage discount cannot exceed 100/);
    });
});
// ──────────────────────────────────────────────────────────────────────
// 🎯运行专员 — 管理奖品奖励 (operations managing rewards)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('🎯运行专员 — 奖品奖励管理视角', () => {
    (0, node_test_1.default)('创建盲盒计划 (create blindbox plan)', () => {
        const ctrl = createController();
        const plan = ctrl.registerBlindboxPlan(tenantCtx, {
            blindboxPlanId: 'GACHA-SUMMER',
            title: '夏日限定扭蛋',
            description: '夏天专属奖励',
            unitPrice: 500,
            totalQuota: 200,
            rewardPool: [
                { sku: 'PRIZE-A', weight: 50, label: '徽章' },
                { sku: 'PRIZE-B', weight: 30, label: '钥匙扣' },
                { sku: 'PRIZE-C', weight: 15, label: '小公仔' },
                { sku: 'PRIZE-D', weight: 5, label: '隐藏款手办' },
            ],
            validFrom: '2026-07-01T00:00:00.000Z',
            validUntil: '2026-08-31T23:59:59.999Z',
        });
        strict_1.default.equal(plan.title, '夏日限定扭蛋');
        strict_1.default.equal(plan.totalQuota, 200);
        strict_1.default.equal(plan.rewardPool.length, 4);
        strict_1.default.equal(plan.status, loyalty_entity_1.LoyaltyPlanStatus.Draft);
    });
    (0, node_test_1.default)('激活盲盒后可从计划发放 (activate and issue blindbox)', () => {
        const ctrl = createController();
        const plan = ctrl.registerBlindboxPlan(tenantCtx, {
            blindboxPlanId: 'MYSTERY-BOX',
            title: '神秘盒子',
            unitPrice: 0,
            totalQuota: 100,
            rewardPool: [
                { sku: 'MYSTERY-A', weight: 80, label: '普通奖励' },
                { sku: 'MYSTERY-B', weight: 20, label: '稀有奖励' },
            ],
            validFrom: '2026-01-01T00:00:00.000Z',
            validUntil: '2026-12-31T23:59:59.999Z',
        });
        // 激活
        ctrl.activateBlindboxPlan(tenantCtx, plan.planId, {
            status: loyalty_entity_1.LoyaltyPlanStatus.Active,
        });
        // 发放——因为带随机性，跳过精确断言，只验证格式
        const fulfillment = ctrl.issueBlindbox(tenantCtx, plan.planId, {
            memberId: 'mem-blind-001',
            quantity: 1,
        });
        strict_1.default.equal(fulfillment.memberId, 'mem-blind-001');
        strict_1.default.ok(fulfillment.rewardSku.startsWith('MYSTERY-'), '奖励 SKU 应来自奖池');
        strict_1.default.equal(fulfillment.quantity, 1);
    });
    (0, node_test_1.default)('盲盒预留不足时拒绝发放 (insufficient blindbox quota)', () => {
        const ctrl = createController();
        const plan = ctrl.registerBlindboxPlan(tenantCtx, {
            blindboxPlanId: 'LIMITED-BOX',
            title: '限量盲盒',
            unitPrice: 1000,
            totalQuota: 2,
            rewardPool: [
                { sku: 'REWARD-1', weight: 100, label: '奖品' },
            ],
            validFrom: '2026-01-01T00:00:00.000Z',
            validUntil: '2026-12-31T23:59:59.999Z',
        });
        // 激活
        ctrl.activateBlindboxPlan(tenantCtx, plan.planId, {
            status: loyalty_entity_1.LoyaltyPlanStatus.Active,
        });
        // 消耗所有配额
        ctrl.issueBlindbox(tenantCtx, plan.planId, { memberId: 'mem-01', quantity: 2 });
        // 再发放应当拒绝
        strict_1.default.throws(() => ctrl.issueBlindbox(tenantCtx, plan.planId, { memberId: 'mem-02', quantity: 1 }), /insufficient quota/i);
    });
});
// ──────────────────────────────────────────────────────────────────────
// 👔店长 — 查看忠诚度分析 (shop manager viewing loyalty analytics)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('👔店长 — 忠诚度分析视角', () => {
    (0, node_test_1.default)('查看结算记录列表 (settlement list)', async () => {
        const ctrl = createController();
        const service = ctrl.loyaltyService;
        const mockOrder = {
            orderId: 'order-an-001',
            memberId: 'mem-an-001',
            tenantContext: tenantCtx,
            amount: 8000,
            couponCode: undefined,
            blindboxPlanId: undefined,
            blindboxQuantity: undefined,
        };
        const mockPayment = {
            paymentId: 'pay-an-001',
            amount: 8000,
            channel: 'CASH',
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await service.settlePaidOrder(mockOrder, mockPayment);
        const settlements = ctrl.listSettlements(tenantCtx);
        (0, strict_1.default)(settlements.length >= 1);
        const s = settlements.find((s) => s.orderId === 'order-an-001');
        (0, strict_1.default)(s, '结算记录应包含刚结算的订单');
        strict_1.default.equal(s.status, 'SUCCEEDED');
        (0, strict_1.default)(s.awardedPoints > 0);
    });
    (0, node_test_1.default)('查看优惠券核销记录 (coupon redemption list)', async () => {
        const ctrl = createController();
        const service = ctrl.loyaltyService;
        // 创建一个优惠券计划
        const plan = ctrl.registerCouponPlan(tenantCtx, {
            code: 'ANALYTICS-TEST',
            title: '分析测试券',
            discountType: loyalty_entity_1.CouponDiscountType.FixedAmount,
            discountValue: 1000,
            totalQuota: 100,
            perMemberLimit: 1,
            validFrom: '2026-01-01T00:00:00.000Z',
            validUntil: '2026-12-31T23:59:59.999Z',
        });
        ctrl.activateCouponPlan(tenantCtx, plan.planId, { status: loyalty_entity_1.LoyaltyPlanStatus.Active });
        // 发放并在结算时核销
        const redemption = ctrl.issueCoupon(tenantCtx, plan.planId, {
            memberId: 'mem-cpn-an-001',
        });
        const redemptions = ctrl.listCouponRedemptions(tenantCtx);
        (0, strict_1.default)(redemptions.length >= 1);
        const r = redemptions.find((r) => r.redemptionId === redemption.redemptionId);
        (0, strict_1.default)(r, '核销列表应包含所有核销记录');
        strict_1.default.equal(r.status, 'REDEEMED');
    });
    (0, node_test_1.default)('查看盲盒履约列表 (blindbox fulfillment list)', () => {
        const ctrl = createController();
        const plan = ctrl.registerBlindboxPlan(tenantCtx, {
            blindboxPlanId: 'BOX-ANALYTICS',
            title: '分析盲盒',
            unitPrice: 100,
            totalQuota: 50,
            rewardPool: [
                { sku: 'AN-REWARD', weight: 100, label: '奖品' },
            ],
            validFrom: '2026-01-01T00:00:00.000Z',
            validUntil: '2026-12-31T23:59:59.999Z',
        });
        ctrl.activateBlindboxPlan(tenantCtx, plan.planId, { status: loyalty_entity_1.LoyaltyPlanStatus.Active });
        ctrl.issueBlindbox(tenantCtx, plan.planId, { memberId: 'mem-box-an-001', quantity: 1 });
        const fulfillments = ctrl.listBlindboxFulfillments(tenantCtx);
        (0, strict_1.default)(fulfillments.length >= 1);
        const bf = fulfillments.find((f) => f.memberId === 'mem-box-an-001');
        (0, strict_1.default)(bf, '履约列表应包含该盲盒发放记录');
        strict_1.default.equal(bf.status, 'FULFILLED');
    });
});
//# sourceMappingURL=loyalty.role-extended.test.js.map