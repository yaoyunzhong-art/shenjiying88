import { Injectable } from '@nestjs/common'
import type { ReportFilterGroup } from '../reports.entity'

/**
 * Phase-39 T169: Refund DataAdapter
 *
 * 数据源: Refund (T168)
 * 字段: id, tenantId, paymentId, orderId, amountCents, reason, status, createdAt
 */

export interface RefundRow {
  id: string
  tenantId: string
  paymentId: string
  orderId: string
  amountCents: number
  reason: string
  status: 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED'
  createdAt: string
}

type RefundScalar = RefundRow[keyof RefundRow]

@Injectable()
export class RefundAdapter {
  private mockData: RefundRow[] = []

  seed(data: RefundRow[]): void {
    this.mockData.push(...data)
  }

  reset(): void {
    this.mockData = []
  }

  query(tenantId: string, from: string, to: string, filters?: ReportFilterGroup): RefundRow[] {
    let all = this.mockData.filter(r =>
      r.tenantId === tenantId &&
      r.createdAt >= from &&
      r.createdAt <= to
    )
    if (filters) all = all.filter(r => this.matchFilters(r, filters))
    return all
  }

  private matchFilters(row: RefundRow, group: ReportFilterGroup): boolean {
    const results = group.conditions.map(c => {
      if ('conditions' in c) return this.matchFilters(row, c as ReportFilterGroup)
      const v = this.getFieldValue(row, c.field)
      switch (c.op) {
        case '=': return v === c.value
        case '!=': return v !== c.value
        case 'in': return Array.isArray(c.value) && c.value.includes(v)
        case 'between': return Array.isArray(c.value) && v >= c.value[0] && v <= c.value[1]
        default: return false
      }
    })
    return group.op === 'AND' ? results.every(Boolean) : results.some(Boolean)
  }

  private getFieldValue(row: RefundRow, field: string): RefundScalar {
    return (row as unknown as Record<string, RefundScalar>)[field] ?? ''
  }
}
