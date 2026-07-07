import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * report.contract.test.ts - 报表/看板合约测试
 */

import assert from 'node:assert/strict'
import {
  toReportDefinitionContract,
  toReportDataPointContract,
  toDashboardCardContract,
  toDashboardLayoutContract,
  toReportQueryResponseContract,
} from './report.contract'
import type {
  ReportDefinition,
  ReportDataPoint,
  DashboardCard,
  DashboardLayout,
  ReportQueryResponse,
} from './report.entity'

// ─── toReportDefinitionContract ───

describe('toReportDefinitionContract()', () => {
  const fullDef: ReportDefinition = {
    id: 'rpt-001',
    name: '销售日报',
    period: 'daily',
    metrics: ['sales.amount', 'sales.count'],
    dimensions: ['store'],
    source: 'orders',
    cacheTtl: 60,
    createdBy: 'admin',
    createdAt: '2026-06-29T06:00:00Z',
    updatedAt: '2026-06-29T06:00:00Z',
  }

  it('maps full ReportDefinition to contract', () => {
    const contract = toReportDefinitionContract(fullDef)

    assert.equal(contract.id, 'rpt-001')
    assert.equal(contract.name, '销售日报')
    assert.equal(contract.period, 'daily')
    assert.equal(contract.metrics.length, 2)
    assert.ok(contract.metrics.includes('sales.amount'))
    assert.equal(contract.source, 'orders')
    assert.equal(contract.cacheTtl, 60)
    assert.equal(contract.createdBy, 'admin')
  })

  it('maps different metric combinations', () => {
    const def: ReportDefinition = {
      id: 'rpt-002',
      name: 'AI 使用周报',
      period: 'weekly',
      metrics: ['ai.tokens', 'ai.latency'],
      dimensions: ['store', 'tenant'],
      source: 'ai_logs',
      cacheTtl: 300,
      createdBy: 'system',
      createdAt: '2026-06-29T06:00:00Z',
      updatedAt: '2026-06-29T06:00:00Z',
    }

    const contract = toReportDefinitionContract(def)

    assert.equal(contract.period, 'weekly')
    assert.equal(contract.source, 'ai_logs')
    assert.equal(contract.cacheTtl, 300)
    assert.deepEqual(contract.metrics, ['ai.tokens', 'ai.latency'])
  })

  it('handles monthly period', () => {
    const def: ReportDefinition = {
      id: 'rpt-monthly',
      name: '会员月报',
      period: 'monthly',
      metrics: ['member.new', 'member.active'],
      dimensions: ['member_tier'],
      source: 'members',
      cacheTtl: 3600,
      createdBy: 'manager',
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
    }

    const contract = toReportDefinitionContract(def)

    assert.equal(contract.period, 'monthly')
    assert.equal(contract.source, 'members')
    assert.equal(contract.cacheTtl, 3600)
  })

  it('returns independent copy', () => {
    const contract1 = toReportDefinitionContract(fullDef)
    const contract2 = toReportDefinitionContract(fullDef)

    assert.deepStrictEqual(contract1, contract2)
    // Should not share reference
    contract1.metrics.push('inventory.turnover')
    assert.equal(contract1.metrics.length, 3)
    assert.equal(contract2.metrics.length, 2)
  })

  it('handles inventory source', () => {
    const def: ReportDefinition = {
      id: 'rpt-inv',
      name: '库存周报',
      period: 'weekly',
      metrics: ['inventory.turnover'],
      dimensions: ['category', 'product'],
      source: 'inventory',
      cacheTtl: 600,
      createdBy: 'warehouse',
      createdAt: '2026-06-29T06:00:00Z',
      updatedAt: '2026-06-29T06:00:00Z',
    }

    const contract = toReportDefinitionContract(def)
    assert.equal(contract.source, 'inventory')
    assert.deepEqual(contract.dimensions, ['category', 'product'])
  })

  it('handles marketing source with ROI metric', () => {
    const def: ReportDefinition = {
      id: 'rpt-mkt',
      name: '营销 ROI 报表',
      period: 'monthly',
      metrics: ['marketing.roi'],
      dimensions: ['campaign'],
      source: 'marketing',
      cacheTtl: 120,
      createdBy: 'marketing_team',
      createdAt: '2026-06-29T06:00:00Z',
      updatedAt: '2026-06-29T06:00:00Z',
    }

    const contract = toReportDefinitionContract(def)
    assert.equal(contract.source, 'marketing')
    assert.ok(contract.metrics.includes('marketing.roi'))
    assert.equal(contract.cacheTtl, 120)
  })

  it('handles custom period', () => {
    const def: ReportDefinition = {
      id: 'rpt-custom',
      name: '自定义分析',
      period: 'custom',
      metrics: ['sales.amount', 'member.new'],
      dimensions: ['store', 'brand'],
      source: 'orders',
      cacheTtl: 0,
      createdBy: 'analyst',
      createdAt: '2026-06-29T06:00:00Z',
      updatedAt: '2026-06-29T06:00:00Z',
    }

    const contract = toReportDefinitionContract(def)
    assert.equal(contract.period, 'custom')
    assert.equal(contract.cacheTtl, 0)
  })
})

// ─── toReportDataPointContract ───

describe('toReportDataPointContract()', () => {
  it('maps full data point with yoy and qoq', () => {
    const dp: ReportDataPoint = {
      bucket: '2026-06-29',
      dimension: 'store-001',
      metric: 'sales.amount',
      value: 85000,
      yoy: 12.5,
      qoq: 3.2,
    }

    const contract = toReportDataPointContract(dp)

    assert.equal(contract.bucket, '2026-06-29')
    assert.equal(contract.dimension, 'store-001')
    assert.equal(contract.metric, 'sales.amount')
    assert.equal(contract.value, 85000)
    assert.equal(contract.yoy, 12.5)
    assert.equal(contract.qoq, 3.2)
  })

  it('maps data point without optional yoy/qoq', () => {
    const dp: ReportDataPoint = {
      bucket: '2026-W26',
      dimension: 'member_tier-gold',
      metric: 'member.active',
      value: 320,
    }

    const contract = toReportDataPointContract(dp)

    assert.equal(contract.bucket, '2026-W26')
    assert.equal(contract.dimension, 'member_tier-gold')
    assert.equal(contract.metric, 'member.active')
    assert.equal(contract.value, 320)
    assert.equal(contract.yoy, undefined)
    assert.equal(contract.qoq, undefined)
  })

  it('handles zero value', () => {
    const dp: ReportDataPoint = {
      bucket: '2026-06-29',
      dimension: 'store-002',
      metric: 'inventory.turnover',
      value: 0,
    }

    const contract = toReportDataPointContract(dp)
    assert.equal(contract.value, 0)
  })

  it('handles negative value', () => {
    const dp: ReportDataPoint = {
      bucket: '2026-06-29',
      dimension: 'campaign-summer',
      metric: 'marketing.roi',
      value: -0.5,
      qoq: -0.1,
    }

    const contract = toReportDataPointContract(dp)
    assert.equal(contract.value, -0.5)
    assert.equal(contract.qoq, -0.1)
  })

  it('handles monthly bucket format', () => {
    const dp: ReportDataPoint = {
      bucket: '2026-06',
      dimension: 'brand-A',
      metric: 'member.new',
      value: 1500,
      yoy: 8.0,
    }

    const contract = toReportDataPointContract(dp)
    assert.equal(contract.bucket, '2026-06')
    assert.equal(contract.yoy, 8.0)
  })
})

// ─── toDashboardCardContract ───

describe('toDashboardCardContract()', () => {
  it('maps full card with config', () => {
    const card: DashboardCard = {
      id: 'c1',
      reportId: 'rpt-001',
      display: 'line',
      title: '销售趋势',
      size: { w: 6, h: 4 },
      position: { x: 0, y: 0 },
      config: { color: 'blue', threshold: 100000 },
    }

    const contract = toDashboardCardContract(card)

    assert.equal(contract.id, 'c1')
    assert.equal(contract.reportId, 'rpt-001')
    assert.equal(contract.display, 'line')
    assert.equal(contract.title, '销售趋势')
    assert.deepEqual(contract.size, { w: 6, h: 4 })
    assert.deepEqual(contract.position, { x: 0, y: 0 })
    assert.deepEqual(contract.config, { color: 'blue', threshold: 100000 })
  })

  it('maps card without config', () => {
    const card: DashboardCard = {
      id: 'c2',
      reportId: 'rpt-002',
      display: 'number',
      title: '今日销售额',
      size: { w: 3, h: 2 },
      position: { x: 0, y: 0 },
    }

    const contract = toDashboardCardContract(card)

    assert.equal(contract.display, 'number')
    assert.equal(contract.config, undefined)
  })

  it('maps bar display type', () => {
    const card: DashboardCard = {
      id: 'c3',
      reportId: 'rpt-003',
      display: 'bar',
      title: 'AI 使用量',
      size: { w: 6, h: 4 },
      position: { x: 0, y: 0 },
    }

    const contract = toDashboardCardContract(card)
    assert.equal(contract.display, 'bar')
  })

  it('maps pie display type', () => {
    const card: DashboardCard = {
      id: 'c4',
      reportId: 'rpt-004',
      display: 'pie',
      title: '销售占比',
      size: { w: 4, h: 4 },
      position: { x: 6, y: 0 },
    }

    const contract = toDashboardCardContract(card)
    assert.equal(contract.display, 'pie')
  })

  it('maps table display type', () => {
    const card: DashboardCard = {
      id: 'c5',
      reportId: 'rpt-005',
      display: 'table',
      title: '明细表',
      size: { w: 12, h: 6 },
      position: { x: 0, y: 4 },
    }

    const contract = toDashboardCardContract(card)
    assert.equal(contract.display, 'table')
  })

  it('returns independent copy of size/position', () => {
    const card: DashboardCard = {
      id: 'c6',
      reportId: 'rpt-006',
      display: 'heatmap',
      title: '热力图',
      size: { w: 6, h: 4 },
      position: { x: 0, y: 0 },
    }

    const contract = toDashboardCardContract(card)
    assert.deepStrictEqual(contract, {
      id: 'c6',
      reportId: 'rpt-006',
      display: 'heatmap',
      title: '热力图',
      size: { w: 6, h: 4 },
      position: { x: 0, y: 0 },
      config: undefined,
    })
  })
})

// ─── toDashboardLayoutContract ───

describe('toDashboardLayoutContract()', () => {
  const layout: DashboardLayout = {
    id: 'dash-001',
    name: '总览看板',
    cards: [
      {
        id: 'c1', reportId: 'rpt-001', display: 'number', title: '今日销售额',
        size: { w: 3, h: 2 }, position: { x: 0, y: 0 },
      },
      {
        id: 'c2', reportId: 'rpt-002', display: 'line', title: '销售趋势',
        size: { w: 6, h: 4 }, position: { x: 3, y: 0 },
      },
    ],
    ownerId: 'tenant-A',
    isShared: true,
    createdAt: '2026-06-29T06:00:00Z',
    updatedAt: '2026-06-29T06:00:00Z',
  }

  it('maps full DashboardLayout to contract', () => {
    const contract = toDashboardLayoutContract(layout)

    assert.equal(contract.id, 'dash-001')
    assert.equal(contract.name, '总览看板')
    assert.equal(contract.ownerId, 'tenant-A')
    assert.equal(contract.isShared, true)
    assert.equal(contract.cards.length, 2)
  })

  it('maps cards via toDashboardCardContract', () => {
    const contract = toDashboardCardContract(layout.cards[0])

    assert.equal(contract.id, 'c1')
    assert.equal(contract.display, 'number')
    assert.equal(contract.title, '今日销售额')
  })

  it('maps non-shared dashboard', () => {
    const privateLayout: DashboardLayout = {
      id: 'dash-private',
      name: '个人看板',
      cards: [],
      ownerId: 'user-001',
      isShared: false,
      createdAt: '2026-06-29T06:00:00Z',
      updatedAt: '2026-06-29T06:00:00Z',
    }

    const contract = toDashboardLayoutContract(privateLayout)
    assert.equal(contract.isShared, false)
    assert.equal(contract.cards.length, 0)
  })

  it('returns independent copy', () => {
    const contract1 = toDashboardLayoutContract(layout)
    const contract2 = toDashboardLayoutContract(layout)

    assert.deepStrictEqual(contract1, contract2)
    // Modify one should not affect the other
    contract1.name = '修改后'
    assert.notEqual(contract1.name, contract2.name)
  })

  it('handles layout with many cards', () => {
    const manyCards: DashboardLayout = {
      id: 'dash-many',
      name: '完整看板',
      cards: [
        { id: 'c1', reportId: 'rpt-1', display: 'number', title: 'A', size: { w: 3, h: 2 }, position: { x: 0, y: 0 } },
        { id: 'c2', reportId: 'rpt-2', display: 'line', title: 'B', size: { w: 6, h: 4 }, position: { x: 3, y: 0 } },
        { id: 'c3', reportId: 'rpt-3', display: 'bar', title: 'C', size: { w: 3, h: 4 }, position: { x: 9, y: 0 } },
        { id: 'c4', reportId: 'rpt-4', display: 'pie', title: 'D', size: { w: 4, h: 3 }, position: { x: 0, y: 4 } },
      ],
      ownerId: 'tenant-B',
      isShared: true,
      createdAt: '2026-06-29T06:00:00Z',
      updatedAt: '2026-06-29T06:00:00Z',
    }

    const contract = toDashboardLayoutContract(manyCards)
    assert.equal(contract.cards.length, 4)
    assert.equal(contract.cards[3].display, 'pie')
  })
})

// ─── toReportQueryResponseContract ───

describe('toReportQueryResponseContract()', () => {
  const response: ReportQueryResponse = {
    reportId: 'rpt-001',
    period: 'daily',
    generatedAt: '2026-06-29T06:00:00Z',
    data: [
      { bucket: '2026-06-29', dimension: 'store-001', metric: 'sales.amount', value: 85000 },
      { bucket: '2026-06-29', dimension: 'store-002', metric: 'sales.amount', value: 62000 },
    ],
    totalPoints: 2,
  }

  it('maps full response to contract', () => {
    const contract = toReportQueryResponseContract(response)

    assert.equal(contract.reportId, 'rpt-001')
    assert.equal(contract.period, 'daily')
    assert.ok(Date.parse(contract.generatedAt) > 0)
    assert.equal(contract.data.length, 2)
    assert.equal(contract.totalPoints, 2)
  })

  it('maps data points via toReportDataPointContract', () => {
    const contract = toReportQueryResponseContract(response)

    assert.equal(contract.data[0].bucket, '2026-06-29')
    assert.equal(contract.data[0].value, 85000)
    assert.equal(contract.data[1].dimension, 'store-002')
    assert.equal(contract.data[1].value, 62000)
  })

  it('handles empty data array', () => {
    const empty: ReportQueryResponse = {
      reportId: 'rpt-empty',
      period: 'daily',
      generatedAt: '2026-06-29T06:00:00Z',
      data: [],
      totalPoints: 0,
    }

    const contract = toReportQueryResponseContract(empty)
    assert.equal(contract.data.length, 0)
    assert.equal(contract.totalPoints, 0)
  })

  it('handles weekly period in response', () => {
    const weekly: ReportQueryResponse = {
      reportId: 'rpt-weekly',
      period: 'weekly',
      generatedAt: '2026-06-29T06:00:00Z',
      data: [
        { bucket: '2026-W25', dimension: 'store-001', metric: 'sales.count', value: 700 },
      ],
      totalPoints: 1,
    }

    const contract = toReportQueryResponseContract(weekly)
    assert.equal(contract.period, 'weekly')
    assert.equal(contract.data[0].bucket, '2026-W25')
  })

  it('returns independent data copy', () => {
    const contract1 = toReportQueryResponseContract(response)
    const contract2 = toReportQueryResponseContract(response)

    assert.deepStrictEqual(contract1, contract2)
    contract1.data.push({ bucket: 'extra', dimension: 'store', metric: 'sales.amount', value: 100 })
    assert.equal(contract1.data.length, 3)
    assert.equal(contract2.data.length, 2)
  })

  it('maps monthly period response with yoy/qoq on data points', () => {
    const monthly: ReportQueryResponse = {
      reportId: 'rpt-monthly-member',
      period: 'monthly',
      generatedAt: '2026-06-01T00:00:00Z',
      data: [
        { bucket: '2026-06', dimension: 'member_tier-gold', metric: 'member.new', value: 500, yoy: 15.0, qoq: 2.5 },
        { bucket: '2026-06', dimension: 'member_tier-silver', metric: 'member.new', value: 300, yoy: 10.0 },
      ],
      totalPoints: 2,
    }

    const contract = toReportQueryResponseContract(monthly)
    assert.equal(contract.period, 'monthly')
    assert.equal(contract.data[0].yoy, 15.0)
    assert.equal(contract.data[0].qoq, 2.5)
    assert.equal(contract.data[1].yoy, 10.0)
    assert.equal(contract.data[1].qoq, undefined)
  })

  it('maps response with custom period', () => {
    const custom: ReportQueryResponse = {
      reportId: 'rpt-custom-analytics',
      period: 'custom',
      generatedAt: '2026-06-29T06:00:00Z',
      data: [
        { bucket: '2026-06-29', dimension: 'brand-A', metric: 'marketing.roi', value: 2.5 },
      ],
      totalPoints: 1,
    }

    const contract = toReportQueryResponseContract(custom)
    assert.equal(contract.period, 'custom')
    assert.equal(contract.data[0].metric, 'marketing.roi')
  })
})
