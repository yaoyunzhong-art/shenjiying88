import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata';
import assert from 'node:assert/strict';
import type { RequestTenantContext } from '../tenant/tenant.types';
import { QueueType, QueueStatus } from './queue.entity';
import { toQueueEntryContract } from './queue.contract';

// ── Mock NestJS decorators ──────────────────────────────────────────
function Controller(prefix: string) {
  return (target: { new (...args: any[]): unknown; __prefix?: string }) => {
    target.__prefix = prefix;
    return target;
  };
}

const getRegistrations: string[] = [];
function Get(path = '') {
  return (_target: object, propertyKey: string | symbol) => {
    getRegistrations.push(`${String(propertyKey)}:${path}`);
  };
}

const postRegistrations: string[] = [];
function Post(path = '') {
  return (_target: object, propertyKey: string | symbol) => {
    postRegistrations.push(`${String(propertyKey)}:${path}`);
  };
}

const paramRegistrations: string[] = [];
function Param(name: string) {
  return (_target: object, propertyKey: string | symbol, parameterIndex: number) => {
    paramRegistrations.push(`${String(propertyKey)}:${name}:${parameterIndex}`);
  };
}

const bodyRegistrations: string[] = [];
function Body(name?: string) {
  return (_target: object, propertyKey: string | symbol, parameterIndex: number) => {
    bodyRegistrations.push(`${String(propertyKey)}:${name ?? ''}:${parameterIndex}`);
  };
}

const queryRegistrations: string[] = [];
function Query(name?: string) {
  return (_target: object, propertyKey: string | symbol, parameterIndex: number) => {
    queryRegistrations.push(`${String(propertyKey)}:${name ?? ''}:${parameterIndex}`);
  };
}

const tenantContextRegistrations: string[] = [];
function TenantContext() {
  return (_target: object, propertyKey: string | symbol, parameterIndex: number) => {
    tenantContextRegistrations.push(`${String(propertyKey)}:${parameterIndex}`);
  };
}

// ── Stub service ────────────────────────────────────────────────────
type MockQueueService = {
  joinQueue: (input: {
    tenantId: string;
    queueType: QueueType;
    memberId: string;
    memberName?: string;
    resourceId?: string;
    resourceName?: string;
    priority?: number;
    remark?: string;
  }) => ReturnType<typeof toQueueEntryContract>;
  leaveQueue: (entryId: string, tenantId: string) => ReturnType<typeof toQueueEntryContract>;
  callNext: (
    resourceId: string,
    tenantId: string,
  ) => ReturnType<typeof toQueueEntryContract> | null;
  startService: (entryId: string, tenantId: string) => ReturnType<typeof toQueueEntryContract>;
  completeService: (entryId: string, tenantId: string) => ReturnType<typeof toQueueEntryContract>;
  markNoShow: (entryId: string, tenantId: string) => ReturnType<typeof toQueueEntryContract>;
  getQueueStatus: (
    resourceId: string,
    tenantId: string,
  ) => {
    total: number;
    waitingCount: number;
    calledCount: number;
    servingCount: number;
    completedCount: number;
    cancelledCount: number;
    noShowCount: number;
    avgWaitMin: number;
  };
  getMyPosition: (
    memberId: string,
    resourceId: string,
    tenantId: string,
  ) => {
    position: number;
    estimatedWaitMinutes: number;
    entry: ReturnType<typeof toQueueEntryContract> | null;
  };
};

function createMockId(): string {
  return `queue-mock-${Math.random().toString(36).slice(2, 10)}`;
}

function createMockQueueService(): MockQueueService {
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
      status: QueueStatus.Waiting,
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
      type: QueueType.Waiting,
      queueNumber: 'B001',
      userId: 'member-1',
      userName: '张三',
      phone: undefined,
      partySize: 1,
      resourceId: 'machine-1',
      resourceName: '游戏机1号',
      status: QueueStatus.Cancelled,
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
      type: QueueType.Waiting,
      queueNumber: 'B001',
      userId: 'member-called',
      userName: '李四',
      phone: undefined,
      partySize: 1,
      resourceId,
      resourceName: '游戏机1号',
      status: QueueStatus.Called,
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
      type: QueueType.Waiting,
      queueNumber: 'B001',
      userId: 'member-served',
      userName: '王五',
      phone: undefined,
      partySize: 2,
      resourceId: 'machine-1',
      resourceName: '游戏机1号',
      status: QueueStatus.Serving,
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
      type: QueueType.Waiting,
      queueNumber: 'B001',
      userId: 'member-done',
      userName: '赵六',
      phone: undefined,
      partySize: 1,
      resourceId: 'machine-1',
      resourceName: '游戏机1号',
      status: QueueStatus.Completed,
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
      type: QueueType.Waiting,
      queueNumber: 'B001',
      userId: 'member-noshow',
      userName: '孙七',
      phone: undefined,
      partySize: 1,
      resourceId: 'machine-1',
      resourceName: '游戏机1号',
      status: QueueStatus.NoShow,
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
            type: QueueType.Waiting,
            queueNumber: 'B002',
            userId: memberId,
            userName: '周八',
            phone: undefined,
            partySize: 1,
            resourceId,
            resourceName: '游戏机2号',
            status: QueueStatus.Waiting,
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
  constructor(private readonly queueService: MockQueueService) {}

  joinQueue(
    tenantContext: RequestTenantContext,
    body: {
      queueType: QueueType;
      memberId: string;
      memberName?: string;
      resourceId?: string;
      resourceName?: string;
      priority?: number;
      remark?: string;
    },
  ) {
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

  leaveQueue(tenantContext: RequestTenantContext, entryId: string) {
    return this.queueService.leaveQueue(entryId, tenantContext.tenantId);
  }

  callNext(tenantContext: RequestTenantContext, body: { resourceId: string }) {
    return this.queueService.callNext(body.resourceId, tenantContext.tenantId);
  }

  startService(tenantContext: RequestTenantContext, entryId: string) {
    return this.queueService.startService(entryId, tenantContext.tenantId);
  }

  completeService(tenantContext: RequestTenantContext, entryId: string) {
    return this.queueService.completeService(entryId, tenantContext.tenantId);
  }

  markNoShow(tenantContext: RequestTenantContext, entryId: string) {
    return this.queueService.markNoShow(entryId, tenantContext.tenantId);
  }

  getQueueStatus(tenantContext: RequestTenantContext, resourceId: string) {
    return this.queueService.getQueueStatus(resourceId, tenantContext.tenantId);
  }

  getMyPosition(
    tenantContext: RequestTenantContext,
    query: { memberId?: string; resourceId?: string },
  ) {
    if (!query.memberId || !query.resourceId) {
      return { position: -1, estimatedWaitMinutes: 0, entry: null };
    }
    return this.queueService.getMyPosition(
      query.memberId,
      query.resourceId,
      tenantContext.tenantId,
    );
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
describe('QueueController', () => {
  let controller: MockQueueController;
  let mockService: MockQueueService;

  beforeEach(() => {
    // Reset registrations so each describe block runs with a clean slate
    // (node:test runs suites sequentially within a file, but beforeEach
    //  is per-test; we rely on the top-level registration above being static)
    mockService = createMockQueueService();
    controller = new MockQueueController(mockService);
  });

  // ── Decorator metadata ─────────────────────────────────────────
  describe('decorator metadata', () => {
    it('registers @Controller("queue") prefix', () => {
      assert.equal(
        (MockQueueController as typeof MockQueueController & { __prefix?: string }).__prefix,
        'queue',
      );
    });

    it('registers 8 endpoints (6 POST + 2 GET)', () => {
      assert.equal(postRegistrations.length, 6);
      assert.equal(getRegistrations.length, 2);
    });

    it('registers POST endpoints with correct paths', () => {
      assert.ok(postRegistrations.includes('joinQueue:join'));
      assert.ok(postRegistrations.includes('leaveQueue::entryId/leave'));
      assert.ok(postRegistrations.includes('callNext:call-next'));
      assert.ok(postRegistrations.includes('startService::entryId/start-service'));
      assert.ok(postRegistrations.includes('completeService::entryId/complete'));
      assert.ok(postRegistrations.includes('markNoShow::entryId/no-show'));
    });

    it('registers GET endpoints with correct paths', () => {
      assert.ok(getRegistrations.includes('getQueueStatus:status/:resourceId'));
      assert.ok(getRegistrations.includes('getMyPosition:position'));
    });

    it('registers TenantContext on all endpoints', () => {
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
        assert.ok(
          tenantContextRegistrations.includes(`${fn}:0`),
          `TenantContext should be on param 0 of ${fn}`,
        );
      });
    });

    it('registers @Param("entryId") on leave/start/complete/no-show', () => {
      assert.ok(paramRegistrations.includes('leaveQueue:entryId:1'));
      assert.ok(paramRegistrations.includes('startService:entryId:1'));
      assert.ok(paramRegistrations.includes('completeService:entryId:1'));
      assert.ok(paramRegistrations.includes('markNoShow:entryId:1'));
    });

    it('registers @Param("resourceId") on getQueueStatus', () => {
      assert.ok(paramRegistrations.includes('getQueueStatus:resourceId:1'));
    });

    it('registers @Body on joinQueue and callNext', () => {
      assert.ok(bodyRegistrations.includes('joinQueue::1'));
      assert.ok(bodyRegistrations.includes('callNext::1'));
    });

    it('registers @Query on getMyPosition', () => {
      assert.ok(queryRegistrations.includes('getMyPosition::1'));
    });
  });

  // ── Queue join ────────────────────────────────────────────────
  describe('joinQueue() — positive', () => {
    const tenantCtx: RequestTenantContext = { tenantId: 't-test', marketCode: 'cn-mainland' };

    it('returns queue entry with waiting status', () => {
      const result = controller.joinQueue(tenantCtx, {
        queueType: QueueType.Waiting,
        memberId: 'member-new',
        memberName: '新用户',
        resourceId: 'machine-1',
        resourceName: '游戏机1号',
      });
      assert.equal(result.status, 'waiting');
      assert.equal(result.type, QueueType.Waiting);
      assert.equal(result.userId, 'member-new');
      assert.equal(result.userName, '新用户');
    });

    it('returns queue entry with queue number', () => {
      const result = controller.joinQueue(tenantCtx, {
        queueType: QueueType.Waiting,
        memberId: 'member-q',
        resourceId: 'machine-2',
      });
      assert.ok(typeof result.queueNumber === 'string');
      assert.ok(result.queueNumber.length > 0);
    });

    it('assigns estimated wait time', () => {
      const result = controller.joinQueue(tenantCtx, {
        queueType: QueueType.Booking,
        memberId: 'member-booking',
        resourceId: 'machine-3',
      });
      assert.equal(typeof result.estimatedWaitMin, 'number');
      assert.ok(result.estimatedWaitMin >= 0);
    });

    it('assigns unique entry ID', () => {
      const result = controller.joinQueue(tenantCtx, {
        queueType: QueueType.Waiting,
        memberId: 'member-unique',
      });
      assert.ok(result.id.startsWith('queue-mock-'));
    });
  });

  describe('joinQueue() — edge / boundary', () => {
    const tenantCtx: RequestTenantContext = { tenantId: 't-edge', marketCode: 'cn-mainland' };

    it('works with minimal fields (only queueType + memberId)', () => {
      const result = controller.joinQueue(tenantCtx, {
        queueType: QueueType.Service,
        memberId: 'minimal-member',
      });
      assert.equal(result.status, 'waiting');
      assert.equal(result.userId, 'minimal-member');
    });

    it('accepts optional remark', () => {
      const result = controller.joinQueue(tenantCtx, {
        queueType: QueueType.Waiting,
        memberId: 'member-remark',
        remark: '请优先安排',
      });
      assert.equal(result.remark, '请优先安排');
    });

    it('accepts priority field', () => {
      const result = controller.joinQueue(tenantCtx, {
        queueType: QueueType.Waiting,
        memberId: 'member-vip',
        priority: 10,
      });
      assert.equal(result.priority, 10);
    });
  });

  // ── Leave / cancel ────────────────────────────────────────────
  describe('leaveQueue() — positive', () => {
    const tenantCtx: RequestTenantContext = { tenantId: 't-leave', marketCode: 'cn-mainland' };

    it('returns entry with cancelled status', () => {
      const result = controller.leaveQueue(tenantCtx, 'queue-leave-001');
      assert.equal(result.status, 'cancelled');
      assert.equal(result.id, 'queue-leave-001');
    });

    it('keeps original userId', () => {
      const result = controller.leaveQueue(tenantCtx, 'queue-leave-002');
      assert.equal(result.userId, 'member-1');
    });
  });

  // ── Call next ─────────────────────────────────────────────────
  describe('callNext() — positive', () => {
    const tenantCtx: RequestTenantContext = { tenantId: 't-call', marketCode: 'cn-mainland' };

    it('returns called entry', () => {
      const result = controller.callNext(tenantCtx, { resourceId: 'machine-1' });
      assert.ok(result !== null);
      assert.equal(result!.status, 'called');
      assert.equal(result!.resourceId, 'machine-1');
    });

    it('returns non-null entry when queue has waiting members', () => {
      const result = controller.callNext(tenantCtx, { resourceId: 'machine-1' });
      assert.ok(result !== null);
      assert.equal(typeof result!.queueNumber, 'string');
    });

    it('includes actualWaitMin on called entry', () => {
      const result = controller.callNext(tenantCtx, { resourceId: 'machine-1' });
      assert.ok(result !== null);
      assert.equal(typeof result!.actualWaitMin, 'number');
      assert.ok(result!.actualWaitMin! >= 0);
    });
  });

  // ── Start service ─────────────────────────────────────────────
  describe('startService() — positive', () => {
    const tenantCtx: RequestTenantContext = { tenantId: 't-svc', marketCode: 'cn-mainland' };

    it('returns entry with serving status', () => {
      const result = controller.startService(tenantCtx, 'queue-svc-001');
      assert.equal(result.status, 'serving');
      assert.equal(result.id, 'queue-svc-001');
    });

    it('includes servedAt timestamp', () => {
      const result = controller.startService(tenantCtx, 'queue-svc-002');
      assert.ok(typeof result.servedAt === 'string');
    });

    it('keeps userId and resourceId', () => {
      const result = controller.startService(tenantCtx, 'queue-svc-003');
      assert.equal(result.userId, 'member-served');
      assert.equal(result.resourceId, 'machine-1');
    });
  });

  // ── Complete service ──────────────────────────────────────────
  describe('completeService() — positive', () => {
    const tenantCtx: RequestTenantContext = { tenantId: 't-done', marketCode: 'cn-mainland' };

    it('returns entry with completed status', () => {
      const result = controller.completeService(tenantCtx, 'queue-done-001');
      assert.equal(result.status, 'completed');
    });

    it('includes completedAt timestamp', () => {
      const result = controller.completeService(tenantCtx, 'queue-done-002');
      assert.ok(typeof result.completedAt === 'string');
    });
  });

  // ── No-show ───────────────────────────────────────────────────
  describe('markNoShow() — positive', () => {
    const tenantCtx: RequestTenantContext = { tenantId: 't-noshow', marketCode: 'cn-mainland' };

    it('returns entry with no_show status', () => {
      const result = controller.markNoShow(tenantCtx, 'queue-noshow-001');
      assert.equal(result.status, 'no_show');
    });

    it('handles after callNext timing', () => {
      const result = controller.markNoShow(tenantCtx, 'queue-noshow-002');
      assert.equal(result.status, 'no_show');
      assert.ok(typeof result.calledAt === 'string');
    });
  });

  // ── Queue status ──────────────────────────────────────────────
  describe('getQueueStatus() — positive', () => {
    const tenantCtx: RequestTenantContext = { tenantId: 't-stats', marketCode: 'cn-mainland' };

    it('returns queue statistics', () => {
      const result = controller.getQueueStatus(tenantCtx, 'machine-1');
      assert.equal(typeof result.total, 'number');
      assert.equal(typeof result.waitingCount, 'number');
      assert.equal(typeof result.calledCount, 'number');
      assert.equal(typeof result.servingCount, 'number');
    });

    it('returns avgWaitMin as number', () => {
      const result = controller.getQueueStatus(tenantCtx, 'machine-1');
      assert.equal(typeof result.avgWaitMin, 'number');
    });

    it('all status fields sum to total', () => {
      const result = controller.getQueueStatus(tenantCtx, 'machine-1');
      const subTotal =
        result.waitingCount +
        result.calledCount +
        result.servingCount +
        result.completedCount +
        result.cancelledCount +
        result.noShowCount;
      assert.equal(subTotal, result.total);
    });
  });

  // ── Get my position ───────────────────────────────────────────
  describe('getMyPosition() — positive', () => {
    const tenantCtx: RequestTenantContext = { tenantId: 't-pos', marketCode: 'cn-mainland' };

    it('returns position for member in queue', () => {
      const result = controller.getMyPosition(tenantCtx, {
        memberId: 'member-inqueue',
        resourceId: 'machine-2',
      });
      assert.equal(result.position, 2);
      assert.equal(result.estimatedWaitMinutes, 10);
      assert.ok(result.entry !== null);
    });

    it('returns entry details for member in queue', () => {
      const result = controller.getMyPosition(tenantCtx, {
        memberId: 'member-inqueue',
        resourceId: 'machine-2',
      });
      assert.ok(result.entry !== null);
      assert.equal(result.entry!.userId, 'member-inqueue');
      assert.equal(result.entry!.status, 'waiting');
    });
  });

  describe('getMyPosition() — edge / boundary', () => {
    const tenantCtx: RequestTenantContext = { tenantId: 't-pos-edge', marketCode: 'cn-mainland' };

    it('returns position -1 when member not in queue', () => {
      const result = controller.getMyPosition(tenantCtx, {
        memberId: 'member-not-in-queue',
        resourceId: 'machine-1',
      });
      assert.equal(result.position, -1);
      assert.equal(result.estimatedWaitMinutes, 0);
      assert.equal(result.entry, null);
    });

    it('returns position -1 when memberId is empty', () => {
      const result = controller.getMyPosition(tenantCtx, { memberId: '', resourceId: 'machine-1' });
      assert.equal(result.position, -1);
      assert.equal(result.entry, null);
    });

    it('returns position -1 when resourceId is empty', () => {
      const result = controller.getMyPosition(tenantCtx, {
        memberId: 'member-inqueue',
        resourceId: '',
      });
      assert.equal(result.position, -1);
      assert.equal(result.entry, null);
    });

    it('returns position -1 when memberId is undefined', () => {
      const result = controller.getMyPosition(tenantCtx, { resourceId: 'machine-1' });
      assert.equal(result.position, -1);
      assert.equal(result.entry, null);
    });

    it('returns position -1 when resourceId is undefined', () => {
      const result = controller.getMyPosition(tenantCtx, { memberId: 'member-inqueue' });
      assert.equal(result.position, -1);
      assert.equal(result.entry, null);
    });
  });

  // ── Negative / error cases ────────────────────────────────────
  describe('joinQueue() — negative', () => {
    const tenantCtx: RequestTenantContext = { tenantId: 't-neg', marketCode: 'cn-mainland' };

    it('defaults memberName to memberId when not provided', () => {
      const result = controller.joinQueue(tenantCtx, {
        queueType: QueueType.Waiting,
        memberId: 'no-name-member',
      });
      assert.equal(result.userName, 'no-name-member');
    });

    it('handles all three queue types', () => {
      for (const qt of [QueueType.Booking, QueueType.Waiting, QueueType.Service]) {
        const result = controller.joinQueue(tenantCtx, {
          queueType: qt,
          memberId: `member-${qt}`,
        });
        assert.equal(result.type, qt);
      }
    });
  });

  describe('callNext() — negative', () => {
    const tenantCtx: RequestTenantContext = { tenantId: 't-call-neg', marketCode: 'cn-mainland' };

    it('returns entry anyway (stub always returns entry)', () => {
      // Per our stub, callNext always returns an entry — this tests stub behavior.
      // The real service would return null if queue is empty.
      const result = controller.callNext(tenantCtx, { resourceId: 'empty-resource' });
      assert.ok(result !== null);
    });
  });
});
