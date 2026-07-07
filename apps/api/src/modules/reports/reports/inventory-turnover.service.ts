import { Injectable } from '@nestjs/common'
import type { ReportResult, ReportType } from '../reports.entity'
import { InventoryAdapter } from '../datasources/inventory.adapter'
import { OrderAdapter } from '../datasources/order.adapter'

/**
 * Phase-39 T169: 库存周转报表
 *
 * 度量: turnoverRate = soldQty / avgInventory
 *        daysOfCover = currentInventory / avgDailySales
 *
 * 反模式 v4 multi-tenant-data-isolation: tenantId 强制
 */

@Injectable()
export class InventoryTurnoverService {
  constructor(
    private readonly inventoryAdapter: InventoryAdapter,
    private readonly orderAdapter: OrderAdapter
  ) {}

  async generate(
    tenantId: string,
    from: string,
    to: string
  ): Promise<ReportResult> {
    const inventory = this.inventoryAdapter.query(tenantId)
    const orders = this.orderAdapter.query(tenantId, from, to)
      .filter(o => o.status === 'COMPLETED')
    // 简化: avgDailySales = totalItemCount / 30
    const totalSold = orders.reduce((acc, o) => acc + o.itemCount, 0)
    const days = Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000))
    const avgDailySales = totalSold / days

    const rows = inventory.map(inv => {
      const turnoverRate = inv.totalQty > 0 ? Number((totalSold / Math.max(1, inv.totalQty)).toFixed(4)) : 0
      const daysOfCover = avgDailySales > 0 ? Number((inv.availableQty / avgDailySales).toFixed(2)) : 0
      return {
        sku: inv.sku,
        name: inv.name,
        category: inv.category,
        currentQty: inv.availableQty,
        turnoverRate,
        daysOfCover
      }
    })

    return {
      type: 'inventory' as ReportType,
      tenantId,
      period: { from, to },
      columns: [
        { field: 'sku', alias: 'SKU', type: 'dimension' },
        { field: 'name', alias: '商品名称', type: 'dimension' },
        { field: 'category', alias: '分类', type: 'dimension' },
        { field: 'currentQty', alias: '当前库存', type: 'metric' },
        { field: 'turnoverRate', alias: '周转率', type: 'metric' },
        { field: 'daysOfCover', alias: '可售天数', type: 'metric' }
      ],
      rows,
      generatedAt: new Date().toISOString(),
      cached: false
    }
  }
}
