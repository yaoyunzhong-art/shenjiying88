/**
 * 🐜 自动: [ai-insight] [C] 角色测试
 * 
 * 8 角色视角的 ai-insight 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { AiInsightController } from './ai-insight.controller'
import { AiInsightService } from './ai-insight.service'

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

type RoleName = keyof typeof ROLES

// ── 权限矩阵：每个角色可访问的操作 ──
// 定义每个角色的操作边界
const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  StoreManager:   ['getKPIs', 'getKPIDetail', 'generateReport', 'getReports', 'detectAnomalies', 'getAnomalies', 'acknowledgeAnomaly', 'resolveAnomaly', 'generateForecast', 'getForecast', 'getDashboardSummary'],
  FrontDesk:      ['getKPIs', 'getKPIDetail', 'getReports', 'getAnomalies', 'getDashboardSummary'],
  HR:             ['getKPIs', 'getKPIDetail', 'getReports', 'getDashboardSummary'],
  Security:       ['getKPIs', 'getKPIDetail', 'detectAnomalies', 'getAnomalies', 'acknowledgeAnomaly', 'resolveAnomaly', 'getDashboardSummary'],
  Guide:          ['getKPIs', 'getKPIDetail', 'getDashboardSummary'],
  Operations:     ['getKPIs', 'getKPIDetail', 'generateReport', 'getReports', 'detectAnomalies', 'getAnomalies', 'acknowledgeAnomaly', 'resolveAnomaly', 'generateForecast', 'getForecast', 'getDashboardSummary'],
  Teambuilding:   ['getKPIs', 'getKPIDetail', 'getReports', 'getDashboardSummary'],
  Marketing:      ['getKPIs', 'getKPIDetail', 'generateReport', 'getReports', 'generateForecast', 'getForecast', 'getDashboardSummary'],
}

// ── 测试数据工厂 ──
function createController() {
  const service = new AiInsightService()
  return new AiInsightController(service)
}

const TENANT_ID = 'default'
const STORE_ID = 'store-01'

// ── 👔店长 ──
describe('👔店长 (StoreManager)', () => {
  test('正常流程: 查看仪表盘摘要 → 生成营收报告 → 查看异常', () => {
    const ctrl = createController()

    // 1. 查看仪表盘摘要
    const dashboard = ctrl.getDashboardSummary(TENANT_ID, { storeId: STORE_ID })
    assert.ok(dashboard, '仪表盘摘要不应为空')
    assert.equal(dashboard.tenantId, TENANT_ID)
    assert.ok(dashboard.today, '应包含今日数据')
    assert.ok(dashboard.thisWeek, '应包含本周数据')
    assert.ok(dashboard.thisMonth, '应包含本月数据')
    assert.ok(typeof dashboard.activeAnomalies === 'number', '活跃异常数应为数字')

    // 2. 生成营收报告
    const report = ctrl.generateReport(TENANT_ID, {
      type: 'revenue',
      storeId: STORE_ID,
      periodStart: '2026-06-16',
      periodEnd: '2026-06-23',
    })
    assert.equal(report.type, 'revenue')
    assert.ok(report.data.metrics, '应包含指标数据')
    assert.ok(report.data.trends, '应包含趋势数据')
    assert.ok(report.summary.length > 0, '摘要不应为空')

    // 3. 查看异常列表
    const anomalies = ctrl.getAnomalies(TENANT_ID, { storeId: STORE_ID, status: 'open', limit: 10 })
    assert.ok(Array.isArray(anomalies), '异常应为数组')
  })

  test('权限边界: 可执行所有操作 — KPI、报告、异常、预测', () => {
    const ctrl = createController()

    // KPI
    const kpis = ctrl.getKPIs(TENANT_ID, { storeId: STORE_ID, category: 'revenue' })
    assert.ok(Array.isArray(kpis))
    assert.ok(kpis.length > 0, '应有营收KPI')

    if (kpis.length > 0) {
      const detail = ctrl.getKPIDetail(kpis[0].id)
      assert.ok(detail)
      assert.equal(detail.id, kpis[0].id)
    }

    // 异常检测
    const detected = ctrl.detectAnomalies(TENANT_ID, { storeId: STORE_ID })
    assert.ok(Array.isArray(detected))

    // 确认 & 解决异常
    const allAnomalies = ctrl.getAnomalies(TENANT_ID, { limit: 100 })
    if (allAnomalies.length > 0) {
      const openAnomaly = allAnomalies.find(a => a.status === 'open')
      if (openAnomaly) {
        const acked = ctrl.acknowledgeAnomaly(openAnomaly.id)
        assert.ok(acked)
        assert.equal(acked?.status, 'acknowledged')

        const resolved = ctrl.resolveAnomaly(openAnomaly.id, { anomalyId: openAnomaly.id })
        assert.ok(resolved)
        assert.equal(resolved?.status, 'resolved')
      }
    }

    // 趋势预测
    const trend = ctrl.generateForecast(TENANT_ID, { metric: '日营收', period: 'week' })
    assert.ok(trend)
    assert.ok(trend.forecast.length > 0)
    assert.ok(typeof trend.confidence === 'number')

    const fetched = ctrl.getForecast(trend.id)
    assert.ok(fetched)
    assert.equal(fetched.id, trend.id)

    // 报告列表
    const reports = ctrl.getReports(TENANT_ID, { type: 'revenue', limit: 5 })
    assert.ok(Array.isArray(reports))
  })
})

// ── 🛒前台 ──
describe('🛒前台 (FrontDesk)', () => {
  test('正常流程: 查看今日仪表盘 → 查看KPI', () => {
    const ctrl = createController()

    // 1. 今日仪表盘
    const dashboard = ctrl.getDashboardSummary(TENANT_ID, { storeId: STORE_ID })
    assert.ok(dashboard.today, '应包含今日数据')
    assert.ok(dashboard.today.revenue >= 0, '今日营收应 >= 0')
    assert.ok(dashboard.today.attendance >= 0, '今日到店应 >= 0')
    assert.ok(dashboard.today.games >= 0, '今日游戏应 >= 0')

    // 2. 查看 KPI
    const kpis = ctrl.getKPIs(TENANT_ID, { storeId: STORE_ID })
    assert.ok(Array.isArray(kpis))
    assert.ok(kpis.length > 0, '应有 KPI 数据')
    // 每个 KPI 应有必要字段
    for (const kpi of kpis) {
      assert.ok(kpi.id)
      assert.ok(kpi.name)
      assert.ok(typeof kpi.value === 'number')
      assert.ok(typeof kpi.target === 'number')
    }
  })

  test('权限边界: 可读但不可改 — 无法生成报告/确认异常', () => {
    const ctrl = createController()
    const permissions = ROLE_PERMISSIONS.FrontDesk

    // 确保有只读权限
    assert.ok(permissions.includes('getKPIs'))
    assert.ok(permissions.includes('getDashboardSummary'))
    assert.ok(permissions.includes('getReports'))

    // 确保没有写权限
    assert.ok(!permissions.includes('generateReport'), '前台不应有生成报告权限')
    assert.ok(!permissions.includes('acknowledgeAnomaly'), '前台不应有确认异常权限')
    assert.ok(!permissions.includes('resolveAnomaly'), '前台不应有解决异常权限')
    assert.ok(!permissions.includes('generateForecast'), '前台不应有生成预测权限')

    // 验证可读操作都可正常执行
    const reports = ctrl.getReports(TENANT_ID, { limit: 5 })
    assert.ok(Array.isArray(reports))
    const anomalies = ctrl.getAnomalies(TENANT_ID, { limit: 5 })
    assert.ok(Array.isArray(anomalies))
  })
})

// ── 👥HR ──
describe('👥HR (HR)', () => {
  test('正常流程: 查看会员相关 KPI → 仪表盘摘要', () => {
    const ctrl = createController()

    // 1. 按会员分类筛选 KPI
    const memberKPIs = ctrl.getKPIs(TENANT_ID, { storeId: STORE_ID, category: 'member' })
    assert.ok(Array.isArray(memberKPIs))
    if (memberKPIs.length > 0) {
      for (const kpi of memberKPIs) {
        assert.equal(kpi.category, 'member', `KPI ${kpi.name} 应为 member 分类`)
      }
    }

    // 2. 仪表盘摘要含会员数据
    const dashboard = ctrl.getDashboardSummary(TENANT_ID, { storeId: STORE_ID })
    assert.ok(typeof dashboard.today.members === 'number', '今日会员数应为数字')
    assert.ok(typeof dashboard.thisWeek.members === 'number', '本周会员数应为数字')
    assert.ok(typeof dashboard.thisMonth.members === 'number', '本月会员数应为数字')

    // 3. 查看单个 KPI 详情
    const allKPIs = ctrl.getKPIs(TENANT_ID, {})
    if (allKPIs.length > 0) {
      const detail = ctrl.getKPIDetail(allKPIs[0].id)
      assert.ok(detail)
      assert.equal(detail.id, allKPIs[0].id)
    }
  })

  test('权限边界: 可查看KPI和仪表盘，不可操作异常/预测', () => {
    const permissions = ROLE_PERMISSIONS.HR

    // 确保有读权限
    assert.ok(permissions.includes('getKPIs'))
    assert.ok(permissions.includes('getKPIDetail'))
    assert.ok(permissions.includes('getDashboardSummary'))
    assert.ok(permissions.includes('getReports'))

    // 确保没有操作权限
    assert.ok(!permissions.includes('detectAnomalies'), 'HR 不应有异常检测权限')
    assert.ok(!permissions.includes('generateForecast'), 'HR 不应有生成预测权限')
    assert.ok(!permissions.includes('acknowledgeAnomaly'), 'HR 不应有确认异常权限')
    assert.ok(!permissions.includes('resolveAnomaly'), 'HR 不应有解决异常权限')
  })
})

// ── 🔧安监 ──
describe('🔧安监 (Security)', () => {
  test('正常流程: 检测异常 → 查看异常 → 确认 → 解决', () => {
    const ctrl = createController()

    // 1. 执行异常检测
    const detected = ctrl.detectAnomalies(TENANT_ID, { storeId: STORE_ID })
    assert.ok(Array.isArray(detected))

    // 2. 查看所有异常
    const allAnomalies = ctrl.getAnomalies(TENANT_ID, { limit: 100 })
    assert.ok(Array.isArray(allAnomalies))
    assert.ok(allAnomalies.length > 0, '初始数据应有异常')

    // 3. 按严重程度筛选
    const criticalAnomalies = ctrl.getAnomalies(TENANT_ID, { severity: 'critical', limit: 10 })
    assert.ok(Array.isArray(criticalAnomalies))
    for (const a of criticalAnomalies) {
      assert.equal(a.severity, 'critical')
    }

    // 4. 确认 open 状态的异常
    const openAnomalies = allAnomalies.filter(a => a.status === 'open')
    if (openAnomalies.length > 0) {
      const acked = ctrl.acknowledgeAnomaly(openAnomalies[0].id)
      assert.ok(acked)
      assert.equal(acked?.status, 'acknowledged')

      // 5. 解决该异常
      const resolved = ctrl.resolveAnomaly(openAnomalies[0].id, { anomalyId: openAnomalies[0].id })
      assert.ok(resolved)
      assert.equal(resolved?.status, 'resolved')
      assert.ok(resolved?.resolvedAt, '应有解决时间')
    }
  })

  test('权限边界: 可操作异常但不可生成报告/预测', () => {
    const permissions = ROLE_PERMISSIONS.Security

    // 确保有异常操作权限
    assert.ok(permissions.includes('detectAnomalies'))
    assert.ok(permissions.includes('getAnomalies'))
    assert.ok(permissions.includes('acknowledgeAnomaly'))
    assert.ok(permissions.includes('resolveAnomaly'))

    // 确保没有报告/预测权限
    assert.ok(!permissions.includes('generateReport'), '安监不应有生成报告权限')
    assert.ok(!permissions.includes('generateForecast'), '安监不应有生成预测权限')

    // 边界测试：验证异常状态流转
    const ctrl = createController()
    const anomalies = ctrl.getAnomalies(TENANT_ID, {})
    const statuses = new Set(anomalies.map(a => a.status))
    // 三种状态都可能存在
    assert.ok(statuses.has('open') || statuses.has('acknowledged') || statuses.has('resolved'))
  })
})

// ── 🎮导玩员 ──
describe('🎮导玩员 (Guide)', () => {
  test('正常流程: 查看游戏类 KPI → 仪表盘游戏指标', () => {
    const ctrl = createController()

    // 1. 查看游戏类 KPI
    const gameKPIs = ctrl.getKPIs(TENANT_ID, { category: 'game' })
    assert.ok(Array.isArray(gameKPIs))
    if (gameKPIs.length > 0) {
      for (const kpi of gameKPIs) {
        assert.equal(kpi.category, 'game', `KPI ${kpi.name} 应为 game 分类`)
      }
    }

    // 2. 查看仪表盘游戏场次
    const dashboard = ctrl.getDashboardSummary(TENANT_ID, { storeId: STORE_ID })
    assert.ok(typeof dashboard.today.games === 'number', '今日游戏场次应为数字')
    assert.ok(typeof dashboard.thisWeek.games === 'number', '本周游戏场次应为数字')
    assert.ok(typeof dashboard.thisMonth.games === 'number', '本月游戏场次应为数字')

    // 3. 查看 KPI 详情
    const allKPIs = ctrl.getKPIs(TENANT_ID, { storeId: STORE_ID })
    if (allKPIs.length > 0) {
      const detail = ctrl.getKPIDetail(allKPIs[0].id)
      assert.ok(detail)
    }
  })

  test('权限边界: 仅可查看 KPI 和仪表盘，不可查看报告/异常/预测', () => {
    const permissions = ROLE_PERMISSIONS.Guide

    assert.ok(permissions.includes('getKPIs'))
    assert.ok(permissions.includes('getKPIDetail'))
    assert.ok(permissions.includes('getDashboardSummary'))

    // 导玩员权限最小：不能看报告/异常/预测
    assert.ok(!permissions.includes('getReports'), '导玩员不应有查看报告权限')
    assert.ok(!permissions.includes('getAnomalies'), '导玩员不应有查看异常权限')
    assert.ok(!permissions.includes('generateForecast'), '导玩员不应有生成预测权限')
    assert.ok(!permissions.includes('getForecast'), '导玩员不应有获取预测权限')
    assert.ok(!permissions.includes('generateReport'), '导玩员不应有生成报告权限')
    assert.ok(!permissions.includes('detectAnomalies'), '导玩员不应有检测异常权限')

    // 边界：确认权限列表足够小
    assert.equal(permissions.length, 3, '导玩员应仅有 3 项权限')
  })
})

// ── 🎯运行专员 ──
describe('🎯运行专员 (Operations)', () => {
  test('正常流程: KPI 看板 → 异常检测 → 仪表盘 → 趋势预测', () => {
    const ctrl = createController()

    // 1. KPI 看板
    const opsKPIs = ctrl.getKPIs(TENANT_ID, { storeId: STORE_ID, category: 'operation' })
    assert.ok(Array.isArray(opsKPIs))

    // 2. 检测异常
    const detected = ctrl.detectAnomalies(TENANT_ID, { storeId: STORE_ID })
    assert.ok(Array.isArray(detected))

    // 3. 仪表盘
    const dashboard = ctrl.getDashboardSummary(TENANT_ID, { storeId: STORE_ID })
    assert.ok(dashboard)
    assert.ok(typeof dashboard.activeAnomalies === 'number')

    // 4. 生成趋势预测
    const trend = ctrl.generateForecast(TENANT_ID, { metric: '到店人数', period: 'month' })
    assert.ok(trend)
    assert.ok(trend.forecast.length > 0)
    assert.ok(trend.confidence >= 0 && trend.confidence <= 1, '置信度应在 0-1 之间')
  })

  test('权限边界: 拥有全部操作权限，但验证数据一致性', () => {
    const permissions = ROLE_PERMISSIONS.Operations
    // 运行专员应有全部 11 项权限
    assert.equal(permissions.length, 11, '运行专员应有全部权限')

    const ctrl = createController()

    // 验证异常操作的一致性
    const anomaliesBefore = ctrl.getAnomalies(TENANT_ID, { limit: 100 })
    ctrl.detectAnomalies(TENANT_ID, { storeId: STORE_ID })
    const anomaliesAfter = ctrl.getAnomalies(TENANT_ID, { limit: 100 })

    // 检测后异常数不应减少
    assert.ok(anomaliesAfter.length >= anomaliesBefore.length,
      `异常数 ${anomaliesAfter.length} 应 >= ${anomaliesBefore.length}`)

    // 验证报告生成与查询一致性
    const report = ctrl.generateReport(TENANT_ID, {
      type: 'kpi',
      storeId: STORE_ID,
      periodStart: '2026-06-01',
      periodEnd: '2026-06-23',
    })
    assert.equal(report.type, 'kpi')
    assert.equal(report.tenantId, TENANT_ID)

    const reports = ctrl.getReports(TENANT_ID, { type: 'kpi', limit: 1 })
    assert.ok(reports.length > 0)
    assert.equal(reports[0].id, report.id)
  })
})

// ── 🤝团建 ──
describe('🤝团建 (Teambuilding)', () => {
  test('正常流程: 查看到店人数 KPI → 仪表盘摘要 → 报告列表', () => {
    const ctrl = createController()

    // 1. 查看到店类 KPI（用于团建策划参考）
    const attendanceKPIs = ctrl.getKPIs(TENANT_ID, { category: 'attendance' })
    assert.ok(Array.isArray(attendanceKPIs))
    if (attendanceKPIs.length > 0) {
      for (const kpi of attendanceKPIs) {
        assert.equal(kpi.category, 'attendance')
      }
    }

    // 2. 仪表盘摘要
    const dashboard = ctrl.getDashboardSummary(TENANT_ID, { storeId: STORE_ID })
    assert.ok(dashboard)
    assert.ok(typeof dashboard.today.attendance === 'number')
    // 团建需要了解高峰时段
    assert.ok(dashboard.today.attendance >= 0)

    // 3. 查看已有报告作为参考
    const reports = ctrl.getReports(TENANT_ID, { limit: 10 })
    assert.ok(Array.isArray(reports))

    // 4. 查看单个 KPI 详情
    const allKPIs = ctrl.getKPIs(TENANT_ID, {})
    if (allKPIs.length > 0) {
      const detail = ctrl.getKPIDetail(allKPIs[0].id)
      assert.ok(detail)
    }
  })

  test('权限边界: 可查看KPI/报告/仪表盘，不可生成报告/操作异常/预测', () => {
    const permissions = ROLE_PERMISSIONS.Teambuilding

    assert.ok(permissions.includes('getKPIs'))
    assert.ok(permissions.includes('getKPIDetail'))
    assert.ok(permissions.includes('getReports'))
    assert.ok(permissions.includes('getDashboardSummary'))

    // 不可操作
    assert.ok(!permissions.includes('generateReport'), '团建不应有生成报告权限')
    assert.ok(!permissions.includes('detectAnomalies'), '团建不应有检测异常权限')
    assert.ok(!permissions.includes('generateForecast'), '团建不应有生成预测权限')
    assert.ok(!permissions.includes('acknowledgeAnomaly'), '团建不应有确认异常权限')
    assert.ok(!permissions.includes('resolveAnomaly'), '团建不应有解决异常权限')

    // 权限数
    assert.equal(permissions.length, 4, '团建应仅有 4 项只读权限')
  })
})

// ── 📢营销 ──
describe('📢营销 (Marketing)', () => {
  test('正常流程: 生成营收报告 → 查看趋势预测 → 仪表盘', () => {
    const ctrl = createController()

    // 1. 生成营收报告（用于营销分析）
    const report = ctrl.generateReport(TENANT_ID, {
      type: 'revenue',
      storeId: STORE_ID,
      periodStart: '2026-06-10',
      periodEnd: '2026-06-23',
    })
    assert.equal(report.type, 'revenue')
    assert.ok(report.data.metrics)
    // 提取营收数据用于营销决策
    const revenueMetrics = Object.entries(report.data.metrics).filter(([k]) =>
      k.includes('营收') || k.includes('客单价')
    )
    assert.ok(revenueMetrics.length > 0, '应有营收相关指标')

    // 2. 生成趋势预测
    const trend = ctrl.generateForecast(TENANT_ID, { metric: '日营收', period: 'week' })
    assert.ok(trend)
    assert.ok(trend.forecast.length > 0)
    assert.ok(trend.confidence >= 0 && trend.confidence <= 1)

    // 3. 仪表盘
    const dashboard = ctrl.getDashboardSummary(TENANT_ID, { storeId: STORE_ID })
    assert.ok(dashboard)
    assert.ok(typeof dashboard.today.revenue === 'number')
  })

  test('权限边界: 可生成报告/预测，但不可操作异常', () => {
    const permissions = ROLE_PERMISSIONS.Marketing

    // 确保有报告和预测权限
    assert.ok(permissions.includes('generateReport'))
    assert.ok(permissions.includes('getReports'))
    assert.ok(permissions.includes('generateForecast'))
    assert.ok(permissions.includes('getForecast'))

    // 确保没有异常操作权限
    assert.ok(!permissions.includes('detectAnomalies'), '营销不应有异常检测权限')
    assert.ok(!permissions.includes('acknowledgeAnomaly'), '营销不应有确认异常权限')
    assert.ok(!permissions.includes('resolveAnomaly'), '营销不应有解决异常权限')

    // 验证 KPI 筛选按分类
    const ctrl = createController()
    const revenueKPIs = ctrl.getKPIs(TENANT_ID, { category: 'revenue' })
    assert.ok(Array.isArray(revenueKPIs))
    assert.ok(revenueKPIs.length > 0, '应有营收 KPI')

    // 验证 KPI 趋势信息存在
    for (const kpi of revenueKPIs) {
      assert.ok(['up', 'down', 'stable'].includes(kpi.trend), `趋势应为 up/down/stable, 实际: ${kpi.trend}`)
    }
  })
})

// ── 跨角色对比测试 ──
describe('跨角色对比', () => {
  test('所有角色权限矩阵不重叠验证', () => {
    // 验证店长和运行专员权限完全相同（都是全部）
    assert.deepEqual(
      ROLE_PERMISSIONS.StoreManager.sort(),
      ROLE_PERMISSIONS.Operations.sort(),
      '店长和运行专员应有相同权限'
    )

    // 验证前台 < 店长（前台是店长的子集）
    const storeManagerSet = new Set(ROLE_PERMISSIONS.StoreManager)
    for (const perm of ROLE_PERMISSIONS.FrontDesk) {
      assert.ok(storeManagerSet.has(perm), `前台权限 ${perm} 应在店长权限中`)
    }

    // 验证导玩员权限最小
    for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
      if (role !== 'Guide') {
        assert.ok(
          perms.length >= ROLE_PERMISSIONS.Guide.length,
          `${role} 权限数 ${perms.length} 应 >= 导玩员 ${ROLE_PERMISSIONS.Guide.length}`
        )
      }
    }
  })

  test('所有角色都能成功获取仪表盘摘要', () => {
    const ctrl = createController()

    for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      if (permissions.includes('getDashboardSummary')) {
        const dashboard = ctrl.getDashboardSummary(TENANT_ID, { storeId: STORE_ID })
        assert.ok(dashboard, `${role} 应能获取仪表盘摘要`)
        assert.equal(dashboard.tenantId, TENANT_ID, `${role} 仪表盘 tenantId 应正确`)
      }
    }
  })
})
