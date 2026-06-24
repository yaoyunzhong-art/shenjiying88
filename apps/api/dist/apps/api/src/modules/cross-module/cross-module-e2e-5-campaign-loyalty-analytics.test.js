"use strict";
/**
 * E2E: Cross-module #5 — Campaign → Loyalty → Analytics 闭环
 *
 * 链路:
 *   CampaignService(register + evaluate)
 *     → LoyaltyService(settlePaidOrder → coupon redemption)
 *       → AnalyticsService(snapshot + diagnostics)
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
const analytics_service_1 = require("../analytics/analytics.service");
const campaign_service_1 = require("../campaign/campaign.service");
const loyalty_service_1 = require("../loyalty/loyalty.service");
const member_service_1 = require("../member/member.service");
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
let TestCampaignController = class TestCampaignController {
    campaignService;
    constructor(campaignService) {
        this.campaignService = campaignService;
    }
    register(req, body) {
        const tc = req.tenantContext;
        return this.campaignService.registerCampaign({
            tenantContext: tc,
            code: body.code,
            title: body.title,
            description: body.description,
            triggerEvent: body.triggerEvent,
            conditions: body.conditions ?? [],
            actions: body.actions,
            priority: body.priority
        });
    }
    updateStatus(req, planId, body) {
        const tc = req.tenantContext;
        return this.campaignService.updateCampaignStatus(planId, body.status, tc.tenantId);
    }
    evaluate(body) {
        return this.campaignService.evaluateTriggers({
            eventName: body.eventName,
            tenantContext: body.tenantContext,
            memberId: body.memberId,
            orderId: body.orderId,
            paymentId: body.paymentId,
            orderAmount: body.orderAmount,
            brandId: body.brandId,
            storeId: body.storeId,
            memberLevel: body.memberLevel
        });
    }
};
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestCampaignController.prototype, "register", null);
__decorate([
    (0, common_1.Patch)(':planId/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('planId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TestCampaignController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)('evaluate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestCampaignController.prototype, "evaluate", null);
TestCampaignController = __decorate([
    (0, common_1.Controller)('campaigns'),
    __param(0, (0, common_1.Inject)(campaign_service_1.CampaignService)),
    __metadata("design:paramtypes", [campaign_service_1.CampaignService])
], TestCampaignController);
let TestLoyaltyController = class TestLoyaltyController {
    loyaltyService;
    constructor(loyaltyService) {
        this.loyaltyService = loyaltyService;
    }
    listPointsLedger(req) {
        const tc = req.tenantContext;
        return this.loyaltyService.listPointsLedger(tc.tenantId);
    }
    listCouponRedemptions(req) {
        const tc = req.tenantContext;
        return this.loyaltyService.listCouponRedemptions(tc.tenantId);
    }
};
__decorate([
    (0, common_1.Get)('points-ledger'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestLoyaltyController.prototype, "listPointsLedger", null);
__decorate([
    (0, common_1.Get)('coupon-redemptions'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestLoyaltyController.prototype, "listCouponRedemptions", null);
TestLoyaltyController = __decorate([
    (0, common_1.Controller)('loyalty'),
    __param(0, (0, common_1.Inject)(loyalty_service_1.LoyaltyService)),
    __metadata("design:paramtypes", [loyalty_service_1.LoyaltyService])
], TestLoyaltyController);
let TestAnalyticsController = class TestAnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    snapshot(req, query) {
        const tc = req.tenantContext;
        return this.analyticsService.getOperationSnapshot(tc, { scope: query.scope });
    }
    diagnostics(req, query) {
        const tc = req.tenantContext;
        return this.analyticsService.getDiagnostics(tc, { scope: query.scope });
    }
};
__decorate([
    (0, common_1.Get)('snapshot'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestAnalyticsController.prototype, "snapshot", null);
__decorate([
    (0, common_1.Get)('diagnostics'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestAnalyticsController.prototype, "diagnostics", null);
TestAnalyticsController = __decorate([
    (0, common_1.Controller)('analytics'),
    __param(0, (0, common_1.Inject)(analytics_service_1.AnalyticsService)),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], TestAnalyticsController);
const TENANT_A = {
    'x-tenant-id': 'tenant-A',
    'x-brand-id': 'brand-A',
    'x-store-id': 'store-A'
};
const TENANT_B = {
    'x-tenant-id': 'tenant-B',
    'x-brand-id': 'brand-B',
    'x-store-id': 'store-B'
};
function tenantContextA() {
    return { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' };
}
function makeOrder(orderId, memberId, amount) {
    return {
        orderId,
        memberId,
        tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
        storeId: 'store-A',
        brandId: 'brand-A',
        totalAmount: amount,
        items: [],
        createdAt: '2026-06-22T00:00:00.000Z'
    };
}
function makePayment(paymentId, orderId, amount, success) {
    return {
        paymentId,
        orderId,
        tenantId: 'tenant-A',
        memberId: 'm-1',
        storeId: 'store-A',
        brandId: 'brand-A',
        amount,
        success,
        method: 'WECHAT_PAY',
        createdAt: '2026-06-22T00:00:00.000Z'
    };
}
async function buildApp() {
    (0, member_service_1.resetMemberServiceTestState)();
    const memberService = new member_service_1.MemberService();
    const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
    const campaignService = new campaign_service_1.CampaignService(memberService, loyaltyService);
    const analyticsService = new analytics_service_1.AnalyticsService(loyaltyService);
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestCampaignController, TestLoyaltyController, TestAnalyticsController],
        providers: [
            { provide: member_service_1.MemberService, useValue: memberService },
            { provide: loyalty_service_1.LoyaltyService, useValue: loyaltyService },
            { provide: campaign_service_1.CampaignService, useValue: campaignService },
            { provide: analytics_service_1.AnalyticsService, useValue: analyticsService }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, memberService, loyaltyService, campaignService, analyticsService };
}
(0, node_test_1.default)('e2e xm5: campaign AWARD_POINTS → loyalty settle → analytics snapshot reflects points', async () => {
    const { app, memberService, campaignService, loyaltyService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    loyaltyService.resetLoyaltyStoresForTests();
    try {
        memberService.register({ memberId: 'm-1', tenantContext: tenantContextA(), nickname: 'Alice' });
        const plan = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'XM5-POINTS',
            title: 'award points on payment',
            triggerEvent: 'payment.success',
            actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 50, pointsReason: 'campaign-bonus' } }]
        });
        strict_1.default.equal(plan.statusCode, 201);
        const planId = plan.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/campaigns/${planId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        const evalRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .set(TENANT_A)
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContextA(),
            memberId: 'm-1',
            orderId: 'o-1',
            paymentId: 'p-1'
        });
        strict_1.default.equal(evalRes.body.data.dispatchedActions, 1);
        await loyaltyService.settlePaidOrder(makeOrder('o-1', 'm-1', 100), makePayment('p-1', 'o-1', 100, true));
        const snapshot = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/snapshot?scope=TENANT')
            .set(TENANT_A);
        const loyaltyGroup = snapshot.body.data.groups.find((g) => g.groupKey === 'loyalty');
        strict_1.default.ok(loyaltyGroup);
        const pointsInMetric = loyaltyGroup.metrics.find((m) => m.key === 'pointsIn');
        strict_1.default.ok(pointsInMetric.value > 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e xm5: cross-tenant — analytics reflects tenant isolation', async () => {
    const { app, memberService, loyaltyService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    try {
        memberService.register({ memberId: 'm-1', tenantContext: tenantContextA(), nickname: 'Alice' });
        await loyaltyService.settlePaidOrder(makeOrder('o-a', 'm-1', 50), makePayment('p-a', 'o-a', 50, true));
        const snapA = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/snapshot?scope=TENANT')
            .set(TENANT_A);
        const snapB = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/snapshot?scope=TENANT')
            .set(TENANT_B);
        const ordersA = snapA.body.data.groups.find((g) => g.groupKey === 'orders');
        const ordersB = snapB.body.data.groups.find((g) => g.groupKey === 'orders');
        const aCount = ordersA.metrics.find((m) => m.key === 'settlementCount').value;
        const bCount = ordersB.metrics.find((m) => m.key === 'settlementCount').value;
        strict_1.default.equal(aCount, 1);
        strict_1.default.equal(bCount, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e xm5: coupon issued via loyalty service is counted in analytics couponRedemptionCount', async () => {
    const { app, memberService, loyaltyService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    try {
        memberService.register({ memberId: 'm-1', tenantContext: tenantContextA(), nickname: 'Alice' });
        const couponPlan = loyaltyService.registerCouponPlan({
            tenantContext: tenantContextA(),
            code: 'XM5-COUPON',
            title: 'coupon for xm5',
            discountType: 'FIXED_AMOUNT',
            discountValue: 20,
            totalQuota: 100,
            perMemberLimit: 1,
            validFrom: '2026-01-01T00:00:00.000Z',
            validUntil: '2026-12-31T23:59:59.000Z'
        });
        loyaltyService.updateCouponPlanStatus(couponPlan.planId, 'ACTIVE', 'tenant-A');
        await loyaltyService.issueCouponFromPlan({
            tenantContext: tenantContextA(),
            memberId: 'm-1',
            planId: couponPlan.planId,
            source: 'campaign'
        });
        const snap = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/snapshot?scope=TENANT')
            .set(TENANT_A);
        const couponCount = snap.body.data.groups
            .find((g) => g.groupKey === 'orders')
            .metrics.find((m) => m.key === 'couponRedemptionCount').value;
        strict_1.default.equal(couponCount, 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e xm5: high payment failure rate → analytics diagnostics CRITICAL', async () => {
    const { app, memberService, loyaltyService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    try {
        memberService.register({ memberId: 'm-1', tenantContext: tenantContextA(), nickname: 'Alice' });
        for (let i = 0; i < 1; i++) {
            await loyaltyService.settlePaidOrder(makeOrder(`o-${i}`, 'm-1', 100), makePayment(`p-${i}`, `o-${i}`, 100, true));
        }
        for (let i = 1; i < 5; i++) {
            await loyaltyService.settleFailedOrder(makeOrder(`o-${i}`, 'm-1', 100), makePayment(`p-${i}`, `o-${i}`, 100, false));
        }
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/diagnostics?scope=TENANT')
            .set(TENANT_A);
        const critical = res.body.data.filter((d) => d.severity === 'CRITICAL');
        strict_1.default.ok(critical.length >= 1);
        const lowSuccess = critical.find((d) => d.ruleId === 'payment-success-rate-low');
        strict_1.default.ok(lowSuccess);
        strict_1.default.ok(lowSuccess.recommendations.length >= 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e xm5: campaign triggers respect brand scope', async () => {
    const { app, memberService, campaignService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    try {
        memberService.register({ memberId: 'm-1', tenantContext: tenantContextA(), nickname: 'Alice' });
        const plan = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'XM5-BRAND-A',
            title: 'brand A only',
            triggerEvent: 'payment.success',
            conditions: [{ type: 'BRAND_SCOPE', value: ['brand-A'] }],
            actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 10, pointsReason: 'a' } }]
        });
        const planId = plan.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/campaigns/${planId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        const matchA = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContextA(),
            memberId: 'm-1',
            orderId: 'o-brand-A',
            brandId: 'brand-A'
        });
        strict_1.default.equal(matchA.body.data.matchedCampaigns, 1);
        const matchB = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .send({
            eventName: 'payment.success',
            tenantContext: { tenantId: 'tenant-A', brandId: 'brand-B', storeId: 'store-A', marketCode: 'cn-mainland' },
            memberId: 'm-1',
            orderId: 'o-brand-B',
            brandId: 'brand-B'
        });
        strict_1.default.equal(matchB.body.data.matchedCampaigns, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e xm5: idempotency — duplicate evaluate with same planId+memberId+orderId skips', async () => {
    const { app, memberService, campaignService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    try {
        memberService.register({ memberId: 'm-1', tenantContext: tenantContextA(), nickname: 'Alice' });
        const plan = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'XM5-IDEM',
            title: 'idempotency test',
            triggerEvent: 'payment.success',
            actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 10, pointsReason: 'idem' } }]
        });
        const planId = plan.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/campaigns/${planId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        const payload = {
            eventName: 'payment.success',
            tenantContext: tenantContextA(),
            memberId: 'm-1',
            orderId: 'o-idem'
        };
        const first = await (0, supertest_1.default)(app.getHttpServer()).post('/campaigns/evaluate').send(payload);
        const second = await (0, supertest_1.default)(app.getHttpServer()).post('/campaigns/evaluate').send(payload);
        strict_1.default.equal(first.body.data.dispatchedActions, 1);
        strict_1.default.equal(second.body.data.dispatchedActions, 0);
        strict_1.default.equal(second.body.data.skippedActions, 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e xm5: analytics totals align with loyalty settlements', async () => {
    const { app, memberService, loyaltyService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    try {
        memberService.register({ memberId: 'm-1', tenantContext: tenantContextA(), nickname: 'Alice' });
        for (let i = 0; i < 5; i++) {
            await loyaltyService.settlePaidOrder(makeOrder(`o-${i}`, 'm-1', 100), makePayment(`p-${i}`, `o-${i}`, 100, true));
        }
        const snap = await (0, supertest_1.default)(app.getHttpServer())
            .get('/analytics/snapshot?scope=TENANT')
            .set(TENANT_A);
        const totals = snap.body.data.totals;
        const settlementTotal = totals.find((m) => m.key === 'totalSettlements');
        strict_1.default.equal(settlementTotal.value, 5);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e xm5: campaign inactive status does not dispatch', async () => {
    const { app, memberService, campaignService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    try {
        memberService.register({ memberId: 'm-1', tenantContext: tenantContextA(), nickname: 'Alice' });
        const plan = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'XM5-DRAFT',
            title: 'still draft',
            triggerEvent: 'payment.success',
            actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 10, pointsReason: 'draft' } }]
        });
        strict_1.default.equal(plan.body.data.status, 'DRAFT');
        const evalRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContextA(),
            memberId: 'm-1',
            orderId: 'o-draft'
        });
        strict_1.default.equal(evalRes.body.data.matchedCampaigns, 0);
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=cross-module-e2e-5-campaign-loyalty-analytics.test.js.map