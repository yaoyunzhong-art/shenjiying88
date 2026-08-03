/**
 * finance.contract.ts — API-safe contract mappers for Finance module
 *
 * Transforms internal finance entities into serialisation-safe contract
 * shapes that can be consumed by clients (front-end, SDK, cross-module).
 * Finance ledger/account/settlement/summary contracts should align to SDK truth source.
 */

import type {
  BusinessFinanceAccountRecord,
  BusinessFinanceInvoiceRecord,
  BusinessFinanceLedgerRecord,
  BusinessFinanceSettlementRecord,
  BusinessDailyRevenueSummary,
  BusinessRevenueSummary,
} from '@m5/sdk'
import type {
  Account,
  DailyRevenue,
  Invoice,
  Ledger,
  RevenueSummary,
  Settlement,
} from './finance.entity'

// ── Contract Types ──

export type LedgerContract = BusinessFinanceLedgerRecord

export type AccountContract = BusinessFinanceAccountRecord

export type SettlementContract = BusinessFinanceSettlementRecord

export type InvoiceContract = BusinessFinanceInvoiceRecord

export type RevenueSummaryContract = BusinessRevenueSummary

export type DailyRevenueContract = BusinessDailyRevenueSummary

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
