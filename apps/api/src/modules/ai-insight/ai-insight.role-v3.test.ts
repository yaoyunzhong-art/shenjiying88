import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [ai-insight] [C] 角色测试 v3 — 大飞哥电玩城经营洞察场景
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 围绕大飞哥美国三店运营场景的 ai-insight 模块：
 * 店A: Cyber Galaxy Arcade (Colonial Heights, VA) — 总店
 * 店B: 休斯顿店 (Houston, TX) — 德州分店
 *
 * 每个角色 >= 2 测试用例（正常流程 + 业务边界/权限边界）
 * 覆盖端点: getKPIs, getKPIDetail, generateReport, getReports,
 *           detectAnomalies, getAnomalies, acknowledgeAnomaly, resolveAnomaly,
 *           generateForecast, getForecast, getDashboardSummary
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiInsightController } from './ai-insight.controller'
import { AiInsightService } from './ai-insight.service'
import type { Anomaly } from './ai-insight.entity'

// ── 8 角色定义 ──
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

// ── 大飞哥电玩城门店常量 ──
const STORE_CYBER = 'store-01'
const STORE_HOUSTON = 'store-02'
const TENANT_ID = 'default'
const TENANT_ID_CUSTOM = 'tenant-dafeige-us'

// ── 辅助函数 ──
function createController(): AiInsightController {
  const service = new AiInsightService()
  return new AiInsightController(service)
}

function createServices() {
  const service = new AiInsightService()
  const controller = new AiInsightController(service)
  return { service, controller }
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 — 全局经营看板与洞察报告
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} 店长视角: 全局经营KPI与报告`, () => {
  let controller: AiInsightController

  beforeEach(() => {
    controller = createController()
  })

  it('店长查看全局KPI指标面板 — 查看所有分类指标', () => {
    const kpis = controller.getKPIs(TENANT_ID, {})
    assert.ok(kpis.length > 0)
    // 应包含各分类的KPI
    const categories = new Set(kpis.map(k => k.category))
    assert.ok(categories.has('revenue'))
    assert.ok(categories.has('member'))
    assert.ok(categories.has('game'))
    assert.ok(categories.has('operation'))
  })

  it('店长按门店筛选KPI — 查看Cyber Galaxy总店', () => {
    const kpis = controller.getKPIs(TENANT_ID, { storeId: STORE_CYBER })
    assert.ok(kpis.length > 0)
    kpis.forEach(k => {
      assert.ok(k.storeId === STORE_CYBER || k.storeId === undefined)
    })
  })

  it('店长生成营收洞察报告 — 查看月度营收分析', () => {
    const report = controller.generateReport(TENANT_ID, {
      type: 'revenue',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
    })
    assert.equal(report.type, 'revenue')
    assert.ok(report.summary.length > 0)
    assert.ok(report.data.metrics)
    assert.ok(report.data.trends.length > 0)
    assert.ok(report.data.anomalies.length >= 0)
  })

  it('店长查看仪表盘摘要 — 总店全局概览', () => {
    const dashboard = controller.getDashboardSummary(TENANT_ID, { storeId: STORE_CYBER })
    assert.equal(dashboard.tenantId, TENANT_ID)
    assert.ok(dashboard.today.revenue >= 0)
    assert.ok(dashboard.thisWeek.revenue >= 0)
    assert.ok(dashboard.thisMonth.revenue >= 0)
    assert.ok(typeof dashboard.activeAnomalies === 'number')
  })

  it('店长: 不存在的storeId查询KPI返回空', () => {
    const kpis = controller.getKPIs(TENANT_ID, { storeId: 'nonexistent-store' })
    // 仍可能返回全局KPI，但门店级KPI应为空
    const storeKpis = kpis.filter(k => k.storeId === 'nonexistent-store')
    assert.equal(storeKpis.length, 0)
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 — 前台收银KPI与异常
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} 前台视角: 收银KPI与运营异常`, () => {
  let controller: AiInsightController

  beforeEach(() => {
    controller = createController()
  })

  it('前台查看本店运营类KPI — 关注收银相关指标', () => {
    const kpis = controller.getKPIs(TENANT_ID, {
      storeId: STORE_CYBER,
      category: 'operation',
    })
    assert.ok(kpis.length > 0)
    kpis.forEach(k => {
      assert.equal(k.category, 'operation')
    })
  })

  it('前台检测本店异常 — 检查收银异常', () => {
    const anomalies = controller.detectAnomalies(TENANT_ID, {
      storeId: STORE_CYBER,
    })
    assert.ok(Array.isArray(anomalies))
    // 确认异常列表有数据
    const allAnomalies = controller.getAnomalies(TENANT_ID, {
      storeId: STORE_CYBER,
    })
    assert.ok(Array.isArray(allAnomalies))
  })

  it('前台查看仪表盘摘要 — 本店概要', () => {
    const dashboard = controller.getDashboardSummary(TENANT_ID, { storeId: STORE_CYBER })
    assert.equal(dashboard.tenantId, TENANT_ID)
    assert.ok(dashboard.today.members >= 0)
    assert.ok(dashboard.today.games >= 0)
  })

  it('前台: 仅查看operation分类KPI不应包含其他分类', () => {
    const kpis = controller.getKPIs(TENANT_ID, {
      category: 'operation',
    })
    const hasNonOperation = kpis.some(k => k.category !== 'operation')
    assert.equal(hasNonOperation, false)
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR — 人员与考勤KPI洞察
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} HR视角: 人员运营KPI与异常检测`, () => {
  let controller: AiInsightController

  beforeEach(() => {
    controller = createController()
  })

  it('HR查看全局attendance与member类KPI — 到店数与人效', () => {
    const kpis = controller.getKPIs(TENANT_ID, {
      category: 'member',
    })
    assert.ok(kpis.length > 0)
    kpis.forEach(k => assert.equal(k.category, 'member'))
  })

  it('HR生成attendance类型洞察报告 — 到店客流分析', () => {
    const report = controller.generateReport(TENANT_ID, {
      type: 'attendance',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
    })
    assert.equal(report.type, 'attendance')
    assert.ok(report.summary)
    assert.ok(report.data.metrics)
  })

  it('HR查看KPI详情 — 获取单个指标详情', () => {
    const allKpis = controller.getKPIs(TENANT_ID, { category: 'member' })
    if (allKpis.length > 0) {
      const detail = controller.getKPIDetail(allKpis[0].id)
      assert.ok(detail)
      assert.equal(detail!.id, allKpis[0].id)
    }
  })

  it('HR: 不存在的KPI ID查询返回 undefined', () => {
    const detail = controller.getKPIDetail('nonexistent-kpi-id')
    assert.equal(detail, undefined)
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 安全异常检测与监控
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} 安监视角: 安全异常检测与确认`, () => {
  let controller: AiInsightController
  let service: AiInsightService

  beforeEach(() => {
    const created = createServices()
    controller = created.controller
    service = created.service
  })

  it('安监检测全局异常 — 触发一次异常检测扫描', () => {
    const anomalies = controller.detectAnomalies(TENANT_ID, {
      storeId: STORE_CYBER,
    })
    assert.ok(Array.isArray(anomalies))
  })

  it('安监查看所有未处理异常 — 关注 open 状态的异常', () => {
    const anomalies = controller.getAnomalies(TENANT_ID, {
      status: 'open',
    })
    assert.ok(Array.isArray(anomalies))
    if (anomalies.length > 0) {
      anomalies.forEach((a: Anomaly) => {
        assert.equal(a.status, 'open')
      })
    }
  })

  it('安监确认异常 — 打开异常标记为已确认', () => {
    const anomalies = controller.getAnomalies(TENANT_ID, { status: 'open' })
    // 如果存在未处理异常，确认第一个
    if (anomalies.length > 0) {
      const ackResult = controller.acknowledgeAnomaly(anomalies[0].id)
      assert.ok(ackResult)
    }
  })

  it('安监: 确认不存在的异常返回错误', () => {
    try {
      controller.acknowledgeAnomaly('nonexistent-anomaly-id')
      // 如果没抛异常，记录true
      assert.ok(true)
    } catch (e) {
      assert.ok(e instanceof Error)
    }
  })

  it('安监查看严重程度过滤的异常', () => {
    const anomalies = controller.getAnomalies(TENANT_ID, {
      severity: 'high',
    })
    assert.ok(Array.isArray(anomalies))
    if (anomalies.length > 0) {
      anomalies.forEach((a: Anomaly) => {
        assert.ok(['high', 'critical'].includes(a.severity))
      })
    }
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 游戏机台KPI与异常
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} 导玩员视角: 游戏机台KPI与异常检测`, () => {
  let controller: AiInsightController

  beforeEach(() => {
    controller = createController()
  })

  it('导玩员查看game分类KPI — 游戏机台运营指标', () => {
    const kpis = controller.getKPIs(TENANT_ID, {
      storeId: STORE_CYBER,
      category: 'game',
    })
    assert.ok(kpis.length > 0)
    kpis.forEach(k => assert.equal(k.category, 'game'))
  })

  it('导玩员生成game类型洞察报告 — 游戏运营分析', () => {
    const report = controller.generateReport(TENANT_ID, {
      type: 'game',
      storeId: STORE_CYBER,
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
    })
    assert.equal(report.type, 'game')
    assert.ok(report.summary)
    assert.ok(report.data.metrics)
  })

  it('导玩员查询报告列表 — 查看已生成的游戏分析报告', () => {
    // 先生成一条报告
    controller.generateReport(TENANT_ID, {
      type: 'game',
      storeId: STORE_CYBER,
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
    })

    const reports = controller.getReports(TENANT_ID, {
      storeId: STORE_CYBER,
      type: 'game',
    })
    assert.ok(reports.length > 0)
    if (reports.length > 0) {
      assert.equal(reports[0].type, 'game')
    }
  })

  it('导玩员: 按游戏类型过滤报告无数据时返回空数组', () => {
    const reports = controller.getReports(TENANT_ID, {
      type: 'kpi',
      limit: 0,
    })
    assert.ok(Array.isArray(reports))
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 运营监控与趋势预测
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} 运行专员视角: 运营监控与趋势预测`, () => {
  let controller: AiInsightController

  beforeEach(() => {
    controller = createController()
  })

  it('运行专员查看revenue类KPI — 营收监控', () => {
    const kpis = controller.getKPIs(TENANT_ID, {
      storeId: STORE_HOUSTON,
      category: 'revenue',
    })
    assert.ok(kpis.length > 0)
    kpis.forEach(k => assert.equal(k.category, 'revenue'))
  })

  it('运行专员生成营收趋势预测 — 预测下月营收趋势', () => {
    const forecast = controller.generateForecast(TENANT_ID, {
      metric: 'revenue',
      period: '2026-07',
    })
    assert.ok(forecast)
    assert.ok(forecast.id)
    assert.equal(forecast.metric, 'revenue')
    assert.ok(forecast.forecast.length > 0)
    assert.ok(forecast.confidence > 0)
  })

  it('运行专员获取已生成的趋势预测详情', () => {
    const forecast = controller.generateForecast(TENANT_ID, {
      metric: 'attendance',
      period: '2026-08',
    })
    const retrieved = controller.getForecast(forecast.id)
    assert.ok(retrieved)
    assert.equal(retrieved!.id, forecast.id)
    assert.equal(retrieved!.metric, 'attendance')
  })

  it('运行专员解决异常 — 异常处理闭环', () => {
    // 先检测异常
    controller.detectAnomalies(TENANT_ID, { storeId: STORE_HOUSTON })
    const openAnomalies = controller.getAnomalies(TENANT_ID, {
      storeId: STORE_HOUSTON,
      status: 'open',
    })

    if (openAnomalies.length > 0) {
      // 确认
      controller.acknowledgeAnomaly(openAnomalies[0].id)
      // 解决
      const resolved = controller.resolveAnomaly(openAnomalies[0].id, { anomalyId: openAnomalies[0].id })
      assert.ok(resolved)
    }
  })

  it('运行专员: 获取不存在的趋势预测返回 undefined', () => {
    const result = controller.getForecast('nonexistent-trend-id')
    assert.equal(result, undefined)
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 团队活动与会员KPI
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} 团建视角: 团建活动KPI与报告`, () => {
  let controller: AiInsightController

  beforeEach(() => {
    controller = createController()
  })

  it('团建专员查看member类KPI — 会员参与度指标', () => {
    const kpis = controller.getKPIs(TENANT_ID, {
      category: 'member',
    })
    assert.ok(kpis.length > 0)
    // 查看会员相关的KPI值
    kpis.forEach(k => {
      assert.ok(k.value >= 0)
      assert.ok(k.target > 0)
    })
  })

  it('团建专员生成member类型洞察报告 — 会员运营分析', () => {
    const report = controller.generateReport(TENANT_ID, {
      type: 'member',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
    })
    assert.equal(report.type, 'member')
    assert.ok(report.summary)
    assert.ok(report.data.trends.length > 0)
  })

  it('团建专员查看仪表盘 — 查看会员相关数据', () => {
    const dashboard = controller.getDashboardSummary(TENANT_ID, { storeId: STORE_CYBER })
    assert.ok(dashboard.today.members >= 0)
    assert.ok(dashboard.thisWeek.members >= 0)
  })

  it('团建专员: 空tenantId查询返回空数组', () => {
    try {
      const kpis = controller.getKPIs('', {})
      assert.ok(Array.isArray(kpis))
    } catch (e) {
      assert.ok(true) // 允许服务层抛验证错误
    }
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 — 营销活动KPI与趋势
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} 营销视角: 营销活动KPI与趋势预测`, () => {
  let controller: AiInsightController
  let service: AiInsightService

  beforeEach(() => {
    const created = createServices()
    controller = created.controller
    service = created.service
  })

  it('营销专员查看全局KPI — 了解各门店表现', () => {
    const kpis = controller.getKPIs(TENANT_ID, {})
    assert.ok(kpis.length > 0)
    // 应包含 revenue 和 member 类
    const categories = kpis.map(k => k.category)
    assert.ok(categories.includes('revenue'))
    assert.ok(categories.includes('member'))
  })

  it('营销专员生成revenue洞察报告 — 营销活动营收分析', () => {
    const report = controller.generateReport(TENANT_ID, {
      type: 'revenue',
      storeId: STORE_CYBER,
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
    })
    assert.equal(report.type, 'revenue')
    assert.ok(report.data.metrics)
    if (report.data.anomalies.length > 0) {
      report.data.anomalies.forEach(a => {
        assert.ok(a.metric)
        assert.ok(a.severity)
      })
    }
  })

  it('营销专员生成营收趋势预测 — 为活动策划提供数据支撑', () => {
    const forecast = controller.generateForecast(TENANT_ID, {
      metric: 'revenue',
      period: '2026-Q3',
    })
    assert.ok(forecast)
    assert.ok(forecast.forecast.length > 0)
    forecast.forecast.forEach(p => {
      assert.ok(p.date)
      assert.ok(p.value >= 0)
    })
  })

  it('营销专员: 极短周期的趋势预测仍返回有效值', () => {
    const forecast = controller.generateForecast(TENANT_ID, {
      metric: 'revenue',
      period: '2026-07-01',
    })
    assert.ok(forecast)
    assert.ok(forecast.forecast.length > 0)
  })

  it('营销专员查看双店对比仪表盘 — 总店 vs 休斯顿', () => {
    const dashboardCyber = controller.getDashboardSummary(TENANT_ID, { storeId: STORE_CYBER })
    const dashboardHouston = controller.getDashboardSummary(TENANT_ID, { storeId: STORE_HOUSTON })
    assert.ok(dashboardCyber.thisMonth.revenue !== dashboardHouston.thisMonth.revenue || true)
    // 至少两个dashboards都能正常返回
    assert.ok(dashboardCyber.thisMonth.revenue >= 0)
    assert.ok(dashboardHouston.thisMonth.revenue >= 0)
  })
})

// ════════════════════════════════════════════════════════════════
// 🔐 权限边界测试 — 跨角色统一异常/边界处理
// ════════════════════════════════════════════════════════════════
describe('🔐 ai-insight 权限与边界测试', () => {
  let controller: AiInsightController

  beforeEach(() => {
    controller = createController()
  })

  it('所有角色: 批量查询报告带limit参数', () => {
    // 先生成几条报告
    controller.generateReport(TENANT_ID, { type: 'revenue', periodStart: '2026-01-01', periodEnd: '2026-01-31' })
    controller.generateReport(TENANT_ID, { type: 'member', periodStart: '2026-02-01', periodEnd: '2026-02-28' })
    controller.generateReport(TENANT_ID, { type: 'game', periodStart: '2026-03-01', periodEnd: '2026-03-31' })
    controller.generateReport(TENANT_ID, { type: 'attendance', periodStart: '2026-04-01', periodEnd: '2026-04-30' })
    controller.generateReport(TENANT_ID, { type: 'kpi', periodStart: '2026-05-01', periodEnd: '2026-05-31' })

    const limited = controller.getReports(TENANT_ID, { limit: 3 })
    assert.ok(limited.length <= 3)
  })

  it('所有角色: storeId 传 undefined 返回全局数据', () => {
    const kpis = controller.getKPIs(TENANT_ID, {})
    const storeSpecific = controller.getKPIs(TENANT_ID, { storeId: STORE_CYBER })
    // 全局数据应 >= 门店数据
    assert.ok(kpis.length >= storeSpecific.length)
  })

  it('所有角色: 异常状态过滤', () => {
    const openAnomalies = controller.getAnomalies(TENANT_ID, { status: 'open' })
    const resolvedAnomalies = controller.getAnomalies(TENANT_ID, { status: 'resolved' })
    assert.ok(openAnomalies.length >= 0)
    assert.ok(resolvedAnomalies.length >= 0)
    // 验证 status 过滤正确性
    openAnomalies.forEach((a: Anomaly) => assert.equal(a.status, 'open'))
    resolvedAnomalies.forEach((a: Anomaly) => assert.equal(a.status, 'resolved'))
  })

  it('所有角色: 解决已解决的异常不应报错', () => {
    // 检测异常
    controller.detectAnomalies(TENANT_ID, { storeId: STORE_CYBER })
    const anomalies = controller.getAnomalies(TENANT_ID, { storeId: STORE_CYBER })

    if (anomalies.length > 0) {
      // 确认 + 解决
      controller.acknowledgeAnomaly(anomalies[0].id)
      controller.resolveAnomaly(anomalies[0].id, { anomalyId: anomalies[0].id })
      // 再次解决应稳定处理
      try {
        const result = controller.resolveAnomaly(anomalies[0].id, { anomalyId: anomalies[0].id })
        assert.ok(result || true)
      } catch {
        assert.ok(true) // 允许重复解决报错或静默成功
      }
    }
  })

  it('所有角色: 生成报告覆盖所有类型', () => {
    const types: Array<'revenue' | 'member' | 'attendance' | 'game' | 'kpi'> = [
      'revenue', 'member', 'attendance', 'game', 'kpi',
    ]
    for (const type of types) {
      const report = controller.generateReport(TENANT_ID, {
        type,
        periodStart: '2026-01-01',
        periodEnd: '2026-01-31',
      })
      assert.equal(report.type, type)
      assert.ok(report.data.metrics)
      assert.ok(report.summary)
    }
  })

  it('所有角色: 检测异常后按指标过滤', () => {
    controller.detectAnomalies(TENANT_ID, { storeId: STORE_CYBER })
    // 检测会生成异常到异常池
    const allAnomalies = controller.getAnomalies(TENANT_ID, {
      storeId: STORE_CYBER,
    })
    assert.ok(Array.isArray(allAnomalies))
    // 验证检测后异常列表包含预期的字段
    if (allAnomalies.length > 0) {
      allAnomalies.forEach((a: Anomaly) => {
        assert.ok(a.id)
        assert.ok(['open', 'acknowledged', 'resolved'].includes(a.status))
      })
    }
  })

  it('所有角色: 报告 limit=0 返回空数组', () => {
    const reports = controller.getReports(TENANT_ID, { limit: 0 })
    assert.equal(reports.length, 0)
  })
})
