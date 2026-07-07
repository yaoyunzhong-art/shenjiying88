/**
 * webhook.service.spec.ts
 * 纯函数式内联测试 — 不 import 生产代码
 * 覆盖: HMAC 签名/验证、过滤器匹配、回退重试间隔计算、事件类型校验、端点管理
 */

import { describe, it, expect } from 'vitest'
import { createHmac, timingSafeEqual } from 'node:crypto'

/* ============================================================
 * 1. 枚举 + 类型定义
 * ============================================================ */

export type WebhookEventType =
  | 'order.created' | 'order.paid' | 'order.refunded'
  | 'points.earned' | 'points.redeemed' | 'points.adjusted'
  | 'coupon.issued' | 'coupon.used' | 'coupon.expired'
  | 'inventory.low' | 'inventory.out' | 'inventory.restock'
  | 'user.registered' | 'user.upgraded'

export interface WebhookEndpoint {
  id: string; url: string; secret: string
  events: WebhookEventType[]; active: boolean
  retryPolicy: { maxRetries: number; backoffMs: number }
  createdAt: Date
}

export interface WebhookSubscription {
  id: string; endpointId: string; event: WebhookEventType
  filters?: Record<string, string>; active: boolean
}

export interface DeliveryLog {
  id: string; subscriptionId: string; event: WebhookEventType
  payload: Record<string, unknown>; attempt: number
  status: 'pending' | 'success' | 'failed'
  responseCode?: number; error?: string
  createdAt: Date; deliveredAt?: Date
}

/* ============================================================
 * 2. Mock 数据工厂
 * ============================================================ */

function makeEndpoint(overrides: Partial<WebhookEndpoint> = {}): WebhookEndpoint {
  return {
    id: `ep-${Math.random().toString(36).slice(2, 8)}`,
    url: 'https://example.com/webhook',
    secret: 'test-secret',
    events: ['order.created', 'order.paid'],
    active: true,
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
    createdAt: new Date(),
    ...overrides,
  }
}

function makeSubscription(overrides: Partial<WebhookSubscription> = {}): WebhookSubscription {
  return {
    id: `sub-${Math.random().toString(36).slice(2, 8)}`,
    endpointId: 'ep-001',
    event: 'order.created',
    active: true,
    ...overrides,
  }
}

/* ============================================================
 * 3. 内联业务逻辑纯函数
 * ============================================================ */

/** HMAC-SHA256 签名 */
function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

/** 验证签名 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = signPayload(payload, secret)
  try {
    return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

/** 过滤器匹配 */
function matchFilters(payload: Record<string, unknown>, filters: Record<string, string>): boolean {
  for (const [key, expectedValue] of Object.entries(filters)) {
    const actualValue = String(payload[key] ?? '')
    if (actualValue !== expectedValue) return false
  }
  return true
}

/** 退避延迟计算（指数退避，上限 64s） */
function computeBackoff(attempt: number, baseMs: number): number {
  return Math.min(baseMs * Math.pow(2, attempt), 64000)
}

/** 本次尝试后是否需要重试 */
function shouldRetry(attempt: number, maxRetries: number, status: 'success' | 'failed'): boolean {
  if (status === 'success') return false
  return attempt < maxRetries
}

/** 事件类型是否在端点订阅列表中 */
function isEventSubscribed(endpoint: WebhookEndpoint, eventType: WebhookEventType): boolean {
  return endpoint.events.includes(eventType)
}

/** 端点是否活跃 */
function isEndpointActive(endpoint: WebhookEndpoint): boolean {
  return endpoint.active
}

/** 获取端点过滤后的订阅列表 */
function getMatchingSubscriptions(
  subscriptions: WebhookSubscription[],
  endpointId: string,
  event: WebhookEventType,
  payload: Record<string, unknown>,
): WebhookSubscription[] {
  return subscriptions.filter(sub => {
    if (sub.endpointId !== endpointId) return false
    if (!sub.active) return false
    if (sub.event !== event) return false
    if (sub.filters && !matchFilters(payload, sub.filters)) return false
    return true
  })
}

/** 构建回调请求头 */
function buildHeaders(secret: string, event: WebhookEventType, body: string): Record<string, string> {
  const signature = signPayload(body, secret)
  return {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature,
    'X-Webhook-Event': event,
  }
}

/** 端点是否存在（用于端点管理） */
function endpointExists(endpoints: Map<string, WebhookEndpoint>, id: string): boolean {
  return endpoints.has(id)
}

/** 删除端点及其附属订阅和日志 */
function deleteEndpoint(
  endpoints: Map<string, WebhookEndpoint>,
  subscriptions: Map<string, WebhookSubscription>,
  id: string,
): { deletedEndpoint: boolean; deletedSubscriptions: number } {
  if (!endpoints.has(id)) {
    throw new Error(`Endpoint ${id} not found`)
  }
  endpoints.delete(id)
  let deletedSubscriptions = 0
  for (const [subId, sub] of subscriptions) {
    if (sub.endpointId === id) {
      subscriptions.delete(subId)
      deletedSubscriptions++
    }
  }
  return { deletedEndpoint: true, deletedSubscriptions }
}

/* ============================================================
 * 4. 测试用例 (≥18)
 * ============================================================ */

describe('webhook — 纯函数业务逻辑', () => {

  /* ---------- 签名与验证 ---------- */
  describe('signPayload / verifySignature', () => {
    it('相同 payload + 相同 secret 应产生相同签名', () => {
      const s1 = signPayload('{"key":"value"}', 'secret')
      const s2 = signPayload('{"key":"value"}', 'secret')
      expect(s1).toBe(s2)
    })

    it('不同 payload 应产生不同签名', () => {
      const s1 = signPayload('payload1', 'secret')
      const s2 = signPayload('payload2', 'secret')
      expect(s1).not.toBe(s2)
    })

    it('不同 secret 应产生不同签名', () => {
      const s1 = signPayload('payload', 'secret1')
      const s2 = signPayload('payload', 'secret2')
      expect(s1).not.toBe(s2)
    })

    it('验证正确签名应返回 true', () => {
      const sig = signPayload('{"orderId":"123"}', 'secret')
      expect(verifySignature('{"orderId":"123"}', sig, 'secret')).toBe(true)
    })

    it('验证错误 secret 应返回 false', () => {
      const sig = signPayload('{"orderId":"123"}', 'secret')
      expect(verifySignature('{"orderId":"123"}', sig, 'wrong-secret')).toBe(false)
    })

    it('空 payload 产生有效签名并可通过验证', () => {
      const sig = signPayload('', 'secret')
      expect(sig).toBeTruthy()
      expect(verifySignature('', sig, 'secret')).toBe(true)
    })

    it('非法签名格式应优雅返回 false', () => {
      expect(verifySignature('payload', 'not-hex', 'secret')).toBe(false)
    })
  })

  /* ---------- 过滤器匹配 ---------- */
  describe('matchFilters', () => {
    it('空过滤器应始终匹配', () => {
      expect(matchFilters({ a: '1' }, {})).toBe(true)
    })

    it('匹配的键值对应返回 true', () => {
      expect(matchFilters({ storeId: 'store-001', orderId: 'ord-1' }, { storeId: 'store-001' })).toBe(true)
    })

    it('不匹配的值应返回 false', () => {
      expect(matchFilters({ storeId: 'store-002' }, { storeId: 'store-001' })).toBe(false)
    })

    it('payload 缺少过滤器需要的键应返回 false', () => {
      expect(matchFilters({ orderId: 'ord-1' }, { storeId: 'store-001' })).toBe(false)
    })

    it('多条件过滤器须全部匹配', () => {
      expect(matchFilters(
        { storeId: 'store-001', region: 'east' },
        { storeId: 'store-001', region: 'east' },
      )).toBe(true)
      expect(matchFilters(
        { storeId: 'store-001', region: 'west' },
        { storeId: 'store-001', region: 'east' },
      )).toBe(false)
    })
  })

  /* ---------- 指数退避 ---------- */
  describe('computeBackoff', () => {
    it('第 1 次重试 (attempt=0) 应返回 1000', () => {
      expect(computeBackoff(0, 1000)).toBe(1000)
    })

    it('第 2 次重试 (attempt=1) 应返回 2000', () => {
      expect(computeBackoff(1, 1000)).toBe(2000)
    })

    it('第 7 次应被上限 64s 截断', () => {
      expect(computeBackoff(7, 1000)).toBe(64000)
    })
  })

  /* ---------- 重试决定 ---------- */
  describe('shouldRetry', () => {
    it('成功状态不应重试', () => {
      expect(shouldRetry(0, 3, 'success')).toBe(false)
    })

    it('失败且未达最大次数应重试', () => {
      expect(shouldRetry(0, 3, 'failed')).toBe(true)
    })

    it('失败且已达最大次数不应重试', () => {
      expect(shouldRetry(3, 3, 'failed')).toBe(false)
    })
  })

  /* ---------- 事件订阅检查 ---------- */
  describe('isEventSubscribed', () => {
    it('端点订阅列表中包含该事件应返回 true', () => {
      const ep = makeEndpoint({ events: ['order.created', 'order.refunded'] })
      expect(isEventSubscribed(ep, 'order.created')).toBe(true)
    })

    it('端点未订阅该事件应返回 false', () => {
      const ep = makeEndpoint({ events: ['order.created'] })
      expect(isEventSubscribed(ep, 'inventory.low')).toBe(false)
    })
  })

  /* ---------- 端点活跃状态 ---------- */
  describe('isEndpointActive', () => {
    it('活跃端点返回 true', () => {
      expect(isEndpointActive(makeEndpoint({ active: true }))).toBe(true)
    })

    it('非活跃端点返回 false', () => {
      expect(isEndpointActive(makeEndpoint({ active: false }))).toBe(false)
    })
  })

  /* ---------- 匹配订阅列表 ---------- */
  describe('getMatchingSubscriptions', () => {
    it('应返回匹配事件和端点的活跃订阅', () => {
      const subs = [
        makeSubscription({ endpointId: 'ep-1', event: 'order.created', active: true }),
        makeSubscription({ endpointId: 'ep-1', event: 'order.paid', active: true }),
        makeSubscription({ endpointId: 'ep-2', event: 'order.created', active: true }),
      ]
      const matched = getMatchingSubscriptions(subs, 'ep-1', 'order.created', {})
      expect(matched.length).toBe(1)
      expect(matched[0].id).toBe(subs[0].id)
    })

    it('非活跃订阅应被排除', () => {
      const subs = [
        makeSubscription({ endpointId: 'ep-1', event: 'order.created', active: false }),
      ]
      expect(getMatchingSubscriptions(subs, 'ep-1', 'order.created', {}).length).toBe(0)
    })

    it('带过滤器的不匹配订阅应被排除', () => {
      const subs = [
        makeSubscription({ endpointId: 'ep-1', event: 'order.created', filters: { storeId: 'store-1' } }),
      ]
      const matched = getMatchingSubscriptions(subs, 'ep-1', 'order.created', { storeId: 'store-2' })
      expect(matched.length).toBe(0)
    })
  })

  /* ---------- 构建请求头 ---------- */
  describe('buildHeaders', () => {
    it('应包含 Content-Type 和签名', () => {
      const headers = buildHeaders('secret', 'order.created', '{"id":"1"}')
      expect(headers['Content-Type']).toBe('application/json')
      expect(headers['X-Webhook-Event']).toBe('order.created')
      expect(headers['X-Webhook-Signature']).toBeTruthy()
    })

    it('签名应可验证', () => {
      const body = '{"id":"1"}'
      const headers = buildHeaders('secret', 'order.created', body)
      expect(verifySignature(body, headers['X-Webhook-Signature'], 'secret')).toBe(true)
    })
  })

  /* ---------- 端点管理 ---------- */
  describe('deleteEndpoint', () => {
    it('删除存在的端点应成功并返回附属订阅数', () => {
      const endpoints = new Map<string, WebhookEndpoint>()
      const subscriptions = new Map<string, WebhookSubscription>()
      endpoints.set('ep-1', makeEndpoint({ id: 'ep-1' }))
      subscriptions.set('sub-1', makeSubscription({ id: 'sub-1', endpointId: 'ep-1' }))
      subscriptions.set('sub-2', makeSubscription({ id: 'sub-2', endpointId: 'ep-1' }))
      subscriptions.set('sub-3', makeSubscription({ id: 'sub-3', endpointId: 'ep-2' }))

      const result = deleteEndpoint(endpoints, subscriptions, 'ep-1')
      expect(result.deletedEndpoint).toBe(true)
      expect(result.deletedSubscriptions).toBe(2)
      expect(endpoints.has('ep-1')).toBe(false)
      expect(subscriptions.has('sub-1')).toBe(false)
      expect(subscriptions.has('sub-3')).toBe(true) // ep-2 的订阅保留
    })

    it('删除不存在的端点应抛异常', () => {
      const endpoints = new Map()
      const subscriptions = new Map()
      expect(() => deleteEndpoint(endpoints, subscriptions, 'nonexistent')).toThrow()
    })
  })

  describe('endpointExists', () => {
    it('存在的端点应返回 true', () => {
      const eps = new Map([['ep-1', makeEndpoint({ id: 'ep-1' })]])
      expect(endpointExists(eps, 'ep-1')).toBe(true)
    })

    it('不存在的端点应返回 false', () => {
      expect(endpointExists(new Map(), 'nonexistent')).toBe(false)
    })
  })
})
