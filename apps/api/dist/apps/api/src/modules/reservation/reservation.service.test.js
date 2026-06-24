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
const reservation_service_1 = require("./reservation.service");
const reservation_entity_1 = require("./reservation.entity");
// ── Setup ──
function makeService() {
    const svc = new reservation_service_1.ReservationService();
    svc.resetStoreForTests();
    return svc;
}
function makeInput(overrides) {
    return {
        tenantId: 't-01',
        type: reservation_entity_1.ReservationType.Venue,
        resourceId: 'res-room-101',
        resourceName: 'VIP Room',
        userId: 'u-01',
        userName: '张三',
        startTime: '2026-06-24T10:00:00.000Z',
        endTime: '2026-06-24T12:00:00.000Z',
        duration: 120,
        price: 200,
        deposit: 50,
        ...overrides
    };
}
(0, node_test_1.describe)('ReservationService', () => {
    let svc;
    (0, node_test_1.beforeEach)(() => {
        svc = makeService();
    });
    // ── CREATE ──
    (0, node_test_1.describe)('create', () => {
        (0, node_test_1.default)('创建预约，状态为 Pending', () => {
            const r = svc.create(makeInput());
            strict_1.default.equal(r.status, reservation_entity_1.ReservationStatus.Pending);
            strict_1.default.ok(r.id.startsWith('reservation-'));
            strict_1.default.equal(r.resourceName, 'VIP Room');
            strict_1.default.equal(r.price, 200);
        });
        (0, node_test_1.default)('创建预约 endTime <= startTime 时抛出异常', () => {
            strict_1.default.throws(() => svc.create(makeInput({
                startTime: '2026-06-24T12:00:00.000Z',
                endTime: '2026-06-24T10:00:00.000Z'
            })), /endTime must be after startTime/);
        });
        (0, node_test_1.default)('多个租户创建不同预约不冲突', () => {
            const r1 = svc.create(makeInput({ tenantId: 't-01', resourceId: 'room-1' }));
            const r2 = svc.create(makeInput({ tenantId: 't-02', resourceId: 'room-1' }));
            strict_1.default.notEqual(r1.id, r2.id);
            strict_1.default.equal(svc.findAll('t-01').length, 1);
            strict_1.default.equal(svc.findAll('t-02').length, 1);
        });
    });
    // ── FIND ──
    (0, node_test_1.describe)('findAll', () => {
        (0, node_test_1.default)('按 type 过滤', () => {
            svc.create(makeInput({ type: reservation_entity_1.ReservationType.Venue, resourceId: 'room-1' }));
            svc.create(makeInput({ type: reservation_entity_1.ReservationType.Equipment, resourceId: 'gear-1' }));
            const venues = svc.findAll('t-01', { type: reservation_entity_1.ReservationType.Venue });
            strict_1.default.equal(venues.length, 1);
            strict_1.default.equal(venues[0].type, reservation_entity_1.ReservationType.Venue);
        });
        (0, node_test_1.default)('按 status 过滤', () => {
            const r = svc.create(makeInput());
            svc.confirm(r.id, 't-01');
            const confirmed = svc.findAll('t-01', { status: reservation_entity_1.ReservationStatus.Confirmed });
            strict_1.default.equal(confirmed.length, 1);
        });
        (0, node_test_1.default)('按 userId 过滤', () => {
            svc.create(makeInput({ userId: 'u-alice', resourceId: 'room-1' }));
            svc.create(makeInput({ userId: 'u-bob', resourceId: 'room-2' }));
            const alice = svc.findAll('t-01', { userId: 'u-alice' });
            strict_1.default.equal(alice.length, 1);
        });
        (0, node_test_1.default)('按时间范围过滤', () => {
            svc.create(makeInput({
                startTime: '2026-06-24T09:00:00.000Z',
                endTime: '2026-06-24T10:00:00.000Z',
                resourceId: 'room-a'
            }));
            svc.create(makeInput({
                startTime: '2026-06-25T09:00:00.000Z',
                endTime: '2026-06-25T10:00:00.000Z',
                resourceId: 'room-b'
            }));
            const inRange = svc.findAll('t-01', {
                startDate: '2026-06-24T00:00:00.000Z',
                endDate: '2026-06-24T23:59:59.000Z'
            });
            strict_1.default.equal(inRange.length, 1);
        });
        (0, node_test_1.default)('空结果返回空数组', () => {
            strict_1.default.deepEqual(svc.findAll('t-01'), []);
            strict_1.default.deepEqual(svc.findAll('nonexistent-tenant'), []);
        });
    });
    (0, node_test_1.describe)('findOne', () => {
        (0, node_test_1.default)('按 id 和 tenantId 找到', () => {
            const r = svc.create(makeInput());
            const found = svc.findOne(r.id, 't-01');
            strict_1.default.ok(found);
            strict_1.default.equal(found.id, r.id);
        });
        (0, node_test_1.default)('不同租户找不到', () => {
            const r = svc.create(makeInput({ tenantId: 't-01' }));
            const found = svc.findOne(r.id, 't-02');
            strict_1.default.equal(found, undefined);
        });
        (0, node_test_1.default)('不存在的 id 返回 undefined', () => {
            strict_1.default.equal(svc.findOne('non-existent', 't-01'), undefined);
        });
    });
    // ── QUERY HELPERS ──
    (0, node_test_1.describe)('findByTimeRange', () => {
        (0, node_test_1.default)('按时间范围查询', () => {
            svc.create(makeInput({
                startTime: '2026-06-24T10:00:00.000Z',
                endTime: '2026-06-24T12:00:00.000Z',
                resourceId: 'room-1'
            }));
            svc.create(makeInput({
                startTime: '2026-06-25T10:00:00.000Z',
                endTime: '2026-06-25T12:00:00.000Z',
                resourceId: 'room-2'
            }));
            const results = svc.findByTimeRange('t-01', '2026-06-24T00:00:00.000Z', '2026-06-24T23:59:59.000Z');
            strict_1.default.equal(results.length, 1);
            strict_1.default.equal(results[0].resourceId, 'room-1');
        });
    });
    (0, node_test_1.describe)('findByUser', () => {
        (0, node_test_1.default)('按用户查询', () => {
            svc.create(makeInput({ userId: 'u-alice', resourceId: 'room-a' }));
            svc.create(makeInput({ userId: 'u-alice', resourceId: 'room-b' }));
            svc.create(makeInput({ userId: 'u-bob', resourceId: 'room-c' }));
            const alice = svc.findByUser('t-01', 'u-alice');
            strict_1.default.equal(alice.length, 2);
        });
    });
    (0, node_test_1.describe)('findByResource', () => {
        (0, node_test_1.default)('按资源查询', () => {
            svc.create(makeInput({ resourceId: 'room-vip' }));
            svc.create(makeInput({ resourceId: 'room-standard' }));
            const vip = svc.findByResource('t-01', 'room-vip');
            strict_1.default.equal(vip.length, 1);
        });
    });
    // ── STATUS TRANSITIONS ──
    (0, node_test_1.describe)('状态流转', () => {
        (0, node_test_1.default)('Pending → Confirmed → InProgress → Completed', () => {
            const r = svc.create(makeInput());
            const confirmed = svc.confirm(r.id, 't-01');
            strict_1.default.equal(confirmed.status, reservation_entity_1.ReservationStatus.Confirmed);
            const inProgress = svc.startProgress(r.id, 't-01');
            strict_1.default.equal(inProgress.status, reservation_entity_1.ReservationStatus.InProgress);
            const completed = svc.complete(r.id, 't-01');
            strict_1.default.equal(completed.status, reservation_entity_1.ReservationStatus.Completed);
        });
        (0, node_test_1.default)('Pending → Cancelled', () => {
            const r = svc.create(makeInput());
            const cancelled = svc.cancel(r.id, 't-01', '客户取消');
            strict_1.default.equal(cancelled.status, reservation_entity_1.ReservationStatus.Cancelled);
            strict_1.default.equal(cancelled.cancelledReason, '客户取消');
            strict_1.default.ok(cancelled.cancelledAt instanceof Date);
        });
        (0, node_test_1.default)('Confirmed → Cancelled', () => {
            const r = svc.create(makeInput());
            svc.confirm(r.id, 't-01');
            const cancelled = svc.cancel(r.id, 't-01');
            strict_1.default.equal(cancelled.status, reservation_entity_1.ReservationStatus.Cancelled);
        });
        (0, node_test_1.default)('非法状态转换抛出异常', () => {
            const r = svc.create(makeInput());
            // Pending → Completed 不允许
            strict_1.default.throws(() => svc.complete(r.id, 't-01'), /Invalid reservation status transition/);
        });
        (0, node_test_1.default)('已完成状态不可再转换', () => {
            const r = svc.create(makeInput());
            svc.confirm(r.id, 't-01');
            svc.startProgress(r.id, 't-01');
            svc.complete(r.id, 't-01');
            strict_1.default.throws(() => svc.startProgress(r.id, 't-01'), /Invalid reservation status transition/);
        });
    });
    // ── UPDATE ──
    (0, node_test_1.describe)('update', () => {
        (0, node_test_1.default)('更新预约字段', () => {
            const r = svc.create(makeInput());
            const updated = svc.update(r.id, 't-01', { price: 300, remark: '更新备注' });
            strict_1.default.equal(updated.price, 300);
            strict_1.default.equal(updated.remark, '更新备注');
            strict_1.default.equal(updated.resourceName, 'VIP Room'); // 未改
        });
        (0, node_test_1.default)('不存在或不同租户更新抛出异常', () => {
            const r = svc.create(makeInput({ tenantId: 't-01' }));
            strict_1.default.throws(() => svc.update(r.id, 't-02', { price: 100 }), /not found/);
            strict_1.default.throws(() => svc.update('fake-id', 't-01', { price: 100 }), /not found/);
        });
    });
    // ── CONFLICT DETECTION ──
    (0, node_test_1.describe)('冲突检测', () => {
        (0, node_test_1.default)('同资源同时间确认时检测冲突', () => {
            const r1 = svc.create(makeInput({ resourceId: 'room-101' }));
            svc.confirm(r1.id, 't-01');
            const r2 = svc.create(makeInput({ resourceId: 'room-101' }));
            strict_1.default.throws(() => svc.confirm(r2.id, 't-01'), /already booked/);
        });
        (0, node_test_1.default)('不同资源同时段无冲突', () => {
            const r1 = svc.create(makeInput({ resourceId: 'room-101' }));
            svc.confirm(r1.id, 't-01');
            const r2 = svc.create(makeInput({ resourceId: 'room-202' }));
            strict_1.default.doesNotThrow(() => svc.confirm(r2.id, 't-01'));
        });
        (0, node_test_1.default)('时间不重叠无冲突', () => {
            const r1 = svc.create(makeInput({
                resourceId: 'room-101',
                startTime: '2026-06-24T10:00:00.000Z',
                endTime: '2026-06-24T12:00:00.000Z'
            }));
            svc.confirm(r1.id, 't-01');
            const r2 = svc.create(makeInput({
                resourceId: 'room-101',
                startTime: '2026-06-24T12:00:00.000Z',
                endTime: '2026-06-24T14:00:00.000Z'
            }));
            strict_1.default.doesNotThrow(() => svc.confirm(r2.id, 't-01'));
        });
        (0, node_test_1.default)('未确认的预约不参与冲突检测', () => {
            svc.create(makeInput({ resourceId: 'room-101' }));
            const r2 = svc.create(makeInput({ resourceId: 'room-101' }));
            // Both are pending, no conflict on confirm of r2
            strict_1.default.doesNotThrow(() => svc.confirm(r2.id, 't-01'));
        });
    });
    // ── CANCEL ──
    (0, node_test_1.describe)('cancel', () => {
        (0, node_test_1.default)('取消预约记录取消时间和原因', () => {
            const r = svc.create(makeInput());
            const cancelled = svc.cancel(r.id, 't-01', '突发事件');
            strict_1.default.equal(cancelled.status, reservation_entity_1.ReservationStatus.Cancelled);
            strict_1.default.equal(cancelled.cancelledReason, '突发事件');
            strict_1.default.ok(cancelled.cancelledAt);
        });
        (0, node_test_1.default)('已取消的预约不可再次取消', () => {
            const r = svc.create(makeInput());
            svc.cancel(r.id, 't-01');
            strict_1.default.throws(() => svc.cancel(r.id, 't-01'), /Invalid reservation status transition/);
        });
    });
});
//# sourceMappingURL=reservation.service.test.js.map