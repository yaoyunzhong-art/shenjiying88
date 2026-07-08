import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { IntegrationOrchestrationController } from './integration-orchestration.controller'

// ── Helpers ──
function mockIntegrationOrchService() {
  return {
    getWebhookSourceCatalog: () => [{ source: 'lyt', handler: 'lyt-webhook-handler' }, { source: 'payment', handler: 'payment-handler' }],
    getEventEnvelopes: async () => ({ events: [{ eventName: 'booking-created', aggregateId: 'b-001' }] }),
    getIdempotencyRecords: async () => ({ records: [{ idempotencyKey: 'idem-001', status: 'consumed' }] }),
    publishEvent: async () => ({ eventName: 'booking-created', status: 'published', idempotencyKey: 'idem-002' }),
    acceptWebhook: async () => ({ source: 'lyt', status: 'accepted', handlerResult: {} }),
    getDescriptor: () => ({ module: 'integration-orchestration' })
  } as any
}

function createIntOrchController(mockSvc = mockIntegrationOrchService()) {
  return new IntegrationOrchestrationController(mockSvc)
}

const ROLES = {
  Guide: '🎮导玩员',
  TenantAdmin: '👔店长',
  Operations: '🎯运行专员',
  Marketing: '📢营销'
}

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} integration-orchestration 角色测试`, () => {
  it('导玩员可以获取 webhook sources', () => {
    const ctrl = createIntOrchController()
    const result = ctrl.getWebhookSources()
    assert.ok(Array.isArray(result))
    assert.ok(result.length >= 2)
  })

  it('导玩员可以获取 events', async () => {
    const ctrl = createIntOrchController()
    const result = await ctrl.getEvents({ source: 'lyt' }) as { events: unknown[] }
    assert.ok(result.events)
  })

  it('导玩员可以 publish event（设备事件）', async () => {
    const svc = mockIntegrationOrchService()
    svc.publishEvent = async () => ({ eventName: 'device-online', status: 'published', idempotencyKey: 'idem-dev-001' })
    const ctrl = createIntOrchController(svc)
    const result = await ctrl.publishEvent({
      eventName: 'device-online',
      payload: { deviceId: 'dev-001', storeId: 's-001' },
      source: 'lyt-device',
      aggregateId: 'dev-001',
      idempotencyKey: 'idem-dev-001'
    }) as { eventName: string; status: string }
    assert.equal(result.eventName, 'device-online')
    assert.equal(result.status, 'published')
  })
})

// ── 👔店长 ──
describe(`${ROLES.TenantAdmin} integration-orchestration 角色测试`, () => {
  it('店长可以获取 webhook sources', () => {
    const ctrl = createIntOrchController()
    const result = ctrl.getWebhookSources()
    assert.ok(result.length > 0)
  })

  it('店长可以获取 idempotency records', async () => {
    const ctrl = createIntOrchController()
    const result = await ctrl.getIdempotencyRecords({ source: 'lyt' }) as { records: unknown[] }
    assert.ok(result.records)
  })

  it('店长可以 publish event', async () => {
    const ctrl = createIntOrchController()
    const result = await ctrl.publishEvent({
      eventName: 'tenant-config-updated',
      payload: { tenantId: 't-1', key: 'max-retry' },
      source: 'admin-web',
      aggregateId: 't-1',
      idempotencyKey: 'idem-config-001'
    })
    assert.ok(result)
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} integration-orchestration 角色测试`, () => {
  it('运营专员可以获取 events（监控视角）', async () => {
    const ctrl = createIntOrchController()
    const result = await ctrl.getEvents({ source: 'payment' }) as { events: unknown[] }
    assert.ok(result.events)
  })

  it('运营专员可以 publish event（运维事件）', async () => {
    const ctrl = createIntOrchController()
    const result = await ctrl.publishEvent({
      eventName: 'retry-policy-triggered',
      payload: { resource: 'booking-service', attempt: 3 },
      source: 'resilience-ops',
      aggregateId: 'b-001',
      idempotencyKey: 'idem-retry-001'
    }) as { idempotencyKey: string }
    assert.ok(result.idempotencyKey)
  })

  it('运营专员可以获取 idempotency records', async () => {
    const ctrl = createIntOrchController()
    const result = await ctrl.getIdempotencyRecords({ source: 'payment' }) as { records: unknown[] }
    assert.ok(result.records)
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} integration-orchestration 角色测试`, () => {
  it('营销可以 ingest webhook（通知回调）', async () => {
    const ctrl = createIntOrchController()
    const result = await ctrl.ingestWebhook('lyt', {
      eventId: 'notification-callback',
      payload: { campaignId: 'c-001', status: 'delivered' },
      signature: 'sig-001'
    }) as { source: string; status: string }
    assert.equal(result.source, 'lyt')
    assert.equal(result.status, 'accepted')
  })

  it('营销可以 publish event（营销事件）', async () => {
    const ctrl = createIntOrchController()
    const result = await ctrl.publishEvent({
      eventName: 'campaign-launched',
      payload: { campaignId: 'c-001', targetAudience: 'vip' },
      source: 'marketing-portal',
      aggregateId: 'c-001',
      idempotencyKey: 'idem-campaign-001'
    })
    assert.ok(result)
  })

  it('营销可以获取 webhook sources', () => {
    const ctrl = createIntOrchController()
    const result = ctrl.getWebhookSources()
    assert.ok(Array.isArray(result))
  })
})
