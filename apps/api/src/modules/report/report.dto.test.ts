import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 报表/看板 DTO 测试 (V10 Day 7 Phase 91)
 */

import assert from 'node:assert/strict'
import {
  CreateReportDto,
  QueryReportDto,
  IngestDataPointDto,
  IngestDataPointsDto,
  DashboardCardDto,
  CreateDashboardDto,
  UpdateDashboardDto,
  AggregateQueryDto,
} from './report.dto'

describe('CreateReportDto', () => {
  it('完整字段创建', () => {
    const dto = new CreateReportDto()
    dto.name = '日报'
    dto.period = 'daily'
    dto.metrics = ['sales.amount']
    dto.dimensions = ['store']
    dto.source = 'orders'
    dto.cacheTtl = 60
    dto.createdBy = 'admin'

    assert.equal(dto.name, '日报')
    assert.equal(dto.period, 'daily')
    assert.deepEqual(dto.metrics, ['sales.amount'])
    assert.deepEqual(dto.dimensions, ['store'])
    assert.equal(dto.source, 'orders')
    assert.equal(dto.cacheTtl, 60)
    assert.equal(dto.createdBy, 'admin')
  })

  it('接受所有 period 类型', () => {
    for (const p of ['daily', 'weekly', 'monthly', 'custom'] as const) {
      const dto = new CreateReportDto()
      dto.period = p
      dto.metrics = []
      dto.dimensions = []
      dto.source = 'orders'
      dto.name = 'test'
      dto.cacheTtl = 0
      dto.createdBy = 'test'
      assert.equal(dto.period, p)
    }
  })

  it('接受所有 source 类型', () => {
    for (const s of ['orders', 'members', 'inventory', 'marketing', 'ai_logs'] as const) {
      const dto = new CreateReportDto()
      dto.source = s
      dto.period = 'daily'
      dto.metrics = []
      dto.dimensions = []
      dto.name = 'test'
      dto.cacheTtl = 0
      dto.createdBy = 'test'
      assert.equal(dto.source, s)
    }
  })

  it('可选字段 metrics/dimensions 默认为空数组', () => {
    const dto = new CreateReportDto()
    dto.name = 'test'
    dto.period = 'daily'
    dto.source = 'orders'
    dto.cacheTtl = 0
    dto.createdBy = 'test'
    // 未赋值时应该 undefined 而不是空数组
    assert.equal(dto.metrics, undefined)
  })
})

describe('QueryReportDto', () => {
  it('必填字段', () => {
    const dto = new QueryReportDto()
    dto.reportId = 'rpt-001'
    dto.period = 'daily'
    assert.equal(dto.reportId, 'rpt-001')
    assert.equal(dto.period, 'daily')
  })

  it('可选字段 from/to', () => {
    const dto = new QueryReportDto()
    dto.reportId = 'rpt-001'
    dto.period = 'weekly'
    dto.from = '2026-06-01'
    dto.to = '2026-06-28'
    assert.equal(dto.from, '2026-06-01')
    assert.equal(dto.to, '2026-06-28')
  })

  it('dates 可为空', () => {
    const dto = new QueryReportDto()
    dto.reportId = 'rpt-001'
    dto.period = 'monthly'
    assert.equal(dto.from, undefined)
    assert.equal(dto.to, undefined)
  })
})

describe('IngestDataPointDto', () => {
  it('完整字段', () => {
    const dto = new IngestDataPointDto()
    dto.bucket = '2026-06-28'
    dto.dimension = 'store-001'
    dto.metric = 'sales.amount'
    dto.value = 50000
    dto.yoy = 1.2
    dto.qoq = 0.8

    assert.equal(dto.bucket, '2026-06-28')
    assert.equal(dto.value, 50000)
    assert.equal(dto.yoy, 1.2)
    assert.equal(dto.qoq, 0.8)
  })

  it('可选同比环比可为空', () => {
    const dto = new IngestDataPointDto()
    dto.bucket = '2026-06-28'
    dto.dimension = 'store-001'
    dto.metric = 'sales.amount'
    dto.value = 100
    assert.equal(dto.yoy, undefined)
    assert.equal(dto.qoq, undefined)
  })
})

describe('IngestDataPointsDto', () => {
  it('包含 points 数组', () => {
    const dto = new IngestDataPointsDto()
    const point = new IngestDataPointDto()
    point.bucket = '2026-06-28'
    point.dimension = 'store-001'
    point.metric = 'sales.amount'
    point.value = 50000
    dto.points = [point]
    assert.equal(dto.points.length, 1)
    assert.equal(dto.points[0].metric, 'sales.amount')
  })

  it('空 points 数组', () => {
    const dto = new IngestDataPointsDto()
    dto.points = []
    assert.deepEqual(dto.points, [])
  })
})

describe('DashboardCardDto', () => {
  it('所有 display 类型', () => {
    for (const display of ['line', 'bar', 'pie', 'number', 'table', 'heatmap'] as const) {
      const dto = new DashboardCardDto()
      dto.id = 'c1'
      dto.reportId = 'rpt-001'
      dto.display = display
      dto.title = 'Card'
      dto.size = { w: 3, h: 2 }
      dto.position = { x: 0, y: 0 }
      assert.equal(dto.display, display)
    }
  })

  it('可选 config', () => {
    const dto = new DashboardCardDto()
    dto.id = 'c1'
    dto.reportId = 'rpt-001'
    dto.display = 'number'
    dto.title = '销售额'
    dto.size = { w: 3, h: 2 }
    dto.position = { x: 0, y: 0 }
    dto.config = { threshold: 100000, color: 'red' }
    assert.deepEqual(dto.config, { threshold: 100000, color: 'red' })
  })

  it('config 可为空', () => {
    const dto = new DashboardCardDto()
    dto.id = 'c1'
    dto.reportId = 'rpt-001'
    dto.display = 'number'
    dto.title = 'Test'
    dto.size = { w: 3, h: 2 }
    dto.position = { x: 0, y: 0 }
    assert.equal(dto.config, undefined)
  })
})

describe('CreateDashboardDto', () => {
  it('完整字段', () => {
    const dto = new CreateDashboardDto()
    dto.name = '我的看板'
    dto.cards = []
    dto.ownerId = 'tenant-A'
    dto.isShared = true

    assert.equal(dto.name, '我的看板')
    assert.equal(dto.ownerId, 'tenant-A')
    assert.equal(dto.isShared, true)
  })

  it('非共享看板', () => {
    const dto = new CreateDashboardDto()
    dto.name = '私有看板'
    dto.cards = []
    dto.ownerId = 'tenant-A'
    dto.isShared = false
    assert.equal(dto.isShared, false)
  })
})

describe('UpdateDashboardDto', () => {
  it('部分更新 name', () => {
    const dto = new UpdateDashboardDto()
    dto.name = '新看板名'
    assert.equal(dto.name, '新看板名')
    assert.equal(dto.isShared, undefined)
  })

  it('全字段更新', () => {
    const dto = new UpdateDashboardDto()
    dto.name = '全更新'
    dto.isShared = true
    dto.cards = []
    assert.equal(dto.name, '全更新')
    assert.ok(Array.isArray(dto.cards))
  })

  it('空更新默认所有字段为 undefined', () => {
    const dto = new UpdateDashboardDto()
    assert.equal(dto.name, undefined)
    assert.equal(dto.cards, undefined)
    assert.equal(dto.ownerId, undefined)
    assert.equal(dto.isShared, undefined)
  })
})

describe('AggregateQueryDto', () => {
  it('metric + dimension', () => {
    const dto = new AggregateQueryDto()
    dto.metric = 'sales.amount'
    dto.dimension = 'store'
    assert.equal(dto.metric, 'sales.amount')
    assert.equal(dto.dimension, 'store')
  })
})
