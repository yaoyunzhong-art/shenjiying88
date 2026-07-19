/**
 * 🐜 P-38 finance E2E — 费用分析 + 现金流追踪
 *
 * 覆盖:
 *   - CostAnalysis: 单店费用分类/环比/同比/多门店对比
 *   - CashFlow: 流入/流出/日现金流/余额追踪/分类明细
 *   - 反例: 账户不存在/余额不足
 *   - 边界: 空账套/同一天多笔/大笔流入流出
 *
 * 使用 node --import tsx --test 运行
 */

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import {
  StorePAndLService,
  resetFinanceDashboardTestState,
} from '../../src/modules/finance/finance-dashboard.service.js'
import {
  CostAnalysisService,
  CashFlowService,
} from '../../src/modules/finance/finance-cost-cash-flow.service.js'

describe('P-38 费用分析 E2E — 正例', () => {
  let costAnalysis
  let storePAndL

  before(() => {
    resetFinanceDashboardTestState()
    storePAndL = new StorePAndLService()
    costAnalysis = new CostAnalysisService(storePAndL)
  })

  it('1. 单店费用分析 — 含分类占比', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '2026-07')
    assert.ok(analysis.totalCostCents > 0)
    assert.equal(analysis.categories.length, 3)
    // 成本分类名称
    const categories = analysis.categories.map(c => c.category)
    assert.ok(categories.includes('采购成本'))
    assert.ok(categories.includes('人力成本'))
    assert.ok(categories.includes('租金'))
    // 占比总和 ≈ 100%
    const totalPct = analysis.categories.reduce((s, c) => s + c.percentage, 0)
    assert.ok(Math.abs(totalPct - 100) < 0.1, `category percentages should sum to ~100%, got ${totalPct}`)
  })

  it('2. 费用分析 — 环比 (MoM)', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '2026-07')
    // 环比值应存在（可能为正或负）
    assert.ok(typeof analysis.monthOverMonthChange === 'number')
  })

  it('3. 费用分析 — 同比 (YoY)', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '2026-07')
    assert.ok(typeof analysis.yearOverYearChange === 'number')
  })

  it('4. 多门店费用对比 — 按总额降序', async () => {
    const results = await costAnalysis.compareStoreCosts(['store-A1', 'store-A2'], '2026-07')
    assert.equal(results.length, 2)
    assert.ok(results[0].totalCostCents >= results[1].totalCostCents)
    assert.ok(results.every(r => r.totalCostCents === r.purchaseCostCents + r.laborCostCents + r.rentCostCents))
  })

  it('5. 费用分类数量 — 各分类有count', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-B1', '2026-08')
    for (const cat of analysis.categories) {
      assert.ok(cat.count >= 1, `category ${cat.category} should have count >= 1`)
    }
  })
})

describe('P-38 现金流 E2E — 正例', () => {
  let cashFlow

  before(() => {
    cashFlow = new CashFlowService()
  })

  it('6. 记录现金流入 — 增加余额', async () => {
    await cashFlow.recordInflow({
      accountId: 'acct-cf-001',
      date: '2026-07-15',
      amountCents: 50000,
      category: '销售收款',
    })
    const balance = cashFlow.getBalance('acct-cf-001')
    // 初始余额 1000000 + 50000 = 1050000
    assert.equal(balance, 1050000)
  })

  it('7. 记录现金流出 — 减少余额', async () => {
    await cashFlow.recordOutflow({
      accountId: 'acct-cf-001',
      date: '2026-07-15',
      amountCents: 20000,
      category: '采购支出',
    })
    const balance = cashFlow.getBalance('acct-cf-001')
    assert.equal(balance, 1030000) // 1050000 - 20000
  })

  it('8. 日现金流报告 — 含每日明细和分类', async () => {
    const report = await cashFlow.getCashFlow('acct-cf-001', '2026-07')
    assert.equal(report.period, '2026-07')
    assert.ok(report.totalInflowCents > 0)
    assert.ok(report.totalOutflowCents > 0)
    assert.equal(report.netFlowCents, report.totalInflowCents - report.totalOutflowCents)
    assert.ok(Array.isArray(report.dailyFlows))
    assert.ok(report.dailyFlows.length > 0)
    // last day balance = closing balance
    const lastDay = report.dailyFlows[report.dailyFlows.length - 1]
    assert.equal(lastDay.balanceCents, report.closingBalanceCents)
  })

  it('9. 现金流 — 分类明细', async () => {
    await cashFlow.recordInflow({
      accountId: 'acct-cf-002',
      date: '2026-07-16',
      amountCents: 100000,
      category: '微信收款',
    })
    await cashFlow.recordOutflow({
      accountId: 'acct-cf-002',
      date: '2026-07-16',
      amountCents: 30000,
      category: '房租',
    })
    const report = await cashFlow.getCashFlow('acct-cf-002', '2026-07')
    assert.ok(report.categoryBreakdown.length > 0)
    const inflowCat = report.categoryBreakdown.find(c => c.category === '微信收款')
    assert.ok(inflowCat)
    assert.equal(inflowCat.inflowCents, 100000)
    const outflowCat = report.categoryBreakdown.find(c => c.category === '房租')
    assert.ok(outflowCat)
    assert.equal(outflowCat.outflowCents, 30000)
  })

  it('10. 多账户隔离 — 不同账户余额独立', async () => {
    await cashFlow.recordInflow({
      accountId: 'acct-cf-isolated-1',
      date: '2026-07-17',
      amountCents: 50000,
      category: 'POS收款',
    })
    await cashFlow.recordInflow({
      accountId: 'acct-cf-isolated-2',
      date: '2026-07-17',
      amountCents: 100000,
      category: '支付宝收款',
    })
    const bal1 = cashFlow.getBalance('acct-cf-isolated-1')
    const bal2 = cashFlow.getBalance('acct-cf-isolated-2')
    assert.equal(bal1, 1050000) // 1000000 + 50000
    assert.equal(bal2, 1100000) // 1000000 + 100000
    assert.notEqual(bal1, bal2)
  })
})

describe('P-38 现金流 E2E — 反例', () => {
  let cashFlow

  before(() => {
    cashFlow = new CashFlowService()
  })

  it('11. 空账户余额 — 默认1000000', () => {
    const balance = cashFlow.getBalance('acct-nonexistent')
    assert.equal(balance, 1000000)
  })

  it('12. 大笔流出超过余额 — 余额可为负', async () => {
    await cashFlow.recordOutflow({
      accountId: 'acct-overdraft',
      date: '2026-07-18',
      amountCents: 2000000,
      category: '大额支出',
    })
    const balance = cashFlow.getBalance('acct-overdraft')
    // 1000000 - 2000000 = -1000000
    assert.equal(balance, -1000000)
  })
})

describe('P-38 现金流 E2E — 边界', () => {
  let cashFlow

  before(() => {
    cashFlow = new CashFlowService()
  })

  it('13. 同一账户同一天多笔流入流出', async () => {
    await cashFlow.recordInflow({ accountId: 'acct-multi', date: '2026-07-19', amountCents: 3000, category: '退款' })
    await cashFlow.recordOutflow({ accountId: 'acct-multi', date: '2026-07-19', amountCents: 1000, category: '手续费' })
    await cashFlow.recordInflow({ accountId: 'acct-multi', date: '2026-07-19', amountCents: 5000, category: '销售收入' })
    await cashFlow.recordOutflow({ accountId: 'acct-multi', date: '2026-07-19', amountCents: 2000, category: '采购' })

    const report = await cashFlow.getCashFlow('acct-multi', '2026-07')
    const day19 = report.dailyFlows.find(d => d.date === '2026-07-19')
    assert.ok(day19)
    assert.equal(day19.inflowCents, 8000)  // 3000 + 5000
    assert.equal(day19.outflowCents, 3000) // 1000 + 2000
    assert.equal(day19.netCents, 5000)
  })

  it('14. 重置账户 — balance恢复默认', () => {
    cashFlow.recordInflow({ accountId: 'acct-reset-test', date: '2026-07-20', amountCents: 50000, category: 'test' })
    assert.equal(cashFlow.getBalance('acct-reset-test'), 1050000)
    cashFlow.reset('acct-reset-test')
    assert.equal(cashFlow.getBalance('acct-reset-test'), 1000000)
  })

  it('15. 0金额流入/流出 — 余额不变', async () => {
    const before = cashFlow.getBalance('acct-zero')
    await cashFlow.recordInflow({ accountId: 'acct-zero', date: '2026-07-21', amountCents: 0, category: '零入' })
    await cashFlow.recordOutflow({ accountId: 'acct-zero', date: '2026-07-21', amountCents: 0, category: '零出' })
    const after = cashFlow.getBalance('acct-zero')
    assert.equal(before, after)
  })
})
