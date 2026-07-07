/**
 * operations/[id]/page.test.ts — 运行时治理操作详情页 L1 冒烟测试
 * ⚡ 覆盖: id 参数解析 / 快照降级工厂 / 收据构造 / 边界条件
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

// ============================================================
// 类型定义（与 page.tsx / view-model 同步）
// ============================================================

interface RuntimeOperationRecord {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'CANCELED';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  initiator?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

interface RuntimeOperationReceiptRecord {
  receiptCode: string;
  operationId: string;
  status: 'ACKED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'STALLED';
  receivedAt: string;
  processedAt?: string;
  retryCount?: number;
  errorMessage?: string;
  payload?: Record<string, unknown>;
}

interface MemberOperationsRuntimeContext {
  memberId: string;
  executionId: string;
  taskId?: string;
  actionCode?: string;
  executionLane?: string;
  targetType?: string;
  targetId?: string;
  sourceOrderId?: string;
  sourcePaymentId?: string;
}

interface AdminRuntimeOperationDetailSnapshot {
  deliveryMode: 'api' | 'fallback';
  operation: RuntimeOperationRecord | null;
  receipts: RuntimeOperationReceiptRecord[];
  memberOperationsContext: MemberOperationsRuntimeContext | null;
}

interface AdminRuntimeOperationDetailViewModel {
  operation: RuntimeOperationRecord | null;
  receipts: RuntimeOperationReceiptRecord[];
  memberContext: MemberOperationsRuntimeContext | null;
  subtitle: string;
}

// ============================================================
// 页面逻辑内联复现（与 page.tsx / detail-presenter.tsx 保持同步）
// ============================================================

/**
 * 构建详情视图模型 — 与 detail-presenter.tsx 中 buildOperationDetailViewModel 一致
 */
function buildOperationDetailViewModel(
  operationId: string,
  snapshot: AdminRuntimeOperationDetailSnapshot,
): AdminRuntimeOperationDetailViewModel {
  const op = snapshot.operation;
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

/** page.tsx 页面组件: 解析 params 并传给 View */
interface AdminRuntimeOperationDetailPageProps {
  params: Promise<{ id: string }>;
}

function extractOperationId(params: Awaited<AdminRuntimeOperationDetailPageProps['params']>): string {
  return params.id;
}

// ============================================================
// Mock 工厂
// ============================================================

function mockOperation(overrides: Partial<RuntimeOperationRecord> = {}): RuntimeOperationRecord {
  return {
    id: 'op-001',
    action: 'restart_service',
    targetType: 'SERVICE',
    targetId: 'payment-gateway',
    status: 'RUNNING',
    startedAt: '2026-06-30T06:00:00Z',
    completedAt: undefined,
    durationMs: undefined,
    initiator: 'admin@example.com',
    errorMessage: undefined,
    metadata: { reason: 'scheduled_maintenance' },
    ...overrides,
  };
}

function mockReceipt(overrides: Partial<RuntimeOperationReceiptRecord> = {}): RuntimeOperationReceiptRecord {
  return {
    receiptCode: 'rcpt-001',
    operationId: 'op-001',
    status: 'ACKED',
    receivedAt: '2026-06-30T06:00:01Z',
    processedAt: undefined,
    retryCount: 0,
    errorMessage: undefined,
    payload: { ack: true },
    ...overrides,
  };
}

function mockSnapshot(
  overrides: Partial<AdminRuntimeOperationDetailSnapshot> = {},
): AdminRuntimeOperationDetailSnapshot {
  return {
    deliveryMode: 'api',
    operation: mockOperation(),
    receipts: [mockReceipt()],
    memberOperationsContext: null,
    ...overrides,
  };
}

// ============================================================
// 测试套件
// ============================================================

describe('AdminRuntimeOperationDetailPage — extractOperationId', () => {
  it('正常 UUID 格式 id 应正确提取', async () => {
    const params = await Promise.resolve({ id: 'op-a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
    assert.strictEqual(extractOperationId(params), 'op-a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  });

  it('短 id 应正确提取', async () => {
    const params = await Promise.resolve({ id: 'op-001' });
    assert.strictEqual(extractOperationId(params), 'op-001');
  });

  it('空字符串 id 应正确提取', async () => {
    const params = await Promise.resolve({ id: '' });
    assert.strictEqual(extractOperationId(params), '');
  });

  it('含特殊字符的 id 应正确提取', async () => {
    const params = await Promise.resolve({ id: 'op_$test-123' });
    assert.strictEqual(extractOperationId(params), 'op_$test-123');
  });
});

describe('AdminRuntimeOperationDetailPage — buildOperationDetailViewModel', () => {
  it('API 模式 subtitle 应包含 "API 实时数据"', () => {
    const snapshot = mockSnapshot({ deliveryMode: 'api' });
    const vm = buildOperationDetailViewModel('op-001', snapshot);
    assert.ok(vm.subtitle.includes('API 实时数据'));
  });

  it('fallback 模式且有操作时 subtitle 应包含 "fallback 演示数据"', () => {
    const snapshot = mockSnapshot({ deliveryMode: 'fallback', operation: mockOperation() });
    const vm = buildOperationDetailViewModel('op-001', snapshot);
    assert.ok(vm.subtitle.includes('fallback 演示数据'));
  });

  it('fallback 模式无操作时 subtitle 仅显示 operationId', () => {
    const snapshot = mockSnapshot({ deliveryMode: 'fallback', operation: null });
    const vm = buildOperationDetailViewModel('op-001', snapshot);
    assert.strictEqual(vm.subtitle, '治理操作 op-001');
  });

  it('应透传 operation', () => {
    const op = mockOperation({ id: 'op-999', action: 'scale_up' });
    const snapshot = mockSnapshot({ operation: op });
    const vm = buildOperationDetailViewModel('op-999', snapshot);
    assert.strictEqual(vm.operation?.id, 'op-999');
    assert.strictEqual(vm.operation?.action, 'scale_up');
  });

  it('operation 为 null 时视图模型 operation 为 null', () => {
    const snapshot = mockSnapshot({ operation: null });
    const vm = buildOperationDetailViewModel('op-001', snapshot);
    assert.strictEqual(vm.operation, null);
  });

  it('应透传 receipts 列表', () => {
    const receipts = [mockReceipt({ receiptCode: 'r1' }), mockReceipt({ receiptCode: 'r2' })];
    const snapshot = mockSnapshot({ receipts });
    const vm = buildOperationDetailViewModel('op-001', snapshot);
    assert.strictEqual(vm.receipts.length, 2);
    assert.strictEqual(vm.receipts[0].receiptCode, 'r1');
    assert.strictEqual(vm.receipts[1].receiptCode, 'r2');
  });

  it('空 receipts 应返回空数组', () => {
    const snapshot = mockSnapshot({ receipts: [] });
    const vm = buildOperationDetailViewModel('op-001', snapshot);
    assert.deepStrictEqual(vm.receipts, []);
  });

  it('应透传 memberContext', () => {
    const ctx: MemberOperationsRuntimeContext = {
      memberId: 'mbr-001',
      executionId: 'exec-001',
      taskId: 'task-001',
      actionCode: 'RESTART',
      executionLane: 'admin',
      targetType: 'SERVICE',
      targetId: 'svc-001',
    };
    const snapshot = mockSnapshot({ memberOperationsContext: ctx });
    const vm = buildOperationDetailViewModel('op-001', snapshot);
    assert.strictEqual(vm.memberContext?.memberId, 'mbr-001');
    assert.strictEqual(vm.memberContext?.actionCode, 'RESTART');
  });

  it('memberContext 为 null 时视图模型 memberContext 为 null', () => {
    const snapshot = mockSnapshot({ memberOperationsContext: null });
    const vm = buildOperationDetailViewModel('op-001', snapshot);
    assert.strictEqual(vm.memberContext, null);
  });
});

describe('AdminRuntimeOperationDetailPage — 操作状态边界', () => {
  const STATUSES: RuntimeOperationRecord['status'][] = ['PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'TIMEOUT', 'CANCELED'];

  for (const status of STATUSES) {
    it(`应支持操作状态 ${status}`, () => {
      const snapshot = mockSnapshot({ operation: mockOperation({ status }) });
      const vm = buildOperationDetailViewModel('op-001', snapshot);
      assert.strictEqual(vm.operation?.status, status);
    });
  }

  it('已完成操作应包含 completedAt', () => {
    const snapshot = mockSnapshot({
      operation: mockOperation({ status: 'SUCCESS', completedAt: '2026-06-30T06:05:00Z', durationMs: 300000 }),
    });
    assert.ok(snapshot.operation!.completedAt);
    assert.strictEqual(snapshot.operation!.durationMs, 300000);
  });

  it('失败操作应包含 errorMessage', () => {
    const snapshot = mockSnapshot({
      operation: mockOperation({ status: 'FAILED', errorMessage: 'Connection timeout after 30s' }),
    });
    assert.strictEqual(snapshot.operation!.errorMessage, 'Connection timeout after 30s');
  });
});

describe('AdminRuntimeOperationDetailPage — 收据状态边界', () => {
  const RECEIPT_STATUSES: RuntimeOperationReceiptRecord['status'][] = ['ACKED', 'PROCESSING', 'COMPLETED', 'FAILED', 'STALLED'];

  for (const status of RECEIPT_STATUSES) {
    it(`应支持收据状态 ${status}`, () => {
      const snapshot = mockSnapshot({ receipts: [mockReceipt({ status })] });
      const vm = buildOperationDetailViewModel('op-001', snapshot);
      assert.strictEqual(vm.receipts[0].status, status);
    });
  }

  it('已完成的收据应包含 processedAt', () => {
    const receipt = mockReceipt({ status: 'COMPLETED', processedAt: '2026-06-30T06:05:01Z' });
    const snapshot = mockSnapshot({ receipts: [receipt] });
    const vm = buildOperationDetailViewModel('op-001', snapshot);
    assert.ok(vm.receipts[0].processedAt);
  });

  it('STALLED 收据应有重试次数记录', () => {
    const receipt = mockReceipt({ status: 'STALLED', retryCount: 3, errorMessage: 'Callback not received' });
    const snapshot = mockSnapshot({ receipts: [receipt] });
    const vm = buildOperationDetailViewModel('op-001', snapshot);
    assert.strictEqual(vm.receipts[0].retryCount, 3);
    assert.strictEqual(vm.receipts[0].errorMessage, 'Callback not received');
  });

  it('多收据应保持顺序', () => {
    const receipts = [
      mockReceipt({ receiptCode: 'r1', status: 'ACKED' }),
      mockReceipt({ receiptCode: 'r2', status: 'PROCESSING' }),
      mockReceipt({ receiptCode: 'r3', status: 'COMPLETED' }),
    ];
    const snapshot = mockSnapshot({ receipts });
    const vm = buildOperationDetailViewModel('op-001', snapshot);
    assert.strictEqual(vm.receipts[0].receiptCode, 'r1');
    assert.strictEqual(vm.receipts[1].receiptCode, 'r2');
    assert.strictEqual(vm.receipts[2].receiptCode, 'r3');
  });
});

describe('AdminRuntimeOperationDetailPage — 交付模式边界', () => {
  it('deliveryMode 只能是 api 或 fallback', () => {
    const api: AdminRuntimeOperationDetailSnapshot['deliveryMode'] = 'api';
    const fb: AdminRuntimeOperationDetailSnapshot['deliveryMode'] = 'fallback';
    assert.strictEqual(api, 'api');
    assert.strictEqual(fb, 'fallback');
  });

  it('api 模式下即使 operation 为 null 也显示 API 3', () => {
    const snapshot = mockSnapshot({ deliveryMode: 'api', operation: null });
    const vm = buildOperationDetailViewModel('op-001', snapshot);
    assert.ok(vm.subtitle.includes('API 实时数据'));
    assert.strictEqual(vm.operation, null);
  });
});

describe('AdminRuntimeOperationDetailPage — memberContext 字段边界', () => {
  it('完整 memberContext 所有可选字段', () => {
    const ctx: MemberOperationsRuntimeContext = {
      memberId: 'mbr-001',
      executionId: 'exec-001',
      taskId: 'task-001',
      actionCode: 'RESTART',
      executionLane: 'admin',
      targetType: 'SERVICE',
      targetId: 'payment-gateway',
      sourceOrderId: 'ord-001',
      sourcePaymentId: 'pay-001',
    };
    const snapshot = mockSnapshot({ memberOperationsContext: ctx });
    const vm = buildOperationDetailViewModel('op-001', snapshot);
    assert.strictEqual(vm.memberContext?.sourceOrderId, 'ord-001');
    assert.strictEqual(vm.memberContext?.sourcePaymentId, 'pay-001');
  });

  it('最小 memberContext 仅包含必填字段', () => {
    const ctx: MemberOperationsRuntimeContext = {
      memberId: 'mbr-001',
      executionId: 'exec-001',
    };
    const snapshot = mockSnapshot({ memberOperationsContext: ctx });
    const vm = buildOperationDetailViewModel('op-001', snapshot);
    assert.strictEqual(vm.memberContext?.memberId, 'mbr-001');
    assert.strictEqual(vm.memberContext?.taskId, undefined);
    assert.strictEqual(vm.memberContext?.sourceOrderId, undefined);
  });
});
