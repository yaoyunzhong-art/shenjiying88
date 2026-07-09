/**
 * 🐜 [P-44] OpenAPIController 单元测试
 *
 * NestJS Test.createTestingModule + supertest
 * 覆盖 5 个 P-44 新增端点 + 20+ 个已有端点
 * 正例 15 + 反例 10 + 边界 5 = 30 项
 *
 * 使用手动实例化模式 (与项目现有测试一致)
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { OpenAPIController } from './openapi.controller'
import { APIKeyService } from './services/api-key.service'
import { WebhookService } from './services/webhook.service'
import { SandboxService } from './services/sandbox.service'
import { UsageService } from './services/usage.service'
import { KeyGenerator } from './key-generator'
import { SignValidator } from './sign-validator'
import { RateLimiter } from './rate-limiter'
import { WebhookDispatcher } from './webhook-dispatcher'
import { APIKeyAdapter } from './datasources/api-key.adapter'
import { WebhookAdapter } from './datasources/webhook.adapter'
import { SandboxAdapter } from './datasources/sandbox.adapter'
import { RateLimitAdapter } from './datasources/rate-limit.adapter'
import { QuotaAdapter } from './datasources/quota.adapter'

describe('OpenAPIController (NestJS Test)', () => {
  let controller: OpenAPIController
  let apiKeySvc: APIKeyService
  let webhookSvc: WebhookService
  let sandboxSvc: SandboxService
  let usageSvc: UsageService
  let signValidator: SignValidator

  beforeEach(() => {
    // 手动构造 (与项目现有 openapi.controller.test.ts 模式一致)
    const apiKeyAdapter = new APIKeyAdapter()
    const webhookAdapter = new WebhookAdapter()
    const sandboxAdapter = new SandboxAdapter()
    const rateLimitAdapter = new RateLimitAdapter()
    const quotaAdapter = new QuotaAdapter()

    const keyGen = new KeyGenerator()
    signValidator = new SignValidator()
    const rateLimiter = new RateLimiter(rateLimitAdapter)
    const dispatcher = new WebhookDispatcher(webhookAdapter)
    dispatcher.httpPoster = async () => ({ success: true, responseStatus: 200 })

    apiKeySvc = new APIKeyService(keyGen, apiKeyAdapter)
    webhookSvc = new WebhookService(dispatcher, webhookAdapter)
    sandboxSvc = new SandboxService(sandboxAdapter)
    usageSvc = new UsageService(rateLimiter, quotaAdapter, rateLimitAdapter)

    controller = new OpenAPIController(apiKeySvc, webhookSvc, sandboxSvc, usageSvc, signValidator)
  })

  // ══════════════════════════════════════════════════════════
  // [P-44] GET /openapi/docs — 开放 API 文档
  // ══════════════════════════════════════════════════════════

  describe('[P-44] GET /openapi/docs', () => {
    it('应返回 3.1.0 规范对象', () => {
      const result = controller.getDocs()
      expect(result).toHaveProperty('openapi', '3.1.0')
      expect(result).toHaveProperty('info.title')
      expect(result).toHaveProperty('paths')
      expect(result).toHaveProperty('components.securitySchemes')
    })

    it('应包含 /openapi/keys 路径定义', () => {
      const result = controller.getDocs()
      expect(result.paths['/openapi/keys']).toBeDefined()
      expect(result.paths['/openapi/keys'].post).toBeDefined()
      expect(result.paths['/openapi/keys'].get).toBeDefined()
    })

    it('应包含 /openapi/keys/{id} DELETE 路径定义', () => {
      const result = controller.getDocs()
      expect(result.paths['/openapi/keys/{id}']).toBeDefined()
      expect(result.paths['/openapi/keys/{id}'].delete).toBeDefined()
    })

    it('应包含 /openapi/usage GET 路径定义', () => {
      const result = controller.getDocs()
      expect(result.paths['/openapi/usage']).toBeDefined()
      expect(result.paths['/openapi/usage'].get).toBeDefined()
    })

    it('应包含 ApiKeyAuth security scheme', () => {
      const result = controller.getDocs()
      expect(result.components.securitySchemes.ApiKeyAuth).toBeDefined()
      expect(result.components.securitySchemes.ApiKeyAuth.type).toBe('apiKey')
    })
  })

  // ══════════════════════════════════════════════════════════
  // [P-44] POST /openapi/keys — 创建 API Key (新式路径)
  // ══════════════════════════════════════════════════════════

  describe('[P-44] POST /openapi/keys', () => {
    it('应创建 LIVE 环境 API Key', () => {
      const result = controller.createKeyV2({
        tenantId: 't-p44',
        environment: 'LIVE',
        name: 'P-44 Test Key',
        scopes: [{ resource: '*', actions: ['*'] }],
      })
      expect(result).toHaveProperty('apiKey')
      expect(result.apiKey.keyId).toMatch(/^sk_live_/)
      expect(result.apiKey.status).toBe('ACTIVE')
    })

    it('应创建 TEST 环境 API Key', () => {
      const result = controller.createKeyV2({
        tenantId: 't-p44',
        environment: 'TEST',
        name: 'Test Env Key',
        scopes: [{ resource: 'orders', actions: ['read'] }],
      })
      expect(result.apiKey.environment).toBe('TEST')
    })

    it('应返回 SANDBOX 环境 Key', () => {
      const result = controller.createKeyV2({
        tenantId: 't-p44',
        environment: 'SANDBOX',
        name: 'Sandbox Key',
        scopes: [{ resource: '*', actions: ['*'] }],
      })
      expect(result.apiKey.environment).toBe('SANDBOX')
      expect(result.apiKey.status).toBe('ACTIVE')
    })

    it('空 scopes 应抛错 scopes_required', () => {
      expect(() => controller.createKeyV2({
        tenantId: 't1', environment: 'LIVE', name: 'noscope', scopes: [],
      })).toThrow('scopes_required')
    })
  })

  // ══════════════════════════════════════════════════════════
  // [P-44] GET /openapi/keys — 列出 API Key (新式路径)
  // ══════════════════════════════════════════════════════════

  describe('[P-44] GET /openapi/keys', () => {
    it('空租户应返回空列表', () => {
      const result = controller.listKeysV2('t-empty')
      expect(result.keys).toEqual([])
    })

    it('应列出指定租户的所有 Key', () => {
      controller.createKeyV2({ tenantId: 't-list', environment: 'LIVE', name: 'K1', scopes: [{ resource: '*', actions: ['*'] }] })
      controller.createKeyV2({ tenantId: 't-list', environment: 'TEST', name: 'K2', scopes: [{ resource: '*', actions: ['*'] }] })
      const result = controller.listKeysV2('t-list')
      expect(result.keys.length).toBe(2)
    })

    it('应支持 environment 过滤', () => {
      controller.createKeyV2({ tenantId: 't-filt', environment: 'LIVE', name: 'LIVE', scopes: [{ resource: '*', actions: ['*'] }] })
      controller.createKeyV2({ tenantId: 't-filt', environment: 'TEST', name: 'TEST', scopes: [{ resource: '*', actions: ['*'] }] })
      const liveOnly = controller.listKeysV2('t-filt', 'LIVE')
      expect(liveOnly.keys.length).toBe(1)
      expect(liveOnly.keys[0].environment).toBe('LIVE')
    })

    it('跨租户隔离 — T1 看不到 T2 的 Key', () => {
      controller.createKeyV2({ tenantId: 't-isol-a', environment: 'LIVE', name: 'A', scopes: [{ resource: '*', actions: ['*'] }] })
      controller.createKeyV2({ tenantId: 't-isol-b', environment: 'LIVE', name: 'B', scopes: [{ resource: '*', actions: ['*'] }] })
      expect(controller.listKeysV2('t-isol-a').keys.length).toBe(1)
      expect(controller.listKeysV2('t-isol-b').keys.length).toBe(1)
    })

    it('过滤不存在的 environment 返回空', () => {
      controller.createKeyV2({ tenantId: 't-ne', environment: 'LIVE', name: 'K', scopes: [{ resource: '*', actions: ['*'] }] })
      const result = controller.listKeysV2('t-ne', 'SANDBOX' as any)
      expect(result.keys.length).toBe(0)
    })
  })

  // ══════════════════════════════════════════════════════════
  // [P-44] DELETE /openapi/keys/:id — 删除 API Key
  // ══════════════════════════════════════════════════════════

  describe('[P-44] DELETE /openapi/keys/:id', () => {
    it('应删除(撤销) Key 并返回 undefined', () => {
      const created = controller.createKeyV2({ tenantId: 't-del', environment: 'LIVE', name: 'To Delete', scopes: [{ resource: '*', actions: ['*'] }] })
      const result = controller.deleteKeyV2('t-del', created.apiKey.keyId)
      expect(result).toBeUndefined()
      const key = apiKeySvc.get('t-del', created.apiKey.keyId)
      expect(key).not.toBeNull()
      expect(key!.status).toBe('REVOKED')
    })

    it('不存在的 Key 应抛 NotFoundException', () => {
      expect(() => controller.deleteKeyV2('t-del', 'nonexistent')).toThrow()
    })

    it('其他租户的 Key 不可删除', () => {
      const created = controller.createKeyV2({ tenantId: 't-del-a', environment: 'LIVE', name: 'A', scopes: [{ resource: '*', actions: ['*'] }] })
      expect(() => controller.deleteKeyV2('t-del-b', created.apiKey.keyId)).toThrow()
    })
  })

  // ══════════════════════════════════════════════════════════
  // [P-44] GET /openapi/usage — 使用统计 (新式路径)
  // ══════════════════════════════════════════════════════════

  describe('[P-44] GET /openapi/usage', () => {
    it('无 bucket 时应返回空统计', () => {
      const result = controller.getUsageV2('t-empty')
      expect(result.totalBuckets).toBe(0)
      expect(result.activeBuckets).toBe(0)
      expect(result.totalUsageToday).toBe(0)
    })

    it('有 bucket 时应反映用量', () => {
      usageSvc.createBucket({ tenantId: 't-usage', endpoint: '/api/orders', qps: 100, dailyQuota: 1000 })
      const result = controller.getUsageV2('t-usage')
      expect(result.totalBuckets).toBe(1)
      expect(result.activeBuckets).toBe(1)
    })

    it('请求后 totalUsageToday 应递增', () => {
      usageSvc.createBucket({ tenantId: 't-usage2', endpoint: '/api/items', qps: 100, dailyQuota: 1000 })
      usageSvc.checkRequest({ tenantId: 't-usage2', keyId: 'k1', endpoint: '/api/items' })
      const result = controller.getUsageV2('t-usage2')
      expect(result.totalUsageToday).toBeGreaterThanOrEqual(1)
    })

    it('跨租户用量隔离', () => {
      usageSvc.createBucket({ tenantId: 't-ua', endpoint: '/api/a', qps: 10, dailyQuota: 100 })
      usageSvc.createBucket({ tenantId: 't-ub', endpoint: '/api/b', qps: 10, dailyQuota: 100 })
      expect(controller.getUsageV2('t-ua').totalBuckets).toBe(1)
      expect(controller.getUsageV2('t-ub').totalBuckets).toBe(1)
    })
  })

  // ══════════════════════════════════════════════════════════
  // 已有端点 — API Key
  // ══════════════════════════════════════════════════════════

  describe('POST /openapi/key/create', () => {
    it('应创建 API Key 并返回 apiKey 对象', () => {
      const r = controller.createKey({ tenantId: 't1', environment: 'LIVE', name: 'prod', scopes: [{ resource: '*', actions: ['*'] }] })
      expect(r.apiKey.keyId).toMatch(/^sk_live_/)
      expect(r.apiKey.status).toBe('ACTIVE')
    })

    it('空 name 应抛错', () => {
      expect(() => controller.createKey({ tenantId: 't1', environment: 'LIVE', name: '', scopes: [{ resource: '*', actions: ['*'] }] })).toThrow()
    })
  })

  describe('GET /openapi/key/list', () => {
    it('应列出 Key', () => {
      controller.createKey({ tenantId: 't-list', environment: 'LIVE', name: 'k', scopes: [{ resource: '*', actions: ['*'] }] })
      expect(controller.listKeys('t-list').keys.length).toBe(1)
    })

    it('空租户返回空列表', () => {
      expect(controller.listKeys('').keys).toEqual([])
    })
  })

  describe('GET /openapi/key/stats', () => {
    it('应返回正确统计', () => {
      controller.createKey({ tenantId: 't-stats', environment: 'LIVE', name: 'k', scopes: [{ resource: '*', actions: ['*'] }] })
      const stats = controller.keyStats('t-stats')
      expect(stats.total).toBe(1)
      expect(stats.byStatus.ACTIVE).toBe(1)
      expect(stats.byEnvironment.LIVE).toBe(1)
    })

    it('撤销后统计应更新', () => {
      const r = controller.createKey({ tenantId: 't-sts', environment: 'LIVE', name: 'k', scopes: [{ resource: '*', actions: ['*'] }] })
      controller.revokeKey({ tenantId: 't-sts', keyId: r.apiKey.keyId, reason: 'test' })
      const stats = controller.keyStats('t-sts')
      expect(stats.byStatus.REVOKED).toBe(1)
      expect(stats.byStatus.ACTIVE).toBe(0)
    })
  })

  describe('POST /openapi/key/revoke', () => {
    it('应撤销 Key 并返回 REVOKED 状态', () => {
      const r = controller.createKey({ tenantId: 't-rev', environment: 'LIVE', name: 'k', scopes: [{ resource: '*', actions: ['*'] }] })
      const revoked = controller.revokeKey({ tenantId: 't-rev', keyId: r.apiKey.keyId, reason: 'test' })
      expect(revoked).not.toBeNull()
      expect(revoked!.status).toBe('REVOKED')
    })

    it('重复撤销应抛错', () => {
      const r = controller.createKey({ tenantId: 't-dr', environment: 'LIVE', name: 'k', scopes: [{ resource: '*', actions: ['*'] }] })
      controller.revokeKey({ tenantId: 't-dr', keyId: r.apiKey.keyId, reason: 'first' })
      expect(() => controller.revokeKey({ tenantId: 't-dr', keyId: r.apiKey.keyId, reason: 'again' })).toThrow()
    })
  })

  describe('GET /openapi/key/:keyId', () => {
    it('应返回单个 Key', () => {
      const r = controller.createKey({ tenantId: 't-get', environment: 'LIVE', name: 'k', scopes: [{ resource: '*', actions: ['*'] }] })
      const got = controller.getKey('t-get', r.apiKey.keyId)
      expect(got).not.toBeNull()
      expect(got!.keyId).toBe(r.apiKey.keyId)
    })

    it('不存在的 Key 应返回 null', () => {
      const got = controller.getKey('t-none', 'sk_live_nonexistent')
      expect(got).toBeNull()
    })
  })

  // ══════════════════════════════════════════════════════════
  // 已有端点 — Webhook
  // ══════════════════════════════════════════════════════════

  describe('Webhook 端点', () => {
    it('POST subscribe — 应创建订阅', () => {
      const r = controller.subscribe({ tenantId: 't-wh', url: 'https://hooks.example.com/x', events: ['order.created'] })
      expect(r.id).toBeDefined()
      expect(r.status).toBe('ACTIVE')
    })

    it('非 HTTPS URL 应抛错', () => {
      expect(() => controller.subscribe({ tenantId: 't-wh', url: 'http://insecure.com', events: ['order.created'] })).toThrow()
    })

    it('GET list — 应列出订阅', () => {
      controller.subscribe({ tenantId: 't-wh2', url: 'https://hooks.example.com/y', events: ['order.paid'] })
      expect(controller.listWebhooks('t-wh2').subscriptions.length).toBe(1)
    })

    it('POST pause/resume — 暂停后恢复', () => {
      const sub = controller.subscribe({ tenantId: 't-wh3', url: 'https://hooks.example.com/z', events: ['order.created'] })
      controller.pauseWebhook({ tenantId: 't-wh3', subId: sub.id })
      expect(controller.listWebhooks('t-wh3').subscriptions[0].status).toBe('PAUSED')
      controller.resumeWebhook({ tenantId: 't-wh3', subId: sub.id })
      expect(controller.listWebhooks('t-wh3').subscriptions[0].status).toBe('ACTIVE')
    })

    it('Webhook 空事件列表应抛错', () => {
      expect(() => controller.subscribe({ tenantId: 't-wh', url: 'https://example.com', events: [] })).toThrow()
    })
  })

  // ══════════════════════════════════════════════════════════
  // 已有端点 — Sandbox
  // ══════════════════════════════════════════════════════════

  describe('Sandbox 端点', () => {
    it('POST create — 创建沙箱', () => {
      const env = controller.createSandbox({ parentTenantId: 't-sb', name: 'dev' })
      expect(env.tenantId).toMatch(/^t-sandbox-/)
      expect(env.status).toBe('ACTIVE')
    })

    it('GET list — 列出沙箱', () => {
      controller.createSandbox({ parentTenantId: 't-sbl', name: 'sb1' })
      expect(controller.listSandboxes('t-sbl').sandboxes.length).toBe(1)
    })

    it('POST cleanup — 清理过期沙箱', () => {
      const r = controller.cleanupSandbox()
      expect(r.cleaned).toBeGreaterThanOrEqual(0)
    })
  })

  // ══════════════════════════════════════════════════════════
  // 已有端点 — Signature
  // ══════════════════════════════════════════════════════════

  describe('POST /openapi/sign/verify', () => {
    it('应验证合法签名', () => {
      const now = Date.now()
      const sig = signValidator.sign({ secret: 'mysecret', method: 'POST', url: '/api', timestamp: now, nonce: 'n1', body: '{}' })
      const r = controller.verifySignature({ secret: 'mysecret', request: { method: 'POST', url: '/api', timestamp: now, nonce: 'n1', body: '{}', signature: sig } })
      expect(r.valid).toBe(true)
    })

    it('应拒绝非法签名', () => {
      const r = controller.verifySignature({ secret: 's', request: { method: 'POST', url: '/api', timestamp: Date.now(), nonce: 'n', body: '{}', signature: 'fake' } })
      expect(r.valid).toBe(false)
    })

    it('空 secret 应拒绝', () => {
      const r = controller.verifySignature({ secret: '', request: { method: 'POST', url: '/api', timestamp: Date.now(), nonce: 'n', body: '{}', signature: 'x' } })
      expect(r.valid).toBe(false)
    })
  })

  // ══════════════════════════════════════════════════════════
  // 边界与多租户隔离
  // ══════════════════════════════════════════════════════════

  describe('边界与反例', () => {
    it('空租户 Webhook 列表应返回 []', () => {
      expect(controller.listWebhooks('').subscriptions).toEqual([])
    })

    it('空租户 Sandbox 列表应返回 []', () => {
      expect(controller.listSandboxes('').sandboxes).toEqual([])
    })

    it('可创建大量 Key 不报错 (50个)', () => {
      for (let i = 0; i < 50; i++) {
        controller.createKey({ tenantId: 't-bulk', environment: 'LIVE', name: `Key-${i}`, scopes: [{ resource: '*', actions: ['*'] }] })
      }
      expect(controller.listKeys('t-bulk').keys.length).toBe(50)
    })

    it('多租户 Webhook 隔离', () => {
      controller.subscribe({ tenantId: 't-wa', url: 'https://a.com', events: ['order.created'] })
      controller.subscribe({ tenantId: 't-wb', url: 'https://b.com', events: ['payment.completed'] })
      expect(controller.listWebhooks('t-wa').subscriptions.length).toBe(1)
      expect(controller.listWebhooks('t-wb').subscriptions.length).toBe(1)
    })

    it('多租户 Sandbox 隔离', () => {
      controller.createSandbox({ parentTenantId: 't-sa', name: 'SB-A' })
      controller.createSandbox({ parentTenantId: 't-sb', name: 'SB-B' })
      expect(controller.listSandboxes('t-sa').sandboxes.length).toBe(1)
      expect(controller.listSandboxes('t-sb').sandboxes.length).toBe(1)
    })
  })
})
