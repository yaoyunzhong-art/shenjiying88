/**
 * persistence.types.ts — 收银流水持久化类型定义
 *
 * Phase-35: 收银流水持久化
 * Day6 创新任务
 */

export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'

export interface TransactionRecord {
  transactionId: string
  orderId: string
  tenantId: string
  storeId: string
  memberId: string
  channel: string
  amount: number
  currency: string
  status: TransactionStatus
  operatorId?: string
  transactionNo?: string
  createdAt: string
  synced: boolean
  syncRetryCount: number
}

export interface DailySummary {
  date: string
  tenantId: string
  storeId: string
  totalTransactionCount: number
  totalAmount: number
  byChannel: Record<string, { count: number; amount: number }>
  byOperator: Record<string, { count: number; amount: number }>
}

export interface MonthlySummary {
  yearMonth: string
  tenantId: string
  storeId: string
  totalTransactionCount: number
  totalAmount: number
  byChannel: Record<string, { count: number; amount: number }>
}

export interface TransactionQueryFilter {
  tenantId: string
  storeId?: string
  channel?: string
  startDate?: string
  endDate?: string
  operatorId?: string
  status?: TransactionStatus
}

export interface SyncResult {
  success: string[]
  failed: string[]
  conflict: string[]
}

export interface SyncConflict {
  transactionId: string
  localVersion: TransactionRecord
  remoteVersion: TransactionRecord
  field: string
  localValue: unknown
  remoteValue: unknown
}
