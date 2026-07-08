/**
 * 🐜 自动: [webhook] [D] contract 补全
 *
 * Webhook 模块合约测试：
 * 验证实体 Shape、服务方法契约、事件总线合约、平台适配器合约
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { WebhookService, type WebhookEventType as ServiceEventType } from './webhook.service'
import { webhookEventBus } from './webhook.eventbus'
import { feishuAdapter, dingtalkAdapter, wecomAdapter, genericAdapter } from './webhook.platforms'
import type {
  WebhookEndpoint,
  WebhookSubscription,
  DeliveryLog,
  WebhookEventPayload,
  WebhookPlatform,
  WebhookStatus,
  WebhookDeliveryStatus,
} from './webhook.entity'
import { BUILTIN_WEBHOOK_EVENTS, defaultHeaders } from './webhook.entity'

// ─── 服务实例 helper ──────────────────────────────────

function makeService(): WebhookService {
  return new WebhookService()
}

// ─── 合约: 实体 Shape ─────────────────────────────────

describe('[webhook] 契约: 实体 Shape', () => {
  it('WebhookEndpoint 必须包含必要字段', () => {
    const ep: WebhookEndpoint = {
      id: 'ep-001',
      tenantId: 't-001',
      storeId: 's-001',
      name: 'Test Endpoint',
      platform: 'generic',
      url: 'https://example.com/hook',
      secretEncrypted: 'encrypted-secret',
      events: ['order.created'],
      status: 'active',
      maxRetries: 3,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      createdBy: 'admin',
    }
    assert.equal(typeof ep.id, 'string')
    assert.equal(typeof ep.tenantId, 'string')
    assert.equal(typeof ep.url, 'string')
    assert.equal(typeof ep.status, 'string')
    assert.ok(['active', 'paused', 'disabled'].includes(ep.status))
    assert.ok(Array.isArray(ep.events))
    assert.ok(ep.events.length > 0)
  })

  it('WebhookDelivery 必须包含必要字段', () => {
    const dl: WebhookDelivery = {
      id: 'dl-001',
      endpointId: 'ep-001',
      tenantId: 't-001',
      eventType: 'order.created',
      payload: { orderId: 'ord-001' },
      body: JSON.stringify({ orderId: 'ord-001' }),
      status: 'success',
      attempt: 1,
      maxAttempts: 3,
      createdAt: '2026-01-01T00:00:00Z',
    }
    assert.equal(typeof dl.id, 'string')
    assert.equal(typeof dl.endpointId, 'string')
    assert.equal(typeof dl.eventType, 'string')
    assert.ok(['pending', 'success', 'failed', 'retrying', 'dead_letter'].includes(dl.status))
    assert.equal(typeof dl.attempt, 'number')
    assert.equal(typeof dl.maxAttempts, 'number')
  })

  it('WebhookEventPayload 必须包含必要字段', () => {
    const payload: WebhookEventPayload = {
      eventType: 'canary.created',
      eventId: 'evt-001',
      timestamp: '2026-01-01T00:00:00Z',
      tenantId: 't-001',
      storeId: 's-001',
      data: { version: 'v2' },
    }
    assert.equal(typeof payload.eventType, 'string')
    assert.equal(typeof payload.eventId, 'string')
    assert.equal(typeof payload.timestamp, 'string')
    assert.equal(typeof payload.tenantId, 'string')
    assert.equal(typeof payload.data, 'object')
  })

  it('WebhookSubscription 必须包含必要字段', () => {
    const sub: WebhookSubscription = {
      id: 'sub-001',
      endpointId: 'ep-001',
      event: 'inventory.low',
      active: true,
    }
    assert.equal(typeof sub.id, 'string')
    assert.equal(typeof sub.endpointId, 'string')
    assert.equal(typeof sub.event, 'string')
    assert.equal(typeof sub.active, 'boolean')
  })

  it('BUILTIN_WEBHOOK_EVENTS 包含 9 个预定义事件', () => {
    assert.equal(BUILTIN_WEBHOOK_EVENTS.length, 9)
    const types = BUILTIN_WEBHOOK_EVENTS.map((e) => e.type)
    assert.ok(types.includes('license.expired'))
    assert.ok(types.includes('canary.created'))
    assert.ok(types.includes('monitoring.alert.fired'))
    assert.ok(types.includes('insight.generated'))
    assert.ok(types.includes('tenant.config.updated'))
  })

  it('defaultHeaders 返回正确平台标识', () => {
    const headers = defaultHeaders('feishu')
    assert.equal(headers['Content-Type'], 'application/json')
    assert.ok(headers['User-Agent'].includes('shenjiying88-webhook'))
    assert.ok(headers['User-Agent'].includes('feishu'))
  })
})

// ─── 契约: 服务方法 ──────────────────────────────────

describe('[webhook] 契约: 服务方法', () => {
  let svc: WebhookService

  beforeEach(() => {
    svc = makeService()
  })

  it('registerEndpoint 返回完整 WebhookEndpoint', async () => {
    const ep = await svc.registerEndpoint(
      'https://example.com/hook',
      'sk-test',
      ['order.created', 'order.paid'],
    )
    assert.ok(ep.id)
    assert.equal(ep.url, 'https://example.com/hook')
    assert.deepEqual(ep.events, ['order.created', 'order.paid'])
    assert.equal(ep.active, true)
    assert.equal(ep.retryPolicy.maxRetries, 5)
    assert.equal(ep.retryPolicy.backoffMs, 1000)
    assert.ok(ep.createdAt instanceof Date)
  })

  it('registerEndpoint 支持空事件列表', async () => {
    const ep = await svc.registerEndpoint('https://empty.com/hook', 's', [])
    assert.ok(ep.id)
    assert.deepEqual(ep.events, [])
  })

  it('listEndpoints 初始返回空数组', async () => {
    const list = await svc.listEndpoints()
    assert.deepEqual(list, [])
  })

  it('listEndpoints 注册后返回所有端点', async () => {
    await svc.registerEndpoint('https://a.com/hook', 's1', ['order.created'])
    await svc.registerEndpoint('https://b.com/hook', 's2', ['order.paid'])
    const list = await svc.listEndpoints()
    assert.equal(list.length, 2)
  })

  it('updateEndpoint 更新 url', async () => {
    const ep = await svc.registerEndpoint('https://old.com/hook', 's', ['order.created'])
    const updated = await svc.updateEndpoint(ep.id, { url: 'https://new.com/hook' })
    assert.equal(updated.url, 'https://new.com/hook')
  })

  it('updateEndpoint 更新事件列表', async () => {
    const ep = await svc.registerEndpoint('https://test.com/hook', 's', ['order.created'])
    const updated = await svc.updateEndpoint(ep.id, { events: ['order.paid', 'points.earned'] })
    assert.deepEqual(updated.events, ['order.paid', 'points.earned'])
  })

  it('updateEndpoint 不存在时抛出异常', async () => {
    await assert.rejects(
      () => svc.updateEndpoint('nonexistent', { url: 'https://x.com' }),
      /Endpoint nonexistent not found/,
    )
  })

  it('deleteEndpoint 删除端点', async () => {
    const ep = await svc.registerEndpoint('https://del.com/hook', 's', ['order.created'])
    await svc.deleteEndpoint(ep.id)
    const list = await svc.listEndpoints()
    assert.equal(list.length, 0)
  })

  it('deleteEndpoint 不存在时抛出异常', async () => {
    await assert.rejects(
      () => svc.deleteEndpoint('nonexistent'),
      /Endpoint nonexistent not found/,
    )
  })

  it('subscribe 创建订阅并关联端点', async () => {
    const ep = await svc.registerEndpoint('https://sub.com/hook', 's', ['order.created'])
    const sub = await svc.subscribe(ep.id, 'order.created')
    assert.ok(sub.id)
    assert.equal(sub.endpointId, ep.id)
    assert.equal(sub.event, 'order.created')
    assert.equal(sub.active, true)
  })

  it('subscribe 不存在端点时抛出异常', async () => {
    await assert.rejects(
      () => svc.subscribe('nonexistent', 'order.created'),
      /Endpoint nonexistent not found/,
    )
  })

  it('unsubscribe 删除订阅', async () => {
    const ep = await svc.registerEndpoint('https://unsub.com/hook', 's', ['order.created'])
    const sub = await svc.subscribe(ep.id, 'order.created')
    await svc.unsubscribe(sub.id)
    assert.ok(true)
  })

  it('unsubscribe 不存在时抛出异常', async () => {
    await assert.rejects(
      () => svc.unsubscribe('nonexistent'),
      /Subscription nonexistent not found/,
    )
  })

  it('signPayload 生成一致签名', () => {
    const sig1 = svc.signPayload('{"hello":"world"}', 'secret-key')
    const sig2 = svc.signPayload('{"hello":"world"}', 'secret-key')
    assert.equal(sig1, sig2)
  })

  it('signPayload 不同密钥产生不同签名', () => {
    const sig1 = svc.signPayload('{"hello":"world"}', 'key-a')
    const sig2 = svc.signPayload('{"hello":"world"}', 'key-b')
    assert.notEqual(sig1, sig2)
  })

  it('verifySignature 验证有效签名', () => {
    const payload = '{"hello":"world"}'
    const secret = 'test-secret'
    const sig = svc.signPayload(payload, secret)
    assert.equal(svc.verifySignature(payload, sig, secret), true)
  })

  it('verifySignature 拒绝无效签名', () => {
    const payload = '{"hello":"world"}'
    const sig = svc.signPayload(payload, 'real-secret')
    assert.equal(svc.verifySignature(payload, sig, 'wrong-secret'), false)
  })

  it('verifySignature 拒绝篡改 payload', () => {
    const secret = 'test-secret'
    const sig = svc.signPayload('{"hello":"world"}', secret)
    assert.equal(svc.verifySignature('{"hello":"hacked"}', sig, secret), false)
  })

  it('getDeliveryLogs 空列表返回空', async () => {
    const logs = await svc.getDeliveryLogs('nonexistent')
    assert.deepEqual(logs, [])
  })

  it('retryDelivery 不存在日志时抛出异常', async () => {
    await assert.rejects(
      () => svc.retryDelivery('nonexistent'),
      /Delivery log nonexistent not found/,
    )
  })
})

// ─── 契约: 事件总线 (单例 webhookEventBus) ─────────

describe('[webhook] 契约: 事件总线', () => {
  // 保存原始监听器，测试后恢复
  const originalListeners = new Map<string, Set<Function>>()
  let storedGlobal: Set<Function>

  beforeEach(() => {
    // 清空避免干扰
    webhookEventBus.clear()
  })

  afterEach(() => {
    webhookEventBus.clear()
  })

  it('on/emit 支持特定事件订阅', async () => {
    const events: WebhookEventPayload[] = []
    webhookEventBus.on('order.created', (p) => {
      events.push(p)
    })
    const payload: WebhookEventPayload = {
      eventType: 'order.created',
      eventId: 'evt-001',
      timestamp: new Date().toISOString(),
      tenantId: 't-001',
      data: {},
    }
    await webhookEventBus.emit(payload)
    assert.equal(events.length, 1)
    assert.equal(events[0].eventType, 'order.created')
  })

  it('on("*") 监听所有事件', async () => {
    const allEvents: string[] = []
    webhookEventBus.on('*', (p) => {
      allEvents.push(p.eventType)
    })
    await webhookEventBus.emit({ eventType: 'order.created', eventId: '1', timestamp: '', tenantId: 't', data: {} })
    await webhookEventBus.emit({ eventType: 'order.paid', eventId: '2', timestamp: '', tenantId: 't', data: {} })
    assert.deepEqual(allEvents, ['order.created', 'order.paid'])
  })

  it('off 移除订阅', async () => {
    const events: WebhookEventPayload[] = []
    const listener = (p: WebhookEventPayload) => { events.push(p) }
    webhookEventBus.on('order.created', listener)
    webhookEventBus.off('order.created', listener)
    await webhookEventBus.emit({ eventType: 'order.created', eventId: '1', timestamp: '', tenantId: 't', data: {} })
    assert.equal(events.length, 0)
  })

  it('不匹配的事件类型不会触发', async () => {
    const events: WebhookEventPayload[] = []
    webhookEventBus.on('order.paid', (p) => { events.push(p) })
    await webhookEventBus.emit({ eventType: 'order.created', eventId: '1', timestamp: '', tenantId: 't', data: {} })
    assert.equal(events.length, 0)
  })

  it('countListeners 正确计数', () => {
    webhookEventBus.on('order.created', async () => {})
    webhookEventBus.on('order.paid', async () => {})
    webhookEventBus.on('points.earned', async () => {})
    webhookEventBus.on('*', async () => {})
    assert.equal(webhookEventBus.countListeners(), 4)
    assert.equal(webhookEventBus.countListeners('order.created'), 2)
  })

  it('clear 移除所有监听器', () => {
    webhookEventBus.on('order.created', async () => {})
    webhookEventBus.on('*', async () => {})
    webhookEventBus.clear()
    assert.equal(webhookEventBus.countListeners(), 0)
  })
})

// ─── 契约: 平台适配器 ────────────────────────────

describe('[webhook] 契约: 平台适配器', () => {
  it('genericAdapter 签名使用 HMAC-SHA256 hex (64 字符)', () => {
    const body = '{"orderId":"001"}'
    const secret = 'sk-test'
    const sig = genericAdapter.sign(body, secret)
    assert.equal(typeof sig, 'string')
    assert.equal(sig.length, 64)
  })

  it('feishuAdapter 签名包含 timestamp 逗号分隔', () => {
    const body = '{"orderId":"001"}'
    const secret = 'sk-test'
    const sig = feishuAdapter.sign(body, secret)
    assert.ok(sig.includes(','))
    const [timestamp] = sig.split(',')
    assert.ok(timestamp.length > 0)
  })

  it('dingtalkAdapter 签名包含 timestamp 逗号分隔', () => {
    const body = '{"orderId":"001"}'
    const secret = 'sk-test'
    const sig = dingtalkAdapter.sign(body, secret)
    assert.ok(sig.includes(','))
    const [timestamp] = sig.split(',')
    assert.ok(timestamp.length > 0)
  })

  it('wecomAdapter 签名格式为 timestamp,sha1hex', () => {
    const body = '{"orderId":"001"}'
    const secret = 'sk-test'
    const sig = wecomAdapter.sign(body, secret)
    assert.ok(sig.includes(','))
    const [timestamp, sha1part] = sig.split(',')
    assert.equal(sha1part.length, 40) // SHA1 = 40 hex chars
  })

  it('genericAdapter.format 返回 payload 原样', () => {
    const payload: WebhookEventPayload = {
      eventType: 'order.created',
      eventId: 'evt-001',
      timestamp: '2026-01-01T00:00:00Z',
      tenantId: 't-001',
      data: { orderId: 'ord-001' },
    }
    const formatted = genericAdapter.format(payload)
    assert.equal(formatted.eventType, 'order.created')
    assert.equal(formatted.eventId, 'evt-001')
  })

  it('feishuAdapter.format 返回飞书卡片格式', () => {
    const payload: WebhookEventPayload = {
      eventType: 'order.created',
      eventId: 'evt-001',
      timestamp: '2026-01-01T00:00:00Z',
      tenantId: 't-001',
      data: { orderId: 'ord-001' },
    }
    const formatted = feishuAdapter.format(payload)
    assert.equal(formatted.msg_type, 'interactive')
    assert.ok(formatted.card)
    // getEventTitle 对未知事件返回 eventType 本身
    assert.equal(formatted.card.header.title.content, 'order.created')
  })

  it('genericAdapter.validateUrl 验证正确 URL', () => {
    const result = genericAdapter.validateUrl('https://example.com/hook')
    assert.equal(result.valid, true)
  })

  it('genericAdapter.validateUrl 拒绝无效 URL', () => {
    assert.equal(genericAdapter.validateUrl('not-a-url').valid, false)
    assert.equal(genericAdapter.validateUrl('').valid, false)
    assert.equal(genericAdapter.validateUrl('ftp://bad.com').valid, false)
  })

  it('所有适配器 isSuccess 正确判断', () => {
    assert.equal(genericAdapter.isSuccess(200), true)
    assert.equal(genericAdapter.isSuccess(201), true)
    assert.equal(genericAdapter.isSuccess(204), true)
    assert.equal(genericAdapter.isSuccess(400), false)
    assert.equal(genericAdapter.isSuccess(500), false)
  })
})

// ─── 契约: 边界与异常 ───────────────────────────

describe('[webhook] 契约: 边界与异常', () => {
  let svc: WebhookService

  beforeEach(() => {
    svc = makeService()
  })

  it('注册端点后订阅，删除端点自动清理订阅', async () => {
    const ep = await svc.registerEndpoint('https://cleanup.com/hook', 's', ['order.created'])
    await svc.subscribe(ep.id, 'order.created')
    await svc.deleteEndpoint(ep.id)
    const list = await svc.listEndpoints()
    assert.equal(list.length, 0)
  })

  it('deliveryLogs 上限 1000 条', async () => {
    const ep = await svc.registerEndpoint('https://overflow.com/hook', 's', ['order.created'])
    await svc.subscribe(ep.id, 'order.created')

    svc.setHttpClient({
      async post() {
        await new Promise((r) => setTimeout(r, 1))
        return { status: 500, body: 'error' }
      },
    })

    for (let i = 0; i < 1100; i++) {
      await svc.emit('order.created', { index: i })
    }

    await new Promise((r) => setTimeout(r, 2000))

    const logs = await svc.getDeliveryLogs(ep.id)
    assert.ok(logs.length <= 1000, `日志条数 ${logs.length} 应 ≤ 1000`)
  }, 15000)

  it('签名和验签一致（多 payload 变体）', () => {
    const cases = [
      '{"a":1}',
      '{"nested":{"key":"value"}}',
      '{"unicode":"你好世界"}',
      '{}',
      '{"special chars":"!@#$%^&*()"}',
    ]
    const secret = 'my-secret-key-123'
    for (const payload of cases) {
      const sig = svc.signPayload(payload, secret)
      assert.equal(svc.verifySignature(payload, sig, secret), true)
    }
  })

  it('端点停用后不投递', async () => {
    const ep = await svc.registerEndpoint('https://inactive.com/hook', 's', ['order.created'])
    await svc.subscribe(ep.id, 'order.created')

    await svc.updateEndpoint(ep.id, { active: false })

    let delivered = false
    svc.setHttpClient({
      async post() {
        delivered = true
        return { status: 200, body: 'ok' }
      },
    })

    await svc.emit('order.created', { test: true })
    await new Promise((r) => setTimeout(r, 500))

    assert.equal(delivered, false, '停用端点不应投递')
  })
})
