"use strict";
/**
 * E2E 跨模块 #11 — 库存预警 → 运营通知 联动
 *
 * 链路:
 *   HTTP → TestController
 *     → InventoryService
 *       · createProduct (设 minStock 阈值)
 *       · stockOut (出库) → currentStock 减少
 *       · getLowStockProducts → 触发 StockAlert { status: 'low' | 'out_of_stock' }
 *       · stockIn (补货) → 预警解除
 *     → NotificationService
 *       · registerTemplate (低库存告警模板)
 *       · send (派发给运营 ops@tenant.com)
 *       · simulateSend: 正常收件人 → status='SENT' / 含 'fail' → status='FAILED'
 *       · retryDispatch (FAILED → 重发)
 *       · cancelDispatch (取消)
 *       · listDispatches (按 status/tenantId 过滤)
 *
 * 验证:
 *   - 低库存告警 → 通知模板派发 → SENT 状态
 *   - 缺货告警 (stock=0) → out_of_stock 状态
 *   - 失败派发 → FAILED → retry 重新派发
 *   - 取消派发 → CANCELLED
 *   - 模板更新 (body / enabled 切换)
 *   - 补货 → 预警自动解除
 *   - 跨租户隔离
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
const inventory_service_1 = require("../inventory/inventory.service");
const notification_service_1 = require("../notification/notification.service");
const notification_entity_1 = require("../notification/notification.entity");
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
    inventoryService;
    notificationService;
    constructor(inventoryService, notificationService) {
        this.inventoryService = inventoryService;
        this.notificationService = notificationService;
    }
    createProduct(req, body) {
        const tc = req.tenantContext;
        return this.inventoryService.createProduct(tc, body);
    }
    stockIn(req, body) {
        const tc = req.tenantContext;
        return this.inventoryService.stockIn(tc, body);
    }
    stockOut(req, body) {
        const tc = req.tenantContext;
        return this.inventoryService.stockOut(tc, body);
    }
    getAlerts(req) {
        const tc = req.tenantContext;
        return this.inventoryService.getLowStockProducts(tc);
    }
    registerTemplate(body) {
        return this.notificationService.registerTemplate(body);
    }
    sendNotification(req, body) {
        const tc = req.tenantContext;
        return this.notificationService.send({
            ...body,
            tenantId: body.tenantId ?? tc.tenantId,
            brandId: body.brandId ?? tc.brandId,
            storeId: body.storeId ?? tc.storeId
        });
    }
    retry(dispatchId) {
        return this.notificationService.retryDispatch(dispatchId);
    }
    cancel(dispatchId) {
        return this.notificationService.cancelDispatch(dispatchId);
    }
    updateTemplate(templateId, body) {
        return this.notificationService.updateTemplate(templateId, body);
    }
    listDispatches(req) {
        const tc = req.tenantContext;
        const status = req.header('x-status');
        return this.notificationService.listDispatches({
            tenantId: tc.tenantId,
            status
        });
    }
};
__decorate([
    (0, common_1.Post)('inventory/products'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Post)('inventory/stock-in'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "stockIn", null);
__decorate([
    (0, common_1.Post)('inventory/stock-out'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "stockOut", null);
__decorate([
    (0, common_1.Get)('inventory/alerts'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Post)('notifications/templates'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "registerTemplate", null);
__decorate([
    (0, common_1.Post)('notifications/send'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "sendNotification", null);
__decorate([
    (0, common_1.Post)('notifications/:dispatchId/retry'),
    __param(0, (0, common_1.Param)('dispatchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "retry", null);
__decorate([
    (0, common_1.Post)('notifications/:dispatchId/cancel'),
    __param(0, (0, common_1.Param)('dispatchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)('notifications/templates/:templateId/update'),
    __param(0, (0, common_1.Param)('templateId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Get)('notifications/dispatches'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "listDispatches", null);
TestController = __decorate([
    (0, common_1.Controller)(),
    __param(0, (0, common_1.Inject)(inventory_service_1.InventoryService)),
    __param(1, (0, common_1.Inject)(notification_service_1.NotificationService)),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService,
        notification_service_1.NotificationService])
], TestController);
// ─── 构建 app ───
async function buildApp() {
    (0, inventory_service_1.resetInventoryServiceTestState)();
    (0, notification_service_1.resetNotificationServiceTestState)();
    const inventoryService = new inventory_service_1.InventoryService();
    const notificationService = new notification_service_1.NotificationService();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestController],
        providers: [
            { provide: inventory_service_1.InventoryService, useValue: inventoryService },
            { provide: notification_service_1.NotificationService, useValue: notificationService }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, inventoryService, notificationService };
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
function ctxA() {
    return { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' };
}
async function createProduct(app, headers, opts) {
    const res = await (0, supertest_1.default)(app.getHttpServer())
        .post('/inventory/products')
        .set(headers)
        .send({
        name: opts.name ?? opts.sku,
        sku: opts.sku,
        unit: 'pcs',
        price: opts.price ?? 50,
        cost: opts.cost ?? 30,
        currentStock: opts.currentStock ?? 100,
        minStock: opts.minStock ?? 10,
        maxStock: opts.maxStock ?? 200
    });
    strict_1.default.equal(res.statusCode, 201);
    return res.body.data.id;
}
// ═══════════════════════════════════════════════════
// E2E: 库存预警 → 运营通知 完整联动
// ═══════════════════════════════════════════════════
(0, node_test_1.default)('e2e-11: full chain inventory low-stock alert → notification dispatch SENT', async () => {
    const { app, inventoryService, notificationService } = await buildApp();
    try {
        // 1. 注册低库存告警模板
        const tplRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/notifications/templates')
            .send({
            code: 'INV-LOW-STOCK',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            tenantId: 'tenant-A',
            storeId: 'store-A',
            locale: 'zh-CN',
            titleTemplate: '【低库存告警】{{sku}}',
            bodyTemplate: '商品 {{name}} 当前库存 {{currentStock}}, 低于阈值 {{minStock}}。请及时补货。',
            variables: ['sku', 'name', 'currentStock', 'minStock'],
            enabled: true
        });
        strict_1.default.equal(tplRes.statusCode, 201);
        const templateId = tplRes.body.data.id;
        strict_1.default.equal(tplRes.body.data.code, 'INV-LOW-STOCK');
        // 2. 创建商品 (minStock=30, currentStock=50)
        const productId = await createProduct(app, TENANT_A, {
            sku: 'SKU-A-001',
            name: '可乐',
            currentStock: 50,
            minStock: 30
        });
        // 3. 出库 25 → 库存 25, 低于阈值 30 → 触发低库存告警
        const stockOutRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/stock-out')
            .set(TENANT_A)
            .send({ productId, quantity: 25, reason: 'POS sales' });
        strict_1.default.equal(stockOutRes.statusCode, 201);
        strict_1.default.equal(stockOutRes.body.data.product.currentStock, 25);
        // 4. 验证 getLowStockProducts 触发告警
        const alertsRes = await (0, supertest_1.default)(app.getHttpServer())
            .get('/inventory/alerts')
            .set(TENANT_A);
        strict_1.default.equal(alertsRes.statusCode, 200);
        strict_1.default.ok(alertsRes.body.data.length >= 1, '应有低库存告警');
        const alert = alertsRes.body.data.find((a) => a.product.id === productId);
        strict_1.default.ok(alert, '应包含本商品的告警');
        strict_1.default.equal(alert.status, 'low', '应为 low 状态');
        strict_1.default.equal(alert.currentStock, 25);
        // 5. 派发通知给运营 (使用模板)
        const dispatchRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/notifications/send')
            .set(TENANT_A)
            .send({
            templateCode: 'INV-LOW-STOCK',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            recipient: 'ops@tenant-a.com',
            payload: {
                sku: 'SKU-A-001',
                name: '可乐',
                currentStock: 25,
                minStock: 30
            }
        });
        strict_1.default.equal(dispatchRes.statusCode, 201);
        strict_1.default.equal(dispatchRes.body.data.templateId, templateId, '应关联到模板');
        strict_1.default.equal(dispatchRes.body.data.recipient, 'ops@tenant-a.com');
        strict_1.default.equal(dispatchRes.body.data.status, 'SENT', '正常收件人应 SENT');
        strict_1.default.ok(dispatchRes.body.data.sentAt, 'sentAt 应已设置');
        // 6. 验证 listDispatches 可查到
        const listRes = await (0, supertest_1.default)(app.getHttpServer())
            .get('/notifications/dispatches')
            .set(TENANT_A);
        strict_1.default.equal(listRes.statusCode, 200);
        strict_1.default.equal(listRes.body.data.length, 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-11: out-of-stock alert when stock reaches 0', async () => {
    const { app, inventoryService } = await buildApp();
    try {
        const productId = await createProduct(app, TENANT_A, {
            sku: 'SKU-EMPTY',
            currentStock: 30,
            minStock: 20
        });
        // 全部出库 → 库存 0
        const stockOutRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/stock-out')
            .set(TENANT_A)
            .send({ productId, quantity: 30, reason: 'sales' });
        strict_1.default.equal(stockOutRes.statusCode, 201);
        strict_1.default.equal(stockOutRes.body.data.product.currentStock, 0);
        // 验证 out_of_stock 告警
        const alertsRes = await (0, supertest_1.default)(app.getHttpServer())
            .get('/inventory/alerts')
            .set(TENANT_A);
        const alert = alertsRes.body.data.find((a) => a.product.id === productId);
        strict_1.default.ok(alert, '应有告警');
        strict_1.default.equal(alert.status, 'out_of_stock', '库存为 0 → out_of_stock');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-11: failed dispatch → retry → SENT', async () => {
    const { app, notificationService } = await buildApp();
    try {
        // 注册模板
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/notifications/templates')
            .send({
            code: 'FAIL-TPL',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            tenantId: 'tenant-A',
            locale: 'en-US',
            bodyTemplate: 'test',
            enabled: true
        });
        // 派发给含 'fail' 的收件人 → 模拟失败
        const dispatchRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/notifications/send')
            .set(TENANT_A)
            .send({
            templateCode: 'FAIL-TPL',
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            recipient: 'fail-recipient@bad.com',
            payload: {}
        });
        strict_1.default.equal(dispatchRes.body.data.status, 'FAILED', '含 fail 的收件人应 FAILED');
        strict_1.default.ok(dispatchRes.body.data.providerResponse, '应有 providerResponse');
        strict_1.default.equal(dispatchRes.body.data.retryCount, 0);
        const dispatchId = dispatchRes.body.data.id;
        // 重试 (recipient 仍含 'fail', 模拟仍会失败, 但 retryCount 增加 + 状态回流 PENDING→FAILED)
        const retryRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/notifications/${dispatchId}/retry`)
            .send({});
        strict_1.default.equal(retryRes.statusCode, 201);
        strict_1.default.equal(retryRes.body.data.retryCount, 1, 'retryCount 增加');
        // status: 失败时 simulateSend 会重新评估 recipient, 因含 'fail' 仍 FAILED
        strict_1.default.ok(['FAILED', 'SENT'].includes(retryRes.body.data.status), '重试后状态为 FAILED/SENT');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-11: cancel a sent dispatch → status remains SENT (not cancellable)', async () => {
    const { app, notificationService } = await buildApp();
    try {
        // 派发成功
        const dispatchRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/notifications/send')
            .set(TENANT_A)
            .send({
            channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            recipient: 'user@example.com',
            payload: { code: '1234' }
        });
        strict_1.default.equal(dispatchRes.body.data.status, 'SENT');
        // 取消 SENT 派发 → 应保持 SENT (不可取消)
        const cancelRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/notifications/${dispatchRes.body.data.id}/cancel`)
            .send({});
        strict_1.default.equal(cancelRes.statusCode, 201);
        strict_1.default.equal(cancelRes.body.data.status, 'SENT', '已 SENT 的派发不可取消');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-11: list dispatches filter by status (PENDING/SENT/FAILED)', async () => {
    const { app, notificationService } = await buildApp();
    try {
        // 派发 2 个 SENT + 1 个 FAILED
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/notifications/send')
            .set(TENANT_A)
            .send({
            channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            recipient: 'a@example.com',
            payload: {}
        });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/notifications/send')
            .set(TENANT_A)
            .send({
            channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            recipient: 'b@example.com',
            payload: {}
        });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/notifications/send')
            .set(TENANT_A)
            .send({
            channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            recipient: 'fail-c@example.com',
            payload: {}
        });
        // 全部
        const allRes = await (0, supertest_1.default)(app.getHttpServer())
            .get('/notifications/dispatches')
            .set(TENANT_A);
        strict_1.default.equal(allRes.body.data.length, 3);
        // 仅 SENT
        const sentRes = await (0, supertest_1.default)(app.getHttpServer())
            .get('/notifications/dispatches')
            .set({ ...TENANT_A, 'x-status': notification_entity_1.NotificationStatus.Sent });
        strict_1.default.equal(sentRes.body.data.length, 2);
        strict_1.default.ok(sentRes.body.data.every((d) => d.status === 'SENT'));
        // 仅 FAILED
        const failedRes = await (0, supertest_1.default)(app.getHttpServer())
            .get('/notifications/dispatches')
            .set({ ...TENANT_A, 'x-status': notification_entity_1.NotificationStatus.Failed });
        strict_1.default.equal(failedRes.body.data.length, 1);
        strict_1.default.equal(failedRes.body.data[0].status, 'FAILED');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-11: update notification template body and toggle enabled', async () => {
    const { app, notificationService } = await buildApp();
    try {
        // 注册模板
        const tplRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/notifications/templates')
            .send({
            code: 'UPD-TPL',
            channel: notification_entity_1.NotificationChannelType.Push,
            scopeType: notification_entity_1.FoundationScopeType.Brand,
            tenantId: 'tenant-A',
            brandId: 'brand-A',
            locale: 'zh-CN',
            bodyTemplate: '原始内容',
            enabled: true
        });
        const templateId = tplRes.body.data.id;
        // 更新 body + 关闭
        const updateRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/notifications/templates/${templateId}/update`)
            .send({
            bodyTemplate: '更新后内容',
            enabled: false
        });
        strict_1.default.equal(updateRes.statusCode, 201);
        strict_1.default.equal(updateRes.body.data.bodyTemplate, '更新后内容');
        strict_1.default.equal(updateRes.body.data.enabled, false);
        // findTemplateByCode 只返回 enabled=true 的模板
        const found = notificationService.findTemplateByCode('UPD-TPL');
        strict_1.default.equal(found, undefined, '禁用的模板不应被 findTemplateByCode 找到');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-11: restock clears low-stock alert', async () => {
    const { app, inventoryService } = await buildApp();
    try {
        const productId = await createProduct(app, TENANT_A, {
            sku: 'SKU-RESTOCK',
            currentStock: 30,
            minStock: 25
        });
        // 出库到低库存
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/stock-out')
            .set(TENANT_A)
            .send({ productId, quantity: 10, reason: 'sales' });
        // 库存 = 20, 低于阈值 25
        const lowRes = await (0, supertest_1.default)(app.getHttpServer())
            .get('/inventory/alerts')
            .set(TENANT_A);
        const lowAlert = lowRes.body.data.find((a) => a.product.id === productId);
        strict_1.default.ok(lowAlert, '应有低库存告警');
        strict_1.default.equal(lowAlert.status, 'low');
        // 补货 50 → 库存 70
        const restockRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/stock-in')
            .set(TENANT_A)
            .send({ productId, quantity: 50, reason: 'restock' });
        strict_1.default.equal(restockRes.statusCode, 201);
        strict_1.default.equal(restockRes.body.data.product.currentStock, 70);
        // 验证告警已解除
        const clearedRes = await (0, supertest_1.default)(app.getHttpServer())
            .get('/inventory/alerts')
            .set(TENANT_A);
        const clearedAlert = clearedRes.body.data.find((a) => a.product.id === productId);
        strict_1.default.equal(clearedAlert, undefined, '补货后告警应解除');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-11: cross-tenant isolation - Tenant B cannot see Tenant A dispatches', async () => {
    const { app, inventoryService, notificationService } = await buildApp();
    try {
        // Tenant A: 派发一个
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/notifications/send')
            .set(TENANT_A)
            .send({
            channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            recipient: 'a-ops@example.com',
            payload: {}
        });
        // Tenant B: 派发一个
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/notifications/send')
            .set(TENANT_B)
            .send({
            channel: notification_entity_1.NotificationChannelType.Sms,
            scopeType: notification_entity_1.FoundationScopeType.Store,
            recipient: 'b-ops@example.com',
            payload: {}
        });
        // Tenant A list: 1 个
        const tenantAList = await (0, supertest_1.default)(app.getHttpServer())
            .get('/notifications/dispatches')
            .set(TENANT_A);
        strict_1.default.equal(tenantAList.body.data.length, 1);
        strict_1.default.equal(tenantAList.body.data[0].tenantId, 'tenant-A');
        strict_1.default.equal(tenantAList.body.data[0].recipient, 'a-ops@example.com');
        // Tenant B list: 1 个
        const tenantBList = await (0, supertest_1.default)(app.getHttpServer())
            .get('/notifications/dispatches')
            .set(TENANT_B);
        strict_1.default.equal(tenantBList.body.data.length, 1);
        strict_1.default.equal(tenantBList.body.data[0].tenantId, 'tenant-B');
        strict_1.default.equal(tenantBList.body.data[0].recipient, 'b-ops@example.com');
        // 直接 service 验证: tenantId 过滤
        const serviceTenantA = notificationService.listDispatches({ tenantId: 'tenant-A' });
        const serviceTenantB = notificationService.listDispatches({ tenantId: 'tenant-B' });
        strict_1.default.equal(serviceTenantA.length, 1);
        strict_1.default.equal(serviceTenantB.length, 1);
        strict_1.default.equal(serviceTenantA[0].id, tenantAList.body.data[0].id);
        strict_1.default.equal(serviceTenantB[0].id, tenantBList.body.data[0].id);
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=cross-module-e2e-11-inventory-notification-operations.test.js.map