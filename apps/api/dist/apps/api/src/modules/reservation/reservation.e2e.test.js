"use strict";
/**
 * 🐜 自动: [reservation] E2E 基础测试
 *
 * E2E 链路: HTTP → ReservationController → ReservationService → ReservationEntity
 *
 * 覆盖:
 *   - Reservation CRUD: 创建 / 详情 / 列表 / 更新
 *   - 状态机: Pending → Confirmed → InProgress → Completed
 *   - 冲突检测: 同 resource 同时段 → 拒绝
 *   - 取消 + cancelledReason
 *   - 按时间范围 / 用户 / 资源 查询
 *   - 跨租户隔离
 *   - 错误处理
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
const node_test_1 = __importStar(require("node:test"));
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
const reservation_service_1 = require("./reservation.service");
const reservation_entity_1 = require("./reservation.entity");
// ========== 测试 Controller ==========
let TestReservationController = class TestReservationController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(tenantId, body) {
        return this.service.create({ ...body, tenantId });
    }
    list(tenantId, query) {
        return this.service.findAll(tenantId, query);
    }
    detail(tenantId, id) {
        const r = this.service.findOne(id, tenantId);
        if (!r)
            throw new common_1.NotFoundException(`Reservation ${id} not found`);
        return r;
    }
    update(tenantId, id, body) {
        return this.service.update(id, tenantId, body);
    }
    confirm(tenantId, id) {
        return this.service.confirm(id, tenantId);
    }
    startProgress(tenantId, id) {
        return this.service.startProgress(id, tenantId);
    }
    complete(tenantId, id) {
        return this.service.complete(id, tenantId);
    }
    cancel(tenantId, id, body) {
        return this.service.cancel(id, tenantId, body?.reason);
    }
    checkConflict(tenantId, query) {
        try {
            this.service.checkConflict(tenantId, query.resourceId, query.startTime, query.endTime);
            return { conflict: false };
        }
        catch {
            return { conflict: true };
        }
    }
};
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestReservationController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestReservationController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TestReservationController.prototype, "detail", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TestReservationController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TestReservationController.prototype, "confirm", null);
__decorate([
    (0, common_1.Post)(':id/start'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TestReservationController.prototype, "startProgress", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TestReservationController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TestReservationController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)('check/conflict'),
    __param(0, (0, common_1.Headers)('x-tenant-id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestReservationController.prototype, "checkConflict", null);
TestReservationController = __decorate([
    (0, common_1.Controller)('reservation'),
    __param(0, (0, common_1.Inject)(reservation_service_1.ReservationService)),
    __metadata("design:paramtypes", [reservation_service_1.ReservationService])
], TestReservationController);
// ========== 构建 app ==========
async function buildApp() {
    const service = new reservation_service_1.ReservationService();
    service.resetStoreForTests();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestReservationController],
        providers: [{ provide: reservation_service_1.ReservationService, useValue: service }]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, service };
}
const TENANT_HEADERS = {
    'x-tenant-id': 'tenant-001',
    'x-brand-id': 'brand-001',
    'x-store-id': 'store-001'
};
const TENANT_B_HEADERS = {
    'x-tenant-id': 'tenant-002',
    'x-brand-id': 'brand-001',
    'x-store-id': 'store-001'
};
const FUTURE_START = '2027-08-01T10:00:00Z';
const FUTURE_END = '2027-08-01T12:00:00Z';
async function createReservation(app, overrides = {}, headers = TENANT_HEADERS) {
    return (0, supertest_1.default)(app.getHttpServer())
        .post('/reservation')
        .set(headers)
        .send({
        type: reservation_entity_1.ReservationType.Venue,
        resourceId: 'res-001',
        resourceName: '球桌A',
        userId: 'user-001',
        userName: '张三',
        startTime: FUTURE_START,
        endTime: FUTURE_END,
        duration: 120,
        price: 100,
        deposit: 50,
        ...overrides
    });
}
// ========== E2E: Reservation CRUD ==========
(0, node_test_1.describe)('E2E: Reservation CRUD', () => {
    (0, node_test_1.default)('POST → GET :id → PUT → GET 完整生命周期', async () => {
        const { app } = await buildApp();
        try {
            const createRes = await createReservation(app);
            strict_1.default.equal(createRes.statusCode, 201);
            const id = createRes.body.data.id;
            strict_1.default.ok(id.startsWith('reservation-'));
            strict_1.default.equal(createRes.body.data.status, reservation_entity_1.ReservationStatus.Pending);
            const getRes = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/reservation/${id}`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(getRes.statusCode, 200);
            strict_1.default.equal(getRes.body.data.id, id);
            const updateRes = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/reservation/${id}`)
                .set(TENANT_HEADERS)
                .send({ price: 200, remark: 'VIP' });
            strict_1.default.equal(updateRes.statusCode, 200);
            strict_1.default.equal(updateRes.body.data.price, 200);
            strict_1.default.equal(updateRes.body.data.remark, 'VIP');
            const afterRes = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/reservation/${id}`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(afterRes.body.data.price, 200);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /reservation 列表 + type 过滤', async () => {
        const { app } = await buildApp();
        try {
            await createReservation(app, { type: reservation_entity_1.ReservationType.Venue });
            await createReservation(app, { type: reservation_entity_1.ReservationType.Service });
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/reservation?type=${reservation_entity_1.ReservationType.Service}`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            for (const r of res.body.data)
                strict_1.default.equal(r.type, reservation_entity_1.ReservationType.Service);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /reservation/:id 不存在返回 404', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/reservation/non-existent-id')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 404);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('POST 时间倒序 → 服务抛错 → 500', async () => {
        const { app } = await buildApp();
        try {
            const res = await createReservation(app, {
                startTime: FUTURE_END,
                endTime: FUTURE_START
            });
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 状态机 ==========
(0, node_test_1.describe)('E2E: 状态机转换', () => {
    (0, node_test_1.default)('Pending → Confirmed → InProgress → Completed 完整链路', async () => {
        const { app } = await buildApp();
        try {
            const create = await createReservation(app);
            const id = create.body.data.id;
            const confirm = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${id}/confirm`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(confirm.statusCode, 201);
            strict_1.default.equal(confirm.body.data.status, reservation_entity_1.ReservationStatus.Confirmed);
            const start = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${id}/start`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(start.statusCode, 201);
            strict_1.default.equal(start.body.data.status, reservation_entity_1.ReservationStatus.InProgress);
            const complete = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${id}/complete`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(complete.statusCode, 201);
            strict_1.default.equal(complete.body.data.status, reservation_entity_1.ReservationStatus.Completed);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('Pending 不可直接 InProgress', async () => {
        const { app } = await buildApp();
        try {
            const create = await createReservation(app);
            const id = create.body.data.id;
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${id}/start`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('Confirmed 不可回退 Pending', async () => {
        const { app } = await buildApp();
        try {
            const create = await createReservation(app);
            const id = create.body.data.id;
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${id}/confirm`)
                .set(TENANT_HEADERS);
            // 试图再 confirm
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${id}/confirm`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('Completed 不可再转换', async () => {
        const { app } = await buildApp();
        try {
            const create = await createReservation(app);
            const id = create.body.data.id;
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${id}/confirm`)
                .set(TENANT_HEADERS);
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${id}/start`)
                .set(TENANT_HEADERS);
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${id}/complete`)
                .set(TENANT_HEADERS);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${id}/cancel`)
                .set(TENANT_HEADERS)
                .send({ reason: 'after complete' });
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 取消 ==========
(0, node_test_1.describe)('E2E: 取消流程', () => {
    (0, node_test_1.default)('Pending → Cancelled + cancelledReason', async () => {
        const { app } = await buildApp();
        try {
            const create = await createReservation(app);
            const id = create.body.data.id;
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${id}/cancel`)
                .set(TENANT_HEADERS)
                .send({ reason: '客户取消' });
            strict_1.default.equal(res.statusCode, 201);
            strict_1.default.equal(res.body.data.status, reservation_entity_1.ReservationStatus.Cancelled);
            strict_1.default.equal(res.body.data.cancelledReason, '客户取消');
            strict_1.default.ok(res.body.data.cancelledAt);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('Confirmed 也可取消', async () => {
        const { app } = await buildApp();
        try {
            const create = await createReservation(app);
            const id = create.body.data.id;
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${id}/confirm`)
                .set(TENANT_HEADERS);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${id}/cancel`)
                .set(TENANT_HEADERS)
                .send({ reason: '临时取消' });
            strict_1.default.equal(res.statusCode, 201);
            strict_1.default.equal(res.body.data.status, reservation_entity_1.ReservationStatus.Cancelled);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 冲突检测 ==========
(0, node_test_1.describe)('E2E: 资源冲突检测', () => {
    (0, node_test_1.default)('同一 resource 同时段 → 第二次 confirm 失败', async () => {
        const { app } = await buildApp();
        try {
            const r1 = await createReservation(app, { resourceId: 'res-A' });
            const r2 = await createReservation(app, {
                resourceId: 'res-A',
                userId: 'user-002',
                userName: '李四'
            });
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${r1.body.data.id}/confirm`)
                .set(TENANT_HEADERS);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${r2.body.data.id}/confirm`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('不同 resource 不冲突', async () => {
        const { app } = await buildApp();
        try {
            const r1 = await createReservation(app, { resourceId: 'res-A' });
            const r2 = await createReservation(app, { resourceId: 'res-B' });
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${r1.body.data.id}/confirm`)
                .set(TENANT_HEADERS);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${r2.body.data.id}/confirm`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 201);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('相邻时段不冲突', async () => {
        const { app } = await buildApp();
        try {
            const r1 = await createReservation(app, {
                resourceId: 'res-A',
                startTime: '2027-08-01T10:00:00Z',
                endTime: '2027-08-01T12:00:00Z'
            });
            const r2 = await createReservation(app, {
                resourceId: 'res-A',
                startTime: '2027-08-01T12:00:00Z',
                endTime: '2027-08-01T14:00:00Z',
                userId: 'user-002',
                userName: '李四'
            });
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${r1.body.data.id}/confirm`)
                .set(TENANT_HEADERS);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${r2.body.data.id}/confirm`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 201);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /reservation/check/conflict 冲突检测 API', async () => {
        const { app } = await buildApp();
        try {
            const r1 = await createReservation(app, { resourceId: 'res-A' });
            await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${r1.body.data.id}/confirm`)
                .set(TENANT_HEADERS);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/reservation/check/conflict?resourceId=res-A&startTime=${FUTURE_START}&endTime=${FUTURE_END}`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.equal(res.body.data.conflict, true);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /reservation/check/conflict 无冲突', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/reservation/check/conflict?resourceId=res-A&startTime=${FUTURE_START}&endTime=${FUTURE_END}`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.equal(res.body.data.conflict, false);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 跨租户隔离 ==========
(0, node_test_1.describe)('E2E: 跨租户隔离', () => {
    (0, node_test_1.default)('tenant-B 看不到 tenant-A 的 reservation', async () => {
        const { app } = await buildApp();
        try {
            const create = await createReservation(app, {}, TENANT_HEADERS);
            const id = create.body.data.id;
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/reservation/${id}`)
                .set(TENANT_B_HEADERS);
            strict_1.default.equal(res.statusCode, 404);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('tenant-B 列表只返回自己的', async () => {
        const { app } = await buildApp();
        try {
            await createReservation(app, { userName: 'A-User' }, TENANT_HEADERS);
            await createReservation(app, { userName: 'B-User' }, TENANT_B_HEADERS);
            const a = await (0, supertest_1.default)(app.getHttpServer())
                .get('/reservation')
                .set(TENANT_HEADERS);
            const b = await (0, supertest_1.default)(app.getHttpServer())
                .get('/reservation')
                .set(TENANT_B_HEADERS);
            strict_1.default.equal(a.body.data.length, 1);
            strict_1.default.equal(b.body.data.length, 1);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('tenant-B 无法 confirm tenant-A 的 reservation', async () => {
        const { app } = await buildApp();
        try {
            const create = await createReservation(app, {}, TENANT_HEADERS);
            const id = create.body.data.id;
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/reservation/${id}/confirm`)
                .set(TENANT_B_HEADERS);
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
});
//# sourceMappingURL=reservation.e2e.test.js.map