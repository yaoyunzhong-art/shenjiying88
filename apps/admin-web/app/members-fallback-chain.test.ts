import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getMemberOperationsRuntimeApprovalSummary,
  loadAdminMemberOperationReceiptDetail,
  loadAdminMemberOperationSourceDetail,
  loadMemberOperationsRuntimeReceipt,
  replayMemberOperationsRuntimeReceipt,
} from './members-view-model';

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
