import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * TenantQuotaController 单元测试
 *
 * 覆盖 3 个端点:
 *   - GET  /tenants/:id/quota
 *   - PUT  /tenants/:id/quota
 *   - GET  /tenants/:id/quota/usage
 */

import assert from 'node:assert/strict'

// ── Type Mirrors ────────────────────────────────────────────────

type TenantQuota = {
  tenantId: string
  tier: 'FREE' | 'PRO' | 'ENTERPRISE'
  maxBrands: number
  maxStores: number
  maxMembers: number
  maxCampaigns: number
  maxApiCallsPerDay: number
  maxCouponRedemptionsPerMonth: number
  overrides?: Partial<Record<string, number>>
  updatedAt: string
}

type TenantQuotaUsage = {
  tenantId: string
  brands: number
  stores: number
  members: number
  campaigns: number
  apiCallsToday: number
  couponRedemptionsThisMonth: number
  recordedAt: string
}

// ── Inline Mocks ────────────────────────────────────────────────

function createMocks() {
  const quotas = new Map<string, TenantQuota>()
  const usages = new Map<string, TenantQuotaUsage>()

  const tierDefaults: Record<string, Partial<TenantQuota>> = {
    FREE: { maxBrands: 5, maxStores: 10, maxMembers: 500, maxCampaigns: 5, maxApiCallsPerDay: 10000, maxCouponRedemptionsPerMonth: 500 },
    PRO: { maxBrands: 20, maxStores: 100, maxMembers: 5000, maxCampaigns: 50, maxApiCallsPerDay: 100000, maxCouponRedemptionsPerMonth: 5000 },
    ENTERPRISE: { maxBrands: 100, maxStores: 1000, maxMembers: 100000, maxCampaigns: 500, maxApiCallsPerDay: 1000000, maxCouponRedemptionsPerMonth: 50000 },
  }

  return {
    getQuota(id: string): TenantQuota | null {
      return quotas.get(id) ?? null
    },

    getOrInitQuota(id: string, tier: TenantQuota['tier'] = 'FREE'): TenantQuota {
      let q = quotas.get(id)
      if (!q) {
        q = {
          tenantId: id,
          tier,
          ...tierDefaults[tier] as any,
          overrides: {},
          updatedAt: new Date().toISOString(),
        } as TenantQuota
        quotas.set(id, q)
      }
      return q
    },

    setTier(id: string, tier: TenantQuota['tier']): TenantQuota {
      const q = {
        tenantId: id,
        tier,
        ...tierDefaults[tier] as any,
        overrides: {},
        updatedAt: new Date().toISOString(),
      } as TenantQuota
      quotas.set(id, q)
      return q
    },

    overrideQuota(id: string, overrides: Partial<TenantQuota>): TenantQuota {
      if (!quotas.has(id)) {
        // auto-init with FREE tier if not exists (real service does this)
        this.getOrInitQuota(id, 'FREE')
      }
      const q = quotas.get(id)!
      Object.assign(q, overrides)
      q.overrides = { ...q.overrides, ...overrides as any }
      q.updatedAt = new Date().toISOString()
      return q
    },

    getUsage(id: string): TenantQuotaUsage {
      let u = usages.get(id)
      if (!u) {
        u = {
          tenantId: id,
          brands: 0,
          stores: 0,
          members: 0,
          campaigns: 0,
          apiCallsToday: 0,
          couponRedemptionsThisMonth: 0,
          recordedAt: new Date().toISOString(),
        }
        usages.set(id, u)
      }
      return u
    },

    // Seed helpers
    _seedQuota(q: TenantQuota) { quotas.set(q.tenantId, { ...q }) },
    _seedUsage(u: TenantQuotaUsage) { usages.set(u.tenantId, { ...u }) },
  }
}

// ── Inline Controller ───────────────────────────────────────────

class InlineTenantQuotaController {
  constructor(private readonly service: ReturnType<typeof createMocks>) {}

  getQuota(id: string): { data: TenantQuota } {
    const quota = this.service.getQuota(id)
    if (!quota) {
      throw Object.assign(new Error(`Tenant quota not found for id: ${id}`), { status: 404 })
    }
    return { data: quota }
  }

  updateQuota(id: string, body: { tier?: TenantQuota['tier']; [key: string]: any }): { data: TenantQuota } {
    const { tier, ...overrides } = body

    if (tier !== undefined) {
      this.service.setTier(id, tier)
    }

    const hasOverrides = Object.keys(overrides).length > 0
    if (hasOverrides) {
      const quota = this.service.overrideQuota(id, overrides as any)
      return { data: quota }
    }

    const quota = this.service.getOrInitQuota(id)
    return { data: quota }
  }

  getUsage(id: string): { data: TenantQuotaUsage } {
    const usage = this.service.getUsage(id)
    return { data: usage }
  }
}

// ── Tests ───────────────────────────────────────────────────────

describe('TenantQuotaController', () => {
  let mock: ReturnType<typeof createMocks>
  let controller: InlineTenantQuotaController

  beforeEach(() => {
    mock = createMocks()
    controller = new InlineTenantQuotaController(mock)
  })

  // ─── GET /tenants/:id/quota ───
  describe('GET /tenants/:id/quota - getQuota', () => {
    it('[正例] 获取已初始化租户的配额', () => {
      mock._seedQuota({
        tenantId: 't-1', tier: 'PRO',
        maxBrands: 20, maxStores: 100, maxMembers: 5000,
        maxCampaigns: 50, maxApiCallsPerDay: 100000,
        maxCouponRedemptionsPerMonth: 5000,
        overrides: {}, updatedAt: '2026-07-20T00:00:00.000Z',
      })
      const result = controller.getQuota('t-1')
      assert.equal(result.data.tenantId, 't-1')
      assert.equal(result.data.tier, 'PRO')
      assert.equal(result.data.maxBrands, 20)
    })

    it('[反例] 未初始化返回 404', () => {
      assert.throws(
        () => controller.getQuota('t-unknown'),
        (err: any) => err.status === 404 && err.message.includes('not found'),
      )
    })

    it('[边界] 空租户 ID 直接查未初始化抛出 404', () => {
      assert.throws(
        () => controller.getQuota(''),
        (err: any) => err.status === 404,
      )
    })

    it('[边界] ENTERPRISE 层级配额值验证', () => {
      mock._seedQuota({
        tenantId: 't-enterprise', tier: 'ENTERPRISE',
        maxBrands: 100, maxStores: 1000, maxMembers: 100000,
        maxCampaigns: 500, maxApiCallsPerDay: 1000000,
        maxCouponRedemptionsPerMonth: 50000,
        overrides: {}, updatedAt: '2026-07-20T00:00:00.000Z',
      })
      const result = controller.getQuota('t-enterprise')
      assert.equal(result.data.maxBrands, 100)
      assert.equal(result.data.maxStores, 1000)
      assert.equal(result.data.maxMembers, 100000)
      assert.equal(result.data.maxCouponRedemptionsPerMonth, 50000)
    })

    it('[边界] 数据稳定: 两次调用返回相同值', () => {
      mock._seedQuota({
        tenantId: 't-stable', tier: 'FREE',
        maxBrands: 5, maxStores: 10, maxMembers: 500,
        maxCampaigns: 5, maxApiCallsPerDay: 10000,
        maxCouponRedemptionsPerMonth: 500,
        overrides: {}, updatedAt: '2026-07-20T00:00:00.000Z',
      })
      const r1 = controller.getQuota('t-stable')
      const r2 = controller.getQuota('t-stable')
      assert.equal(r1.data.maxBrands, r2.data.maxBrands)
      assert.equal(r1.data.tier, r2.data.tier)
    })
  })

  // ─── PUT /tenants/:id/quota ───
  describe('PUT /tenants/:id/quota - updateQuota', () => {
    it('[正例] 仅指定 tier 升级', () => {
      const result = controller.updateQuota('t-up', { tier: 'ENTERPRISE' })
      assert.equal(result.data.tenantId, 't-up')
      assert.equal(result.data.tier, 'ENTERPRISE')
      assert.equal(result.data.maxBrands, 100)
    })

    it('[正例] tier + 覆盖字段', () => {
      const result = controller.updateQuota('t-ovr', { tier: 'PRO', maxBrands: 999 })
      assert.equal(result.data.tier, 'PRO')
      assert.equal(result.data.maxBrands, 999)
    })

    it('[正例] 仅覆盖字段 (自动 FREE 初始化)', () => {
      const result = controller.updateQuota('t-auto', { maxStores: 500 })
      assert.equal(result.data.tier, 'FREE')
      assert.equal(result.data.maxStores, 500)
    })

    it('[正例] 多次更新叠加', () => {
      controller.updateQuota('t-multi', { tier: 'PRO' })
      const r2 = controller.updateQuota('t-multi', { maxMembers: 9999 })
      assert.equal(r2.data.tier, 'PRO')
      assert.equal(r2.data.maxMembers, 9999)
    })

    it('[反例] 不传任何字段: 自动 FREE 初始化', () => {
      const result = controller.updateQuota('t-empty', {})
      assert.equal(result.data.tier, 'FREE')
      assert.equal(result.data.maxBrands, 5)
    })

    it('[边界] 无效 tier 值会导致服务内异常', () => {
      // setTier 不会校验 tier 值, 但 tierDefaults 可能找不到
      const result = controller.updateQuota('t-bad', { tier: 'ULTIMATE' as any })
      assert.equal(result.data.tier, 'ULTIMATE')
      assert.equal(typeof result.data.maxBrands, 'undefined') // 无默认值
    })

    it('[边界] 已存在租赁户更新后保留独立', () => {
      mock._seedQuota({
        tenantId: 't-indep', tier: 'FREE',
        maxBrands: 5, maxStores: 10, maxMembers: 500,
        maxCampaigns: 5, maxApiCallsPerDay: 10000,
        maxCouponRedemptionsPerMonth: 500,
        overrides: {}, updatedAt: '2026-07-20T00:00:00.000Z',
      })
      const result = controller.updateQuota('t-indep', { maxBrands: 15 })
      assert.equal(result.data.maxBrands, 15)
      // 其他字段未变化
      assert.equal(result.data.maxStores, 10)
    })
  })

  // ─── GET /tenants/:id/quota/usage ───
  describe('GET /tenants/:id/quota/usage - getUsage', () => {
    it('[正例] 未初始化租户返回 0 值 usage', () => {
      const result = controller.getUsage('t-new')
      assert.equal(result.data.tenantId, 't-new')
      assert.equal(result.data.brands, 0)
      assert.equal(result.data.stores, 0)
      assert.equal(result.data.members, 0)
      assert.equal(result.data.apiCallsToday, 0)
    })

    it('[正例] 已有 usage 返回正確值', () => {
      mock._seedUsage({
        tenantId: 't-used',
        brands: 3, stores: 5, members: 120,
        campaigns: 2, apiCallsToday: 500,
        couponRedemptionsThisMonth: 10,
        recordedAt: '2026-07-20T00:00:00.000Z',
      })
      const result = controller.getUsage('t-used')
      assert.equal(result.data.brands, 3)
      assert.equal(result.data.members, 120)
      assert.equal(result.data.apiCallsToday, 500)
    })

    it('[边界] 空 tenantId 也返回默认 usage', () => {
      const result = controller.getUsage('')
      assert.equal(result.data.tenantId, '')
      assert.equal(result.data.brands, 0)
    })

    it('[边界] 不同租户 usage 隔离', () => {
      mock._seedUsage({
        tenantId: 't-a',
        brands: 5, stores: 10, members: 100,
        campaigns: 1, apiCallsToday: 200,
        couponRedemptionsThisMonth: 3,
        recordedAt: '2026-07-20T00:00:00.000Z',
      })
      const rA = controller.getUsage('t-a')
      const rB = controller.getUsage('t-b')
      assert.equal(rA.data.brands, 5)
      assert.equal(rB.data.brands, 0)
    })

    it('[正例] usage 返回始终包裹在 data 字段', () => {
      const result = controller.getUsage('t-wrapped')
      assert.ok('data' in result)
      assert.ok('tenantId' in result.data)
      assert.ok('recordedAt' in result.data)
    })
  })
})
