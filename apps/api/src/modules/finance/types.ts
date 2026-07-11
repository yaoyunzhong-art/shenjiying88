/**
 * types.ts — P-38 财务对账模块核心类型
 *
 * 扩展 finance.entity.ts 的基础类型，添加对账、报表等额外类型
 */

import type {
  Ledger,
  Account,
  Settlement,
  Invoice,
  RevenueSummary,
  DailyRevenue,
  LedgerType,
  AccountType,
  AccountStatus,
  SettlementStatus,
  InvoiceType,
  InvoiceStatus
} from './finance.entity'

// ─── 对账 Reconciliation ───────────────────────────────────

export type ReconciliationStatus =
  | 'PENDING'
  | 'MATCHED'
  | 'MISMATCHED'
  | 'UNMATCHED_INTERNAL'
  | 'UNMATCHED_EXTERNAL'

export interface ReconciliationTransaction {
  id: string
  tenantId: string
  storeId?: string
  internalTransactionId?: string
  externalTransactionId?: string
  channel: 'WECHAT' | 'ALIPAY' | 'BANK' | 'CASH' | 'CARD'
  channelTransactionNo?: string
  type: 'PAYMENT' | 'REFUND' | 'SETTLEMENT'
  internalAmount: number
  externalAmount?: number
  difference: number
  internalTime: string
  externalTime?: string
  channelFee: number
  netAmount: number
  status: ReconciliationStatus
  memo?: string
  reconciledAt?: string
  reconciledBy?: string
  createdAt: string
  updatedAt: string
}

export interface ReconciliationBatch {
  id: string
  tenantId: string
  batchNo: string
  channel: 'WECHAT' | 'ALIPAY' | 'BANK' | 'CASH' | 'CARD'
  date: string
  totalTransactions: number
  matchedCount: number
  mismatchedCount: number
  unmatchedInternalCount: number
  unmatchedExternalCount: number
  totalDifference: number
  totalFee: number
  status: ReconciliationStatus
  processedAt?: string
  completedAt?: string
  createdBy?: string
  createdAt: string
}

export interface ReconciliationSummary {
  batchId: string
  batchNo: string
  channel: string
  date: string
  totalCount: number
  matchedCount: number
  matchedRate: number
  mismatchedCount: number
  unmatchedInternalCount: number
  unmatchedExternalCount: number
  totalInternalAmount: number
  totalExternalAmount: number
  totalDifference: number
  totalFee: number
  status: string
}

// ─── 财务报表 FinancialReport ────────────────────────────

export type ReportType =
  | 'PROFIT_LOSS'
  | 'BALANCE_SHEET'
  | 'CASH_FLOW'
  | 'REVENUE_ANALYSIS'
  | 'EXPENSE_ANALYSIS'
  | 'RECONCILIATION'

export type ReportStatus =
  | 'GENERATING'
  | 'COMPLETED'
  | 'FAILED'

export type ExportFormat =
  | 'JSON'
  | 'CSV'
  | 'EXCEL'
  | 'PDF'

export interface FinancialReport {
  id: string
  tenantId: string
  storeId?: string
  title: string
  reportType: ReportType
  periodStart: string
  periodEnd: string
  status: ReportStatus
  data?: Record<string, unknown>
  summary?: ReportSummary
  generatedAt?: string
  generatedBy?: string
  exportFormats: ExportFormat[]
  errorMessage?: string
  createdAt: string
}

export interface ReportSummary {
  totalRevenue: number
  totalExpense: number
  totalRefund: number
  netProfit: number
  transactionCount: number
  reconciliationDifference?: number
}

// ─── 交易对账详情 ────────────────────────────────────────

export interface MatchingResult {
  transactionId: string
  internalRecord: ReconciliationTransaction
  externalRecord?: Partial<ReconciliationTransaction>
  status: ReconciliationStatus
  difference: number
  issues?: string[]
}

export interface BatchProgress {
  batchId: string
  batchNo: string
  channel: string
  date: string
  total: number
  processed: number
  progress: number
  status: string
  startedAt: string
  estimatedEndAt?: string
}

// ─── 导出接口类型 ─────────────────────────────────────────

export interface ExportRequest {
  reportId: string
  format: ExportFormat
  columns?: string[]
  filters?: Record<string, unknown>
}

export interface ExportResult {
  id: string
  reportId: string
  format: ExportFormat
  url?: string
  content?: string
  generatedAt: string
  expiresAt: string
}

// ─── 重新导出基础类型 ─────────────────────────────────────

export type {
  Ledger,
  Account,
  Settlement,
  Invoice,
  RevenueSummary,
  DailyRevenue,
  LedgerType,
  AccountType,
  AccountStatus,
  SettlementStatus,
  InvoiceType,
  InvoiceStatus
}

export {
  LedgerType as FinanceLedgerType,
  AccountType as FinanceAccountType,
  AccountStatus as FinanceAccountStatus,
  SettlementStatus as FinanceSettlementStatus,
  InvoiceType as FinanceInvoiceType,
  InvoiceStatus as FinanceInvoiceStatus
}
