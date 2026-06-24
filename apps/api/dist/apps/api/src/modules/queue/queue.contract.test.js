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
const queue_entity_1 = require("./queue.entity");
const queue_contract_1 = require("./queue.contract");
// ── QueueType enum contract ─────────────────────────────────────────────
(0, node_test_1.describe)('queue.contract: QueueType', () => {
    (0, node_test_1.default)('QueueType has 3 stable enum values', () => {
        strict_1.default.equal(queue_entity_1.QueueType.Booking, 'booking');
        strict_1.default.equal(queue_entity_1.QueueType.Waiting, 'waiting');
        strict_1.default.equal(queue_entity_1.QueueType.Service, 'service');
    });
    (0, node_test_1.default)('QueueType enum keys are stable wire values', () => {
        const types = Object.values(queue_entity_1.QueueType);
        strict_1.default.deepEqual(types.sort(), ['booking', 'service', 'waiting']);
    });
});
// ── QueueStatus enum contract ──────────────────────────────────────────
(0, node_test_1.describe)('queue.contract: QueueStatus', () => {
    (0, node_test_1.default)('QueueStatus has 6 stable enum values', () => {
        strict_1.default.equal(queue_entity_1.QueueStatus.Waiting, 'waiting');
        strict_1.default.equal(queue_entity_1.QueueStatus.Called, 'called');
        strict_1.default.equal(queue_entity_1.QueueStatus.Serving, 'serving');
        strict_1.default.equal(queue_entity_1.QueueStatus.Completed, 'completed');
        strict_1.default.equal(queue_entity_1.QueueStatus.Cancelled, 'cancelled');
        strict_1.default.equal(queue_entity_1.QueueStatus.NoShow, 'no_show');
    });
    (0, node_test_1.default)('QueueStatus enum keys cover all 6 states', () => {
        const statuses = Object.values(queue_entity_1.QueueStatus);
        strict_1.default.deepEqual(statuses.sort(), [
            'called',
            'cancelled',
            'completed',
            'no_show',
            'serving',
            'waiting'
        ]);
    });
    (0, node_test_1.default)('QUEUE_STATUS_TRANSITIONS allows Waiting→Called/Cancelled only', () => {
        const allowed = queue_entity_1.QUEUE_STATUS_TRANSITIONS[queue_entity_1.QueueStatus.Waiting];
        strict_1.default.deepEqual(allowed.sort(), ['called', 'cancelled']);
    });
    (0, node_test_1.default)('QUEUE_STATUS_TRANSITIONS allows Called→Serving/NoShow/Cancelled', () => {
        const allowed = queue_entity_1.QUEUE_STATUS_TRANSITIONS[queue_entity_1.QueueStatus.Called];
        strict_1.default.deepEqual(allowed.sort(), ['cancelled', 'no_show', 'serving']);
    });
    (0, node_test_1.default)('QUEUE_STATUS_TRANSITIONS allows Serving→Completed/Cancelled only', () => {
        const allowed = queue_entity_1.QUEUE_STATUS_TRANSITIONS[queue_entity_1.QueueStatus.Serving];
        strict_1.default.deepEqual(allowed.sort(), ['cancelled', 'completed']);
    });
    (0, node_test_1.default)('QUEUE_STATUS_TRANSITIONS blocks Completed/Cancelled/NoShow (terminal)', () => {
        strict_1.default.deepEqual(queue_entity_1.QUEUE_STATUS_TRANSITIONS[queue_entity_1.QueueStatus.Completed], []);
        strict_1.default.deepEqual(queue_entity_1.QUEUE_STATUS_TRANSITIONS[queue_entity_1.QueueStatus.Cancelled], []);
        strict_1.default.deepEqual(queue_entity_1.QUEUE_STATUS_TRANSITIONS[queue_entity_1.QueueStatus.NoShow], []);
    });
});
// ── QueueEntity shape contract ──────────────────────────────────────────
(0, node_test_1.describe)('queue.contract: QueueEntity', () => {
    (0, node_test_1.default)('QueueEntity accepts all required fields with proper types', () => {
        const entity = {
            id: 'queue-1',
            tenantId: 'tenant-1',
            type: queue_entity_1.QueueType.Waiting,
            queueNumber: 'B001',
            userId: 'user-1',
            userName: 'Alice',
            partySize: 2,
            status: queue_entity_1.QueueStatus.Waiting,
            priority: 0,
            estimatedWaitMin: 10,
            createdAt: new Date('2026-06-23T00:00:00.000Z'),
            updatedAt: new Date('2026-06-23T00:00:00.000Z')
        };
        strict_1.default.equal(entity.id, 'queue-1');
        strict_1.default.equal(entity.tenantId, 'tenant-1');
        strict_1.default.equal(entity.type, queue_entity_1.QueueType.Waiting);
        strict_1.default.equal(entity.queueNumber, 'B001');
        strict_1.default.equal(entity.status, queue_entity_1.QueueStatus.Waiting);
        strict_1.default.equal(typeof entity.createdAt, 'object');
    });
    (0, node_test_1.default)('QueueEntity accepts optional fields (phone, calledAt, servedAt, etc)', () => {
        const entity = {
            id: 'q',
            tenantId: 't',
            type: queue_entity_1.QueueType.Booking,
            queueNumber: 'A001',
            userId: 'u',
            userName: 'u',
            phone: '13800138000',
            partySize: 4,
            resourceId: 'r-1',
            resourceName: 'Table 5',
            status: queue_entity_1.QueueStatus.Completed,
            priority: 1,
            estimatedWaitMin: 5,
            actualWaitMin: 12,
            calledAt: new Date('2026-06-23T00:05:00.000Z'),
            servedAt: new Date('2026-06-23T00:10:00.000Z'),
            completedAt: new Date('2026-06-23T00:25:00.000Z'),
            remark: 'VIP',
            createdAt: new Date('2026-06-23T00:00:00.000Z'),
            updatedAt: new Date('2026-06-23T00:25:00.000Z')
        };
        strict_1.default.equal(entity.phone, '13800138000');
        strict_1.default.equal(entity.partySize, 4);
        strict_1.default.equal(entity.actualWaitMin, 12);
        strict_1.default.ok(entity.calledAt instanceof Date);
    });
});
// ── QueueEntryContract shape contract ──────────────────────────────────
(0, node_test_1.describe)('queue.contract: QueueEntryContract', () => {
    (0, node_test_1.default)('toQueueEntryContract serializes Date fields to ISO strings', () => {
        const entity = {
            id: 'queue-iso',
            tenantId: 't',
            type: queue_entity_1.QueueType.Service,
            queueNumber: 'C001',
            userId: 'u',
            userName: 'Bob',
            partySize: 1,
            status: queue_entity_1.QueueStatus.Serving,
            priority: 0,
            estimatedWaitMin: 0,
            calledAt: new Date('2026-06-23T00:05:00.000Z'),
            servedAt: new Date('2026-06-23T00:10:00.000Z'),
            createdAt: new Date('2026-06-23T00:00:00.000Z'),
            updatedAt: new Date('2026-06-23T00:10:00.000Z')
        };
        const contract = (0, queue_contract_1.toQueueEntryContract)(entity);
        strict_1.default.equal(typeof contract.calledAt, 'string');
        strict_1.default.equal(typeof contract.servedAt, 'string');
        strict_1.default.equal(typeof contract.createdAt, 'string');
        strict_1.default.equal(contract.calledAt, '2026-06-23T00:05:00.000Z');
        strict_1.default.equal(contract.servedAt, '2026-06-23T00:10:00.000Z');
    });
    (0, node_test_1.default)('toQueueEntryContract returns undefined for missing optional Date fields', () => {
        const entity = {
            id: 'queue-min',
            tenantId: 't',
            type: queue_entity_1.QueueType.Waiting,
            queueNumber: 'B001',
            userId: 'u',
            userName: 'u',
            partySize: 1,
            status: queue_entity_1.QueueStatus.Waiting,
            priority: 0,
            estimatedWaitMin: 0,
            createdAt: new Date('2026-06-23T00:00:00.000Z'),
            updatedAt: new Date('2026-06-23T00:00:00.000Z')
        };
        const contract = (0, queue_contract_1.toQueueEntryContract)(entity);
        strict_1.default.equal(contract.calledAt, undefined);
        strict_1.default.equal(contract.servedAt, undefined);
        strict_1.default.equal(contract.completedAt, undefined);
        strict_1.default.equal(contract.actualWaitMin, undefined);
    });
    (0, node_test_1.default)('toQueueEntryContract preserves wire-stable enum values', () => {
        const entity = {
            id: 'queue-enum',
            tenantId: 't',
            type: queue_entity_1.QueueType.Booking,
            queueNumber: 'A001',
            userId: 'u',
            userName: 'u',
            partySize: 1,
            status: queue_entity_1.QueueStatus.Cancelled,
            priority: 0,
            estimatedWaitMin: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const c = (0, queue_contract_1.toQueueEntryContract)(entity);
        strict_1.default.equal(c.type, 'booking');
        strict_1.default.equal(c.status, 'cancelled');
    });
});
// ── QueueStatsContract shape contract ──────────────────────────────────
(0, node_test_1.describe)('queue.contract: QueueStatsContract', () => {
    (0, node_test_1.default)('QueueStatsContract covers 7 required metrics', () => {
        const stats = {
            total: 10,
            waitingCount: 3,
            calledCount: 1,
            servingCount: 2,
            completedCount: 3,
            cancelledCount: 1,
            noShowCount: 0,
            avgWaitMin: 8
        };
        strict_1.default.equal(stats.total, 10);
        strict_1.default.equal(stats.waitingCount, 3);
        strict_1.default.equal(stats.avgWaitMin, 8);
    });
});
//# sourceMappingURL=queue.contract.test.js.map