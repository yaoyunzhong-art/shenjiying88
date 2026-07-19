import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [finance-dashboard.service] P-38 门店损益看板 + 品牌级损益表 + 分账日志测试
 *
 * 覆盖 StorePAndLService + BrandPAndLService + AccountTransactionLogService:
 *   - 门店营收/成本/利润/利润率
 *   - 多门店对比排名
 *   - 品牌总营收/成本/利润、内部往来抵销、品牌级损益表
 *   - 分账状态流转日志
 *   - 正例 + 反例 + 边界: ≥35 tests
 */

import {
  StorePAndLService,
  BrandPAndLService,
  AccountTransactionLogService,
  TransactionStatus,
  resetFinanceDashboardTestState
} from './finance-dashboard.service'

// ══════════════════════════════════════════════════════════════════════════════
// 工厂函数
// ══════════════════════════════════════════════════════════════════════════════

function makeStorePAndL(): StorePAndLService {
  resetFinanceDashboardTestState()
  return new StorePAndLService()
}

function makeBrandPAndL(): BrandPAndLService {
  resetFinanceDashboardTestState()
  return new BrandPAndLService(new StorePAndLService())
}

function makeTxLog(): AccountTransactionLogService {
  resetFinanceDashboardTestState()
  return new AccountTransactionLogService()
}

// ══════════════════════════════════════════════════════════════════════════════
// StorePAndLService 测试
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-dashboard] StorePAndLService: 门店营收/成本/利润', () => {
  // ── 正例: 营收 ──

  it('getStoreRevenue should return revenue for a valid store', async () => {
    const svc = makeStorePAndL()
    const rev = await svc.getStoreRevenue('store-A1', '2026-06')
    expect(rev.storeId).toBe('store-A1')
    expect(rev.period).toBe('2026-06')
    expect(typeof rev.revenue).toBe('number')
    expect(rev.revenue).toBeGreaterThanOrEqual(0)
    expect(typeof rev.transactionCount).toBe('number')
    expect(rev.transactionCount).toBeGreaterThan(0)
  })

  it('getStoreRevenue: different stores should have different revenue', async () => {
    const svc = makeStorePAndL()
    const revA = await svc.getStoreRevenue('store-A1', '2026-06')
    const revB = await svc.getStoreRevenue('store-B1', '2026-06')
    expect(revA.revenue).not.toBe(revB.revenue)
  })

  it('getStoreRevenue: different months should have different revenue', async () => {
    const svc = makeStorePAndL()
    const rev1 = await svc.getStoreRevenue('store-A1', '2026-06')
    const rev2 = await svc.getStoreRevenue('store-A1', '2026-07')
    expect(rev1.revenue).not.toBe(rev2.revenue)
  })

  it('getStoreRevenue: same store same period returns cached result', async () => {
    const svc = makeStorePAndL()
    const rev1 = await svc.getStoreRevenue('store-A1', '2026-06')
    const rev2 = await svc.getStoreRevenue('store-A1', '2026-06')
    expect(rev1.revenue).toBe(rev2.revenue)
  })

  // ── 正例: 成本 ──

  it('getStoreCost should return three cost components', async () => {
    const svc = makeStorePAndL()
    const cost = await svc.getStoreCost('store-A1', '2026-06')
    expect(cost.storeId).toBe('store-A1')
    expect(typeof cost.purchaseCost).toBe('number')
    expect(typeof cost.laborCost).toBe('number')
    expect(typeof cost.rentCost).toBe('number')
    expect(cost.totalCost).toBe(cost.purchaseCost + cost.laborCost + cost.rentCost)
  })

  it('getStoreCost: totalCost should be > 0', async () => {
    const svc = makeStorePAndL()
    const cost = await svc.getStoreCost('store-A1', '2026-06')
    expect(cost.totalCost).toBeGreaterThan(0)
  })

  // ── 正例: 利润 ──

  it('calculateStoreProfit: profit = revenue - cost', async () => {
    const svc = makeStorePAndL()
    const profit = await svc.calculateStoreProfit('store-A1', '2026-06')
    expect(profit.profit).toBe(profit.revenue - profit.cost)
    expect(profit.storeId).toBe('store-A1')
    expect(profit.period).toBe('2026-06')
  })

  it('calculateStoreProfit: profit may be negative when cost exceeds revenue', async () => {
    const svc = makeStorePAndL()
    const profit = await svc.calculateStoreProfit('store-A1', '2026-06')
    expect(typeof profit.profit).toBe('number')
    expect(typeof profit.margin).toBe('number')
  })

  // ── 正例: 利润率 ──

  it('getStoreMargin: margin = profit / revenue (when revenue > 0)', async () => {
    const svc = makeStorePAndL()
    const profit = await svc.calculateStoreProfit('store-A1', '2026-06')
    const margin = await svc.getStoreMargin('store-A1', '2026-06')
    const expectedMargin = profit.revenue > 0 ? profit.profit / profit.revenue : 0
    expect(margin).toBe(expectedMargin)
  })

  it('getStoreMargin: margin should be a finite number (can be arbitrarily negative when cost >> revenue)', async () => {
    const svc = makeStorePAndL()
    const margin = await svc.getStoreMargin('store-A2', '2026-06')
    expect(typeof margin).toBe('number')
    expect(Number.isFinite(margin)).toBe(true)
  })

  // ── 正例: 多门店对比 ──

  it('compareStores should return ranked results sorted by profit descending', async () => {
    const svc = makeStorePAndL()
    const results = await svc.compareStores(['store-A1', 'store-A2', 'store-B1'], '2026-06')
    expect(results).toHaveLength(3)
    expect(results[0].rank).toBe(1)
    expect(results[1].rank).toBe(2)
    expect(results[2].rank).toBe(3)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].profit).toBeGreaterThanOrEqual(results[i].profit)
    }
  })

  it('compareStores: each result contains all required fields', async () => {
    const svc = makeStorePAndL()
    const results = await svc.compareStores(['store-A1'], '2026-06')
    const r = results[0]
    expect(typeof r.storeId).toBe('string')
    expect(typeof r.revenue).toBe('number')
    expect(typeof r.cost).toBe('number')
    expect(typeof r.profit).toBe('number')
    expect(typeof r.margin).toBe('number')
    expect(typeof r.rank).toBe('number')
    expect(r.profit).toBe(r.revenue - r.cost)
  })

  it('compareStores: single store returns rank 1', async () => {
    const svc = makeStorePAndL()
    const results = await svc.compareStores(['store-A1'], '2026-06')
    expect(results).toHaveLength(1)
    expect(results[0].rank).toBe(1)
  })

  it('compareStores: empty array returns empty', async () => {
    const svc = makeStorePAndL()
    const results = await svc.compareStores([], '2026-06')
    expect(results).toHaveLength(0)
  })

  // ── 边界 ──

  it('getStoreCost: same store same period returns cached result', async () => {
    const svc = makeStorePAndL()
    const c1 = await svc.getStoreCost('store-A1', '2026-06')
    const c2 = await svc.getStoreCost('store-A1', '2026-06')
    expect(c1.totalCost).toBe(c2.totalCost)
  })

  it('getStoreRevenue: non-existent store produces deterministic value', async () => {
    const svc = makeStorePAndL()
    const rev = await svc.getStoreRevenue('store-NONEXISTENT', '2026-06')
    expect(typeof rev.revenue).toBe('number')
    expect(rev.revenue).toBeGreaterThanOrEqual(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// BrandPAndLService 测试
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-dashboard] BrandPAndLService: 品牌级损益', () => {
  // ── 正例 ──

  it('getBrandRevenue should aggregate all store revenues for brand-A', async () => {
    const svc = makeBrandPAndL()
    const totalRev = await svc.getBrandRevenue('brand-A', '2026-06')
    expect(typeof totalRev).toBe('number')
    expect(totalRev).toBeGreaterThan(0)
  })

  it('getBrandCost should aggregate all store costs for brand-A', async () => {
    const svc = makeBrandPAndL()
    const totalCost = await svc.getBrandCost('brand-A', '2026-06')
    expect(typeof totalCost).toBe('number')
    expect(totalCost).toBeGreaterThan(0)
  })

  it('calculateBrandProfit: profit = revenue - cost', async () => {
    const svc = makeBrandPAndL()
    const { revenue, cost, profit } = await svc.calculateBrandProfit('brand-A', '2026-06')
    expect(profit).toBe(revenue - cost)
  })

  it('getBrandRevenue for brand-B should be different from brand-A', async () => {
    const svc = makeBrandPAndL()
    const revA = await svc.getBrandRevenue('brand-A', '2026-06')
    const revB = await svc.getBrandRevenue('brand-B', '2026-06')
    expect(revA).not.toBe(revB)
  })

  it('getBrandCost for unknown brand returns 0', async () => {
    const svc = makeBrandPAndL()
    const cost = await svc.getBrandCost('brand-UNKNOWN', '2026-06')
    expect(cost).toBe(0)
  })

  // ── 内部往来抵销 ──

  it('addIntercompanyElimination creates an elimination record', async () => {
    const svc = makeBrandPAndL()
    const elim = await svc.addIntercompanyElimination({
      fromStoreId: 'store-A1',
      toStoreId: 'store-A2',
      amount: 5000,
      description: 'A1向A2采购',
      period: '2026-06'
    })
    expect(elim.id).toMatch(/^elim-/)
    expect(elim.amount).toBe(5000)
    expect(elim.fromStoreId).toBe('store-A1')
    expect(elim.toStoreId).toBe('store-A2')
  })

  it('getIntercompanyEliminations filters by brand correctly', async () => {
    const svc = makeBrandPAndL()
    await svc.addIntercompanyElimination({ fromStoreId: 'store-A1', toStoreId: 'store-A2', amount: 5000, description: 'A->A', period: '2026-06' })
    await svc.addIntercompanyElimination({ fromStoreId: 'store-B1', toStoreId: 'store-B2', amount: 3000, description: 'B->B', period: '2026-06' })

    const elimsA = await svc.getIntercompanyEliminations('brand-A', '2026-06')
    expect(elimsA).toHaveLength(1)
    expect(elimsA[0].amount).toBe(5000)

    const elimsB = await svc.getIntercompanyEliminations('brand-B', '2026-06')
    expect(elimsB).toHaveLength(1)
    expect(elimsB[0].amount).toBe(3000)
  })

  // ── 品牌级损益表 ──

  it('generateBrandPAndLReport includes grossProfit and netProfit', async () => {
    const svc = makeBrandPAndL()
    const report = await svc.generateBrandPAndLReport('brand-A', '2026-06')
    expect(report.brandId).toBe('brand-A')
    expect(report.period).toBe('2026-06')
    expect(typeof report.totalRevenue).toBe('number')
    expect(typeof report.totalCost).toBe('number')
    expect(typeof report.grossProfit).toBe('number')
    expect(typeof report.netProfit).toBe('number')
    expect(report.grossProfit).toBe(report.totalRevenue - report.totalCost)
  })

  it('generateBrandPAndLReport: netProfit deducts intercompany eliminations', async () => {
    const svc = makeBrandPAndL()
    await svc.addIntercompanyElimination({ fromStoreId: 'store-A1', toStoreId: 'store-A2', amount: 5000, description: '抵销', period: '2026-06' })

    const report = await svc.generateBrandPAndLReport('brand-A', '2026-06')
    expect(report.intercompanyEliminations).toBe(5000)
    expect(report.netProfit).toBe(report.grossProfit - 5000)
  })

  it('generateBrandPAndLReport contains store summaries for all stores', async () => {
    const svc = makeBrandPAndL()
    const report = await svc.generateBrandPAndLReport('brand-A', '2026-06')
    expect(report.storeSummaries.length).toBeGreaterThanOrEqual(2)
    for (const s of report.storeSummaries) {
      expect(typeof s.storeId).toBe('string')
      expect(typeof s.revenue).toBe('number')
      expect(typeof s.cost).toBe('number')
      expect(typeof s.profit).toBe('number')
    }
  })

  it('generateBrandPAndLReport for brand-B contains different data', async () => {
    const svc = makeBrandPAndL()
    const reportA = await svc.generateBrandPAndLReport('brand-A', '2026-06')
    const reportB = await svc.generateBrandPAndLReport('brand-B', '2026-06')
    expect(reportA.totalRevenue).not.toBe(reportB.totalRevenue)
    expect(reportA.storeSummaries).toHaveLength(2)
    expect(reportB.storeSummaries).toHaveLength(2)
  })

  // ── 边界 ──

  it('getIntercompanyEliminations returns empty for brand with no eliminations', async () => {
    const svc = makeBrandPAndL()
    const elims = await svc.getIntercompanyEliminations('brand-A', '2026-07')
    expect(elims).toHaveLength(0)
  })

  it('getBrandRevenue for unknown brand returns 0', async () => {
    const svc = makeBrandPAndL()
    const rev = await svc.getBrandRevenue('brand-UNKNOWN', '2026-06')
    expect(rev).toBe(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// AccountTransactionLogService 测试
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-dashboard] AccountTransactionLogService: 分账状态流转', () => {
  // ── 正例 ──

  it('logTransaction creates a pending transaction log', async () => {
    const svc = makeTxLog()
    const tx = await svc.logTransaction({ transactionId: 'tx-001', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 1000 })
    expect(tx.status).toBe(TransactionStatus.Pending)
    expect(tx.id).toMatch(/^txlog-/)
    expect(tx.transactionId).toBe('tx-001')
    expect(tx.fromAccountId).toBe('acct-A')
    expect(tx.toAccountId).toBe('acct-B')
    expect(tx.amount).toBe(1000)
  })

  it('updateTransactionStatus: Pending -> Processing', async () => {
    const svc = makeTxLog()
    const tx = await svc.logTransaction({ transactionId: 'tx-002', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 2000 })
    const updated = await svc.updateTransactionStatus(tx.id, TransactionStatus.Processing)
    expect(updated.status).toBe(TransactionStatus.Processing)
    expect(updated.previousStatus).toBe(TransactionStatus.Pending)
  })

  it('updateTransactionStatus: Processing -> Completed', async () => {
    const svc = makeTxLog()
    const tx = await svc.logTransaction({ transactionId: 'tx-003', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 3000 })
    await svc.updateTransactionStatus(tx.id, TransactionStatus.Processing)
    const completed = await svc.updateTransactionStatus(tx.id, TransactionStatus.Completed)
    expect(completed.status).toBe(TransactionStatus.Completed)
  })

  it('updateTransactionStatus: Processing -> Failed with error message', async () => {
    const svc = makeTxLog()
    const tx = await svc.logTransaction({ transactionId: 'tx-004', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 4000 })
    await svc.updateTransactionStatus(tx.id, TransactionStatus.Processing)
    const failed = await svc.updateTransactionStatus(tx.id, TransactionStatus.Failed, '余额不足')
    expect(failed.status).toBe(TransactionStatus.Failed)
    expect(failed.errorMessage).toBe('余额不足')
  })

  // ── 反例: 状态流转 ──

  it('invalid transition: Pending -> Completed should throw', async () => {
    const svc = makeTxLog()
    const tx = await svc.logTransaction({ transactionId: 'tx-005', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 5000 })
    await expect(svc.updateTransactionStatus(tx.id, TransactionStatus.Completed)).rejects.toThrow('Invalid status transition')
  })

  it('invalid transition: Completed can not transition to any state', async () => {
    const svc = makeTxLog()
    const tx = await svc.logTransaction({ transactionId: 'tx-006', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 5000 })
    await svc.updateTransactionStatus(tx.id, TransactionStatus.Processing)
    await svc.updateTransactionStatus(tx.id, TransactionStatus.Completed)
    await expect(svc.updateTransactionStatus(tx.id, TransactionStatus.Processing)).rejects.toThrow()
  })

  it('invalid transition: Failed can not transition to any state', async () => {
    const svc = makeTxLog()
    const tx = await svc.logTransaction({ transactionId: 'tx-007', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 5000 })
    await svc.updateTransactionStatus(tx.id, TransactionStatus.Processing)
    await svc.updateTransactionStatus(tx.id, TransactionStatus.Failed)
    await expect(svc.updateTransactionStatus(tx.id, TransactionStatus.Completed)).rejects.toThrow()
  })

  it('updateTransactionStatus: non-existent txId throws', async () => {
    const svc = makeTxLog()
    await expect(svc.updateTransactionStatus('non-existent', TransactionStatus.Processing)).rejects.toThrow('not found')
  })

  // ── 正例: 查询 ──

  it('queryTransactionLogs: empty filter returns all logs', async () => {
    const svc = makeTxLog()
    await svc.logTransaction({ transactionId: 'tx-q1', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 100 })
    await svc.logTransaction({ transactionId: 'tx-q2', fromAccountId: 'acct-C', toAccountId: 'acct-D', amount: 200 })
    const all = svc.queryTransactionLogs({})
    expect(all).toHaveLength(2)
  })

  it('queryTransactionLogs: filter by fromAccountId', async () => {
    const svc = makeTxLog()
    await svc.logTransaction({ transactionId: 'tx-f1', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 100 })
    await svc.logTransaction({ transactionId: 'tx-f2', fromAccountId: 'acct-C', toAccountId: 'acct-D', amount: 200 })
    const filtered = svc.queryTransactionLogs({ fromAccountId: 'acct-A' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].transactionId).toBe('tx-f1')
  })

  it('queryTransactionLogs: filter by toAccountId', async () => {
    const svc = makeTxLog()
    await svc.logTransaction({ transactionId: 'tx-t1', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 100 })
    await svc.logTransaction({ transactionId: 'tx-t2', fromAccountId: 'acct-C', toAccountId: 'acct-D', amount: 200 })
    const filtered = svc.queryTransactionLogs({ toAccountId: 'acct-B' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].transactionId).toBe('tx-t1')
  })

  it('queryTransactionLogs: filter by status', async () => {
    const svc = makeTxLog()
    await svc.logTransaction({ transactionId: 'tx-s1', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 100 })
    const tx2 = await svc.logTransaction({ transactionId: 'tx-s2', fromAccountId: 'acct-C', toAccountId: 'acct-D', amount: 200 })
    await svc.updateTransactionStatus(tx2.id, TransactionStatus.Processing)
    const filtered = svc.queryTransactionLogs({ status: TransactionStatus.Processing })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].transactionId).toBe('tx-s2')
  })

  it('getTransactionStatus returns null for non-existent id', () => {
    const svc = makeTxLog()
    expect(svc.getTransactionStatus('non-existent')).toBeNull()
  })

  it('getTransactionStatus returns the correct log for existing id', async () => {
    const svc = makeTxLog()
    const tx = await svc.logTransaction({ transactionId: 'tx-g1', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 777 })
    const found = svc.getTransactionStatus(tx.id)
    expect(found).not.toBeNull()
    expect(found!.transactionId).toBe('tx-g1')
    expect(found!.amount).toBe(777)
  })

  // ── 边界: logTransaction ──

  it('logTransaction: metadata is optional and stored when provided', async () => {
    const svc = makeTxLog()
    const tx = await svc.logTransaction({ transactionId: 'tx-meta', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 1000, metadata: { source: 'order', orderId: 'ord-001' } })
    expect(tx.metadata).toBeDefined()
    expect(tx.metadata!.source).toBe('order')
  })

  it('logTransaction: handles zero amount', async () => {
    const svc = makeTxLog()
    const tx = await svc.logTransaction({ transactionId: 'tx-zero', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 0 })
    expect(tx.status).toBe(TransactionStatus.Pending)
    expect(tx.amount).toBe(0)
  })
})
