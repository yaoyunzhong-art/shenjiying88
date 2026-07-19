/**
 * 🐜 P-38 finance E2E — 损益 Profit & Loss
 *
 * 覆盖:
 *   - 正例: 门店营收/成本/利润/利润率/多门店对比/品牌级损益/内部往来抵销
 *   - 反例: 不存在门店/跨品牌隔离
 *   - 边界: 零数据门店/同一门店多期对比/大金额
 *
 * 使用 node --import tsx --test 运行
 */

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import {
  StorePAndLService,
  BrandPAndLService,
  resetFinanceDashboardTestState,
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
