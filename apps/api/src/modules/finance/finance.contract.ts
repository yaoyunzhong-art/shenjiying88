/**
 * finance.contract.ts — API-safe contract mappers for Finance module
 *
 * Transforms internal finance entities into serialisation-safe contract
 * shapes that can be consumed by clients (front-end, SDK, cross-module).
 */

import type {
  Account,
  DailyRevenue,
  Invoice,
  Ledger,
  RevenueSummary,
  Settlement,
} from './finance.entity'

// ── Contract Types (self-contained, no @m5/types dependency needed) ──

export interface LedgerContract {
  id: string
  tenantId: string
  brandId?: string
  storeId?: string
  type: string
  amount: number
  balance: number
  orderId?: string
  transactionId?: string
  description: string
  category?: string
  recordedAt: string
  createdAt: string
}

export interface AccountContract {
  id: string
  tenantId: string
  storeId?: string
  name: string
  type: string
  balance: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface SettlementContract {
  id: string
  tenantId: string
  storeId?: string
  startDate: string
  endDate: string
  totalRevenue: number
  totalExpense: number
  netProfit: number
  settlementStatus: string
  settledAt?: string
  createdAt: string
}

export interface InvoiceContract {
  id: string
  tenantId: string
  storeId?: string
  orderId?: string
  invoiceNo: string
  amount: number
  taxAmount: number
  totalAmount: number
  type: string
  status: string
  issuedAt?: string
  buyerInfo?: Record<string, unknown>
  createdAt: string
}

export interface RevenueSummaryContract {
  storeId?: string
  totalRevenue: number
  totalExpense: number
  totalRefund: number
  netRevenue: number
  transactionCount: number
  periodStart: string
  periodEnd: string
}

export interface DailyRevenueContract {
  date: string
  storeId?: string
  revenue: number
  expense: number
  refund: number
  netRevenue: number
  transactionCount: number
}

// ── Mappers ──

export function toLedgerContract(ledger: Ledger): LedgerContract {
  return {
    id: ledger.id,
    tenantId: ledger.tenantId,
    brandId: ledger.brandId,
    storeId: ledger.storeId,
    type: ledger.type,
    amount: ledger.amount,
    balance: ledger.balance,
    orderId: ledger.orderId,
    transactionId: ledger.transactionId,
    description: ledger.description,
    category: ledger.category,
    recordedAt: ledger.recordedAt,
    createdAt: ledger.createdAt,
  }
}

export function toAccountContract(account: Account): AccountContract {
  return {
    id: account.id,
    tenantId: account.tenantId,
    storeId: account.storeId,
    name: account.name,
    type: account.type,
    balance: account.balance,
    status: account.status,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  }
}

export function toSettlementContract(settlement: Settlement): SettlementContract {
  return {
    id: settlement.id,
    tenantId: settlement.tenantId,
    storeId: settlement.storeId,
    startDate: settlement.startDate,
    endDate: settlement.endDate,
    totalRevenue: settlement.totalRevenue,
    totalExpense: settlement.totalExpense,
    netProfit: settlement.netProfit,
    settlementStatus: settlement.settlementStatus,
    settledAt: settlement.settledAt,
    createdAt: settlement.createdAt,
  }
}

export function toInvoiceContract(invoice: Invoice): InvoiceContract {
  return {
    id: invoice.id,
    tenantId: invoice.tenantId,
    storeId: invoice.storeId,
    orderId: invoice.orderId,
    invoiceNo: invoice.invoiceNo,
    amount: invoice.amount,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    type: invoice.type,
    status: invoice.status,
    issuedAt: invoice.issuedAt,
    buyerInfo: invoice.buyerInfo,
    createdAt: invoice.createdAt,
  }
}

export function toRevenueSummaryContract(summary: RevenueSummary): RevenueSummaryContract {
  return {
    storeId: summary.storeId,
    totalRevenue: summary.totalRevenue,
    totalExpense: summary.totalExpense,
    totalRefund: summary.totalRefund,
    netRevenue: summary.netRevenue,
    transactionCount: summary.transactionCount,
    periodStart: summary.periodStart,
    periodEnd: summary.periodEnd,
  }
}

export function toDailyRevenueContract(daily: DailyRevenue): DailyRevenueContract {
  return {
    date: daily.date,
    storeId: daily.storeId,
    revenue: daily.revenue,
    expense: daily.expense,
    refund: daily.refund,
    netRevenue: daily.netRevenue,
    transactionCount: daily.transactionCount,
  }
}
