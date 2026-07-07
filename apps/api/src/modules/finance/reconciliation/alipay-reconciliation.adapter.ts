import { Injectable, Logger } from '@nestjs/common'
import { createHmac } from 'node:crypto'
import type { PaymentMethod } from '@m5/types'
import {
  ReconciliationAdapter,
  ReconciliationHealth,
  ReconciliationAdapterError,
  type ChannelBillRow
} from './reconciliation.port'

/**
 * AlipayReconciliationAdapter · 支付宝账单 T+1 对账适配器
 *
 * 支付宝 OpenAPI 2.0 账单查询:
 *   1. alipay.data.bill.acceptquery → 返回账单 URL
 *   2. GET 该 URL → 下载 zip (含 .csv)
 *   3. 解压 + 解析 CSV
 *
 * MVP (P1-2.3): 直接返回空账单 (等真实接入, 模板先落地)
 *   - 真实环境需 2 步: acceptquery + 文件下载
 *   - 签名走 OpenAPI 2.0 (类比 AlipayGateway.signRequestParams)
 *
 * CSV 字段 (无表头):
 *   0: 支付宝交易号 (trade_no)
 *   1: 商户订单号 (out_trade_no)
 *   2: 业务类型
 *   3: 交易时间
 *   4: 收/支
 *   5: 金额 (元)
 *   6: 手续费 (元)
 *   7: 状态
 */

export interface AlipayReconciliationConfig {
  baseUrl: string
  appId: string
  privateKey: string
  timeoutMs?: number
}

@Injectable()
export class AlipayReconciliationAdapter implements ReconciliationAdapter {
  readonly channel: PaymentMethod = 'ALIPAY'
  private readonly logger = new Logger(AlipayReconciliationAdapter.name)
  private readonly config: Required<AlipayReconciliationConfig>
  private readonly health: Map<string, ReconciliationHealth> = new Map()

  constructor(config: AlipayReconciliationConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      appId: config.appId,
      privateKey: config.privateKey,
      timeoutMs: config.timeoutMs ?? 30000
    }
  }

  async downloadBill(tenantId: string, date: string): Promise<ChannelBillRow[]> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ReconciliationAdapterError({
        channel: this.channel,
        tenantId,
        date,
        retryable: false,
        message: `Invalid date format: ${date}`
      })
    }

    // MVP: 真实接入待 P1-2.5
    // 1. 调 alipay.data.bill.acceptquery
    // 2. 拿到 bill_url
    // 3. 下载 + 解压
    // 4. parseAlipayCsv
    this.logger.debug(
      `Alipay bill download is MVP stub (tenant=${tenantId} date=${date})`
    )
    this.recordSuccess(tenantId)
    return []
  }

  async healthCheck(tenantId: string): Promise<ReconciliationHealth> {
    return (
      this.health.get(tenantId) ?? {
        healthy: true,
        channel: this.channel,
        consecutiveFailures: 0
      }
    )
  }

  // ─── 解析 (供 P1-2.5 完整化时使用) ──────────────────

  /**
   * 解析支付宝 CSV (无表头)
   * 注: 真实场景 CSV 文件头可能为 GBK, 需 iconv-lite 转码
   */
  parseAlipayCsv(csv: string, tenantId: string): ChannelBillRow[] {
    const rows: ChannelBillRow[] = []
    const lines = csv.split('\n').filter((line) => line.trim().length > 0)

    for (const line of lines) {
      const cols = line.split(',').map((c) => c.trim())
      if (cols.length < 8) continue

      const [
        channelTxnId,
        outOrderId,
        businessType,
        completedAt,
        direction,
        amountYuan,
        feeYuan,
        statusText
      ] = cols

      // 跳过表头行
      if (channelTxnId === '支付宝交易号') continue

      const amountCents = Math.round(parseFloat(amountYuan ?? '0') * 100)
      const feeCents = Math.round(parseFloat(feeYuan ?? '0') * 100)
      const isRefund = direction === '支出'

      rows.push({
        channelTxnId,
        outOrderId,
        channel: this.channel,
        amountCents: isRefund ? -amountCents : amountCents,
        feeCents: isRefund ? -feeCents : feeCents,
        txType: businessType?.includes('退款') ? 'REFUND' : 'PAYMENT',
        status: this.parseStatus(statusText),
        completedAt: this.normalizeDateTime(completedAt),
        rawPayload: { tenantId, businessType, direction, statusText }
      })
    }
    return rows
  }

  private parseStatus(text: string): ChannelBillRow['status'] {
    if (text === '交易成功' || text === '支付成功') return 'SUCCESS'
    if (text === '已退款') return 'REFUND'
    if (text === '交易关闭' || text === '支付失败') return 'FAILED'
    return 'PENDING'
  }

  private normalizeDateTime(input: string): string {
    if (!input) return new Date().toISOString()
    // 2026-07-02 14:30:00 (支付宝无时区, 假定 +08:00)
    const match = input.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/)
    if (!match) return input
    return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}+08:00`
  }

  // ─── 签名 (供 P1-2.5 使用) ───────────────────────

  private signRequestParams(params: Record<string, string>): string {
    const sorted = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&')
    const signer = createHmac('sha256', this.config.privateKey)
    signer.update(sorted, 'utf8')
    return signer.digest('base64')
  }

  private recordSuccess(tenantId: string) {
    this.health.set(tenantId, {
      healthy: true,
      channel: this.channel,
      lastSuccessAt: new Date().toISOString(),
      consecutiveFailures: 0
    })
  }
}
