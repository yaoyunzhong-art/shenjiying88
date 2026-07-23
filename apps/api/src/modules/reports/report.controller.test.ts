import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ReportController } from './report.controller'
import { ReportAggregationService } from './report-aggregation.service'
import { ReportCacheService } from './report-cache.service'
import { ReportExportService } from './report-export.service'
import { ReportQueryService } from './report-query.service'

const TENANT = 'T-001'
const OTHER_TENANT = 'T-099'

interface MockReportResult {
  type: string
  tenantId: string
  period: { from: string; to: string }
  columns: { field: string; alias: string; type: string }[]
  rows: any[]
  totals?: Record<string, unknown>
  generatedAt: string
  cached: boolean
}

function mockResult(type: string, tenantId: string, rows: any[] = []): MockReportResult {
  return {
    type,
    tenantId,
    period: { from: '2025-06-01', to: '2025-06-30' },
    columns: [],
    rows,
    generatedAt: new Date().toISOString(),
    cached: false,
  }
}

function makeTriggerFn(result: MockReportResult) {
  return () => result
}

function makeThrowFn(msg: string) {
  return () => { throw new Error(msg) }
}

function makeController(overrides: {
  revenue?: ReturnType<typeof makeTriggerFn> | ReturnType<typeof makeThrowFn>
  inventoryTurnover?: ReturnType<typeof makeTriggerFn> | ReturnType<typeof makeThrowFn>
  memberGrowth?: ReturnType<typeof makeTriggerFn> | ReturnType<typeof makeThrowFn>
  refundRate?: ReturnType<typeof makeTriggerFn> | ReturnType<typeof makeThrowFn>
  orderConversion?: ReturnType<typeof makeTriggerFn> | ReturnType<typeof makeThrowFn>
  productRanking?: ReturnType<typeof makeTriggerFn> | ReturnType<typeof makeThrowFn>
  paymentMix?: ReturnType<typeof makeTriggerFn> | ReturnType<typeof makeThrowFn>
  hourlyHeatmap?: ReturnType<typeof makeTriggerFn> | ReturnType<typeof makeThrowFn>
  channelFunnel?: ReturnType<typeof makeTriggerFn> | ReturnType<typeof makeThrowFn>
  inventoryAlert?: ReturnType<typeof makeTriggerFn> | ReturnType<typeof makeThrowFn>
} = {}) {
  const agg = new ReportAggregationService()
  const cache = new ReportCacheService()
  const exportSvc = new ReportExportService()
  const querySvc = new ReportQueryService()
  const defaultGen = makeTriggerFn(mockResult('unknown', TENANT))
  return new ReportController(
    agg,
    cache,
    exportSvc,
    querySvc,
    { generate: overrides.revenue ?? defaultGen } as any,
    { generate: overrides.inventoryTurnover ?? defaultGen } as any,
    { generate: overrides.memberGrowth ?? defaultGen } as any,
    { generate: overrides.refundRate ?? defaultGen } as any,
    { generate: overrides.orderConversion ?? defaultGen } as any,
    { generate: overrides.productRanking ?? defaultGen } as any,
    { generate: overrides.paymentMix ?? defaultGen } as any,
    { generate: overrides.hourlyHeatmap ?? defaultGen } as any,
    { generate: overrides.channelFunnel ?? defaultGen } as any,
    { generate: overrides.inventoryAlert ?? defaultGen } as any,
    {} as any,
  )
}

// ── 路由元数据 ──
describe('ReportController 路由元数据', () => {
  it('controller metadata path is api/reports', async () => {
    const path = Reflect.getMetadata('path', ReportController)
    assert.equal(path, 'api/reports')
  })

  it('GET revenue route', async () => {
    const method = Reflect.getMetadata('method', ReportController.prototype.revenueReport)
    const path = Reflect.getMetadata('path', ReportController.prototype.revenueReport)
    assert.equal(method, 0) // GET
    assert.equal(path, 'revenue')
  })

  it('GET inventory route', async () => {
    const method = Reflect.getMetadata('method', ReportController.prototype.inventoryReport)
    const path = Reflect.getMetadata('path', ReportController.prototype.inventoryReport)
    assert.equal(method, 0)
    assert.equal(path, 'inventory')
  })

  it('GET member route', async () => {
    const method = Reflect.getMetadata('method', ReportController.prototype.memberReport)
    const path = Reflect.getMetadata('path', ReportController.prototype.memberReport)
    assert.equal(method, 0)
    assert.equal(path, 'member')
  })

  it('GET refund route', async () => {
    const method = Reflect.getMetadata('method', ReportController.prototype.refundReport)
    const path = Reflect.getMetadata('path', ReportController.prototype.refundReport)
    assert.equal(method, 0)
    assert.equal(path, 'refund')
  })

  it('GET order route', async () => {
    const method = Reflect.getMetadata('method', ReportController.prototype.orderReport)
    const path = Reflect.getMetadata('path', ReportController.prototype.orderReport)
    assert.equal(method, 0)
    assert.equal(path, 'order')
  })

  it('GET product-ranking route', async () => {
    const method = Reflect.getMetadata('method', ReportController.prototype.productRankingReport)
    const path = Reflect.getMetadata('path', ReportController.prototype.productRankingReport)
    assert.equal(method, 0)
    assert.equal(path, 'product-ranking')
  })

  it('GET payment-mix route', async () => {
    const method = Reflect.getMetadata('method', ReportController.prototype.paymentMixReport)
    const path = Reflect.getMetadata('path', ReportController.prototype.paymentMixReport)
    assert.equal(method, 0)
    assert.equal(path, 'payment-mix')
  })

  it('GET hourly-heatmap route', async () => {
    const method = Reflect.getMetadata('method', ReportController.prototype.hourlyHeatmapReport)
    const path = Reflect.getMetadata('path', ReportController.prototype.hourlyHeatmapReport)
    assert.equal(method, 0)
    assert.equal(path, 'hourly-heatmap')
  })

  it('GET channel-funnel route', async () => {
    const method = Reflect.getMetadata('method', ReportController.prototype.channelFunnelReport)
    const path = Reflect.getMetadata('path', ReportController.prototype.channelFunnelReport)
    assert.equal(method, 0)
    assert.equal(path, 'channel-funnel')
  })

  it('GET inventory-alert route', async () => {
    const method = Reflect.getMetadata('method', ReportController.prototype.inventoryAlertReport)
    const path = Reflect.getMetadata('path', ReportController.prototype.inventoryAlertReport)
    assert.equal(method, 0)
    assert.equal(path, 'inventory-alert')
  })

  it('POST definitions → method is POST', async () => {
    const method = Reflect.getMetadata('method', ReportController.prototype.createDefinition)
    assert.equal(method, 1) // POST
  })

  it('GET definitions list', async () => {
    const method = Reflect.getMetadata('method', ReportController.prototype.listDefinitions)
    const path = Reflect.getMetadata('path', ReportController.prototype.listDefinitions)
    assert.equal(method, 0)
    assert.equal(path, 'definitions')
  })

  it('GET definitions/:id', async () => {
    const method = Reflect.getMetadata('method', ReportController.prototype.getDefinition)
    const path = Reflect.getMetadata('path', ReportController.prototype.getDefinition)
    assert.equal(method, 0)
    assert.equal(path, 'definitions/:id')
  })

  it('PUT definitions/:id', async () => {
    const method = Reflect.getMetadata('method', ReportController.prototype.updateDefinition)
    const path = Reflect.getMetadata('path', ReportController.prototype.updateDefinition)
    assert.equal(method, 2) // PUT
    assert.equal(path, 'definitions/:id')
  })

  it('DELETE definitions/:id', async () => {
    const method = Reflect.getMetadata('method', ReportController.prototype.deleteDefinition)
    const path = Reflect.getMetadata('path', ReportController.prototype.deleteDefinition)
    assert.equal(method, 3) // DELETE
    assert.equal(path, 'definitions/:id')
  })

  it('GET export route', async () => {
    const method = Reflect.getMetadata('method', ReportController.prototype.exportReport)
    const path = Reflect.getMetadata('path', ReportController.prototype.exportReport)
    assert.equal(method, 0)
    assert.equal(path, 'export')
  })

  it('POST cache/invalidate route', async () => {
    const method = Reflect.getMetadata('method', ReportController.prototype.invalidateCache)
    const path = Reflect.getMetadata('path', ReportController.prototype.invalidateCache)
    assert.equal(method, 1)
    assert.equal(path, 'cache/invalidate')
  })

  it('GET cache/stats route', async () => {
    const method = Reflect.getMetadata('method', ReportController.prototype.cacheStats)
    const path = Reflect.getMetadata('path', ReportController.prototype.cacheStats)
    assert.equal(method, 0)
    assert.equal(path, 'cache/stats')
  })
})

// ── 内置报表 endpoint 行为 ──
describe('ReportController reports', () => {
  it('revenueReport : 正常流程', async () => {
    const expected = mockResult('revenue', TENANT, [{ date: '2025-06-15', amountCents: 500000 }])
    const ctrl = makeController({ revenue: makeTriggerFn(expected) })
    const result = await ctrl.revenueReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(result, expected)
  })

  it('revenueReport : 空日期参数不抛错', async () => {
    const ctrl = makeController()
    const result = await ctrl.revenueReport({ tenantId: TENANT })
    assert.ok(result)
  })

  it('revenueReport : 反例—service 抛异常', async () => {
    const ctrl = makeController({ revenue: makeThrowFn('Revenue service error') })
    assert.throws(() => ctrl.revenueReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' }), /Revenue service error/)
  })

  it('inventoryReport : 正常流程', async () => {
    const expected = mockResult('inventory', TENANT, [{ sku: 'SKU001', turnoverRate: 2.5 }])
    const ctrl = makeController({ inventoryTurnover: makeTriggerFn(expected) })
    const result = await ctrl.inventoryReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(result.type, 'inventory')
  })

  it('inventoryReport : 返回空行', async () => {
    const ctrl = makeController({ inventoryTurnover: makeTriggerFn(mockResult('inventory', TENANT, [])) })
    const result = await ctrl.inventoryReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(result.rows.length, 0)
  })

  it('memberReport : 正常流程', async () => {
    const ctrl = makeController({ memberGrowth: makeTriggerFn(mockResult('member', TENANT, [{ month: '2025-06', newMembers: 50 }])) })
    const result = await ctrl.memberReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(result.type, 'member')
  })

  it('refundReport : 正常流程', async () => {
    const ctrl = makeController({ refundRate: makeTriggerFn(mockResult('refund', TENANT, [{ date: '2025-06-17', refundAmount: 10000 }])) })
    const result = await ctrl.refundReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(result.type, 'refund')
  })

  it('orderReport : 正常流程', async () => {
    const ctrl = makeController({ orderConversion: makeTriggerFn(mockResult('order', TENANT, [{ date: '2025-06-15', totalOrders: 2 }])) })
    const result = await ctrl.orderReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(result.type, 'order')
  })

  it('productRankingReport : 正常流程传入 topN', async () => {
    const ctrl = makeController({ productRanking: makeTriggerFn(mockResult('product-ranking', TENANT, [{ sku: 'SKU001', rank: 1 }])) })
    const result = await ctrl.productRankingReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30', topN: '5' })
    assert.equal(result.type, 'product-ranking')
  })

  it('productRankingReport : 不传 topN 不抛错', async () => {
    const ctrl = makeController({ productRanking: makeTriggerFn(mockResult('product-ranking', TENANT)) })
    ctrl.productRankingReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
  })

  it('paymentMixReport : 正常流程', async () => {
    const ctrl = makeController({ paymentMix: makeTriggerFn(mockResult('payment-mix', TENANT, [{ method: 'WECHAT', percentage: 38.46 }])) })
    const result = await ctrl.paymentMixReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(result.type, 'payment-mix')
  })

  it('hourlyHeatmapReport : 正常流程', async () => {
    const ctrl = makeController({ hourlyHeatmap: makeTriggerFn(mockResult('hourly-heatmap', TENANT, [{ hour: 10, orderCount: 5 }])) })
    const result = await ctrl.hourlyHeatmapReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(result.type, 'hourly-heatmap')
  })

  it('channelFunnelReport : 正常流程', async () => {
    const ctrl = makeController({ channelFunnel: makeTriggerFn(mockResult('channel-funnel', TENANT, [{ channel: 'online', visitors: 100 }])) })
    const result = await ctrl.channelFunnelReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(result.type, 'channel-funnel')
  })

  it('inventoryAlertReport : 正常流程', async () => {
    const ctrl = makeController({ inventoryAlert: makeTriggerFn(mockResult('inventory-alert', TENANT, [{ sku: 'SKU002', availableQty: 0 }])) })
    const result = await ctrl.inventoryAlertReport({ tenantId: TENANT })
    assert.equal(result.type, 'inventory-alert')
  })
})

// ── 报表定义 CRUD ──
describe('ReportController definitions CRUD', () => {
  it('createDefinition : 返回带 id 的定义', async () => {
    const ctrl = makeController()
    const def = ctrl.createDefinition({
      tenantId: TENANT,
      name: '月度营收',
      type: 'revenue',
      dimensions: [{ field: 'createdAt', granularity: 'day', alias: '日期' }],
      metrics: [{ field: 'amountCents', fn: 'sum', alias: '营收' }],
      ownerId: 'admin-1',
    })
    assert.match(def.id, /^rdef-/)
    assert.equal(def.tenantId, TENANT)
    assert.equal(def.version, 1)
  })

  it('listDefinitions : 按 tenant 隔离', async () => {
    const ctrl = makeController()
    ctrl.createDefinition({ tenantId: TENANT, name: 'A', type: 'revenue', dimensions: [], metrics: [], ownerId: 'u1' })
    ctrl.createDefinition({ tenantId: OTHER_TENANT, name: 'B', type: 'revenue', dimensions: [], metrics: [], ownerId: 'u2' })
    ctrl.createDefinition({ tenantId: TENANT, name: 'C', type: 'member', dimensions: [], metrics: [], ownerId: 'u1' })
    const result = ctrl.listDefinitions({ tenantId: TENANT })
    assert.equal(result.total, 2)
  })

  it('getDefinition : 按 id 查到', async () => {
    const ctrl = makeController()
    const def = ctrl.createDefinition({ tenantId: TENANT, name: '测试', type: 'revenue', dimensions: [], metrics: [], ownerId: 'u1' })
    const found = ctrl.getDefinition(def.id, { tenantId: TENANT })
    assert.ok(found)
    assert.equal(found!.id, def.id)
  })

  it('getDefinition : 跨租户返回 null', async () => {
    const ctrl = makeController()
    const def = ctrl.createDefinition({ tenantId: TENANT, name: '测试', type: 'revenue', dimensions: [], metrics: [], ownerId: 'u1' })
    const found = ctrl.getDefinition(def.id, { tenantId: OTHER_TENANT })
    assert.equal(found, null)
  })

  it('updateDefinition : 正常更新', async () => {
    const ctrl = makeController()
    const def = ctrl.createDefinition({ tenantId: TENANT, name: '原名', type: 'revenue', dimensions: [], metrics: [], ownerId: 'u1' })
    const updated = ctrl.updateDefinition(def.id, { tenantId: TENANT, version: String(def.version) }, { name: '新名' })
    assert.equal(updated.name, '新名')
    assert.equal(updated.version, 2)
  })

  it('updateDefinition : version 不匹配抛错', async () => {
    const ctrl = makeController()
    const def = ctrl.createDefinition({ tenantId: TENANT, name: '测试', type: 'revenue', dimensions: [], metrics: [], ownerId: 'u1' })
    assert.throws(() => ctrl.updateDefinition(def.id, { tenantId: TENANT, version: '999' }, { name: '新名' }), /version mismatch/)
  })

  it('updateDefinition : 跨租户抛错', async () => {
    const ctrl = makeController()
    const def = ctrl.createDefinition({ tenantId: TENANT, name: '测试', type: 'revenue', dimensions: [], metrics: [], ownerId: 'u1' })
    assert.throws(() => ctrl.updateDefinition(def.id, { tenantId: OTHER_TENANT, version: String(def.version) }, { name: '新名' }), /definition not found/)
  })

  it('deleteDefinition : 成功删除', async () => {
    const ctrl = makeController()
    const def = ctrl.createDefinition({ tenantId: TENANT, name: '待删', type: 'revenue', dimensions: [], metrics: [], ownerId: 'u1' })
    const result = ctrl.deleteDefinition(def.id, { tenantId: TENANT })
    assert.deepEqual(result, { deleted: true })
    assert.equal(ctrl.getDefinition(def.id, { tenantId: TENANT }), null)
  })

  it('deleteDefinition : 跨租户返回 deleted:false', async () => {
    const ctrl = makeController()
    const def = ctrl.createDefinition({ tenantId: TENANT, name: '测试', type: 'revenue', dimensions: [], metrics: [], ownerId: 'u1' })
    const result = ctrl.deleteDefinition(def.id, { tenantId: OTHER_TENANT })
    assert.deepEqual(result, { deleted: false })
  })

  it('deleteDefinition : 不存在的 id 返回 deleted:false', async () => {
    const ctrl = makeController()
    const result = ctrl.deleteDefinition('non-existent', { tenantId: TENANT })
    assert.deepEqual(result, { deleted: false })
  })
})

// ── 导出 ──
describe('ReportController export', () => {
  it('exportReport : JSON 格式', async () => {
    const ctrl = makeController({ revenue: makeTriggerFn(mockResult('revenue', TENANT, [{ date: '2025-06-15', amountCents: 500000 }])) })
    const result = await ctrl.exportReport({ tenantId: TENANT, type: 'revenue', format: 'json', from: '2025-06-01', to: '2025-06-30' })
    assert.equal(result.format, 'json')
    assert.ok(result.size > 0)
  })

  it('exportReport : CSV 格式', async () => {
    const ctrl = makeController({ revenue: makeTriggerFn(mockResult('revenue', TENANT)) })
    const result = await ctrl.exportReport({ tenantId: TENANT, type: 'revenue', format: 'csv', from: '2025-06-01', to: '2025-06-30' })
    assert.equal(result.format, 'csv')
    assert.match(result.filename, /\.csv$/)
  })

  it('exportReport : 未知类型抛错', async () => {
    const ctrl = makeController()
    await assert.rejects(
      () => ctrl.exportReport({ tenantId: TENANT, type: 'unknown-type' as any, format: 'csv', from: '2025-06-01', to: '2025-06-30' }),
      /unknown report type/
    )
  })
})

// ── 缓存管理 ──
describe('ReportController cache', () => {
  it('cache/invalidate : 返回数字', async () => {
    const ctrl = makeController()
    const result = ctrl.invalidateCache({ tenantId: TENANT })
    assert.equal(typeof result.invalidated, 'number')
  })

  it('cache/stats : 返回统计对象', async () => {
    const ctrl = makeController()
    const stats = ctrl.cacheStats()
    assert.ok(stats)
    assert.equal(typeof stats.hits, 'number')
  })
})
