import { Injectable } from '@nestjs/common'
import type { TenantId, CohortGroup, CohortPeriod } from '../analytics-v2.entity'

/**
 * Phase-43 T173: CohortAdapter (同期群分析)
 *
 * 反模式 v4 cohort-bias-pattern:
 *  - 时间窗偏差: cohort 起始日固定 (周一/月初)
 *  - 样本不足: cohort_size < 10 标记低可信度
 *  - 同期混淆: 不同 periodKey 严格隔离
 *  - 退出偏差: 失活 ≠ 流失, 需 90d 观察期
 *  - 跨期对比: cohort_size 差异需归一化
 */
@Injectable()
export class CohortAdapter {
  private cohorts = new Map<string, CohortGroup>()
  private byTenant = new Map<string, Set<string>>()

  save(cohort: CohortGroup): CohortGroup {
    this.cohorts.set(cohort.id, { ...cohort })
    if (!this.byTenant.has(cohort.tenantId)) {
      this.byTenant.set(cohort.tenantId, new Set())
    }
    this.byTenant.get(cohort.tenantId)!.add(cohort.id)
    return cohort
  }

  query(tenantId: TenantId, cohortId: string): CohortGroup | null {
    const c = this.cohorts.get(cohortId)
    if (!c || c.tenantId !== tenantId) return null
    return { ...c }
  }

  queryByPeriodKey(tenantId: TenantId, period: CohortPeriod, periodKey: string): CohortGroup | null {
    for (const c of this.cohorts.values()) {
      if (c.tenantId === tenantId && c.period === period && c.periodKey === periodKey) return { ...c }
    }
    return null
  }

  queryByTenant(tenantId: TenantId): CohortGroup[] {
    const ids = this.byTenant.get(tenantId)
    if (!ids) return []
    return Array.from(ids).map(id => this.cohorts.get(id)!).filter(Boolean)
  }

  queryByPeriod(tenantId: TenantId, period: CohortPeriod): CohortGroup[] {
    return this.queryByTenant(tenantId).filter(c => c.period === period)
      .sort((a, b) => a.periodKey.localeCompare(b.periodKey))
  }

  count(tenantId: TenantId): number {
    return this.byTenant.get(tenantId)?.size || 0
  }

  /**
   * 反模式: 样本可信度检查
   */
  isReliable(cohort: CohortGroup): boolean {
    return cohort.cohortSize >= 10
  }

  reset(): void {
    this.cohorts.clear()
    this.byTenant.clear()
  }
}