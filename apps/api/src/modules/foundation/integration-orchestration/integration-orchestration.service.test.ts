import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import { IntegrationOrchestrationService } from './integration-orchestration.service'

function makePrisma(overrides: Record<string, unknown> = {}) {
  const store: Record<string, unknown>[] = []
  return {
    domainEvent: {
      store,
      create: async (args: { data: Record<string, unknown> }) => {
        const record = { id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, ...args.data }
        store.push(record)
        return record
      },
      findUnique: async () => null as unknown,
      findMany: async () => [] as unknown[],
      ...overrides
    }
  }
}

function makeTrustGovernance() {
  const audits: string[] = []
  return {
    audits,
    recordAudit: async (eventType: string) => {
      audits.push(eventType)
      return { auditId: `audit_${audits.length}`, eventType }
    }
  }
}

function makeSignature(source: string, timestamp: string, payload: Record<string, unknown>) {
  const secret = source === 'payment' ? 'payment-webhook-secret-v1' : 'lyt-webhook-secret-v2'
  const rawBody = JSON.stringify(payload)
  return `sha256=${createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')}`
}

test('generateSignature produces valid hmac-sha256 signature', () => {
  const prisma = makePrisma()
  const trustGov = makeTrustGovernance()
  const service = new IntegrationOrchestrationService(prisma as never, trustGov as never)
  const timestamp = '1718234567890'
  const signature = service.generateSignature('lyt', timestamp, JSON.stringify({ orderId: 'o-1' }))
  assert.ok(signature.startsWith('sha256='))
  assert.equal(signature.length, 71) // "sha256=" prefix + 64 hex chars
})

test('acceptWebhook rejects missing signature', async () => {
  const prisma = makePrisma()
  const trustGov = makeTrustGovernance()
  const service = new IntegrationOrchestrationService(prisma as never, trustGov as never)
  await assert.rejects(
    () =>
      service.acceptWebhook('lyt', {
        timestamp: String(Date.now()),
        payload: { orderId: 'o-1' }
      }),
    { message: /signature is required/i }
  )
})

test('acceptWebhook rejects invalid timestamp format', async () => {
  const prisma = makePrisma()
  const trustGov = makeTrustGovernance()
  const service = new IntegrationOrchestrationService(prisma as never, trustGov as never)
  await assert.rejects(
    () =>
      service.acceptWebhook('lyt', {
        timestamp: 'not-a-number',
        signature: 'sha256=abc123',
        payload: { orderId: 'o-1' }
      }),
    { message: /timestamp/i }
  )
})

test('acceptWebhook rejects expired timestamp', async () => {
  const prisma = makePrisma()
  const trustGov = makeTrustGovernance()
  const service = new IntegrationOrchestrationService(prisma as never, trustGov as never)
  const oldTimestamp = String(Date.now() - 600_000) // 10 minutes ago, beyond 300s tolerance
  await assert.rejects(
    () =>
      service.acceptWebhook('lyt', {
        timestamp: oldTimestamp,
        signature: 'sha256=abc123',
        payload: { orderId: 'o-1' }
      }),
    { message: /tolerance window/i }
  )
})

test('acceptWebhook rejects wrong signature', async () => {
  const prisma = makePrisma()
  const trustGov = makeTrustGovernance()
  const service = new IntegrationOrchestrationService(prisma as never, trustGov as never)
  const timestamp = String(Date.now())
  await assert.rejects(
    () =>
      service.acceptWebhook('lyt', {
        timestamp,
        signature: 'sha256=0000000000000000000000000000000000000000000000000000000000000000',
        payload: { orderId: 'o-1' }
      }),
    { message: /signature verification failed/i }
  )
})

test('acceptWebhook rejects unknown source', async () => {
  const prisma = makePrisma()
  const trustGov = makeTrustGovernance()
  const service = new IntegrationOrchestrationService(prisma as never, trustGov as never)
  const timestamp = String(Date.now())
  const payload = { orderId: 'o-1' }
  await assert.rejects(
    () =>
      service.acceptWebhook('unknown', {
        timestamp,
        signature: 'sha256=abc123',
        payload
      }),
    { message: /not found/i }
  )
})

test('acceptWebhook handles duplicate webhook (existing idempotency record)', async () => {
  const now = new Date()
  const existingEvent = {
    id: 'evt_dup',
    eventType: 'lyt.webhook.received',
    aggregateId: 'evt-001',
    idempotencyKey: 'lyt:evt-001',
    payload: { orderId: 'o-1001' },
    headers: { 'x-event-source': 'lyt' },
    createdAt: now,
    occurredAt: now,
    updatedAt: now
  }
  const prisma = makePrisma({
    findUnique: async () => existingEvent,
    findMany: async () => [existingEvent] as unknown[]
  })
  const trustGov = makeTrustGovernance()
  const service = new IntegrationOrchestrationService(prisma as never, trustGov as never)
  const timestamp = String(Date.now())
  const payload = { orderId: 'o-1001' }
  const result = await service.acceptWebhook('lyt', {
    eventId: 'evt-001',
    eventType: 'lyt.webhook.received',
    timestamp,
    signature: makeSignature('lyt', timestamp, payload),
    rawBody: JSON.stringify(payload),
    payload
  })

  assert.equal(result.status, 'duplicate')
  assert.equal(result.source, 'lyt')
  assert.ok(result.signatureVerified)
  assert.ok(result.idempotency)
  assert.equal(result.idempotency.key, 'lyt:evt-001')
  assert.ok(result.pipeline.includes('skip-duplicate'))
  assert.equal(trustGov.audits.length, 1)
  assert.equal(trustGov.audits[0], 'foundation.webhook.duplicate')
})

test('acceptWebhook accepts valid first-time webhook', async () => {
  const now = new Date()
  let createdEvent: Record<string, unknown> | null = null
  const prisma = makePrisma({
    create: async (args: { data: Record<string, unknown> }) => {
      createdEvent = { id: `evt_${Date.now()}`, ...args.data, createdAt: now, occurredAt: now }
      return createdEvent
    },
    findUnique: async () => createdEvent
  })
  const trustGov = makeTrustGovernance()
  const service = new IntegrationOrchestrationService(prisma as never, trustGov as never)
  const timestamp = String(Date.now())
  const payload = { orderId: 'o-2001', status: 'paid' }
  const result = await service.acceptWebhook('lyt', {
    eventId: 'evt-2001',
    eventType: 'lyt.webhook.received',
    timestamp,
    signature: makeSignature('lyt', timestamp, payload),
    rawBody: JSON.stringify(payload),
    payload
  })

  assert.equal(result.status, 'accepted')
  assert.equal(result.source, 'lyt')
  assert.ok(result.signatureVerified)
  assert.ok(result.idempotency)
  assert.ok(result.envelope)
  assert.equal(result.envelope.eventName, 'lyt.webhook.received')
  assert.ok(result.pipeline.includes('event-envelope'))
  assert.ok(result.pipeline.includes('audit-log'))
  assert.ok(trustGov.audits.length >= 2) // publish event audit + webhook accepted audit
})

test('publishEvent creates domain event and returns accepted envelope', async () => {
  const prisma = makePrisma()
  const trustGov = makeTrustGovernance()
  const service = new IntegrationOrchestrationService(prisma as never, trustGov as never)
  const result = await service.publishEvent('order.created', { orderId: 'o-3001' }, { source: 'market' })

  assert.equal(result.status, 'accepted')
  assert.ok(result.persistedEventId)
  assert.ok(result.envelope)
  assert.equal(result.envelope.eventName, 'order.created')
  assert.equal(result.envelope.source, 'market')
  assert.deepEqual(result.envelope.payload, { orderId: 'o-3001' })
  assert.ok(result.envelope.idempotencyKey)
  assert.ok(result.guarantees.includes('signature-verified-before-accept'))
  assert.ok(result.guarantees.includes('idempotency-recorded'))
  assert.equal(trustGov.audits.length, 1)
  assert.equal(trustGov.audits[0], 'foundation.domain-event.published')
})

test('getWebhookSourceCatalog returns known sources', () => {
  const prisma = makePrisma()
  const trustGov = makeTrustGovernance()
  const service = new IntegrationOrchestrationService(prisma as never, trustGov as never)
  const catalog = service.getWebhookSourceCatalog()
  assert.equal(catalog.length, 2)
  assert.deepEqual(
    catalog.map((s) => s.source).sort(),
    ['lyt', 'payment']
  )
  catalog.forEach((entry) => {
    assert.equal(entry.algorithm, 'hmac-sha256')
    assert.ok(typeof entry.toleranceSeconds === 'number')
    assert.ok(typeof entry.description === 'string')
    assert.ok(typeof entry.secretRef === 'string')
  })
})

test('getIdempotencyRecords filters by source', async () => {
  const now = new Date()
  const events = [
    {
      id: 'evt_1',
      eventType: 'lyt.callback',
      aggregateId: 'agg_1',
      idempotencyKey: 'lyt:agg_1',
      payload: {},
      headers: { 'x-event-source': 'lyt' },
      createdAt: now
    },
    {
      id: 'evt_2',
      eventType: 'payment.callback',
      aggregateId: 'agg_2',
      idempotencyKey: 'payment:agg_2',
      payload: {},
      headers: { 'x-event-source': 'payment' },
      createdAt: now
    }
  ]
  const prisma = makePrisma({ findMany: async () => events as unknown[] })
  const trustGov = makeTrustGovernance()
  const service = new IntegrationOrchestrationService(prisma as never, trustGov as never)
  const all = await service.getIdempotencyRecords()
  assert.equal(all.length, 2)
  const lytOnly = await service.getIdempotencyRecords('lyt')
  assert.equal(lytOnly.length, 1)
  assert.equal(lytOnly[0].source, 'lyt')
})

test('getEventEnvelopes filters by source', async () => {
  const now = new Date()
  const events = [
    {
      id: 'evt_1',
      eventType: 'order.created',
      aggregateId: 'agg_1',
      idempotencyKey: 'ik_1',
      payload: { orderId: 'o-1' },
      headers: { 'x-event-source': 'market' },
      occurredAt: now,
      createdAt: now
    },
    {
      id: 'evt_2',
      eventType: 'user.signed_up',
      aggregateId: 'agg_2',
      idempotencyKey: 'ik_2',
      payload: { userId: 'u-1' },
      headers: { 'x-event-source': 'portal' },
      occurredAt: now,
      createdAt: now
    }
  ]
  const prisma = makePrisma({ findMany: async () => events as unknown[] })
  const trustGov = makeTrustGovernance()
  const service = new IntegrationOrchestrationService(prisma as never, trustGov as never)
  const all = await service.getEventEnvelopes()
  assert.equal(all.length, 2)
  const marketOnly = await service.getEventEnvelopes('market')
  assert.equal(marketOnly.length, 1)
  assert.equal(marketOnly[0].eventName, 'order.created')
})

test('getDescriptor returns valid foundation module descriptor', () => {
  const prisma = makePrisma()
  const trustGov = makeTrustGovernance()
  const service = new IntegrationOrchestrationService(prisma as never, trustGov as never)
  const desc = service.getDescriptor()
  assert.equal(desc.key, 'integration-orchestration')
  assert.equal(typeof desc.name, 'string')
  assert.equal(typeof desc.purpose, 'string')
  assert.ok(Array.isArray(desc.inboundContracts))
  assert.ok(Array.isArray(desc.outboundContracts))
  assert.ok(Array.isArray(desc.capabilities))
  assert.equal(desc.capabilities.length, 4)
  desc.capabilities.forEach((cap) => {
    assert.ok(cap.key)
    assert.ok(cap.name)
    assert.ok(Array.isArray(cap.responsibilities))
    assert.ok(Array.isArray(cap.entrypoints))
    assert.ok(cap.status === 'active')
  })
})
