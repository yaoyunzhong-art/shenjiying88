/**
 * finance-reconciliation.service.ts — P-38 财务对账核心服务
 *
 * 功能:
 *   - 对账批次管理 (创建、查询、完成)
 *   - 交易对账匹配 (自动匹配 + 手动匹配)
 *   - 差异处理 (调账)
 *   - 对账统计
 *   - SSE 进度推送
 */

import { randomUUID } from 'node:crypto'
import { Injectable, Optional, Logger, Inject } from '@nestjs/common'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { FinanceEventEmitter } from './finance.sse'
import {
  type ReconciliationTransaction,
  type ReconciliationBatch,
  type ReconciliationSummary,
  type BatchProgress,
  type MatchingResult
} from './types'
import {
  CreateReconciliationBatchDto,
  ReconciliationBatchQueryDto,
  CreateReconciliationTransactionDto,
  UpdateReconciliationTransactionDto,
  ReconciliationTransactionQueryDto,
  ManualMatchDto,
  ManualAdjustmentDto,
  ReconciliationStatsQueryDto,
  ReconciliationStatus,
  ReconciliationChannel
} from './dto/create-reconciliation.dto'

// ─── In-Memory Stores ───────────────────────────────────

const reconciliationBatchStore = new Map<string, ReconciliationBatch>()
const reconciliationTransactionStore = new Map<string, ReconciliationTransaction>()

export function resetFinanceReconciliationTestState(): void {
  reconciliationBatchStore.clear()
  reconciliationTransactionStore.clear()
}

@Injectable()
export class FinanceReconciliationService {
  private readonly logger = new Logger(FinanceReconciliationService.name)

  constructor(
    @Optional()
    @Inject(FinanceEventEmitter)
    private readonly eventEmitter?: FinanceEventEmitter
  ) {}

  // ═══════════════════════════════════════════════════════
  // 对账批次
  // ═══════════════════════════════════════════════════════

  /**
   * 创建对账批次
   */
  createReconciliationBatch(
    tenantContext: RequestTenantContext,
    input: CreateReconciliationBatchDto
  ): ReconciliationBatch {
    const now = new Date().toISOString()
    const batchNo = `RC-${input.channel}-${input.date.replace(/-/g, '')}-${Date.now().toString(36).toUpperCase()}`

    const batch: ReconciliationBatch = {
      id: `rc-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      batchNo,
      channel: input.channel,
      date: input.date,
      totalTransactions: 0,
      matchedCount: 0,
      mismatchedCount: 0,
      unmatchedInternalCount: 0,
      unmatchedExternalCount: 0,
      totalDifference: 0,
      totalFee: 0,
      status: ReconciliationStatus.PENDING as unknown as ReconciliationStatus,
      processedAt: now,
      createdAt: now
    }

    reconciliationBatchStore.set(batch.id, batch)

    this.emitEvent({
      type: 'reconciliation.started',
      tenantId: tenantContext.tenantId,
      batchId: batch.id,
      batchNo: batch.batchNo,
      channel: batch.channel as string,
      totalTransactions: 0,
      timestamp: now
    })

    return batch
  }

  /**
   * 获取单个对账批次
   */
  getReconciliationBatch(
    batchId: string,
    tenantContext: RequestTenantContext
  ): ReconciliationBatch {
    const batch = reconciliationBatchStore.get(batchId)
    if (!batch || batch.tenantId !== tenantContext.tenantId) {
      throw new Error(`Reconciliation batch ${batchId} not found`)
    }
    return batch
  }

  /**
   * 查询对账批次列表
   */
  listReconciliationBatches(
    tenantContext: RequestTenantContext,
    query?: ReconciliationBatchQueryDto
  ): ReconciliationBatch[] {
    const limit = query?.limit && query.limit > 0 ? query.limit : undefined
    const offset = query?.offset && query.offset > 0 ? query.offset : 0

    let batches = Array.from(reconciliationBatchStore.values())
      .filter((b) => b.tenantId === tenantContext.tenantId)

    if (query?.channel) {
      batches = batches.filter((b) => b.channel === query.channel)
    }
    if (query?.date) {
      batches = batches.filter((b) => b.date === query.date)
    }
    if (query?.storeId) {
      batches = batches.filter((b) => b.tenantId === tenantContext.tenantId)
    }
    if (query?.status) {
      batches = batches.filter((b) => b.status === query.status)
    }

    batches.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    if (typeof limit === 'number') {
      batches = batches.slice(offset, offset + limit)
    }

    return batches
  }

  /**
   * 完成对账批次 (更新统计)
   */
  completeReconciliationBatch(
    batchId: string,
    tenantContext: RequestTenantContext
  ): ReconciliationBatch {
    const batch = this.getReconciliationBatch(batchId, tenantContext)

    // 重新统计该批次下的所有交易
    const transactions = Array.from(reconciliationTransactionStore.values())
      .filter((t) => t.id.startsWith('rc-txn-'))

    // 按 batch 关联过滤 — 通过查询时间范围内的交易
    const batchTransactions = transactions.filter((t) => {
      const txnDate = t.createdAt.substring(0, 10)
      return txnDate <= batch.date
    })

    const totalTransactions = batchTransactions.length
    const matchedCount = batchTransactions.filter((t) => t.status === 'MATCHED').length
    const mismatchedCount = batchTransactions.filter((t) => t.status === 'MISMATCHED').length
    const unmatchedInternalCount = batchTransactions.filter((t) => t.status === 'UNMATCHED_INTERNAL').length
    const unmatchedExternalCount = batchTransactions.filter((t) => t.status === 'UNMATCHED_EXTERNAL').length
    const totalDifference = batchTransactions.reduce((sum, t) => sum + t.difference, 0)
    const totalFee = batchTransactions.reduce((sum, t) => sum + t.channelFee, 0)

    batch.totalTransactions = totalTransactions
    batch.matchedCount = matchedCount
    batch.mismatchedCount = mismatchedCount
    batch.unmatchedInternalCount = unmatchedInternalCount
    batch.unmatchedExternalCount = unmatchedExternalCount
    batch.totalDifference = totalDifference
    batch.totalFee = totalFee
    batch.status = 'MATCHED' as ReconciliationStatus
    batch.completedAt = new Date().toISOString()

    reconciliationBatchStore.set(batch.id, batch)

    this.emitEvent({
      type: 'reconciliation.completed',
      tenantId: tenantContext.tenantId,
      batchId: batch.id,
      matched: matchedCount,
      mismatched: mismatchedCount,
      totalDifference,
      timestamp: batch.completedAt
    })

    return batch
  }

  /**
   * 获取对账批次进度
   */
  getBatchProgress(
    batchId: string,
    tenantContext: RequestTenantContext
  ): BatchProgress {
    const batch = this.getReconciliationBatch(batchId, tenantContext)
    const total = batch.totalTransactions || 1
    const processed = batch.matchedCount + batch.mismatchedCount
    const progress = Math.round((processed / total) * 100)

    return {
      batchId: batch.id,
      batchNo: batch.batchNo,
      channel: batch.channel as string,
      date: batch.date,
      total,
      processed,
      progress,
      status: batch.status as string,
      startedAt: batch.processedAt ?? batch.createdAt,
    }
  }

  // ═══════════════════════════════════════════════════════
  // 对账交易
  // ═══════════════════════════════════════════════════════

  /**
   * 创建对账交易记录
   */
  createReconciliationTransaction(
    tenantContext: RequestTenantContext,
    input: CreateReconciliationTransactionDto
  ): ReconciliationTransaction {
    const now = new Date().toISOString()
    const externalAmount = input.externalAmount ?? input.internalAmount
    const difference = (externalAmount - input.internalAmount) - input.channelFee

    const status = difference === 0 && input.channelFee >= 0
      ? ReconciliationStatus.MATCHED as unknown as ReconciliationStatus
      : difference !== 0
        ? ReconciliationStatus.MISMATCHED as unknown as ReconciliationStatus
        : ReconciliationStatus.PENDING as unknown as ReconciliationStatus

    const transaction: ReconciliationTransaction = {
      id: `rc-txn-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      storeId: tenantContext.storeId,
      internalTransactionId: input.internalTransactionId,
      externalTransactionId: input.externalTransactionId,
      channel: input.channel as ReconciliationTransaction['channel'],
      channelTransactionNo: input.channelTransactionNo,
      type: input.type as ReconciliationTransaction['type'],
      internalAmount: input.internalAmount,
      externalAmount,
      difference,
      internalTime: now,
      externalTime: now,
      channelFee: input.channelFee,
      netAmount: externalAmount - input.channelFee,
      status,
      memo: input.memo,
      createdAt: now,
      updatedAt: now
    }

    reconciliationTransactionStore.set(transaction.id, transaction)

    if (status === 'MISMATCHED') {
      this.emitEvent({
        type: 'reconciliation.mismatch',
        tenantId: tenantContext.tenantId,
        batchId: '',
        transactionId: transaction.id,
        difference,
        timestamp: now
      })
    }

    return transaction
  }

  /**
   * 获取对账交易
   */
  getReconciliationTransaction(
    transactionId: string,
    tenantContext: RequestTenantContext
  ): ReconciliationTransaction {
    const txn = reconciliationTransactionStore.get(transactionId)
    if (!txn || txn.tenantId !== tenantContext.tenantId) {
      throw new Error(`Reconciliation transaction ${transactionId} not found`)
    }
    return txn
  }

  /**
   * 更新对账交易
   */
  updateReconciliationTransaction(
    transactionId: string,
    tenantContext: RequestTenantContext,
    input: UpdateReconciliationTransactionDto
  ): ReconciliationTransaction {
    const txn = this.getReconciliationTransaction(transactionId, tenantContext)

    if (input.externalTransactionId !== undefined) txn.externalTransactionId = input.externalTransactionId
    if (input.channelTransactionNo !== undefined) txn.channelTransactionNo = input.channelTransactionNo
    if (input.externalAmount !== undefined) txn.externalAmount = input.externalAmount
    if (input.channelFee !== undefined) txn.channelFee = input.channelFee
    if (input.status !== undefined) txn.status = input.status
    if (input.memo !== undefined) txn.memo = input.memo

    // 重新计算差异
    const extAmount = txn.externalAmount ?? txn.internalAmount
    txn.difference = extAmount - txn.internalAmount - txn.channelFee
    txn.netAmount = extAmount - txn.channelFee
    txn.updatedAt = new Date().toISOString()

    reconciliationTransactionStore.set(transactionId, txn)

    this.emitEvent({
      type: 'reconciliation.mismatch',
      tenantId: tenantContext.tenantId,
      batchId: '',
      transactionId: txn.id,
      difference: txn.difference,
      timestamp: txn.updatedAt
    })

    return txn
  }

  /**
   * 查询对账交易列表
   */
  listReconciliationTransactions(
    tenantContext: RequestTenantContext,
    query?: ReconciliationTransactionQueryDto
  ): ReconciliationTransaction[] {
    const limit = query?.limit && query.limit > 0 ? query.limit : undefined
    const offset = query?.offset && query.offset > 0 ? query.offset : 0

    let transactions = Array.from(reconciliationTransactionStore.values())
      .filter((t) => t.tenantId === tenantContext.tenantId)

    if (query?.channel) {
      transactions = transactions.filter((t) => t.channel === query.channel)
    }
    if (query?.status) {
      transactions = transactions.filter((t) => t.status === query.status)
    }
    if (query?.type) {
      transactions = transactions.filter((t) => t.type === query.type)
    }
    if (query?.dateFrom) {
      transactions = transactions.filter((t) => t.internalTime >= query.dateFrom!)
    }
    if (query?.dateTo) {
      transactions = transactions.filter((t) => t.internalTime <= query.dateTo!)
    }

    transactions.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    if (typeof limit === 'number') {
      transactions = transactions.slice(offset, offset + limit)
    }

    return transactions
  }

  /**
   * 执行自动匹配
   *
   * 根据 channelTransactionNo + internalAmount 匹配外部交易
   */
  autoMatch(
    batchId: string,
    tenantContext: RequestTenantContext,
    externalTransactions: Array<{
      channelTransactionNo: string
      amount: number
      channelFee: number
      transactionTime: string
    }>
  ): MatchingResult[] {
    const batch = this.getReconciliationBatch(batchId, tenantContext)
    const results: MatchingResult[] = []
    const now = new Date().toISOString()
    let matched = 0
    let mismatched = 0

    for (const ext of externalTransactions) {
      // 查找匹配的内部交易
      const internalTxns = Array.from(reconciliationTransactionStore.values())
        .filter((t) => t.tenantId === tenantContext.tenantId)
        .filter((t) => t.channel === (batch.channel as unknown as ReconciliationTransaction['channel']))
        .filter((t) => t.channelTransactionNo === ext.channelTransactionNo)
        .filter((t) => t.status === 'PENDING' || t.status === 'MATCHED')

      if (internalTxns.length === 0) {
        // 无匹配内部记录 — 创建一条未匹配的外部记录
        const txn = this.createReconciliationTransaction(tenantContext, {
          channel: batch.channel as unknown as ReconciliationChannel,
          internalTransactionId: undefined,
          externalTransactionId: ext.channelTransactionNo,
          channelTransactionNo: ext.channelTransactionNo,
          type: 'PAYMENT',
          internalAmount: 0,
          externalAmount: ext.amount,
          channelFee: ext.channelFee,
          memo: '自动创建：外部有记录，内部无匹配'
        })

        results.push({
          transactionId: txn.id,
          internalRecord: txn,
          externalRecord: { channelTransactionNo: ext.channelTransactionNo, externalAmount: ext.amount },
          status: 'UNMATCHED_INTERNAL',
          difference: ext.amount,
          issues: ['Internal record not found']
        })
        continue
      }

      // 执行匹配
      for (const internal of internalTxns) {
        const extAmount = ext.amount
        const diff = Math.abs(internal.internalAmount - extAmount) + internal.channelFee

        let matchStatus: ReconciliationStatus
        const issues: string[] = []

        if (diff === 0) {
          matchStatus = ReconciliationStatus.MATCHED
          matched++
        } else if (diff <= 1) {
          // 1分以内视为小额差异
          matchStatus = ReconciliationStatus.MATCHED
          issues.push(`Minor difference (${diff} cents) auto-resolved`)
          matched++
        } else {
          matchStatus = ReconciliationStatus.MISMATCHED
          issues.push(`Amount mismatch: internal ${internal.internalAmount}, external ${extAmount}`)
          mismatched++
        }

        internal.externalAmount = extAmount
        internal.externalTransactionId = ext.channelTransactionNo
        internal.channelFee = ext.channelFee
        internal.difference = diff
        internal.netAmount = extAmount - ext.channelFee
        internal.externalTime = ext.transactionTime
        internal.status = matchStatus
        internal.updatedAt = now
        internal.reconciledAt = now
        reconciliationTransactionStore.set(internal.id, internal)

        results.push({
          transactionId: internal.id,
          internalRecord: { ...internal },
          externalRecord: {
            channelTransactionNo: ext.channelTransactionNo,
            externalAmount: extAmount,
            channelFee: ext.channelFee
          },
          status: matchStatus as unknown as ReconciliationStatus,
          difference: diff,
          issues: issues.length > 0 ? issues : undefined
        })
      }
    }

    // 更新批次统计
    const allBatchTxns = Array.from(reconciliationTransactionStore.values())
      .filter((t) => t.tenantId === tenantContext.tenantId)

    batch.totalTransactions = allBatchTxns.length
    batch.matchedCount = allBatchTxns.filter((t) => t.status === 'MATCHED').length
    batch.mismatchedCount = allBatchTxns.filter((t) => t.status === 'MISMATCHED').length
    batch.unmatchedInternalCount = allBatchTxns.filter((t) => t.status === 'UNMATCHED_INTERNAL').length
    batch.unmatchedExternalCount = allBatchTxns.filter((t) => t.status === 'UNMATCHED_EXTERNAL').length
    batch.totalDifference = allBatchTxns.reduce((sum, t) => sum + t.difference, 0)
    batch.totalFee = allBatchTxns.reduce((sum, t) => sum + t.channelFee, 0)
    reconciliationBatchStore.set(batch.id, batch)

    return results
  }

  /**
   * 手动匹配
   */
  manualMatch(
    tenantContext: RequestTenantContext,
    input: ManualMatchDto
  ): ReconciliationTransaction {
    const txn = this.getReconciliationTransaction(input.transactionId, tenantContext)

    txn.externalTransactionId = input.externalTransactionId
    txn.channelTransactionNo = input.channelTransactionNo ?? txn.channelTransactionNo
    if (input.externalAmount !== undefined) {
      txn.externalAmount = input.externalAmount
      txn.difference = input.externalAmount - txn.internalAmount - txn.channelFee
      txn.netAmount = input.externalAmount - txn.channelFee
    }
    txn.status = txn.difference === 0
      ? ReconciliationStatus.MATCHED as unknown as ReconciliationStatus
      : ReconciliationStatus.MISMATCHED as unknown as ReconciliationStatus
    txn.memo = input.memo ?? txn.memo
    txn.reconciledAt = new Date().toISOString()
    txn.updatedAt = new Date().toISOString()

    reconciliationTransactionStore.set(txn.id, txn)
    return txn
  }

  /**
   * 手动调账
   */
  manualAdjustment(
    tenantContext: RequestTenantContext,
    input: ManualAdjustmentDto
  ): ReconciliationTransaction {
    const txn = this.getReconciliationTransaction(input.transactionId, tenantContext)

    txn.difference = input.difference
    txn.netAmount = (txn.externalAmount ?? txn.internalAmount) - txn.channelFee + input.difference
    txn.status = ReconciliationStatus.MATCHED as unknown as ReconciliationStatus
    txn.memo = `手动调账: ${input.reason}${txn.memo ? ` | ${txn.memo}` : ''}`
    txn.reconciledAt = new Date().toISOString()
    txn.updatedAt = new Date().toISOString()

    reconciliationTransactionStore.set(txn.id, txn)
    return txn
  }

  /**
   * 批量导入外部交易记录
   */
  importExternalTransactions(
    tenantContext: RequestTenantContext,
    channel: ReconciliationChannel,
    transactions: Array<{
      channelTransactionNo: string
      amount: number
      channelFee: number
      type: 'PAYMENT' | 'REFUND' | 'SETTLEMENT'
      transactionTime: string
      memo?: string
    }>
  ): ReconciliationTransaction[] {
    return transactions.map((tx) =>
      this.createReconciliationTransaction(tenantContext, {
        channel,
        externalTransactionId: tx.channelTransactionNo,
        channelTransactionNo: tx.channelTransactionNo,
        type: tx.type,
        internalAmount: 0,
        externalAmount: tx.amount,
        channelFee: tx.channelFee,
        memo: `外部导入: ${tx.memo ?? ''}`
      })
    )
  }

  // ═══════════════════════════════════════════════════════
  // 对账统计
  // ═══════════════════════════════════════════════════════

  /**
   * 获取对账统计
   */
  getReconciliationStats(
    tenantContext: RequestTenantContext,
    query?: ReconciliationStatsQueryDto
  ): {
    totalBatches: number
    totalTransactions: number
    matchedCount: number
    mismatchedCount: number
    matchRate: number
    totalDifference: number
    totalFee: number
    channelBreakdown: Array<{
      channel: string
      total: number
      matched: number
      mismatched: number
      difference: number
    }>
  } {
    const batches = this.listReconciliationBatches(tenantContext, {
      ...query,
      limit: 1000
    } as ReconciliationBatchQueryDto)

    const transactions = Array.from(reconciliationTransactionStore.values())
      .filter((t) => t.tenantId === tenantContext.tenantId)
      .filter((t) => !query?.channel || t.channel === query.channel)
      .filter((t) => !query?.storeId || t.storeId === query.storeId)
      .filter((t) => !query?.dateFrom || t.createdAt >= query.dateFrom)
      .filter((t) => !query?.dateTo || t.createdAt <= query.dateTo)

    const matchedCount = transactions.filter((t) => t.status === 'MATCHED').length
    const mismatchedCount = transactions.filter((t) => t.status === 'MISMATCHED').length
    const total = transactions.length

    // 按渠道统计
    const channelMap = new Map<string, { total: number; matched: number; mismatched: number; difference: number }>()
    for (const t of transactions) {
      const key = t.channel as string
      const entry = channelMap.get(key) ?? { total: 0, matched: 0, mismatched: 0, difference: 0 }
      entry.total++
      if (t.status === 'MATCHED') entry.matched++
      if (t.status === 'MISMATCHED') entry.mismatched++
      entry.difference += Math.abs(t.difference)
      channelMap.set(key, entry)
    }

    const channelBreakdown = Array.from(channelMap.entries()).map(([channel, stats]) => ({
      channel,
      ...stats
    }))

    return {
      totalBatches: batches.length,
      totalTransactions: total,
      matchedCount,
      mismatchedCount,
      matchRate: total > 0 ? Math.round((matchedCount / total) * 10000) / 100 : 100,
      totalDifference: transactions.reduce((sum, t) => sum + t.difference, 0),
      totalFee: transactions.reduce((sum, t) => sum + t.channelFee, 0),
      channelBreakdown
    }
  }

  /**
   * 获取对账汇总
   */
  getReconciliationSummary(
    batchId: string,
    tenantContext: RequestTenantContext
  ): ReconciliationSummary {
    const batch = this.getReconciliationBatch(batchId, tenantContext)
    const totalCount = batch.totalTransactions || 1
    const matchedRate = Math.round((batch.matchedCount / totalCount) * 10000) / 100

    return {
      batchId: batch.id,
      batchNo: batch.batchNo,
      channel: batch.channel as string,
      date: batch.date,
      totalCount,
      matchedCount: batch.matchedCount,
      matchedRate,
      mismatchedCount: batch.mismatchedCount,
      unmatchedInternalCount: batch.unmatchedInternalCount,
      unmatchedExternalCount: batch.unmatchedExternalCount,
      totalInternalAmount: 0,
      totalExternalAmount: 0,
      totalDifference: batch.totalDifference,
      totalFee: batch.totalFee,
      status: batch.status as string
    }
  }

  /**
   * 获取所有渠道常量
   */
  getReconciliationChannels(): string[] {
    return Object.values(ReconciliationChannel)
  }

  // ═══════════════════════════════════════════════════════
  // 辅助方法
  // ═══════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════
  // 对账历史查询
  // ═══════════════════════════════════════════════════════

  /**
   * 查询对账历史记录（按日期范围/门店/状态筛选）
   * 支持分页
   */
  queryReconciliationHistory(
    tenantContext: RequestTenantContext,
    query: { dateFrom?: string; dateTo?: string; channel?: string; status?: string; limit?: number; offset?: number }
  ): { batches: ReconciliationBatch[]; total: number; query: Record<string, unknown> } {
    const tenantId = tenantContext.tenantId

    let batches = Array.from(reconciliationBatchStore.values())
      .filter((b) => b.tenantId === tenantId)

    if (query.channel) {
      batches = batches.filter((b) => b.channel === query.channel)
    }
    if (query.status) {
      batches = batches.filter((b) => b.status === query.status)
    }
    if (query.dateFrom) {
      batches = batches.filter((b) => b.date >= query.dateFrom!)
    }
    if (query.dateTo) {
      batches = batches.filter((b) => b.date <= query.dateTo!)
    }

    batches.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const total = batches.length
    const limit = query.limit ?? 20
    const offset = query.offset ?? 0
    batches = batches.slice(offset, offset + limit)

    return {
      batches,
      total,
      query: { tenantId, ...query }
    }
  }

  private emitEvent(event: {
    type: string
    tenantId: string
    batchId: string
    [key: string]: unknown
  }): void {
    if (this.eventEmitter && event.tenantId) {
      try {
        this.eventEmitter.emit(event as never)
      } catch (err) {
        this.logger.warn(`Failed to emit event ${event.type}: ${(err as Error).message}`)
      }
    }
  }
}
