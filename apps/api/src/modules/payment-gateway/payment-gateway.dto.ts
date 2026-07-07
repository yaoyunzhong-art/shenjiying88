/**
 * PaymentGatewayDto - 支付网关请求/响应 DTO
 *
 * T117-3: 本地化支付
 */

import type { PaymentProvider, PaymentStatus, PaymentCurrency } from './payment-gateway.service'

/**
 * 发起支付请求 DTO
 */
export class PayRequestDto {
  orderId!: string
  amount!: number
  currency!: PaymentCurrency
  provider!: PaymentProvider
  metadata?: Record<string, string>
  locale?: string
  returnUrl?: string
  webhookUrl?: string
}

/**
 * 支付结果响应 DTO
 */
export class PayResultDto {
  transactionId!: string
  status!: PaymentStatus
  provider!: PaymentProvider
  amount!: number
  currency!: PaymentCurrency
  providerResponse?: Record<string, unknown>
  paidAt?: Date
  error?: string
}

/**
 * 退款请求 DTO
 */
export class RefundRequestDto {
  transactionId!: string
  amount?: number
  reason?: string
}

/**
 * 查询支付请求 DTO
 */
export class QueryPaymentDto {
  transactionId!: string
}

/**
 * 查询退款请求 DTO
 */
export class QueryRefundDto {
  refundId!: string
}
