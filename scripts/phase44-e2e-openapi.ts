/**
 * 🦞 自动: [openapi] [A] e2e 补全
 *
 * OpenAPI 模块 E2E 测试 (Phase-44 P2 业务深度第 4 棒 / 收官)
 * - API Key 创建/撤销/Scope 检查
 * - HMAC-SHA256 签名校验 + 5min 重放窗口
 * - Webhook 投递 + 指数退避重试 + 死信
 * - Sandbox 创建/PII 脱敏/TTL 过期
 * - Rate Limit 滑动窗口 + 日配额
 * - Quota 用量统计 + 综合报表
 */
import assert from 'node:assert/strict'
import test, { describe, beforeEach } from 'node:test'
import { OpenAPIController } from '../apps/api/src/modules/openapi/openapi.controller'
import { KeyGenerator } from '../apps/api/src/modules/openapi/key-generator'
import { SignValidator } from '../apps/api/src/modules/openapi/sign-validator'
import { RateLimiter } from '../apps/api/src/modules/openapi/rate-limiter'
import { WebhookDispatcher } from '../apps/api/src/modules/openapi/webhook-dispatcher'
import { APIKeyService } from '../apps/api/src/modules/openapi/services/api-key.service'
import { WebhookService } from '../apps/api/src/modules/openapi/services/webhook.service'
import { SandboxService } from '../apps/api/src/modules/openapi/services/sandbox.service'
import { UsageService } from '../apps/api/src/modules/openapi/services/usage.service'
import { APIKeyAdapter } from '../apps/api/src/modules/openapi/datasources/api-key.adapter'
import { WebhookAdapter } from '../apps/api/src/modules/openapi/datasources/webhook.adapter'
import { SandboxAdapter } from '../apps/api/src/modules/openapi/datasources/sandbox.adapter'
import { RateLimitAdapter } from '../apps/api/src/modules/openapi/datasources/rate-limit.adapter'
import { QuotaAdapter } from '../apps/api/src/modules/openapi/datasources/quota.adapter'

const TENANT = 't-openapi-e2e'
const OTHER_TENANT = 't-openapi-e2e-other'

function buildApp() {
  // Adapters (共享)
  const apiKeyAdapter = new APIKeyAdapter()
  const webhookAdapter = new WebhookAdapter()
  const sandboxAdapter = new SandboxAdapter()
  const rateLimitAdapter = new RateLimitAdapter()
  const quotaAdapter = new QuotaAdapter()

  // Engines
  const keyGen = new KeyGenerator()
  const signValidator = new SignValidator()
  const rateLimiter = new RateLimiter(rateLimitAdapter)
  const dispatcher = new WebhookDispatcher(webhookAdapter)

  // Services
  const apiKeySvc = new APIKeyService(keyGen, apiKeyAdapter)
  const webhookSvc = new WebhookService(dispatcher, webhookAdapter)
  const sandboxSvc = new SandboxService(sandboxAdapter)
  const usageSvc = new UsageService(rateLimiter, quotaAdapter, rateLimitAdapter)

  // Controller
  const ctrl = new OpenAPIController(apiKeySvc, webhookSvc, sandboxSvc, usageSvc, signValidator)

  return {
    ctrl, keyGen, signValidator, rateLimiter, dispatcher,
    apiKeySvc, webhookSvc, sandboxSvc, usageSvc,
    apiKeyAdapter, webhookAdapter, sandboxAdapter, rateLimitAdapter, quotaAdapter
  }
}

describe('OpenAPI E2E - Phase-44 开放 API', () => {
  let ctx: ReturnType<typeof buildApp>

  beforeEach(() => {
    ctx = buildApp()
  })

  // ════════════════════════════════════════════════
  // AC-1: API Key 创建/撤销/Scope 检查
  // ════════════════════════════════════════════════

  describe('AC-1: API Key 全生命周期', () => {
    test('E2E-1 创建 LIVE Key 返回明文', () => {
      const r = ctx.ctrl.createKey({
        tenantId: TENANT, environment: 'LIVE', name: 'prod-key',
        scopes: [{ resource: 'orders', actions: ['read', 'write'] }]
      })
      assert.ok(r.apiKey.id)
      assert.ok(r.plaintextSecret)
      assert.equal(r.apiKey.environment, 'LIVE')
      assert.equal(r.apiKey.status, 'ACTIVE')
    })

    test('E2E-2 创建 sandbox Key (前缀 sk_sandbox_)', () => {
      const r = ctx.ctrl.createKey({
        tenantId: TENANT, environment: 'SANDBOX', name: 'test-sb',
        scopes: [{ resource: '*', actions: ['*'] }]
      })
      assert.ok(r.apiKey.keyId.startsWith('sk_sandbox_'))
    })

    test('E2E-3 列出 tenant 的所有 key', () => {
      ctx.ctrl.createKey({ tenantId: TENANT, environment: 'LIVE', name: 'k1', scopes: [{ resource: '*', actions: ['*'] }] })
      ctx.ctrl.createKey({ tenantId: TENANT, environment: 'TEST', name: 'k2', scopes: [{ resource: '*', actions: ['*'] }] })
      const { keys } = ctx.ctrl.listKeys(TENANT)
      assert.equal(keys.length, 2)
    })

    test('E2E-4 撤销 key 改状态', () => {
      const r = ctx.ctrl.createKey({
        tenantId: TENANT, environment: 'LIVE', name: 'k-revoke',
        scopes: [{ resource: '*', actions: ['*'] }]
      })
      ctx.ctrl.revokeKey({ tenantId: TENANT, keyId: r.apiKey.keyId, reason: 'test_revoke' })
      const got = ctx.ctrl.getKey(TENANT, r.apiKey.keyId)
      assert.ok(got)
      assert.equal(got!.status, 'REVOKED')
    })

    test('E2E-5 撤销后 scope 检查失败', () => {
      const r = ctx.ctrl.createKey({
        tenantId: TENANT, environment: 'LIVE', name: 'k-validate',
        scopes: [{ resource: 'orders', actions: ['read'] }]
      })
      ctx.ctrl.revokeKey({ tenantId: TENANT, keyId: r.apiKey.keyId, reason: 'test' })
      const v = ctx.apiKeySvc.validate(TENANT, r.apiKey.keyId, 'orders', 'read')
      assert.equal(v.valid, false)
      assert.equal(v.reason, 'revoked')
    })

    test('E2E-6 stats 按 environment 聚合', () => {
      ctx.ctrl.createKey({ tenantId: TENANT, environment: 'LIVE', name: 'live-1', scopes: [{ resource: '*', actions: ['*'] }] })
      ctx.ctrl.createKey({ tenantId: TENANT, environment: 'TEST', name: 'test-1', scopes: [{ resource: '*', actions: ['*'] }] })
      const s = ctx.ctrl.keyStats(TENANT)
      assert.equal(s.byEnvironment.LIVE, 1)
      assert.equal(s.byEnvironment.TEST, 1)
      assert.equal(s.total, 2)
    })
  })

  // ════════════════════════════════════════════════
  // AC-2: HMAC-SHA256 签名 + 5min 防重放
  // ════════════════════════════════════════════════

  describe('AC-2: HMAC 签名验证', () => {
    test('E2E-7 签名 + 验证往返一致', () => {
      const secret = 'super-secret-32-chars-abcdefghij'
      const ts = Date.now()
      const sig = ctx.signValidator.sign({
        secret, method: 'POST', url: '/api/orders',
        timestamp: ts, nonce: 'n1', body: '{"x":1}'
      })
      const r = ctx.ctrl.verifySignature({
        secret,
        request: { method: 'POST', url: '/api/orders', body: '{"x":1}', timestamp: ts, nonce: 'n1', signature: sig }
      })
      assert.equal(r.valid, true)
    })

    test('E2E-8 修改 body 签名失败', () => {
      const secret = 's3cret'
      const ts = Date.now()
      const sig = ctx.signValidator.sign({
        secret, method: 'POST', url: '/api/x', timestamp: ts, nonce: 'n1', body: 'a'
      })
      const r = ctx.ctrl.verifySignature({
        secret,
        request: { method: 'POST', url: '/api/x', body: 'b', timestamp: ts, nonce: 'n1', signature: sig }
      })
      assert.equal(r.valid, false)
      assert.equal(r.reason, 'signature_mismatch')
    })

    test('E2E-9 时间戳超出 5min 窗口', () => {
      const secret = 's3cret'
      const now = Date.now()
      const sig = ctx.signValidator.sign({
        secret, method: 'GET', url: '/api/x',
        timestamp: now - 6 * 60 * 1000, nonce: 'n1'
      })
      const r = ctx.signValidator.validate({
        secret,
        request: { method: 'GET', url: '/api/x', timestamp: now - 6 * 60 * 1000, nonce: 'n1', signature: sig },
        now
      })
      assert.equal(r.valid, false)
      assert.equal(r.reason, 'timestamp_out_of_window')
    })

    test('E2E-10 missing fields 拒绝', () => {
      const r = ctx.signValidator.validate({
        secret: 's',
        request: { method: 'GET', url: '/x', signature: 'x' } as any
      })
      assert.equal(r.valid, false)
      assert.equal(r.reason, 'missing_fields')
    })

    test('E2E-11 replay window = 5 分钟常量', () => {
      assert.equal(ctx.signValidator.getReplayWindowMs(), 5 * 60 * 1000)
    })
  })

  // ════════════════════════════════════════════════
  // AC-3: Webhook 投递 + 重试 + 死信
  // ════════════════════════════════════════════════

  describe('AC-3: Webhook 投递 + 死信', () => {
    function makeSub() {
      return ctx.ctrl.subscribe({
        tenantId: TENANT,
        url: 'https://example.com/hook',
        events: ['order.created', 'order.paid'],
        createdBy: 'admin'
      })
    }

    test('E2E-12 成功投递', async () => {
      const sub = makeSub()
      ctx.dispatcher.httpPoster = async () => ({ success: true, responseStatus: 200 })
      const d = await ctx.ctrl.dispatchWebhook({
        tenantId: TENANT, subscriptionId: sub.id,
        eventType: 'order.created', payload: { id: 'evt-1' }
      })
      assert.equal(d.status, 'SUCCESS')
    })

    test('E2E-13 失败进入 FAILED 状态 + nextRetryAt', async () => {
      const sub = makeSub()
      ctx.dispatcher.httpPoster = async () => ({ success: false, responseStatus: 500 })
      const d = await ctx.ctrl.dispatchWebhook({
        tenantId: TENANT, subscriptionId: sub.id,
        eventType: 'order.created', payload: { id: 'evt-2' }
      })
      assert.equal(d.status, 'FAILED')
      assert.ok(d.nextRetryAt)
    })

    test('E2E-14 重试 5 次后入死信 (DLQ)', async () => {
      const sub = makeSub()
      ctx.dispatcher.httpPoster = async () => ({ success: false, responseStatus: 500 })
      let d = await ctx.ctrl.dispatchWebhook({
        tenantId: TENANT, subscriptionId: sub.id,
        eventType: 'order.created', payload: { id: 'evt-dlq' }
      })
      for (let i = 1; i < 5; i++) {
        d = await ctx.ctrl.retryDelivery(TENANT, d.id)
      }
      assert.equal(d.status, 'DEAD_LETTER')
      assert.equal(d.attempts, 5)
      // 死信列表
      const { deadLetters } = ctx.ctrl.deadLetter(TENANT)
      assert.equal(deadLetters.length, 1)
    })

    test('E2E-15 同 eventId 重复投递 = duplicate', async () => {
      const sub = makeSub()
      ctx.dispatcher.httpPoster = async () => ({ success: true, responseStatus: 200 })
      await ctx.ctrl.dispatchWebhook({
        tenantId: TENANT, subscriptionId: sub.id,
        eventType: 'order.created', payload: { id: 'evt-dup' }
      })
      await assert.rejects(async () => {
        await ctx.ctrl.dispatchWebhook({
          tenantId: TENANT, subscriptionId: sub.id,
          eventType: 'order.created', payload: { id: 'evt-dup' }
        })
      }, /duplicate_delivery/)
    })

    test('E2E-16 暂停的订阅不可投递', async () => {
      const sub = makeSub()
      ctx.ctrl.pauseWebhook({ tenantId: TENANT, subId: sub.id })
      await assert.rejects(async () => {
        await ctx.ctrl.dispatchWebhook({
          tenantId: TENANT, subscriptionId: sub.id,
          eventType: 'order.created', payload: { id: 'evt-paused' }
        })
      }, /subscription_inactive/)
    })

    test('E2E-17 死信恢复重试', async () => {
      const sub = makeSub()
      let failCount = 0
      ctx.dispatcher.httpPoster = async () => {
        failCount++
        if (failCount < 6) return { success: false, responseStatus: 500 }
        return { success: true, responseStatus: 200 }
      }
      let d = await ctx.ctrl.dispatchWebhook({
        tenantId: TENANT, subscriptionId: sub.id,
        eventType: 'order.created', payload: { id: 'evt-recover' }
      })
      for (let i = 1; i < 5; i++) {
        d = await ctx.ctrl.retryDelivery(TENANT, d.id)
      }
      assert.equal(d.status, 'DEAD_LETTER')
      // 恢复后再次重试 → 成功
      const recovered = await ctx.webhookSvc.recoverFromDeadLetter(TENANT, d.id)
      assert.equal(recovered.status, 'SUCCESS')
    })

    test('E2E-18 URL 非 HTTPS 抛错', () => {
      assert.throws(() => {
        ctx.ctrl.subscribe({
          tenantId: TENANT, url: 'http://insecure.com/hook',
          events: ['order.created']
        })
      }, /url_must_be_https/)
    })

    test('E2E-19 重试延迟 1s/5s/30s/5m/30m', () => {
      assert.equal(ctx.dispatcher.getNextRetryDelay(0), 1000)
      assert.equal(ctx.dispatcher.getNextRetryDelay(1), 5000)
      assert.equal(ctx.dispatcher.getNextRetryDelay(2), 30000)
      assert.equal(ctx.dispatcher.getNextRetryDelay(3), 300000)
      assert.equal(ctx.dispatcher.getNextRetryDelay(4), 1800000)
      assert.equal(ctx.dispatcher.getMaxAttempts(), 5)
    })
  })

  // ════════════════════════════════════════════════
  // AC-4: Sandbox 创建 + PII 脱敏 + 过期
  // ════════════════════════════════════════════════

  describe('AC-4: Sandbox 沙箱环境', () => {
    test('E2E-20 创建沙箱 tenantId 前缀 t-sandbox-', () => {
      const sb = ctx.ctrl.createSandbox({
        parentTenantId: TENANT, name: 'qa-env', ttlDays: 7
      })
      assert.ok(sb.tenantId.startsWith('t-sandbox-'))
      assert.equal(sb.status, 'ACTIVE')
      assert.equal(sb.ttlDays, 7)
    })

    test('E2E-21 默认 ttlDays = 30', () => {
      const sb = ctx.ctrl.createSandbox({ parentTenantId: TENANT, name: 'def' })
      assert.equal(sb.ttlDays, 30)
    })

    test('E2E-22 PII 脱敏 (email/phone/idCard)', () => {
      const data = { name: 'Alice', email: 'a@x.com', phone: '13800000000', idCard: '110101' }
      const masked = ctx.sandboxSvc.maskData(data)
      assert.equal(masked.name, 'Alice')
      assert.equal(masked.email, '***MASKED***')
      assert.equal(masked.phone, '***MASKED***')
      assert.equal(masked.idCard, '***MASKED***')
    })

    test('E2E-23 isSandbox 识别', () => {
      assert.equal(ctx.sandboxAdapter.isSandbox('t-sandbox-foo'), true)
      assert.equal(ctx.sandboxAdapter.isSandbox('t-prod-foo'), false)
    })

    test('E2E-24 listByParent 关联', () => {
      ctx.ctrl.createSandbox({ parentTenantId: TENANT, name: 's1' })
      ctx.ctrl.createSandbox({ parentTenantId: TENANT, name: 's2' })
      const { sandboxes } = ctx.ctrl.listSandboxes(TENANT)
      assert.equal(sandboxes.length, 2)
    })

    test('E2E-25 清理过期沙箱', () => {
      // 直接插入一个过期沙箱
      ctx.sandboxAdapter.save({
        id: 'sb-expired', tenantId: 't-sandbox-expired',
        parentTenantId: TENANT, name: 'old', status: 'ACTIVE',
        ttlDays: 1, dataMaskingEnabled: true,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        expiresAt: new Date(Date.now() - 86400000).toISOString()
      })
      const r = ctx.ctrl.cleanupSandbox()
      assert.equal(r.cleaned, 1)
    })
  })

  // ════════════════════════════════════════════════
  // AC-5: Rate Limit + Quota 综合报表
  // ════════════════════════════════════════════════

  describe('AC-5: 限流 + 配额 + 报表', () => {
    test('E2E-26 QPS 超额拒绝', () => {
      ctx.ctrl.createBucket({ tenantId: TENANT, endpoint: '/api/x', qps: 3, dailyQuota: 0 })
      ctx.usageSvc.checkRequest({ tenantId: TENANT, keyId: 'k1', endpoint: '/api/x' })
      ctx.usageSvc.checkRequest({ tenantId: TENANT, keyId: 'k1', endpoint: '/api/x' })
      ctx.usageSvc.checkRequest({ tenantId: TENANT, keyId: 'k1', endpoint: '/api/x' })
      const r = ctx.usageSvc.checkRequest({ tenantId: TENANT, keyId: 'k1', endpoint: '/api/x' })
      assert.equal(r.allowed, false)
      assert.equal(r.reason, 'qps_exceeded')
    })

    test('E2E-27 日配额耗尽拒绝', () => {
      ctx.ctrl.createBucket({ tenantId: TENANT, endpoint: '/api/q', qps: 1000, dailyQuota: 2 })
      ctx.usageSvc.checkRequest({ tenantId: TENANT, keyId: 'k2', endpoint: '/api/q' })
      ctx.usageSvc.checkRequest({ tenantId: TENANT, keyId: 'k2', endpoint: '/api/q' })
      const r = ctx.usageSvc.checkRequest({ tenantId: TENANT, keyId: 'k2', endpoint: '/api/q' })
      assert.equal(r.allowed, false)
      assert.equal(r.reason, 'daily_quota_exceeded')
    })

    test('E2E-28 多租户隔离', () => {
      ctx.ctrl.createBucket({ tenantId: TENANT, endpoint: '/api/m', qps: 2, dailyQuota: 0 })
      ctx.ctrl.createBucket({ tenantId: OTHER_TENANT, endpoint: '/api/m', qps: 2, dailyQuota: 0 })
      ctx.usageSvc.checkRequest({ tenantId: TENANT, keyId: 'k1', endpoint: '/api/m' })
      ctx.usageSvc.checkRequest({ tenantId: TENANT, keyId: 'k1', endpoint: '/api/m' })
      const t1 = ctx.usageSvc.checkRequest({ tenantId: TENANT, keyId: 'k1', endpoint: '/api/m' })
      const t2 = ctx.usageSvc.checkRequest({ tenantId: OTHER_TENANT, keyId: 'k1', endpoint: '/api/m' })
      assert.equal(t1.allowed, false)
      assert.equal(t2.allowed, true)
    })

    test('E2E-29 综合报表含 totalBuckets/totalUsageToday', () => {
      ctx.ctrl.createBucket({ tenantId: TENANT, endpoint: '/api/r', qps: 100, dailyQuota: 100 })
      ctx.usageSvc.checkRequest({ tenantId: TENANT, keyId: 'rk', endpoint: '/api/r' })
      const r = ctx.ctrl.usageReport(TENANT)
      assert.ok(r.totalBuckets >= 1)
      assert.ok(r.totalUsageToday >= 1)
      assert.ok(r.topEndpoints)
    })

    test('E2E-30 listBuckets 列出', () => {
      ctx.ctrl.createBucket({ tenantId: TENANT, endpoint: '/api/l1', qps: 5, dailyQuota: 0 })
      ctx.ctrl.createBucket({ tenantId: TENANT, endpoint: '/api/l2', qps: 5, dailyQuota: 0 })
      const { buckets } = ctx.ctrl.listBuckets(TENANT)
      assert.equal(buckets.length, 2)
    })
  })

  // ════════════════════════════════════════════════
  // 反模式 v4 openapi-design + webhook-retry
  // ════════════════════════════════════════════════

  describe('反模式 v4 防护', () => {
    test('E2E-31 [openapi-design] URL 非 HTTPS 拒绝', () => {
      assert.throws(() => {
        ctx.ctrl.subscribe({
          tenantId: TENANT, url: 'http://example.com',
          events: ['order.created']
        })
      })
    })

    test('E2E-32 [webhook-retry] 重试次数 ≤ 5', () => {
      assert.equal(ctx.dispatcher.getMaxAttempts(), 5)
      assert.equal(ctx.dispatcher.isMaxAttemptsReached(4), false)
      assert.equal(ctx.dispatcher.isMaxAttemptsReached(5), true)
    })

    test('E2E-33 [openapi-design] 缺签名字段拒绝', () => {
      const r = ctx.signValidator.validate({
        secret: 's', request: { method: 'POST', url: '/x', signature: '', timestamp: 0, nonce: '' }
      })
      assert.equal(r.valid, false)
    })

    test('E2E-34 [sandbox-isolation] 沙箱不可重名 id 冲突', () => {
      const sb1 = ctx.ctrl.createSandbox({ parentTenantId: TENANT, name: 'same' })
      const sb2 = ctx.ctrl.createSandbox({ parentTenantId: TENANT, name: 'same' })
      assert.notEqual(sb1.id, sb2.id)
    })

    test('E2E-35 [openapi-design] API Key 格式前缀', () => {
      const live = ctx.ctrl.createKey({
        tenantId: TENANT, environment: 'LIVE', name: 'k-fmt',
        scopes: [{ resource: '*', actions: ['*'] }]
      })
      assert.ok(live.apiKey.keyId.startsWith('sk_live_'))
    })
  })
})