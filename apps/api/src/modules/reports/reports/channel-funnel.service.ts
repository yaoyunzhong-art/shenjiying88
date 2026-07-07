import { Injectable } from '@nestjs/common'
import type { ReportResult, ReportType } from '../reports.entity'
import { OrderAdapter } from '../datasources/order.adapter'

/**
 * Phase-39 T169: 渠道漏斗
 * 维度: source (wechat/alipay/web/app/miniprogram)
 * 阶段: created → paid → completed
 */

@Injectable()
export class ChannelFunnelService {
  constructor(private readonly orderAdapter: OrderAdapter) {}

  async generate(
    tenantId: string,
    from: string,
    to: string
  ): Promise<ReportResult> {
    const orders = this.orderAdapter.query(tenantId, from, to)
    const sources = ['web', 'app', 'wechat', 'alipay', 'miniprogram']
    const rows = sources.map(source => {
      const subset = orders.filter(o => o.source === source)
      const created = subset.length
      const paid = subset.filter(o => o.status === 'PAID' || o.status === 'COMPLETED' || o.status === 'REFUNDED').length
      const completed = subset.filter(o => o.status === 'COMPLETED').length
      return {
        source,
        created,
        paid,
        completed,
        payRate: created > 0 ? Number((paid / created * 100).toFixed(2)) : 0,
        completeRate: paid > 0 ? Number((completed / paid * 100).toFixed(2)) : 0
      }
    })
    return {
      type: 'channel-funnel' as ReportType,
      tenantId,
      period: { from, to },
      columns: [
        { field: 'source', alias: '渠道', type: 'dimension' },
        { field: 'created', alias: '创建', type: 'metric' },
        { field: 'paid', alias: '已支付', type: 'metric' },
        { field: 'completed', alias: '已完成', type: 'metric' },
        { field: 'payRate', alias: '支付率(%)', type: 'metric' },
        { field: 'completeRate', alias: '完成率(%)', type: 'metric' }
      ],
      rows,
      generatedAt: new Date().toISOString(),
      cached: false
    }
  }
}
