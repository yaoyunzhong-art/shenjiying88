import { Injectable } from '@nestjs/common'
import type { TenantId, RetentionResult } from '../analytics-v2.entity'

/**
 * Phase-43 T173: RetentionAdapter (留存分析)
 *
 * 反模式 v4 cohort-bias-pattern:
 *  - 活跃定义不清: 默认 any event = 活跃
 *  - 跨期混淆: 同 periodKey 严格隔离
 *  - 留存率累加错: 每日独立计算, 不累加
 *  - 样本偏差: cohort_size < 10 标记
 */
@Injectable()
export class RetentionAdapter {
  private results = new Map<string, RetentionResult>()
  private byTenant = new Map<string, TenantId[]>()

  save(result: RetentionResult): RetentionResult {
    const key = `${result.tenantId}:${result.period}`
    this.results.set(key, { ...result })
    if (!this.byTenant.has(result.tenantId)) {
      this.byTenant.set(result.tenantId, [])
    }
    if (!this.byTenant.get(result.tenantId)!.includes(result.period)) {
      this.byTenant.get(result.tenantId)!.push(result.period)
    }
    return result
  }

  query(tenantId: TenantId, period: 'WEEKLY' | 'MONTHLY'): RetentionResult | null {
    const key = `${tenantId}:${period}`
    const r = this.results.get(key)
    return r ? { ...r } : null
  }

  queryByTenant(tenantId: TenantId): RetentionResult[] {
    const periods = this.byTenant.get(tenantId) || []
    return periods.map(p => this.results.get(`${tenantId}:${p}`)!).filter(Boolean)
  }

  count(tenantId: TenantId): number {
    return this.byTenant.get(tenantId)?.length || 0
  }

  reset(): void {
    this.results.clear()
    this.byTenant.clear()
  }
}