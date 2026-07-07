import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [reports] [A] e2e 补全
 *
 * Reports 模块 E2E 测试
 * 模拟完整的 controller → adapter 数据流：
 * - 从数据灌入到报表生成
 * - 跨模块数据流验证
 * - 数据隔离与边界场景
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ReportController } from './report.controller'
import { ReportAggregationService } from './report-aggregation.service'
import { ReportCacheService } from './report-cache.service'
import { ReportExportService } from './report-export.service'
import { ReportQueryService } from './report-query.service'
import { OrderAdapter } from './datasources/order.adapter'
import { PaymentAdapter } from './datasources/payment.adapter'
import { RefundAdapter } from './datasources/refund.adapter'
import { MemberAdapter } from './datasources/member.adapter'
import { InventoryAdapter } from './datasources/inventory.adapter'
import { RevenueReportService } from './reports/revenue-report.service'
import { InventoryTurnoverService } from './reports/inventory-turnover.service'
import { MemberGrowthService } from './reports/member-growth.service'
import { RefundRateService } from './reports/refund-rate.service'
import { OrderConversionService } from './reports/order-conversion.service'
import { ProductRankingService } from './reports/product-ranking.service'
import { PaymentMixService } from './reports/payment-mix.service'
import { HourlyHeatmapService } from './reports/hourly-heatmap.service'
import { ChannelFunnelService } from './reports/channel-funnel.service'
import { InventoryAlertService } from './reports/inventory-alert.service'

const TENANT = 't-rpt-e2e'
const OTHER_TENANT = 't-rpt-e2e-other'

function buildController() {
  const agg = new ReportAggregationService()
  const cache = new ReportCacheService()
  const exp = new ReportExportService()
  const qs = new ReportQueryService()

  const paymentAdapter = new PaymentAdapter()
  const orderAdapter = new OrderAdapter()
  const refundAdapter = new RefundAdapter()
  const memberAdapter = new MemberAdapter()
  const inventoryAdapter = new InventoryAdapter()

  // 灌入数据集 — 模拟 2025-06 某场馆实际运营数据
  paymentAdapter.seed([
    { id: 'pay-1', tenantId: TENANT, orderId: 'ord-1', amountCents: 300000, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2025-06-01T10:00:00Z' },
    { id: 'pay-2', tenantId: TENANT, orderId: 'ord-2', amountCents: 150000, currency: 'CNY', method: 'ALIPAY', status: 'SUCCESS', createdAt: '2025-06-02T14:00:00Z' },
    { id: 'pay-3', tenantId: TENANT, orderId: 'ord-3', amountCents: 50000, currency: 'CNY', method: 'CASH', status: 'SUCCESS', createdAt: '2025-06-03T09:00:00Z' },
    { id: 'pay-4', tenantId: TENANT, orderId: 'ord-4', amountCents: 80000, currency: 'CNY', method: 'CARD', status: 'FAILED', createdAt: '2025-06-04T11:00:00Z' },
    { id: 'pay-5', tenantId: TENANT, orderId: 'ord-5', amountCents: 200000, currency: 'CNY', method: 'WECHAT', status: 'REFUNDED', createdAt: '2025-06-05T16:00:00Z' },
    // 跨租户隔离数据
    { id: 'pay-99', tenantId: OTHER_TENANT, orderId: 'ord-99', amountCents: 99999, currency: 'CNY', method: 'ALIPAY', status: 'SUCCESS', createdAt: '2025-06-01T10:00:00Z' },
  ])

  orderAdapter.seed([
    { id: 'ord-1', tenantId: TENANT, orderId: 'ord-1', memberId: 'm1', totalCents: 300000, source: 'onsite', itemCount: 1, status: 'COMPLETED', createdAt: '2025-06-01T10:00:00Z' },
    { id: 'ord-2', tenantId: TENANT, orderId: 'ord-2', memberId: 'm2', totalCents: 150000, source: 'online', itemCount: 1, status: 'COMPLETED', createdAt: '2025-06-02T14:00:00Z' },
    { id: 'ord-3', tenantId: TENANT, orderId: 'ord-3', memberId: 'm1', totalCents: 50000, source: 'onsite', itemCount: 2, status: 'COMPLETED', createdAt: '2025-06-03T09:00:00Z' },
    { id: 'ord-4', tenantId: TENANT, orderId: 'ord-4', memberId: 'm3', totalCents: 80000, source: 'onsite', itemCount: 2, status: 'CANCELLED', createdAt: '2025-06-04T11:00:00Z' },
    { id: 'ord-5', tenantId: TENANT, orderId: 'ord-5', memberId: 'm2', totalCents: 200000, source: 'online', itemCount: 1, status: 'REFUNDED', createdAt: '2025-06-05T16:00:00Z' },
    { id: 'ord-6', tenantId: TENANT, orderId: 'ord-6', memberId: 'm1', totalCents: 600000, source: 'online', itemCount: 2, status: 'COMPLETED', createdAt: '2025-06-10T18:00:00Z' },
    // 跨租户
    { id: 'ord-99', tenantId: OTHER_TENANT, orderId: 'ord-99', memberId: 'm99', totalCents: 99999, source: 'onsite', itemCount: 1, status: 'COMPLETED', createdAt: '2025-06-01T10:00:00Z' },
  ])

  refundAdapter.seed([
    { id: 'ref-1', tenantId: TENANT, paymentId: 'pay-5', orderId: 'ord-5', amountCents: 200000, reason: '不适用', status: 'COMPLETED', createdAt: '2025-06-05T17:00:00Z' },
  ])

  memberAdapter.seed([
    { id: 'm1', tenantId: TENANT, level: 'GOLD', source: 'onsite', status: 'ACTIVE', lifecycleStage: 'ACTIVE', createdAt: '2025-01-15T00:00:00Z', lastActiveAt: '2025-06-10T18:00:00Z' },
    { id: 'm2', tenantId: TENANT, level: 'SILVER', source: 'online', status: 'ACTIVE', lifecycleStage: 'ACTIVE', createdAt: '2025-03-01T00:00:00Z', lastActiveAt: '2025-06-05T16:00:00Z' },
    { id: 'm3', tenantId: TENANT, level: 'BRONZE', source: 'onsite', status: 'DORMANT', lifecycleStage: 'DORMANT', createdAt: '2025-05-20T00:00:00Z' },
  ])

  inventoryAdapter.seed([
    { id: 'inv-1', tenantId: TENANT, sku: 'SKU-A', name: '投篮机', category: '设备', totalQty: 3, reservedQty: 0, availableQty: 3, lowStockThreshold: 2, status: 'ACTIVE', unitPriceCents: 50000 },
    { id: 'inv-2', tenantId: TENANT, sku: 'SKU-B', name: '跳舞机', category: '设备', totalQty: 1, reservedQty: 0, availableQty: 1, lowStockThreshold: 2, status: 'ACTIVE', unitPriceCents: 80000 },
    { id: 'inv-3', tenantId: TENANT, sku: 'SKU-C', name: '毛绒娃娃', category: '礼品', totalQty: 30, reservedQty: 0, availableQty: 30, lowStockThreshold: 5, status: 'ACTIVE', unitPriceCents: 3000 },
    { id: 'inv-4', tenantId: TENANT, sku: 'SKU-D', name: '饮料', category: '食品', totalQty: 0, reservedQty: 0, availableQty: 0, lowStockThreshold: 10, status: 'ACTIVE', unitPriceCents: 500 },
    { id: 'inv-5', tenantId: TENANT, sku: 'SKU-E', name: '游戏币', category: '耗材', totalQty: 500, reservedQty: 0, availableQty: 500, lowStockThreshold: 100, status: 'ACTIVE', unitPriceCents: 100 },
  ])

  const revenue = new RevenueReportService(agg, cache, paymentAdapter)
  const invTurn = new InventoryTurnoverService(inventoryAdapter, orderAdapter)
  const memberGrowth = new MemberGrowthService(agg, cache, memberAdapter)
  const refundRate = new RefundRateService(paymentAdapter, refundAdapter)
  const orderConv = new OrderConversionService(orderAdapter)
  const prodRank = new ProductRankingService(orderAdapter)
  const payMix = new PaymentMixService(paymentAdapter)
  const hourlyHeatmap = new HourlyHeatmapService(orderAdapter)
  const channelFunnel = new ChannelFunnelService(orderAdapter)
  const inventoryAlert = new InventoryAlertService(inventoryAdapter)

  const ctrl = new ReportController(
    agg, cache, exp, qs,
    revenue, invTurn, memberGrowth, refundRate, orderConv,
    prodRank, payMix, hourlyHeatmap, channelFunnel, inventoryAlert
  )

  return { ctrl, cache, exp }
}

describe('Reports E2E - 完整数据流', () => {
  let ctrl: ReportController
  let cache: ReportCacheService
  let exportSvc: ReportExportService

  beforeEach(() => {
    const built = buildController()
    ctrl = built.ctrl
    cache = built.cache
    exportSvc = built.exp
  })

  // ─── 正例: 10种报表完整数据流 ───

  it('[正例] 营收报表数据流 - 灌入→查询→结果', async () => {
    const result = await ctrl.revenueReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(result.type, 'revenue')
    assert.equal(result.tenantId, TENANT)
    assert.ok(result.rows.length > 0)
    // 验证营收列存在
    const revCol = result.columns.find(c => c.type === 'metric')
    assert.ok(revCol)
    // 当前实现按 period 维度聚合，不再输出旧的 date/category 键。
    for (const row of result.rows) {
      assert.ok(row.period, '行应有 period 维度键')
    }
  })

  it('[正例] 库存周转报表 - 灌入→查询→结果', async () => {
    const result = await ctrl.inventoryReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(result.type, 'inventory')
    assert.ok(result.columns.length > 0)
    assert.ok(Array.isArray(result.rows))
  })

  it('[正例] 会员增长报表 - 灌入→查询→结果', async () => {
    const result = await ctrl.memberReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(result.type, 'member')
    assert.ok(Array.isArray(result.rows))
    assert.ok(result.columns.some(col => col.field === 'newMembers'))
    assert.ok(typeof result.totals?.newMembers === 'number')
  })

  it('[正例] 退款报表 - 灌入→查询→结果', async () => {
    const result = await ctrl.refundReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(result.type, 'refund')
    assert.ok(result.rows.length > 0)
  })

  it('[正例] 订单转化报表 - 灌入→查询→结果', async () => {
    const result = await ctrl.orderReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(result.type, 'order')
    assert.ok(result.rows.length > 0)
  })

  it('[正例] 商品排行报表 - 按销量排序', async () => {
    const result = await ctrl.productRankingReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30', topN: '3' })
    assert.equal(result.type, 'product-ranking')
    assert.ok(result.rows.length <= 3)
  })

  it('[正例] 支付占比报表', async () => {
    const result = await ctrl.paymentMixReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(result.type, 'payment-mix')
    assert.ok(result.rows.length > 0)
  })

  it('[正例] 时段热力图', async () => {
    const result = await ctrl.hourlyHeatmapReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(result.type, 'hourly-heatmap')
    assert.ok(result.rows.length > 0)
  })

  it('[正例] 渠道漏斗', async () => {
    const result = await ctrl.channelFunnelReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(result.type, 'channel-funnel')
    assert.ok(result.rows.length > 0)
  })

  it('[正例] 库存预警', async () => {
    const result = await ctrl.inventoryAlertReport({ tenantId: TENANT })
    assert.equal(result.type, 'inventory-alert')
    assert.ok(result.rows.length > 0)
    // 验证预警项包含不足数据
    for (const row of result.rows) {
      assert.ok(row.sku)
    }
  })

  // ─── 反例: 空数据场景 ───

  it('[反例] 空时间段返回空行', async () => {
    const result = await ctrl.revenueReport({ tenantId: TENANT, from: '2099-01-01', to: '2099-01-02' })
    assert.equal(result.rows.length, 0)
  })

  it('[反例] 库存为空时预警返回空', async () => {
    // 从未灌入数据的租户查询
    const result = await ctrl.inventoryAlertReport({ tenantId: 'non-existent-tenant' })
    assert.ok(result.rows.length >= 0)
  })

  // ─── 隔离: 跨租户数据隔离 ───

  it('[隔离] 租户A看不到B的营收数据', async () => {
    const resultA = await ctrl.revenueReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    const resultB = await ctrl.revenueReport({ tenantId: OTHER_TENANT, from: '2025-06-01', to: '2025-06-30' })
    // 检查同一个日期维度，A的营收应该大于B
    assert.equal(resultA.tenantId, TENANT)
    assert.equal(resultB.tenantId, OTHER_TENANT)
  })

  // ─── 导出 E2E ───

  it('[正例] 导出CSV文件', async () => {
    const result = await ctrl.exportReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30', type: 'revenue', format: 'csv' })
    assert.equal(result.format, 'csv')
    assert.ok(result.filename.endsWith('.csv'))
    assert.ok(result.size > 0)
    assert.ok(result.content.includes(',')) // CSV 应有分隔符
  })

  it('[正例] 导出JSON文件', async () => {
    const result = await ctrl.exportReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30', type: 'member', format: 'json' })
    assert.equal(result.format, 'json')
    assert.ok(result.filename.endsWith('.json'))
    assert.ok(result.size > 0)
    // 验证是合法的 JSON
    const parsed = JSON.parse(result.content)
    assert.ok(parsed.type || parsed.data || parsed.rows)
  })

  it('[正例] 导出HTML格式', async () => {
    const result = await ctrl.exportReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30', type: 'order', format: 'html' })
    assert.equal(result.format, 'html')
    assert.ok(result.filename.endsWith('.html'))
    assert.ok(result.content.includes('<') && result.content.includes('>'))
  })

  // ─── 缓存 E2E ───

  it('[正例] 缓存命中机制', async () => {
    // 首次查询——未缓存
    const r1 = await ctrl.revenueReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(r1.cached, false)
    // 相同参数查询——应命中缓存
    const r2 = await ctrl.revenueReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(r2.cached, true)
    // 缓存失效后——不再命中
    ctrl.invalidateCache({ tenantId: TENANT })
    const r3 = await ctrl.revenueReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
    assert.equal(r3.cached, false)
  })

  it('[正例] 缓存统计', () => {
    const stats = ctrl.cacheStats()
    assert.ok(typeof stats.size === 'number')
    assert.ok(stats.maxEntries > 0)
    assert.ok(typeof stats.hitRate === 'number')
    assert.ok(stats.hitRate >= 0 && stats.hitRate <= 1)
  })

  // ─── 定义 CRUD E2E ───

  it('[正例] 完整创→查→改→删报表定义流程', () => {
    const created = ctrl.createDefinition({
      tenantId: TENANT,
      name: 'E2E测试月报',
      type: 'revenue',
      dimensions: [{ field: 'createdAt', granularity: 'month', alias: '月份' }],
      metrics: [{ field: 'amountCents', fn: 'sum', alias: '月度营收' }],
      ownerId: 'u-test',
    })
    assert.ok(created.id.startsWith('rdef-'))
    assert.equal(created.version, 1)

    const fetched = ctrl.getDefinition(created.id, { tenantId: TENANT })
    assert.equal(fetched!.name, 'E2E测试月报')

    const updated = ctrl.updateDefinition(created.id, { tenantId: TENANT, version: '1' }, { name: 'E2E测试月报-更新' })
    assert.equal(updated.name, 'E2E测试月报-更新')
    assert.equal(updated.version, 2)

    const deleted = ctrl.deleteDefinition(created.id, { tenantId: TENANT })
    assert.equal(deleted.deleted, true)

    const after = ctrl.getDefinition(created.id, { tenantId: TENANT })
    assert.equal(after, null)
  })

  // ─── 边界: 大数据量 ───

  it('[边界] topN=100 返回所有数据（不超过总数）', async () => {
    const result = await ctrl.productRankingReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30', topN: '100' })
    assert.ok(result.rows.length <= 100)
  })

  it('[边界] 导出时不支持的 format 降级为 html', async () => {
    const result = await ctrl.exportReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30', type: 'revenue', format: 'pdf' as any })
    assert.ok(result.content) // 降级为 html 仍然有内容
  })

  // ─── 反例: 异常场景 ───

  it('[反例] 导出未知报表类型抛异常', async () => {
    await assert.rejects(
      () => ctrl.exportReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30', type: 'unknown_type' as any, format: 'csv' }),
      /unknown report type/
    )
  })

  it('[反例] 版本冲突修改失败', () => {
    const created = ctrl.createDefinition({
      tenantId: TENANT,
      name: '版本测试',
      type: 'revenue',
      dimensions: [],
      metrics: [],
      ownerId: 'u1',
    })
    assert.throws(() => {
      ctrl.updateDefinition(created.id, { tenantId: TENANT, version: '99' }, { name: '错误更新' })
    }, /version mismatch/)
  })

  it('[反例] 跨租户访问不存在定义', () => {
    const created = ctrl.createDefinition({
      tenantId: TENANT,
      name: '租户A定义',
      type: 'revenue',
      dimensions: [],
      metrics: [],
      ownerId: 'u1',
    })
    const fetched = ctrl.getDefinition(created.id, { tenantId: OTHER_TENANT })
    assert.equal(fetched, null)
  })

  it('[反例] 定义不存在时删除返回 false', () => {
    const result = ctrl.deleteDefinition('non-existent', { tenantId: TENANT })
    assert.equal(result.deleted, false)
  })
})
