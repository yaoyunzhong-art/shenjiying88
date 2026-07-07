import { Injectable } from '@nestjs/common'
import type { ReportDimension, ReportMetric, ReportResult, ReportType } from '../reports.entity'
import { ReportAggregationService } from '../report-aggregation.service'
import { ReportCacheService } from '../report-cache.service'
import { MemberAdapter } from '../datasources/member.adapter'

/**
 * Phase-39 T169: 会员增长报表
 *
 * 度量: 新增 / 活跃 / 流失 会员数 by day/week/month
 * 反模式 v4 time-series-aggregation + multi-tenant
 */

@Injectable()
export class MemberGrowthService {
  constructor(
    private readonly agg: ReportAggregationService,
    private readonly cache: ReportCacheService,
    private readonly memberAdapter: MemberAdapter
  ) {}

  async generate(
    tenantId: string,
    from: string,
    to: string,
    granularity: 'day' | 'week' | 'month' = 'day'
  ): Promise<ReportResult> {
    const key = this.cache.fingerprint({ tenantId, type: 'member', from, to, granularity })
    const cached = this.cache.get(key)
    if (cached) return cached

    const all = this.memberAdapter.query(tenantId, from, to)
    const dimensions: ReportDimension[] = [{ field: 'createdAt', granularity, alias: 'period' }]
    const metrics: ReportMetric[] = [
      { field: 'id', fn: 'count', alias: 'newMembers' }
    ]
    const rows = this.agg.aggregate(all, dimensions, metrics)

    return {
      type: 'member' as ReportType,
      tenantId,
      period: { from, to },
      columns: [
        { field: 'period', alias: '时间', type: 'dimension' },
        { field: 'newMembers', alias: '新增会员', type: 'metric' }
      ],
      rows,
      totals: this.agg.computeMetricsForGroup(all, metrics),
      generatedAt: new Date().toISOString(),
      cached: false
    }
  }
}
