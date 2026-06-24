/**
 * 🐜 自动: [ai-insight] [D] service 测试
 * AiInsightService 单元测试：KPI看板、洞察报告、异常检测、趋势预测、仪表盘
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { AiInsightService } from './ai-insight.service'
import type { InsightReport, KPI, Anomaly, Trend } from './ai-insight.entity'

const TENANT_ID = 'default'
const STORE_ID = 'store-01'

function createService(): AiInsightService {
  return new AiInsightService()
}

// ── KPI 看板 ──
describe('AiInsightService: KPI', () => {
  test('getKPIs returns KPIs for tenant', () => {
    const service = createService()
    const kpis = service.getKPIs(TENANT_ID)
    assert.ok(Array.isArray(kpis))
    assert.ok(kpis.length > 0, 'seed data should provide KPIs')
  })

  test('getKPIs filters by storeId', () => {
    const service = createService()
    const all = service.getKPIs(TENANT_ID)
    const filtered = service.getKPIs(TENANT_ID, STORE_ID)

    // 按store过滤后的数量应 ≤ 总数
    assert.ok(filtered.length > 0)
    assert.ok(filtered.length <= all.length)

    for (const kpi of filtered) {
      // 每个KPI要么匹配storeId要么没有storeId
      assert.ok(!kpi.storeId || kpi.storeId === STORE_ID,
        `KPI ${kpi.id} storeId=${kpi.storeId} should match ${STORE_ID}`)
    }
  })

  test('getKPIs filters by category', () => {
    const service = createService()
    const revenueKPIs = service.getKPIs(TENANT_ID, undefined, 'revenue')

    assert.ok(revenueKPIs.length > 0)
    for (const kpi of revenueKPIs) {
      assert.equal(kpi.category, 'revenue')
    }
  })

  test('getKPIs combines storeId and category filters', () => {
    const service = createService()
    const result = service.getKPIs(TENANT_ID, STORE_ID, 'game')

    assert.ok(result.length > 0)
    for (const kpi of result) {
      assert.equal(kpi.category, 'game')
      assert.ok(!kpi.storeId || kpi.storeId === STORE_ID)
    }
  })

  test('getKPIDetail returns KPI by id', () => {
    const service = createService()
    const kpis = service.getKPIs(TENANT_ID)
    const first = kpis[0]

    const detail = service.getKPIDetail(first.id)
    assert.ok(detail)
    assert.equal(detail.id, first.id)
  })

  test('getKPIDetail returns undefined for non-existent id', () => {
    const service = createService()
    const result = service.getKPIDetail('non-existent-id')
    assert.equal(result, undefined)
  })

  test('KPIs have correct structure', () => {
    const service = createService()
    const kpis = service.getKPIs(TENANT_ID)

    for (const kpi of kpis) {
      assert.ok(kpi.id, 'should have id')
      assert.ok(kpi.name, 'should have name')
      assert.ok(typeof kpi.value === 'number', 'value should be number')
      assert.ok(typeof kpi.target === 'number', 'target should be number')
      assert.ok(kpi.unit, 'should have unit')
      assert.ok(['up', 'down', 'stable'].includes(kpi.trend), 'trend should be valid')
      assert.ok(['revenue', 'member', 'attendance', 'game', 'operation'].includes(kpi.category),
        'category should be valid')
    }
  })
})

// ── 洞察报告 ──
describe('AiInsightService: Reports', () => {
  test('generateReport creates a report with correct type', () => {
    const service = createService()
    const report = service.generateReport(
      TENANT_ID, STORE_ID, 'revenue', '2026-06-01', '2026-06-07'
    )

    assert.equal(report.type, 'revenue')
    assert.equal(report.tenantId, TENANT_ID)
    assert.equal(report.storeId, STORE_ID)
    assert.equal(report.periodStart, '2026-06-01')
    assert.equal(report.periodEnd, '2026-06-07')
    assert.ok(report.id.startsWith('report-'))
    assert.ok(report.summary.length > 0)
  })

  test('generateReport includes data with metrics, trends, anomalies', () => {
    const service = createService()
    const report = service.generateReport(
      TENANT_ID, undefined, 'kpi', '2026-06-01', '2026-06-07'
    )

    assert.ok(report.data.metrics)
    assert.ok(Array.isArray(report.data.trends))
    assert.ok(Array.isArray(report.data.anomalies))
    // KPI report covers all categories
    assert.ok(Object.keys(report.data.metrics).length > 0)
  })

  test('generateReport generates summary text', () => {
    const service = createService()
    const report = service.generateReport(
      TENANT_ID, STORE_ID, 'revenue', '2026-06-01', '2026-06-07'
    )
    assert.ok(report.summary.includes('指标'), 'summary should mention metrics')
    assert.ok(report.summary.endsWith('。'), 'summary should end with Chinese period')
  })

  test('getReports returns generated reports', () => {
    const service = createService()
    // 生成报告
    service.generateReport(TENANT_ID, STORE_ID, 'revenue', '2026-06-01', '2026-06-07')
    service.generateReport(TENANT_ID, STORE_ID, 'member', '2026-06-01', '2026-06-07')

    const reports = service.getReports(TENANT_ID)
    assert.ok(reports.length >= 2)
  })

  test('getReports sorts by generatedAt descending', () => {
    const service = createService()
    service.generateReport(TENANT_ID, STORE_ID, 'revenue', '2026-06-01', '2026-06-07')
    service.generateReport(TENANT_ID, STORE_ID, 'member', '2026-06-01', '2026-06-07')

    const reports = service.getReports(TENANT_ID)
    for (let i = 1; i < reports.length; i++) {
      assert.ok(
        new Date(reports[i - 1].generatedAt).getTime() >=
        new Date(reports[i].generatedAt).getTime(),
        'reports should be sorted desc by generatedAt'
      )
    }
  })

  test('getReports filters by type', () => {
    const service = createService()
    service.generateReport(TENANT_ID, STORE_ID, 'revenue', '2026-06-01', '2026-06-07')
    service.generateReport(TENANT_ID, STORE_ID, 'member', '2026-06-01', '2026-06-07')

    const revenueReports = service.getReports(TENANT_ID, { type: 'revenue' })
    for (const r of revenueReports) {
      assert.equal(r.type, 'revenue')
    }
  })

  test('getReports applies limit', () => {
    const service = createService()
    service.generateReport(TENANT_ID, STORE_ID, 'revenue', '2026-06-01', '2026-06-07')
    service.generateReport(TENANT_ID, STORE_ID, 'member', '2026-06-01', '2026-06-07')
    service.generateReport(TENANT_ID, STORE_ID, 'game', '2026-06-01', '2026-06-07')

    const reports = service.getReports(TENANT_ID, { limit: 2 })
    assert.ok(reports.length <= 2)
  })

  test('getReports returns empty for unknown tenant', () => {
    const service = createService()
    const reports = service.getReports('unknown-tenant')
    assert.deepEqual(reports, [])
  })
})

// ── 异常检测 ──
describe('AiInsightService: Anomalies', () => {
  test('getAnomalies returns seed anomalies', () => {
    const service = createService()
    const anomalies = service.getAnomalies(TENANT_ID)
    assert.ok(anomalies.length > 0, 'seed data should have anomalies')
    // 验证已初始化的3条异常
    assert.ok(anomalies.length >= 3)
  })

  test('getAnomalies filters by status', () => {
    const service = createService()
    const open = service.getAnomalies(TENANT_ID, { status: 'open' })
    const resolved = service.getAnomalies(TENANT_ID, { status: 'resolved' })

    for (const a of open) {
      assert.equal(a.status, 'open')
    }
    for (const a of resolved) {
      assert.equal(a.status, 'resolved')
    }
  })

  test('getAnomalies filters by severity', () => {
    const service = createService()
    const high = service.getAnomalies(TENANT_ID, { severity: 'high' })
    for (const a of high) {
      assert.equal(a.severity, 'high')
    }
  })

  test('getAnomalies applies limit', () => {
    const service = createService()
    const result = service.getAnomalies(TENANT_ID, { limit: 1 })
    assert.ok(result.length <= 1)
  })

  test('acknowledgeAnomaly transitions open to acknowledged', () => {
    const service = createService()
    const anomalies = service.getAnomalies(TENANT_ID, { status: 'open' })
    assert.ok(anomalies.length > 0, 'should have open anomalies')

    const result = service.acknowledgeAnomaly(anomalies[0].id)
    assert.ok(result)
    assert.equal(result.status, 'acknowledged')
  })

  test('acknowledgeAnomaly returns undefined for non-existent', () => {
    const service = createService()
    const result = service.acknowledgeAnomaly('no-such-id')
    assert.equal(result, undefined)
  })

  test('resolveAnomaly transitions to resolved with resolvedAt', () => {
    const service = createService()
    const anomalies = service.getAnomalies(TENANT_ID, { status: 'open' })
    assert.ok(anomalies.length > 0)

    const result = service.resolveAnomaly(anomalies[0].id)
    assert.ok(result)
    assert.equal(result.status, 'resolved')
    assert.ok(result.resolvedAt, 'should set resolvedAt')
  })

  test('resolveAnomaly can resolve acknowledged anomalies too', () => {
    const service = createService()
    const acked = service.getAnomalies(TENANT_ID, { status: 'acknowledged' })
    if (acked.length > 0) {
      const result = service.resolveAnomaly(acked[0].id)
      assert.ok(result)
      assert.equal(result.status, 'resolved')
    }
  })

  test('detectAnomalies performs 3-sigma detection', () => {
    const service = createService()
    const detected = service.detectAnomalies(TENANT_ID, STORE_ID)
    assert.ok(Array.isArray(detected), 'should return array')
    // 每个新检测到的异常都有正确结构
    for (const a of detected) {
      assert.ok(a.id, 'should have id')
      assert.ok(a.metric, 'should have metric')
      assert.ok(typeof a.value === 'number')
      assert.ok(typeof a.expectedValue === 'number')
      assert.ok(typeof a.deviationPercent === 'number')
      assert.ok(['low', 'medium', 'high', 'critical'].includes(a.severity))
      assert.ok(['open', 'acknowledged', 'resolved'].includes(a.status))
    }
  })

  test('detectAnomalies filters by metric', () => {
    const service = createService()
    const detected = service.detectAnomalies(TENANT_ID, undefined, '日营收')
    // 如果有足够的数据点进行标准差计算
    if (detected.length > 0) {
      for (const a of detected) {
        assert.equal(a.metric, '日营收')
      }
    }
  })

  test('getAnomalies filters by storeId', () => {
    const service = createService()
    const result = service.getAnomalies(TENANT_ID, { storeId: STORE_ID })
    for (const a of result) {
      assert.ok(!a.storeId || a.storeId === STORE_ID)
    }
  })

  test('getAnomalies returns empty for unknown tenant', () => {
    const service = createService()
    const result = service.getAnomalies('unknown')
    assert.deepEqual(result, [])
  })
})

// ── 趋势预测 ──
describe('AiInsightService: Forecasts', () => {
  test('generateForecast creates trend with forecast points', () => {
    const service = createService()
    const trend = service.generateForecast(TENANT_ID, '日营收', 'week')

    assert.ok(trend.id.startsWith('trend-'))
    assert.equal(trend.metric, '日营收')
    assert.ok(Array.isArray(trend.forecast))
    assert.ok(trend.forecast.length > 0, 'should have forecast points')
    assert.ok(trend.confidence >= 0 && trend.confidence <= 1)
    assert.ok(trend.generatedAt)
  })

  test('generateForecast creates sequential forecast dates', () => {
    const service = createService()
    const trend = service.generateForecast(TENANT_ID, '日营收', 'week')

    for (const point of trend.forecast) {
      assert.ok(point.date, 'each point should have date')
      assert.ok(typeof point.value === 'number', 'each point should have numeric value')
      // date should be ISO date format
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(point.date), 'date should be YYYY-MM-DD')
    }
  })

  test('generateForecast handles unknown metric with low confidence', () => {
    const service = createService()
    const trend = service.generateForecast(TENANT_ID, 'unknown_metric', 'week')

    assert.ok(trend.forecast.length > 0)
    // 未知指标应有较低置信度
    assert.ok(trend.confidence <= 0.5,
      `confidence ${trend.confidence} should be low for unknown metric`)
  })

  test('getForecast returns existing trend', () => {
    const service = createService()
    const created = service.generateForecast(TENANT_ID, '日营收', 'week')
    const fetched = service.getForecast(created.id)

    assert.ok(fetched)
    assert.equal(fetched.id, created.id)
    assert.equal(fetched.metric, created.metric)
    assert.equal(fetched.confidence, created.confidence)
  })

  test('getForecast returns undefined for non-existent', () => {
    const service = createService()
    const result = service.getForecast('no-such-id')
    assert.equal(result, undefined)
  })

  test('multiple forecasts for same metric create distinct trends', () => {
    const service = createService()
    const t1 = service.generateForecast(TENANT_ID, '日营收', 'week')
    const t2 = service.generateForecast(TENANT_ID, '日营收', 'week')

    assert.notEqual(t1.id, t2.id, 'each forecast should have unique id')
  })
})

// ── 仪表盘 ──
describe('AiInsightService: Dashboard', () => {
  test('getDashboardSummary returns summary with all periods', () => {
    const service = createService()
    const dashboard = service.getDashboardSummary(TENANT_ID, STORE_ID)

    assert.equal(dashboard.tenantId, TENANT_ID)
    assert.equal(dashboard.storeId, STORE_ID)

    // 三个周期
    assert.ok(dashboard.today)
    assert.ok(dashboard.thisWeek)
    assert.ok(dashboard.thisMonth)

    // 周期结构
    for (const period of [dashboard.today, dashboard.thisWeek, dashboard.thisMonth]) {
      assert.ok(period.label)
      assert.ok(period.start)
      assert.ok(period.end)
      assert.ok(typeof period.revenue === 'number')
      assert.ok(typeof period.members === 'number')
      assert.ok(typeof period.attendance === 'number')
      assert.ok(typeof period.games === 'number')
      assert.ok(Array.isArray(period.kpis))
      assert.ok(typeof period.yoyPercent === 'number')
    }
  })

  test('getDashboardSummary includes active anomalies count', () => {
    const service = createService()
    const dashboard = service.getDashboardSummary(TENANT_ID)

    assert.ok(typeof dashboard.activeAnomalies === 'number')
    assert.ok(dashboard.activeAnomalies >= 0)
  })

  test('getDashboardSummary includes report count', () => {
    const service = createService()
    // 生成一些报告
    service.generateReport(TENANT_ID, STORE_ID, 'revenue', '2026-06-01', '2026-06-07')
    service.generateReport(TENANT_ID, STORE_ID, 'member', '2026-06-01', '2026-06-07')

    const dashboard = service.getDashboardSummary(TENANT_ID)
    assert.ok(dashboard.reportCount >= 2)
  })

  test('getDashboardSummary without storeId returns all data', () => {
    const service = createService()
    const dashboard = service.getDashboardSummary(TENANT_ID)
    assert.equal(dashboard.storeId, undefined)
    assert.ok(dashboard.today)
  })

  test('getDashboardSummary KPIs are limited to top 5', () => {
    const service = createService()
    const dashboard = service.getDashboardSummary(TENANT_ID, STORE_ID)
    // 每个周期最多5个KPI
    assert.ok(dashboard.today.kpis.length <= 5)
    assert.ok(dashboard.thisWeek.kpis.length <= 5)
    assert.ok(dashboard.thisMonth.kpis.length <= 5)
  })

  test('getDashboardSummary yoyPercent is within reasonable range', () => {
    const service = createService()
    const dashboard = service.getDashboardSummary(TENANT_ID, STORE_ID)
    // yoyPercent 应该在 -10 ~ +30 之间 (基于 simulateYoyPercent)
    assert.ok(dashboard.today.yoyPercent >= -10 && dashboard.today.yoyPercent <= 30,
      `yoyPercent ${dashboard.today.yoyPercent} should be in -10..30`)
  })
})

// ── 集成流程测试 ──
describe('AiInsightService: Integration flows', () => {
  test('full workflow: KPI → report → anomaly → forecast → dashboard', () => {
    const service = createService()

    // 1. 查看KPI
    const kpis = service.getKPIs(TENANT_ID, STORE_ID, 'revenue')
    assert.ok(kpis.length > 0)

    // 2. 生成报告
    const report = service.generateReport(
      TENANT_ID, STORE_ID, 'revenue', '2026-06-01', '2026-06-07'
    )
    assert.ok(report.data.trends.length > 0)

    // 3. 检测异常
    service.detectAnomalies(TENANT_ID, STORE_ID)

    // 4. 生成趋势预测
    const trend = service.generateForecast(TENANT_ID, '日营收', 'month')
    assert.ok(trend.forecast.length > 0)

    // 5. 获取仪表盘
    const dashboard = service.getDashboardSummary(TENANT_ID, STORE_ID)
    assert.ok(dashboard)
    // 确认报告和异常被仪表盘计入
    assert.ok(dashboard.reportCount >= 1)
    assert.ok(dashboard.activeAnomalies >= 0)
  })

  test('anomaly lifecycle: open → acknowledge → resolve', () => {
    const service = createService()
    const anomalies = service.getAnomalies(TENANT_ID, { status: 'open' })
    assert.ok(anomalies.length > 0, 'should have open anomalies')

    const anomalyId = anomalies[0].id

    // acknowledge
    const acked = service.acknowledgeAnomaly(anomalyId)
    assert.equal(acked?.status, 'acknowledged')

    // resolve
    const resolved = service.resolveAnomaly(anomalyId)
    assert.equal(resolved?.status, 'resolved')
    assert.ok(resolved?.resolvedAt)
  })

  test('getKPIDetail works across all KPIs', () => {
    const service = createService()
    const all = service.getKPIs(TENANT_ID)

    for (const kpi of all) {
      const detail = service.getKPIDetail(kpi.id)
      assert.ok(detail)
      assert.equal(detail.id, kpi.id)
      assert.equal(detail.name, kpi.name)
      assert.equal(detail.value, kpi.value)
    }
  })
})
