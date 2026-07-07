import { Injectable } from '@nestjs/common'
import type { ReportResult, ReportType } from '../reports.entity'
import { OrderAdapter } from '../datasources/order.adapter'

/**
 * Phase-39 T169: 订单转化漏斗
 *
 * 阶段: CREATED → PAID → COMPLETED
 * 度量: 各阶段数量 + 转化率
 */

@Injectable()
export class OrderConversionService {
  constructor(private readonly orderAdapter: OrderAdapter) {}

  async generate(
    tenantId: string,
    from: string,
    to: string
  ): Promise<ReportResult> {
    const orders = this.orderAdapter.query(tenantId, from, to)
    const created = orders.filter(o => o.status === 'CREATED' || o.status === 'PAID' || o.status === 'COMPLETED' || o.status === 'REFUNDED').length
    const paid = orders.filter(o => o.status === 'PAID' || o.status === 'COMPLETED' || o.status === 'REFUNDED').length
    const completed = orders.filter(o => o.status === 'COMPLETED').length
    const refunded = orders.filter(o => o.status === 'REFUNDED').length

    return {
      type: 'order' as ReportType,
      tenantId,
      period: { from, to },
      columns: [
        { field: 'stage', alias: '阶段', type: 'dimension' },
        { field: 'count', alias: '数量', type: 'metric' },
        { field: 'conversionRate', alias: '转化率(%)', type: 'metric' }
      ],
      rows: [
        { stage: 'CREATED', count: created, conversionRate: 100 },
        { stage: 'PAID', count: paid, conversionRate: created > 0 ? Number((paid / created * 100).toFixed(2)) : 0 },
        { stage: 'COMPLETED', count: completed, conversionRate: paid > 0 ? Number((completed / paid * 100).toFixed(2)) : 0 },
        { stage: 'REFUNDED', count: refunded, conversionRate: paid > 0 ? Number((refunded / paid * 100).toFixed(2)) : 0 }
      ],
      generatedAt: new Date().toISOString(),
      cached: false
    }
  }
}
