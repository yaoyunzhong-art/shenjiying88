import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [openapi] Entity 形状测试
 *
 * 覆盖:
 *   - APIKey / APIKeyScope 接口形状
 *   - WebhookSubscription / WebhookDelivery
 *   - SandboxEnvironment
 *   - RateLimitBucket / RateLimitRecord / QuotaUsage
 *   - 枚举值验证 (environment, status, eventType)
 *   - 边界: 空数组, optional 字段, 大对象
 */

import assert from 'node:assert/strict'
import type {
  APIKey,
  APIKeyScope,
  APIKeyEnvironment,
  APIKeyStatus,
  WebhookSubscription,
  WebhookDelivery,
  WebhookEventType,
  SandboxEnvironment,
  SandboxStatus,
  RateLimitBucket,
  RateLimitRecord,
  QuotaUsage,
  SignedRequest,
  RateLimitResult,
  OpenAPISpec,
} from './openapi.entity'

describe('OpenAPI Entity 类型形状', () => {
  // ── APIKey ──
  describe('APIKey', () => {
    it('支持 ACTIVE 状态的 API Key', () => {
      const key: APIKey = {
        id: 'key-001',
        tenantId: 'T001',
        keyId: 'sk_live_abc123',
        keyHash: 'sha256-xxx',
        environment: 'LIVE',
        name: 'Production Key',
        scopes: [{ resource: 'orders', actions: ['read', 'write'] }],
        status: 'ACTIVE',
        createdAt: '2026-06-01T00:00:00Z',
        createdBy: 'admin',
      }

      assert.equal(key.id, 'key-001')
      assert.equal(key.tenantId, 'T001')
      assert.equal(key.keyId, 'sk_live_abc123')
      assert.equal(key.environment, 'LIVE')
      assert.equal(key.status, 'ACTIVE')
      assert.equal(key.scopes.length, 1)
      assert.equal(key.scopes[0].resource, 'orders')
      assert.deepEqual(key.scopes[0].actions, ['read', 'write'])
      assert.equal(key.createdBy, 'admin')
      assert.equal(key.expiresAt, undefined)
      assert.equal(key.lastUsedAt, undefined)
      assert.equal(key.revokedAt, undefined)
      assert.equal(key.revokedReason, undefined)
    })

    it('支持 REVOKED 状态的 API Key 带过期字段', () => {
      const key: APIKey = {
        id: 'key-002',
        tenantId: 'T002',
        keyId: 'sk_test_xyz789',
        keyHash: 'sha256-yyy',
        environment: 'TEST',
        name: 'Test Key',
        scopes: [{ resource: '*', actions: ['*'] }],
        status: 'REVOKED',
        createdAt: '2026-06-01T00:00:00Z',
        createdBy: 'admin',
        expiresAt: '2026-12-31T23:59:59Z',
        lastUsedAt: '2026-06-15T10:00:00Z',
        revokedAt: '2026-06-20T08:00:00Z',
        revokedReason: 'Security rotation',
      }

      assert.equal(key.environment, 'TEST')
      assert.equal(key.status, 'REVOKED')
      assert.equal(key.scopes[0].resource, '*')
      assert.equal(key.expiresAt, '2026-12-31T23:59:59Z')
      assert.equal(key.revokedReason, 'Security rotation')
    })

    it('环境枚举值严格匹配', () => {
      const environments: APIKeyEnvironment[] = ['LIVE', 'TEST', 'SANDBOX']
      assert.equal(environments.length, 3)
      for (const env of environments) {
        assert.ok(['LIVE', 'TEST', 'SANDBOX'].includes(env))
      }
    })

    it('状态枚举值严格匹配', () => {
      const statuses: APIKeyStatus[] = ['ACTIVE', 'REVOKED', 'EXPIRED']
      assert.equal(statuses.length, 3)
    })
  })

  // ── Webhook ──
  describe('WebhookSubscription', () => {
    it('支持完整订阅对象', () => {
      const sub: WebhookSubscription = {
        id: 'wh-sub-001',
        tenantId: 'T001',
        url: 'https://example.com/webhook',
        events: ['order.created', 'order.paid', 'member.upgraded'],
        secret: 'whsec_abc123',
        description: 'Production order events',
        status: 'ACTIVE',
        createdAt: '2026-06-01T00:00:00Z',
        createdBy: 'admin',
      }

      assert.equal(sub.status, 'ACTIVE')
      assert.equal(sub.events.length, 3)
      assert.equal(sub.secret, 'whsec_abc123')
    })

    it('支持 PAUSED 状态', () => {
      const sub: WebhookSubscription = {
        id: 'wh-sub-002',
        tenantId: 'T001',
        url: 'https://example.com/hooks',
        events: ['payment.completed'],
        secret: 'whsec_xyz',
        status: 'PAUSED',
        createdAt: '2026-06-01T00:00:00Z',
        createdBy: 'ops',
      }

      assert.equal(sub.status, 'PAUSED')
    })

    it('WebhookEventType 枚举值', () => {
      const types: WebhookEventType[] = [
        'order.created', 'order.paid', 'order.refunded',
        'member.created', 'member.upgraded',
        'inventory.low',
        'payment.completed', 'payment.failed',
        'coupon.issued', 'coupon.redeemed',
      ]
      assert.equal(types.length, 10)
    })
  })

  describe('WebhookDelivery', () => {
    it('支持 FAILED 投递记录', () => {
      const delivery: WebhookDelivery = {
        id: 'del-001',
        tenantId: 'T001',
        subscriptionId: 'wh-sub-001',
        eventType: 'order.created',
        payload: { orderId: 'ORD-001' },
        attempts: 3,
        status: 'FAILED',
        lastAttemptAt: '2026-06-15T10:00:05Z',
        nextRetryAt: '2026-06-15T10:05:00Z',
        responseStatus: 500,
        responseBody: 'Internal Server Error',
        errorMessage: 'Server timeout',
        signature: 'hmac-sha256-sig',
        createdAt: '2026-06-15T10:00:00Z',
      }

      assert.equal(delivery.status, 'FAILED')
      assert.equal(delivery.attempts, 3)
      assert.equal(delivery.errorMessage, 'Server timeout')
      assert.equal(delivery.responseStatus, 500)
    })

    it('支持 DEAD_LETTER 状态', () => {
      const delivery: WebhookDelivery = {
        id: 'del-002',
        tenantId: 'T001',
        subscriptionId: 'wh-sub-001',
        eventType: 'order.paid',
        payload: {},
        attempts: 5,
        status: 'DEAD_LETTER',
        errorMessage: 'Max retries exceeded',
        signature: 'sig',
        createdAt: '2026-06-15T09:00:00Z',
      }

      assert.equal(delivery.status, 'DEAD_LETTER')
      assert.equal(delivery.attempts, 5)
      assert.equal(delivery.deliveredAt, undefined)
    })
  })

  // ── Sandbox ──
  describe('SandboxEnvironment', () => {
    it('支持完整沙箱环境', () => {
      const sandbox: SandboxEnvironment = {
        id: 'sb-001',
        tenantId: 't-sandbox-001',
        parentTenantId: 'T001',
        name: 'Dev Sandbox',
        status: 'ACTIVE',
        ttlDays: 30,
        dataMaskingEnabled: true,
        createdAt: '2026-06-01T00:00:00Z',
        expiresAt: '2026-07-01T00:00:00Z',
      }

      assert.equal(sandbox.tenantId, 't-sandbox-001')
      assert.equal(sandbox.dataMaskingEnabled, true)
      assert.equal(sandbox.ttlDays, 30)
    })

    it('支持 PURGED 状态', () => {
      const sandbox: SandboxEnvironment = {
        id: 'sb-002',
        tenantId: 't-sandbox-002',
        parentTenantId: 'T002',
        name: 'Expired',
        status: 'PURGED',
        ttlDays: 30,
        dataMaskingEnabled: false,
        createdAt: '2025-01-01T00:00:00Z',
        expiresAt: '2025-02-01T00:00:00Z',
        purgedAt: '2025-02-02T00:00:00Z',
      }

      assert.equal(sandbox.status, 'PURGED')
      assert.ok(sandbox.purgedAt)
    })

    it('SandboxStatus 枚举值', () => {
      const statuses: SandboxStatus[] = ['CREATED', 'ACTIVE', 'EXPIRED', 'PURGED']
      assert.equal(statuses.length, 4)
    })
  })

  // ── Rate Limit ──
  describe('RateLimitBucket', () => {
    it('支持完整限流桶', () => {
      const bucket: RateLimitBucket = {
        id: 'bucket-001',
        tenantId: 'T001',
        keyId: 'sk_live_key_01',
        endpoint: '/api/orders',
        qps: 10,
        dailyQuota: 10000,
        windowMs: 60000,
        active: true,
        createdAt: '2026-06-01T00:00:00Z',
      }

      assert.equal(bucket.qps, 10)
      assert.equal(bucket.dailyQuota, 10000)
      assert.equal(bucket.active, true)
    })
  })

  describe('RateLimitRecord', () => {
    it('支持限流记录', () => {
      const record: RateLimitRecord = {
        id: 'rl-001',
        tenantId: 'T001',
        keyId: 'sk_live_key_01',
        endpoint: '/api/orders',
        timestamp: 1712345678000,
        weight: 1,
      }

      assert.equal(record.weight, 1)
      assert.ok(record.timestamp > 0)
    })
  })

  // ── QuotaUsage ──
  describe('QuotaUsage', () => {
    it('支持带超额数据的配额记录', () => {
      const usage: QuotaUsage = {
        id: 'quota-001',
        tenantId: 'T001',
        keyId: 'sk_live_key_01',
        periodKey: '2026-06-28',
        usedCount: 8500,
        remainingCount: 1500,
        overageCount: 0,
        lastRequestAt: '2026-06-28T09:00:00Z',
      }

      assert.equal(usage.usedCount, 8500)
      assert.equal(usage.remainingCount, 1500)
      assert.equal(usage.overageCount, 0)
    })

    it('支持超额情况', () => {
      const usage: QuotaUsage = {
        id: 'quota-002',
        tenantId: 'T001',
        keyId: 'sk_live_key_02',
        periodKey: '2026-06-28',
        usedCount: 10500,
        remainingCount: 0,
        overageCount: 500,
      }

      assert.equal(usage.overageCount, 500)
      assert.equal(usage.lastRequestAt, undefined)
    })
  })

  // ── SignedRequest ──
  describe('SignedRequest', () => {
    it('支持完整签名请求', () => {
      const req: SignedRequest = {
        method: 'POST',
        url: '/api/orders',
        body: '{"productId":"P001"}',
        timestamp: 1712345678000,
        nonce: 'nonce-abc-001',
        signature: 'hmac-sha256-signature-value',
      }

      assert.equal(req.method, 'POST')
      assert.equal(req.nonce, 'nonce-abc-001')
      assert.ok(req.signature.length > 0)
    })
  })

  // ── RateLimitResult ──
  describe('RateLimitResult', () => {
    it('支持 allowed 结果', () => {
      const result: RateLimitResult = {
        allowed: true,
        remaining: 42,
      }

      assert.equal(result.allowed, true)
      assert.equal(result.remaining, 42)
      assert.equal(result.retryAfter, undefined)
      assert.equal(result.reason, undefined)
    })

    it('支持被限流结果', () => {
      const result: RateLimitResult = {
        allowed: false,
        remaining: 0,
        retryAfter: 60,
        reason: 'daily_quota_exceeded',
      }

      assert.equal(result.allowed, false)
      assert.equal(result.retryAfter, 60)
      assert.equal(result.reason, 'daily_quota_exceeded')
    })
  })

  // ── OpenAPISpec ──
  describe('OpenAPISpec', () => {
    it('支持完整 OpenAPI 规范结构', () => {
      const spec: OpenAPISpec = {
        openapi: '3.1.0',
        info: {
          title: 'Shenjiying OpenAPI',
          version: '1.0.0',
          description: 'RESTful API Gateway',
        },
        servers: [
          { url: 'https://api.example.com', description: 'Production' },
        ],
        paths: {
          '/api/orders': {
            get: { summary: 'List orders', operationId: 'listOrders' },
          },
        },
        components: {
          securitySchemes: {
            apiKey: { type: 'http', scheme: 'bearer' },
          },
          schemas: {
            Order: {
              type: 'object',
              properties: { id: { type: 'string' } },
            },
          },
        },
      }

      assert.equal(spec.openapi, '3.1.0')
      assert.equal(spec.info.title, 'Shenjiying OpenAPI')
      assert.equal(spec.servers.length, 1)
      assert.ok(spec.components.securitySchemes.apiKey)
    })
  })
})
