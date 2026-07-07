/**
 * Phase-38 T168: Payment + Refund + Idempotency 实体定义
 *
 * 反模式库 v4 命中:
 *  - idempotency-key-pattern: 幂等键防重复扣款
 *  - optimistic-lock-pattern: version 字段 (DR-36 决策 3)
 *  - state-machine-pattern: PaymentStatus/RefundStatus 状态机
 *  - cross-tenant-data-leak: 强制 tenantId
 *
 * 设计:
 *  - Payment: 订单→支付单 (一个订单可多次尝试, idempotencyKey 去重)
 *  - Refund: 退款单 (status 状态机 REQUESTED → APPROVED → COMPLETED/REJECTED)
 *  - 状态机: Payment PENDING→SUCCESS/FAILED/REFUNDED (单向不回退)
 *  - 联动: Payment.SUCCESS → Ledger.REVENUE; Refund.COMPLETED → Ledger.REFUND
 */

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
export type PaymentMethod = 'WECHAT' | 'ALIPAY' | 'CARD' | 'CASH' | 'BALANCE'
export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED'

export interface Payment {
  id: string
  tenantId: string
  orderId: string
  amountCents: number          // 金额(分), 避免浮点
  currency: string              // CNY/USD
  method: PaymentMethod
  status: PaymentStatus
  /** 幂等键: 同 (tenantId, idempotencyKey) 已存在 → 复用 */
  idempotencyKey: string
  /** 第三方交易号 (支付网关回调填入) */
  transactionId?: string
  /** 失败原因 */
  failureReason?: string
  /** 反模式 v4 optimistic-lock: DR-36 决策 3 */
  version: number
  /** 反模式 v4 audit: 创建/修改审计 */
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  successAt?: string
  failedAt?: string
  refundedAt?: string
}

export interface Refund {
  id: string
  tenantId: string
  paymentId: string
  orderId: string
  amountCents: number
  reason: string
  status: RefundStatus
  version: number
  requestedBy: string
  approvedBy?: string
  rejectedBy?: string
  rejectionReason?: string
  /** 退款完成时填入的第三方退款单号 */
  refundTransactionId?: string
  createdAt: string
  updatedAt: string
  requestedAt: string
  approvedAt?: string
  completedAt?: string
  rejectedAt?: string
}

/**
 * 支付状态变更审计 (反模式 v4 audit)
 */
export interface PaymentAuditEntry {
  id: string
  paymentId: string
  tenantId: string
  action: 'CREATE' | 'MARK_SUCCESS' | 'MARK_FAILED' | 'MARK_REFUNDED' | 'UPDATE' | 'IDEMPOTENT_REUSE' | 'TIMEOUT'
  fromStatus?: PaymentStatus
  toStatus?: PaymentStatus
  actor: string
  detail?: string
  at: string
}

/**
 * 退款状态变更审计
 */
export interface RefundAuditEntry {
  id: string
  refundId: string
  paymentId: string
  tenantId: string
  action: 'REQUEST' | 'APPROVE' | 'REJECT' | 'COMPLETE' | 'UPDATE'
  fromStatus?: RefundStatus
  toStatus?: RefundStatus
  actor: string
  detail?: string
  at: string
}

/**
 * Payment 输入
 */
export interface CreatePaymentInput {
  tenantId: string
  orderId: string
  amountCents: number
  currency?: string
  method: PaymentMethod
  /** 幂等键: 必填, 客户端生成 UUID */
  idempotencyKey: string
  metadata?: Record<string, any>
}

export interface UpdatePaymentInput {
  transactionId?: string
  failureReason?: string
  metadata?: Record<string, any>
}

export interface CreateRefundInput {
  tenantId: string
  paymentId: string
  orderId: string
  amountCents: number
  reason: string
  requestedBy: string
}
