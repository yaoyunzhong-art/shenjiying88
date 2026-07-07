import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [analytics-v2] [C] 角色测试
 *
 * 8 角色视角的 AnalyticsV2 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
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

// ── 角色定义 ──
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

// ── 工具函数: 构建完整 Controller ──
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
  const metricsService = new MetricsService(eventCollector, cdcStream, cohortService, funnelService, retentionService,
    eventAdapter, cdcAdapter, funnelAdapter, retentionAdapter, cohortAdapter)

  const controller = new AnalyticsV2Controller(
    eventCollector,
    cdcStream,
    cohortService,
    funnelService,
    retentionService,
    metricsService,
  )

  return { controller, eventAdapter, cdcAdapter, cohortAdapter, funnelAdapter, retentionAdapter }
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} analytics-v2 角色测试`, () => {
  let ctx: ReturnType<typeof buildFresh>

  beforeEach(() => { ctx = buildFresh() })

  it('👔店长-正常: 查看综合指标汇总', () => {
    const { controller, eventAdapter } = ctx

    // 采集事件以产生数据
    eventAdapter.ingest({
      id: '1', tenantId: 't1', eventId: 'e1', type: 'PAGEVIEW',
      who: 'user-a', when: new Date().toISOString(),
      where: {}, what: { name: 'page_view' },
      properties: {}, timestamp: new Date().toISOString(),
    })

    const result = controller.metricsSummary('t1', '7')
    assert.ok(result.metrics, '应有指标列表')
    assert.ok(Array.isArray(result.metrics), '指标应为数组')
    assert.ok(result.metrics.length > 0, '至少有一个指标')
  })

  it('👔店长-边界: 查看不存在的租户指标', () => {
    const { controller } = ctx
    const result = controller.metricsSummary('non-existent', '7')
    assert.ok(result.metrics, '即使无数据也应返回空指标')
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} analytics-v2 角色测试`, () => {
  let ctx: ReturnType<typeof buildFresh>

  beforeEach(() => { ctx = buildFresh() })

  it('🛒前台-正常: 采集单个事件', () => {
    const { controller, eventAdapter } = ctx

    const result = controller.collectEvent({
      tenantId: 't1', eventId: 'evt-100', type: 'PAGEVIEW',
      who: 'member-x', what: 'homepage_view',
      sessionId: 'sess-abc', timestamp: new Date().toISOString(),
    })

    assert.ok(result.accepted, '前台采集事件应成功')
    const events = eventAdapter.queryByTenant('t1')
    assert.ok(events.some(e => e.eventId === 'evt-100'), '事件应持久化')
  })

  it('🛒前台-边界: 采集事件缺少必需字段', () => {
    const { controller } = ctx

    const result = controller.collectEvent({
      tenantId: '', eventId: 'bad-evt', type: 'PAGEVIEW',
      who: '', what: '',
      timestamp: new Date().toISOString(),
    })

    // 即使参数不完整, 采集器不应抛未捕获异常
    assert.ok(result, '应返回结果')
    assert.equal(typeof result.accepted, 'boolean', '应有 accepted 字段')
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} analytics-v2 角色测试`, () => {
  let ctx: ReturnType<typeof buildFresh>

  beforeEach(() => { ctx = buildFresh() })

  it('👥HR-正常: 注册会员后查看 cohort', () => {
    const { controller, cohortAdapter: cohortService } = ctx

    // 使用 controller 的 cohort 注册端点
    controller.registerMember({
      tenantId: 't1', period: 'MONTHLY', memberId: 'mem-hr-1',
      registrationDate: '2026-01-15',
    })

    const list = controller.listCohorts('t1', 'MONTHLY')
    assert.ok(list.cohorts, '应有 cohort 列表')
    assert.ok(list.cohorts.length >= 1, '至少有一个 cohort')
  })

  it('👥HR-边界: 无数据的 cohort 列表', () => {
    const { controller } = ctx
    const list = controller.listCohorts('t-empty')
    assert.equal(list.cohorts.length, 0, '空租户 cohort 应为空')
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} analytics-v2 角色测试`, () => {
  let ctx: ReturnType<typeof buildFresh>

  beforeEach(() => { ctx = buildFresh() })

  it('🔧安监-正常: 查看综合健康报告', () => {
    const { controller, eventAdapter } = ctx

    // 注入数据
    eventAdapter.ingest({
      id: '1', tenantId: 't1', eventId: 'e1', type: 'PAGEVIEW',
      who: 'user-a', when: new Date().toISOString(),
      where: {}, what: { name: 'page_view' },
      properties: {}, timestamp: new Date().toISOString(),
    })

    const health = controller.metricsHealth('t1')
    assert.ok(health.metrics, '应有指标')
    assert.ok(health.retentionHealth, '应有留存健康度')
    assert.ok(health.cdc, '应有 CDC 状态')
  })

  it('🔧安监-边界: 空租户健康报告', () => {
    const { controller } = ctx
    const health = controller.metricsHealth('t-empty')
    assert.ok(health, '空租户也应返回健康报告')
    assert.ok(typeof health.funnels === 'number', 'funnels 应为数字')
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} analytics-v2 角色测试`, () => {
  let ctx: ReturnType<typeof buildFresh>

  beforeEach(() => { ctx = buildFresh() })

  it('🎮导玩员-正常: 采集游戏事件并查看', () => {
    const { controller, eventAdapter } = ctx

    // 采集一个游戏事件 (CUSTOM 类型模拟游戏操作)
    controller.collectEvent({
      tenantId: 't1', eventId: 'game-pk-1', type: 'CUSTOM',
      who: 'guide-player', what: 'game_finish_score_8500',
      sessionId: 'sess-game-1', timestamp: new Date().toISOString(),
      properties: { gameId: 'mahjong_classic', score: 8500, duration: 320 },
    })

    const events = eventAdapter.queryByTenant('t1')
    assert.ok(events.some(e => e.eventId === 'game-pk-1'), '游戏事件应持久化')

    const recent = controller.recentEvents('t1', '10')
    assert.ok(recent.events, '应有事件列表')
  })

  it('🎮导玩员-边界: 批量采集过多事件', () => {
    const { controller } = ctx

    const manyEvents = Array.from({ length: 200 }, (_, i) => ({
      tenantId: 't1', eventId: `bulk-evt-${i}`, type: 'CLICK' as const,
      who: `player-${i % 10}`, what: 'game_action',
      timestamp: new Date().toISOString(),
    }))

    const result = controller.collectBatch({ events: manyEvents })
    // 系统应处理, 不抛异常
    assert.equal(result.count, 200, '所有事件应被处理')
    assert.equal(result.results.length, 200, '所有结果应返回')
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} analytics-v2 角色测试`, () => {
  let ctx: ReturnType<typeof buildFresh>

  beforeEach(() => { ctx = buildFresh() })

  it('🎯运行专员-正常: 创建并查看漏斗', () => {
    const { controller } = ctx

    const funnel = controller.createFunnel({
      tenantId: 't1',
      name: '注册转化漏斗',
      steps: [
        { name: '访问首页', eventType: 'PAGEVIEW' },
        { name: '点击注册', eventType: 'CLICK' },
        { name: '完成注册', eventType: 'CONVERSION' },
      ],
      windowDays: 7,
    })

    assert.ok(funnel.funnel, '应返回漏斗对象')
    assert.ok(funnel.funnel.id, '漏斗应有 ID')
    assert.equal(funnel.funnel.name, '注册转化漏斗', '名称应一致')

    const list = controller.listFunnels('t1')
    assert.ok(list.funnels.some((f: any) => f.id === funnel.funnel.id), '已创建的漏斗应在列表中')
  })

  it('🎯运行专员-边界: 漏斗默认模板', () => {
    const { controller } = ctx
    const tmpl = controller.defaultFunnelTemplate()
    assert.ok(tmpl.steps, '默认模板应有步骤')
    assert.ok(Array.isArray(tmpl.steps), '步骤应为数组')
    assert.ok(tmpl.steps.length >= 3, '默认模板至少 3 步')
    // 模板不应写回任意租户
    const list = controller.listFunnels('t1')
    assert.equal(list.funnels.length, 0, '获取模板不应影响实际漏斗列表')
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} analytics-v2 角色测试`, () => {
  let ctx: ReturnType<typeof buildFresh>

  beforeEach(() => { ctx = buildFresh() })

  it('🤝团建-正常: 注册多个会员生成留存报告', () => {
    const { controller, cohortAdapter: cohortService } = ctx

    // 批量注册会员 (通过 controller)
    for (let i = 0; i < 5; i++) {
      controller.registerMember({
        tenantId: 't1', period: 'WEEKLY',
        memberId: `mem-tb-${i}`,
        registrationDate: '2026-06-01',
      })
    }

    const result = controller.generateRetention({ tenantId: 't1', period: 'WEEKLY' })
    assert.ok(result.report, '应有留存报告')
    assert.ok(result.report.matrix, '应有留存矩阵')
    assert.equal(result.report.avgRetention.d1, 0, '刚注册尚无活动, D1 留存为 0')
  })

  it('🤝团建-边界: 留存健康度查看', () => {
    const { controller } = ctx
    const health = controller.retentionHealth('t-no-data', 'MONTHLY')
    assert.ok(health, '无数据也应返回健康度')
    assert.equal(health.level, 'POOR', '无数据时等级为 POOR')
    assert.ok(Array.isArray(health.recommendations), '应有建议列表')
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} analytics-v2 角色测试`, () => {
  let ctx: ReturnType<typeof buildFresh>

  beforeEach(() => { ctx = buildFresh() })

  it('📢营销-正常: 批量采集营销转化事件', () => {
    const { controller } = ctx

    const events = [
      { tenantId: 't1', eventId: 'mkt-1', type: 'CONVERSION' as const, who: 'mem-mkt', what: 'purchase', timestamp: new Date().toISOString(), revenueCents: 1999 },
      { tenantId: 't1', eventId: 'mkt-2', type: 'CONVERSION' as const, who: 'mem-mkt', what: 'purchase', timestamp: new Date().toISOString(), revenueCents: 5000 },
      { tenantId: 't1', eventId: 'mkt-3', type: 'PAGEVIEW' as const, who: 'mem-mkt', what: 'view_campaign', timestamp: new Date().toISOString() },
    ]

    const result = controller.collectBatch({ events })
    assert.equal(result.count, 3, '应采集 3 条事件')
    assert.equal(result.results.length, 3, '返回结果应有 3 条')
    const allAccepted = result.results.every((r: any) => r.accepted)
    assert.ok(allAccepted, '所有事件应被接受')
  })

  it('📢营销-边界: 营销活动 ROI - 成本小于营收', () => {
    const { controller, eventAdapter } = ctx

    // 模拟: 营收事件和活跃会员
    eventAdapter.ingest({
      id: 'rev-1', tenantId: 't1', eventId: 'mkt-roi-1', type: 'PURCHASE',
      who: 'mem-1', when: new Date().toISOString(),
      where: {}, what: { name: 'purchase' }, properties: {},
      revenueCents: 50000, timestamp: new Date().toISOString(),
    })
    eventAdapter.ingest({
      id: 'act-1', tenantId: 't1', eventId: 'mkt-roi-2', type: 'PAGEVIEW',
      who: 'mem-1', when: new Date().toISOString(),
      where: { channel: 'campaign_summer' }, what: { name: 'campaign_landing' },
      properties: {}, timestamp: new Date().toISOString(),
    })

    const summary = controller.metricsSummary('t1', '30')
    const revMetric = summary.metrics.find((m: any) => m.name === '营收')
    assert.ok(revMetric, '应有营收指标')
    assert.ok(revMetric.value >= 50000, '营收应 >= 50000')
    assert.ok(summary.series.revenue, '应有营收时间序列')
  })
})
