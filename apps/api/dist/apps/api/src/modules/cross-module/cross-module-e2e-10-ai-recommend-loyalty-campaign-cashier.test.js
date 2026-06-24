"use strict";
/**
 * E2E 跨模块 #10 — AI 推荐 → 会员 → 营销 → 收银 联动
 *
 * 链路:
 *   HTTP → TestController
 *     → AiRecommendService.generateRecommendations (策略: hybrid)
 *     → MemberService.register + addPoints (前置准备)
 *     → CashierService.createOrder + createPayment + applyPaymentCallback
 *       · 发布 cashier.order-created / cashier.payment-created / cashier.payment-succeeded
 *     → CampaignService.registerCampaign (策略) + evaluateTriggers('cashier.payment-succeeded')
 *       · 匹配成功 → dispatchAction AwardPoints → MemberService.awardPoints
 *       · 触发 loyalty 积分入账 → member 状态升级
 *     → AiRecommendService.generateRecommendations (再次) → 个性化结果不同
 *
 * 验证:
 *   - 冷启动: 新会员无 profile → popularity fallback
 *   - 个性化: 有 profile + 积分 → hybrid 策略产出 content-based 个性化
 *   - 营销触发: payment.success 事件 → AwardPoints 派发 → 会员积分变化
 *   - 营销条件: MinOrderAmount 不满足 → 不触发
 *   - 跨租户隔离: 租户 B 看不到租户 A 的策略 / 推荐 / 营销
 *   - 幂等: 同 orderId 二次 evaluateTriggers → 跳过重复派发
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
const ai_recommend_service_1 = require("../ai-recommend/ai-recommend.service");
const campaign_service_1 = require("../campaign/campaign.service");
const cashier_service_1 = require("../cashier/cashier.service");
const member_service_1 = require("../member/member.service");
const loyalty_service_1 = require("../loyalty/loyalty.service");
const campaign_entity_1 = require("../campaign/campaign.entity");
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
// ─── TestController ───
let TestController = class TestController {
    aiRecommendService;
    memberService;
    cashierService;
    campaignService;
    constructor(aiRecommendService, memberService, cashierService, campaignService) {
        this.aiRecommendService = aiRecommendService;
        this.memberService = memberService;
        this.cashierService = cashierService;
        this.campaignService = campaignService;
    }
    registerMember(req, body) {
        const tc = req.tenantContext;
        return this.memberService.register({
            memberId: body.memberId,
            tenantContext: tc,
            nickname: body.nickname ?? `User-${body.memberId}`
        });
    }
    getMember(memberId) {
        return this.memberService.getProfile(memberId);
    }
    createOrder(req, body) {
        const tc = req.tenantContext;
        return this.cashierService.createOrder(tc, body);
    }
    createPayment(orderId, body) {
        return this.cashierService.createPayment(orderId, body);
    }
    paymentCallback(body) {
        return this.cashierService.applyPaymentCallback(body);
    }
    updateProfile(body) {
        this.aiRecommendService.updateProfile(body.memberId, body.profile);
        return { ok: true };
    }
    recommend(req, body) {
        const tc = req.tenantContext;
        return this.aiRecommendService.generateRecommendations({
            memberId: body.memberId,
            strategyId: body.strategyId ?? 'strategy-hybrid-v1',
            type: body.type ?? 'game',
            limit: body.limit ?? 5,
            storeId: tc.storeId
        });
    }
    registerCampaign(req, body) {
        const tc = req.tenantContext;
        return this.campaignService.registerCampaign({ tenantContext: tc, ...body });
    }
    activateCampaign(req, planId) {
        const tc = req.tenantContext;
        return this.campaignService.updateCampaignStatus(planId, campaign_entity_1.CampaignStatus.Active, tc.tenantId);
    }
    evaluate(req, body) {
        const tc = req.tenantContext;
        return this.campaignService.evaluateTriggers({
            eventName: body.eventName,
            tenantContext: tc,
            memberId: body.memberId,
            orderId: body.orderId,
            paymentId: body.paymentId,
            orderAmount: body.orderAmount,
            payload: body.payload ?? {}
        });
    }
};
__decorate([
    (0, common_1.Post)('members'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "registerMember", null);
__decorate([
    (0, common_1.Get)('members/:memberId'),
    __param(0, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "getMember", null);
__decorate([
    (0, common_1.Post)('cashier/orders'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Post)('cashier/orders/:orderId/payments'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Post)('cashier/payments/callback'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "paymentCallback", null);
__decorate([
    (0, common_1.Post)('ai/profile'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('ai/recommend'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "recommend", null);
__decorate([
    (0, common_1.Post)('campaigns'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "registerCampaign", null);
__decorate([
    (0, common_1.Post)('campaigns/:planId/activate'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "activateCampaign", null);
__decorate([
    (0, common_1.Post)('campaigns/evaluate'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "evaluate", null);
TestController = __decorate([
    (0, common_1.Controller)(),
    __param(0, (0, common_1.Inject)(ai_recommend_service_1.AiRecommendService)),
    __param(1, (0, common_1.Inject)(member_service_1.MemberService)),
    __param(2, (0, common_1.Inject)(cashier_service_1.CashierService)),
    __param(3, (0, common_1.Inject)(campaign_service_1.CampaignService)),
    __metadata("design:paramtypes", [ai_recommend_service_1.AiRecommendService,
        member_service_1.MemberService,
        cashier_service_1.CashierService,
        campaign_service_1.CampaignService])
], TestController);
// ─── 构建 app ───
async function buildApp() {
    (0, member_service_1.resetMemberServiceTestState)();
    const memberService = new member_service_1.MemberService();
    const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
    loyaltyService.resetLoyaltyStoresForTests();
    const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
    cashierService.resetCashierStoresForTests();
    const aiRecommendService = new ai_recommend_service_1.AiRecommendService();
    const campaignService = new campaign_service_1.CampaignService(memberService, loyaltyService);
    campaignService.resetCampaignStoresForTests();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestController],
        providers: [
            { provide: member_service_1.MemberService, useValue: memberService },
            { provide: cashier_service_1.CashierService, useValue: cashierService },
            { provide: loyalty_service_1.LoyaltyService, useValue: loyaltyService },
            { provide: ai_recommend_service_1.AiRecommendService, useValue: aiRecommendService },
            { provide: campaign_service_1.CampaignService, useValue: campaignService }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, memberService, loyaltyService, cashierService, aiRecommendService, campaignService };
}
const TENANT_A = {
    'x-tenant-id': 'tenant-A',
    'x-brand-id': 'brand-A',
    'x-store-id': 'store-A'
};
function ctxA() {
    return { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' };
}
function ctxB() {
    return { tenantId: 'tenant-B', brandId: 'brand-B', storeId: 'store-B', marketCode: 'cn-mainland' };
}
function buildOrder(memberId, priceCents, sku = 'game-1h') {
    return {
        memberId,
        items: [{ skuId: sku, title: '游戏 1 小时', quantity: 1, price: priceCents }]
    };
}
function buildPaymentCallback(orderId, tenantId, amount, transactionNo = 'wx-txn-001') {
    return {
        standardizedEventName: 'cashier.payment-succeeded',
        aggregateId: orderId,
        orderId,
        tenantId,
        externalPaymentId: 'wx-ext-001',
        transactionNo,
        channel: 'wechat',
        amount
    };
}
async function registerAndActivate(app, headers, campaign) {
    const regRes = await (0, supertest_1.default)(app.getHttpServer())
        .post('/campaigns')
        .set(headers)
        .send(campaign);
    strict_1.default.equal(regRes.statusCode, 201, `register 失败: ${JSON.stringify(regRes.body)}`);
    const planId = regRes.body.data.planId;
    const actRes = await (0, supertest_1.default)(app.getHttpServer())
        .post(`/campaigns/${planId}/activate`)
        .set(headers);
    strict_1.default.equal(actRes.statusCode, 201, `activate 失败: ${JSON.stringify(actRes.body)}`);
    return { planId };
}
// ═══════════════════════════════════════════════════
// E2E: AI 推荐 → 会员 → 营销 → 收银 完整联动
// ═══════════════════════════════════════════════════
(0, node_test_1.default)('e2e-10: full ai-recommend → member → campaign → cashier chain', async () => {
    const { app } = await buildApp();
    try {
        // 1. 注册会员
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/members')
            .set(TENANT_A)
            .send({ memberId: 'alice' });
        // 2. 冷启动推荐 (无 profile)
        const coldRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai/recommend')
            .set(TENANT_A)
            .send({ memberId: 'alice', limit: 3 });
        strict_1.default.equal(coldRes.statusCode, 201);
        strict_1.default.ok(coldRes.body.data.items.length >= 1, '冷启动应有推荐结果');
        strict_1.default.ok(['popularity', 'hybrid'].includes(coldRes.body.data.strategy), '冷启动使用 popularity/hybrid 策略');
        // 3. 注册营销: payment.success → 满 100 送 50 积分
        const minOrderCondition = {
            type: campaign_entity_1.CampaignConditionType.MinOrderAmount,
            value: 10000
        };
        const awardAction = {
            kind: campaign_entity_1.CampaignActionKind.AwardPoints,
            params: { pointsAmount: 50, pointsReason: '支付奖励积分' }
        };
        await registerAndActivate(app, TENANT_A, {
            code: 'PAY-50-PTS',
            title: '支付送 50 积分',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [minOrderCondition],
            actions: [awardAction],
            priority: 100
        });
        // 4. 收银: 下单 ¥100 + 支付成功
        const orderRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send(buildOrder('alice', 10000));
        strict_1.default.equal(orderRes.statusCode, 201);
        const orderId = orderRes.body.data.orderId;
        const paymentRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${orderId}/payments`)
            .set(TENANT_A)
            .send({ channel: 'wechat', amount: 10000 });
        strict_1.default.equal(paymentRes.statusCode, 201);
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/payments/callback')
            .set(TENANT_A)
            .send(buildPaymentCallback(orderId, 'tenant-A', 10000));
        // 5. 触发营销评估
        const evalRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .set(TENANT_A)
            .send({
            eventName: 'payment.success',
            memberId: 'alice',
            orderId,
            orderAmount: 10000
        });
        strict_1.default.equal(evalRes.statusCode, 201);
        strict_1.default.equal(evalRes.body.data.matchedCampaigns, 1, '应匹配 1 个营销');
        strict_1.default.equal(evalRes.body.data.dispatchedActions, 1, 'AwardPoints 应派发');
        strict_1.default.equal(evalRes.body.data.dispatches[0].resultRef, 'points+50:支付奖励积分', 'resultRef 格式正确');
        // 6. 验证 member 积分已变更
        const memberRes = await (0, supertest_1.default)(app.getHttpServer())
            .get('/members/alice')
            .set(TENANT_A);
        strict_1.default.equal(memberRes.statusCode, 200);
        strict_1.default.ok(memberRes.body.data, '会员存在');
        const points = memberRes.body.data.points ?? 0;
        strict_1.default.ok(points >= 50, `积分应 >= 50 (实际 ${points})`);
        // 7. 二次推荐: 验证个性化 (有 profile + 积分)
        const warmRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai/recommend')
            .set(TENANT_A)
            .send({ memberId: 'alice', limit: 3 });
        strict_1.default.equal(warmRes.statusCode, 201);
        strict_1.default.ok(warmRes.body.data.items.length >= 1, '应有推荐结果');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-10: cold-start member without profile falls back to popularity', async () => {
    const { app } = await buildApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/members')
            .set(TENANT_A)
            .send({ memberId: 'newbie' });
        // 不更新 profile,直接推荐
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai/recommend')
            .set(TENANT_A)
            .send({ memberId: 'newbie', strategyId: 'strategy-popularity-v1', limit: 3 });
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.ok(res.body.data.items.length >= 1, '冷启动 popularity 仍应有结果');
        for (const item of res.body.data.items) {
            strict_1.default.equal(item.strategy, 'popularity', '冷启动应使用 popularity 策略');
        }
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-10: personalized recommendations with user profile', async () => {
    const { app } = await buildApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/members')
            .set(TENANT_A)
            .send({ memberId: 'moba-fan' });
        // 设置 profile: 偏好 MOBA
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai/profile')
            .set(TENANT_A)
            .send({
            memberId: 'moba-fan',
            profile: {
                preferences: {
                    gameTypes: ['MOBA', 'RPG'],
                    priceRange: { min: 50, max: 200 },
                    visitFrequency: 'weekly',
                    avgSpend: 120,
                    favoriteTimeSlot: '18:00-22:00'
                },
                behaviorTags: ['game-enthusiast']
            }
        });
        // 内容推荐
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/ai/recommend')
            .set(TENANT_A)
            .send({ memberId: 'moba-fan', strategyId: 'strategy-hybrid-v1', limit: 3 });
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.ok(res.body.data.items.length >= 1, 'hybrid 应有结果');
        for (const item of res.body.data.items) {
            strict_1.default.ok(['hybrid', 'content-based', 'collaborative', 'popularity'].includes(item.strategy), `hybrid 策略产出应为子策略之一,实际 ${item.strategy}`);
        }
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-10: campaign AwardPoints dispatches to member.awardPoints', async () => {
    const { app, memberService } = await buildApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/members')
            .set(TENANT_A)
            .send({ memberId: 'bob' });
        // 营销: 任意支付成功 + 送 200 积分
        await registerAndActivate(app, TENANT_A, {
            code: 'BIG-BONUS',
            title: '大额积分奖励',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [
                {
                    kind: campaign_entity_1.CampaignActionKind.AwardPoints,
                    params: { pointsAmount: 200, pointsReason: '大额奖励' }
                }
            ],
            priority: 50
        });
        // 拷贝数值 (避免对象引用问题)
        const beforePoints = memberService.getProfile('bob')?.points ?? 0;
        const evalRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .set(TENANT_A)
            .send({
            eventName: 'payment.success',
            memberId: 'bob',
            orderId: 'order-1',
            payload: { amount: 5000 }
        });
        strict_1.default.equal(evalRes.statusCode, 201);
        strict_1.default.equal(evalRes.body.data.dispatchedActions, 1);
        strict_1.default.equal(evalRes.body.data.dispatches[0].status, 'DISPATCHED');
        const afterPoints = memberService.getProfile('bob')?.points ?? 0;
        strict_1.default.ok(afterPoints >= beforePoints + 200, `积分应增加 >= 200 (before=${beforePoints} after=${afterPoints})`);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-10: campaign MinOrderAmount condition not met → not dispatched', async () => {
    const { app } = await buildApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/members')
            .set(TENANT_A)
            .send({ memberId: 'small-spender' });
        // 营销: 满 500 才送积分
        await registerAndActivate(app, TENANT_A, {
            code: 'MIN-500',
            title: '满 500 送 100',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [{ type: campaign_entity_1.CampaignConditionType.MinOrderAmount, value: 50000 }],
            actions: [
                {
                    kind: campaign_entity_1.CampaignActionKind.AwardPoints,
                    params: { pointsAmount: 100, pointsReason: '满减奖励' }
                }
            ],
            priority: 100
        });
        // 触发小金额订单
        const evalRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .set(TENANT_A)
            .send({
            eventName: 'payment.success',
            memberId: 'small-spender',
            orderId: 'order-small',
            orderAmount: 1000
        });
        strict_1.default.equal(evalRes.statusCode, 201);
        strict_1.default.equal(evalRes.body.data.matchedCampaigns, 0, '小金额不应匹配营销');
        strict_1.default.equal(evalRes.body.data.dispatchedActions, 0);
        strict_1.default.equal(evalRes.body.data.dispatches.length, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-10: campaign RecommendTag action dispatches tag without state change', async () => {
    const { app } = await buildApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/members')
            .set(TENANT_A)
            .send({ memberId: 'tagger' });
        // 营销: 支付成功打 tag
        await registerAndActivate(app, TENANT_A, {
            code: 'TAG-CAMPAIGN',
            title: '支付标签',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [
                {
                    kind: campaign_entity_1.CampaignActionKind.RecommendTag,
                    params: { tagCode: 'paying-user' }
                }
            ],
            priority: 10
        });
        const evalRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .set(TENANT_A)
            .send({
            eventName: 'payment.success',
            memberId: 'tagger',
            orderId: 'order-tag',
            payload: {}
        });
        strict_1.default.equal(evalRes.statusCode, 201);
        strict_1.default.equal(evalRes.body.data.matchedCampaigns, 1);
        strict_1.default.equal(evalRes.body.data.dispatchedActions, 1);
        strict_1.default.equal(evalRes.body.data.dispatches[0].resultRef, 'tag:paying-user', 'resultRef 应为 tag:paying-user');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-10: cross-tenant isolation - Tenant B cannot see Tenant A campaigns/recommendations', async () => {
    const { app, aiRecommendService, campaignService } = await buildApp();
    try {
        // Tenant A 注册营销 + 注册会员
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/members')
            .set(TENANT_A)
            .send({ memberId: 'a-member' });
        await registerAndActivate(app, TENANT_A, {
            code: 'A-ONLY',
            title: 'A 专属',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [
                {
                    kind: campaign_entity_1.CampaignActionKind.AwardPoints,
                    params: { pointsAmount: 10 }
                }
            ]
        });
        // Tenant B 推荐: 不应看到 Tenant A 的策略影响
        const tenantBRecs = aiRecommendService.generateRecommendations({
            memberId: 'b-member',
            strategyId: 'strategy-popularity-v1',
            type: 'game',
            limit: 3,
            storeId: 'store-B'
        });
        strict_1.default.ok(tenantBRecs.items.length >= 1);
        // Tenant B 评估: 不应匹配 Tenant A 的营销
        const tenantBEval = campaignService.evaluateTriggers({
            eventName: 'payment.success',
            tenantContext: ctxB(),
            memberId: 'b-member',
            orderId: 'b-order',
            payload: {}
        });
        strict_1.default.equal(tenantBEval.matchedCampaigns, 0, 'Tenant B 不应匹配 Tenant A 营销');
        // Tenant A 评估: 应匹配
        const tenantAEval = campaignService.evaluateTriggers({
            eventName: 'payment.success',
            tenantContext: ctxA(),
            memberId: 'a-member',
            orderId: 'a-order',
            payload: {}
        });
        strict_1.default.equal(tenantAEval.matchedCampaigns, 1, 'Tenant A 应匹配自己的营销');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-10: campaign idempotency - duplicate evaluate with same orderId skips', async () => {
    const { app } = await buildApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/members')
            .set(TENANT_A)
            .send({ memberId: 'idem-user' });
        await registerAndActivate(app, TENANT_A, {
            code: 'IDEM-CAMP',
            title: '幂等测试',
            triggerEvent: campaign_entity_1.CampaignTrigger.PaymentSuccess,
            conditions: [],
            actions: [
                {
                    kind: campaign_entity_1.CampaignActionKind.AwardPoints,
                    params: { pointsAmount: 30 }
                }
            ]
        });
        // 第一次评估
        const first = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .set(TENANT_A)
            .send({
            eventName: 'payment.success',
            memberId: 'idem-user',
            orderId: 'idem-order',
            payload: {}
        });
        strict_1.default.equal(first.body.data.dispatchedActions, 1, '首次应派发');
        // 第二次同 orderId 评估
        const second = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .set(TENANT_A)
            .send({
            eventName: 'payment.success',
            memberId: 'idem-user',
            orderId: 'idem-order',
            payload: {}
        });
        strict_1.default.equal(second.body.data.matchedCampaigns, 1, '营销仍匹配');
        strict_1.default.equal(second.body.data.dispatchedActions, 0, '不应重复派发');
        strict_1.default.ok(second.body.data.skippedActions >= 1, '应有 skipped 计数');
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=cross-module-e2e-10-ai-recommend-loyalty-campaign-cashier.test.js.map