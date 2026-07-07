import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { AnalyticsV2Controller } from './analytics-v2.controller'
import { EventCollector } from './event-collector'
import { CDCStream } from './cdc-stream'
import { CohortAnalyzer } from './cohort-analyzer'
import { FunnelCalculator } from './funnel-calculator'
import { CohortService } from './services/cohort.service'
import { FunnelService } from './services/funnel.service'
import { RetentionService } from './services/retention.service'
import { MetricsService } from './services/metrics.service'
import { EventAdapter } from './datasources/event.adapter'
import { CDCAdapter } from './datasources/cdc.adapter'
import { CohortAdapter } from './datasources/cohort.adapter'
import { FunnelAdapter } from './datasources/funnel.adapter'
import { RetentionAdapter } from './datasources/retention.adapter'

describe('AnalyticsV2Controller', () => {
  let ctrl: AnalyticsV2Controller

  beforeEach(() => {
    const eventAdapter = new EventAdapter()
    const cdcAdapter = new CDCAdapter()
    const cohortAdapter = new CohortAdapter()
    const funnelAdapter = new FunnelAdapter()
    const retentionAdapter = new RetentionAdapter()
    const collector = new EventCollector(eventAdapter)
    const cdcStream = new CDCStream(cdcAdapter)
    const cohortAnalyzer = new CohortAnalyzer(cohortAdapter, eventAdapter)
    const funnelCalc = new FunnelCalculator(funnelAdapter, eventAdapter)
    const cohortSvc = new CohortService(cohortAnalyzer, cohortAdapter, collector, cdcStream, eventAdapter)
    const funnelSvc = new FunnelService(funnelCalc, funnelAdapter)
    const retentionSvc = new RetentionService(cohortAnalyzer, retentionAdapter)
    const metricsSvc = new MetricsService(collector, cdcStream, cohortSvc, funnelSvc, retentionSvc,
      eventAdapter, cdcAdapter, funnelAdapter, retentionAdapter, cohortAdapter)

    ctrl = new AnalyticsV2Controller(collector, cdcStream, cohortSvc, funnelSvc, retentionSvc, metricsSvc)
  })

  // ─── Event ───

  it('collectEvent: 基础采集', () => {
    const r = ctrl.collectEvent({
      tenantId: 't1', eventId: 'evt-1', type: 'PAGEVIEW', who: 'm1', what: 'home'
    })
    assert.equal(r.accepted, true)
  })

  it('collectBatch: 多事件', () => {
    const r = ctrl.collectBatch({
      events: [
        { tenantId: 't1', eventId: 'b-1', type: 'PAGEVIEW', who: 'm1', what: 'p' },
        { tenantId: 't1', eventId: 'b-2', type: 'CLICK', who: 'm1', what: 'c' }
      ]
    })
    assert.equal(r.count, 2)
  })

  it('recentEvents: 返回 limit 条', () => {
    for (let i = 0; i < 5; i++) {
      ctrl.collectEvent({ tenantId: 't1', eventId: `e-${i}`, type: 'PAGEVIEW', who: 'm1', what: 'p' })
    }
    const r = ctrl.recentEvents('t1', '3')
    assert.equal(r.events.length, 3)
  })

  // ─── CDC ───

  it('applyCDC: 单条应用', () => {
    const e = cdcStreamCreate('t1', 'orders', 'r1', 'CREATED')
    const r = ctrl.applyCDC(e)
    assert.equal(r.accepted, true)
  })

  it('replayCDC: 重放', () => {
    const e = cdcStreamCreate('t1', 'orders', 'r1', 'CREATED')
    const r = ctrl.replayCDC(e)
    assert.equal(r.accepted, true)
    assert.equal(r.replayed?.replayed, true)
  })

  it('tailCDC: since 增量', () => {
    const e1 = cdcStreamCreate('t1', 'orders', 'r1', 'CREATED')
    ctrl.applyCDC(e1)
    const tail = ctrl.tailCDC('t1', '0')
    assert.ok(tail.events.length >= 1)
  })

  it('cdcStatus: 返回状态', () => {
    const r = ctrl.cdcStatus('t1')
    assert.equal(r.currentWatermark, 0)
  })

  // ─── Cohort ───

  it('registerMember: 建 cohort', () => {
    const r = ctrl.registerMember({
      tenantId: 't1', period: 'WEEKLY', memberId: 'm1',
      registrationDate: new Date(Date.now() - 86400000).toISOString()
    })
    assert.ok(r.cohort.id)
  })

  it('trackActivity: 跟踪会员行为', () => {
    ctrl.registerMember({
      tenantId: 't1', period: 'WEEKLY', memberId: 'm1',
      registrationDate: new Date(Date.now() - 86400000).toISOString()
    })
    const r = ctrl.trackActivity({
      tenantId: 't1', memberId: 'm1', activityType: 'CLICK'
    })
    assert.equal(r.eventCollected, true)
  })

  it('listCohorts: 列出', () => {
    ctrl.registerMember({
      tenantId: 't1', period: 'WEEKLY', memberId: 'm1',
      registrationDate: new Date(Date.now() - 86400000).toISOString()
    })
    const r = ctrl.listCohorts('t1', undefined)
    assert.ok(r.cohorts.length >= 1)
  })

  it('cohortMatrix: 返回矩阵', () => {
    ctrl.registerMember({
      tenantId: 't1', period: 'WEEKLY', memberId: 'm1',
      registrationDate: new Date(Date.now() - 86400000).toISOString()
    })
    const r = ctrl.cohortMatrix('t1', 'WEEKLY', '12')
    assert.ok(r.matrix)
  })

  it('cohortReliability: 报告', () => {
    ctrl.registerMember({
      tenantId: 't1', period: 'WEEKLY', memberId: 'm1',
      registrationDate: new Date(Date.now() - 86400000).toISOString()
    })
    const r = ctrl.cohortReliability('t1', 'WEEKLY')
    assert.equal(r.total, 1)
  })

  // ─── Funnel ───

  it('createFunnel: 创建', () => {
    ctrl.collectEvent({ tenantId: 't1', eventId: 'e1', type: 'PAGEVIEW', who: 'm1', what: 'p' })
    const r = ctrl.createFunnel({
      tenantId: 't1', name: 'f',
      steps: [{ name: 'v', eventType: 'PAGEVIEW' }]
    })
    assert.ok(r.funnel.id)
  })

  it('listFunnels: 列出', () => {
    ctrl.collectEvent({ tenantId: 't1', eventId: 'e1', type: 'PAGEVIEW', who: 'm1', what: 'p' })
    ctrl.createFunnel({ tenantId: 't1', name: 'f', steps: [{ name: 'v', eventType: 'PAGEVIEW' }] })
    const r = ctrl.listFunnels('t1')
    assert.ok(r.funnels.length >= 1)
  })

  it('defaultFunnelTemplate: 默认模板', () => {
    const r = ctrl.defaultFunnelTemplate()
    assert.equal(r.steps.length, 4)
  })

  // ─── Retention ───

  it('generateRetention: 生成报告', () => {
    ctrl.registerMember({
      tenantId: 't1', period: 'WEEKLY', memberId: 'm1',
      registrationDate: new Date(Date.now() - 35 * 86400000).toISOString()
    })
    const r = ctrl.generateRetention({ tenantId: 't1', period: 'WEEKLY' })
    assert.ok(r.report)
  })

  it('retentionHealth: 健康度', () => {
    const r = ctrl.retentionHealth('t-empty', 'WEEKLY')
    assert.equal(r.level, 'POOR')
  })

  it('retentionTrend: 趋势', () => {
    ctrl.registerMember({
      tenantId: 't1', period: 'WEEKLY', memberId: 'm1',
      registrationDate: new Date(Date.now() - 35 * 86400000).toISOString()
    })
    ctrl.generateRetention({ tenantId: 't1', period: 'WEEKLY' })
    const r = ctrl.retentionTrend('t1', 'WEEKLY', '4')
    assert.ok(r.trend)
  })

  // ─── Metrics ───

  it('metricsSummary: 汇总', () => {
    const r = ctrl.metricsSummary('t1', '7')
    assert.ok(r.metrics.length >= 5)
  })

  it('metricsLive: 实时指标', () => {
    const r = ctrl.metricsLive('t1')
    assert.ok('eventsLast5min' in r)
  })

  it('metricsHealth: 综合报告', () => {
    const r = ctrl.metricsHealth('t1')
    assert.ok(r.metrics)
  })

  // ─── 隔离 ───

  it('[隔离] 租户 T1 数据不影响 T2', () => {
    ctrl.collectEvent({ tenantId: 't1', eventId: 'iso-1', type: 'PAGEVIEW', who: 'm1', what: 'p' })
    const r = ctrl.metricsSummary('t2', '7')
    const totalCard = r.metrics.find((m: any) => m.name === '总事件数')
    assert.equal(totalCard!.value, 0)
  })
})

// 辅助: cdcStream.create 但需要 stream 实例
let _stream: CDCStream | null = null
function cdcStreamCreate(tenantId: string, tableName: string, recordId: string, eventType: any) {
  if (!_stream) _stream = new CDCStream(new CDCAdapter())
  return _stream.create({ tenantId, tableName, recordId, eventType, after: { id: recordId } })
}