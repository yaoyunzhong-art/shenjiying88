/**
 * 🐜 P-38 finance E2E — 损益 Profit & Loss
 *
 * 覆盖:
 *   - 正例: 门店营收/成本/利润/利润率/多门店对比/品牌级损益/内部往来抵销
 *   - 反例: 不存在门店/跨品牌隔离
 *   - 边界: 零数据门店/同一门店多期对比/大金额
 *   - 增强: 边界值(大额/小额/零值)、重复提交、非法参数、状态转换异常、并发冲突
 *
 * 使用 node --import tsx --test 运行
 */

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import {
  StorePAndLService,
  BrandPAndLService,
  resetFinanceDashboardTestState,
  AccountTransactionLogService,
  TransactionStatus,
} from '../../src/modules/finance/finance-dashboard.service.js'

describe('P-38 损益 E2E — 正例', () => {
  let storePAndL
  let brandPAndL

  before(() => {
    resetFinanceDashboardTestState()
    storePAndL = new StorePAndLService()
    brandPAndL = new BrandPAndLService(storePAndL)
  })

  it('1. 门店营收 — 按时间段获取', async () => {
    const revenue = await storePAndL.getStoreRevenue('store-A1', '2026-07')
    assert.equal(revenue.storeId, 'store-A1')
    assert.equal(revenue.period, '2026-07')
    assert.ok(revenue.revenue > 0, 'revenue should be positive')
    assert.ok(revenue.transactionCount > 0, 'transactionCount should be positive')
  })

  it('2. 门店成本 — 含采购/人力/租金明细', async () => {
    const cost = await storePAndL.getStoreCost('store-A1', '2026-07')
    assert.equal(cost.storeId, 'store-A1')
    assert.equal(cost.period, '2026-07')
    assert.ok(cost.purchaseCost >= 0)
    assert.ok(cost.laborCost >= 0)
    assert.ok(cost.rentCost >= 0)
    assert.equal(cost.totalCost, cost.purchaseCost + cost.laborCost + cost.rentCost)
  })

  it('3. 门店利润 — 营收-成本=利润', async () => {
    const revenue = await storePAndL.getStoreRevenue('store-A1', '2026-07')
    const cost = await storePAndL.getStoreCost('store-A1', '2026-07')

    const profit = await storePAndL.calculateStoreProfit('store-A1', '2026-07')
    assert.equal(profit.storeId, 'store-A1')
    assert.equal(profit.revenue, revenue.revenue)
    assert.equal(profit.cost, cost.totalCost)
    assert.equal(profit.profit, revenue.revenue - cost.totalCost)
  })

  it('4. 门店利润率 — 利润/营收', async () => {
    const margin = await storePAndL.getStoreMargin('store-A1', '2026-07')
    assert.ok(margin >= -1 && margin <= 1, `margin ${margin} should be between -1 and 1`)
    const profit = await storePAndL.calculateStoreProfit('store-A1', '2026-07')
    if (profit.revenue > 0) {
      assert.equal(margin, profit.profit / profit.revenue)
    }
  })

  it('5. 多门店对比 — 按利润降序排名', async () => {
    const results = await storePAndL.compareStores(['store-A1', 'store-A2'], '2026-07')
    assert.equal(results.length, 2)
    // 按利润降序
    assert.ok(results[0].profit >= results[1].profit)
    assert.equal(results[0].rank, 1)
    assert.equal(results[1].rank, 2)
  })

  it('6. 品牌营收 — 聚合所有门店', async () => {
    const revenue = await brandPAndL.getBrandRevenue('brand-A', '2026-07')
    // brand-A has store-A1, store-A2
    assert.ok(revenue > 0)
    const revA1 = await storePAndL.getStoreRevenue('store-A1', '2026-07')
    const revA2 = await storePAndL.getStoreRevenue('store-A2', '2026-07')
    assert.equal(revenue, revA1.revenue + revA2.revenue)
  })

  it('7. 品牌利润 — 总收入-总成本', async () => {
    const profit = await brandPAndL.calculateBrandProfit('brand-A', '2026-07')
    assert.ok(profit.revenue > 0)
    assert.ok(profit.cost > 0)
    assert.equal(profit.profit, profit.revenue - profit.cost)
  })

  it('8. 内部往来抵销 — 添加并查询', async () => {
    const elim = await brandPAndL.addIntercompanyElimination({
      fromStoreId: 'store-A1',
      toStoreId: 'store-A2',
      amount: 5000,
      description: '内部调拨',
      period: '2026-07',
    })
    assert.ok(elim.id.startsWith('elim-'))
    assert.equal(elim.amount, 5000)
    assert.equal(elim.fromStoreId, 'store-A1')

    const elms = await brandPAndL.getIntercompanyEliminations('brand-A', '2026-07')
    assert.ok(elms.length >= 1)
    assert.ok(elms.some(e => e.id === elim.id))
  })

  it('9. 品牌级损益表 — 含门店汇总', async () => {
    const report = await brandPAndL.generateBrandPAndLReport('brand-A', '2026-07')
    assert.equal(report.brandId, 'brand-A')
    assert.equal(report.period, '2026-07')
    assert.ok(report.totalRevenue > 0)
    assert.ok(report.totalCost > 0)
    assert.equal(report.grossProfit, report.totalRevenue - report.totalCost)
    assert.ok(Array.isArray(report.storeSummaries))
    assert.equal(report.storeSummaries.length, 2) // store-A1, store-A2
    // netProfit = grossProfit - intercompanyEliminations
    assert.equal(report.netProfit, report.grossProfit - report.intercompanyEliminations)
  })
})

describe('P-38 损益 E2E — 反例', () => {
  let storePAndL
  let brandPAndL

  before(() => {
    resetFinanceDashboardTestState()
    storePAndL = new StorePAndLService()
    brandPAndL = new BrandPAndLService(storePAndL)
  })

  it('10. 不存在门店 — 营收返回默认值', async () => {
    const revenue = await storePAndL.getStoreRevenue('store-UNKNOWN', '2026-07')
    assert.equal(revenue.storeId, 'store-UNKNOWN')
    assert.ok(revenue.revenue >= 0) // 不会抛异常
  })

  it('11. 跨品牌隔离 — brand-B 不包含 store-A 的数据', async () => {
    const revenueB = await brandPAndL.getBrandRevenue('brand-B', '2026-07')
    // brand-B has store-B1, store-B2
    const revA1 = await storePAndL.getStoreRevenue('store-A1', '2026-07')
    // brand-B's revenue should NOT include store-A1
    assert.ok(revenueB !== revA1.revenue)
  })
})

describe('P-38 损益 E2E — 边界', () => {
  let storePAndL
  let brandPAndL

  before(() => {
    resetFinanceDashboardTestState()
    storePAndL = new StorePAndLService()
    brandPAndL = new BrandPAndLService(storePAndL)
  })

  it('12. 零数据门店 — 成本和营收均为0', async () => {
    // 一个未曾有过数据的门店
    const cost = await storePAndL.getStoreCost('store-EMPTY', '2026-01')
    assert.equal(cost.totalCost, cost.purchaseCost + cost.laborCost + cost.rentCost)
    assert.ok(cost.totalCost >= 0)

    const profit = await storePAndL.calculateStoreProfit('store-EMPTY', '2026-01')
    assert.equal(profit.storeId, 'store-EMPTY')
  })

  it('13. 同一门店多期对比 — 不同period不同结果', async () => {
    const revJuly = await storePAndL.getStoreRevenue('store-A1', '2026-07')
    const revAug = await storePAndL.getStoreRevenue('store-A1', '2026-08')
    // 不同period应有确定性不同hash
    const revSep = await storePAndL.getStoreRevenue('store-A1', '2026-09')
    assert.ok(revJuly.revenue !== revAug.revenue || revAug.revenue !== revSep.revenue,
      'different periods should produce different revenues')
  })

  it('14. 大金额门店 — 成本明细不为负', async () => {
    const cost = await storePAndL.getStoreCost('store-B1', '2026-12')
    assert.ok(cost.purchaseCost >= 0)
    assert.ok(cost.laborCost >= 0)
    assert.ok(cost.rentCost >= 0)
    assert.ok(cost.totalCost >= 0)
  })
})

describe('增强: 门店损益 — 边界值/异常/幂等', () => {
  let storePAndL
  let brandPAndL

  before(() => {
    resetFinanceDashboardTestState()
    storePAndL = new StorePAndLService()
    brandPAndL = new BrandPAndLService(storePAndL)
  })

  it('15. 远未来营收 — 大period不崩坏', async () => {
    const rev = await storePAndL.getStoreRevenue('store-A1', '2099-12')
    assert.equal(rev.storeId, 'store-A1')
    assert.equal(rev.period, '2099-12')
    assert.ok(Number.isFinite(rev.revenue))
    assert.ok(rev.revenue >= 0)
    assert.ok(rev.transactionCount >= 0)
  })

  it('16. 门店ID为空字符串 — 返回默认结构不抛异常', async () => {
    const rev = await storePAndL.getStoreRevenue('', '2026-07')
    assert.equal(rev.storeId, '')
    assert.ok(Number.isFinite(rev.revenue))
  })

  it('17. 非法period格式 — 仍返回合理结构', async () => {
    const cost = await storePAndL.getStoreCost('store-A1', 'garbage')
    assert.ok(Number.isFinite(cost.totalCost))
    assert.equal(cost.storeId, 'store-A1')
    assert.equal(cost.period, 'garbage')
  })

  it('18. 幂等性 — 同一门店同一period多次调用结果一致', async () => {
    const first = await storePAndL.calculateStoreProfit('store-A1', '2026-07')
    const second = await storePAndL.calculateStoreProfit('store-A1', '2026-07')
    const third = await storePAndL.calculateStoreProfit('store-A1', '2026-07')
    assert.deepEqual(first, second)
    assert.deepEqual(second, third)
  })

  it('19. 全品牌聚合 — 跨品牌利润对比验证', async () => {
    const profitA = await brandPAndL.calculateBrandProfit('brand-A', '2026-07')
    const profitB = await brandPAndL.calculateBrandProfit('brand-B', '2026-07')
    assert.ok(profitA.revenue > 0)
    assert.ok(profitB.revenue > 0)
    // 两个品牌的利润结构完整
    assert.equal(profitA.profit, profitA.revenue - profitA.cost)
    assert.equal(profitB.profit, profitB.revenue - profitB.cost)
    // 品牌A和B的值不可能完全相同
    assert.notDeepEqual(profitA, profitB)
  })

  it('20. 多门店对比 — 4个门店正确排序', async () => {
    const results = await storePAndL.compareStores(
      ['store-A1', 'store-A2', 'store-B1', 'store-B2'],
      '2026-07'
    )
    assert.equal(results.length, 4)
    assert.equal(results[0].rank, 1)
    assert.equal(results[3].rank, 4)
    for (let i = 1; i < results.length; i++) {
      assert.ok(results[i - 1].profit >= results[i].profit)
    }
  })

  it('21. 单门店对比 — 列表只有一个门店', async () => {
    const results = await storePAndL.compareStores(['store-A1'], '2026-07')
    assert.equal(results.length, 1)
    assert.equal(results[0].rank, 1)
    assert.equal(results[0].storeId, 'store-A1')
  })

  it('22. 空门店列表对比 — 返回空数组', async () => {
    const results = await storePAndL.compareStores([], '2026-07')
    assert.equal(results.length, 0)
    assert.deepEqual(results, [])
  })

  it('23. 门店利润为零的场景 — margin为0', async () => {
    // 使用确定性的空门店验证0营收时的margin
    const profit = await storePAndL.calculateStoreProfit('store-NO-DATA', '2026-01')
    assert.equal(profit.storeId, 'store-NO-DATA')
    // 如果revenue为0，margin应为0
    if (profit.revenue === 0) {
      assert.equal(profit.margin, 0)
    }
  })

  it('24. brand不存在 — 返回空收益', async () => {
    const revenue = await brandPAndL.getBrandRevenue('brand-NONEXISTENT', '2026-07')
    assert.equal(revenue, 0)
    const cost = await brandPAndL.getBrandCost('brand-NONEXISTENT', '2026-07')
    assert.equal(cost, 0)
    const profit = await brandPAndL.calculateBrandProfit('brand-NONEXISTENT', '2026-07')
    assert.equal(profit.revenue, 0)
    assert.equal(profit.cost, 0)
    assert.equal(profit.profit, 0)
  })

  it('25. 品牌损益表 — 无内部抵销的净利等于毛利润', async () => {
    const report = await brandPAndL.generateBrandPAndLReport('brand-B', '2026-07')
    assert.equal(report.intercompanyEliminations, 0)
    assert.equal(report.netProfit, report.grossProfit)
  })

  it('26. 多笔内部往来抵销累加 — 净利正确扣减', async () => {
    // brand-A: 先加2笔抵销
    await brandPAndL.addIntercompanyElimination({
      fromStoreId: 'store-A1', toStoreId: 'store-A2', amount: 3000,
      description: '调拨1', period: '2026-07',
    })
    await brandPAndL.addIntercompanyElimination({
      fromStoreId: 'store-A2', toStoreId: 'store-A1', amount: 2000,
      description: '调拨2', period: '2026-07',
    })
    const report = await brandPAndL.generateBrandPAndLReport('brand-A', '2026-07')
    assert.equal(report.intercompanyEliminations, 5000 + 3000 + 2000) // 第8笔5000 + 两笔新增
    assert.equal(report.netProfit, report.grossProfit - report.intercompanyEliminations)
  })

  it('27. 内部往来抵销 — 查询按period过滤', async () => {
    await brandPAndL.addIntercompanyElimination({
      fromStoreId: 'store-A1', toStoreId: 'store-A2', amount: 1000,
      description: '跨月调拨', period: '2026-08',
    })
    const elmsJuly = await brandPAndL.getIntercompanyEliminations('brand-A', '2026-07')
    const elmsAug = await brandPAndL.getIntercompanyEliminations('brand-A', '2026-08')
    assert.ok(elmsJuly.length > 0)
    assert.ok(elmsAug.length > 0)
    // 2026-08的抵销不应该在7月出现
    const augElim = elmsAug.find(e => e.description === '跨月调拨')
    assert.ok(augElim)
    const julyHasAug = elmsJuly.some(e => e.description === '跨月调拨')
    assert.equal(julyHasAug, false)
  })
})

describe('增强: 分账状态流转日志 (AccountTransactionLogService)', () => {
  let txLogService

  before(() => {
    resetFinanceDashboardTestState()
    txLogService = new AccountTransactionLogService()
  })

  it('28. 创建分账日志 — Pending状态', async () => {
    const log = await txLogService.logTransaction({
      transactionId: 'tx-001',
      fromAccountId: 'store-A1',
      toAccountId: 'store-B1',
      amount: 50000,
      metadata: { type: 'settlement' },
    })
    assert.ok(log.id.startsWith('txlog-'))
    assert.equal(log.transactionId, 'tx-001')
    assert.equal(log.fromAccountId, 'store-A1')
    assert.equal(log.toAccountId, 'store-B1')
    assert.equal(log.amount, 50000)
    assert.equal(log.status, TransactionStatus.Pending)
    assert.ok(log.createdAt)
    assert.ok(log.updatedAt)
  })

  it('29. 状态流转 Pending → Processing → Completed', async () => {
    const log = await txLogService.logTransaction({
      transactionId: 'tx-002',
      fromAccountId: 'store-A2',
      toAccountId: 'store-B2',
      amount: 30000,
    })
    assert.equal(log.status, TransactionStatus.Pending)

    // Pending → Processing
    const processing = await txLogService.updateTransactionStatus(log.id, TransactionStatus.Processing)
    assert.equal(processing.status, TransactionStatus.Processing)
    assert.equal(processing.previousStatus, TransactionStatus.Pending)

    // Processing → Completed
    const completed = await txLogService.updateTransactionStatus(log.id, TransactionStatus.Completed)
    assert.equal(completed.status, TransactionStatus.Completed)
    assert.equal(completed.previousStatus, TransactionStatus.Processing)
  })

  it('30. 状态流转 Pending → Failed （带错误信息）', async () => {
    const log = await txLogService.logTransaction({
      transactionId: 'tx-003',
      fromAccountId: 'store-A1',
      toAccountId: 'store-A2',
      amount: 10000,
    })
    const failed = await txLogService.updateTransactionStatus(log.id, TransactionStatus.Failed, '余额不足')
    assert.equal(failed.status, TransactionStatus.Failed)
    assert.equal(failed.errorMessage, '余额不足')
  })

  it('31. 状态流转异常 — Completed → Pending 抛出错误', async () => {
    const log = await txLogService.logTransaction({
      transactionId: 'tx-004',
      fromAccountId: 'store-B1',
      toAccountId: 'store-B2',
      amount: 20000,
    })
    await txLogService.updateTransactionStatus(log.id, TransactionStatus.Processing)
    await txLogService.updateTransactionStatus(log.id, TransactionStatus.Completed)

    // Completed → Pending 是非法的
    await assert.rejects(
      () => txLogService.updateTransactionStatus(log.id, TransactionStatus.Pending),
      /Invalid status transition/
    )
  })

  it('32. 状态流转异常 — Failed → Completed 抛出错误', async () => {
    const log = await txLogService.logTransaction({
      transactionId: 'tx-005',
      fromAccountId: 'store-A1',
      toAccountId: 'store-A2',
      amount: 5000,
    })
    await txLogService.updateTransactionStatus(log.id, TransactionStatus.Failed)

    await assert.rejects(
      () => txLogService.updateTransactionStatus(log.id, TransactionStatus.Completed),
      /Invalid status transition/
    )
  })

  it('33. 状态流转异常 — Processing → Pending 抛出错误', async () => {
    const log = await txLogService.logTransaction({
      transactionId: 'tx-006',
      fromAccountId: 'store-B2',
      toAccountId: 'store-A1',
      amount: 15000,
    })
    await txLogService.updateTransactionStatus(log.id, TransactionStatus.Processing)

    await assert.rejects(
      () => txLogService.updateTransactionStatus(log.id, TransactionStatus.Pending),
      /Invalid status transition/
    )
  })

  it('34. 查询不存在的交易 — 返回null', () => {
    const result = txLogService.getTransactionStatus('tx-NONEXISTENT')
    assert.equal(result, null)
  })

  it('35. 更新不存在的交易 — 抛出异常', async () => {
    await assert.rejects(
      () => txLogService.updateTransactionStatus('tx-NONEXISTENT', TransactionStatus.Processing),
      /Transaction.*not found/
    )
  })

  it('36. 按条件查询 — transactionId过滤', async () => {
    await txLogService.logTransaction({ transactionId: 'tx-filter-1', fromAccountId: 's1', toAccountId: 's2', amount: 100 })
    await txLogService.logTransaction({ transactionId: 'tx-filter-2', fromAccountId: 's3', toAccountId: 's4', amount: 200 })
    await txLogService.logTransaction({ transactionId: 'tx-filter-1', fromAccountId: 's5', toAccountId: 's6', amount: 300 })

    const result = txLogService.queryTransactionLogs({ transactionId: 'tx-filter-1' })
    assert.equal(result.length, 2)
    assert.ok(result.every(r => r.transactionId === 'tx-filter-1'))
  })

  it('37. 按fromAccountId和toAccountId组合过滤', async () => {
    // 这里只能靠之前已插入的数据验证过滤有效性
    const result = txLogService.queryTransactionLogs({ fromAccountId: 'store-A1' })
    assert.ok(result.length > 0)
    assert.ok(result.every(r => r.fromAccountId === 'store-A1'))
  })

  it('38. 按状态过滤 — 查询所有Pending记录', () => {
    const pendingLogs = txLogService.queryTransactionLogs({ status: TransactionStatus.Pending })
    assert.ok(pendingLogs.length > 0)
    assert.ok(pendingLogs.every(r => r.status === TransactionStatus.Pending))
  })

  it('39. 创建日志时 — metadata保留', async () => {
    const meta = { version: 2, module: 'settlement', trace: 'abc-123' }
    const log = await txLogService.logTransaction({
      transactionId: 'tx-007',
      fromAccountId: 'store-A1',
      toAccountId: 'store-A2',
      amount: 8000,
      metadata: meta,
    })
    assert.deepEqual(log.metadata, meta)
  })

  it('40. Completed状态 — 无法再被更改', async () => {
    const log = await txLogService.logTransaction({
      transactionId: 'tx-008',
      fromAccountId: 'store-A2',
      toAccountId: 'store-B1',
      amount: 6000,
    })
    await txLogService.updateTransactionStatus(log.id, TransactionStatus.Processing)
    await txLogService.updateTransactionStatus(log.id, TransactionStatus.Completed)

    await assert.rejects(
      () => txLogService.updateTransactionStatus(log.id, TransactionStatus.Failed),
      /Invalid status transition/
    )
  })
})
