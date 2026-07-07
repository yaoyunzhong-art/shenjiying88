import { Injectable } from '@nestjs/common'
import type { ReportResult, ReportType } from '../reports.entity'
import { OrderAdapter } from '../datasources/order.adapter'

/**
 * Phase-39 T169: 商品销售排行 Top N
 *
 * 来源: Order.itemCount (聚合代替 orderItems)
 */

@Injectable()
export class ProductRankingService {
  constructor(private readonly orderAdapter: OrderAdapter) {}

  async generate(
    tenantId: string,
    from: string,
    to: string,
    topN: number = 10
  ): Promise<ReportResult> {
    const orders = this.orderAdapter.query(tenantId, from, to)
      .filter(o => o.status === 'COMPLETED')
    // 简化: 按 source 聚合 (实际生产按 itemId)
    const sourceAgg = new Map<string, { count: number; totalCents: number }>()
    for (const o of orders) {
      const existing = sourceAgg.get(o.source) ?? { count: 0, totalCents: 0 }
      existing.count += o.itemCount
      existing.totalCents += o.totalCents
      sourceAgg.set(o.source, existing)
    }
    const rows = Array.from(sourceAgg.entries())
      .sort((a, b) => b[1].totalCents - a[1].totalCents)
      .slice(0, topN)
      .map(([source, agg], idx) => ({
        rank: idx + 1,
        source,
        soldQty: agg.count,
        totalCents: agg.totalCents
      }))
    return {
      type: 'product-ranking' as ReportType,
      tenantId,
      period: { from, to },
      columns: [
        { field: 'rank', alias: '排名', type: 'metric' },
        { field: 'source', alias: '渠道', type: 'dimension' },
        { field: 'soldQty', alias: '销量', type: 'metric' },
        { field: 'totalCents', alias: '销售额(分)', type: 'metric' }
      ],
      rows,
      generatedAt: new Date().toISOString(),
      cached: false
    }
  }
}
