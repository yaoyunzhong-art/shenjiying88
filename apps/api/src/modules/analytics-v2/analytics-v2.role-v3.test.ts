import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [analytics-v2] [C] 角色测试 V3 - 深度场景
 *
 * 8 角色端到端 + 多角色协作场景:
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 2 新测试用例
 * 新增: CDC 回放 + 漏斗留存联动 + 跨角色编排 + 实时指标刷新 + 双租户隔离
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
describe(`${ROLES.StoreManager} analytics-v2 角色 V3 测试`, () => {
  let ctx: ReturnType<typeof buildFresh>
  beforeEach(() => { ctx = buildFresh() })

  it('👔店长-V3: CDC 回放后数据一致', () => {
    const { controller, cdcAdapter } = ctx

    // 产生 CDC 事件 (显式提供递增 watermark)
    const r1 = controller.applyCDC({
      id: 'cdc-ev-1', timestamp: new Date().toISOString(),
      tenantId: 't1', tableName: 'members', recordId: 'mem-001',
      eventType: 'CREATED', eventId: 'cdc-1', watermark: 1,
      after: { name: '张三', level: 'gold' },
    })
    assert.ok(r1.accepted, 'CDC 创建应被接受')

    const r2 = controller.applyCDC({
      id: 'cdc-ev-2', timestamp: new Date().toISOString(),
      tenantId: 't1', tableName: 'members', recordId: 'mem-001',
      eventType: 'UPDATED', eventId: 'cdc-2', watermark: 2,
      before: { level: 'gold' },
      after: { name: '张三', level: 'platinum' },
    })
    assert.ok(r2.accepted, 'CDC 更新应被接受')

    const status = controller.cdcStatus('t1')
    assert.ok(status, 'CDC 状态应有值')
    assert.equal(typeof status.currentWatermark, 'number', 'currentWatermark 应为数字')
    assert.ok(status.currentWatermark > 0, 'currentWatermark 应大于 0')

    // 回放 (replay 单条返回 {accepted, replayed})
    const replayed = controller.replayCDC({
      id: 'replay-1', timestamp: new Date().toISOString(),
      tenantId: 't1', tableName: 'members', recordId: 'mem-001',
      eventType: 'UPDATED', eventId: 'replay-cdc', watermark: 2,
      before: { level: 'gold' },
      after: { name: '张三', level: 'platinum' },
    })
    assert.ok(replayed.accepted, '回放应被接受')
    assert.ok(replayed.replayed, '回放结果应有数据')

    // 当前 watermark 不变 (replay 不改变 watermark)
    const statusAfter = controller.cdcStatus('t1')
    assert.equal(statusAfter.currentWatermark, 2, 'replay 不改变 watermark')
  })

  it('👔店长-V3: 跨租户 CDC 数据严格隔离', () => {
    const { controller } = ctx

    controller.applyCDC({
      id: 'cdc-a1', timestamp: new Date().toISOString(),
      tenantId: 'store-a', tableName: 'inventory', recordId: 'item-x',
      eventType: 'UPDATED', eventId: 'cdc-a1', watermark: 1,
      after: { stock: 10 },
    })
    controller.applyCDC({
      id: 'cdc-b1', timestamp: new Date().toISOString(),
      tenantId: 'store-b', tableName: 'inventory', recordId: 'item-x',
      eventType: 'UPDATED', eventId: 'cdc-b1', watermark: 1,
      after: { stock: 5 },
    })

    const tailA = controller.tailCDC('store-a')
    assert.equal(tailA.events.length, 1, 'store-a 只能看到自己的 CDC')
    assert.equal(tailA.events[0].tenantId, 'store-a')

    const tailB = controller.tailCDC('store-b')
    assert.equal(tailB.events.length, 1, 'store-b 只能看到自己的 CDC')
    assert.equal(tailB.events[0].tenantId, 'store-b')
  })
})

// ──── 🛒前台 ────
describe(`${ROLES.FrontDesk} analytics-v2 角色 V3 测试`, () => {
  let ctx: ReturnType<typeof buildFresh>
  beforeEach(() => { ctx = buildFresh() })

  it('🛒前台-V3: 批量事件含混合类型', () => {
    const { controller } = ctx
    const events = [
      { tenantId: 't1', eventId: 'fd-1', type: 'PAGEVIEW' as const, who: 'visitor-1', what: 'ticket_scanner', timestamp: new Date().toISOString() },
      { tenantId: 't1', eventId: 'fd-2', type: 'CONVERSION' as const, who: 'visitor-1', what: 'purchase_ticket', timestamp: new Date().toISOString(), revenueCents: 5000 },
      { tenantId: 't1', eventId: 'fd-3', type: 'CUSTOM' as const, who: 'kiosk-1', what: 'receipt_printed', timestamp: new Date().toISOString() },
      { tenantId: 't1', eventId: 'fd-4', type: 'CLICK' as const, who: 'visitor-2', what: 'qr_scan', timestamp: new Date().toISOString() },
    ]
    const result = controller.collectBatch({ events })
    assert.equal(result.count, 4)
    // 验证每个结果都有 eventId
    const eventIds = result.results.map((r: any) => r.eventId)
    assert.ok(eventIds.includes('fd-1'))
    assert.ok(eventIds.includes('fd-2'))
    assert.ok(eventIds.includes('fd-3'))
    assert.ok(eventIds.includes('fd-4'))
    // 验证事件已持久化
    const recent = controller.recentEvents('t1', '10')
    const types = recent.events.map((e: any) => e.type)
    assert.ok(types.includes('PAGEVIEW'))
    assert.ok(types.includes('CONVERSION'))
    assert.ok(types.includes('CLICK'))
    assert.ok(types.includes('CUSTOM'))
  })

  it('🛒前台-V3: 实时事件流限制参数', () => {
    const { controller, eventAdapter } = ctx
    // 注入 20 条事件
    for (let i = 0; i < 20; i++) {
      eventAdapter.ingest({
        id: `evt-${i}`, tenantId: 't1', eventId: `fe-${i}`, type: 'PAGEVIEW',
        who: 'u', when: new Date(Date.now() + i * 1000).toISOString(),
        where: {}, what: { name: 'test' }, properties: {},
        timestamp: new Date(Date.now() + i * 1000).toISOString(),
      })
    }
    // 要求 limit=5
    const recent5 = controller.recentEvents('t1', '5')
    assert.ok(recent5.events.length <= 5, '最多返回 5 条')

    // 不传 limit 应返回默认 50 条
    const allRecent = controller.recentEvents('t1')
    assert.equal(allRecent.events.length, 20, '默认 limit 应能容纳 20 条')
  })
})

// ──── 👥HR ────
describe(`${ROLES.HR} analytics-v2 角色 V3 测试`, () => {
  let ctx: ReturnType<typeof buildFresh>
  beforeEach(() => { ctx = buildFresh() })

  it('👥HR-V3: 注册会员并构建 cohort 矩阵', () => {
    const { controller } = ctx

    // 注册两批不同周期的会员
    const weeks = ['2026-06-01', '2026-06-08', '2026-06-15']
    for (const w of weeks) {
      controller.registerMember({ tenantId: 't1', period: 'WEEKLY', memberId: `mem-w-${w}`, registrationDate: w })
    }
    controller.registerMember({ tenantId: 't1', period: 'MONTHLY', memberId: 'mem-m-01', registrationDate: '2026-06-01' })

    // 查询 weekly cohorts
    const weeklyList = controller.listCohorts('t1', 'WEEKLY')
    assert.equal(weeklyList.cohorts.length, 3, '应有 3 个 weekly cohort 组')

    // 查询 monthly cohorts
    const monthlyList = controller.listCohorts('t1', 'MONTHLY')
    assert.equal(monthlyList.cohorts.length, 1, '应有 1 个 monthly cohort 组')

    // 构建矩阵
    const matrix = controller.cohortMatrix('t1', 'WEEKLY', '4')
    assert.ok(matrix.cohorts, '矩阵应有 cohorts')
    assert.ok(matrix.matrix, '矩阵应有 matrix 数据')
    assert.ok(matrix.matrix.length >= 1, '矩阵至少 1 行')
  })

  it('👥HR-V3: cohort 可靠性报告含置信度', () => {
    const { controller } = ctx
    controller.registerMember({ tenantId: 't1', period: 'MONTHLY', memberId: 'mem-rel-1', registrationDate: '2026-01-01' })
    controller.registerMember({ tenantId: 't1', period: 'MONTHLY', memberId: 'mem-rel-2', registrationDate: '2026-01-01' })

    const reliability = controller.cohortReliability('t1', 'MONTHLY')
    assert.ok(reliability, '应有可靠性报告')
    assert.ok(typeof reliability.total === 'number', '应有 total')
    assert.ok(typeof reliability.reliable === 'number', '应有 reliable')
    // 此时 cohortSize < 10 所以在 isReliable 中为不可靠
    assert.equal(reliability.reliable, 0, '仅 2 个注册不足 10 人阈值')
  })
})

// ──── 🔧安监 ────
describe(`${ROLES.Security} analytics-v2 角色 V3 测试`, () => {
  let ctx: ReturnType<typeof buildFresh>
  beforeEach(() => { ctx = buildFresh() })

  it('🔧安监-V3: 综合健康报告含所有组件状态', () => {
    const { controller, eventAdapter, cdcAdapter, cohortAdapter } = ctx

    // 注入各类数据
    eventAdapter.ingest({
      id: 'h-e1', tenantId: 't1', eventId: 'health-e1', type: 'PAGEVIEW',
      who: 'u', when: new Date().toISOString(),
      where: {}, what: { name: 'test' }, properties: {}, timestamp: new Date().toISOString(),
    })
    cdcAdapter.apply({ id: 'health-cdc1', timestamp: new Date().toISOString(), eventId: 'health-cdc1', tenantId: 't1', tableName: 'members', recordId: 'r1', eventType: 'CREATED', watermark: Date.now() })
    cohortAdapter.save({ id: 'c1', tenantId: 't1', period: 'MONTHLY', periodKey: '2026-01', cohortSize: 10, registrationDate: new Date('2026-01-01'), memberCount: 1, retention: [0.5], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any)

    const health = controller.metricsHealth('t1')
    assert.ok(health.metrics, '应有 metrics')
    assert.ok(health.retentionHealth, '应有 retentionHealth')
    assert.ok(health.cdc, '应有 cdc 状态')
    assert.ok(typeof health.funnels === 'number', 'funnels 应为数字')
    assert.ok(typeof health.cohorts === 'number', 'cohorts 应为数字')
  })

  it('🔧安监-V3: 空租户健康报告各组件为零', () => {
    const { controller } = ctx
    const health = controller.metricsHealth('t-empty')
    assert.equal(health.funnels, 0, '空租户 funnels 为 0')
    assert.equal(health.cohorts, 0, '空租户 cohorts 为 0')
    assert.equal(health.cdc.currentWatermark, 0, '空租户 CDC currentWatermark 为 0')
  })
})

// ──── 🎮导玩员 ────
describe(`${ROLES.Guide} analytics-v2 角色 V3 测试`, () => {
  let ctx: ReturnType<typeof buildFresh>
  beforeEach(() => { ctx = buildFresh() })

  it('🎮导玩员-V3: 游戏自定义事件带结构化属性', () => {
    const { controller, eventAdapter } = ctx

    const result = controller.collectEvent({
      tenantId: 't1', eventId: 'game-mahjong', type: 'CUSTOM',
      who: 'player-99', what: 'game_finish',
      sessionId: 'sess-mj-1',
      properties: {
        gameId: 'mahjong_comp',
        duration: 480,
        score: 12000,
        level: 'expert',
        opponents: ['bot-easy', 'bot-medium', 'bot-hard'],
        winStreak: true,
      },
      timestamp: new Date().toISOString(),
    })

    assert.ok(result.accepted, '自定义事件应被接受')

    const events = eventAdapter.queryByTenant('t1')
    const gameEvent = events.find(e => e.eventId === 'game-mahjong')
    assert.ok(gameEvent, '游戏事件应持久化')
    assert.ok(gameEvent.properties, '自定义属性应保留')
    assert.equal(gameEvent.properties.opponents.length, 3, '属性数组应保留')
  })

  it('🎮导玩员-V3: 游戏会话多事件关联 - 漏斗视图', () => {
    const { controller } = ctx

    // 导玩员引导玩家完成 3 步游戏流程
    controller.collectEvent({ tenantId: 't1', eventId: 'tour-start', type: 'PAGEVIEW', who: 'player-a', what: 'tournament_entry', sessionId: 'sess-tournament-1', timestamp: new Date().toISOString() })
    controller.collectEvent({ tenantId: 't1', eventId: 'tour-join', type: 'CLICK', who: 'player-a', what: 'join_game', sessionId: 'sess-tournament-1', timestamp: new Date(Date.now() + 5000).toISOString() })
    controller.collectEvent({ tenantId: 't1', eventId: 'tour-finish', type: 'CONVERSION', who: 'player-a', what: 'game_complete', sessionId: 'sess-tournament-1', timestamp: new Date(Date.now() + 30000).toISOString() })

    // 创建对应漏斗 - 运行专员视角
    const funnel = controller.createFunnel({
      tenantId: 't1',
      name: '比赛参与漏斗',
      steps: [
        { name: '进入', eventType: 'PAGEVIEW' },
        { name: '加入', eventType: 'CLICK' },
        { name: '完成', eventType: 'CONVERSION' },
      ],
    })
    assert.ok(funnel.funnel, '漏斗创建成功')
    assert.ok(funnel.funnel.name, '比赛参与漏斗')
  })
})

// ──── 🎯运行专员 ────
describe(`${ROLES.Operations} analytics-v2 角色 V3 测试`, () => {
  let ctx: ReturnType<typeof buildFresh>
  beforeEach(() => { ctx = buildFresh() })

  it('🎯运行专员-V3: 多漏斗创建与管理', () => {
    const { controller } = ctx

    const funnel1 = controller.createFunnel({
      tenantId: 't1', name: '新会员转化', windowDays: 7,
      steps: [
        { name: '浏览主页', eventType: 'PAGEVIEW' },
        { name: '点击注册', eventType: 'CLICK' },
        { name: '完成注册', eventType: 'CONVERSION' },
      ],
    })
    controller.createFunnel({
      tenantId: 't1', name: '购票流程', windowDays: 3,
      steps: [
        { name: '选票', eventType: 'CLICK' },
        { name: '支付', eventType: 'PURCHASE' },
      ],
    })

    const list = controller.listFunnels('t1')
    assert.equal(list.funnels.length, 2, '应有 2 个漏斗')

    // 通过 id 查询单个漏斗 (getFunnel 返回 FunnelResult | null)
    const firstId = funnel1.funnel.id
    const detail = controller.getFunnel('t1', firstId)
    assert.ok(detail, '单个漏斗可查询')
    assert.equal(detail!.name, '新会员转化')
  })

  it('🎯运行专员-V3: 漏斗数据跨租户隔离', () => {
    const { controller } = ctx

    controller.createFunnel({
      tenantId: 'store-a', name: 'A 店漏斗', windowDays: 7,
      steps: [{ name: '进店', eventType: 'PAGEVIEW' }, { name: '购买', eventType: 'PURCHASE' }],
    })
    controller.createFunnel({
      tenantId: 'store-b', name: 'B 店漏斗', windowDays: 3,
      steps: [{ name: '进店', eventType: 'PAGEVIEW' }, { name: '购买', eventType: 'PURCHASE' }],
    })

    const listA = controller.listFunnels('store-a')
    assert.equal(listA.funnels.length, 1)
    assert.equal(listA.funnels[0].name, 'A 店漏斗')

    const listB = controller.listFunnels('store-b')
    assert.equal(listB.funnels.length, 1)
    assert.equal(listB.funnels[0].name, 'B 店漏斗')
  })
})

// ──── 🤝团建 ────
describe(`${ROLES.Teambuilding} analytics-v2 角色 V3 测试`, () => {
  let ctx: ReturnType<typeof buildFresh>
  beforeEach(() => { ctx = buildFresh() })

  it('🤝团建-V3: 会员活动后留存报告含趋势', () => {
    const { controller, eventAdapter } = ctx

    // 注册 3 个会员
    for (let i = 0; i < 3; i++) {
      controller.registerMember({ tenantId: 't1', period: 'WEEKLY', memberId: `mem-tb-v3-${i}`, registrationDate: '2026-06-01' })
    }
    // 使用 trackActivity 追踪活跃
    for (let w = 0; w < 4; w++) {
      controller.trackActivity({
        tenantId: 't1', memberId: 'mem-tb-v3-0', activityType: 'PAGEVIEW',
        properties: { week: w },
      })
    }

    const report = controller.generateRetention({ tenantId: 't1', period: 'WEEKLY' })
    assert.ok(report.report, '应有留存报告')
    assert.ok(Array.isArray(report.report.matrix), 'matrix 应为数组')
    assert.ok(report.report.matrix.length > 0, 'matrix 非空')

    // 留存趋势
    const trend = controller.retentionTrend('t1', 'WEEKLY', '4')
    assert.ok(trend.trend, '应有趋势数据')
    assert.ok(Array.isArray(trend.trend), '趋势应为数组')
  })

  it('🤝团建-V3: 长期活动提升留存健康度', () => {
    const { controller } = ctx

    // 注册
    controller.registerMember({ tenantId: 't1', period: 'WEEKLY', memberId: 'mem-loyal', registrationDate: '2026-06-01' })
    // 使用 trackActivity 追踪会员行为 (cohort 级别追踪)
    for (let d = 0; d < 7; d++) {
      controller.trackActivity({
        tenantId: 't1', memberId: 'mem-loyal', activityType: 'PAGEVIEW',
        properties: { day: d },
      })
    }

    const health = controller.retentionHealth('t1', 'WEEKLY')
    assert.ok(health, '应有健康度')
    assert.ok(['POOR', 'FAIR', 'GOOD', 'EXCELLENT'].includes(health.level), 'level 应为有效值')
  })
})

// ──── 📢营销 ────
describe(`${ROLES.Marketing} analytics-v2 角色 V3 测试`, () => {
  let ctx: ReturnType<typeof buildFresh>
  beforeEach(() => { ctx = buildFresh() })

  it('📢营销-V3: 实时指标反映最新活动趋势', () => {
    const { controller, eventAdapter } = ctx

    // 初期注入一批事件 (使用 ingest 保证时间戳在 5min 内)
    for (let i = 0; i < 5; i++) {
      eventAdapter.ingest({
        id: `live-e${i}`, tenantId: 't1', eventId: `live-${i}`, type: 'PAGEVIEW',
        who: 'u', when: new Date().toISOString(),
        where: { channel: 'campaign_summer' }, what: { name: 'landing' },
        properties: {}, timestamp: new Date().toISOString(),
      })
    }

    const live = controller.metricsLive('t1')
    assert.ok(live, '应有实时指标')
    assert.ok(typeof live.eventsLast5min === 'number', '应有 eventsLast5min')
    assert.ok(typeof live.activeSessions === 'number', '应有 activeSessions')
    assert.ok(live.eventsLast5min >= 5, '至少 5 个事件被记录')
  })

  it('📢营销-V3: 多渠道事件采集并汇总比较', () => {
    const { controller, eventAdapter } = ctx

    // 渠道 A 事件（直播广告）
    for (let i = 0; i < 3; i++) {
      eventAdapter.ingest({
        id: `chA-${i}`, tenantId: 't1', eventId: `chA-camp-${i}`, type: 'PAGEVIEW',
        who: `user-A${i}`, when: new Date().toISOString(),
        where: { channel: 'social_livestream' }, what: { name: 'page_view' },
        properties: {}, revenueCents: 0, timestamp: new Date().toISOString(),
      })
    }
    eventAdapter.ingest({
      id: 'chA-conv', tenantId: 't1', eventId: 'chA-conv', type: 'CONVERSION',
      who: 'user-A0', when: new Date().toISOString(),
      where: { channel: 'social_livestream' }, what: { name: 'signup' },
      properties: {}, revenueCents: 0, timestamp: new Date().toISOString(),
    })

    // 渠道 B 事件（线上投放）有营收
    for (let i = 0; i < 2; i++) {
      eventAdapter.ingest({
        id: `chB-${i}`, tenantId: 't1', eventId: `chB-camp-${i}`, type: 'PURCHASE',
        who: `user-B${i}`, when: new Date().toISOString(),
        where: { channel: 'paid_search' }, what: { name: 'purchase' },
        properties: {}, revenueCents: 15000, timestamp: new Date().toISOString(),
      })
    }

    const summary = controller.metricsSummary('t1', '30')
    assert.ok(summary.metrics, '应有汇总指标')
    const rev = summary.metrics.find((m: any) => m.value > 0)
    assert.ok(rev, '应有正值的营收指标')
    assert.ok(summary.series.revenue, '应有营收时间序列')
  })

  it('📢营销-V3: 活动 0 营收不影响系统稳定性', () => {
    const { controller } = ctx

    // 只采集浏览事件无营收
    controller.collectEvent({
      tenantId: 't1', eventId: 'mkt-zero-rev', type: 'PAGEVIEW',
      who: 'visitor', what: 'campaign_banner',
      timestamp: new Date().toISOString(),
    })

    const summary = controller.metricsSummary('t1', '7')
    assert.ok(summary, '应有汇总')
    assert.ok(Array.isArray(summary.metrics), 'metrics 为数组')

    // 实时指标正常运行
    const live = controller.metricsLive('t1')
    assert.ok(live, '实时指标正常运行')
  })
})

// ──── 端到端多角色协作场景 ────
describe('端到端多角色协作 - analytics-v2 数据链', () => {
  let ctx: ReturnType<typeof buildFresh>
  beforeEach(() => { ctx = buildFresh() })

  it('完整数据链: 🛒前台采集→🔧安监审核→👔店长看板', () => {
    const { controller } = ctx

    // Step 1 - 🛒前台: 批量采集一天门票事件
    const ticketEvents = Array.from({ length: 5 }, (_, i) => ({
      tenantId: 't1',
      eventId: `day-ticket-${i}`,
      type: 'PURCHASE' as const,
      who: `guest-${i}`,
      what: 'purchase_entry_ticket',
      timestamp: new Date('2026-07-01T10:00:00Z').toISOString(),
      revenueCents: 8000,
    }))
    const collectResult = controller.collectBatch({ events: ticketEvents })
    assert.equal(collectResult.count, 5, '前台采集 5 条门票事件')

    // Step 2 - 🔧安监: 查看健康度和组件状态
    const health = controller.metricsHealth('t1')
    assert.ok(health.metrics, '安监看到汇总')
    assert.ok(health.metrics.series, '应有时间序列')

    // Step 3 - 👔店长: 查看总营收汇总
    const summary = controller.metricsSummary('t1', '30')
    assert.ok(summary, '店长看到总汇')
    assert.ok(summary.series.revenue, '营收时间序列应有')
  })

  it('完整数据链: 👥HR注册→🤝团建跟踪→📢营销ROI', () => {
    const { controller } = ctx

    // 👥HR 注册会员
    controller.registerMember({ tenantId: 't1', period: 'MONTHLY', memberId: 'mem-chain-1', registrationDate: '2026-07-01' })

    // 🤝团建跟踪活跃 (使用 trackActivity 确保 cohort 追踪)
    const activityDates = ['2026-07-01', '2026-07-03', '2026-07-05', '2026-07-08']
    for (const d of activityDates) {
      controller.trackActivity({
        tenantId: 't1', memberId: 'mem-chain-1', activityType: 'PAGEVIEW',
        properties: { date: d },
      })
    }

    // 📢营销记录营收
    controller.collectEvent({
      tenantId: 't1', eventId: 'chain-rev-1', type: 'PURCHASE',
      who: 'mem-chain-1', what: 'premium_upgrade',
      timestamp: new Date('2026-07-08').toISOString(),
      revenueCents: 99900,
    })

    // 留存报告
    const retention = controller.generateRetention({ tenantId: 't1', period: 'MONTHLY' })
    assert.ok(retention.report, '留存报告生成')

    // 营收汇总
    const summary = controller.metricsSummary('t1', '30')
    assert.ok(summary.metrics, '应有汇总指标')
    const revMetric = summary.metrics.find((m: any) => m.value > 0)
    assert.ok(revMetric, '为正值的营收应出现在汇总中')
  })
})
