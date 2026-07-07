import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [openapi] E2E 基础测试
 *
 * E2E 链路: OpenAPIController → services → adapters
 *
 * 覆盖:
 *   - API Key 完整流程: 创建 → 查询 → 撤销
 *   - Webhook: 订阅 → 投递 → 暂停 → 恢复 → 重试
 *   - Sandbox: 创建 → 查询 → 状态更新 → 清理
 *   - Usage: 桶创建 → 检查 → 报表
 *   - Signature: 签名验证
 *   - 响应格式一致性
 *   - 错误处理与边界
 *   - 租户隔离
 */

import 'reflect-metadata'
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

// ═══════════════════════════════════════════════════════
// 测试 App 构建
// ═══════════════════════════════════════════════════════

function makeApp() {
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

  return new OpenAPIController(apiKeySvc, webhookSvc, sandboxSvc, usageSvc, signVal)
}

// ═══════════════════════════════════════════════════════
// API Key E2E
// ═══════════════════════════════════════════════════════

describe('OpenAPI E2E: API Key', () => {
  let ctrl: ReturnType<typeof makeApp>

  beforeAll(() => {
    ctrl = makeApp()
  })

  it('完整 API Key 生命周期：创建→查询→统计→撤销', () => {
    // 创建
    const created = ctrl.createKey({
      tenantId: 't-e2e-001',
      environment: 'LIVE',
      name: 'E2E Test Key',
      scopes: [{ resource: '*', actions: ['*'] }],
      createdBy: 'e2e-tester',
    })
    assert.ok(created.apiKey.id)
    assert.ok(created.apiKey.keyId)
    assert.ok(created.apiKey.keyId.startsWith('sk_live_'))
    assert.equal(created.apiKey.name, 'E2E Test Key')
    assert.equal(created.apiKey.createdBy, 'e2e-tester')

    // 查询单个
    const got = ctrl.getKey('t-e2e-001', created.apiKey.keyId)
    assert.ok(got)
    assert.equal(got!.name, 'E2E Test Key')

    // 列表
    const list = ctrl.listKeys('t-e2e-001')
    assert.equal(list.keys.length, 1)

    // 统计
    const stats = ctrl.keyStats('t-e2e-001')
    assert.equal(stats.total, 1)
    assert.equal(stats.byStatus.ACTIVE, 1)

    // 撤销
    const revoked = ctrl.revokeKey({ tenantId: 't-e2e-001', keyId: created.apiKey.keyId, reason: 'E2E Test Revoke' })
    assert.ok(revoked)
    assert.equal(revoked.status, 'REVOKED')

    // 撤销后统计
    const statsAfter = ctrl.keyStats('t-e2e-001')
    assert.equal(statsAfter.byStatus.REVOKED, 1)
    assert.equal(statsAfter.byStatus.ACTIVE, 0)
  })

  it('跨租户隔离：不同租户互不可见', () => {
    ctrl.createKey({ tenantId: 't-a', environment: 'LIVE', name: 'Key A', scopes: [{ resource: '*', actions: ['*'] }] })
    ctrl.createKey({ tenantId: 't-b', environment: 'LIVE', name: 'Key B', scopes: [{ resource: '*', actions: ['*'] }] })

    assert.equal(ctrl.listKeys('t-a').keys.length, 1)
    assert.equal(ctrl.listKeys('t-b').keys.length, 1)
    assert.equal(ctrl.listKeys('t-c').keys.length, 0)
  })

  it('缺少 name 抛出错误', () => {
    assert.throws(() => {
      ctrl.createKey({
        tenantId: 't-e2e', environment: 'LIVE', name: '', scopes: [{ resource: '*', actions: ['*'] }],
      })
    }, /name_required/)
  })

  it('缺少 scopes 抛出错误', () => {
    assert.throws(() => {
      ctrl.createKey({
        tenantId: 't-e2e', environment: 'LIVE', name: 'Test', scopes: [],
      })
    }, /scopes_required/)
  })
})

// ═══════════════════════════════════════════════════════
// Webhook E2E
// ═══════════════════════════════════════════════════════

describe('OpenAPI E2E: Webhook', () => {
  let ctrl: ReturnType<typeof makeApp>

  beforeAll(() => {
    ctrl = makeApp()
  })

  it('完整 Webhook 生命周期：订阅→暂停→恢复→投递→列表→统计', async () => {
    // 订阅
    const sub = ctrl.subscribe({
      tenantId: 't-e2e-002',
      url: 'https://e2e-test.example.com/webhook',
      events: ['order.created', 'order.paid', 'member.upgraded'],
      description: 'E2E test webhook',
      createdBy: 'e2e',
    })
    assert.ok(sub.id)
    assert.ok(sub.id.startsWith('whsub-'))
    assert.equal(sub.status, 'ACTIVE')
    assert.equal(sub.events.length, 3)

    // 暂停
    const paused = ctrl.pauseWebhook({ tenantId: 't-e2e-002', subId: sub.id })!
    assert.equal(paused.status, 'PAUSED')

    // 恢复
    const resumed = ctrl.resumeWebhook({ tenantId: 't-e2e-002', subId: sub.id })!
    assert.equal(resumed.status, 'ACTIVE')

    // 列出订阅
    const list = ctrl.listWebhooks('t-e2e-002')
    assert.equal(list.subscriptions.length, 1)

    // 投递事件
    const delivery = await ctrl.dispatchWebhook({
      tenantId: 't-e2e-002',
      subscriptionId: sub.id,
      eventType: 'order.created',
      payload: { orderId: 'ORD-E2E-001', amount: 99.99 },
    })
    assert.ok(delivery.id)
    assert.equal(delivery.status, 'SUCCESS')

    // 投递日志
    const deliveries = ctrl.listDeliveries('t-e2e-002', undefined, '10')
    assert.ok(deliveries.deliveries.length >= 1)

    // Webhook 统计
    const stats = ctrl.webhookStats('t-e2e-002')
    assert.equal(stats.subscriptions.total, 1)
    assert.equal(stats.subscriptions.active, 1)
    assert.ok(stats.deliveries.total >= 1)
  })

  it('死信与重试', async () => {
    const sub = ctrl.subscribe({
      tenantId: 't-e2e-003',
      url: 'https://failing.example.com',
      events: ['payment.failed'],
      createdBy: 'e2e',
    })

    // 列出死信 (初始为空)
    const dead = ctrl.deadLetter('t-e2e-003')
    assert.ok(Array.isArray(dead.deadLetters))

    // 重试不存在投递
    assert.rejects(async () => {
      await ctrl.retryDelivery('t-e2e-003', 'nonexistent')
    })
  })

  it('非 HTTPS URL 订阅抛出错误', () => {
    assert.throws(() => {
      ctrl.subscribe({
        tenantId: 't-e2e', url: 'http://insecure.example.com', events: ['order.created'],
      })
    }, /url_must_be_https/)
  })

  it('空 events 订阅抛出错误', () => {
    assert.throws(() => {
      ctrl.subscribe({
        tenantId: 't-e2e', url: 'https://example.com/hook', events: [],
      })
    }, /events_required/)
  })
})

// ═══════════════════════════════════════════════════════
// Sandbox E2E
// ═══════════════════════════════════════════════════════

describe('OpenAPI E2E: Sandbox', () => {
  let ctrl: ReturnType<typeof makeApp>

  beforeAll(() => {
    ctrl = makeApp()
  })

  it('完整 Sandbox 生命周期：创建→查询→列表→状态更新→清理', () => {
    // 创建
    const sb = ctrl.createSandbox({
      parentTenantId: 't-e2e-004',
      name: 'E2E Sandbox',
      ttlDays: 30,
      dataMaskingEnabled: true,
    })
    assert.ok(sb.id)
    assert.ok(sb.tenantId.startsWith('t-sandbox-'))
    assert.equal(sb.status, 'ACTIVE')
    assert.equal(sb.dataMaskingEnabled, true)

    // 查询 (通过 tenantId)
    const got = ctrl.checkSandbox(sb.tenantId)
    assert.ok(got)
    assert.equal(got!.name, 'E2E Sandbox')

    // 列表
    const list = ctrl.listSandboxes('t-e2e-004')
    assert.equal(list.sandboxes.length, 1)

    // 状态更新
    const updated = ctrl.setSandboxStatus({ sandboxTenantId: sb.tenantId, status: 'EXPIRED' })
    assert.ok(updated)
    assert.equal(updated.status, 'EXPIRED')

    // 清理过期
    const cleanup = ctrl.cleanupSandbox()
    assert.ok(cleanup.cleaned >= 0)
  })

  it('不存在的 sandbox 查询返回 null', () => {
    const got = ctrl.checkSandbox('nonexistent-sandbox-id')
    assert.equal(got, null)
  })
})

// ═══════════════════════════════════════════════════════
// Usage E2E
// ═══════════════════════════════════════════════════════

describe('OpenAPI E2E: Usage', () => {
  let ctrl: ReturnType<typeof makeApp>

  beforeAll(() => {
    ctrl = makeApp()
  })

  it('完整使用流程：创建桶→检查配额→报表→列表', () => {
    // 创建桶
    const bucket = ctrl.createBucket({
      tenantId: 't-e2e-005',
      endpoint: '/api/e2e/orders',
      qps: 5,
      dailyQuota: 1000,
      windowMs: 60000,
    })
    assert.ok(bucket.id)

    // 检查配额
    const check = ctrl.checkUsage({
      tenantId: 't-e2e-005',
      keyId: 'sk_live_e2e_key',
      endpoint: '/api/e2e/orders',
    })
    assert.ok(check.allowed)
    assert.ok(check.remaining >= 0)

    // 报表
    const report = ctrl.usageReport('t-e2e-005')
    assert.equal(report.totalBuckets, 1)
    assert.equal(report.activeBuckets, 1)

    // 桶列表
    const buckets = ctrl.listBuckets('t-e2e-005')
    assert.equal(buckets.buckets.length, 1)
  })

  it('无桶时的配额检查通过（无 bucket 时不限流）', () => {
    const check = ctrl.checkUsage({
      tenantId: 't-unknown',
      keyId: 'sk_live_unknown',
      endpoint: '/api/unknown',
    })
    // RateLimiter.check returns allowed:true if no bucket matches (fallback allow)
    assert.equal(check.allowed, true)
  })
})

// ═══════════════════════════════════════════════════════
// Signature E2E
// ═══════════════════════════════════════════════════════

describe('OpenAPI E2E: Signature', () => {
  let ctrl: ReturnType<typeof makeApp>

  beforeAll(() => {
    ctrl = makeApp()
  })

  it('验证有效签名 — 使用真实 SignValidator', () => {
    const validator = new SignValidator()
    const now = Date.now()
    const secret = 'whsec_e2e_test_secret'
    const sig = validator.sign({
      secret, method: 'POST', url: '/api/e2e/orders',
      timestamp: now, nonce: 'n-e2e-001', body: '{"orderId":"ORD-001"}',
    })
    const result = ctrl.verifySignature({
      secret,
      request: {
        method: 'POST', url: '/api/e2e/orders',
        body: '{"orderId":"ORD-001"}',
        timestamp: now, nonce: 'n-e2e-001', signature: sig,
      },
    })
    assert.equal(result.valid, true)
  })

  it('验证无效签名 — 签名不匹配', () => {
    const result = ctrl.verifySignature({
      secret: 'whsec_test',
      request: {
        method: 'POST', url: '/api/test',
        body: '{}', timestamp: Date.now(), nonce: 'n-test',
        signature: 'invalid_signature_value',
      },
    })
    assert.equal(result.valid, false)
    assert.equal(result.reason, 'signature_mismatch')
  })

  it('验证无效签名 — 缺少字段', () => {
    const result = ctrl.verifySignature({
      secret: '',
      request: {} as any,
    })
    assert.equal(result.valid, false)
    assert.equal(result.reason, 'missing_fields')
  })

  it('验证过期签名 — 超出时间窗口', () => {
    const validator = new SignValidator()
    const expiredTs = Date.now() - 10 * 60 * 1000 // 10min > 5min window
    const sig = validator.sign({
      secret: 'test', method: 'GET', url: '/api/test',
      timestamp: expiredTs, nonce: 'n-old',
    })
    const result = ctrl.verifySignature({
      secret: 'test',
      request: {
        method: 'GET', url: '/api/test',
        timestamp: expiredTs, nonce: 'n-old',
        signature: sig,
      },
    })
    assert.equal(result.valid, false)
    assert.equal(result.reason, 'timestamp_out_of_window')
  })
})
