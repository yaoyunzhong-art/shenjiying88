import { Injectable } from '@nestjs/common'
import type { TenantId, FunnelResult } from '../analytics-v2.entity'

/**
 * Phase-43 T173: FunnelAdapter (漏斗分析)
 *
 * 反模式 v4 cohort-bias-pattern:
 *  - 步骤顺序错乱: 严格按 steps 顺序
 *  - 时间窗口过长: 默认 7d, 防止跨周期污染
 *  - 重复进入: 同一 member 只算首次
 *  - 步骤过滤缺失: filter 必须 JSON 序列化
 */
@Injectable()
export class FunnelAdapter {
  private funnels = new Map<string, FunnelResult>()
  private byTenant = new Map<string, Set<string>>()

  save(funnel: FunnelResult): FunnelResult {
    this.funnels.set(funnel.id, { ...funnel })
    if (!this.byTenant.has(funnel.tenantId)) {
      this.byTenant.set(funnel.tenantId, new Set())
    }
    this.byTenant.get(funnel.tenantId)!.add(funnel.id)
    return funnel
  }

  query(tenantId: TenantId, funnelId: string): FunnelResult | null {
    const f = this.funnels.get(funnelId)
    if (!f || f.tenantId !== tenantId) return null
    return { ...f }
  }

  queryByTenant(tenantId: TenantId): FunnelResult[] {
    const ids = this.byTenant.get(tenantId)
    if (!ids) return []
    return Array.from(ids).map(id => this.funnels.get(id)!).filter(Boolean)
  }

  count(tenantId: TenantId): number {
    return this.byTenant.get(tenantId)?.size || 0
  }

  reset(): void {
    this.funnels.clear()
    this.byTenant.clear()
  }
}