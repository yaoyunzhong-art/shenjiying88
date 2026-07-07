/**
 * tenant-quota.entity.ts — Phase-15 SaaS 多租户基础设施配额
 *
 * 设计目标:
 *   - 每 tenant 独立的资源配额 (brands/stores/members/campaigns/api calls)
 *   - 支持 tier-based 默认配额 (free/pro/enterprise)
 *   - 支持 tenant-specific override (admin 调整)
 *   - 配额检查返回结构化结果 (allowed + exceeded resource 列表)
 *
 * Phase-17 扩展:
 *   - QuotaResourceKind.Coupon (跨门店优惠券核销配额)
 *   - TenantQuota.maxCouponRedemptionsPerMonth
 *   - TenantQuotaUsage.couponRedemptionsThisMonth
 */

/**
 * 可被配额约束的资源种类
 */
export enum QuotaResourceKind {
  Brand = 'BRAND',
  Store = 'STORE',
  Member = 'MEMBER',
  Campaign = 'CAMPAIGN',
  ApiCall = 'API_CALL',
  // ⭐ Phase-17 扩展:跨门店优惠券核销配额
  Coupon = 'COUPON'
}

/**
 * 订阅 tier (Phase-15: 简化版,后续可接入 billing)
 */
export enum TenantTier {
  Free = 'FREE',
  Pro = 'PRO',
  Enterprise = 'ENTERPRISE'
}

/**
 * 配额定义 (上限)
 */
export interface TenantQuota {
  tenantId: string
  tier: TenantTier
  /** 最大品牌数 */
  maxBrands: number
  /** 最大门店数 */
  maxStores: number
  /** 最大成员数 (含所有 actor) */
  maxMembers: number
  /** 最大活动数 (营销/loyalty/coupon) */
  maxCampaigns: number
  /** 每日 API 调用上限 */
  maxApiCallsPerDay: number
  /** 月度优惠券核销上限 (跨门店累计) */
  maxCouponRedemptionsPerMonth: number
  updatedAt: string
}

/**
 * 配额使用量快照
 */
export interface TenantQuotaUsage {
  tenantId: string
  brands: number
  stores: number
  members: number
  campaigns: number
  /** 当日 API 调用累计 (本地累计,跨天清零) */
  apiCallsToday: number
  /** 当月优惠券核销累计 (跨门店累计,跨月清零) */
  couponRedemptionsThisMonth: number
  recordedAt: string
}

/**
 * 配额检查结果
 */
export interface QuotaCheckResult {
  allowed: boolean
  /** 当前 kind 是否允许新增 1 个单位 */
  resource: QuotaResourceKind
  /** 当前使用量 */
  currentUsage: number
  /** 配额上限 */
  limit: number
  /** 超出时填入超标资源列表 (allowed=false) */
  exceeded: QuotaResourceKind[]
  /** 描述信息 */
  reason?: string
}

/**
 * 默认配额表 (按 tier)
 */
export const DEFAULT_TIER_QUOTAS: Record<TenantTier, Omit<TenantQuota, 'tenantId' | 'updatedAt'>> = {
  [TenantTier.Free]: {
    tier: TenantTier.Free,
    maxBrands: 1,
    maxStores: 5,
    maxMembers: 100,
    maxCampaigns: 10,
    maxApiCallsPerDay: 1000,
    maxCouponRedemptionsPerMonth: 200
  },
  [TenantTier.Pro]: {
    tier: TenantTier.Pro,
    maxBrands: 10,
    maxStores: 100,
    maxMembers: 10_000,
    maxCampaigns: 500,
    maxApiCallsPerDay: 100_000,
    maxCouponRedemptionsPerMonth: 20_000
  },
  [TenantTier.Enterprise]: {
    tier: TenantTier.Enterprise,
    maxBrands: 1000,
    maxStores: 10_000,
    maxMembers: 1_000_000,
    maxCampaigns: 100_000,
    maxApiCallsPerDay: 10_000_000,
    maxCouponRedemptionsPerMonth: 2_000_000
  }
}

/**
 * 创建 tenant quota (应用 tier 默认值)
 */
export function buildTenantQuota(tenantId: string, tier: TenantTier): TenantQuota {
  const base = DEFAULT_TIER_QUOTAS[tier]
  return {
    tenantId,
    tier,
    maxBrands: base.maxBrands,
    maxStores: base.maxStores,
    maxMembers: base.maxMembers,
    maxCampaigns: base.maxCampaigns,
    maxApiCallsPerDay: base.maxApiCallsPerDay,
    maxCouponRedemptionsPerMonth: base.maxCouponRedemptionsPerMonth,
    updatedAt: new Date().toISOString()
  }
}

/**
 * 创建空 usage 快照
 */
export function buildEmptyUsage(tenantId: string): TenantQuotaUsage {
  return {
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

/**
 * 从 quota 中读取指定资源的上限
 */
export function quotaLimitFor(quota: TenantQuota, kind: QuotaResourceKind): number {
  switch (kind) {
    case QuotaResourceKind.Brand:
      return quota.maxBrands
    case QuotaResourceKind.Store:
      return quota.maxStores
    case QuotaResourceKind.Member:
      return quota.maxMembers
    case QuotaResourceKind.Campaign:
      return quota.maxCampaigns
    case QuotaResourceKind.ApiCall:
      return quota.maxApiCallsPerDay
    case QuotaResourceKind.Coupon:
      return quota.maxCouponRedemptionsPerMonth
  }
}

/**
 * 读取 usage 中指定资源的当前值
 */
export function usageValueFor(usage: TenantQuotaUsage, kind: QuotaResourceKind): number {
  switch (kind) {
    case QuotaResourceKind.Brand:
      return usage.brands
    case QuotaResourceKind.Store:
      return usage.stores
    case QuotaResourceKind.Member:
      return usage.members
    case QuotaResourceKind.Campaign:
      return usage.campaigns
    case QuotaResourceKind.ApiCall:
      return usage.apiCallsToday
    case QuotaResourceKind.Coupon:
      return usage.couponRedemptionsThisMonth
  }
}

/**
 * 检查配额 (单个资源)
 */
export function checkQuotaForResource(
  quota: TenantQuota,
  usage: TenantQuotaUsage,
  kind: QuotaResourceKind
): QuotaCheckResult {
  const limit = quotaLimitFor(quota, kind)
  const currentUsage = usageValueFor(usage, kind)
  // -1 表示无限制
  const allowed = limit === -1 || currentUsage < limit
  return {
    allowed,
    resource: kind,
    currentUsage,
    limit,
    exceeded: allowed ? [] : [kind],
    reason: allowed
      ? undefined
      : `Quota exceeded for ${kind}: ${currentUsage}/${limit}`
  }
}

/**
 * 批量检查配额 (一次返回多个资源的超限信息)
 */
export function checkQuotaForAllResources(
  quota: TenantQuota,
  usage: TenantQuotaUsage,
  kinds: QuotaResourceKind[]
): QuotaCheckResult {
  const exceeded: QuotaResourceKind[] = []
  let worstLimit = Number.POSITIVE_INFINITY
  let worstUsage = 0
  let worstKind = kinds[0]
  for (const kind of kinds) {
    const r = checkQuotaForResource(quota, usage, kind)
    if (!r.allowed) exceeded.push(kind)
    if (r.limit !== -1 && r.limit < worstLimit) {
      worstLimit = r.limit
      worstUsage = r.currentUsage
      worstKind = kind
    }
  }
  return {
    allowed: exceeded.length === 0,
    resource: worstKind,
    currentUsage: worstUsage,
    limit: worstLimit === Number.POSITIVE_INFINITY ? -1 : worstLimit,
    exceeded,
    reason: exceeded.length > 0 ? `Quota exceeded for: ${exceeded.join(', ')}` : undefined
  }
}