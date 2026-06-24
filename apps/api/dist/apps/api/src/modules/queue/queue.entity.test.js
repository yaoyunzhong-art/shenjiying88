"use strict";
/**
 * 🐜 自动: [queue] [A] entity.test 补全
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
const queue_entity_1 = require("./queue.entity");
(0, node_test_1.describe)('queue.entity enums', () => {
    (0, node_test_1.default)('QueueType 包含 Booking / Waiting / Service', () => {
        strict_1.default.equal(queue_entity_1.QueueType.Booking, 'booking');
        strict_1.default.equal(queue_entity_1.QueueType.Waiting, 'waiting');
        strict_1.default.equal(queue_entity_1.QueueType.Service, 'service');
    });
    (0, node_test_1.default)('QueueStatus 包含 6 种状态', () => {
        strict_1.default.equal(queue_entity_1.QueueStatus.Waiting, 'waiting');
        strict_1.default.equal(queue_entity_1.QueueStatus.Called, 'called');
        strict_1.default.equal(queue_entity_1.QueueStatus.Serving, 'serving');
        strict_1.default.equal(queue_entity_1.QueueStatus.Completed, 'completed');
        strict_1.default.equal(queue_entity_1.QueueStatus.Cancelled, 'cancelled');
        strict_1.default.equal(queue_entity_1.QueueStatus.NoShow, 'no_show');
    });
});
(0, node_test_1.describe)('queue.entity QUEUE_STATUS_TRANSITIONS', () => {
    (0, node_test_1.default)('Waiting → Called / Cancelled', () => {
        strict_1.default.deepEqual(queue_entity_1.QUEUE_STATUS_TRANSITIONS[queue_entity_1.QueueStatus.Waiting], [
            queue_entity_1.QueueStatus.Called,
            queue_entity_1.QueueStatus.Cancelled
        ]);
    });
    (0, node_test_1.default)('Called → Serving / NoShow / Cancelled', () => {
        strict_1.default.deepEqual(queue_entity_1.QUEUE_STATUS_TRANSITIONS[queue_entity_1.QueueStatus.Called], [
            queue_entity_1.QueueStatus.Serving,
            queue_entity_1.QueueStatus.NoShow,
            queue_entity_1.QueueStatus.Cancelled
        ]);
    });
    (0, node_test_1.default)('Serving → Completed / Cancelled', () => {
        strict_1.default.deepEqual(queue_entity_1.QUEUE_STATUS_TRANSITIONS[queue_entity_1.QueueStatus.Serving], [
            queue_entity_1.QueueStatus.Completed,
            queue_entity_1.QueueStatus.Cancelled
        ]);
    });
    (0, node_test_1.default)('Completed — 不可再转换', () => {
        strict_1.default.deepEqual(queue_entity_1.QUEUE_STATUS_TRANSITIONS[queue_entity_1.QueueStatus.Completed], []);
    });
    (0, node_test_1.default)('Cancelled — 不可再转换', () => {
        strict_1.default.deepEqual(queue_entity_1.QUEUE_STATUS_TRANSITIONS[queue_entity_1.QueueStatus.Cancelled], []);
    });
    (0, node_test_1.default)('NoShow — 不可再转换', () => {
        strict_1.default.deepEqual(queue_entity_1.QUEUE_STATUS_TRANSITIONS[queue_entity_1.QueueStatus.NoShow], []);
    });
});
(0, node_test_1.describe)('queue.entity QueueEntity class', () => {
    (0, node_test_1.default)('QueueEntity 实例包含所有字段', () => {
        const now = new Date();
        const entity = Object.assign(new queue_entity_1.QueueEntity(), {
            id: 'queue-1',
            tenantId: 'tenant-1',
            type: queue_entity_1.QueueType.Waiting,
            queueNumber: 'A001',
            userId: 'user-1',
            userName: '张三',
            phone: '13800138000',
            partySize: 4,
            resourceId: 'table-1',
            resourceName: '包间 1 号',
            status: queue_entity_1.QueueStatus.Waiting,
            priority: 0,
            estimatedWaitMin: 15,
            actualWaitMin: undefined,
            remark: '靠近窗户',
            createdAt: now,
            updatedAt: now
        });
        strict_1.default.equal(entity.id, 'queue-1');
        strict_1.default.equal(entity.tenantId, 'tenant-1');
        strict_1.default.equal(entity.type, 'waiting');
        strict_1.default.equal(entity.queueNumber, 'A001');
        strict_1.default.equal(entity.userId, 'user-1');
        strict_1.default.equal(entity.userName, '张三');
        strict_1.default.equal(entity.phone, '13800138000');
        strict_1.default.equal(entity.partySize, 4);
        strict_1.default.equal(entity.resourceId, 'table-1');
        strict_1.default.equal(entity.resourceName, '包间 1 号');
        strict_1.default.equal(entity.status, 'waiting');
        strict_1.default.equal(entity.priority, 0);
        strict_1.default.equal(entity.estimatedWaitMin, 15);
        strict_1.default.equal(entity.actualWaitMin, undefined);
        strict_1.default.equal(entity.remark, '靠近窗户');
        strict_1.default.equal(entity.createdAt, now);
        strict_1.default.equal(entity.updatedAt, now);
    });
    (0, node_test_1.default)('QueueEntity 可选字段 phone / calledAt / servedAt 等可为 undefined', () => {
        const entity = Object.assign(new queue_entity_1.QueueEntity(), {
            id: 'queue-2',
            tenantId: 'tenant-1',
            type: queue_entity_1.QueueType.Service,
            queueNumber: 'B001',
            userId: 'user-2',
            userName: '李四',
            partySize: 1,
            status: queue_entity_1.QueueStatus.Called,
            priority: 1,
            estimatedWaitMin: 5,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        strict_1.default.equal(entity.id, 'queue-2');
        strict_1.default.equal(entity.phone, undefined);
        strict_1.default.equal(entity.resourceId, undefined);
        strict_1.default.equal(entity.resourceName, undefined);
        strict_1.default.equal(entity.remark, undefined);
        strict_1.default.equal(entity.calledAt, undefined);
        strict_1.default.equal(entity.servedAt, undefined);
        strict_1.default.equal(entity.completedAt, undefined);
        strict_1.default.equal(entity.actualWaitMin, undefined);
    });
    (0, node_test_1.default)('QueueEntity 兼容带所有时间戳的完整记录', () => {
        const entity = Object.assign(new queue_entity_1.QueueEntity(), {
            id: 'queue-3',
            tenantId: 'tenant-1',
            type: queue_entity_1.QueueType.Booking,
            queueNumber: 'C001',
            userId: 'user-3',
            userName: '王五',
            partySize: 2,
            status: queue_entity_1.QueueStatus.Completed,
            priority: 0,
            estimatedWaitMin: 10,
            actualWaitMin: 8,
            calledAt: new Date('2026-06-23T10:00:00Z'),
            servedAt: new Date('2026-06-23T10:03:00Z'),
            completedAt: new Date('2026-06-23T10:08:00Z'),
            createdAt: new Date('2026-06-23T09:55:00Z'),
            updatedAt: new Date('2026-06-23T10:08:00Z')
        });
        strict_1.default.equal(entity.status, 'completed');
        strict_1.default.equal(entity.actualWaitMin, 8);
        strict_1.default.ok(entity.calledAt instanceof Date);
        strict_1.default.ok(entity.servedAt instanceof Date);
        strict_1.default.ok(entity.completedAt instanceof Date);
    });
});
//# sourceMappingURL=queue.entity.test.js.map