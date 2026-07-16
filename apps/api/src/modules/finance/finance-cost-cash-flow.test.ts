/**
 * finance-cost-cash-flow.test.ts — P-38 100% 费用分析 + 现金流追踪测试
 *
 * 覆盖: CostAnalysisService (6) + CashFlowService (8) = 14 test cases
 * 要求: 0 as any, 0 skip/todo/fixme
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { StorePAndLService, resetFinanceDashboardTestState } from './finance-dashboard.service'
import { CostAnalysisService, CashFlowService } from './finance-cost-cash-flow.service'

// ══════════════════════════════════════════════════════════════════════════════
// CostAnalysisService 测试
// ══════════════════════════════════════════════════════════════════════════════

describe('CostAnalysisService', () => {
  let storePAndL: StorePAndLService
  let costAnalysis: CostAnalysisService

  beforeEach(() => {
    resetFinanceDashboardTestState()
    storePAndL = new StorePAndLService()
    costAnalysis = new CostAnalysisService(storePAndL)
  })

  it('should return cost analysis with three categories', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '2026-06')
    expect(analysis.totalCostCents).toBeGreaterThan(0)
    expect(analysis.categories).toHaveLength(3)
    expect(analysis.categories[0].category).toBe('采购成本')
    expect(analysis.categories[1].category).toBe('人力成本')
    expect(analysis.categories[2].category).toBe('租金')
  })

  it('should have valid percentage sum across categories', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '2026-06')
    const totalPct = analysis.categories.reduce((sum, c) => sum + c.percentage, 0)
    expect(Math.abs(totalPct - 100)).toBeLessThan(1)
  })

  it('should return numeric monthOverMonthChange', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '2026-06')
    expect(typeof analysis.monthOverMonthChange).toBe('number')
    expect(Number.isFinite(analysis.monthOverMonthChange)).toBe(true)
  })

  it('should return numeric yearOverYearChange', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '2026-06')
    expect(typeof analysis.yearOverYearChange).toBe('number')
    expect(Number.isFinite(analysis.yearOverYearChange)).toBe(true)
  })

  it('should handle different stores differently', async () => {
    const analysisA = await costAnalysis.getCostAnalysis('store-A1', '2026-06')
    const analysisB = await costAnalysis.getCostAnalysis('store-B1', '2026-06')
    // Different stores should have different amounts
    expect(analysisA.totalCostCents).not.toBe(analysisB.totalCostCents)
  })

  it('should compare store costs sorted descending', async () => {
    const results = await costAnalysis.compareStoreCosts(
      ['store-A1', 'store-A2', 'store-B1'],
      '2026-06'
    )
    expect(results).toHaveLength(3)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].totalCostCents).toBeGreaterThanOrEqual(results[i].totalCostCents)
    }
  })

  it('should include all cost fields in comparison', async () => {
    const results = await costAnalysis.compareStoreCosts(['store-A1'], '2026-06')
    const r = results[0]
    expect(typeof r.storeId).toBe('string')
    expect(typeof r.totalCostCents).toBe('number')
    expect(typeof r.purchaseCostCents).toBe('number')
    expect(typeof r.laborCostCents).toBe('number')
    expect(typeof r.rentCostCents).toBe('number')
    expect(r.totalCostCents).toBe(r.purchaseCostCents + r.laborCostCents + r.rentCostCents)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// CashFlowService 测试
// ══════════════════════════════════════════════════════════════════════════════

describe('CashFlowService', () => {
  let cashFlow: CashFlowService

  beforeEach(() => {
    cashFlow = new CashFlowService()
    cashFlow.reset()
  })

  it('should return default balance for new account', () => {
    const balance = cashFlow.getBalance('acct-new')
    expect(balance).toBe(1000000) // default 10000元
  })

  it('should increase balance on inflow', async () => {
    await cashFlow.recordInflow({
      accountId: 'acct-1', date: '2026-07-15', amountCents: 50000, category: '营收入账'
    })
    expect(cashFlow.getBalance('acct-1')).toBe(1000000 + 50000)
  })

  it('should decrease balance on outflow', async () => {
    await cashFlow.recordOutflow({
      accountId: 'acct-1', date: '2026-07-15', amountCents: 30000, category: '采购付款'
    })
    expect(cashFlow.getBalance('acct-1')).toBe(1000000 - 30000)
  })

  it('should track multiple transactions correctly', async () => {
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
    expect(report.netFlowCents).toBe(100000)
    expect(report.dailyFlows.length).toBeGreaterThanOrEqual(1)
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

  it('should provide category breakdowns', async () => {
    await cashFlow.recordInflow({ accountId: 'acct-5', date: '2026-07-01', amountCents: 100000, category: '营收入账' })
    await cashFlow.recordOutflow({ accountId: 'acct-5', date: '2026-07-02', amountCents: 40000, category: '采购付款' })
    await cashFlow.recordOutflow({ accountId: 'acct-5', date: '2026-07-03', amountCents: 20000, category: '人工支出' })

    const report = await cashFlow.getCashFlow('acct-5', '2026-07')
    expect(report.categoryBreakdown.length).toBeGreaterThanOrEqual(2)
    const inflowCat = report.categoryBreakdown.find((c) => c.category === '营收入账')
    expect(inflowCat).toBeDefined()
    expect(inflowCat!.inflowCents).toBe(100000)

    const purchaseCat = report.categoryBreakdown.find((c) => c.category === '采购付款')
    expect(purchaseCat).toBeDefined()
    expect(purchaseCat!.outflowCents).toBe(40000)
  })

  it('should reset correctly', async () => {
    await cashFlow.recordInflow({ accountId: 'acct-r', date: '2026-07-01', amountCents: 50000, category: '营收入账' })
    expect(cashFlow.getBalance('acct-r')).toBeGreaterThan(1000000)

    cashFlow.reset('acct-r')
    expect(cashFlow.getBalance('acct-r')).toBe(1000000) // back to default
  })
})
