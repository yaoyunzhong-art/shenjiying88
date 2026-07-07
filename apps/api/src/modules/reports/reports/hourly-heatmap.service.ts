import { Injectable } from '@nestjs/common'
import type { ReportResult, ReportType } from '../reports.entity'
import { OrderAdapter } from '../datasources/order.adapter'

/**
 * Phase-39 T169: 时段热力图
 * 维度: 星期 (0-6) × 小时 (0-23)
 */

@Injectable()
export class HourlyHeatmapService {
  constructor(private readonly orderAdapter: OrderAdapter) {}

  async generate(
    tenantId: string,
    from: string,
    to: string
  ): Promise<ReportResult> {
    const orders = this.orderAdapter.query(tenantId, from, to)
      .filter(o => o.status !== 'CANCELLED')
    const heatmap: Record<string, number> = {}
    for (const o of orders) {
      const d = new Date(o.createdAt)
      const day = d.getUTCDay()
      const hour = d.getUTCHours()
      const key = `${day}-${hour}`
      heatmap[key] = (heatmap[key] ?? 0) + 1
    }
    const rows = []
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        rows.push({ day, hour, count: heatmap[`${day}-${hour}`] ?? 0 })
      }
    }
    return {
      type: 'hourly-heatmap' as ReportType,
      tenantId,
      period: { from, to },
      columns: [
        { field: 'day', alias: '星期', type: 'dimension' },
        { field: 'hour', alias: '小时', type: 'dimension' },
        { field: 'count', alias: '订单数', type: 'metric' }
      ],
      rows,
      generatedAt: new Date().toISOString(),
      cached: false
    }
  }
}
