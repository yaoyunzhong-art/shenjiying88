/**
 * 🐜 自动: [ai-insight] [C] 合约测试
 *
 * 验证 ai-insight 模块的实体/枚举/序列化的对外契约
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { AiInsightService } from './ai-insight.service'
import type {
  InsightReport,
  KPI,
  Anomaly,
  Trend,
  DashboardSummary
} from './ai-insight.entity'

// ─── 服务实例 helper ───────────────────────────────────

function makeService(): AiInsightService {
  // 每个测试新建实例,确保 seed 数据隔离
  return new AiInsightService()
}

// ─── 实体 Shape 合约 ───────────────────────────────────

describe('[ai-insight] 合约: 实体 Shape', () => {
  test('InsightReport 必备字段齐全', () => {
    const svc = makeService()
    const report = svc.generateReport('default', 'store-01', 'revenue', '2026-06-01', '2026-06-07')
    assert.ok(report.id.startsWith('report-revenue-'))
    assert.equal(report.tenantId, 'default')
    assert.equal(report.storeId, 'store-01')
    assert.equal(report.type, 'revenue')
    assert.ok(report.title.includes('洞察报告'))
    assert.equal(typeof report.summary, 'string')
    assert.ok(report.summary.length > 0)
    assert.equal(typeof report.data.metrics, 'object')
    assert.ok(Array.isArray(report.data.trends))
    assert.ok(Array.isArray(report.data.anomalies))
    assert.match(report.periodStart, /^\d{4}-\d{2}-\d{2}/)
    assert.match(report.periodEnd, /^\d{4}-\d{2}-\d{2}/)
    assert.ok(new Date(report.generatedAt).toString() !== 'Invalid Date')
    assert.ok(new Date(report.createdAt).toString() !== 'Invalid Date')
  })

  test('InsightReport.type 仅允许 5 种', () => {
    const svc = makeService()
    const validTypes: InsightReport['type'][] = ['revenue', 'member', 'attendance', 'game', 'kpi']
    for (const type of validTypes) {
      const report = svc.generateReport('default', undefined, type, '2026-06-01', '2026-06-07')
      assert.equal(report.type, type)
    }
  })

  test('KPI 必备字段齐全', () => {
    const svc = makeService()
    const kpis = svc.getKPIs('default')
    assert.ok(kpis.length > 0, 'seed data 应该预置 KPI')
    const kpi = kpis[0]
    assert.equal(typeof kpi.id, 'string')
    assert.equal(kpi.tenantId, 'default')
    assert.equal(typeof kpi.name, 'string')
    assert.ok(['revenue', 'member', 'attendance', 'game', 'operation'].includes(kpi.category))
    assert.equal(typeof kpi.value, 'number')
    assert.equal(typeof kpi.target, 'number')
    assert.equal(typeof kpi.unit, 'string')
    assert.ok(['up', 'down', 'stable'].includes(kpi.trend))
    assert.equal(typeof kpi.period, 'string')
    assert.ok(new Date(kpi.updatedAt).toString() !== 'Invalid Date')
  })

  test('Anomaly 必备字段齐全', () => {
    const svc = makeService()
    const anomalies = svc.getAnomalies('default')
    assert.ok(anomalies.length > 0, 'seed data 应该预置 anomaly')
    const a = anomalies[0]
    assert.equal(typeof a.id, 'string')
    assert.equal(a.tenantId, 'default')
    assert.equal(typeof a.metric, 'string')
    assert.equal(typeof a.value, 'number')
    assert.equal(typeof a.expectedValue, 'number')
    assert.equal(typeof a.deviationPercent, 'number')
    assert.ok(['low', 'medium', 'high', 'critical'].includes(a.severity))
    assert.ok(new Date(a.detectedAt).toString() !== 'Invalid Date')
    assert.ok(['open', 'acknowledged', 'resolved'].includes(a.status))
  })

  test('Trend 必备字段齐全 + forecast 是 7 天数组', () => {
    const svc = makeService()
    const trend = svc.generateForecast('default', '日营收', 'monthly')
    assert.equal(typeof trend.id, 'string')
    assert.equal(trend.tenantId, 'default')
    assert.equal(trend.metric, '日营收')
    assert.ok(Array.isArray(trend.forecast))
    assert.equal(trend.forecast.length, 7, '预测应该是未来 7 天')
    for (const point of trend.forecast) {
      assert.match(point.date, /^\d{4}-\d{2}-\d{2}$/)
      assert.equal(typeof point.value, 'number')
    }
    assert.ok(trend.confidence >= 0 && trend.confidence <= 1, 'confidence ∈ [0, 1]')
  })

  test('DashboardSummary 三周期完整', () => {
    const svc = makeService()
    const summary = svc.getDashboardSummary('default')
    assert.equal(summary.tenantId, 'default')
    for (const period of [summary.today, summary.thisWeek, summary.thisMonth]) {
      assert.equal(typeof period.label, 'string')
      assert.match(period.start, /^\d{4}-\d{2}-\d{2}$/)
      assert.match(period.end, /^\d{4}-\d{2}-\d{2}$/)
      assert.equal(typeof period.revenue, 'number')
      assert.equal(typeof period.members, 'number')
      assert.equal(typeof period.attendance, 'number')
      assert.equal(typeof period.games, 'number')
      assert.ok(Array.isArray(period.kpis))
      assert.ok(period.kpis.length <= 5, 'Top 5 KPIs')
      assert.equal(typeof period.yoyPercent, 'number')
    }
    assert.equal(typeof summary.activeAnomalies, 'number')
    assert.equal(typeof summary.reportCount, 'number')
  })
})

// ─── 业务映射合约 ─────────────────────────────────────

describe('[ai-insight] 合约: typeToCategory 映射', () => {
  test('revenue → revenue', () => {
    const svc = makeService()
    const report = svc.generateReport('default', undefined, 'revenue', '2026-06-01', '2026-06-07')
    assert.ok(Object.keys(report.data.metrics).length > 0)
  })

  test('member → member', () => {
    const svc = makeService()
    const report = svc.generateReport('default', undefined, 'member', '2026-06-01', '2026-06-07')
    for (const item of report.data.trends) {
      assert.ok(typeof item.name === 'string')
    }
  })

  test('kpi → 全 5 类', () => {
    const svc = makeService()
    const report = svc.generateReport('default', undefined, 'kpi', '2026-06-01', '2026-06-07')
    // 综合报告应包含 ≥ 4 个 metric(覆盖多类别)
    assert.ok(Object.keys(report.data.metrics).length >= 4)
  })

  test('attendance → attendance', () => {
    const svc = makeService()
    const report = svc.generateReport('default', undefined, 'attendance', '2026-06-01', '2026-06-07')
    assert.ok(report.title.includes('到店'))
  })

  test('game → game', () => {
    const svc = makeService()
    const report = svc.generateReport('default', undefined, 'game', '2026-06-01', '2026-06-07')
    assert.ok(report.title.includes('游戏'))
  })
})

// ─── 状态机合约 ───────────────────────────────────────

describe('[ai-insight] 合约: 异常状态机', () => {
  test('open → acknowledged 合法', () => {
    const svc = makeService()
    const anomalies = svc.getAnomalies('default', { status: 'open' })
    if (anomalies.length > 0) {
      const a = svc.acknowledgeAnomaly(anomalies[0].id)
      assert.equal(a?.status, 'acknowledged')
    }
  })

  test('acknowledged → resolved 合法', () => {
    const svc = makeService()
    const anomalies = svc.getAnomalies('default', { status: 'acknowledged' })
    if (anomalies.length > 0) {
      const a = svc.resolveAnomaly(anomalies[0].id)
      assert.equal(a?.status, 'resolved')
      assert.ok(a?.resolvedAt)
    }
  })

  test('resolved 不可再 resolve', () => {
    const svc = makeService()
    const anomalies = svc.getAnomalies('default', { status: 'resolved' })
    if (anomalies.length > 0) {
      const a = svc.resolveAnomaly(anomalies[0].id)
      // 状态保持 resolved
      assert.equal(a?.status, 'resolved')
    }
  })

  test('不存在的 anomaly 返回 undefined', () => {
    const svc = makeService()
    const a = svc.acknowledgeAnomaly('non-existent-id')
    assert.equal(a, undefined)
  })
})

// ─── 报告列表合约 ─────────────────────────────────────

describe('[ai-insight] 合约: 报告列表过滤', () => {
  test('limit 限制返回数量', () => {
    const svc = makeService()
    // 先生成 3 份报告
    svc.generateReport('default', 'store-01', 'revenue', '2026-06-01', '2026-06-07')
    svc.generateReport('default', 'store-02', 'member', '2026-06-01', '2026-06-07')
    svc.generateReport('default', 'store-03', 'attendance', '2026-06-01', '2026-06-07')

    const reports = svc.getReports('default', { limit: 2 })
    assert.equal(reports.length, 2)
  })

  test('type 过滤报告', () => {
    const svc = makeService()
    svc.generateReport('default', undefined, 'revenue', '2026-06-01', '2026-06-07')
    svc.generateReport('default', undefined, 'member', '2026-06-01', '2026-06-07')

    const revenues = svc.getReports('default', { type: 'revenue' })
    for (const r of revenues) assert.equal(r.type, 'revenue')
  })

  test('跨租户报告隔离', () => {
    const svc = makeService()
    svc.generateReport('tenant-A', undefined, 'revenue', '2026-06-01', '2026-06-07')
    svc.generateReport('tenant-B', undefined, 'revenue', '2026-06-01', '2026-06-07')

    const aReports = svc.getReports('tenant-A')
    const bReports = svc.getReports('tenant-B')
    assert.ok(aReports.every((r) => r.tenantId === 'tenant-A'))
    assert.ok(bReports.every((r) => r.tenantId === 'tenant-B'))
  })

  test('storeId 过滤报告', () => {
    const svc = makeService()
    svc.generateReport('default', 'store-01', 'revenue', '2026-06-01', '2026-06-07')
    svc.generateReport('default', 'store-02', 'revenue', '2026-06-01', '2026-06-07')

    const s1 = svc.getReports('default', { storeId: 'store-01' })
    for (const r of s1) assert.equal(r.storeId, 'store-01')
  })
})

// ─── KPI 查询合约 ─────────────────────────────────────

describe('[ai-insight] 合约: KPI 过滤', () => {
  test('category 过滤 KPI', () => {
    const svc = makeService()
    const revenueKPIs = svc.getKPIs('default', undefined, 'revenue')
    assert.ok(revenueKPIs.every((k) => k.category === 'revenue'))
    assert.ok(revenueKPIs.length > 0, 'seed 应预置 revenue KPI')
  })

  test('storeId 过滤 KPI', () => {
    const svc = makeService()
    const s1 = svc.getKPIs('default', 'store-01')
    assert.ok(s1.every((k) => k.storeId === 'store-01' || k.storeId === undefined))
  })

  test('getKPIDetail 找不到返回 undefined', () => {
    const svc = makeService()
    const k = svc.getKPIDetail('non-existent-kpi')
    assert.equal(k, undefined)
  })

  test('getKPIDetail 找到返回 KPI', () => {
    const svc = makeService()
    const kpis = svc.getKPIs('default')
    const k = svc.getKPIDetail(kpis[0].id)
    assert.ok(k)
    assert.equal(k?.id, kpis[0].id)
  })
})

// ─── 预测合约 ─────────────────────────────────────────

describe('[ai-insight] 合约: 预测', () => {
  test('空历史数据生成 7 天默认预测', () => {
    const svc = makeService()
    const trend = svc.generateForecast('empty-tenant', '日营收', 'monthly')
    assert.equal(trend.forecast.length, 7)
    assert.ok(trend.confidence >= 0 && trend.confidence <= 1)
  })

  test('getForecast 通过 id 找到', () => {
    const svc = makeService()
    const created = svc.generateForecast('default', '日营收', 'monthly')
    const found = svc.getForecast(created.id)
    assert.ok(found)
    assert.equal(found?.id, created.id)
  })

  test('getForecast 找不到返回 undefined', () => {
    const svc = makeService()
    const t = svc.getForecast('non-existent-trend')
    assert.equal(t, undefined)
  })
})

// ─── 异常检测合约 ─────────────────────────────────────

describe('[ai-insight] 合约: detectAnomalies', () => {
  test('无 metric 参数时检测所有 metric', () => {
    const svc = makeService()
    const detected = svc.detectAnomalies('default')
    assert.ok(Array.isArray(detected))
  })

  test('指定 metric 只检测该指标', () => {
    const svc = makeService()
    const detected = svc.detectAnomalies('default', undefined, '日营收')
    if (detected.length > 0) {
      for (const d of detected) {
        assert.equal(d.metric, '日营收')
      }
    }
  })

  test('severity 字段 ∈ {low, medium, high, critical}', () => {
    const svc = makeService()
    const detected = svc.detectAnomalies('default')
    const validSeverities = ['low', 'medium', 'high', 'critical']
    for (const d of detected) {
      assert.ok(validSeverities.includes(d.severity))
    }
  })

  test('severity 过滤异常', () => {
    const svc = makeService()
    const criticals = svc.getAnomalies('default', { severity: 'critical' })
    assert.ok(criticals.every((a) => a.severity === 'critical'))
  })

  test('status 过滤异常', () => {
    const svc = makeService()
    const opens = svc.getAnomalies('default', { status: 'open' })
    assert.ok(opens.every((a) => a.status === 'open'))
  })
})
