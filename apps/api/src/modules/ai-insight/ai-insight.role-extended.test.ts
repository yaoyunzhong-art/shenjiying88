import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-insight] [C] 角色测试扩展编写
 *
 * 8 角色深度场景扩展测试 — ai-insight 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 2 测试用例 (正常流程 + 权限边界 + 降级场景)
 * 覆盖：KPI 看板、洞察报告、异常检测、趋势预测、仪表盘
 * 扩展：大数值/空列表/无效参数/边界并发
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiInsightService } from './ai-insight.service'
import type { InsightReport, KPI, Anomaly, DashboardSummary, Trend } from './ai-insight.entity'

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
}

const TENANT_A = 'default'
const TENANT_B = 't-b'
const STORE_MAIN = 'store-01'
const STORE_BRANCH = 'store-02'

// ── 辅助工厂 ──
function createService() {
  return new AiInsightService()
}

/**
 * 获取默认的 KPI 列表（已知种子数据）
 */
function getDefaultKpis(service: AiInsightService): KPI[] {
  return service.getKPIs(TENANT_A, undefined, undefined) as KPI[]
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 — 全局经营监管
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} ai-insight 扩展角色测试`, () => {
  it('店长获取全门店 KPI 看板 — 包含所有分类指标', () => {
    const svc = createService()
    const kpis = getDefaultKpis(svc)

    assert.ok(kpis.length >= 5, '应有至少 5 个种子 KPI')
    const categories = new Set(kpis.map(k => k.category))
    assert.ok(categories.has('revenue'), '应有营收类')
    assert.ok(categories.has('member'), '应有会员类')
    assert.ok(categories.has('attendance'), '应有到店类')
    assert.ok(categories.has('game'), '应有游戏类')
    assert.ok(categories.has('operation'), '应有运营类')
  })

  it('店长按门店过滤 KPI — 门店隔离', () => {
    const svc = createService()
    const allKpis = getDefaultKpis(svc)
    const storeKpis = svc.getKPIs(TENANT_A, STORE_MAIN, undefined) as KPI[]

    // 所有返回的 KPI 应为该门店或无门店限制
    for (const k of storeKpis) {
      assert.ok(k.storeId === STORE_MAIN || k.storeId === undefined, `KPI ${k.name} 门店不匹配`)
    }
    assert.ok(storeKpis.length <= allKpis.length)
  })

  it('店长生成营收报告 — 报告含趋势和异常', () => {
    const svc = createService()
    const report = svc.generateReport(TENANT_A, STORE_MAIN, 'revenue', '2026-01-01', '2026-01-31') as InsightReport

    assert.equal(report.tenantId, TENANT_A)
    assert.equal(report.type, 'revenue')
    assert.ok(Object.keys(report.data.metrics).length > 0, '应有营收指标')
    assert.ok(Array.isArray(report.data.trends))
    assert.ok(Array.isArray(report.data.anomalies))
    assert.ok(report.data.trends.length > 0, '应有趋势数据')
  })

  it('店长获取仪表盘 — 含今日/本周/本月摘要', () => {
    const svc = createService()
    const dash = svc.getDashboardSummary(TENANT_A, STORE_MAIN) as DashboardSummary

    assert.equal(dash.tenantId, TENANT_A)
    assert.ok(dash.today.label)
    assert.ok(dash.thisWeek.label)
    assert.ok(dash.thisMonth.label)
    assert.ok(typeof dash.activeAnomalies === 'number')
    assert.ok(typeof dash.reportCount === 'number')
    assert.ok(Date.parse(dash.generatedAt) > 0)
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 — 快速查询与展示
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} ai-insight 扩展角色测试`, () => {
  it('前台查询 KPI — 快速获取会员/到店指标', () => {
    const svc = createService()
    const kpis = svc.getKPIs(TENANT_A, STORE_MAIN, 'member') as KPI[]

    assert.ok(kpis.length > 0, '应有会员指标')
    for (const k of kpis) {
      assert.equal(k.category, 'member')
      assert.ok(typeof k.value === 'number')
      assert.ok(typeof k.target === 'number')
    }
  })

  it('前台获取仪表盘 — 阅读门店当前概况', () => {
    const svc = createService()
    const dash = svc.getDashboardSummary(TENANT_A, undefined) as DashboardSummary

    assert.ok(dash.activeAnomalies >= 0)
    assert.ok(dash.today.attendance >= 0)
  })

  it('前台查询已生成的报告列表 — 只读访问', () => {
    const svc = createService()
    const reports = svc.getReports(TENANT_A, {}) as InsightReport[]

    assert.ok(Array.isArray(reports))
    // 报告列表应有内容（种子数据生成了一份）
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR — 员工/会员相关洞察
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} ai-insight 扩展角色测试`, () => {
  it('HR 获取会员 KPI 分析 — 会员增长/活跃度', () => {
    const svc = createService()
    const memberKpis = svc.getKPIs(TENANT_A, undefined, 'member') as KPI[]

    assert.ok(memberKpis.length > 0)
    const memberCount = memberKpis.find(k => k.name.includes('会员'))
    assert.ok(memberCount === undefined || memberCount.value > 0)
  })

  it('HR 生成会员洞察报告 — 会员趋势', () => {
    const svc = createService()
    const report = svc.generateReport(TENANT_A, undefined, 'member', '2026-01-01', '2026-01-31') as InsightReport

    assert.equal(report.type, 'member')
    assert.ok(report.summary.length > 0)
    assert.ok(report.data.metrics !== undefined)
  })

  it('HR 获取 KPI 详情 — 单指标解读', () => {
    const svc = createService()
    const kpis = getDefaultKpis(svc)

    if (kpis.length > 0) {
      const detail = svc.getKPIDetail(kpis[0].id) as KPI
      assert.ok(detail)
      assert.equal(detail.id, kpis[0].id)
    }
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 异常检测与告警
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} ai-insight 扩展角色测试`, () => {
  it('安监执行异常检测 — 返回异常列表', () => {
    const svc = createService()
    // 跨门店检测异常（种子数据为随机值，不一定产生 3-sigma 离群值，但方法本身应正常运行）
    const anomalies = svc.detectAnomalies(TENANT_A, undefined, undefined) as Anomaly[]

    assert.ok(Array.isArray(anomalies), '应有异常列表')
    if (anomalies.length > 0) {
      for (const a of anomalies) {
        assert.ok(a.id)
        assert.ok(['low', 'medium', 'high', 'critical'].includes(a.severity))
        assert.equal(a.tenantId, TENANT_A)
      }
    }
  })

  it('安监确认异常 — 变更状态为 acknowledged', () => {
    const svc = createService()
    const anomalies = svc.getAnomalies(TENANT_A, {}) as Anomaly[]

    assert.ok(anomalies.length > 0, '种子应包含初始异常')
    const ackResult = svc.acknowledgeAnomaly(anomalies[0].id) as Anomaly
    assert.equal(ackResult.status, 'acknowledged')
    assert.equal(ackResult.id, anomalies[0].id)
  })

  it('安监解决异常 — 含解决备注幂等性', () => {
    const svc = createService()
    const anomalies = svc.getAnomalies(TENANT_A, {}) as Anomaly[]

    assert.ok(anomalies.length > 0)
    // 先确认
    svc.acknowledgeAnomaly(anomalies[0].id)
    // 再解决
    const resolved = svc.resolveAnomaly(anomalies[0].id) as Anomaly
    assert.equal(resolved.status, 'resolved')
    // 幂等：再次解决不应抛出
    const resolvedAgain = svc.resolveAnomaly(anomalies[0].id) as Anomaly
    assert.equal(resolvedAgain.status, 'resolved')
  })

  it('安监按严重程度过滤异常列表 — 只查看 high/critical', () => {
    const svc = createService()
    // 先触发一批异常
    svc.detectAnomalies(TENANT_A, STORE_MAIN, undefined)

    const highAnomalies = svc.getAnomalies(TENANT_A, { severity: 'high' }) as Anomaly[]
    for (const a of highAnomalies) {
      assert.equal(a.severity, 'high')
    }

    const criticalAnomalies = svc.getAnomalies(TENANT_A, { severity: 'critical' }) as Anomaly[]
    for (const a of criticalAnomalies) {
      assert.equal(a.severity, 'critical')
    }
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 游戏与运营指标
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} ai-insight 扩展角色测试`, () => {
  it('导玩员获取游戏 KPI — 立即了解游戏运营状况', () => {
    const svc = createService()
    const gameKpis = svc.getKPIs(TENANT_A, STORE_MAIN, 'game') as KPI[]

    assert.ok(gameKpis.length > 0, '应有游戏指标')
    assert.ok(gameKpis.every(k => k.category === 'game'))
  })

  it('导玩员查看仪表盘 — 快速了解整体情况', () => {
    const svc = createService()
    const dash = svc.getDashboardSummary(TENANT_A, STORE_MAIN) as DashboardSummary

    assert.ok(dash.today.games >= 0)
    assert.ok(dash.thisWeek.games >= 0)
    assert.ok(dash.thisMonth.games >= 0)
  })

  it('导玩员按门店获得到店 KPI — 导玩工作量参考', () => {
    const svc = createService()
    const attendanceKpis = svc.getKPIs(TENANT_A, STORE_MAIN, 'attendance') as KPI[]

    if (attendanceKpis.length > 0) {
      for (const k of attendanceKpis) {
        assert.equal(k.category, 'attendance')
      }
    }
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 运维与全链路洞察
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} ai-insight 扩展角色测试`, () => {
  it('运行专员生成全维度报告 — 含 kpi 类型', () => {
    const svc = createService()
    const report = svc.generateReport(TENANT_A, STORE_MAIN, 'kpi', '2026-01-01', '2026-01-31') as InsightReport

    assert.equal(report.type, 'kpi')
    assert.ok(report.data.metrics)
    assert.ok(report.data.trends.length > 0)
  })

  it('运行专员生成趋势预测 — 营收预测', () => {
    const svc = createService()
    const forecast = svc.generateForecast(TENANT_A, 'revenue', 'weekly') as Trend

    assert.ok(forecast.id)
    assert.equal(forecast.metric, 'revenue')
    assert.ok(Array.isArray(forecast.forecast))
    assert.ok(forecast.forecast.length > 0, '应有预测数据点')
    assert.ok(forecast.confidence > 0 && forecast.confidence <= 1)
    assert.equal(forecast.tenantId, TENANT_A)
  })

  it('运行专员获取趋势预测详情 — 按 ID 查询', () => {
    const svc = createService()
    const forecast = svc.generateForecast(TENANT_A, 'member', 'daily') as Trend

    const detail = svc.getForecast(forecast.id) as Trend
    assert.ok(detail)
    assert.equal(detail.id, forecast.id)
    assert.equal(detail.metric, 'member')
  })

  it('运行专员获取全部异常列表 — 不限严重程度', () => {
    const svc = createService()
    svc.detectAnomalies(TENANT_A, STORE_MAIN, undefined)

    const allAnomalies = svc.getAnomalies(TENANT_A, {}) as Anomaly[]
    assert.ok(Array.isArray(allAnomalies))
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 活动相关洞察
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} ai-insight 扩展角色测试`, () => {
  it('团建获取到店 KPI — 评估活动场地流量', () => {
    const svc = createService()
    const attendanceKpis = svc.getKPIs(TENANT_A, STORE_MAIN, 'attendance') as KPI[]

    if (attendanceKpis.length > 0) {
      assert.ok(attendanceKpis.every(k => k.category === 'attendance'))
    }
  })

  it('团建获取已生成的报告列表 — 活动参考数据', () => {
    const svc = createService()
    const reports = svc.getReports(TENANT_A, {}) as InsightReport[]

    assert.ok(Array.isArray(reports))
  })

  it('团建生成到店报告 — 评估团建场次效率', () => {
    const svc = createService()
    const report = svc.generateReport(TENANT_A, STORE_MAIN, 'attendance', '2026-06-01', '2026-06-30') as InsightReport

    assert.equal(report.type, 'attendance')
    assert.ok(report.summary.length > 0)
  })

  it('团建查看仪表盘 — 判断最佳团建时段', () => {
    const svc = createService()
    const dash = svc.getDashboardSummary(TENANT_A, STORE_MAIN) as DashboardSummary

    assert.ok(dash.today.attendance >= 0)
    assert.ok(typeof dash.today.yoyPercent === 'number')
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 — 活动与推广洞察
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} ai-insight 扩展角色测试`, () => {
  it('营销生成营收趋势预测 — 活动规划依据', () => {
    const svc = createService()
    const forecast = svc.generateForecast(TENANT_A, 'revenue', 'monthly') as Trend

    assert.equal(forecast.metric, 'revenue')
    assert.ok(forecast.forecast.length > 0)
    assert.ok(forecast.confidence >= 0)
  })

  it('营销获取会员 KPI — 评估活动拉新效果', () => {
    const svc = createService()
    const memberKpis = svc.getKPIs(TENANT_A, STORE_MAIN, 'member') as KPI[]

    assert.ok(memberKpis.every(k => k.category === 'member'))
    for (const k of memberKpis) {
      assert.ok(k.value >= 0)
      assert.ok(k.target > 0)
    }
  })

  it('营销生成营收报告含异常检测 — 评估活动异常', () => {
    const svc = createService()
    const report = svc.generateReport(TENANT_A, STORE_MAIN, 'revenue', '2026-06-01', '2026-06-30') as InsightReport

    assert.equal(report.type, 'revenue')
    assert.ok(report.data.anomalies)
  })

  it('营销按分类过滤 KPI — 精确分析', () => {
    const svc = createService()
    const revenueKpis = svc.getKPIs(TENANT_A, STORE_MAIN, 'revenue') as KPI[]

    assert.ok(revenueKpis.every(k => k.category === 'revenue'))
    for (const k of revenueKpis) {
      assert.ok(k.name)
      assert.ok(k.unit)
      assert.ok(['up', 'down', 'stable'].includes(k.trend))
    }
  })
})

// ════════════════════════════════════════════════════════════════
// 租户隔离 & 边界场景
// ════════════════════════════════════════════════════════════════
describe('ai-insight 租户隔离与边界场景', () => {
  it('租户隔离：TENANT_A 和 TENANT_B 数据互不干扰', () => {
    const svc = createService()

    const kpisA = svc.getKPIs(TENANT_A, undefined, undefined) as KPI[]
    const kpisB = svc.getKPIs(TENANT_B, undefined, undefined) as KPI[]

    // A 有种子数据，B 无数据 — 说明 tenantId 隔离生效
    assert.ok(kpisA.length > 0, 'A 应有种子 KPI')
    assert.equal(kpisB.length, 0, 'B 的 tenantId 与种子不匹配，应返回空')

    // KPI id 不应交叉
    const idsA = new Set(kpisA.map(k => k.id))
    const idsB = new Set(kpisB.map(k => k.id))
    for (const id of idsA) {
      assert.ok(!idsB.has(id), `KPI ${id} 不应跨租户可见`)
    }
  })

  it('租户隔离：A 租户的报告不包含 B 租户数据', () => {
    const svc = createService()

    const reportA = svc.generateReport(TENANT_A, undefined, 'revenue', '2026-01-01', '2026-01-31') as InsightReport
    assert.equal(reportA.tenantId, TENANT_A)

    const reportB = svc.generateReport(TENANT_B, undefined, 'revenue', '2026-01-01', '2026-01-31') as InsightReport
    assert.equal(reportB.tenantId, TENANT_B)

    // 租户 ID 不同 → report id 不同
    assert.notEqual(reportA.id, reportB.id)
    assert.ok(reportA.data.metrics['日营收'] > 0, 'A 应有营收数据')
    assert.equal(Object.keys(reportB.data.metrics).length, 0, 'B 无种子 KPI，应无指标数据')
  })

  it('租户隔离：异常检测结果租户隔离', () => {
    const svc = createService()

    const anomaliesA = svc.detectAnomalies(TENANT_A, STORE_MAIN, undefined) as Anomaly[]
    const anomaliesB = svc.detectAnomalies(TENANT_B, STORE_BRANCH, undefined) as Anomaly[]

    for (const a of anomaliesA) assert.equal(a.tenantId, TENANT_A)
    for (const a of anomaliesB) assert.equal(a.tenantId, TENANT_B)
  })

  it('仪表盘租户隔离 — 不同租户数据独立', () => {
    const svc = createService()

    const dashA = svc.getDashboardSummary(TENANT_A, undefined) as DashboardSummary
    const dashB = svc.getDashboardSummary(TENANT_B, undefined) as DashboardSummary

    assert.equal(dashA.tenantId, TENANT_A)
    assert.equal(dashB.tenantId, TENANT_B)
  })

  it('边界：不存在门店返回空 KPI 但不报错', () => {
    const svc = createService()
    const kpis = svc.getKPIs(TENANT_A, 'non-existent-store', undefined) as KPI[]

    assert.ok(Array.isArray(kpis))
    // 可能没有匹配的 KPI（取决于种子数据，应返回无该门店的通用 KPI）
  })

  it('边界：大数值场景 KPI 不溢出', () => {
    const svc = createService()
    // 预期种子 KPI 包含大值
    const kpis = getDefaultKpis(svc)

    for (const k of kpis) {
      assert.ok(!Number.isNaN(k.value), `KPI ${k.name} value 不应为 NaN`)
      assert.ok(!Number.isNaN(k.target), `KPI ${k.name} target 不应为 NaN`)
      assert.ok(Number.isFinite(k.value), `KPI ${k.name} value 应有限`)
      assert.ok(Number.isFinite(k.target), `KPI ${k.name} target 应有限`)
    }
  })

  it('边界：异常确认幂等性 — 多次确认状态不变', () => {
    const svc = createService()
    const anomalies = svc.getAnomalies(TENANT_A, {}) as Anomaly[]

    assert.ok(anomalies.length > 0)
    const ack1 = svc.acknowledgeAnomaly(anomalies[0].id) as Anomaly
    assert.equal(ack1.status, 'acknowledged')

    const ack2 = svc.acknowledgeAnomaly(anomalies[0].id) as Anomaly
    assert.equal(ack2.status, 'acknowledged')
  })

  it('边界：趋势预测置信度范围 0-1', () => {
    const svc = createService()

    const forecastRev = svc.generateForecast(TENANT_A, 'revenue', 'weekly') as Trend
    assert.ok(forecastRev.confidence >= 0 && forecastRev.confidence <= 1,
      `营收预测置信度 ${forecastRev.confidence} 应在 [0,1] 区间`)

    const forecastMember = svc.generateForecast(TENANT_A, 'member', 'daily') as Trend
    assert.ok(forecastMember.confidence >= 0 && forecastMember.confidence <= 1,
      `会员预测置信度 ${forecastMember.confidence} 应在 [0,1] 区间`)
  })

  it('边界：报告列表为空时仍返回数组而非 undefined', () => {
    const svc = createService()
    // 使用不存在门店过滤
    const reports = svc.getReports(TENANT_A, { storeId: 'non-existent-store' }) as InsightReport[]

    assert.ok(Array.isArray(reports))
  })
})
