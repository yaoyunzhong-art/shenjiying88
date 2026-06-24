"use strict";
/**
 * E2E 跨模块 #8 — 预约 → 排队 → 收银 → 完成 全链路
 *
 * 链路:
 *   1. ReservationService.create (Pending)
 *   2. ReservationService.confirm (Confirmed)
 *   3. QueueService.create (Waiting)
 *   4. QueueService.complete
 *   5. ReservationService.startProgress (InProgress)
 *   6. CashierService.createOrder + createPayment + applyPaymentCallback(succeeded)
 *   7. ReservationService.complete (Completed)
 *
 * 验证:
 *   - 跨模块状态机流转正确
 *   - 排队序号生成 (B001/B002 per tenant+type)
 *   - estimated wait 随队列增长
 *   - 跨租户隔离
 *   - 取消路径一致性
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
const member_service_1 = require("../member/member.service");
const loyalty_service_1 = require("../loyalty/loyalty.service");
const queue_service_1 = require("../queue/queue.service");
const queue_entity_1 = require("../queue/queue.entity");
const reservation_service_1 = require("../reservation/reservation.service");
const reservation_entity_1 = require("../reservation/reservation.entity");
function attachTenantContext(req, _res, next) {
    const ctx = req;
    ctx.tenantContext = {
        tenantId: req.header('x-tenant-id') ?? 'tenant-A',
        brandId: req.header('x-brand-id') ?? 'brand-A',
        storeId: req.header('x-store-id') ?? 'store-A',
        marketCode: req.header('x-market-code') ?? 'cn-mainland'
    };
    next();
}
// ─── TestController ───
let TestController = class TestController {
    memberService;
    reservationService;
    queueService;
    cashierService;
    constructor(memberService, reservationService, queueService, cashierService) {
        this.memberService = memberService;
        this.reservationService = reservationService;
        this.queueService = queueService;
        this.cashierService = cashierService;
    }
    register(req, body) {
        const tc = req.tenantContext;
        return this.memberService.register({
            memberId: body.memberId,
            tenantContext: tc,
            nickname: body.nickname ?? `U-${body.memberId}`
        });
    }
    createReservation(req, body) {
        const tc = req.tenantContext;
        return this.reservationService.create({
            tenantId: tc.tenantId,
            type: body.type,
            resourceId: body.resourceId,
            resourceName: body.resourceName,
            userId: body.memberId,
            userName: body.userName ?? body.memberId,
            startTime: body.startTime,
            endTime: body.endTime,
            duration: body.duration ?? 60,
            price: body.price ?? 0,
            deposit: body.deposit ?? 0
        });
    }
    confirmReservation(req, id) {
        const tc = req.tenantContext;
        return this.reservationService.confirm(id, tc.tenantId);
    }
    startProgress(req, id) {
        const tc = req.tenantContext;
        return this.reservationService.startProgress(id, tc.tenantId);
    }
    completeReservation(req, id) {
        const tc = req.tenantContext;
        return this.reservationService.complete(id, tc.tenantId);
    }
    cancelReservation(req, id) {
        const tc = req.tenantContext;
        return this.reservationService.cancel(id, tc.tenantId);
    }
    joinQueue(req, body) {
        const tc = req.tenantContext;
        return this.queueService.create({
            tenantId: tc.tenantId,
            type: body.type ?? queue_entity_1.QueueType.Waiting,
            userId: body.memberId,
            userName: body.userName ?? body.memberId,
            partySize: body.partySize ?? 1,
            resourceId: body.resourceId,
            resourceName: body.resourceName,
            remark: body.remark
        });
    }
    completeQueue(req, id) {
        const tc = req.tenantContext;
        return this.queueService.complete(id, tc.tenantId);
    }
    startService(req, id) {
        const tc = req.tenantContext;
        return this.queueService.startService(id, tc.tenantId);
    }
    callNextQueue(req, body) {
        const tc = req.tenantContext;
        return this.queueService.callNext(body.resourceId, tc.tenantId);
    }
    cancelQueue(req, id) {
        const tc = req.tenantContext;
        return this.queueService.cancel(id, tc.tenantId);
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
};
__decorate([
    (0, common_1.Post)('members'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('reservations'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "createReservation", null);
__decorate([
    (0, common_1.Post)('reservations/:id/confirm'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "confirmReservation", null);
__decorate([
    (0, common_1.Post)('reservations/:id/start-progress'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "startProgress", null);
__decorate([
    (0, common_1.Post)('reservations/:id/complete'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "completeReservation", null);
__decorate([
    (0, common_1.Post)('reservations/:id/cancel'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "cancelReservation", null);
__decorate([
    (0, common_1.Post)('queues/join'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "joinQueue", null);
__decorate([
    (0, common_1.Post)('queues/:id/complete'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "completeQueue", null);
__decorate([
    (0, common_1.Post)('queues/:id/start-service'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "startService", null);
__decorate([
    (0, common_1.Post)('queues/call-next'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "callNextQueue", null);
__decorate([
    (0, common_1.Post)('queues/:id/cancel'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "cancelQueue", null);
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
TestController = __decorate([
    (0, common_1.Controller)(),
    __param(0, (0, common_1.Inject)(member_service_1.MemberService)),
    __param(1, (0, common_1.Inject)(reservation_service_1.ReservationService)),
    __param(2, (0, common_1.Inject)(queue_service_1.QueueService)),
    __param(3, (0, common_1.Inject)(cashier_service_1.CashierService)),
    __metadata("design:paramtypes", [member_service_1.MemberService,
        reservation_service_1.ReservationService,
        queue_service_1.QueueService,
        cashier_service_1.CashierService])
], TestController);
// ─── 构建 app ───
async function buildApp() {
    (0, member_service_1.resetMemberServiceTestState)();
    const memberService = new member_service_1.MemberService();
    const loyaltyService = new loyalty_service_1.LoyaltyService(memberService);
    loyaltyService.resetLoyaltyStoresForTests?.();
    const cashierService = new cashier_service_1.CashierService(memberService, loyaltyService);
    cashierService.resetCashierStoresForTests();
    const reservationService = new reservation_service_1.ReservationService();
    reservationService.resetStoreForTests();
    const queueService = new queue_service_1.QueueService();
    queueService.resetQueueStoresForTests();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestController],
        providers: [
            { provide: member_service_1.MemberService, useValue: memberService },
            { provide: reservation_service_1.ReservationService, useValue: reservationService },
            { provide: queue_service_1.QueueService, useValue: queueService },
            { provide: cashier_service_1.CashierService, useValue: cashierService }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, memberService, reservationService, queueService, cashierService };
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
function futureTime(offsetMin) {
    return new Date(Date.now() + offsetMin * 60 * 1000).toISOString();
}
// ═══════════════════════════════════════════════════
(0, node_test_1.default)('e2e-8: full reservation → queue → service → payment → complete lifecycle', async () => {
    const { app } = await buildApp();
    await (0, supertest_1.default)(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'grace' });
    try {
        // 1. 预约
        const reservationRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/reservations')
            .set(TENANT_A)
            .send({
            memberId: 'grace',
            resourceId: 'room-101',
            resourceName: '包间 101',
            type: reservation_entity_1.ReservationType.Venue,
            startTime: futureTime(120),
            endTime: futureTime(180),
            duration: 60,
            price: 20000
        });
        strict_1.default.equal(reservationRes.statusCode, 201);
        strict_1.default.equal(reservationRes.body.data.status, reservation_entity_1.ReservationStatus.Pending);
        const reservationId = reservationRes.body.data.id;
        strict_1.default.equal(reservationRes.body.data.resourceId, 'room-101');
        // 2. 确认
        const confirmRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/reservations/${reservationId}/confirm`)
            .set(TENANT_A);
        strict_1.default.equal(confirmRes.statusCode, 201);
        strict_1.default.equal(confirmRes.body.data.status, reservation_entity_1.ReservationStatus.Confirmed);
        // 3. 到店取号
        const queueRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/queues/join')
            .set(TENANT_A)
            .send({
            type: queue_entity_1.QueueType.Waiting,
            memberId: 'grace',
            userName: 'Grace',
            resourceId: 'room-101',
            resourceName: '包间 101',
            partySize: 4,
            remark: '生日聚会'
        });
        strict_1.default.equal(queueRes.statusCode, 201);
        strict_1.default.match(queueRes.body.data.queueNumber, /^B\d{3}$/);
        strict_1.default.equal(queueRes.body.data.type, queue_entity_1.QueueType.Waiting);
        // 4. 叫号 (Waiting → Called)
        const callNextRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/queues/call-next')
            .set(TENANT_A)
            .send({ resourceId: 'room-101' });
        strict_1.default.equal(callNextRes.statusCode, 201);
        strict_1.default.equal(callNextRes.body.data.status, queue_entity_1.QueueStatus.Called);
        const calledId = callNextRes.body.data.id;
        // 4b. 开始服务 (Called → Serving)
        const startServiceRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/queues/${calledId}/start-service`)
            .set(TENANT_A);
        strict_1.default.equal(startServiceRes.statusCode, 201);
        strict_1.default.equal(startServiceRes.body.data.status, queue_entity_1.QueueStatus.Serving);
        // 4c. 完成排队 (Serving → Completed)
        const completeQueueRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/queues/${calledId}/complete`)
            .set(TENANT_A);
        strict_1.default.equal(completeQueueRes.statusCode, 201);
        strict_1.default.equal(completeQueueRes.body.data.status, queue_entity_1.QueueStatus.Completed);
        // 5. 预约进入 InProgress
        const startRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/reservations/${reservationId}/start-progress`)
            .set(TENANT_A);
        strict_1.default.equal(startRes.statusCode, 201);
        strict_1.default.equal(startRes.body.data.status, reservation_entity_1.ReservationStatus.InProgress);
        // 6. 下单消费 (¥200)
        const orderRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/orders')
            .set(TENANT_A)
            .send({
            memberId: 'grace',
            items: [{ skuId: 'venue-hour', title: '包间 1 小时', quantity: 2, price: 10000 }]
        });
        strict_1.default.equal(orderRes.statusCode, 201);
        strict_1.default.equal(orderRes.body.data.totalAmount, 20000);
        const orderId = orderRes.body.data.orderId;
        // 7. 支付
        const paymentRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/cashier/orders/${orderId}/payments`)
            .set(TENANT_A)
            .send({ channel: 'wechat', amount: 20000 });
        strict_1.default.equal(paymentRes.statusCode, 201);
        // 8. 支付成功回调
        const callbackRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cashier/payments/callback')
            .set(TENANT_A)
            .send({
            standardizedEventName: 'cashier.payment-succeeded',
            aggregateId: orderId,
            orderId,
            tenantId: 'tenant-A',
            channel: 'wechat',
            amount: 20000,
            transactionNo: 'txn-flow-001'
        });
        strict_1.default.equal(callbackRes.statusCode, 201);
        strict_1.default.equal(callbackRes.body.data.order.status, 'PAID');
        // 9. 预约完成
        const completeRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/reservations/${reservationId}/complete`)
            .set(TENANT_A);
        strict_1.default.equal(completeRes.statusCode, 201);
        strict_1.default.equal(completeRes.body.data.status, reservation_entity_1.ReservationStatus.Completed);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-8: queue number increment per tenant+type', async () => {
    const { app } = await buildApp();
    await (0, supertest_1.default)(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'h1' });
    await (0, supertest_1.default)(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'h2' });
    await (0, supertest_1.default)(app.getHttpServer()).post('/members').set(TENANT_B).send({ memberId: 'h3' });
    try {
        const q1 = await (0, supertest_1.default)(app.getHttpServer()).post('/queues/join').set(TENANT_A).send({ memberId: 'h1' });
        const q2 = await (0, supertest_1.default)(app.getHttpServer()).post('/queues/join').set(TENANT_A).send({ memberId: 'h2' });
        const q3 = await (0, supertest_1.default)(app.getHttpServer()).post('/queues/join').set(TENANT_B).send({ memberId: 'h3' });
        strict_1.default.equal(q1.body.data.queueNumber, 'B001');
        strict_1.default.equal(q2.body.data.queueNumber, 'B002');
        strict_1.default.equal(q3.body.data.queueNumber, 'B001', 'Tenant B 独立计数');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-8: cancel reservation + cancel queue keeps data consistent', async () => {
    const { app } = await buildApp();
    await (0, supertest_1.default)(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'ivy' });
    try {
        const resRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/reservations')
            .set(TENANT_A)
            .send({
            memberId: 'ivy',
            resourceId: 'm-201',
            resourceName: 'M-201',
            type: reservation_entity_1.ReservationType.Service,
            startTime: futureTime(30),
            endTime: futureTime(90),
            duration: 60,
            price: 0
        });
        const reservationId = resRes.body.data.id;
        const qRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/queues/join')
            .set(TENANT_A)
            .send({ memberId: 'ivy', resourceId: 'm-201' });
        const queueId = qRes.body.data.id;
        const cancelRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/reservations/${reservationId}/cancel`)
            .set(TENANT_A);
        strict_1.default.equal(cancelRes.statusCode, 201);
        strict_1.default.equal(cancelRes.body.data.status, reservation_entity_1.ReservationStatus.Cancelled);
        const qCancelRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/queues/${queueId}/cancel`)
            .set(TENANT_A);
        strict_1.default.equal(qCancelRes.statusCode, 201);
        strict_1.default.equal(qCancelRes.body.data.status, queue_entity_1.QueueStatus.Cancelled);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-8: cannot start progress without CONFIRMED status', async () => {
    const { app } = await buildApp();
    await (0, supertest_1.default)(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'jack' });
    try {
        const resRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/reservations')
            .set(TENANT_A)
            .send({
            memberId: 'jack',
            resourceId: 'r-1',
            resourceName: 'R-1',
            type: reservation_entity_1.ReservationType.Equipment,
            startTime: futureTime(60),
            endTime: futureTime(120),
            duration: 60,
            price: 0
        });
        const id = resRes.body.data.id;
        const startRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/reservations/${id}/start-progress`)
            .set(TENANT_A);
        strict_1.default.equal(startRes.statusCode, 500, 'PENDING 状态不能 startProgress');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-8: cross-tenant isolation - Tenant B cannot confirm Tenant A reservation', async () => {
    const { app } = await buildApp();
    await (0, supertest_1.default)(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'lily' });
    try {
        const resRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/reservations')
            .set(TENANT_A)
            .send({
            memberId: 'lily',
            resourceId: 'r-A',
            resourceName: 'R-A',
            type: reservation_entity_1.ReservationType.Venue,
            startTime: futureTime(60),
            endTime: futureTime(120),
            duration: 60,
            price: 0
        });
        const reservationId = resRes.body.data.id;
        const tenantBConfirm = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/reservations/${reservationId}/confirm`)
            .set(TENANT_B);
        strict_1.default.equal(tenantBConfirm.statusCode, 500, 'Tenant B 不能 confirm Tenant A 预约');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-8: estimated wait time accumulates per queue (5min/person)', async () => {
    const { app } = await buildApp();
    await (0, supertest_1.default)(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'm1' });
    await (0, supertest_1.default)(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'm2' });
    await (0, supertest_1.default)(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'm3' });
    try {
        const q1 = await (0, supertest_1.default)(app.getHttpServer()).post('/queues/join').set(TENANT_A).send({ memberId: 'm1' });
        const q2 = await (0, supertest_1.default)(app.getHttpServer()).post('/queues/join').set(TENANT_A).send({ memberId: 'm2' });
        const q3 = await (0, supertest_1.default)(app.getHttpServer()).post('/queues/join').set(TENANT_A).send({ memberId: 'm3' });
        strict_1.default.equal(q1.body.data.estimatedWaitMin, 0);
        strict_1.default.equal(q2.body.data.estimatedWaitMin, 5);
        strict_1.default.equal(q3.body.data.estimatedWaitMin, 10);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-8: reservation conflict detection - same resource + overlapping time', async () => {
    const { app } = await buildApp();
    await (0, supertest_1.default)(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'n1' });
    await (0, supertest_1.default)(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'n2' });
    try {
        const start = futureTime(60);
        const end = futureTime(120);
        // 第一个预约 confirm
        const r1 = await (0, supertest_1.default)(app.getHttpServer())
            .post('/reservations')
            .set(TENANT_A)
            .send({
            memberId: 'n1',
            resourceId: 'conflict-room',
            resourceName: 'R',
            type: reservation_entity_1.ReservationType.Venue,
            startTime: start,
            endTime: end,
            duration: 60,
            price: 0
        });
        strict_1.default.equal(r1.statusCode, 201);
        await (0, supertest_1.default)(app.getHttpServer()).post(`/reservations/${r1.body.data.id}/confirm`).set(TENANT_A);
        // 第二个预约同资源同时段 → conflict
        const r2 = await (0, supertest_1.default)(app.getHttpServer())
            .post('/reservations')
            .set(TENANT_A)
            .send({
            memberId: 'n2',
            resourceId: 'conflict-room',
            resourceName: 'R',
            type: reservation_entity_1.ReservationType.Venue,
            startTime: start,
            endTime: end,
            duration: 60,
            price: 0
        });
        // conflict 检测在 confirm 时抛错 (create 不检查)
        strict_1.default.equal(r2.statusCode, 201, 'create 阶段允许');
        const r2Confirm = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/reservations/${r2.body.data.id}/confirm`)
            .set(TENANT_A);
        strict_1.default.equal(r2Confirm.statusCode, 500, 'confirm 阶段检测到同时段冲突');
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=cross-module-e2e-8-reservation-queue-cashier.test.js.map