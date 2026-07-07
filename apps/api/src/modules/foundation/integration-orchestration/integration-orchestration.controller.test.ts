import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { IntegrationOrchestrationController } from './integration-orchestration.controller'

it('integration-orchestration controller has correct controller path metadata', () => {
  const path = Reflect.getMetadata('path', IntegrationOrchestrationController)
  assert.equal(path, 'foundation/integration-orchestration')
})

it('integration-orchestration controller has all expected route methods', () => {
  const proto = IntegrationOrchestrationController.prototype
  assert.equal(typeof proto.getWebhookSources, 'function')
  assert.equal(typeof proto.getEvents, 'function')
  assert.equal(typeof proto.getIdempotencyRecords, 'function')
  assert.equal(typeof proto.publishEvent, 'function')
  assert.equal(typeof proto.ingestWebhook, 'function')
})

// ── GET webhooks/sources ──
it('getWebhookSources returns catalog from service', () => {
  const mock = [
    {
      source: 'lyt',
      algorithm: 'hmac-sha256',
      toleranceSeconds: 300,
      description: 'LYT 适配器回调验签。',
      secretRef: 'lyt-webhook-signing-secret'
    }
  ]
  const service = { getWebhookSourceCatalog: () => mock } as never
  const controller = new IntegrationOrchestrationController(service)
  const result = controller.getWebhookSources()
  assert.deepStrictEqual(result, mock)
})

// ── GET events ──
it('getEvents returns envelopes filtered by source', async () => {
  const mock = [
    {
      envelopeId: 'e1',
      eventName: 'test.event',
      source: 'lyt',
      aggregateId: 'a1',
      idempotencyKey: 'ik-1',
      occurredAt: '2026-01-01T00:00:00Z',
      receivedAt: '2026-01-01T00:00:01Z',
      payload: { key: 'val' },
      headers: {}
    }
  ]
  const service = { getEventEnvelopes: (_s?: string) => Promise.resolve(mock) } as never
  const controller = new IntegrationOrchestrationController(service)
  const result = await controller.getEvents({ source: 'lyt' })
  assert.deepStrictEqual(result, mock)
})

it('getEvents returns all envelopes when no source query', async () => {
  const mock = [
    {
      envelopeId: 'e1',
      eventName: 'test.event',
      source: 'lyt',
      aggregateId: 'a1',
      idempotencyKey: 'ik-1',
      occurredAt: '2026-01-01T00:00:00Z',
      receivedAt: '2026-01-01T00:00:01Z',
      payload: {},
      headers: {}
    },
    {
      envelopeId: 'e2',
      eventName: 'payment.received',
      source: 'payment',
      aggregateId: 'a2',
      idempotencyKey: 'ik-2',
      occurredAt: '2026-01-01T00:00:00Z',
      receivedAt: '2026-01-01T00:00:01Z',
      payload: {},
      headers: {}
    }
  ]
  const service = { getEventEnvelopes: (_s?: string) => Promise.resolve(mock) } as never
  const controller = new IntegrationOrchestrationController(service)
  const result = await controller.getEvents({})
  assert.equal((result as any).length, 2)
})

// ── GET idempotency-records ──
it('getIdempotencyRecords returns idempotency records filtered by source', async () => {
  const mock = [
    {
      key: 'lyt:e1',
      source: 'lyt',
      eventId: 'a1',
      eventType: 'test.event',
      firstSeenAt: '2026-01-01T00:00:01Z',
      envelopeId: 'e1',
      status: 'accepted' as const,
      payloadChecksum: 'abc'
    }
  ]
  const service = { getIdempotencyRecords: (_s?: string) => Promise.resolve(mock) } as never
  const controller = new IntegrationOrchestrationController(service)
  const result = await controller.getIdempotencyRecords({ source: 'lyt' })
  assert.deepStrictEqual(result, mock)
})

// ── POST events ──
it('publishEvent publishes and returns accepted status', async () => {
  const mock = {
    status: 'accepted' as const,
    envelope: {
      envelopeId: 'env-1',
      eventName: 'order.placed',
      source: 'lyt',
      aggregateId: 'agg-1',
      idempotencyKey: 'ik-1',
      occurredAt: '2026-01-01T00:00:00Z',
      receivedAt: '2026-01-01T00:00:01Z',
      payload: { orderId: 'o1' },
      headers: {}
    },
    persistedEventId: 'env-1',
    guarantees: ['signature-verified-before-accept', 'idempotency-recorded', 'retry-ready']
  }
  const service = {
    publishEvent: (
      _ev: string,
      _payload: Record<string, unknown>,
      _opts: { source?: string; aggregateId?: string; idempotencyKey?: string }
    ) => Promise.resolve(mock)
  } as never
  const controller = new IntegrationOrchestrationController(service)
  const body = {
    eventName: 'order.placed',
    payload: { orderId: 'o1' },
    source: 'lyt'
  }
  const result = await controller.publishEvent(body)
  assert.deepStrictEqual((result as any).status, 'accepted')
})

it('publishEvent returns duplicate when idempotency key already exists', async () => {
  const mock = {
    status: 'duplicate' as const,
    envelope: {
      envelopeId: 'env-1',
      eventName: 'order.placed',
      source: 'lyt',
      aggregateId: 'agg-1',
      idempotencyKey: 'ik-dup',
      occurredAt: '2026-01-01T00:00:00Z',
      receivedAt: '2026-01-01T00:00:01Z',
      payload: { orderId: 'o1' },
      headers: {}
    },
    persistedEventId: 'env-1',
    guarantees: ['database-unique-idempotency-key', 'duplicate-detected-during-create']
  }
  const service = {
    publishEvent: () => Promise.resolve(mock)
  } as never
  const controller = new IntegrationOrchestrationController(service)
  const result = await controller.publishEvent({
    eventName: 'order.placed',
    payload: { orderId: 'o1' },
    idempotencyKey: 'ik-dup'
  })
  assert.deepStrictEqual((result as any).status, 'duplicate')
})

// ── POST webhooks/:source/ingest ──
it('ingestWebhook accepts valid webhook and returns verified result', async () => {
  const mock = {
    status: 'accepted' as const,
    source: 'lyt',
    signatureVerified: true,
    idempotency: {
      key: 'lyt:ext-1',
      source: 'lyt',
      eventId: 'agg-1',
      eventType: 'lyt.webhook.received',
      firstSeenAt: '2026-01-01T00:00:01Z',
      envelopeId: 'env-1',
      status: 'accepted' as const,
      payloadChecksum: 'abc'
    },
    envelope: {
      envelopeId: 'env-1',
      eventName: 'lyt.webhook.received',
      source: 'lyt',
      aggregateId: 'agg-1',
      idempotencyKey: 'ik-1',
      occurredAt: '2026-01-01T00:00:00Z',
      receivedAt: '2026-01-01T00:00:01Z',
      payload: { data: 'ok' },
      headers: {
        'x-webhook-source': 'lyt',
        'x-webhook-signature': 'sha256=abc',
        'x-webhook-timestamp': '1719446400000'
      }
    },
    pipeline: ['signature-check', 'idempotency-check', 'event-envelope', 'audit-log']
  }
  const service = { acceptWebhook: (_s: string, _i: unknown) => Promise.resolve(mock) } as never
  const controller = new IntegrationOrchestrationController(service)
  const result = await controller.ingestWebhook('lyt', {
    eventId: 'ext-1',
    eventType: 'lyt.webhook.received',
    payload: { data: 'ok' },
    signature: 'sha256=abc',
    timestamp: '1719446400000'
  })
  assert.deepStrictEqual((result as any).status, 'accepted')
  assert.deepStrictEqual((result as any).signatureVerified, true)
})

it('ingestWebhook returns duplicate for replayed webhook event', async () => {
  const mock = {
    status: 'duplicate' as const,
    source: 'lyt',
    signatureVerified: true,
    idempotency: {
      key: 'lyt:ext-dup',
      source: 'lyt',
      eventId: 'agg-1',
      eventType: 'lyt.webhook.received',
      firstSeenAt: '2026-01-01T00:00:01Z',
      envelopeId: 'env-dup',
      status: 'accepted' as const,
      payloadChecksum: 'abc'
    },
    pipeline: ['signature-check', 'idempotency-check', 'audit-log', 'skip-duplicate']
  }
  const service = { acceptWebhook: (_s: string, _i: unknown) => Promise.resolve(mock) } as never
  const controller = new IntegrationOrchestrationController(service)
  const result = await controller.ingestWebhook('lyt', {
    eventId: 'ext-dup',
    eventType: 'lyt.webhook.received',
    payload: { data: 'ok' },
    signature: 'sha256=abc',
    timestamp: '1719446400000'
  })
  assert.deepStrictEqual((result as any).status, 'duplicate')
  assert.deepStrictEqual((result as any).pipeline?.includes('skip-duplicate'), true)
})

// ── edge case: empty payload ──
it('publishEvent works with empty payload', async () => {
  const mock = {
    status: 'accepted' as const,
    envelope: {
      envelopeId: 'env-empty',
      eventName: 'system.heartbeat',
      source: 'foundation',
      aggregateId: 'checksum',
      idempotencyKey: 'ik-heartbeat',
      occurredAt: '2026-01-01T00:00:00Z',
      receivedAt: '2026-01-01T00:00:01Z',
      payload: {},
      headers: {}
    },
    persistedEventId: 'env-empty',
    guarantees: ['idempotency-recorded']
  }
  const service = {
    publishEvent: () => Promise.resolve(mock)
  } as never
  const controller = new IntegrationOrchestrationController(service)
  const result = await controller.publishEvent({
    eventName: 'system.heartbeat',
    payload: {}
  })
  assert.deepStrictEqual((result as any).status, 'accepted')
})

// ── edge case: missing optional fields on publish ──
it('publishEvent works with minimal fields', async () => {
  const mock = {
    status: 'accepted' as const,
    envelope: {
      envelopeId: 'env-min',
      eventName: 'test.minimal',
      source: 'foundation',
      aggregateId: 'checksum',
      idempotencyKey: 'ik-min',
      occurredAt: '2026-01-01T00:00:00Z',
      receivedAt: '2026-01-01T00:00:01Z',
      payload: { minimal: true },
      headers: {}
    },
    persistedEventId: 'env-min',
    guarantees: ['idempotency-recorded']
  }
  const service = { publishEvent: () => Promise.resolve(mock) } as never
  const controller = new IntegrationOrchestrationController(service)
  const result = await controller.publishEvent({
    eventName: 'test.minimal',
    payload: { minimal: true }
  })
  assert.deepStrictEqual((result as any).status, 'accepted')
  assert.ok((result as any).persistedEventId)
})
