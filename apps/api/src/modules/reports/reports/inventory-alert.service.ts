import { Injectable } from '@nestjs/common'
import type { ReportResult, ReportType } from '../reports.entity'
import { InventoryAdapter } from '../datasources/inventory.adapter'

/**
 * Phase-39 T169: 库存预警报表
 * 条件: availableQty <= lowStockThreshold
 */

@Injectable()
export class InventoryAlertService {
  constructor(private readonly inventoryAdapter: InventoryAdapter) {}

  async generate(tenantId: string): Promise<ReportResult> {
    const items = this.inventoryAdapter.query(tenantId)
      .filter(i => i.status === 'ACTIVE' && i.availableQty <= i.lowStockThreshold)
      .map(i => ({
        sku: i.sku,
        name: i.name,
        availableQty: i.availableQty,
        threshold: i.lowStockThreshold,
        severity: i.availableQty === 0 ? 'CRITICAL' : i.availableQty <= i.lowStockThreshold / 2 ? 'HIGH' : 'MEDIUM'
      }))
      .sort((a, b) => a.availableQty - b.availableQty)
    return {
      type: 'inventory-alert' as ReportType,
      tenantId,
      period: { from: new Date().toISOString(), to: new Date().toISOString() },
      columns: [
        { field: 'sku', alias: 'SKU', type: 'dimension' },
        { field: 'name', alias: '商品', type: 'dimension' },
        { field: 'availableQty', alias: '可用库存', type: 'metric' },
        { field: 'threshold', alias: '阈值', type: 'metric' },
        { field: 'severity', alias: '严重度', type: 'dimension' }
      ],
      rows: items,
      generatedAt: new Date().toISOString(),
      cached: false
    }
  }
}
