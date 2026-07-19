import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [finance-cost-cash-flow.service] P-38 费用分析 + 现金流追踪测试
 *
 * 覆盖 CostAnalysisService + CashFlowService:
 *   - CostAnalysisService: 费用分类 / 环比同比 / 多门店对比
 *   - CashFlowService: 流入流出 / 日现金流 / 余额追踪 / 分类明细
 *   - 正例 + 反例 + 边界: ≥35 tests
 */

import { StorePAndLService, resetFinanceDashboardTestState } from './finance-dashboard.service'
import { CostAnalysisService, CashFlowService } from './finance-cost-cash-flow.service'

// ══════════════════════════════════════════════════════════════════════════════
// CostAnalysisService 测试
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-cost-cash-flow] CostAnalysisService', () => {
  let storePAndL: StorePAndLService
  let costAnalysis: CostAnalysisService

  beforeEach(() => {
    resetFinanceDashboardTestState()
    storePAndL = new StorePAndLService()
    costAnalysis = new CostAnalysisService(storePAndL)
  })

  // ── 正例: 基础费用分析结构 ──

  it('should return cost analysis with three categories', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '2026-06')
    expect(analysis.totalCostCents).toBeGreaterThan(0)
    expect(analysis.categories).toHaveLength(3)
    expect(analysis.categories[0].category).toBe('采购成本')
    expect(analysis.categories[1].category).toBe('人力成本')
    expect(analysis.categories[2].category).toBe('租金')
  })

  it('should have valid percentage sum across categories (~100%)', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '2026-06')
    const totalPct = analysis.categories.reduce((sum, c) => sum + c.percentage, 0)
    expect(Math.abs(totalPct - 100)).toBeLessThan(1)
  })

  it('should have numeric monthOverMonthChange', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '2026-06')
    expect(typeof analysis.monthOverMonthChange).toBe('number')
    expect(Number.isFinite(analysis.monthOverMonthChange)).toBe(true)
  })

  it('should have numeric yearOverYearChange', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '2026-06')
    expect(typeof analysis.yearOverYearChange).toBe('number')
    expect(Number.isFinite(analysis.yearOverYearChange)).toBe(true)
  })

  it('should handle different stores with different results', async () => {
    const analysisA = await costAnalysis.getCostAnalysis('store-A1', '2026-06')
    const analysisB = await costAnalysis.getCostAnalysis('store-B1', '2026-06')
    expect(analysisA.totalCostCents).not.toBe(analysisB.totalCostCents)
  })

  it('should have count > 0 for purchase and labor categories', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '2026-06')
    expect(analysis.categories[0].count).toBeGreaterThan(0)
    expect(analysis.categories[1].count).toBeGreaterThan(0)
    expect(analysis.categories[2].count).toBe(1)
  })

  it('should have each category percentage between 0 and 100', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '2026-06')
    for (const cat of analysis.categories) {
      expect(cat.percentage).toBeGreaterThanOrEqual(0)
      expect(cat.percentage).toBeLessThanOrEqual(100)
    }
  })

  // ── 边界: getCostAnalysis ──

  it('should handle empty period string without throwing', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '')
    expect(analysis.categories).toHaveLength(3)
    expect(typeof analysis.totalCostCents).toBe('number')
    expect(typeof analysis.monthOverMonthChange).toBe('number')
  })

  it('should handle non-existent store ID', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-NONEXISTENT', '2026-06')
    expect(analysis.categories).toHaveLength(3)
    expect(analysis.totalCostCents).toBeGreaterThanOrEqual(0)
  })

  it('should compute prevPeriod across year boundary (Jan→Dec of previous year)', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '2026-01')
    expect(Number.isFinite(analysis.monthOverMonthChange)).toBe(true)
  })

  it('should compute yoyPeriod across year boundary', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '2026-01')
    expect(Number.isFinite(analysis.yearOverYearChange)).toBe(true)
  })

  it('should have positive category counts for any store', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-B2', '2026-08')
    for (const cat of analysis.categories) {
      expect(cat.count).toBeGreaterThanOrEqual(1)
    }
  })

  it('should handle far-future period (2099-12)', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '2099-12')
    expect(analysis.categories).toHaveLength(3)
    expect(Number.isFinite(analysis.monthOverMonthChange)).toBe(true)
    expect(Number.isFinite(analysis.yearOverYearChange)).toBe(true)
  })

  it('should handle malformed period string (not YYYY-MM)', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', 'not-a-date')
    expect(analysis.categories).toHaveLength(3)
    expect(typeof analysis.totalCostCents).toBe('number')
    expect(Number.isFinite(analysis.monthOverMonthChange)).toBe(true)
  })

  // ── 正例: compareStoreCosts ──

  it('should compare store costs sorted descending by totalCostCents', async () => {
    const results = await costAnalysis.compareStoreCosts(['store-A1', 'store-A2', 'store-B1'], '2026-06')
    expect(results).toHaveLength(3)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].totalCostCents).toBeGreaterThanOrEqual(results[i].totalCostCents)
    }
  })

  it('should include all four cost fields in comparison results', async () => {
    const results = await costAnalysis.compareStoreCosts(['store-A1'], '2026-06')
    const r = results[0]
    expect(typeof r.storeId).toBe('string')
    expect(typeof r.totalCostCents).toBe('number')
    expect(typeof r.purchaseCostCents).toBe('number')
    expect(typeof r.laborCostCents).toBe('number')
    expect(typeof r.rentCostCents).toBe('number')
  })

  it('should have totalCostCents equal sum of all component costs', async () => {
    const results = await costAnalysis.compareStoreCosts(['store-A1'], '2026-06')
    const r = results[0]
    expect(r.totalCostCents).toBe(r.purchaseCostCents + r.laborCostCents + r.rentCostCents)
  })

  // ── 边界: compareStoreCosts ──

  it('should return empty array for empty storeIds list', async () => {
    const results = await costAnalysis.compareStoreCosts([], '2026-06')
    expect(results).toHaveLength(0)
    expect(Array.isArray(results)).toBe(true)
  })

  it('should handle duplicate store IDs', async () => {
    const results = await costAnalysis.compareStoreCosts(['store-A1', 'store-A1'], '2026-06')
    expect(results).toHaveLength(2)
    expect(results[0].storeId).toBe('store-A1')
    expect(results[1].storeId).toBe('store-A1')
    expect(results[0].totalCostCents).toBe(results[1].totalCostCents)
  })

  it('should handle single store ID', async () => {
    const results = await costAnalysis.compareStoreCosts(['store-B1'], '2026-06')
    expect(results).toHaveLength(1)
    expect(results[0].storeId).toBe('store-B1')
  })

  it('should handle large number (20) of store IDs', async () => {
    const manyStores = Array.from({ length: 20 }, (_, i) => `store-bulk-${String(i).padStart(2, '0')}`)
    const results = await costAnalysis.compareStoreCosts(manyStores, '2026-06')
    expect(results).toHaveLength(20)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].totalCostCents).toBeGreaterThanOrEqual(results[i].totalCostCents)
    }
  })

  it('should handle store IDs with special characters', async () => {
    const results = await costAnalysis.compareStoreCosts(
      ['store-special-!@#$%^&*()_+-=[]{}|;:<>?,./'],
      '2026-06'
    )
    expect(results).toHaveLength(1)
    expect(results[0].totalCostCents).toBeGreaterThanOrEqual(0)
  })

  it('should handle ancient period (1970-01) without error', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '1970-01')
    expect(analysis.categories).toHaveLength(3)
    expect(Number.isFinite(analysis.monthOverMonthChange)).toBe(true)
    expect(Number.isFinite(analysis.yearOverYearChange)).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// CashFlowService 测试
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-cost-cash-flow] CashFlowService', () => {
  let cashFlow: CashFlowService

  beforeEach(() => {
    cashFlow = new CashFlowService()
    cashFlow.reset()
  })

  // ── 正例: 基础功能 ──

  it('should return default balance (1000000) for new account', () => {
    expect(cashFlow.getBalance('acct-new')).toBe(1000000)
  })

  it('should increase balance on recordInflow', async () => {
    await cashFlow.recordInflow({ accountId: 'acct-1', date: '2026-07-15', amountCents: 50000, category: '营收入账' })
    expect(cashFlow.getBalance('acct-1')).toBe(1000000 + 50000)
  })

  it('should decrease balance on recordOutflow', async () => {
    await cashFlow.recordOutflow({ accountId: 'acct-1', date: '2026-07-15', amountCents: 30000, category: '采购付款' })
    expect(cashFlow.getBalance('acct-1')).toBe(1000000 - 30000)
  })

  it('should track multiple transactions for balance', async () => {
    await cashFlow.recordInflow({ accountId: 'acct-2', date: '2026-07-01', amountCents: 200000, category: '营收入账' })
    await cashFlow.recordOutflow({ accountId: 'acct-2', date: '2026-07-02', amountCents: 50000, category: '采购付款' })
    await cashFlow.recordOutflow({ accountId: 'acct-2', date: '2026-07-03', amountCents: 30000, category: '人工支出' })
    expect(cashFlow.getBalance('acct-2')).toBe(1000000 + 200000 - 50000 - 30000)
  })

  it('should generate cash flow report with daily entries', async () => {
    await cashFlow.recordInflow({ accountId: 'acct-3', date: '2026-07-15', amountCents: 100000, category: '营收入账' })
    const report = await cashFlow.getCashFlow('acct-3', '2026-07')
    expect(report.period).toBe('2026-07')
    expect(report.totalInflowCents).toBe(100000)
    expect(report.totalOutflowCents).toBe(0)
    expect(report.dailyFlows.length).toBe(28)
  })

  it('should accumulate daily inflows and outflows correctly', async () => {
    await cashFlow.recordInflow({ accountId: 'acct-4', date: '2026-07-10', amountCents: 50000, category: '营收入账' })
    await cashFlow.recordOutflow({ accountId: 'acct-4', date: '2026-07-10', amountCents: 20000, category: '采购付款' })
    await cashFlow.recordOutflow({ accountId: 'acct-4', date: '2026-07-10', amountCents: 10000, category: '人工支出' })
    await cashFlow.recordInflow({ accountId: 'acct-4', date: '2026-07-11', amountCents: 30000, category: '营收入账' })

    const report = await cashFlow.getCashFlow('acct-4', '2026-07')
    expect(report.totalInflowCents).toBe(50000 + 30000)
    expect(report.totalOutflowCents).toBe(20000 + 10000)
  })

  it('should provide category breakdown with inflow and outflow categories', async () => {
    await cashFlow.recordInflow({ accountId: 'acct-5', date: '2026-07-01', amountCents: 100000, category: '营收入账' })
    await cashFlow.recordOutflow({ accountId: 'acct-5', date: '2026-07-02', amountCents: 40000, category: '采购付款' })

    const report = await cashFlow.getCashFlow('acct-5', '2026-07')
    const inflowCat = report.categoryBreakdown.find((c) => c.category === '营收入账')
    expect(inflowCat).toBeDefined()
    expect(inflowCat!.inflowCents).toBe(100000)
    const outflowCat = report.categoryBreakdown.find((c) => c.category === '采购付款')
    expect(outflowCat).toBeDefined()
    expect(outflowCat!.outflowCents).toBe(40000)
  })

  // ── 边界 & 反例: recordInflow / recordOutflow ──

  it('should handle zero amount inflow without changing balance', async () => {
    await cashFlow.recordInflow({ accountId: 'acct-zero', date: '2026-07-15', amountCents: 0, category: '测试' })
    expect(cashFlow.getBalance('acct-zero')).toBe(1000000)
  })

  it('should handle zero amount outflow without changing balance', async () => {
    await cashFlow.recordOutflow({ accountId: 'acct-zero-out', date: '2026-07-15', amountCents: 0, category: '测试' })
    expect(cashFlow.getBalance('acct-zero-out')).toBe(1000000)
  })

  it('should handle negative inflow (decrease balance)', async () => {
    await cashFlow.recordInflow({ accountId: 'acct-neg', date: '2026-07-15', amountCents: -20000, category: '冲销' })
    expect(cashFlow.getBalance('acct-neg')).toBe(1000000 - 20000)
  })

  it('should allow balance to go negative on large outflow', async () => {
    await cashFlow.recordOutflow({ accountId: 'acct-over', date: '2026-07-15', amountCents: 2000000, category: '大额支出' })
    expect(cashFlow.getBalance('acct-over')).toBe(1000000 - 2000000)
    expect(cashFlow.getBalance('acct-over')).toBeLessThan(0)
  })

  it('should correctly accumulate duplicate recordInflow on same day', async () => {
    await cashFlow.recordInflow({ accountId: 'acct-dup', date: '2026-07-10', amountCents: 10000, category: '重复' })
    await cashFlow.recordInflow({ accountId: 'acct-dup', date: '2026-07-10', amountCents: 10000, category: '重复' })
    await cashFlow.recordInflow({ accountId: 'acct-dup', date: '2026-07-10', amountCents: 10000, category: '重复' })

    expect(cashFlow.getBalance('acct-dup')).toBe(1000000 + 30000)
    const report = await cashFlow.getCashFlow('acct-dup', '2026-07')
    expect(report.totalInflowCents).toBe(30000)
  })

  // ── 边界: getCashFlow ──

  it('should return empty-flow report for account with no transactions', async () => {
    const report = await cashFlow.getCashFlow('acct-empty', '2026-07')
    expect(report.totalInflowCents).toBe(0)
    expect(report.totalOutflowCents).toBe(0)
    expect(report.netFlowCents).toBe(0)
    expect(report.openingBalanceCents).toBe(1000000)
    expect(report.dailyFlows).toHaveLength(28)
  })

  it('should handle February period (28-day month) with daily flows', async () => {
    await cashFlow.recordInflow({ accountId: 'acct-feb', date: '2026-02-15', amountCents: 30000, category: '入账' })
    const report = await cashFlow.getCashFlow('acct-feb', '2026-02')
    const day15 = report.dailyFlows.find((d) => d.date === '2026-02-15')
    expect(day15).toBeDefined()
    expect(day15!.inflowCents).toBe(30000)
  })

  it('should isolate accounts: different accounts do not bleed into each other', async () => {
    await cashFlow.recordInflow({ accountId: 'acct-iso-a', date: '2026-07-15', amountCents: 50000, category: '入账' })
    await cashFlow.recordOutflow({ accountId: 'acct-iso-b', date: '2026-07-15', amountCents: 30000, category: '支出' })

    const reportA = await cashFlow.getCashFlow('acct-iso-a', '2026-07')
    expect(reportA.totalOutflowCents).toBe(0)

    const reportB = await cashFlow.getCashFlow('acct-iso-b', '2026-07')
    expect(reportB.totalInflowCents).toBe(0)
  })

  // ── 边界: reset ──

  it('should reset single account to default balance', async () => {
    await cashFlow.recordInflow({ accountId: 'acct-reset', date: '2026-07-01', amountCents: 500000, category: '入账' })
    cashFlow.reset('acct-reset')
    expect(cashFlow.getBalance('acct-reset')).toBe(1000000)
  })

  it('should preserve other accounts after single reset', async () => {
    await cashFlow.recordInflow({ accountId: 'acct-pra', date: '2026-07-01', amountCents: 100000, category: '入账' })
    await cashFlow.recordInflow({ accountId: 'acct-prb', date: '2026-07-01', amountCents: 200000, category: '入账' })

    cashFlow.reset('acct-pra')
    expect(cashFlow.getBalance('acct-pra')).toBe(1000000)
    expect(cashFlow.getBalance('acct-prb')).toBe(1000000 + 200000)
  })

  it('should reset all accounts to default on full reset', async () => {
    await cashFlow.recordInflow({ accountId: 'acct-fa', date: '2026-07-01', amountCents: 300000, category: '入账' })
    await cashFlow.recordInflow({ accountId: 'acct-fb', date: '2026-07-01', amountCents: 400000, category: '入账' })

    cashFlow.reset()
    expect(cashFlow.getBalance('acct-fa')).toBe(1000000)
    expect(cashFlow.getBalance('acct-fb')).toBe(1000000)
  })

  it('should reset non-existent accountId without throwing', () => {
    expect(() => cashFlow.reset('acct-never-created')).not.toThrow()
  })

  // ── 组合场景 ──

  it('should handle interleaved inflow and outflow on same day', async () => {
    await cashFlow.recordInflow({ accountId: 'acct-same-day', date: '2026-07-15', amountCents: 50000, category: '收入' })
    await cashFlow.recordOutflow({ accountId: 'acct-same-day', date: '2026-07-15', amountCents: 15000, category: '支出' })
    await cashFlow.recordInflow({ accountId: 'acct-same-day', date: '2026-07-15', amountCents: 25000, category: '冲销' })

    const report = await cashFlow.getCashFlow('acct-same-day', '2026-07')
    expect(report.totalInflowCents).toBe(75000)
    expect(report.totalOutflowCents).toBe(15000)

    const day15 = report.dailyFlows.find((d) => d.date === '2026-07-15')
    expect(day15).toBeDefined()
    expect(day15!.inflowCents).toBe(75000)
    expect(day15!.outflowCents).toBe(15000)
    expect(day15!.netCents).toBe(60000)
  })

  it('should handle many consecutive transactions (20 days)', async () => {
    for (let day = 1; day <= 20; day++) {
      const dateStr = `2026-07-${String(day).padStart(2, '0')}`
      await cashFlow.recordInflow({ accountId: 'acct-bulk', date: dateStr, amountCents: day * 1000, category: '批量' })
    }
    const expectedTotal = (20 * 21 / 2) * 1000
    expect(cashFlow.getBalance('acct-bulk')).toBe(1000000 + expectedTotal)

    const report = await cashFlow.getCashFlow('acct-bulk', '2026-07')
    expect(report.totalInflowCents).toBe(expectedTotal)
  })
})
