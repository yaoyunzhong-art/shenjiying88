/**
 * 🐜 自动: [ai-insight] [D] controller spec 补全
 * AiInsightController 单元测试 (node:test)
 *
 * 策略：内联 Controller 副本 (avoid NestJS DI) + Mock Service
 * 覆盖所有路由端点：KPI看板、洞察报告、异常检测、趋势预测、仪表盘
 * 正向流程 + 边界条件（空数据、不存在的Key、未生成数据场景）
 */

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

// ── Entity mirrors ───────────────────────────────────────────
function makeKPI(overrides: Record<string, unknown> = {}) {
  return {
    id: 'kpi-test-01', tenantId: 't-001', storeId: 'store-01',
    name: '日营收', category: 'revenue', value: 15000, target: 20000,
    unit: '元', trend: 'up', period: 'daily', updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeAnomaly(overrides: Record<string, unknown> = {}) {
  return {
    id: 'anomaly-test-01', tenantId: 't-001', storeId: 'store-01',
    metric: '投诉率', value: 4.8, expectedValue: 1.2,
    deviationPercent: 300, severity: 'critical',
    detectedAt: new Date().toISOString(), status: 'open',
    ...overrides,
  }
}

function makeReport(overrides: Record<string, unknown> = {}) {
  return {
    id: 'report-test-01', tenantId: 't-001', type: 'revenue',
    title: '营收洞察报告', summary: '本报告覆盖 3 项关键指标。',
    data: { metrics: { '日营收': 15000 }, trends: [], anomalies: [] },
    periodStart: '2026-06-01', periodEnd: '2026-06-07',
    generatedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeTrend(overrides: Record<string, unknown> = {}) {
  return {
    id: 'trend-test-01', tenantId: 't-001', metric: '日营收',
    forecast: [{ date: '2026-06-25', value: 15500 }],
    confidence: 0.85, generatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeDashboardSummary(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: 't-001',
    today: { label: '今日', start: '2026-06-24', end: '2026-06-24', revenue: 15000, members: 25, attendance: 180, games: 350, kpis: [], yoyPercent: 5.5 },
    thisWeek: { label: '本周', start: '2026-06-22', end: '2026-06-24', revenue: 75000, members: 120, attendance: 900, games: 1750, kpis: [], yoyPercent: 3.2 },
    thisMonth: { label: '本月', start: '2026-06-01', end: '2026-06-24', revenue: 300000, members: 500, attendance: 3600, games: 7000, kpis: [], yoyPercent: 8.1 },
    activeAnomalies: 2, reportCount: 3, generatedAt: new Date().toISOString(),
    ...overrides,
  }
}

// ── Mock Service Factory ─────────────────────────────────────
function makeMockService(initialKPIs?: any[]) {
  let kpis = initialKPIs ?? [makeKPI()]

  let anomalies: any[] = [
    makeAnomaly({ id: 'anomaly-open-1', status: 'open' }),
    makeAnomaly({ id: 'anomaly-ack-1', status: 'acknowledged' }),
    makeAnomaly({ id: 'anomaly-resolved-1', status: 'resolved', resolvedAt: new Date().toISOString() }),
  ]

  let reports: any[] = []
  let trends: any[] = []

  return {
    getKPIs: (tenantId: string, storeId?: string, category?: string) => {
      let res = kpis.filter((k: any) => k.tenantId === tenantId)
      if (storeId) res = res.filter((k: any) => k.storeId === storeId || k.storeId === undefined)
      if (category) res = res.filter((k: any) => k.category === category)
      return res
    },
    getKPIDetail: (kpiId: string) => kpis.find((k: any) => k.id === kpiId),

    generateReport: (tenantId: string, _storeId: string | undefined, type: string, periodStart: string, periodEnd: string) => {
      const report = makeReport({
        id: `report-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tenantId, type, periodStart, periodEnd,
      })
      reports.push(report)
      return report
    },
    getReports: (tenantId: string, opts?: { storeId?: string; type?: string; limit?: number }) => {
      let res = reports.filter((r: any) => r.tenantId === tenantId)
      if (opts?.storeId) res = res.filter((r: any) => r.storeId === opts!.storeId)
      if (opts?.type) res = res.filter((r: any) => r.type === opts!.type)
      res.sort((a: any, b: any) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
      if (opts?.limit) res = res.slice(0, opts.limit)
      return res
    },

    detectAnomalies: (_tenantId: string) => [makeAnomaly({ id: 'anomaly-detected-1', metric: '日营收', status: 'open' })],
    getAnomalies: (tenantId: string, opts?: { storeId?: string; status?: string; severity?: string; limit?: number }) => {
      let res = anomalies.filter((a: any) => a.tenantId === tenantId)
      if (opts?.storeId) res = res.filter((a: any) => a.storeId === opts!.storeId)
      if (opts?.status) res = res.filter((a: any) => a.status === opts!.status)
      if (opts?.severity) res = res.filter((a: any) => a.severity === opts!.severity)
      if (opts?.limit) res = res.slice(0, opts.limit)
      return res
    },
    acknowledgeAnomaly: (id: string) => {
      const a = anomalies.find((a: any) => a.id === id)
      if (a && a.status === 'open') a.status = 'acknowledged'
      return a
    },
    resolveAnomaly: (id: string) => {
      const a = anomalies.find((a: any) => a.id === id)
      if (a && a.status !== 'resolved') {
        a.status = 'resolved'
        a.resolvedAt = new Date().toISOString()
      }
      return a
    },

    generateForecast: (tenantId: string, metric: string, _period: string) => {
      const trend = makeTrend({ id: `trend-${metric}-${Date.now()}`, tenantId, metric })
      trends.push(trend)
      return trend
    },
    getForecast: (trendId: string) => trends.find((t: any) => t.id === trendId),

    getDashboardSummary: (tenantId: string, storeId?: string) =>
      makeDashboardSummary({ tenantId, storeId }),
  }
}

// ── 内联 Controller (avoid NestJS parameter decorators) ───────
class AiInsightController {
  private insightService: any

  constructor(insightService: any) {
    this.insightService = insightService
  }

  // ── KPI 看板 ──
  getKPIs(tenantId: string, query: { storeId?: string; category?: string }) {
    return this.insightService.getKPIs(tenantId, query.storeId, query.category)
  }

  getKPIDetail(kpiId: string) {
    return this.insightService.getKPIDetail(kpiId)
  }

  // ── 洞察报告 ──
  generateReport(tenantId: string, dto: { type: string; storeId?: string; periodStart: string; periodEnd: string }) {
    return this.insightService.generateReport(tenantId, dto.storeId, dto.type, dto.periodStart, dto.periodEnd)
  }

  getReports(tenantId: string, query: { storeId?: string; type?: string; limit?: number }) {
    return this.insightService.getReports(tenantId, query)
  }

  // ── 异常检测 ──
  detectAnomalies(tenantId: string, query: { storeId?: string; metric?: string }) {
    return this.insightService.detectAnomalies(tenantId, query.storeId, query.metric)
  }

  getAnomalies(tenantId: string, query: { storeId?: string; status?: string; severity?: string; limit?: number }) {
    return this.insightService.getAnomalies(tenantId, query)
  }

  acknowledgeAnomaly(anomalyId: string) {
    return this.insightService.acknowledgeAnomaly(anomalyId)
  }

  resolveAnomaly(anomalyId: string, _body: { anomalyId: string }) {
    return this.insightService.resolveAnomaly(_body.anomalyId)
  }

  // ── 趋势预测 ──
  generateForecast(tenantId: string, dto: { metric: string; period: string }) {
    return this.insightService.generateForecast(tenantId, dto.metric, dto.period)
  }

  getForecast(trendId: string) {
    return this.insightService.getForecast(trendId)
  }

  // ── 仪表盘 ──
  getDashboardSummary(tenantId: string, query: { storeId?: string }) {
    return this.insightService.getDashboardSummary(tenantId, query.storeId)
  }
}

// ── 测试套件 ─────────────────────────────────────────────────
describe('AiInsightController', () => {
  // ── KPI 看板 ──
  describe('getKPIs()', () => {
    test('returns KPIs for tenant', () => {
      const ctrl = new AiInsightController(makeMockService())
      const result = ctrl.getKPIs('t-001', {})
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
      assert.equal(result[0].name, '日营收')
    })

    test('filters by storeId and category', () => {
      const ctrl = new AiInsightController(makeMockService())
      const result = ctrl.getKPIs('t-001', { storeId: 'store-01', category: 'revenue' })
      assert.ok(result.length > 0)
    })

    test('returns empty for non-existent tenant', () => {
      const ctrl = new AiInsightController(makeMockService())
      assert.equal(ctrl.getKPIs('ghost', {}).length, 0)
    })
  })

  describe('getKPIDetail()', () => {
    test('returns a KPI by id', () => {
      const ctrl = new AiInsightController(makeMockService())
      const detail = ctrl.getKPIDetail('kpi-test-01')
      assert.ok(detail)
      assert.equal(detail.id, 'kpi-test-01')
      assert.equal(detail.name, '日营收')
    })

    test('returns undefined for non-existent id', () => {
      const ctrl = new AiInsightController(makeMockService())
      assert.equal(ctrl.getKPIDetail('no-such-kpi'), undefined)
    })
  })

  // ── 洞察报告 ──
  describe('generateReport()', () => {
    test('generates a revenue report', () => {
      const ctrl = new AiInsightController(makeMockService())
      const report = ctrl.generateReport('t-001', {
        type: 'revenue', storeId: 'store-01',
        periodStart: '2026-06-01', periodEnd: '2026-06-07',
      })
      assert.ok(report)
      assert.equal(report.type, 'revenue')
      assert.equal(report.tenantId, 't-001')
    })

    test('generates report without storeId', () => {
      const ctrl = new AiInsightController(makeMockService())
      const report = ctrl.generateReport('t-001', {
        type: 'member',
        periodStart: '2026-06-01', periodEnd: '2026-06-07',
      })
      assert.ok(report)
      assert.equal(report.type, 'member')
    })
  })

  describe('getReports()', () => {
    test('returns empty when no reports exist', () => {
      const ctrl = new AiInsightController(makeMockService())
      assert.equal(ctrl.getReports('t-001', {}).length, 0)
    })

    test('returns reports after generation', () => {
      const ctrl = new AiInsightController(makeMockService())
      ctrl.generateReport('t-001', { type: 'revenue', periodStart: '2026-06-01', periodEnd: '2026-06-07' })
      ctrl.generateReport('t-001', { type: 'member', periodStart: '2026-06-01', periodEnd: '2026-06-07' })
      assert.equal(ctrl.getReports('t-001', {}).length, 2)
    })

    test('filters by type', () => {
      const ctrl = new AiInsightController(makeMockService())
      ctrl.generateReport('t-001', { type: 'revenue', periodStart: '2026-06-01', periodEnd: '2026-06-07' })
      ctrl.generateReport('t-001', { type: 'member', periodStart: '2026-06-01', periodEnd: '2026-06-07' })
      const revenue = ctrl.getReports('t-001', { type: 'revenue' })
      assert.equal(revenue.length, 1)
      assert.equal(revenue[0].type, 'revenue')
    })

    test('limits results', () => {
      const ctrl = new AiInsightController(makeMockService())
      for (let i = 0; i < 5; i++) {
        ctrl.generateReport('t-001', { type: 'kpi', periodStart: '2026-06-01', periodEnd: '2026-06-07' })
      }
      assert.ok(ctrl.getReports('t-001', { limit: 3 }).length <= 3)
    })

    test('returns empty for non-existent tenant', () => {
      const ctrl = new AiInsightController(makeMockService())
      assert.equal(ctrl.getReports('ghost', {}).length, 0)
    })
  })

  // ── 异常检测 ──
  describe('detectAnomalies()', () => {
    test('detects anomalies', () => {
      const ctrl = new AiInsightController(makeMockService())
      const result = ctrl.detectAnomalies('t-001', {})
      assert.ok(Array.isArray(result))
      assert.ok(result.length > 0)
      assert.equal(result[0].metric, '日营收')
    })
  })

  describe('getAnomalies()', () => {
    test('returns all anomalies for tenant', () => {
      const ctrl = new AiInsightController(makeMockService())
      const result = ctrl.getAnomalies('t-001', {})
      assert.equal(result.length, 3)
    })

    test('filters by status', () => {
      const ctrl = new AiInsightController(makeMockService())
      const open = ctrl.getAnomalies('t-001', { status: 'open' })
      assert.ok(open.every((a: any) => a.status === 'open'))
      const resolved = ctrl.getAnomalies('t-001', { status: 'resolved' })
      assert.ok(resolved.every((a: any) => a.status === 'resolved'))
    })

    test('returns empty for non-existent tenant', () => {
      const ctrl = new AiInsightController(makeMockService())
      assert.equal(ctrl.getAnomalies('ghost', {}).length, 0)
    })
  })

  describe('acknowledgeAnomaly()', () => {
    test('acknowledges an open anomaly', () => {
      const ctrl = new AiInsightController(makeMockService())
      const result = ctrl.acknowledgeAnomaly('anomaly-open-1')
      assert.ok(result)
      assert.equal(result.status, 'acknowledged')
    })

    test('returns undefined for non-existent anomaly', () => {
      const ctrl = new AiInsightController(makeMockService())
      assert.equal(ctrl.acknowledgeAnomaly('non-existent'), undefined)
    })

    test('does not change already resolved anomaly', () => {
      const ctrl = new AiInsightController(makeMockService())
      const result = ctrl.acknowledgeAnomaly('anomaly-resolved-1')
      assert.ok(result)
      assert.equal(result.status, 'resolved')
    })
  })

  describe('resolveAnomaly()', () => {
    test('resolves an open anomaly', () => {
      const ctrl = new AiInsightController(makeMockService())
      const result = ctrl.resolveAnomaly('anomaly-open-1', { anomalyId: 'anomaly-open-1' })
      assert.ok(result)
      assert.equal(result.status, 'resolved')
      assert.ok(result.resolvedAt)
    })

    test('resolves an acknowledged anomaly', () => {
      const ctrl = new AiInsightController(makeMockService())
      const result = ctrl.resolveAnomaly('anomaly-ack-1', { anomalyId: 'anomaly-ack-1' })
      assert.ok(result)
      assert.equal(result.status, 'resolved')
    })

    test('returns undefined for non-existent anomaly', () => {
      const ctrl = new AiInsightController(makeMockService())
      assert.equal(ctrl.resolveAnomaly('ghost', { anomalyId: 'ghost' }), undefined)
    })
  })

  // ── 趋势预测 ──
  describe('generateForecast()', () => {
    test('generates forecast', () => {
      const ctrl = new AiInsightController(makeMockService())
      const trend = ctrl.generateForecast('t-001', { metric: '日营收', period: 'daily' })
      assert.ok(trend)
      assert.equal(trend.metric, '日营收')
      assert.ok(Array.isArray(trend.forecast))
      assert.ok(trend.forecast.length > 0)
      assert.ok(trend.confidence > 0)
    })

    test('generates forecast for any metric', () => {
      const ctrl = new AiInsightController(makeMockService())
      const trend = ctrl.generateForecast('t-001', { metric: 'unknown-metric', period: 'daily' })
      assert.ok(trend)
      assert.equal(trend.metric, 'unknown-metric')
    })
  })

  describe('getForecast()', () => {
    test('returns forecast by id', () => {
      const ctrl = new AiInsightController(makeMockService())
      const created = ctrl.generateForecast('t-001', { metric: '日营收', period: 'daily' })
      const found = ctrl.getForecast(created.id)
      assert.ok(found)
      assert.equal(found.id, created.id)
    })

    test('returns undefined for non-existent trend', () => {
      const ctrl = new AiInsightController(makeMockService())
      assert.equal(ctrl.getForecast('non-existent'), undefined)
    })
  })

  // ── 仪表盘 ──
  describe('getDashboardSummary()', () => {
    test('returns dashboard summary for tenant', () => {
      const ctrl = new AiInsightController(makeMockService())
      const db = ctrl.getDashboardSummary('t-001', {})
      assert.ok(db)
      assert.equal(db.tenantId, 't-001')
      assert.ok(db.today)
      assert.ok(db.thisWeek)
      assert.ok(db.thisMonth)
      assert.equal(typeof db.activeAnomalies, 'number')
    })

    test('includes storeId when provided', () => {
      const ctrl = new AiInsightController(makeMockService())
      assert.equal(ctrl.getDashboardSummary('t-001', { storeId: 'store-01' }).storeId, 'store-01')
    })

    test('returns valid SummaryPeriod shape', () => {
      const ctrl = new AiInsightController(makeMockService())
      const db = ctrl.getDashboardSummary('t-001', {})
      for (const period of [db.today, db.thisWeek, db.thisMonth]) {
        assert.ok(period.label)
        assert.ok(period.start)
        assert.ok(period.end)
        assert.equal(typeof period.revenue, 'number')
        assert.equal(typeof period.members, 'number')
        assert.equal(typeof period.attendance, 'number')
        assert.equal(typeof period.games, 'number')
        assert.equal(typeof period.yoyPercent, 'number')
      }
    })
  })
})
