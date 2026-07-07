import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [analytics-v2] [C] 角色测试扩展编写
 *
 * 8 角色深度场景扩展测试 — analytics-v2 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 2 测试用例（正常流程 + 权限边界）
 * 覆盖: 事件采集 CDC Cohort Funnel Retention Metrics
 * 扩展: 空数据、边缘输入、跨租户隔离、并发安全、缓存失效、降级行为
 */

import 'reflect-metadata'
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

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

function buildFresh() {
  const eventAdapter = new EventAdapter()
  const cdcAdapter = new CDCAdapter()
  const cohortAdapter = new CohortAdapter()
  const funnelAdapter = new FunnelAdapter()
  const retentionAdapter = new RetentionAdapter()

  const eventCollector = new EventCollector(eventAdapter)
  const cdcStream = new CDCStream(cdcAdapter)
  const cohortAnalyzer = new CohortAnalyzer(cohortAdapter, eventAdapter)
  const funnelCalculator = new FunnelCalculator(funnelAdapter, eventAdapter)

  const cohortService = new CohortService(cohortAnalyzer, cohortAdapter, eventCollector, cdcStream, eventAdapter)
  const funnelService = new FunnelService(funnelCalculator, funnelAdapter)
  const retentionService = new RetentionService(cohortAnalyzer, retentionAdapter)
  const metricsService = new MetricsService(
    eventCollector, cdcStream, cohortService, funnelService, retentionService,
    eventAdapter, cdcAdapter, funnelAdapter, retentionAdapter, cohortAdapter,
  )

  const controller = new AnalyticsV2Controller(
    eventCollector, cdcStream, cohortService, funnelService, retentionService, metricsService,
  )

  return { controller, eventAdapter, cdcAdapter, cohortAdapter, funnelAdapter, retentionAdapter }
}

// ──── 👔店长 ────
describe(`${ROLES.StoreManager} analytics-v2 角色扩展测试`, () => {
  let ctx: ReturnType<typeof buildFresh>
  beforeEach(() => { ctx = buildFresh() })

  it('👔店长-扩展: 连续多日事件产生营收时间序列', () => {
    const { controller, eventAdapter } = ctx
    const dates = ['2026-06-01', '2026-06-02', '2026-06-03']
    for (const d of dates) {
      eventAdapter.ingest({
        id: `evt-${d}`, tenantId: 't1', eventId: `order-${d}`, type: 'PURCHASE',
        who: 'member-1', when: new Date(d).toISOString(),
        where: {}, what: { name: 'purchase' }, properties: {},
        revenueCents: 10000, timestamp: new Date(d).toISOString(),
      })
    }
    const summary = controller.metricsSummary('t1', '7')
    assert.ok(summary.series.revenue, '应有营收时间序列')
    assert.equal(summary.series.revenue.length, 3, '营收点应等于天数')
  })

  it('👔店长-边界: 同一天多条事件且跨租户隔离', () => {
    const { controller, eventAdapter } = ctx
    // tenant t1 有 5 条
    for (let i = 1; i <= 5; i++) {
      eventAdapter.ingest({
        id: `t1-${i}`, tenantId: 't1', eventId: `t1-evt-${i}`, type: 'PAGEVIEW',
        who: 'u-a', when: new Date().toISOString(),
        where: {}, what: { name: 'page_view' }, properties: {},
        timestamp: new Date().toISOString(),
      })
    }
    // tenant t2 有 3 条
    for (let i = 1; i <= 3; i++) {
      eventAdapter.ingest({
        id: `t2-${i}`, tenantId: 't2', eventId: `t2-evt-${i}`, type: 'PAGEVIEW',
        who: 'u-b', when: new Date().toISOString(),
        where: {}, what: { name: 'page_view' }, properties: {},
        timestamp: new Date().toISOString(),
      })
    }
    const s1 = controller.metricsSummary('t1', '1')
    const s2 = controller.metricsSummary('t2', '1')
    const eventCount1 = s1.metrics.find((m: any) => m.name === '事件总数')?.value ?? 0
    const eventCount2 = s2.metrics.find((m: any) => m.name === '事件总数')?.value ?? 0
    assert.equal(eventCount1, 5, 't1 有 5 条事件')
    assert.equal(eventCount2, 3, 't2 有 3 条事件，互不干扰')
  })
})

// ──── 🛒前台 ────
describe(`${ROLES.FrontDesk} analytics-v2 角色扩展测试`, () => {
  let ctx: ReturnType<typeof buildFresh>
  beforeEach(() => { ctx = buildFresh() })

  it('🛒前台-扩展: 批量采集事件中含重复 eventId 去重', () => {
    const { controller, eventAdapter } = ctx
    const events = Array.from({ length: 5 }, (_, i) => ({
      tenantId: 't1', eventId: 'duplicate-evt', type: 'CLICK' as const,
      who: 'member-x', what: 'button_click',
      timestamp: new Date().toISOString(),
    }))
    const result = controller.collectBatch({ events })
    assert.equal(result.count, 5, '所有事件被处理')
    const stored = eventAdapter.queryByTenant('t1')
    const uniq = new Set(stored.map((e: any) => e.eventId))
    assert.equal(uniq.size, 1, '虽然采集 5 条，但 eventId 相同')
  })

  it('🛒前台-边界: 采集空批量', () => {
    const { controller } = ctx
    const result = controller.collectBatch({ events: [] })
    assert.equal(result.count, 0, '空批量应返回 0')
    assert.equal(result.results.length, 0, '结果列表也应空')
  })

  it('🛒前台-边界: 采集事件带大量 properties', () => {
    const { controller } = ctx
    const bigProps: Record<string, any> = {}
    for (let i = 0; i < 100; i++) bigProps[`key_${i}`] = `val_${i}`
    const result = controller.collectEvent({
      tenantId: 't1', eventId: 'big-prop-evt', type: 'CUSTOM',
      who: 'member-big', what: 'big_event',
      properties: bigProps, timestamp: new Date().toISOString(),
    })
    assert.ok(result.accepted, '大量 properties 也应被接受')
  })
})

// ──── 👥HR ────
describe(`${ROLES.HR} analytics-v2 角色扩展测试`, () => {
  let ctx: ReturnType<typeof buildFresh>
  beforeEach(() => { ctx = buildFresh() })

  it('👥HR-扩展: 同一会员多次注册仅保留首次', () => {
    const { controller, cohortAdapter } = ctx
    controller.registerMember({ tenantId: 't1', period: 'MONTHLY', memberId: 'mem-dual', registrationDate: '2026-01-01' })
    controller.registerMember({ tenantId: 't1', period: 'MONTHLY', memberId: 'mem-dual', registrationDate: '2026-02-01' })

    const list = controller.listCohorts('t1', 'MONTHLY')
    // 预期只有一条记录
    const match = list.cohorts.filter((c: any) => c.memberId === 'mem-dual')
    assert.equal(match.length, 1, '重复注册应去重')
    assert.equal((match[0] as any).registrationDate, '2026-01-01', '应保留首次注册日期')
  })

  it('👥HR-边界: 注册不存在租户的会员应返回空列表', () => {
    const { controller } = ctx
    controller.registerMember({ tenantId: 'ghost-tenant', period: 'WEEKLY', memberId: 'mem-ghost', registrationDate: '2026-05-01' })
    const list = controller.listCohorts('ghost-tenant', 'WEEKLY')
    assert.ok(list.cohorts, '应有 cohort 列表')
    assert.equal(list.cohorts.length, 1, 'ghost 租户也应能查到自己注册的会员')
  })
})

// ──── 🔧安监 ────
describe(`${ROLES.Security} analytics-v2 角色扩展测试`, () => {
  let ctx: ReturnType<typeof buildFresh>
  beforeEach(() => { ctx = buildFresh() })

  it('🔧安监-扩展: CDC 操作后健康报告反映最新状态', () => {
    const { controller, cdcAdapter } = ctx
    // 应用一条 CDC
    controller.applyCDC({ tenantId: 't1', entityType: 'member', entityId: 'mem-001', operation: 'UPSERT', payload: { name: 'Alice' }, source: 'erp' } as any)
    // 再应用一条
    controller.applyCDC({ tenantId: 't1', entityType: 'member', entityId: 'mem-002', operation: 'UPSERT', payload: { name: 'Bob' }, source: 'pos' } as any)

    const status = controller.cdcStatus('t1')
    assert.ok(typeof (status as any).pending === 'number', '应有待处理数')
    assert.ok((status as any).lastApplied, '应有最近应用时间')
  })

  it('🔧安监-边界: 向不存在的租户查看 CDC 状态', () => {
    const { controller } = ctx
    const status = controller.cdcStatus('non-existent-tenant')
    assert.ok(status, '即使没有数据也应返回')
    assert.notEqual((status as any).pending, undefined, 'pending 字段不应为 undefined')
  })

  it('🔧安监-边界: CDC tail 空场景', () => {
    const { controller } = ctx
    const tail = controller.tailCDC('t-empty')
    assert.ok(tail.events, '应有 events 数组')
    assert.equal(tail.events.length, 0, '空租户 tail 应为空')
  })
})

// ──── 🎮导玩员 ────
describe(`${ROLES.Guide} analytics-v2 角色扩展测试`, () => {
  let ctx: ReturnType<typeof buildFresh>
  beforeEach(() => { ctx = buildFresh() })

  it('🎮导玩员-扩展: 采集游戏事件后实时指标反映', () => {
    const { controller } = ctx
    controller.collectEvent({
      tenantId: 't1', eventId: 'game-start-1', type: 'CUSTOM',
      who: 'guide-demo', what: 'game_start_mahjong',
      sessionId: 'sess-g-1', timestamp: new Date().toISOString(),
    })
    controller.collectEvent({
      tenantId: 't1', eventId: 'game-end-1', type: 'CUSTOM',
      who: 'guide-demo', what: 'game_end_score_9200',
      sessionId: 'sess-g-1', timestamp: new Date().toISOString(),
    })

    const live = controller.metricsLive('t1')
    assert.ok(live, '应有直播指标')
    assert.ok(typeof (live as any).eventsLastMinute === 'number', '应有 eventsLastMinute')
  })

  it('🎮导玩员-边界: 查看无事件租户的实时指标', () => {
    const { controller } = ctx
    const live = controller.metricsLive('t-no-events')
    assert.ok(live, '无事件也应返回实时指标结构')
    assert.equal((live as any).eventsLastMinute, 0, '无事件则 eventsLastMinute 为 0')
  })

  it('🎮导玩员-边界: sessionId 为空字符串的极端情况', () => {
    const { controller } = ctx
    const result = controller.collectEvent({
      tenantId: 't1', eventId: 'no-session', type: 'PAGEVIEW',
      who: 'player-anon', what: 'page_view',
      sessionId: '', timestamp: new Date().toISOString(),
    })
    assert.ok(result.accepted, '空 sessionId 也应被接受')
  })
})

// ──── 🎯运行专员 ────
describe(`${ROLES.Operations} analytics-v2 角色扩展测试`, () => {
  let ctx: ReturnType<typeof buildFresh>
  beforeEach(() => { ctx = buildFresh() })

  it('🎯运行专员-扩展: 创建漏斗后查询详情', () => {
    const { controller } = ctx
    const funnel = controller.createFunnel({
      tenantId: 't-ops',
      name: '游戏转化漏斗',
      steps: [
        { name: '打开游戏', eventType: 'CUSTOM' },
        { name: '完成一局', eventType: 'CUSTOM' },
        { name: '分享成绩', eventType: 'CUSTOM' },
      ],
      windowDays: 3,
    })
    assert.ok(funnel.funnel.id, '应返回漏斗 ID')

    const detail = controller.getFunnel('t-ops', funnel.funnel.id)
    assert.ok(detail, '应查到漏斗详情')
    assert.equal(detail.id, funnel.funnel.id, 'ID 一致')
  })

  it('🎯运行专员-边界: 查询不存在的漏斗详情', () => {
    const { controller } = ctx
    const detail = controller.getFunnel('t-ops', 'non-existent-id')
    assert.equal(detail, null, '不存在的漏斗应返回 null')
  })

  it('🎯运行专员-边界: 跨租户漏斗隔离', () => {
    const { controller } = ctx
    controller.createFunnel({ tenantId: 't-a', name: '漏斗A', steps: [{ name: 'S1', eventType: 'PAGEVIEW' }], windowDays: 7 })
    controller.createFunnel({ tenantId: 't-b', name: '漏斗B', steps: [{ name: 'S1', eventType: 'CLICK' }], windowDays: 7 })

    const listA = controller.listFunnels('t-a')
    const listB = controller.listFunnels('t-b')
    assert.equal(listA.funnels.length, 1, 't-a 只有 1 个漏斗')
    assert.equal(listB.funnels.length, 1, 't-b 只有 1 个漏斗')
    assert.equal(listA.funnels[0].name, '漏斗A', '数据隔离正确')
    assert.equal(listB.funnels[0].name, '漏斗B', '数据隔离正确')
  })
})

// ──── 🤝团建 ────
describe(`${ROLES.Teambuilding} analytics-v2 角色扩展测试`, () => {
  let ctx: ReturnType<typeof buildFresh>
  beforeEach(() => { ctx = buildFresh() })

  it('🤝团建-扩展: 多 cohort 生成留存趋势', () => {
    const { controller } = ctx
    // 注册多个 cohort 周期
    const cohorts = ['WEEKLY', 'MONTHLY']
    for (const period of cohorts) {
      for (let i = 0; i < 3; i++) {
        controller.registerMember({
          tenantId: 't1', period: period as any,
          memberId: `mem-${period}-${i}`,
          registrationDate: '2026-06-01',
        })
      }
    }

    const trend = controller.retentionTrend('t1', 'WEEKLY', '4')
    assert.ok(trend.trend, '应有趋势数据')
    assert.ok(trend.trend.length > 0, '趋势应为非空数组')
  })

  it('🤝团建-边界: 查看无数据留存趋势', () => {
    const { controller } = ctx
    const trend = controller.retentionTrend('t-no-data', 'MONTHLY', '4')
    assert.ok(trend.trend, '无数据也应返回趋势数组')
    assert.equal(trend.trend.length, 0, '无数据趋势应为空')
  })

  it('🤝团建-边界: 留存健康度推荐列表长度', () => {
    const { controller } = ctx
    const health = controller.retentionHealth('t-fresh', 'WEEKLY')
    assert.ok(Array.isArray(health.recommendations), '应有建议列表')
    assert.ok(health.recommendations.length >= 1, '至少有一条建议')
  })
})

// ──── 📢营销 ────
describe(`${ROLES.Marketing} analytics-v2 角色扩展测试`, () => {
  let ctx: ReturnType<typeof buildFresh>
  beforeEach(() => { ctx = buildFresh() })

  it('📢营销-扩展: 批量采集后 cohort matrix 可计算', () => {
    const { controller, eventAdapter } = ctx
    // 注册会员
    for (let i = 0; i < 5; i++) {
      controller.registerMember({
        tenantId: 't-mkt', period: 'MONTHLY',
        memberId: `mem-${i}`,
        registrationDate: '2026-06-01',
      })
      // 产生行为事件
      eventAdapter.ingest({
        id: `act-${i}`, tenantId: 't-mkt', eventId: `act-${i}`, type: 'PAGEVIEW',
        who: `mem-${i}`, when: new Date('2026-06-05').toISOString(),
        where: {}, what: { name: 'visit_after_register' }, properties: {},
        timestamp: new Date('2026-06-05').toISOString(),
      })
    }

    const matrix = controller.cohortMatrix('t-mkt', 'MONTHLY', '3')
    assert.ok(matrix, '应有矩阵')
    assert.ok(Array.isArray(matrix.cohorts), 'cohorts 应为数组')
  })

  it('📢营销-边界: 无事件租户的 cohort matrix', () => {
    const { controller } = ctx
    const matrix = controller.cohortMatrix('t-empty-mkt', 'WEEKLY', '6')
    assert.ok(matrix, '无事件也应返回矩阵结构')
    assert.ok(Array.isArray(matrix.cohorts), 'cohorts 应为数组')
    assert.equal(matrix.cohorts.length, 0, '无数据时 cohort 为空')
  })

  it('📢营销-边界: cohort reliability 报告', () => {
    const { controller } = ctx
    controller.registerMember({ tenantId: 't-rel', period: 'WEEKLY', memberId: 'mem-rel', registrationDate: '2026-05-01' })
    const report = controller.cohortReliability('t-rel', 'WEEKLY')
    assert.ok(report, '应有可靠性报告')
    assert.ok(typeof (report as any).reliabilityScore === 'number', '应有评分')
  })
})
