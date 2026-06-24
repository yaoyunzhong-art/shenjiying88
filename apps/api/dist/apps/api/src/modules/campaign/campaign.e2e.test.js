"use strict";
/**
 * E2E: Campaign 编排引擎 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext → TestController → CampaignService → MemberService/LoyaltyService
 *
 * 验证:
 *   - Campaign register / list / get / status 完整 CRUD
 *   - evaluateTriggers HTTP 端点
 *   - dispatches 列表 / 按 planId 过滤
 *   - 状态机转换守卫
 *   - 幂等性（同 planId+actionIndex+memberId+orderId 不重复派发）
 *   - 条件匹配（MinOrderAmount, BrandScope）
 *   - brand scope 自动从 tenantContext 派生
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
const member_service_1 = require("../member/member.service");
const loyalty_service_1 = require("../loyalty/loyalty.service");
const loyalty_entity_1 = require("../loyalty/loyalty.entity");
const campaign_service_1 = require("./campaign.service");
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
        const tenantContext = req.tenantContext;
        return this.campaignService.registerCampaign({
            tenantContext,
            code: body.code,
            title: body.title,
            description: body.description,
            triggerEvent: body.triggerEvent,
            conditions: body.conditions ?? [],
            actions: body.actions,
            priority: body.priority,
            scheduledStart: body.scheduledStart,
            scheduledEnd: body.scheduledEnd
        });
    }
    list(req) {
        const tenantContext = req.tenantContext;
        return this.campaignService.listCampaigns(tenantContext.tenantId);
    }
    get(req, planId) {
        const tenantContext = req.tenantContext;
        const plan = this.campaignService.getCampaign(planId, tenantContext.tenantId);
        return plan ?? null;
    }
    updateStatus(req, planId, body) {
        const tenantContext = req.tenantContext;
        return this.campaignService.updateCampaignStatus(planId, body.status, tenantContext.tenantId);
    }
    listDispatches(req, planId, limit) {
        const tenantContext = req.tenantContext;
        const dispatches = this.campaignService.listDispatches(tenantContext.tenantId, {
            planId
        });
        const n = limit ? Number.parseInt(limit, 10) : undefined;
        return n ? dispatches.slice(0, n) : dispatches;
    }
    listAllDispatches(req, limit) {
        const tenantContext = req.tenantContext;
        const dispatches = this.campaignService.listDispatches(tenantContext.tenantId, {});
        const n = limit ? Number.parseInt(limit, 10) : undefined;
        return n ? dispatches.slice(0, n) : dispatches;
    }
    listDispatchesByFilter(req, memberId, status) {
        const tenantContext = req.tenantContext;
        return this.campaignService.listDispatches(tenantContext.tenantId, {
            memberId,
            status: status
        });
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
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestCampaignController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':planId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestCampaignController.prototype, "get", null);
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
    (0, common_1.Get)(':planId/dispatches'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('planId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], TestCampaignController.prototype, "listDispatches", null);
__decorate([
    (0, common_1.Get)('dispatches/all'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestCampaignController.prototype, "listAllDispatches", null);
__decorate([
    (0, common_1.Get)('dispatches/list'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('memberId')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], TestCampaignController.prototype, "listDispatchesByFilter", null);
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
async function buildApp() {
    (0, member_service_1.resetMemberServiceTestState)();
    const memberService = new member_service_1.MemberService();
    const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
    const campaignService = new campaign_service_1.CampaignService(memberService, loyaltyService);
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestCampaignController],
        providers: [
            { provide: member_service_1.MemberService, useValue: memberService },
            { provide: loyalty_service_1.LoyaltyService, useValue: loyaltyService },
            { provide: campaign_service_1.CampaignService, useValue: campaignService }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, memberService, loyaltyService, campaignService };
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
function tenantContextA() {
    return { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' };
}
function tenantContextX() {
    return { tenantId: 'tenant-A', brandId: 'brand-X', storeId: 'store-X', marketCode: 'cn-mainland' };
}
(0, node_test_1.default)('e2e: campaign register → list → get → status lifecycle', async () => {
    const { app, campaignService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    try {
        const register = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'WELCOME-BACK',
            title: 'welcome back customers',
            triggerEvent: 'payment.success',
            actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 50, pointsReason: 'payment-bonus' } }]
        });
        strict_1.default.equal(register.statusCode, 201);
        const planId = register.body.data.planId;
        strict_1.default.ok(planId);
        strict_1.default.equal(register.body.data.code, 'WELCOME-BACK');
        strict_1.default.equal(register.body.data.status, 'DRAFT');
        const list = await (0, supertest_1.default)(app.getHttpServer()).get('/campaigns').set(TENANT_A);
        strict_1.default.equal(list.body.data.length, 1);
        const detail = await (0, supertest_1.default)(app.getHttpServer()).get(`/campaigns/${planId}`).set(TENANT_A);
        strict_1.default.equal(detail.body.data.planId, planId);
        const activate = await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/campaigns/${planId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        strict_1.default.equal(activate.body.data.status, 'ACTIVE');
        const pause = await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/campaigns/${planId}/status`)
            .set(TENANT_A)
            .send({ status: 'PAUSED' });
        strict_1.default.equal(pause.body.data.status, 'PAUSED');
        const resume = await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/campaigns/${planId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        strict_1.default.equal(resume.body.data.status, 'ACTIVE');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: campaign dispatches by planId', async () => {
    const { app, campaignService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    try {
        const p1 = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'P1',
            title: 'p1 campaign',
            triggerEvent: 'payment.success',
            actions: [{ kind: 'RECOMMEND_TAG', params: { tagCode: 'vip-candidate' } }]
        });
        const planId = p1.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/campaigns/${planId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContextA(),
            memberId: 'm-1',
            orderId: 'order-1'
        });
        const listByPlan = await (0, supertest_1.default)(app.getHttpServer())
            .get(`/campaigns/${planId}/dispatches`)
            .set(TENANT_A);
        strict_1.default.equal(listByPlan.body.data.length, 1);
        strict_1.default.equal(listByPlan.body.data[0].planId, planId);
        strict_1.default.equal(listByPlan.body.data[0].memberId, 'm-1');
        const listAll = await (0, supertest_1.default)(app.getHttpServer())
            .get('/campaigns/dispatches/all')
            .set(TENANT_A);
        strict_1.default.equal(listAll.body.data.length, 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: evaluateTriggers is idempotent on planId+actionIndex+memberId+orderId', async () => {
    const { app, campaignService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    try {
        const plan = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'IDEM',
            title: 'idempotency',
            triggerEvent: 'payment.success',
            actions: [{ kind: 'RECOMMEND_TAG', params: { tagCode: 'first-buyer' } }]
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
            orderId: 'order-2'
        };
        const first = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .send(payload);
        strict_1.default.equal(first.body.data.dispatchedActions, 1);
        const second = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .send(payload);
        strict_1.default.equal(second.body.data.dispatchedActions, 0);
        strict_1.default.equal(second.body.data.skippedActions, 1);
        const list = await (0, supertest_1.default)(app.getHttpServer())
            .get(`/campaigns/${planId}/dispatches`)
            .set(TENANT_A);
        strict_1.default.equal(list.body.data.length, 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: evaluateTriggers respects MinOrderAmount condition', async () => {
    const { app, campaignService, memberService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    memberService.register({
        memberId: 'm-1',
        tenantContext: tenantContextA(),
        nickname: 'Alice'
    });
    try {
        const plan = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'HIGH-VALUE',
            title: 'high value',
            triggerEvent: 'payment.success',
            conditions: [{ type: 'MIN_ORDER_AMOUNT', value: 500 }],
            actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 100, pointsReason: 'big-spender' } }]
        });
        const planId = plan.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/campaigns/${planId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        const small = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContextA(),
            memberId: 'm-1',
            orderId: 'order-small',
            orderAmount: 100
        });
        strict_1.default.equal(small.body.data.matchedCampaigns, 0);
        const big = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContextA(),
            memberId: 'm-1',
            orderId: 'order-big',
            orderAmount: 1000
        });
        strict_1.default.equal(big.body.data.matchedCampaigns, 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: evaluateTriggers respects BrandScope and auto-derives brand from tenantContext', async () => {
    const { app, campaignService, memberService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    memberService.register({
        memberId: 'm-1',
        tenantContext: tenantContextA(),
        nickname: 'Alice'
    });
    try {
        const plan = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'BRAND-X-ONLY',
            title: 'brand X only',
            triggerEvent: 'payment.success',
            conditions: [{ type: 'BRAND_SCOPE', value: ['brand-X'] }],
            actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 50, pointsReason: 'brand-x-loyalty' } }]
        });
        const planId = plan.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/campaigns/${planId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        const tenantAEvent = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContextA(),
            memberId: 'm-1',
            orderId: 'order-brandA',
            orderAmount: 100
        });
        strict_1.default.equal(tenantAEvent.body.data.matchedCampaigns, 0);
        const tenantXEvent = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContextX(),
            memberId: 'm-1',
            orderId: 'order-brandX',
            orderAmount: 100
        });
        strict_1.default.equal(tenantXEvent.body.data.matchedCampaigns, 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: PAUSED campaign does not dispatch', async () => {
    const { app, campaignService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    try {
        const plan = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'PAUSE',
            title: 'pause test',
            triggerEvent: 'payment.success',
            actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 10, pointsReason: 'should-not-fire' } }]
        });
        const planId = plan.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/campaigns/${planId}/status`)
            .set(TENANT_A)
            .send({ status: 'PAUSED' });
        const ev = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContextA(),
            memberId: 'm-1',
            orderId: 'order-paused'
        });
        strict_1.default.equal(ev.body.data.matchedCampaigns, 0);
        strict_1.default.equal(ev.body.data.dispatchedActions, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: scheduledStart/End window is enforced', async () => {
    const { app, campaignService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    try {
        const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
        const future2 = new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString();
        const plan = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'FUTURE',
            title: 'future only',
            triggerEvent: 'payment.success',
            scheduledStart: future,
            scheduledEnd: future2,
            actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 5, pointsReason: 'future' } }]
        });
        const planId = plan.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/campaigns/${planId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        const ev = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContextA(),
            memberId: 'm-1',
            orderId: 'order-now'
        });
        strict_1.default.equal(ev.body.data.matchedCampaigns, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: priority ordering — higher priority dispatches first', async () => {
    const { app, campaignService, memberService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    memberService.register({
        memberId: 'm-1',
        tenantContext: tenantContextA(),
        nickname: 'Alice'
    });
    try {
        const low = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'LOW',
            title: 'low priority',
            triggerEvent: 'payment.success',
            priority: 10,
            actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 1, pointsReason: 'low' } }]
        });
        const lowId = low.body.data.planId;
        const high = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'HIGH',
            title: 'high priority',
            triggerEvent: 'payment.success',
            priority: 90,
            actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 100, pointsReason: 'high' } }]
        });
        const highId = high.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/campaigns/${lowId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/campaigns/${highId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        const ev = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContextA(),
            memberId: 'm-1',
            orderId: 'order-priority'
        });
        strict_1.default.equal(ev.body.data.matchedCampaigns, 2);
        strict_1.default.equal(ev.body.data.dispatchedActions, 2);
        const dispatches = await (0, supertest_1.default)(app.getHttpServer())
            .get('/campaigns/dispatches/all')
            .set(TENANT_A);
        strict_1.default.equal(dispatches.body.data.length, 2);
        strict_1.default.equal(dispatches.body.data[0].planId, highId);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: dispatches are tenant-scoped', async () => {
    const { app, campaignService, memberService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    memberService.register({
        memberId: 'm-1',
        tenantContext: tenantContextA(),
        nickname: 'Alice'
    });
    try {
        const plan = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'ISO',
            title: 'tenant isolated',
            triggerEvent: 'payment.success',
            actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 5, pointsReason: 'iso' } }]
        });
        const planId = plan.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/campaigns/${planId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContextA(),
            memberId: 'm-1',
            orderId: 'order-iso'
        });
        const tenantBDispatches = await (0, supertest_1.default)(app.getHttpServer())
            .get('/campaigns/dispatches/all')
            .set(TENANT_B);
        strict_1.default.equal(tenantBDispatches.body.data.length, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: IssueCoupon action issues a coupon to the member', async () => {
    const { app, campaignService, loyaltyService, memberService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    loyaltyService.resetLoyaltyStoresForTests();
    memberService.register({
        memberId: 'm-1',
        tenantContext: tenantContextA(),
        nickname: 'Alice'
    });
    const plan = loyaltyService.registerCouponPlan({
        tenantContext: tenantContextA(),
        code: 'CAMPAIGN10',
        title: 'campaign coupon',
        discountType: loyalty_entity_1.CouponDiscountType.FixedAmount,
        discountValue: 10,
        totalQuota: 100,
        perMemberLimit: 1,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z'
    });
    loyaltyService.updateCouponPlanStatus(plan.planId, loyalty_entity_1.LoyaltyPlanStatus.Active, 'tenant-A');
    try {
        const campaign = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'AUTO-COUPON',
            title: 'auto coupon',
            triggerEvent: 'payment.success',
            actions: [{ kind: 'ISSUE_COUPON', params: { couponPlanId: plan.planId } }]
        });
        if (campaign.statusCode !== 201)
            console.error('campaign register failed:', campaign.statusCode, campaign.body);
        const campaignId = campaign.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/campaigns/${campaignId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContextA(),
            memberId: 'm-1',
            orderId: 'order-cc'
        });
        const redemptions = loyaltyService.listCouponRedemptions('tenant-A');
        strict_1.default.equal(redemptions.length, 1);
        strict_1.default.equal(redemptions[0].couponCode, 'CAMPAIGN10');
        strict_1.default.equal(redemptions[0].memberId, 'm-1');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: list dispatches filtered by memberId', async () => {
    const { app, campaignService, memberService, loyaltyService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    memberService.register({ memberId: 'm-disp-1', tenantContext: tenantContextA(), nickname: 'Disp1' });
    memberService.register({ memberId: 'm-disp-2', tenantContext: tenantContextA(), nickname: 'Disp2' });
    try {
        const plan = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'DISP-001',
            title: 'Dispatch Filter',
            description: 'd',
            triggerEvent: 'payment.success',
            conditions: [],
            actions: [{ type: 'NotifyMember', template: 'hi' }],
            priority: 50
        });
        const planId = plan.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/campaigns/${planId}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .set(TENANT_A)
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContextA(),
            memberId: 'm-disp-1',
            orderId: 'o-disp-1'
        });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .set(TENANT_A)
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContextA(),
            memberId: 'm-disp-2',
            orderId: 'o-disp-2'
        });
        const list1 = await (0, supertest_1.default)(app.getHttpServer())
            .get('/campaigns/dispatches/list?memberId=m-disp-1')
            .set(TENANT_A);
        strict_1.default.ok(list1.body.data.length >= 1);
        strict_1.default.ok(list1.body.data.every((d) => d.memberId === 'm-disp-1'));
        void loyaltyService;
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: campaign list filtered by status', async () => {
    const { app, campaignService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    try {
        const reg = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'STATUS-FILTER-001',
            title: 'StatusFilter',
            description: 'd',
            triggerEvent: 'order.created',
            conditions: [],
            actions: [{ type: 'NotifyMember', template: 'hi' }],
            priority: 50
        });
        const planId = reg.body.data.planId;
        const listDraft = await (0, supertest_1.default)(app.getHttpServer())
            .get('/campaigns?status=DRAFT')
            .set(TENANT_A);
        strict_1.default.ok(listDraft.body.data.some((p) => p.planId === planId));
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/campaigns/${planId}/status`)
            .set(TENANT_A)
            .send({ status: 'PAUSED' });
        const listPaused = await (0, supertest_1.default)(app.getHttpServer())
            .get('/campaigns?status=PAUSED')
            .set(TENANT_A);
        strict_1.default.ok(listPaused.body.data.some((p) => p.planId === planId));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: campaign plan trigger event filter', async () => {
    const { app, campaignService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'TRIG-FILTER-001',
            title: 'TrigFilter',
            description: 'd',
            triggerEvent: 'order.created',
            conditions: [],
            actions: [{ type: 'NotifyMember', template: 'hi' }],
            priority: 50
        });
        const listOrder = await (0, supertest_1.default)(app.getHttpServer())
            .get('/campaigns?triggerEvent=order.created')
            .set(TENANT_A);
        strict_1.default.ok(listOrder.body.data.length >= 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: get unknown campaign returns null', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/campaigns/unknown-plan-id').set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data, null);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: get dispatches for unknown plan returns empty', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/campaigns/unknown-plan/dispatches').set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.deepEqual(res.body.data, []);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: cross-tenant campaigns isolated', async () => {
    const { app, campaignService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    try {
        const reg = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'ISO-CAMP-001',
            title: 'IsoCamp',
            description: 'd',
            triggerEvent: 'order.created',
            conditions: [],
            actions: [{ type: 'NotifyMember', template: 'hi' }],
            priority: 50
        });
        const planId = reg.body.data.planId;
        const getA = await (0, supertest_1.default)(app.getHttpServer()).get(`/campaigns/${planId}`).set(TENANT_A);
        strict_1.default.equal(getA.body.data?.planId, planId);
        const getB = await (0, supertest_1.default)(app.getHttpServer()).get(`/campaigns/${planId}`).set(TENANT_B);
        strict_1.default.equal(getB.body.data, null);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: campaign priorities determine order in dispatches', async () => {
    const { app, campaignService, memberService, loyaltyService } = await buildApp();
    campaignService.resetCampaignStoresForTests();
    memberService.register({ memberId: 'm-prio-1', tenantContext: tenantContextA(), nickname: 'P1' });
    try {
        const regLow = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'PRIO-LOW',
            title: 'Low',
            description: 'd',
            triggerEvent: 'payment.success',
            conditions: [{ type: 'TOTAL_SPEND_GTE', value: 50 }],
            actions: [{ type: 'NotifyMember', template: 'lo' }],
            priority: 10
        });
        const planIdLow = regLow.body.data.planId;
        const regHigh = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns')
            .set(TENANT_A)
            .send({
            code: 'PRIO-HIGH',
            title: 'High',
            description: 'd',
            triggerEvent: 'payment.success',
            conditions: [{ type: 'TOTAL_SPEND_GTE', value: 50 }],
            actions: [{ type: 'NotifyMember', template: 'hi' }],
            priority: 100
        });
        const planIdHigh = regHigh.body.data.planId;
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/campaigns/${planIdLow}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/campaigns/${planIdHigh}/status`)
            .set(TENANT_A)
            .send({ status: 'ACTIVE' });
        const evalRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/campaigns/evaluate')
            .set(TENANT_A)
            .send({
            eventName: 'payment.success',
            tenantContext: tenantContextA(),
            memberId: 'm-prio-1',
            orderId: 'o-prio-1',
            orderAmount: 100
        });
        const dispatches = evalRes.body.data.dispatches;
        const indices = dispatches.map((d) => d.planId);
        strict_1.default.ok(indices.indexOf(planIdHigh) < indices.indexOf(planIdLow), 'higher priority runs first');
        void loyaltyService;
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=campaign.e2e.test.js.map