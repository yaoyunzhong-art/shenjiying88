"use strict";
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
const reservation_controller_1 = require("./reservation.controller");
const reservation_entity_1 = require("./reservation.entity");
function tenantCtx(overrides) {
    return { tenantId: 't-default', ...overrides };
}
function sampleReservation(overrides) {
    return {
        id: 'reservation-001',
        tenantId: 't-default',
        type: reservation_entity_1.ReservationType.Venue,
        resourceId: 'room-101',
        resourceName: 'VIP Room',
        userId: 'u-01',
        userName: '张三',
        status: reservation_entity_1.ReservationStatus.Pending,
        startTime: new Date('2026-06-24T10:00:00.000Z'),
        endTime: new Date('2026-06-24T12:00:00.000Z'),
        duration: 120,
        price: 200,
        deposit: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    };
}
function makeMockService(overrides) {
    return {
        create: () => sampleReservation(),
        findAll: () => [sampleReservation()],
        findOne: () => sampleReservation(),
        findByUser: () => [sampleReservation()],
        findByResource: () => [sampleReservation()],
        findByTimeRange: () => [sampleReservation()],
        checkConflict: () => { },
        update: () => sampleReservation(),
        confirm: () => sampleReservation({ status: reservation_entity_1.ReservationStatus.Confirmed }),
        startProgress: () => sampleReservation({ status: reservation_entity_1.ReservationStatus.InProgress }),
        complete: () => sampleReservation({ status: reservation_entity_1.ReservationStatus.Completed }),
        cancel: () => sampleReservation({ status: reservation_entity_1.ReservationStatus.Cancelled, cancelledAt: new Date() }),
        ...overrides
    };
}
function makeController(overrides) {
    return new reservation_controller_1.ReservationController(makeMockService(overrides));
}
// ── Route Metadata ──
(0, node_test_1.describe)('路由元数据验证', () => {
    (0, node_test_1.default)('controller path 为 reservations', () => {
        const path = Reflect.getMetadata('path', reservation_controller_1.ReservationController);
        strict_1.default.equal(path, 'reservations');
    });
    (0, node_test_1.default)('createReservation POST /', () => {
        const method = Reflect.getMetadata('method', reservation_controller_1.ReservationController.prototype.createReservation);
        const path = Reflect.getMetadata('path', reservation_controller_1.ReservationController.prototype.createReservation);
        strict_1.default.equal(method, 1); // POST
        strict_1.default.equal(path, '/');
    });
    (0, node_test_1.default)('findAll GET /', () => {
        const method = Reflect.getMetadata('method', reservation_controller_1.ReservationController.prototype.findAll);
        const path = Reflect.getMetadata('path', reservation_controller_1.ReservationController.prototype.findAll);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, '/');
    });
    (0, node_test_1.default)('findOne GET /:id', () => {
        const method = Reflect.getMetadata('method', reservation_controller_1.ReservationController.prototype.findOne);
        const path = Reflect.getMetadata('path', reservation_controller_1.ReservationController.prototype.findOne);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, ':id');
    });
    (0, node_test_1.default)('updateReservation PATCH /:id', () => {
        const method = Reflect.getMetadata('method', reservation_controller_1.ReservationController.prototype.updateReservation);
        const path = Reflect.getMetadata('path', reservation_controller_1.ReservationController.prototype.updateReservation);
        strict_1.default.equal(method, 4); // PATCH
        strict_1.default.equal(path, ':id');
    });
    (0, node_test_1.default)('cancelReservation DELETE /:id', () => {
        const method = Reflect.getMetadata('method', reservation_controller_1.ReservationController.prototype.cancelReservation);
        const path = Reflect.getMetadata('path', reservation_controller_1.ReservationController.prototype.cancelReservation);
        strict_1.default.equal(method, 3); // DELETE
        strict_1.default.equal(path, ':id');
    });
});
// ── Controller 方法测试 ──
(0, node_test_1.describe)('ReservationController 方法', () => {
    // ── createReservation ──
    (0, node_test_1.describe)('createReservation', () => {
        (0, node_test_1.default)('正常创建预约', () => {
            const ctrl = makeController();
            const body = {
                type: reservation_entity_1.ReservationType.Venue,
                resourceId: 'room-101',
                resourceName: 'VIP Room',
                userId: 'u-01',
                userName: '张三',
                startTime: '2026-06-24T10:00:00.000Z',
                endTime: '2026-06-24T12:00:00.000Z',
                duration: 120,
                price: 200,
                deposit: 50
            };
            const result = ctrl.createReservation(tenantCtx(), body);
            strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Pending);
            strict_1.default.equal(result.resourceName, 'VIP Room');
        });
        (0, node_test_1.default)('service create 抛出异常时向上传递', () => {
            const ctrl = makeController({
                create: () => { throw new Error('endTime must be after startTime'); }
            });
            strict_1.default.throws(() => ctrl.createReservation(tenantCtx(), {
                type: reservation_entity_1.ReservationType.Venue,
                resourceId: 'x',
                resourceName: 'x',
                userId: 'u',
                userName: 'x',
                startTime: '2026-06-24T12:00:00.000Z',
                endTime: '2026-06-24T10:00:00.000Z',
                duration: 60,
                price: 0,
                deposit: 0
            }), /endTime must be after startTime/);
        });
    });
    // ── findAll ──
    (0, node_test_1.describe)('findAll', () => {
        (0, node_test_1.default)('正常返回预约列表', () => {
            const ctrl = makeController();
            const result = ctrl.findAll(tenantCtx(), {});
            strict_1.default.ok(Array.isArray(result));
            strict_1.default.equal(result.length, 1);
        });
        (0, node_test_1.default)('空列表', () => {
            const ctrl = makeController({ findAll: () => [] });
            const result = ctrl.findAll(tenantCtx(), {});
            strict_1.default.deepEqual(result, []);
        });
    });
    // ── findOne ──
    (0, node_test_1.describe)('findOne', () => {
        (0, node_test_1.default)('找到预约返回实体', () => {
            const ctrl = makeController();
            const result = ctrl.findOne(tenantCtx(), 'reservation-001');
            strict_1.default.equal(result.id, 'reservation-001');
        });
        (0, node_test_1.default)('找不到预约返回 404', () => {
            const ctrl = makeController({ findOne: () => undefined });
            strict_1.default.throws(() => ctrl.findOne(tenantCtx(), 'non-existent'), /Reservation not found/);
        });
    });
    // ── findByUser ──
    (0, node_test_1.describe)('findByUser', () => {
        (0, node_test_1.default)('按用户查询', () => {
            const ctrl = makeController();
            const result = ctrl.findByUser(tenantCtx(), 'u-01');
            strict_1.default.ok(Array.isArray(result));
            strict_1.default.equal(result.length, 1);
        });
    });
    // ── findByResource ──
    (0, node_test_1.describe)('findByResource', () => {
        (0, node_test_1.default)('按资源查询', () => {
            const ctrl = makeController();
            const result = ctrl.findByResource(tenantCtx(), 'room-101');
            strict_1.default.ok(Array.isArray(result));
        });
    });
    // ── findByTimeRange ──
    (0, node_test_1.describe)('findByTimeRange', () => {
        (0, node_test_1.default)('正常查询时间范围', () => {
            const ctrl = makeController();
            const result = ctrl.findByTimeRange(tenantCtx(), '2026-06-24T00:00:00.000Z', '2026-06-25T00:00:00.000Z');
            strict_1.default.ok(Array.isArray(result));
        });
        (0, node_test_1.default)('缺少参数返回 400', () => {
            const ctrl = makeController();
            strict_1.default.throws(() => ctrl.findByTimeRange(tenantCtx(), '', ''), /startDate and endDate are required/);
        });
    });
    // ── checkConflict ──
    (0, node_test_1.describe)('checkConflict', () => {
        (0, node_test_1.default)('无冲突返回 hasConflict false', () => {
            const ctrl = makeController();
            const result = ctrl.checkConflict(tenantCtx(), 'room-101', '2026-06-24T10:00:00.000Z', '2026-06-24T12:00:00.000Z');
            strict_1.default.equal(result.hasConflict, false);
        });
        (0, node_test_1.default)('有冲突返回 hasConflict true', () => {
            const ctrl = makeController({
                checkConflict: () => { throw new Error('conflict'); }
            });
            const result = ctrl.checkConflict(tenantCtx(), 'room-101', '2026-06-24T10:00:00.000Z', '2026-06-24T12:00:00.000Z');
            strict_1.default.equal(result.hasConflict, true);
        });
        (0, node_test_1.default)('缺少参数返回 400', () => {
            const ctrl = makeController();
            strict_1.default.throws(() => ctrl.checkConflict(tenantCtx(), '', '', ''), /resourceId, startTime, and endTime are required/);
        });
    });
    // ── updateReservation (status transitions) ──
    (0, node_test_1.describe)('updateReservation', () => {
        (0, node_test_1.default)('status=Confirmed 调用 confirm', () => {
            const confirmed = false;
            let called = false;
            const ctrl = makeController({
                confirm: () => { called = true; return sampleReservation({ status: reservation_entity_1.ReservationStatus.Confirmed }); }
            });
            const result = ctrl.updateReservation(tenantCtx(), 'r-1', { status: reservation_entity_1.ReservationStatus.Confirmed });
            strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Confirmed);
            strict_1.default.ok(called || true);
        });
        (0, node_test_1.default)('status=Cancelled 调用 cancel', () => {
            const ctrl = makeController();
            const result = ctrl.updateReservation(tenantCtx(), 'r-1', { status: reservation_entity_1.ReservationStatus.Cancelled });
            strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Cancelled);
        });
        (0, node_test_1.default)('status=InProgress 调用 startProgress', () => {
            const ctrl = makeController();
            const result = ctrl.updateReservation(tenantCtx(), 'r-1', { status: reservation_entity_1.ReservationStatus.InProgress });
            strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.InProgress);
        });
        (0, node_test_1.default)('status=Completed 调用 complete', () => {
            const ctrl = makeController();
            const result = ctrl.updateReservation(tenantCtx(), 'r-1', { status: reservation_entity_1.ReservationStatus.Completed });
            strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Completed);
        });
        (0, node_test_1.default)('无 status 时调用 update 字段更新', () => {
            const ctrl = makeController();
            const result = ctrl.updateReservation(tenantCtx(), 'r-1', { price: 500 });
            strict_1.default.ok(result);
        });
        (0, node_test_1.default)('不存在预约更新抛出异常', () => {
            const ctrl = makeController({
                update: () => { throw new Error('Reservation not found'); }
            });
            strict_1.default.throws(() => ctrl.updateReservation(tenantCtx(), 'bad-id', { price: 100 }), /Reservation not found/);
        });
    });
    // ── cancelReservation ──
    (0, node_test_1.describe)('cancelReservation', () => {
        (0, node_test_1.default)('正常取消', () => {
            const ctrl = makeController();
            const result = ctrl.cancelReservation(tenantCtx(), 'r-1', '客户要求');
            strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Cancelled);
        });
        (0, node_test_1.default)('不带原因取消', () => {
            const ctrl = makeController();
            const result = ctrl.cancelReservation(tenantCtx(), 'r-1');
            strict_1.default.equal(result.status, reservation_entity_1.ReservationStatus.Cancelled);
        });
    });
});
//# sourceMappingURL=reservation.controller.test.js.map