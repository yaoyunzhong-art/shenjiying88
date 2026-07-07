import type {
  QuotaUsage,
  TenantId
} from '../openapi.entity'

/**
 * Phase-44 T174: Quota Adapter
 *
 * 职责:
 *  - 用量统计 (按天)
 *  - 配额追踪
 *  - 超额预警
 */
export class QuotaAdapter {
  private store = new Map<string, QuotaUsage>()
  private periodIndex = new Map<string, string>()  // tenantId:keyId:periodKey -> id

  save(usage: QuotaUsage): QuotaUsage {
    this.store.set(usage.id, { ...usage })
    const idx = `${usage.tenantId}:${usage.keyId}:${usage.periodKey}`
    this.periodIndex.set(idx, usage.id)
    return usage
  }

  query(id: string): QuotaUsage | null {
    return this.store.get(id) || null
  }

  queryByPeriod(tenantId: TenantId, keyId: string, periodKey: string): QuotaUsage | null {
    const idx = `${tenantId}:${keyId}:${periodKey}`
    const id = this.periodIndex.get(idx)
    return id ? this.store.get(id) || null : null
  }

  queryByTenant(tenantId: TenantId): QuotaUsage[] {
    const result: QuotaUsage[] = []
    for (const u of this.store.values()) {
      if (u.tenantId === tenantId) result.push(u)
    }
    return result.sort((a, b) => b.periodKey.localeCompare(a.periodKey))
  }

  /** 累加用量 */
  increment(tenantId: TenantId, keyId: string, periodKey: string, dailyQuota: number): QuotaUsage {
    let usage = this.queryByPeriod(tenantId, keyId, periodKey)
    if (!usage) {
      usage = {
        id: `quota-${tenantId}-${keyId}-${periodKey}`,
        tenantId, keyId, periodKey,
        usedCount: 0, remainingCount: dailyQuota, overageCount: 0
      }
    }
    usage.usedCount++
    usage.lastRequestAt = new Date().toISOString()
    if (usage.usedCount > dailyQuota) {
      usage.overageCount = usage.usedCount - dailyQuota
      usage.remainingCount = 0
    } else {
      usage.remainingCount = dailyQuota - usage.usedCount
      usage.overageCount = 0
    }
    return this.save(usage)
  }

  /** 测试用 */
  seed(usages: QuotaUsage[]): void {
    for (const u of usages) this.save(u)
  }
  reset(): void {
    this.store.clear()
    this.periodIndex.clear()
  }
}