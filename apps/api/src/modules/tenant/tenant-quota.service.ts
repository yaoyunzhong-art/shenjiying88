/**
 * tenant-quota.service.ts — Phase-15 SaaS 多租户基础设施配额服务
 *
 * 职责:
 *   - 维护 tenant quota (tier default + per-tenant override)
 *   - 维护 tenant 当前 usage (本地 Map,生产应接 cache/persistence)
 *   - 提供 check / increment / decrement API
 *
 * 设计:
 *   - 全局单例 (NestJS @Injectable)
 *   - 无外部依赖 (纯内存),生产可加 cache decorator 升级为 Redis
 */

import { Injectable } from '@nestjs/common'
import {
  buildEmptyUsage,
  buildTenantQuota,
  checkQuotaForResource,
  DEFAULT_TIER_QUOTAS,
  quotaLimitFor,
  QuotaResourceKind,
  TenantQuotaUsage,
  TenantTier,
  type TenantQuota,
  type QuotaCheckResult
} from './tenant-quota.entity'

@Injectable()
export class TenantQuotaService {
  private readonly quotaStore = new Map<string, TenantQuota>()
  private readonly usageStore = new Map<string, TenantQuotaUsage>()
  /** API call quota 日切时间 (tenantId -> 上次重置的 ISO date) */
  private readonly apiCallResetDate = new Map<string, string>()

  /**
   * 初始化 tenant quota (按 tier 应用默认值)
   */
  initialize(tenantId: string, tier: TenantTier = TenantTier.Free): TenantQuota {
    const quota = buildTenantQuota(tenantId, tier)
    this.quotaStore.set(tenantId, quota)
    if (!this.usageStore.has(tenantId)) {
      this.usageStore.set(tenantId, buildEmptyUsage(tenantId))
    }
    return quota
  }

  /**
   * 获取 quota (未初始化返回 undefined)
   */
  getQuota(tenantId: string): TenantQuota | undefined {
    return this.quotaStore.get(tenantId)
  }

  /**
   * 获取 quota (未初始化时自动按 free tier 初始化)
   */
  getOrInitQuota(tenantId: string, tier: TenantTier = TenantTier.Free): TenantQuota {
    const existing = this.quotaStore.get(tenantId)
    if (existing) return existing
    return this.initialize(tenantId, tier)
  }

  /**
   * 升级/降级 tier (覆盖默认配额)
   */
  setTier(tenantId: string, tier: TenantTier): TenantQuota {
    return this.initialize(tenantId, tier)
  }

  /**
   * 自定义单租户配额覆盖
   */
  overrideQuota(tenantId: string, overrides: Partial<Omit<TenantQuota, 'tenantId' | 'updatedAt'>>): TenantQuota {
    const current = this.quotaStore.get(tenantId)
    const tier = overrides.tier ?? current?.tier ?? TenantTier.Free
    const base = current ?? buildTenantQuota(tenantId, tier)
    const updated: TenantQuota = {
      ...base,
      ...overrides,
      tenantId,
      tier,
      updatedAt: new Date().toISOString()
    }
    this.quotaStore.set(tenantId, updated)
    return updated
  }

  /**
   * 清除单租户 override,恢复 tier 默认
   */
  clearOverride(tenantId: string): TenantQuota {
    const current = this.quotaStore.get(tenantId)
    const tier = current?.tier ?? TenantTier.Free
    return this.initialize(tenantId, tier)
  }

  /**
   * 获取当前 usage (未初始化返回空 usage)
   */
  getUsage(tenantId: string): TenantQuotaUsage {
    this.maybeResetApiCalls(tenantId)
    return this.usageStore.get(tenantId) ?? buildEmptyUsage(tenantId)
  }

  /**
   * 检查配额 (单个资源)
   */
  check(tenantId: string, kind: QuotaResourceKind): QuotaCheckResult {
    const quota = this.getOrInitQuota(tenantId)
    const usage = this.getUsage(tenantId)
    return checkQuotaForResource(quota, usage, kind)
  }

  /**
   * 检查配额 + 尝试预留 1 单位。返回 allowed,调用方按结果决定是否实际创建资源。
   */
  reserve(tenantId: string, kind: QuotaResourceKind): QuotaCheckResult {
    const result = this.check(tenantId, kind)
    if (result.allowed) {
      this.increment(tenantId, kind)
    }
    return result
  }

  /**
   * 增加 usage (创建资源后调用)
   */
  increment(tenantId: string, kind: QuotaResourceKind, delta = 1): TenantQuotaUsage {
    this.maybeResetApiCalls(tenantId)
    const usage = this.usageStore.get(tenantId) ?? buildEmptyUsage(tenantId)
    const next = applyDelta(usage, kind, delta)
    this.usageStore.set(tenantId, next)
    return next
  }

  /**
   * 减少 usage (删除资源后调用)
   */
  decrement(tenantId: string, kind: QuotaResourceKind, delta = 1): TenantQuotaUsage {
    return this.increment(tenantId, kind, -delta)
  }

  /**
   * 重置 usage (测试用)
   */
  resetUsage(tenantId: string): TenantQuotaUsage {
    const empty = buildEmptyUsage(tenantId)
    this.usageStore.set(tenantId, empty)
    this.apiCallResetDate.delete(tenantId)
    return empty
  }

  /**
   * 列出所有已初始化的 tenant quota
   */
  listQuotas(): TenantQuota[] {
    return Array.from(this.quotaStore.values())
  }

  /**
   * 列出所有 tier 默认配额 (admin / 文档展示用)
   */
  listDefaultTierQuotas(): Array<{ tier: TenantTier; quota: Omit<TenantQuota, 'tenantId' | 'updatedAt'> }> {
    return Object.entries(DEFAULT_TIER_QUOTAS).map(([tier, quota]) => ({
      tier: tier as TenantTier,
      quota
    }))
  }

  /**
   * 日切:跨过午夜后重置 apiCallsToday
   */
  private maybeResetApiCalls(tenantId: string): void {
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const last = this.apiCallResetDate.get(tenantId)
    if (last !== today) {
      const usage = this.usageStore.get(tenantId) ?? buildEmptyUsage(tenantId)
      this.usageStore.set(tenantId, { ...usage, apiCallsToday: 0, recordedAt: new Date().toISOString() })
      this.apiCallResetDate.set(tenantId, today)
    }
  }

  /**
   * 全局测试重置
   */
  resetAll(): void {
    this.quotaStore.clear()
    this.usageStore.clear()
    this.apiCallResetDate.clear()
  }
}

function applyDelta(usage: TenantQuotaUsage, kind: QuotaResourceKind, delta: number): TenantQuotaUsage {
  switch (kind) {
    case QuotaResourceKind.Brand:
      return { ...usage, brands: Math.max(0, usage.brands + delta), recordedAt: new Date().toISOString() }
    case QuotaResourceKind.Store:
      return { ...usage, stores: Math.max(0, usage.stores + delta), recordedAt: new Date().toISOString() }
    case QuotaResourceKind.Member:
      return { ...usage, members: Math.max(0, usage.members + delta), recordedAt: new Date().toISOString() }
    case QuotaResourceKind.Campaign:
      return { ...usage, campaigns: Math.max(0, usage.campaigns + delta), recordedAt: new Date().toISOString() }
    case QuotaResourceKind.ApiCall:
      return { ...usage, apiCallsToday: Math.max(0, usage.apiCallsToday + delta), recordedAt: new Date().toISOString() }
    case QuotaResourceKind.Coupon:
      // ⭐ Phase-17:跨门店优惠券核销配额 (跨门店累计,跨月清零 - TODO:月切逻辑)
      return {
        ...usage,
        couponRedemptionsThisMonth: Math.max(0, usage.couponRedemptionsThisMonth + delta),
        recordedAt: new Date().toISOString()
      }
  }
}

/** 导出配额上限查表 (供外部 / 测试用) */
export { quotaLimitFor }