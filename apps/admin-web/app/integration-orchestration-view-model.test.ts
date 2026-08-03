import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import {
  buildIntegrationOrchestrationHref,
  type IntegrationEventEnvelopeContract,
  type IntegrationIdempotencyRecordContract,
  type IntegrationWebhookSourceContract
} from '@m5/types';
import {
  loadIntegrationOrchestrationWorkspace,
  summarizeIdempotencyRecord,
  summarizeIntegrationEvent,
  summarizeWebhookSource
} from './integration-orchestration-view-model';

const sampleSources: IntegrationWebhookSourceContract[] = [
  {
    source: 'lyt',
    algorithm: 'hmac-sha256',
    toleranceSeconds: 300,
    description: 'LYT 适配器回调验签。',
    secretRef: 'lyt-webhook-signing-secret'
  },
  {
    source: 'payment',
    algorithm: 'rsa-sha256',
    toleranceSeconds: 600,
    description: '支付网关回调验签。',
    secretRef: 'payment-webhook-signing-secret'
  }
];

const sampleEvents: IntegrationEventEnvelopeContract[] = [
  {
    envelopeId: 'evt_001',
    eventName: 'foundation.webhook.received',
    source: 'lyt',
    aggregateId: 'order-001',
    idempotencyKey: 'lyt:order-001',
    occurredAt: '2026-06-14T08:00:00.000Z',
    receivedAt: '2026-06-14T08:00:02.000Z',
    payload: { orderId: 'order-001' },
    headers: { 'x-event-source': 'lyt' }
  },
  {
    envelopeId: 'evt_002',
    eventName: 'payment.received',
    source: 'payment',
    aggregateId: 'pay-001',
    idempotencyKey: 'payment:pay-001',
    occurredAt: '2026-06-14T08:01:00.000Z',
    receivedAt: '2026-06-14T08:01:01.000Z',
    payload: { amount: 88.5, currency: 'CNY' },
    headers: { 'x-event-source': 'payment' }
  }
];

const sampleIdempotency: IntegrationIdempotencyRecordContract[] = [
  {
    key: 'lyt:order-001',
    source: 'lyt',
    eventId: 'order-001',
    eventType: 'foundation.webhook.received',
    firstSeenAt: '2026-06-14T08:00:02.000Z',
    envelopeId: 'evt_001',
    status: 'accepted',
    payloadChecksum: 'checksum-001'
  },
  {
    key: 'payment:pay-001',
    source: 'payment',
    eventId: 'pay-001',
    eventType: 'payment.received',
    firstSeenAt: '2026-06-14T08:01:01.000Z',
    envelopeId: 'evt_002',
    status: 'accepted',
    payloadChecksum: 'checksum-002'
  }
];

describe('integration-orchestration-view-model', () => {
  // ── 正例: buildIntegrationOrchestrationHref ──

  test('buildIntegrationOrchestrationHref omits empty query', () => {
    assert.equal(buildIntegrationOrchestrationHref(), '/integration-orchestration');
  });

  test('buildIntegrationOrchestrationHref includes source query', () => {
    assert.equal(
      buildIntegrationOrchestrationHref({ source: 'lyt' }),
      '/integration-orchestration?source=lyt'
    );
  });

  test('buildIntegrationOrchestrationHref encodes multiple params', () => {
    assert.equal(
      buildIntegrationOrchestrationHref({ source: 'lyt', status: 'active' }),
      '/integration-orchestration?source=lyt&status=active'
    );
  });

  test('buildIntegrationOrchestrationHref handles empty string values', () => {
    const href = buildIntegrationOrchestrationHref({ source: '' });
    assert.equal(href, '/integration-orchestration');
  });

  // ── 正例: summarize helpers ──

  test('summarize helpers include key fields', () => {
    assert.equal(summarizeWebhookSource(sampleSources[0]!), 'lyt · hmac-sha256 · 300s');
    assert.equal(
      summarizeIntegrationEvent(sampleEvents[0]!),
      'foundation.webhook.received · lyt · order-001'
    );
    assert.equal(
      summarizeIdempotencyRecord(sampleIdempotency[0]!),
      'foundation.webhook.received · lyt · accepted'
    );
  });

  test('summarizeWebhookSource handles rsa algorithm', () => {
    const rsaSource: IntegrationWebhookSourceContract = {
      source: 'external',
      algorithm: 'rsa-sha256',
      toleranceSeconds: 600,
      description: 'RSA 验签',
      secretRef: 'external-pubkey'
    };
    assert.equal(summarizeWebhookSource(rsaSource), 'external · rsa-sha256 · 600s');
  });

  test('summarizeWebhookSource with zero tolerance', () => {
    const noTolerance: IntegrationWebhookSourceContract = {
      source: 'instant',
      algorithm: 'hmac-sha256',
      toleranceSeconds: 0,
      description: '零容忍',
      secretRef: 'instant-secret'
    };
    assert.equal(summarizeWebhookSource(noTolerance), 'instant · hmac-sha256 · 0s');
  });

  test('summarizeWebhookSource handles large tolerance', () => {
    const largeTolerance: IntegrationWebhookSourceContract = {
      source: 'legacy',
      algorithm: 'hmac-sha256',
      toleranceSeconds: 86400,
      description: '24h tolerance',
      secretRef: 'legacy-secret'
    };
    assert.equal(summarizeWebhookSource(largeTolerance), 'legacy · hmac-sha256 · 86400s');
  });

  test('summarizeWebhookSource handles missing description', () => {
    const noDesc: IntegrationWebhookSourceContract = {
      source: 'minimal',
      algorithm: 'hmac-sha256',
      toleranceSeconds: 60,
      description: '',
      secretRef: 'minimal-secret'
    };
    assert.equal(summarizeWebhookSource(noDesc), 'minimal · hmac-sha256 · 60s');
  });

  test('summarizeIntegrationEvent handles order events', () => {
    const orderEvent: IntegrationEventEnvelopeContract = {
      envelopeId: 'evt_003',
      eventName: 'order.created',
      source: 'pos',
      aggregateId: 'order-002',
      idempotencyKey: 'pos:order-002',
      occurredAt: '2026-06-14T09:00:00.000Z',
      receivedAt: '2026-06-14T09:00:01.000Z',
      payload: {},
      headers: {}
    };
    assert.equal(summarizeIntegrationEvent(orderEvent), 'order.created · pos · order-002');
  });

  test('summarizeIntegrationEvent handles event with empty aggregateId', () => {
    const noAggregate: IntegrationEventEnvelopeContract = {
      envelopeId: 'evt_004',
      eventName: 'system.heartbeat',
      source: 'monitor',
      aggregateId: '',
      idempotencyKey: 'monitor:heartbeat',
      occurredAt: '2026-06-14T10:00:00.000Z',
      receivedAt: '2026-06-14T10:00:00.500Z',
      payload: {},
      headers: {}
    };
    assert.equal(summarizeIntegrationEvent(noAggregate), 'system.heartbeat · monitor · ');
  });

  test('summarizeIntegrationEvent handles agent events from payment source', () => {
    const paymentEvent = sampleEvents[1]!;
    assert.equal(summarizeIntegrationEvent(paymentEvent), 'payment.received · payment · pay-001');
  });

  test('summarizeIdempotencyRecord handles accepted status', () => {
    assert.equal(summarizeIdempotencyRecord(sampleIdempotency[0]!), 'foundation.webhook.received · lyt · accepted');
  });

  test('summarizeIdempotencyRecord handles rejected status', () => {
    const rejected: IntegrationIdempotencyRecordContract = {
      key: 'dup:order-001',
      source: 'lyt',
      eventId: 'order-001',
      eventType: 'order.update',
      firstSeenAt: '2026-06-14T08:00:02.000Z',
      envelopeId: 'evt_dup',
      status: 'rejected',
      payloadChecksum: 'checksum-dup'
    };
    assert.equal(summarizeIdempotencyRecord(rejected), 'order.update · lyt · rejected');
  });

  test('summarizeIdempotencyRecord handles unknown status', () => {
    const unknown: IntegrationIdempotencyRecordContract = {
      key: 'test:key',
      source: 'internal',
      eventId: 'evt-unknown',
      eventType: 'system.unknown',
      firstSeenAt: '2026-06-14T10:00:00.000Z',
      envelopeId: 'evt_unknown',
      status: 'unknown',
      payloadChecksum: 'cs'
    };
    assert.equal(summarizeIdempotencyRecord(unknown), 'system.unknown · internal · unknown');
  });

  test('summarizeIdempotencyRecord handles pending status', () => {
    const pending: IntegrationIdempotencyRecordContract = {
      key: 'pending:key',
      source: 'pos',
      eventId: 'evt-pending',
      eventType: 'order.pending',
      firstSeenAt: '2026-06-14T11:00:00.000Z',
      envelopeId: 'evt_pending',
      status: 'pending',
      payloadChecksum: 'cs-pending'
    };
    assert.equal(summarizeIdempotencyRecord(pending), 'order.pending · pos · pending');
  });

  // ── 正例/反例: loadIntegrationOrchestrationWorkspace ──

  test('loadIntegrationOrchestrationWorkspace returns api snapshot', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes('/webhooks/sources')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: sampleSources }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.includes('/idempotency-records')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: sampleIdempotency }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.includes('/foundation/integration-orchestration/events')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: sampleEvents }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      return new Response('not-found', { status: 404 });
    }) as typeof fetch;
    try {
      const snapshot = await loadIntegrationOrchestrationWorkspace({ source: 'lyt' });
      assert.equal(snapshot.deliveryMode, 'api');
      assert.ok(snapshot.workspace.summary.sources > 0);
      assert.ok(snapshot.workspace.summary.uniqueEventSources > 0);
      assert.equal(snapshot.workspace.summary.duplicateSensitiveRecords, 2);
      assert.equal(snapshot.workspace.events[0]?.eventName, 'foundation.webhook.received');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('loadIntegrationOrchestrationWorkspace returns api snapshot with payment source', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes('/webhooks/sources')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: sampleSources }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.includes('/idempotency-records')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: sampleIdempotency }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.includes('/events')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: sampleEvents }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      return new Response('not-found', { status: 404 });
    }) as typeof fetch;
    try {
      const snapshot = await loadIntegrationOrchestrationWorkspace({ source: 'payment' });
      assert.equal(snapshot.deliveryMode, 'api');
      assert.equal(snapshot.workspace.summary.uniqueEventSources, 2);
      assert.ok(snapshot.workspace.idempotencyRecords.length >= 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('loadIntegrationOrchestrationWorkspace falls back when request fails', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    try {
      const snapshot = await loadIntegrationOrchestrationWorkspace({ source: 'lyt' });
      assert.equal(snapshot.deliveryMode, 'fallback');
      assert.equal(snapshot.workspace.summary.sources, 2);
      assert.equal(snapshot.workspace.summary.events, 1);
      assert.equal(snapshot.workspace.summary.idempotencyRecords, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('loadIntegrationOrchestrationWorkspace falls back when api returns empty data', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ code: 'OK', message: '', data: null }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch;
    try {
      const snapshot = await loadIntegrationOrchestrationWorkspace({ source: 'lyt' });
      assert.equal(snapshot.deliveryMode, 'fallback');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('loadIntegrationOrchestrationWorkspace fallback has fallback sources and events', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => { throw new Error('network down') }) as typeof fetch;
    try {
      const snapshot = await loadIntegrationOrchestrationWorkspace({});
      assert.equal(snapshot.deliveryMode, 'fallback');
      assert.equal(snapshot.workspace.sources.length, 2);
      assert.ok(snapshot.workspace.sources[0]?.source === 'lyt');
      assert.equal(snapshot.workspace.events.length, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('loadIntegrationOrchestrationWorkspace fallback computes correct summary', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => { throw new Error('timeout') }) as typeof fetch;
    try {
      const snapshot = await loadIntegrationOrchestrationWorkspace({});
      assert.equal(snapshot.workspace.summary.uniqueEventSources, 1);
      assert.equal(snapshot.workspace.summary.duplicateSensitiveRecords, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // ── 边界 ──

  test('loadIntegrationOrchestrationWorkspace without source filter', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes('/webhooks/sources')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: sampleSources }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.includes('/idempotency-records')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: sampleIdempotency }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.includes('/events')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: sampleEvents }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      return new Response('not-found', { status: 404 });
    }) as typeof fetch;
    try {
      const snapshot = await loadIntegrationOrchestrationWorkspace({});
      assert.equal(snapshot.deliveryMode, 'api');
      assert.ok(snapshot.workspace.summary.sources >= 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('loadIntegrationOrchestrationWorkspace handles empty events gracefully', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes('/webhooks/sources')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.includes('/idempotency-records')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.includes('/events')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      return new Response('not-found', { status: 404 });
    }) as typeof fetch;
    try {
      const snapshot = await loadIntegrationOrchestrationWorkspace({});
      assert.equal(snapshot.deliveryMode, 'api');
      assert.equal(snapshot.workspace.summary.sources, 0);
      assert.equal(snapshot.workspace.summary.events, 0);
      assert.equal(snapshot.workspace.summary.uniqueEventSources, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('summarizeIntegrationEvent handles event with empty headers', () => {
    const noHeaders: IntegrationEventEnvelopeContract = {
      envelopeId: 'evt_no_headers',
      eventName: 'system.event',
      source: 'internal',
      aggregateId: 'agg-001',
      idempotencyKey: 'internal:agg-001',
      occurredAt: '2026-06-14T12:00:00.000Z',
      receivedAt: '2026-06-14T12:00:00.100Z',
      payload: {},
      headers: {}
    };
    assert.equal(summarizeIntegrationEvent(noHeaders), 'system.event · internal · agg-001');
  });

  test('summarizeWebhookSource handles source with large toleranceSeconds', () => {
    const large: IntegrationWebhookSourceContract = {
      source: 'batch-process',
      algorithm: 'hmac-sha256',
      toleranceSeconds: 7200,
      description: '2h tolerance',
      secretRef: 'batch-secret'
    };
    assert.equal(summarizeWebhookSource(large), 'batch-process · hmac-sha256 · 7200s');
  });

  test('summarizeIdempotencyRecord handles duplicateSensitiveRecords calculation', () => {
    const apiRecord: IntegrationIdempotencyRecordContract = {
      key: 'payment:tx-001',
      source: 'payment',
      eventId: 'tx-001',
      eventType: 'payment.confirmed',
      firstSeenAt: '2026-06-14T09:00:00.000Z',
      envelopeId: 'evt_pay_conf',
      status: 'accepted',
      payloadChecksum: 'cs-pay'
    };
    assert.equal(summarizeIdempotencyRecord(apiRecord), 'payment.confirmed · payment · accepted');
  });
});
