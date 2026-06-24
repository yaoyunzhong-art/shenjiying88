"use strict";
/**
 * 🐜 自动: [reservation] [D] controller spec 补全
 *
 * ReservationController 综合测试：
 * - 正例：正常创建、查询、状态流转
 * - 反例：参数校验失败、状态流转违规、资源冲突
 * - 边界：空结果、时间范围、越权访问
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const common_1 = require("@nestjs/common");
const reservation_controller_1 = require("./reservation.controller");
const reservation_service_1 = require("./reservation.service");
const reservation_entity_1 = require("./reservation.entity");
// ── Fixtures ──
const TENANT_A = {
    tenantId: 't-res-a',
    brandId: 'brand-a',
    storeId: 'store-a',
    marketCode: 'SH',
};
const TENANT_B = {
    tenantId: 't-res-b',
    brandId: 'brand-b',
    storeId: 'store-b',
    marketCode: 'BJ',
};
const NOW = '2026-06-24T08:00:00.000Z';
const ONE_HOUR_LATER = '2026-06-24T09:00:00.000Z';
const TWO_HOURS_LATER = '2026-06-24T10:00:00.000Z';
const THREE_HOURS_LATER = '2026-06-24T11:00:00.000Z';
const FOUR_HOURS_LATER = '2026-06-24T12:00:00.000Z';
function createController() {
    const svc = new reservation_service_1.ReservationService();
    const ctrl = new reservation_controller_1.ReservationController(svc);
    return { ctrl, svc };
}
function makeCreateBody(overrides = {}) {
    return {
        type: reservation_entity_1.ReservationType.Venue,
        resourceId: 'vr-arena-01',
        resourceName: 'VR 竞技场 1号',
        userId: 'user-zhang',
        userName: '张三',
        startTime: NOW,
        endTime: ONE_HOUR_LATER,
        duration: 60,
        price: 88,
        deposit: 20,
        ...overrides,
    };
}
function makeUpdateBody(overrides = {}) {
    return {
        ...overrides,
    };
}
// ── Helper: 创建并返回预约 ID ──
function createReservation(ctrl, ctx = TENANT_A, overrides = {}) {
    const result = ctrl.createReservation(ctx, makeCreateBody(overrides));
    return result.id;
}
// ══════════════════════════════════════════════════════════════════════
// 测试套件
// ══════════════════════════════════════════════════════════════════════
(0, node_test_1.describe)('ReservationController', () => {
    // ── POST /reservations 创建预约 ──
    (0, node_test_1.describe)('POST /reservations — 创建预约', () => {
        (0, node_test_1.default)('正例: 有效数据创建预约，返回完整实体', () => {
            const { ctrl } = createController();
            const body = makeCreateBody();
            const result = ctrl.createReservation(TENANT_A, body);
            strict_1.default.ok(result, '应返回结果');
            strict_1.default.ok(result.id, '应有 id');
            strict_1.default.equal(result.tenantId, 't-res-a');
            strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Pending);
            strict_1.default.equal(result.resourceName, 'VR 竞技场 1号');
            strict_1.default.equal(result.userId, 'user-zhang');
            strict_1.default.equal(result.duration, 60);
        });
        (0, node_test_1.default)('反例: endTime <= startTime 时抛出错误', () => {
            const { ctrl } = createController();
            const body = makeCreateBody({
                startTime: ONE_HOUR_LATER,
                endTime: NOW,
            });
            strict_1.default.throws(() => ctrl.createReservation(TENANT_A, body), /endTime must be after startTime/);
        });
        (0, node_test_1.default)('边界: 不同租户创建相同资源预约互不干扰', () => {
            const { ctrl } = createController();
            const idA = createReservation(ctrl, TENANT_A);
            const idB = createReservation(ctrl, TENANT_B);
            strict_1.default.notEqual(idA, idB, 'id 应不相同');
            const resultA = ctrl.findOne(TENANT_A, idA);
            strict_1.default.equal(resultA.tenantId, 't-res-a');
        });
    });
    // ── GET /reservations 查询列表 ──
    (0, node_test_1.describe)('GET /reservations — 查询列表', () => {
        (0, node_test_1.default)('正例: 返回同一租户所有预约', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            createReservation(ctrl, TENANT_A);
            createReservation(ctrl, TENANT_A, { type: reservation_entity_1.ReservationType.Equipment });
            createReservation(ctrl, TENANT_B); // 不同租户
            const result = ctrl.findAll(TENANT_A, {});
            strict_1.default.equal(result.length, 2, '只返回 tenant_a 的 2 条');
        });
        (0, node_test_1.default)('正例: 按 type 筛选', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            createReservation(ctrl, TENANT_A); // Venue
            createReservation(ctrl, TENANT_A, { type: reservation_entity_1.ReservationType.Equipment });
            createReservation(ctrl, TENANT_A, { type: reservation_entity_1.ReservationType.Equipment });
            const result = ctrl.findAll(TENANT_A, {
                type: reservation_entity_1.ReservationType.Equipment,
            });
            strict_1.default.equal(result.length, 2);
        });
        (0, node_test_1.default)('边界: 无预约时返回空数组', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            const result = ctrl.findAll(TENANT_A, {});
            strict_1.default.ok(Array.isArray(result));
            strict_1.default.equal(result.length, 0);
        });
        (0, node_test_1.default)('反例: 不同租户看不到对方预约', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            createReservation(ctrl, TENANT_A);
            const result = ctrl.findAll(TENANT_B, {});
            strict_1.default.equal(result.length, 0);
        });
    });
    // ── GET /reservations/:id 单个查询 ──
    (0, node_test_1.describe)('GET /reservations/:id — 单个查询', () => {
        (0, node_test_1.default)('正例: 根据 ID 查到预约', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            const id = createReservation(ctrl, TENANT_A);
            const result = ctrl.findOne(TENANT_A, id);
            strict_1.default.equal(result.id, id);
        });
        (0, node_test_1.default)('反例: 不存在的 ID 抛出 404', () => {
            const { ctrl } = createController();
            strict_1.default.throws(() => ctrl.findOne(TENANT_A, 'non-existent-id'), (e) => e.getStatus() === common_1.HttpStatus.NOT_FOUND);
        });
        (0, node_test_1.default)('反例: 跨租户访问返回 404', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            const id = createReservation(ctrl, TENANT_A);
            strict_1.default.throws(() => ctrl.findOne(TENANT_B, id), (e) => e.getStatus() === common_1.HttpStatus.NOT_FOUND);
        });
    });
    // ── GET 辅助查询 ──
    (0, node_test_1.describe)('GET /reservations/by-user/:userId', () => {
        (0, node_test_1.default)('正例: 按用户查询', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            createReservation(ctrl, TENANT_A);
            createReservation(ctrl, TENANT_A, { userId: 'user-li', userName: '李四' });
            createReservation(ctrl, TENANT_A, { userId: 'user-li', userName: '李四' });
            const result = ctrl.findByUser(TENANT_A, 'user-li');
            strict_1.default.equal(result.length, 2);
        });
        (0, node_test_1.default)('边界: 用户无预约时返回 []', () => {
            const { ctrl } = createController();
            const result = ctrl.findByUser(TENANT_A, 'no-reservations');
            strict_1.default.equal(result.length, 0);
        });
    });
    (0, node_test_1.describe)('GET /reservations/by-resource/:resourceId', () => {
        (0, node_test_1.default)('正例: 按资源查询', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            createReservation(ctrl, TENANT_A, { resourceId: 'room-01' });
            createReservation(ctrl, TENANT_A, { resourceId: 'room-01' });
            createReservation(ctrl, TENANT_A, { resourceId: 'room-02' });
            const result = ctrl.findByResource(TENANT_A, 'room-01');
            strict_1.default.equal(result.length, 2);
        });
    });
    (0, node_test_1.describe)('GET /reservations/by-timerange', () => {
        (0, node_test_1.default)('正例: 按时间范围筛选', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            createReservation(ctrl, TENANT_A, {
                startTime: '2026-06-24T10:00:00.000Z',
                endTime: '2026-06-24T11:00:00.000Z',
            });
            createReservation(ctrl, TENANT_A, {
                startTime: '2026-06-25T10:00:00.000Z',
                endTime: '2026-06-25T11:00:00.000Z',
            });
            const result = ctrl.findByTimeRange(TENANT_A, '2026-06-24T00:00:00.000Z', '2026-06-24T23:59:59.000Z');
            strict_1.default.equal(result.length, 1);
        });
        (0, node_test_1.default)('反例: 缺少参数时抛出 400', () => {
            const { ctrl } = createController();
            strict_1.default.throws(() => ctrl.findByTimeRange(TENANT_A, '', ''), /startDate and endDate are required/);
        });
    });
    // ── GET /reservations/check-conflict ──
    (0, node_test_1.describe)('GET /reservations/check-conflict', () => {
        (0, node_test_1.default)('正例: 无冲突返回 false', () => {
            const { ctrl } = createController();
            const result = ctrl.checkConflict(TENANT_A, 'room-01', NOW, ONE_HOUR_LATER);
            strict_1.default.equal(result.hasConflict, false);
        });
        (0, node_test_1.default)('反例: 资源已预订返回 true', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            // 先创建并确认
            const id = createReservation(ctrl, TENANT_A, { resourceId: 'room-01' });
            ctrl.updateReservation(TENANT_A, id, { status: reservation_entity_1.ReservationStatus.Confirmed });
            const result = ctrl.checkConflict(TENANT_A, 'room-01', NOW, ONE_HOUR_LATER);
            strict_1.default.equal(result.hasConflict, true);
        });
        (0, node_test_1.default)('反例: 缺少必填参数抛出 400', () => {
            const { ctrl } = createController();
            // @ts-expect-error - 模拟缺失参数
            strict_1.default.throws(() => ctrl.checkConflict(TENANT_A, null, null, null), /resourceId, startTime, and endTime are required/);
        });
        (0, node_test_1.default)('边界: 确认后已取消的预约不产生冲突', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            const id = createReservation(ctrl, TENANT_A, { resourceId: 'room-01' });
            ctrl.updateReservation(TENANT_A, id, { status: reservation_entity_1.ReservationStatus.Confirmed });
            ctrl.updateReservation(TENANT_A, id, { status: reservation_entity_1.ReservationStatus.Cancelled });
            const result = ctrl.checkConflict(TENANT_A, 'room-01', NOW, ONE_HOUR_LATER);
            strict_1.default.equal(result.hasConflict, false, '已取消的预约不冲突');
        });
    });
    // ── PATCH /reservations/:id 更新与状态流转 ──
    (0, node_test_1.describe)('PATCH /reservations/:id — 更新与状态流转', () => {
        (0, node_test_1.default)('正例: Pending → Confirmed', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            const id = createReservation(ctrl, TENANT_A);
            const result = ctrl.updateReservation(TENANT_A, id, {
                status: reservation_entity_1.ReservationStatus.Confirmed,
            });
            strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Confirmed);
        });
        (0, node_test_1.default)('正例: Confirmed → InProgress → Completed 全流程', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            const id = createReservation(ctrl, TENANT_A);
            ctrl.updateReservation(TENANT_A, id, { status: reservation_entity_1.ReservationStatus.Confirmed });
            ctrl.updateReservation(TENANT_A, id, { status: reservation_entity_1.ReservationStatus.InProgress });
            const result = ctrl.updateReservation(TENANT_A, id, {
                status: reservation_entity_1.ReservationStatus.Completed,
            });
            strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Completed);
        });
        (0, node_test_1.default)('正例: 更新非状态字段（price, remark）', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            const id = createReservation(ctrl, TENANT_A);
            const result = ctrl.updateReservation(TENANT_A, id, {
                price: 128,
                remark: 'VIP 加时服务',
            });
            strict_1.default.equal(result.price, 128);
            strict_1.default.equal(result.remark, 'VIP 加时服务');
        });
        (0, node_test_1.default)('反例: Pending → Completed 非法流转', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            const id = createReservation(ctrl, TENANT_A);
            strict_1.default.throws(() => ctrl.updateReservation(TENANT_A, id, {
                status: reservation_entity_1.ReservationStatus.Completed,
            }), /Invalid reservation status transition/);
        });
        (0, node_test_1.default)('反例: Completed → Confirmed 逆向流转', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            const id = createReservation(ctrl, TENANT_A);
            ctrl.updateReservation(TENANT_A, id, { status: reservation_entity_1.ReservationStatus.Confirmed });
            ctrl.updateReservation(TENANT_A, id, { status: reservation_entity_1.ReservationStatus.InProgress });
            ctrl.updateReservation(TENANT_A, id, { status: reservation_entity_1.ReservationStatus.Completed });
            strict_1.default.throws(() => ctrl.updateReservation(TENANT_A, id, {
                status: reservation_entity_1.ReservationStatus.Confirmed,
            }), /Invalid reservation status transition/);
        });
        (0, node_test_1.default)('反例: 跨租户更新抛出错误', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            const id = createReservation(ctrl, TENANT_A);
            strict_1.default.throws(() => ctrl.updateReservation(TENANT_B, id, {
                status: reservation_entity_1.ReservationStatus.Confirmed,
            }), /Reservation not found/);
        });
    });
    // ── DELETE /reservations/:id 取消 ──
    (0, node_test_1.describe)('DELETE /reservations/:id — 取消预约', () => {
        (0, node_test_1.default)('正例: 取消预约并记录原因', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            const id = createReservation(ctrl, TENANT_A);
            const result = ctrl.cancelReservation(TENANT_A, id, '行程变更');
            strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Cancelled);
            strict_1.default.equal(result.cancelledReason, '行程变更');
        });
        (0, node_test_1.default)('反例: 已完成预约无法取消', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            const id = createReservation(ctrl, TENANT_A);
            ctrl.updateReservation(TENANT_A, id, { status: reservation_entity_1.ReservationStatus.Confirmed });
            ctrl.updateReservation(TENANT_A, id, { status: reservation_entity_1.ReservationStatus.InProgress });
            ctrl.updateReservation(TENANT_A, id, { status: reservation_entity_1.ReservationStatus.Completed });
            strict_1.default.throws(() => ctrl.cancelReservation(TENANT_A, id), /Invalid reservation status transition/);
        });
        (0, node_test_1.default)('反例: 跨租户取消抛出错误', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            const id = createReservation(ctrl, TENANT_A);
            strict_1.default.throws(() => ctrl.cancelReservation(TENANT_B, id), /Reservation not found/);
        });
    });
    // ── 确认时的冲突检测（集成） ──
    (0, node_test_1.describe)('确认预约冲突检测', () => {
        (0, node_test_1.default)('反例: 同一资源同一时间确认冲突', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            const id1 = createReservation(ctrl, TENANT_A, { resourceId: 'room-01' });
            const id2 = createReservation(ctrl, TENANT_A, { resourceId: 'room-01' });
            ctrl.updateReservation(TENANT_A, id1, { status: reservation_entity_1.ReservationStatus.Confirmed });
            strict_1.default.throws(() => ctrl.updateReservation(TENANT_A, id2, {
                status: reservation_entity_1.ReservationStatus.Confirmed,
            }), /is already booked/);
        });
        (0, node_test_1.default)('边界: 非重叠时间可以确认', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            const id1 = createReservation(ctrl, TENANT_A, {
                resourceId: 'room-01',
                startTime: NOW,
                endTime: ONE_HOUR_LATER,
            });
            const id2 = createReservation(ctrl, TENANT_A, {
                resourceId: 'room-01',
                startTime: TWO_HOURS_LATER,
                endTime: THREE_HOURS_LATER,
            });
            ctrl.updateReservation(TENANT_A, id1, { status: reservation_entity_1.ReservationStatus.Confirmed });
            // 第二段不重叠，应正常确认
            const result = ctrl.updateReservation(TENANT_A, id2, {
                status: reservation_entity_1.ReservationStatus.Confirmed,
            });
            strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Confirmed);
        });
        (0, node_test_1.default)('边界: 不同资源不冲突', () => {
            const { ctrl, svc } = createController();
            svc.resetStoreForTests();
            const id1 = createReservation(ctrl, TENANT_A, { resourceId: 'room-01' });
            const id2 = createReservation(ctrl, TENANT_A, { resourceId: 'room-02' });
            ctrl.updateReservation(TENANT_A, id1, { status: reservation_entity_1.ReservationStatus.Confirmed });
            const result = ctrl.updateReservation(TENANT_A, id2, {
                status: reservation_entity_1.ReservationStatus.Confirmed,
            });
            strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Confirmed);
        });
    });
});
//# sourceMappingURL=reservation.controller.spec.js.map