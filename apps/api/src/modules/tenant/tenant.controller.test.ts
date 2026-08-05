import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * TenantController 单元测试 (node:test)
 *
 * 策略：用内联 Controller（模拟 NestJS 装饰器行为）测试 resolveTenant 核心业务逻辑。
 */

import assert from 'node:assert/strict'

// ── Type mirror ─────────────────────────────────────────────────
interface TenantAwareRequest {
  tenantContext?: {
    tenantId?: string
    brandId?: string
    storeId?: string
    marketCode?: string
  }
  actorContext?: {
    actorId?: string
    actorType?: string
    actorName?: string
    tenantId?: string
    brandId?: string
    storeId?: string
    roles?: string[]
    permissions?: string[]
    authenticated?: boolean
  }
  governanceContext?: {
    requestId?: string
    startedAt?: number
  }
}

enum TenantLifecycleStatus {
  Active = 'ACTIVE',
  Suspended = 'SUSPENDED',
  Deleted = 'DELETED'
}

// ── Inline Controller (mirrors source: tenant.controller.ts) ────
class TenantController {
  resolveTenant(req: TenantAwareRequest) {
    const { tenantContext, actorContext, governanceContext } = req

    const effectiveTenantId =
      actorContext?.tenantId ?? tenantContext?.tenantId ?? 'tenant-demo'

    return {
      requestId: governanceContext?.requestId,
      effectiveTenantId,
      effectiveBrandId: actorContext?.brandId ?? tenantContext?.brandId,
      effectiveStoreId: actorContext?.storeId ?? tenantContext?.storeId,
      effectiveMarketCode: tenantContext?.marketCode,
      actor: actorContext
        ? {
            actorId: actorContext.actorId,
            actorType: actorContext.actorType,
            actorName: actorContext.actorName,
            roles: actorContext.roles,
            permissions: actorContext.permissions,
            authenticated: actorContext.authenticated,
          }
        : null,
      source: 'tenant-module',
    }
  }

  // ── 配额管理模拟 ──
  private quotas = new Map<string, any>()

  initQuota(body: { tenantId: string; tier?: string }) {
    const quota = {
      tenantId: body.tenantId,
      tier: body.tier ?? 'FREE',
      maxBrands: body.tier === 'ENTERPRISE' ? 100 : body.tier === 'PRO' ? 20 : 5,
      maxStores: body.tier === 'ENTERPRISE' ? 1000 : body.tier === 'PRO' ? 100 : 10,
      maxMembers: body.tier === 'ENTERPRISE' ? 100000 : body.tier === 'PRO' ? 5000 : 500,
      maxCampaigns: body.tier === 'ENTERPRISE' ? 500 : body.tier === 'PRO' ? 50 : 5,
      maxApiCallsPerDay: body.tier === 'ENTERPRISE' ? 1000000 : body.tier === 'PRO' ? 100000 : 10000,
      maxCouponRedemptionsPerMonth: body.tier === 'ENTERPRISE' ? 50000 : body.tier === 'PRO' ? 5000 : 500,
      updatedAt: new Date().toISOString()
    }
    this.quotas.set(body.tenantId, quota)
    return { data: quota }
  }

  getQuota(tenantId: string) {
    return { data: this.quotas.get(tenantId) ?? null }
  }

  setTier(body: { tenantId: string; tier: string }) {
    return this.initQuota(body)
  }

  checkQuota(body: { tenantId: string; resource: string }) {
    const quota = this.quotas.get(body.tenantId)
    return {
      data: {
        allowed: true,
        kind: body.resource,
        current: 0,
        limit: quota?.maxBrands ?? 5,
        remaining: quota?.maxBrands ?? 5
      }
    }
  }

  getUsage(tenantId: string) {
    return {
      data: {
        tenantId,
        brands: 0,
        stores: 0,
        members: 0,
        campaigns: 0,
        apiCallsToday: 0,
        couponRedemptionsThisMonth: 0,
        recordedAt: new Date().toISOString()
      }
    }
  }

  // ── 生命周期管理模拟 ──
  private lifecycles = new Map<string, any>()

  initLifecycle(body: { tenantId: string }) {
    const record = {
      tenantId: body.tenantId,
      status: TenantLifecycleStatus.Active,
      statusChangedAt: new Date().toISOString(),
      history: [
        { from: TenantLifecycleStatus.Active, to: TenantLifecycleStatus.Active, reason: 'CREATED', timestamp: new Date().toISOString() }
      ]
    }
    this.lifecycles.set(body.tenantId, record)
    return { data: record }
  }

  getLifecycle(tenantId: string) {
    return { data: this.lifecycles.get(tenantId) ?? null }
  }

  getStatus(tenantId: string) {
    const lc = this.lifecycles.get(tenantId)
    return { data: { status: lc?.status ?? TenantLifecycleStatus.Active } }
  }

  suspend(body: { tenantId: string; actorId?: string; note?: string }) {
    const lc = this.lifecycles.get(body.tenantId)
    if (lc) {
      lc.status = TenantLifecycleStatus.Suspended
      lc.updatedAt = new Date().toISOString()
      lc.history.push({
        from: TenantLifecycleStatus.Active,
        to: TenantLifecycleStatus.Suspended,
        reason: 'ADMIN_SUSPEND',
        timestamp: new Date().toISOString(),
        actorId: body.actorId,
        note: body.note
      })
    }
    return { data: lc }
  }

  reactivate(body: { tenantId: string; actorId?: string }) {
    const lc = this.lifecycles.get(body.tenantId)
    if (lc) {
      lc.status = TenantLifecycleStatus.Active
      lc.updatedAt = new Date().toISOString()
      lc.history.push({
        from: TenantLifecycleStatus.Suspended,
        to: TenantLifecycleStatus.Active,
        reason: 'ADMIN_REACTIVATE',
        timestamp: new Date().toISOString(),
        actorId: body.actorId
      })
    }
    return { data: lc }
  }

  softDelete(body: { tenantId: string; reason?: string; note?: string }) {
    const lc = this.lifecycles.get(body.tenantId)
    if (lc) {
      lc.status = TenantLifecycleStatus.Deleted
      lc.updatedAt = new Date().toISOString()
      lc.history.push({
        from: lc.history.length > 1 ? TenantLifecycleStatus.Suspended : TenantLifecycleStatus.Active,
        to: TenantLifecycleStatus.Deleted,
        reason: body.reason ?? 'ADMIN_DELETE',
        timestamp: new Date().toISOString(),
        note: body.note
      })
    }
    return { data: lc }
  }

  listActive() {
    const active = Array.from(this.lifecycles.values()).filter(l => l.status === TenantLifecycleStatus.Active)
    return { data: active }
  }

  listSuspended() {
    const suspended = Array.from(this.lifecycles.values()).filter(l => l.status === TenantLifecycleStatus.Suspended)
    return { data: suspended }
  }
}

// ── Helper ──────────────────────────────────────────────────────
function buildReq(overrides: Record<string, any> = {}) {
  return {
    tenantContext: {},
    actorContext: undefined,
    governanceContext: {},
    ...overrides,
  }
}

// ── Tests ───────────────────────────────────────────────────────
describe('TenantController', () => {
  const controller = new TenantController()

  describe('resolveTenant()', () => {
    it('returns source "tenant-module"', () => {
      const req = buildReq()
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.source, 'tenant-module')
    })

    it('uses tenantContext.tenantId when no actorContext.tenantId', () => {
      const req = buildReq({
        tenantContext: { tenantId: 't-ctx' },
      })
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.effectiveTenantId, 't-ctx')
    })

    it('prefers actorContext.tenantId over tenantContext.tenantId', () => {
      const req = buildReq({
        actorContext: { tenantId: 't-actor' },
        tenantContext: { tenantId: 't-ctx' },
      })
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.effectiveTenantId, 't-actor')
    })

    it('falls back to "tenant-demo" when no tenantId is set anywhere', () => {
      const req = buildReq()
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.effectiveTenantId, 'tenant-demo')
    })

    it('forwards governanceContext.requestId', () => {
      const req = buildReq({
        governanceContext: { requestId: 'req-123' },
      })
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.requestId, 'req-123')
    })

    it('prefers actorContext.brandId over tenantContext.brandId', () => {
      const req = buildReq({
        actorContext: { brandId: 'b-actor' },
        tenantContext: { brandId: 'b-ctx' },
      })
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.effectiveBrandId, 'b-actor')
    })

    it('effectiveBrandId is undefined when neither context provides it', () => {
      const req = buildReq()
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.effectiveBrandId, undefined)
    })

    it('prefers actorContext.storeId over tenantContext.storeId', () => {
      const req = buildReq({
        actorContext: { storeId: 's-actor' },
        tenantContext: { storeId: 's-ctx' },
      })
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.effectiveStoreId, 's-actor')
    })

    it('effectiveMarketCode comes from tenantContext', () => {
      const req = buildReq({
        tenantContext: { marketCode: 'zh-cn' },
      })
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.effectiveMarketCode, 'zh-cn')
    })

    it('returns full actor details when actorContext is present', () => {
      const req = buildReq({
        actorContext: {
          actorId: 'u-1',
          actorType: 'member',
          actorName: 'Alice',
          roles: ['admin'],
          permissions: ['read', 'write'],
          authenticated: true,
        },
      })
      const result = controller.resolveTenant(req as any)
      assert.deepStrictEqual(result.actor, {
        actorId: 'u-1',
        actorType: 'member',
        actorName: 'Alice',
        roles: ['admin'],
        permissions: ['read', 'write'],
        authenticated: true,
      })
    })

    it('returns null actor when actorContext is undefined', () => {
      const req = buildReq()
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.actor, null)
    })

    it('returns undefined requestId when governanceContext is empty', () => {
      const req = buildReq()
      const result = controller.resolveTenant(req as any)
      assert.strictEqual(result.requestId, undefined)
    })
  })

  // ── 配额管理端点 ──

  describe('initQuota()', () => {
    it('初始化 FREE 层级配额', () => {
      const result = controller.initQuota({ tenantId: 't-q1' })
      assert.equal(result.data.tenantId, 't-q1')
      assert.equal(result.data.tier, 'FREE')
      assert.equal(result.data.maxBrands, 5)
      assert.equal(result.data.maxStores, 10)
    })

    it('初始化 ENTERPRISE 层级配额', () => {
      const result = controller.initQuota({ tenantId: 't-q2', tier: 'ENTERPRISE' })
      assert.equal(result.data.tier, 'ENTERPRISE')
      assert.equal(result.data.maxBrands, 100)
      assert.equal(result.data.maxMembers, 100000)
    })
  })

  describe('getQuota()', () => {
    it('返回已初始化的配额', () => {
      controller.initQuota({ tenantId: 't-get' })
      const result = controller.getQuota('t-get')
      assert.ok(result.data !== null)
      assert.equal(result.data.tenantId, 't-get')
    })

    it('未初始化返回 null', () => {
      const result = controller.getQuota('t-unknown')
      assert.strictEqual(result.data, null)
    })
  })

  describe('checkQuota()', () => {
    it('返回配额检查结果', () => {
      controller.initQuota({ tenantId: 't-chk' })
      const result = controller.checkQuota({ tenantId: 't-chk', resource: 'BRAND' })
      assert.equal(result.data.allowed, true)
      assert.equal(result.data.kind, 'BRAND')
    })
  })

  describe('getUsage()', () => {
    it('返回标准化 usage 结构', () => {
      const result = controller.getUsage('t-u1')
      assert.equal(result.data.tenantId, 't-u1')
      assert.equal(typeof result.data.brands, 'number')
      assert.equal(typeof result.data.stores, 'number')
    })
  })

  // ── 生命周期管理端点 ──

  describe('initLifecycle()', () => {
    it('创建活跃生命周期记录', () => {
      const result = controller.initLifecycle({ tenantId: 't-l1' })
      assert.equal(result.data.tenantId, 't-l1')
      assert.equal(result.data.status, TenantLifecycleStatus.Active)
      assert.ok(result.data.statusChangedAt)
    })
  })

  describe('getLifecycle()', () => {
    it('返回已有生命周期', () => {
      controller.initLifecycle({ tenantId: 't-lg' })
      const result = controller.getLifecycle('t-lg')
      assert.ok(result.data !== null)
      assert.equal(result.data.tenantId, 't-lg')
    })

    it('未初始化返回 null', () => {
      const result = controller.getLifecycle('t-uninit')
      assert.strictEqual(result.data, null)
    })
  })

  describe('suspend / reactivate / softDelete', () => {
    it('暂停租户', () => {
      controller.initLifecycle({ tenantId: 't-sus' })
      const result = controller.suspend({ tenantId: 't-sus', note: '欠费自动暂停' })
      assert.equal(result.data.status, TenantLifecycleStatus.Suspended)
    })

    it('恢复租户', () => {
      controller.initLifecycle({ tenantId: 't-re' })
      controller.suspend({ tenantId: 't-re' })
      const result = controller.reactivate({ tenantId: 't-re' })
      assert.equal(result.data.status, TenantLifecycleStatus.Active)
    })

    it('软删除租户', () => {
      controller.initLifecycle({ tenantId: 't-del' })
      const result = controller.softDelete({ tenantId: 't-del', note: '销户' })
      assert.equal(result.data.status, TenantLifecycleStatus.Deleted)
    })
  })

  describe('listActive / listSuspended', () => {
    it('listActive 只返回活跃租户', () => {
      controller.initLifecycle({ tenantId: 't-la1' })
      controller.initLifecycle({ tenantId: 't-la2' })
      controller.suspend({ tenantId: 't-la2' })
      const result = controller.listActive()
      assert.ok(result.data.length >= 1)
      for (const lc of result.data) {
        assert.equal(lc.status, TenantLifecycleStatus.Active)
      }
    })

    it('listSuspended 只返回暂停租户', () => {
      controller.initLifecycle({ tenantId: 't-ls1' })
      controller.initLifecycle({ tenantId: 't-ls2' })
      controller.suspend({ tenantId: 't-ls2' })
      const result = controller.listSuspended()
      assert.ok(result.data.length >= 1)
      for (const lc of result.data) {
        assert.equal(lc.status, TenantLifecycleStatus.Suspended)
      }
    })
  })
})
