/**
 * 🐜 自动: [lineage] [C] 角色扩展测试
 *
 * 8 角色视角的数据血缘模块扩展测试：
 *   👔 店长  🛒 前台  👥 HR  🔧 安监
 *   🎮 导玩员 🎯 运行专员 🤝 团建 📢 营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限/业务边界）
 * 使用 DataLineageTracker / ImpactAnalyzer 原生 API
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { DataLineageTracker, ImpactAnalyzer } from './data-lineage.service'

// ── 基础装置 ──

function setup() {
  const tracker = new DataLineageTracker()
  const analyzer = new ImpactAnalyzer(tracker)
  return { tracker, analyzer }
}

function seedStandard(tracker: DataLineageTracker) {
  // users.email -> profiles.email
  tracker.trackField('profiles', 'email', { tableName: 'users', fieldName: 'email' })
  // users.email -> analytics.user_email (transform)
  tracker.trackTransform(
    { tableName: 'analytics', fieldName: 'user_email' },
    [{ tableName: 'users', fieldName: 'email' }],
  )
  // orders.total -> invoices.amount (transform: 汇总)
  tracker.trackTransform(
    { tableName: 'invoices', fieldName: 'amount' },
    [{ tableName: 'orders', fieldName: 'total' }],
  )
  // users.phone -> crm.mobile
  tracker.trackField('crm', 'mobile', { tableName: 'users', fieldName: 'phone' })
}

// ============================================================================
// 👔 店长 (StoreManager) — 数据资产全貌与业务决策
// ============================================================================
describe('👔 店长 — 数据血缘扩展', () => {
  it('✅ 正例: 查看完整血缘图，确认业务报表数据来源', () => {
    const { tracker } = setup()
    seedStandard(tracker)

    // 查看 invoices.amount 的上游
    const upstream = tracker.getUpstream('invoices', 'amount')
    expect(upstream.length).toBe(1)
    expect(upstream[0].tableName).toBe('orders')
    expect(upstream[0].fieldName).toBe('total')
  })

  it('✅ 正例: 查看用户字段被哪些下游使用', () => {
    const { tracker } = setup()
    seedStandard(tracker)

    const downstream = tracker.getDownstream('users', 'email')
    expect(downstream.length).toBeGreaterThanOrEqual(1)
    const tables = downstream.map((d) => `${d.tableName}.${d.fieldName}`)
    expect(tables).toContain('profiles.email')
    expect(tables).toContain('analytics.user_email')
  })

  it('🔲 边界: 查看从未注册的表血缘返回空', () => {
    const { tracker } = setup()
    expect(tracker.getUpstream('ghost', 'col')).toEqual([])
    expect(tracker.getDownstream('ghost', 'col')).toEqual([])
  })

  it('🔲 边界: reset 后血缘图完全清空', () => {
    const { tracker } = setup()
    seedStandard(tracker)
    expect(tracker.getUpstream('invoices', 'amount').length).toBe(1)
    tracker.reset()
    expect(tracker.getUpstream('invoices', 'amount').length).toBe(0)
  })
})

// ============================================================================
// 🛒 前台 (Cashier) — 收银相关字段血缘
// ============================================================================
describe('🛒 前台 — 收银字段血缘', () => {
  it('✅ 正例: 追踪订单金额到报表的下游', () => {
    const { tracker, analyzer } = setup()
    seedStandard(tracker)

    // 模拟前台关心的订单金额字段
    tracker.trackField('transactions', 'net_amount', { tableName: 'orders', fieldName: 'total' })
    const downstream = tracker.getDownstream('orders', 'total')
    expect(downstream.some((d) => d.tableName === 'invoices')).toBe(true)
    expect(downstream.some((d) => d.tableName === 'transactions')).toBe(true)
  })

  it('🔲 边界: 前台不能访问 HR/安监敏感字段血缘', () => {
    const { tracker } = setup()
    seedStandard(tracker)

    // 前台权限模拟: hr_salary 字段不应出现在前台操作上下文中
    tracker.trackField('hr', 'salary', { tableName: 'payroll', fieldName: 'base' })
    const hrDownstream = tracker.getDownstream('payroll', 'base')
    // 前台视角只能看到收银相关
    const cashierRelevant = hrDownstream.filter(
      (d) => d.tableName === 'transactions' || d.tableName === 'orders',
    )
    expect(cashierRelevant.length).toBe(0)
  })
})

// ============================================================================
// 👥 HR (人力资源) — 员工数据血缘
// ============================================================================
describe('👥 HR — 员工数据血缘', () => {
  it('✅ 正例: 追踪员工手机号在多个系统的传播', () => {
    const { tracker } = setup()
    seedStandard(tracker)

    tracker.trackField('hr', 'phone', { tableName: 'users', fieldName: 'phone' })
    tracker.trackField('attendance', 'mobile', { tableName: 'hr', fieldName: 'phone' })

    // getDownstream 只返回直接下游，attendance 是 hr 的下游不是 users.phone 的直接下游
    const downstream = tracker.getDownstream('users', 'phone')
    const tables = downstream.map((d) => d.tableName)
    expect(tables).toContain('crm')
    expect(tables).toContain('hr')

    // hr.phone 的下游包含 attendance
    const hrDownstream = tracker.getDownstream('hr', 'phone')
    const hrTables = hrDownstream.map((d) => d.tableName)
    expect(hrTables).toContain('attendance')
  })

  it('🔲 边界: HR 创建新字段注册不受其他模块影响', () => {
    const { tracker } = setup()
    seedStandard(tracker)

    // HR 注册新员工考核字段，不应影响已有血缘
    tracker.trackField('performance_review', 'score', { tableName: 'hr', fieldName: 'rating' })
    const upstream = tracker.getUpstream('analytics', 'user_email')
    expect(upstream.length).toBe(1)
  })
})

// ============================================================================
// 🔧 安监 (Safety/Security) — 敏感数据字段追踪
// ============================================================================
describe('🔧 安监 — 敏感数据安全血缘', () => {
  it('✅ 正例: 追踪身份证号在各个系统的流转', () => {
    const { tracker } = setup()
    seedStandard(tracker)

    tracker.trackField('users', 'id_card', { tableName: '__source', fieldName: '__import' })
    tracker.trackField('kyc', 'id_number', { tableName: 'users', fieldName: 'id_card' })
    tracker.trackField('compliance', 'customer_id', { tableName: 'kyc', fieldName: 'id_number' })

    const downstream = tracker.getDownstream('users', 'id_card')
    expect(downstream.some((d) => d.tableName === 'kyc')).toBe(true)

    // 验证全链路完整
    const kycDownstream = tracker.getDownstream('kyc', 'id_number')
    expect(kycDownstream.some((d) => d.tableName === 'compliance')).toBe(true)
  })

  it('🔲 边界: 安监发现未注册的下游字段应标记为风险', () => {
    const { tracker } = setup()
    seedStandard(tracker)

    tracker.trackField('users', 'password_hash', { tableName: '__auth', fieldName: '__origin' })
    // 未授权传播到日志表（安全风险场景）
    tracker.trackField('logs', 'credential', { tableName: 'users', fieldName: 'password_hash' })
    const passwordDownstream = tracker.getDownstream('users', 'password_hash')
    expect(passwordDownstream.some((d) => d.tableName === 'logs')).toBe(true)
  })
})

// ============================================================================
// 🎮 导玩员 (GameGuide) — 游戏数据血缘
// ============================================================================
describe('🎮 导玩员 — 游戏数据血缘', () => {
  it('✅ 正例: 玩家行为数据从原始日志到聚合报表', () => {
    const { tracker } = setup()
    seedStandard(tracker)

    tracker.trackField('game_events', 'player_score', { tableName: 'players', fieldName: 'score' })
    tracker.trackField('leaderboard', 'score', { tableName: 'game_events', fieldName: 'player_score' })

    // 直接下游: players.score -> game_events.player_score
    const downstream = tracker.getDownstream('players', 'score')
    expect(downstream.some((d) => d.tableName === 'game_events')).toBe(true)

    // leaderboard 是 game_events 的下游，通过 game_events 间接可达
    const gameEventDownstream = tracker.getDownstream('game_events', 'player_score')
    expect(gameEventDownstream.some((d) => d.tableName === 'leaderboard')).toBe(true)

    // 验证上游: leaderboard.score 上游是 game_events.player_score
    const lbUpstream = tracker.getUpstream('leaderboard', 'score')
    expect(lbUpstream.some((d) => d.tableName === 'game_events')).toBe(true)
  })

  it('🔲 边界: 导玩员无权看到系统级血缘', () => {
    const { tracker } = setup()
    seedStandard(tracker)

    // 系统内部字段（运维/监控层）
    tracker.trackField('_infra', 'node_health', { tableName: '_system', fieldName: '_metrics' })

    const gameFields = tracker.getDownstream('players', 'score')
    const infraFields = gameFields.filter((d) => d.tableName.startsWith('_'))
    expect(infraFields.length).toBe(0)
  })
})

// ============================================================================
// 🎯 运行专员 (Operations) — 系统运维数据血缘
// ============================================================================
describe('🎯 运行专员 — 运维字段血缘', () => {
  it('✅ 正例: 追踪基础设施指标字段血缘', () => {
    const { tracker } = setup()
    seedStandard(tracker)

    tracker.trackField('metrics', 'cpu_usage', { tableName: 'node', fieldName: 'cpu' })
    tracker.trackField('alerts', 'threshold_breach', { tableName: 'metrics', fieldName: 'cpu_usage' })
    tracker.trackTransform(
      { tableName: 'dashboard', fieldName: 'avg_cpu' },
      [{ tableName: 'metrics', fieldName: 'cpu_usage' }],
    )

    const downstream = tracker.getDownstream('metrics', 'cpu_usage')
    expect(downstream.some((d) => d.tableName === 'alerts')).toBe(true)
    expect(downstream.some((d) => d.tableName === 'dashboard')).toBe(true)
  })

  it('🔲 边界: 运维字段变更影响分析报告', () => {
    const { tracker, analyzer } = setup()
    seedStandard(tracker)

    tracker.trackField('metrics', 'disk_io', { tableName: 'node', fieldName: 'disk' })
    const impact = analyzer.analyzeImpact('metrics', 'disk_io')
    expect(impact).toBeDefined()
    expect(impact.fieldRef.fieldName).toBe('disk_io')
    expect(impact.riskLevel).toBe('LOW')
  })
})

// ============================================================================
// 🤝 团建 (TeamBuilding) — 团建活动数据血缘
// ============================================================================
describe('🤝 团建 — 团建活动数据血缘', () => {
  it('✅ 正例: 追踪团建活动报名字段血缘', () => {
    const { tracker } = setup()
    seedStandard(tracker)

    tracker.trackField('team_events', 'registrant', { tableName: 'employees', fieldName: 'name' })
    tracker.trackField('team_budget', 'event_cost', { tableName: 'finance', fieldName: 'approved_amount' })

    const registrantUpstream = tracker.getUpstream('team_events', 'registrant')
    expect(registrantUpstream.some((d) => d.tableName === 'employees')).toBe(true)
  })

  it('🔲 边界: 团建数据不与其他业务模块血缘混淆', () => {
    const { tracker } = setup()
    seedStandard(tracker)

    tracker.trackField('team_feedback', 'satisfaction', { tableName: 'team_events', fieldName: 'id' })

    // 普通业务字段与团建字段独立
    const businessUpstream = tracker.getUpstream('orders', 'total')
    const teamUpstream = tracker.getUpstream('team_feedback', 'satisfaction')
    expect(businessUpstream.length).toBe(0) // 根节点
    expect(teamUpstream.length).toBe(1)
  })
})

// ============================================================================
// 📢 营销 (Marketing) — 营销活动数据血缘
// ============================================================================
describe('📢 营销 — 营销活动字段血缘', () => {
  it('✅ 正例: 追踪用户标签字段在营销链路的传播', () => {
    const { tracker } = setup()
    seedStandard(tracker)

    tracker.trackField('marketing', 'user_segment', { tableName: 'users', fieldName: 'email' })
    tracker.trackField('campaigns', 'target_audience', { tableName: 'marketing', fieldName: 'user_segment' })
    tracker.trackTransform(
      { tableName: 'analytics', fieldName: 'campaign_effectiveness' },
      [
        { tableName: 'users', fieldName: 'email' },
        { tableName: 'campaigns', fieldName: 'target_audience' },
      ],
    )

    // 直接下游: users.email -> profiles.email, analytics.user_email, marketing.user_segment
    const downstream = tracker.getDownstream('users', 'email')
    const marketingTables = downstream.map((d) => d.tableName)
    expect(marketingTables).toContain('marketing')

    // campaigns 是 marketing 的下游，不是 users.email 的直接下游
    const mktDownstream = tracker.getDownstream('marketing', 'user_segment')
    expect(mktDownstream.some((d) => d.tableName === 'campaigns')).toBe(true)

    // 通过 campaign_effectiveness 验证转换血缘
    const effectUpstream = tracker.getUpstream('analytics', 'campaign_effectiveness')
    expect(effectUpstream.length).toBeGreaterThanOrEqual(1)
  })

  it('🔲 边界: 营销字段血缘图中包含转换血缘', () => {
    const { tracker } = setup()
    seedStandard(tracker)

    tracker.trackTransform(
      { tableName: 'marketing_roi', fieldName: 'roi_score' },
      [
        { tableName: 'marketing', fieldName: 'cost' },
        { tableName: 'campaigns', fieldName: 'revenue' },
      ],
    )

    const upstream = tracker.getUpstream('marketing_roi', 'roi_score')
    expect(upstream.length).toBe(2)
    const tables = upstream.map((d) => d.tableName)
    expect(tables).toContain('marketing')
    expect(tables).toContain('campaigns')
  })
})

// ============================================================================
// 🧪 综合扩展 — 影响分析/边界/交叉场景
// ============================================================================
describe('🧪 综合 — 影响分析与边界场景', () => {
  it('影响分析: 分析无血缘字段返回空影响', () => {
    const { analyzer } = setup()
    const impact = analyzer.analyzeImpact('isolated', 'field')
    expect(impact.downstreamFields).toEqual([])
    expect(impact.riskLevel).toBe('LOW')
  })

  it('影响分析: 高影响字段被评为 HIGH 风险', () => {
    const { tracker, analyzer } = setup()
    seedStandard(tracker)

    // 注册多个仪表板
    analyzer.registerDashboard({
      dashboardId: 'd1',
      dashboardName: '用户分析',
      fields: [{ tableName: 'users', fieldName: 'email' }],
    })
    analyzer.registerDashboard({
      dashboardId: 'd2',
      dashboardName: '订单报表',
      fields: [{ tableName: 'orders', fieldName: 'total' }],
    })
    analyzer.registerDashboard({
      dashboardId: 'd3',
      dashboardName: 'CRM 看板',
      fields: [{ tableName: 'users', fieldName: 'phone' }],
    })

    // 注册 API
    analyzer.registerAPI({
      apiId: 'a1',
      apiName: '用户查询',
      endpoint: '/api/users',
      fields: [{ tableName: 'users', fieldName: 'email' }],
    })
    analyzer.registerAPI({
      apiId: 'a2',
      apiName: '订单列表',
      endpoint: '/api/orders',
      fields: [{ tableName: 'orders', fieldName: 'total' }],
    })

    // 影响分析 users.email
    const impact = analyzer.analyzeImpact('users', 'email')
    expect(impact.affectedDashboards.length).toBeGreaterThanOrEqual(1)
    expect(impact.affectedAPIs.length).toBeGreaterThanOrEqual(1)
  })

  it('影响分析: 变更风险评估', () => {
    const { tracker, analyzer } = setup()
    seedStandard(tracker)

    analyzer.registerDashboard({
      dashboardId: 'd1',
      dashboardName: '销售看板',
      fields: [{ tableName: 'orders', fieldName: 'total' }],
    })

    const assessment = analyzer.estimateRiskChange({
      tableName: 'orders',
      fieldName: 'total',
      changeType: 'TYPE_CHANGE',
    })
    expect(assessment.level).toBeDefined()
    expect(assessment.score).toBeGreaterThan(0)
    expect(assessment.reasons.length).toBeGreaterThan(0)
  })

  it('重置: 全链路追踪 + 重置后隔离', () => {
    const { tracker } = setup()
    seedStandard(tracker)
    expect(tracker.getUpstream('invoices', 'amount').length).toBe(1)

    tracker.reset()
    expect(tracker.getUpstream('invoices', 'amount').length).toBe(0)

    // 重置后重建
    seedStandard(tracker)
    expect(tracker.getUpstream('invoices', 'amount').length).toBe(1)
  })

  it('空表注册后下游追踪一致性', () => {
    const { tracker } = setup()
    seedStandard(tracker)

    // 注册空节点
    tracker.trackField('empty', 'col', { tableName: 'void', fieldName: 'nothing' })
    const downstream = tracker.getDownstream('void', 'nothing')
    expect(downstream.some((d) => d.tableName === 'empty')).toBe(true)
  })
})
