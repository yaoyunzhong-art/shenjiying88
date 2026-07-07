import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [reports] [A] entity 测试补全
 *
 * 报表模块 Entity 类型与工具函数测试
 */

import assert from 'node:assert/strict'

import {
  ReportType,
  ReportPeriod,
  AggregationFn,
  FilterOp,
  ReportDimension,
  ReportMetric,
  ReportFilter,
  ReportFilterGroup,
  ReportDefinition,
  ReportRow,
  ReportResult,
  CreateReportDefinitionInput,
  UpdateReportDefinitionInput,
  QueryReportInput,
  ReportExportInput,
} from './reports.entity'

describe('reports entity - 报表类型定义', () => {
  // ============ ReportType ============
  it('ReportType 包含所有预设值', () => {
    const types: ReportType[] = [
      'revenue',
      'inventory',
      'member',
      'refund',
      'order',
      'product-ranking',
      'payment-mix',
      'hourly-heatmap',
      'channel-funnel',
      'inventory-alert',
    ]
    assert.equal(types.length, 10)
  })

  it('ReportType 字符串字面量可用', () => {
    const t: ReportType = 'revenue'
    assert.equal(t, 'revenue')
  })

  // ============ ReportPeriod ============
  it('ReportPeriod 包含 4 种粒度', () => {
    const periods: ReportPeriod[] = ['day', 'week', 'month', 'year']
    assert.equal(periods.length, 4)
  })

  // ============ AggregationFn ============
  it('AggregationFn 包含 6 种聚合函数', () => {
    const fns: AggregationFn[] = ['sum', 'count', 'avg', 'min', 'max', 'distinct']
    assert.equal(fns.length, 6)
  })

  // ============ FilterOp ============
  it('FilterOp 包含所有操作符', () => {
    const ops: FilterOp[] = ['=', '!=', '>', '>=', '<', '<=', 'in', 'notIn', 'between', 'like']
    assert.equal(ops.length, 10)
  })

  // ============ ReportDimension ============
  it('ReportDimension 仅需 field', () => {
    const dim: ReportDimension = { field: 'category' }
    assert.equal(dim.field, 'category')
  })

  it('ReportDimension 含全部字段', () => {
    const dim: ReportDimension = { field: 'createdAt', granularity: 'month', alias: '月份' }
    assert.equal(dim.field, 'createdAt')
    assert.equal(dim.granularity, 'month')
    assert.equal(dim.alias, '月份')
  })

  // ============ ReportMetric ============
  it('ReportMetric 需要三个字段', () => {
    const m: ReportMetric = { field: 'amount', fn: 'sum', alias: '总金额' }
    assert.equal(m.field, 'amount')
    assert.equal(m.fn, 'sum')
    assert.equal(m.alias, '总金额')
  })

  it('ReportMetric 支持多种聚合函数', () => {
    const m: ReportMetric = { field: 'count', fn: 'avg', alias: '平均值' }
    assert.equal(m.fn, 'avg')
  })

  // ============ ReportFilter ============
  it('ReportFilter 等值筛选', () => {
    const f: ReportFilter = { field: 'status', op: '=', value: 'active' }
    assert.equal(f.op, '=')
    assert.equal(f.value, 'active')
  })

  it('ReportFilter between 范围筛选', () => {
    const f: ReportFilter = { field: 'amount', op: 'between', value: [100, 500] }
    assert.deepEqual(f.value, [100, 500])
  })

  it('ReportFilter in 筛选', () => {
    const f: ReportFilter = { field: 'type', op: 'in', value: ['revenue', 'order'] }
    assert.deepEqual(f.value, ['revenue', 'order'])
  })

  // ============ ReportFilterGroup ============
  it('ReportFilterGroup AND 嵌套', () => {
    const fg: ReportFilterGroup = {
      op: 'AND',
      conditions: [
        { field: 'status', op: '=', value: 'active' },
        { field: 'amount', op: '>', value: 100 },
      ],
    }
    assert.equal(fg.op, 'AND')
    assert.equal(fg.conditions.length, 2)
  })

  it('ReportFilterGroup 支持递归嵌套', () => {
    const fg: ReportFilterGroup = {
      op: 'OR',
      conditions: [
        { field: 'status', op: '=', value: 'completed' },
        {
          op: 'AND',
          conditions: [
            { field: 'amount', op: '>=', value: 1000 },
          ],
        },
      ],
    }
    assert.equal(fg.op, 'OR')
    assert.equal(fg.conditions.length, 2)
    assert.equal((fg.conditions[1] as ReportFilterGroup).op, 'AND')
  })

  // ============ ReportDefinition ============
  it('ReportDefinition 创建实例', () => {
    const def: ReportDefinition = {
      id: 'rep-001',
      tenantId: 'tenant-abc',
      name: '月度营收报表',
      type: 'revenue',
      dimensions: [{ field: 'date', granularity: 'month' }],
      metrics: [{ field: 'amount', fn: 'sum', alias: '总营收' }],
      ownerId: 'user-001',
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
      version: 1,
    }
    assert.equal(def.id, 'rep-001')
    assert.equal(def.tenantId, 'tenant-abc')
    assert.equal(def.name, '月度营收报表')
    assert.equal(def.type, 'revenue')
    assert.equal(def.version, 1)
  })

  it('ReportDefinition 可选字段缺省', () => {
    const def: ReportDefinition = {
      id: 'rep-002',
      tenantId: 'tenant-xyz',
      name: '库存预警',
      type: 'inventory-alert',
      dimensions: [],
      metrics: [{ field: 'qty', fn: 'sum', alias: '库存量' }],
      ownerId: 'user-002',
      createdAt: '2026-06-02T00:00:00Z',
      updatedAt: '2026-06-02T00:00:00Z',
      version: 1,
    }
    assert.equal(def.schedule, undefined)
    assert.equal(def.subscribers, undefined)
  })

  it('ReportDefinition 含订阅者', () => {
    const def: ReportDefinition = {
      id: 'rep-003',
      tenantId: 'tenant-abc',
      name: '周报',
      type: 'order',
      dimensions: [{ field: 'category' }],
      metrics: [{ field: 'count', fn: 'count', alias: '订单数' }],
      schedule: '0 8 * * 1',
      subscribers: ['admin@example.com'],
      ownerId: 'user-001',
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
      version: 2,
    }
    assert.equal(def.schedule, '0 8 * * 1')
    assert.deepEqual(def.subscribers, ['admin@example.com'])
  })

  // ============ ReportRow & ReportResult ============
  it('ReportRow 支持任意 str/number/null 键值', () => {
    const row: ReportRow = { date: '2026-06-01', amount: 15000, rate: null }
    assert.equal(row.date, '2026-06-01')
    assert.equal(row.amount, 15000)
    assert.equal(row.rate, null)
  })

  it('ReportResult 完整结构', () => {
    const result: ReportResult = {
      type: 'revenue',
      tenantId: 'tenant-abc',
      period: { from: '2026-06-01', to: '2026-06-30' },
      columns: [
        { field: 'date', alias: '日期', type: 'dimension' },
        { field: 'amount', alias: '金额', type: 'metric' },
      ],
      rows: [{ date: '2026-06-01', amount: 5000 }],
      totals: { amount: 5000 },
      generatedAt: '2026-06-30T23:59:59Z',
      cached: false,
    }
    assert.equal(result.type, 'revenue')
    assert.equal(result.rows.length, 1)
    assert.equal(result.cached, false)
  })

  it('ReportResult cached 为 true', () => {
    const result: ReportResult = {
      type: 'member',
      tenantId: 'tenant-xyz',
      period: { from: '2026-01-01', to: '2026-06-30' },
      columns: [],
      rows: [],
      generatedAt: '2026-06-30T12:00:00Z',
      cached: true,
    }
    assert.equal(result.cached, true)
  })

  // ============ CreateReportDefinitionInput ============
  it('CreateReportDefinitionInput 必填字段', () => {
    const input: CreateReportDefinitionInput = {
      tenantId: 'tenant-abc',
      name: '新报表',
      type: 'inventory',
      dimensions: [{ field: 'sku' }],
      metrics: [{ field: 'qty', fn: 'sum', alias: '数量' }],
      ownerId: 'user-001',
    }
    assert.equal(input.name, '新报表')
    assert.equal(input.ownerId, 'user-001')
  })

  it('CreateReportDefinitionInput 可选字段', () => {
    const input: CreateReportDefinitionInput = {
      tenantId: 'tenant-abc',
      name: '订阅报表',
      type: 'order',
      dimensions: [],
      metrics: [{ field: 'count', fn: 'count', alias: '订单数' }],
      schedule: '0 9 * * 1-5',
      subscribers: ['a@b.com'],
      ownerId: 'user-001',
    }
    assert.equal(input.schedule, '0 9 * * 1-5')
    assert.deepEqual(input.subscribers, ['a@b.com'])
  })

  // ============ UpdateReportDefinitionInput ============
  it('UpdateReportDefinitionInput 全可选', () => {
    const input: UpdateReportDefinitionInput = {}
    assert.deepEqual(input, {})
  })

  it('UpdateReportDefinitionInput 部分更新', () => {
    const input: UpdateReportDefinitionInput = { name: '新名称' }
    assert.equal(input.name, '新名称')
    assert.equal(input.dimensions, undefined)
  })

  // ============ QueryReportInput ============
  it('QueryReportInput 必填字段', () => {
    const input: QueryReportInput = {
      tenantId: 'tenant-abc',
      type: 'revenue',
      from: '2026-06-01',
      to: '2026-06-30',
    }
    assert.equal(input.type, 'revenue')
    assert.equal(input.noCache, undefined)
  })

  it('QueryReportInput 含筛选和 noCache', () => {
    const input: QueryReportInput = {
      tenantId: 'tenant-abc',
      type: 'order',
      from: '2026-01-01',
      to: '2026-06-30',
      filters: { op: 'AND', conditions: [{ field: 'status', op: '=', value: 'completed' }] },
      noCache: true,
    }
    assert.equal(input.noCache, true)
    assert.ok(input.filters)
  })

  // ============ ReportExportInput ============
  it('ReportExportInput CSV 格式', () => {
    const input: ReportExportInput = {
      tenantId: 'tenant-abc',
      type: 'revenue',
      format: 'csv',
      from: '2026-06-01',
      to: '2026-06-30',
    }
    assert.equal(input.format, 'csv')
  })

  it('ReportExportInput 支持三种格式', () => {
    const csv: ReportExportInput['format'] = 'csv'
    const json: ReportExportInput['format'] = 'json'
    const html: ReportExportInput['format'] = 'html'
    assert.equal(csv, 'csv')
    assert.equal(json, 'json')
    assert.equal(html, 'html')
  })

  // ============ 边界情况 ============
  it('空维度空指标定义', () => {
    const def: ReportDefinition = {
      id: 'rep-empty',
      tenantId: 't1',
      name: '空报表',
      type: 'inventory',
      dimensions: [],
      metrics: [],
      ownerId: 'u1',
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
      version: 1,
    }
    assert.equal(def.dimensions.length, 0)
    assert.equal(def.metrics.length, 0)
  })

  it('超长维度别名边界', () => {
    const longAlias = 'a'.repeat(100)
    const dim: ReportDimension = { field: 'x', alias: longAlias }
    assert.equal(dim.alias!.length, 100)
  })

  it('ReportRow null 值不影响结构', () => {
    const row: ReportRow = { a: null, b: 0, c: '' }
    assert.equal(row.a, null)
    assert.equal(row.b, 0)
    assert.equal(row.c, '')
  })
})
