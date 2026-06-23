export enum LedgerType {
  Revenue = 'REVENUE',
  Expense = 'EXPENSE',
  Refund = 'REFUND',
  Adjustment = 'ADJUSTMENT'
}

export enum AccountType {
  Cash = 'CASH',
  Wechat = 'WECHAT',
  Alipay = 'ALIPAY',
  Bank = 'BANK',
  Other = 'OTHER'
}

export enum AccountStatus {
  Active = 'ACTIVE',
  Frozen = 'FROZEN',
  Closed = 'CLOSED'
}

export enum SettlementStatus {
  Pending = 'PENDING',
  Confirmed = 'CONFIRMED',
  Disputed = 'DISPUTED'
}

export enum InvoiceType {
  Regular = 'REGULAR',
  Vat = 'VAT'
}

export enum InvoiceStatus {
  Draft = 'DRAFT',
  Issued = 'ISSUED',
  Cancelled = 'CANCELLED'
}

export interface Ledger {
  id: string
  tenantId: string
  brandId?: string
  storeId?: string
  type: LedgerType
  amount: number
  balance: number
  orderId?: string
  transactionId?: string
  description: string
  category?: string
  recordedAt: string
  createdAt: string
}

export interface Account {
  id: string
  tenantId: string
  storeId?: string
  name: string
  type: AccountType
  balance: number
  status: AccountStatus
  createdAt: string
  updatedAt: string
}

export interface Settlement {
  id: string
  tenantId: string
  storeId?: string
  startDate: string
  endDate: string
  totalRevenue: number
  totalExpense: number
  netProfit: number
  settlementStatus: SettlementStatus
  settledAt?: string
  createdAt: string
}

export interface Invoice {
  id: string
  tenantId: string
  storeId?: string
  orderId?: string
  invoiceNo: string
  amount: number
  taxAmount: number
  totalAmount: number
  type: InvoiceType
  status: InvoiceStatus
  issuedAt?: string
  buyerInfo?: Record<string, unknown>
  createdAt: string
}

export interface RevenueSummary {
  storeId?: string
  totalRevenue: number
  totalExpense: number
  totalRefund: number
  netRevenue: number
  transactionCount: number
  periodStart: string
  periodEnd: string
}

export interface DailyRevenue {
  date: string
  storeId?: string
  revenue: number
  expense: number
  refund: number
  netRevenue: number
  transactionCount: number
}
