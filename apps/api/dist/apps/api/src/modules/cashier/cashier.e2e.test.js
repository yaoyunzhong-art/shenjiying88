"use strict";
/**
 * E2E: Cashier 收银台 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext 中间件 → TestController → CashierService → MemberService / LoyaltyService
 *
 * 验证:
 *   - 订单 CRUD (create/get/list)
 *   - 订单创建校验 (member 必须存在 / items 非空 / tenant 一致)
 *   - 支付创建 + 状态机 (Created → PendingPayment → Paid / PaymentFailed)
 *   - 标准化支付回调 (succeeded → settlePaidOrder 联动 loyalty points / coupons)
 *   - 标准化支付回调 (failed → settleFailedOrder)
 *   - 订单关闭 (manual close / timeout close / 已支付订单不可关闭)
 *   - 跨租户访问拒绝
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
const cashier_service_1 = require("./cashier.service");
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
let TestCashierController = class TestCashierController {
    memberService;
    loyaltyService;
    cashierService;
    constructor(memberService, loyaltyService, cashierService) {
        this.memberService = memberService;
        this.loyaltyService = loyaltyService;
        this.cashierService = cashierService;
    }
    listOrders(req) {
        const tenantContext = req.tenantContext;
        return this.cashierService.listOrders(tenantContext);
    }
    getOrder(req, orderId) {
        const tenantContext = req.tenantContext;
        const order = this.cashierService.getOrder(orderId, tenantContext);
        if (!order)
            throw new Error(`Cashier order ${orderId} not found`);
        return order;
    }
    createOrder(req, body) {
        const tenantContext = req.tenantContext;
        return this.cashierService.createOrder(tenantContext, body);
    }
    createPayment(_req, orderId, body) {
        return this.cashierService.createPayment(orderId, body);
    }
    listPayments(req) {
        const tenantContext = req.tenantContext;
        return this.cashierService.listPayments(tenantContext);
    }
    applyPaymentCallback(body) {
        return this.cashierService.applyPaymentCallback(body);
    }
    manualClose(req, orderId, body) {
        const tenantContext = req.tenantContext;
        return this.cashierService.closeOrder(orderId, tenantContext, body);
    }
    timeoutClose(req, orderId) {
        const tenantContext = req.tenantContext;
        return this.cashierService.closeTimedOutOrder(orderId, tenantContext);
    }
};
__decorate([
    (0, common_1.Get)('orders'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestCashierController.prototype, "listOrders", null);
__decorate([
    (0, common_1.Get)('orders/:orderId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestCashierController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Post)('orders'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestCashierController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/payments'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TestCashierController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Get)('payments'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestCashierController.prototype, "listPayments", null);
__decorate([
    (0, common_1.Post)('payments/standardized-callback'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestCashierController.prototype, "applyPaymentCallback", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/manual-close'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TestCashierController.prototype, "manualClose", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/timeout-close'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestCashierController.prototype, "timeoutClose", null);
TestCashierController = __decorate([
    (0, common_1.Controller)('cashier'),
    __param(0, (0, common_1.Inject)(member_service_1.MemberService)),
    __param(1, (0, common_1.Inject)(loyalty_service_1.LoyaltyService)),
    __param(2, (0, common_1.Inject)(cashier_service_1.CashierService)),
    __metadata("design:paramtypes", [member_service_1.MemberService,
        loyalty_service_1.LoyaltyService,
        cashier_service_1.CashierService])
], TestCashierController);
async function buildApp() {
    (0, member_service_1.resetMemberServiceTestState)();
    const memberService = new member_service_1.MemberService();
    const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
    loyaltyService.resetLoyaltyStoresForTests();
    const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
    cashierService.resetCashierStoresForTests();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestCashierController],
        providers: [
            { provide: member_service_1.MemberService, useValue: memberService },
            { provide: loyalty_service_1.LoyaltyService, useValue: loyaltyService },
            { provide: cashier_service_1.CashierService, useValue: cashierService }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, memberService, loyaltyService, cashierService };
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
function ensureMember(memberService, memberId, ctx = tenantContextA()) {
    memberService.register({ memberId, tenantContext: ctx, nickname: `User-${memberId}` });
}
(0, node_test_1.default)('e2e: order create → get → list lifecycle with computed total', async () => {
    const { app, memberService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const create = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({
            memberId: 'm-1',
            items: [
                { skuId: 'sku-1', title: 'item-a', quantity: 2, price: 50 },
                { skuId: 'sku-2', title: 'item-b', quantity: 1, price: 30 }
            ]
        });
        strict_1.default.equal(create.statusCode, 201);
        const orderId = create.body.data.orderId;
        strict_1.default.equal(create.body.data.totalAmount, 130); // 2*50 + 1*30
        strict_1.default.equal(create.body.data.status, 'CREATED');
        const detail = await (0, supertest_1.default)(app.getHttpServer()).get(`/cashier/orders/${orderId}`).set(TENANT_A);
        strict_1.default.equal(detail.body.data.orderId, orderId);
        strict_1.default.equal(detail.body.data.totalAmount, 130);
        const list = await (0, supertest_1.default)(app.getHttpServer()).get('/cashier/orders').set(TENANT_A);
        strict_1.default.equal(list.body.data.length, 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: order creation rejects unknown member', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({
            memberId: 'm-does-not-exist',
            items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: 10 }]
        });
        strict_1.default.equal(res.statusCode, 500);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: order creation rejects empty items', async () => {
    const { app, memberService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({ memberId: 'm-1', items: [] });
        strict_1.default.equal(res.statusCode, 500);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: payment creation transitions order to PendingPayment', async () => {
    const { app, memberService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const order = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({
            memberId: 'm-1',
            items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: 100 }]
        });
        const orderId = order.body.data.orderId;
        const payRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${orderId}/payments`)
            .set(TENANT_A)
            .send({ channel: 'wechat', amount: 100, externalPaymentId: 'ext-pay-1' });
        strict_1.default.equal(payRes.statusCode, 201);
        strict_1.default.equal(payRes.body.data.status, 'PENDING');
        const orderDetail = await (0, supertest_1.default)(app.getHttpServer()).get(`/cashier/orders/${orderId}`).set(TENANT_A);
        strict_1.default.equal(orderDetail.body.data.status, 'PENDING_PAYMENT');
        strict_1.default.equal(orderDetail.body.data.latestPaymentId, payRes.body.data.paymentId);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: standardized payment callback (succeeded) → order Paid + loyalty settlePaidOrder', async () => {
    const { app, memberService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const order = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({
            memberId: 'm-1',
            items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: 200 }]
        });
        const orderId = order.body.data.orderId;
        await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${orderId}/payments`)
            .set(TENANT_A)
            .send({ channel: 'wechat', amount: 200, externalPaymentId: 'ext-pay-2' });
        const cbRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/payments/standardized-callback')
            .send({
            orderId,
            tenantId: 'tenant-A',
            externalPaymentId: 'ext-pay-2',
            channel: 'wechat',
            amount: 200,
            transactionNo: 'tx-001',
            standardizedEventName: 'cashier.payment-succeeded'
        });
        strict_1.default.equal(cbRes.statusCode, 201);
        strict_1.default.equal(cbRes.body.data.order.status, 'PAID');
        strict_1.default.equal(cbRes.body.data.payment.status, 'SUCCEEDED');
        const orderDetail = await (0, supertest_1.default)(app.getHttpServer()).get(`/cashier/orders/${orderId}`).set(TENANT_A);
        strict_1.default.equal(orderDetail.body.data.status, 'PAID');
        // Loyalty service should have awarded points via settlePaidOrder
        const summary = loyaltyService.getLoyaltySummary({ tenantId: 'tenant-A' });
        strict_1.default.ok(summary.pointsIn >= 200, `expected pointsIn >= 200 from settlement, got ${summary.pointsIn}`);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: standardized payment callback (failed) → order PaymentFailed + loyalty settleFailedOrder', async () => {
    const { app, memberService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const order = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({
            memberId: 'm-1',
            items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: 50 }]
        });
        const orderId = order.body.data.orderId;
        await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${orderId}/payments`)
            .set(TENANT_A)
            .send({ channel: 'wechat', amount: 50, externalPaymentId: 'ext-pay-fail' });
        const cbRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/payments/standardized-callback')
            .send({
            orderId,
            tenantId: 'tenant-A',
            externalPaymentId: 'ext-pay-fail',
            channel: 'wechat',
            amount: 50,
            transactionNo: 'tx-fail',
            standardizedEventName: 'cashier.payment-failed'
        });
        strict_1.default.equal(cbRes.body.data.order.status, 'PAYMENT_FAILED');
        strict_1.default.equal(cbRes.body.data.payment.status, 'FAILED');
        // Loyalty service should have recorded failed settlement (no points awarded)
        const summary = loyaltyService.getLoyaltySummary({ tenantId: 'tenant-A' });
        strict_1.default.equal(summary.pointsIn, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: manual close transitions PendingPayment → Closed', async () => {
    const { app, memberService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const order = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({
            memberId: 'm-1',
            items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: 75 }]
        });
        const orderId = order.body.data.orderId;
        await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${orderId}/payments`)
            .set(TENANT_A)
            .send({ channel: 'alipay', amount: 75 });
        const closeRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${orderId}/manual-close`)
            .set(TENANT_A)
            .send({ operator: 'op-1', reason: 'customer-request' });
        strict_1.default.equal(closeRes.body.data.order.status, 'CLOSED');
        strict_1.default.equal(closeRes.body.data.order.closeReason, 'MANUAL_CANCEL');
        strict_1.default.equal(closeRes.body.data.order.closedBy, 'op-1');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: cannot close a Paid order', async () => {
    const { app, memberService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const order = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({
            memberId: 'm-1',
            items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: 30 }]
        });
        const orderId = order.body.data.orderId;
        await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${orderId}/payments`)
            .set(TENANT_A)
            .send({ channel: 'wechat', amount: 30, externalPaymentId: 'ext-pay-cant-close' });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/payments/standardized-callback')
            .send({
            orderId,
            tenantId: 'tenant-A',
            externalPaymentId: 'ext-pay-cant-close',
            standardizedEventName: 'cashier.payment-succeeded'
        });
        const closeRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${orderId}/manual-close`)
            .set(TENANT_A)
            .send({ operator: 'op-1', reason: 'should-fail' });
        strict_1.default.equal(closeRes.statusCode, 500);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: timeout close transitions Created → Closed with PaymentTimeout reason', async () => {
    const { app, memberService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const order = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({
            memberId: 'm-1',
            items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: 20 }]
        });
        const orderId = order.body.data.orderId;
        const closeRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${orderId}/timeout-close`)
            .set(TENANT_A);
        strict_1.default.equal(closeRes.body.data.order.status, 'CLOSED');
        strict_1.default.equal(closeRes.body.data.order.closeReason, 'PAYMENT_TIMEOUT');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: orders and payments are tenant-scoped', async () => {
    const { app, memberService } = await buildApp();
    ensureMember(memberService, 'm-1', tenantContextA());
    ensureMember(memberService, 'm-B', { tenantId: 'tenant-B', brandId: 'brand-B', storeId: 'store-B', marketCode: 'cn-mainland' });
    try {
        const orderA = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({
            memberId: 'm-1',
            items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: 10 }]
        });
        const orderAId = orderA.body.data.orderId;
        const orderB = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_B)
            .send({
            memberId: 'm-B',
            items: [{ skuId: 'sku-2', title: 'y', quantity: 1, price: 20 }]
        });
        const orderBId = orderB.body.data.orderId;
        const listA = await (0, supertest_1.default)(app.getHttpServer()).get('/cashier/orders').set(TENANT_A);
        strict_1.default.equal(listA.body.data.length, 1);
        strict_1.default.equal(listA.body.data[0].orderId, orderAId);
        const listB = await (0, supertest_1.default)(app.getHttpServer()).get('/cashier/orders').set(TENANT_B);
        strict_1.default.equal(listB.body.data.length, 1);
        strict_1.default.equal(listB.body.data[0].orderId, orderBId);
        // Cross-tenant access: tenant-B cannot read tenant-A's order
        const crossGet = await (0, supertest_1.default)(app.getHttpServer()).get(`/cashier/orders/${orderAId}`).set(TENANT_B);
        strict_1.default.equal(crossGet.statusCode, 500);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: standardized payment callback rejects cross-tenant order', async () => {
    const { app, memberService } = await buildApp();
    ensureMember(memberService, 'm-1', tenantContextA());
    try {
        const order = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({
            memberId: 'm-1',
            items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: 10 }]
        });
        const orderId = order.body.data.orderId;
        const cbRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/payments/standardized-callback')
            .send({
            orderId,
            tenantId: 'tenant-B',
            externalPaymentId: 'ext-pay-cross',
            standardizedEventName: 'cashier.payment-succeeded'
        });
        strict_1.default.equal(cbRes.statusCode, 500);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: list payments returns all tenant payments', async () => {
    const { app, memberService } = await buildApp();
    ensureMember(memberService, 'm-1');
    ensureMember(memberService, 'm-2');
    try {
        const o1 = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({ memberId: 'm-1', items: [{ skuId: 'sku-1', title: 'a', quantity: 1, price: 30 }] });
        const o2 = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({ memberId: 'm-2', items: [{ skuId: 'sku-1', title: 'b', quantity: 1, price: 50 }] });
        await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${o1.body.data.orderId}/payments`)
            .set(TENANT_A)
            .send({ channel: 'wechat', amount: 30, externalPaymentId: 'ext-pay-list-1' });
        await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${o2.body.data.orderId}/payments`)
            .set(TENANT_A)
            .send({ channel: 'alipay', amount: 50, externalPaymentId: 'ext-pay-list-2' });
        const list = await (0, supertest_1.default)(app.getHttpServer()).get('/cashier/payments').set(TENANT_A);
        strict_1.default.ok(list.body.data.length >= 2);
        const channels = list.body.data.map((p) => p.channel);
        strict_1.default.ok(channels.includes('wechat'));
        strict_1.default.ok(channels.includes('alipay'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: list payments isolated by tenant', async () => {
    const { app, memberService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const o1 = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({ memberId: 'm-1', items: [{ skuId: 'sku-1', title: 'a', quantity: 1, price: 30 }] });
        await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${o1.body.data.orderId}/payments`)
            .set(TENANT_A)
            .send({ channel: 'wechat', amount: 30, externalPaymentId: 'ext-pay-iso' });
        const listB = await (0, supertest_1.default)(app.getHttpServer()).get('/cashier/payments').set(TENANT_B);
        strict_1.default.equal(listB.body.data.length, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: order total computed from items', async () => {
    const { app, memberService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const order = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({
            memberId: 'm-1',
            items: [
                { skuId: 'sku-1', title: 'a', quantity: 2, price: 30 },
                { skuId: 'sku-2', title: 'b', quantity: 3, price: 15 }
            ]
        });
        strict_1.default.equal(order.body.data.totalAmount, 2 * 30 + 3 * 15);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: get order returns 500 for unknown orderId', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/cashier/orders/unknown-id').set(TENANT_A);
        strict_1.default.equal(res.statusCode, 500);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: create payment for unknown order throws', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders/unknown-order/payments')
            .set(TENANT_A)
            .send({ channel: 'wechat', amount: 30, externalPaymentId: 'ext-no-order' });
        strict_1.default.equal(res.statusCode, 500);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: order status lifecycle Created → PaymentPending → Paid', async () => {
    const { app, memberService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const order = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({ memberId: 'm-1', items: [{ skuId: 'sku-1', title: 'a', quantity: 1, price: 80 }] });
        const orderId = order.body.data.orderId;
        strict_1.default.equal(order.body.data.status, 'CREATED');
        const payment = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${orderId}/payments`)
            .set(TENANT_A)
            .send({ channel: 'wechat', amount: 80, externalPaymentId: 'ext-lifecycle' });
        strict_1.default.equal(payment.body.data.status, 'PENDING');
        const cb = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/payments/standardized-callback')
            .send({
            orderId,
            tenantId: 'tenant-A',
            externalPaymentId: 'ext-lifecycle',
            standardizedEventName: 'cashier.payment-succeeded'
        });
        strict_1.default.equal(cb.body.data.order.status, 'PAID');
        strict_1.default.equal(cb.body.data.payment.status, 'SUCCEEDED');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: multiple payment channels supported', async () => {
    const { app, memberService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const channels = ['wechat', 'alipay', 'unionpay', 'cash'];
        for (let i = 0; i < channels.length; i++) {
            const ch = channels[i];
            const order = await (0, supertest_1.default)(app.getHttpServer())
                .post('/cashier/orders')
                .set(TENANT_A)
                .send({ memberId: 'm-1', items: [{ skuId: 'sku-1', title: 'a', quantity: 1, price: 10 }] });
            const oid = order.body.data.orderId;
            const pay = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/cashier/orders/${oid}/payments`)
                .set(TENANT_A)
                .send({ channel: ch, amount: 10, externalPaymentId: `ext-multi-${i}` });
            strict_1.default.equal(pay.body.data.channel, ch);
        }
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: duplicate callback for same payment is idempotent', async () => {
    const { app, memberService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const order = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({ memberId: 'm-1', items: [{ skuId: 'sku-1', title: 'a', quantity: 1, price: 40 }] });
        const orderId = order.body.data.orderId;
        await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${orderId}/payments`)
            .set(TENANT_A)
            .send({ channel: 'wechat', amount: 40, externalPaymentId: 'ext-idem' });
        const cb1 = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/payments/standardized-callback')
            .send({
            orderId,
            tenantId: 'tenant-A',
            externalPaymentId: 'ext-idem',
            standardizedEventName: 'cashier.payment-succeeded'
        });
        strict_1.default.equal(cb1.body.data.payment.status, 'SUCCEEDED');
        const cb2 = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/payments/standardized-callback')
            .send({
            orderId,
            tenantId: 'tenant-A',
            externalPaymentId: 'ext-idem',
            standardizedEventName: 'cashier.payment-succeeded'
        });
        strict_1.default.equal(cb2.statusCode, 201);
        strict_1.default.equal(cb2.body.data.payment.status, 'SUCCEEDED');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: order close with timeout reason transitions to CLOSED', async () => {
    const { app, memberService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const order = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({ memberId: 'm-1', items: [{ skuId: 'sku-1', title: 'a', quantity: 1, price: 15 }] });
        const orderId = order.body.data.orderId;
        const closeRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${orderId}/timeout-close`)
            .set(TENANT_A)
            .send({ operator: 'system', reason: 'PAYMENT_TIMEOUT' });
        strict_1.default.equal(closeRes.body.data.order.status, 'CLOSED');
        strict_1.default.equal(closeRes.body.data.order.closeReason, 'PAYMENT_TIMEOUT');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: get order from different tenant returns 500', async () => {
    const { app, memberService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const order = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({ memberId: 'm-1', items: [{ skuId: 'sku-1', title: 'a', quantity: 1, price: 10 }] });
        const orderId = order.body.data.orderId;
        const get = await (0, supertest_1.default)(app.getHttpServer()).get(`/cashier/orders/${orderId}`).set(TENANT_B);
        strict_1.default.equal(get.statusCode, 500);
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=cashier.e2e.test.js.map