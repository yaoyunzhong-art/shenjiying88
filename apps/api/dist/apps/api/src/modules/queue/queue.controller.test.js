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
const queue_controller_1 = require("./queue.controller");
const queue_entity_1 = require("./queue.entity");
function makeMockService(overrides = {}) {
    return {
        joinQueue: (() => ({})),
        leaveQueue: (() => ({})),
        callNext: (() => null),
        startService: (() => ({})),
        completeService: (() => ({})),
        markNoShow: (() => ({})),
        getQueueStatus: (() => ({})),
        getMyPosition: (() => ({ position: -1, estimatedWaitMinutes: 0, entry: null })),
        ...overrides
    };
}
function makeEntry(overrides = {}) {
    return {
        id: 'queue-1',
        tenantId: 'tenant-1',
        type: 'waiting',
        queueNumber: 'B001',
        userId: 'member-1',
        userName: 'Alice',
        partySize: 1,
        resourceId: 'r-1',
        resourceName: 'Table 5',
        status: queue_entity_1.QueueStatus.Waiting,
        priority: 0,
        estimatedWaitMin: 5,
        createdAt: new Date('2026-06-23T00:00:00.000Z'),
        updatedAt: new Date('2026-06-23T00:00:00.000Z'),
        ...overrides
    };
}
// ── Controller metadata ─────────────────────────────────────────────────
(0, node_test_1.describe)('QueueController metadata', () => {
    (0, node_test_1.default)('controller path is queue', () => {
        const path = Reflect.getMetadata('path', queue_controller_1.QueueController);
        strict_1.default.equal(path, 'queue');
    });
    (0, node_test_1.default)('joinQueue POST join', () => {
        const method = Reflect.getMetadata('method', queue_controller_1.QueueController.prototype.joinQueue);
        const path = Reflect.getMetadata('path', queue_controller_1.QueueController.prototype.joinQueue);
        strict_1.default.equal(method, 1); // POST
        strict_1.default.equal(path, 'join');
    });
    (0, node_test_1.default)('leaveQueue POST :entryId/leave', () => {
        const method = Reflect.getMetadata('method', queue_controller_1.QueueController.prototype.leaveQueue);
        const path = Reflect.getMetadata('path', queue_controller_1.QueueController.prototype.leaveQueue);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, ':entryId/leave');
    });
    (0, node_test_1.default)('callNext POST call-next', () => {
        const method = Reflect.getMetadata('method', queue_controller_1.QueueController.prototype.callNext);
        const path = Reflect.getMetadata('path', queue_controller_1.QueueController.prototype.callNext);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, 'call-next');
    });
    (0, node_test_1.default)('startService POST :entryId/start-service', () => {
        const method = Reflect.getMetadata('method', queue_controller_1.QueueController.prototype.startService);
        const path = Reflect.getMetadata('path', queue_controller_1.QueueController.prototype.startService);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, ':entryId/start-service');
    });
    (0, node_test_1.default)('completeService POST :entryId/complete', () => {
        const method = Reflect.getMetadata('method', queue_controller_1.QueueController.prototype.completeService);
        const path = Reflect.getMetadata('path', queue_controller_1.QueueController.prototype.completeService);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, ':entryId/complete');
    });
    (0, node_test_1.default)('markNoShow POST :entryId/no-show', () => {
        const method = Reflect.getMetadata('method', queue_controller_1.QueueController.prototype.markNoShow);
        const path = Reflect.getMetadata('path', queue_controller_1.QueueController.prototype.markNoShow);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, ':entryId/no-show');
    });
    (0, node_test_1.default)('getQueueStatus GET status/:resourceId', () => {
        const method = Reflect.getMetadata('method', queue_controller_1.QueueController.prototype.getQueueStatus);
        const path = Reflect.getMetadata('path', queue_controller_1.QueueController.prototype.getQueueStatus);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, 'status/:resourceId');
    });
    (0, node_test_1.default)('getMyPosition GET position', () => {
        const method = Reflect.getMetadata('method', queue_controller_1.QueueController.prototype.getMyPosition);
        const path = Reflect.getMetadata('path', queue_controller_1.QueueController.prototype.getMyPosition);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'position');
    });
});
// ── joinQueue behavior ──────────────────────────────────────────────────
(0, node_test_1.describe)('QueueController.joinQueue', () => {
    (0, node_test_1.default)('translates tenantContext.tenantId to service joinQueue input', () => {
        const captured = [];
        const controller = new queue_controller_1.QueueController(makeMockService({
            joinQueue: (input) => {
                captured.push(input);
                return makeEntry({ userId: input.memberId });
            }
        }));
        const result = controller.joinQueue({ tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A' }, {
            queueType: 'waiting',
            memberId: 'member-1',
            memberName: 'Alice',
            resourceId: 'r-1',
            resourceName: 'Table 5',
            priority: 2
        });
        strict_1.default.equal(captured.length, 1);
        strict_1.default.equal(captured[0].tenantId, 'tenant-A');
        strict_1.default.equal(captured[0].memberId, 'member-1');
        strict_1.default.equal(captured[0].memberName, 'Alice');
        strict_1.default.equal(captured[0].resourceId, 'r-1');
        strict_1.default.equal(captured[0].priority, 2);
        // Result is the contract serialization (date → ISO string)
        strict_1.default.equal(result.id, 'queue-1');
        strict_1.default.equal(typeof result.createdAt, 'string');
    });
    (0, node_test_1.default)('joins without optional fields', () => {
        const captured = [];
        const controller = new queue_controller_1.QueueController(makeMockService({
            joinQueue: (input) => {
                captured.push(input);
                return makeEntry();
            }
        }));
        controller.joinQueue({ tenantId: 't', brandId: 'b', storeId: 's' }, { queueType: 'booking', memberId: 'm' });
        strict_1.default.equal(captured[0].priority, undefined);
        strict_1.default.equal(captured[0].resourceId, undefined);
        strict_1.default.equal(captured[0].remark, undefined);
    });
});
// ── leaveQueue / callNext / startService / completeService / markNoShow ──
(0, node_test_1.describe)('QueueController state transitions', () => {
    (0, node_test_1.default)('leaveQueue passes entryId and tenantId', () => {
        const captured = [];
        const controller = new queue_controller_1.QueueController(makeMockService({
            leaveQueue: (...args) => {
                captured.push([args[0], args[1]]);
                return makeEntry({ status: queue_entity_1.QueueStatus.Cancelled });
            }
        }));
        controller.leaveQueue({ tenantId: 't-A', brandId: 'b', storeId: 's' }, 'entry-1');
        strict_1.default.deepEqual(captured[0], ['entry-1', 't-A']);
    });
    (0, node_test_1.default)('callNext passes resourceId from body, tenantId from context', () => {
        const captured = [];
        const controller = new queue_controller_1.QueueController(makeMockService({
            callNext: (...args) => {
                captured.push([args[0], args[1]]);
                return makeEntry({ status: queue_entity_1.QueueStatus.Called });
            }
        }));
        controller.callNext({ tenantId: 't-A', brandId: 'b', storeId: 's' }, { resourceId: 'r-1' });
        strict_1.default.deepEqual(captured[0], ['r-1', 't-A']);
    });
    (0, node_test_1.default)('startService is straightforward entryId+tenantId', () => {
        const captured = [];
        const controller = new queue_controller_1.QueueController(makeMockService({
            startService: (...args) => {
                captured.push([args[0], args[1]]);
                return makeEntry({ status: queue_entity_1.QueueStatus.Serving });
            }
        }));
        controller.startService({ tenantId: 't', brandId: 'b', storeId: 's' }, 'e-1');
        strict_1.default.deepEqual(captured[0], ['e-1', 't']);
    });
    (0, node_test_1.default)('completeService passes entryId+tenantId to alias method', () => {
        const captured = [];
        const controller = new queue_controller_1.QueueController(makeMockService({
            completeService: (...args) => {
                captured.push([args[0], args[1]]);
                return makeEntry({ status: queue_entity_1.QueueStatus.Completed });
            }
        }));
        controller.completeService({ tenantId: 't', brandId: 'b', storeId: 's' }, 'e-1');
        strict_1.default.deepEqual(captured[0], ['e-1', 't']);
    });
    (0, node_test_1.default)('markNoShow returns the marked entry', () => {
        const captured = [];
        const controller = new queue_controller_1.QueueController(makeMockService({
            markNoShow: (...args) => {
                captured.push([args[0], args[1]]);
                return makeEntry({ status: queue_entity_1.QueueStatus.NoShow });
            }
        }));
        const result = controller.markNoShow({ tenantId: 't', brandId: 'b', storeId: 's' }, 'e-1');
        strict_1.default.equal(result.status, queue_entity_1.QueueStatus.NoShow);
    });
});
// ── getQueueStatus / getMyPosition ──────────────────────────────────────
(0, node_test_1.describe)('QueueController queue queries', () => {
    (0, node_test_1.default)('getQueueStatus passes resourceId and tenantId', () => {
        const captured = [];
        const controller = new queue_controller_1.QueueController(makeMockService({
            getQueueStatus: (...args) => {
                captured.push([args[0], args[1]]);
                return { total: 5, waitingCount: 2, calledCount: 1, servingCount: 1, completedCount: 1, cancelledCount: 0, noShowCount: 0, avgWaitMin: 8 };
            }
        }));
        const result = controller.getQueueStatus({ tenantId: 't-A', brandId: 'b', storeId: 's' }, 'r-1');
        strict_1.default.deepEqual(captured[0], ['r-1', 't-A']);
        strict_1.default.equal(result.total, 5);
    });
    (0, node_test_1.default)('getMyPosition returns -1 fallback when memberId/resourceId missing', () => {
        const controller = new queue_controller_1.QueueController(makeMockService());
        const result = controller.getMyPosition({ tenantId: 't', brandId: 'b', storeId: 's' }, {});
        strict_1.default.equal(result.position, -1);
        strict_1.default.equal(result.entry, null);
    });
    (0, node_test_1.default)('getMyPosition returns real position when both ids provided', () => {
        const controller = new queue_controller_1.QueueController(makeMockService({
            getMyPosition: (...args) => ({
                position: 3,
                estimatedWaitMinutes: 15,
                entry: makeEntry({ userId: args[0], resourceId: args[1] })
            })
        }));
        const result = controller.getMyPosition({ tenantId: 't', brandId: 'b', storeId: 's' }, { memberId: 'm-1', resourceId: 'r-1' });
        strict_1.default.equal(result.position, 3);
        strict_1.default.equal(result.estimatedWaitMinutes, 15);
        strict_1.default.equal(result.entry?.userId, 'm-1');
    });
});
// ── Controller integration with real service (light smoke) ──────────────
(0, node_test_1.describe)('QueueController integration with real service', () => {
    (0, node_test_1.default)('full join→leave flow returns valid contract shapes', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { QueueService } = require('./queue.service');
        const svc = new QueueService();
        svc.resetQueueStoresForTests();
        const controller = new queue_controller_1.QueueController(svc);
        const joined = controller.joinQueue({ tenantId: 't-smoke', brandId: 'b', storeId: 's' }, { queueType: 'waiting', memberId: 'm-smoke', memberName: 'Alice' });
        strict_1.default.equal(joined.userId, 'm-smoke');
        strict_1.default.equal(joined.status, queue_entity_1.QueueStatus.Waiting);
        strict_1.default.equal(typeof joined.createdAt, 'string');
        const left = controller.leaveQueue({ tenantId: 't-smoke', brandId: 'b', storeId: 's' }, joined.id);
        strict_1.default.equal(left.status, queue_entity_1.QueueStatus.Cancelled);
    });
    (0, node_test_1.default)('full join→call-next→start→complete flow', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { QueueService } = require('./queue.service');
        const svc = new QueueService();
        svc.resetQueueStoresForTests();
        const controller = new queue_controller_1.QueueController(svc);
        controller.joinQueue({ tenantId: 't-full', brandId: 'b', storeId: 's' }, { queueType: 'waiting', memberId: 'm-flow', resourceId: 'r-flow' });
        const called = controller.callNext({ tenantId: 't-full', brandId: 'b', storeId: 's' }, { resourceId: 'r-flow' });
        strict_1.default.equal(called?.status, queue_entity_1.QueueStatus.Called);
        const serving = controller.startService({ tenantId: 't-full', brandId: 'b', storeId: 's' }, called.id);
        strict_1.default.equal(serving.status, queue_entity_1.QueueStatus.Serving);
        const completed = controller.completeService({ tenantId: 't-full', brandId: 'b', storeId: 's' }, called.id);
        strict_1.default.equal(completed.status, queue_entity_1.QueueStatus.Completed);
    });
});
//# sourceMappingURL=queue.controller.test.js.map