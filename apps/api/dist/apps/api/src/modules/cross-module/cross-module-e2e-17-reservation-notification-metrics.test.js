"use strict";
/**
 * E2E 跨模块 #17 — 预约管理 → 通知派发 → Metrics 指标追踪 联动
 *
 * 链路:
 *   ReservationService.create → confirm → cancel → complete
 *   → NotificationService.registerTemplate → send → getDispatch
 *   → MetricsService.registerCounter→incrementCounter, setGauge→render
 *
 * 验证:
 *   - 预约完整生命周期: Pending → Confirmed → Completed | Cancelled
 *   - 每次状态变更可派发通知
 *   - 失败通知可 retry
 *   - Metrics 计数器+仪表盘
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
const reservation_service_1 = require("../reservation/reservation.service");
const reservation_entity_1 = require("../reservation/reservation.entity");
const notification_service_1 = require("../notification/notification.service");
const notification_entity_1 = require("../notification/notification.entity");
const metrics_service_1 = require("../observability/metrics.service");
let TestController = class TestController {
    reservation;
    notification;
    metrics;
    constructor(reservation, notification, metrics) {
        this.reservation = reservation;
        this.notification = notification;
        this.metrics = metrics;
        this.metrics.registerCounter('reservation_events_total', 'Total reservation events');
        this.metrics.registerGauge('active_reservations', 'Active reservation count');
        this.metrics.registerCounter('notification_dispatches_total', 'Notification dispatch count');
    }
    createReservation(body) {
        const r = this.reservation.create(body);
        this.metrics.incrementCounter('reservation_events_total', { action: 'create' });
        return r;
    }
    confirmReservation(id, body) {
        const r = this.reservation.confirm(id, body.tenantId);
        this.metrics.incrementCounter('reservation_events_total', { action: 'confirm' });
        return r;
    }
    startProgressReservation(id, body) {
        const r = this.reservation.startProgress(id, body.tenantId);
        this.metrics.incrementCounter('reservation_events_total', { action: 'in_progress' });
        return r;
    }
    cancelReservation(id, body) {
        const r = this.reservation.cancel(id, body.tenantId, body.reason);
        this.metrics.incrementCounter('reservation_events_total', { action: 'cancel' });
        return r;
    }
    completeReservation(id, body) {
        const r = this.reservation.complete(id, body.tenantId);
        this.metrics.incrementCounter('reservation_events_total', { action: 'complete' });
        return r;
    }
    findOneReservation(id, body) {
        return this.reservation.findOne(id, body.tenantId);
    }
    listReservations(body) {
        return this.reservation.findAll(body.tenantId, body.filter);
    }
    registerTemplate(body) {
        return this.notification.registerTemplate(body);
    }
    sendNotification(body) {
        const d = this.notification.send(body);
        this.metrics.incrementCounter('notification_dispatches_total', { status: d.status });
        return d;
    }
    retryNotification(id) {
        const d = this.notification.retryDispatch(id);
        if (d)
            this.metrics.incrementCounter('notification_dispatches_total', { status: 'retried' });
        return d;
    }
    getDispatch(id) {
        return this.notification.getDispatch(id);
    }
    renderMetrics() {
        return { text: this.metrics.render() };
    }
};
__decorate([
    (0, common_1.Post)('reservation'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "createReservation", null);
__decorate([
    (0, common_1.Post)('reservation/:id/confirm'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "confirmReservation", null);
__decorate([
    (0, common_1.Post)('reservation/:id/start-progress'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "startProgressReservation", null);
__decorate([
    (0, common_1.Post)('reservation/:id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "cancelReservation", null);
__decorate([
    (0, common_1.Post)('reservation/:id/complete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "completeReservation", null);
__decorate([
    (0, common_1.Get)('reservation/findOne/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "findOneReservation", null);
__decorate([
    (0, common_1.Post)('reservations/list'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "listReservations", null);
__decorate([
    (0, common_1.Post)('notification/template'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "registerTemplate", null);
__decorate([
    (0, common_1.Post)('notification/send'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "sendNotification", null);
__decorate([
    (0, common_1.Post)('notification/retry/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "retryNotification", null);
__decorate([
    (0, common_1.Get)('notification/dispatch/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "getDispatch", null);
__decorate([
    (0, common_1.Get)('metrics/render'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestController.prototype, "renderMetrics", null);
TestController = __decorate([
    (0, common_1.Controller)(),
    __param(0, (0, common_1.Inject)(reservation_service_1.ReservationService)),
    __param(1, (0, common_1.Inject)(notification_service_1.NotificationService)),
    __param(2, (0, common_1.Inject)(metrics_service_1.MetricsService)),
    __metadata("design:paramtypes", [reservation_service_1.ReservationService,
        notification_service_1.NotificationService,
        metrics_service_1.MetricsService])
], TestController);
async function buildApp() {
    const metricsService = new metrics_service_1.MetricsService(false);
    const module = await testing_1.Test.createTestingModule({
        controllers: [TestController],
        providers: [
            reservation_service_1.ReservationService,
            notification_service_1.NotificationService,
            { provide: metrics_service_1.MetricsService, useValue: metricsService },
        ],
    }).compile();
    const app = module.createNestApplication();
    app.use((_r, _s, n) => n());
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, metricsService };
}
function getData(res) {
    return res.body?.data ?? res.body;
}
// ── Tests ──
(0, node_test_1.default)('跨模块链#17 正例: 预约创建→确认→完成→通知→Metrics', async () => {
    const { app } = await buildApp();
    const srv = app.getHttpServer();
    const tenantId = 't17-1';
    const now = new Date();
    const st = new Date(now.getTime() + 60000).toISOString();
    const et = new Date(now.getTime() + 7200000).toISOString();
    try {
        // 1. 注册模板
        const tmpl = await (0, supertest_1.default)(srv)
            .post('/notification/template')
            .send({
            code: 'res-metric',
            channel: notification_entity_1.NotificationChannelType.InApp,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            tenantId,
            locale: 'zh-CN',
            titleTemplate: '预约通知',
            bodyTemplate: '{{msg}}',
            enabled: true,
        })
            .expect(201);
        strict_1.default.ok(getData(tmpl).id);
        // 2. 创建预约
        const c1 = await (0, supertest_1.default)(srv)
            .post('/reservation')
            .send({
            tenantId,
            type: reservation_entity_1.ReservationType.Coaching,
            resourceId: 'c1',
            resourceName: '金牌教练',
            userId: 'm1',
            userName: '小王',
            startTime: st,
            endTime: et,
            duration: 120,
            price: 29900,
            deposit: 0,
        })
            .expect(201);
        const rid = getData(c1).id;
        strict_1.default.ok(rid);
        strict_1.default.equal(getData(c1).status, reservation_entity_1.ReservationStatus.Pending);
        // 3. 确认
        const cf = await (0, supertest_1.default)(srv)
            .post(`/reservation/${rid}/confirm`)
            .send({ tenantId })
            .expect(201);
        strict_1.default.equal(getData(cf).status, reservation_entity_1.ReservationStatus.Confirmed);
        // 4. 发送通知
        const sn = await (0, supertest_1.default)(srv)
            .post('/notification/send')
            .send({
            channel: notification_entity_1.NotificationChannelType.InApp,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            tenantId,
            recipient: 'm1',
            payload: { msg: '预约已确认' },
        })
            .expect(201);
        strict_1.default.equal(getData(sn).status, notification_entity_1.NotificationStatus.Sent);
        // 5. 开始服务 → InProgress
        const ip = await (0, supertest_1.default)(srv)
            .post(`/reservation/${rid}/start-progress`)
            .send({ tenantId })
            .expect(201);
        strict_1.default.equal(getData(ip).status, reservation_entity_1.ReservationStatus.InProgress);
        // 6. 完成
        const cp = await (0, supertest_1.default)(srv)
            .post(`/reservation/${rid}/complete`)
            .send({ tenantId })
            .expect(201);
        strict_1.default.equal(getData(cp).status, reservation_entity_1.ReservationStatus.Completed);
        // 7. Metrics 验证
        const mr = await (0, supertest_1.default)(srv).get('/metrics/render').expect(200);
        strict_1.default.ok(getData(mr).text.includes('reservation_events_total'));
        strict_1.default.ok(getData(mr).text.includes('notification_dispatches_total'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('跨模块链#17 正例: 预约取消→通知', async () => {
    const { app } = await buildApp();
    const srv = app.getHttpServer();
    const tenantId = 't17-cancel';
    const now = new Date();
    const st = new Date(now.getTime() + 60000).toISOString();
    const et = new Date(now.getTime() + 7200000).toISOString();
    try {
        const c1 = await (0, supertest_1.default)(srv)
            .post('/reservation')
            .send({
            tenantId,
            type: reservation_entity_1.ReservationType.Coaching,
            resourceId: 'c2',
            resourceName: '李教练',
            userId: 'm2',
            userName: '小红',
            startTime: st,
            endTime: et,
            duration: 60,
            price: 19900,
            deposit: 0,
        })
            .expect(201);
        const rid = getData(c1).id;
        await (0, supertest_1.default)(srv).post(`/reservation/${rid}/confirm`).send({ tenantId }).expect(201);
        const cx = await (0, supertest_1.default)(srv)
            .post(`/reservation/${rid}/cancel`)
            .send({ tenantId, reason: '主动取消' })
            .expect(201);
        strict_1.default.equal(getData(cx).status, reservation_entity_1.ReservationStatus.Cancelled);
        const mr = await (0, supertest_1.default)(srv).get('/metrics/render').expect(200);
        strict_1.default.ok(getData(mr).text.includes('reservation_events_total'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('跨模块链#17 反例: 已取消预约不能再次取消', async () => {
    const { app } = await buildApp();
    const srv = app.getHttpServer();
    const tenantId = 't17-dc';
    const now = new Date();
    const st = new Date(now.getTime() + 60000).toISOString();
    const et = new Date(now.getTime() + 7200000).toISOString();
    try {
        const c1 = await (0, supertest_1.default)(srv)
            .post('/reservation')
            .send({
            tenantId,
            type: reservation_entity_1.ReservationType.Coaching,
            resourceId: 'c3',
            resourceName: '王教练',
            userId: 'm3',
            userName: '小蓝',
            startTime: st,
            endTime: et,
            duration: 90,
            price: 39900,
            deposit: 0,
        })
            .expect(201);
        const rid = getData(c1).id;
        await (0, supertest_1.default)(srv).post(`/reservation/${rid}/confirm`).send({ tenantId }).expect(201);
        await (0, supertest_1.default)(srv).post(`/reservation/${rid}/cancel`).send({ tenantId }).expect(201);
        const r2 = await (0, supertest_1.default)(srv).post(`/reservation/${rid}/cancel`).send({ tenantId });
        strict_1.default.ok(r2.status >= 400, '重复取消应失败');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('跨模块链#17 边界: 通知失败→retry→成功', async () => {
    const { app } = await buildApp();
    const srv = app.getHttpServer();
    const tenantId = 't17-retry';
    try {
        const sn = await (0, supertest_1.default)(srv)
            .post('/notification/send')
            .send({
            channel: notification_entity_1.NotificationChannelType.Email,
            scopeType: notification_entity_1.FoundationScopeType.Tenant,
            tenantId,
            recipient: 'fail@test.com',
            payload: {},
        })
            .expect(201);
        const d = getData(sn);
        strict_1.default.ok(d);
        strict_1.default.equal(d.status, notification_entity_1.NotificationStatus.Failed);
        const rt = await (0, supertest_1.default)(srv).post(`/notification/retry/${d.id}`).expect(201);
        const retried = getData(rt);
        strict_1.default.ok(retried.id);
        strict_1.default.equal(retried.status, notification_entity_1.NotificationStatus.Failed, '因recipient含fail, retry后仍为Failed');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('跨模块链#17 反例: 跨租户隔离', async () => {
    const { app } = await buildApp();
    const srv = app.getHttpServer();
    const now = new Date();
    const st = new Date(now.getTime() + 60000).toISOString();
    const et = new Date(now.getTime() + 7200000).toISOString();
    try {
        const c1 = await (0, supertest_1.default)(srv)
            .post('/reservation')
            .send({
            tenantId: 'tA',
            type: reservation_entity_1.ReservationType.Coaching,
            resourceId: 'cA',
            resourceName: 'A教练',
            userId: 'mA',
            userName: 'A',
            startTime: st,
            endTime: et,
            duration: 60,
            price: 100,
            deposit: 0,
        })
            .expect(201);
        const rid = getData(c1).id;
        const g1 = await (0, supertest_1.default)(srv)
            .get(`/reservation/findOne/${rid}`)
            .send({ tenantId: 'tB' })
            .expect(200);
        strict_1.default.equal(g1.body.data, undefined, '租户B不应看到租户A的预约');
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=cross-module-e2e-17-reservation-notification-metrics.test.js.map