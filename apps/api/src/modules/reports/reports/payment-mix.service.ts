import { Injectable } from '@nestjs/common'
import type { ReportResult, ReportType } from '../reports.entity'
import { PaymentAdapter } from '../datasources/payment.adapter'

/**
 * Phase-39 T169: 支付方式占比
 */

@Injectable()
export class PaymentMixService {
  constructor(private readonly paymentAdapter: PaymentAdapter) {}

  async generate(
    tenantId: string,
    from: string,
    to: string
  ): Promise<ReportResult> {
    const payments = this.paymentAdapter.query(tenantId, from, to)
      .filter(p => p.status === 'SUCCESS')
    const total = payments.length
    const agg = new Map<string, { count: number; amountCents: number }>()
    for (const p of payments) {
      const existing = agg.get(p.method) ?? { count: 0, amountCents: 0 }
      existing.count++
      existing.amountCents += p.amountCents
      agg.set(p.method, existing)
    }
    const rows = Array.from(agg.entries()).map(([method, v]) => ({
      method,
      count: v.count,
      amountCents: v.amountCents,
      percentage: total > 0 ? Number((v.count / total * 100).toFixed(2)) : 0
    })).sort((a, b) => b.count - a.count)
    return {
      type: 'payment-mix' as ReportType,
      tenantId,
      period: { from, to },
      columns: [
        { field: 'method', alias: '支付方式', type: 'dimension' },
        { field: 'count', alias: '笔数', type: 'metric' },
        { field: 'amountCents', alias: '金额(分)', type: 'metric' },
        { field: 'percentage', alias: '占比(%)', type: 'metric' }
      ],
      rows,
      generatedAt: new Date().toISOString(),
      cached: false
    }
  }
}
