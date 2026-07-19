import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
// report.module.test.ts - Phase-39 T169
// 用途: Report Module 集成测试 (扩展版)
import { ReportModule } from './report.module'
import { ReportController } from './report.controller'
import { ReportService } from './report.service'
import { ReportAggregationService } from './report-aggregation.service'
import { ReportCacheService } from './report-cache.service'
import { ReportExportService } from './report-export.service'
import { ReportQueryService } from './report-query.service'

// ── 合约类型验证 ──────────────────────────────────────────

import type {
  ReportDimensionContract,
  ReportMetricContract,
  ReportFilterContract,
  ReportFilterGroupContract,
  ReportRowContract,
  ReportResultContract,
  ReportDefinitionContract,
  ReportDefinitionListContract,
  ReportExportContract,
  CacheInvalidateContract,
  CacheStatsContract,
  InventoryAlertItemContract,
  ChannelFunnelStepContract,
} from './report.contract'

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
  ReportType,
  ReportPeriod,
  ReportDimension,
  ReportMetric,
  ReportFilter,
  ReportFilterGroup,
  ReportResult,
  ReportDefinition,
  ReportRow,
  AggregationFn,
  FilterOp,
} from './reports.entity'

describe('📊 ReportModule 模块结构', () => {
  it('ReportModule exposes controller, providers, and exports', () => {
    const controllers = Reflect.getMetadata('controllers', ReportModule) as unknown[] | undefined
    const providers = Reflect.getMetadata('providers', ReportModule) as unknown[] | undefined
    const exportsList = Reflect.getMetadata('exports', ReportModule) as unknown[] | undefined

    assert.ok(Array.isArray(controllers), 'controllers should be an array')
    assert.ok(Array.isArray(providers), 'providers should be an array')
    assert.ok(Array.isArray(exportsList), 'exports should be an array')

    assert.ok(controllers?.includes(ReportController), 'ReportController should be registered')
    assert.ok(providers?.includes(ReportService), 'ReportService should be a provider')
    assert.ok(providers?.includes(ReportAggregationService), 'ReportAggregationService should be a provider')
    assert.ok(providers?.includes(ReportCacheService), 'ReportCacheService should be a provider')
    assert.ok(providers?.includes(ReportExportService), 'ReportExportService should be a provider')
    assert.ok(providers?.includes(ReportQueryService), 'ReportQueryService should be a provider')
    assert.ok(exportsList?.includes(ReportService), 'ReportService should be exported')
    assert.ok(exportsList?.includes(ReportAggregationService), 'ReportAggregationService should be exported')
    assert.ok(exportsList?.includes(ReportCacheService), 'ReportCacheService should be exported')
    assert.ok(exportsList?.includes(ReportExportService), 'ReportExportService should be exported')
    assert.ok(exportsList?.includes(ReportQueryService), 'ReportQueryService should be exported')
  })

  it('ReportModule has at least 18 providers registered', () => {
    const providers = Reflect.getMetadata('providers', ReportModule) as unknown[]
    assert.ok(providers.length >= 18, `Expected >=18 providers, got ${providers.length}`)
  })

  it('ReportModule provider count and names match module definition', () => {
    const providers = Reflect.getMetadata('providers', ReportModule) as unknown[]
    const providerNames = providers.map(p => typeof p === 'function' ? p.name : String(p))

    assert.equal(providerNames.length, 20, `Expected 20 providers, got ${providerNames.length}`)

    const expectedReportServices = [
      'RevenueReportService',
      'InventoryTurnoverService',
      'MemberGrowthService',
      'RefundRateService',
      'OrderConversionService',
      'ProductRankingService',
      'PaymentMixService',
      'HourlyHeatmapService',
      'ChannelFunnelService',
      'InventoryAlertService',
    ]
    for (const svc of expectedReportServices) {
      assert.ok(providerNames.includes(svc), `${svc} should be a provider`)
    }

    const expectedAdapters = [
      'OrderAdapter',
      'PaymentAdapter',
      'RefundAdapter',
      'MemberAdapter',
      'InventoryAdapter',
    ]
    for (const adapter of expectedAdapters) {
      assert.ok(providerNames.includes(adapter), `${adapter} should be a provider`)
    }
  })

  it('ReportModule has no imports (self-contained design)', () => {
    const imports = Reflect.getMetadata('imports', ReportModule) as unknown[] | undefined
    assert.ok(imports === undefined || imports.length === 0,
      'ReportModule should have no imports (self-contained)')
  })
})

// ═══════════════════════════════════════════════════════════════════
// 合约类型测试
// ═══════════════════════════════════════════════════════════════════

describe('📐 ReportContract 类型验证', () => {
  // ── 正例 ─────────────────────────────────────────────────

  it('[P0] ReportDimensionContract 正确结构', () => {
    const d: ReportDimensionContract = { field: 'createdAt', granularity: 'month', alias: '月份' }
    expect(d.field).toBe('createdAt')
    expect(d.granularity).toBe('month')
    expect(d.alias).toBe('月份')
  })

  it('[P0] ReportMetricContract 正确结构', () => {
    const m: ReportMetricContract = { field: 'amount', fn: 'sum', alias: '总金额' }
    expect(m.field).toBe('amount')
    expect(m.fn).toBe('sum')
    expect(m.alias).toBe('总金额')
  })

  it('[P0] ReportFilterContract 正确结构 (支持所有 op)', () => {
    const ops: FilterOp[] = ['=', '!=', '>', '>=', '<', '<=', 'in', 'notIn', 'between', 'like']
    for (const op of ops) {
      const f: ReportFilterContract = { field: 'status', op, value: 'active' }
      expect(f.op).toBe(op)
    }
  })

  it('[P0] ReportFilterGroupContract 嵌套 AND/OR', () => {
    const group: ReportFilterGroupContract = {
      op: 'AND',
      conditions: [
        { field: 'status', op: '=', value: 'active' },
        {
          op: 'OR',
          conditions: [
            { field: 'amount', op: '>', value: 100 },
            { field: 'amount', op: '<=', value: 10 },
          ],
        },
      ],
    }
    expect(group.op).toBe('AND')
    expect(group.conditions.length).toBe(2)
  })

  it('[P0] ReportRowContract 允许字符串/数字/null', () => {
    const row: ReportRowContract = { name: '商品A', amount: 100, discount: null }
    expect(row.name).toBe('商品A')
    expect(row.amount).toBe(100)
    expect(row.discount).toBeNull()
  })

  it('[P0] ReportResultContract 完整结构', () => {
    const result: ReportResultContract = {
      type: 'revenue',
      tenantId: 'tenant_001',
      period: { from: '2026-01-01', to: '2026-01-31' },
      columns: [
        { field: 'date', alias: '日期', type: 'dimension' },
        { field: 'amount', alias: '金额', type: 'metric' },
      ],
      rows: [{ date: '2026-01-01', amount: 1000 }],
      totals: { date: '合计', amount: 1000 },
      generatedAt: '2026-07-19T00:00:00Z',
      cached: false,
    }
    expect(result.type).toBe('revenue')
    expect(result.rows).toHaveLength(1)
    expect(result.cached).toBe(false)
  })

  it('[P0] ReportDefinitionContract 完整结构', () => {
    const def: ReportDefinitionContract = {
      id: 'def_001',
      tenantId: 'tenant_001',
      name: '月度营收',
      type: 'revenue',
      dimensions: [{ field: 'date', granularity: 'month', alias: '月份' }],
      metrics: [{ field: 'amount', fn: 'sum', alias: '总金额' }],
      filters: {
        op: 'AND',
        conditions: [{ field: 'status', op: '=', value: 'completed' }],
      },
      schedule: '0 0 1 * *',
      subscribers: ['admin@example.com'],
      ownerId: 'user_admin',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
      version: 3,
    }
    expect(def.schedule).toBe('0 0 1 * *')
    expect(def.subscribers).toContain('admin@example.com')
    expect(def.version).toBe(3)
  })

  it('[P0] ReportDefinitionListContract 分页结构', () => {
    const list: ReportDefinitionListContract = {
      total: 1,
      items: [{
        id: 'def_001', tenantId: 't1', name: '报表', type: 'revenue',
        dimensions: [], metrics: [], ownerId: 'u1',
        createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', version: 1,
      }],
    }
    expect(list.total).toBe(1)
    expect(list.items).toHaveLength(1)
  })

  it('[P0] ReportExportContract 完整结构', () => {
    const exp: ReportExportContract = {
      filename: 'report_2026.csv', format: 'csv', size: 1024, content: 'a,b,c\n1,2,3',
    }
    expect(exp.format).toBe('csv')
    expect(exp.filename).toContain('.csv')
  })

  it('[P0] CacheInvalidateContract / CacheStatsContract', () => {
    const inv: CacheInvalidateContract = { invalidated: 5 }
    expect(inv.invalidated).toBe(5)

    const stats: CacheStatsContract = { size: 10, maxEntries: 100, hitRate: 0.85 }
    expect(stats.hitRate).toBeLessThanOrEqual(1)
  })

  it('[P0] InventoryAlertItemContract / ChannelFunnelStepContract', () => {
    const alert: InventoryAlertItemContract = {
      id: 'alert_001', sku: 'SKU001', name: '商品', stock: 5, minStock: 10,
      shortage: 5, category: '电子',
    }
    expect(alert.shortage).toBe(5)

    const funnel: ChannelFunnelStepContract = {
      channel: 'web', visits: 1000, orders: 50, conversion: 0.05,
    }
    expect(funnel.conversion).toBe(0.05)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 合约映射器测试 (toContract)
// ═══════════════════════════════════════════════════════════════════

describe('🔄 ReportContract 映射器', () => {
  it('[P0] toReportDimensionContract 映射正确', () => {
    const entity: ReportDimension = { field: 'createdAt', granularity: 'month', alias: '月份' }
    const contract = toReportDimensionContract(entity)
    expect(contract.field).toBe('createdAt')
    expect(contract.granularity).toBe('month')
    expect(contract.alias).toBe('月份')
  })

  it('[P0] toReportMetricContract 映射正确', () => {
    const entity: ReportMetric = { field: 'amount', fn: 'sum', alias: '总金额' }
    const contract = toReportMetricContract(entity)
    expect(contract.field).toBe('amount')
    expect(contract.fn).toBe('sum')
  })

  it('[P0] toReportFilterContract 映射正确', () => {
    const entity: ReportFilter = { field: 'status', op: '=', value: 'active' }
    const contract = toReportFilterContract(entity)
    expect(contract.op).toBe('=')
    expect(contract.value).toBe('active')
  })

  it('[P0] toReportFilterGroupContract 嵌套映射正确', () => {
    const entity: ReportFilterGroup = {
      op: 'AND',
      conditions: [
        { field: 'status', op: '=', value: 'active' } as ReportFilter,
        {
          op: 'OR',
          conditions: [
            { field: 'amount', op: '>', value: 100 } as ReportFilter,
          ],
        } as ReportFilterGroup,
      ],
    }
    const contract = toReportFilterGroupContract(entity)
    expect(contract.op).toBe('AND')
    expect(contract.conditions).toHaveLength(2)
    expect((contract.conditions[1] as ReportFilterGroupContract).op).toBe('OR')
  })

  it('[P0] toReportResultContract 映射正确', () => {
    const entity: ReportResult = {
      type: 'revenue', tenantId: 't1',
      period: { from: '2026-01-01', to: '2026-01-31' },
      columns: [{ field: 'date', alias: '日期', type: 'dimension' }],
      rows: [{ date: '2026-01-01', amount: 100 }],
      generatedAt: '2026-07-19T00:00:00Z',
      cached: false,
    }
    const contract = toReportResultContract(entity)
    expect(contract.type).toBe('revenue')
    expect(contract.rows).toHaveLength(1)
  })

  it('[P0] toReportDefinitionContract 映射正确', () => {
    const entity: ReportDefinition = {
      id: 'def_001', tenantId: 't1', name: '报表', type: 'revenue',
      dimensions: [], metrics: [], ownerId: 'u1',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', version: 1,
    }
    const contract = toReportDefinitionContract(entity)
    expect(contract.id).toBe('def_001')
    expect(contract.filters).toBeUndefined()
  })

  it('[P0] 批量映射器正常工作', () => {
    const dims: ReportDimension[] = [
      { field: 'date', alias: '日期' },
      { field: 'channel', alias: '渠道' },
    ]
    const contracts = toReportDimensionContracts(dims)
    expect(contracts).toHaveLength(2)

    const metrics: ReportMetric[] = [
      { field: 'amount', fn: 'sum', alias: '金额' },
    ]
    const metricContracts = toReportMetricContracts(metrics)
    expect(metricContracts).toHaveLength(1)
  })

  it('[P0] toReportResultContracts 批量映射', () => {
    const results: ReportResult[] = [{
      type: 'revenue', tenantId: 't1',
      period: { from: 'a', to: 'b' },
      columns: [], rows: [],
      generatedAt: 'now', cached: false,
    }]
    const contracts = toReportResultContracts(results)
    expect(contracts).toHaveLength(1)
  })

  it('[P0] toReportDefinitionContracts 批量映射', () => {
    const defs: ReportDefinition[] = [{
      id: 'd1', tenantId: 't1', name: 'n', type: 'revenue',
      dimensions: [], metrics: [], ownerId: 'u1',
      createdAt: 'now', updatedAt: 'now', version: 1,
    }]
    const contracts = toReportDefinitionContracts(defs)
    expect(contracts).toHaveLength(1)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 实体类型验证
// ═══════════════════════════════════════════════════════════════════

describe('📁 ReportEntity 类型验证', () => {
  it('[P0] ReportType 全部 10 种枚举', () => {
    const types: ReportType[] = [
      'revenue', 'inventory', 'member', 'refund', 'order',
      'product-ranking', 'payment-mix', 'hourly-heatmap',
      'channel-funnel', 'inventory-alert',
    ]
    expect(types).toHaveLength(10)
  })

  it('[P0] ReportPeriod 4 种粒度', () => {
    const periods: ReportPeriod[] = ['day', 'week', 'month', 'year']
    expect(periods).toHaveLength(4)
  })

  it('[P0] AggregationFn 6 种函数', () => {
    const fns: AggregationFn[] = ['sum', 'count', 'avg', 'min', 'max', 'distinct']
    expect(fns).toHaveLength(6)
  })

  it('[P0] FilterOp 10 种操作符', () => {
    const ops: FilterOp[] = ['=', '!=', '>', '>=', '<', '<=', 'in', 'notIn', 'between', 'like']
    expect(ops).toHaveLength(10)
  })

  it('[P0] ReportRow 动态键值', () => {
    const row: ReportRow = { date: '2026-01-01', amount: 1000, rate: null }
    expect(row.date).toBe('2026-01-01')
    expect(row.amount).toBe(1000)
    expect(row.rate).toBeNull()
  })

  it('[P0] ReportResult totals 可选', () => {
    const r1: ReportResult = { type: 'revenue', tenantId: 't1', period: { from: 'a', to: 'b' }, columns: [], rows: [], generatedAt: 'now', cached: false }
    expect(r1.totals).toBeUndefined()

    const r2: ReportResult = { type: 'revenue', tenantId: 't1', period: { from: 'a', to: 'b' }, columns: [], rows: [], totals: { total: 100 }, generatedAt: 'now', cached: false }
    expect(r2.totals!.total).toBe(100)
  })

  it('[P0] ReportDefinition 含版本号', () => {
    const def: ReportDefinition = {
      id: 'd1', tenantId: 't1', name: 'n', type: 'revenue',
      dimensions: [], metrics: [], ownerId: 'u1',
      createdAt: 'now', updatedAt: 'now', version: 1,
    }
    expect(def.version).toBe(1)
  })
})
