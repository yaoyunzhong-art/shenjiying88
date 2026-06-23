import assert from 'node:assert/strict';
import test from 'node:test';
import type { RuntimeGovernanceReceipt } from '@m5/types';
import {
  batchReplayAdminRuntimeReceipts,
  buildRuntimeOperationFromReceipt,
  buildRuntimeOperationReceipts,
  filterAdminRuntimeOperationsByFocus,
  getGovernanceAuditAdminRuntimeReceipts,
  getReplayableAdminRuntimeReceipts,
  loadAdminRuntimeOperationDetail,
  loadAdminRuntimeOperations,
} from './operations-view-model';

const sampleReceipt: RuntimeGovernanceReceipt = {
  receiptCode: 'RUNTIME-001',
  app: 'admin-web',
  action: 'runtime-replay',
  state: 'callback-recorded',
  nextStep: 'PROCEED',
  riskLevel: 'high',
  recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
  requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
  payloadSummary: '{"sourceReceiptCode":"SRC-001"}',
  ticket: {
    ticketCode: 'RUNTIME-001-HANDLER',
    ticketType: 'HANDLER_CALLBACK',
    status: 'ready-for-handler',
    summary: 'handler ready',
  },
  sync: {
    handlerName: 'admin-runtime-replay-handler',
    syncMode: 'callback-followup',
    syncEndpoint: '/api/v1/foundation/runtime-governance/actions/RUNTIME-001/sync',
    callbackEndpoint: '/api/v1/foundation/runtime-governance/actions/RUNTIME-001/callback',
    idempotencyKey: 'runtime:sync:RUNTIME-001',
    ready: true,
    summary: 'sync ready',
  },
  callback: {
    callbackStatus: 'callback-recorded',
    ackToken: 'ACK-001',
    lastEvent: 'HANDLER_COMPLETED',
    summary: 'callback recorded',
  },
  ledger: {
    ledgerKey: 'runtime-ledger:RUNTIME-001',
    replayEndpoint: '/api/v1/foundation/runtime-governance/actions/RUNTIME-001/replay',
    replayable: true,
    summary: 'replay available',
  },
  retry: {
    replayEndpoint: '/api/v1/foundation/runtime-governance/actions/RUNTIME-001/replay',
    retryable: true,
    maxAttempts: 3,
    currentAttempt: 1,
    nextBackoffMs: 30000,
    escalationAction: 'OPEN_MANUAL_REVIEW',
    summary: 'retry pending',
  },
  rateLimit: {
    allowed: true,
    limit: 10,
    remaining: 8,
    retryAfterSeconds: 0,
    scopeKey: 'admin-web:runtime-replay:tenant-demo',
  },
  events: [
    {
      eventType: 'runtime-governance.action.submitted',
      status: 'accepted',
      idempotencyKey: 'submit-001',
      occurredAt: '2026-06-14T00:00:00.000Z',
      summary: 'submitted',
    },
    {
      eventType: 'runtime-governance.handler.callback.recorded',
      status: 'accepted',
      idempotencyKey: 'callback-001',
      occurredAt: '2026-06-14T00:05:00.000Z',
      summary: 'callback done',
    },
  ],
  generatedAt: '2026-06-14T00:00:00.000Z',
};

const memberOperationsReceipt: RuntimeGovernanceReceipt = {
  ...sampleReceipt,
  receiptCode: 'MEMBER-OPS-001',
  requestEndpoint: '/api/v1/members/persistent/member-001/operations-receipts/ops-exec-001/runtime',
  payloadSummary:
    '{"memberId":"member-001","taskId":"ops-task-001","actionCode":"assign-vip-concierge","executionLane":"member-crm","targetType":"crm-follow-up","targetId":"crm-001","sourceOrderId":"order-001","sourcePaymentId":"payment-001"}',
};

test('operations-view-model: builds runtime operation from receipt', () => {
  const operation = buildRuntimeOperationFromReceipt(sampleReceipt);

  assert.equal(operation.id, 'RUNTIME-001');
  assert.equal(operation.type, 'runtime-replay');
  assert.equal(operation.targetId, 'tenant-demo');
  assert.equal(operation.status, 'completed');
  assert.equal(operation.finishedAt, '2026-06-14T00:05:00.000Z');
});

test('operations-view-model: builds member operations context into runtime operation target', () => {
  const operation = buildRuntimeOperationFromReceipt(memberOperationsReceipt);

  assert.equal(operation.id, 'MEMBER-OPS-001');
  assert.equal(operation.targetId, 'member-001 · assign-vip-concierge');
});

test('operations-view-model: builds runtime receipt timeline records', () => {
  const receipts = buildRuntimeOperationReceipts(sampleReceipt);

  assert.equal(receipts.length, 3);
  assert.equal(receipts[0]?.code, 'runtime-governance.action.submitted');
  assert.equal(receipts[2]?.code, 'HANDLER_COMPLETED');
  assert.equal(receipts[2]?.status, 'ok');
});

test('operations-view-model: prepends member operations semantic receipt context', () => {
  const receipts = buildRuntimeOperationReceipts(memberOperationsReceipt);

  assert.equal(receipts[0]?.code, 'member-operations-context');
  assert.match(receipts[0]?.message ?? '', /会员 member-001/);
  assert.match(receipts[0]?.message ?? '', /动作 assign-vip-concierge/);
  assert.match(receipts[0]?.message ?? '', /订单 order-001/);
});

test('operations-view-model: loads runtime operations from foundation overview', async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: {
          generatedAt: '2026-06-14T00:00:00.000Z',
          summary: {
            runtimeGovernanceBacklog: 1,
            stalledRuntimeCallbacks: 0,
            highRiskRuntimeBacklog: 1,
            runtimeBlockedActions: 0,
          },
          modules: {
            runtimeGovernance: {
              summary: {
                backlog: 1,
                stalledCallbacks: 0,
                highRiskBacklog: 1,
                blockedActions: 0,
              },
              totalSummary: {
                backlog: 1,
                stalledCallbacks: 0,
                highRiskBacklog: 1,
                blockedActions: 0,
              },
              batchSummary: {
                filteredReceipts: 1,
                replayableReceipts: 1,
                governanceAuditReceipts: 1,
                stalledReceipts: 0,
                blockedReceipts: 0,
                highRiskReceipts: 1,
              },
              receipts: [sampleReceipt],
            },
          },
        },
        timestamp: '2026-06-14T00:00:00.000Z',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    )) as typeof fetch;

  const snapshot = await loadAdminRuntimeOperations();

  assert.equal(snapshot.deliveryMode, 'api');
  assert.equal(snapshot.operations.length, 1);
  assert.equal(snapshot.receipts.length, 1);
  assert.equal(snapshot.batchSummary.replayableReceipts, 1);
  assert.equal(snapshot.operations[0]?.id, 'RUNTIME-001');
  assert.equal(snapshot.summary.backlog, 1);
});

test('operations-view-model: loads focused runtime operations with foundation query params', async () => {
  let capturedUrl = '';

  globalThis.fetch = (async (input) => {
    capturedUrl = String(input);
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: {
          generatedAt: '2026-06-14T00:00:00.000Z',
          summary: {
            runtimeGovernanceBacklog: 2,
            stalledRuntimeCallbacks: 1,
            highRiskRuntimeBacklog: 2,
            runtimeBlockedActions: 1,
          },
          modules: {
            runtimeGovernance: {
              summary: {
                backlog: 1,
                stalledCallbacks: 0,
                highRiskBacklog: 1,
                blockedActions: 0,
              },
              totalSummary: {
                backlog: 2,
                stalledCallbacks: 1,
                highRiskBacklog: 2,
                blockedActions: 1,
              },
              batchSummary: {
                filteredReceipts: 1,
                replayableReceipts: 1,
                governanceAuditReceipts: 2,
                stalledReceipts: 1,
                blockedReceipts: 1,
                highRiskReceipts: 2,
              },
              appliedFilter: {
                focus: 'batch-replay',
                replayable: true,
              },
              receipts: [sampleReceipt],
              stalledReceipts: [],
            },
          },
        },
        timestamp: '2026-06-14T00:00:00.000Z',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  }) as typeof fetch;

  const snapshot = await loadAdminRuntimeOperations('batch-replay');

  assert.match(capturedUrl, /runtimeFocus=batch-replay/);
  assert.match(capturedUrl, /runtimeReplayable=true/);
  assert.equal(snapshot.summary.backlog, 1);
  assert.equal(snapshot.batchSummary.filteredReceipts, 1);
});

test('operations-view-model: derives replayable and governance-audit receipts by focus', () => {
  const blockedReceipt: RuntimeGovernanceReceipt = {
    ...sampleReceipt,
    receiptCode: 'RUNTIME-002',
    state: 'blocked',
    callback: {
      ...sampleReceipt.callback,
      callbackStatus: 'callback-blocked',
      summary: 'blocked'
    },
    ledger: {
      ...sampleReceipt.ledger,
      replayable: false
    }
  };

  const snapshot = {
    deliveryMode: 'api' as const,
    generatedAt: '2026-06-14T00:00:00.000Z',
    operations: [
      buildRuntimeOperationFromReceipt(sampleReceipt),
      buildRuntimeOperationFromReceipt(blockedReceipt),
    ],
    receipts: [sampleReceipt, blockedReceipt],
    stalledReceipts: [
      {
        receiptCode: 'RUNTIME-002',
        escalationAction: 'SCHEDULE_REPLAY',
        summary: 'stalled'
      }
    ],
    batchSummary: {
      filteredReceipts: 2,
      replayableReceipts: 1,
      governanceAuditReceipts: 2,
      stalledReceipts: 1,
      blockedReceipts: 1,
      highRiskReceipts: 2
    },
    summary: {
      backlog: 2,
      stalledCallbacks: 1,
      highRiskBacklog: 2,
      blockedActions: 1
    }
  };

  assert.equal(getReplayableAdminRuntimeReceipts(snapshot).length, 1);
  assert.equal(getGovernanceAuditAdminRuntimeReceipts(snapshot).length, 2);
  assert.equal(filterAdminRuntimeOperationsByFocus(snapshot, 'batch-replay').length, 1);
  assert.equal(filterAdminRuntimeOperationsByFocus(snapshot, 'governance-audit').length, 2);
});

test('operations-view-model: posts batch replay request for runtime receipts', async () => {
  let capturedMethod = '';
  let capturedUrl = '';
  let capturedBody = '';

  globalThis.fetch = (async (input, init) => {
    capturedMethod = init?.method ?? '';
    capturedUrl = String(input);
    capturedBody = String(init?.body ?? '');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: {
          generatedAt: '2026-06-14T00:00:00.000Z',
          total: 1,
          items: [
            {
              receiptCode: 'RUNTIME-001',
              receipt: sampleReceipt,
            },
          ],
        },
        timestamp: '2026-06-14T00:00:00.000Z',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  }) as typeof fetch;

  const result = await batchReplayAdminRuntimeReceipts([sampleReceipt]);

  assert.equal(capturedMethod, 'POST');
  assert.match(capturedUrl, /\/foundation\/runtime-governance\/actions\/batch-replay$/);
  assert.match(capturedBody, /"receiptCode":"RUNTIME-001"/);
  assert.equal(result.total, 1);
});

test('operations-view-model: falls back for detail when api query fails', async () => {
  globalThis.fetch = (async () => {
    throw new Error('runtime query unavailable');
  }) as typeof fetch;

  const snapshot = await loadAdminRuntimeOperationDetail('op-2');

  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.operation?.id, 'op-2');
  assert.ok(snapshot.receipts.length > 0);
});

test('operations-view-model: loads member operations context for runtime detail', async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: memberOperationsReceipt,
        timestamp: '2026-06-14T00:00:00.000Z',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    )) as typeof fetch;

  const snapshot = await loadAdminRuntimeOperationDetail('MEMBER-OPS-001');

  assert.equal(snapshot.deliveryMode, 'api');
  assert.equal(snapshot.operation?.targetId, 'member-001 · assign-vip-concierge');
  assert.equal(snapshot.memberOperationsContext?.memberId, 'member-001');
  assert.equal(snapshot.memberOperationsContext?.executionId, 'ops-exec-001');
  assert.equal(snapshot.memberOperationsContext?.taskId, 'ops-task-001');
});
