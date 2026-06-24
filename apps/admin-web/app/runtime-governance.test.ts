import assert from 'node:assert/strict';
import test from 'node:test';
import type { RuntimeGovernanceReceipt } from '@m5/types';
import {
  adminRuntimeActionPresets,
  buildAdminRuntimeBatchReplayRequest,
  buildAdminRuntimeReplayRequest,
  buildAdminRuntimeSubmitRequest,
  canReplayAdminRuntimeReceipt,
  summarizeAdminRuntimeReceipt
} from './runtime-governance';

const tenantContext = {
  tenantId: 'tenant-demo',
  brandId: 'brand-demo',
  storeId: 'store-001',
  marketCode: 'cn-mainland'
};

test('admin runtime helper: builds submit request for admin-web action preset', () => {
  const request = buildAdminRuntimeSubmitRequest(adminRuntimeActionPresets[0]!, tenantContext, '001');

  assert.equal(request.app, 'admin-web');
  assert.equal(request.action, 'runtime-replay');
  assert.equal(request.idempotencyKey, 'admin-web:runtime-replay:submit:001');
  assert.equal(request.tenantId, 'tenant-demo');
  assert.equal(request.brandId, 'brand-demo');
  assert.equal((request.payload as { sourceReceiptCode: string }).sourceReceiptCode, 'ADMIN-WORKBENCH-RUNTIME-REPLAY-001');
});

test('admin runtime helper: shared preset payloads stay aligned with workbench action dto semantics', () => {
  const approvalPreset = adminRuntimeActionPresets.find((item) => item.action === 'approval-execution');
  const secretPreset = adminRuntimeActionPresets.find((item) => item.action === 'secret-rotation');

  assert.equal((approvalPreset?.payload as { approvalCode: string }).approvalCode, 'APPROVAL-CODE-001');
  assert.equal((approvalPreset?.payload as { challengeProfile: string }).challengeProfile, 'step-up');
  assert.equal((secretPreset?.payload as { secretName: string }).secretName, 'tenant-demo-openapi-secret');
  assert.equal((secretPreset?.payload as { targetScope: string }).targetScope, 'tenant');
});

test('admin runtime helper: builds replay request with admin runtime source', () => {
  const receipt = {
    receiptCode: 'receipt-admin-001',
    app: 'admin-web',
    action: 'runtime-replay',
    state: 'submitted',
    nextStep: 'PROCEED',
    riskLevel: 'high',
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
    requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
    payloadSummary: '{"sourceReceiptCode":"ADMIN-WORKBENCH-RUNTIME-REPLAY-001"}',
    ticket: {
      ticketCode: 'receipt-admin-001-HANDLER',
      ticketType: 'HANDLER_CALLBACK',
      status: 'ready-for-handler',
      summary: 'ready'
    },
    sync: {
      handlerName: 'admin-runtime-replay-handler',
      syncMode: 'callback-followup',
      syncEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-admin-001/sync',
      callbackEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-admin-001/callback',
      idempotencyKey: 'admin-web:runtime-replay:submit:001',
      ready: true,
      summary: 'ready'
    },
    callback: {
      callbackStatus: 'awaiting-callback',
      ackToken: 'runtime-ack-handler',
      lastEvent: 'HANDLER_ACCEPTED',
      summary: 'waiting'
    },
    ledger: {
      ledgerKey: 'runtime-ledger:receipt-admin-001',
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-admin-001/replay',
      replayable: true,
      summary: 'replay ready'
    },
    retry: {
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-admin-001/replay',
      retryable: true,
      maxAttempts: 3,
      currentAttempt: 0,
      nextBackoffMs: 2000,
      escalationAction: 'WAIT_CALLBACK',
      summary: 'waiting callback'
    },
    rateLimit: {
      allowed: true,
      limit: 12,
      remaining: 11,
      retryAfterSeconds: 0,
      scopeKey: 'admin-web:runtime-replay:tenant-demo'
    },
    events: [],
    generatedAt: '2026-06-13T00:00:00.000Z'
  } satisfies RuntimeGovernanceReceipt;

  const replayRequest = buildAdminRuntimeReplayRequest(receipt, '002');

  assert.equal(replayRequest.requestedFrom, 'ADMIN_WEB_RUNTIME');
  assert.equal(replayRequest.idempotencyKey, 'admin-web:runtime-replay:replay:002');
  assert.equal(replayRequest.tenantId, 'tenant-demo');
  assert.equal(canReplayAdminRuntimeReceipt(receipt), true);
  assert.match(summarizeAdminRuntimeReceipt(receipt), /runtime-replay -> submitted/);
});

test('admin runtime helper: builds batch replay request for multiple receipts', () => {
  const receipt = {
    receiptCode: 'receipt-admin-001',
    app: 'admin-web',
    action: 'runtime-replay',
    state: 'callback-recorded',
    nextStep: 'PROCEED',
    riskLevel: 'high',
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
    requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
    payloadSummary: '{"sourceReceiptCode":"ADMIN-WORKBENCH-RUNTIME-REPLAY-001"}',
    ticket: {
      ticketCode: 'receipt-admin-001-HANDLER',
      ticketType: 'HANDLER_CALLBACK',
      status: 'ready-for-handler',
      summary: 'ready'
    },
    sync: {
      handlerName: 'admin-runtime-replay-handler',
      syncMode: 'callback-followup',
      syncEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-admin-001/sync',
      callbackEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-admin-001/callback',
      idempotencyKey: 'admin-web:runtime-replay:submit:001',
      ready: true,
      summary: 'ready'
    },
    callback: {
      callbackStatus: 'callback-recorded',
      ackToken: 'runtime-ack-handler',
      lastEvent: 'HANDLER_COMPLETED',
      summary: 'completed'
    },
    ledger: {
      ledgerKey: 'runtime-ledger:receipt-admin-001',
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-admin-001/replay',
      replayable: true,
      summary: 'replay ready'
    },
    retry: {
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-admin-001/replay',
      retryable: true,
      maxAttempts: 3,
      currentAttempt: 0,
      nextBackoffMs: 2000,
      escalationAction: 'WAIT_CALLBACK',
      summary: 'waiting callback'
    },
    rateLimit: {
      allowed: true,
      limit: 12,
      remaining: 11,
      retryAfterSeconds: 0,
      scopeKey: 'admin-web:runtime-replay:tenant-demo'
    },
    events: [],
    generatedAt: '2026-06-13T00:00:00.000Z'
  } satisfies RuntimeGovernanceReceipt;

  const request = buildAdminRuntimeBatchReplayRequest([receipt], 'seed-001');

  assert.equal(request.items.length, 1);
  assert.equal(request.items[0]?.receiptCode, 'receipt-admin-001');
  assert.equal(request.items[0]?.requestedFrom, 'ADMIN_WEB_RUNTIME');
  assert.equal(request.items[0]?.idempotencyKey, 'admin-web:runtime-replay:replay:seed-001-1');
});
