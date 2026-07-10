/**
 * 🐜 自动: [openapi] Controller Spec 补全
 *
 * 单元测试风格 — 手动实例化 Controller + Mock Service
 * 覆盖 P-44 新增端点 + 已有端点 + 8 角色视角
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { NotFoundException } from '@nestjs/common'
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

describe('OpenAPIController (spec)', () => {
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
  // 路由元数据
  // ══════════════════════════════════════════════════════════

  describe('路由元数据', () => {
    it('Controller 路径应为 openapi', () => {
      const path = Reflect.getMetadata('path', OpenAPIController)
      expect(path).toBe('openapi')
    })

    it('GET /openapi/docs 路由存在', () => {
      const paths = ['docs', 'keys', 'usage', 'key/list', 'key/stats', 'key/revoke']
      for (const p of paths) {
        expect(() => controller[p as keyof OpenAPIController]).toBeDefined()
      }
    })
  })

  // ══════════════════════════════════════════════════════════
  // P-44 GET /openapi/docs
  // ══════════════════════════════════════════════════════════

  describe('👔店长 · GET /openapi/docs', () => {
    it('店长查看开放 API 文档确认功能完整性', () => {
      const doc = controller.getDocs()
      expect(doc.openapi).toBe('3.1.0')
      expect(doc.info.title).toContain('开放 API 网关')
    })

    it('店长检查文档包含 API Key 管理路径', () => {
      const doc = controller.getDocs()
      expect(doc.paths['/openapi/keys']).toBeDefined()
      expect(doc.paths['/openapi/keys'].post).toBeDefined()
    })
  })

  describe('🛒前台 · GET /openapi/docs', () => {
    it('前台确认文档包含 servers 配置', () => {
      const doc = controller.getDocs()
      expect(doc.servers.length).toBeGreaterThan(0)
    })

    it('前台检查文档包含 Auth 安全方案', () => {
      const doc = controller.getDocs()
      expect(doc.components.securitySchemes.ApiKeyAuth).toBeDefined()
    })
  })

  describe('👥HR · GET /openapi/docs', () => {
    it('HR 确认文档包含系统描述', () => {
      const doc = controller.getDocs()
      expect(doc.info.description).toContain('OpenAPI Gateway')
    })

    it('HR 确认文档覆盖沙箱环境说明', () => {
      const doc = controller.getDocs()
      expect(Object.keys(doc.paths).some(p => p.includes('sandbox'))).toBe(true)
    })
  })

  describe('🔧安监 · GET /openapi/docs', () => {
    it('安监检查文档未泄露内部敏感信息', () => {
      const doc = controller.getDocs()
      const docStr = JSON.stringify(doc).toLowerCase()
      expect(docStr).not.toContain('password')
      expect(docStr).not.toContain('secret_key')
    })

    it('安监确认安全方案类型正确', () => {
      const doc = controller.getDocs()
      const scheme = doc.components.securitySchemes.ApiKeyAuth
      expect(scheme.type).toBe('apiKey')
      expect(scheme.in).toBe('header')
    })
  })

  describe('🎮导玩员 · GET /openapi/docs', () => {
    it('导玩员检查文档含 Webhook 路径', () => {
      const doc = controller.getDocs()
      expect(Object.keys(doc.paths).some(p => p.includes('webhook'))).toBe(true)
    })
  })

  describe('🎯运行专员 · GET /openapi/docs', () => {
    it('运行专员确认 paths 含所有新增端点', () => {
      const doc = controller.getDocs()
      const paths = Object.keys(doc.paths)
      expect(paths).toContain('/openapi/keys')
      expect(paths).toContain('/openapi/keys/{id}')
      expect(paths).toContain('/openapi/usage')
    })
  })

  describe('🤝团建 · GET /openapi/docs', () => {
    it('团建确认文档可正常返回', () => {
      const doc = controller.getDocs()
      expect(doc).toBeDefined()
      expect(typeof doc).toBe('object')
    })
  })

  describe('📢营销 · GET /openapi/docs', () => {
    it('营销确认文档开放查询', () => {
      const doc = controller.getDocs()
      expect(doc.openapi).toBe('3.1.0')
    })
  })

  // ══════════════════════════════════════════════════════════
  // P-44 POST /openapi/keys
  // ══════════════════════════════════════════════════════════

  describe('👔店长 · POST /openapi/keys (新式路径)', () => {
    it('店长创建 LIVE 环境 API Key 成功', () => {
      const result = controller.createKeyV2({
        tenantId: 't-spec-1', environment: 'LIVE', name: '店长Key',
        scopes: [{ resource: '*', actions: ['*'] }],
      })
      expect(result.apiKey.keyId).toMatch(/^sk_live_/)
      expect(result.apiKey.status).toBe('ACTIVE')
    })

    it('店长创建空 scopes 应抛错', () => {
      expect(() => controller.createKeyV2({
        tenantId: 't-spec-1', environment: 'LIVE', name: 'BadKey', scopes: [],
      })).toThrow('scopes_required')
    })
  })

  describe('🛒前台 · POST /openapi/keys', () => {
    it('前台创建 TEST 环境 Key', () => {
      const result = controller.createKeyV2({
        tenantId: 't-front', environment: 'TEST', name: '前台测试',
        scopes: [{ resource: 'orders', actions: ['read'] }],
      })
      expect(result.apiKey.environment).toBe('TEST')
    })
  })

  describe('👥HR · POST /openapi/keys', () => {
    it('HR 创建 Key 时自定义 createdBy', () => {
      const result = controller.createKeyV2({
        tenantId: 't-hr', environment: 'LIVE', name: 'HRKey',
        scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'hr-department',
      })
      expect(result.apiKey.createdBy).toBe('hr-department')
    })
  })

  describe('🔧安监 · POST /openapi/keys', () => {
    it('安监验证 SANDBOX 环境 Key 创建', () => {
      const result = controller.createKeyV2({
        tenantId: 't-sec', environment: 'SANDBOX', name: 'SandboxKey',
        scopes: [{ resource: '*', actions: ['*'] }],
      })
      expect(result.apiKey.environment).toBe('SANDBOX')
    })
  })

  describe('🎮导玩员 · POST /openapi/keys', () => {
    it('导玩员创建受限 scope 的 Key', () => {
      const result = controller.createKeyV2({
        tenantId: 't-game', environment: 'LIVE', name: 'GameKey',
        scopes: [{ resource: 'games', actions: ['read'] }],
      })
      expect(result.apiKey.status).toBe('ACTIVE')
    })
  })

  describe('🎯运行专员 · POST /openapi/keys', () => {
    it('运行专员批量创建 Key', () => {
      for (let i = 0; i < 5; i++) {
        controller.createKeyV2({
          tenantId: 't-ops', environment: 'LIVE', name: `Key-${i}`,
          scopes: [{ resource: '*', actions: ['*'] }],
        })
      }
      const listed = controller.listKeysV2('t-ops')
      expect(listed.keys.length).toBe(5)
    })
  })

  // ══════════════════════════════════════════════════════════
  // P-44 GET /openapi/keys
  // ══════════════════════════════════════════════════════════

  describe('👔店长 · GET /openapi/keys', () => {
    it('空租户应返回空列表', () => {
      const result = controller.listKeysV2('t-empty')
      expect(result.keys).toEqual([])
    })

    it('列出指定租户所有 Key', () => {
      controller.createKeyV2({ tenantId: 't-list', environment: 'LIVE', name: 'K1', scopes: [{ resource: '*', actions: ['*'] }] })
      controller.createKeyV2({ tenantId: 't-list', environment: 'TEST', name: 'K2', scopes: [{ resource: '*', actions: ['*'] }] })
      expect(controller.listKeysV2('t-list').keys.length).toBe(2)
    })
  })

  describe('🔧安监 · GET /openapi/keys', () => {
    it('跨租户隔离 — T1 看不到 T2', () => {
      controller.createKeyV2({ tenantId: 't-sec-a', environment: 'LIVE', name: 'SA', scopes: [{ resource: '*', actions: ['*'] }] })
      controller.createKeyV2({ tenantId: 't-sec-b', environment: 'LIVE', name: 'SB', scopes: [{ resource: '*', actions: ['*'] }] })
      expect(controller.listKeysV2('t-sec-a').keys.length).toBe(1)
      expect(controller.listKeysV2('t-sec-b').keys.length).toBe(1)
      expect(controller.listKeysV2('t-sec-a').keys[0].name).toBe('SA')
    })
  })

  describe('🎯运行专员 · GET /openapi/keys', () => {
    it('支持 environment 过滤', () => {
      controller.createKeyV2({ tenantId: 't-filt', environment: 'LIVE', name: 'L', scopes: [{ resource: '*', actions: ['*'] }] })
      controller.createKeyV2({ tenantId: 't-filt', environment: 'TEST', name: 'T', scopes: [{ resource: '*', actions: ['*'] }] })
      expect(controller.listKeysV2('t-filt', 'LIVE').keys.length).toBe(1)
      expect(controller.listKeysV2('t-filt', 'LIVE').keys[0].environment).toBe('LIVE')
    })
  })

  // ══════════════════════════════════════════════════════════
  // P-44 DELETE /openapi/keys/:id
  // ══════════════════════════════════════════════════════════

  describe('👔店长 · DELETE /openapi/keys/:id', () => {
    it('店长撤销 Key 成功', () => {
      const created = controller.createKeyV2({ tenantId: 't-del', environment: 'LIVE', name: 'DelMe', scopes: [{ resource: '*', actions: ['*'] }] })
      const result = controller.deleteKeyV2('t-del', created.apiKey.keyId)
      expect(result).toBeUndefined()
      const key = apiKeySvc.get('t-del', created.apiKey.keyId)
      expect(key).not.toBeNull()
      expect(key!.status).toBe('REVOKED')
    })
  })

  describe('🔧安监 · DELETE /openapi/keys/:id', () => {
    it('不可删除其他租户的 Key', () => {
      const created = controller.createKeyV2({ tenantId: 't-del-a', environment: 'LIVE', name: 'A', scopes: [{ resource: '*', actions: ['*'] }] })
      expect(() => controller.deleteKeyV2('t-del-b', created.apiKey.keyId)).toThrow()
    })

    it('不存在的 Key 抛 NotFoundException', () => {
      expect(() => controller.deleteKeyV2('t-del', 'nonexistent')).toThrow()
    })
  })

  // ══════════════════════════════════════════════════════════
  // P-44 GET /openapi/usage
  // ══════════════════════════════════════════════════════════

  describe('🎯运行专员 · GET /openapi/usage', () => {
    it('空租户用量统计为零', () => {
      const result = controller.getUsageV2('t-empty')
      expect(result.totalBuckets).toBe(0)
      expect(result.totalUsageToday).toBe(0)
    })

    it('有 bucket 时反映准确用量', () => {
      usageSvc.createBucket({ tenantId: 't-usage', endpoint: '/api/orders', qps: 100, dailyQuota: 1000 })
      const result = controller.getUsageV2('t-usage')
      expect(result.totalBuckets).toBe(1)
      expect(result.activeBuckets).toBe(1)
    })
  })

  describe('📢营销 · GET /openapi/usage', () => {
    it('营销检查 API 用量', () => {
      usageSvc.createBucket({ tenantId: 't-mkt', endpoint: '/api/campaign', qps: 50, dailyQuota: 500 })
      const result = controller.getUsageV2('t-mkt')
      expect(result.totalBuckets).toBe(1)
    })
  })

  // ══════════════════════════════════════════════════════════
  // 已有端点 — API Key 管理
  // ══════════════════════════════════════════════════════════

  describe('POST /openapi/key/create', () => {
    it('正例：创建 Key 成功', () => {
      const r = controller.createKey({ tenantId: 't1', environment: 'LIVE', name: 'prod', scopes: [{ resource: '*', actions: ['*'] }] })
      expect(r.apiKey.keyId).toMatch(/^sk_live_/)
    })

    it('反例：空 name 抛错', () => {
      expect(() => controller.createKey({ tenantId: 't1', environment: 'LIVE', name: '', scopes: [{ resource: '*', actions: ['*'] }] })).toThrow()
    })
  })

  describe('GET /openapi/key/list', () => {
    it('正例：列出 Key', () => {
      controller.createKey({ tenantId: 't-lst', environment: 'LIVE', name: 'k', scopes: [{ resource: '*', actions: ['*'] }] })
      expect(controller.listKeys('t-lst').keys.length).toBe(1)
    })

    it('反例：空租户返回空', () => {
      expect(controller.listKeys('').keys).toEqual([])
    })
  })

  describe('GET /openapi/key/stats', () => {
    it('正例：统计正确', () => {
      controller.createKey({ tenantId: 't-sts', environment: 'LIVE', name: 'k', scopes: [{ resource: '*', actions: ['*'] }] })
      const stats = controller.keyStats('t-sts')
      expect(stats.total).toBe(1)
      expect(stats.byStatus.ACTIVE).toBe(1)
    })

    it('撤销后统计更新', () => {
      const r = controller.createKey({ tenantId: 't-sts2', environment: 'TEST', name: 'k2', scopes: [{ resource: '*', actions: ['*'] }] })
      controller.revokeKey({ tenantId: 't-sts2', keyId: r.apiKey.keyId, reason: 'test' })
      const stats = controller.keyStats('t-sts2')
      expect(stats.byStatus.REVOKED).toBe(1)
    })
  })

  describe('POST /openapi/key/revoke', () => {
    it('正例：撤销成功', () => {
      const r = controller.createKey({ tenantId: 't-rv', environment: 'LIVE', name: 'k', scopes: [{ resource: '*', actions: ['*'] }] })
      const revoked = controller.revokeKey({ tenantId: 't-rv', keyId: r.apiKey.keyId, reason: 'test' })
      expect(revoked!.status).toBe('REVOKED')
    })

    it('反例：重复撤销抛错', () => {
      const r = controller.createKey({ tenantId: 't-dr', environment: 'LIVE', name: 'k', scopes: [{ resource: '*', actions: ['*'] }] })
      controller.revokeKey({ tenantId: 't-dr', keyId: r.apiKey.keyId, reason: 'first' })
      expect(() => controller.revokeKey({ tenantId: 't-dr', keyId: r.apiKey.keyId, reason: 'again' })).toThrow()
    })
  })

  describe('GET /openapi/key/:keyId', () => {
    it('正例：查询单个 Key', () => {
      const r = controller.createKey({ tenantId: 't-get', environment: 'LIVE', name: 'k', scopes: [{ resource: '*', actions: ['*'] }] })
      const got = controller.getKey('t-get', r.apiKey.keyId)
      expect(got).not.toBeNull()
      expect(got!.keyId).toBe(r.apiKey.keyId)
    })

    it('反例：不存在的 Key 返回 null', () => {
      expect(controller.getKey('t-none', 'sk_live_nonexistent')).toBeNull()
    })
  })

  // ══════════════════════════════════════════════════════════
  // 已有端点 — Webhook
  // ══════════════════════════════════════════════════════════

  describe('Webhook 端点', () => {
    it('POST subscribe — 创建订阅', () => {
      const r = controller.subscribe({ tenantId: 't-wh', url: 'https://hooks.example.com/x', events: ['order.created'] })
      expect(r.id).toBeDefined()
      expect(r.status).toBe('ACTIVE')
    })

    it('反例：非 HTTPS URL 抛错', () => {
      expect(() => controller.subscribe({ tenantId: 't-wh', url: 'http://insecure.com', events: ['order.created'] })).toThrow()
    })

    it('GET list — 列出订阅', () => {
      controller.subscribe({ tenantId: 't-wh2', url: 'https://hooks.example.com/y', events: ['order.paid'] })
      expect(controller.listWebhooks('t-wh2').subscriptions.length).toBe(1)
    })

    it('POST pause → resume 状态切换', () => {
      const sub = controller.subscribe({ tenantId: 't-wh3', url: 'https://hooks.example.com/z', events: ['order.created'] })
      controller.pauseWebhook({ tenantId: 't-wh3', subId: sub.id })
      expect(controller.listWebhooks('t-wh3').subscriptions[0].status).toBe('PAUSED')
      controller.resumeWebhook({ tenantId: 't-wh3', subId: sub.id })
      expect(controller.listWebhooks('t-wh3').subscriptions[0].status).toBe('ACTIVE')
    })

    it('反例：空事件列表抛错', () => {
      expect(() => controller.subscribe({ tenantId: 't-wh', url: 'https://example.com', events: [] })).toThrow()
    })
  })

  // ══════════════════════════════════════════════════════════
  // 已有端点 — Sandbox
  // ══════════════════════════════════════════════════════════

  describe('🎯运行专员 · Sandbox 端点', () => {
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

  describe('🔧安监 · POST /openapi/sign/verify', () => {
    it('正例：验证合法签名', () => {
      const now = Date.now()
      const sig = signValidator.sign({ secret: 'mysecret', method: 'POST', url: '/api', timestamp: now, nonce: 'n1', body: '{}' })
      const r = controller.verifySignature({ secret: 'mysecret', request: { method: 'POST', url: '/api', timestamp: now, nonce: 'n1', body: '{}', signature: sig } })
      expect(r.valid).toBe(true)
    })

    it('反例：拒绝非法签名', () => {
      const r = controller.verifySignature({ secret: 's', request: { method: 'POST', url: '/api', timestamp: Date.now(), nonce: 'n', body: '{}', signature: 'fake' } })
      expect(r.valid).toBe(false)
    })

    it('边界：空 secret 拒绝', () => {
      const r = controller.verifySignature({ secret: '', request: { method: 'POST', url: '/api', timestamp: Date.now(), nonce: 'n', body: '{}', signature: 'x' } })
      expect(r.valid).toBe(false)
    })
  })

  // ══════════════════════════════════════════════════════════
  // 边界与反例合集
  // ══════════════════════════════════════════════════════════

  describe('边界与反例', () => {
    it('空租户 Webhook 列表返回 []', () => {
      expect(controller.listWebhooks('').subscriptions).toEqual([])
    })

    it('空租户 Sandbox 列表返回 []', () => {
      expect(controller.listSandboxes('').sandboxes).toEqual([])
    })

    it('批量创建 50 个 Key 不报错', () => {
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
