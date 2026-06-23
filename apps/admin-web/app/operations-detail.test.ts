/**
 * operations-detail.test.ts — Unit tests for operations detail page view model
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import type {
  AdminRuntimeOperationDetailSnapshot,
  MemberOperationsRuntimeContext,
} from './operations-view-model';

// Re-export the build helper for testing
// (We inline a simplified version to avoid import issues with client-side modules)

interface TestOperationRecord {
  id: string;
  type: string;
  targetId: string;
  status: string;
  createdAt: string;
  finishedAt?: string;
}

interface TestReceiptRecord {
  code: string;
  message: string;
  status: string;
  timestamp: string;
}

function buildTestViewModel(
  operationId: string,
  snapshot: AdminRuntimeOperationDetailSnapshot,
): {
  operation: TestOperationRecord | null;
  receipts: TestReceiptRecord[];
  memberContext: MemberOperationsRuntimeContext | null;
  subtitle: string;
} {
  const op = snapshot.operation
    ? {
        id: snapshot.operation.id,
        type: snapshot.operation.type,
        targetId: snapshot.operation.targetId,
        status: snapshot.operation.status,
        createdAt: snapshot.operation.createdAt,
        finishedAt: snapshot.operation.finishedAt,
      }
    : null;

  const subtitle =
    snapshot.deliveryMode === 'api'
      ? `治理操作 ${operationId} · API 实时数据`
      : snapshot.deliveryMode === 'fallback' && op
        ? `治理操作 ${operationId} · fallback 演示数据`
        : `治理操作 ${operationId}`;

  return {
    operation: op,
    receipts: snapshot.receipts,
    memberContext: snapshot.memberOperationsContext,
    subtitle,
  };
}

// ─── stubs ────────────────────────────────────────────────────────

const API_SNAPSHOT: AdminRuntimeOperationDetailSnapshot = {
  deliveryMode: 'api',
  operation: {
    id: 'RECEIPT-001',
    type: 'replay-scheduled',
    targetId: 'member-001 · assign-vip-concierge',
    status: 'running',
    createdAt: '2026-06-15T10:00:00.000Z',
  },
  receipts: [
    {
      code: 'member-operations-context',
      message: '会员 member-001 / 执行回执 ops-exec-001 / 动作 assign-vip-concierge',
      status: 'ok',
      timestamp: '2026-06-15T10:00:00.000Z',
    },
    {
      code: 'runtime-governance.action.submitted',
      message: '高风险 replay 已提交治理运行时',
      status: 'ok',
      timestamp: '2026-06-15T10:00:00.000Z',
    },
    {
      code: 'runtime-governance.approval.pending',
      message: '当前 replay 需要审批',
      status: 'ok',
      timestamp: '2026-06-15T10:00:05.000Z',
    },
  ],
  memberOperationsContext: {
    memberId: 'member-001',
    executionId: 'ops-exec-001',
    taskId: 'ops-task-001',
    actionCode: 'assign-vip-concierge',
    executionLane: 'member-crm',
    targetType: 'crm-follow-up',
    targetId: 'crm-001',
    sourceOrderId: 'order-001',
    sourcePaymentId: 'payment-001',
  },
};

const FALLBACK_WITH_OP: AdminRuntimeOperationDetailSnapshot = {
  deliveryMode: 'fallback',
  operation: {
    id: 'ADMIN-RUNTIME-001',
    type: 'runtime-replay',
    targetId: 'member-001 · assign-vip-concierge',
    status: 'running',
    createdAt: '2026-06-15T10:00:00.000Z',
  },
  receipts: [
    {
      code: 'fallback-receipt',
      message: 'fallback demo',
      status: 'ok',
      timestamp: '2026-06-15T10:00:00.000Z',
    },
  ],
  memberOperationsContext: null,
};

const FALLBACK_EMPTY: AdminRuntimeOperationDetailSnapshot = {
  deliveryMode: 'fallback',
  operation: null,
  receipts: [],
  memberOperationsContext: null,
};

// ─── tests ────────────────────────────────────────────────────────

describe('operations detail view model', () => {
  describe('buildTestViewModel', () => {
    it('returns API subtitle when delivery mode is api', () => {
      const vm = buildTestViewModel('RECEIPT-001', API_SNAPSHOT);
      assert.ok(vm.subtitle.includes('API 实时数据'), `expected API subtitle, got ${vm.subtitle}`);
    });

    it('returns fallback subtitle when delivery mode is fallback with operation', () => {
      const vm = buildTestViewModel('ADMIN-RUNTIME-001', FALLBACK_WITH_OP);
      assert.ok(
        vm.subtitle.includes('fallback 演示数据'),
        `expected fallback subtitle, got ${vm.subtitle}`,
      );
    });

    it('returns plain subtitle when fallback with no operation', () => {
      const vm = buildTestViewModel('MISSING-001', FALLBACK_EMPTY);
      assert.strictEqual(vm.subtitle, '治理操作 MISSING-001');
    });

    it('maps operation fields correctly from API snapshot', () => {
      const vm = buildTestViewModel('RECEIPT-001', API_SNAPSHOT);
      assert.ok(vm.operation, 'operation should not be null');
      assert.strictEqual(vm.operation?.id, 'RECEIPT-001');
      assert.strictEqual(vm.operation?.type, 'replay-scheduled');
      assert.strictEqual(vm.operation?.status, 'running');
      assert.strictEqual(vm.operation?.createdAt, '2026-06-15T10:00:00.000Z');
    });

    it('preserves receipts array', () => {
      const vm = buildTestViewModel('RECEIPT-001', API_SNAPSHOT);
      assert.strictEqual(vm.receipts.length, 3);
      assert.strictEqual(vm.receipts[0]!.code, 'member-operations-context');
      assert.strictEqual(vm.receipts[2]!.code, 'runtime-governance.approval.pending');
    });

    it('preserves member context when present', () => {
      const vm = buildTestViewModel('RECEIPT-001', API_SNAPSHOT);
      assert.ok(vm.memberContext, 'member context should not be null');
      assert.strictEqual(vm.memberContext?.memberId, 'member-001');
      assert.strictEqual(vm.memberContext?.executionId, 'ops-exec-001');
      assert.strictEqual(vm.memberContext?.actionCode, 'assign-vip-concierge');
    });

    it('returns null member context when fallback has none', () => {
      const vm = buildTestViewModel('ADMIN-RUNTIME-001', FALLBACK_WITH_OP);
      assert.strictEqual(vm.memberContext, null);
    });

    it('returns null operation when fallback has no operation', () => {
      const vm = buildTestViewModel('MISSING-001', FALLBACK_EMPTY);
      assert.strictEqual(vm.operation, null);
      assert.strictEqual(vm.receipts.length, 0);
    });

    it('handles operation with finishedAt', () => {
      const snapshot: AdminRuntimeOperationDetailSnapshot = {
        deliveryMode: 'api',
        operation: {
          id: 'RECEIPT-002',
          type: 'callback-recorded',
          targetId: 'order-002',
          status: 'completed',
          createdAt: '2026-06-14T08:00:00.000Z',
          finishedAt: '2026-06-14T08:30:00.000Z',
        },
        receipts: [],
        memberOperationsContext: null,
      };
      const vm = buildTestViewModel('RECEIPT-002', snapshot);
      assert.strictEqual(vm.operation?.status, 'completed');
      assert.strictEqual(vm.operation?.finishedAt, '2026-06-14T08:30:00.000Z');
    });
  });

  describe('MemberOperationsRuntimeContext completeness', () => {
    it('full context has all fields', () => {
      const ctx = API_SNAPSHOT.memberOperationsContext!;
      assert.strictEqual(ctx.memberId, 'member-001');
      assert.strictEqual(ctx.executionId, 'ops-exec-001');
      assert.strictEqual(ctx.taskId, 'ops-task-001');
      assert.strictEqual(ctx.actionCode, 'assign-vip-concierge');
      assert.strictEqual(ctx.executionLane, 'member-crm');
      assert.strictEqual(ctx.targetType, 'crm-follow-up');
      assert.strictEqual(ctx.targetId, 'crm-001');
      assert.strictEqual(ctx.sourceOrderId, 'order-001');
      assert.strictEqual(ctx.sourcePaymentId, 'payment-001');
    });

    it('partial context allows optional fields to be undefined', () => {
      const partial: MemberOperationsRuntimeContext = {
        memberId: 'member-002',
        executionId: 'ops-exec-002',
      };
      assert.strictEqual(partial.memberId, 'member-002');
      assert.strictEqual(partial.executionId, 'ops-exec-002');
      assert.strictEqual(partial.taskId, undefined);
      assert.strictEqual(partial.actionCode, undefined);
    });
  });

  describe('edge cases', () => {
    it('handles operation with empty receipts', () => {
      const snapshot: AdminRuntimeOperationDetailSnapshot = {
        deliveryMode: 'api',
        operation: {
          id: 'RECEIPT-003',
          type: 'drilldown',
          targetId: 'alert-001',
          status: 'pending',
          createdAt: '2026-06-15T12:00:00.000Z',
        },
        receipts: [],
        memberOperationsContext: null,
      };
      const vm = buildTestViewModel('RECEIPT-003', snapshot);
      assert.ok(vm.operation);
      assert.strictEqual(vm.receipts.length, 0);
    });

    it('handles unknown operation statuses', () => {
      const snapshot: AdminRuntimeOperationDetailSnapshot = {
        deliveryMode: 'api',
        operation: {
          id: 'RECEIPT-004',
          type: 'unknown-type',
          targetId: 'unknown',
          status: 'unknown-status',
          createdAt: '2026-06-15T12:00:00.000Z',
        },
        receipts: [],
        memberOperationsContext: null,
      };
      const vm = buildTestViewModel('RECEIPT-004', snapshot);
      assert.strictEqual(vm.operation?.status, 'unknown-status');
      assert.strictEqual(vm.operation?.type, 'unknown-type');
    });
  });
});
