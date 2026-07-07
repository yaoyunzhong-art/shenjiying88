import { Injectable } from '@nestjs/common'
import type { ReportResult, ReportType } from '../reports.entity'
import { PaymentAdapter } from '../datasources/payment.adapter'
import { RefundAdapter } from '../datasources/refund.adapter'

/**
 * Phase-39 T169: 退款率报表
 *
 * 度量: 退款率 = refundAmount / paymentAmount
 *        退款订单数 / 支付订单数
 * 反模式 v4 multi-tenant-data-isolation
 */

@Injectable()
export class RefundRateService {
  constructor(
    private readonly paymentAdapter: PaymentAdapter,
    private readonly refundAdapter: RefundAdapter
  ) {}

  async generate(
    tenantId: string,
    from: string,
    to: string
  ): Promise<ReportResult> {
    const payments = this.paymentAdapter.query(tenantId, from, to)
      .filter(p => p.status === 'SUCCESS')
    const refunds = this.refundAdapter.query(tenantId, from, to)
      .filter(r => r.status === 'COMPLETED')

    const totalPayment = payments.reduce((acc, p) => acc + p.amountCents, 0)
    const totalRefund = refunds.reduce((acc, r) => acc + r.amountCents, 0)
    const refundRate = totalPayment > 0 ? Number((totalRefund / totalPayment * 100).toFixed(2)) : 0
    const refundOrderRate = payments.length > 0 ? Number((refunds.length / payments.length * 100).toFixed(2)) : 0

    return {
      type: 'refund' as ReportType,
      tenantId,
      period: { from, to },
      columns: [
        { field: 'metric', alias: '指标', type: 'dimension' },
        { field: 'value', alias: '值', type: 'metric' }
      ],
      rows: [
        { metric: '支付总额(分)', value: totalPayment },
        { metric: '退款总额(分)', value: totalRefund },
        { metric: '退款率(%)', value: refundRate },
        { metric: '退款订单率(%)', value: refundOrderRate }
      ],
      generatedAt: new Date().toISOString(),
      cached: false
    }
  }
}
