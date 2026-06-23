import assert from 'node:assert/strict';
import test from 'node:test';
import type { RuntimeGovernanceReceipt } from '@m5/types';
import {
  buildTobRuntimeReplayRequest,
  buildTobRuntimeSubmitRequest,
  canReplayTobRuntimeReceipt,
  summarizeTobRuntimeReceipt,
  tobRuntimeActionPresets
} from './runtime-governance';

test('tob runtime helper: builds submit request for tob-web portal action', () => {
  const request = buildTobRuntimeSubmitRequest(
    tobRuntimeActionPresets[0]!,
    { marketCode: 'cn-mainland', tenantCode: 'tenant-demo' },
    '001'
  );

  assert.equal(request.app, 'tob-web');
  assert.equal(request.action, 'member-login');
  assert.equal(request.idempotencyKey, 'tob-web:member-login:submit:001');
  assert.equal(request.marketCode, 'cn-mainland');
});

test('tob runtime helper: builds replay request with tob runtime source', () => {
  const receipt = {
    receiptCode: 'receipt-tob-001',
    app: 'tob-web',
    action: 'booking-submit',
    state: 'submitted',
    nextStep: 'PROCEED',
    riskLevel: 'high',
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
    requestEndpoint: '/api/v1/storefront/bookings',
    payloadSummary: '{"bookingCode":"TOB-BOOKING-001"}',
    ticket: {
      ticketCode: 'receipt-tob-001-HANDLER',
      ticketType: 'HANDLER_CALLBACK',
      status: 'ready-for-handler',
      summary: 'ready'
    },
    sync: {
      handlerName: 'tob-booking-submit-handler',
      syncMode: 'callback-followup',
      syncEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-tob-001/sync',
      callbackEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-tob-001/callback',
      idempotencyKey: 'tob-web:booking-submit:submit:001',
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
      ledgerKey: 'runtime-ledger:receipt-tob-001',
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-tob-001/replay',
      replayable: true,
      summary: 'replay ready'
    },
    retry: {
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-tob-001/replay',
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
      scopeKey: 'tob-web:booking-submit:tenant-demo'
    },
    events: [],
    generatedAt: '2026-06-13T00:00:00.000Z'
  } satisfies RuntimeGovernanceReceipt;

  const replayRequest = buildTobRuntimeReplayRequest(receipt, '002');

  assert.equal(replayRequest.requestedFrom, 'TOB_WEB_RUNTIME');
  assert.equal(replayRequest.idempotencyKey, 'tob-web:booking-submit:replay:002');
  assert.equal(replayRequest.tenantId, 'tenant-demo');
  assert.equal(canReplayTobRuntimeReceipt(receipt), true);
  assert.match(summarizeTobRuntimeReceipt(receipt), /booking-submit -> submitted/);
});
