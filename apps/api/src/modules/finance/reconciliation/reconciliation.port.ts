import type { PaymentMethod } from '@m5/types'

/**
 * ReconciliationAdapter · T+1 对账适配器端口 (P1-2.1)
 *
 * 通道对账的核心契约:
 *   - 拉取指定日期的通道账单 (T+1 早上 2 点, 通道在前一天 23 点生成)
 *   - 把通道原始数据 (CSV / 压缩包 / JSON) 解析为标准 BillRow
 *   - 由 ReconciliationService 做"内部 Payment vs 通道 BillRow"对比
 *
 * 与 BasePaymentGateway 的关系:
 *   - BasePaymentGateway: 实时下单/查询/退款 (单笔)
 *   - ReconciliationAdapter: T+1 批量账单 (日维度)
 *
 * 适配器实现 (P1-2.2/2.3):
 *   - WeChatReconciliationAdapter: 微信资金账单 GET /v3/bill/fundflowbill
 *   - AlipayReconciliationAdapter: 支付宝账单查询 alipay.data.bill.acceptquery
 */

/**
 * 标准化通道账单行 (P1-2.1)
 * 与内部 Payment 1:1 对比
 */
export interface ChannelBillRow {
  /** 通道订单号 (e.g. 微信 transaction_id, 支付宝 trade_no) */
  channelTxnId: string
  /** 商户订单号 (e.g. out_trade_no) — 对应内部 Payment.id */
  outOrderId: string
  /** 通道类型 */
  channel: PaymentMethod
  /** 交易金额 (分) */
  amountCents: number
  /** 手续费 (分) */
  feeCents: number
  /** 交易类型 */
  txType: 'PAYMENT' | 'REFUND'
  /** 状态 */
  status: 'SUCCESS' | 'REFUND' | 'FAILED' | 'PENDING'
  /** 交易完成时间 (ISO 8601) */
  completedAt: string
  /** 原始 vendor 字段 (审计用) */
  rawPayload?: Record<string, unknown>
}

/**
 * 对账报告差异
 */
export type ReconciliationDiscrepancyKind =
  | 'only-internal'        // 内部有, 通道无 (可能漏单)
  | 'only-channel'         // 通道有, 内部无 (可能数据丢失)
  | 'amount-mismatch'      // 金额不一致
  | 'status-mismatch'      // 状态不一致
  | 'fee-mismatch'         // 手续费不一致

export interface ReconciliationDiscrepancy {
  kind: ReconciliationDiscrepancyKind
  outOrderId: string
  channelTxnId?: string
  channel?: PaymentMethod
  internalAmountCents?: number
  channelAmountCents?: number
  internalStatus?: string
  channelStatus?: string
  note?: string
}

/**
 * 对账报告
 */
export interface ReconciliationReport {
  /** 租户 ID */
  tenantId: string
  /** 通道 */
  channel: PaymentMethod
  /** 对账日期 (YYYY-MM-DD) */
  date: string
  /** 内部 Payment 总数 */
  internalCount: number
  /** 通道账单行数 */
  channelCount: number
  /** 成功匹配 */
  matched: number
  /** 差异列表 */
  discrepancies: ReconciliationDiscrepancy[]
  /** 内部总金额 */
  internalTotalCents: number
  /** 通道总金额 */
  channelTotalCents: number
  /** 差异总金额 (内部 - 通道) */
  diffTotalCents: number
  /** 报告生成时间 */
  generatedAt: string
  /** 报告生成耗时 */
  durationMs: number
}

/**
 * 适配器健康状态
 */
export interface ReconciliationHealth {
  healthy: boolean
  channel: PaymentMethod
  lastSuccessAt?: string
  consecutiveFailures: number
  lastError?: string
}

export interface ReconciliationAdapter {
  /** 通道类型 (e.g. WECHAT, ALIPAY) */
  readonly channel: PaymentMethod

  /**
   * 下载并解析指定日期的通道账单
   * @param tenantId 租户 (用于多租户密钥)
   * @param date YYYY-MM-DD
   */
  downloadBill(tenantId: string, date: string): Promise<ChannelBillRow[]>

  /**
   * 健康检查
   */
  healthCheck(tenantId: string): Promise<ReconciliationHealth>
}

/**
 * Adapter 解析错误
 */
export class ReconciliationAdapterError extends Error {
  readonly channel: PaymentMethod
  readonly tenantId: string
  readonly date: string
  readonly retryable: boolean

  constructor(input: {
    channel: PaymentMethod
    tenantId: string
    date: string
    retryable: boolean
    message: string
    cause?: unknown
  }) {
    super(input.message, input.cause ? { cause: input.cause } : undefined)
    this.name = 'ReconciliationAdapterError'
    this.channel = input.channel
    this.tenantId = input.tenantId
    this.date = input.date
    this.retryable = input.retryable
  }
}
