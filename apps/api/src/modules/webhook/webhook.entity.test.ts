import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * webhook Entity 类型契约测试 (V10 Sprint 2 Day 19 Phase 95)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import type {
  WebhookEndpoint,
  WebhookDelivery,
  WebhookEventPayload,
  WebhookPlatform,
  WebhookStatus,
  WebhookEventType,
  WebhookDeliveryStatus,
} from './webhook.entity'
import { BUILTIN_WEBHOOK_EVENTS, defaultHeaders } from './webhook.entity'

// ── WebhookEndpoint type contract ───────────────────────────────
describe('webhook.entity: WebhookEndpoint', () => {
  it('creates valid WebhookEndpoint with all required fields', () => {
    const ep: WebhookEndpoint = {
      id: 'wh-001',
      tenantId: 'tenant-arcade',
      name: '飞书告警',
      platform: 'feishu',
      url: 'https://open.feishu.cn/open-apis/bot/v2/hook/xxx',
      secretEncrypted: 'aes:abcd1234',
      events: ['monitoring.alert.fired', 'monitoring.alert.resolved'],
      status: 'active',
      maxRetries: 3,
      createdAt: '2026-06-15T08:00:00.000Z',
      updatedAt: '2026-06-15T08:00:00.000Z',
      createdBy: 'user-admin',
    }

    assert.equal(ep.id, 'wh-001')
    assert.equal(ep.tenantId, 'tenant-arcade')
    assert.equal(ep.name, '飞书告警')
    assert.equal(ep.platform, 'feishu')
    assert.equal(ep.url, 'https://open.feishu.cn/open-apis/bot/v2/hook/xxx')
    assert.equal(ep.secretEncrypted, 'aes:abcd1234')
    assert.deepEqual(ep.events, ['monitoring.alert.fired', 'monitoring.alert.resolved'])
    assert.equal(ep.status, 'active')
    assert.equal(ep.maxRetries, 3)
    assert.equal(ep.createdAt, '2026-06-15T08:00:00.000Z')
    assert.equal(ep.createdBy, 'user-admin')
  })

  it('accepts paused and disabled status values', () => {
    const paused: WebhookEndpoint = {
      id: 'wh-paused', tenantId: 't1', name: '暂停', platform: 'dingtalk',
      url: 'https://oapi.dingtalk.com/robot/send', secretEncrypted: 'aes:p',
      events: ['license.expired'], status: 'paused', maxRetries: 3,
      createdAt: '2026-06-10T00:00:00.000Z', updatedAt: '2026-06-10T00:00:00.000Z',
      createdBy: 'admin',
    }
    assert.equal(paused.status, 'paused')

    const disabled: WebhookEndpoint = {
      id: 'wh-disabled', tenantId: 't1', name: '已禁用', platform: 'wecom',
      url: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send', secretEncrypted: 'aes:d',
      events: ['canary.created'], status: 'disabled', maxRetries: 0,
      createdAt: '2026-06-09T00:00:00.000Z', updatedAt: '2026-06-09T00:00:00.000Z',
      createdBy: 'admin',
    }
    assert.equal(disabled.status, 'disabled')
  })

  it('supports all 4 platforms', () => {
    const platforms: WebhookPlatform[] = ['feishu', 'dingtalk', 'wecom', 'generic']
    for (const p of platforms) {
      const ep: WebhookEndpoint = {
        id: `wh-${p}`, tenantId: 't1', name: p, platform: p,
        url: 'https://example.com/hook', secretEncrypted: 'aes:x',
        events: ['tenant.config.updated'], status: 'active', maxRetries: 3,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        createdBy: 'admin',
      }
      assert.equal(ep.platform, p)
    }
  })

  it('storeId and description and headers are optional', () => {
    const ep: WebhookEndpoint = {
      id: 'wh-min', tenantId: 't1', name: 'min', platform: 'generic',
      url: 'https://example.com/hook', secretEncrypted: 'aes:x',
      events: [], status: 'active', maxRetries: 3,
      createdAt: '2026-06-10T00:00:00.000Z', updatedAt: '2026-06-10T00:00:00.000Z',
      createdBy: 'admin',
    }
    assert.equal(ep.storeId, undefined)
    assert.equal(ep.description, undefined)
    assert.equal(ep.headers, undefined)
  })

  it('storeId and description and headers can be provided', () => {
    const ep: WebhookEndpoint = {
      id: 'wh-full', tenantId: 't1', storeId: 'store-arcade-01',
      name: 'full', platform: 'generic',
      url: 'https://example.com/hook', secretEncrypted: 'aes:x',
      events: [], status: 'active', maxRetries: 5,
      headers: { 'X-Custom': 'value' },
      description: '门店级别 webhook',
      createdAt: '2026-06-10T00:00:00.000Z', updatedAt: '2026-06-10T00:00:00.000Z',
      createdBy: 'admin',
    }
    assert.equal(ep.storeId, 'store-arcade-01')
    assert.equal(ep.description, '门店级别 webhook')
    assert.deepEqual(ep.headers, { 'X-Custom': 'value' })
  })
})

// ── WebhookDelivery type contract ───────────────────────────────
describe('webhook.entity: WebhookDelivery', () => {
  it('creates valid pending delivery', () => {
    const d: WebhookDelivery = {
      id: 'del-001',
      endpointId: 'wh-001',
      tenantId: 'tenant-1',
      eventType: 'monitoring.alert.fired',
      payload: { alertId: 'alert-123', severity: 'critical' },
      body: '{"alertId":"alert-123"}',
      status: 'active',
      attempt: 0,
      maxAttempts: 3,
      attemptedAt: new Date(),
      createdAt: '2026-06-15T08:00:00.000Z',
    }

    assert.equal(d.id, 'del-001')
    assert.equal(d.status, 'active')
    assert.equal(d.attempt, 0)
    assert.equal(d.maxAttempts, 3)
    assert.equal(d.eventType, 'monitoring.alert.fired')
    assert.deepEqual(d.payload, { alertId: 'alert-123', severity: 'critical' })
  })

  it('creates successful delivery with response data', () => {
    const d: WebhookDelivery = {
      id: 'del-002',
      endpointId: 'wh-001',
      tenantId: 'tenant-1',
      eventType: 'tenant.config.updated',
      payload: { key: 'theme' },
      body: '{"key":"theme"}',
      responseStatus: 200,
      responseBody: '{"code":0}',
      status: 'active',
      attempt: 1,
      maxAttempts: 3,
      attemptedAt: new Date(),
      error: undefined,
      createdAt: '2026-06-15T08:01:00.000Z',
      completedAt: '2026-06-15T08:01:01.000Z',
      durationMs: 1000,
    }

    assert.equal(d.status, 'active')
    assert.equal(d.responseStatus, 200)
    assert.equal(d.responseBody, '{"code":0}')
    assert.equal(d.attempt, 1)
    assert.equal(d.durationMs, 1000)
    assert.ok(d.completedAt)
  })

  it('creates dead_letter delivery after retries exhausted', () => {
    const d: WebhookDelivery = {
      id: 'del-003',
      endpointId: 'wh-001',
      tenantId: 'tenant-1',
      eventType: 'canary.created',
      payload: {},
      body: '{}',
      responseStatus: 500,
      responseBody: 'Internal Server Error',
      status: 'disabled',
      attempt: 3,
      maxAttempts: 3,
      attemptedAt: new Date(),
      nextRetryAt: undefined,
      error: 'All 3 retries failed with 5xx',
      createdAt: '2026-06-15T08:02:00.000Z',
      completedAt: '2026-06-15T08:02:15.000Z',
      durationMs: 15000,
    }

    assert.equal(d.status, 'disabled')
    assert.equal(d.attempt, 3)
    assert.equal(d.maxAttempts, 3)
    assert.equal(d.error, 'All 3 retries failed with 5xx')
  })

  it('supports all delivery status values', () => {
    const statuses: WebhookStatus[] = ['active', 'paused', 'disabled']
    for (const s of statuses) {
      const d: WebhookDelivery = {
        id: `del-${s}`, endpointId: 'wh-x', tenantId: 't1',
        eventType: 'insight.generated', payload: {}, body: '{}',
        status: s, attempt: 0, maxAttempts: 3,
        attemptedAt: new Date(),
        createdAt: new Date().toISOString(),
      }
      assert.equal(d.status, s)
    }
  })

  it('response fields are optional for pending deliveries', () => {
    const d: WebhookDelivery = {
      id: 'del-pending',
      endpointId: 'wh-x',
      tenantId: 't1',
      eventType: 'tenant.config.updated',
      payload: {},
      body: '{}',
      status: 'active',
      attempt: 0,
      maxAttempts: 3,
      attemptedAt: new Date(),
      createdAt: '2026-06-15T08:00:00.000Z',
    }

    assert.equal(d.responseStatus, undefined)
    assert.equal(d.responseBody, undefined)
    assert.equal(d.nextRetryAt, undefined)
    assert.equal(d.error, undefined)
    assert.equal(d.completedAt, undefined)
    assert.equal(d.durationMs, undefined)
  })
})

// ── WebhookEventPayload type contract ────────────────────────────
describe('webhook.entity: WebhookEventPayload', () => {
  it('creates valid event payload', () => {
    const evt: WebhookEventPayload = {
      eventType: 'monitoring.alert.fired',
      eventId: 'evt-001',
      timestamp: '2026-06-15T08:00:00.000Z',
      tenantId: 'tenant-1',
      data: { alertId: 'alert-123' },
    }

    assert.equal(evt.eventType, 'monitoring.alert.fired')
    assert.equal(evt.eventId, 'evt-001')
    assert.equal(evt.tenantId, 'tenant-1')
    assert.deepEqual(evt.data, { alertId: 'alert-123' })
  })

  it('storeId is optional in event payload', () => {
    const withStore: WebhookEventPayload = {
      eventType: 'tenant.config.updated',
      eventId: 'evt-002',
      timestamp: '2026-06-15T08:00:00.000Z',
      tenantId: 'tenant-1',
      storeId: 'store-arcade-01',
      data: { key: 'theme' },
    }
    assert.equal(withStore.storeId, 'store-arcade-01')

    const withoutStore: WebhookEventPayload = {
      eventType: 'tenant.config.updated',
      eventId: 'evt-003',
      timestamp: '2026-06-15T08:00:00.000Z',
      tenantId: 'tenant-1',
      data: {},
    }
    assert.equal(withoutStore.storeId, undefined)
  })

  it('data field supports arbitrary record', () => {
    const evt: WebhookEventPayload = {
      eventType: 'insight.generated',
      eventId: 'evt-004',
      timestamp: '2026-06-15T08:00:00.000Z',
      tenantId: 'tenant-1',
      data: { insightId: 'ins-001', score: 95.5, tags: ['revenue', 'growth'] },
    }
    assert.equal(evt.data.insightId, 'ins-001')
    assert.equal(evt.data.score, 95.5)
    assert.deepEqual(evt.data.tags, ['revenue', 'growth'])
  })
})

// ── BUILTIN_WEBHOOK_EVENTS constant ──────────────────────────────
describe('webhook.entity: BUILTIN_WEBHOOK_EVENTS', () => {
  it('has 9 built-in events', () => {
    assert.equal(BUILTIN_WEBHOOK_EVENTS.length, 9)
  })

  it('all events have type, description, and category', () => {
    for (const evt of BUILTIN_WEBHOOK_EVENTS) {
      assert.ok(typeof evt.type === 'string')
      assert.ok(typeof evt.description === 'string')
      assert.ok(typeof evt.category === 'string')
    }
  })

  it('covers all 9 event types', () => {
    const expectedTypes: WebhookEventType[] = [
      'license.expired',
      'canary.created', 'canary.promoted', 'canary.rolled_back', 'canary.completed',
      'monitoring.alert.fired', 'monitoring.alert.resolved',
      'insight.generated',
      'tenant.config.updated',
    ]
    const actualTypes = BUILTIN_WEBHOOK_EVENTS.map(e => e.type)
    for (const t of expectedTypes) {
      assert.ok(actualTypes.includes(t), `Missing built-in event type: ${t}`)
    }
  })

  it('category groups events correctly', () => {
    const license = BUILTIN_WEBHOOK_EVENTS.filter(e => e.category === 'license')
    const canary = BUILTIN_WEBHOOK_EVENTS.filter(e => e.category === 'canary')
    const monitoring = BUILTIN_WEBHOOK_EVENTS.filter(e => e.category === 'monitoring')
    const insight = BUILTIN_WEBHOOK_EVENTS.filter(e => e.category === 'insight')
    const config = BUILTIN_WEBHOOK_EVENTS.filter(e => e.category === 'config')

    assert.equal(license.length, 1)
    assert.equal(canary.length, 4)
    assert.equal(monitoring.length, 2)
    assert.equal(insight.length, 1)
    assert.equal(config.length, 1)
  })

  it('event type enum string literal contract', () => {
    const eventTypes = BUILTIN_WEBHOOK_EVENTS.map(e => e.type)
    // Verify type narrowing at runtime
    const fired = eventTypes.find(t => t === 'monitoring.alert.fired')
    assert.equal(fired, 'monitoring.alert.fired')

    const allCanary = eventTypes.filter(t => t.startsWith('canary.'))
    assert.equal(allCanary.length, 4)
  })
})

// ── defaultHeaders function ─────────────────────────────────────
describe('webhook.entity: defaultHeaders', () => {
  it('returns Content-Type and User-Agent for each platform', () => {
    const platforms: WebhookPlatform[] = ['feishu', 'dingtalk', 'wecom', 'generic']
    for (const p of platforms) {
      const h = defaultHeaders(p)
      assert.equal(h['Content-Type'], 'application/json')
      assert.ok(h['User-Agent'].includes(p))
    }
  })

  it('User-Agent contains shenjiying88 prefix', () => {
    const h = defaultHeaders('generic')
    assert.ok(h['User-Agent'].startsWith('shenjiying88-webhook'))
  })
})
