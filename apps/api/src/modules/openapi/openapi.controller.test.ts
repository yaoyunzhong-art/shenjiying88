import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
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

describe('OpenAPIController', () => {
  let ctrl: OpenAPIController

  beforeEach(() => {
    const apiKeyAdapter = new APIKeyAdapter()
    const webhookAdapter = new WebhookAdapter()
    const sandboxAdapter = new SandboxAdapter()
    const rateLimitAdapter = new RateLimitAdapter()
    const quotaAdapter = new QuotaAdapter()

    const keyGen = new KeyGenerator()
    const signVal = new SignValidator()
    const rateLimiter = new RateLimiter(rateLimitAdapter)
    const dispatcher = new WebhookDispatcher(webhookAdapter)
    dispatcher.httpPoster = async () => ({ success: true, responseStatus: 200 })

    const apiKeySvc = new APIKeyService(keyGen, apiKeyAdapter)
    const webhookSvc = new WebhookService(dispatcher, webhookAdapter)
    const sandboxSvc = new SandboxService(sandboxAdapter)
    const usageSvc = new UsageService(rateLimiter, quotaAdapter, rateLimitAdapter)

    ctrl = new OpenAPIController(apiKeySvc, webhookSvc, sandboxSvc, usageSvc, signVal)
  })

  // ─── API Key ───

  it('createKey + listKeys', () => {
    const r = ctrl.createKey({
      tenantId: 't1', environment: 'LIVE',
      name: 'prod', scopes: [{ resource: '*', actions: ['*'] }]
    })
    assert.ok(r.apiKey.id)
    assert.match(r.apiKey.keyId, /^sk_live_/)
    const list = ctrl.listKeys('t1')
    assert.equal(list.keys.length, 1)
  })

  it('getKey: 返回单个', () => {
    const r = ctrl.createKey({
      tenantId: 't1', environment: 'LIVE',
      name: 'k', scopes: [{ resource: '*', actions: ['*'] }]
    })
    const got = ctrl.getKey('t1', r.apiKey.keyId)
    assert.equal(got?.keyId, r.apiKey.keyId)
  })

  it('keyStats: 返回统计', () => {
    ctrl.createKey({ tenantId: 't1', environment: 'LIVE', name: 'k', scopes: [{ resource: '*', actions: ['*'] }] })
    const stats = ctrl.keyStats('t1')
    assert.equal(stats.total, 1)
  })

  it('revokeKey: 撤销', () => {
    const r = ctrl.createKey({ tenantId: 't1', environment: 'LIVE', name: 'k', scopes: [{ resource: '*', actions: ['*'] }] })
    const revoked = ctrl.revokeKey({ tenantId: 't1', keyId: r.apiKey.keyId, reason: 'test' })
    assert.equal(revoked?.status, 'REVOKED')
  })

  // ─── Webhook ───

  it('subscribe: 创建订阅', () => {
    const r = ctrl.subscribe({
      tenantId: 't1', url: 'https://hooks.example.com/x',
      events: ['order.created']
    })
    assert.ok(r.id)
    assert.equal(r.status, 'ACTIVE')
  })

  it('subscribe: 非 HTTPS URL 抛错', () => {
    assert.throws(() => {
      ctrl.subscribe({ tenantId: 't1', url: 'http://hooks.example.com/x', events: ['order.created'] })
    })
  })

  it('listWebhooks: 列出', () => {
    ctrl.subscribe({ tenantId: 't1', url: 'https://hooks.example.com/x', events: ['order.created'] })
    const list = ctrl.listWebhooks('t1')
    assert.equal(list.subscriptions.length, 1)
  })

  it('pauseWebhook + resumeWebhook', () => {
    const sub = ctrl.subscribe({ tenantId: 't1', url: 'https://hooks.example.com/x', events: ['order.created'] })
    ctrl.pauseWebhook({ tenantId: 't1', subId: sub.id })
    assert.equal(ctrl.listWebhooks('t1').subscriptions[0].status, 'PAUSED')
    ctrl.resumeWebhook({ tenantId: 't1', subId: sub.id })
    assert.equal(ctrl.listWebhooks('t1').subscriptions[0].status, 'ACTIVE')
  })

  it('dispatchWebhook: 投递事件', async () => {
    const sub = ctrl.subscribe({ tenantId: 't1', url: 'https://hooks.example.com/x', events: ['order.created'] })
    const delivery = await ctrl.dispatchWebhook({
      tenantId: 't1', subscriptionId: sub.id,
      eventType: 'order.created', payload: { id: 'e1', total: 100 }
    })
    assert.equal(delivery.status, 'SUCCESS')
  })

  it('listDeliveries: 投递日志', async () => {
    const sub = ctrl.subscribe({ tenantId: 't1', url: 'https://hooks.example.com/x', events: ['order.created'] })
    await ctrl.dispatchWebhook({ tenantId: 't1', subscriptionId: sub.id, eventType: 'order.created', payload: { id: 'e1' } })
    const list = ctrl.listDeliveries('t1', undefined, '10')
    assert.ok(list.deliveries.length >= 1)
  })

  it('webhookStats: 统计', () => {
    const stats = ctrl.webhookStats('t1')
    assert.ok(stats.subscriptions)
    assert.ok(stats.deliveries)
  })

  // ─── Sandbox ───

  it('createSandbox: 创建沙箱', () => {
    const env = ctrl.createSandbox({ parentTenantId: 't1', name: 'dev' })
    assert.match(env.tenantId, /^t-sandbox-/)
  })

  it('listSandboxes: 列出', () => {
    ctrl.createSandbox({ parentTenantId: 't1', name: 'sb1' })
    const list = ctrl.listSandboxes('t1')
    assert.equal(list.sandboxes.length, 1)
  })

  it('setSandboxStatus: 切换状态', () => {
    const env = ctrl.createSandbox({ parentTenantId: 't1', name: 'sb' })
    const updated = ctrl.setSandboxStatus({ sandboxTenantId: env.tenantId, status: 'EXPIRED' })
    assert.equal(updated?.status, 'EXPIRED')
  })

  it('cleanupSandbox: 清理过期', () => {
    const r = ctrl.cleanupSandbox()
    assert.ok(r.cleaned >= 0)
  })

  // ─── Usage ───

  it('createBucket + usageReport', () => {
    ctrl.createBucket({ tenantId: 't1', endpoint: '/api/x', qps: 100, dailyQuota: 1000 })
    const report = ctrl.usageReport('t1')
    assert.ok(report.totalBuckets >= 1)
  })

  it('checkUsage: 限流检查', () => {
    ctrl.createBucket({ tenantId: 't1', endpoint: '/api/x', qps: 5, dailyQuota: 1000 })
    const r = ctrl.checkUsage({ tenantId: 't1', keyId: 'k1', endpoint: '/api/x' })
    assert.equal(r.allowed, true)
  })

  it('listBuckets: 列出桶', () => {
    ctrl.createBucket({ tenantId: 't1', endpoint: '/api/a', qps: 10, dailyQuota: 0 })
    const list = ctrl.listBuckets('t1')
    assert.equal(list.buckets.length, 1)
  })

  // ─── Signature ───

  it('verifySignature: 合法签名', () => {
    const validator = new SignValidator()
    const now = Date.now()
    const sig = validator.sign({ secret: 's', method: 'POST', url: '/api', timestamp: now, nonce: 'n', body: '{}' })
    const r = ctrl.verifySignature({
      secret: 's',
      request: { method: 'POST', url: '/api', timestamp: now, nonce: 'n', body: '{}', signature: sig }
    })
    assert.equal(r.valid, true)
  })

  it('verifySignature: 非法签名', () => {
    const r = ctrl.verifySignature({
      secret: 's',
      request: { method: 'POST', url: '/api', timestamp: Date.now(), nonce: 'n', body: '{}', signature: 'fake' }
    })
    assert.equal(r.valid, false)
  })

  // ─── 隔离 ───

  it('[隔离] T1 数据不影响 T2', () => {
    ctrl.createKey({ tenantId: 't1', environment: 'LIVE', name: 'k', scopes: [{ resource: '*', actions: ['*'] }] })
    const t2List = ctrl.listKeys('t2')
    assert.equal(t2List.keys.length, 0)
  })
})