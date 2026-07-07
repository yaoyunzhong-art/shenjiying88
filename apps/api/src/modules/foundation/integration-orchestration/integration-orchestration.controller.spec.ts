import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { IntegrationOrchestrationController } from './integration-orchestration.controller'

it('integration-orchestration controller path metadata is set', () => {
  const path = Reflect.getMetadata('path', IntegrationOrchestrationController)
  assert.equal(path, 'foundation/integration-orchestration')
})

// ── webhooks/sources (GET) ──

it('integration-orchestration controller webhooks/sources route has GET metadata', () => {
  const method = Reflect.getMetadata(
    'method',
    IntegrationOrchestrationController.prototype.getWebhookSources
  )
  const path = Reflect.getMetadata(
    'path',
    IntegrationOrchestrationController.prototype.getWebhookSources
  )
  assert.equal(method, 0) // GET
  assert.equal(path, 'webhooks/sources')
})

it('integration-orchestration getWebhookSources delegates to service', () => {
  const mockCatalog = [
    {
      source: 'lyt',
      algorithm: 'hmac-sha256',
      toleranceSeconds: 300,
      description: 'LYT 适配器回调验签。',
      secretRef: 'lyt-webhook-signing-secret'
    }
  ]
  const service = { getWebhookSourceCatalog: () => mockCatalog } as never
  const controller = new IntegrationOrchestrationController(service)
  assert.deepStrictEqual(controller.getWebhookSources(), mockCatalog)
})

it('integration-orchestration getWebhookSources returns full catalog from service', () => {
  const mockCatalog = [
    {
      source: 'lyt',
      algorithm: 'hmac-sha256' as const,
      toleranceSeconds: 300,
      description: 'LYT 适配器回调验签。',
      secretRef: 'lyt-webhook-signing-secret'
    },
    {
      source: 'payment',
      algorithm: 'hmac-sha256' as const,
      toleranceSeconds: 300,
      description: '支付网关回调验签。',
      secretRef: 'payment-webhook-signing-secret'
    }
  ]
  const service = { getWebhookSourceCatalog: () => mockCatalog } as never
  const controller = new IntegrationOrchestrationController(service)
  const result = controller.getWebhookSources()
  assert.equal((result as any).length, 2)
  assert.deepStrictEqual((result as any)[0].source, 'lyt')
  assert.deepStrictEqual((result as any)[1].source, 'payment')
})

// ── events (GET) ──

it('integration-orchestration controller events route has GET metadata', () => {
  const method = Reflect.getMetadata(
    'method',
    IntegrationOrchestrationController.prototype.getEvents
  )
  const path = Reflect.getMetadata(
    'path',
    IntegrationOrchestrationController.prototype.getEvents
  )
  assert.equal(method, 0) // GET
  assert.equal(path, 'events')
})

it('integration-orchestration getEvents delegates to service', async () => {
  const mockEnvelopes = [
    {
      envelopeId: 'evt-1',
      eventName: 'order.placed',
      source: 'lyt',
      aggregateId: 'agg-1',
      idempotencyKey: 'ik-1',
      occurredAt: '2026-06-27T00:00:00.000Z',
      receivedAt: '2026-06-27T00:00:01.000Z',
      payload: { orderId: 'ord-1' },
      headers: { 'x-event-source': 'lyt' }
    }
  ]
  const service = { getEventEnvelopes: (_s: string | undefined) => Promise.resolve(mockEnvelopes) } as never
  const controller = new IntegrationOrchestrationController(service)
  const result = await controller.getEvents({ source: 'lyt' })
  assert.equal((result as any).length, 1)
  assert.deepStrictEqual((result as any)[0].eventName, 'order.placed')
})

it('integration-orchestration getEvents calls service without source when query empty', async () => {
  const mockEnvelopes = [
    {
      envelopeId: 'evt-2',
      eventName: 'payment.received',
      source: 'payment',
      aggregateId: 'agg-2',
      idempotencyKey: 'ik-2',
      occurredAt: '2026-06-27T00:00:00.000Z',
      receivedAt: '2026-06-27T00:00:01.000Z',
      payload: { amount: 100 },
      headers: { 'x-event-source': 'payment' }
    }
  ]
  let passedSource: string | undefined = 'default'
  const service = {
    getEventEnvelopes: (s: string | undefined) => {
      passedSource = s
      return Promise.resolve(mockEnvelopes)
    }
  } as never
  const controller = new IntegrationOrchestrationController(service)
  await controller.getEvents({})
  assert.equal(passedSource, undefined)
})

// ── idempotency-records (GET) ──

it('integration-orchestration controller idempotency-records route has GET metadata', () => {
  const method = Reflect.getMetadata(
    'method',
    IntegrationOrchestrationController.prototype.getIdempotencyRecords
  )
  const path = Reflect.getMetadata(
    'path',
    IntegrationOrchestrationController.prototype.getIdempotencyRecords
  )
  assert.equal(method, 0) // GET
  assert.equal(path, 'idempotency-records')
})

it('integration-orchestration getIdempotencyRecords delegates to service', async () => {
  const mockRecords = [
    {
      key: 'lyt:evt-1',
      source: 'lyt',
      eventId: 'agg-1',
      eventType: 'order.placed',
      firstSeenAt: '2026-06-27T00:00:01.000Z',
      envelopeId: 'env-1',
      status: 'accepted' as const,
      payloadChecksum: 'abc123'
    }
  ]
  const service = { getIdempotencyRecords: (_s: string | undefined) => Promise.resolve(mockRecords) } as never
  const controller = new IntegrationOrchestrationController(service)
  const result = await controller.getIdempotencyRecords({ source: 'lyt' })
  assert.equal((result as any).length, 1)
  assert.deepStrictEqual((result as any)[0].key, 'lyt:evt-1')
})

// ── events (POST) ──

it('integration-orchestration controller publishEvent route has POST metadata', () => {
  const method = Reflect.getMetadata(
    'method',
    IntegrationOrchestrationController.prototype.publishEvent
  )
  const path = Reflect.getMetadata(
    'path',
    IntegrationOrchestrationController.prototype.publishEvent
  )
  assert.equal(method, 1) // POST
  assert.equal(path, 'events')
})

it('integration-orchestration publishEvent delegates to service', async () => {
  const mockResult = {
    status: 'accepted',
    envelope: {
      envelopeId: 'env-new',
      eventName: 'order.placed',
      source: 'lyt',
      aggregateId: 'agg-1',
      idempotencyKey: 'ik-new',
      occurredAt: '2026-06-27T00:00:00.000Z',
      receivedAt: '2026-06-27T00:00:01.000Z',
      payload: { orderId: 'ord-1' },
      headers: {}
    },
    persistedEventId: 'env-new',
    guarantees: ['signature-verified-before-accept', 'idempotency-recorded', 'retry-ready']
  }
  const service = {
    publishEvent: (
      _eventName: string,
      _payload: Record<string, unknown>,
      _opts: { source?: string; aggregateId?: string; idempotencyKey?: string }
    ) => Promise.resolve(mockResult)
  } as never
  const controller = new IntegrationOrchestrationController(service)
  const body = {
    eventName: 'order.placed',
    payload: { orderId: 'ord-1' },
    source: 'lyt',
    aggregateId: 'agg-1',
    idempotencyKey: 'ik-new'
  }
  const result = await controller.publishEvent(body)
  assert.deepStrictEqual((result as any).status, 'accepted')
  assert.ok((result as any).persistedEventId)
})

it('integration-orchestration publishEvent handles duplicate gracefully', async () => {
  const mockResult = {
    status: 'duplicate',
    envelope: {
      envelopeId: 'env-existing',
      eventName: 'order.placed',
      source: 'lyt',
      aggregateId: 'agg-1',
      idempotencyKey: 'ik-dup',
      occurredAt: '2026-06-27T00:00:00.000Z',
      receivedAt: '2026-06-27T00:00:01.000Z',
      payload: { orderId: 'ord-1' },
      headers: {}
    },
    persistedEventId: 'env-existing',
    guarantees: ['database-unique-idempotency-key', 'duplicate-detected-during-create']
  }
  const service = {
    publishEvent: (
      _eventName: string,
      _payload: Record<string, unknown>,
      _opts: { source?: string; aggregateId?: string; idempotencyKey?: string }
    ) => Promise.resolve(mockResult)
  } as never
  const controller = new IntegrationOrchestrationController(service)
  const body = {
    eventName: 'order.placed',
    payload: { orderId: 'ord-1' },
    source: 'lyt',
    idempotencyKey: 'ik-dup'
  }
  const result = await controller.publishEvent(body)
  assert.deepStrictEqual((result as any).status, 'duplicate')
  assert.deepStrictEqual((result as any).persistedEventId, 'env-existing')
})

// ── webhooks/:source/ingest (POST) ──

it('integration-orchestration controller webhooks/:source/ingest route has POST metadata', () => {
  const method = Reflect.getMetadata(
    'method',
    IntegrationOrchestrationController.prototype.ingestWebhook
  )
  const path = Reflect.getMetadata(
    'path',
    IntegrationOrchestrationController.prototype.ingestWebhook
  )
  assert.equal(method, 1) // POST
  assert.equal(path, 'webhooks/:source/ingest')
})

it('integration-orchestration ingestWebhook delegates to service', async () => {
  const mockResult = {
    status: 'accepted' as const,
    source: 'lyt',
    signatureVerified: true,
    idempotency: {
      key: 'lyt:evt-1',
      source: 'lyt',
      eventId: 'agg-1',
      eventType: 'lyt.webhook.received',
      firstSeenAt: '2026-06-27T00:00:01.000Z',
      envelopeId: 'env-1',
      status: 'accepted' as const,
      payloadChecksum: 'abc123'
    },
    envelope: {
      envelopeId: 'env-1',
      eventName: 'lyt.webhook.received',
      source: 'lyt',
      aggregateId: 'agg-1',
      idempotencyKey: 'ik-1',
      occurredAt: '2026-06-27T00:00:00.000Z',
      receivedAt: '2026-06-27T00:00:01.000Z',
      payload: { result: 'ok' },
      headers: {
        'x-webhook-source': 'lyt',
        'x-webhook-signature': 'sha256=abc',
        'x-webhook-timestamp': '1719446400000'
      }
    },
    pipeline: ['signature-check', 'idempotency-check', 'event-envelope', 'audit-log']
  }
  const service = {
    acceptWebhook: (_source: string, _input: unknown) => Promise.resolve(mockResult)
  } as never
  const controller = new IntegrationOrchestrationController(service)
  const body = {
    eventId: 'ext-evt-1',
    eventType: 'lyt.webhook.received',
    payload: { result: 'ok' },
    signature: 'sha256=abc',
    timestamp: '1719446400000',
    rawBody: '{"result":"ok"}'
  }
  const result = await controller.ingestWebhook('lyt', body)
  assert.deepStrictEqual((result as any).status, 'accepted')
  assert.deepStrictEqual((result as any).source, 'lyt')
  assert.deepStrictEqual((result as any).signatureVerified, true)
})

it('integration-orchestration ingestWebhook returns duplicate for replayed webhook', async () => {
  const mockResult = {
    status: 'duplicate' as const,
    source: 'lyt',
    signatureVerified: true,
    idempotency: {
      key: 'lyt:ext-evt-1',
      source: 'lyt',
      eventId: 'agg-1',
      eventType: 'lyt.webhook.received',
      firstSeenAt: '2026-06-27T00:00:01.000Z',
      envelopeId: 'env-existing',
      status: 'accepted' as const,
      payloadChecksum: 'abc123'
    },
    pipeline: ['signature-check', 'idempotency-check', 'audit-log', 'skip-duplicate']
  }
  const service = {
    acceptWebhook: (_source: string, _input: unknown) => Promise.resolve(mockResult)
  } as never
  const controller = new IntegrationOrchestrationController(service)
  const body = {
    eventId: 'ext-evt-1',
    eventType: 'lyt.webhook.received',
    payload: { result: 'ok' },
    signature: 'sha256=abc',
    timestamp: '1719446400000'
  }
  const result = await controller.ingestWebhook('lyt', body)
  assert.deepStrictEqual((result as any).status, 'duplicate')
  assert.deepStrictEqual((result as any).source, 'lyt')
  assert.deepStrictEqual((result as any).pipeline?.includes('skip-duplicate'), true)
})
