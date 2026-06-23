import assert from 'node:assert/strict';
import test from 'node:test';
import type { RuntimeGovernanceReceipt } from '@m5/types';
import {
  buildStorefrontRuntimeReplayRequest,
  buildStorefrontRuntimeSubmitRequest,
  canReplayStorefrontRuntimeReceipt,
  storefrontRuntimeActionPresets,
  summarizeStorefrontRuntimeReceipt
} from './runtime-governance';

test('storefront runtime helper: builds submit request for storefront portal action', () => {
  const request = buildStorefrontRuntimeSubmitRequest(
    storefrontRuntimeActionPresets[0]!,
    {
      marketCode: 'cn-mainland',
      tenantCode: 'tenant-demo',
      brandCode: 'brand-demo',
      storeCode: 'store-001'
    },
    '001'
  );

  assert.equal(request.app, 'storefront-web');
  assert.equal(request.action, 'booking-submit');
  assert.equal(request.idempotencyKey, 'storefront-web:booking-submit:submit:001');
  assert.equal(request.brandId, 'brand-demo');
  assert.equal(request.storeId, 'store-001');
});

test('storefront runtime helper: builds replay request with storefront runtime source', () => {
  const receipt = {
    receiptCode: 'receipt-storefront-001',
    app: 'storefront-web',
    action: 'booking-submit',
    state: 'submitted',
    nextStep: 'PROCEED',
    riskLevel: 'high',
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
    requestEndpoint: '/api/v1/storefront/bookings',
    payloadSummary: '{"bookingCode":"STORE-BOOKING-001"}',
    ticket: {
      ticketCode: 'receipt-storefront-001-HANDLER',
      ticketType: 'HANDLER_CALLBACK',
      status: 'ready-for-handler',
      summary: 'ready'
    },
    sync: {
      handlerName: 'storefront-booking-submit-handler',
      syncMode: 'callback-followup',
      syncEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-storefront-001/sync',
      callbackEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-storefront-001/callback',
      idempotencyKey: 'storefront-web:booking-submit:submit:001',
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
      ledgerKey: 'runtime-ledger:receipt-storefront-001',
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-storefront-001/replay',
      replayable: true,
      summary: 'replay ready'
    },
    retry: {
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-storefront-001/replay',
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
      scopeKey: 'storefront-web:booking-submit:tenant-demo'
    },
    events: [],
    generatedAt: '2026-06-13T00:00:00.000Z'
  } satisfies RuntimeGovernanceReceipt;

  const replayRequest = buildStorefrontRuntimeReplayRequest(receipt, '002');

  assert.equal(replayRequest.requestedFrom, 'STOREFRONT_WEB_RUNTIME');
  assert.equal(replayRequest.idempotencyKey, 'storefront-web:booking-submit:replay:002');
  assert.equal(replayRequest.tenantId, 'tenant-demo');
  assert.equal(canReplayStorefrontRuntimeReceipt(receipt), true);
  assert.match(summarizeStorefrontRuntimeReceipt(receipt), /booking-submit -> submitted/);
});
