import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { RuntimeGovernanceReceipt } from '@m5/types';
import {
  buildStorefrontRuntimeReplayRequest,
  buildStorefrontRuntimeSubmitRequest,
  canReplayStorefrontRuntimeReceipt,
  storefrontRuntimeActionPresets,
  summarizeStorefrontRuntimeReceipt
} from './runtime-governance';

describe('runtime-governance: 正例', () => {
  it('builds submit request for storefront portal action (booking)', () => {
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
    assert.equal(request.tenantId, 'tenant-demo');
    assert.equal(request.marketCode, 'cn-mainland');
  });

  it('builds submit request for payment action', () => {
    const request = buildStorefrontRuntimeSubmitRequest(
      storefrontRuntimeActionPresets[1]!,
      {
        marketCode: 'cn-mainland',
        tenantCode: 'tenant-pay',
        brandCode: 'brand-pay',
        storeCode: 'store-pay'
      },
      'pay-001'
    );

    assert.equal(request.app, 'storefront-web');
    assert.equal(request.action, 'payment-submit');
    assert.equal(request.idempotencyKey, 'storefront-web:payment-submit:submit:pay-001');
    assert.equal(request.storeId, 'store-pay');
  });

  it('builds replay request with storefront runtime source', () => {
    const receipt = makeFullReceipt();
    const replayRequest = buildStorefrontRuntimeReplayRequest(receipt, '002');

    assert.equal(replayRequest.requestedFrom, 'STOREFRONT_WEB_RUNTIME');
    assert.equal(replayRequest.idempotencyKey, 'storefront-web:booking-submit:replay:002');
    assert.equal(replayRequest.tenantId, 'tenant-demo');
  });

  it('canReplay returns true for replayable receipt', () => {
    const receipt = makeFullReceipt();
    assert.equal(canReplayStorefrontRuntimeReceipt(receipt), true);
  });

  it('summarize includes action and state', () => {
    const receipt = makeFullReceipt();
    assert.match(summarizeStorefrontRuntimeReceipt(receipt), /booking-submit -> submitted/);
  });

  it('storefrontRuntimeActionPresets has correct shape', () => {
    assert.equal(storefrontRuntimeActionPresets.length, 2);
    assert.equal(storefrontRuntimeActionPresets[0]!.action, 'booking-submit');
    assert.equal(storefrontRuntimeActionPresets[1]!.action, 'payment-submit');
    assert.equal(storefrontRuntimeActionPresets[0]!.riskLevel, 'high');
    assert.equal(storefrontRuntimeActionPresets[1]!.riskLevel, 'high');
  });

  it('preset payload contains expected fields', () => {
    for (const preset of storefrontRuntimeActionPresets) {
      assert.ok(typeof preset.handlerName === 'string');
      assert.ok(typeof preset.requestEndpoint === 'string');
      assert.ok(typeof preset.scenario === 'string');
      assert.ok(typeof preset.payload === 'object');
    }
  });
});

describe('runtime-governance: 边界', () => {
  it('canReplay returns false for receipt with non-replayable ledger', () => {
    const receipt = { ...makeFullReceipt(), ledger: { ...makeFullReceipt().ledger, replayable: false } };
    assert.equal(canReplayStorefrontRuntimeReceipt(receipt), false);
  });

  it('summarize handles receipt with minimal fields', () => {
    const receipt = makeFullReceipt();
    receipt.state = 'blocked';
    const summary = summarizeStorefrontRuntimeReceipt(receipt);
    assert.ok(summary.includes('blocked'));
  });

  it('generate idempotency keys with different nonces are unique', () => {
    const ctx = { marketCode: 'cn', tenantCode: 't', brandCode: 'b', storeCode: 's' };
    const req1 = buildStorefrontRuntimeSubmitRequest(storefrontRuntimeActionPresets[0]!, ctx, 'nonce-a');
    const req2 = buildStorefrontRuntimeSubmitRequest(storefrontRuntimeActionPresets[0]!, ctx, 'nonce-b');
    assert.notEqual(req1.idempotencyKey, req2.idempotencyKey);
  });

  it('submit request for payment uses distinct idempotency prefix', () => {
    const ctx = { marketCode: 'cn', tenantCode: 't', brandCode: 'b', storeCode: 's' };
    const req = buildStorefrontRuntimeSubmitRequest(storefrontRuntimeActionPresets[1]!, ctx, '001');
    assert.ok(req.idempotencyKey.startsWith('storefront-web:payment-submit'));
  });
});

describe('runtime-governance: 防御', () => {
  it('builds sub mutates with different nonce', () => {
    const ctx = { marketCode: 'cn', tenantCode: 't', brandCode: 'b', storeCode: 's' };
    const req1 = buildStorefrontRuntimeSubmitRequest(storefrontRuntimeActionPresets[0]!, ctx, '001');
    const req2 = buildStorefrontRuntimeSubmitRequest(storefrontRuntimeActionPresets[0]!, ctx, '002');
    assert.notEqual(req1.idempotencyKey, req2.idempotencyKey);
  });

  it('replay request includes receiptCode in idempotency', () => {
    const receipt = makeFullReceipt();
    receipt.receiptCode = 'custom-receipt';
    const replay = buildStorefrontRuntimeReplayRequest(receipt, '003');
    assert.ok(replay.idempotencyKey.length > 0);
  });
});

function makeFullReceipt(): RuntimeGovernanceReceipt {
  return {
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
}
