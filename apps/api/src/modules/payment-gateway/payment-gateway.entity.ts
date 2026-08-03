/**
 * PaymentGatewayEntity - 支付网关实体定义
 *
 * T117-3: 本地化支付 - 支付记录、退款记录实体
 */

import type { PaymentProvider, PaymentStatus, PaymentCurrency } from './payment-gateway.service'

/**
 * 支付交易记录
 */
export interface PaymentTransaction {
  id: string
  orderId: string
  /** 租户 ID（RLS 多租户隔离字段） */
  tenantId?: string
  provider: PaymentProvider
  status: PaymentStatus
  amount: number
  currency: PaymentCurrency
  providerResponse?: Record<string, unknown>
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
  error?: string
}

/**
 * 退款记录
 */
export interface RefundRecord {
  id: string
  originalTransactionId: string
  /** 租户 ID（RLS 多租户隔离字段） */
  tenantId?: string
  amount: number
  reason?: string
  status: PaymentStatus
  createdAt: Date
  updatedAt: Date
}

/**
 * 本地钱包余额
 */
export interface WalletEntry {
  currency: PaymentCurrency
  amount: number
  updatedAt: Date
}
