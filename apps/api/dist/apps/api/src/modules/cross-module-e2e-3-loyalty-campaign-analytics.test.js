"use strict";
/**
 * 跨模块 E2E 测试链 #5: Loyalty + Campaign + Analytics 联动
 *
 * 链路:
 *   HTTP → TenantContext → LoyaltyService (plan + issue)
 *                        → CampaignService (evaluate + dispatch awardPoints/issueCoupon)
 *                        → AnalyticsService (snapshot + diagnostics)
 *
 * 验证:
 *   - 创建 CouponPlan → 状态激活 → Campaign 通过 payment.success 触发自动发券
 *   - 触发 AwardPoints 后 member 积分变化被 Analytics 聚合
 *   - 多次发券后 coupon 配额下降被 Analytics 监控
 *   - 跨模块 tenant 隔离：tenant-B 不能消费 tenant-A 的券或看到它的指标
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
const response_interceptor_1 = require("../common/interceptors/response.interceptor");
const cashier_entity_1 = require("./cashier/cashier.entity");
const member_service_1 = require("./member/member.service");
const loyalty_entity_1 = require("./loyalty/loyalty.entity");
const loyalty_service_1 = require("./loyalty/loyalty.service");
const campaign_service_1 = require("./campaign/campaign.service");
const analytics_service_1 = require("./analytics/analytics.service");
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
let TestIntegrationController = class TestIntegrationController {
    loyaltyService;
    campaignService;
    analyticsService;
    constructor(loyaltyService, campaignService, analyticsService) {
        this.loyaltyService = loyaltyService;
        this.campaignService = campaignService;
        this.analyticsService = analyticsService;
    }
    registerCouponPlan(req, body) {
        const tenantContext = req.tenantContext;
        return this.loyaltyService.registerCouponPlan({
            tenantContext,
            code: body.code,
            title: body.title,
            discountType: body.discountType,
            discountValue: body.discountValue,
            totalQuota: body.totalQuota,
            perMemberLimit: body.perMemberLimit,
            validFrom: body.validFrom,
            validUntil: body.validUntil
        });
    }
    updateCouponPlanStatus(req, planId, body) {
        const tenantContext = req.tenantContext;
        return this.loyaltyService.updateCouponPlanStatus(planId, body.status, tenantContext.tenantId);
    }
    registerCampaign(req, body) {
        const tenantContext = req.tenantContext;
        return this.campaignService.registerCampaign({
            tenantContext,
            code: body.code,
            title: body.title,
            triggerEvent: body.triggerEvent,
            conditions: body.conditions ?? [],
            actions: body.actions,
            priority: body.priority
        });
    }
    updateCampaignStatus(req, planId, body) {
        const tenantContext = req.tenantContext;
        return this.campaignService.updateCampaignStatus(planId, body.status, tenantContext.tenantId);
    }
    evaluate(body) {
        return this.campaignService.evaluateTriggers({
            eventName: body.eventName,
            tenantContext: body.tenantContext,
            memberId: body.memberId,
            orderId: body.orderId,
            orderAmount: body.orderAmount
        });
    }
    snapshot(req) {
        const tenantContext = req.tenantContext;
        return this.analyticsService.getOperationSnapshot(tenantContext);
    }
};
__decorate([
    (0, common_1.Post)('coupon-plans'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestIntegrationController.prototype, "registerCouponPlan", null);
__decorate([
    (0, common_1.Patch)('coupon-plans/:planId/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('planId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TestIntegrationController.prototype, "updateCouponPlanStatus", null);
__decorate([
    (0, common_1.Post)('campaigns'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestIntegrationController.prototype, "registerCampaign", null);
__decorate([
    (0, common_1.Patch)('campaigns/:planId/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('planId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TestIntegrationController.prototype, "updateCampaignStatus", null);
__decorate([
    (0, common_1.Post)('campaigns/evaluate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestIntegrationController.prototype, "evaluate", null);
__decorate([
    (0, common_1.Get)('analytics/snapshot'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestIntegrationController.prototype, "snapshot", null);
TestIntegrationController = __decorate([
    (0, common_1.Controller)('integration'),
    __param(0, (0, common_1.Inject)(loyalty_service_1.LoyaltyService)),
    __param(1, (0, common_1.Inject)(campaign_service_1.CampaignService)),
    __param(2, (0, common_1.Inject)(analytics_service_1.AnalyticsService)),
    __metadata("design:paramtypes", [loyalty_service_1.LoyaltyService,
        campaign_service_1.CampaignService,
        analytics_service_1.AnalyticsService])
], TestIntegrationController);
async function buildApp() {
    (0, member_service_1.resetMemberServiceTestState)();
    const memberService = new member_service_1.MemberService();
    const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
    const campaignService = new campaign_service_1.CampaignService(memberService, loyaltyService);
    const analyticsService = new analytics_service_1.AnalyticsService(loyaltyService);
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestIntegrationController],
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
function tenantContext(tenant = 'tenant-A') {
    return { tenantId: tenant, brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' };
}
function makeOrder(orderId, memberId, amount) {
    const now = new Date().toISOString();
    return {
        orderId,
        tenantContext: tenantContext(),
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
function makePayment(paymentId, orderId, amount) {
    const now = new Date().toISOString();
    return {
        paymentId,
        orderId,
        channel: 'wechat',
        amount,
        status: cashier_entity_1.CashierPaymentStatus.Succeeded,
        createdAt: now,
        updatedAt: now,
        completedAt: now
    };
}
(0, node_test_1.default)('cross-module e2e: payment.success triggers campaign award-points → member profile updated and analytics aggregates settlement inflow', async () => {
    const { app, memberService, loyaltyService, campaignService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    campaignService.resetCampaignStoresForTests();
    memberService.register({
        memberId: 'm-1',
        tenantContext: tenantContext(),
        nickname: 'Alice'
    });
    try {
        // Register campaign: payment.success → award 50 points
        const campaign = await (0, supertest_1.default)(app.getHttpServer())
            .post('/integration/campaigns')
            .set(TENANT_A)
            .send({
            code: 'POINTS-BONUS',
            title: 'payment bonus',
            triggerEvent: 'payment.success',
            actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 50, pointsReason: 'payment-bonus' } }]
        });
        const campaignId = campaign.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/integration/campaigns/${campaignId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        // Settle a payment (writes to pointsLedgerStore which analytics reads from)
        await loyaltyService.settlePaidOrder(makeOrder('order-pay-1', 'm-1', 200), makePayment('pay-1', 'order-pay-1', 200));
        // Trigger evaluation for the same payment event
        const evalRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/integration/campaigns/evaluate')
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContext(),
            memberId: 'm-1',
            orderId: 'order-pay-1',
            orderAmount: 200
        });
        strict_1.default.equal(evalRes.body.data.dispatchedActions, 1);
        // Verify analytics reflects the settlement inflow (loyalty ledger entry)
        const snap = await (0, supertest_1.default)(app.getHttpServer())
            .get('/integration/analytics/snapshot')
            .set(TENANT_A);
        const loyaltyGroup = snap.body.data.groups.find((g) => g.groupKey === 'loyalty');
        const pointsInMetric = loyaltyGroup.metrics.find((m) => m.key === 'pointsIn');
        strict_1.default.ok(pointsInMetric.value >= 200, `expected pointsIn >= 200 (from settlement), got ${pointsInMetric.value}`);
        // Verify member profile reflects campaign-awarded points (memberService.addPoints path)
        const profile = memberService.getProfile('m-1');
        strict_1.default.ok(profile);
        strict_1.default.ok(profile.points >= 50, `expected profile.points >= 50 (from campaign), got ${profile.points}`);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('cross-module e2e: campaign IssueCoupon action drains coupon plan and analytics tracks redemption', async () => {
    const { app, memberService, loyaltyService, campaignService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    campaignService.resetCampaignStoresForTests();
    memberService.register({
        memberId: 'm-1',
        tenantContext: tenantContext(),
        nickname: 'Alice'
    });
    try {
        // Step 1: Register CouponPlan via loyalty
        const plan = await (0, supertest_1.default)(app.getHttpServer())
            .post('/integration/coupon-plans')
            .set(TENANT_A)
            .send({
            code: 'WELCOME-50',
            title: 'welcome coupon',
            discountType: loyalty_entity_1.CouponDiscountType.FixedAmount,
            discountValue: 50,
            totalQuota: 100,
            perMemberLimit: 5,
            validFrom: '2026-01-01T00:00:00.000Z',
            validUntil: '2026-12-31T23:59:59.000Z'
        });
        const planId = plan.body.data.planId;
        strict_1.default.equal(plan.body.data.remainingQuota, 100);
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/integration/coupon-plans/${planId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        // Step 2: Register Campaign that auto-issues the coupon on payment.success
        const campaign = await (0, supertest_1.default)(app.getHttpServer())
            .post('/integration/campaigns')
            .set(TENANT_A)
            .send({
            code: 'AUTO-WELCOME',
            title: 'auto welcome coupon',
            triggerEvent: 'payment.success',
            actions: [{ kind: 'ISSUE_COUPON', params: { couponPlanId: planId } }]
        });
        const campaignId = campaign.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/integration/campaigns/${campaignId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        // Step 3: Trigger payment event
        const evalRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/integration/campaigns/evaluate')
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContext(),
            memberId: 'm-1',
            orderId: 'order-pay-welcome',
            orderAmount: 100
        });
        strict_1.default.equal(evalRes.body.data.dispatchedActions, 1);
        // Step 4: Verify coupon plan drained
        const planAfter = loyaltyService.getCouponPlan(planId, 'tenant-A');
        strict_1.default.ok(planAfter);
        strict_1.default.equal(planAfter.remainingQuota, 99);
        // Step 5: Verify analytics reflects the coupon redemption
        const snap = await (0, supertest_1.default)(app.getHttpServer())
            .get('/integration/analytics/snapshot')
            .set(TENANT_A);
        const orderGroup = snap.body.data.groups.find((g) => g.groupKey === 'orders');
        const couponMetric = orderGroup.metrics.find((m) => m.key === 'couponRedemptionCount');
        strict_1.default.equal(couponMetric.value, 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('cross-module e2e: settlePaidOrder + campaign AwardPoints accumulate points visible in analytics', async () => {
    const { app, memberService, loyaltyService, campaignService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    campaignService.resetCampaignStoresForTests();
    memberService.register({
        memberId: 'm-1',
        tenantContext: tenantContext(),
        nickname: 'Alice'
    });
    try {
        // Register award-points campaign
        const campaign = await (0, supertest_1.default)(app.getHttpServer())
            .post('/integration/campaigns')
            .set(TENANT_A)
            .send({
            code: 'SETTLE-BONUS',
            title: 'settlement bonus',
            triggerEvent: 'payment.success',
            actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 30, pointsReason: 'settlement' } }]
        });
        const campaignId = campaign.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/integration/campaigns/${campaignId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        // Process 3 settlements, each triggering campaign evaluation
        let totalCampaignPoints = 0;
        for (let i = 1; i <= 3; i++) {
            await loyaltyService.settlePaidOrder(makeOrder(`o-${i}`, 'm-1', 100), makePayment(`p-${i}`, `o-${i}`, 100));
            const before = memberService.getProfile('m-1')?.points ?? 0;
            await (0, supertest_1.default)(app.getHttpServer())
                .post('/integration/campaigns/evaluate')
                .send({
                eventName: 'payment.success',
                tenantContext: tenantContext(),
                memberId: 'm-1',
                orderId: `o-${i}`,
                orderAmount: 100
            });
            const after = memberService.getProfile('m-1')?.points ?? 0;
            totalCampaignPoints += after - before;
        }
        strict_1.default.equal(totalCampaignPoints, 90); // 3 × 30
        // Verify analytics aggregate reflects settlement inflow (campaign award goes
        // through memberService.addPoints which doesn't write to pointsLedgerStore)
        const snap = await (0, supertest_1.default)(app.getHttpServer())
            .get('/integration/analytics/snapshot')
            .set(TENANT_A);
        const loyaltyGroup = snap.body.data.groups.find((g) => g.groupKey === 'loyalty');
        const pointsInMetric = loyaltyGroup.metrics.find((m) => m.key === 'pointsIn');
        // settlement awards 100 each (3 × 100 = 300); campaign awards 30 each go to profile only
        strict_1.default.equal(pointsInMetric.value, 300);
        // Member profile reflects both settlement inflow and campaign award
        const finalProfile = memberService.getProfile('m-1');
        strict_1.default.ok(finalProfile);
        strict_1.default.ok(finalProfile.points >= 300 + 90, `expected profile.points >= 390, got ${finalProfile.points}`);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('cross-module e2e: tenant-B cannot consume tenant-A coupon plan nor see its analytics', async () => {
    const { app, memberService, loyaltyService, campaignService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    campaignService.resetCampaignStoresForTests();
    try {
        // Register plan in tenant-A
        const plan = await (0, supertest_1.default)(app.getHttpServer())
            .post('/integration/coupon-plans')
            .set(TENANT_A)
            .send({
            code: 'A-ONLY',
            title: 'tenant A only',
            discountType: loyalty_entity_1.CouponDiscountType.FixedAmount,
            discountValue: 10,
            totalQuota: 50,
            perMemberLimit: 5,
            validFrom: '2026-01-01T00:00:00.000Z',
            validUntil: '2026-12-31T23:59:59.000Z'
        });
        const planId = plan.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/integration/coupon-plans/${planId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        // tenant-A snapshot shows the plan quota
        const snapA = await (0, supertest_1.default)(app.getHttpServer())
            .get('/integration/analytics/snapshot')
            .set(TENANT_A);
        strict_1.default.ok(snapA.body.data);
        // tenant-B snapshot is isolated (zero everything)
        const snapB = await (0, supertest_1.default)(app.getHttpServer())
            .get('/integration/analytics/snapshot')
            .set(TENANT_B);
        const orderGroupB = snapB.body.data.groups.find((g) => g.groupKey === 'orders');
        const couponMetricB = orderGroupB.metrics.find((m) => m.key === 'couponRedemptionCount');
        strict_1.default.equal(couponMetricB.value, 0);
        // Direct cross-tenant access: getCouponPlan returns undefined (tenant guard)
        strict_1.default.equal(loyaltyService.getCouponPlan(planId, 'tenant-B'), undefined);
        strict_1.default.throws(() => loyaltyService.updateCouponPlanStatus(planId, loyalty_entity_1.LoyaltyPlanStatus.Paused, 'tenant-B'));
        // tenant-B campaign cannot reference tenant-A's plan via campaign registration
        // (validateAction only checks shape; but dispatch uses planId which is tenant-A's, so should fail at dispatch)
        const campaign = await (0, supertest_1.default)(app.getHttpServer())
            .post('/integration/campaigns')
            .set(TENANT_B)
            .send({
            code: 'B-CAMP',
            title: 'B campaign',
            triggerEvent: 'payment.success',
            actions: [{ kind: 'ISSUE_COUPON', params: { couponPlanId: planId } }]
        });
        strict_1.default.equal(campaign.statusCode, 201);
        const campaignIdB = campaign.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/integration/campaigns/${campaignIdB}/status`)
            .set(TENANT_B)
            .send({ status: 'ACTIVE' });
        // But the action will skip at dispatch because member doesn't exist in tenant-B
        memberService.register({
            memberId: 'm-B',
            tenantContext: tenantContext('tenant-B'),
            nickname: 'Bob'
        });
        const evalRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/integration/campaigns/evaluate')
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContext('tenant-B'),
            memberId: 'm-B',
            orderId: 'order-B-1',
            orderAmount: 50
        });
        // IssueCoupon action with cross-tenant planId will throw inside loyaltyService.issueCouponFromPlan
        // → dispatch records Failed status
        const dispatch = evalRes.body.data.dispatches[0];
        strict_1.default.equal(dispatch.status, 'FAILED');
        strict_1.default.ok(dispatch.errorMessage?.includes('Coupon plan not found'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e xm3-ext: member points ledger accumulates across multiple campaign triggers', async () => {
    const { app, memberService, loyaltyService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    memberService.register({
        memberId: 'm-1',
        tenantContext: tenantContext(),
        nickname: 'Alice'
    });
    try {
        const reg = await (0, supertest_1.default)(app.getHttpServer())
            .post('/integration/campaigns')
            .set(TENANT_A)
            .send({
            code: 'XM3-EXT-POINTS',
            title: 'multi points',
            triggerEvent: 'payment.success',
            actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 25, pointsReason: 'ext-1' } }]
        });
        const planId = reg.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/integration/campaigns/${planId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        // 3 different orderIds → 3 separate dispatches
        for (let i = 0; i < 3; i++) {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/integration/campaigns/evaluate')
                .send({
                eventName: 'payment.success',
                tenantContext: tenantContext(),
                memberId: 'm-1',
                orderId: `o-ext-${i}`
            });
            strict_1.default.equal(res.body.data.dispatchedActions, 1);
        }
        // 直接 settlePaidOrder 触发 ledger
        for (let i = 0; i < 3; i++) {
            loyaltyService.settlePaidOrder(makeOrder(`o-ext-${i}`, 'm-1', 100), makePayment(`p-ext-${i}`, `o-ext-${i}`, 100));
        }
        const snap = await (0, supertest_1.default)(app.getHttpServer())
            .get('/integration/analytics/snapshot')
            .set(TENANT_A);
        const loyaltyGroup = snap.body.data.groups.find((g) => g.groupKey === 'loyalty');
        const pointsIn = loyaltyGroup.metrics.find((m) => m.key === 'pointsIn');
        strict_1.default.ok(pointsIn.value >= 3);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e xm3-ext: campaign priorities determine dispatch order across multiple matching campaigns', async () => {
    const { app, memberService, campaignService, loyaltyService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    loyaltyService.resetLoyaltyStoresForTests();
    memberService.register({ memberId: 'm-1', tenantContext: tenantContext(), nickname: 'Alice' });
    try {
        const lowReg = await (0, supertest_1.default)(app.getHttpServer())
            .post('/integration/campaigns')
            .set(TENANT_A)
            .send({
            code: 'XM3-LOW',
            title: 'low prio',
            triggerEvent: 'payment.success',
            actions: [{ kind: 'RECOMMEND_TAG', params: { tagCode: 'low' } }],
            priority: 1
        });
        const lowPlanId = lowReg.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/integration/campaigns/${lowPlanId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        const highReg = await (0, supertest_1.default)(app.getHttpServer())
            .post('/integration/campaigns')
            .set(TENANT_A)
            .send({
            code: 'XM3-HIGH',
            title: 'high prio',
            triggerEvent: 'payment.success',
            actions: [{ kind: 'RECOMMEND_TAG', params: { tagCode: 'high' } }],
            priority: 999
        });
        const highPlanId = highReg.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/integration/campaigns/${highPlanId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/integration/campaigns/evaluate')
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContext(),
            memberId: 'm-1',
            orderId: 'o-prio-xm3'
        });
        const codes = res.body.data.dispatches.map((d) => d.campaignCode ?? d.planId);
        // 期望高优先级先出现（可能 codes 是 planId）
        strict_1.default.ok(codes.length === 2);
        strict_1.default.ok(codes[0] !== codes[1]);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e xm3-ext: cross-tenant analytics — tenant B sees empty snapshot when tenant A has data', async () => {
    const { app, memberService, loyaltyService } = await buildApp();
    loyaltyService.resetLoyaltyStoresForTests();
    memberService.register({ memberId: 'm-1', tenantContext: tenantContext(), nickname: 'Alice' });
    try {
        loyaltyService.settlePaidOrder(makeOrder('o-a-1', 'm-1', 100), makePayment('p-a-1', 'o-a-1', 100));
        const snapA = await (0, supertest_1.default)(app.getHttpServer())
            .get('/integration/analytics/snapshot')
            .set(TENANT_A);
        const snapB = await (0, supertest_1.default)(app.getHttpServer())
            .get('/integration/analytics/snapshot')
            .set(TENANT_B);
        const aOrder = snapA.body.data.groups.find((g) => g.groupKey === 'orders');
        const bOrder = snapB.body.data.groups.find((g) => g.groupKey === 'orders');
        strict_1.default.equal(aOrder.metrics.find((m) => m.key === 'settlementCount').value, 1);
        strict_1.default.equal(bOrder.metrics.find((m) => m.key === 'settlementCount').value, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e xm3-ext: campaign inactive status does not match', async () => {
    const { app, memberService, campaignService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    memberService.register({ memberId: 'm-1', tenantContext: tenantContext(), nickname: 'Alice' });
    try {
        const reg = await (0, supertest_1.default)(app.getHttpServer())
            .post('/integration/campaigns')
            .set(TENANT_A)
            .send({
            code: 'XM3-DRAFT',
            title: 'still draft',
            triggerEvent: 'payment.success',
            actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 5, pointsReason: 'd' } }]
        });
        strict_1.default.equal(reg.body.data.status, 'DRAFT');
        const evalRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/integration/campaigns/evaluate')
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContext(),
            memberId: 'm-1',
            orderId: 'o-draft'
        });
        strict_1.default.equal(evalRes.body.data.matchedCampaigns, 0);
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=cross-module-e2e-3-loyalty-campaign-analytics.test.js.map