import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { CohortAnalyzer } from './cohort-analyzer'
import { CohortAdapter } from './datasources/cohort.adapter'
import { EventAdapter } from './datasources/event.adapter'
import { EventCollector } from './event-collector'

describe('CohortAnalyzer', () => {
  let analyzer: CohortAnalyzer
  let cohortAdapter: CohortAdapter
  let eventAdapter: EventAdapter
  let collector: EventCollector

  beforeEach(() => {
    cohortAdapter = new CohortAdapter()
    eventAdapter = new EventAdapter()
    collector = new EventCollector(eventAdapter)
    analyzer = new CohortAnalyzer(cohortAdapter, eventAdapter)
  })

  describe('periodKey', () => {
    it('WEEKLY 生成 ISO 周编号', () => {
      const key = analyzer.periodKey(new Date('2025-06-01'), 'WEEKLY')
      assert.match(key, /^\d{4}-W\d{2}$/)
    })

    it('MONTHLY 生成 YYYY-MM', () => {
      assert.equal(analyzer.periodKey(new Date('2025-06-15'), 'MONTHLY'), '2025-06')
      assert.equal(analyzer.periodKey(new Date('2025-01-01'), 'MONTHLY'), '2025-01')
    })

    it('同周不同日 = 同一 key', () => {
      const a = analyzer.periodKey(new Date('2025-06-02'), 'WEEKLY')  // 周一
      const b = analyzer.periodKey(new Date('2025-06-06'), 'WEEKLY')  // 周五
      assert.equal(a, b)
    })

    it('不同月 = 不同 key', () => {
      const a = analyzer.periodKey(new Date('2025-05-31'), 'MONTHLY')
      const b = analyzer.periodKey(new Date('2025-06-01'), 'MONTHLY')
      assert.notEqual(a, b)
    })
  })

  describe('buildCohort', () => {
    it('新 cohort 初始 retention[0] = 1.0', () => {
      const reg = new Date(Date.now() - 86400000)
      const c = analyzer.buildCohort('t1', 'WEEKLY', reg, ['m1'], Date.now())
      assert.equal(c.cohortSize, 1)
      // D0 应有事件
      collector.collect({
        tenantId: 't1', eventId: 'evt-d0-1', type: 'PAGEVIEW',
        who: 'm1', what: 'p', memberId: 'm1',
        timestamp: new Date(reg.getTime() + 3600000).toISOString()
      })
      const rebuilt = analyzer.buildCohort('t1', 'WEEKLY', reg, ['m1'], Date.now())
      assert.ok(rebuilt.retention[0] >= 0.99)
    })

    it('D30 留存 (距离注册 30 天后活跃)', () => {
      const reg = new Date(Date.now() - 35 * 86400000)
      const activeTime = new Date(reg.getTime() + 30 * 86400000 + 3600000)
      collector.collect({
        tenantId: 't1', eventId: 'evt-d30', type: 'PAGEVIEW',
        who: 'm1', what: 'p', memberId: 'm1',
        timestamp: activeTime.toISOString()
      })
      const c = analyzer.buildCohort('t1', 'WEEKLY', reg, ['m1'], Date.now())
      assert.equal(c.retention[3], 1.0)  // D30 = 1.0 (100% 活跃)
    })

    it('未到时间点 retention = -1', () => {
      const reg = new Date()  // 刚刚注册, 没有 D1 数据
      const c = analyzer.buildCohort('t1', 'WEEKLY', reg, ['m1'], Date.now())
      // D1/D7/D30 都未到
      assert.equal(c.retention[1], -1)
      assert.equal(c.retention[2], -1)
      assert.equal(c.retention[3], -1)
    })

    it('空 cohort retention = 0', () => {
      const reg = new Date(Date.now() - 100 * 86400000)
      const c = analyzer.buildCohort('t1', 'WEEKLY', reg, [], Date.now())
      assert.equal(c.cohortSize, 0)
      assert.ok(c.retention.every(r => r === 0))
    })

    it('cohortSize = members.length', () => {
      const reg = new Date(Date.now() - 2 * 86400000)
      const c = analyzer.buildCohort('t1', 'WEEKLY', reg, ['m1', 'm2', 'm3'], Date.now())
      assert.equal(c.cohortSize, 3)
    })

    it('endDate ≤ registration + 365d', () => {
      const reg = new Date(Date.now() - 100 * 86400000)
      const c = analyzer.buildCohort('t1', 'WEEKLY', reg, ['m1'], Date.now())
      const regMs = new Date(c.startDate).getTime()
      const endMs = new Date(c.endDate).getTime()
      assert.ok(endMs - regMs <= 365 * 86400000)
    })
  })

  describe('buildMatrix', () => {
    it('空租户返回空矩阵', () => {
      const m = analyzer.buildMatrix('t-empty', 'WEEKLY')
      assert.equal(m.matrix.length, 0)
    })

    it('返回最近 N 期 (默认 12)', () => {
      const now = Date.now()
      for (let i = 0; i < 20; i++) {
        const reg = new Date(now - (i + 5) * 7 * 86400000)
        analyzer.buildCohort('t1', 'WEEKLY', reg, [`m-${i}`], now)
      }
      const m = analyzer.buildMatrix('t1', 'WEEKLY')
      assert.ok(m.matrix.length <= 12)
    })
  })

  describe('isReliable', () => {
    it('cohortSize >= 10 = reliable', () => {
      const c = { ...makeFakeCohort(), cohortSize: 10 }
      assert.equal(analyzer.isReliable(c), true)
    })

    it('cohortSize < 10 = unreliable', () => {
      const c = { ...makeFakeCohort(), cohortSize: 5 }
      assert.equal(analyzer.isReliable(c), false)
    })
  })

  describe('getAvgRetention', () => {
    it('空租户返回 0', () => {
      const avg = analyzer.getAvgRetention('t-empty', 'WEEKLY')
      assert.deepEqual(avg, { d1: 0, d7: 0, d30: 0 })
    })

    it('多 cohort 平均', () => {
      const now = Date.now()
      for (let i = 0; i < 3; i++) {
        const reg = new Date(now - (35 + i * 7) * 86400000)
        analyzer.buildCohort('t1', 'WEEKLY', reg, ['m1'], now)
      }
      const avg = analyzer.getAvgRetention('t1', 'WEEKLY')
      assert.ok(typeof avg.d1 === 'number')
    })
  })

  function makeFakeCohort() {
    return {
      id: 'fake', tenantId: 't1', period: 'WEEKLY' as const,
      periodKey: '2025-W01', cohortSize: 10,
      retention: [1, 0.5, 0.3, 0.2, 0.1, 0.05],
      startDate: '2025-01-01', endDate: '2025-01-08'
    }
  }
})