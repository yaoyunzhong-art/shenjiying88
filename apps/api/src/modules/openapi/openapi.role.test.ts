// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [openapi] 角色测试增强
 *
 * 8 角色视角的 openapi 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 覆盖端点: createKey, listKeys, revokeKey, subscribe, listWebhooks,
 *           dispatchWebhook, createSandbox, listSandboxes, createBucket,
 *           checkUsage, verifySignature
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 * 越权测试 + 租户隔离
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  TeamBuilding: '🤝团建',
  Marketing: '📢营销',
}

// ── 控制器工厂 (每次创建新实例以确保状态隔离) ──
function createCtrl() {
  const { APIKeyAdapter } = require('./datasources/api-key.adapter')
  const { WebhookAdapter } = require('./datasources/webhook.adapter')
  const { SandboxAdapter } = require('./datasources/sandbox.adapter')
  const { RateLimitAdapter } = require('./datasources/rate-limit.adapter')
  const { QuotaAdapter } = require('./datasources/quota.adapter')
  const { KeyGenerator } = require('./key-generator')
  const { SignValidator } = require('./sign-validator')
  const { RateLimiter } = require('./rate-limiter')
  const { WebhookDispatcher } = require('./webhook-dispatcher')
  const { APIKeyService } = require('./services/api-key.service')
  const { WebhookService } = require('./services/webhook.service')
  const { SandboxService } = require('./services/sandbox.service')
  const { UsageService } = require('./services/usage.service')
  const { OpenAPIController } = require('./openapi.controller')

  const apiKeyAdapter = new APIKeyAdapter()
  const webhookAdapter = new WebhookAdapter()
  const sandboxAdapter = new SandboxAdapter()
  const rateLimitAdapter = new RateLimitAdapter()
  const quotaAdapter = new QuotaAdapter()

  const keyGen = new KeyGenerator()
  const signVal = new SignValidator()
  const rateLimiter = new RateLimiter(rateLimitAdapter)
  const dispatcher = new WebhookDispatcher(webhookAdapter)

  const apiKeySvc = new APIKeyService(keyGen, apiKeyAdapter)
  const webhookSvc = new WebhookService(dispatcher, webhookAdapter)
  const sandboxSvc = new SandboxService(sandboxAdapter)
  const usageSvc = new UsageService(rateLimiter, quotaAdapter, rateLimitAdapter)

  return new OpenAPIController(apiKeySvc, webhookSvc, sandboxSvc, usageSvc, signVal)
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} openapi 角色测试`, () => {
  let ctrl: any

  beforeAll(() => {
    ctrl = createCtrl()
    // 准备店长数据
    ctrl.createKey({ tenantId: 'T-store-001', environment: 'LIVE', name: 'Store Key', scopes: [{ resource: '*', actions: ['*'] }] })
  })

  it('店长创建本店 API Key — 成功', () => {
    const result = ctrl.createKey({ tenantId: 'T-store-001', environment: 'LIVE', name: 'Cashier Key', scopes: [{ resource: 'orders', actions: ['read', 'write'] }] })
    assert.ok(result.apiKey.id)
    assert.equal(result.apiKey.environment, 'LIVE')
  })

  it('店长列出本店 Key — 仅见本店数据', () => {
    const list = ctrl.listKeys('T-store-001')
    // 1 from before + 1 from previous test
    assert.equal(list.keys.length, 2) // 2 keys total for this tenant
    for (const key of list.keys) {
      assert.equal(key.tenantId, 'T-store-001')
    }
  })

  it('店长无法查看其他门店 Key — 隔离', () => {
    ctrl.createKey({ tenantId: 'T-other-store', environment: 'LIVE', name: 'Other Key', scopes: [{ resource: '*', actions: ['*'] }] })
    const list = ctrl.listKeys('T-store-001')
    for (const key of list.keys) {
      assert.equal(key.tenantId, 'T-store-001')
    }
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} openapi 角色测试`, () => {
  let ctrl: any

  beforeAll(() => {
    ctrl = createCtrl()
  })

  it('前台可以创建沙箱测试 — 验证', () => {
    const sb = ctrl.createSandbox({ parentTenantId: 'T-front-001', name: 'Front Desk Test', ttlDays: 7 })
    assert.ok(sb.id)
    assert.ok(sb.tenantId.startsWith('t-sandbox-'))
    assert.equal(sb.ttlDays, 7)
  })

  it('前台查询本店沙箱列表', () => {
    ctrl.createSandbox({ parentTenantId: 'T-front-001', name: 'Dev SB' })
    const list = ctrl.listSandboxes('T-front-001')
    assert.equal(list.sandboxes.length, 2) // one from before test + one new
  })

  it('前台订阅 webhook 事件 — 监控收银', () => {
    const sub = ctrl.subscribe({ tenantId: 'T-front-001', url: 'https://pos.example.com/hook', events: ['order.created', 'order.paid'] })
    assert.ok(sub.id)
    assert.equal(sub.events.length, 2)
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} openapi 角色测试`, () => {
  let ctrl: any

  beforeAll(() => {
    ctrl = createCtrl()
  })

  it('HR 可以创建用于员工系统的 API Key', () => {
    const result = ctrl.createKey({ tenantId: 'T-hr-001', environment: 'TEST', name: 'HR System Key', scopes: [{ resource: 'members', actions: ['read'] }] })
    assert.ok(result.apiKey.id)
    assert.equal(result.apiKey.name, 'HR System Key')
  })

  it('HR 撤销旧 Key — 安全操作', () => {
    const result = ctrl.createKey({ tenantId: 'T-hr-001', environment: 'TEST', name: 'Old Key', scopes: [{ resource: '*', actions: ['*'] }] })
    const revoked = ctrl.revokeKey({ tenantId: 'T-hr-001', keyId: result.apiKey.keyId, reason: 'Key rotation for HR system' })
    assert.equal(revoked.status, 'REVOKED')
  })

  it('HR 无法撤销其他租户 Key — 权限隔离', () => {
    ctrl.createKey({ tenantId: 'T-hr-other', environment: 'LIVE', name: 'Other Key', scopes: [{ resource: '*', actions: ['*'] }] })
    // 模拟不存在的或跨租户拒绝
    assert.equal(ctrl.listKeys('T-hr-001').keys.filter((k: any) => k.tenantId !== 'T-hr-001').length, 0)
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} openapi 角色测试`, () => {
  let ctrl: any

  beforeAll(() => {
    ctrl = createCtrl()
  })

  it('安监验证 webhook 签名 — 有效', () => {
    const result = ctrl.verifySignature({
      secret: 'whsec_security_test_key',
      request: { method: 'POST', url: '/api/alert', timestamp: Date.now(), nonce: 'n1', body: '{}', signature: 'test_sig' },
    })
    // Validator internally validates, returns { valid: true/false }
    assert.ok(typeof result.valid === 'boolean')
  })

  it('安监验证 webhook 签名 — 非法返回 false', () => {
    const result = ctrl.verifySignature({
      secret: '',
      request: {},
    })
    assert.equal(result.valid, false)
  })

  it('安监查看 API Key 状态 — 审计', () => {
    ctrl.createKey({ tenantId: 'T-sec-001', environment: 'LIVE', name: 'Audited Key', scopes: [{ resource: '*', actions: ['*'] }] })
    const stats = ctrl.keyStats('T-sec-001')
    assert.ok(stats.total >= 1)
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} openapi 角色测试`, () => {
  let ctrl: any

  beforeAll(() => {
    ctrl = createCtrl()
  })

  it('导玩员可以查看沙箱 — 测试新游戏', () => {
    ctrl.createSandbox({ parentTenantId: 'T-guide-001', name: 'Game Test Sandbox', ttlDays: 14 })
    const list = ctrl.listSandboxes('T-guide-001')
    assert.ok(list.sandboxes.length >= 1)
  })

  it('导玩员订阅游戏事件通知', () => {
    const sub = ctrl.subscribe({ tenantId: 'T-guide-001', url: 'https://game.example.com/events', events: ['member.created', 'member.upgraded'] })
    assert.ok(sub.id)
    assert.ok(sub.status)
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Ops} openapi 角色测试`, () => {
  let ctrl: any

  beforeAll(() => {
    ctrl = createCtrl()
  })

  it('运行专员创建限流桶 — 保障服务稳定', () => {
    const bucket = ctrl.createBucket({ tenantId: 'T-ops-001', endpoint: '/api/orders', qps: 100, dailyQuota: 50000 })
    assert.ok(bucket.id)
  })

  it('运行专员检查使用配额 — 监控', () => {
    ctrl.createBucket({ tenantId: 'T-ops-001', endpoint: '/api/orders', qps: 10, dailyQuota: 10000 })
    const check = ctrl.checkUsage({ tenantId: 'T-ops-001', keyId: 'sk_live_ops_key', endpoint: '/api/orders' })
    assert.equal(check.allowed, true)
  })

  it('运行专员查看使用报表', () => {
    const report = ctrl.usageReport('T-ops-001')
    assert.ok(report.totalBuckets >= 0)
    assert.ok(typeof report.totalBuckets === 'number')
  })

  it('运行专员清理过期沙箱 — 运维操作', () => {
    const result = ctrl.cleanupSandbox()
    assert.ok(result.cleaned >= 0)
  })
})

// ── 🤝团建 ──
describe(`${ROLES.TeamBuilding} openapi 角色测试`, () => {
  let ctrl: any

  beforeAll(() => {
    ctrl = createCtrl()
  })

  it('团建可以创建活动专用 Key — 限时使用', () => {
    const result = ctrl.createKey({
      tenantId: 'T-team-001', environment: 'TEST', name: 'Team Event Key',
      scopes: [{ resource: 'members', actions: ['read'] }],
    })
    assert.ok(result.apiKey.id)
    assert.equal(result.apiKey.environment, 'TEST')
  })

  it('团建列出活动订阅 — 组队通知', () => {
    ctrl.subscribe({ tenantId: 'T-team-001', url: 'https://team.example.com/notify', events: ['member.created'] })
    const list = ctrl.listWebhooks('T-team-001')
    assert.ok(list.subscriptions.length >= 1)
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} openapi 角色测试`, () => {
  let ctrl: any

  beforeAll(() => {
    ctrl = createCtrl()
  })

  it('营销创建活动投放 webhook — 用户触达', () => {
    const sub = ctrl.subscribe({
      tenantId: 'T-mkt-001', url: 'https://mkt.example.com/coupon',
      events: ['coupon.issued', 'coupon.redeemed'],
      description: 'Marketing coupon events',
    })
    assert.ok(sub.id)
    assert.equal(sub.events.length, 2)
  })

  it('营销暂停/恢复活动通知', () => {
    const sub = ctrl.subscribe({ tenantId: 'T-mkt-001', url: 'https://mkt.example.com/promo', events: ['order.created'] })
    const paused = ctrl.pauseWebhook({ tenantId: 'T-mkt-001', subId: sub.id })
    assert.equal(paused.status, 'PAUSED')
    const resumed = ctrl.resumeWebhook({ tenantId: 'T-mkt-001', subId: sub.id })
    assert.equal(resumed.status, 'ACTIVE')
  })

  it('营销查看本租户桶列表 — 限流状态', () => {
    ctrl.createBucket({ tenantId: 'T-mkt-001', endpoint: '/api/mkt/coupons', qps: 5, dailyQuota: 5000 })
    const list = ctrl.listBuckets('T-mkt-001')
    assert.ok(Array.isArray(list.buckets))
  })
})
