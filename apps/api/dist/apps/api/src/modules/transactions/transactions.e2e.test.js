"use strict";
/**
 * E2E: Transactions 交易流水 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext → TestController → TransactionsService → CashierService / LoyaltyService
 *
 * 验证:
 *   - 标准化支付回调持久化订单事务
 *   - 退款请求 (requestRefund) → 状态机 (Pending → Approved → Settled)
 *   - 退款拒绝 (reject) → 状态 Rejected
 *   - 退款 dashboard 聚合
 *   - 会员事务时间线
 *   - 跨租户访问拒绝
 *   - 按类型 / 日期范围过滤
 *   - 分页
 *   - 交易统计
 *   - 批量多行交易
 *   - 跨租户隔离
 *   - 不存在交易 404
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
const cashier_service_1 = require("../cashier/cashier.service");
const transactions_service_1 = require("./transactions.service");
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
let TestTransactionsController = class TestTransactionsController {
    transactionsService;
    constructor(transactionsService) {
        this.transactionsService = transactionsService;
    }
    callback(body) {
        return this.transactionsService.applyPaymentCallback(body);
    }
    getOrder(req, orderId) {
        const tenantContext = req.tenantContext;
        return this.transactionsService.getOrderTransaction(orderId, tenantContext);
    }
    listOrders(req) {
        const tenantContext = req.tenantContext;
        return this.transactionsService.listOrderTransactions(tenantContext);
    }
    requestRefund(req, orderId, body) {
        const tenantContext = req.tenantContext;
        return this.transactionsService.requestRefund(orderId, tenantContext, body);
    }
    dashboard(req) {
        const tenantContext = req.tenantContext;
        return this.transactionsService.getRefundDashboard(tenantContext);
    }
    getRefund(req, refundId) {
        const tenantContext = req.tenantContext;
        return this.transactionsService.getRefund(refundId, tenantContext);
    }
    listRefunds(req) {
        const tenantContext = req.tenantContext;
        return this.transactionsService.listRefunds(tenantContext);
    }
    approveRefund(req, refundId, body) {
        const tenantContext = req.tenantContext;
        return this.transactionsService.approveRefund(refundId, tenantContext, body);
    }
    rejectRefund(req, refundId, body) {
        const tenantContext = req.tenantContext;
        return this.transactionsService.rejectRefund(refundId, tenantContext, body);
    }
    listMember(req, memberId) {
        const tenantContext = req.tenantContext;
        return this.transactionsService.listMemberTransactions(memberId, tenantContext);
    }
    listTransactions(req, query) {
        const tenantContext = req.tenantContext;
        const type = query.type;
        const dateFrom = query.dateFrom;
        const dateTo = query.dateTo;
        const page = query.page ? Number(query.page) : undefined;
        const pageSize = query.pageSize ? Number(query.pageSize) : undefined;
        if (type === 'refund') {
            const refunds = this.transactionsService.listRefunds(tenantContext, { limit: undefined });
            return { type, data: refunds, total: refunds.length };
        }
        const orders = this.transactionsService.listOrderTransactions(tenantContext, {
            limit: undefined
        });
        let filtered = orders;
        if (dateFrom) {
            filtered = filtered.filter((o) => o.order.createdAt >= dateFrom);
        }
        if (dateTo) {
            filtered = filtered.filter((o) => o.order.createdAt <= dateTo);
        }
        const total = filtered.length;
        if (pageSize && pageSize > 0) {
            const p = Math.max(1, page ?? 1);
            const start = (p - 1) * pageSize;
            filtered = filtered.slice(start, start + pageSize);
        }
        return { type: type ?? 'order', data: filtered, total, page, pageSize };
    }
    getStats(req) {
        const tenantContext = req.tenantContext;
        const orders = this.transactionsService.listOrderTransactions(tenantContext, {
            limit: undefined
        });
        const refunds = this.transactionsService.listRefunds(tenantContext, { limit: undefined });
        const totalRevenue = orders.reduce((sum, o) => sum + o.order.totalAmount, 0);
        const totalRefunds = refunds
            .filter((r) => r.status === 'COMPLETED')
            .reduce((sum, r) => sum + r.refundAmount, 0);
        const pendingRefunds = refunds
            .filter((r) => r.status === 'PENDING')
            .reduce((sum, r) => sum + r.refundAmount, 0);
        return {
            totalOrders: orders.length,
            totalRevenue,
            totalRefunds,
            pendingRefunds,
            netRevenue: totalRevenue - totalRefunds
        };
    }
    async batchCreateOrders(req, body) {
        const tenantContext = req.tenantContext;
        const cashierService = this.transactionsService.cashierService;
        const results = [];
        for (const o of body.orders ?? []) {
            try {
                const order = await cashierService.createOrder(tenantContext, {
                    memberId: o.memberId,
                    items: o.items
                });
                await cashierService.createPayment(order.orderId, {
                    channel: 'wechat',
                    amount: o.amount,
                    externalPaymentId: o.externalPaymentId
                });
                await cashierService.applyPaymentCallback({
                    aggregateId: order.orderId,
                    orderId: order.orderId,
                    tenantId: tenantContext.tenantId,
                    externalPaymentId: o.externalPaymentId,
                    standardizedEventName: 'cashier.payment-succeeded'
                });
                results.push({ orderId: order.orderId, status: 'created' });
            }
            catch (e) {
                results.push({ error: e.message });
            }
        }
        return { processed: results.length, results };
    }
};
__decorate([
    (0, common_1.Post)('payments/standardized-callback'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestTransactionsController.prototype, "callback", null);
__decorate([
    (0, common_1.Get)('orders/:orderId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestTransactionsController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Get)('orders'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestTransactionsController.prototype, "listOrders", null);
__decorate([
    (0, common_1.Post)('orders/:orderId/refunds'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TestTransactionsController.prototype, "requestRefund", null);
__decorate([
    (0, common_1.Get)('refunds/dashboard'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestTransactionsController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('refunds/:refundId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('refundId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestTransactionsController.prototype, "getRefund", null);
__decorate([
    (0, common_1.Get)('refunds'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestTransactionsController.prototype, "listRefunds", null);
__decorate([
    (0, common_1.Post)('refunds/:refundId/approve'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('refundId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TestTransactionsController.prototype, "approveRefund", null);
__decorate([
    (0, common_1.Post)('refunds/:refundId/reject'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('refundId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TestTransactionsController.prototype, "rejectRefund", null);
__decorate([
    (0, common_1.Get)('members/:memberId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestTransactionsController.prototype, "listMember", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestTransactionsController.prototype, "listTransactions", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestTransactionsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TestTransactionsController.prototype, "batchCreateOrders", null);
TestTransactionsController = __decorate([
    (0, common_1.Controller)('transactions'),
    __param(0, (0, common_1.Inject)(transactions_service_1.TransactionsService)),
    __metadata("design:paramtypes", [transactions_service_1.TransactionsService])
], TestTransactionsController);
async function buildApp() {
    (0, member_service_1.resetMemberServiceTestState)();
    (0, transactions_service_1.resetTransactionsServiceTestState)();
    const memberService = new member_service_1.MemberService();
    const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
    loyaltyService.resetLoyaltyStoresForTests();
    const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
    cashierService.resetCashierStoresForTests();
    const transactionsService = new transactions_service_1.TransactionsService(cashierService, loyaltyService);
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestTransactionsController],
        providers: [
            { provide: member_service_1.MemberService, useValue: memberService },
            { provide: loyalty_service_1.LoyaltyService, useValue: loyaltyService },
            { provide: cashier_service_1.CashierService, useValue: cashierService },
            { provide: transactions_service_1.TransactionsService, useValue: transactionsService }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, memberService, loyaltyService, cashierService, transactionsService };
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
function ensureMember(memberService, memberId) {
    memberService.register({ memberId, tenantContext: tenantContextA(), nickname: `User-${memberId}` });
}
async function settleOrder(app, cashierService, memberService, loyaltyService, memberId, amount, externalPaymentId) {
    const order = await cashierService.createOrder(tenantContextA(), {
        memberId,
        items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: amount }]
    });
    const orderId = order.orderId;
    cashierService.createPayment(orderId, {
        channel: 'wechat',
        amount,
        externalPaymentId
    });
    cashierService.applyPaymentCallback({
        orderId,
        tenantId: 'tenant-A',
        externalPaymentId,
        standardizedEventName: 'cashier.payment-succeeded'
    });
    return orderId;
}
(0, node_test_1.default)('e2e: payment callback persists order transaction', async () => {
    const { app, memberService, cashierService, loyaltyService, transactionsService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 150, 'ext-pay-tx-1');
        const callback = await (0, supertest_1.default)(app.getHttpServer())
            .post('/transactions/payments/standardized-callback')
            .send({
            orderId,
            tenantId: 'tenant-A',
            externalPaymentId: 'ext-pay-tx-1',
            standardizedEventName: 'cashier.payment-succeeded'
        });
        strict_1.default.equal(callback.statusCode, 201);
        strict_1.default.equal(callback.body.data.order.orderId, orderId);
        strict_1.default.equal(callback.body.data.order.totalAmount, 150);
        strict_1.default.equal(callback.body.data.payment.status, 'SUCCEEDED');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: list transactions scoped by tenant', async () => {
    const { app, memberService, cashierService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 50, 'ext-pay-list-1');
        const listA = await (0, supertest_1.default)(app.getHttpServer()).get('/transactions/orders').set(TENANT_A);
        strict_1.default.ok(listA.body.data.length >= 1);
        for (const tx of listA.body.data) {
            strict_1.default.equal(tx.order.tenantContext.tenantId, 'tenant-A');
        }
        const listB = await (0, supertest_1.default)(app.getHttpServer()).get('/transactions/orders').set(TENANT_B);
        for (const tx of listB.body.data) {
            strict_1.default.equal(tx.order.tenantContext.tenantId, 'tenant-B');
        }
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: refund request → approve → status Approved', async () => {
    const { app, memberService, cashierService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 200, 'ext-pay-rf-1');
        const refundRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/orders/${orderId}/refunds`)
            .set(TENANT_A)
            .send({ refundAmount: 50, reason: 'customer-remorse', operator: 'op-1' });
        strict_1.default.equal(refundRes.statusCode, 201);
        const refundId = refundRes.body.data.refunds[0].refundId;
        strict_1.default.equal(refundRes.body.data.refunds[0].status, 'PENDING');
        strict_1.default.equal(refundRes.body.data.refunds[0].refundAmount, 50);
        const approveRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/refunds/${refundId}/approve`)
            .set(TENANT_A)
            .send({ operator: 'mgr-1', note: 'ok' });
        strict_1.default.equal(approveRes.body.data.refunds[0].status, 'COMPLETED');
        strict_1.default.equal(approveRes.body.data.refunds[0].reviewedBy, 'mgr-1');
        const detail = await (0, supertest_1.default)(app.getHttpServer())
            .get(`/transactions/refunds/${refundId}`)
            .set(TENANT_A);
        strict_1.default.equal(detail.body.data.status, 'COMPLETED');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: refund request → reject → status Rejected', async () => {
    const { app, memberService, cashierService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 100, 'ext-pay-rj-1');
        const refundRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/orders/${orderId}/refunds`)
            .set(TENANT_A)
            .send({ refundAmount: 30, reason: 'bad-quality', operator: 'op-1' });
        const refundId = refundRes.body.data.refunds[0].refundId;
        const rejectRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/refunds/${refundId}/reject`)
            .set(TENANT_A)
            .send({ operator: 'mgr-1', note: 'out-of-policy' });
        strict_1.default.equal(rejectRes.body.data.refunds[0].status, 'REJECTED');
        strict_1.default.equal(rejectRes.body.data.refunds[0].reviewedBy, 'mgr-1');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: refund cannot be approved twice', async () => {
    const { app, memberService, cashierService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 80, 'ext-pay-twice');
        const refundRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/orders/${orderId}/refunds`)
            .set(TENANT_A)
            .send({ refundAmount: 20, reason: 'test', operator: 'op-1' });
        const refundId = refundRes.body.data.refunds[0].refundId;
        await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/refunds/${refundId}/approve`)
            .set(TENANT_A)
            .send({ operator: 'mgr-1' });
        const secondApprove = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/refunds/${refundId}/approve`)
            .set(TENANT_A)
            .send({ operator: 'mgr-2' });
        strict_1.default.equal(secondApprove.statusCode, 500);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: refund dashboard aggregates by status', async () => {
    const { app, memberService, cashierService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const orderId1 = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 100, 'ext-pay-dash-1');
        const orderId2 = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 100, 'ext-pay-dash-2');
        // Two refunds: one approved, one rejected
        const r1 = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/orders/${orderId1}/refunds`)
            .set(TENANT_A)
            .send({ refundAmount: 10, reason: 'a', operator: 'op-1' });
        await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/refunds/${r1.body.data.refunds[0].refundId}/approve`)
            .set(TENANT_A)
            .send({ operator: 'mgr-1' });
        const r2 = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/orders/${orderId2}/refunds`)
            .set(TENANT_A)
            .send({ refundAmount: 20, reason: 'b', operator: 'op-1' });
        await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/refunds/${r2.body.data.refunds[0].refundId}/reject`)
            .set(TENANT_A)
            .send({ operator: 'mgr-1' });
        const dashboard = await (0, supertest_1.default)(app.getHttpServer())
            .get('/transactions/refunds/dashboard')
            .set(TENANT_A);
        strict_1.default.equal(dashboard.statusCode, 200);
        const data = dashboard.body.data;
        strict_1.default.ok(data);
        strict_1.default.ok(data.totalCount >= 2);
        strict_1.default.ok(Array.isArray(data.statusGroups));
        strict_1.default.ok(data.statusGroups.length >= 1);
        const completedGroup = data.statusGroups.find((g) => g.status === 'COMPLETED');
        strict_1.default.ok(completedGroup);
        strict_1.default.equal(completedGroup.count, 1);
        const rejectedGroup = data.statusGroups.find((g) => g.status === 'REJECTED');
        strict_1.default.ok(rejectedGroup);
        strict_1.default.equal(rejectedGroup.count, 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: member transaction timeline aggregates orders + refunds', async () => {
    const { app, memberService, cashierService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 75, 'ext-pay-tl-1');
        await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/orders/${orderId}/refunds`)
            .set(TENANT_A)
            .send({ refundAmount: 10, reason: 'timeline-test', operator: 'op-1' });
        const timeline = await (0, supertest_1.default)(app.getHttpServer())
            .get('/transactions/members/m-1')
            .set(TENANT_A);
        strict_1.default.equal(timeline.statusCode, 200);
        strict_1.default.ok(timeline.body.data);
        strict_1.default.ok(timeline.body.data.length >= 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: refund request for unknown order is rejected', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/transactions/orders/non-existent-order/refunds')
            .set(TENANT_A)
            .send({ refundAmount: 10, reason: 'test', operator: 'op-1' });
        strict_1.default.equal(res.statusCode, 500);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: cross-tenant cannot read another tenant refund', async () => {
    const { app, memberService, cashierService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 60, 'ext-pay-cross');
        const refundRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/orders/${orderId}/refunds`)
            .set(TENANT_A)
            .send({ refundAmount: 15, reason: 'cross', operator: 'op-1' });
        const refundId = refundRes.body.data.refunds[0].refundId;
        const crossGet = await (0, supertest_1.default)(app.getHttpServer())
            .get(`/transactions/refunds/${refundId}`)
            .set(TENANT_B);
        strict_1.default.equal(crossGet.statusCode, 500);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: list refunds for tenant scope only', async () => {
    const { app, memberService, cashierService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 200, 'ext-pay-lst-1');
        const r1 = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/orders/${orderId}/refunds`)
            .set(TENANT_A)
            .send({ refundAmount: 10, reason: 'a', operator: 'op-1' });
        const listA = await (0, supertest_1.default)(app.getHttpServer()).get('/transactions/refunds').set(TENANT_A);
        strict_1.default.ok(listA.body.data.length >= 1);
        strict_1.default.ok(listA.body.data.some((r) => r.refundId === r1.body.data.refunds[0].refundId));
        const listB = await (0, supertest_1.default)(app.getHttpServer()).get('/transactions/refunds').set(TENANT_B);
        strict_1.default.equal(listB.body.data.length, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: list member transactions aggregates all tenant orders', async () => {
    const { app, memberService, cashierService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const oid1 = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 100, 'ext-pay-mem-1');
        const oid2 = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 200, 'ext-pay-mem-2');
        const memberTx = await (0, supertest_1.default)(app.getHttpServer())
            .get('/transactions/members/m-1')
            .set(TENANT_A);
        strict_1.default.equal(memberTx.statusCode, 200);
        const orderIds = memberTx.body.data.map((entry) => entry.orderId).filter(Boolean);
        strict_1.default.ok(orderIds.includes(oid1));
        strict_1.default.ok(orderIds.includes(oid2));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: refund reject reason persisted on refund record', async () => {
    const { app, memberService, cashierService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 60, 'ext-pay-rej-reason');
        const refundRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/orders/${orderId}/refunds`)
            .set(TENANT_A)
            .send({ refundAmount: 20, reason: 'returns', operator: 'op-1' });
        const refundId = refundRes.body.data.refunds[0].refundId;
        const reject = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/refunds/${refundId}/reject`)
            .set(TENANT_A)
            .send({ operator: 'mgr-1', note: 'out-of-policy-window' });
        strict_1.default.equal(reject.body.data.refunds[0].status, 'REJECTED');
        strict_1.default.equal(reject.body.data.refunds[0].reviewedBy, 'mgr-1');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: refund reject on non-pending refund throws', async () => {
    const { app, memberService, cashierService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 80, 'ext-pay-rej-twice');
        const refundRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/orders/${orderId}/refunds`)
            .set(TENANT_A)
            .send({ refundAmount: 30, reason: 'test', operator: 'op-1' });
        const refundId = refundRes.body.data.refunds[0].refundId;
        await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/refunds/${refundId}/reject`)
            .set(TENANT_A)
            .send({ operator: 'mgr-1' });
        const reject2 = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/refunds/${refundId}/reject`)
            .set(TENANT_A)
            .send({ operator: 'mgr-2' });
        strict_1.default.equal(reject2.statusCode, 500);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: list orders scoped by tenant', async () => {
    const { app, memberService, cashierService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 50, 'ext-pay-scope-1');
        await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 50, 'ext-pay-scope-2');
        const listA = await (0, supertest_1.default)(app.getHttpServer()).get('/transactions/orders').set(TENANT_A);
        strict_1.default.ok(listA.body.data.length >= 2);
        for (const tx of listA.body.data) {
            strict_1.default.equal(tx.order.tenantContext.tenantId, 'tenant-A');
        }
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: list refunds with no orders returns empty array', async () => {
    const { app } = await buildApp();
    try {
        const list = await (0, supertest_1.default)(app.getHttpServer()).get('/transactions/refunds').set(TENANT_A);
        strict_1.default.equal(list.statusCode, 200);
        strict_1.default.ok(Array.isArray(list.body.data));
        strict_1.default.equal(list.body.data.length, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: dashboard returns 0 totals for empty tenant', async () => {
    const { app } = await buildApp();
    try {
        const dashboard = await (0, supertest_1.default)(app.getHttpServer())
            .get('/transactions/refunds/dashboard')
            .set(TENANT_A);
        strict_1.default.equal(dashboard.statusCode, 200);
        strict_1.default.equal(dashboard.body.data.totalCount, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: get unknown order returns 500', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/transactions/orders/unknown-order').set(TENANT_A);
        strict_1.default.equal(res.statusCode, 500);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: cross-tenant refund list does not include another tenant', async () => {
    const { app, memberService, cashierService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-1');
    try {
        const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 100, 'ext-pay-iso-1');
        await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/orders/${orderId}/refunds`)
            .set(TENANT_A)
            .send({ refundAmount: 30, reason: 'iso', operator: 'op-1' });
        const listB = await (0, supertest_1.default)(app.getHttpServer()).get('/transactions/refunds').set(TENANT_B);
        strict_1.default.equal(listB.body.data.length, 0);
    }
    finally {
        await app.close();
    }
});
// ── Phase-5 B₂: 7 new tests ──
(0, node_test_1.default)('e2e: GET /transactions?type=order filters by type', async () => {
    const { app, memberService, cashierService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-type');
    try {
        const oid1 = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-type', 100, 'ext-pay-type-1');
        // also create a refund for this order
        await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/orders/${oid1}/refunds`)
            .set(TENANT_A)
            .send({ refundAmount: 10, reason: 'type-test', operator: 'op-type' });
        const typeOrder = await (0, supertest_1.default)(app.getHttpServer())
            .get('/transactions?type=order')
            .set(TENANT_A);
        strict_1.default.equal(typeOrder.statusCode, 200);
        strict_1.default.equal(typeOrder.body.data.type, 'order');
        strict_1.default.ok(typeOrder.body.data.data.length >= 1);
        strict_1.default.ok(typeOrder.body.data.data.every((o) => o.order));
        const typeRefund = await (0, supertest_1.default)(app.getHttpServer())
            .get('/transactions?type=refund')
            .set(TENANT_A);
        strict_1.default.equal(typeRefund.statusCode, 200);
        strict_1.default.equal(typeRefund.body.data.type, 'refund');
        strict_1.default.ok(typeRefund.body.data.data.length >= 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: GET /transactions?dateFrom&dateTo filters by date range', async () => {
    const { app, memberService, cashierService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-date');
    try {
        const beforeCreate = new Date().toISOString();
        await settleOrder(app, cashierService, memberService, loyaltyService, 'm-date', 200, 'ext-pay-date-1');
        const afterCreate = new Date().toISOString();
        // dateFrom before creation should include it
        const resWith = await (0, supertest_1.default)(app.getHttpServer())
            .get(`/transactions?dateFrom=${encodeURIComponent(beforeCreate)}&dateTo=${encodeURIComponent(afterCreate)}`)
            .set(TENANT_A);
        strict_1.default.equal(resWith.statusCode, 200);
        strict_1.default.ok(resWith.body.data.data.length >= 1);
        // dateTo before creation should exclude it
        const futureDate = '2020-01-01T00:00:00.000Z';
        const resWithout = await (0, supertest_1.default)(app.getHttpServer())
            .get(`/transactions?dateFrom=${futureDate}&dateTo=${futureDate}`)
            .set(TENANT_A);
        strict_1.default.equal(resWithout.statusCode, 200);
        strict_1.default.equal(resWithout.body.data.data.length, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: POST /transactions creates batch orders', async () => {
    const { app, memberService } = await buildApp();
    ensureMember(memberService, 'm-batch-1');
    ensureMember(memberService, 'm-batch-2');
    try {
        const batchRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/transactions')
            .set(TENANT_A)
            .send({
            orders: [
                {
                    memberId: 'm-batch-1',
                    items: [{ skuId: 'sku-a', title: 'Item A', quantity: 1, price: 50 }],
                    amount: 50,
                    externalPaymentId: 'ext-pay-batch-1'
                },
                {
                    memberId: 'm-batch-2',
                    items: [{ skuId: 'sku-b', title: 'Item B', quantity: 2, price: 30 }],
                    amount: 60,
                    externalPaymentId: 'ext-pay-batch-2'
                }
            ]
        });
        strict_1.default.equal(batchRes.statusCode, 201);
        strict_1.default.equal(batchRes.body.data.processed, 2);
        strict_1.default.equal(batchRes.body.data.results.length, 2);
        strict_1.default.ok(batchRes.body.data.results.every((r) => r.status === 'created'));
        // verify the orders exist
        const listOrders = await (0, supertest_1.default)(app.getHttpServer())
            .get('/transactions/orders')
            .set(TENANT_A);
        strict_1.default.ok(listOrders.body.data.length >= 2);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: GET /transactions/stats returns aggregated stats', async () => {
    const { app, memberService, cashierService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-stats');
    try {
        const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-stats', 150, 'ext-pay-stats-1');
        await settleOrder(app, cashierService, memberService, loyaltyService, 'm-stats', 250, 'ext-pay-stats-2');
        // create and approve a refund
        const refundRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/orders/${orderId}/refunds`)
            .set(TENANT_A)
            .send({ refundAmount: 50, reason: 'stats-test', operator: 'op-stats' });
        const refundId = refundRes.body.data.refunds[0].refundId;
        await (0, supertest_1.default)(app.getHttpServer())
            .post(`/transactions/refunds/${refundId}/approve`)
            .set(TENANT_A)
            .send({ operator: 'mgr-stats' });
        const stats = await (0, supertest_1.default)(app.getHttpServer())
            .get('/transactions/stats')
            .set(TENANT_A);
        strict_1.default.equal(stats.statusCode, 200);
        strict_1.default.equal(stats.body.data.totalOrders, 2);
        strict_1.default.equal(stats.body.data.totalRevenue, 400);
        strict_1.default.ok(stats.body.data.totalRefunds >= 50);
        strict_1.default.ok(stats.body.data.netRevenue <= 350);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: cross-tenant data isolation for transactions list', async () => {
    const { app, memberService, cashierService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-iso');
    try {
        await settleOrder(app, cashierService, memberService, loyaltyService, 'm-iso', 180, 'ext-pay-iso-a');
        // tenant A sees its orders
        const listA = await (0, supertest_1.default)(app.getHttpServer())
            .get('/transactions?type=order')
            .set(TENANT_A);
        strict_1.default.equal(listA.statusCode, 200);
        strict_1.default.ok(listA.body.data.data.length >= 1);
        // tenant B should see empty list (no orders under tenant B)
        const listB = await (0, supertest_1.default)(app.getHttpServer())
            .get('/transactions?type=order')
            .set(TENANT_B);
        strict_1.default.equal(listB.statusCode, 200);
        strict_1.default.equal(listB.body.data.data.length, 0);
        // Verify tenant A cannot access tenant B data
        for (const tx of listA.body.data.data) {
            strict_1.default.equal(tx.order.tenantContext.tenantId, 'tenant-A');
        }
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: pagination with page and pageSize', async () => {
    const { app, memberService, cashierService, loyaltyService } = await buildApp();
    ensureMember(memberService, 'm-page');
    try {
        // create 5 orders
        for (let i = 0; i < 5; i++) {
            await settleOrder(app, cashierService, memberService, loyaltyService, 'm-page', 50, `ext-pay-page-${i}`);
        }
        // page 1, pageSize 2 → should return 2 items, total 5
        const page1 = await (0, supertest_1.default)(app.getHttpServer())
            .get('/transactions?type=order&page=1&pageSize=2')
            .set(TENANT_A);
        strict_1.default.equal(page1.statusCode, 200);
        strict_1.default.equal(page1.body.data.data.length, 2);
        strict_1.default.equal(page1.body.data.total, 5);
        strict_1.default.equal(page1.body.data.page, 1);
        // page 2, pageSize 2 → should return 2 items
        const page2 = await (0, supertest_1.default)(app.getHttpServer())
            .get('/transactions?type=order&page=2&pageSize=2')
            .set(TENANT_A);
        strict_1.default.equal(page2.statusCode, 200);
        strict_1.default.equal(page2.body.data.data.length, 2);
        strict_1.default.equal(page2.body.data.total, 5);
        // page 3, pageSize 2 → should return 1 item
        const page3 = await (0, supertest_1.default)(app.getHttpServer())
            .get('/transactions?type=order&page=3&pageSize=2')
            .set(TENANT_A);
        strict_1.default.equal(page3.statusCode, 200);
        strict_1.default.equal(page3.body.data.data.length, 1);
        // page 4 should be empty
        const page4 = await (0, supertest_1.default)(app.getHttpServer())
            .get('/transactions?type=order&page=4&pageSize=2')
            .set(TENANT_A);
        strict_1.default.equal(page4.statusCode, 200);
        strict_1.default.equal(page4.body.data.data.length, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: non-existent transaction returns error', async () => {
    const { app } = await buildApp();
    try {
        // unknown order → 500 (service throws)
        const unknownOrder = await (0, supertest_1.default)(app.getHttpServer())
            .get('/transactions/orders/nonexistent-order-id')
            .set(TENANT_A);
        strict_1.default.equal(unknownOrder.statusCode, 500);
        // unknown refund → 500
        const unknownRefund = await (0, supertest_1.default)(app.getHttpServer())
            .get('/transactions/refunds/nonexistent-refund-id')
            .set(TENANT_A);
        strict_1.default.equal(unknownRefund.statusCode, 500);
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=transactions.e2e.test.js.map