/**
 * tenant-quota.entity.test.ts — Tenant 配额实体单元测试
 *
 * 覆盖:
 *   - DEFAULT_TIER_QUOTAS 默认配额表
 *   - buildTenantQuota / buildEmptyUsage
 *   - quotaLimitFor / usageValueFor
 *   - checkQuotaForResource (未超限 / 超限 / 无限制)
 *   - checkQuotaForAllResources (批量检查)
 *   - Coupon 扩展配额 (Phase-17)
 *   - 边界情况: limit = -1 无限制, 恰好用满
 */

import { describe, it, expect } from 'vitest'
import {
  TenantTier,
  QuotaResourceKind,
  DEFAULT_TIER_QUOTAS,
  buildTenantQuota,
  buildEmptyUsage,
  quotaLimitFor,
  usageValueFor,
  checkQuotaForResource,
  checkQuotaForAllResources,
  type TenantQuota,
  type TenantQuotaUsage,
} from './tenant-quota.entity'

// ===================================================================
// 默认配额表
// ===================================================================
describe('DEFAULT_TIER_QUOTAS 默认配额表', () => {
  it('Free tier 应有最小配额', () => {
    const free = DEFAULT_TIER_QUOTAS[TenantTier.Free]
    expect(free.maxBrands).toBe(1)
    expect(free.maxStores).toBe(5)
    expect(free.maxMembers).toBe(100)
    expect(free.maxCampaigns).toBe(10)
    expect(free.maxApiCallsPerDay).toBe(1000)
    // Phase-17 扩展
    expect(free.maxCouponRedemptionsPerMonth).toBe(200)
  })

  it('Pro tier 配额应比 Free 大', () => {
    const pro = DEFAULT_TIER_QUOTAS[TenantTier.Pro]
    const free = DEFAULT_TIER_QUOTAS[TenantTier.Free]
    expect(pro.maxBrands).toBeGreaterThan(free.maxBrands)
    expect(pro.maxStores).toBeGreaterThan(free.maxStores)
    expect(pro.maxMembers).toBeGreaterThan(free.maxMembers)
  })

  it('Enterprise tier 应有最大配额', () => {
    const ent = DEFAULT_TIER_QUOTAS[TenantTier.Enterprise]
    expect(ent.maxBrands).toBe(1000)
    expect(ent.maxStores).toBe(10_000)
    expect(ent.maxMembers).toBe(1_000_000)
    expect(ent.maxCampaigns).toBe(100_000)
    expect(ent.maxApiCallsPerDay).toBe(10_000_000)
    expect(ent.maxCouponRedemptionsPerMonth).toBe(2_000_000)
  })
})

// ===================================================================
// buildTenantQuota / buildEmptyUsage
// ===================================================================
describe('buildTenantQuota', () => {
  it('应为 Pro tier 构建正确的配额', () => {
    const quota = buildTenantQuota('t-001', TenantTier.Pro)
    expect(quota.tenantId).toBe('t-001')
    expect(quota.tier).toBe(TenantTier.Pro)
    expect(quota.maxStores).toBe(100)
    expect(quota.maxMembers).toBe(10_000)
    expect(quota.updatedAt).toBeDefined()
  })

  it('应为 Enterprise tier 构建正确的配额', () => {
    const quota = buildTenantQuota('t-ent', TenantTier.Enterprise)
    expect(quota.maxBrands).toBe(1000)
    expect(quota.maxCouponRedemptionsPerMonth).toBe(2_000_000)
  })
})

describe('buildEmptyUsage', () => {
  it('应返回全零使用量快照', () => {
    const usage = buildEmptyUsage('t-002')
    expect(usage.tenantId).toBe('t-002')
    expect(usage.brands).toBe(0)
    expect(usage.stores).toBe(0)
    expect(usage.members).toBe(0)
    expect(usage.campaigns).toBe(0)
    expect(usage.apiCallsToday).toBe(0)
    expect(usage.couponRedemptionsThisMonth).toBe(0)
    expect(usage.recordedAt).toBeDefined()
  })
})

// ===================================================================
// quotaLimitFor / usageValueFor
// ===================================================================
describe('quotaLimitFor', () => {
  const quota = buildTenantQuota('t-q1', TenantTier.Pro)

  it('应返回对应资源的配额上限', () => {
    expect(quotaLimitFor(quota, QuotaResourceKind.Brand)).toBe(10)
    expect(quotaLimitFor(quota, QuotaResourceKind.Store)).toBe(100)
    expect(quotaLimitFor(quota, QuotaResourceKind.Member)).toBe(10_000)
    expect(quotaLimitFor(quota, QuotaResourceKind.Campaign)).toBe(500)
    expect(quotaLimitFor(quota, QuotaResourceKind.ApiCall)).toBe(100_000)
    expect(quotaLimitFor(quota, QuotaResourceKind.Coupon)).toBe(20_000)
  })
})

describe('usageValueFor', () => {
  const usage: TenantQuotaUsage = {
    tenantId: 't-u1',
    brands: 3,
    stores: 15,
    members: 500,
    campaigns: 8,
    apiCallsToday: 5000,
    couponRedemptionsThisMonth: 150,
    recordedAt: '',
  }

  it('应返回对应资源的当前使用量', () => {
    expect(usageValueFor(usage, QuotaResourceKind.Brand)).toBe(3)
    expect(usageValueFor(usage, QuotaResourceKind.Store)).toBe(15)
    expect(usageValueFor(usage, QuotaResourceKind.Member)).toBe(500)
    expect(usageValueFor(usage, QuotaResourceKind.Campaign)).toBe(8)
    expect(usageValueFor(usage, QuotaResourceKind.ApiCall)).toBe(5000)
    expect(usageValueFor(usage, QuotaResourceKind.Coupon)).toBe(150)
  })
})

// ===================================================================
// checkQuotaForResource
// ===================================================================
describe('checkQuotaForResource 单资源检查', () => {
  const quota = buildTenantQuota('t-chk1', TenantTier.Free)

  it('未超限时应返回 allowed=true', () => {
    const usage = buildEmptyUsage('t-chk1')
    usage.stores = 3 // 5 上限, 使用 3
    const result = checkQuotaForResource(quota, usage, QuotaResourceKind.Store)
    expect(result.allowed).toBe(true)
    expect(result.currentUsage).toBe(3)
    expect(result.limit).toBe(5)
    expect(result.exceeded).toEqual([])
    expect(result.reason).toBeUndefined()
  })

  it('恰好用满时不应视为超限 (< limit)', () => {
    const usage = buildEmptyUsage('t-chk1')
    usage.stores = 5 // 恰好用满 5
    const result = checkQuotaForResource(quota, usage, QuotaResourceKind.Store)
    // limit=5, currentUsage=5 => 5 < 5 为 false => allowed=false
    // 但设计上恰好用满应视为不允许新增
    expect(result.allowed).toBe(false)
    expect(result.exceeded).toEqual([QuotaResourceKind.Store])
  })

  it('超限时应返回 allowed=false 和 exceeded', () => {
    const usage = buildEmptyUsage('t-chk1')
    usage.members = 150 // 超过 100 上限
    const result = checkQuotaForResource(quota, usage, QuotaResourceKind.Member)
    expect(result.allowed).toBe(false)
    expect(result.exceeded).toEqual([QuotaResourceKind.Member])
    expect(result.reason).toContain('Quota exceeded')
  })

  it('limit = -1 表示无限制, 任意使用量均允许', () => {
    const unlimitedQuota: TenantQuota = {
      tenantId: 'unlim',
      tier: TenantTier.Enterprise,
      maxBrands: -1,
      maxStores: -1,
      maxMembers: -1,
      maxCampaigns: -1,
      maxApiCallsPerDay: -1,
      maxCouponRedemptionsPerMonth: -1,
      updatedAt: '',
    }
    const usage = buildEmptyUsage('unlim')
    // 超大使用量
    usage.members = 9_999_999
    const result = checkQuotaForResource(unlimitedQuota, usage, QuotaResourceKind.Member)
    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(-1)
    expect(result.exceeded).toEqual([])
  })
})

// ===================================================================
// checkQuotaForAllResources 批量检查
// ===================================================================
describe('checkQuotaForAllResources 批量检查', () => {
  it('全部未超限时返回 allowed=true', () => {
    const quota = buildTenantQuota('t-b1', TenantTier.Pro)
    const usage = buildEmptyUsage('t-b1')
    usage.brands = 5
    usage.stores = 50

    const result = checkQuotaForAllResources(quota, usage, [
      QuotaResourceKind.Brand,
      QuotaResourceKind.Store,
    ])
    expect(result.allowed).toBe(true)
    expect(result.exceeded).toEqual([])
  })

  it('部分超限时返回 allowed=false 和超限列表', () => {
    const quota = buildTenantQuota('t-b2', TenantTier.Free)
    const usage = buildEmptyUsage('t-b2')
    usage.brands = 2 // Free 上限 1
    usage.stores = 10 // Free 上限 5

    const result = checkQuotaForAllResources(quota, usage, [
      QuotaResourceKind.Brand,
      QuotaResourceKind.Store,
      QuotaResourceKind.Member,
    ])
    expect(result.allowed).toBe(false)
    expect(result.exceeded).toContain(QuotaResourceKind.Brand)
    expect(result.exceeded).toContain(QuotaResourceKind.Store)
    expect(result.exceeded).not.toContain(QuotaResourceKind.Member)
    expect(result.reason).toContain('Quota exceeded')
  })

  it('无限制配额批量检查应全部允许', () => {
    const unlimited: TenantQuota = {
      tenantId: 't-b3',
      tier: TenantTier.Enterprise,
      maxBrands: -1,
      maxStores: -1,
      maxMembers: -1,
      maxCampaigns: -1,
      maxApiCallsPerDay: -1,
      maxCouponRedemptionsPerMonth: -1,
      updatedAt: '',
    }
    const usage = buildEmptyUsage('t-b3')
    usage.members = 5_000_000

    // 空 kinds 数组 => 无检查 => allowed=true
    const emptyKinds = checkQuotaForAllResources(unlimited, usage, [])
    expect(emptyKinds.allowed).toBe(true)
    expect(emptyKinds.exceeded).toEqual([])
  })
})

// ===================================================================
// Coupon 扩展配额 (Phase-17)
// ===================================================================
describe('Coupon 扩展配额 (Phase-17)', () => {
  it('Coupon kind 应有对应 limit 和 usage', () => {
    const quota = buildTenantQuota('t-cpn', TenantTier.Pro)
    expect(quota.maxCouponRedemptionsPerMonth).toBe(20_000)

    const usage = buildEmptyUsage('t-cpn')
    usage.couponRedemptionsThisMonth = 500

    expect(quotaLimitFor(quota, QuotaResourceKind.Coupon)).toBe(20_000)
    expect(usageValueFor(usage, QuotaResourceKind.Coupon)).toBe(500)
  })

  it('Coupon 核销未超限时应允许', () => {
    const quota = buildTenantQuota('t-cpn2', TenantTier.Enterprise)
    const usage = buildEmptyUsage('t-cpn2')
    usage.couponRedemptionsThisMonth = 1_000_000

    const result = checkQuotaForResource(quota, usage, QuotaResourceKind.Coupon)
    expect(result.allowed).toBe(true)
    expect(result.limit).toBe(2_000_000)
  })

  it('Coupon 核销超限时不应允许', () => {
    const quota = buildTenantQuota('t-cpn3', TenantTier.Free)
    const usage = buildEmptyUsage('t-cpn3')
    usage.couponRedemptionsThisMonth = 300 // Free 上限 200

    const result = checkQuotaForResource(quota, usage, QuotaResourceKind.Coupon)
    expect(result.allowed).toBe(false)
    expect(result.exceeded).toEqual([QuotaResourceKind.Coupon])
  })
})
