/**
 * 🐜 自动: [payment-gateway] [D] contract 补全
 *
 * 支付网关：跨模块合约类型
 * 定义 payment-gateway 模块对外暴露的稳定合约接口，
 * 供其他模块（finance, subscription, saas-billing, cashier 等）消费。
 */
import type {
  PaymentTransaction,
  RefundRecord,
  WalletEntry,
} from './payment-gateway.entity'
import type { PaymentProvider, PaymentStatus, PaymentCurrency } from './payment-gateway.service'

/**
 * 支付交易合约（跨模块安全子集）
 */
export interface PaymentTransactionContract {
  id: string
  orderId: string
  provider: PaymentProvider
  status: PaymentStatus
  amount: number
  currency: PaymentCurrency
  paidAt?: string
  createdAt: string
  updatedAt: string
  error?: string
}

/**
 * 退款记录合约（跨模块安全子集）
 */
export interface RefundRecordContract {
  id: string
  originalTransactionId: string
  amount: number
  reason?: string
  status: PaymentStatus
  createdAt: string
  updatedAt: string
}

/**
 * 钱包余额合约（跨模块安全子集）
 */
export interface WalletEntryContract {
  currency: PaymentCurrency
  amount: number
  updatedAt: string
}

/**
 * 支付请求合约（跨模块安全子集）
 */
export interface PaymentRequestContract {
  orderId: string
  amount: number
  currency: PaymentCurrency
  provider: PaymentProvider
  metadata?: Record<string, string>
  locale?: string
  returnUrl?: string
  webhookUrl?: string
}

/**
 * 支付结果合约（跨模块安全子集）
 */
export interface PaymentResultContract {
  transactionId: string
  status: PaymentStatus
  provider: PaymentProvider
  amount: number
  currency: PaymentCurrency
  paidAt?: string
  error?: string
}

/**
 * 退款请求合约（跨模块安全子集）
 */
export interface RefundRequestContract {
  transactionId: string
  amount?: number
  reason?: string
}

/**
 * 支持的支付方式查询结果合约
 */
export interface SupportedProvidersContract {
  countryCode: string
  providers: PaymentProvider[]
}

/**
 * 支付统计合约（跨模块聚合）
 */
export interface PaymentStatsContract {
  totalTransactions: number
  totalAmount: number
  completedCount: number
  failedCount: number
  refundedCount: number
  currency: PaymentCurrency
  periodStart: string
  periodEnd: string
}

// ─── Contract 映射器 ─────────────────────────────────

/** 实体 -> 合约映射 */
export function toPaymentTransactionContract(entity: PaymentTransaction): PaymentTransactionContract {
  return {
    id: entity.id,
    orderId: entity.orderId,
    provider: entity.provider,
    status: entity.status,
    amount: entity.amount,
    currency: entity.currency,
    paidAt: entity.paidAt?.toISOString(),
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
    error: entity.error,
  }
}

/** 实体 -> 合约映射 */
export function toRefundRecordContract(entity: RefundRecord): RefundRecordContract {
  return {
    id: entity.id,
    originalTransactionId: entity.originalTransactionId,
    amount: entity.amount,
    reason: entity.reason,
    status: entity.status,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  }
}

/** 实体 -> 合约映射 */
export function toWalletEntryContract(entity: WalletEntry): WalletEntryContract {
  return {
    currency: entity.currency,
    amount: entity.amount,
    updatedAt: entity.updatedAt.toISOString(),
  }
}

/** 批量映射 */
export function toPaymentTransactionContracts(
  entities: PaymentTransaction[],
): PaymentTransactionContract[] {
  return entities.map(toPaymentTransactionContract)
}

/** 批量映射 */
export function toRefundRecordContracts(entities: RefundRecord[]): RefundRecordContract[] {
  return entities.map(toRefundRecordContract)
}
