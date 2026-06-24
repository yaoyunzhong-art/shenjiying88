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
  }
];

describe('integration-orchestration-view-model', () => {
  test('buildIntegrationOrchestrationHref omits empty query', () => {
    assert.equal(buildIntegrationOrchestrationHref(), '/integration-orchestration');
  });

  test('buildIntegrationOrchestrationHref includes source query', () => {
    assert.equal(
      buildIntegrationOrchestrationHref({ source: 'lyt' }),
      '/integration-orchestration?source=lyt'
    );
  });

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
      assert.equal(snapshot.workspace.summary.sources, 1);
      assert.equal(snapshot.workspace.summary.uniqueEventSources, 1);
      assert.equal(snapshot.workspace.summary.duplicateSensitiveRecords, 1);
      assert.equal(snapshot.workspace.events[0]?.eventName, 'foundation.webhook.received');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
