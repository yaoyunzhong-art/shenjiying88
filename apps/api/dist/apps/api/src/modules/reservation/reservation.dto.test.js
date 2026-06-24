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
const reservation_dto_1 = require("./reservation.dto");
(0, node_test_1.describe)('CreateReservationDto', () => {
    (0, node_test_1.default)('标准预约 DTO：必填 type + resourceId + userId + startTime + endTime + duration + price + deposit', () => {
        const dto = Object.assign(new reservation_dto_1.CreateReservationDto(), {
            type: reservation_entity_1.ReservationType.Venue,
            resourceId: 'table-1',
            resourceName: '台球桌 1 号',
            userId: 'user-1',
            userName: '张三',
            startTime: '2026-06-23T12:00:00.000Z',
            endTime: '2026-06-23T14:00:00.000Z',
            duration: 120,
            price: 60,
            deposit: 30
        });
        strict_1.default.equal(dto.type, reservation_entity_1.ReservationType.Venue);
        strict_1.default.equal(dto.resourceId, 'table-1');
        strict_1.default.equal(dto.resourceName, '台球桌 1 号');
        strict_1.default.equal(dto.userId, 'user-1');
        strict_1.default.equal(dto.userName, '张三');
        strict_1.default.equal(dto.startTime, '2026-06-23T12:00:00.000Z');
        strict_1.default.equal(dto.endTime, '2026-06-23T14:00:00.000Z');
        strict_1.default.equal(dto.duration, 120);
        strict_1.default.equal(dto.price, 60);
        strict_1.default.equal(dto.deposit, 30);
    });
    (0, node_test_1.default)('设备预约 DTO', () => {
        const dto = Object.assign(new reservation_dto_1.CreateReservationDto(), {
            type: reservation_entity_1.ReservationType.Equipment,
            resourceId: 'glove-1',
            resourceName: '保龄球手套',
            userId: 'user-2',
            userName: '李四',
            startTime: '2026-06-23T10:00:00.000Z',
            endTime: '2026-06-23T12:00:00.000Z',
            duration: 120,
            price: 30,
            deposit: 15,
            remark: '需要大号'
        });
        strict_1.default.equal(dto.type, reservation_entity_1.ReservationType.Equipment);
        strict_1.default.equal(dto.remark, '需要大号');
    });
    (0, node_test_1.default)('服务预约 DTO', () => {
        const dto = Object.assign(new reservation_dto_1.CreateReservationDto(), {
            type: reservation_entity_1.ReservationType.Service,
            resourceId: 'coach-1',
            resourceName: '张教练',
            userId: 'user-3',
            userName: '王五',
            startTime: '2026-06-23T15:00:00.000Z',
            endTime: '2026-06-23T16:00:00.000Z',
            duration: 60,
            price: 200,
            deposit: 100
        });
        strict_1.default.equal(dto.type, reservation_entity_1.ReservationType.Service);
        strict_1.default.equal(dto.resourceName, '张教练');
    });
    (0, node_test_1.default)('课程预约 DTO', () => {
        const dto = Object.assign(new reservation_dto_1.CreateReservationDto(), {
            type: reservation_entity_1.ReservationType.Class,
            resourceId: 'class-yoga',
            resourceName: '瑜伽课',
            userId: 'user-4',
            userName: '赵六',
            startTime: '2026-06-24T09:00:00.000Z',
            endTime: '2026-06-24T10:00:00.000Z',
            duration: 60,
            price: 80,
            deposit: 40
        });
        strict_1.default.equal(dto.type, reservation_entity_1.ReservationType.Class);
    });
});
(0, node_test_1.describe)('UpdateReservationDto', () => {
    (0, node_test_1.default)('全部字段可选', () => {
        const dto = Object.assign(new reservation_dto_1.UpdateReservationDto(), {
            startTime: '2026-06-23T13:00:00.000Z',
            endTime: '2026-06-23T15:00:00.000Z',
            duration: 120,
            price: 80,
            deposit: 40,
            remark: '已改时间',
            resourceName: '台球桌 2 号'
        });
        strict_1.default.equal(dto.startTime, '2026-06-23T13:00:00.000Z');
        strict_1.default.equal(dto.endTime, '2026-06-23T15:00:00.000Z');
        strict_1.default.equal(dto.duration, 120);
        strict_1.default.equal(dto.price, 80);
        strict_1.default.equal(dto.deposit, 40);
        strict_1.default.equal(dto.remark, '已改时间');
        strict_1.default.equal(dto.resourceName, '台球桌 2 号');
    });
    (0, node_test_1.default)('状态更新 DTO', () => {
        const dto = Object.assign(new reservation_dto_1.UpdateReservationDto(), {
            status: reservation_entity_1.ReservationStatus.Cancelled,
            remark: '客户取消'
        });
        strict_1.default.equal(dto.status, reservation_entity_1.ReservationStatus.Cancelled);
        strict_1.default.equal(dto.remark, '客户取消');
    });
    (0, node_test_1.default)('空 DTO：不传任何字段', () => {
        const dto = new reservation_dto_1.UpdateReservationDto();
        strict_1.default.equal(dto.status, undefined);
        strict_1.default.equal(dto.startTime, undefined);
        strict_1.default.equal(dto.endTime, undefined);
        strict_1.default.equal(dto.duration, undefined);
        strict_1.default.equal(dto.price, undefined);
        strict_1.default.equal(dto.deposit, undefined);
        strict_1.default.equal(dto.remark, undefined);
        strict_1.default.equal(dto.resourceName, undefined);
    });
});
(0, node_test_1.describe)('ReservationQueryDto', () => {
    (0, node_test_1.default)('全部查询字段可选', () => {
        const dto = Object.assign(new reservation_dto_1.ReservationQueryDto(), {
            type: reservation_entity_1.ReservationType.Venue,
            resourceId: 'table-1',
            userId: 'user-1',
            status: reservation_entity_1.ReservationStatus.Confirmed,
            startDate: '2026-06-23T00:00:00.000Z',
            endDate: '2026-06-23T23:59:59.999Z'
        });
        strict_1.default.equal(dto.type, reservation_entity_1.ReservationType.Venue);
        strict_1.default.equal(dto.resourceId, 'table-1');
        strict_1.default.equal(dto.userId, 'user-1');
        strict_1.default.equal(dto.status, reservation_entity_1.ReservationStatus.Confirmed);
        strict_1.default.equal(dto.startDate, '2026-06-23T00:00:00.000Z');
        strict_1.default.equal(dto.endDate, '2026-06-23T23:59:59.999Z');
    });
    (0, node_test_1.default)('部分字段查询', () => {
        const dto = Object.assign(new reservation_dto_1.ReservationQueryDto(), {
            userId: 'user-2',
            status: reservation_entity_1.ReservationStatus.Pending
        });
        strict_1.default.equal(dto.userId, 'user-2');
        strict_1.default.equal(dto.status, reservation_entity_1.ReservationStatus.Pending);
        strict_1.default.equal(dto.type, undefined);
        strict_1.default.equal(dto.resourceId, undefined);
    });
    (0, node_test_1.default)('空查询 DTO', () => {
        const dto = new reservation_dto_1.ReservationQueryDto();
        strict_1.default.equal(dto.type, undefined);
        strict_1.default.equal(dto.resourceId, undefined);
        strict_1.default.equal(dto.userId, undefined);
        strict_1.default.equal(dto.status, undefined);
        strict_1.default.equal(dto.startDate, undefined);
        strict_1.default.equal(dto.endDate, undefined);
    });
});
//# sourceMappingURL=reservation.dto.test.js.map