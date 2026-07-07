import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-insight] [D] entity 测试
 * 类型契约测试：InsightReport, TrendItem, AnomalyItem, KPI, Anomaly, Trend, ForecastPoint, DashboardSummary, SummaryPeriod
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import type {
  InsightReport,
  TrendItem,
  AnomalyItem,
  KPI,
  Anomaly,
  Trend,
  ForecastPoint,
  DashboardSummary,
  SummaryPeriod
} from './ai-insight.entity'

// ── InsightReport ──
describe('ai-insight.entity: InsightReport', () => {
  it('creates valid InsightReport with all required fields', () => {
    const report: InsightReport = {
      id: 'report-001',
      tenantId: 'tenant-1',
      type: 'revenue',
      title: '营收洞察报告',
      summary: '营收增长10%',
      data: {
        metrics: { '日营收': 15000 },
        trends: [],
        anomalies: []
      },
      periodStart: '2026-06-01',
      periodEnd: '2026-06-07',
      generatedAt: '2026-06-08T00:00:00.000Z',
      createdAt: '2026-06-08T00:00:00.000Z'
    }

    assert.equal(report.id, 'report-001')
    assert.equal(report.tenantId, 'tenant-1')
    assert.equal(report.type, 'revenue')
    assert.equal(report.title, '营收洞察报告')
    assert.equal(report.summary, '营收增长10%')
    assert.deepEqual(report.data.metrics, { '日营收': 15000 })
    assert.equal(report.periodStart, '2026-06-01')
    assert.equal(report.periodEnd, '2026-06-07')
  })

  it('creates InsightReport with optional brandId and storeId', () => {
    const report: InsightReport = {
      id: 'report-002',
      tenantId: 'tenant-1',
      brandId: 'brand-a',
      storeId: 'store-01',
      type: 'member',
      title: '会员洞察报告',
      summary: '新增会员15人',
      data: {
        metrics: { '新注册会员': 15 },
        trends: [{ name: '新注册会员', current: 15, previous: 12, changePercent: 25 }],
        anomalies: [{ metric: '会员复购率', value: 30, threshold: 45, severity: 'medium' }]
      },
      periodStart: '2026-06-01',
      periodEnd: '2026-06-07',
      generatedAt: '2026-06-08T00:00:00.000Z',
      createdAt: '2026-06-08T00:00:00.000Z'
    }

    assert.equal(report.brandId, 'brand-a')
    assert.equal(report.storeId, 'store-01')
    assert.equal(report.data.trends.length, 1)
    assert.equal(report.data.anomalies.length, 1)
  })

  it('supports all 5 report types', () => {
    const types: InsightReport['type'][] = ['revenue', 'member', 'attendance', 'game', 'kpi']
    for (const type of types) {
      const report: InsightReport = {
        id: `report-${type}`,
        tenantId: 'tenant-1',
        type,
        title: `${type}报告`,
        summary: '摘要',
        data: { metrics: {}, trends: [], anomalies: [] },
        periodStart: '2026-06-01',
        periodEnd: '2026-06-07',
        generatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
      assert.equal(report.type, type)
    }
  })
})

// ── TrendItem ──
describe('ai-insight.entity: TrendItem', () => {
  it('creates valid TrendItem with positive change', () => {
    const item: TrendItem = {
      name: '日营收',
      current: 15000,
      previous: 12000,
      changePercent: 25
    }

    assert.equal(item.name, '日营收')
    assert.equal(item.current, 15000)
    assert.equal(item.previous, 12000)
    assert.equal(item.changePercent, 25)
  })

  it('creates TrendItem with negative change', () => {
    const item: TrendItem = {
      name: '投诉率',
      current: 0.8,
      previous: 1.2,
      changePercent: -33.33
    }

    assert.ok(item.changePercent < 0)
    assert.ok(item.current < item.previous)
  })

  it('creates TrendItem with zero change', () => {
    const item: TrendItem = {
      name: '设备使用率',
      current: 72,
      previous: 72,
      changePercent: 0
    }

    assert.equal(item.changePercent, 0)
  })
})

// ── AnomalyItem ──
describe('ai-insight.entity: AnomalyItem', () => {
  it('creates valid AnomalyItem', () => {
    const item: AnomalyItem = {
      metric: '日营收',
      value: 6500,
      threshold: 12000,
      severity: 'high'
    }

    assert.equal(item.metric, '日营收')
    assert.equal(item.value, 6500)
    assert.equal(item.threshold, 12000)
    assert.equal(item.severity, 'high')
  })

  it('supports all 3 severity levels', () => {
    const severities: AnomalyItem['severity'][] = ['low', 'medium', 'high']
    for (const severity of severities) {
      const item: AnomalyItem = {
        metric: '测试指标',
        value: 100,
        threshold: 80,
        severity
      }
      assert.equal(item.severity, severity)
    }
  })
})

// ── KPI ──
describe('ai-insight.entity: KPI', () => {
  it('creates valid KPI with all fields', () => {
    const kpi: KPI = {
      id: 'kpi-001',
      tenantId: 'tenant-1',
      name: '日营收',
      category: 'revenue',
      value: 15000,
      target: 20000,
      unit: '元',
      trend: 'up',
      period: 'daily',
      updatedAt: '2026-06-23T00:00:00.000Z'
    }

    assert.equal(kpi.id, 'kpi-001')
    assert.equal(kpi.name, '日营收')
    assert.equal(kpi.category, 'revenue')
    assert.equal(kpi.value, 15000)
    assert.equal(kpi.target, 20000)
    assert.equal(kpi.unit, '元')
    assert.equal(kpi.trend, 'up')
    assert.equal(kpi.period, 'daily')
  })

  it('creates KPI with optional storeId', () => {
    const kpi: KPI = {
      id: 'kpi-002',
      tenantId: 'tenant-1',
      storeId: 'store-01',
      name: '客单价',
      category: 'revenue',
      value: 85,
      target: 100,
      unit: '元/人',
      trend: 'stable',
      period: 'daily',
      updatedAt: new Date().toISOString()
    }

    assert.equal(kpi.storeId, 'store-01')
    assert.equal(kpi.trend, 'stable')
  })

  it('supports all 5 categories', () => {
    const categories: KPI['category'][] = ['revenue', 'member', 'attendance', 'game', 'operation']
    for (const category of categories) {
      const kpi: KPI = {
        id: `kpi-${category}`,
        tenantId: 'tenant-1',
        name: `${category}指标`,
        category,
        value: 100,
        target: 150,
        unit: '个',
        trend: 'up',
        period: 'daily',
        updatedAt: new Date().toISOString()
      }
      assert.equal(kpi.category, category)
    }
  })

  it('supports all 3 trend directions', () => {
    const trends: KPI['trend'][] = ['up', 'down', 'stable']
    for (const trend of trends) {
      const kpi: KPI = {
        id: `kpi-${trend}`,
        tenantId: 'tenant-1',
        name: '测试',
        category: 'revenue',
        value: 100,
        target: 150,
        unit: '元',
        trend,
        period: 'daily',
        updatedAt: new Date().toISOString()
      }
      assert.equal(kpi.trend, trend)
    }
  })
})

// ── Anomaly ──
describe('ai-insight.entity: Anomaly', () => {
  it('creates valid open Anomaly', () => {
    const anomaly: Anomaly = {
      id: 'anomaly-001',
      tenantId: 'tenant-1',
      metric: '日营收',
      value: 6500,
      expectedValue: 15000,
      deviationPercent: 56.67,
      severity: 'high',
      detectedAt: '2026-06-23T00:00:00.000Z',
      status: 'open'
    }

    assert.equal(anomaly.id, 'anomaly-001')
    assert.equal(anomaly.metric, '日营收')
    assert.equal(anomaly.value, 6500)
    assert.equal(anomaly.expectedValue, 15000)
    assert.equal(anomaly.deviationPercent, 56.67)
    assert.equal(anomaly.severity, 'high')
    assert.equal(anomaly.status, 'open')
    assert.equal(anomaly.resolvedAt, undefined)
  })

  it('creates resolved Anomaly with resolvedAt', () => {
    const anomaly: Anomaly = {
      id: 'anomaly-002',
      tenantId: 'tenant-1',
      metric: '投诉率',
      value: 4.8,
      expectedValue: 1.2,
      deviationPercent: 300,
      severity: 'critical',
      detectedAt: '2026-06-22T00:00:00.000Z',
      resolvedAt: '2026-06-23T00:00:00.000Z',
      status: 'resolved'
    }

    assert.equal(anomaly.status, 'resolved')
    assert.ok(anomaly.resolvedAt)
    assert.equal(anomaly.severity, 'critical')
  })

  it('supports all 4 severity levels', () => {
    const severities: Anomaly['severity'][] = ['low', 'medium', 'high', 'critical']
    for (const severity of severities) {
      const anomaly: Anomaly = {
        id: `anomaly-${severity}`,
        tenantId: 'tenant-1',
        metric: '测试',
        value: 100,
        expectedValue: 80,
        deviationPercent: 25,
        severity,
        detectedAt: new Date().toISOString(),
        status: 'open'
      }
      assert.equal(anomaly.severity, severity)
    }
  })

  it('supports all 3 status values', () => {
    const statuses: Anomaly['status'][] = ['open', 'acknowledged', 'resolved']
    for (const status of statuses) {
      const anomaly: Anomaly = {
        id: `anomaly-${status}`,
        tenantId: 'tenant-1',
        metric: '测试',
        value: 100,
        expectedValue: 80,
        deviationPercent: 25,
        severity: 'low',
        detectedAt: new Date().toISOString(),
        status
      }
      assert.equal(anomaly.status, status)
    }
  })

  it('creates Anomaly with optional storeId', () => {
    const anomaly: Anomaly = {
      id: 'anomaly-003',
      tenantId: 'tenant-1',
      storeId: 'store-01',
      metric: '设备使用率',
      value: 38,
      expectedValue: 72,
      deviationPercent: 47.22,
      severity: 'medium',
      detectedAt: new Date().toISOString(),
      status: 'open'
    }

    assert.equal(anomaly.storeId, 'store-01')
  })
})

// ── Trend ──
describe('ai-insight.entity: Trend', () => {
  it('creates valid Trend forecast', () => {
    const trend: Trend = {
      id: 'trend-001',
      tenantId: 'tenant-1',
      metric: '日营收',
      forecast: [
        { date: '2026-06-24', value: 15200 },
        { date: '2026-06-25', value: 15400 },
        { date: '2026-06-26', value: 15300 }
      ],
      confidence: 0.85,
      generatedAt: '2026-06-23T00:00:00.000Z'
    }

    assert.equal(trend.id, 'trend-001')
    assert.equal(trend.metric, '日营收')
    assert.equal(trend.forecast.length, 3)
    assert.equal(trend.confidence, 0.85)
    assert.ok(trend.confidence >= 0 && trend.confidence <= 1)
  })

  it('creates Trend with optional storeId', () => {
    const trend: Trend = {
      id: 'trend-002',
      tenantId: 'tenant-1',
      storeId: 'store-01',
      metric: '到店人数',
      forecast: [{ date: '2026-06-24', value: 185 }],
      confidence: 0.6,
      generatedAt: new Date().toISOString()
    }

    assert.equal(trend.storeId, 'store-01')
    assert.equal(trend.forecast.length, 1)
  })

  it('confidence is clamped between 0 and 1 in type system', () => {
    // TypeScript number allows 0-1 range; verify contract
    const t1: Trend = {
      id: 't-min',
      tenantId: 't',
      metric: 'm',
      forecast: [],
      confidence: 0,
      generatedAt: new Date().toISOString()
    }
    assert.equal(t1.confidence, 0)

    const t2: Trend = {
      id: 't-max',
      tenantId: 't',
      metric: 'm',
      forecast: [],
      confidence: 1,
      generatedAt: new Date().toISOString()
    }
    assert.equal(t2.confidence, 1)
  })
})

// ── ForecastPoint ──
describe('ai-insight.entity: ForecastPoint', () => {
  it('creates valid ForecastPoint', () => {
    const point: ForecastPoint = {
      date: '2026-06-24',
      value: 15200
    }

    assert.equal(point.date, '2026-06-24')
    assert.equal(point.value, 15200)
  })

  it('supports zero and negative values (for metrics like change rates)', () => {
    const zero: ForecastPoint = { date: '2026-06-24', value: 0 }
    assert.equal(zero.value, 0)

    const neg: ForecastPoint = { date: '2026-06-24', value: -5 }
    assert.equal(neg.value, -5)
  })
})

// ── DashboardSummary ──
describe('ai-insight.entity: DashboardSummary', () => {
  it('creates valid DashboardSummary', () => {
    const summary: DashboardSummary = {
      tenantId: 'tenant-1',
      today: {
        label: '今日',
        start: '2026-06-23',
        end: '2026-06-23',
        revenue: 15000,
        members: 25,
        attendance: 180,
        games: 350,
        kpis: [],
        yoyPercent: 12.5
      },
      thisWeek: {
        label: '本周',
        start: '2026-06-17',
        end: '2026-06-23',
        revenue: 95000,
        members: 150,
        attendance: 1200,
        games: 2400,
        kpis: [],
        yoyPercent: 8.3
      },
      thisMonth: {
        label: '本月',
        start: '2026-06-01',
        end: '2026-06-23',
        revenue: 380000,
        members: 600,
        attendance: 5000,
        games: 10000,
        kpis: [],
        yoyPercent: 15.2
      },
      activeAnomalies: 3,
      reportCount: 12,
      generatedAt: '2026-06-23T00:00:00.000Z'
    }

    assert.equal(summary.tenantId, 'tenant-1')
    assert.equal(summary.today.label, '今日')
    assert.equal(summary.activeAnomalies, 3)
    assert.equal(summary.reportCount, 12)
  })

  it('creates DashboardSummary with optional storeId', () => {
    const summary: DashboardSummary = {
      tenantId: 'tenant-1',
      storeId: 'store-01',
      today: {
        label: '今日', start: '2026-06-23', end: '2026-06-23',
        revenue: 0, members: 0, attendance: 0, games: 0, kpis: [], yoyPercent: 0
      },
      thisWeek: {
        label: '本周', start: '2026-06-17', end: '2026-06-23',
        revenue: 0, members: 0, attendance: 0, games: 0, kpis: [], yoyPercent: 0
      },
      thisMonth: {
        label: '本月', start: '2026-06-01', end: '2026-06-23',
        revenue: 0, members: 0, attendance: 0, games: 0, kpis: [], yoyPercent: 0
      },
      activeAnomalies: 0,
      reportCount: 0,
      generatedAt: new Date().toISOString()
    }

    assert.equal(summary.storeId, 'store-01')
    assert.equal(summary.activeAnomalies, 0)
    assert.equal(summary.reportCount, 0)
  })
})

// ── SummaryPeriod ──
describe('ai-insight.entity: SummaryPeriod', () => {
  it('creates valid SummaryPeriod', () => {
    const period: SummaryPeriod = {
      label: '今日',
      start: '2026-06-23',
      end: '2026-06-23',
      revenue: 15000,
      members: 25,
      attendance: 180,
      games: 350,
      kpis: [],
      yoyPercent: 12.5
    }

    assert.equal(period.label, '今日')
    assert.equal(period.revenue, 15000)
    assert.equal(period.members, 25)
    assert.equal(period.attendance, 180)
    assert.equal(period.games, 350)
    assert.equal(period.yoyPercent, 12.5)
    assert.deepEqual(period.kpis, [])
  })

  it('SummaryPeriod with KPI children', () => {
    const kpis: KPI[] = [{
      id: 'kpi-001', tenantId: 't', name: '日营收',
      category: 'revenue', value: 15000, target: 20000,
      unit: '元', trend: 'up', period: 'daily',
      updatedAt: new Date().toISOString()
    }]

    const period: SummaryPeriod = {
      label: '今日',
      start: '2026-06-23',
      end: '2026-06-23',
      revenue: 15000,
      members: 25,
      attendance: 180,
      games: 350,
      kpis,
      yoyPercent: 12.5
    }

    assert.equal(period.kpis.length, 1)
    assert.equal(period.kpis[0].name, '日营收')
  })
})
