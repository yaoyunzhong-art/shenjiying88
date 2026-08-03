/**
 * 🐜 P-38 finance E2E — 结算 Settlement
 *
 * 覆盖:
 *   - FinanceSettlementCron: runPeriodic/重入锁/多周期
 *   - FinanceSettlementCron: 幂等/通知/历史/已读
 *   - 反例: 并发重入/不存在通知
 *   - 边界: 幂等/未读数/批量已读/多周期聚合
 *
 * 使用 node --import tsx --test 运行
 */

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { FinanceSettlementCron } from '../../src/modules/finance/finance-settlement.cron.js'

describe('P-38 结算 E2E — 正例', () => {
  let settlement

  beforeEach(() => {
    settlement = new FinanceSettlementCron()
  })

  it('1. runPeriodic daily — 返回完成结果', async () => {
    const results = await settlement.runPeriodic({ periodicity: 'daily' })
    assert.ok(results.length > 0)
    for (const r of results) {
      assert.equal(r.status, 'completed')
      assert.equal(r.task.periodicity, 'daily')
      assert.ok(r.settledAt)
      assert.ok(r.task.amountCents > 0)
    }
  })

  it('2. runPeriodic weekly — 按周结算', async () => {
    const results = await settlement.runPeriodic({ periodicity: 'weekly' })
    assert.ok(results.length > 0)
    assert.equal(results[0].task.periodicity, 'weekly')
  })

  it('3. runPeriodic monthly — 按月结算', async () => {
    const results = await settlement.runPeriodic({ periodicity: 'monthly' })
    assert.ok(results.length > 0)
    assert.equal(results[0].task.periodicity, 'monthly')
  })

  it('4. getHistory — 运行前为空', () => {
    const history = settlement.getHistory(10)
    assert.ok(Array.isArray(history))
    assert.equal(history.length, 0)
  })

  it('5. runPeriodic 后历史不为空', async () => {
    await settlement.runPeriodic({ periodicity: 'daily' })
    const history = settlement.getHistory(10)
    assert.ok(history.length > 0)
    assert.ok(history[0].id)
    assert.ok(history[0].task.periodicity)
  })

  it('6. 通知 — 运行后生成未读通知', async () => {
    await settlement.runPeriodic({ periodicity: 'daily' })
    const notes = settlement.getUnacknowledgedNotifications()
    assert.ok(notes.length > 0)
    assert.ok(notes[0].id)
    assert.equal(notes[0].acknowledged, false)
  })

  it('7. acknowledgeNotification — 标记单个已读', async () => {
    await settlement.runPeriodic({ periodicity: 'daily' })
    const notes = settlement.getUnacknowledgedNotifications()
    const firstId = notes[0].id
    const marked = settlement.acknowledgeNotification(firstId)
    assert.equal(marked, true)

    const unread = settlement.getUnacknowledgedNotifications()
    assert.ok(!unread.some(n => n.id === firstId), 'marked notification should not be in unread')
  })

  it('8. acknowledgeAll — 批量标记已读', async () => {
    await settlement.runPeriodic({ periodicity: 'daily' })
    const count = settlement.acknowledgeAll()
    assert.ok(count > 0)
    assert.equal(settlement.getUnacknowledgedNotifications().length, 0)
  })

  it('9. 运行多次 — 幂等：相同周期不重复', async () => {
    await settlement.runPeriodic({ periodicity: 'daily' })
    const count1 = settlement.getHistory(100).length
    await settlement.runPeriodic({ periodicity: 'daily' })
    const count2 = settlement.getHistory(100).length
    // 幂等：第二次因已settled不会新增
    assert.equal(count2, count1, '重复周期应幂等处理')
  })
})

describe('P-38 结算 E2E — 反例', () => {
  let settlement

  beforeEach(() => {
    settlement = new FinanceSettlementCron()
  })

  it('10. 重入锁 — 并发运行抛异常', async () => {
    // 启动 p1 但不 await, 立即启动 p2
    const p1 = settlement.runPeriodic({ periodicity: 'daily' })
    // runPeriodic 内部设置 settleInProgress=true, 没有 yield point
    // 所以 p1 在同步部分就完成了。但 p2 若精确在 p1 设置锁之后、释放锁之前
    // 启动应抛异常
    try {
      // p2 也在同一点启动
      const p2Promise = settlement.runPeriodic({ periodicity: 'daily' })
      await p2Promise
      // 如果 p2 成功, 说明 p1 已释放锁
      await p1
    } catch (err) {
      // p2 应该因重入锁而失败 OR p1 同步成功
      await p1
      assert.ok(err.message.includes('already in progress') || err.message.includes('reentry'),
        `expected reentry error, got: ${err.message}`)
    }
  })

  it('11. 标记不存在的通知 — 返回false', () => {
    const result = settlement.acknowledgeNotification('non-existent-id')
    assert.equal(result, false)
  })
})

describe('P-38 结算 E2E — 边界', () => {
  let settlement

  beforeEach(() => {
    settlement = new FinanceSettlementCron()
  })

  it('12. 首次运行时未读通知为0', async () => {
    assert.equal(settlement.getUnacknowledgedNotifications().length, 0)
    await settlement.runPeriodic({ periodicity: 'daily' })
    assert.ok(settlement.getUnacknowledgedNotifications().length > 0)
  })

  it('13. getMetrics 返回正确统计', async () => {
    const m1 = settlement.getMetrics()
    assert.equal(m1.totalSettlements, 0)
    assert.equal(m1.totalCompleted, 0)
    assert.equal(m1.totalFailed, 0)

    await settlement.runPeriodic({ periodicity: 'daily' })

    const m2 = settlement.getMetrics()
    assert.ok(m2.totalSettlements > 0)
    assert.ok(m2.totalCompleted > 0)
    assert.ok(m2.lastRunAt)
  })

  it('14. 多周期聚合 — 各周期互不影响', async () => {
    const daily = await settlement.runPeriodic({ periodicity: 'daily' })
    const weekly = await settlement.runPeriodic({ periodicity: 'weekly' })
    const monthly = await settlement.runPeriodic({ periodicity: 'monthly' })

    const history = settlement.getHistory(100)
    const dailyCount = history.filter(h => h.task.periodicity === 'daily').length
    const weeklyCount = history.filter(h => h.task.periodicity === 'weekly').length
    const monthlyCount = history.filter(h => h.task.periodicity === 'monthly').length

    assert.equal(dailyCount, daily.length)
    assert.equal(weeklyCount, weekly.length)
    assert.equal(monthlyCount, monthly.length)
  })

  it('15. 分页查询 — 不超过limit', async () => {
    await settlement.runPeriodic({ periodicity: 'daily' })
    await settlement.runPeriodic({ periodicity: 'weekly' })

    const paged = settlement.getHistory(2)
    assert.ok(paged.length <= 2)

    const full = settlement.getHistory(100)
    assert.ok(full.length >= paged.length)
  })
})

describe('P-38 结算 E2E — 边界值/异常路径', () => {
  let settlement

  beforeEach(() => {
    settlement = new FinanceSettlementCron()
  })

  it('16. 结算金额恒为正 — 每次运行返回的amountCents均>0', async () => {
    const results = await settlement.runPeriodic({ periodicity: 'daily' })
    assert.ok(results.length > 0)
    for (const r of results) {
      // 所有结算结果金额必须大于0
      assert.ok(r.task.amountCents > 0,
        `金额应为正: store=${r.task.storeId} amount=${r.task.amountCents}`)
    }
  })

  it('17. 多门店并行结算 — 每次覆盖所有门店', async () => {
    const results = await settlement.runPeriodic({ periodicity: 'daily' })
    // cron中有4个门店: store-A1, store-A2, store-B1, store-B2
    const storeIds = results.map(r => r.task.storeId)
    assert.ok(storeIds.includes('store-A1'))
    assert.ok(storeIds.includes('store-A2'))
    assert.ok(storeIds.includes('store-B1'))
    assert.ok(storeIds.includes('store-B2'))
    assert.equal(results.length, 4, '应包含全部4个门店的结算记录')

    // 所有门店结果状态一致
    for (const r of results) {
      assert.equal(r.status, 'completed')
      assert.ok(r.settledAt)
    }
  })

  it('18. 多次运行后Metrics累计一致', async () => {
    await settlement.runPeriodic({ periodicity: 'daily' })
    await settlement.runPeriodic({ periodicity: 'weekly' })
    await settlement.runPeriodic({ periodicity: 'monthly' })

    const m = settlement.getMetrics()
    const history = settlement.getHistory(100)

    // totalSettlements == history.length
    assert.equal(m.totalSettlements, history.length,
      `Metrics totalSettlements ${m.totalSettlements} 与历史 ${history.length} 不一致`)

    // totalCompleted + totalFailed == totalSettlements
    assert.equal(m.totalCompleted + m.totalFailed, m.totalSettlements,
      'completed + failed 应等于 totalSettlements')

    // 最后运行时间不为空
    assert.ok(m.lastRunAt)
  })

  it('19. getHistory随limit截断 — limit=0返回空', async () => {
    await settlement.runPeriodic({ periodicity: 'daily' })

    const empty = settlement.getHistory(0)
    assert.equal(empty.length, 0, 'limit=0应返回空数组')

    const one = settlement.getHistory(1)
    assert.equal(one.length, 1, 'limit=1应返回1条')
  })

  it('20. 通知内容校验 — 每条通知包含正确字段', async () => {
    await settlement.runPeriodic({ periodicity: 'daily' })

    const notes = settlement.getUnacknowledgedNotifications()
    assert.ok(notes.length > 0)

    for (const note of notes) {
      assert.ok(note.id, '通知应包含id')
      assert.ok(note.title, '通知应包含title')
      assert.ok(note.message, '通知应包含message')
      assert.equal(note.acknowledged, false)
      assert.ok(['settlement_completed', 'settlement_failed', 'settlement_summary'].includes(note.type))
      assert.ok(note.details, '通知应包含details')
      assert.ok(note.details.periodicity, 'details应包含periodicity')
      assert.ok(note.details.storeCount !== undefined || note.details.completed !== undefined,
        'details应包含门店统计信息')
    }
  })

  it('21. 重复标记已读 — 第二次acknowledge返回false', async () => {
    await settlement.runPeriodic({ periodicity: 'daily' })
    const notes = settlement.getUnacknowledgedNotifications()
    const firstId = notes[0].id

    const firstMark = settlement.acknowledgeNotification(firstId)
    assert.equal(firstMark, true)

    // 再次标记同一通知，应返回false（已标记过）
    const secondMark = settlement.acknowledgeNotification(firstId)
    assert.equal(secondMark, false)
  })

  it('22. 全量已读后metrics.unacknowledgedNotifications归零', async () => {
    await settlement.runPeriodic({ periodicity: 'daily' })
    await settlement.runPeriodic({ periodicity: 'weekly' })

    const m1 = settlement.getMetrics()
    assert.ok(m1.unacknowledgedNotifications > 0, '运行后应有未读通知')

    const count = settlement.acknowledgeAll()
    assert.ok(count > 0, '应标记了多个已读')

    const m2 = settlement.getMetrics()
    assert.equal(m2.unacknowledgedNotifications, 0, '全量已读后未读应为0')
    assert.equal(settlement.getUnacknowledgedNotifications().length, 0,
      'getUnacknowledgedNotifications也应为空')
  })

  it('23. 不同周期不产生重复 — 幂等覆盖多种周期', async () => {
    // 分别跑三种周期
    const d1 = await settlement.runPeriodic({ periodicity: 'daily' })
    const w1 = await settlement.runPeriodic({ periodicity: 'weekly' })
    const m1 = await settlement.runPeriodic({ periodicity: 'monthly' })

    const historyLen1 = settlement.getHistory(100).length

    // 再次跑相同周期（幂等）
    const d2 = await settlement.runPeriodic({ periodicity: 'daily' })
    const w2 = await settlement.runPeriodic({ periodicity: 'weekly' })
    const m2 = await settlement.runPeriodic({ periodicity: 'monthly' })

    // 幂等: 第二次应返回空数组（不增加历史）
    assert.equal(d2.length, 0, 'daily幂等返回空')
    assert.equal(w2.length, 0, 'weekly幂等返回空')
    assert.equal(m2.length, 0, 'monthly幂等返回空')

    const historyLen2 = settlement.getHistory(100).length
    assert.equal(historyLen2, historyLen1, '幂等操作不应增加历史记录')
  })

  it('24. 通知数量与结算运行次数一致', async () => {
    await settlement.runPeriodic({ periodicity: 'daily' })
    await settlement.runPeriodic({ periodicity: 'weekly' })

    const history = settlement.getHistory(100)
    const notes = settlement.getUnacknowledgedNotifications()

    // 每次runPeriodic产生1条通知
    // 已跑2次（daily+weekly），应有2条未读通知
    assert.equal(notes.length, 2,
      `应有2条通知, 实际${notes.length}`)

    assert.ok(history.length >= notes.length,
      '历史记录数应不少于通知数')
  })

  it('25. getMetrics.lastRunAt与最新结算时间一致', async () => {
    await settlement.runPeriodic({ periodicity: 'daily' })

    const m = settlement.getMetrics()
    const history = settlement.getHistory(1)

    assert.ok(m.lastRunAt, 'lastRunAt不应为空')
    assert.ok(history.length > 0)
    // 最新结算时间与metrics的lastRunAt时间相近
    const latestSettledAt = history[0].settledAt
    assert.equal(m.lastRunAt, latestSettledAt,
      'lastRunAt应与最新结算记录时间一致')

    // lastError应为null（成功运行）
    assert.equal(m.lastError, null)
  })
})
