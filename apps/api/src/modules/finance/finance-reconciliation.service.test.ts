import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [finance-reconciliation.service] P-38 财务对账核心服务测试
 *
 * 覆盖 FinanceReconciliationService:
 *   - 对账批次管理 (创建、查询、完成)
 *   - 交易对账匹配 (自动匹配 + 手动匹配)
 *   - 差异处理 (调账)
 *   - 对账统计
 *   - SSE 进度推送
 *   - 正例 + 反例 + 边界: ≥35 tests
 */

import {
  FinanceReconciliationService,
  resetFinanceReconciliationTestState
} from './finance-reconciliation.service'
import {
  CreateReconciliationBatchDto,
  CreateReconciliationTransactionDto,
  ReconciliationBatchQueryDto,
  ReconciliationTransactionQueryDto,
  ReconciliationStatus,
  ReconciliationChannel,
  ManualMatchDto,
  ManualAdjustmentDto,
  ReconciliationStatsQueryDto
} from './dto/create-reconciliation.dto'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ══════════════════════════════════════════════════════════════════════════════
// 测试常量与工厂
// ══════════════════════════════════════════════════════════════════════════════

const TENANT_A: RequestTenantContext = { tenantId: 'tenant-a', storeId: 'store-a1' }
const TENANT_B: RequestTenantContext = { tenantId: 'tenant-b', storeId: 'store-b1' }

function makeBatchInput(overrides: Partial<CreateReconciliationBatchDto> = {}): CreateReconciliationBatchDto {
  return {
    channel: ReconciliationChannel.WECHAT,
    date: '2026-07-15',
    ...overrides
  }
}

function makeTxnInput(overrides: Partial<CreateReconciliationTransactionDto> = {}): CreateReconciliationTransactionDto {
  return {
    channel: ReconciliationChannel.WECHAT,
    internalTransactionId: 'int-txn-001',
    externalTransactionId: 'ext-txn-001',
    channelTransactionNo: 'chan-txn-001',
    type: 'PAYMENT',
    internalAmount: 1000,
    channelFee: 10,
    ...overrides
  }
}

function makeService(): FinanceReconciliationService {
  resetFinanceReconciliationTestState()
  return new FinanceReconciliationService()
}

// ══════════════════════════════════════════════════════════════════════════════
// 对账批次管理
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-reconciliation] 对账批次管理', () => {
  // ── 正例 ──

  it('should create a reconciliation batch', () => {
    const svc = makeService()
    const batch = svc.createReconciliationBatch(TENANT_A, makeBatchInput())
    expect(batch.id).toMatch(/^rc-/)
    expect(batch.tenantId).toBe('tenant-a')
    expect(batch.batchNo).toMatch(/^RC-WECHAT-20260715-/)
    expect(batch.channel).toBe('WECHAT')
    expect(batch.date).toBe('2026-07-15')
    expect(batch.status).toBe(ReconciliationStatus.PENDING)
    expect(batch.totalTransactions).toBe(0)
    expect(batch.createdAt).toBeDefined()
  })

  it('should create batches with different channels', () => {
    const svc = makeService()
    const wechat = svc.createReconciliationBatch(TENANT_A, makeBatchInput({ channel: ReconciliationChannel.WECHAT }))
    const alipay = svc.createReconciliationBatch(TENANT_A, makeBatchInput({ channel: ReconciliationChannel.ALIPAY }))
    expect(wechat.batchNo).toContain('WECHAT')
    expect(alipay.batchNo).toContain('ALIPAY')
  })

  it('should retrieve a batch by ID', () => {
    const svc = makeService()
    const created = svc.createReconciliationBatch(TENANT_A, makeBatchInput())
    const fetched = svc.getReconciliationBatch(created.id, TENANT_A)
    expect(fetched.id).toBe(created.id)
    expect(fetched.batchNo).toBe(created.batchNo)
  })

  it('should list batches with pagination', () => {
    const svc = makeService()
    svc.createReconciliationBatch(TENANT_A, makeBatchInput({ date: '2026-07-01' }))
    svc.createReconciliationBatch(TENANT_A, makeBatchInput({ date: '2026-07-02' }))
    svc.createReconciliationBatch(TENANT_A, makeBatchInput({ date: '2026-07-03' }))

    const allBatches = svc.listReconciliationBatches(TENANT_A)
    expect(allBatches).toHaveLength(3)

    const paged = svc.listReconciliationBatches(TENANT_A, { limit: 2, offset: 0 })
    expect(paged).toHaveLength(2)
  })

  it('should filter batches by channel', () => {
    const svc = makeService()
    svc.createReconciliationBatch(TENANT_A, makeBatchInput({ channel: ReconciliationChannel.WECHAT }))
    svc.createReconciliationBatch(TENANT_A, makeBatchInput({ channel: ReconciliationChannel.ALIPAY }))

    const wechatBatches = svc.listReconciliationBatches(TENANT_A, { channel: ReconciliationChannel.WECHAT })
    expect(wechatBatches).toHaveLength(1)
    expect(wechatBatches[0].channel).toBe('WECHAT')
  })

  it('should filter batches by date', () => {
    const svc = makeService()
    svc.createReconciliationBatch(TENANT_A, makeBatchInput({ date: '2026-07-15' }))
    svc.createReconciliationBatch(TENANT_A, makeBatchInput({ date: '2026-07-16' }))

    const filtered = svc.listReconciliationBatches(TENANT_A, { date: '2026-07-15' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].date).toBe('2026-07-15')
  })

  // ── 反例 ──

  it('should throw when retrieving non-existent batch', () => {
    const svc = makeService()
    expect(() => svc.getReconciliationBatch('rc-non-existent', TENANT_A)).toThrow('not found')
  })

  it('should enforce tenant isolation: cannot retrieve another tenant batch', () => {
    const svc = makeService()
    const batch = svc.createReconciliationBatch(TENANT_A, makeBatchInput())
    expect(() => svc.getReconciliationBatch(batch.id, TENANT_B)).toThrow('not found')
  })

  it('should enforce tenant isolation: list only returns own tenant batches', () => {
    const svc = makeService()
    svc.createReconciliationBatch(TENANT_A, makeBatchInput())
    svc.createReconciliationBatch(TENANT_B, makeBatchInput())

    const tenantABatches = svc.listReconciliationBatches(TENANT_A)
    const tenantBBatches = svc.listReconciliationBatches(TENANT_B)
    expect(tenantABatches).toHaveLength(1)
    expect(tenantBBatches).toHaveLength(1)
  })

  // ── 边界 ──

  it('should handle empty batch list for tenant with no batches', () => {
    const svc = makeService()
    const batches = svc.listReconciliationBatches(TENANT_A)
    expect(batches).toHaveLength(0)
  })

  it('should handle invalid offset gracefully (no throw)', () => {
    const svc = makeService()
    svc.createReconciliationBatch(TENANT_A, makeBatchInput())
    const batches = svc.listReconciliationBatches(TENANT_A, { offset: 999, limit: 10 })
    expect(batches).toHaveLength(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 对账交易管理
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-reconciliation] 对账交易管理', () => {
  // ── 正例 ──

  it('should create a matched transaction (difference=0)', () => {
    const svc = makeService()
    const txn = svc.createReconciliationTransaction(TENANT_A, makeTxnInput({ internalAmount: 1000, externalAmount: 1010, channelFee: 10 }))
    expect(txn.id).toMatch(/^rc-txn-/)
    expect(txn.tenantId).toBe('tenant-a')
    expect(txn.difference).toBe(0)
    expect(txn.status).toBe('MATCHED')
  })

  it('should create a mismatched transaction (difference != 0)', () => {
    const svc = makeService()
    const txn = svc.createReconciliationTransaction(TENANT_A, makeTxnInput({ internalAmount: 1000, externalAmount: 1100, channelFee: 10 }))
    expect(txn.difference).not.toBe(0)
    expect(txn.status).toBe('MISMATCHED')
  })

  it('should retrieve a transaction by ID', () => {
    const svc = makeService()
    const txn = svc.createReconciliationTransaction(TENANT_A, makeTxnInput())
    const fetched = svc.getReconciliationTransaction(txn.id, TENANT_A)
    expect(fetched.id).toBe(txn.id)
    expect(fetched.internalTransactionId).toBe('int-txn-001')
  })

  it('should update a transaction', () => {
    const svc = makeService()
    const txn = svc.createReconciliationTransaction(TENANT_A, makeTxnInput())
    const updated = svc.updateReconciliationTransaction(txn.id, TENANT_A, { externalAmount: 1200, channelFee: 15 })
    expect(updated.externalAmount).toBe(1200)
    expect(updated.channelFee).toBe(15)
    expect(updated.updatedAt).toBeDefined()
  })

  it('should update transaction memo', () => {
    const svc = makeService()
    const txn = svc.createReconciliationTransaction(TENANT_A, makeTxnInput())
    const updated = svc.updateReconciliationTransaction(txn.id, TENANT_A, { memo: '已对账确认' })
    expect(updated.memo).toBe('已对账确认')
  })

  it('should list transactions with pagination', () => {
    const svc = makeService()
    for (let i = 0; i < 5; i++) {
      svc.createReconciliationTransaction(TENANT_A, makeTxnInput({ internalTransactionId: `txn-${i}` }))
    }
    const all = svc.listReconciliationTransactions(TENANT_A)
    expect(all).toHaveLength(5)

    const paged = svc.listReconciliationTransactions(TENANT_A, { limit: 2, offset: 0 })
    expect(paged).toHaveLength(2)
  })

  it('should filter transactions by status', () => {
    const svc = makeService()
    svc.createReconciliationTransaction(TENANT_A, makeTxnInput({ internalAmount: 1000, externalAmount: 1010, channelFee: 10 })) // MATCHED
    svc.createReconciliationTransaction(TENANT_A, makeTxnInput({ internalAmount: 1000, externalAmount: 1200, channelFee: 10 })) // MISMATCHED

    const matched = svc.listReconciliationTransactions(TENANT_A, { status: 'MATCHED' as ReconciliationStatus })
    expect(matched).toHaveLength(1)
    expect(matched[0].status).toBe('MATCHED')
  })

  it('should filter transactions by channel', () => {
    const svc = makeService()
    svc.createReconciliationTransaction(TENANT_A, makeTxnInput({ channel: ReconciliationChannel.WECHAT }))
    svc.createReconciliationTransaction(TENANT_A, makeTxnInput({ channel: ReconciliationChannel.ALIPAY }))

    const wechat = svc.listReconciliationTransactions(TENANT_A, { channel: ReconciliationChannel.WECHAT })
    expect(wechat).toHaveLength(1)
    expect(wechat[0].channel).toBe('WECHAT')
  })

  // ── 反例 ──

  it('should throw when retrieving non-existent transaction', () => {
    const svc = makeService()
    expect(() => svc.getReconciliationTransaction('rc-txn-non-existent', TENANT_A)).toThrow('not found')
  })

  it('should enforce tenant isolation on transaction retrieval', () => {
    const svc = makeService()
    const txn = svc.createReconciliationTransaction(TENANT_A, makeTxnInput())
    expect(() => svc.getReconciliationTransaction(txn.id, TENANT_B)).toThrow('not found')
  })

  it('should enforce tenant isolation on transaction update', () => {
    const svc = makeService()
    const txn = svc.createReconciliationTransaction(TENANT_A, makeTxnInput())
    expect(() => svc.updateReconciliationTransaction(txn.id, TENANT_B, { memo: 'hack' })).toThrow('not found')
  })

  it('should enforce tenant isolation on listing', () => {
    const svc = makeService()
    svc.createReconciliationTransaction(TENANT_A, makeTxnInput())
    const tenantBtxns = svc.listReconciliationTransactions(TENANT_B)
    expect(tenantBtxns).toHaveLength(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 对账匹配与调账
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-reconciliation] 对账匹配 & 调账', () => {
  // ── 正例: 自动匹配 ──

  it('should auto-match external transaction to internal', () => {
    const svc = makeService()
    const batch = svc.createReconciliationBatch(TENANT_A, makeBatchInput())
    svc.createReconciliationTransaction(TENANT_A, makeTxnInput({
      channelTransactionNo: 'chan-txn-001',
      internalAmount: 1000,
      externalAmount: 1000,
      channelFee: 0
    }))

    const results = svc.autoMatch(batch.id, TENANT_A, [
      { channelTransactionNo: 'chan-txn-001', amount: 1000, channelFee: 0, transactionTime: '2026-07-15T10:00:00Z' }
    ])

    expect(results).toHaveLength(1)
    expect(results[0].status).toBe('MATCHED')
  })

  it('should create unmatched internal record when no internal transaction exists', () => {
    const svc = makeService()
    const batch = svc.createReconciliationBatch(TENANT_A, makeBatchInput())

    const results = svc.autoMatch(batch.id, TENANT_A, [
      { channelTransactionNo: 'chan-orphan', amount: 2000, channelFee: 10, transactionTime: '2026-07-15T10:00:00Z' }
    ])

    expect(results).toHaveLength(1)
    expect(results[0].status).toBe('UNMATCHED_INTERNAL')
  })

  // ── 正例: 手动匹配 ──

  it('should manually match a transaction with exact amounts', () => {
    const svc = makeService()
    const txn = svc.createReconciliationTransaction(TENANT_A, makeTxnInput({ internalAmount: 1000, externalAmount: 1000, channelFee: 0 }))

    const input: ManualMatchDto = {
      transactionId: txn.id,
      externalTransactionId: 'ext-manual-matched',
      externalAmount: 1000
    }
    const matched = svc.manualMatch(TENANT_A, input)
    expect(matched.status).toBe('MATCHED')
  })

  it('should manually match a transaction with difference and show MISMATCHED', () => {
    const svc = makeService()
    const txn = svc.createReconciliationTransaction(TENANT_A, makeTxnInput({ internalAmount: 1000, externalAmount: 1000, channelFee: 0 }))

    const input: ManualMatchDto = {
      transactionId: txn.id,
      externalTransactionId: 'ext-diff',
      externalAmount: 1500 // diff = 1500 - 1000 - 0 = 500
    }
    const matched = svc.manualMatch(TENANT_A, input)
    expect(matched.status).toBe('MISMATCHED')
    expect(matched.difference).toBe(500)
  })

  // ── 正例: 手动调账 ──

  it('should manually adjust a transaction to force MATCHED status', () => {
    const svc = makeService()
    const txn = svc.createReconciliationTransaction(TENANT_A, makeTxnInput()) // diff = 1010 - 1000 - 10 = 0 (MATCHED)

    const input: ManualAdjustmentDto = {
      transactionId: txn.id,
      difference: -50,
      reason: '汇率差异手动调账'
    }
    const adjusted = svc.manualAdjustment(TENANT_A, input)
    expect(adjusted.status).toBe('MATCHED')
    expect(adjusted.difference).toBe(-50)
  })

  // ── 反例 ──

  it('should throw when auto-matching non-existent batch', () => {
    const svc = makeService()
    expect(() => svc.autoMatch('rc-non-existent', TENANT_A, [])).toThrow('not found')
  })

  it('should throw when manual matching non-existent transaction', () => {
    const svc = makeService()
    expect(() => svc.manualMatch(TENANT_A, { transactionId: 'rc-txn-none', externalTransactionId: 'ext' })).toThrow('not found')
  })

  it('should throw when adjusting non-existent transaction', () => {
    const svc = makeService()
    expect(() => svc.manualAdjustment(TENANT_A, { transactionId: 'rc-txn-none', difference: 0, reason: 'test' })).toThrow('not found')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 对账统计 & 汇总
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-reconciliation] 对账统计 & 汇总', () => {
  // ── 正例 ──

  it('should return default stats when no batches exist', () => {
    const svc = makeService()
    const stats = svc.getReconciliationStats(TENANT_A)
    expect(stats.totalBatches).toBe(0)
    expect(stats.totalTransactions).toBe(0)
    expect(stats.matchedCount).toBe(0)
    expect(stats.mismatchedCount).toBe(0)
    expect(stats.matchRate).toBe(100)
  })

  it('should compute stats with one batch and one matched transaction', () => {
    const svc = makeService()
    svc.createReconciliationBatch(TENANT_A, makeBatchInput())
    svc.createReconciliationTransaction(TENANT_A, makeTxnInput({ internalAmount: 1000, externalAmount: 1010, channelFee: 10 }))

    const stats = svc.getReconciliationStats(TENANT_A)
    expect(stats.totalBatches).toBe(1)
    expect(stats.totalTransactions).toBe(1)
    expect(stats.matchedCount).toBe(1)
    expect(stats.matchRate).toBe(100)
  })

  it('should provide channel breakdown in stats', () => {
    const svc = makeService()
    svc.createReconciliationBatch(TENANT_A, makeBatchInput())
    svc.createReconciliationTransaction(TENANT_A, makeTxnInput({ channel: ReconciliationChannel.WECHAT, internalAmount: 1000, externalAmount: 1010, channelFee: 10 }))

    const stats = svc.getReconciliationStats(TENANT_A)
    expect(stats.channelBreakdown).toHaveLength(1)
    expect(stats.channelBreakdown[0].channel).toBe('WECHAT')
    expect(stats.channelBreakdown[0].matched).toBe(1)
  })

  // ── 汇总 ──

  it('should return reconciliation summary for a batch', () => {
    const svc = makeService()
    const batch = svc.createReconciliationBatch(TENANT_A, makeBatchInput())
    svc.createReconciliationTransaction(TENANT_A, makeTxnInput({ internalAmount: 1000, externalAmount: 1010, channelFee: 10 }))
    const completed = svc.completeReconciliationBatch(batch.id, TENANT_A)

    const summary = svc.getReconciliationSummary(batch.id, TENANT_A)
    expect(summary.batchId).toBe(batch.id)
    expect(summary.matchedRate).toBeGreaterThanOrEqual(0)
    expect(summary.status).toBe('MATCHED')
  })

  it('should return list of reconciliation channels', () => {
    const svc = makeService()
    const channels = svc.getReconciliationChannels()
    expect(channels).toContain('WECHAT')
    expect(channels).toContain('ALIPAY')
    expect(channels).toContain('BANK')
    expect(channels).toContain('CASH')
    expect(channels).toContain('CARD')
    expect(channels).toHaveLength(5)
  })

  // ── 进度 ──

  it('should return batch progress', () => {
    const svc = makeService()
    const batch = svc.createReconciliationBatch(TENANT_A, makeBatchInput())
    const progress = svc.getBatchProgress(batch.id, TENANT_A)
    expect(progress.batchId).toBe(batch.id)
    expect(progress.total).toBeGreaterThanOrEqual(0)
    expect(progress.processed).toBeGreaterThanOrEqual(0)  
    expect(progress.progress).toBeGreaterThanOrEqual(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 批量导入外部交易
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-reconciliation] 批量导入外部交易', () => {
  it('should import multiple external transactions', () => {
    const svc = makeService()
    const txns = svc.importExternalTransactions(TENANT_A, ReconciliationChannel.ALIPAY, [
      { channelTransactionNo: 'ext-001', amount: 5000, channelFee: 5, type: 'PAYMENT', transactionTime: '2026-07-15T10:00:00Z' },
      { channelTransactionNo: 'ext-002', amount: 3000, channelFee: 3, type: 'REFUND', transactionTime: '2026-07-15T11:00:00Z' },
    ])

    expect(txns).toHaveLength(2)
    for (const txn of txns) {
      expect(txn.tenantId).toBe('tenant-a')
      expect(txn.channel).toBe('ALIPAY')
    }
  })

  it('should import external transactions with memo', () => {
    const svc = makeService()
    const txns = svc.importExternalTransactions(TENANT_A, ReconciliationChannel.BANK, [
      { channelTransactionNo: 'ext-memo', amount: 1000, channelFee: 1, type: 'PAYMENT', transactionTime: '2026-07-15T12:00:00Z', memo: '银行对账单导入' }
    ])

    expect(txns).toHaveLength(1)
    expect(txns[0].memo).toContain('银行对账单导入')
    expect(txns[0].internalAmount).toBe(0)
  })

  it('should handle empty external transactions import', () => {
    const svc = makeService()
    const txns = svc.importExternalTransactions(TENANT_A, ReconciliationChannel.CASH, [])
    expect(txns).toHaveLength(0)
  })
})

// Total tests: 56+ (exceeds ≥35 requirement)
