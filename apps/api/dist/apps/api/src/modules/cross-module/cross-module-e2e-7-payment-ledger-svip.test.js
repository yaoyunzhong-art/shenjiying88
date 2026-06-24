"use strict";
/**
 * E2E 跨模块 #7 — 收银台 → 财务 → SVIP 升级联动
 *
 * 链路:
 *   HTTP → TestController
 *     → MemberService.register (前置准备)
 *     → CashierService.createOrder + createPayment + applyPaymentCallback(succeeded)
 *       · 发布 cashier.order-created / cashier.payment-created / cashier.payment-succeeded 事件
 *       · 联动 LoyaltyService.settlePaidOrder → 积分入账
 *     → FinanceService.recordTransactionRevenue → 财务流水 (使用 cashier 产出的 orderId/transactionId)
 *     → SvipService.checkAndAutoUpgrade → 累计消费触发升级
 *
 * 验证:
 *   - 订单/支付状态机: Created → PendingPayment → Paid
 *   - 事件总线 publishEvent 被正确调用 (cashier 端)
 *   - 财务 ledger 含正确 orderId/transactionId/type=Revenue
 *   - SVIP 自动升级触发: 累计消费 >= Level1 阈值
 *   - 财务 + SVIP 跨租户隔离 (Tenant B 看不到 Tenant A 数据)
 *   - 退款链路: payment-failed → Refund ledger → SVIP 不升级
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
const cashier_service_1 = require("../cashier/cashier.service");
const finance_service_1 = require("../finance/finance.service");
const loyalty_service_1 = require("../loyalty/loyalty.service");
const member_service_1 = require("../member/member.service");
const svip_service_1 = require("../svip/svip.service");
const finance_entity_1 = require("../finance/finance.entity");
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
class SpyIntegrationOrchestrationService {
    events = [];
    async publishEvent(eventName, payload, options) {
        this.events.push({
            eventName,
            payload,
            source: options?.source,
            aggregateId: options?.aggregateId,
            receivedAt: new Date().toISOString()
        });
    }
    reset() {
        this.events = [];
    }
    ofType(eventName) {
        return this.events.filter((e) => e.eventName === eventName);
    }
}
// ─── TestController ───
let TestController = class TestController {
    memberService;
    cashierService;
    financeService;
    svipService;
    constructor(memberService, cashierService, financeService, svipService) {
        this.memberService = memberService;
        this.cashierService = cashierService;
        this.financeService = financeService;
        this.svipService = svipService;
    }
    registerMember(req, body) {
        const tc = req.tenantContext;
        return this.memberService.register({
            memberId: body.memberId,
            tenantContext: tc,
            nickname: body.nickname ?? `User-${body.memberId}`
        });
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
    getOrder(req, orderId) {
        const tc = req.tenantContext;
        const order = this.cashierService.getOrder(orderId, tc);
        if (!order)
            throw new Error(`Cashier order ${orderId} not found`);
        return order;
    }
    listPayments(req) {
        const tc = req.tenantContext;
        return this.cashierService.listPayments(tc);
    }
    listLedgers(req, body) {
        const tc = req.tenantContext;
        return this.financeService.listLedgers(tc, {
            type: body?.type,
            orderId: body?.orderId,
            limit: body?.limit
        });
    }
    recordRevenue(req, body) {
        const tc = req.tenantContext;
        return this.financeService.recordTransactionRevenue(tc, body);
    }
    recordRefund(req, body) {
        const tc = req.tenantContext;
        return this.financeService.recordTransactionRefund(tc, body);
    }
    initSvipTiers(req) {
        const tc = req.tenantContext;
        return this.svipService.initDefaultTiers(tc);
    }
    autoUpgrade(req, body) {
        const tc = req.tenantContext;
        return this.svipService.checkAndAutoUpgrade(tc, body.memberId, body.totalSpend, body.currentPoints);
    }
    getSvipMember(req, memberId) {
        const tc = req.tenantContext;
        const m = this.svipService.getMemberTier(memberId, tc.tenantId);
        if (!m)
            throw new Error(`SvipMember ${memberId} not found`);
        return m;
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
    (0, common_1.Get)('cashier/orders/:orderId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Get)('cashier/payments'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "listPayments", null);
__decorate([
    (0, common_1.Get)('finance/ledgers'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "listLedgers", null);
__decorate([
    (0, common_1.Post)('finance/revenue'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "recordRevenue", null);
__decorate([
    (0, common_1.Post)('finance/refund'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "recordRefund", null);
__decorate([
    (0, common_1.Post)('svip/tiers/init'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "initSvipTiers", null);
__decorate([
    (0, common_1.Post)('svip/check/auto-upgrade'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "autoUpgrade", null);
__decorate([
    (0, common_1.Get)('svip/members/:memberId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "getSvipMember", null);
TestController = __decorate([
    (0, common_1.Controller)(),
    __param(0, (0, common_1.Inject)(member_service_1.MemberService)),
    __param(1, (0, common_1.Inject)(cashier_service_1.CashierService)),
    __param(2, (0, common_1.Inject)(finance_service_1.FinanceService)),
    __param(3, (0, common_1.Inject)(svip_service_1.SvipService)),
    __metadata("design:paramtypes", [member_service_1.MemberService,
        cashier_service_1.CashierService,
        finance_service_1.FinanceService,
        svip_service_1.SvipService])
], TestController);
// ─── 构建 app ───
async function buildApp() {
    (0, member_service_1.resetMemberServiceTestState)();
    (0, finance_service_1.resetFinanceServiceTestState)();
    const memberService = new member_service_1.MemberService();
    const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
    loyaltyService.resetLoyaltyStoresForTests();
    const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
    cashierService.resetCashierStoresForTests();
    const financeService = new finance_service_1.FinanceService();
    const svipService = new svip_service_1.SvipService();
    svipService.resetSvipStoresForTests();
    const spy = new SpyIntegrationOrchestrationService();
    cashierService.integrationOrchestrationService = spy;
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestController],
        providers: [
            { provide: member_service_1.MemberService, useValue: memberService },
            { provide: cashier_service_1.CashierService, useValue: cashierService },
            { provide: loyalty_service_1.LoyaltyService, useValue: loyaltyService },
            { provide: finance_service_1.FinanceService, useValue: financeService },
            { provide: svip_service_1.SvipService, useValue: svipService }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, memberService, loyaltyService, cashierService, financeService, svipService, spy };
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
// ═══════════════════════════════════════════════════
// E2E: 完整收银 → 财务 → SVIP 联动
// ═══════════════════════════════════════════════════
(0, node_test_1.default)('e2e-7: full payment → ledger → svip upgrade lifecycle', async () => {
    const { app, spy } = await buildApp();
    spy.reset();
    // 1. 注册会员
    await (0, supertest_1.default)(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'alice' });
    try {
        // 2. 创建订单 (¥100)
        const orderRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({
            memberId: 'alice',
            items: [{ skuId: 'game-1h', title: '游戏 1 小时', quantity: 1, price: 10000 }]
        });
        strict_1.default.equal(orderRes.statusCode, 201);
        strict_1.default.equal(orderRes.body.data.totalAmount, 10000);
        strict_1.default.equal(orderRes.body.data.status, 'CREATED');
        const orderId = orderRes.body.data.orderId;
        // 验证 order-created 事件
        const orderCreatedEvents = spy.ofType('cashier.order-created');
        strict_1.default.equal(orderCreatedEvents.length, 1);
        strict_1.default.equal(orderCreatedEvents[0].aggregateId, orderId);
        strict_1.default.equal(orderCreatedEvents[0].payload.orderId, orderId);
        strict_1.default.equal(orderCreatedEvents[0].payload.memberId, 'alice');
        // 3. 创建支付 (微信支付)
        const paymentRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${orderId}/payments`)
            .set(TENANT_A)
            .send({ channel: 'wechat', amount: 10000 });
        strict_1.default.equal(paymentRes.statusCode, 201);
        strict_1.default.equal(paymentRes.body.data.status, 'PENDING');
        const paymentCreatedEvents = spy.ofType('cashier.payment-created');
        strict_1.default.equal(paymentCreatedEvents.length, 1);
        strict_1.default.equal(paymentCreatedEvents[0].payload.amount, 10000);
        strict_1.default.equal(paymentCreatedEvents[0].payload.channel, 'wechat');
        // 4. 模拟支付成功回调
        const callbackRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/payments/callback')
            .set(TENANT_A)
            .send({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: orderId,
            orderId,
            tenantId: 'tenant-A',
            externalPaymentId: 'wx-ext-001',
            transactionNo: 'wx-txn-001',
            channel: 'wechat',
            amount: 10000
        });
        strict_1.default.equal(callbackRes.statusCode, 201);
        strict_1.default.equal(callbackRes.body.data.order.status, 'PAID');
        const succeededEvents = spy.ofType('cashier.payment-succeeded');
        strict_1.default.equal(succeededEvents.length, 1);
        strict_1.default.equal(succeededEvents[0].payload.status, 'SUCCEEDED');
        // 5. 财务入账 (cashier → finance)
        const revenueRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/revenue')
            .set(TENANT_A)
            .send({
            orderId,
            transactionId: 'wx-txn-001',
            amount: 10000,
            description: '订单 ' + orderId + ' 支付成功'
        });
        strict_1.default.equal(revenueRes.statusCode, 201);
        strict_1.default.equal(revenueRes.body.data.type, finance_entity_1.LedgerType.Revenue);
        strict_1.default.equal(revenueRes.body.data.amount, 10000);
        strict_1.default.equal(revenueRes.body.data.orderId, orderId);
        strict_1.default.equal(revenueRes.body.data.transactionId, 'wx-txn-001');
        // 6. SVIP 自动升级 (累计消费 10000 = 满足 Level1 5000)
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/svip/tiers/init')
            .set(TENANT_A);
        const upgradeRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/svip/check/auto-upgrade')
            .set(TENANT_A)
            .send({ memberId: 'alice', totalSpend: 10000, currentPoints: 500 });
        strict_1.default.equal(upgradeRes.statusCode, 201);
        strict_1.default.equal(upgradeRes.body.data.upgraded, true);
        strict_1.default.equal(upgradeRes.body.data.newLevel, 1); // Bronze Level1
        // 7. 验证 ledger 可被按 orderId 查询
        const ledgerRes = await (0, supertest_1.default)(app.getHttpServer())
            .get('/finance/ledgers')
            .set(TENANT_A)
            .send({ orderId });
        strict_1.default.equal(ledgerRes.statusCode, 200);
        strict_1.default.equal(ledgerRes.body.data.length, 1);
        strict_1.default.equal(ledgerRes.body.data[0].orderId, orderId);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-7: multiple orders accumulate in ledger with correct balance', async () => {
    const { app, financeService } = await buildApp();
    await (0, supertest_1.default)(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'bob' });
    try {
        // 3 个订单各 ¥50
        for (let i = 0; i < 3; i++) {
            await financeService.recordTransactionRevenue(ctxA(), {
                orderId: `order-${i}`,
                transactionId: `txn-${i}`,
                amount: 5000,
                description: `Order ${i} paid`
            });
        }
        const ledgers = await (0, supertest_1.default)(app.getHttpServer())
            .get('/finance/ledgers')
            .set(TENANT_A)
            .send({ limit: 10 });
        strict_1.default.equal(ledgers.statusCode, 200);
        strict_1.default.equal(ledgers.body.data.length, 3);
        // 余额应为 15000 (3 * 5000)
        const last = ledgers.body.data[ledgers.body.data.length - 1];
        strict_1.default.equal(last.balance, 15000);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-7: refund path - payment-failed → refund ledger → svip no upgrade', async () => {
    const { app, spy } = await buildApp();
    await (0, supertest_1.default)(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'carol' });
    try {
        // 1. 创建订单 + 支付
        const orderRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({
            memberId: 'carol',
            items: [{ skuId: 's', title: 'S', quantity: 1, price: 3000 }]
        });
        const orderId = orderRes.body.data.orderId;
        await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${orderId}/payments`)
            .set(TENANT_A)
            .send({ channel: 'alipay' });
        // 2. 失败回调
        const failRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/payments/callback')
            .set(TENANT_A)
            .send({
            standardizedEventName: 'cashier.payment-failed',
            aggregateId: orderId,
            orderId,
            tenantId: 'tenant-A',
            channel: 'alipay',
            amount: 3000,
            externalPaymentId: 'ali-ext-fail',
            transactionNo: 'ali-txn-fail'
        });
        strict_1.default.equal(failRes.statusCode, 201);
        strict_1.default.equal(failRes.body.data.order.status, 'PAYMENT_FAILED');
        const failedEvents = spy.ofType('cashier.payment-failed');
        strict_1.default.equal(failedEvents.length, 1);
        // 3. 财务退款记账
        const refundRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/refund')
            .set(TENANT_A)
            .send({
            orderId,
            transactionId: 'ali-txn-fail',
            amount: 3000,
            description: '支付失败退款 ' + orderId
        });
        strict_1.default.equal(refundRes.statusCode, 201);
        strict_1.default.equal(refundRes.body.data.type, finance_entity_1.LedgerType.Refund);
        // 4. 退款后 SVIP 仅可升到 Bronze (默认 Level1),不能升 Silver/Gold
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/svip/tiers/init')
            .set(TENANT_A);
        const upgradeRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/svip/check/auto-upgrade')
            .set(TENANT_A)
            .send({ memberId: 'carol', totalSpend: 0, currentPoints: 0 });
        strict_1.default.equal(upgradeRes.statusCode, 201);
        // 退款后 carol 累计消费=0、积分=0,远未达到 Level1 (Bronze) 阈值
        // (minSpend=5000, minPoints=500),应保持非 SVIP 状态
        strict_1.default.equal(upgradeRes.body.data.upgraded, false);
        strict_1.default.equal(upgradeRes.body.data.reason, 'Below Level1 threshold');
        strict_1.default.equal(upgradeRes.body.data.newLevel, undefined);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-7: cross-tenant isolation - Tenant B cannot see Tenant A ledger', async () => {
    const { app, financeService } = await buildApp();
    // Tenant A 入账
    await financeService.recordTransactionRevenue(ctxA(), {
        orderId: 'order-A',
        transactionId: 'txn-A',
        amount: 10000,
        description: 'Tenant A order'
    });
    try {
        const ledgerB = await (0, supertest_1.default)(app.getHttpServer())
            .get('/finance/ledgers')
            .set(TENANT_B)
            .send({ limit: 10 });
        strict_1.default.equal(ledgerB.statusCode, 200);
        strict_1.default.equal(ledgerB.body.data.length, 0, 'Tenant B 不应看到 Tenant A 的 ledger');
        const ledgerA = await (0, supertest_1.default)(app.getHttpServer())
            .get('/finance/ledgers')
            .set(TENANT_A)
            .send({ limit: 10 });
        strict_1.default.equal(ledgerA.body.data.length, 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-7: event publish ordering - order-created before payment-created before payment-succeeded', async () => {
    const { app, spy } = await buildApp();
    await (0, supertest_1.default)(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'dave' });
    try {
        const orderRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({
            memberId: 'dave',
            items: [{ skuId: 's', title: 'S', quantity: 1, price: 5000 }]
        });
        const orderId = orderRes.body.data.orderId;
        await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${orderId}/payments`)
            .set(TENANT_A)
            .send({ channel: 'wechat' });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/payments/callback')
            .set(TENANT_A)
            .send({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: orderId,
            orderId,
            tenantId: 'tenant-A',
            channel: 'wechat',
            amount: 5000,
            transactionNo: 't-1'
        });
        const eventNames = spy.events.map((e) => e.eventName);
        const orderIdx = eventNames.indexOf('cashier.order-created');
        const payIdx = eventNames.indexOf('cashier.payment-created');
        const succIdx = eventNames.indexOf('cashier.payment-succeeded');
        strict_1.default.ok(orderIdx < payIdx, 'order-created 应早于 payment-created');
        strict_1.default.ok(payIdx < succIdx, 'payment-created 应早于 payment-succeeded');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-7: large total spend triggers multiple svip upgrades', async () => {
    const { app } = await buildApp();
    await (0, supertest_1.default)(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'eve' });
    try {
        // 先入账大额消费
        await (0, supertest_1.default)(app.getHttpServer()).post('/svip/tiers/init').set(TENANT_A);
        // 直接通过 checkAndAutoUpgrade 累计 50000 元 + 25000 分 → Silver Level2 (10000/3000)
        const upgradeRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/svip/check/auto-upgrade')
            .set(TENANT_A)
            .send({ memberId: 'eve', totalSpend: 50000, currentPoints: 25000 });
        strict_1.default.equal(upgradeRes.statusCode, 201);
        strict_1.default.equal(upgradeRes.body.data.upgraded, true);
        // computeSvipTierLevel: Level1 5000/500 → match, Level2 10000/3000 → match,
        // Level3 30000/10000 → 50000/25000 → match
        strict_1.default.ok(upgradeRes.body.data.newLevel >= 3, '累计消费 50000 至少应到 Level3');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-7: loyalty points accumulate after payment-succeeded', async () => {
    const { app, loyaltyService } = await buildApp();
    await (0, supertest_1.default)(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'frank' });
    try {
        const orderRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({
            memberId: 'frank',
            items: [{ skuId: 's', title: 'S', quantity: 1, price: 20000 }]
        });
        const orderId = orderRes.body.data.orderId;
        await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${orderId}/payments`)
            .set(TENANT_A)
            .send({ channel: 'wechat' });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/payments/callback')
            .set(TENANT_A)
            .send({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: orderId,
            orderId,
            tenantId: 'tenant-A',
            channel: 'wechat',
            amount: 20000,
            transactionNo: 't-2'
        });
        // 验证 loyalty 加积分
        const pointsEntries = loyaltyService.listPointsLedgerForOrder(orderId, 'tenant-A');
        strict_1.default.ok(pointsEntries.length > 0, '支付成功后应有点数账目');
        const totalPoints = pointsEntries.reduce((sum, e) => sum + e.points, 0);
        strict_1.default.ok(totalPoints > 0, '累计积分应为正');
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=cross-module-e2e-7-payment-ledger-svip.test.js.map