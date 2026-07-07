import { Injectable, Logger, Optional } from '@nestjs/common'
import type { Payment, PaymentMethod } from '@m5/types'
import {
  type ReconciliationAdapter,
  type ReconciliationReport,
  type ReconciliationDiscrepancy,
  type ChannelBillRow
} from './reconciliation.port'

/**
 * ReconciliationService · 内部 Payment vs 通道账单 对比 (P1-2.4)
 *
 * 流程:
 *   1. 拉取内部 Payment (由 deps 提供, 避免直接耦合 PaymentService)
 *   2. 拉取通道账单 (adapter.downloadBill)
 *   3. 双索引:
 *      - internalMap: outOrderId → Payment
 *      - channelMap: outOrderId → ChannelBillRow
 *   4. 遍历: 4 类差异
 *      - only-internal: 内部有, 通道无
 *      - only-channel: 通道有, 内部无
 *      - amount-mismatch: 内部通道都在, 金额不一致
 *      - status-mismatch: 内部通道都在, 状态不一致
 *   5. 输出 ReconciliationReport
 *
 * 未来扩展 (P1-2.5):
 *   - 差异自动入 Dispute 表 → 财务审核
 *   - 同步到 admin-web 差异看板
 */

export interface ReconciliationServiceDeps {
  /** 拉取租户某天的所有 Payment */
  listPaymentsByDate(tenantId: string, date: string): Promise<Payment[]>
  /** 写差异入 Dispute 表 (可选, 缺则只输出 report) */
  recordDiscrepancy?(discrepancy: ReconciliationDiscrepancy & { reportId: string }): Promise<void>
}

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name)

  constructor(
    private readonly deps: ReconciliationServiceDeps,
    @Optional() private readonly adapters?: Map<PaymentMethod, ReconciliationAdapter>
  ) {}

  /**
   * 对账主入口
   */
  async reconcile(input: {
    tenantId: string
    channel: PaymentMethod
    date: string
    reportId?: string
  }): Promise<ReconciliationReport> {
    const startedAt = Date.now()
    const reportId = input.reportId ?? `recon-${input.tenantId}-${input.channel}-${input.date}-${Date.now()}`
    const report: ReconciliationReport = {
      tenantId: input.tenantId,
      channel: input.channel,
      date: input.date,
      internalCount: 0,
      channelCount: 0,
      matched: 0,
      discrepancies: [],
      internalTotalCents: 0,
      channelTotalCents: 0,
      diffTotalCents: 0,
      generatedAt: new Date().toISOString(),
      durationMs: 0
    }

    // 1. 拉内部
    const internal = await this.deps.listPaymentsByDate(input.tenantId, input.date)
    report.internalCount = internal.length
    report.internalTotalCents = internal
      .filter((p) => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + p.amountCents, 0)

    // 2. 拉通道
    const adapter = this.adapters?.get(input.channel)
    if (!adapter) {
      this.logger.warn(
        `No adapter for channel=${input.channel} (tenant=${input.tenantId}); producing partial report`
      )
      report.generatedAt = new Date().toISOString()
      report.durationMs = Date.now() - startedAt
      return report
    }
    const channel = await adapter.downloadBill(input.tenantId, input.date)
    report.channelCount = channel.length
    report.channelTotalCents = channel
      .filter((r) => r.status === 'SUCCESS')
      .reduce((sum, r) => sum + r.amountCents, 0)
    report.diffTotalCents = report.internalTotalCents - report.channelTotalCents

    // 3. 索引
    const internalMap = new Map<string, Payment>(internal.map((p) => [p.id, p]))
    const channelMap = new Map<string, ChannelBillRow>(channel.map((r) => [r.outOrderId, r]))

    // 4. 遍历对比
    const seenChannelIds = new Set<string>()

    for (const [outOrderId, internalPayment] of internalMap) {
      const channelRow = channelMap.get(outOrderId)
      if (!channelRow) {
        // only-internal
        this.addDiscrepancy(report, reportId, {
          kind: 'only-internal',
          outOrderId,
          channel: input.channel,
          internalAmountCents: internalPayment.amountCents,
          internalStatus: internalPayment.status,
          note: '内部有支付, 通道账单无对应记录 (可能漏单或通道未生成)'
        })
        continue
      }
      seenChannelIds.add(outOrderId)

      if (internalPayment.amountCents !== channelRow.amountCents) {
        this.addDiscrepancy(report, reportId, {
          kind: 'amount-mismatch',
          outOrderId,
          channelTxnId: channelRow.channelTxnId,
          channel: input.channel,
          internalAmountCents: internalPayment.amountCents,
          channelAmountCents: channelRow.amountCents,
          note: '金额不一致'
        })
        continue
      }

      if (!this.statusEquivalent(internalPayment.status, channelRow.status)) {
        this.addDiscrepancy(report, reportId, {
          kind: 'status-mismatch',
          outOrderId,
          channelTxnId: channelRow.channelTxnId,
          channel: input.channel,
          internalStatus: internalPayment.status,
          channelStatus: channelRow.status,
          note: '状态不一致'
        })
        continue
      }

      report.matched += 1
    }

    // only-channel: 通道有, 内部无
    for (const [outOrderId, channelRow] of channelMap) {
      if (seenChannelIds.has(outOrderId)) continue
      this.addDiscrepancy(report, reportId, {
        kind: 'only-channel',
        outOrderId,
        channelTxnId: channelRow.channelTxnId,
        channel: input.channel,
        channelAmountCents: channelRow.amountCents,
        channelStatus: channelRow.status,
        note: '通道有账单, 内部无 (可能数据丢失)'
      })
    }

    report.generatedAt = new Date().toISOString()
    report.durationMs = Date.now() - startedAt

    this.logger.log(
      `Reconciliation ${reportId}: ${report.matched} matched, ${report.discrepancies.length} discrepancies (${report.durationMs}ms)`
    )

    return report
  }

  /**
   * 内部 Payment.status 与通道 BillRow.status 状态等价映射
   */
  private statusEquivalent(
    internal: string,
    channel: ChannelBillRow['status']
  ): boolean {
    if (internal === 'SUCCESS' && (channel === 'SUCCESS' || channel === 'REFUND')) return true
    if (internal === 'FAILED' && channel === 'FAILED') return true
    if (internal === 'PENDING' && channel === 'PENDING') return true
    return false
  }

  private async addDiscrepancy(
    report: ReconciliationReport,
    reportId: string,
    discrepancy: ReconciliationDiscrepancy
  ): Promise<void> {
    report.discrepancies.push(discrepancy)
    if (this.deps.recordDiscrepancy) {
      try {
        await this.deps.recordDiscrepancy({ ...discrepancy, reportId })
      } catch (error) {
        this.logger.warn(
          `recordDiscrepancy failed for ${discrepancy.outOrderId}: ${(error as Error).message}`
        )
      }
    }
  }
}
