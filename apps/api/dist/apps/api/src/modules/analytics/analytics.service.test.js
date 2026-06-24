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
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const loyalty_service_1 = require("../loyalty/loyalty.service");
const member_service_1 = require("../member/member.service");
const analytics_entity_1 = require("./analytics.entity");
const analytics_service_1 = require("./analytics.service");
const tenantContext = {
    tenantId: 'tenant-001',
    brandId: 'brand-001',
    storeId: 'store-001'
};
function createHarness() {
    const memberService = new member_service_1.MemberService();
    const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
    loyaltyService.resetLoyaltyStoresForTests();
    const analyticsService = new analytics_service_1.AnalyticsService(loyaltyService);
    return { memberService, loyaltyService, analyticsService };
}
function ensureMember(harness, memberId = 'm-1', brandId = 'brand-001') {
    if (!harness.memberService.getProfile(memberId)) {
        harness.memberService.register({
            memberId,
            tenantContext: { tenantId: 'tenant-001', brandId, storeId: 'store-001' },
            nickname: memberId
        });
    }
}
function buildLytOrder(orderId, brandId = 'brand-001') {
    return {
        snapshotId: `snap-${orderId}`,
        tenantContext: { tenantId: 'tenant-001', brandId, storeId: 'store-001' },
        externalOrderId: orderId,
        orderNo: orderId,
        memberId: 'm-1',
        amount: 100,
        discountAmount: 0,
        payableAmount: 100,
        currency: 'CNY',
        status: 'PAID',
        updatedAtFromSource: new Date().toISOString()
    };
}
function buildLytPayment(orderId, paymentId, brandId = 'brand-001') {
    return {
        snapshotId: `snap-pay-${paymentId}`,
        tenantContext: { tenantId: 'tenant-001', brandId, storeId: 'store-001' },
        externalPaymentId: paymentId,
        externalOrderId: orderId,
        paymentChannel: 'WECHAT_PAY',
        paymentStatus: 'SUCCEEDED',
        amount: 100,
        currency: 'CNY',
        paidAt: new Date().toISOString(),
        updatedAtFromSource: new Date().toISOString()
    };
}
(0, node_test_1.describe)('AnalyticsService', () => {
    (0, node_test_1.default)('getOperationSnapshot returns zeroed snapshot when loyalty is empty', () => {
        const { analyticsService } = createHarness();
        const snapshot = analyticsService.getOperationSnapshot(tenantContext);
        strict_1.default.equal(snapshot.tenantId, 'tenant-001');
        strict_1.default.equal(snapshot.scope, analytics_entity_1.AnalyticsScope.Tenant);
        strict_1.default.equal(snapshot.groups.length, 2);
        strict_1.default.equal(snapshot.groups[0]?.groupKey, 'orders');
        strict_1.default.equal(snapshot.groups[1]?.groupKey, 'loyalty');
        const settlementCount = snapshot.groups[0]?.metrics.find((m) => m.key === 'settlementCount');
        strict_1.default.equal(settlementCount?.value, 0);
        strict_1.default.equal(settlementCount?.unit, '笔');
    });
    (0, node_test_1.default)('getOperationSnapshot aggregates settlePaidOrder counts', async () => {
        const harness = createHarness();
        const { analyticsService, loyaltyService } = harness;
        ensureMember(harness);
        await loyaltyService.settlePaidOrderFromSnapshots(buildLytOrder('order-001'), buildLytPayment('order-001', 'pay-001'));
        await loyaltyService.settlePaidOrderFromSnapshots(buildLytOrder('order-002'), buildLytPayment('order-002', 'pay-002'));
        await loyaltyService.settleFailedOrderFromSnapshots(buildLytOrder('order-003'), buildLytPayment('order-003', 'pay-003'));
        const snapshot = analyticsService.getOperationSnapshot(tenantContext);
        const settlementCount = snapshot.groups[0]?.metrics.find((m) => m.key === 'settlementCount');
        strict_1.default.equal(settlementCount?.value, 3);
        const successRate = snapshot.groups[0]?.metrics.find((m) => m.key === 'settlementSuccessRate');
        strict_1.default.equal(successRate?.value, 66.7);
        const pointsIn = snapshot.groups[1]?.metrics.find((m) => m.key === 'pointsIn');
        strict_1.default.ok((pointsIn?.value ?? 0) > 0);
    });
    (0, node_test_1.default)('getOperationSnapshot filters by brandId when supplied', async () => {
        const harness = createHarness();
        const { analyticsService, loyaltyService } = harness;
        ensureMember(harness, 'm-1', 'brand-001');
        ensureMember(harness, 'm-1', 'brand-002');
        await loyaltyService.settlePaidOrderFromSnapshots(buildLytOrder('order-001', 'brand-001'), buildLytPayment('order-001', 'pay-001'));
        await loyaltyService.settlePaidOrderFromSnapshots(buildLytOrder('order-002', 'brand-002'), buildLytPayment('order-002', 'pay-002'));
        const tenant = analyticsService.getOperationSnapshot(tenantContext, { scope: analytics_entity_1.AnalyticsScope.Tenant });
        strict_1.default.equal(tenant.totals.find((m) => m.key === 'totalSettlements')?.value, 2);
        const brand = analyticsService.getOperationSnapshot(tenantContext, {
            scope: analytics_entity_1.AnalyticsScope.Brand,
            brandId: 'brand-002'
        });
        strict_1.default.equal(brand.totals.find((m) => m.key === 'totalSettlements')?.value, 1);
    });
    (0, node_test_1.default)('getDiagnostics flags low payment success rate', async () => {
        const harness = createHarness();
        const { analyticsService, loyaltyService } = harness;
        ensureMember(harness);
        for (let i = 0; i < 5; i += 1) {
            await loyaltyService.settlePaidOrderFromSnapshots(buildLytOrder(`o-ok-${i}`), buildLytPayment(`o-ok-${i}`, `p-ok-${i}`));
        }
        for (let i = 0; i < 5; i += 1) {
            await loyaltyService.settleFailedOrderFromSnapshots(buildLytOrder(`o-fail-${i}`), buildLytPayment(`o-fail-${i}`, `p-fail-${i}`));
        }
        const diagnostics = analyticsService.getDiagnostics(tenantContext);
        const paymentDiagnostic = diagnostics.find((d) => d.ruleId.startsWith('payment-success-rate-low'));
        strict_1.default.ok(paymentDiagnostic);
        strict_1.default.equal(paymentDiagnostic?.severity, analytics_entity_1.DiagnosticSeverity.Critical);
        strict_1.default.equal(paymentDiagnostic?.category, analytics_entity_1.DiagnosticCategory.PaymentHealth);
        strict_1.default.equal(paymentDiagnostic?.recommendations[0]?.actionCode, 'inspect-payment-gateway');
    });
    (0, node_test_1.default)('getDiagnostics flags no-settlement-activity for empty tenants', () => {
        const { analyticsService } = createHarness();
        const diagnostics = analyticsService.getDiagnostics(tenantContext);
        const silence = diagnostics.find((d) => d.ruleId.startsWith('no-settlement-activity'));
        strict_1.default.ok(silence);
        strict_1.default.equal(silence?.severity, analytics_entity_1.DiagnosticSeverity.Warning);
        strict_1.default.equal(silence?.recommendations[0]?.suggestedCampaignKind, 'RE_ENGAGEMENT');
    });
    (0, node_test_1.default)('getDiagnostics flags blindbox shortfall when coupons move but blindboxes do not', () => {
        const { analyticsService, loyaltyService } = createHarness();
        const plan = loyaltyService.registerCouponPlan({
            tenantContext,
            code: 'CAMP',
            title: 'test coupon',
            discountType: 'FIXED_AMOUNT',
            discountValue: 10,
            totalQuota: 100,
            perMemberLimit: 5,
            validFrom: new Date(Date.now() - 1000).toISOString(),
            validUntil: new Date(Date.now() + 1000 * 60 * 60).toISOString()
        });
        loyaltyService.updateCouponPlanStatus(plan.planId, 'ACTIVE', tenantContext.tenantId);
        for (let i = 0; i < 6; i += 1) {
            loyaltyService.issueCouponFromPlan({
                tenantContext,
                memberId: `m-${i}`,
                planId: plan.planId
            });
        }
        const diagnostics = analyticsService.getDiagnostics(tenantContext);
        const shortfall = diagnostics.find((d) => d.ruleId.startsWith('blindbox-redemption-shortfall'));
        strict_1.default.ok(shortfall);
        strict_1.default.equal(shortfall?.recommendations[0]?.suggestedCampaignKind, 'BLINDBOX_PROMO');
    });
    (0, node_test_1.default)('getDiagnostics flags coupon quota exhaustion when a plan is below 10%', () => {
        const { analyticsService, loyaltyService } = createHarness();
        const plan = loyaltyService.registerCouponPlan({
            tenantContext,
            code: 'TIGHT',
            title: 'tight coupon',
            discountType: 'FIXED_AMOUNT',
            discountValue: 10,
            totalQuota: 10,
            perMemberLimit: 10,
            validFrom: new Date(Date.now() - 1000).toISOString(),
            validUntil: new Date(Date.now() + 1000 * 60 * 60).toISOString()
        });
        loyaltyService.updateCouponPlanStatus(plan.planId, 'ACTIVE', tenantContext.tenantId);
        for (let i = 0; i < 10; i += 1) {
            loyaltyService.issueCouponFromPlan({
                tenantContext,
                memberId: `m-${i}`,
                planId: plan.planId
            });
        }
        const diagnostics = analyticsService.getDiagnostics(tenantContext);
        const quota = diagnostics.find((d) => d.ruleId.startsWith('coupon-quota-near-exhaustion'));
        strict_1.default.ok(quota);
    });
    (0, node_test_1.default)('getRecommendations merges and sorts diagnostics by priority', async () => {
        const harness = createHarness();
        const { analyticsService, loyaltyService } = harness;
        ensureMember(harness);
        await loyaltyService.settleFailedOrderFromSnapshots(buildLytOrder('o-fail-0'), buildLytPayment('o-fail-0', 'p-fail-0'));
        const recommendations = analyticsService.getRecommendations(tenantContext);
        strict_1.default.ok(recommendations.length >= 2);
        for (let i = 1; i < recommendations.length; i += 1) {
            strict_1.default.ok((recommendations[i - 1]?.priority ?? 0) >= (recommendations[i]?.priority ?? 0), `Recommendations not sorted: ${i - 1} < ${i}`);
        }
    });
    (0, node_test_1.default)('getDiagnostics returns no payment failure diagnostic when success rate is 100%', async () => {
        const harness = createHarness();
        const { analyticsService, loyaltyService } = harness;
        ensureMember(harness);
        await loyaltyService.settlePaidOrderFromSnapshots(buildLytOrder('order-001'), buildLytPayment('order-001', 'pay-001'));
        await loyaltyService.settlePaidOrderFromSnapshots(buildLytOrder('order-002'), buildLytPayment('order-002', 'pay-002'));
        const diagnostics = analyticsService.getDiagnostics(tenantContext);
        const paymentDiagnostic = diagnostics.find((d) => d.ruleId.startsWith('payment-success-rate-low'));
        strict_1.default.equal(paymentDiagnostic, undefined);
        const silence = diagnostics.find((d) => d.ruleId.startsWith('no-settlement-activity'));
        strict_1.default.equal(silence, undefined);
    });
    (0, node_test_1.default)('getOperationSnapshot no-ops gracefully when LoyaltyService is not injected', () => {
        const analyticsService = new analytics_service_1.AnalyticsService(undefined);
        const snapshot = analyticsService.getOperationSnapshot(tenantContext);
        strict_1.default.equal(snapshot.totals.find((m) => m.key === 'totalSettlements')?.value, 0);
    });
});
//# sourceMappingURL=analytics.service.test.js.map