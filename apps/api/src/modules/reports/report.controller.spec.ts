import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { ReportController } from './report.controller'
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
import { ReportAggregationService } from './report-aggregation.service'
import { ReportCacheService } from './report-cache.service'
import { ReportExportService } from './report-export.service'
import { ReportQueryService } from './report-query.service'
import { PaymentAdapter } from './datasources/payment.adapter'
import { OrderAdapter } from './datasources/order.adapter'
import { InventoryAdapter } from './datasources/inventory.adapter'
import { MemberAdapter } from './datasources/member.adapter'
import { RefundAdapter } from './datasources/refund.adapter'
import * as assert from 'node:assert'

describe('ReportController', () => {
  const TENANT = 'T-001'
  const OTHER_TENANT = 'T-002'

  let controller: ReportController

  async function buildController() {
    const paymentAdapter = new PaymentAdapter()
    const orderAdapter = new OrderAdapter()
    const inventoryAdapter = new InventoryAdapter()
    const memberAdapter = new MemberAdapter()
    const refundAdapter = new RefundAdapter()

    paymentAdapter.seed([
      { id: 'pay-1', tenantId: TENANT, orderId: 'ord-1', amountCents: 500000, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2025-06-15T10:00:00Z' },
      { id: 'pay-2', tenantId: TENANT, orderId: 'ord-2', amountCents: 800000, currency: 'CNY', method: 'ALIPAY', status: 'SUCCESS', createdAt: '2025-06-16T12:00:00Z' },
      { id: 'pay-3', tenantId: TENANT, orderId: 'ord-3', amountCents: 10000, currency: 'CNY', method: 'WECHAT', status: 'REFUNDED', createdAt: '2025-06-17T08:00:00Z' },
      { id: 'pay-5', tenantId: TENANT, orderId: 'ord-5', amountCents: 1000000, currency: 'CNY', method: 'ALIPAY', status: 'SUCCESS', createdAt: '2025-06-20T14:00:00Z' },
      { id: 'pay-99', tenantId: OTHER_TENANT, orderId: 'ord-99', amountCents: 1000, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2025-06-15T10:00:00Z' },
    ])

    orderAdapter.seed([
      { id: 'ord-1', tenantId: TENANT, orderId: 'ord-1', memberId: 'm1', totalCents: 500000, source: 'onsite', itemCount: 1, status: 'COMPLETED', createdAt: '2025-06-15T10:00:00Z' },
      { id: 'ord-2', tenantId: TENANT, orderId: 'ord-2', memberId: 'm1', totalCents: 800000, source: 'online', itemCount: 1, status: 'COMPLETED', createdAt: '2025-06-16T12:00:00Z' },
      { id: 'ord-3', tenantId: TENANT, orderId: 'ord-3', memberId: 'm2', totalCents: 10000, source: 'onsite', itemCount: 2, status: 'REFUNDED', createdAt: '2025-06-17T08:00:00Z' },
      { id: 'ord-4', tenantId: TENANT, orderId: 'ord-4', memberId: 'm3', totalCents: 4000, source: 'onsite', itemCount: 5, status: 'CANCELLED', createdAt: '2025-06-18T09:00:00Z' },
      { id: 'ord-5', tenantId: TENANT, orderId: 'ord-5', memberId: 'm1', totalCents: 1000000, source: 'online', itemCount: 2, status: 'COMPLETED', createdAt: '2025-06-20T14:00:00Z' },
      { id: 'ord-99', tenantId: OTHER_TENANT, orderId: 'ord-99', memberId: 'm99', totalCents: 1000, source: 'onsite', itemCount: 1, status: 'COMPLETED', createdAt: '2025-06-15T10:00:00Z' },
    ])

    refundAdapter.seed([
      { id: 'ref-1', tenantId: TENANT, paymentId: 'pay-3', orderId: 'ord-3', amountCents: 10000, reason: '质量问题', status: 'COMPLETED', createdAt: '2025-06-17T10:00:00Z' },
    ])

    memberAdapter.seed([
      { id: 'm1', tenantId: TENANT, level: 'GOLD', source: 'onsite', status: 'ACTIVE', lifecycleStage: 'ACTIVE', createdAt: '2025-01-01T00:00:00Z', lastActiveAt: '2025-06-20T14:30:00Z' },
      { id: 'm2', tenantId: TENANT, level: 'SILVER', source: 'online', status: 'ACTIVE', lifecycleStage: 'ACTIVE', createdAt: '2025-03-01T00:00:00Z', lastActiveAt: '2025-06-17T08:02:00Z' },
      { id: 'm3', tenantId: TENANT, level: 'BRONZE', source: 'onsite', status: 'DORMANT', lifecycleStage: 'DORMANT', createdAt: '2025-06-01T00:00:00Z' },
    ])

    inventoryAdapter.seed([
      { id: 'inv-1', tenantId: TENANT, sku: 'SKU001', name: '投篮机', category: '设备', totalQty: 5, reservedQty: 0, availableQty: 5, lowStockThreshold: 3, status: 'ACTIVE', unitPriceCents: 500000 },
      { id: 'inv-2', tenantId: TENANT, sku: 'SKU002', name: '跳舞机', category: '设备', totalQty: 0, reservedQty: 0, availableQty: 0, lowStockThreshold: 2, status: 'ACTIVE', unitPriceCents: 800000 },
      { id: 'inv-3', tenantId: TENANT, sku: 'SKU003', name: '毛绒公仔', category: '礼品', totalQty: 50, reservedQty: 0, availableQty: 50, lowStockThreshold: 10, status: 'ACTIVE', unitPriceCents: 5000 },
      { id: 'inv-4', tenantId: TENANT, sku: 'SKU004', name: '饮料', category: '食品', totalQty: 2, reservedQty: 0, availableQty: 2, lowStockThreshold: 10, status: 'ACTIVE', unitPriceCents: 800 },
      { id: 'inv-99', tenantId: OTHER_TENANT, sku: 'SKU099', name: '其他', category: '其他', totalQty: 10, reservedQty: 0, availableQty: 10, lowStockThreshold: 1, status: 'ACTIVE', unitPriceCents: 1000 },
    ])

    const agg = new ReportAggregationService()
    const cache = new ReportCacheService()
    const exportSvc = new ReportExportService()
    const querySvc = new ReportQueryService()

    const revenue = new RevenueReportService(agg, cache, paymentAdapter)
    const invTurn = new InventoryTurnoverService(inventoryAdapter, orderAdapter)
    const memberGrowth = new MemberGrowthService(agg, cache, memberAdapter)
    const refundRate = new RefundRateService(paymentAdapter, refundAdapter)
    const orderConv = new OrderConversionService(orderAdapter)
    const prodRank = new ProductRankingService(orderAdapter)
    const payMix = new PaymentMixService(paymentAdapter)
    const hourlyHeat = new HourlyHeatmapService(orderAdapter)
    const channelFun = new ChannelFunnelService(orderAdapter)
    const invAlert = new InventoryAlertService(inventoryAdapter)

    return new ReportController(
      agg,
      cache,
      exportSvc,
      querySvc,
      revenue,
      invTurn,
      memberGrowth,
      refundRate,
      orderConv,
      prodRank,
      payMix,
      hourlyHeat,
      channelFun,
      invAlert,
    )
  }

  // ═══════════════════════════════════════════════════
  // 正例：10 个核心报表生成
  // ═══════════════════════════════════════════════════

  describe('✔️ 正例 — 报表生成', () => {
    beforeEach(async () => { controller = await buildController() })

    it('revenue — 返回营收报表数据', async () => {
      const result = await controller.revenueReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
      assert.ok(result)
      assert.equal(result.type, 'revenue')
      assert.equal(result.tenantId, TENANT)
      assert.ok(result.rows.length > 0)
    })

    it('inventory — 返回库存周转报表', async () => {
      const result = await controller.inventoryReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
      assert.ok(result)
      assert.equal(result.type, 'inventory')
      assert.ok(result.rows.length > 0)
    })

    it('member — 返回会员增长报表', async () => {
      const result = await controller.memberReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
      assert.ok(result)
      assert.equal(result.type, 'member')
      assert.ok(result.rows.length > 0)
    })

    it('refund — 返回退款率报表', async () => {
      const result = await controller.refundReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
      assert.ok(result)
      assert.equal(result.type, 'refund')
    })

    it('order — 返回订单转化报表', async () => {
      const result = await controller.orderReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
      assert.ok(result)
      assert.equal(result.type, 'order')
    })

    it('product-ranking — 返回商品排行', async () => {
      const result = await controller.productRankingReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30', topN: '3' })
      assert.ok(result)
      assert.equal(result.type, 'product-ranking')
      assert.ok(result.rows.length <= 3)
    })

    it('payment-mix — 返回支付方式分布', async () => {
      const result = await controller.paymentMixReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
      assert.ok(result)
      assert.equal(result.type, 'payment-mix')
    })

    it('hourly-heatmap — 返回小时热度图', async () => {
      const result = await controller.hourlyHeatmapReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
      assert.ok(result)
      assert.equal(result.type, 'hourly-heatmap')
    })

    it('channel-funnel — 返回渠道漏斗', async () => {
      const result = await controller.channelFunnelReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30' })
      assert.ok(result)
      assert.equal(result.type, 'channel-funnel')
    })

    it('inventory-alert — 返回库存预警', async () => {
      const result = await controller.inventoryAlertReport({ tenantId: TENANT })
      assert.ok(result)
      assert.equal(result.type, 'inventory-alert')
      assert.ok(result.rows.length > 0)
    })
  })

  // ═══════════════════════════════════════════════════
  // 正例：报表定义 CRUD
  // ═══════════════════════════════════════════════════

  describe('✔️ 正例 — 报表定义 CRUD', () => {
    beforeEach(async () => { controller = await buildController() })

    it('create + list + get — 完整创建与查询流程', async () => {
      const created = controller.createDefinition({
        tenantId: TENANT,
        name: '日销售报表',
        type: 'revenue',
        ownerId: 'user-1',
        dimensions: [{ field: 'date', alias: '日期' }],
        metrics: [{ field: 'amount', fn: 'sum', alias: '总额' }],
      })
      assert.ok(created.id)
      assert.equal(created.name, '日销售报表')
      assert.equal(created.version, 1)

      const list = controller.listDefinitions({ tenantId: TENANT })
      assert.equal(list.total, 1)
      assert.equal(list.items[0].id, created.id)

      const got = controller.getDefinition(created.id, { tenantId: TENANT })
      assert.ok(got)
      assert.equal(got!.id, created.id)
    })

    it('update — 更新报表定义（带乐观锁）', async () => {
      const created = controller.createDefinition({
        tenantId: TENANT,
        name: '周报',
        type: 'revenue',
        ownerId: 'user-1',
        dimensions: [{ field: 'date', alias: '日期' }],
        metrics: [{ field: 'amount', fn: 'sum', alias: '总额' }],
      })
      const updated = controller.updateDefinition(
        created.id,
        { tenantId: TENANT, version: '1' },
        { name: '月报', metrics: [{ field: 'amount', fn: 'avg', alias: '平均额' }] },
      )
      assert.equal(updated.name, '月报')
      assert.equal(updated.version, 2)
    })

    it('delete — 删除报表定义', async () => {
      const created = controller.createDefinition({
        tenantId: TENANT,
        name: '测试删除',
        type: 'revenue',
        ownerId: 'user-1',
        dimensions: [],
        metrics: [],
      })
      const delResult = controller.deleteDefinition(created.id, { tenantId: TENANT })
      assert.equal(delResult.deleted, true)

      const notFound = controller.getDefinition(created.id, { tenantId: TENANT })
      assert.equal(notFound, null)
    })
  })

  // ═══════════════════════════════════════════════════
  // 正例：导出 & 缓存
  // ═══════════════════════════════════════════════════

  describe('✔️ 正例 — 导出与缓存', () => {
    beforeEach(async () => { controller = await buildController() })

    it('export csv — 导出营收报表为 CSV', async () => {
      const result = await controller.exportReport({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'revenue',
        format: 'csv',
      })
      assert.ok(result.filename.endsWith('.csv') || result.filename.endsWith('.json') || result.filename.endsWith('.html'))
      assert.ok(result.content.length > 0)
    })

    it('export json — 导出库存报表为 JSON', async () => {
      const result = await controller.exportReport({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'inventory',
        format: 'json',
      })
      assert.equal(result.format, 'json')
      assert.ok(result.content.length > 0)
    })

    it('exports — 正常租户可创建并查询完整任务状态', async () => {
      const created = await controller.createBatchExportTask({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'revenue',
        format: 'csv',
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      const task = controller.getBatchExportTask(created.taskId, { tenantId: TENANT })
      assert.ok(task)
      assert.equal(task?.taskId, created.taskId)
      assert.equal(task?.tenantId, TENANT)
      assert.equal(typeof task?.status, 'string')
      assert.equal(typeof task?.filename, 'string')
      assert.equal(typeof task?.size, 'number')
      assert.equal(typeof task?.rowCount, 'number')
      assert.equal(typeof task?.createdAt, 'string')
      assert.equal(typeof task?.expiresAt, 'string')
      assert.equal(typeof task?.completedAt, 'string')
    })

    it('exports list — 正常租户仅能看到自己的导出任务', async () => {
      await controller.createBatchExportTask({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'revenue',
        format: 'csv',
      })

      await controller.createBatchExportTask({
        tenantId: OTHER_TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'member',
        format: 'json',
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      const result = controller.listBatchExportTasks({ tenantId: TENANT })
      assert.ok(result.total >= 1)
      assert.equal(result.total, result.items.length)
      assert.ok(result.items.every(item => item.tenantId === TENANT))
    })

    it('exports list — 支持按状态筛选', async () => {
      const created = await controller.createBatchExportTask({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'revenue',
        format: 'csv',
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      const exportSvc = controller['exportSvc'] as ReportExportService
      const taskStore = exportSvc['taskStore']
      const task = taskStore.get(created.taskId)
      assert.ok(task)
      task.status = 'failed'
      task.error = 'manual failure for filter test'

      const result = controller.listBatchExportTasks({ tenantId: TENANT, status: 'failed' })
      assert.equal(result.total, 1)
      assert.equal(result.items[0]?.taskId, created.taskId)
      assert.ok(result.items.every(item => item.status === 'failed'))
    })

    it('exports list — 支持按报表类型和导出格式组合筛选', async () => {
      await controller.createBatchExportTask({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'revenue',
        format: 'csv',
      })
      const target = await controller.createBatchExportTask({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'member',
        format: 'json',
      })
      await controller.createBatchExportTask({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'member',
        format: 'csv',
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      const result = controller.listBatchExportTasks({
        tenantId: TENANT,
        type: 'member',
        format: 'json',
      })

      assert.equal(result.total, 1)
      assert.equal(result.items[0]?.taskId, target.taskId)
      assert.ok(result.items.every(item => item.type === 'member'))
      assert.ok(result.items.every(item => item.format === 'json'))
    })

    it('exports list — 支持数量限制并按创建时间倒序返回', async () => {
      const first = await controller.createBatchExportTask({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'revenue',
        format: 'csv',
      })
      const second = await controller.createBatchExportTask({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'member',
        format: 'json',
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      const exportSvc = controller['exportSvc'] as ReportExportService
      const taskStore = exportSvc['taskStore']
      const firstTask = taskStore.get(first.taskId)
      const secondTask = taskStore.get(second.taskId)
      assert.ok(firstTask)
      assert.ok(secondTask)
      const now = Date.now()
      firstTask.createdAt = new Date(now - 1000).toISOString()
      secondTask.createdAt = new Date(now).toISOString()

      const result = controller.listBatchExportTasks({ tenantId: TENANT, limit: '1' })
      assert.equal(result.total, 2)
      assert.equal(result.items.length, 1)
      assert.equal(result.items[0]?.taskId, second.taskId)
      assert.equal(result.offset, 0)
      assert.equal(result.limit, 1)
    })

    it('exports list — 支持 offset 分页', async () => {
      const first = await controller.createBatchExportTask({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'revenue',
        format: 'csv',
      })
      const second = await controller.createBatchExportTask({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'member',
        format: 'json',
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      const exportSvc = controller['exportSvc'] as ReportExportService
      const taskStore = exportSvc['taskStore']
      const firstTask = taskStore.get(first.taskId)
      const secondTask = taskStore.get(second.taskId)
      assert.ok(firstTask)
      assert.ok(secondTask)
      const now = Date.now()
      firstTask.createdAt = new Date(now - 1000).toISOString()
      secondTask.createdAt = new Date(now).toISOString()

      const result = controller.listBatchExportTasks({ tenantId: TENANT, limit: '1', offset: '1' })
      assert.equal(result.total, 2)
      assert.equal(result.items.length, 1)
      assert.equal(result.items[0]?.taskId, first.taskId)
      assert.equal(result.offset, 1)
      assert.equal(result.limit, 1)
    })

    it('exports/download — 正常租户可下载真实导出内容', async () => {
      const created = await controller.createBatchExportTask({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'inventory',
        format: 'json',
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      const payload = controller.downloadBatchExportTask(created.taskId, { tenantId: TENANT })
      assert.ok(payload)
      assert.equal(payload?.tenantId, TENANT)
      assert.equal(payload?.format, 'json')
      assert.ok((payload?.content.length ?? 0) > 0)
    })

    it('exports/download — 未完成任务不可下载', async () => {
      const created = await controller.createBatchExportTask({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'inventory',
        format: 'json',
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      const exportSvc = controller['exportSvc'] as ReportExportService
      const taskStore = exportSvc['taskStore']
      const task = taskStore.get(created.taskId)
      assert.ok(task)
      task.status = 'failed'
      task.completedAt = undefined

      const payload = controller.downloadBatchExportTask(created.taskId, { tenantId: TENANT })
      assert.equal(payload, null)
    })

    it('exports delete — 正常租户可删除自己的导出任务', async () => {
      const created = await controller.createBatchExportTask({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'order',
        format: 'csv',
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      const deleted = controller.deleteBatchExportTask(created.taskId, { tenantId: TENANT })
      const task = controller.getBatchExportTask(created.taskId, { tenantId: TENANT })
      const payload = controller.downloadBatchExportTask(created.taskId, { tenantId: TENANT })

      assert.equal(deleted.deleted, true)
      assert.equal(task, null)
      assert.equal(payload, null)
    })

    it('cache/invalidate — 清理指定租户缓存', async () => {
      const result = controller.invalidateCache({ tenantId: TENANT })
      assert.equal(typeof result.invalidated, 'number')
    })

    it('cache/stats — 返回缓存统计', async () => {
      const stats = controller.cacheStats()
      assert.ok('size' in stats)
      assert.ok('maxEntries' in stats)
      assert.ok('hitRate' in stats)
    })
  })

  // ═══════════════════════════════════════════════════
  // 反例：权限边界 & 异常路径
  // ═══════════════════════════════════════════════════

  describe('❌ 反例 — 权限边界 & 异常', () => {
    beforeEach(async () => { controller = await buildController() })

    it('跨租户查询 — 数据隔离（空结果）', async () => {
      const invResult = await controller.inventoryAlertReport({ tenantId: 'T-NONEXIST' })
      assert.equal(invResult.rows.length, 0)
    })

    it('获取不存在的定义 — 返回 null', async () => {
      const result = controller.getDefinition('non-existent', { tenantId: TENANT })
      assert.equal(result, null)
    })

    it('删除不存在的定义 — 返回 deleted:false', async () => {
      const result = controller.deleteDefinition('non-existent', { tenantId: TENANT })
      assert.equal(result.deleted, false)
    })

    it('更新不存在的定义 — 抛 Error', async () => {
      assert.throws(() => {
        controller.updateDefinition('non-existent', { tenantId: TENANT, version: '1' }, { name: '不存在' })
      }, /definition not found/)
    })

    it('更新版本号不匹配 — 抛 version mismatch', async () => {
      const created = controller.createDefinition({
        tenantId: TENANT,
        name: '乐观锁测试',
        type: 'revenue',
        ownerId: 'user-1',
        dimensions: [],
        metrics: [],
      })
      // 用错误版本号
      assert.throws(() => {
        controller.updateDefinition(created.id, { tenantId: TENANT, version: '99' }, { name: '不应该成功' })
      }, /version mismatch/)
    })

    it('跨租户访问定义 — 返回 null', async () => {
      const created = controller.createDefinition({
        tenantId: TENANT,
        name: 'T1专属',
        type: 'member',
        ownerId: 'user-1',
        dimensions: [],
        metrics: [],
      })
      // T-002 看不到 T-001 的定义
      const result = controller.getDefinition(created.id, { tenantId: OTHER_TENANT })
      assert.equal(result, null)
    })

    it('export 未知报表类型 — 抛 Error', async () => {
      await assert.rejects(
        () => controller.exportReport({ tenantId: TENANT, type: 'unknown-type' as any, from: '2025-01-01', to: '2025-12-31' }),
        /unknown report type/
      )
    })

    it('批量导出缺少 tenantId — 抛 BadRequestException', async () => {
      await assert.rejects(
        () => controller.createBatchExportTask({
          from: '2025-06-01',
          to: '2025-06-30',
          type: 'revenue',
          format: 'csv',
        }),
        /tenantId is required/
      )
    })

    it('批量导出缺少 type — 抛 BadRequestException', async () => {
      await assert.rejects(
        () => controller.createBatchExportTask({
          tenantId: TENANT,
          from: '2025-06-01',
          to: '2025-06-30',
          format: 'csv',
        }),
        /type is required/
      )
    })

    it('批量导出缺少 from — 抛 BadRequestException', async () => {
      await assert.rejects(
        () => controller.createBatchExportTask({
          tenantId: TENANT,
          to: '2025-06-30',
          type: 'revenue',
          format: 'csv',
        }),
        /from is required/
      )
    })

    it('批量导出缺少 to — 抛 BadRequestException', async () => {
      await assert.rejects(
        () => controller.createBatchExportTask({
          tenantId: TENANT,
          from: '2025-06-01',
          type: 'revenue',
          format: 'csv',
        }),
        /to is required/
      )
    })

    it('批量导出不支持的格式 — 抛 BadRequestException', async () => {
      await assert.rejects(
        () => controller.createBatchExportTask({
          tenantId: TENANT,
          from: '2025-06-01',
          to: '2025-06-30',
          type: 'revenue',
          format: 'pdf' as any,
        }),
        /Unsupported batch export format: pdf/
      )
    })

    it('批量导出 xlsx 格式 — 抛 BadRequestException', async () => {
      await assert.rejects(
        () => controller.createBatchExportTask({
          tenantId: TENANT,
          from: '2025-06-01',
          to: '2025-06-30',
          type: 'revenue',
          format: 'xlsx' as any,
        }),
        /Unsupported batch export format: xlsx/
      )
    })

    it('跨租户查询批量导出任务 — 返回 null', async () => {
      const created = await controller.createBatchExportTask({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'revenue',
        format: 'csv',
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      const task = controller.getBatchExportTask(created.taskId, { tenantId: OTHER_TENANT })
      assert.equal(task, null)
    })

    it('跨租户查询批量导出任务列表 — 不返回其他租户数据', async () => {
      await controller.createBatchExportTask({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'revenue',
        format: 'csv',
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      const result = controller.listBatchExportTasks({ tenantId: OTHER_TENANT })
      assert.equal(result.total, 0)
      assert.equal(result.items.length, 0)
    })

    it('跨租户下载批量导出内容 — 返回 null', async () => {
      const created = await controller.createBatchExportTask({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'member',
        format: 'html',
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      const payload = controller.downloadBatchExportTask(created.taskId, { tenantId: OTHER_TENANT })
      assert.equal(payload, null)
    })

    it('跨租户删除批量导出任务 — 返回 deleted:false', async () => {
      const created = await controller.createBatchExportTask({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'order',
        format: 'csv',
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      const deleted = controller.deleteBatchExportTask(created.taskId, { tenantId: OTHER_TENANT })
      const task = controller.getBatchExportTask(created.taskId, { tenantId: TENANT })

      assert.equal(deleted.deleted, false)
      assert.ok(task)
    })

    it('过期任务下载 — 返回 null', async () => {
      const created = await controller.createBatchExportTask({
        tenantId: TENANT,
        from: '2025-06-01',
        to: '2025-06-30',
        type: 'order',
        format: 'csv',
      })

      await new Promise(resolve => setTimeout(resolve, 0))

      const exportSvc = controller['exportSvc'] as ReportExportService
      const taskStore = exportSvc['taskStore']
      const task = taskStore.get(created.taskId)
      assert.ok(task)
      task.expiresAt = '2000-01-01T00:00:00.000Z'
      exportSvc.cleanupExpiredTasks()

      const payload = controller.downloadBatchExportTask(created.taskId, { tenantId: TENANT })
      assert.equal(payload, null)
    })
  })

  // ═══════════════════════════════════════════════════
  // 边界：空数据 / 极值
  // ═══════════════════════════════════════════════════

  describe('⚡ 边界 — 空数据 & 极值', () => {
    beforeEach(async () => { controller = await buildController() })

    it('空时间范围的营收报表 — 返回空 rows', async () => {
      // 与种子数据完全不重叠的日期范围
      const result = await controller.revenueReport({ tenantId: TENANT, from: '2020-01-01', to: '2020-01-02' })
      assert.equal(result.rows.length, 0)
    })

    it('product-ranking topN=1 — 只返回 1 条', async () => {
      const result = await controller.productRankingReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30', topN: '1' })
      assert.ok(result.rows.length <= 1)
    })

    it('product-ranking topN=0 — 返回空或默认', async () => {
      const result = await controller.productRankingReport({ tenantId: TENANT, from: '2025-06-01', to: '2025-06-30', topN: '0' })
      assert.ok(result.rows.length === 0 || result.rows.length === 10)
    })

    it('inventory-alert — 预警列表含严重缺货项', async () => {
      const result = await controller.inventoryAlertReport({ tenantId: TENANT })
      // SKU002 跳舞机可用库存 0 < 阈值 2 → severity=CRITICAL / HIGH / MEDIUM
      const critical = result.rows.filter((r: any) => r.severity === 'CRITICAL' || r.severity === 'HIGH')
      assert.ok(critical.length > 0)
    })
  })
})
