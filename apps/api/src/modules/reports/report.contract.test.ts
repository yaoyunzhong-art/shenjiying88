import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [reports] [A] contract 补全
 *
 * Reports 模块合约测试
 * 验证合约映射函数能正确处理实体对象，不丢失字段
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  toReportDimensionContract,
  toReportMetricContract,
  toReportFilterContract,
  toReportFilterGroupContract,
  toReportResultContract,
  toReportDefinitionContract,
  toReportDimensionContracts,
  toReportMetricContracts,
  toReportResultContracts,
  toReportDefinitionContracts,
} from './report.contract'
import type {
  ReportDimension,
  ReportMetric,
  ReportFilter,
  ReportFilterGroup,
  ReportResult,
  ReportDefinition,
} from './reports.entity'

describe('report.contract - 合约映射函数', () => {
  // ─── 正例: 单对象映射 ───

  it('[正例] toReportDimensionContract 包含所有字段', () => {
    const entity: ReportDimension = {
      field: 'createdAt',
      granularity: 'month',
      alias: '月份',
    }
    const contract = toReportDimensionContract(entity)
    assert.equal(contract.field, 'createdAt')
    assert.equal(contract.granularity, 'month')
    assert.equal(contract.alias, '月份')
  })

  it('[正例] toReportDimensionContract 可选字段为空', () => {
    const entity: ReportDimension = { field: 'category' }
    const contract = toReportDimensionContract(entity)
    assert.equal(contract.field, 'category')
    assert.equal(contract.granularity, undefined)
    assert.equal(contract.alias, undefined)
  })

  it('[正例] toReportMetricContract 包含所有字段', () => {
    const entity: ReportMetric = {
      field: 'amountCents',
      fn: 'sum',
      alias: '总销售额',
    }
    const contract = toReportMetricContract(entity)
    assert.equal(contract.field, 'amountCents')
    assert.equal(contract.fn, 'sum')
    assert.equal(contract.alias, '总销售额')
  })

  it('[正例] toReportFilterContract 包含所有字段', () => {
    const entity: ReportFilter = { field: 'status', op: '=', value: 'COMPLETED' }
    const contract = toReportFilterContract(entity)
    assert.equal(contract.field, 'status')
    assert.equal(contract.op, '=')
    assert.equal(contract.value, 'COMPLETED')
  })

  it('[正例] toReportFilterGroupContract AND 条件', () => {
    const entity: ReportFilterGroup = {
      op: 'AND',
      conditions: [
        { field: 'status', op: '=', value: 'COMPLETED' },
        {
          op: 'OR',
          conditions: [
            { field: 'amountCents', op: '>', value: 500 },
          ],
        },
      ],
    }
    const contract = toReportFilterGroupContract(entity)
    assert.equal(contract.op, 'AND')
    assert.equal(contract.conditions.length, 2)
    const first = contract.conditions[0] as ReportFilter['op'] extends string ? any : never
    assert.equal(first.field, 'status')
    assert.equal(first.op, '=')
    assert.equal(first.value, 'COMPLETED')
    const second = contract.conditions[1]
    assert.equal(second.op, 'OR')
  })

  it('[正例] toReportResultContract 包含所有字段', () => {
    const entity: ReportResult = {
      type: 'revenue',
      tenantId: 't-test',
      period: { from: '2025-01-01', to: '2025-12-31' },
      columns: [
        { field: 'month', alias: '月份', type: 'dimension' },
        { field: 'revenue', alias: '营收', type: 'metric' },
      ],
      rows: [
        { month: '2025-01', revenue: 10000 },
        { month: '2025-02', revenue: 15000 },
      ],
      totals: { month: '合计', revenue: 25000 },
      generatedAt: '2026-06-28T03:00:00Z',
      cached: false,
    }
    const contract = toReportResultContract(entity)
    assert.equal(contract.type, 'revenue')
    assert.equal(contract.tenantId, 't-test')
    assert.equal(contract.period.from, '2025-01-01')
    assert.equal(contract.period.to, '2025-12-31')
    assert.equal(contract.columns.length, 2)
    assert.equal(contract.rows.length, 2)
    assert.ok(contract.totals)
    assert.equal(contract.totals!.revenue, 25000)
    assert.equal(contract.generatedAt, '2026-06-28T03:00:00Z')
    assert.equal(contract.cached, false)
  })

  it('[正例] toReportResultContract 无总计行', () => {
    const entity: ReportResult = {
      type: 'inventory',
      tenantId: 't-test',
      period: { from: '2025-01-01', to: '2025-01-31' },
      columns: [{ field: 'sku', alias: 'SKU', type: 'dimension' }],
      rows: [{ sku: 'SKU001', stock: 10 }],
      generatedAt: '2026-06-28T03:00:00Z',
      cached: true,
    }
    const contract = toReportResultContract(entity)
    assert.equal(contract.totals, undefined)
    assert.equal(contract.cached, true)
  })

  it('[正例] toReportDefinitionContract 包含所有字段', () => {
    const entity: ReportDefinition = {
      id: 'rdef-xxx',
      tenantId: 't-test',
      name: '月度营收',
      type: 'revenue',
      dimensions: [{ field: 'createdAt', granularity: 'month', alias: '月份' }],
      metrics: [{ field: 'amountCents', fn: 'sum', alias: '营收' }],
      filters: {
        op: 'AND',
        conditions: [{ field: 'status', op: '=', value: 'SUCCESS' }],
      },
      schedule: '0 0 1 * *',
      subscribers: ['admin@test.com'],
      ownerId: 'u-admin',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-06-01T00:00:00Z',
      version: 3,
    }
    const contract = toReportDefinitionContract(entity)
    assert.equal(contract.id, 'rdef-xxx')
    assert.equal(contract.name, '月度营收')
    assert.equal(contract.type, 'revenue')
    assert.equal(contract.dimensions.length, 1)
    assert.equal(contract.metrics.length, 1)
    assert.ok(contract.filters)
    assert.equal(contract.filters!.op, 'AND')
    assert.equal(contract.schedule, '0 0 1 * *')
    assert.deepEqual(contract.subscribers, ['admin@test.com'])
    assert.equal(contract.ownerId, 'u-admin')
    assert.equal(contract.version, 3)
  })

  it('[正例] toReportDefinitionContract 无可选字段', () => {
    const entity: ReportDefinition = {
      id: 'rdef-yyy',
      tenantId: 't-test',
      name: '简单报表',
      type: 'order',
      dimensions: [],
      metrics: [],
      ownerId: 'u1',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      version: 1,
    }
    const contract = toReportDefinitionContract(entity)
    assert.equal(contract.filters, undefined)
    assert.equal(contract.schedule, undefined)
    assert.equal(contract.subscribers, undefined)
  })

  // ─── 批量映射 ───

  it('[正例] 批量维度映射', () => {
    const entities: ReportDimension[] = [
      { field: 'month', granularity: 'month', alias: '月份' },
      { field: 'category', alias: '分类' },
    ]
    const contracts = toReportDimensionContracts(entities)
    assert.equal(contracts.length, 2)
    assert.equal(contracts[0].field, 'month')
    assert.equal(contracts[1].field, 'category')
  })

  it('[正例] 批量度量映射', () => {
    const entities: ReportMetric[] = [
      { field: 'revenue', fn: 'sum', alias: '营收' },
      { field: 'count', fn: 'count', alias: '订单数' },
    ]
    const contracts = toReportMetricContracts(entities)
    assert.equal(contracts.length, 2)
    assert.equal(contracts[0].fn, 'sum')
    assert.equal(contracts[1].fn, 'count')
  })

  it('[正例] 批量结果映射', () => {
    const entities: ReportResult[] = [
      { type: 'revenue', tenantId: 't-1', period: { from: 'a', to: 'b' }, columns: [], rows: [], generatedAt: 'now', cached: false },
      { type: 'member', tenantId: 't-2', period: { from: 'c', to: 'd' }, columns: [], rows: [], generatedAt: 'later', cached: true },
    ]
    const contracts = toReportResultContracts(entities)
    assert.equal(contracts.length, 2)
    assert.equal(contracts[0].type, 'revenue')
    assert.equal(contracts[1].type, 'member')
  })

  it('[正例] 批量定义映射', () => {
    const entities: ReportDefinition[] = [
      { id: 'r1', tenantId: 't-1', name: '报表1', type: 'revenue', dimensions: [], metrics: [], ownerId: 'u1', createdAt: 'n', updatedAt: 'n', version: 1 },
      { id: 'r2', tenantId: 't-2', name: '报表2', type: 'inventory', dimensions: [], metrics: [], ownerId: 'u2', createdAt: 'n', updatedAt: 'n', version: 2 },
    ]
    const contracts = toReportDefinitionContracts(entities)
    assert.equal(contracts.length, 2)
    assert.equal(contracts[0].id, 'r1')
    assert.equal(contracts[1].id, 'r2')
  })

  // ─── 边界: 空数组 ───

  it('[边界] 空数组批量维度映射', () => {
    const contracts = toReportDimensionContracts([])
    assert.deepEqual(contracts, [])
  })

  it('[边界] 空数组批量度量映射', () => {
    const contracts = toReportMetricContracts([])
    assert.deepEqual(contracts, [])
  })

  it('[边界] 空数组批量结果映射', () => {
    const contracts = toReportResultContracts([])
    assert.deepEqual(contracts, [])
  })

  it('[边界] 空数组批量定义映射', () => {
    const contracts = toReportDefinitionContracts([])
    assert.deepEqual(contracts, [])
  })

  // ─── 不变量 ───

  it('[不变量] 合约映射不修改源对象', () => {
    const entity: ReportMetric = { field: 'a', fn: 'sum', alias: 'b' }
    const copy = { ...entity }
    toReportMetricContract(entity)
    assert.deepEqual(entity, copy)
  })

  it('[不变量] 合约映射不共享引用', () => {
    const filters: ReportFilter[] = [{ field: 's', op: '=', value: 'OK' }]
    const group: ReportFilterGroup = { op: 'AND', conditions: filters }
    const contract = toReportFilterGroupContract(group)
    // 修改合约不应影响原对象
    contract.conditions = []
    assert.equal(filters.length, 1)
  })

  it('[不变量] 列定义、行数据独立拷贝', () => {
    const entity: ReportResult = {
      type: 'refund',
      tenantId: 't1',
      period: { from: 'a', to: 'b' },
      columns: [{ field: 'f', alias: '别名', type: 'dimension' }],
      rows: [{ f: 'v' }],
      generatedAt: 'now',
      cached: false,
    }
    const contract = toReportResultContract(entity)
    contract.columns.push({ field: 'x', alias: 'y', type: 'metric' })
    assert.equal(entity.columns.length, 1)
  })
})
