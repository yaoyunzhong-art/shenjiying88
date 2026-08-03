/**
 * persistence.service.ts — 收银流水持久化服务
 *
 * Phase-35 P0: 收银流水持久化
 * Day6 创新任务: 基于 persistence.service.spec.ts 实现
 *
 * 功能:
 *  - 流水 CRUD (创建/查询/状态流转)
 *  - 日结/月结统计
 *  - 离线缓存 → 批量同步
 *  - 幂等保护
 */

import { Injectable, Logger } from '@nestjs/common'
import type {
  TransactionRecord,
  TransactionStatus,
  DailySummary,
  MonthlySummary,
  SyncResult,
  TransactionQueryFilter,
} from './persistence.types'

@Injectable()
export class CashierTransactionPersistenceService {
  private readonly logger = new Logger(CashierTransactionPersistenceService.name)

  // ── 内存存储 (后续可接 Prisma) ──────────────────────────
  private readonly transactions = new Map<string, TransactionRecord>()
  private readonly dailyCache = new Map<string, DailySummary>()
  private readonly offlineCache = new Map<string, TransactionRecord>()
  private txnSequence = 0

  private static readonly MAX_OFFLINE_BATCH = 50

  // ── ID 生成 ─────────────────────────────────────────────

  private generateId(): string {
    this.txnSequence++
    const ts = Date.now().toString(36)
    return `txn-${ts}-${this.txnSequence.toString(36).padStart(4, '0')}`
  }

  // ── 流水 CRUD ──────────────────────────────────────────

  /**
   * 创建流水记录
   * 幂等: 同 orderId + channel 下不允许重复 PENDING 流水
   */
  create(input: Omit<TransactionRecord, 'transactionId' | 'createdAt' | 'synced' | 'syncRetryCount'>): TransactionRecord {
    if (!input.orderId) throw new Error('orderId is required')
    if (input.amount == null || input.amount < 0) throw new Error('amount must be >= 0')

    // 幂等检查
    for (const txn of this.transactions.values()) {
      if (
        txn.orderId === input.orderId &&
        txn.channel === input.channel &&
        txn.status === 'PENDING'
      ) {
        throw new Error(
          `Duplicate pending transaction for order ${input.orderId} on channel ${input.channel}`
        )
      }
    }

    const record: TransactionRecord = {
      transactionId: this.generateId(),
      orderId: input.orderId,
      tenantId: input.tenantId,
      storeId: input.storeId,
      memberId: input.memberId,
      channel: input.channel,
      amount: input.amount,
      currency: input.currency ?? 'CNY',
      status: input.status ?? 'PENDING',
      operatorId: input.operatorId,
      transactionNo: input.transactionNo,
      createdAt: new Date().toISOString(),
      synced: false,
      syncRetryCount: 0,
    }

    this.transactions.set(record.transactionId, record)
    this.logger.debug(`Transaction created: ${record.transactionId}`)
    return record
  }

  /** 查询单条流水 */
  getById(transactionId: string): TransactionRecord | undefined {
    return this.transactions.get(transactionId)
  }

  /** 按条件查询流水列表 */
  query(filters: TransactionQueryFilter): TransactionRecord[] {
    let results = Array.from(this.transactions.values()).filter(
      (t) => t.tenantId === filters.tenantId
    )

    if (filters.storeId) results = results.filter((t) => t.storeId === filters.storeId)
    if (filters.channel) results = results.filter((t) => t.channel === filters.channel)
    if (filters.operatorId) results = results.filter((t) => t.operatorId === filters.operatorId)
    if (filters.startDate) results = results.filter((t) => t.createdAt >= filters.startDate!)
    if (filters.endDate) results = results.filter((t) => t.createdAt <= filters.endDate!)
    if (filters.status) results = results.filter((t) => t.status === filters.status)

    return results.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  /** 状态流转 */
  updateStatus(
    transactionId: string,
    status: TransactionStatus,
    transactionNo?: string
  ): TransactionRecord {
    const txn = this.transactions.get(transactionId)
    if (!txn) throw new Error(`Transaction ${transactionId} not found`)

    const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
      PENDING: ['SUCCESS', 'FAILED'],
      SUCCESS: ['REFUNDED'],
      FAILED: [],
      REFUNDED: [],
    }

    if (!validTransitions[txn.status].includes(status)) {
      throw new Error(
        `Invalid status transition from ${txn.status} to ${status} for transaction ${transactionId}`
      )
    }

    const updated: TransactionRecord = {
      ...txn,
      status,
      transactionNo: transactionNo ?? txn.transactionNo,
    }

    this.transactions.set(transactionId, updated)
    this.logger.debug(`Transaction ${transactionId}: ${txn.status} → ${status}`)
    return updated
  }

  // ── 日结 / 月结 ────────────────────────────────────────

  /**
   * 计算日结汇总
   * 统计当日所有 SUCCESS/REFUNDED 流水
   */
  computeDailySummary(tenantId: string, storeId: string, date: string): DailySummary {
    const start = `${date}T00:00:00.000Z`
    const end = `${date}T23:59:59.999Z`

    const txns = this.query({
      tenantId,
      storeId,
      startDate: start,
      endDate: end,
    }).filter((t) => t.status === 'SUCCESS' || t.status === 'REFUNDED')

    let totalAmount = 0
    const byChannel: Record<string, { count: number; amount: number }> = {}
    const byOperator: Record<string, { count: number; amount: number }> = {}

    for (const txn of txns) {
      totalAmount += txn.amount

      if (!byChannel[txn.channel]) byChannel[txn.channel] = { count: 0, amount: 0 }
      byChannel[txn.channel].count++
      byChannel[txn.channel].amount += txn.amount

      const op = txn.operatorId ?? 'unknown'
      if (!byOperator[op]) byOperator[op] = { count: 0, amount: 0 }
      byOperator[op].count++
      byOperator[op].amount += txn.amount
    }

    const summary: DailySummary = {
      date,
      tenantId,
      storeId,
      totalTransactionCount: txns.length,
      totalAmount,
      byChannel,
      byOperator,
    }

    const cacheKey = `${tenantId}:${storeId}:${date}`
    this.dailyCache.set(cacheKey, summary)
    this.logger.debug(`Daily summary computed: ${cacheKey} (${txns.length} txns)`)
    return summary
  }

  /** 获取缓存的日结 */
  getDailySummary(tenantId: string, storeId: string, date: string): DailySummary | undefined {
    return this.dailyCache.get(`${tenantId}:${storeId}:${date}`)
  }

  /**
   * 计算月结汇总
   * 统计当月所有 SUCCESS 流水
   */
  computeMonthlySummary(tenantId: string, storeId: string, yearMonth: string): MonthlySummary {
    const [year, month] = yearMonth.split('-').map(Number)
    const startDate = new Date(Date.UTC(year, month - 1, 1))
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

    const txns = this.query({
      tenantId,
      storeId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }).filter((t) => t.status === 'SUCCESS')

    let totalAmount = 0
    const byChannel: Record<string, { count: number; amount: number }> = {}

    for (const txn of txns) {
      totalAmount += txn.amount
      if (!byChannel[txn.channel]) byChannel[txn.channel] = { count: 0, amount: 0 }
      byChannel[txn.channel].count++
      byChannel[txn.channel].amount += txn.amount
    }

    this.logger.debug(`Monthly summary computed: ${yearMonth} (${txns.length} txns)`)
    return {
      yearMonth,
      tenantId,
      storeId,
      totalTransactionCount: txns.length,
      totalAmount,
      byChannel,
    }
  }

  // ── 离线缓存 & 批量同步 ──────────────────────────────

  /** 离线流水入队 */
  enqueueOffline(record: TransactionRecord): {
    enqueued: boolean
    cacheSize: number
    triggerSync: boolean
  } {
    if (this.offlineCache.has(record.transactionId)) {
      return { enqueued: false, cacheSize: this.offlineCache.size, triggerSync: false }
    }

    this.offlineCache.set(record.transactionId, record)
    const cacheSize = this.offlineCache.size
    const triggerSync = cacheSize >= CashierTransactionPersistenceService.MAX_OFFLINE_BATCH

    if (triggerSync) {
      this.logger.warn(`Offline cache threshold reached: ${cacheSize} records`)
    }

    return { enqueued: true, cacheSize, triggerSync }
  }

  /** 批量同步离线流水 */
  flushOffline(syncFn: (records: TransactionRecord[]) => SyncResult): SyncResult {
    const records = Array.from(this.offlineCache.values())
    const result = syncFn(records)

    for (const id of result.success) {
      this.offlineCache.delete(id)
      const txn = this.transactions.get(id)
      if (txn) {
        txn.synced = true
        txn.syncRetryCount = 0
        this.transactions.set(id, txn)
      }
    }

    for (const id of result.failed) {
      const txn = this.transactions.get(id)
      if (txn) {
        txn.syncRetryCount++
        this.transactions.set(id, txn)
      }
    }

    this.logger.debug(
      `Offline sync: ${result.success.length} ok, ${result.failed.length} failed, ${result.conflict.length} conflicts`
    )
    return result
  }

  getOfflineCacheSize(): number {
    return this.offlineCache.size
  }

  // ── 运维方法 ───────────────────────────────────────────

  /** 清空所有数据 (仅测试/运维使用) */
  reset(): void {
    this.transactions.clear()
    this.dailyCache.clear()
    this.offlineCache.clear()
    this.txnSequence = 0
    this.logger.warn('Transaction store reset')
  }

  /** 获取存储统计 */
  stats(): {
    totalTransactions: number
    dailyCacheSize: number
    offlineCacheSize: number
  } {
    return {
      totalTransactions: this.transactions.size,
      dailyCacheSize: this.dailyCache.size,
      offlineCacheSize: this.offlineCache.size,
    }
  }
}
