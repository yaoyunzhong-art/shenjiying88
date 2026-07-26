import {
  defaultPayments,
  defaultRefunds,
  loadFinanceSnapshot,
  type Payment,
  type PaymentMethod,
  type PaymentStatus,
  type Refund as FinanceRefund,
  type RefundStatus,
} from '../finance-data'

export type { PaymentMethod, PaymentStatus, RefundStatus }

export interface PaymentDetail extends Payment {
  updatedAt: string
  payerName?: string
  payerPhone?: string
  remark?: string
}

export interface RefundRecord extends FinanceRefund {}

export interface FinanceDetailSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  tenantId: string
  payment: PaymentDetail
  refunds: RefundRecord[]
  generatedAt: string
  sourceLabel: string
  error?: string
}

const FALLBACK_PAYMENT_OVERRIDES: Record<string, Partial<PaymentDetail>> = {
  'pay-demo-1': {
    updatedAt: '2026-07-25T12:20:00.000Z',
    payerName: '张三',
    payerPhone: '138****8888',
    remark: '会员续费充值，已完成财务复核。',
  },
  'pay-demo-2': {
    updatedAt: '2026-07-25T10:45:00.000Z',
    payerName: '李四',
    payerPhone: '139****6666',
    remark: '待渠道回调，已触发人工催单。',
  },
  'pay-demo-3': {
    updatedAt: '2026-07-25T11:32:00.000Z',
    payerName: '王五',
    payerPhone: '137****7777',
    remark: '支付网关超时，已转人工复核。',
  },
  'pay-demo-4': {
    updatedAt: '2026-07-25T13:30:00.000Z',
    payerName: '赵六',
    payerPhone: '136****9999',
    remark: '余额退款已入账，等待用户确认。',
  },
}

function deriveRemark(payment: Payment): string {
  if (payment.status === 'FAILED') {
    return payment.failureReason ?? '支付失败，等待人工复核。'
  }
  if (payment.status === 'REFUNDED') {
    return '退款链路已完成闭环，等待用户侧确认。'
  }
  if (payment.status === 'PENDING') {
    return '支付处理中，等待渠道回调。'
  }
  return '支付成功，财务记录已归档。'
}

function buildPaymentDetail(payment: Payment, generatedAt: string): PaymentDetail {
  const overrides = FALLBACK_PAYMENT_OVERRIDES[payment.id] ?? {}

  return {
    ...payment,
    updatedAt: overrides.updatedAt ?? generatedAt,
    payerName: overrides.payerName ?? '匿名用户',
    payerPhone: overrides.payerPhone ?? '未留存',
    remark: overrides.remark ?? deriveRemark(payment),
  }
}

function buildFallbackPayment(paymentId: string, generatedAt: string): PaymentDetail {
  const matched = defaultPayments.find((item) => item.id === paymentId) ?? defaultPayments[0]!
  const detail = buildPaymentDetail(matched, generatedAt)

  if (matched.id === paymentId) {
    return detail
  }

  return {
    ...detail,
    id: paymentId,
    orderId: `ord-${paymentId}`,
    idempotencyKey: `idem-${paymentId}`,
    transactionId: detail.transactionId ?? `tx-${paymentId}`,
    remark: `支付单 ${paymentId} 未命中实时记录，当前展示 fallback 样本映射。`,
  }
}

function buildFallbackRefunds(paymentId: string): RefundRecord[] {
  const refunds = defaultRefunds.filter((item) => item.paymentId === paymentId)
  if (refunds.length > 0) {
    return refunds
  }

  const template = defaultRefunds[0]
  if (!template) {
    return []
  }

  return [
    {
      ...template,
      id: `ref-${paymentId}`,
      paymentId,
      orderId: `ord-${paymentId}`,
      reason: 'fallback 样本映射',
    },
  ]
}

export async function loadFinanceDetailSnapshot(
  paymentId: string,
  tenantId = 'demo-tenant'
): Promise<FinanceDetailSnapshotDelivery> {
  const normalizedId = paymentId.trim() || 'pay-demo-1'

  try {
    const snapshot = await loadFinanceSnapshot(tenantId)
    const payment = snapshot.payments.find((item) => item.id === normalizedId)

    if (!payment) {
      throw new Error(`payment ${normalizedId} not found`)
    }

    return {
      deliveryMode: snapshot.deliveryMode,
      tenantId: snapshot.tenantId,
      payment: buildPaymentDetail(payment, snapshot.generatedAt),
      refunds: snapshot.refunds.filter((item) => item.paymentId === normalizedId),
      generatedAt: snapshot.generatedAt,
      sourceLabel:
        snapshot.deliveryMode === 'api'
          ? 'finance.payments + finance.refunds snapshot'
          : 'defaultPayments/defaultRefunds fallback',
      error: snapshot.error,
    }
  } catch {
    const generatedAt = new Date().toISOString()

    return {
      deliveryMode: 'fallback',
      tenantId,
      payment: buildFallbackPayment(normalizedId, generatedAt),
      refunds: buildFallbackRefunds(normalizedId),
      generatedAt,
      sourceLabel: 'defaultPayments/defaultRefunds fallback',
      error: '支付详情实时接口不可达或未命中记录，已切换到 fallback 样本数据。',
    }
  }
}
