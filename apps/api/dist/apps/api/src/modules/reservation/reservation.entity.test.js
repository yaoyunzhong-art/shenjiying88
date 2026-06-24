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
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const reservation_entity_1 = require("./reservation.entity");
(0, node_test_1.describe)('reservation.entity enums', () => {
    (0, node_test_1.default)('ReservationType 包含 Venue / Equipment / Service / Class', () => {
        strict_1.default.equal(reservation_entity_1.ReservationType.Venue, 'venue');
        strict_1.default.equal(reservation_entity_1.ReservationType.Equipment, 'equipment');
        strict_1.default.equal(reservation_entity_1.ReservationType.Service, 'service');
        strict_1.default.equal(reservation_entity_1.ReservationType.Class, 'class');
    });
    (0, node_test_1.default)('ReservationStatus 包含 5 种状态', () => {
        strict_1.default.equal(reservation_entity_1.ReservationStatus.Pending, 'pending');
        strict_1.default.equal(reservation_entity_1.ReservationStatus.Confirmed, 'confirmed');
        strict_1.default.equal(reservation_entity_1.ReservationStatus.InProgress, 'in_progress');
        strict_1.default.equal(reservation_entity_1.ReservationStatus.Completed, 'completed');
        strict_1.default.equal(reservation_entity_1.ReservationStatus.Cancelled, 'cancelled');
    });
});
(0, node_test_1.describe)('reservation.entity RESERVATION_STATUS_TRANSITIONS', () => {
    (0, node_test_1.default)('Pending → Confirmed / Cancelled', () => {
        strict_1.default.deepEqual(reservation_entity_1.RESERVATION_STATUS_TRANSITIONS[reservation_entity_1.ReservationStatus.Pending], [
            reservation_entity_1.ReservationStatus.Confirmed,
            reservation_entity_1.ReservationStatus.Cancelled
        ]);
    });
    (0, node_test_1.default)('Confirmed → InProgress / Cancelled', () => {
        strict_1.default.deepEqual(reservation_entity_1.RESERVATION_STATUS_TRANSITIONS[reservation_entity_1.ReservationStatus.Confirmed], [
            reservation_entity_1.ReservationStatus.InProgress,
            reservation_entity_1.ReservationStatus.Cancelled
        ]);
    });
    (0, node_test_1.default)('InProgress → Completed / Cancelled', () => {
        strict_1.default.deepEqual(reservation_entity_1.RESERVATION_STATUS_TRANSITIONS[reservation_entity_1.ReservationStatus.InProgress], [
            reservation_entity_1.ReservationStatus.Completed,
            reservation_entity_1.ReservationStatus.Cancelled
        ]);
    });
    (0, node_test_1.default)('Completed — 不可再转换', () => {
        strict_1.default.deepEqual(reservation_entity_1.RESERVATION_STATUS_TRANSITIONS[reservation_entity_1.ReservationStatus.Completed], []);
    });
    (0, node_test_1.default)('Cancelled — 不可再转换', () => {
        strict_1.default.deepEqual(reservation_entity_1.RESERVATION_STATUS_TRANSITIONS[reservation_entity_1.ReservationStatus.Cancelled], []);
    });
    (0, node_test_1.default)('Completed 和 Cancelled 都不允许任何后续转移', () => {
        strict_1.default.equal(reservation_entity_1.RESERVATION_STATUS_TRANSITIONS[reservation_entity_1.ReservationStatus.Completed].length, 0);
        strict_1.default.equal(reservation_entity_1.RESERVATION_STATUS_TRANSITIONS[reservation_entity_1.ReservationStatus.Cancelled].length, 0);
    });
});
(0, node_test_1.describe)('reservation.entity ReservationEntity class', () => {
    (0, node_test_1.default)('ReservationEntity 实例包含所有字段', () => {
        const now = new Date('2026-06-23T12:00:00.000Z');
        const later = new Date('2026-06-23T14:00:00.000Z');
        const entity = Object.assign(new reservation_entity_1.ReservationEntity(), {
            id: 'reservation-test-1',
            tenantId: 'tenant-1',
            type: reservation_entity_1.ReservationType.Venue,
            resourceId: 'table-1',
            resourceName: '台球桌 1 号',
            userId: 'user-1',
            userName: '张三',
            status: reservation_entity_1.ReservationStatus.Confirmed,
            startTime: now,
            endTime: later,
            duration: 120,
            price: 60,
            deposit: 30,
            remark: '靠窗',
            createdAt: now,
            updatedAt: now
        });
        strict_1.default.equal(entity.id, 'reservation-test-1');
        strict_1.default.equal(entity.tenantId, 'tenant-1');
        strict_1.default.equal(entity.type, reservation_entity_1.ReservationType.Venue);
        strict_1.default.equal(entity.resourceId, 'table-1');
        strict_1.default.equal(entity.resourceName, '台球桌 1 号');
        strict_1.default.equal(entity.userId, 'user-1');
        strict_1.default.equal(entity.userName, '张三');
        strict_1.default.equal(entity.status, reservation_entity_1.ReservationStatus.Confirmed);
        strict_1.default.equal(entity.startTime, now);
        strict_1.default.equal(entity.endTime, later);
        strict_1.default.equal(entity.duration, 120);
        strict_1.default.equal(entity.price, 60);
        strict_1.default.equal(entity.deposit, 30);
        strict_1.default.equal(entity.remark, '靠窗');
    });
    (0, node_test_1.default)('ReservationEntity 可选字段可为 undefined', () => {
        const entity = Object.assign(new reservation_entity_1.ReservationEntity(), {
            id: 'reservation-test-2',
            tenantId: 'tenant-1',
            type: reservation_entity_1.ReservationType.Equipment,
            resourceId: 'glove-1',
            resourceName: '手套',
            userId: 'user-2',
            userName: '李四',
            status: reservation_entity_1.ReservationStatus.Pending,
            startTime: new Date(),
            endTime: new Date(),
            duration: 60,
            price: 20,
            deposit: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        strict_1.default.equal(entity.remark, undefined);
        strict_1.default.equal(entity.cancelledAt, undefined);
        strict_1.default.equal(entity.cancelledReason, undefined);
    });
});
//# sourceMappingURL=reservation.entity.test.js.map