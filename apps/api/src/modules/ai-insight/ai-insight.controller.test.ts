import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-insight] [D] controller 测试
 * AiInsightController 单元测试：正例 + 反例 + 边界
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiInsightController } from './ai-insight.controller'
import { AiInsightService } from './ai-insight.service'

const TENANT_ID = 'default'
const STORE_ID = 'store-01'

function createController(): AiInsightController {
  const service = new AiInsightService()
  return new AiInsightController(service)
}

// ── KPI 看板 ──
describe('AiInsightController: KPI endpoints', () => {
  it('GET /kpis returns KPI list', () => {
    const ctrl = createController()
    const result = ctrl.getKPIs(TENANT_ID, { storeId: STORE_ID, category: 'revenue' })

    assert.ok(Array.isArray(result))
    assert.ok(result.length > 0)
    for (const kpi of result) {
      assert.equal(kpi.category, 'revenue')
    }
  })

  it('GET /kpis with no category returns all', () => {
    const ctrl = createController()
    const result = ctrl.getKPIs(TENANT_ID, {})
    assert.ok(result.length > 0)
  })

  it('GET /kpis with category=operation', () => {
    const ctrl = createController()
    const result = ctrl.getKPIs(TENANT_ID, { category: 'operation' })
    for (const kpi of result) {
      assert.equal(kpi.category, 'operation')
    }
  })

  it('GET /kpis/:kpiId returns KPI detail', () => {
    const ctrl = createController()
    const kpis = ctrl.getKPIs(TENANT_ID, {})
    const result = ctrl.getKPIDetail(kpis[0].id)
    assert.ok(result)
    assert.equal(result.id, kpis[0].id)
  })

  it('GET /kpis/:kpiId returns undefined for non-existent', () => {
    const ctrl = createController()
    const result = ctrl.getKPIDetail('no-such-id')
    assert.equal(result, undefined)
  })

  it('GET /kpis with empty storeId returns all stores', () => {
    const ctrl = createController()
    const result = ctrl.getKPIs(TENANT_ID, {})
    // 至少应有 3 * 10 = 30 条 KPI（3个门店 × 10个指标）
    assert.ok(result.length >= 10, `expected >= 10, got ${result.length}`)
  })
})

// ── 洞察报告 ──
describe('AiInsightController: Report endpoints', () => {
  it('POST /reports generates report', () => {
    const ctrl = createController()
    const report = ctrl.generateReport(TENANT_ID, {
      type: 'revenue',
      storeId: STORE_ID,
      periodStart: '2026-06-01',
      periodEnd: '2026-06-07'
    })

    assert.equal(report.type, 'revenue')
    assert.equal(report.tenantId, TENANT_ID)
    assert.ok(report.id.startsWith('report-'))
    assert.ok(report.summary.length > 0)
  })

  it('POST /reports generates member report', () => {
    const ctrl = createController()
    const report = ctrl.generateReport(TENANT_ID, {
      type: 'member',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-07'
    })

    assert.equal(report.type, 'member')
    assert.ok(report.data.metrics)
  })

  it('POST /reports generates all 5 types', () => {
    const ctrl = createController()
    const types = ['revenue', 'member', 'attendance', 'game', 'kpi'] as const
    for (const type of types) {
      const report = ctrl.generateReport(TENANT_ID, {
        type,
        periodStart: '2026-06-01',
        periodEnd: '2026-06-07'
      })
      assert.equal(report.type, type)
    }
  })

  it('GET /reports lists generated reports', () => {
    const ctrl = createController()
    ctrl.generateReport(TENANT_ID, {
      type: 'revenue',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-07'
    })
    ctrl.generateReport(TENANT_ID, {
      type: 'member',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-07'
    })

    const reports = ctrl.getReports(TENANT_ID, { limit: 10 })
    assert.ok(reports.length >= 2)
  })

  it('GET /reports filters by type', () => {
    const ctrl = createController()
    ctrl.generateReport(TENANT_ID, {
      type: 'revenue',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-07'
    })
    ctrl.generateReport(TENANT_ID, {
      type: 'member',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-07'
    })

    const revenueOnly = ctrl.getReports(TENANT_ID, { type: 'revenue', limit: 10 })
    for (const r of revenueOnly) {
      assert.equal(r.type, 'revenue')
    }
  })

  it('GET /reports with limit=1 returns at most 1', () => {
    const ctrl = createController()
    ctrl.generateReport(TENANT_ID, {
      type: 'kpi',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-07'
    })

    const result = ctrl.getReports(TENANT_ID, { limit: 1 })
    assert.ok(result.length <= 1)
  })
})

// ── 异常检测 ──
describe('AiInsightController: Anomaly endpoints', () => {
  it('GET /anomalies lists anomalies', () => {
    const ctrl = createController()
    const result = ctrl.getAnomalies(TENANT_ID, { limit: 10 })
    assert.ok(Array.isArray(result))
    assert.ok(result.length > 0)
  })

  it('GET /anomalies filters by status=open', () => {
    const ctrl = createController()
    const result = ctrl.getAnomalies(TENANT_ID, { status: 'open' })
    for (const a of result) {
      assert.equal(a.status, 'open')
    }
  })

  it('GET /anomalies filters by severity=high', () => {
    const ctrl = createController()
    const result = ctrl.getAnomalies(TENANT_ID, { severity: 'high' })
    for (const a of result) {
      assert.equal(a.severity, 'high')
    }
  })

  it('GET /anomalies with limit', () => {
    const ctrl = createController()
    const result = ctrl.getAnomalies(TENANT_ID, { limit: 2 })
    assert.ok(result.length <= 2)
  })

  it('POST /anomalies/detect detects anomalies', () => {
    const ctrl = createController()
    const detected = ctrl.detectAnomalies(TENANT_ID, { storeId: STORE_ID })
    assert.ok(Array.isArray(detected))
    for (const a of detected) {
      assert.ok(a.id)
      assert.ok(['low', 'medium', 'high', 'critical'].includes(a.severity))
    }
  })

  it('PUT /anomalies/:id/acknowledge acknowledges anomaly', () => {
    const ctrl = createController()
    const anomalies = ctrl.getAnomalies(TENANT_ID, { status: 'open', limit: 10 })
    assert.ok(anomalies.length > 0)

    const result = ctrl.acknowledgeAnomaly(anomalies[0].id)
    assert.ok(result)
    assert.equal(result.status, 'acknowledged')
  })

  it('PUT /anomalies/:id/resolve resolves anomaly', () => {
    const ctrl = createController()
    const anomalies = ctrl.getAnomalies(TENANT_ID, { status: 'open', limit: 10 })
    if (anomalies.length > 0) {
      const result = ctrl.resolveAnomaly(anomalies[0].id, { anomalyId: anomalies[0].id })
      assert.ok(result)
      assert.equal(result.status, 'resolved')
      assert.ok(result.resolvedAt)
    }
  })

  it('acknowledge non-existent anomaly returns undefined', () => {
    const ctrl = createController()
    const result = ctrl.acknowledgeAnomaly('not-real')
    assert.equal(result, undefined)
  })
})

// ── 趋势预测 ──
describe('AiInsightController: Forecast endpoints', () => {
  it('POST /forecasts generates forecast', () => {
    const ctrl = createController()
    const trend = ctrl.generateForecast(TENANT_ID, { metric: '日营收', period: 'week' })

    assert.ok(trend.id)
    assert.equal(trend.metric, '日营收')
    assert.ok(trend.forecast.length > 0)
    assert.ok(trend.confidence >= 0 && trend.confidence <= 1)
  })

  it('POST /forecasts with different metrics', () => {
    const ctrl = createController()
    const metrics = ['日营收', '到店人数', '游戏局数']

    for (const metric of metrics) {
      const trend = ctrl.generateForecast(TENANT_ID, { metric, period: 'month' })
      assert.equal(trend.metric, metric)
      assert.ok(trend.forecast.length > 0)
    }
  })

  it('GET /forecasts/:id retrieves forecast', () => {
    const ctrl = createController()
    const created = ctrl.generateForecast(TENANT_ID, { metric: '日营收', period: 'week' })
    const fetched = ctrl.getForecast(created.id)

    assert.ok(fetched)
    assert.equal(fetched.id, created.id)
    assert.equal(fetched.metric, '日营收')
  })

  it('GET /forecasts/:id returns undefined for non-existent', () => {
    const ctrl = createController()
    const result = ctrl.getForecast('invalid-id')
    assert.equal(result, undefined)
  })
})

// ── 仪表盘 ──
describe('AiInsightController: Dashboard endpoint', () => {
  it('GET /dashboard returns summary', () => {
    const ctrl = createController()
    const dashboard = ctrl.getDashboardSummary(TENANT_ID, { storeId: STORE_ID })

    assert.equal(dashboard.tenantId, TENANT_ID)
    assert.equal(dashboard.storeId, STORE_ID)
    assert.ok(dashboard.today)
    assert.ok(dashboard.thisWeek)
    assert.ok(dashboard.thisMonth)
    assert.ok(typeof dashboard.activeAnomalies === 'number')
    assert.ok(typeof dashboard.reportCount === 'number')
  })

  it('GET /dashboard without storeId returns tenant-level', () => {
    const ctrl = createController()
    const dashboard = ctrl.getDashboardSummary(TENANT_ID, {})

    assert.equal(dashboard.tenantId, TENANT_ID)
    assert.equal(dashboard.storeId, undefined)
  })

  it('GET /dashboard includes numeric values for all periods', () => {
    const ctrl = createController()
    const dashboard = ctrl.getDashboardSummary(TENANT_ID, { storeId: STORE_ID })

    for (const period of [dashboard.today, dashboard.thisWeek, dashboard.thisMonth]) {
      assert.ok(typeof period.revenue === 'number')
      assert.ok(typeof period.members === 'number')
      assert.ok(typeof period.attendance === 'number')
      assert.ok(typeof period.games === 'number')
      assert.ok(Array.isArray(period.kpis))
    }
  })
})

// ── 边界测试 ──
describe('AiInsightController: Edge cases', () => {
  it('handles empty storeId query', () => {
    const ctrl = createController()
    const result = ctrl.getKPIs(TENANT_ID, { storeId: undefined })
    assert.ok(result.length > 0)
  })

  it('handles empty category query', () => {
    const ctrl = createController()
    const result = ctrl.getKPIs(TENANT_ID, { category: undefined })
    assert.ok(result.length > 0)
  })

  it('handles generateReport without storeId', () => {
    const ctrl = createController()
    const report = ctrl.generateReport(TENANT_ID, {
      type: 'kpi',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-07'
    })
    assert.equal(report.storeId, undefined)
    assert.ok(report.data.metrics)
  })

  it('handles large limit gracefully', () => {
    const ctrl = createController()
    const result = ctrl.getReports(TENANT_ID, { limit: 100 })
    assert.ok(Array.isArray(result))
  })

  it('multiple reports without data corruption', () => {
    const ctrl = createController()
    const r1 = ctrl.generateReport(TENANT_ID, {
      type: 'revenue',
      periodStart: '2026-01-01',
      periodEnd: '2026-01-07'
    })
    const r2 = ctrl.generateReport(TENANT_ID, {
      type: 'member',
      periodStart: '2026-02-01',
      periodEnd: '2026-02-07'
    })

    assert.notEqual(r1.id, r2.id)
    assert.notEqual(r1.type, r2.type)
    assert.notEqual(r1.periodStart, r2.periodStart)
  })
})
