/**
 * 🐜 P-38 finance E2E — 费用分析 + 现金流追踪
 *
 * 覆盖:
 *   - CostAnalysis: 单店费用分类/环比/同比/多门店对比
 *   - CashFlow: 流入/流出/日现金流/余额追踪/分类明细
 *   - 反例: 账户不存在/余额不足
 *   - 边界: 空账套/同一天多笔/大笔流入流出
 *   - 增强: 边界值(大额/小额/零值)、并发冲突、重复提交、非法参数、状态转换异常
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

describe('增强: 费用分析 — 边界值/异常/并发', () => {
  let costAnalysis
  let storePAndL

  before(() => {
    resetFinanceDashboardTestState()
    storePAndL = new StorePAndLService()
    costAnalysis = new CostAnalysisService(storePAndL)
  })

  it('16. 大额费用分析 — 超大period不会溢出', async () => {
    // 用远未来period验证hash不会产生NaN或负值崩坏
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '2099-12')
    assert.ok(typeof analysis.totalCostCents === 'number')
    assert.ok(Number.isFinite(analysis.totalCostCents))
    assert.ok(analysis.totalCostCents >= 0)
    assert.equal(analysis.categories.length, 3)
    const totalPct = analysis.categories.reduce((s, c) => s + c.percentage, 0)
    assert.ok(Math.abs(totalPct - 100) < 0.1)
  })

  it('17. 极小门店ID — 空字符串不抛异常', async () => {
    const analysis = await costAnalysis.getCostAnalysis('', '2026-07')
    assert.ok(Number.isFinite(analysis.totalCostCents))
    assert.equal(analysis.categories.length, 3)
  })

  it('18. 非法period格式 — 仍返回合理结构', async () => {
    const analysis = await costAnalysis.getCostAnalysis('store-A1', 'bad-period')
    assert.ok(Number.isFinite(analysis.totalCostCents))
    assert.ok(typeof analysis.monthOverMonthChange === 'number')
    assert.ok(typeof analysis.yearOverYearChange === 'number')
  })

  it('19. 四舍五入验证 — 分类占比总和精确到100%', async () => {
    // 多个不同门店period验证占比精度
    const stores = ['store-A1', 'store-A2', 'store-B1', 'store-B2']
    for (const storeId of stores) {
      for (const period of ['2026-07', '2026-08', '2026-09']) {
        const analysis = await costAnalysis.getCostAnalysis(storeId, period)
        const totalPct = analysis.categories.reduce((s, c) => s + c.percentage, 0)
        assert.ok(Math.abs(totalPct - 100) < 0.1,
          `${storeId} ${period} pct sum ${totalPct} !== 100`)
      }
    }
  })

  it('20. 高额门店费用对比 — 所有字段非负', async () => {
    const results = await costAnalysis.compareStoreCosts(['store-B1', 'store-B2'], '2026-12')
    assert.equal(results.length, 2)
    for (const r of results) {
      assert.ok(Number.isFinite(r.totalCostCents))
      assert.ok(r.purchaseCostCents >= 0)
      assert.ok(r.laborCostCents >= 0)
      assert.ok(r.rentCostCents >= 0)
    }
  })

  it('21. 单门店compareStoreCosts — 只有一个元素也能正确处理', async () => {
    const results = await costAnalysis.compareStoreCosts(['store-A1'], '2026-07')
    assert.equal(results.length, 1)
    assert.equal(results[0].storeId, 'store-A1')
    assert.equal(results[0].totalCostCents, results[0].purchaseCostCents + results[0].laborCostCents + results[0].rentCostCents)
  })

  it('22. 空门店列表 — 返回空数组', async () => {
    const results = await costAnalysis.compareStoreCosts([], '2026-07')
    assert.equal(results.length, 0)
    assert.deepEqual(results, [])
  })

  it('23. 跨年环比 — 1月自动取上一年12月', async () => {
    // 调用1月的分析，确认环比不会报错
    const analysis = await costAnalysis.getCostAnalysis('store-A1', '2026-01')
    assert.ok(typeof analysis.monthOverMonthChange === 'number')
    // 应正确计算出对上一年12月的环比
    assert.ok(Number.isFinite(analysis.monthOverMonthChange))
  })

  it('24. 完全相同的两次分析 — 幂等性验证', async () => {
    const first = await costAnalysis.getCostAnalysis('store-A2', '2026-08')
    const second = await costAnalysis.getCostAnalysis('store-A2', '2026-08')
    assert.deepEqual(first, second)
  })

  it('25. 多门店对比 — 利润降序排名正确', async () => {
    const results = await costAnalysis.compareStoreCosts(
      ['store-A1', 'store-A2', 'store-B1', 'store-B2'],
      '2026-07'
    )
    assert.equal(results.length, 4)
    for (let i = 1; i < results.length; i++) {
      assert.ok(results[i - 1].totalCostCents >= results[i].totalCostCents,
        `results[${i - 1}].totalCost=${results[i - 1].totalCostCents} < results[${i}].totalCost=${results[i].totalCostCents}`)
    }
  })

  it('26. 超大额门店模拟 — 费用百万级', async () => {
    // store-B2 在高period时会产生大额数据
    const analysis = await costAnalysis.getCostAnalysis('store-B2', '2026-12')
    assert.ok(analysis.totalCostCents >= 0)
    assert.ok(analysis.categories.every(c => c.percentage >= 0))
    // 各分类金额非负
    assert.ok(analysis.categories.every(c => c.amountCents >= 0))
  })
})

describe('增强: 现金流 — 边界值/重复/并发/非法参数', () => {
  let cashFlow

  before(() => {
    cashFlow = new CashFlowService()
  })

  it('27. 超大额流入 — 单笔1000万元', async () => {
    const bigAccount = 'acct-big-inflow'
    await cashFlow.recordInflow({
      accountId: bigAccount,
      date: '2026-07-22',
      amountCents: 10_000_000,
      category: '融资',
    })
    assert.equal(cashFlow.getBalance(bigAccount), 11_000_000)
    const report = await cashFlow.getCashFlow(bigAccount, '2026-07')
    assert.equal(report.totalInflowCents, 10_000_000)
  })

  it('28. 超大额流出 — 单笔800万元', async () => {
    const bigOutAccount = 'acct-big-outflow'
    await cashFlow.recordOutflow({
      accountId: bigOutAccount,
      date: '2026-07-23',
      amountCents: 8_000_000,
      category: '设备采购',
    })
    // 1000000 - 8000000 = -7000000
    assert.equal(cashFlow.getBalance(bigOutAccount), -7_000_000)
  })

  it('29. 极小金额流入 — 1分钱不丢失', async () => {
    const tinyAccount = 'acct-tiny'
    await cashFlow.recordInflow({
      accountId: tinyAccount,
      date: '2026-07-24',
      amountCents: 1,
      category: '微收款',
    })
    assert.equal(cashFlow.getBalance(tinyAccount), 1_000_001)
  })

  it('30. 重复提交相同记录两次 — 金额应累加', async () => {
    const dupAccount = 'acct-dup'
    const rec = { accountId: dupAccount, date: '2026-07-25', amountCents: 1000, category: '重复收款' }
    await cashFlow.recordInflow(rec)
    await cashFlow.recordInflow(rec) // 重复提交
    assert.equal(cashFlow.getBalance(dupAccount), 1_002_000)
    const report = await cashFlow.getCashFlow(dupAccount, '2026-07')
    const day25 = report.dailyFlows.find(d => d.date === '2026-07-25')
    assert.ok(day25)
    // 重复流入应该累加为2000
    assert.equal(day25.inflowCents, 2000)
  })

  it('31. 净流入/流出大量交替 — 余额不漂移', async () => {
    const altAccount = 'acct-alternate'
    const ops = [
      { type: 'inflow', amount: 50000, cat: 'A' },
      { type: 'outflow', amount: 10000, cat: 'B' },
      { type: 'inflow', amount: 20000, cat: 'A' },
      { type: 'outflow', amount: 15000, cat: 'B' },
      { type: 'inflow', amount: 100000, cat: 'A' },
      { type: 'outflow', amount: 5000, cat: 'B' },
    ]
    let expectedBalance = 1_000_000
    for (const op of ops) {
      if (op.type === 'inflow') {
        await cashFlow.recordInflow({ accountId: altAccount, date: '2026-07-26', amountCents: op.amount, category: op.cat })
        expectedBalance += op.amount
      } else {
        await cashFlow.recordOutflow({ accountId: altAccount, date: '2026-07-26', amountCents: op.amount, category: op.cat })
        expectedBalance -= op.amount
      }
    }
    assert.equal(cashFlow.getBalance(altAccount), expectedBalance)
    const report = await cashFlow.getCashFlow(altAccount, '2026-07')
    const day26 = report.dailyFlows.find(d => d.date === '2026-07-26')
    assert.ok(day26)
    // net = (50000+20000+100000) - (10000+15000+5000) = 170000 - 30000 = 140000
    assert.equal(day26.inflowCents, 170_000)
    assert.equal(day26.outflowCents, 30_000)
    assert.equal(day26.netCents, 140_000)
    assert.equal(day26.balanceCents, expectedBalance)
  })

  it('32. 零分录不影响日现金流报告', async () => {
    const zeroAccount = 'acct-zero-day'
    // 当月某个日期什么都不记录，报告该日应为0
    const report = await cashFlow.getCashFlow(zeroAccount, '2026-07')
    // 找到27号（未记过账）
    const day27 = report.dailyFlows.find(d => d.date === '2026-07-27')
    assert.ok(day27)
    assert.equal(day27.inflowCents, 0)
    assert.equal(day27.outflowCents, 0)
    assert.equal(day27.netCents, 0)
    assert.equal(day27.balanceCents, 1_000_000) // never modified
  })

  it('33. 并发式快速出入 — 余额最终一致', async () => {
    const concAccount = 'acct-concurrent'
    const promises = []
    for (let i = 0; i < 10; i++) {
      promises.push(cashFlow.recordInflow({ accountId: concAccount, date: '2026-07-28', amountCents: 1000, category: '并发入' }))
      promises.push(cashFlow.recordOutflow({ accountId: concAccount, date: '2026-07-28', amountCents: 500, category: '并发出' }))
    }
    await Promise.all(promises)
    // 净效果: 10 * (1000 - 500) = 5000
    assert.equal(cashFlow.getBalance(concAccount), 1_005_000)
    const report = await cashFlow.getCashFlow(concAccount, '2026-07')
    const day28 = report.dailyFlows.find(d => d.date === '2026-07-28')
    assert.ok(day28)
    assert.equal(day28.inflowCents, 10_000)   // 10 * 1000
    assert.equal(day28.outflowCents, 5_000)   // 10 * 500
    assert.equal(day28.netCents, 5_000)
  })

  it('34. 多天连续非零记录 — 日余额累积正确', async () => {
    const multiDay = 'acct-multiday'
    await cashFlow.recordInflow({ accountId: multiDay, date: '2026-07-01', amountCents: 20000, category: 'day1入' })
    await cashFlow.recordOutflow({ accountId: multiDay, date: '2026-07-02', amountCents: 5000, category: 'day2出' })
    await cashFlow.recordInflow({ accountId: multiDay, date: '2026-07-03', amountCents: 10000, category: 'day3入' })
    await cashFlow.recordOutflow({ accountId: multiDay, date: '2026-07-05', amountCents: 8000, category: 'day5出' })

    const report = await cashFlow.getCashFlow(multiDay, '2026-07')
    const day1 = report.dailyFlows.find(d => d.date === '2026-07-01')
    assert.equal(day1.balanceCents, 1_020_000) // 1000000 + 20000
    const day2 = report.dailyFlows.find(d => d.date === '2026-07-02')
    assert.equal(day2.balanceCents, 1_015_000) // 1020000 - 5000
    const day3 = report.dailyFlows.find(d => d.date === '2026-07-03')
    assert.equal(day3.balanceCents, 1_025_000) // 1015000 + 10000
    const day4 = report.dailyFlows.find(d => d.date === '2026-07-04')
    assert.equal(day4.balanceCents, 1_025_000) // no change
    const day5 = report.dailyFlows.find(d => d.date === '2026-07-05')
    assert.equal(day5.balanceCents, 1_017_000) // 1025000 - 8000
    assert.equal(report.closingBalanceCents, 1_017_000)
  })

  it('35. 同账户多个不同分类 — categoryBreakdown完整', async () => {
    const catAccount = 'acct-categories'
    await cashFlow.recordInflow({ accountId: catAccount, date: '2026-07-29', amountCents: 3000, category: '现金' })
    await cashFlow.recordInflow({ accountId: catAccount, date: '2026-07-29', amountCents: 4000, category: '转账' })
    await cashFlow.recordOutflow({ accountId: catAccount, date: '2026-07-29', amountCents: 1500, category: '物料' })
    await cashFlow.recordOutflow({ accountId: catAccount, date: '2026-07-29', amountCents: 2500, category: '工资' })

    const report = await cashFlow.getCashFlow(catAccount, '2026-07')
    const catNames = report.categoryBreakdown.map(c => c.category)
    assert.ok(catNames.includes('现金'))
    assert.ok(catNames.includes('转账'))
    assert.ok(catNames.includes('物料'))
    assert.ok(catNames.includes('工资'))
    const cash = report.categoryBreakdown.find(c => c.category === '现金')
    assert.equal(cash.inflowCents, 3000)
    assert.equal(cash.outflowCents, 0)
    const wage = report.categoryBreakdown.find(c => c.category === '工资')
    assert.equal(wage.inflowCents, 0)
    assert.equal(wage.outflowCents, 2500)
  })

  it('36. 重置全部账户 — 所有账户余额归默认', () => {
    cashFlow.recordInflow({ accountId: 'acct-reset-all-1', date: '2026-07-30', amountCents: 99999, category: '待重置' })
    cashFlow.recordInflow({ accountId: 'acct-reset-all-2', date: '2026-07-30', amountCents: 88888, category: '待重置' })
    assert.equal(cashFlow.getBalance('acct-reset-all-1'), 1_099_999)
    assert.equal(cashFlow.getBalance('acct-reset-all-2'), 1_088_888)

    cashFlow.reset() // 全量重置

    assert.equal(cashFlow.getBalance('acct-reset-all-1'), 1_000_000)
    assert.equal(cashFlow.getBalance('acct-reset-all-2'), 1_000_000)
    // 重置后查询现金流报告，应无记录
    const report = await cashFlow.getCashFlow('acct-reset-all-1', '2026-07')
    assert.equal(report.totalInflowCents, 0)
    assert.equal(report.totalOutflowCents, 0)
  })
})
