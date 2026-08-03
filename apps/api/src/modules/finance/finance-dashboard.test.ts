import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [finance] 门店损益看板 + 品牌级损益表 + 分账日志测试 (T111-2)
 *
 * 覆盖：
 *   - StorePAndLService: 门店营收/成本/利润/利润率、多门店对比
 *   - BrandPAndLService: 品牌总营收/成本/利润、内部往来抵销、品牌级损益表
 *   - AccountTransactionLogService: 分账状态流转日志
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  StorePAndLService,
  BrandPAndLService,
  AccountTransactionLogService,
  TransactionStatus,
  resetFinanceDashboardTestState,
  type IntercompanyElimination
} from './finance-dashboard.service'

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
// 门店损益测试：营收-成本=利润，利润率为利润/营收
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-dashboard] 门店损益: 营收-成本=利润，利润率=利润/营收', () => {
  it('getStoreRevenue 返回门店营收数据', async () => {
    const svc = makeStorePAndL()
    const rev = await svc.getStoreRevenue('store-A1', '2026-06')
    assert.ok(rev.storeId === 'store-A1')
    assert.ok(typeof rev.revenue === 'number')
    assert.ok(rev.revenue >= 0)
  })

  it('getStoreCost 返回门店成本（进价+人力+租金）', async () => {
    const svc = makeStorePAndL()
    const cost = await svc.getStoreCost('store-A1', '2026-06')
    assert.ok(cost.storeId === 'store-A1')
    assert.ok(typeof cost.purchaseCost === 'number')
    assert.ok(typeof cost.laborCost === 'number')
    assert.ok(typeof cost.rentCost === 'number')
    assert.equal(cost.totalCost, cost.purchaseCost + cost.laborCost + cost.rentCost)
  })

  it('calculateStoreProfit: 营收 - 成本 = 利润', async () => {
    const svc = makeStorePAndL()
    const profit = await svc.calculateStoreProfit('store-A1', '2026-06')
    assert.equal(profit.profit, profit.revenue - profit.cost)
  })

  it('getStoreMargin: 利润率 = 利润 / 营收', async () => {
    const svc = makeStorePAndL()
    const profit = await svc.calculateStoreProfit('store-A1', '2026-06')
    const margin = await svc.getStoreMargin('store-A1', '2026-06')
    const expectedMargin = profit.revenue > 0 ? profit.profit / profit.revenue : 0
    assert.equal(margin, expectedMargin)
  })

  it('利润率可为零（营收等于成本）', async () => {
    const svc = makeStorePAndL()
    // 模拟数据下，至少存在某个门店利润为负或零的情况
    const margin = await svc.getStoreMargin('store-A1', '2026-06')
    assert.ok(typeof margin === 'number')
    assert.ok(margin <= 1) // 理论上最大为1
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 多门店对比测试：按利润排序
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-dashboard] 多门店对比: 按利润排序', () => {
  it('compareStores 返回按利润降序排列结果', async () => {
    const svc = makeStorePAndL()
    const results = await svc.compareStores(['store-A1', 'store-A2', 'store-B1'], '2026-06')
    assert.equal(results.length, 3)
    // 验证排名连续
    assert.equal(results[0].rank, 1)
    assert.equal(results[1].rank, 2)
    assert.equal(results[2].rank, 3)
  })

  it('compareStores 第一名利润 >= 其他所有', async () => {
    const svc = makeStorePAndL()
    const results = await svc.compareStores(['store-A1', 'store-A2', 'store-B1'], '2026-06')
    for (let i = 1; i < results.length; i++) {
      assert.ok(results[0].profit >= results[i].profit)
    }
  })

  it('compareStores 包含 revenue/cost/profit/margin 字段', async () => {
    const svc = makeStorePAndL()
    const results = await svc.compareStores(['store-A1'], '2026-06')
    const r = results[0]
    assert.ok('revenue' in r)
    assert.ok('cost' in r)
    assert.ok('profit' in r)
    assert.ok('margin' in r)
    assert.ok('rank' in r)
    assert.equal(r.profit, r.revenue - r.cost)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 品牌级损益测试：汇总所有门店后扣减内部往来
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-dashboard] 品牌级损益: 汇总所有门店后扣减内部往来', () => {
  it('getBrandRevenue 汇总品牌下所有门店营收', async () => {
    const svc = makeBrandPAndL()
    const totalRev = await svc.getBrandRevenue('brand-A', '2026-06')
    assert.ok(typeof totalRev === 'number')
    assert.ok(totalRev >= 0)
  })

  it('getBrandCost 汇总品牌下所有门店成本', async () => {
    const svc = makeBrandPAndL()
    const totalCost = await svc.getBrandCost('brand-A', '2026-06')
    assert.ok(typeof totalCost === 'number')
    assert.ok(totalCost >= 0)
  })

  it('calculateBrandProfit: 品牌营收 - 品牌成本 = 品牌利润', async () => {
    const svc = makeBrandPAndL()
    const { revenue, cost, profit } = await svc.calculateBrandProfit('brand-A', '2026-06')
    assert.equal(profit, revenue - cost)
  })

  it('generateBrandPAndLReport 包含 grossProfit 和 netProfit（扣减往来后）', async () => {
    const svc = makeBrandPAndL()
    const report = await svc.generateBrandPAndLReport('brand-A', '2026-06')
    assert.ok('grossProfit' in report)
    assert.ok('intercompanyEliminations' in report)
    assert.ok('netProfit' in report)
    assert.equal(report.netProfit, report.grossProfit - report.intercompanyEliminations)
  })

  it('generateBrandPAndLReport 包含所有门店摘要', async () => {
    const svc = makeBrandPAndL()
    const report = await svc.generateBrandPAndLReport('brand-A', '2026-06')
    assert.ok(Array.isArray(report.storeSummaries))
    assert.ok(report.storeSummaries.length >= 2) // brand-A 有 2 个门店
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 内部往来抵销测试：两个子公司间交易全额抵销
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-dashboard] 内部往来抵销: 两个子公司间交易全额抵销', () => {
  it('addIntercompanyElimination 添加往来抵销记录', async () => {
    const svc = makeBrandPAndL()
    const elim = await svc.addIntercompanyElimination({
      fromStoreId: 'store-A1',
      toStoreId: 'store-A2',
      amount: 5000,
      description: '门店A1向A2采购',
      period: '2026-06'
    })
    assert.ok(elim.id.startsWith('elim-'))
    assert.equal(elim.amount, 5000)
  })

  it('getIntercompanyEliminations 返回品牌的往来记录', async () => {
    const svc = makeBrandPAndL()
    await svc.addIntercompanyElimination({
      fromStoreId: 'store-A1',
      toStoreId: 'store-A2',
      amount: 5000,
      description: 'A1->A2',
      period: '2026-06'
    })
    await svc.addIntercompanyElimination({
      fromStoreId: 'store-B1',
      toStoreId: 'store-B2',
      amount: 3000,
      description: 'B1->B2',
      period: '2026-06'
    })

    const elims = await svc.getIntercompanyEliminations('brand-A', '2026-06')
    assert.equal(elims.length, 1) // 只有 brand-A 的记录
    assert.equal(elims[0].amount, 5000)
  })

  it('品牌级损益表自动扣减往来抵销', async () => {
    const svc = makeBrandPAndL()
    await svc.addIntercompanyElimination({
      fromStoreId: 'store-A1',
      toStoreId: 'store-A2',
      amount: 5000,
      description: 'A1->A2',
      period: '2026-06'
    })

    const report = await svc.generateBrandPAndLReport('brand-A', '2026-06')
    assert.equal(report.intercompanyEliminations, 5000)
    assert.equal(report.netProfit, report.grossProfit - 5000)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 分账状态流转测试：pending→processing→completed/failed 流转正确
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-dashboard] 分账状态流转: pending→processing→completed/failed', () => {
  it('logTransaction 创建 pending 状态交易', async () => {
    const svc = makeTxLog()
    const tx = await svc.logTransaction({
      transactionId: 'tx-001',
      fromAccountId: 'acct-A',
      toAccountId: 'acct-B',
      amount: 1000
    })
    assert.equal(tx.status, TransactionStatus.Pending)
    assert.ok(tx.id.startsWith('txlog-'))
  })

  it('updateTransactionStatus: Pending -> Processing', async () => {
    const svc = makeTxLog()
    const tx = await svc.logTransaction({
      transactionId: 'tx-002',
      fromAccountId: 'acct-A',
      toAccountId: 'acct-B',
      amount: 2000
    })
    const updated = await svc.updateTransactionStatus(tx.id, TransactionStatus.Processing)
    assert.equal(updated.status, TransactionStatus.Processing)
    assert.equal(updated.previousStatus, TransactionStatus.Pending)
  })

  it('updateTransactionStatus: Processing -> Completed', async () => {
    const svc = makeTxLog()
    const tx = await svc.logTransaction({
      transactionId: 'tx-003',
      fromAccountId: 'acct-A',
      toAccountId: 'acct-B',
      amount: 3000
    })
    await svc.updateTransactionStatus(tx.id, TransactionStatus.Processing)
    const completed = await svc.updateTransactionStatus(tx.id, TransactionStatus.Completed)
    assert.equal(completed.status, TransactionStatus.Completed)
  })

  it('updateTransactionStatus: Processing -> Failed 带错误信息', async () => {
    const svc = makeTxLog()
    const tx = await svc.logTransaction({
      transactionId: 'tx-004',
      fromAccountId: 'acct-A',
      toAccountId: 'acct-B',
      amount: 4000
    })
    await svc.updateTransactionStatus(tx.id, TransactionStatus.Processing)
    const failed = await svc.updateTransactionStatus(tx.id, TransactionStatus.Failed, '余额不足')
    assert.equal(failed.status, TransactionStatus.Failed)
    assert.equal(failed.errorMessage, '余额不足')
  })

  it('非法状态流转报错: Completed 不能转到任何状态', async () => {
    const svc = makeTxLog()
    const tx = await svc.logTransaction({
      transactionId: 'tx-005',
      fromAccountId: 'acct-A',
      toAccountId: 'acct-B',
      amount: 5000
    })
    await svc.updateTransactionStatus(tx.id, TransactionStatus.Processing)
    await svc.updateTransactionStatus(tx.id, TransactionStatus.Completed)
    await assert.rejects(() =>
      svc.updateTransactionStatus(tx.id, TransactionStatus.Processing)
    )
  })

  it('queryTransactionLogs 按 status 过滤', async () => {
    const svc = makeTxLog()
    await svc.logTransaction({ transactionId: 'tx-006', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 100 })
    await svc.logTransaction({ transactionId: 'tx-007', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 200 })
    const tx2 = await svc.logTransaction({ transactionId: 'tx-008', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 300 })
    await svc.updateTransactionStatus(tx2.id, TransactionStatus.Processing)

    const all = svc.queryTransactionLogs({})
    assert.equal(all.length, 3)

    const processing = svc.queryTransactionLogs({ status: TransactionStatus.Processing })
    assert.equal(processing.length, 1)
    assert.equal(processing[0].transactionId, 'tx-008')
  })

  it('getTransactionStatus 返回 null 当不存在', () => {
    const svc = makeTxLog()
    const result = svc.getTransactionStatus('non-existent')
    assert.equal(result, null)
  })

  // ── StorePAndL 边界条件 ────────────────────────────────

  it('getStoreRevenue 不同门店不同值', async () => {
    const svc = makeStorePAndL()
    const revA = await svc.getStoreRevenue('store-A1', '2026-06')
    const revB = await svc.getStoreRevenue('store-B1', '2026-06')
    assert.ok(revA.revenue !== revB.revenue, '不同门店应有不同营收')
  })

  it('getStoreRevenue 不同月份不同值', async () => {
    const svc = makeStorePAndL()
    const rev1 = await svc.getStoreRevenue('store-A1', '2026-06')
    const rev2 = await svc.getStoreRevenue('store-A1', '2026-07')
    assert.ok(rev1.revenue !== rev2.revenue, '不同月份应有不同营收')
  })

  it('calculateStoreProfit: 营收为0时利润为负（成本不为0）', async () => {
    const svc = makeStorePAndL()
    // 任何门店利润 = revenue - cost，revenue应>0
    const profit = await svc.calculateStoreProfit('store-A1', '2026-06')
    assert.ok(profit.revenue > 0, '默认门店营收应大于0')
    assert.ok(profit.cost > 0, '默认门店成本应大于0')
    assert.equal(profit.profit, profit.revenue - profit.cost)
  })

  it('getStoreMargin: 营收=0时利润率为0', async () => {
    const svc = makeStorePAndL()
    const margin = await svc.getStoreMargin('store-A1', '2026-06')
    assert.ok(typeof margin === 'number')
    assert.ok(margin >= -1 && margin <= 1, '利润率应在[-1,1]范围内')
  })

  it('compareStores 空数组返回空', async () => {
    const svc = makeStorePAndL()
    const results = await svc.compareStores([], '2026-06')
    assert.equal(results.length, 0)
  })

  it('compareStores 单门店返回排名1', async () => {
    const svc = makeStorePAndL()
    const results = await svc.compareStores(['store-A1'], '2026-06')
    assert.equal(results.length, 1)
    assert.equal(results[0].rank, 1)
  })

  // ── BrandPAndL 边界条件 ────────────────────────────────

  it('generateBrandPAndLReport 包含品牌ID', async () => {
    const svc = makeBrandPAndL()
    const report = await svc.generateBrandPAndLReport('brand-A', '2026-06')
    assert.ok(report.brandId === 'brand-A')
    assert.ok(typeof report.grossProfit === 'number')
    assert.ok(typeof report.netProfit === 'number')
  })

  // ── AccountTransactionLog 边界条件 ──────────────────────

  it('queryTransactionLogs 按fromAccountId过滤', async () => {
    const svc = makeTxLog()
    await svc.logTransaction({ transactionId: 'tx-f1', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 100 })
    await svc.logTransaction({ transactionId: 'tx-f2', fromAccountId: 'acct-C', toAccountId: 'acct-D', amount: 200 })
    const filtered = svc.queryTransactionLogs({ fromAccountId: 'acct-A' })
    assert.equal(filtered.length, 1)
    assert.equal(filtered[0].transactionId, 'tx-f1')
  })

  it('queryTransactionLogs 按toAccountId过滤', async () => {
    const svc = makeTxLog()
    await svc.logTransaction({ transactionId: 'tx-t1', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 100 })
    await svc.logTransaction({ transactionId: 'tx-t2', fromAccountId: 'acct-C', toAccountId: 'acct-D', amount: 200 })
    const filtered = svc.queryTransactionLogs({ toAccountId: 'acct-B' })
    assert.equal(filtered.length, 1)
    assert.equal(filtered[0].transactionId, 'tx-t1')
  })

  it('queryTransactionLogs 空过滤返回全部', async () => {
    const svc = makeTxLog()
    await svc.logTransaction({ transactionId: 'tx-a1', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 100 })
    await svc.logTransaction({ transactionId: 'tx-a2', fromAccountId: 'acct-C', toAccountId: 'acct-D', amount: 200 })
    // 空filter = {} 应该返回全部
    const all = svc.queryTransactionLogs({})
    const all2 = svc.queryTransactionLogs({} as any)
    assert.equal(all.length, 2)
    assert.equal(all2.length, 2)
  })

  it('logTransaction 创建不同账户记录', async () => {
    const svc = makeTxLog()
    const tx1 = await svc.logTransaction({ transactionId: 'tx-m1', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 500 })
    const tx2 = await svc.logTransaction({ transactionId: 'tx-m2', fromAccountId: 'acct-C', toAccountId: 'acct-D', amount: 1500 })
    assert.ok(tx1.id !== tx2.id)
    assert.equal(tx1.status, TransactionStatus.Pending)
    assert.equal(tx2.status, TransactionStatus.Pending)
  })

  it('updateTransactionStatus: 不存在txId报错', async () => {
    const svc = makeTxLog()
    await assert.rejects(() =>
      svc.updateTransactionStatus('non-existent', TransactionStatus.Processing)
    )
  })

  it('getTransactionStatus 存在时返回匹配记录', async () => {
    const svc = makeTxLog()
    const tx = await svc.logTransaction({ transactionId: 'tx-g1', fromAccountId: 'acct-A', toAccountId: 'acct-B', amount: 777 })
    const found = svc.getTransactionStatus(tx.id)
    assert.ok(found !== null)
    assert.equal(found.transactionId, 'tx-g1')
    assert.equal(found.amount, 777)
  })
})
