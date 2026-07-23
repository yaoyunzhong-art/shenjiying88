import { Injectable } from '@nestjs/common'
import type { ReportFilterGroup } from '../reports.entity'

/**
 * Phase-39 T169: Inventory DataAdapter
 *
 * 数据源: InventoryItem (T167)
 * 字段: id, tenantId, sku, name, totalQty, reservedQty, availableQty, lowStockThreshold, status
 */

export interface InventoryRow {
  id: string
  tenantId: string
  sku: string
  name: string
  category: string
  totalQty: number
  reservedQty: number
  availableQty: number
  lowStockThreshold: number
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  unitPriceCents: number
}

type InventoryScalar = InventoryRow[keyof InventoryRow]

@Injectable()
export class InventoryAdapter {
  private mockData: InventoryRow[] = []

  seed(data: InventoryRow[]): void {
    this.mockData.push(...data)
  }

  reset(): void {
    this.mockData = []
  }

  /** 库存快照查询 (无时间维度, 全量) */
  query(tenantId: string, filters?: ReportFilterGroup): InventoryRow[] {
    let all = this.mockData.filter(i => i.tenantId === tenantId)
    if (filters) all = all.filter(i => this.matchFilters(i, filters))
    return all
  }

  private matchFilters(row: InventoryRow, group: ReportFilterGroup): boolean {
    const results = group.conditions.map(c => {
      if ('conditions' in c) return this.matchFilters(row, c as ReportFilterGroup)
      const v = this.getFieldValue(row, c.field)
      switch (c.op) {
        case '=': return v === c.value
        case '!=': return v !== c.value
        case '<=': return v <= c.value
        case '>=': return v >= c.value
        case 'in': return Array.isArray(c.value) && c.value.includes(v)
        default: return false
      }
    })
    return group.op === 'AND' ? results.every(Boolean) : results.some(Boolean)
  }

  private getFieldValue(row: InventoryRow, field: string): InventoryScalar {
    return (row as unknown as Record<string, InventoryScalar>)[field] ?? ''
  }
}
