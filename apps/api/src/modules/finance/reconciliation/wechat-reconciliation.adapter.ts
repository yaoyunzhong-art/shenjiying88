import { Injectable, Logger } from '@nestjs/common'
import type { PaymentMethod } from '@m5/types'
import {
  ReconciliationAdapter,
  ReconciliationHealth,
  ReconciliationAdapterError,
  type ChannelBillRow
} from './reconciliation.port'

/**
 * WeChatReconciliationAdapter · 微信资金账单 T+1 对账适配器
 *
 * 微信 V3 资金账单 API:
 *   GET /v3/bill/fundflowbill?bill_date=YYYY-MM-DD&bill_type=FUND&tar_type=GZIP
 *   返回 gzip 压缩的 CSV
 *
 * CSV 字段 (无表头):
 *   0: 记账时间 (yyyy-MM-dd HH:mm:ss)
 *   1: 微信支付业务单号 (transaction_id)
 *   2: 商户订单号 (out_trade_no)
 *   3: 资金流水单号 (fund_flow_id)
 *   4: 业务名称 (下单支付 / 退款)
 *   5: 收支类型 (收入 / 支出)
 *   6: 收支金额 (元)
 *   7: 手续费 (元)
 *   8: 资金状态 (成功 / 退款)
 *
 * P1-2.2 MVP 实现:
 *   - 暂用 HTTP fetch + 文本解析 (gz 解压待 P1-2.5 完整化)
 *   - 暂不验签 (P2 落 KMS 证书)
 *   - 沙箱/真实 baseUrl 由调用方注入
 */

export interface WeChatReconciliationConfig {
  baseUrl: string
  signingSecret: string
  /** 单次超时 ms */
  timeoutMs?: number
}

@Injectable()
export class WeChatReconciliationAdapter implements ReconciliationAdapter {
  readonly channel: PaymentMethod = 'WECHAT'
  private readonly logger = new Logger(WeChatReconciliationAdapter.name)
  private readonly config: Required<WeChatReconciliationConfig>
  private readonly health: Map<string, ReconciliationHealth> = new Map()

  constructor(config: WeChatReconciliationConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      signingSecret: config.signingSecret,
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
        message: `Invalid date format: ${date}, expected YYYY-MM-DD`
      })
    }

    const path = `/v3/bill/fundflowbill?bill_date=${encodeURIComponent(date)}&bill_type=FUND&tar_type=GZIP`
    const startedAt = Date.now()

    try {
      const response = await fetch(`${this.config.baseUrl}${path}`, {
        signal: AbortSignal.timeout(this.config.timeoutMs),
        headers: {
          Accept: 'application/octet-stream',
          'x-pay-channel': this.channel,
          'x-pay-tenant': tenantId,
          'x-pay-signing-secret': this.config.signingSecret
        }
      })
      if (!response.ok) {
        const retryable = response.status >= 500 || response.status === 429
        this.recordFailure(tenantId, `HTTP ${response.status}`, retryable)
        throw new ReconciliationAdapterError({
          channel: this.channel,
          tenantId,
          date,
          retryable,
          message: `WeChat bill fetch failed: HTTP ${response.status}`,
          cause: new Error(`HTTP ${response.status}`)
        })
      }

      const text = await response.text()
      // MVP: 假设返回的是明文 CSV (无 gzip)
      // P1-2.5 完整化: 接入 zlib.gunzip
      const rows = this.parseWeChatCsv(text, tenantId)
      this.recordSuccess(tenantId)
      this.logger.log(
        `Downloaded WeChat bill: tenant=${tenantId} date=${date} rows=${rows.length} duration=${Date.now() - startedAt}ms`
      )
      return rows
    } catch (error) {
      if (error instanceof ReconciliationAdapterError) throw error
      this.recordFailure(tenantId, (error as Error).message, true)
      throw new ReconciliationAdapterError({
        channel: this.channel,
        tenantId,
        date,
        retryable: true,
        message: `WeChat bill fetch error: ${(error as Error).message}`,
        cause: error
      })
    }
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

  // ─── 解析 ─────────────────────────────────────────

  /**
   * 解析微信 CSV (无表头)
   * 真实场景: gzip 解压后逐行解析
   */
  parseWeChatCsv(csv: string, tenantId: string): ChannelBillRow[] {
    const rows: ChannelBillRow[] = []
    const lines = csv.split('\n').filter((line) => line.trim().length > 0)

    for (const line of lines) {
      const cols = line.split(',').map((c) => c.trim())
      if (cols.length < 9) continue

      const [
        completedAt,
        channelTxnId,
        outOrderId,
        // fundFlowId, // 未使用
        _fundFlowId,
        businessName,
        direction,
        amountYuan,
        feeYuan,
        statusText
      ] = cols

      // 跳过汇总行 (微信 CSV 末尾)
      if (channelTxnId === '资金流水单号') continue
      if (outOrderId === '商户订单号') continue

      const amountCents = Math.round(parseFloat(amountYuan ?? '0') * 100)
      const feeCents = Math.round(parseFloat(feeYuan ?? '0') * 100)
      const isRefund = direction === '支出'
      const status = this.parseStatus(statusText)

      rows.push({
        channelTxnId,
        outOrderId,
        channel: this.channel,
        amountCents: isRefund ? -amountCents : amountCents,
        feeCents: isRefund ? -feeCents : feeCents,
        txType: businessName?.includes('退款') ? 'REFUND' : 'PAYMENT',
        status,
        completedAt: this.normalizeDateTime(completedAt),
        rawPayload: { tenantId, businessName, direction, statusText }
      })
    }
    return rows
  }

  private parseStatus(text: string): ChannelBillRow['status'] {
    if (text === '成功') return 'SUCCESS'
    if (text === '退款') return 'REFUND'
    if (text === '失败') return 'FAILED'
    return 'PENDING'
  }

  /**
   * 微信 CSV 时间格式: "yyyy-MM-dd HH:mm:ss" → ISO 8601
   * 不依赖时区 (微信默认 +08:00, 显式标注)
   */
  private normalizeDateTime(input: string): string {
    if (!input) return new Date().toISOString()
    // 2026-07-02 14:30:00 → 2026-07-02T14:30:00+08:00
    const match = input.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/)
    if (!match) return input
    return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}+08:00`
  }

  private recordSuccess(tenantId: string) {
    this.health.set(tenantId, {
      healthy: true,
      channel: this.channel,
      lastSuccessAt: new Date().toISOString(),
      consecutiveFailures: 0
    })
  }

  private recordFailure(tenantId: string, message: string, _retryable: boolean) {
    const prev = this.health.get(tenantId)
    this.health.set(tenantId, {
      healthy: false,
      channel: this.channel,
      lastSuccessAt: prev?.lastSuccessAt,
      consecutiveFailures: (prev?.consecutiveFailures ?? 0) + 1,
      lastError: message
    })
  }
}
