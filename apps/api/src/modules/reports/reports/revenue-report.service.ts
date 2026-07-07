import { Injectable } from '@nestjs/common'
import type {
  ReportDimension,
  ReportMetric,
  ReportResult,
  ReportType
} from '../reports.entity'
import { ReportAggregationService } from '../report-aggregation.service'
import { ReportCacheService } from '../report-cache.service'
import { PaymentAdapter } from '../datasources/payment.adapter'

/**
 * Phase-39 T169: 营收报表
 *
 * 数据源: Payment (T168)
 * 维度: createdAt (day/week/month)
 * 度量: sum(amountCents), count(distinct orderId)
 *
 * 反模式 v4 命中:
 *  - time-series-aggregation: day/week/month 切换
 *  - multi-tenant-data-isolation: 强制 tenantId
 *  - caching-strategy: 5min TTL 缓存
 */

@Injectable()
export class RevenueReportService {
  constructor(
    private readonly agg: ReportAggregationService,
    private readonly cache: ReportCacheService,
    private readonly paymentAdapter: PaymentAdapter
  ) {}

  async generate(
    tenantId: string,
    from: string,
    to: string,
    granularity: 'day' | 'week' | 'month' = 'day'
  ): Promise<ReportResult> {
    const key = this.cache.fingerprint({ tenantId, type: 'revenue', from, to, granularity })
    const cached = this.cache.get(key)
    if (cached) return cached

    const dimensions: ReportDimension[] = [{ field: 'createdAt', granularity, alias: 'period' }]
    const metrics: ReportMetric[] = [
      { field: 'amountCents', fn: 'sum', alias: 'revenue' },
      { field: 'orderId', fn: 'distinct', alias: 'orderCount' }
    ]
    const rows = this.paymentAdapter.query(tenantId, from, to, undefined)
      .filter(p => p.status === 'SUCCESS' || p.status === 'REFUNDED')
    const aggregated = this.agg.aggregate(rows, dimensions, metrics)

    // totals
    const totals = this.agg.computeMetricsForGroup(rows, metrics)

    const result: ReportResult = {
      type: 'revenue' as ReportType,
      tenantId,
      period: { from, to },
      columns: [
        { field: 'period', alias: '时间', type: 'dimension' },
        { field: 'revenue', alias: '营收(分)', type: 'metric' },
        { field: 'orderCount', alias: '订单数', type: 'metric' }
      ],
      rows: aggregated,
      totals,
      generatedAt: new Date().toISOString(),
      cached: false
    }
    this.cache.set(key, result)
    return result
  }
}
