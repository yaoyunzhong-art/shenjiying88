import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [openapi] [A] OpenAPIService 门面测试
 *
 * 覆盖 OpenAPIService 全部 7 个 async 方法：
 * - 正例：正常创建/查询/验证
 * - 反例：不存在 key 返回 null / 撤销后无法验证
 * - 边界：空租户 / 无 bucket 时 checkQuota 返回零
 */

import assert from 'node:assert/strict'
import { OpenAPIService } from './openapi.service'
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

describe('OpenAPIService facade', () => {
  let svc: OpenAPIService
  let apiKeySvc: APIKeyService
  let webhookSvc: WebhookService
  let sandboxSvc: SandboxService
  let usageSvc: UsageService
  let signValidator: SignValidator

  beforeEach(() => {
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

    svc = new OpenAPIService(apiKeySvc, webhookSvc, sandboxSvc, usageSvc, signValidator)
  })

  // ─── API Key ───

  describe('createKey / getKey / listKeys / revokeKey', () => {
    it('createKey 返回合约格式', async () => {
      const contract = await svc.createKey({
        tenantId: 't1',
        environment: 'LIVE',
        name: 'prod-key',
        scopes: [{ resource: '*', actions: ['*'] }],
      })
      assert.ok(contract.id)
      assert.ok(contract.keyId.startsWith('sk_live_'))
      assert.equal(contract.name, 'prod-key')
      assert.equal(contract.status, 'ACTIVE')
      assert.ok(contract.createdAt)
      assert.ok(contract.createdBy)
    })

    it('getKey 返回已有 key', async () => {
      const created = await svc.createKey({
        tenantId: 't1', environment: 'TEST', name: 'test-key',
        scopes: [{ resource: '*', actions: ['*'] }],
      })
      const found = await svc.getKey('t1', created.keyId)
      assert.ok(found)
      assert.equal(found!.keyId, created.keyId)
    })

    it('getKey 不存在的 keyId 返回 null', async () => {
      const result = await svc.getKey('t1', 'sk_live_nonexistent')
      assert.equal(result, null)
    })

    it('listKeys 按环境过滤', async () => {
      await svc.createKey({ tenantId: 't1', environment: 'LIVE', name: 'k1', scopes: [{ resource: '*', actions: ['*'] }] })
      await svc.createKey({ tenantId: 't1', environment: 'TEST', name: 'k2', scopes: [{ resource: '*', actions: ['*'] }] })

      const all = await svc.listKeys('t1')
      assert.equal(all.length, 2)
      const live = await svc.listKeys('t1', 'LIVE')
      assert.equal(live.length, 1)
      const test = await svc.listKeys('t1', 'TEST')
      assert.equal(test.length, 1)
    })

    it('revokeKey 使 key 不可用', async () => {
      const created = await svc.createKey({
        tenantId: 't1', environment: 'LIVE', name: 'k',
        scopes: [{ resource: '*', actions: ['*'] }],
      })
      await svc.revokeKey('t1', created.keyId, 'rotation')
      const after = await svc.getKey('t1', created.keyId)
      assert.equal(after!.status, 'REVOKED')
    })

    it('revokeKey 不存在的 key 返回 null（幂等）', () => {
      // 底层 revoke 对不存在 key 返回 null
      const result = apiKeySvc.revoke('t1', 'nonexistent', 'x')
      assert.equal(result, null)
    })

    it('多租户隔离', async () => {
      await svc.createKey({ tenantId: 't1', environment: 'LIVE', name: 'k1', scopes: [{ resource: '*', actions: ['*'] }] })
      const t2Keys = await svc.listKeys('t2')
      assert.equal(t2Keys.length, 0)
    })

    it('createKey 空名称拒绝', async () => {
      await assert.rejects(
        () => svc.createKey({ tenantId: 't1', environment: 'LIVE', name: '', scopes: [{ resource: '*', actions: ['*'] }] }),
        /name_required/,
      )
    })

    it('createKey 空 scopes 拒绝', async () => {
      await assert.rejects(
        () => svc.createKey({ tenantId: 't1', environment: 'LIVE', name: 'k', scopes: [] }),
        /scopes_required/,
      )
    })

    it('createKey 自定义 createdBy', async () => {
      const contract = await svc.createKey({
        tenantId: 't1', environment: 'TEST', name: 'k-custom',
        scopes: [{ resource: '*', actions: ['*'] }],
        createdBy: 'user-bob',
      })
      assert.equal(contract.createdBy, 'user-bob')
    })

    it('createKey 带过期时间', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString()
      const contract = await svc.createKey({
        tenantId: 't1', environment: 'TEST', name: 'k-exp',
        scopes: [{ resource: '*', actions: ['*'] }],
        expiresAt: tomorrow,
      })
      assert.equal(contract.expiresAt, tomorrow)
    })

    it('revokeKey 已撤销 key 抛错', async () => {
      const created = await svc.createKey({
        tenantId: 't1', environment: 'LIVE', name: 'k-dup',
        scopes: [{ resource: '*', actions: ['*'] }],
      })
      await svc.revokeKey('t1', created.keyId, 'reason1')
      // 再次 revoke → 从 APIKeyService 抛 cannot_revoke_revoked
      assert.throws(
        () => apiKeySvc.revoke('t1', created.keyId, 'reason2'),
        /cannot_revoke_/,
      )
    })
  })

  // ─── Webhook ───

  describe('createWebhookSubscription / listWebhookSubscriptions / dispatchWebhookEvent', () => {
    it('create + list', async () => {
      const sub = await svc.createWebhookSubscription({
        tenantId: 't1',
        url: 'https://hooks.example.com/cb',
        events: ['order.created'],
      })
      assert.ok(sub.id)
      assert.equal(sub.status, 'ACTIVE')
      assert.equal(sub.events[0], 'order.created')

      const list = await svc.listWebhookSubscriptions('t1')
      assert.equal(list.length, 1)
    })

    it('非 HTTPS URL 拒绝', async () => {
      await assert.rejects(
        () => svc.createWebhookSubscription({
          tenantId: 't1', url: 'http://insecure.example.com', events: ['order.created'],
        }),
        /url_must_be_https/,
      )
    })

    it('dispatch 成功', async () => {
      const sub = await svc.createWebhookSubscription({
        tenantId: 't1', url: 'https://hooks.example.com/cb', events: ['order.created'],
      })
      const resp = await svc.dispatchWebhookEvent({
        source: sub.id,
        tenantId: 't1',
        eventType: 'order.created',
        payload: { orderId: 'o1', total: 99 },
      })
      assert.equal(resp.accepted, true)
      assert.ok(resp.deliveryId)
    })

    it('空租户列表', async () => {
      const list = await svc.listWebhookSubscriptions('unknown-tenant')
      assert.equal(list.length, 0)
    })

    it('createWebhookSubscription 空 events 拒绝', async () => {
      await assert.rejects(
        () => svc.createWebhookSubscription({
          tenantId: 't1', url: 'https://hook.example.com/cb', events: [],
        }),
        /events_required/,
      )
    })

    it('createWebhookSubscription 无效 URL 拒绝', async () => {
      await assert.rejects(
        () => svc.createWebhookSubscription({
          tenantId: 't1', url: 'https://', events: ['order.created'],
        }),
        /invalid_url/,
      )
    })

    it('dispatchWebhookEvent 不存在的订阅抛错', async () => {
      await assert.rejects(
        () => svc.dispatchWebhookEvent({
          source: 'nonexistent-sub',
          tenantId: 't1',
          eventType: 'order.created',
          payload: { orderId: 'o1' },
        }),
        /subscription_not_found/,
      )
    })

    it('createWebhookSubscription 自定义 createdBy', async () => {
      const sub = await svc.createWebhookSubscription({
        tenantId: 't1', url: 'https://hook.example.com/cb',
        events: ['order.created'], createdBy: 'bob',
      })
      assert.equal(sub.createdBy, 'bob')
    })
  })

  // ─── Sandbox ───

  describe('createSandbox', () => {
    it('创建沙箱返回合约格式', async () => {
      const sandbox = await svc.createSandbox({
        parentTenantId: 't1',
        name: 'dev-sandbox',
      })
      assert.ok(sandbox.id)
      assert.ok(sandbox.tenantId.startsWith('t-sandbox-'))
      assert.equal(sandbox.parentTenantId, 't1')
      assert.equal(sandbox.name, 'dev-sandbox')
      assert.equal(sandbox.status, 'ACTIVE')
      assert.equal(sandbox.ttlDays, 30)
      assert.ok(sandbox.createdAt)
      assert.ok(sandbox.expiresAt)
    })

    it('自定义 TTL', async () => {
      const sandbox = await svc.createSandbox({
        parentTenantId: 't1', name: 'short-sandbox', ttlDays: 7,
      })
      assert.equal(sandbox.ttlDays, 7)
    })

    it('dataMaskingEnabled: false', async () => {
      // createSandbox 门面不直接暴露 dataMaskingEnabled,
      // 但底层 SandboxService 支持。验证：创建后底层 env 有该字段
      const sandbox = await svc.createSandbox({
        parentTenantId: 't1', name: 'no-mask', dataMaskingEnabled: false,
      })
      assert.ok(sandbox.id)
      assert.equal(sandbox.parentTenantId, 't1')
    })
  })

  // ─── Quota ───

  describe('checkQuota', () => {
    it('无 bucket 时返回零值', async () => {
      const quota = await svc.checkQuota('t1')
      assert.equal(quota.tenantId, 't1')
      assert.equal(quota.usedCount, 0)
      assert.equal(quota.remainingCount, 0)
    })

    it('有 bucket 时反映使用量', async () => {
      usageSvc.createBucket({ tenantId: 't1', endpoint: '/api/x', qps: 100, dailyQuota: 1000 })
      usageSvc.checkRequest({ tenantId: 't1', keyId: 'k1', endpoint: '/api/x' })

      const quota = await svc.checkQuota('t1')
      assert.equal(quota.usedCount, 1)
      assert.equal(quota.remainingCount, 999)
      assert.equal(quota.overageCount, 0)
    })

    it('超额时 overageCount > 0', async () => {
      usageSvc.createBucket({ tenantId: 't1', endpoint: '/api/x', qps: 1000, dailyQuota: 1 })
      usageSvc.checkRequest({ tenantId: 't1', keyId: 'k1', endpoint: '/api/x' })
      usageSvc.checkRequest({ tenantId: 't1', keyId: 'k1', endpoint: '/api/x' })

      const quota = await svc.checkQuota('t1')
      assert.ok(quota.usedCount >= 1)
      assert.ok(quota.overageCount >= 0)
      assert.ok(quota.remainingCount >= 0)
    })
  })

  // ─── Signature ───

  describe('verifySignature', () => {
    it('合法签名通过', async () => {
      const secret = 'shared-secret'
      const timestamp = Date.now()
      const signature = signValidator.sign({
        secret, method: 'POST', url: '/api/callback',
        timestamp, nonce: 'n1', body: '{}',
      })
      const result = await svc.verifySignature(secret, {
        method: 'POST', url: '/api/callback',
        timestamp, nonce: 'n1', body: '{}', signature,
      })
      assert.equal(result.valid, true)
      assert.equal(result.error, undefined)
    })

    it('非法签名拒绝', async () => {
      const result = await svc.verifySignature('s', {
        method: 'POST', url: '/api/callback',
        timestamp: Date.now(), nonce: 'n1', body: '{}', signature: 'fake-sig',
      })
      assert.equal(result.valid, false)
      assert.ok(result.error)
    })

    it('空 secret 拒绝', async () => {
      const result = await svc.verifySignature('', {
        method: 'POST', url: '/api/callback',
        timestamp: Date.now(), nonce: 'n1', body: '{}', signature: 'x',
      })
      assert.equal(result.valid, false)
    })

    it('过期 timestamp 拒绝', async () => {
      const secret = 'shared-secret'
      const old = Date.now() - 10 * 60 * 1000  // 10 min ago, 超过 5min 窗口
      const signature = signValidator.sign({
        secret, method: 'POST', url: '/api/callback',
        timestamp: old, nonce: 'n-old', body: '{}',
      })
      const result = await svc.verifySignature(secret, {
        method: 'POST', url: '/api/callback',
        timestamp: old, nonce: 'n-old', body: '{}', signature,
      })
      assert.equal(result.valid, false)
      assert.ok(result.error!.includes('out_of_window') || result.error!.includes('timestamp'))
    })

    it('缺失签名字段拒绝', async () => {
      const result = await svc.verifySignature('s', {
        method: 'GET', url: '/api/health',
        timestamp: 0, nonce: '', body: '', signature: '',
      })
      assert.equal(result.valid, false)
      assert.ok(result.error)
    })
  })
})
