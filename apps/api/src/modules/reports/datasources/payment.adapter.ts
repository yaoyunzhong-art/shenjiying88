import { Injectable } from '@nestjs/common'
import type { ReportFilterGroup } from '../reports.entity'

/**
 * Phase-39 T169: Payment DataAdapter
 *
 * 数据源: Payment (T168)
 * 字段: id, tenantId, orderId, amountCents, currency, method, status, createdAt
 */

export interface PaymentRow {
  id: string
  tenantId: string
  orderId: string
  amountCents: number
  currency: string
  method: 'WECHAT' | 'ALIPAY' | 'CARD' | 'CASH' | 'BALANCE'
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
  createdAt: string
}

type PaymentScalar = PaymentRow[keyof PaymentRow]

@Injectable()
export class PaymentAdapter {
  private mockData: PaymentRow[] = []

  seed(data: PaymentRow[]): void {
    this.mockData.push(...data)
  }

  reset(): void {
    this.mockData = []
  }

  query(tenantId: string, from: string, to: string, filters?: ReportFilterGroup): PaymentRow[] {
    let all = this.mockData.filter(p =>
      p.tenantId === tenantId &&
      p.createdAt >= from &&
      p.createdAt <= to
    )
    if (filters) all = all.filter(p => this.matchFilters(p, filters))
    return all
  }

  private matchFilters(row: PaymentRow, group: ReportFilterGroup): boolean {
    const results = group.conditions.map(c => {
      if ('conditions' in c) return this.matchFilters(row, c as ReportFilterGroup)
      const v = this.getFieldValue(row, c.field)
      switch (c.op) {
        case '=': return v === c.value
        case '!=': return v !== c.value
        case '>': return v > c.value
        case '>=': return v >= c.value
        case '<': return v < c.value
        case '<=': return v <= c.value
        case 'in': return Array.isArray(c.value) && c.value.includes(v)
        case 'notIn': return Array.isArray(c.value) && !c.value.includes(v)
        case 'between': return Array.isArray(c.value) && v >= c.value[0] && v <= c.value[1]
        default: return false
      }
    })
    return group.op === 'AND' ? results.every(Boolean) : results.some(Boolean)
  }

  private getFieldValue(row: PaymentRow, field: string): PaymentScalar {
    return (row as unknown as Record<string, PaymentScalar>)[field] ?? ''
  }
}
