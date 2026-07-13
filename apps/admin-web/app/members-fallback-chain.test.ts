import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getMemberOperationsRuntimeApprovalSummary,
  loadAdminMemberOperationReceiptDetail,
  loadAdminMemberOperationSourceDetail,
  loadMemberOperationsRuntimeReceipt,
  replayMemberOperationsRuntimeReceipt,
  replayMemberOperationsRuntimeReceipts,
} from './members-view-model';

// ---- 正例 ----

test('members fallback chain: detail hydrates member-001 receipt and runtime approval context', async () => {
  globalThis.fetch = (async () => {
    throw new Error('network unavailable');
  }) as typeof fetch;

  const snapshot = await loadAdminMemberOperationReceiptDetail('member-001', 'ops-exec-001');
  const approval = snapshot.runtimeReceipt
    ? getMemberOperationsRuntimeApprovalSummary(snapshot.runtimeReceipt)
    : null;

  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.member?.id, 'm001');
  assert.equal(snapshot.member?.name, '张伟');
  assert.equal(snapshot.task?.taskId, 'ops-task-001');
  assert.equal(snapshot.receipt?.executionId, 'ops-exec-001');
  assert.equal(snapshot.receipt?.runtimeReceiptCode, 'ADMIN-RUNTIME-001');
  assert.equal(snapshot.runtimeReceipt?.receiptCode, 'ADMIN-RUNTIME-001');
  assert.equal(snapshot.runtimeReceipt?.callback.callbackStatus, 'awaiting-callback');
  assert.equal(approval?.status, 'PENDING');
  assert.equal(approval?.ticket, 'APR-RTREPL-001');
});

test('members fallback chain: source workspace exposes pending approval and replay guidance', async () => {
  globalThis.fetch = (async () => {
    throw new Error('network unavailable');
  }) as typeof fetch;

  const snapshot = await loadAdminMemberOperationSourceDetail('member-001', 'order', 'order-001');

  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.member?.id, 'm001');
  assert.equal(snapshot.tasks.length, 1);
  assert.equal(snapshot.receipts.length, 1);
  assert.equal(snapshot.pendingApprovalItems.length, 1);
  assert.equal(snapshot.pendingApprovalItems[0]?.ticket, 'APR-RTREPL-001');
  assert.equal(snapshot.pendingApprovalItems[0]?.runtimeReceiptCode, 'ADMIN-RUNTIME-001');
  assert.equal(snapshot.timelineSummary.categoryCounts.approval, 1);
  assert.equal(snapshot.chainSummary.pendingApprovals, 1);
  assert.equal(snapshot.chainSummary.replayableReceipts, 1);
  assert.equal(snapshot.bottleneckStage?.id, 'approval');
  assert.equal(snapshot.bottleneckStage?.href, '/approvals?status=PENDING');
  assert.equal(snapshot.recommendedActions[0]?.code, 'batch-approve');
  assert.equal(snapshot.recommendedActions[1]?.code, 'batch-replay');
});

test('members fallback chain: compact member id resolves to canonical fallback runtime receipt', async () => {
  globalThis.fetch = (async () => {
    throw new Error('network unavailable');
  }) as typeof fetch;

  const runtimeReceipt = await loadMemberOperationsRuntimeReceipt('m001', 'ops-exec-001');
  const replayReceipt = await replayMemberOperationsRuntimeReceipt('m001', 'ops-exec-001');

  assert.equal(runtimeReceipt?.receiptCode, 'ADMIN-RUNTIME-001');
  assert.equal(runtimeReceipt?.approval?.ticket, 'APR-RTREPL-001');
  assert.equal(replayReceipt?.receiptCode, 'ADMIN-RUNTIME-001');
  assert.equal(replayReceipt?.approval?.status, 'PENDING');
});

// ---- 反例 ----

test('members fallback chain: throwing fetch returns null for unknown receipt', async () => {
  globalThis.fetch = (async () => {
    throw new Error('network unavailable');
  }) as typeof fetch;

  const runtimeReceipt = await loadMemberOperationsRuntimeReceipt('unknown-member', 'unknown-exec');
  assert.equal(runtimeReceipt, null);
});

test('members fallback chain: getApprovalSummary returns null for missing approval', async () => {
  const approval = getMemberOperationsRuntimeApprovalSummary({} as any);
  assert.equal(approval, null);
});

test('members fallback chain: getApprovalSummary returns null for receipt without approval field', () => {
  const receipt = { receiptCode: 'NO-APR-001', callback: { callbackStatus: 'no-callback' } } as any;
  const approval = getMemberOperationsRuntimeApprovalSummary(receipt);
  assert.equal(approval, null);
});

// ---- 边界 ----

test('members fallback chain: batch replay empty list returns empty results', async () => {
  globalThis.fetch = (async () => {
    throw new Error('network unavailable');
  }) as typeof fetch;

  const results = await replayMemberOperationsRuntimeReceipts('m001', []);
  assert.equal(results.length, 0);
});

test('members fallback chain: batch replay handles single item', async () => {
  globalThis.fetch = (async () => {
    throw new Error('network unavailable');
  }) as typeof fetch;

  const results = await replayMemberOperationsRuntimeReceipts('m001', ['ops-exec-001']);
  assert.equal(results.length, 1);
  assert.equal(results[0]?.executionId, 'ops-exec-001');
  assert.equal(results[0]?.receipt?.receiptCode, 'ADMIN-RUNTIME-001');
});

test('members fallback chain: batch replay handles multiple items', async () => {
  globalThis.fetch = (async () => {
    throw new Error('network unavailable');
  }) as typeof fetch;

  const results = await replayMemberOperationsRuntimeReceipts('m001', ['ops-exec-001', 'ops-exec-002']);
  assert.equal(results.length, 2);
  assert.equal(results[0]?.executionId, 'ops-exec-001');
  assert.equal(results[1]?.executionId, 'ops-exec-002');
});

test('members fallback chain: source detail with unknown source kind returns empty tasks', async () => {
  globalThis.fetch = (async () => {
    throw new Error('network unavailable');
  }) as typeof fetch;

  const snapshot = await loadAdminMemberOperationSourceDetail('member-001', 'payment' as any, 'unknown-payment');
  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.tasks.length, 0);
  assert.equal(snapshot.receipts.length, 0);
});
