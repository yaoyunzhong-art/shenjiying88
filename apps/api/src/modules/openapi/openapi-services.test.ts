import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { APIKeyService } from './services/api-key.service'
import { SandboxService } from './services/sandbox.service'
import { UsageService } from './services/usage.service'
import { KeyGenerator } from './key-generator'
import { RateLimiter } from './rate-limiter'
import { APIKeyAdapter } from './datasources/api-key.adapter'
import { SandboxAdapter } from './datasources/sandbox.adapter'
import { QuotaAdapter } from './datasources/quota.adapter'
import { RateLimitAdapter } from './datasources/rate-limit.adapter'

describe('OpenAPI Services 综合', () => {
  let apiKeySvc: APIKeyService
  let sandboxSvc: SandboxService
  let usageSvc: UsageService
  let keyGen: KeyGenerator
  let rateLimiter: RateLimiter

  beforeEach(() => {
    keyGen = new KeyGenerator()
    const rateLimitAdapter = new RateLimitAdapter()
    rateLimiter = new RateLimiter(rateLimitAdapter)
    apiKeySvc = new APIKeyService(keyGen, new APIKeyAdapter())
    sandboxSvc = new SandboxService(new SandboxAdapter())
    // 共用 RateLimitAdapter 保证 bucket 可见
    usageSvc = new UsageService(rateLimiter, new QuotaAdapter(), rateLimitAdapter)
  })

  // ─── APIKeyService ───

  describe('APIKeyService', () => {
    it('create: 生成 + 返回明文', () => {
      const r = apiKeySvc.create({
        tenantId: 't1', environment: 'LIVE', name: 'prod',
        scopes: [{ resource: '*', actions: ['*'] }],
        createdBy: 'admin'
      })
      assert.ok(r.apiKey.id)
      assert.ok(r.plaintextSecret)
    })

    it('create: name 必填', () => {
      assert.throws(() => {
        apiKeySvc.create({
          tenantId: 't1', environment: 'LIVE', name: '',
          scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'admin'
        })
      })
    })

    it('create: scopes 必填', () => {
      assert.throws(() => {
        apiKeySvc.create({
          tenantId: 't1', environment: 'LIVE', name: 'k',
          scopes: [], createdBy: 'admin'
        })
      })
    })

    it('list: 按环境过滤', () => {
      apiKeySvc.create({ tenantId: 't1', environment: 'LIVE', name: 'l1', scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'a' })
      apiKeySvc.create({ tenantId: 't1', environment: 'TEST', name: 't1', scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'a' })
      assert.equal(apiKeySvc.list('t1', 'LIVE').length, 1)
      assert.equal(apiKeySvc.list('t1', 'TEST').length, 1)
    })

    it('revoke: 撤销后状态变化', () => {
      const r = apiKeySvc.create({
        tenantId: 't1', environment: 'LIVE', name: 'k',
        scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'a'
      })
      const revoked = apiKeySvc.revoke('t1', r.apiKey.keyId, 'manual')
      assert.equal(revoked?.status, 'REVOKED')
    })

    it('revoke: 已撤销的不可再撤销', () => {
      const r = apiKeySvc.create({
        tenantId: 't1', environment: 'LIVE', name: 'k',
        scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'a'
      })
      apiKeySvc.revoke('t1', r.apiKey.keyId, 'a')
      assert.throws(() => apiKeySvc.revoke('t1', r.apiKey.keyId, 'b'))
    })

    it('validate: scope 检查', () => {
      const r = apiKeySvc.create({
        tenantId: 't1', environment: 'LIVE', name: 'k',
        scopes: [{ resource: 'orders', actions: ['read'] }],
        createdBy: 'a'
      })
      const v1 = apiKeySvc.validate('t1', r.apiKey.keyId, 'orders', 'read')
      assert.equal(v1.valid, true)
      const v2 = apiKeySvc.validate('t1', r.apiKey.keyId, 'orders', 'write')
      assert.equal(v2.valid, false)
      assert.equal(v2.reason, 'scope_mismatch')
    })

    it('validate: 撤销的失效', () => {
      const r = apiKeySvc.create({
        tenantId: 't1', environment: 'LIVE', name: 'k',
        scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'a'
      })
      apiKeySvc.revoke('t1', r.apiKey.keyId, 'a')
      const v = apiKeySvc.validate('t1', r.apiKey.keyId, 'orders', 'read')
      assert.equal(v.valid, false)
      assert.equal(v.reason, 'revoked')
    })

    it('stats: 完整统计', () => {
      apiKeySvc.create({ tenantId: 't1', environment: 'LIVE', name: 'k1', scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'a' })
      apiKeySvc.create({ tenantId: 't1', environment: 'TEST', name: 'k2', scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'a' })
      const stats = apiKeySvc.stats('t1')
      assert.equal(stats.total, 2)
      assert.equal(stats.byEnvironment.LIVE, 1)
      assert.equal(stats.byEnvironment.TEST, 1)
    })

    it('detectEnvironment: 通过 keyId', () => {
      assert.equal(apiKeySvc.detectEnvironment('sk_live_xxx'), 'LIVE')
      assert.equal(apiKeySvc.detectEnvironment('sk_test_xxx'), 'TEST')
      assert.equal(apiKeySvc.detectEnvironment('sk_sandbox_xxx'), 'SANDBOX')
      assert.equal(apiKeySvc.detectEnvironment('other_xxx'), null)
    })
  })

  // ─── SandboxService ───

  describe('SandboxService', () => {
    it('create: 生成沙箱 ID 前缀 t-sandbox-', () => {
      const env = sandboxSvc.create({
        parentTenantId: 't1', name: 'dev-sandbox'
      })
      assert.match(env.tenantId, /^t-sandbox-/)
      assert.equal(env.parentTenantId, 't1')
      assert.equal(env.status, 'ACTIVE')
    })

    it('create: TTL 30 天默认', () => {
      const env = sandboxSvc.create({ parentTenantId: 't1', name: 'sb' })
      const ttl = new Date(env.expiresAt).getTime() - new Date(env.createdAt).getTime()
      const ttlDays = Math.round(ttl / 86400000)
      assert.equal(ttlDays, 30)
    })

    it('get: 查询沙箱', () => {
      const env = sandboxSvc.create({ parentTenantId: 't1', name: 'sb' })
      const found = sandboxSvc.get(env.tenantId)
      assert.equal(found?.id, env.id)
    })

    it('listByParent: 列出所有关联沙箱', () => {
      sandboxSvc.create({ parentTenantId: 't1', name: 'sb1' })
      sandboxSvc.create({ parentTenantId: 't1', name: 'sb2' })
      sandboxSvc.create({ parentTenantId: 't2', name: 'sb3' })
      assert.equal(sandboxSvc.listByParent('t1').length, 2)
      assert.equal(sandboxSvc.listByParent('t2').length, 1)
    })

    it('maskData: PII 字段脱敏', () => {
      const masked = sandboxSvc.maskData({
        email: 'a@b.com', phone: '13800001111', name: 'Alice', total: 100
      })
      assert.equal(masked.email, '***MASKED***')
      assert.equal(masked.phone, '***MASKED***')
      assert.equal(masked.name, 'Alice')
      assert.equal(masked.total, 100)
    })

    it('maskData: 覆盖 password/token/idCard', () => {
      const masked = sandboxSvc.maskData({
        password: 'p', token: 't', idCard: 'ID', ssn: 'S', creditCard: 'CC'
      })
      assert.equal(masked.password, '***MASKED***')
      assert.equal(masked.token, '***MASKED***')
      assert.equal(masked.idCard, '***MASKED***')
      assert.equal(masked.ssn, '***MASKED***')
      assert.equal(masked.creditCard, '***MASKED***')
    })

    it('isSandbox: 通过 tenantId 前缀识别', () => {
      assert.equal(sandboxSvc.isSandbox('t-sandbox-xxx'), true)
      assert.equal(sandboxSvc.isSandbox('t-prod-xxx'), false)
    })

    it('setStatus: 切换状态', () => {
      const env = sandboxSvc.create({ parentTenantId: 't1', name: 'sb' })
      const updated = sandboxSvc.setStatus(env.tenantId, 'EXPIRED')
      assert.equal(updated?.status, 'EXPIRED')
    })
  })

  // ─── UsageService ───

  describe('UsageService', () => {
    it('createBucket + checkRequest', () => {
      usageSvc.createBucket({ tenantId: 't1', endpoint: '/api/x', qps: 5, dailyQuota: 10 })
      const r = usageSvc.checkRequest({ tenantId: 't1', keyId: 'k1', endpoint: '/api/x' })
      assert.equal(r.allowed, true)
    })

    it('checkRequest: 超额拒绝', () => {
      usageSvc.createBucket({ tenantId: 't1', endpoint: '/api/x', qps: 1000, dailyQuota: 2 })
      usageSvc.checkRequest({ tenantId: 't1', keyId: 'k1', endpoint: '/api/x' })
      usageSvc.checkRequest({ tenantId: 't1', keyId: 'k1', endpoint: '/api/x' })
      const r = usageSvc.checkRequest({ tenantId: 't1', keyId: 'k1', endpoint: '/api/x' })
      assert.equal(r.allowed, false)
    })

    it('getUsage: 查询用量', () => {
      usageSvc.createBucket({ tenantId: 't1', endpoint: '/api/x', qps: 1000, dailyQuota: 100 })
      usageSvc.checkRequest({ tenantId: 't1', keyId: 'k1', endpoint: '/api/x' })
      const u = usageSvc.getUsage('t1', 'k1')
      assert.ok(u)
      assert.ok(u!.usedCount >= 1)
    })

    it('listBuckets: 列出', () => {
      usageSvc.createBucket({ tenantId: 't1', endpoint: '/api/a', qps: 10, dailyQuota: 0 })
      usageSvc.createBucket({ tenantId: 't1', endpoint: '/api/b', qps: 20, dailyQuota: 0 })
      assert.equal(usageSvc.listBuckets('t1').length, 2)
    })

    it('report: 综合报表', () => {
      usageSvc.createBucket({ tenantId: 't1', endpoint: '/api/x', qps: 1000, dailyQuota: 100 })
      usageSvc.checkRequest({ tenantId: 't1', keyId: 'k1', endpoint: '/api/x' })
      const r = usageSvc.report('t1')
      assert.ok(r.totalBuckets >= 1)
      assert.ok(r.activeBuckets >= 1)
      assert.ok(r.totalUsageToday >= 1)
    })
  })
})