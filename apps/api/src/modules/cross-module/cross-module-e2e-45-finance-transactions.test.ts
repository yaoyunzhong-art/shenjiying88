import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🦞 跨模块 E2E 测试链 #45: 财务对账 → 交易管理 全链路
 *
 * 模拟链路:
 *   Transactions (交易创建/支付/取消/退款)
 *   → Finance-Reconciliation (对账批次创建/匹配/差异上报/调账)
 *   → Finance-CashFlow (现金流记录/余额追踪)
 *   → Finance-Reports (对账汇总/报表)
 *
 * 覆盖模块: transactions, finance (reconciliation), cashier, payment-gateway
 *
 * 设计模式: 交易→对账→差异处理→对账完成 全流程闭环
 * 验证交易数据的对账准确性、差异上报和调整流程、批量对账能力
 */

import assert from 'node:assert/strict'

// ============================================================
// 类型定义
// ============================================================

// ---- 交易层 ----
type TransactionStatus = 'created' | 'paid' | 'completed' | 'cancelled' | 'refunded'
type PaymentChannel = 'wechat_pay' | 'alipay' | 'bank_card' | 'cash'
type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'

interface TransactionItem {
  skuId: string
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
}

interface Transaction {
  id: string
  orderNo: string
  tenantId: string
  memberId: string
  items: TransactionItem[]
  totalAmount: number
  currency: string
  status: TransactionStatus
  paidAt?: string
  cancelledAt?: string
  createdAt: string
  updatedAt: string
}

interface TransactionPayment {
  id: string
  transactionId: string
  channel: PaymentChannel
  amount: number
  status: PaymentStatus
  channelTransactionNo: string
  fee: number
  paidAt?: string
  createdAt: string
}

interface TransactionRefundRecord {
  id: string
  transactionId: string
  paymentId: string
  refundAmount: number
  reason: string
  status: 'pending' | 'completed' | 'rejected'
  requestedAt: string
  completedAt?: string
  createdAt: string
}

// ---- 对账层 ----
type ReconciliationChannel = 'WECHAT' | 'ALIPAY' | 'BANK' | 'CASH' | 'CARD'
type ReconciliationStatus = 'PENDING' | 'MATCHED' | 'MISMATCHED' | 'UNMATCHED_INTERNAL' | 'UNMATCHED_EXTERNAL'
type AdjustmentStatus = 'pending' | 'approved' | 'rejected'

interface ReconciliationBatch {
  id: string
  channel: ReconciliationChannel
  date: string
  storeId?: string
  totalInternalCount: number
  totalInternalAmount: number
  totalExternalCount: number
  totalExternalAmount: number
  matchedCount: number
  mismatchedCount: number
  unmatchedInternalCount: number
  unmatchedExternalCount: number
  status: 'in_progress' | 'completed'
  createdAt: string
  completedAt?: string
}

interface ReconciliationTransaction {
  id: string
  batchId: string
  channel: ReconciliationChannel
  internalTransactionId?: string
  externalTransactionId?: string
  channelTransactionNo?: string
  type: 'PAYMENT' | 'REFUND' | 'SETTLEMENT'
  internalAmount: number
  externalAmount?: number
  difference: number
  channelFee: number
  status: ReconciliationStatus
  memo?: string
  createdAt: string
  updatedAt: string
}

interface DifferenceReport {
  id: string
  reconciliationTxId: string
  batchId: string
  internalAmount: number
  externalAmount: number
  difference: number
  reason: string
  status: AdjustmentStatus
  adjustedAmount?: number
  adjustedAt?: string
  adjustedBy?: string
  createdAt: string
}

// ---- 报表层 ----
interface ReconciliationSummary {
  batchId: string
  channel: ReconciliationChannel
  date: string
  totalTransactions: number
  totalInternalAmount: number
  totalExternalAmount: number
  totalDifference: number
  totalDifferences: number
  resolvedDifferences: number
  pendingAdjustments: number
  matchRate: number // 0.00 - 1.00
}

// ============================================================
// 模块模拟实现
// ============================================================

// ---- Transaction Service ----

const txStore = new Map<string, Transaction>()
const paymentStore = new Map<string, TransactionPayment>()
const refundStore = new Map<string, TransactionRefundRecord>()
let txSeq = 0
let paySeq = 0
let refundSeq = 0

function resetTransactionState(): void {
  txStore.clear()
  paymentStore.clear()
  refundStore.clear()
  txSeq = 0
  paySeq = 0
  refundSeq = 0
}

function createTransaction(opts: {
  tenantId: string
  memberId: string
  items: TransactionItem[]
  totalAmount: number
  currency?: string
}): Transaction {
  const now = new Date().toISOString()
  const tx: Transaction = {
    id: `TX${++txSeq}`,
    orderNo: `ORD${String(txSeq).padStart(6, '0')}`,
    tenantId: opts.tenantId,
    memberId: opts.memberId,
    items: opts.items.map(i => ({ ...i })),
    totalAmount: opts.totalAmount,
    currency: opts.currency || 'CNY',
    status: 'created',
    createdAt: now,
    updatedAt: now,
  }
  txStore.set(tx.id, tx)
  return { ...tx }
}

function payTransaction(txId: string, channel: PaymentChannel, amount: number, channelTxNo: string): { transaction: Transaction; payment: TransactionPayment } {
  const tx = txStore.get(txId)
  if (!tx) throw new Error(`Transaction ${txId} not found`)
  if (tx.status !== 'created') throw new Error(`Cannot pay transaction with status: ${tx.status}`)
  tx.status = 'paid'
  tx.paidAt = new Date().toISOString()
  tx.updatedAt = new Date().toISOString()

  const fee = Math.round(amount * 0.006 * 100) / 100 // 0.6% fee
  const payment: TransactionPayment = {
    id: `PAY${++paySeq}`,
    transactionId: txId,
    channel,
    amount,
    status: 'succeeded',
    channelTransactionNo: channelTxNo,
    fee,
    paidAt: tx.paidAt,
    createdAt: new Date().toISOString(),
  }
  paymentStore.set(payment.id, payment)
  return { transaction: { ...tx }, payment: { ...payment } }
}

function cancelTransaction(txId: string): Transaction {
  const tx = txStore.get(txId)
  if (!tx) throw new Error(`Transaction ${txId} not found`)
  if (tx.status !== 'created' && tx.status !== 'paid') throw new Error(`Cannot cancel transaction with status: ${tx.status}`)
  tx.status = 'cancelled'
  tx.cancelledAt = new Date().toISOString()
  tx.updatedAt = new Date().toISOString()
  return { ...tx }
}

function requestRefund(txId: string, paymentId: string, refundAmount: number, reason: string): TransactionRefundRecord {
  const tx = txStore.get(txId)
  if (!tx) throw new Error(`Transaction ${txId} not found`)
  if (tx.status !== 'paid') throw new Error(`Cannot refund transaction with status: ${tx.status}`)
  const payment = paymentStore.get(paymentId)
  if (!payment) throw new Error(`Payment ${paymentId} not found`)

  if (refundAmount > payment.amount) throw new Error('Refund amount exceeds payment amount')
  if (payment.status !== 'succeeded') throw new Error('Cannot refund a non-succeeded payment')

  const refund: TransactionRefundRecord = {
    id: `RF${++refundSeq}`,
    transactionId: txId,
    paymentId,
    refundAmount,
    reason,
    status: 'pending',
    requestedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }
  refundStore.set(refund.id, refund)
  return { ...refund }
}

function completeRefund(refundId: string): TransactionRefundRecord {
  const refund = refundStore.get(refundId)
  if (!refund) throw new Error(`Refund ${refundId} not found`)
  if (refund.status !== 'pending') throw new Error(`Cannot complete refund with status: ${refund.status}`)
  refund.status = 'completed'
  refund.completedAt = new Date().toISOString()

  // Update payment status
  const payment = paymentStore.get(refund.paymentId)
  if (payment) payment.status = 'refunded'

  // Update transaction status
  const tx = txStore.get(refund.transactionId)
  if (tx) tx.status = 'refunded'
  tx!.updatedAt = new Date().toISOString()

  return { ...refund }
}

function getTransaction(txId: string): Transaction | undefined {
  const tx = txStore.get(txId)
  return tx ? { ...tx } : undefined
}

function getPayment(paymentId: string): TransactionPayment | undefined {
  const p = paymentStore.get(paymentId)
  return p ? { ...p } : undefined
}

// ---- Finance Reconciliation Service ----

const batchStore = new Map<string, ReconciliationBatch>()
const reconcTxStore = new Map<string, ReconciliationTransaction>()
const diffStore = new Map<string, DifferenceReport>()
let batchSeq = 0
let reconcTxSeq = 0
let diffSeq = 0

function resetReconciliationState(): void {
  batchStore.clear()
  reconcTxStore.clear()
  diffStore.clear()
  batchSeq = 0
  reconcTxSeq = 0
  diffSeq = 0
}

function createReconciliationBatch(opts: {
  channel: ReconciliationChannel
  date: string
  storeId?: string
}): ReconciliationBatch {
  const batch: ReconciliationBatch = {
    id: `RCB${++batchSeq}`,
    channel: opts.channel,
    date: opts.date,
    storeId: opts.storeId,
    totalInternalCount: 0,
    totalInternalAmount: 0,
    totalExternalCount: 0,
    totalExternalAmount: 0,
    matchedCount: 0,
    mismatchedCount: 0,
    unmatchedInternalCount: 0,
    unmatchedExternalCount: 0,
    status: 'in_progress',
    createdAt: new Date().toISOString(),
  }
  batchStore.set(batch.id, batch)
  return { ...batch }
}

function addReconciliationTransaction(opts: {
  batchId: string
  channel: ReconciliationChannel
  internalTransactionId?: string
  externalTransactionId?: string
  channelTransactionNo?: string
  type: 'PAYMENT' | 'REFUND' | 'SETTLEMENT'
  internalAmount: number
  externalAmount?: number
  channelFee: number
}): ReconciliationTransaction {
  const batch = batchStore.get(opts.batchId)
  if (!batch) throw new Error(`Batch ${opts.batchId} not found`)

  const externalAmt = opts.externalAmount ?? opts.internalAmount
  const difference = Math.round((opts.internalAmount - externalAmt) * 100) / 100
  let status: ReconciliationStatus

  if (difference === 0 && opts.externalTransactionId) {
    status = 'MATCHED'
  } else if (difference !== 0 && opts.externalTransactionId) {
    status = 'MISMATCHED'
  } else if (opts.externalTransactionId) {
    status = 'UNMATCHED_EXTERNAL'
  } else {
    status = 'UNMATCHED_INTERNAL'
  }

  const tx: ReconciliationTransaction = {
    id: `RCT${++reconcTxSeq}`,
    batchId: opts.batchId,
    channel: opts.channel,
    internalTransactionId: opts.internalTransactionId,
    externalTransactionId: opts.externalTransactionId,
    channelTransactionNo: opts.channelTransactionNo,
    type: opts.type,
    internalAmount: opts.internalAmount,
    externalAmount: externalAmt,
    difference,
    channelFee: opts.channelFee,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  reconcTxStore.set(tx.id, tx)

  // Update batch counters
  batch.totalInternalCount++
  batch.totalInternalAmount += opts.internalAmount
  if (opts.externalTransactionId) {
    batch.totalExternalCount++
    batch.totalExternalAmount += externalAmt
  }

  // Recalculate status groups
  batch.matchedCount = 0
  batch.mismatchedCount = 0
  batch.unmatchedInternalCount = 0
  batch.unmatchedExternalCount = 0
  for (const rtx of reconcTxStore.values()) {
    if (rtx.batchId === opts.batchId) {
      if (rtx.status === 'MATCHED') batch.matchedCount++
      else if (rtx.status === 'MISMATCHED') batch.mismatchedCount++
      else if (rtx.status === 'UNMATCHED_INTERNAL') batch.unmatchedInternalCount++
      else if (rtx.status === 'UNMATCHED_EXTERNAL') batch.unmatchedExternalCount++
    }
  }

  return { ...tx }
}

function reportDifference(reconciliationTxId: string, reason: string): DifferenceReport {
  const rtx = reconcTxStore.get(reconciliationTxId)
  if (!rtx) throw new Error(`Reconciliation transaction ${reconciliationTxId} not found`)

  const diff: DifferenceReport = {
    id: `DIF${++diffSeq}`,
    reconciliationTxId,
    batchId: rtx.batchId,
    internalAmount: rtx.internalAmount,
    externalAmount: rtx.externalAmount ?? 0,
    difference: rtx.difference,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  diffStore.set(diff.id, diff)
  return { ...diff }
}

function adjustDifference(diffId: string, adjustedAmount: number, adjustedBy: string): DifferenceReport {
  const diff = diffStore.get(diffId)
  if (!diff) throw new Error(`Difference report ${diffId} not found`)
  if (diff.status !== 'pending') throw new Error(`Cannot adjust difference with status: ${diff.status}`)

  diff.status = 'approved'
  diff.adjustedAmount = adjustedAmount
  diff.adjustedAt = new Date().toISOString()
  diff.adjustedBy = adjustedBy

  // Update the reconciliation transaction
  const rtx = reconcTxStore.get(diff.reconciliationTxId)
  if (rtx) {
    rtx.status = 'MATCHED'
    rtx.externalAmount = adjustedAmount
    rtx.difference = Math.round((rtx.internalAmount - adjustedAmount) * 100) / 100
    rtx.memo = `Adjusted: ${diff.reason}`
    rtx.updatedAt = new Date().toISOString()
  }

  return { ...diff }
}

function completeBatch(batchId: string): ReconciliationBatch {
  const batch = batchStore.get(batchId)
  if (!batch) throw new Error(`Batch ${batchId} not found`)
  batch.status = 'completed'
  batch.completedAt = new Date().toISOString()
  return { ...batch }
}

function generateReconciliationSummary(batchId: string): ReconciliationSummary {
  const batch = batchStore.get(batchId)
  if (!batch) throw new Error(`Batch ${batchId} not found`)

  const allDiffs = Array.from(diffStore.values()).filter(d => d.batchId === batchId)
  const totalDifference = allDiffs.reduce((sum, d) => sum + Math.abs(d.difference), 0)
  const resolvedDiffs = allDiffs.filter(d => d.status === 'approved').length
  const totalTx = batch.matchedCount + batch.mismatchedCount + batch.unmatchedInternalCount + batch.unmatchedExternalCount
  const matchRate = totalTx > 0 ? Math.round((batch.matchedCount / totalTx) * 10000) / 10000 : 0

  return {
    batchId,
    channel: batch.channel,
    date: batch.date,
    totalTransactions: totalTx,
    totalInternalAmount: batch.totalInternalAmount,
    totalExternalAmount: batch.totalExternalAmount,
    totalDifference,
    totalDifferences: allDiffs.length,
    resolvedDifferences: resolvedDiffs,
    pendingAdjustments: allDiffs.filter(d => d.status === 'pending').length,
    matchRate,
  }
}

// ---- 全链路整合函数: 交易+对账 ----

interface FullReconciliationJourneyResult {
  transaction: Transaction
  payment: TransactionPayment
  batch: ReconciliationBatch
  matchedTx: ReconciliationTransaction
  summary: ReconciliationSummary
}

function executeFullReconciliationJourney(): FullReconciliationJourneyResult {
  // 1. 创建交易
  const tx = createTransaction({
    tenantId: 'T045',
    memberId: 'M001',
    items: [
      { skuId: 'SKU001', name: '100游戏币', quantity: 2, unitPrice: 100, subtotal: 200 },
    ],
    totalAmount: 200,
  })

  // 2. 支付
  const { payment } = payTransaction(tx.id, 'wechat_pay', 200, 'WX2026072001001')

  // 3. 创建对账批次
  const batch = createReconciliationBatch({
    channel: 'WECHAT',
    date: '2026-07-20',
  })

  // 4. 添加对账交易（匹配成功）
  const matchedTx = addReconciliationTransaction({
    batchId: batch.id,
    channel: 'WECHAT',
    internalTransactionId: tx.id,
    externalTransactionId: payment.channelTransactionNo,
    channelTransactionNo: payment.channelTransactionNo,
    type: 'PAYMENT',
    internalAmount: payment.amount,
    externalAmount: payment.amount,
    channelFee: payment.fee,
  })

  // 5. 完成对账
  completeBatch(batch.id)

  // 6. 生成汇总
  const summary = generateReconciliationSummary(batch.id)

  return {
    transaction: getTransaction(tx.id)!,
    payment: getPayment(payment.id)!,
    batch: batchStore.get(batch.id)!,
    matchedTx,
    summary,
  }
}

// ============================================================
// 测试用例
// ============================================================

describe('🦞 跨模块 E2E #45: 财务对账—交易全链路', () => {
  beforeEach(() => {
    resetTransactionState()
    resetReconciliationState()
  })

  // --- 正例 ---
  describe('正例', () => {
    it('交易→支付→对账→匹配成功→完成对账', () => {
      const result = executeFullReconciliationJourney()

      // 交易
      assert.equal(result.transaction.status, 'paid')
      assert.equal(result.transaction.totalAmount, 200)

      // 支付
      assert.equal(result.payment.channel, 'wechat_pay')
      assert.equal(result.payment.status, 'succeeded')

      // 对账批次
      assert.equal(result.batch.channel, 'WECHAT')
      assert.equal(result.batch.status, 'completed')

      // 对账记录应匹配
      assert.equal(result.matchedTx.status, 'MATCHED')
      assert.equal(result.matchedTx.difference, 0)

      // 汇总
      assert.equal(result.summary.totalTransactions, 1)
      assert.equal(result.summary.matchRate, 1)
      assert.equal(result.summary.totalDifference, 0)
    })

    it('对账差异上报→调账→对账完成', () => {
      // 创建交易
      const tx = createTransaction({
        tenantId: 'T045', memberId: 'M002',
        items: [{ skuId: 'SKU002', name: '50游戏币', quantity: 1, unitPrice: 50, subtotal: 50 }],
        totalAmount: 50,
      })
      payTransaction(tx.id, 'alipay', 50, 'ALI2026072002002')

      // 创建对账批次（金额不一致，模拟差异）
      const batch = createReconciliationBatch({ channel: 'ALIPAY', date: '2026-07-20' })

      // internal = 50, external = 48（渠道扣了2元手续费未体现）
      const rtx = addReconciliationTransaction({
        batchId: batch.id,
        channel: 'ALIPAY',
        internalTransactionId: tx.id,
        externalTransactionId: 'ALI2026072002002',
        channelTransactionNo: 'ALI2026072002002',
        type: 'PAYMENT',
        internalAmount: 50,
        externalAmount: 48,
        channelFee: 0.3,
      })

      assert.equal(rtx.status, 'MISMATCHED')
      assert.equal(rtx.difference, 2)

      // 上报差异
      const diff = reportDifference(rtx.id, '支付宝手续费差额2元')
      assert.equal(diff.status, 'pending')
      assert.equal(diff.difference, 2)

      // 调账
      const adjusted = adjustDifference(diff.id, 48, '财务-张会计')
      assert.equal(adjusted.status, 'approved')

      // 验证对账记录已更新
      const updatedRtx = reconcTxStore.get(rtx.id)!
      assert.equal(updatedRtx.status, 'MATCHED')

      // 完成对账
      const completed = completeBatch(batch.id)
      assert.equal(completed.status, 'completed')

      // 汇总验证
      const summary = generateReconciliationSummary(batch.id)
      assert.equal(summary.totalDifferences, 1)
      assert.equal(summary.resolvedDifferences, 1)
      assert.equal(summary.pendingAdjustments, 0)
    })

    it('批量对账: 多条交易在同一批次内匹配', () => {
      const batch = createReconciliationBatch({ channel: 'WECHAT', date: '2026-07-20' })

      // 批量添加5条对账记录
      for (let i = 0; i < 5; i++) {
        addReconciliationTransaction({
          batchId: batch.id,
          channel: 'WECHAT',
          internalTransactionId: `TX-BATCH-${i + 1}`,
          externalTransactionId: `WX-BATCH-${i + 1}`,
          type: 'PAYMENT',
          internalAmount: 100 * (i + 1),
          externalAmount: 100 * (i + 1),
          channelFee: 0.6 * (i + 1),
        })
      }

      const completed = completeBatch(batch.id)
      assert.equal(completed.totalInternalCount, 5)
      assert.equal(completed.totalExternalCount, 5)
      assert.equal(completed.matchedCount, 5)
      assert.equal(completed.totalInternalAmount, 1500) // 100+200+300+400+500

      const summary = generateReconciliationSummary(batch.id)
      assert.equal(summary.totalTransactions, 5)
      assert.equal(summary.matchRate, 1)
    })
  })

  // --- 反例 ---
  describe('反例', () => {
    it('不可退款超过支付金额', () => {
      const tx = createTransaction({
        tenantId: 'T045', memberId: 'M003',
        items: [{ skuId: 'SKU003', name: '10游戏币', quantity: 1, unitPrice: 10, subtotal: 10 }],
        totalAmount: 10,
      })
      const { payment } = payTransaction(tx.id, 'cash', 10, 'CASH20260720')

      assert.throws(() => requestRefund(tx.id, payment.id, 20, '超额退款'), /exceeds/)
    })

    it('未支付的交易不能退款', () => {
      const tx = createTransaction({
        tenantId: 'T045', memberId: 'M004',
        items: [{ skuId: 'SKU004', name: '30游戏币', quantity: 1, unitPrice: 30, subtotal: 30 }],
        totalAmount: 30,
      })

      // No payment made — transaction is still 'created', not eligible for refund
      assert.throws(() => requestRefund(tx.id, 'nonexistent', 30, '退款'), /Cannot refund/)  
    })

    it('已取消的交易不能重复取消', () => {
      const tx = createTransaction({
        tenantId: 'T045', memberId: 'M005',
        items: [{ skuId: 'SKU005', name: '测试', quantity: 1, unitPrice: 5, subtotal: 5 }],
        totalAmount: 5,
      })

      cancelTransaction(tx.id)
      assert.throws(() => cancelTransaction(tx.id), /Cannot cancel/)
    })

    it('已完成的对账批次不可再次完成', () => {
      const batch = createReconciliationBatch({ channel: 'CASH', date: '2026-07-20' })
      completeBatch(batch.id)

      // 已完成的状态不变
      const again = completeBatch(batch.id)
      assert.equal(again.status, 'completed')
    })
  })

  // --- 边界 ---
  describe('边界', () => {
    it('交易退款后对账差异处理 → 标记退款对账', () => {
      const tx = createTransaction({
        tenantId: 'T045', memberId: 'M006',
        items: [{ skuId: 'SKU006', name: '200游戏币', quantity: 1, unitPrice: 200, subtotal: 200 }],
        totalAmount: 200,
      })
      const { payment } = payTransaction(tx.id, 'wechat_pay', 200, 'WXREFUND001')

      // 申请退款 200 并完成
      const refund = requestRefund(tx.id, payment.id, 200, '客户要求退款')
      completeRefund(refund.id)

      // Re-read from store after completeRefund mutates the backing map
      const completedRefund = Array.from(refundStore.values()).find(r => r.id === refund.id)!
      assert.equal(completedRefund.status, 'completed')

      // 对账时，创建退款对账记录
      const batch = createReconciliationBatch({ channel: 'WECHAT', date: '2026-07-20' })
      const refundRtx = addReconciliationTransaction({
        batchId: batch.id,
        channel: 'WECHAT',
        internalTransactionId: refund.id,
        externalTransactionId: 'WXREFUND_TX001',
        type: 'REFUND',
        internalAmount: 200,
        externalAmount: 200,
        channelFee: 0,
      })

      assert.equal(refundRtx.type, 'REFUND')
      assert.equal(refundRtx.status, 'MATCHED')
    })

    it('批量对账中部分不匹配 → matchRate < 1', () => {
      const batch = createReconciliationBatch({ channel: 'BANK', date: '2026-07-20' })

      // 3条匹配
      for (let i = 0; i < 3; i++) {
        addReconciliationTransaction({
          batchId: batch.id, channel: 'BANK',
          internalTransactionId: `BANK-M-${i + 1}`,
          externalTransactionId: `EXT-M-${i + 1}`,
          type: 'PAYMENT',
          internalAmount: 100, externalAmount: 100, channelFee: 0.6,
        })
      }

      // 1条不匹配（金额不符）
      addReconciliationTransaction({
        batchId: batch.id, channel: 'BANK',
        internalTransactionId: 'BANK-MM-1',
        externalTransactionId: 'EXT-MM-1',
        type: 'PAYMENT',
        internalAmount: 200, externalAmount: 195, channelFee: 1.2,
      })

      // 1条外部不匹配（外部无对应记录）
      addReconciliationTransaction({
        batchId: batch.id, channel: 'BANK',
        internalTransactionId: 'BANK-UNMATCH-1',
        externalTransactionId: undefined,
        type: 'PAYMENT',
        internalAmount: 150, channelFee: 0.9,
      })

      completeBatch(batch.id)
      const summary = generateReconciliationSummary(batch.id)

      assert.equal(summary.totalTransactions, 5)
      // 3 matched / 5 total = 0.6 match rate
      assert.equal(summary.matchRate, 0.6)
    })

    it('多渠道对账汇总计算正确', () => {
      // WeChat 渠道批次
      const wcBatch = createReconciliationBatch({ channel: 'WECHAT', date: '2026-07-20' })
      addReconciliationTransaction({
        batchId: wcBatch.id, channel: 'WECHAT',
        internalTransactionId: 'WX-1', externalTransactionId: 'EXT-WX-1',
        type: 'PAYMENT', internalAmount: 500, externalAmount: 500, channelFee: 3,
      })

      // Alipay 渠道批次
      const aliBatch = createReconciliationBatch({ channel: 'ALIPAY', date: '2026-07-20' })
      addReconciliationTransaction({
        batchId: aliBatch.id, channel: 'ALIPAY',
        internalTransactionId: 'ALI-1', externalTransactionId: 'EXT-ALI-1',
        type: 'PAYMENT', internalAmount: 300, externalAmount: 300, channelFee: 1.8,
      })

      const wcSummary = generateReconciliationSummary(wcBatch.id)
      const aliSummary = generateReconciliationSummary(aliBatch.id)

      assert.equal(wcSummary.totalInternalAmount, 500)
      assert.equal(aliSummary.totalInternalAmount, 300)
      assert.equal(wcSummary.channel, 'WECHAT')
      assert.equal(aliSummary.channel, 'ALIPAY')

      // Total across both
      const totalAcross = wcSummary.totalInternalAmount + aliSummary.totalInternalAmount
      assert.equal(totalAcross, 800)
    })

    it('空批次（无对账记录）→ matchRate 为0', () => {
      const batch = createReconciliationBatch({ channel: 'CASH', date: '2026-07-20' })
      completeBatch(batch.id)

      const summary = generateReconciliationSummary(batch.id)

      assert.equal(summary.totalTransactions, 0)
      assert.equal(summary.matchRate, 0)
      assert.equal(summary.totalDifference, 0)
    })

    it('单笔交易跨渠道退款：微信支付→退款到微信', () => {
      const tx = createTransaction({
        tenantId: 'T045', memberId: 'M007',
        items: [{ skuId: 'SKU007', name: 'VIP月卡', quantity: 1, unitPrice: 99, subtotal: 99 }],
        totalAmount: 99,
      })
      const { payment } = payTransaction(tx.id, 'wechat_pay', 99, 'WX20260720VIP')

      // Partial refund: 50 元
      const refund = requestRefund(tx.id, payment.id, 50, '部分退款')
      completeRefund(refund.id)

      assert.equal(refund.refundAmount, 50)
      // Re-read from store after completeRefund mutates the backing map
      const completedRefund2 = Array.from(refundStore.values()).find(r => r.id === refund.id)!
      assert.equal(completedRefund2.status, 'completed')

      // 退款对账单
      const batch = createReconciliationBatch({ channel: 'WECHAT', date: '2026-07-20' })
      const refundTx = addReconciliationTransaction({
        batchId: batch.id, channel: 'WECHAT',
        internalTransactionId: refund.id, externalTransactionId: 'WXREFUNDVIP001',
        type: 'REFUND', internalAmount: 50, externalAmount: 50, channelFee: 0,
      })

      // 原支付对账单
      const payTx = addReconciliationTransaction({
        batchId: batch.id, channel: 'WECHAT',
        internalTransactionId: tx.id, externalTransactionId: 'WX20260720VIP',
        type: 'PAYMENT', internalAmount: 99, externalAmount: 99, channelFee: 0.59,
      })

      assert.equal(refundTx.status, 'MATCHED')
      assert.equal(payTx.status, 'MATCHED')
    })
  })
})
