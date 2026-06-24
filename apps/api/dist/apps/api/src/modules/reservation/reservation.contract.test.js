"use strict";
/**
 * 🐜 自动: [reservation] [A] contract.test.ts 补全
 *
 * 覆盖:
 *   ReservationContract / ReservationStatsContract 接口形状
 *   toReservationContract / toReservationStatsContract 转换函数
 *   包含正常流程 + 边界条件
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
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const reservation_entity_1 = require("./reservation.entity");
const reservation_contract_1 = require("./reservation.contract");
// ── 辅助工厂 ──
function makeReservation(overrides) {
    const entity = new reservation_entity_1.ReservationEntity();
    entity.id = 'res-001';
    entity.tenantId = 'tenant-001';
    entity.type = reservation_entity_1.ReservationType.Venue;
    entity.resourceId = 'venue-001';
    entity.resourceName = 'A号包间';
    entity.userId = 'user-001';
    entity.userName = '张三';
    entity.status = reservation_entity_1.ReservationStatus.Confirmed;
    entity.startTime = new Date('2026-06-24T10:00:00.000Z');
    entity.endTime = new Date('2026-06-24T12:00:00.000Z');
    entity.duration = 120;
    entity.price = 200;
    entity.deposit = 50;
    entity.remark = '生日聚会';
    entity.createdAt = new Date('2026-06-23T08:00:00.000Z');
    entity.updatedAt = new Date('2026-06-23T08:05:00.000Z');
    return Object.assign(entity, overrides);
}
// ──────────── toReservationContract ────────────
(0, node_test_1.describe)('toReservationContract', () => {
    (0, node_test_1.default)('完整预约转换：日期转 ISO 字符串', () => {
        const entity = makeReservation();
        const contract = (0, reservation_contract_1.toReservationContract)(entity);
        strict_1.default.equal(contract.id, 'res-001');
        strict_1.default.equal(contract.tenantId, 'tenant-001');
        strict_1.default.equal(contract.type, reservation_entity_1.ReservationType.Venue);
        strict_1.default.equal(contract.resourceId, 'venue-001');
        strict_1.default.equal(contract.resourceName, 'A号包间');
        strict_1.default.equal(contract.userId, 'user-001');
        strict_1.default.equal(contract.userName, '张三');
        strict_1.default.equal(contract.status, reservation_entity_1.ReservationStatus.Confirmed);
        strict_1.default.equal(contract.startTime, '2026-06-24T10:00:00.000Z');
        strict_1.default.equal(contract.endTime, '2026-06-24T12:00:00.000Z');
        strict_1.default.equal(contract.duration, 120);
        strict_1.default.equal(contract.price, 200);
        strict_1.default.equal(contract.deposit, 50);
        strict_1.default.equal(contract.remark, '生日聚会');
        strict_1.default.equal(contract.createdAt, '2026-06-23T08:00:00.000Z');
        strict_1.default.equal(contract.updatedAt, '2026-06-23T08:05:00.000Z');
    });
    (0, node_test_1.default)('已取消预约转换', () => {
        const entity = makeReservation({
            id: 'res-002',
            status: reservation_entity_1.ReservationStatus.Cancelled
        });
        const contract = (0, reservation_contract_1.toReservationContract)(entity);
        strict_1.default.equal(contract.status, reservation_entity_1.ReservationStatus.Cancelled);
    });
    (0, node_test_1.default)('进行中预约转换', () => {
        const entity = makeReservation({
            id: 'res-003',
            status: reservation_entity_1.ReservationStatus.InProgress
        });
        const contract = (0, reservation_contract_1.toReservationContract)(entity);
        strict_1.default.equal(contract.status, reservation_entity_1.ReservationStatus.InProgress);
    });
    (0, node_test_1.default)('remark 为可选', () => {
        const entity = makeReservation({ remark: undefined });
        const contract = (0, reservation_contract_1.toReservationContract)(entity);
        strict_1.default.equal(contract.remark, undefined);
    });
    (0, node_test_1.default)('设备预约类型', () => {
        const entity = makeReservation({
            type: reservation_entity_1.ReservationType.Equipment,
            resourceId: 'eq-001',
            resourceName: 'PS5 游戏机',
            duration: 60,
            price: 30,
            deposit: 10
        });
        const contract = (0, reservation_contract_1.toReservationContract)(entity);
        strict_1.default.equal(contract.type, reservation_entity_1.ReservationType.Equipment);
        strict_1.default.equal(contract.resourceName, 'PS5 游戏机');
    });
    (0, node_test_1.default)('服务预约类型', () => {
        const entity = makeReservation({
            type: reservation_entity_1.ReservationType.Service,
            resourceId: 'svc-001',
            resourceName: '教练指导',
            duration: 45
        });
        const contract = (0, reservation_contract_1.toReservationContract)(entity);
        strict_1.default.equal(contract.type, reservation_entity_1.ReservationType.Service);
        strict_1.default.equal(contract.duration, 45);
    });
    (0, node_test_1.default)('课程预约类型', () => {
        const entity = makeReservation({
            type: reservation_entity_1.ReservationType.Class,
            resourceId: 'cls-001',
            resourceName: '街舞入门课'
        });
        const contract = (0, reservation_contract_1.toReservationContract)(entity);
        strict_1.default.equal(contract.type, reservation_entity_1.ReservationType.Class);
        strict_1.default.equal(contract.resourceName, '街舞入门课');
    });
    (0, node_test_1.default)('三小时长预约', () => {
        const entity = makeReservation({
            duration: 180,
            price: 500,
            deposit: 100
        });
        const contract = (0, reservation_contract_1.toReservationContract)(entity);
        strict_1.default.equal(contract.duration, 180);
        strict_1.default.equal(contract.price, 500);
        strict_1.default.equal(contract.deposit, 100);
    });
    (0, node_test_1.default)('零押金预约', () => {
        const entity = makeReservation({ deposit: 0 });
        const contract = (0, reservation_contract_1.toReservationContract)(entity);
        strict_1.default.equal(contract.deposit, 0);
    });
    (0, node_test_1.default)('所有预约状态类型均可转换', () => {
        const statuses = Object.values(reservation_entity_1.ReservationStatus);
        for (const s of statuses) {
            const entity = makeReservation({ status: s });
            const contract = (0, reservation_contract_1.toReservationContract)(entity);
            strict_1.default.equal(contract.status, s);
        }
    });
});
// ──────────── toReservationStatsContract ────────────
(0, node_test_1.describe)('toReservationStatsContract', () => {
    (0, node_test_1.default)('空列表统计', () => {
        const stats = (0, reservation_contract_1.toReservationStatsContract)([]);
        strict_1.default.equal(stats.total, 0);
        strict_1.default.equal(stats.pendingCount, 0);
        strict_1.default.equal(stats.confirmedCount, 0);
        strict_1.default.equal(stats.inProgressCount, 0);
        strict_1.default.equal(stats.completedCount, 0);
        strict_1.default.equal(stats.cancelledCount, 0);
    });
    (0, node_test_1.default)('多种状态混排统计', () => {
        const reservations = [
            makeReservation({ id: 'r1', status: reservation_entity_1.ReservationStatus.Confirmed }),
            makeReservation({ id: 'r2', status: reservation_entity_1.ReservationStatus.InProgress }),
            makeReservation({ id: 'r3', status: reservation_entity_1.ReservationStatus.Completed }),
            makeReservation({ id: 'r4', status: reservation_entity_1.ReservationStatus.Cancelled }),
            makeReservation({ id: 'r5', status: reservation_entity_1.ReservationStatus.Pending }),
            makeReservation({ id: 'r6', status: reservation_entity_1.ReservationStatus.Confirmed })
        ];
        const stats = (0, reservation_contract_1.toReservationStatsContract)(reservations);
        strict_1.default.equal(stats.total, 6);
        strict_1.default.equal(stats.pendingCount, 1);
        strict_1.default.equal(stats.confirmedCount, 2);
        strict_1.default.equal(stats.inProgressCount, 1);
        strict_1.default.equal(stats.completedCount, 1);
        strict_1.default.equal(stats.cancelledCount, 1);
    });
    (0, node_test_1.default)('全已完成统计', () => {
        const reservations = [
            makeReservation({ id: 'r1', status: reservation_entity_1.ReservationStatus.Completed }),
            makeReservation({ id: 'r2', status: reservation_entity_1.ReservationStatus.Completed })
        ];
        const stats = (0, reservation_contract_1.toReservationStatsContract)(reservations);
        strict_1.default.equal(stats.total, 2);
        strict_1.default.equal(stats.completedCount, 2);
        strict_1.default.equal(stats.pendingCount, 0);
        strict_1.default.equal(stats.inProgressCount, 0);
    });
    (0, node_test_1.default)('已取消预约不影响其他统计', () => {
        const reservations = [
            makeReservation({ id: 'r1', status: reservation_entity_1.ReservationStatus.Cancelled }),
            makeReservation({ id: 'r2', status: reservation_entity_1.ReservationStatus.Cancelled }),
            makeReservation({ id: 'r3', status: reservation_entity_1.ReservationStatus.Confirmed })
        ];
        const stats = (0, reservation_contract_1.toReservationStatsContract)(reservations);
        strict_1.default.equal(stats.total, 3);
        strict_1.default.equal(stats.cancelledCount, 2);
        strict_1.default.equal(stats.confirmedCount, 1);
        strict_1.default.equal(stats.inProgressCount, 0);
    });
});
//# sourceMappingURL=reservation.contract.test.js.map