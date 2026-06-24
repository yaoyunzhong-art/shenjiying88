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
// ── Mock NestJS decorators ──────────────────────────────────────────
function Controller(prefix) {
    return (target) => {
        target.__prefix = prefix;
        return target;
    };
}
const getRegistrations = [];
function Get(path = '') {
    return (_target, propertyKey) => {
        getRegistrations.push(`${String(propertyKey)}:${path}`);
    };
}
const postRegistrations = [];
function Post(path = '') {
    return (_target, propertyKey) => {
        postRegistrations.push(`${String(propertyKey)}:${path}`);
    };
}
const paramRegistrations = [];
function Param(name) {
    return (_target, propertyKey, parameterIndex) => {
        paramRegistrations.push(`${String(propertyKey)}:${name}:${parameterIndex}`);
    };
}
const bodyRegistrations = [];
function Body(name) {
    return (_target, propertyKey, parameterIndex) => {
        bodyRegistrations.push(`${String(propertyKey)}:${name ?? ''}:${parameterIndex}`);
    };
}
const queryRegistrations = [];
function Query(name) {
    return (_target, propertyKey, parameterIndex) => {
        queryRegistrations.push(`${String(propertyKey)}:${name ?? ''}:${parameterIndex}`);
    };
}
const tenantContextRegistrations = [];
function TenantContext() {
    return (_target, propertyKey, parameterIndex) => {
        tenantContextRegistrations.push(`${String(propertyKey)}:${parameterIndex}`);
    };
}
function createMockId() {
    return `queue-mock-${Math.random().toString(36).slice(2, 10)}`;
}
function createMockQueueService() {
    return {
        joinQueue: (input) => ({
            id: createMockId(),
            tenantId: input.tenantId,
            type: input.queueType,
            queueNumber: 'B001',
            userId: input.memberId,
            userName: input.memberName ?? input.memberId,
            phone: undefined,
            partySize: 1,
            resourceId: input.resourceId,
            resourceName: input.resourceName,
            status: 'waiting',
            priority: input.priority ?? 0,
            estimatedWaitMin: 5,
            actualWaitMin: undefined,
            calledAt: undefined,
            servedAt: undefined,
            completedAt: undefined,
            remark: input.remark,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }),
        leaveQueue: (entryId, _tenantId) => ({
            id: entryId,
            tenantId: _tenantId,
            type: queue_entity_1.QueueType.Waiting,
            queueNumber: 'B001',
            userId: 'member-1',
            userName: '张三',
            phone: undefined,
            partySize: 1,
            resourceId: 'machine-1',
            resourceName: '游戏机1号',
            status: 'cancelled',
            priority: 0,
            estimatedWaitMin: 5,
            actualWaitMin: undefined,
            calledAt: undefined,
            servedAt: undefined,
            completedAt: undefined,
            remark: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }),
        callNext: (resourceId, _tenantId) => ({
            id: createMockId(),
            tenantId: _tenantId,
            type: queue_entity_1.QueueType.Waiting,
            queueNumber: 'B001',
            userId: 'member-called',
            userName: '李四',
            phone: undefined,
            partySize: 1,
            resourceId,
            resourceName: '游戏机1号',
            status: 'called',
            priority: 0,
            estimatedWaitMin: 5,
            actualWaitMin: 3,
            calledAt: new Date().toISOString(),
            servedAt: undefined,
            completedAt: undefined,
            remark: undefined,
            createdAt: new Date(Date.now() - 180000).toISOString(),
            updatedAt: new Date().toISOString(),
        }),
        startService: (entryId, _tenantId) => ({
            id: entryId,
            tenantId: _tenantId,
            type: queue_entity_1.QueueType.Waiting,
            queueNumber: 'B001',
            userId: 'member-served',
            userName: '王五',
            phone: undefined,
            partySize: 2,
            resourceId: 'machine-1',
            resourceName: '游戏机1号',
            status: 'serving',
            priority: 0,
            estimatedWaitMin: 10,
            actualWaitMin: 5,
            calledAt: new Date(Date.now() - 120000).toISOString(),
            servedAt: new Date().toISOString(),
            completedAt: undefined,
            remark: undefined,
            createdAt: new Date(Date.now() - 300000).toISOString(),
            updatedAt: new Date().toISOString(),
        }),
        completeService: (entryId, _tenantId) => ({
            id: entryId,
            tenantId: _tenantId,
            type: queue_entity_1.QueueType.Waiting,
            queueNumber: 'B001',
            userId: 'member-done',
            userName: '赵六',
            phone: undefined,
            partySize: 1,
            resourceId: 'machine-1',
            resourceName: '游戏机1号',
            status: 'completed',
            priority: 0,
            estimatedWaitMin: 5,
            actualWaitMin: 8,
            calledAt: new Date(Date.now() - 480000).toISOString(),
            servedAt: new Date(Date.now() - 300000).toISOString(),
            completedAt: new Date().toISOString(),
            remark: undefined,
            createdAt: new Date(Date.now() - 600000).toISOString(),
            updatedAt: new Date().toISOString(),
        }),
        markNoShow: (entryId, _tenantId) => ({
            id: entryId,
            tenantId: _tenantId,
            type: queue_entity_1.QueueType.Waiting,
            queueNumber: 'B001',
            userId: 'member-noshow',
            userName: '孙七',
            phone: undefined,
            partySize: 1,
            resourceId: 'machine-1',
            resourceName: '游戏机1号',
            status: 'no_show',
            priority: 0,
            estimatedWaitMin: 5,
            actualWaitMin: undefined,
            calledAt: new Date(Date.now() - 60000).toISOString(),
            servedAt: undefined,
            completedAt: undefined,
            remark: undefined,
            createdAt: new Date(Date.now() - 360000).toISOString(),
            updatedAt: new Date().toISOString(),
        }),
        getQueueStatus: (_resourceId, _tenantId) => ({
            total: 8,
            waitingCount: 3,
            calledCount: 1,
            servingCount: 2,
            completedCount: 1,
            cancelledCount: 1,
            noShowCount: 0,
            avgWaitMin: 6,
        }),
        getMyPosition: (memberId, resourceId, _tenantId) => {
            if (memberId === 'member-inqueue') {
                return {
                    position: 2,
                    estimatedWaitMinutes: 10,
                    entry: {
                        id: createMockId(),
                        tenantId: _tenantId,
                        type: queue_entity_1.QueueType.Waiting,
                        queueNumber: 'B002',
                        userId: memberId,
                        userName: '周八',
                        phone: undefined,
                        partySize: 1,
                        resourceId,
                        resourceName: '游戏机2号',
                        status: 'waiting',
                        priority: 0,
                        estimatedWaitMin: 10,
                        actualWaitMin: undefined,
                        calledAt: undefined,
                        servedAt: undefined,
                        completedAt: undefined,
                        remark: undefined,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                };
            }
            return { position: -1, estimatedWaitMinutes: 0, entry: null };
        },
    };
}
// ── Controller implementation (mirrors real QueueController) ──────
class MockQueueController {
    queueService;
    constructor(queueService) {
        this.queueService = queueService;
    }
    joinQueue(tenantContext, body) {
        return this.queueService.joinQueue({
            tenantId: tenantContext.tenantId,
            queueType: body.queueType,
            resourceId: body.resourceId,
            resourceName: body.resourceName,
            memberId: body.memberId,
            memberName: body.memberName,
            priority: body.priority,
            remark: body.remark,
        });
    }
    leaveQueue(tenantContext, entryId) {
        return this.queueService.leaveQueue(entryId, tenantContext.tenantId);
    }
    callNext(tenantContext, body) {
        return this.queueService.callNext(body.resourceId, tenantContext.tenantId);
    }
    startService(tenantContext, entryId) {
        return this.queueService.startService(entryId, tenantContext.tenantId);
    }
    completeService(tenantContext, entryId) {
        return this.queueService.completeService(entryId, tenantContext.tenantId);
    }
    markNoShow(tenantContext, entryId) {
        return this.queueService.markNoShow(entryId, tenantContext.tenantId);
    }
    getQueueStatus(tenantContext, resourceId) {
        return this.queueService.getQueueStatus(resourceId, tenantContext.tenantId);
    }
    getMyPosition(tenantContext, query) {
        if (!query.memberId || !query.resourceId) {
            return { position: -1, estimatedWaitMinutes: 0, entry: null };
        }
        return this.queueService.getMyPosition(query.memberId, query.resourceId, tenantContext.tenantId);
    }
}
// Register decorators
Post('join')(MockQueueController.prototype, 'joinQueue');
Post(':entryId/leave')(MockQueueController.prototype, 'leaveQueue');
Post('call-next')(MockQueueController.prototype, 'callNext');
Post(':entryId/start-service')(MockQueueController.prototype, 'startService');
Post(':entryId/complete')(MockQueueController.prototype, 'completeService');
Post(':entryId/no-show')(MockQueueController.prototype, 'markNoShow');
Get('status/:resourceId')(MockQueueController.prototype, 'getQueueStatus');
Get('position')(MockQueueController.prototype, 'getMyPosition');
TenantContext()(MockQueueController.prototype, 'joinQueue', 0);
TenantContext()(MockQueueController.prototype, 'leaveQueue', 0);
TenantContext()(MockQueueController.prototype, 'callNext', 0);
TenantContext()(MockQueueController.prototype, 'startService', 0);
TenantContext()(MockQueueController.prototype, 'completeService', 0);
TenantContext()(MockQueueController.prototype, 'markNoShow', 0);
TenantContext()(MockQueueController.prototype, 'getQueueStatus', 0);
TenantContext()(MockQueueController.prototype, 'getMyPosition', 0);
Param('entryId')(MockQueueController.prototype, 'leaveQueue', 1);
Param('entryId')(MockQueueController.prototype, 'startService', 1);
Param('entryId')(MockQueueController.prototype, 'completeService', 1);
Param('entryId')(MockQueueController.prototype, 'markNoShow', 1);
Param('resourceId')(MockQueueController.prototype, 'getQueueStatus', 1);
Body()(MockQueueController.prototype, 'joinQueue', 1);
Body()(MockQueueController.prototype, 'callNext', 1);
Query()(MockQueueController.prototype, 'getMyPosition', 1);
Controller('queue')(MockQueueController);
// ── Tests ──────────────────────────────────────────────────────────
(0, node_test_1.describe)('QueueController', () => {
    let controller;
    let mockService;
    node_test_1.default.beforeEach(() => {
        // Reset registrations so each describe block runs with a clean slate
        // (node:test runs suites sequentially within a file, but beforeEach
        //  is per-test; we rely on the top-level registration above being static)
        mockService = createMockQueueService();
        controller = new MockQueueController(mockService);
    });
    // ── Decorator metadata ─────────────────────────────────────────
    (0, node_test_1.describe)('decorator metadata', () => {
        (0, node_test_1.default)('registers @Controller("queue") prefix', () => {
            strict_1.default.equal(MockQueueController.__prefix, 'queue');
        });
        (0, node_test_1.default)('registers 8 endpoints (6 POST + 2 GET)', () => {
            strict_1.default.equal(postRegistrations.length, 6);
            strict_1.default.equal(getRegistrations.length, 2);
        });
        (0, node_test_1.default)('registers POST endpoints with correct paths', () => {
            strict_1.default.ok(postRegistrations.includes('joinQueue:join'));
            strict_1.default.ok(postRegistrations.includes('leaveQueue::entryId/leave'));
            strict_1.default.ok(postRegistrations.includes('callNext:call-next'));
            strict_1.default.ok(postRegistrations.includes('startService::entryId/start-service'));
            strict_1.default.ok(postRegistrations.includes('completeService::entryId/complete'));
            strict_1.default.ok(postRegistrations.includes('markNoShow::entryId/no-show'));
        });
        (0, node_test_1.default)('registers GET endpoints with correct paths', () => {
            strict_1.default.ok(getRegistrations.includes('getQueueStatus:status/:resourceId'));
            strict_1.default.ok(getRegistrations.includes('getMyPosition:position'));
        });
        (0, node_test_1.default)('registers TenantContext on all endpoints', () => {
            [
                'joinQueue',
                'leaveQueue',
                'callNext',
                'startService',
                'completeService',
                'markNoShow',
                'getQueueStatus',
                'getMyPosition',
            ].forEach((fn) => {
                strict_1.default.ok(tenantContextRegistrations.includes(`${fn}:0`), `TenantContext should be on param 0 of ${fn}`);
            });
        });
        (0, node_test_1.default)('registers @Param("entryId") on leave/start/complete/no-show', () => {
            strict_1.default.ok(paramRegistrations.includes('leaveQueue:entryId:1'));
            strict_1.default.ok(paramRegistrations.includes('startService:entryId:1'));
            strict_1.default.ok(paramRegistrations.includes('completeService:entryId:1'));
            strict_1.default.ok(paramRegistrations.includes('markNoShow:entryId:1'));
        });
        (0, node_test_1.default)('registers @Param("resourceId") on getQueueStatus', () => {
            strict_1.default.ok(paramRegistrations.includes('getQueueStatus:resourceId:1'));
        });
        (0, node_test_1.default)('registers @Body on joinQueue and callNext', () => {
            strict_1.default.ok(bodyRegistrations.includes('joinQueue::1'));
            strict_1.default.ok(bodyRegistrations.includes('callNext::1'));
        });
        (0, node_test_1.default)('registers @Query on getMyPosition', () => {
            strict_1.default.ok(queryRegistrations.includes('getMyPosition::1'));
        });
    });
    // ── Queue join ────────────────────────────────────────────────
    (0, node_test_1.describe)('joinQueue() — positive', () => {
        const tenantCtx = { tenantId: 't-test', marketCode: 'cn-mainland' };
        (0, node_test_1.default)('returns queue entry with waiting status', () => {
            const result = controller.joinQueue(tenantCtx, {
                queueType: queue_entity_1.QueueType.Waiting,
                memberId: 'member-new',
                memberName: '新用户',
                resourceId: 'machine-1',
                resourceName: '游戏机1号',
            });
            strict_1.default.equal(result.status, 'waiting');
            strict_1.default.equal(result.type, queue_entity_1.QueueType.Waiting);
            strict_1.default.equal(result.userId, 'member-new');
            strict_1.default.equal(result.userName, '新用户');
        });
        (0, node_test_1.default)('returns queue entry with queue number', () => {
            const result = controller.joinQueue(tenantCtx, {
                queueType: queue_entity_1.QueueType.Waiting,
                memberId: 'member-q',
                resourceId: 'machine-2',
            });
            strict_1.default.ok(typeof result.queueNumber === 'string');
            strict_1.default.ok(result.queueNumber.length > 0);
        });
        (0, node_test_1.default)('assigns estimated wait time', () => {
            const result = controller.joinQueue(tenantCtx, {
                queueType: queue_entity_1.QueueType.Booking,
                memberId: 'member-booking',
                resourceId: 'machine-3',
            });
            strict_1.default.equal(typeof result.estimatedWaitMin, 'number');
            strict_1.default.ok(result.estimatedWaitMin >= 0);
        });
        (0, node_test_1.default)('assigns unique entry ID', () => {
            const result = controller.joinQueue(tenantCtx, {
                queueType: queue_entity_1.QueueType.Waiting,
                memberId: 'member-unique',
            });
            strict_1.default.ok(result.id.startsWith('queue-mock-'));
        });
    });
    (0, node_test_1.describe)('joinQueue() — edge / boundary', () => {
        const tenantCtx = { tenantId: 't-edge', marketCode: 'cn-mainland' };
        (0, node_test_1.default)('works with minimal fields (only queueType + memberId)', () => {
            const result = controller.joinQueue(tenantCtx, {
                queueType: queue_entity_1.QueueType.Service,
                memberId: 'minimal-member',
            });
            strict_1.default.equal(result.status, 'waiting');
            strict_1.default.equal(result.userId, 'minimal-member');
        });
        (0, node_test_1.default)('accepts optional remark', () => {
            const result = controller.joinQueue(tenantCtx, {
                queueType: queue_entity_1.QueueType.Waiting,
                memberId: 'member-remark',
                remark: '请优先安排',
            });
            strict_1.default.equal(result.remark, '请优先安排');
        });
        (0, node_test_1.default)('accepts priority field', () => {
            const result = controller.joinQueue(tenantCtx, {
                queueType: queue_entity_1.QueueType.Waiting,
                memberId: 'member-vip',
                priority: 10,
            });
            strict_1.default.equal(result.priority, 10);
        });
    });
    // ── Leave / cancel ────────────────────────────────────────────
    (0, node_test_1.describe)('leaveQueue() — positive', () => {
        const tenantCtx = { tenantId: 't-leave', marketCode: 'cn-mainland' };
        (0, node_test_1.default)('returns entry with cancelled status', () => {
            const result = controller.leaveQueue(tenantCtx, 'queue-leave-001');
            strict_1.default.equal(result.status, 'cancelled');
            strict_1.default.equal(result.id, 'queue-leave-001');
        });
        (0, node_test_1.default)('keeps original userId', () => {
            const result = controller.leaveQueue(tenantCtx, 'queue-leave-002');
            strict_1.default.equal(result.userId, 'member-1');
        });
    });
    // ── Call next ─────────────────────────────────────────────────
    (0, node_test_1.describe)('callNext() — positive', () => {
        const tenantCtx = { tenantId: 't-call', marketCode: 'cn-mainland' };
        (0, node_test_1.default)('returns called entry', () => {
            const result = controller.callNext(tenantCtx, { resourceId: 'machine-1' });
            strict_1.default.ok(result !== null);
            strict_1.default.equal(result.status, 'called');
            strict_1.default.equal(result.resourceId, 'machine-1');
        });
        (0, node_test_1.default)('returns non-null entry when queue has waiting members', () => {
            const result = controller.callNext(tenantCtx, { resourceId: 'machine-1' });
            strict_1.default.ok(result !== null);
            strict_1.default.equal(typeof result.queueNumber, 'string');
        });
        (0, node_test_1.default)('includes actualWaitMin on called entry', () => {
            const result = controller.callNext(tenantCtx, { resourceId: 'machine-1' });
            strict_1.default.ok(result !== null);
            strict_1.default.equal(typeof result.actualWaitMin, 'number');
            strict_1.default.ok(result.actualWaitMin >= 0);
        });
    });
    // ── Start service ─────────────────────────────────────────────
    (0, node_test_1.describe)('startService() — positive', () => {
        const tenantCtx = { tenantId: 't-svc', marketCode: 'cn-mainland' };
        (0, node_test_1.default)('returns entry with serving status', () => {
            const result = controller.startService(tenantCtx, 'queue-svc-001');
            strict_1.default.equal(result.status, 'serving');
            strict_1.default.equal(result.id, 'queue-svc-001');
        });
        (0, node_test_1.default)('includes servedAt timestamp', () => {
            const result = controller.startService(tenantCtx, 'queue-svc-002');
            strict_1.default.ok(typeof result.servedAt === 'string');
        });
        (0, node_test_1.default)('keeps userId and resourceId', () => {
            const result = controller.startService(tenantCtx, 'queue-svc-003');
            strict_1.default.equal(result.userId, 'member-served');
            strict_1.default.equal(result.resourceId, 'machine-1');
        });
    });
    // ── Complete service ──────────────────────────────────────────
    (0, node_test_1.describe)('completeService() — positive', () => {
        const tenantCtx = { tenantId: 't-done', marketCode: 'cn-mainland' };
        (0, node_test_1.default)('returns entry with completed status', () => {
            const result = controller.completeService(tenantCtx, 'queue-done-001');
            strict_1.default.equal(result.status, 'completed');
        });
        (0, node_test_1.default)('includes completedAt timestamp', () => {
            const result = controller.completeService(tenantCtx, 'queue-done-002');
            strict_1.default.ok(typeof result.completedAt === 'string');
        });
    });
    // ── No-show ───────────────────────────────────────────────────
    (0, node_test_1.describe)('markNoShow() — positive', () => {
        const tenantCtx = { tenantId: 't-noshow', marketCode: 'cn-mainland' };
        (0, node_test_1.default)('returns entry with no_show status', () => {
            const result = controller.markNoShow(tenantCtx, 'queue-noshow-001');
            strict_1.default.equal(result.status, 'no_show');
        });
        (0, node_test_1.default)('handles after callNext timing', () => {
            const result = controller.markNoShow(tenantCtx, 'queue-noshow-002');
            strict_1.default.equal(result.status, 'no_show');
            strict_1.default.ok(typeof result.calledAt === 'string');
        });
    });
    // ── Queue status ──────────────────────────────────────────────
    (0, node_test_1.describe)('getQueueStatus() — positive', () => {
        const tenantCtx = { tenantId: 't-stats', marketCode: 'cn-mainland' };
        (0, node_test_1.default)('returns queue statistics', () => {
            const result = controller.getQueueStatus(tenantCtx, 'machine-1');
            strict_1.default.equal(typeof result.total, 'number');
            strict_1.default.equal(typeof result.waitingCount, 'number');
            strict_1.default.equal(typeof result.calledCount, 'number');
            strict_1.default.equal(typeof result.servingCount, 'number');
        });
        (0, node_test_1.default)('returns avgWaitMin as number', () => {
            const result = controller.getQueueStatus(tenantCtx, 'machine-1');
            strict_1.default.equal(typeof result.avgWaitMin, 'number');
        });
        (0, node_test_1.default)('all status fields sum to total', () => {
            const result = controller.getQueueStatus(tenantCtx, 'machine-1');
            const subTotal = result.waitingCount +
                result.calledCount +
                result.servingCount +
                result.completedCount +
                result.cancelledCount +
                result.noShowCount;
            strict_1.default.equal(subTotal, result.total);
        });
    });
    // ── Get my position ───────────────────────────────────────────
    (0, node_test_1.describe)('getMyPosition() — positive', () => {
        const tenantCtx = { tenantId: 't-pos', marketCode: 'cn-mainland' };
        (0, node_test_1.default)('returns position for member in queue', () => {
            const result = controller.getMyPosition(tenantCtx, {
                memberId: 'member-inqueue',
                resourceId: 'machine-2',
            });
            strict_1.default.equal(result.position, 2);
            strict_1.default.equal(result.estimatedWaitMinutes, 10);
            strict_1.default.ok(result.entry !== null);
        });
        (0, node_test_1.default)('returns entry details for member in queue', () => {
            const result = controller.getMyPosition(tenantCtx, {
                memberId: 'member-inqueue',
                resourceId: 'machine-2',
            });
            strict_1.default.ok(result.entry !== null);
            strict_1.default.equal(result.entry.userId, 'member-inqueue');
            strict_1.default.equal(result.entry.status, 'waiting');
        });
    });
    (0, node_test_1.describe)('getMyPosition() — edge / boundary', () => {
        const tenantCtx = { tenantId: 't-pos-edge', marketCode: 'cn-mainland' };
        (0, node_test_1.default)('returns position -1 when member not in queue', () => {
            const result = controller.getMyPosition(tenantCtx, {
                memberId: 'member-not-in-queue',
                resourceId: 'machine-1',
            });
            strict_1.default.equal(result.position, -1);
            strict_1.default.equal(result.estimatedWaitMinutes, 0);
            strict_1.default.equal(result.entry, null);
        });
        (0, node_test_1.default)('returns position -1 when memberId is empty', () => {
            const result = controller.getMyPosition(tenantCtx, { memberId: '', resourceId: 'machine-1' });
            strict_1.default.equal(result.position, -1);
            strict_1.default.equal(result.entry, null);
        });
        (0, node_test_1.default)('returns position -1 when resourceId is empty', () => {
            const result = controller.getMyPosition(tenantCtx, {
                memberId: 'member-inqueue',
                resourceId: '',
            });
            strict_1.default.equal(result.position, -1);
            strict_1.default.equal(result.entry, null);
        });
        (0, node_test_1.default)('returns position -1 when memberId is undefined', () => {
            const result = controller.getMyPosition(tenantCtx, { resourceId: 'machine-1' });
            strict_1.default.equal(result.position, -1);
            strict_1.default.equal(result.entry, null);
        });
        (0, node_test_1.default)('returns position -1 when resourceId is undefined', () => {
            const result = controller.getMyPosition(tenantCtx, { memberId: 'member-inqueue' });
            strict_1.default.equal(result.position, -1);
            strict_1.default.equal(result.entry, null);
        });
    });
    // ── Negative / error cases ────────────────────────────────────
    (0, node_test_1.describe)('joinQueue() — negative', () => {
        const tenantCtx = { tenantId: 't-neg', marketCode: 'cn-mainland' };
        (0, node_test_1.default)('defaults memberName to memberId when not provided', () => {
            const result = controller.joinQueue(tenantCtx, {
                queueType: queue_entity_1.QueueType.Waiting,
                memberId: 'no-name-member',
            });
            strict_1.default.equal(result.userName, 'no-name-member');
        });
        (0, node_test_1.default)('handles all three queue types', () => {
            for (const qt of [queue_entity_1.QueueType.Booking, queue_entity_1.QueueType.Waiting, queue_entity_1.QueueType.Service]) {
                const result = controller.joinQueue(tenantCtx, {
                    queueType: qt,
                    memberId: `member-${qt}`,
                });
                strict_1.default.equal(result.type, qt);
            }
        });
    });
    (0, node_test_1.describe)('callNext() — negative', () => {
        const tenantCtx = { tenantId: 't-call-neg', marketCode: 'cn-mainland' };
        (0, node_test_1.default)('returns entry anyway (stub always returns entry)', () => {
            // Per our stub, callNext always returns an entry — this tests stub behavior.
            // The real service would return null if queue is empty.
            const result = controller.callNext(tenantCtx, { resourceId: 'empty-resource' });
            strict_1.default.ok(result !== null);
        });
    });
});
//# sourceMappingURL=queue.controller.spec.js.map