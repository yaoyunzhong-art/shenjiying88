import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadIntegrationOrchestrationSourceDetail,
  loadIntegrationOrchestrationEventDetail,
  loadIntegrationOrchestrationIdempotencyDetail
} from './integration-orchestration-detail-view-model';

function envelope(payload: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({ code: 'OK', message: '', data: payload }),
    text: async () => JSON.stringify({ code: 'OK', message: '', data: payload })
  } as Response;
}

function mockWorkspaceFetch(workspace: {
  sources: unknown[];
  events: unknown[];
  idempotencyRecords: unknown[];
}) {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/webhooks/sources')) {
      return envelope(workspace.sources);
    }
    if (url.includes('/integration-orchestration/events')) {
      return envelope(workspace.events);
    }
    if (url.includes('/idempotency-records')) {
      return envelope(workspace.idempotencyRecords);
    }
    return envelope({ code: 'NOT_FOUND', message: 'unknown endpoint', data: null });
  }) as typeof fetch;
}

function mockFetchReject() {
  return (async () => {
    throw new Error('network down');
  }) as typeof fetch;
}

const fallbackWorkspace = {
  sources: [
    {
      source: 'lyt',
      algorithm: 'hmac-sha256',
      toleranceSeconds: 300,
      description: 'LYT 适配器回调验签。',
      secretRef: 'lyt-webhook-signing-secret'
    }
  ],
  events: [
    {
      envelopeId: 'evt_001',
      eventName: 'foundation.webhook.received',
      source: 'lyt',
      aggregateId: 'order-001',
      idempotencyKey: 'lyt:order-001',
      occurredAt: '2026-06-14T08:00:00.000Z',
      receivedAt: '2026-06-14T08:00:02.000Z',
      payload: { orderId: 'order-001' },
      headers: {}
    }
  ],
  idempotencyRecords: [
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
  ],
  summary: {
    sources: 1,
    events: 1,
    idempotencyRecords: 1,
    uniqueEventSources: 1,
    duplicateSensitiveRecords: 0
  }
};

test('integration-orchestration-detail-view-model: source detail returns matched record and filtered events', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockWorkspaceFetch(fallbackWorkspace);
  try {
    const snapshot = await loadIntegrationOrchestrationSourceDetail('lyt', {}, {});
    assert.equal(snapshot.notFound, false);
    assert.equal(snapshot.record?.source, 'lyt');
    assert.equal(snapshot.record?.secretRef, 'lyt-webhook-signing-secret');
    assert.equal(snapshot.matchedEvents.length, 1);
    assert.equal(snapshot.matchedIdempotencyRecords.length, 1);
    assert.equal(snapshot.matchedEvents[0]?.envelopeId, 'evt_001');
    assert.equal(snapshot.sourceHref, '/integration-orchestration/sources/lyt');
    assert.match(snapshot.auditHref, /source=integration-orchestration/);
    assert.match(snapshot.foundationHref, /moduleKey=integration-orchestration/);
    assert.equal(snapshot.workspaceHref, '/integration-orchestration');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('integration-orchestration-detail-view-model: source detail marks notFound when missing', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockWorkspaceFetch(fallbackWorkspace);
  try {
    const snapshot = await loadIntegrationOrchestrationSourceDetail('payment', {}, {});
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.record, null);
    assert.equal(snapshot.matchedEvents.length, 0);
    assert.equal(snapshot.matchedIdempotencyRecords.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('integration-orchestration-detail-view-model: event detail returns matched envelope and idempotency link', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockWorkspaceFetch(fallbackWorkspace);
  try {
    const snapshot = await loadIntegrationOrchestrationEventDetail('evt_001', {}, {});
    assert.equal(snapshot.notFound, false);
    assert.equal(snapshot.record?.envelopeId, 'evt_001');
    assert.equal(snapshot.record?.eventName, 'foundation.webhook.received');
    assert.equal(snapshot.matchedIdempotency?.key, 'lyt:order-001');
    assert.equal(snapshot.matchedIdempotency?.eventId, 'order-001');
    assert.equal(snapshot.eventHref, '/integration-orchestration/events/evt_001');
    assert.match(snapshot.auditHref, /purpose=integration-event%3Aevt_001|purpose=integration-event:evt_001/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('integration-orchestration-detail-view-model: event detail flags notFound when envelope missing', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockWorkspaceFetch(fallbackWorkspace);
  try {
    const snapshot = await loadIntegrationOrchestrationEventDetail('evt_does_not_exist', {}, {});
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.record, null);
    assert.equal(snapshot.matchedIdempotency, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('integration-orchestration-detail-view-model: idempotency detail returns matched record and matched event', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockWorkspaceFetch(fallbackWorkspace);
  try {
    const snapshot = await loadIntegrationOrchestrationIdempotencyDetail('lyt:order-001', {}, {});
    assert.equal(snapshot.notFound, false);
    assert.equal(snapshot.record?.key, 'lyt:order-001');
    assert.equal(snapshot.record?.status, 'accepted');
    assert.ok(snapshot.matchedEvent, 'matchedEvent should be resolved via idempotencyKey');
    assert.equal(snapshot.matchedEvent?.envelopeId, 'evt_001');
    assert.equal(snapshot.idempotencyHref, '/integration-orchestration/idempotency/lyt%3Aorder-001');
    assert.match(snapshot.auditHref, /purpose=integration-idempotency/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('integration-orchestration-detail-view-model: idempotency detail flags notFound when key missing', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockWorkspaceFetch(fallbackWorkspace);
  try {
    const snapshot = await loadIntegrationOrchestrationIdempotencyDetail('not-in-workspace', {}, {});
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.record, null);
    assert.equal(snapshot.matchedEvent, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('integration-orchestration-detail-view-model: all three loaders fall back to seeded workspace on fetch failure', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetchReject();
  try {
    const source = await loadIntegrationOrchestrationSourceDetail('lyt', {}, {});
    assert.equal(source.deliveryMode, 'fallback');
    assert.equal(source.notFound, false);
    assert.ok(source.record, 'fallback workspace includes lyt source');
    assert.equal(source.record?.source, 'lyt');

    const event = await loadIntegrationOrchestrationEventDetail('evt_fallback_001', {}, {});
    assert.equal(event.deliveryMode, 'fallback');
    assert.equal(event.notFound, false);
    assert.ok(event.record, 'fallback workspace includes fallback envelope');
    assert.equal(event.record?.envelopeId, 'evt_fallback_001');

    const idempotency = await loadIntegrationOrchestrationIdempotencyDetail('lyt:order-001', {}, {});
    assert.equal(idempotency.deliveryMode, 'fallback');
    assert.equal(idempotency.notFound, false);
    assert.ok(idempotency.record, 'fallback workspace includes lyt:order-001 idempotency');
    assert.equal(idempotency.record?.key, 'lyt:order-001');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
