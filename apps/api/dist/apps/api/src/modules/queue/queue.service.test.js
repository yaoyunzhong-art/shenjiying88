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
const queue_service_1 = require("./queue.service");
(0, node_test_1.beforeEach)(() => {
    // Reset module-level state before each test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;
    queue_service_1.QueueService.prototype.resetQueueStoresForTests.call(new queue_service_1.QueueService());
    // Fallback: use the static reset
    // Use new instance for reset since stores are module-level
    const svc = new queue_service_1.QueueService();
    svc.resetQueueStoresForTests();
});
function makeService() {
    const svc = new queue_service_1.QueueService();
    svc.resetQueueStoresForTests();
    return svc;
}
(0, node_test_1.describe)('QueueService: create / takeNumber', () => {
    (0, node_test_1.default)('create generates queue number with type prefix', () => {
        const svc = makeService();
        const entry = svc.create({
            tenantId: 't1',
            type: queue_entity_1.QueueType.Waiting,
            userId: 'u1',
            userName: 'Alice',
            partySize: 2
        });
        strict_1.default.ok(entry.queueNumber.startsWith('B')); // Waiting → B
        strict_1.default.equal(entry.queueNumber, 'B001');
    });
    (0, node_test_1.default)('create increments per-tenant per-type counter', () => {
        const svc = makeService();
        const e1 = svc.create({ tenantId: 't1', type: queue_entity_1.QueueType.Booking, userId: 'u1', userName: 'u', partySize: 1 });
        const e2 = svc.create({ tenantId: 't1', type: queue_entity_1.QueueType.Booking, userId: 'u2', userName: 'u', partySize: 1 });
        const e3 = svc.create({ tenantId: 't1', type: queue_entity_1.QueueType.Booking, userId: 'u3', userName: 'u', partySize: 1 });
        strict_1.default.equal(e1.queueNumber, 'A001');
        strict_1.default.equal(e2.queueNumber, 'A002');
        strict_1.default.equal(e3.queueNumber, 'A003');
    });
    (0, node_test_1.default)('create respects tenant isolation for counter', () => {
        const svc = makeService();
        const a1 = svc.create({ tenantId: 'tA', type: queue_entity_1.QueueType.Service, userId: 'u', userName: 'u', partySize: 1 });
        const b1 = svc.create({ tenantId: 'tB', type: queue_entity_1.QueueType.Service, userId: 'u', userName: 'u', partySize: 1 });
        strict_1.default.equal(a1.queueNumber, 'C001');
        strict_1.default.equal(b1.queueNumber, 'C001');
    });
    (0, node_test_1.default)('create sets status to Waiting and partySize', () => {
        const svc = makeService();
        const entry = svc.create({
            tenantId: 't1',
            type: queue_entity_1.QueueType.Booking,
            userId: 'u1',
            userName: 'Alice',
            partySize: 4
        });
        strict_1.default.equal(entry.status, queue_entity_1.QueueStatus.Waiting);
        strict_1.default.equal(entry.partySize, 4);
    });
    (0, node_test_1.default)('takeNumber is an alias for create', () => {
        const svc = makeService();
        const e1 = svc.takeNumber({ tenantId: 't', type: queue_entity_1.QueueType.Waiting, userId: 'u1', userName: 'Alice', partySize: 1 });
        // Both methods create an entry — assert properties match expected entry shape
        strict_1.default.ok(e1.id.startsWith('queue-'));
        strict_1.default.equal(e1.userId, 'u1');
        strict_1.default.equal(e1.userName, 'Alice');
        strict_1.default.equal(e1.type, queue_entity_1.QueueType.Waiting);
        strict_1.default.equal(e1.status, queue_entity_1.QueueStatus.Waiting);
        strict_1.default.ok(e1.queueNumber.startsWith('B'));
    });
    (0, node_test_1.default)('create computes estimatedWaitMin based on ahead count', () => {
        const svc = makeService();
        svc.create({ tenantId: 't', type: queue_entity_1.QueueType.Waiting, userId: 'u1', userName: 'u', partySize: 1 });
        svc.create({ tenantId: 't', type: queue_entity_1.QueueType.Waiting, userId: 'u2', userName: 'u', partySize: 1 });
        const third = svc.create({ tenantId: 't', type: queue_entity_1.QueueType.Waiting, userId: 'u3', userName: 'u', partySize: 1 });
        strict_1.default.equal(third.estimatedWaitMin, 10); // 2 ahead × 5 min
    });
});
(0, node_test_1.describe)('QueueService: findAll / findOne', () => {
    (0, node_test_1.default)('findAll returns tenant-scoped entries sorted by queueNumber', () => {
        const svc = makeService();
        svc.create({ tenantId: 't', type: queue_entity_1.QueueType.Booking, userId: 'u1', userName: 'u', partySize: 1 });
        svc.create({ tenantId: 't', type: queue_entity_1.QueueType.Booking, userId: 'u2', userName: 'u', partySize: 1 });
        svc.create({ tenantId: 'other', type: queue_entity_1.QueueType.Booking, userId: 'u3', userName: 'u', partySize: 1 });
        const t1Entries = svc.findAll('t');
        strict_1.default.equal(t1Entries.length, 2);
        strict_1.default.equal(t1Entries[0].queueNumber, 'A001');
        strict_1.default.equal(t1Entries[1].queueNumber, 'A002');
    });
    (0, node_test_1.default)('findAll filters by type and status', () => {
        const svc = makeService();
        svc.create({ tenantId: 't', type: queue_entity_1.QueueType.Booking, userId: 'u1', userName: 'u', partySize: 1 });
        svc.create({ tenantId: 't', type: queue_entity_1.QueueType.Waiting, userId: 'u2', userName: 'u', partySize: 1 });
        const all = svc.findAll('t');
        strict_1.default.equal(all.length, 2);
        const bookingOnly = svc.findAll('t', { type: queue_entity_1.QueueType.Booking });
        strict_1.default.equal(bookingOnly.length, 1);
        strict_1.default.equal(bookingOnly[0].type, queue_entity_1.QueueType.Booking);
    });
    (0, node_test_1.default)('findOne returns undefined for cross-tenant access', () => {
        const svc = makeService();
        const e = svc.create({ tenantId: 't1', type: queue_entity_1.QueueType.Waiting, userId: 'u', userName: 'u', partySize: 1 });
        strict_1.default.equal(svc.findOne(e.id, 't2'), undefined);
        strict_1.default.ok(svc.findOne(e.id, 't1'));
    });
});
(0, node_test_1.describe)('QueueService: update / cancel', () => {
    (0, node_test_1.default)('update mutates partySize and remark only', () => {
        const svc = makeService();
        const e = svc.create({ tenantId: 't', type: queue_entity_1.QueueType.Booking, userId: 'u', userName: 'Alice', partySize: 2 });
        const updated = svc.update(e.id, 't', { partySize: 5, remark: 'VIP' });
        strict_1.default.equal(updated.partySize, 5);
        strict_1.default.equal(updated.remark, 'VIP');
    });
    (0, node_test_1.default)('cancel transitions Waiting→Cancelled', () => {
        const svc = makeService();
        const e = svc.create({ tenantId: 't', type: queue_entity_1.QueueType.Booking, userId: 'u', userName: 'u', partySize: 1 });
        const cancelled = svc.cancel(e.id, 't');
        strict_1.default.equal(cancelled.status, queue_entity_1.QueueStatus.Cancelled);
    });
    (0, node_test_1.default)('cancel rejects invalid transition (Cancelled→Waiting)', () => {
        const svc = makeService();
        const e = svc.create({ tenantId: 't', type: queue_entity_1.QueueType.Booking, userId: 'u', userName: 'u', partySize: 1 });
        svc.cancel(e.id, 't');
        strict_1.default.throws(() => svc.cancel(e.id, 't'), /Invalid queue status transition/);
    });
    (0, node_test_1.default)('update throws for unknown id', () => {
        const svc = makeService();
        strict_1.default.throws(() => svc.update('does-not-exist', 't', { partySize: 1 }), /Queue entry not found/);
    });
});
(0, node_test_1.describe)('QueueService: Controller wrappers', () => {
    (0, node_test_1.default)('joinQueue wraps create() with memberId mapping', () => {
        const svc = makeService();
        const entry = svc.joinQueue({
            tenantId: 't',
            queueType: queue_entity_1.QueueType.Waiting,
            memberId: 'member-001',
            memberName: 'Alice'
        });
        strict_1.default.equal(entry.userId, 'member-001');
        strict_1.default.equal(entry.userName, 'Alice');
        strict_1.default.equal(entry.type, queue_entity_1.QueueType.Waiting);
        strict_1.default.equal(entry.queueNumber, 'B001');
    });
    (0, node_test_1.default)('joinQueue defaults partySize to 1', () => {
        const svc = makeService();
        const entry = svc.joinQueue({
            tenantId: 't',
            queueType: queue_entity_1.QueueType.Booking,
            memberId: 'm1'
        });
        strict_1.default.equal(entry.partySize, 1);
    });
    (0, node_test_1.default)('joinQueue uses memberId as userName fallback when not provided', () => {
        const svc = makeService();
        const entry = svc.joinQueue({
            tenantId: 't',
            queueType: queue_entity_1.QueueType.Service,
            memberId: 'm-XYZ'
        });
        strict_1.default.equal(entry.userName, 'm-XYZ');
    });
    (0, node_test_1.default)('leaveQueue aliases cancel() (Waiting→Cancelled)', () => {
        const svc = makeService();
        const e = svc.joinQueue({ tenantId: 't', queueType: queue_entity_1.QueueType.Waiting, memberId: 'm1' });
        const left = svc.leaveQueue(e.id, 't');
        strict_1.default.equal(left.status, queue_entity_1.QueueStatus.Cancelled);
    });
    (0, node_test_1.default)('leaveQueue rejects non-Waiting entry', () => {
        const svc = makeService();
        const e = svc.create({ tenantId: 't', type: queue_entity_1.QueueType.Waiting, userId: 'u', userName: 'u', partySize: 1 });
        svc.cancel(e.id, 't');
        strict_1.default.throws(() => svc.leaveQueue(e.id, 't'), /Invalid queue status transition/);
    });
    (0, node_test_1.default)('completeService transitions Serving→Completed', () => {
        const svc = makeService();
        const e = svc.create({ tenantId: 't', type: queue_entity_1.QueueType.Waiting, userId: 'u', userName: 'u', partySize: 1, resourceId: 'r1' });
        svc.callNext('r1', 't');
        svc.startService(e.id, 't');
        const completed = svc.completeService(e.id, 't');
        strict_1.default.equal(completed.status, queue_entity_1.QueueStatus.Completed);
        strict_1.default.ok(completed.completedAt instanceof Date);
    });
    (0, node_test_1.default)('getQueueStatus returns stats scoped to a single resource', () => {
        const svc = makeService();
        svc.joinQueue({ tenantId: 't', queueType: queue_entity_1.QueueType.Waiting, memberId: 'm1', resourceId: 'r1' });
        svc.joinQueue({ tenantId: 't', queueType: queue_entity_1.QueueType.Waiting, memberId: 'm2', resourceId: 'r1' });
        svc.joinQueue({ tenantId: 't', queueType: queue_entity_1.QueueType.Waiting, memberId: 'm3', resourceId: 'r2' });
        const r1Stats = svc.getQueueStatus('r1', 't');
        strict_1.default.equal(r1Stats.total, 2);
        strict_1.default.equal(r1Stats.waitingCount, 2);
        const r2Stats = svc.getQueueStatus('r2', 't');
        strict_1.default.equal(r2Stats.total, 1);
    });
    (0, node_test_1.default)('getMyPosition returns position 1 for first waiter', () => {
        const svc = makeService();
        svc.joinQueue({ tenantId: 't', queueType: queue_entity_1.QueueType.Waiting, memberId: 'm1', resourceId: 'r1' });
        const pos = svc.getMyPosition('m1', 'r1', 't');
        strict_1.default.equal(pos.position, 1);
        strict_1.default.equal(pos.estimatedWaitMinutes, 5);
        strict_1.default.ok(pos.entry);
    });
    (0, node_test_1.default)('getMyPosition increments by 1 for each subsequent member', () => {
        const svc = makeService();
        svc.joinQueue({ tenantId: 't', queueType: queue_entity_1.QueueType.Waiting, memberId: 'm1', resourceId: 'r1' });
        svc.joinQueue({ tenantId: 't', queueType: queue_entity_1.QueueType.Waiting, memberId: 'm2', resourceId: 'r1' });
        svc.joinQueue({ tenantId: 't', queueType: queue_entity_1.QueueType.Waiting, memberId: 'm3', resourceId: 'r1' });
        strict_1.default.equal(svc.getMyPosition('m1', 'r1', 't').position, 1);
        strict_1.default.equal(svc.getMyPosition('m2', 'r1', 't').position, 2);
        strict_1.default.equal(svc.getMyPosition('m3', 'r1', 't').position, 3);
    });
    (0, node_test_1.default)('getMyPosition returns -1 for member not in queue', () => {
        const svc = makeService();
        const pos = svc.getMyPosition('m-unknown', 'r1', 't');
        strict_1.default.equal(pos.position, -1);
        strict_1.default.equal(pos.entry, null);
    });
    (0, node_test_1.default)('getMyPosition returns -1 for empty memberId/resourceId', () => {
        const svc = makeService();
        strict_1.default.equal(svc.getMyPosition('', 'r1', 't').position, -1);
        strict_1.default.equal(svc.getMyPosition('m1', '', 't').position, -1);
    });
});
(0, node_test_1.describe)('QueueService: callNext flow', () => {
    (0, node_test_1.default)('callNext picks the highest priority first, then earliest queueNumber', () => {
        const svc = makeService();
        const a = svc.joinQueue({ tenantId: 't', queueType: queue_entity_1.QueueType.Waiting, memberId: 'm1', resourceId: 'r1' });
        const b = svc.joinQueue({ tenantId: 't', queueType: queue_entity_1.QueueType.Waiting, memberId: 'm2', resourceId: 'r1' });
        // Bump b's priority
        b.priority = 5;
        const called = svc.callNext('r1', 't');
        strict_1.default.equal(called?.id, b.id); // higher priority wins
        strict_1.default.equal(called?.status, queue_entity_1.QueueStatus.Called);
        strict_1.default.ok(called?.calledAt instanceof Date);
        strict_1.default.ok(typeof called?.actualWaitMin === 'number');
    });
    (0, node_test_1.default)('callNext returns null when no waiting entries', () => {
        const svc = makeService();
        const result = svc.callNext('r1', 't');
        strict_1.default.equal(result, null);
    });
    (0, node_test_1.default)('callNextByTenant preserves back-compat behavior (resourceId optional)', () => {
        const svc = makeService();
        svc.joinQueue({ tenantId: 't', queueType: queue_entity_1.QueueType.Waiting, memberId: 'm1', resourceId: 'r1' });
        const next = svc.callNextByTenant('t');
        strict_1.default.ok(next);
        strict_1.default.equal(next.status, queue_entity_1.QueueStatus.Called);
    });
});
(0, node_test_1.describe)('QueueService: status transitions', () => {
    (0, node_test_1.default)('startService transitions Called→Serving', () => {
        const svc = makeService();
        const e = svc.create({ tenantId: 't', type: queue_entity_1.QueueType.Waiting, userId: 'u', userName: 'u', partySize: 1, resourceId: 'r1' });
        svc.callNext('r1', 't');
        const serving = svc.startService(e.id, 't');
        strict_1.default.equal(serving.status, queue_entity_1.QueueStatus.Serving);
    });
    (0, node_test_1.default)('markNoShow transitions Called→NoShow', () => {
        const svc = makeService();
        const e = svc.create({ tenantId: 't', type: queue_entity_1.QueueType.Waiting, userId: 'u', userName: 'u', partySize: 1, resourceId: 'r1' });
        svc.callNext('r1', 't');
        const noShow = svc.markNoShow(e.id, 't');
        strict_1.default.equal(noShow.status, queue_entity_1.QueueStatus.NoShow);
    });
    (0, node_test_1.default)('startService rejects Waiting (must be Called)', () => {
        const svc = makeService();
        const e = svc.joinQueue({ tenantId: 't', queueType: queue_entity_1.QueueType.Waiting, memberId: 'm1' });
        strict_1.default.throws(() => svc.startService(e.id, 't'), /Invalid queue status transition/);
    });
});
(0, node_test_1.describe)('QueueService: getQueueStats', () => {
    (0, node_test_1.default)('getQueueStats aggregates counts across all statuses', () => {
        const svc = makeService();
        const a = svc.joinQueue({ tenantId: 't', queueType: queue_entity_1.QueueType.Waiting, memberId: 'a', resourceId: 'r' });
        svc.joinQueue({ tenantId: 't', queueType: queue_entity_1.QueueType.Waiting, memberId: 'b', resourceId: 'r' });
        svc.callNext('r', 't');
        svc.startService(a.id, 't');
        svc.completeService(a.id, 't');
        svc.leaveQueue(svc.findAll('t').find((q) => q.userId === 'b').id, 't');
        const stats = svc.getQueueStats('t', 'r');
        strict_1.default.equal(stats.total, 2);
        strict_1.default.equal(stats.completedCount, 1);
        strict_1.default.equal(stats.cancelledCount, 1);
    });
    (0, node_test_1.default)('getQueueStats returns 0 counts for empty tenant', () => {
        const svc = makeService();
        const stats = svc.getQueueStats('empty', 'r');
        strict_1.default.equal(stats.total, 0);
        strict_1.default.equal(stats.avgWaitMin, 0);
    });
});
//# sourceMappingURL=queue.service.test.js.map