import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { CohortService } from './services/cohort.service'
import { FunnelService } from './services/funnel.service'
import { RetentionService } from './services/retention.service'
import { MetricsService } from './services/metrics.service'
import { CohortAnalyzer } from './cohort-analyzer'
import { FunnelCalculator } from './funnel-calculator'
import { EventCollector } from './event-collector'
import { CDCStream } from './cdc-stream'
import { CohortAdapter } from './datasources/cohort.adapter'
import { FunnelAdapter } from './datasources/funnel.adapter'
import { RetentionAdapter } from './datasources/retention.adapter'
import { EventAdapter } from './datasources/event.adapter'
import { CDCAdapter } from './datasources/cdc.adapter'

describe('AnalyticsV2 Services 综合', () => {
  let cohortService: CohortService
  let funnelService: FunnelService
  let retentionService: RetentionService
  let metricsService: MetricsService
  let collector: EventCollector
  let cdcStream: CDCStream
  let cohortAnalyzer: CohortAnalyzer
  let funnelCalculator: FunnelCalculator
  let eventAdapter: EventAdapter
  let cohortAdapter: CohortAdapter
  let funnelAdapter: FunnelAdapter
  let retentionAdapter: RetentionAdapter
  let cdcAdapter: CDCAdapter

  beforeEach(() => {
    eventAdapter = new EventAdapter()
    cohortAdapter = new CohortAdapter()
    funnelAdapter = new FunnelAdapter()
    retentionAdapter = new RetentionAdapter()
    cdcAdapter = new CDCAdapter()
    collector = new EventCollector(eventAdapter)
    cdcStream = new CDCStream(cdcAdapter)
    cohortAnalyzer = new CohortAnalyzer(cohortAdapter, eventAdapter)
    funnelCalculator = new FunnelCalculator(funnelAdapter, eventAdapter)
    cohortService = new CohortService(cohortAnalyzer, cohortAdapter, collector, cdcStream, eventAdapter)
    funnelService = new FunnelService(funnelCalculator, funnelAdapter)
    retentionService = new RetentionService(cohortAnalyzer, retentionAdapter)
    metricsService = new MetricsService(collector, cdcStream, cohortService, funnelService, retentionService,
      eventAdapter, cdcAdapter, funnelAdapter, retentionAdapter, cohortAdapter)
  })

  // ─── CohortService ───

  describe('CohortService', () => {
    it('registerMember 创建 cohort + CDC', () => {
      const reg = new Date(Date.now() - 86400000)
      const r = cohortService.registerMember({
        tenantId: 't1', period: 'WEEKLY', memberId: 'm1', registrationDate: reg
      })
      assert.ok(r.cohort.id)
      assert.equal(r.cdcApplied, true)
    })

    it('同一周期注册多人 → 同 cohort', () => {
      const reg = new Date(Date.now() - 7 * 86400000)
      const r1 = cohortService.registerMember({
        tenantId: 't1', period: 'WEEKLY', memberId: 'm1', registrationDate: reg
      })
      const r2 = cohortService.registerMember({
        tenantId: 't1', period: 'WEEKLY', memberId: 'm2', registrationDate: reg
      })
      // 同一个 periodKey → 同一 cohort
      assert.equal(r1.cohort.periodKey, r2.cohort.periodKey)
    })

    it('listCohorts 列出所有', () => {
      cohortService.registerMember({
        tenantId: 't1', period: 'WEEKLY', memberId: 'm1',
        registrationDate: new Date(Date.now() - 86400000)
      })
      const list = cohortService.listCohorts('t1')
      assert.ok(list.length >= 1)
    })

    it('listCohorts 按 period 过滤', () => {
      cohortService.registerMember({
        tenantId: 't1', period: 'MONTHLY', memberId: 'm1',
        registrationDate: new Date(Date.now() - 86400000)
      })
      const weekly = cohortService.listCohorts('t1', 'WEEKLY')
      const monthly = cohortService.listCohorts('t1', 'MONTHLY')
      assert.ok(monthly.length >= 1)
    })

    it('getCohort 返回单 cohort', () => {
      const r = cohortService.registerMember({
        tenantId: 't1', period: 'WEEKLY', memberId: 'm1',
        registrationDate: new Date(Date.now() - 86400000)
      })
      const found = cohortService.getCohort('t1', r.cohort.id)
      assert.ok(found)
    })

    it('getAvgRetention 返回 d1/d7/d30', () => {
      cohortService.registerMember({
        tenantId: 't1', period: 'WEEKLY', memberId: 'm1',
        registrationDate: new Date(Date.now() - 35 * 86400000)
      })
      const avg = cohortService.getAvgRetention('t1', 'WEEKLY')
      assert.ok('d1' in avg)
      assert.ok('d7' in avg)
      assert.ok('d30' in avg)
      assert.ok('cohortCount' in avg)
    })

    it('trackMemberActivity 采集 + CDC', () => {
      // 先建 cohort
      const r = cohortService.registerMember({
        tenantId: 't1', period: 'WEEKLY', memberId: 'm-active',
        registrationDate: new Date(Date.now() - 86400000)
      })
      // 给 member 添加 cohortId 属性以便追踪
      collector.collect({
        tenantId: 't1', eventId: `evt-${Date.now()}`, type: 'PAGEVIEW',
        who: 'm-active', what: 'p', memberId: 'm-active',
        properties: { cohortId: r.cohort.id }
      })
      const track = cohortService.trackMemberActivity({
        tenantId: 't1', memberId: 'm-active', activityType: 'CLICK'
      })
      assert.equal(track.eventCollected, true)
    })

    it('rebuildMatrix 返回 12 期', () => {
      for (let i = 0; i < 15; i++) {
        cohortService.registerMember({
          tenantId: 't1', period: 'WEEKLY', memberId: `m-${i}`,
          registrationDate: new Date(Date.now() - (i + 1) * 7 * 86400000)
        })
      }
      const m = cohortService.rebuildMatrix('t1', 'WEEKLY', 12)
      assert.ok(m.matrix.length <= 12)
    })

    it('getReliabilityReport 区分 reliable/unreliable', () => {
      cohortService.registerMember({
        tenantId: 't1', period: 'WEEKLY', memberId: 'm1',
        registrationDate: new Date(Date.now() - 86400000)
      })
      const report = cohortService.getReliabilityReport('t1', 'WEEKLY')
      assert.equal(report.total, 1)
      assert.equal(report.reliable, 0)  // 单成员 < 10
      assert.equal(report.unreliable, 1)
    })
  })

  // ─── FunnelService ───

  describe('FunnelService', () => {
    it('createFunnel 返回 funnel + warnings', () => {
      collector.collect({ tenantId: 't1', eventId: 'e1', type: 'PAGEVIEW', who: 'm1', what: 'p', memberId: 'm1' })
      const r = funnelService.createFunnel({
        tenantId: 't1', name: 'f',
        steps: [{ name: 'v', eventType: 'PAGEVIEW' }]
      })
      assert.ok(r.funnel.id)
      assert.equal(r.isOverComplex, false)
    })

    it('createFunnel 步骤过多产生 warning', () => {
      const r = funnelService.createFunnel({
        tenantId: 't1', name: 'complex',
        steps: [
          { name: 'a', eventType: 'PAGEVIEW' },
          { name: 'b', eventType: 'CLICK' },
          { name: 'c', eventType: 'CONVERSION' },
          { name: 'd', eventType: 'PURCHASE' },
          { name: 'e', eventType: 'CUSTOM' },
          { name: 'f', eventType: 'PAGEVIEW' }
        ]
      })
      assert.equal(r.isOverComplex, true)
      assert.ok(r.warnings.length >= 1)
    })

    it('空 steps 抛错', () => {
      assert.throws(() => {
        funnelService.createFunnel({
          tenantId: 't1', name: 'empty',
          steps: []
        })
      })
    })

    it('listFunnels 列出', () => {
      collector.collect({ tenantId: 't1', eventId: 'e1', type: 'PAGEVIEW', who: 'm1', what: 'p', memberId: 'm1' })
      funnelService.createFunnel({
        tenantId: 't1', name: 'f1',
        steps: [{ name: 'v', eventType: 'PAGEVIEW' }]
      })
      const list = funnelService.listFunnels('t1')
      assert.ok(list.length >= 1)
    })

    it('getFunnel 返回单漏斗', () => {
      collector.collect({ tenantId: 't1', eventId: 'e1', type: 'PAGEVIEW', who: 'm1', what: 'p', memberId: 'm1' })
      const r = funnelService.createFunnel({
        tenantId: 't1', name: 'f',
        steps: [{ name: 'v', eventType: 'PAGEVIEW' }]
      })
      const found = funnelService.getFunnel('t1', r.funnel.id)
      assert.ok(found)
    })

    it('compareFunnels 对比多个', () => {
      collector.collect({ tenantId: 't1', eventId: 'e1', type: 'PAGEVIEW', who: 'm1', what: 'p', memberId: 'm1' })
      const r1 = funnelService.createFunnel({ tenantId: 't1', name: 'f1', steps: [{ name: 'v', eventType: 'PAGEVIEW' }] })
      const r2 = funnelService.createFunnel({ tenantId: 't1', name: 'f2', steps: [{ name: 'v', eventType: 'PAGEVIEW' }] })
      const cmp = funnelService.compareFunnels('t1', [r1.funnel.id, r2.funnel.id])
      assert.equal(cmp.length, 2)
    })

    it('getDefaultFunnelTemplate 返回 4 步漏斗', () => {
      const tpl = funnelService.getDefaultFunnelTemplate()
      assert.equal(tpl.steps.length, 4)
      assert.equal(tpl.steps[0].eventType, 'PAGEVIEW')
      assert.equal(tpl.steps[3].eventType, 'PURCHASE')
    })
  })

  // ─── RetentionService ───

  describe('RetentionService', () => {
    it('generateReport 生成报告', () => {
      cohortService.registerMember({
        tenantId: 't1', period: 'WEEKLY', memberId: 'm1',
        registrationDate: new Date(Date.now() - 35 * 86400000)
      })
      const r = retentionService.generateReport('t1', 'WEEKLY')
      assert.ok(r.matrix)
      assert.ok(r.avgRetention)
    })

    it('getReport 返回已存报告', () => {
      cohortService.registerMember({
        tenantId: 't1', period: 'WEEKLY', memberId: 'm1',
        registrationDate: new Date(Date.now() - 86400000)
      })
      retentionService.generateReport('t1', 'WEEKLY')
      const r = retentionService.getReport('t1', 'WEEKLY')
      assert.ok(r)
    })

    it('getHealthScore: 无数据 → POOR', () => {
      const h = retentionService.getHealthScore('t-empty', 'WEEKLY')
      assert.equal(h.level, 'POOR')
      assert.equal(h.score, 0)
    })

    it('getHealthScore: 含 recommendations', () => {
      cohortService.registerMember({
        tenantId: 't1', period: 'WEEKLY', memberId: 'm1',
        registrationDate: new Date(Date.now() - 35 * 86400000)
      })
      retentionService.generateReport('t1', 'WEEKLY')
      const h = retentionService.getHealthScore('t1', 'WEEKLY')
      assert.ok(Array.isArray(h.recommendations))
      assert.ok(h.recommendations.length >= 1)
    })

    it('getTrend 返回时间窗口', () => {
      cohortService.registerMember({
        tenantId: 't1', period: 'WEEKLY', memberId: 'm1',
        registrationDate: new Date(Date.now() - 35 * 86400000)
      })
      retentionService.generateReport('t1', 'WEEKLY')
      const trend = retentionService.getTrend('t1', 'WEEKLY', 4)
      assert.ok(Array.isArray(trend))
    })
  })

  // ─── MetricsService ───

  describe('MetricsService', () => {
    it('generateSummary 返回 metric cards', () => {
      collector.collect({ tenantId: 't1', eventId: 'e1', type: 'PAGEVIEW', who: 'm1', what: 'p', memberId: 'm1' })
      const summary = metricsService.generateSummary('t1', 7)
      assert.ok(summary.metrics.length >= 5)
      assert.ok(summary.series.dau)
      assert.ok(summary.series.events)
      assert.ok(summary.series.revenue)
    })

    it('generateSummary 计算总事件数', () => {
      for (let i = 0; i < 5; i++) {
        collector.collect({ tenantId: 't1', eventId: `e-${i}`, type: 'CLICK', who: 'm1', what: 'c', memberId: 'm1' })
      }
      const summary = metricsService.generateSummary('t1', 7)
      const totalEventsCard = summary.metrics.find(m => m.name === '总事件数')
      assert.ok(totalEventsCard)
      assert.equal(totalEventsCard!.value, 5)
    })

    it('generateSummary 计算营收', () => {
      collector.collect({
        tenantId: 't1', eventId: 'p1', type: 'PURCHASE',
        who: 'm1', what: 'buy', memberId: 'm1', revenueCents: 10000
      })
      const summary = metricsService.generateSummary('t1', 7)
      const revenueCard = summary.metrics.find(m => m.name === '营收')
      assert.ok(revenueCard)
      assert.equal(revenueCard!.value, 10000)
    })

    it('getRecentEvents 返回 N 条', () => {
      for (let i = 0; i < 10; i++) {
        collector.collect({ tenantId: 't1', eventId: `e-${i}`, type: 'PAGEVIEW', who: 'm1', what: 'p', memberId: 'm1' })
      }
      const r = metricsService.getRecentEvents('t1', 5)
      assert.equal(r.length, 5)
    })

    it('getCDCStatus 返回 watermark', () => {
      const status = metricsService.getCDCStatus('t1')
      assert.equal(status.currentWatermark, 0)
    })

    it('getLiveMetrics 返回实时指标', () => {
      const r = metricsService.getLiveMetrics('t1')
      assert.ok('activeSessions' in r)
      assert.ok('eventsLast5min' in r)
      assert.ok('conversionsLast5min' in r)
      assert.ok('revenueLast5min' in r)
    })

    it('getHealthReport 综合报告', () => {
      const h = metricsService.getHealthReport('t1')
      assert.ok(h.metrics)
      assert.ok(h.retentionHealth)
      assert.equal(h.funnels, 0)
      assert.equal(h.cohorts, 0)
    })
  })
})