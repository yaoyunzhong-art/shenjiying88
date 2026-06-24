"use strict";
/**
 * E2E: Analytics 诊断 / 快照 / 推荐 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext 中间件 → TestController → AnalyticsService → LoyaltyService (可选)
 *
 * 验证:
 *   - OperationSnapshot 聚合订单 / 积分 / 券 / 盲盒指标
 *   - Diagnostics 规则触发 (no-settlement / payment-success-low / quota-near-exhaustion / blindbox-shortfall)
 *   - Recommendations 按 priority 降序
 *   - 多 scope (TENANT / BRAND / STORE) 输入派生
 *   - 空数据时给出 fallback (settlement=0 → no-settlement 触发)
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
const cashier_entity_1 = require("../cashier/cashier.entity");
const member_service_1 = require("../member/member.service");
const loyalty_entity_1 = require("../loyalty/loyalty.entity");
const loyalty_service_1 = require("../loyalty/loyalty.service");
const analytics_service_1 = require("./analytics.service");
function attachTenantContext(req, _res, next) {
    const ctx = req;
    ctx.tenantContext = {
        tenantId: req.header('x-tenant-id') ?? 'tenant-001',
        brandId: req.header('x-brand-id') ?? 'brand-001',
        storeId: req.header('x-store-id') ?? 'store-001',
        marketCode: req.header('x-market-code') ?? 'cn-mainland'
    };
    next();
}
let TestAnalyticsController = class TestAnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    getOperationSnapshot(req, body) {
        const tenantContext = req.tenantContext;
        return this.analyticsService.getOperationSnapshot(tenantContext, {
            scope: body.scope,
            brandId: body.brandId,
            storeId: body.storeId
        });
    }
    getDiagnostics(req, body) {
        const tenantContext = req.tenantContext;
        return this.analyticsService.getDiagnostics(tenantContext, {
            scope: body.scope,
            brandId: body.brandId,
            storeId: body.storeId
        });
    }
    getRecommendations(req, body) {
        const tenantContext = req.tenantContext;
        return this.analyticsService.getRecommendations(tenantContext, {
            scope: body.scope,
            brandId: body.brandId,
            storeId: body.storeId
        });
    }
};
__decorate([
    (0, common_1.Get)('snapshot'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestAnalyticsController.prototype, "getOperationSnapshot", null);
__decorate([
    (0, common_1.Get)('diagnostics'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestAnalyticsController.prototype, "getDiagnostics", null);
__decorate([
    (0, common_1.Get)('recommendations'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestAnalyticsController.prototype, "getRecommendations", null);
TestAnalyticsController = __decorate([
    (0, common_1.Controller)('analytics'),
    __param(0, (0, common_1.Inject)(analytics_service_1.AnalyticsService)),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], TestAnalyticsController);
async function buildApp() {
    (0, member_service_1.resetMemberServiceTestState)();
    const memberService = new member_service_1.MemberService();
    const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
    const analyticsService = new analytics_service_1.AnalyticsService(loyaltyService);
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestAnalyticsController],
        providers: [
            { provide: member_service_1.MemberService, useValue: memberService },
            { provide: loyalty_service_1.LoyaltyService, useValue: loyaltyService },
            { provide: analytics_service_1.AnalyticsService, useValue: analyticsService }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, memberService, loyaltyService, analyticsService };
}
const TENANT_A = {
    'x-tenant-id': 'tenant-A',
    'x-brand-id': 'brand-A',
    'x-store-id': 'store-A'
};
function tenantContextA() {
    return { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' };
}
function makeOrder(orderId, memberId, amount) {
    const now = new Date().toISOString();
    return {
        orderId,
        tenantContext: tenantContextA(),
        memberId,
        items: [{ skuId: 'sku-1', title: 'demo', quantity: 1, price: amount }],
        currency: 'CNY',
        totalAmount: amount,
        status: cashier_entity_1.CashierOrderStatus.Paid,
        createdAt: now,
        updatedAt: now,
        paidAt: now,
        source: 'memory'
    };
}
function makePayment(paymentId, orderId, amount, success) {
    const now = new Date().toISOString();
    return {
        paymentId,
        orderId,
        channel: 'wechat',
        amount,
        status: success ? cashier_entity_1.CashierPaymentStatus.Succeeded : cashier_entity_1.CashierPaymentStatus.Failed,
        createdAt: now,
        updatedAt: now,
        completedAt: now,
        failureReason: success ? undefined : 'gateway-declined'
    };
}
(0, node_test_1.default)('e2e: snapshot returns empty-but-valid groups for new tenant', async () => {
    const { app, loyaltyService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/snapshot')
            .set(TENANT_A)
            .send({ scope: 'TENANT' });
        strict_1.default.equal(res.statusCode, 200);
        const snap = res.body.data;
        strict_1.default.equal(snap.tenantId, 'tenant-A');
        strict_1.default.equal(snap.scope, 'TENANT');
        strict_1.default.equal(snap.groups.length, 2);
        strict_1.default.equal(snap.groups[0].groupKey, 'orders');
        strict_1.default.equal(snap.groups[1].groupKey, 'loyalty');
        const settlementMetric = snap.groups[0].metrics.find((m) => m.key === 'settlementCount');
        strict_1.default.equal(settlementMetric.value, 0);
        strict_1.default.equal(settlementMetric.unit, '笔');
        const totals = snap.totals;
        strict_1.default.ok(Array.isArray(totals));
        strict_1.default.equal(totals.length, 3);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: snapshot reflects loyalty aggregates (settlements, coupons, points)', async () => {
    const { app, loyaltyService, memberService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    memberService.register({
        memberId: 'm-1',
        tenantContext: tenantContextA(),
        nickname: 'Alice'
    });
    // 2 successful settlements + 1 failed (success rate ~ 66% < 80%)
    await loyaltyService.settlePaidOrder(makeOrder('o-1', 'm-1', 100), makePayment('p-1', 'o-1', 100, true));
    await loyaltyService.settlePaidOrder(makeOrder('o-2', 'm-1', 200), makePayment('p-2', 'o-2', 200, true));
    await loyaltyService.settleFailedOrder(makeOrder('o-3', 'm-1', 50), makePayment('p-3', 'o-3', 50, false));
    // Issue 6 coupons via the plan
    const plan = loyaltyService.registerCouponPlan({
        tenantContext: tenantContextA(),
        code: 'SNAP1',
        title: 'snapshot coupon',
        discountType: loyalty_entity_1.CouponDiscountType.FixedAmount,
        discountValue: 5,
        totalQuota: 100,
        perMemberLimit: 10,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z'
    });
    loyaltyService.updateCouponPlanStatus(plan.planId, loyalty_entity_1.LoyaltyPlanStatus.Active, 'tenant-A');
    for (let i = 0; i < 6; i++) {
        loyaltyService.issueCouponFromPlan({
            tenantContext: tenantContextA(),
            memberId: 'm-1',
            planId: plan.planId,
            source: 'snapshot-test'
        });
    }
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/snapshot')
            .set(TENANT_A)
            .send({ scope: 'TENANT' });
        const snap = res.body.data;
        const orderGroup = snap.groups.find((g) => g.groupKey === 'orders');
        const loyaltyGroup = snap.groups.find((g) => g.groupKey === 'loyalty');
        const settlementMetric = orderGroup.metrics.find((m) => m.key === 'settlementCount');
        strict_1.default.equal(settlementMetric.value, 3);
        const couponMetric = orderGroup.metrics.find((m) => m.key === 'couponRedemptionCount');
        strict_1.default.equal(couponMetric.value, 6);
        const pointsInMetric = loyaltyGroup.metrics.find((m) => m.key === 'pointsIn');
        strict_1.default.equal(pointsInMetric.value, 300); // 100 + 200 from settlements
        const pointsNetMetric = loyaltyGroup.metrics.find((m) => m.key === 'pointsNet');
        strict_1.default.equal(pointsNetMetric.trend, 'UP');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: diagnostics flag no-settlement activity for new tenant', async () => {
    const { app, loyaltyService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/diagnostics')
            .set(TENANT_A)
            .send({ scope: 'TENANT' });
        strict_1.default.equal(res.statusCode, 200);
        const diags = res.body.data;
        strict_1.default.ok(Array.isArray(diags));
        const noSettlement = diags.find((d) => d.ruleId === 'no-settlement-activity');
        strict_1.default.ok(noSettlement, 'expected no-settlement-activity diagnostic');
        strict_1.default.equal(noSettlement.severity, 'WARNING');
        strict_1.default.equal(noSettlement.category, 'MEMBER_ACTIVITY');
        strict_1.default.equal(noSettlement.evidence.settlementCount, 0);
        strict_1.default.ok(Array.isArray(noSettlement.recommendations));
        strict_1.default.ok(noSettlement.recommendations.length >= 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: diagnostics flag low payment success rate', async () => {
    const { app, loyaltyService, memberService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    memberService.register({
        memberId: 'm-1',
        tenantContext: tenantContextA(),
        nickname: 'Alice'
    });
    // 5 settlements: 2 success, 3 failed → 40% success rate (low)
    await loyaltyService.settlePaidOrder(makeOrder('o-1', 'm-1', 50), makePayment('p-1', 'o-1', 50, true));
    await loyaltyService.settlePaidOrder(makeOrder('o-2', 'm-1', 60), makePayment('p-2', 'o-2', 60, true));
    await loyaltyService.settleFailedOrder(makeOrder('o-3', 'm-1', 70), makePayment('p-3', 'o-3', 70, false));
    await loyaltyService.settleFailedOrder(makeOrder('o-4', 'm-1', 80), makePayment('p-4', 'o-4', 80, false));
    await loyaltyService.settleFailedOrder(makeOrder('o-5', 'm-1', 90), makePayment('p-5', 'o-5', 90, false));
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/diagnostics')
            .set(TENANT_A)
            .send({ scope: 'TENANT' });
        const diags = res.body.data;
        const lowPayment = diags.find((d) => d.ruleId === 'payment-success-rate-low');
        strict_1.default.ok(lowPayment, 'expected payment-success-rate-low diagnostic');
        strict_1.default.equal(lowPayment.severity, 'CRITICAL');
        strict_1.default.equal(lowPayment.category, 'PAYMENT_HEALTH');
        strict_1.default.equal(lowPayment.evidence.settlementCount, 5);
        strict_1.default.equal(lowPayment.evidence.successCount, 2);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: diagnostics flag coupon plan near quota exhaustion', async () => {
    const { app, loyaltyService, memberService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    memberService.register({
        memberId: 'm-1',
        tenantContext: tenantContextA(),
        nickname: 'Alice'
    });
    // Create a coupon plan with quota 100, drain 95 (95% used) → < 10% remaining
    const plan = loyaltyService.registerCouponPlan({
        tenantContext: tenantContextA(),
        code: 'DRAIN',
        title: 'drained coupon',
        discountType: loyalty_entity_1.CouponDiscountType.FixedAmount,
        discountValue: 5,
        totalQuota: 100,
        perMemberLimit: 100,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z'
    });
    loyaltyService.updateCouponPlanStatus(plan.planId, loyalty_entity_1.LoyaltyPlanStatus.Active, 'tenant-A');
    for (let i = 0; i < 95; i++) {
        loyaltyService.issueCouponFromPlan({
            tenantContext: tenantContextA(),
            memberId: 'm-1',
            planId: plan.planId,
            source: 'drain-test'
        });
    }
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/diagnostics')
            .set(TENANT_A)
            .send({ scope: 'TENANT' });
        const diags = res.body.data;
        const exhausted = diags.find((d) => d.ruleId === 'coupon-quota-near-exhaustion');
        strict_1.default.ok(exhausted, 'expected coupon-quota-near-exhaustion diagnostic');
        strict_1.default.equal(exhausted.severity, 'WARNING');
        strict_1.default.equal(exhausted.category, 'COUPON_PERFORMANCE');
        strict_1.default.ok(Array.isArray(exhausted.evidence.exhaustedPlanIds));
        strict_1.default.ok(exhausted.evidence.exhaustedPlanIds.includes(plan.planId));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: diagnostics flag blindbox redemption shortfall when coupons move but blindboxes do not', async () => {
    const { app, loyaltyService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    // Issue 6+ coupons without any blindbox fulfillment → triggers blindbox-redemption-shortfall
    const plan = loyaltyService.registerCouponPlan({
        tenantContext: tenantContextA(),
        code: 'BB-SHORT',
        title: 'shortfall coupon',
        discountType: loyalty_entity_1.CouponDiscountType.FixedAmount,
        discountValue: 5,
        totalQuota: 100,
        perMemberLimit: 10,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z'
    });
    loyaltyService.updateCouponPlanStatus(plan.planId, loyalty_entity_1.LoyaltyPlanStatus.Active, 'tenant-A');
    for (let i = 0; i < 7; i++) {
        loyaltyService.issueCouponFromPlan({
            tenantContext: tenantContextA(),
            memberId: `m-${i}`,
            planId: plan.planId,
            source: 'shortfall-test'
        });
    }
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/diagnostics')
            .set(TENANT_A)
            .send({ scope: 'TENANT' });
        const diags = res.body.data;
        const shortfall = diags.find((d) => d.ruleId === 'blindbox-redemption-shortfall');
        strict_1.default.ok(shortfall, 'expected blindbox-redemption-shortfall diagnostic');
        strict_1.default.equal(shortfall.severity, 'WARNING');
        strict_1.default.equal(shortfall.category, 'BLINDBOX_ENGAGEMENT');
        strict_1.default.equal(shortfall.evidence.couponRedemptionCount, 7);
        strict_1.default.equal(shortfall.evidence.blindboxFulfillmentCount, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: recommendations are sorted by priority desc', async () => {
    const { app, loyaltyService, memberService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    memberService.register({
        memberId: 'm-1',
        tenantContext: tenantContextA(),
        nickname: 'Alice'
    });
    // Trigger at least 2 diagnostics: payment-success-rate-low + member-activity-thinning
    // (1 failed order → success rate 0% → CRITICAL; settlementCount=1<3 → INFO)
    await loyaltyService.settleFailedOrder(makeOrder('o-1', 'm-1', 50), makePayment('p-1', 'o-1', 50, false));
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/recommendations')
            .set(TENANT_A)
            .send({ scope: 'TENANT' });
        strict_1.default.equal(res.statusCode, 200);
        const recs = res.body.data;
        strict_1.default.ok(Array.isArray(recs));
        strict_1.default.ok(recs.length >= 2);
        // Verify descending priority
        for (let i = 0; i < recs.length - 1; i++) {
            strict_1.default.ok(recs[i].priority >= recs[i + 1].priority, `rec[${i}].priority (${recs[i].priority}) should be >= rec[${i + 1}].priority (${recs[i + 1].priority})`);
        }
        // Highest priority should be CRITICAL (100 = inspect-payment-gateway)
        const top = recs[0];
        strict_1.default.ok(top.priority >= 80);
        strict_1.default.ok(top.actionCode);
        strict_1.default.ok(top.description);
        strict_1.default.equal(top.actionCode, 'inspect-payment-gateway');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: diagnostics are tenant-scoped', async () => {
    const { app, loyaltyService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    const TENANT_B = {
        'x-tenant-id': 'tenant-B',
        'x-brand-id': 'brand-B',
        'x-store-id': 'store-B'
    };
    try {
        const resA = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/diagnostics')
            .set(TENANT_A)
            .send({ scope: 'TENANT' });
        const resB = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/diagnostics')
            .set(TENANT_B)
            .send({ scope: 'TENANT' });
        const diagsA = resA.body.data;
        const diagsB = resB.body.data;
        for (const d of diagsA) {
            strict_1.default.equal(d.tenantContext.tenantId, 'tenant-A');
        }
        for (const d of diagsB) {
            strict_1.default.equal(d.tenantContext.tenantId, 'tenant-B');
        }
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: snapshot scope STORE includes storeId; TENANT omits it', async () => {
    const { app, loyaltyService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    try {
        const tenantSnap = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/snapshot')
            .set(TENANT_A)
            .send({ scope: 'TENANT' });
        strict_1.default.equal(tenantSnap.body.data.scope, 'TENANT');
        strict_1.default.equal(tenantSnap.body.data.storeId, undefined);
        const storeSnap = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/snapshot')
            .set(TENANT_A)
            .send({ scope: 'STORE', storeId: 'store-X' });
        strict_1.default.equal(storeSnap.body.data.scope, 'STORE');
        strict_1.default.equal(storeSnap.body.data.storeId, 'store-X');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: snapshot BRAND scope includes brandId only', async () => {
    const { app, loyaltyService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/snapshot')
            .set(TENANT_A)
            .send({ scope: 'BRAND', brandId: 'brand-A' });
        strict_1.default.equal(res.body.data.scope, 'BRAND');
        strict_1.default.equal(res.body.data.brandId, 'brand-A');
        strict_1.default.equal(res.body.data.storeId, undefined);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: recommendations return empty array when no diagnostics triggered', async () => {
    const { app, loyaltyService, memberService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    memberService.register({
        memberId: 'm-1',
        tenantContext: tenantContextA(),
        nickname: 'Alice'
    });
    // 10 successful settlements, success rate 100% → no diagnostics
    for (let i = 0; i < 10; i++) {
        await loyaltyService.settlePaidOrder(makeOrder(`o-${i}`, 'm-1', 100), makePayment(`p-${i}`, `o-${i}`, 100, true));
    }
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/recommendations')
            .set(TENANT_A)
            .send({ scope: 'TENANT' });
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.ok(Array.isArray(res.body.data));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: diagnostics severity distribution shows correct counts', async () => {
    const { app, loyaltyService, memberService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    memberService.register({
        memberId: 'm-1',
        tenantContext: tenantContextA(),
        nickname: 'Alice'
    });
    // Critical: low success rate (1 success, 3 failed out of 4 → 25%)
    for (let i = 0; i < 1; i++) {
        await loyaltyService.settlePaidOrder(makeOrder(`o-${i}`, 'm-1', 50), makePayment(`p-${i}`, `o-${i}`, 50, true));
    }
    for (let i = 1; i < 4; i++) {
        await loyaltyService.settleFailedOrder(makeOrder(`o-${i}`, 'm-1', 50), makePayment(`p-${i}`, `o-${i}`, 50, false));
    }
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/diagnostics')
            .set(TENANT_A)
            .send({ scope: 'TENANT' });
        const diags = res.body.data;
        strict_1.default.ok(diags.length >= 1);
        const critical = diags.filter((d) => d.severity === 'CRITICAL').length;
        const warning = diags.filter((d) => d.severity === 'WARNING').length;
        strict_1.default.ok(critical + warning >= 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: snapshot metrics include trend direction', async () => {
    const { app, loyaltyService, memberService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    memberService.register({
        memberId: 'm-1',
        tenantContext: tenantContextA(),
        nickname: 'Alice'
    });
    await loyaltyService.settlePaidOrder(makeOrder('o-1', 'm-1', 100), makePayment('p-1', 'o-1', 100, true));
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/snapshot')
            .set(TENANT_A)
            .send({ scope: 'TENANT' });
        const loyaltyGroup = res.body.data.groups.find((g) => g.groupKey === 'loyalty');
        const pointsNetMetric = loyaltyGroup.metrics.find((m) => m.key === 'pointsNet');
        strict_1.default.equal(pointsNetMetric.trend, 'UP');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: snapshot covers multiple brandIds in BRAND scope', async () => {
    const { app, loyaltyService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    try {
        const brandA = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/snapshot')
            .set(TENANT_A)
            .send({ scope: 'BRAND', brandId: 'brand-A' });
        const brandB = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/snapshot')
            .set(TENANT_A)
            .send({ scope: 'BRAND', brandId: 'brand-B' });
        strict_1.default.equal(brandA.body.data.brandId, 'brand-A');
        strict_1.default.equal(brandB.body.data.brandId, 'brand-B');
        strict_1.default.notEqual(brandA.body.data.brandId, brandB.body.data.brandId);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: diagnostics includes payment-success-rate-low diagnostic with recommendations', async () => {
    const { app, loyaltyService, memberService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    memberService.register({
        memberId: 'm-1',
        tenantContext: tenantContextA(),
        nickname: 'Alice'
    });
    // 2 success, 3 failed → 40% success rate
    for (let i = 0; i < 2; i++) {
        await loyaltyService.settlePaidOrder(makeOrder(`o-${i}`, 'm-1', 50), makePayment(`p-${i}`, `o-${i}`, 50, true));
    }
    for (let i = 2; i < 5; i++) {
        await loyaltyService.settleFailedOrder(makeOrder(`o-${i}`, 'm-1', 50), makePayment(`p-${i}`, `o-${i}`, 50, false));
    }
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/diagnostics')
            .set(TENANT_A)
            .send({ scope: 'TENANT' });
        const diags = res.body.data;
        const lowPayment = diags.find((d) => d.ruleId === 'payment-success-rate-low');
        strict_1.default.ok(lowPayment);
        strict_1.default.equal(lowPayment.recommendations.length >= 1, true);
        strict_1.default.ok(lowPayment.recommendations[0].actionCode);
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=analytics.e2e.test.js.map