/**
 * finance-reconciliation.controller.spec.ts — P-38 对账 Controller 测试
 *
 * Mock Service + NestJS TestingModule
 * 三件套: 正例(正常CRUD) + 反例(404/错误参数) + 边界(空列表/分页)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'reflect-metadata'
import { Test, type TestingModule } from '@nestjs/testing'
import { FinanceReconciliationController } from './finance-reconciliation.controller'
import { FinanceReconciliationService } from './finance-reconciliation.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import type { ReconciliationBatch, ReconciliationTransaction, BatchProgress, ReconciliationSummary, MatchingResult } from './types'
import { ReconciliationChannel, ReconciliationStatus } from './dto/create-reconciliation.dto'

// ═══════════════════════════════════════════════════════════════
// Mock Data
// ═══════════════════════════════════════════════════════════════

const defaultCtx: RequestTenantContext = { tenantId: 't-1', storeId: 's-001' }

const mockBatch: ReconciliationBatch = {
  id: 'rc-001',
  tenantId: 't-1',
  batchNo: 'RC-WECHAT-20260711-ABCD',
  channel: 'WECHAT',
  date: '2026-07-11',
  totalTransactions: 10,
  matchedCount: 8,
  mismatchedCount: 1,
  unmatchedInternalCount: 1,
  unmatchedExternalCount: 0,
  totalDifference: 500,
  totalFee: 200,
  status: 'MATCHED',
  completedAt: '2026-07-11T06:00:00.000Z',
  createdAt: '2026-07-11T00:00:00.000Z',
  processedAt: '2026-07-11T00:00:00.000Z',
}

const mockPendingBatch: ReconciliationBatch = {
  ...mockBatch,
  id: 'rc-002',
  status: 'PENDING',
  totalTransactions: 0,
  matchedCount: 0,
  mismatchedCount: 0,
  unmatchedInternalCount: 0,
  unmatchedExternalCount: 0,
  totalDifference: 0,
  totalFee: 0,
  completedAt: undefined,
}

const mockBatchList: ReconciliationBatch[] = [
  mockBatch,
  { ...mockPendingBatch, id: 'rc-003', channel: 'ALIPAY', batchNo: 'RC-ALIPAY-20260711-EFGH' },
  { ...mockPendingBatch, id: 'rc-004', channel: 'BANK', batchNo: 'RC-BANK-20260710-IJKL' },
]

const mockTransaction: ReconciliationTransaction = {
  id: 'txn-001',
  tenantId: 't-1',
  storeId: 's-001',
  internalTransactionId: 'int-001',
  externalTransactionId: 'ext-001',
  channel: 'WECHAT',
  channelTransactionNo: 'wx-txn-001',
  type: 'PAYMENT',
  internalAmount: 10000,
  externalAmount: 10000,
  difference: 0,
  internalTime: '2026-07-11T00:00:00.000Z',
  externalTime: '2026-07-11T00:01:00.000Z',
  channelFee: 60,
  netAmount: 9940,
  status: 'MATCHED',
  createdAt: '2026-07-11T00:00:00.000Z',
  updatedAt: '2026-07-11T00:00:00.000Z',
  reconciledAt: '2026-07-11T01:00:00.000Z',
}

const mockMismatchedTransaction: ReconciliationTransaction = {
  ...mockTransaction,
  id: 'txn-002',
  internalTransactionId: 'int-002',
  externalTransactionId: 'ext-002',
  internalAmount: 5000,
  externalAmount: 4800,
  difference: -200,
  channelFee: 30,
  netAmount: 4770,
  status: 'MISMATCHED',
}

const mockTransactionList: ReconciliationTransaction[] = [
  mockTransaction,
  mockMismatchedTransaction,
  { ...mockTransaction, id: 'txn-003', type: 'REFUND', externalTransactionId: 'ext-003', internalAmount: 2000, externalAmount: 2000, difference: 0, channelFee: 0 },
]

const mockProgress: BatchProgress = {
  batchId: 'rc-001',
  batchNo: 'RC-WECHAT-20260711-ABCD',
  channel: 'WECHAT',
  date: '2026-07-11',
  total: 10,
  processed: 9,
  progress: 90,
  status: 'MATCHED',
  startedAt: '2026-07-11T00:00:00.000Z',
}

const mockSummary: ReconciliationSummary = {
  batchId: 'rc-001',
  batchNo: 'RC-WECHAT-20260711-ABCD',
  channel: 'WECHAT',
  date: '2026-07-11',
  totalCount: 10,
  matchedCount: 8,
  matchedRate: 80,
  mismatchedCount: 1,
  unmatchedInternalCount: 1,
  unmatchedExternalCount: 0,
  totalInternalAmount: 0,
  totalExternalAmount: 0,
  totalDifference: 500,
  totalFee: 200,
  status: 'MATCHED',
}

const mockStats = {
  totalBatches: 3,
  totalTransactions: 3,
  matchedCount: 2,
  mismatchedCount: 1,
  matchRate: 66.67,
  totalDifference: 200,
  totalFee: 90,
  channelBreakdown: [
    { channel: 'WECHAT', total: 2, matched: 1, mismatched: 1, difference: 200 },
    { channel: 'ALIPAY', total: 1, matched: 1, mismatched: 0, difference: 0 },
  ],
}

// ═══════════════════════════════════════════════════════════════
// Mock Service
// ═══════════════════════════════════════════════════════════════

class MockReconciliationService {
  createReconciliationBatch = vi.fn().mockReturnValue(mockPendingBatch)
  listReconciliationBatches = vi.fn().mockReturnValue(mockBatchList)
  getReconciliationBatch = vi.fn().mockReturnValue(mockBatch)
  completeReconciliationBatch = vi.fn().mockReturnValue(mockBatch)
  getBatchProgress = vi.fn().mockReturnValue(mockProgress)
  getReconciliationSummary = vi.fn().mockReturnValue(mockSummary)
  createReconciliationTransaction = vi.fn().mockReturnValue(mockTransaction)
  listReconciliationTransactions = vi.fn().mockReturnValue(mockTransactionList)
  getReconciliationTransaction = vi.fn().mockReturnValue(mockTransaction)
  updateReconciliationTransaction = vi.fn().mockReturnValue(mockMismatchedTransaction)
  autoMatch = vi.fn().mockReturnValue([
    { transactionId: 'txn-001', status: 'MATCHED', difference: 0 } as MatchingResult,
  ])
  manualMatch = vi.fn().mockReturnValue({ ...mockTransaction, status: 'MATCHED' })
  manualAdjustment = vi.fn().mockReturnValue({ ...mockMismatchedTransaction, difference: 0, status: 'MATCHED' })
  importExternalTransactions = vi.fn().mockReturnValue([mockTransaction])
  getReconciliationStats = vi.fn().mockReturnValue(mockStats)
  getReconciliationChannels = vi.fn().mockReturnValue(Object.values(ReconciliationChannel))
}

// ═══════════════════════════════════════════════════════════════
// Test Suite
// ═══════════════════════════════════════════════════════════════

describe('FinanceReconciliationController', () => {
  let ctrl: FinanceReconciliationController
  let mockSvc: MockReconciliationService

  beforeEach(async () => {
    mockSvc = new MockReconciliationService()
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinanceReconciliationController],
      providers: [
        { provide: FinanceReconciliationService, useValue: mockSvc },
      ],
    }).compile()
    ctrl = module.get(FinanceReconciliationController)
  })

  // ═══════════════════════════════════════════════════════════════
  // 路由元数据
  // ═══════════════════════════════════════════════════════════════

  it('ROUTE-1: 控制器路径前缀 /finance/reconciliation', () => {
    const path = Reflect.getMetadata('path', FinanceReconciliationController)
    expect(path).toBe('finance/reconciliation')
  })

  it('ROUTE-2: 暴露全部 16 个处理方法', () => {
    const proto = FinanceReconciliationController.prototype
    expect(typeof proto.createBatch).toBe('function')
    expect(typeof proto.listBatches).toBe('function')
    expect(typeof proto.getBatch).toBe('function')
    expect(typeof proto.completeBatch).toBe('function')
    expect(typeof proto.getBatchProgress).toBe('function')
    expect(typeof proto.getBatchSummary).toBe('function')
    expect(typeof proto.createTransaction).toBe('function')
    expect(typeof proto.listTransactions).toBe('function')
    expect(typeof proto.getTransaction).toBe('function')
    expect(typeof proto.updateTransaction).toBe('function')
    expect(typeof proto.autoMatch).toBe('function')
    expect(typeof proto.manualMatch).toBe('function')
    expect(typeof proto.manualAdjustment).toBe('function')
    expect(typeof proto.importExternalTransactions).toBe('function')
    expect(typeof proto.getReconciliationStats).toBe('function')
    expect(typeof proto.getChannels).toBe('function')
  })

  // ═══════════════════════════════════════════════════════════════
  // 正例 — 批次管理
  // ═══════════════════════════════════════════════════════════════

  it('FLOW-1: createBatch → 创建对账批次成功', () => {
    const body = { channel: ReconciliationChannel.WECHAT, date: '2026-07-11' }
    const result = ctrl.createBatch(defaultCtx, body)
    expect(result).toEqual(mockPendingBatch)
    expect(mockSvc.createReconciliationBatch).toHaveBeenCalledWith(defaultCtx, body)
  })

  it('FLOW-2: createBatch → 支持 ALIPAY 渠道', () => {
    const body = { channel: ReconciliationChannel.ALIPAY, date: '2026-07-11' }
    ctrl.createBatch(defaultCtx, body)
    expect(mockSvc.createReconciliationBatch).toHaveBeenCalledWith(defaultCtx, body)
  })

  it('FLOW-3: createBatch → 支持 BANK 渠道', () => {
    const body = { channel: ReconciliationChannel.BANK, date: '2026-07-11' }
    ctrl.createBatch(defaultCtx, body)
    expect(mockSvc.createReconciliationBatch).toHaveBeenCalledWith(defaultCtx, body)
  })

  it('FLOW-4: createBatch → 支持 CASH / CARD 渠道', () => {
    const body1 = { channel: ReconciliationChannel.CASH, date: '2026-07-11' }
    const body2 = { channel: ReconciliationChannel.CARD, date: '2026-07-11' }
    ctrl.createBatch(defaultCtx, body1)
    ctrl.createBatch(defaultCtx, body2)
    expect(mockSvc.createReconciliationBatch).toHaveBeenCalledTimes(2)
  })

  it('FLOW-5: listBatches → 返回批次列表', () => {
    const result = ctrl.listBatches(defaultCtx, {})
    expect(result).toHaveLength(3)
    expect(mockSvc.listReconciliationBatches).toHaveBeenCalledWith(defaultCtx, {})
  })

  it('FLOW-6: listBatches → 按渠道过滤', () => {
    mockSvc.listReconciliationBatches.mockReturnValueOnce([mockBatchList[0]])
    const query = { channel: ReconciliationChannel.WECHAT }
    const result = ctrl.listBatches(defaultCtx, query)
    expect(result).toHaveLength(1)
    expect(result[0].channel).toBe('WECHAT')
    expect(mockSvc.listReconciliationBatches).toHaveBeenCalledWith(defaultCtx, query)
  })

  it('FLOW-7: listBatches → 按状态过滤', () => {
    mockSvc.listReconciliationBatches.mockReturnValueOnce([mockPendingBatch])
    const query = { status: ReconciliationStatus.PENDING }
    const result = ctrl.listBatches(defaultCtx, query)
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('PENDING')
    expect(mockSvc.listReconciliationBatches).toHaveBeenCalledWith(defaultCtx, query)
  })

  it('FLOW-8: listBatches → 分页参数', () => {
    mockSvc.listReconciliationBatches.mockReturnValueOnce([mockBatchList[0]])
    const query = { limit: 1, offset: 1, channel: ReconciliationChannel.WECHAT }
    const result = ctrl.listBatches(defaultCtx, query)
    expect(result).toHaveLength(1)
    expect(mockSvc.listReconciliationBatches).toHaveBeenCalledWith(defaultCtx, query)
  })

  it('FLOW-9: getBatch → 获取批次详情', () => {
    const result = ctrl.getBatch('rc-001', defaultCtx)
    expect(result).toEqual(mockBatch)
    expect(mockSvc.getReconciliationBatch).toHaveBeenCalledWith('rc-001', defaultCtx)
  })

  it('FLOW-10: completeBatch → 完成批次', () => {
    const result = ctrl.completeBatch('rc-001', defaultCtx)
    expect(result.status).toBe('MATCHED')
    expect(mockSvc.completeReconciliationBatch).toHaveBeenCalledWith('rc-001', defaultCtx)
  })

  it('FLOW-11: getBatchProgress → 获取批次进度', () => {
    const result = ctrl.getBatchProgress('rc-001', defaultCtx)
    expect(result.progress).toBe(90)
    expect(mockSvc.getBatchProgress).toHaveBeenCalledWith('rc-001', defaultCtx)
  })

  it('FLOW-12: getBatchSummary → 获取批次汇总', () => {
    const result = ctrl.getBatchSummary('rc-001', defaultCtx)
    expect(result.matchedRate).toBe(80)
    expect(mockSvc.getReconciliationSummary).toHaveBeenCalledWith('rc-001', defaultCtx)
  })

  // ═══════════════════════════════════════════════════════════════
  // 正例 — 交易管理
  // ═══════════════════════════════════════════════════════════════

  it('FLOW-13: createTransaction → 创建对账交易', () => {
    const body = {
      channel: ReconciliationChannel.WECHAT,
      internalTransactionId: 'int-001',
      channelTransactionNo: 'wx-txn-001',
      type: 'PAYMENT' as const,
      internalAmount: 10000,
      channelFee: 60,
    }
    const result = ctrl.createTransaction(defaultCtx, body)
    expect(result).toEqual(mockTransaction)
    expect(mockSvc.createReconciliationTransaction).toHaveBeenCalledWith(defaultCtx, body)
  })

  it('FLOW-14: listTransactions → 返回交易列表', () => {
    const result = ctrl.listTransactions(defaultCtx, {})
    expect(result).toHaveLength(3)
    expect(mockSvc.listReconciliationTransactions).toHaveBeenCalledWith(defaultCtx, {})
  })

  it('FLOW-15: listTransactions → 按状态过滤', () => {
    mockSvc.listReconciliationTransactions.mockReturnValueOnce([mockMismatchedTransaction])
    const result = ctrl.listTransactions(defaultCtx, { status: ReconciliationStatus.MISMATCHED })
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('MISMATCHED')
  })

  it('FLOW-16: listTransactions → 按渠道过滤', () => {
    mockSvc.listReconciliationTransactions.mockReturnValueOnce([mockTransaction])
    const result = ctrl.listTransactions(defaultCtx, { channel: ReconciliationChannel.WECHAT })
    expect(result).toHaveLength(1)
    expect(result[0].channel).toBe('WECHAT')
  })

  it('FLOW-17: getTransaction → 获取交易详情', () => {
    const result = ctrl.getTransaction('txn-001', defaultCtx)
    expect(result).toEqual(mockTransaction)
    expect(mockSvc.getReconciliationTransaction).toHaveBeenCalledWith('txn-001', defaultCtx)
  })

  it('FLOW-18: updateTransaction → 更新交易状态（差异修复）', () => {
    const body = { status: ReconciliationStatus.MATCHED, externalAmount: 5000, channelFee: 30 }
    const result = ctrl.updateTransaction('txn-002', defaultCtx, body)
    expect(result.status).toBe('MISMATCHED')
    expect(mockSvc.updateReconciliationTransaction).toHaveBeenCalledWith('txn-002', defaultCtx, body)
  })

  // ═══════════════════════════════════════════════════════════════
  // 正例 — 匹配与调账
  // ═══════════════════════════════════════════════════════════════

  it('FLOW-19: autoMatch → 自动匹配', () => {
    const body = {
      externalTransactions: [
        { channelTransactionNo: 'ext-001', amount: 10000, channelFee: 60, transactionTime: '2026-07-11T00:01:00.000Z' },
      ],
    }
    const result = ctrl.autoMatch('rc-001', defaultCtx, body)
    expect(result).toHaveLength(1)
    expect(mockSvc.autoMatch).toHaveBeenCalledWith('rc-001', defaultCtx, body.externalTransactions)
  })

  it('FLOW-20: manualMatch → 手动匹配', () => {
    const body = {
      transactionId: 'txn-002',
      externalTransactionId: 'ext-002-fixed',
      externalAmount: 5000,
      memo: '手动匹配修复',
    }
    const result = ctrl.manualMatch(defaultCtx, body)
    expect(result.status).toBe('MATCHED')
    expect(mockSvc.manualMatch).toHaveBeenCalledWith(defaultCtx, body)
  })

  it('FLOW-21: manualAdjustment → 手动调账', () => {
    const body = { transactionId: 'txn-002', difference: 0, reason: '汇率差异' }
    const result = ctrl.manualAdjustment(defaultCtx, body)
    expect(result.difference).toBe(0)
    expect(mockSvc.manualAdjustment).toHaveBeenCalledWith(defaultCtx, body)
  })

  // ═══════════════════════════════════════════════════════════════
  // 正例 — 导入与统计
  // ═══════════════════════════════════════════════════════════════

  it('FLOW-22: importExternalTransactions → 批量导入', () => {
    const body = {
      channel: ReconciliationChannel.WECHAT,
      transactions: [
        { channelTransactionNo: 'ext-003', amount: 3000, channelFee: 18, type: 'PAYMENT' as const, transactionTime: '2026-07-11T00:00:00.000Z' },
        { channelTransactionNo: 'ext-004', amount: 1500, channelFee: 9, type: 'REFUND' as const, transactionTime: '2026-07-11T00:05:00.000Z' },
      ],
    }
    const result = ctrl.importExternalTransactions(defaultCtx, body)
    expect(Array.isArray(result)).toBe(true)
    expect(mockSvc.importExternalTransactions).toHaveBeenCalledWith(
      defaultCtx, body.channel, body.transactions,
    )
  })

  it('FLOW-23: getReconciliationStats → 获取统计', () => {
    const result = ctrl.getReconciliationStats(defaultCtx, {})
    expect(result.totalBatches).toBe(3)
    expect(result.totalTransactions).toBe(3)
    expect(result.matchRate).toBeCloseTo(66.67, 1)
    expect(mockSvc.getReconciliationStats).toHaveBeenCalledWith(defaultCtx, {})
  })

  it('FLOW-24: getReconciliationStats → 按渠道过滤统计', () => {
    mockSvc.getReconciliationStats.mockReturnValueOnce({
      ...mockStats,
      totalBatches: 1,
      totalTransactions: 2,
      channelBreakdown: mockStats.channelBreakdown.slice(0, 1),
    })
    const result = ctrl.getReconciliationStats(defaultCtx, { channel: ReconciliationChannel.WECHAT })
    expect(result.totalBatches).toBe(1)
    expect(mockSvc.getReconciliationStats).toHaveBeenCalledWith(defaultCtx, { channel: ReconciliationChannel.WECHAT })
  })

  it('FLOW-25: getChannels → 获取所有渠道', () => {
    const result = ctrl.getChannels()
    expect(result).toContain(ReconciliationChannel.WECHAT)
    expect(result).toContain(ReconciliationChannel.ALIPAY)
    expect(result).toContain(ReconciliationChannel.BANK)
    expect(result).toContain(ReconciliationChannel.CASH)
    expect(result).toContain(ReconciliationChannel.CARD)
    expect(mockSvc.getReconciliationChannels).toHaveBeenCalled()
  })

  // ═══════════════════════════════════════════════════════════════
  // 反例
  // ═══════════════════════════════════════════════════════════════

  it('DEF-1: getBatch → 不存在的批次', () => {
    mockSvc.getReconciliationBatch.mockImplementation(() => { throw new Error('Reconciliation batch ghost not found') })
    expect(() => ctrl.getBatch('ghost', defaultCtx)).toThrow('not found')
    expect(mockSvc.getReconciliationBatch).toHaveBeenCalledWith('ghost', defaultCtx)
  })

  it('DEF-2: completeBatch → 不存在的批次', () => {
    mockSvc.completeReconciliationBatch.mockImplementation(() => { throw new Error('Reconciliation batch ghost not found') })
    expect(() => ctrl.completeBatch('ghost', defaultCtx)).toThrow('not found')
    expect(mockSvc.completeReconciliationBatch).toHaveBeenCalledWith('ghost', defaultCtx)
  })

  it('DEF-3: getBatchProgress → 不存在的批次', () => {
    mockSvc.getBatchProgress.mockImplementation(() => { throw new Error('Reconciliation batch ghost not found') })
    expect(() => ctrl.getBatchProgress('ghost', defaultCtx)).toThrow('not found')
    expect(mockSvc.getBatchProgress).toHaveBeenCalledWith('ghost', defaultCtx)
  })

  it('DEF-4: getBatchSummary → 不存在的批次', () => {
    mockSvc.getReconciliationSummary.mockImplementation(() => { throw new Error('Reconciliation batch ghost not found') })
    expect(() => ctrl.getBatchSummary('ghost', defaultCtx)).toThrow('not found')
    expect(mockSvc.getReconciliationSummary).toHaveBeenCalledWith('ghost', defaultCtx)
  })

  it('DEF-5: getTransaction → 不存在的交易', () => {
    mockSvc.getReconciliationTransaction.mockImplementation(() => { throw new Error('Reconciliation transaction ghost not found') })
    expect(() => ctrl.getTransaction('ghost', defaultCtx)).toThrow('not found')
    expect(mockSvc.getReconciliationTransaction).toHaveBeenCalledWith('ghost', defaultCtx)
  })

  it('DEF-6: updateTransaction → 不存在的交易', () => {
    mockSvc.updateReconciliationTransaction.mockImplementation(() => { throw new Error('Reconciliation transaction ghost not found') })
    expect(() => ctrl.updateTransaction('ghost', defaultCtx, {})).toThrow('not found')
    expect(mockSvc.updateReconciliationTransaction).toHaveBeenCalledWith('ghost', defaultCtx, {})
  })

  it('DEF-7: getBatch → 不同租户无权限', () => {
    const otherCtx: RequestTenantContext = { tenantId: 't-other' }
    mockSvc.getReconciliationBatch.mockImplementation(() => { throw new Error('Reconciliation batch rc-001 not found') })
    expect(() => ctrl.getBatch('rc-001', otherCtx)).toThrow('not found')
    expect(mockSvc.getReconciliationBatch).toHaveBeenCalledWith('rc-001', otherCtx)
  })

  it('DEF-8: getTransaction → 不同租户无权限', () => {
    const otherCtx: RequestTenantContext = { tenantId: 't-other' }
    mockSvc.getReconciliationTransaction.mockImplementation(() => { throw new Error('Reconciliation transaction txn-001 not found') })
    expect(() => ctrl.getTransaction('txn-001', otherCtx)).toThrow('not found')
    expect(mockSvc.getReconciliationTransaction).toHaveBeenCalledWith('txn-001', otherCtx)
  })

  it('DEF-9: manualMatch → 不存在的交易', () => {
    const body = { transactionId: 'ghost', externalTransactionId: 'ext-fix' }
    mockSvc.manualMatch.mockImplementation(() => { throw new Error('Reconciliation transaction ghost not found') })
    expect(() => ctrl.manualMatch(defaultCtx, body)).toThrow('not found')
    expect(mockSvc.manualMatch).toHaveBeenCalledWith(defaultCtx, body)
  })

  it('DEF-10: manualAdjustment → 不存在的交易', () => {
    const body = { transactionId: 'ghost', difference: 0, reason: 'test' }
    mockSvc.manualAdjustment.mockImplementation(() => { throw new Error('Reconciliation transaction ghost not found') })
    expect(() => ctrl.manualAdjustment(defaultCtx, body)).toThrow('not found')
    expect(mockSvc.manualAdjustment).toHaveBeenCalledWith(defaultCtx, body)
  })

  // ═══════════════════════════════════════════════════════════════
  // 边界
  // ═══════════════════════════════════════════════════════════════

  it('EDGE-1: listBatches → 空列表', () => {
    mockSvc.listReconciliationBatches.mockReturnValueOnce([])
    const result = ctrl.listBatches(defaultCtx, {})
    expect(result).toHaveLength(0)
    expect(mockSvc.listReconciliationBatches).toHaveBeenCalledWith(defaultCtx, {})
  })

  it('EDGE-2: listTransactions → 空列表', () => {
    mockSvc.listReconciliationTransactions.mockReturnValueOnce([])
    const result = ctrl.listTransactions(defaultCtx, {})
    expect(result).toHaveLength(0)
    expect(mockSvc.listReconciliationTransactions).toHaveBeenCalledWith(defaultCtx, {})
  })

  it('EDGE-3: listBatches → 不存在的渠道过滤返回空', () => {
    mockSvc.listReconciliationBatches.mockReturnValueOnce([])
    const result = ctrl.listBatches(defaultCtx, { channel: 'BITCOIN' as ReconciliationChannel })
    expect(result).toHaveLength(0)
    expect(mockSvc.listReconciliationBatches).toHaveBeenCalledWith(defaultCtx, { channel: 'BITCOIN' as ReconciliationChannel })
  })

  it('EDGE-4: autoMatch → 空外部交易列表', () => {
    mockSvc.autoMatch.mockReturnValueOnce([])
    const body = { externalTransactions: [] }
    const result = ctrl.autoMatch('rc-001', defaultCtx, body)
    expect(result).toHaveLength(0)
    expect(mockSvc.autoMatch).toHaveBeenCalledWith('rc-001', defaultCtx, [])
  })

  it('EDGE-5: importExternalTransactions → 空导入列表', () => {
    mockSvc.importExternalTransactions.mockReturnValueOnce([])
    const body = { channel: ReconciliationChannel.WECHAT, transactions: [] }
    const result = ctrl.importExternalTransactions(defaultCtx, body)
    expect(result).toHaveLength(0)
    expect(mockSvc.importExternalTransactions).toHaveBeenCalledWith(defaultCtx, body.channel, [])
  })

  it('EDGE-6: getBatchProgress → 未开始批次的进度为 0', () => {
    const pendingProgress: BatchProgress = {
      ...mockProgress,
      total: 0,
      processed: 0,
      progress: 0,
      status: 'PENDING',
      batchId: 'rc-002',
      batchNo: mockPendingBatch.batchNo,
    }
    mockSvc.getBatchProgress.mockReturnValueOnce(pendingProgress)
    const result = ctrl.getBatchProgress('rc-002', defaultCtx)
    expect(result.total).toBe(0)
    expect(result.progress).toBe(0)
    expect(mockSvc.getBatchProgress).toHaveBeenCalledWith('rc-002', defaultCtx)
  })

  it('EDGE-7: getReconciliationStats → 零交易的统计', () => {
    const emptyStats = {
      totalBatches: 1,
      totalTransactions: 0,
      matchedCount: 0,
      mismatchedCount: 0,
      matchRate: 100,
      totalDifference: 0,
      totalFee: 0,
      channelBreakdown: [],
    }
    mockSvc.getReconciliationStats.mockReturnValueOnce(emptyStats)
    const result = ctrl.getReconciliationStats(defaultCtx, {})
    expect(result.totalTransactions).toBe(0)
    expect(result.matchRate).toBe(100)
    expect(result.channelBreakdown).toHaveLength(0)
  })
})
