"use strict";
/**
 * E2E: Notification 通知模块 HTTP 链路
 *
 * 链路:
 *   HTTP → NotificationController → NotificationService → MapStore
 *
 * 验证:
 *   - POST /notifications/templates     - 注册模板
 *   - GET  /notifications/templates     - 模板列表/筛选
 *   - GET  /notifications/templates/:id - 模板详情
 *   - PATCH /notifications/templates/:id - 更新模板
 *   - POST /notifications/send          - 发送通知
 *   - GET  /notifications/dispatches    - 调度列表/筛选
 *   - GET  /notifications/dispatches/:id - 调度详情
 *   - POST /notifications/dispatches/:id/retry  - 重试
 *   - POST /notifications/dispatches/:id/cancel - 取消
 *   - 模板不存在时的边界行为
 *   - 调度不存在时的边界行为
 *   - 发送失败通知后重试
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
const notification_service_1 = require("./notification.service");
const notification_entity_1 = require("./notification.entity");
const notification_contract_1 = require("./notification.contract");
const notification_dto_1 = require("./notification.dto");
function attachTenantContext(req, _res, next) {
    const ctx = req;
    ctx.tenantContext = {
        tenantId: req.header('x-tenant-id') ?? 'tenant-notify',
        brandId: req.header('x-brand-id') ?? 'brand-notify',
        storeId: req.header('x-store-id') ?? 'store-notify',
        marketCode: req.header('x-market-code') ?? 'cn-mainland'
    };
    next();
}
/** 内嵌 controller, 用 @Req() 取 tenantContext 而不是 @TenantContext() 自定义装饰器 */
let TestNotificationController = class TestNotificationController {
    notificationService;
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    registerTemplate(req, body) {
        const tenantContext = req.tenantContext;
        const template = this.notificationService.registerTemplate({
            code: body.code,
            channel: body.channel,
            scopeType: body.scopeType,
            tenantId: body.tenantId ?? tenantContext.tenantId,
            brandId: body.brandId ?? tenantContext.brandId,
            storeId: body.storeId ?? tenantContext.storeId,
            marketCode: body.marketCode ?? tenantContext.marketCode,
            locale: body.locale,
            titleTemplate: body.titleTemplate,
            bodyTemplate: body.bodyTemplate,
            variables: body.variables,
            enabled: body.enabled
        });
        return (0, notification_contract_1.toNotificationTemplateContract)(template);
    }
    listTemplates(req, channel, scopeType, enabled) {
        const tenantContext = req.tenantContext;
        return this.notificationService
            .listTemplates({
            channel,
            scopeType,
            tenantId: tenantContext.tenantId,
            enabled: enabled !== undefined ? enabled === 'true' : undefined
        })
            .map(notification_contract_1.toNotificationTemplateContract);
    }
    getTemplate(id) {
        const template = this.notificationService.getTemplate(id);
        return template ? (0, notification_contract_1.toNotificationTemplateContract)(template) : null;
    }
    updateTemplate(id, body) {
        const template = this.notificationService.updateTemplate(id, body);
        return template ? (0, notification_contract_1.toNotificationTemplateContract)(template) : null;
    }
    send(req, body) {
        const tenantContext = req.tenantContext;
        const dispatch = this.notificationService.send({
            templateCode: body.templateCode,
            channel: body.channel,
            scopeType: body.scopeType,
            tenantId: body.tenantId ?? tenantContext.tenantId,
            brandId: body.brandId ?? tenantContext.brandId,
            storeId: body.storeId ?? tenantContext.storeId,
            recipient: body.recipient,
            payload: body.payload,
            scheduledAt: body.scheduledAt
        });
        return (0, notification_contract_1.toNotificationDispatchContract)(dispatch);
    }
    listDispatches(req, status, channel, recipient) {
        const tenantContext = req.tenantContext;
        return this.notificationService
            .listDispatches({
            status,
            channel,
            tenantId: tenantContext.tenantId,
            recipient
        })
            .map(notification_contract_1.toNotificationDispatchContract);
    }
    getDispatch(id) {
        const dispatch = this.notificationService.getDispatch(id);
        return dispatch ? (0, notification_contract_1.toNotificationDispatchContract)(dispatch) : null;
    }
    retryDispatch(id) {
        const dispatch = this.notificationService.retryDispatch(id);
        return dispatch ? (0, notification_contract_1.toNotificationDispatchContract)(dispatch) : null;
    }
    cancelDispatch(id) {
        const dispatch = this.notificationService.cancelDispatch(id);
        return dispatch ? (0, notification_contract_1.toNotificationDispatchContract)(dispatch) : null;
    }
};
__decorate([
    (0, common_1.Post)('templates'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, notification_dto_1.RegisterNotificationTemplateDto]),
    __metadata("design:returntype", void 0)
], TestNotificationController.prototype, "registerTemplate", null);
__decorate([
    (0, common_1.Get)('templates'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('channel')),
    __param(2, (0, common_1.Query)('scopeType')),
    __param(3, (0, common_1.Query)('enabled')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], TestNotificationController.prototype, "listTemplates", null);
__decorate([
    (0, common_1.Get)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestNotificationController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Patch)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, notification_dto_1.UpdateNotificationTemplateDto]),
    __metadata("design:returntype", void 0)
], TestNotificationController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Post)('send'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, notification_dto_1.SendNotificationDto]),
    __metadata("design:returntype", void 0)
], TestNotificationController.prototype, "send", null);
__decorate([
    (0, common_1.Get)('dispatches'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('channel')),
    __param(3, (0, common_1.Query)('recipient')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], TestNotificationController.prototype, "listDispatches", null);
__decorate([
    (0, common_1.Get)('dispatches/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestNotificationController.prototype, "getDispatch", null);
__decorate([
    (0, common_1.Post)('dispatches/:id/retry'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestNotificationController.prototype, "retryDispatch", null);
__decorate([
    (0, common_1.Post)('dispatches/:id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestNotificationController.prototype, "cancelDispatch", null);
TestNotificationController = __decorate([
    (0, common_1.Controller)('notifications'),
    __param(0, (0, common_1.Inject)(notification_service_1.NotificationService)),
    __metadata("design:paramtypes", [notification_service_1.NotificationService])
], TestNotificationController);
function makeApp() {
    return testing_1.Test.createTestingModule({
        controllers: [TestNotificationController],
        providers: [notification_service_1.NotificationService]
    }).compile();
}
// ── 测试套件 ──
(0, node_test_1.default)('Notification E2E: POST /notifications/templates 注册模板 - 正向', async (t) => {
    const moduleFixture = await makeApp();
    const app = moduleFixture.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    const res = await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/templates')
        .send({
        code: 'welcome-email',
        channel: 'EMAIL',
        scopeType: 'TENANT',
        locale: 'zh-CN',
        bodyTemplate: '欢迎 {{username}} 加入 {{tenantName}}',
        variables: ['username', 'tenantName'],
        enabled: true
    })
        .expect(201);
    strict_1.default.equal(res.body.data.code, 'welcome-email');
    strict_1.default.equal(res.body.data.channel, 'EMAIL');
    strict_1.default.equal(res.body.data.locale, 'zh-CN');
    strict_1.default.ok(res.body.data.id, 'should have id');
    strict_1.default.ok(res.body.data.createdAt, 'should have createdAt');
    await app.close();
});
(0, node_test_1.default)('Notification E2E: POST /notifications/templates 带 head 租户上下文', async (t) => {
    const moduleFixture = await makeApp();
    const app = moduleFixture.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    const res = await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/templates')
        .set('x-tenant-id', 't-head-001')
        .set('x-brand-id', 'b-head-001')
        .send({
        code: 'order-sms',
        channel: 'SMS',
        scopeType: 'STORE',
        locale: 'en-US',
        bodyTemplate: 'Order {{orderId}} confirmed'
    })
        .expect(201);
    strict_1.default.equal(res.body.data.code, 'order-sms');
    strict_1.default.equal(res.body.data.channel, 'SMS');
    strict_1.default.equal(res.body.data.tenantId, 't-head-001');
    strict_1.default.equal(res.body.data.brandId, 'b-head-001');
    await app.close();
});
(0, node_test_1.default)('Notification E2E: GET /notifications/templates 列表与筛选', async (t) => {
    const moduleFixture = await makeApp();
    const app = moduleFixture.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    // 注册两条模板
    await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/templates')
        .send({ code: 'tpl-a', channel: 'EMAIL', scopeType: 'TENANT', locale: 'zh-CN', bodyTemplate: 'A' })
        .expect(201);
    await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/templates')
        .send({ code: 'tpl-b', channel: 'SMS', scopeType: 'STORE', locale: 'en-US', bodyTemplate: 'B' })
        .expect(201);
    // 全部查询
    const all = await (0, supertest_1.default)(app.getHttpServer())
        .get('/notifications/templates')
        .expect(200);
    strict_1.default.ok(all.body.data.length >= 2);
    // 按 channel 筛选
    const byChannel = await (0, supertest_1.default)(app.getHttpServer())
        .get('/notifications/templates?channel=EMAIL')
        .expect(200);
    for (const tpl of byChannel.body.data) {
        strict_1.default.equal(tpl.channel, 'EMAIL');
    }
    // 按 scopeType 筛选
    const byScope = await (0, supertest_1.default)(app.getHttpServer())
        .get('/notifications/templates?scopeType=STORE')
        .expect(200);
    for (const tpl of byScope.body.data) {
        strict_1.default.equal(tpl.scopeType, 'STORE');
    }
    await app.close();
});
(0, node_test_1.default)('Notification E2E: GET /notifications/templates/:id 模板详情', async (t) => {
    const moduleFixture = await makeApp();
    const app = moduleFixture.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    const created = await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/templates')
        .send({ code: 'detail-tpl', channel: 'PUSH', scopeType: 'BRAND', locale: 'ja-JP', bodyTemplate: 'こんにちは' })
        .expect(201);
    const tplId = created.body.data.id;
    const res = await (0, supertest_1.default)(app.getHttpServer())
        .get(`/notifications/templates/${tplId}`)
        .expect(200);
    strict_1.default.equal(res.body.data.id, tplId);
    strict_1.default.equal(res.body.data.code, 'detail-tpl');
    // 不存在的 id
    const missing = await (0, supertest_1.default)(app.getHttpServer())
        .get('/notifications/templates/nonexistent')
        .expect(200);
    strict_1.default.equal(missing.body.data, null);
    await app.close();
});
(0, node_test_1.default)('Notification E2E: PATCH /notifications/templates/:id 更新模板', async (t) => {
    const moduleFixture = await makeApp();
    const app = moduleFixture.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    const created = await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/templates')
        .send({ code: 'patch-tpl', channel: 'IN_APP', scopeType: 'TENANT', locale: 'zh-CN', bodyTemplate: 'old body' })
        .expect(201);
    const tplId = created.body.data.id;
    const updated = await (0, supertest_1.default)(app.getHttpServer())
        .patch(`/notifications/templates/${tplId}`)
        .send({ bodyTemplate: 'new body', enabled: false })
        .expect(200);
    strict_1.default.equal(updated.body.data.bodyTemplate, 'new body');
    strict_1.default.equal(updated.body.data.enabled, false);
    // 更新不存在的
    const missing = await (0, supertest_1.default)(app.getHttpServer())
        .patch('/notifications/templates/no-such-id')
        .send({ enabled: true })
        .expect(200);
    strict_1.default.equal(missing.body.data, null);
    await app.close();
});
(0, node_test_1.default)('Notification E2E: POST /notifications/send 发送通知', async (t) => {
    const moduleFixture = await makeApp();
    const app = moduleFixture.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    const res = await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/send')
        .send({
        channel: 'EMAIL',
        scopeType: 'TENANT',
        recipient: 'user@example.com',
        payload: { orderId: 'ORD-001', amount: 99.9 }
    })
        .expect(201);
    strict_1.default.equal(res.body.data.channel, 'EMAIL');
    strict_1.default.equal(res.body.data.recipient, 'user@example.com');
    strict_1.default.equal(res.body.data.status, 'SENT');
    strict_1.default.equal(res.body.data.payload.orderId, 'ORD-001');
    strict_1.default.ok(res.body.data.providerResponse, 'should have provider response');
    strict_1.default.equal(res.body.data.retryCount, 0);
    await app.close();
});
(0, node_test_1.default)('Notification E2E: POST /notifications/send 关联模板发送', async (t) => {
    const moduleFixture = await makeApp();
    const app = moduleFixture.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    const tpl = await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/templates')
        .send({ code: 'linked-tpl', channel: 'SMS', scopeType: 'STORE', locale: 'zh-CN', bodyTemplate: '验证码 {{code}}' })
        .expect(201);
    const res = await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/send')
        .send({
        templateCode: 'linked-tpl',
        channel: 'SMS',
        scopeType: 'STORE',
        recipient: '+8613800138000',
        payload: { code: '123456' }
    })
        .expect(201);
    strict_1.default.equal(res.body.data.templateId, tpl.body.data.id);
    strict_1.default.equal(res.body.data.status, 'SENT');
    await app.close();
});
(0, node_test_1.default)('Notification E2E: POST /notifications/send 失败通知', async (t) => {
    const moduleFixture = await makeApp();
    const app = moduleFixture.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    const res = await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/send')
        .send({
        channel: 'WEBHOOK',
        scopeType: 'TENANT',
        recipient: 'fail-webhook@example.com',
        payload: { event: 'test' }
    })
        .expect(201);
    strict_1.default.equal(res.body.data.status, 'FAILED');
    strict_1.default.ok(res.body.data.providerResponse);
    strict_1.default.equal(res.body.data.providerResponse.error, 'PROVIDER_REJECTED');
    await app.close();
});
(0, node_test_1.default)('Notification E2E: GET /notifications/dispatches 调度列表与筛选', async (t) => {
    const moduleFixture = await makeApp();
    const app = moduleFixture.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/send')
        .send({ channel: 'EMAIL', scopeType: 'TENANT', recipient: 'a@x.com', payload: {} })
        .expect(201);
    await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/send')
        .send({ channel: 'SMS', scopeType: 'STORE', recipient: 'fail-test@x.com', payload: {} })
        .expect(201);
    const all = await (0, supertest_1.default)(app.getHttpServer())
        .get('/notifications/dispatches')
        .expect(200);
    strict_1.default.ok(all.body.data.length >= 2);
    const sent = await (0, supertest_1.default)(app.getHttpServer())
        .get('/notifications/dispatches?status=SENT')
        .expect(200);
    for (const d of sent.body.data) {
        strict_1.default.equal(d.status, 'SENT');
    }
    const failed = await (0, supertest_1.default)(app.getHttpServer())
        .get('/notifications/dispatches?status=FAILED')
        .expect(200);
    for (const d of failed.body.data) {
        strict_1.default.equal(d.status, 'FAILED');
    }
    const byChannel = await (0, supertest_1.default)(app.getHttpServer())
        .get('/notifications/dispatches?channel=SMS')
        .expect(200);
    for (const d of byChannel.body.data) {
        strict_1.default.equal(d.channel, 'SMS');
    }
    const byRecipient = await (0, supertest_1.default)(app.getHttpServer())
        .get('/notifications/dispatches?recipient=a@x.com')
        .expect(200);
    for (const d of byRecipient.body.data) {
        strict_1.default.equal(d.recipient, 'a@x.com');
    }
    await app.close();
});
(0, node_test_1.default)('Notification E2E: GET /notifications/dispatches/:id 调度详情', async (t) => {
    const moduleFixture = await makeApp();
    const app = moduleFixture.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    const sent = await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/send')
        .send({ channel: 'PUSH', scopeType: 'BRAND', recipient: 'device-001', payload: { title: 'Hi' } })
        .expect(201);
    const dispatchId = sent.body.data.id;
    const res = await (0, supertest_1.default)(app.getHttpServer())
        .get(`/notifications/dispatches/${dispatchId}`)
        .expect(200);
    strict_1.default.equal(res.body.data.id, dispatchId);
    strict_1.default.equal(res.body.data.status, 'SENT');
    const missing = await (0, supertest_1.default)(app.getHttpServer())
        .get('/notifications/dispatches/no-dispatch')
        .expect(200);
    strict_1.default.equal(missing.body.data, null);
    await app.close();
});
(0, node_test_1.default)('Notification E2E: POST /notifications/dispatches/:id/retry 重试失败通知', async (t) => {
    const moduleFixture = await makeApp();
    const app = moduleFixture.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    const sent = await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/send')
        .send({ channel: 'EMAIL', scopeType: 'TENANT', recipient: 'fail-retry@x.com', payload: {} })
        .expect(201);
    const dispatchId = sent.body.data.id;
    strict_1.default.equal(sent.body.data.status, 'FAILED');
    strict_1.default.equal(sent.body.data.retryCount, 0);
    const retried = await (0, supertest_1.default)(app.getHttpServer())
        .post(`/notifications/dispatches/${dispatchId}/retry`)
        .expect(201);
    strict_1.default.equal(retried.body.data.retryCount, 1);
    strict_1.default.equal(retried.body.data.status, 'FAILED');
    const missing = await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/dispatches/nonexistent/retry')
        .expect(201);
    strict_1.default.equal(missing.body.data, null);
    await app.close();
});
(0, node_test_1.default)('Notification E2E: POST /notifications/dispatches/:id/retry 对已成功不变', async (t) => {
    const moduleFixture = await makeApp();
    const app = moduleFixture.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    const sent = await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/send')
        .send({ channel: 'IN_APP', scopeType: 'TENANT', recipient: 'success-user', payload: {} })
        .expect(201);
    const dispatchId = sent.body.data.id;
    strict_1.default.equal(sent.body.data.status, 'SENT');
    const retried = await (0, supertest_1.default)(app.getHttpServer())
        .post(`/notifications/dispatches/${dispatchId}/retry`)
        .expect(201);
    strict_1.default.equal(retried.body.data.status, 'SENT');
    strict_1.default.equal(retried.body.data.retryCount, 0);
    await app.close();
});
(0, node_test_1.default)('Notification E2E: POST /notifications/dispatches/:id/cancel 取消通知', async (t) => {
    const moduleFixture = await makeApp();
    const app = moduleFixture.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    const sent = await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/send')
        .send({ channel: 'SOCIAL', scopeType: 'TENANT', recipient: 'user-social', payload: {} })
        .expect(201);
    const cancelled = await (0, supertest_1.default)(app.getHttpServer())
        .post(`/notifications/dispatches/${sent.body.data.id}/cancel`)
        .expect(201);
    strict_1.default.equal(cancelled.body.data.status, 'SENT'); // 已发送的不能取消
    const missing = await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/dispatches/fake-id/cancel')
        .expect(201);
    strict_1.default.equal(missing.body.data, null);
    await app.close();
});
(0, node_test_1.default)('Notification E2E: 端到端模板→发送→查询→取消流程', async (t) => {
    const moduleFixture = await makeApp();
    const app = moduleFixture.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    const tpl = await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/templates')
        .send({
        code: 'full-flow',
        channel: 'EMAIL',
        scopeType: 'BRAND',
        locale: 'en-US',
        titleTemplate: 'Your Order',
        bodyTemplate: 'Order {{orderId}} is {{status}}',
        variables: ['orderId', 'status']
    })
        .expect(201);
    strict_1.default.equal(tpl.body.data.variables.length, 2);
    const dispatch = await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/send')
        .send({
        templateCode: 'full-flow',
        channel: 'EMAIL',
        scopeType: 'BRAND',
        recipient: 'flow@example.com',
        payload: { orderId: 'FLOW-001', status: 'confirmed' }
    })
        .expect(201);
    strict_1.default.equal(dispatch.body.data.templateId, tpl.body.data.id);
    const detail = await (0, supertest_1.default)(app.getHttpServer())
        .get(`/notifications/dispatches/${dispatch.body.data.id}`)
        .expect(200);
    strict_1.default.equal(detail.body.data.recipient, 'flow@example.com');
    const templates = await (0, supertest_1.default)(app.getHttpServer())
        .get('/notifications/templates?channel=EMAIL')
        .expect(200);
    const found = templates.body.data.find((t) => t.code === 'full-flow');
    strict_1.default.ok(found, 'full-flow template should exist in filtered list');
    await app.close();
});
(0, node_test_1.default)('Notification E2E: 边界 - 大量模板注册与列表查询', async (t) => {
    const moduleFixture = await makeApp();
    const app = moduleFixture.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    const count = 10;
    for (let i = 0; i < count; i++) {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/notifications/templates')
            .send({ code: `bulk-${i}`, channel: 'EMAIL', scopeType: 'TENANT', locale: 'zh-CN', bodyTemplate: `template ${i}` })
            .expect(201);
    }
    const list = await (0, supertest_1.default)(app.getHttpServer())
        .get('/notifications/templates')
        .expect(200);
    strict_1.default.ok(list.body.data.length >= count);
    await app.close();
});
(0, node_test_1.default)('Notification E2E: 带 scheduledAt 的定时发送', async (t) => {
    const moduleFixture = await makeApp();
    const app = moduleFixture.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const res = await (0, supertest_1.default)(app.getHttpServer())
        .post('/notifications/send')
        .send({
        channel: 'PUSH',
        scopeType: 'STORE',
        recipient: 'device-scheduled',
        payload: { reminder: 'tomorrow' },
        scheduledAt: futureDate
    })
        .expect(201);
    strict_1.default.equal(res.body.data.scheduledAt, futureDate);
    strict_1.default.equal(res.body.data.status, 'SENT');
    await app.close();
});
//# sourceMappingURL=notification.e2e.test.js.map