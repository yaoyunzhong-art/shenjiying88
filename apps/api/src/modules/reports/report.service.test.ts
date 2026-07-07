import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { ReportService } from './report.service'
import { ReportAggregationService } from './report-aggregation.service'
import { ReportCacheService } from './report-cache.service'
import { ReportExportService } from './report-export.service'
import { ReportQueryService } from './report-query.service'
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
import { PaymentAdapter } from './datasources/payment.adapter'
import { OrderAdapter } from './datasources/order.adapter'
import { InventoryAdapter } from './datasources/inventory.adapter'
import { MemberAdapter } from './datasources/member.adapter'
import { RefundAdapter } from './datasources/refund.adapter'

describe('ReportService', () => {
  const TENANT = 'T-001'
  const OTHER_TENANT = 'T-099'

  let service: ReportService

  function buildService() {
    const paymentAdapter = new PaymentAdapter()
    const orderAdapter = new OrderAdapter()
    const inventoryAdapter = new InventoryAdapter()
    const memberAdapter = new MemberAdapter()
    const refundAdapter = new RefundAdapter()
    const agg = new ReportAggregationService()
    const cache = new ReportCacheService()
    const exportSvc = new ReportExportService()
    const querySvc = new ReportQueryService()

    paymentAdapter.seed([
      { id: 'pay-1', tenantId: TENANT, orderId: 'ord-1', amountCents: 500000, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2025-06-15T10:00:00Z' },
      { id: 'pay-2', tenantId: TENANT, orderId: 'ord-2', amountCents: 800000, currency: 'CNY', method: 'ALIPAY', status: 'SUCCESS', createdAt: '2025-06-16T12:00:00Z' },
    ])
    orderAdapter.seed([
      { id: 'ord-1', tenantId: TENANT, orderId: 'ord-1', memberId: 'm1', totalCents: 500000, source: 'onsite', itemCount: 1, status: 'COMPLETED', createdAt: '2025-06-15T10:00:00Z' },
      { id: 'ord-2', tenantId: TENANT, orderId: 'ord-2', memberId: 'm1', totalCents: 800000, source: 'online', itemCount: 1, status: 'COMPLETED', createdAt: '2025-06-16T12:00:00Z' },
    ])
    memberAdapter.seed([
      { id: 'm1', tenantId: TENANT, level: 'GOLD', source: 'onsite', status: 'ACTIVE', lifecycleStage: 'ACTIVE', createdAt: '2025-01-01T00:00:00Z', lastActiveAt: '2025-06-20T14:30:00Z' },
    ])
    inventoryAdapter.seed([
      { id: 'inv-1', tenantId: TENANT, sku: 'SKU001', name: '投篮机', category: '设备', totalQty: 5, reservedQty: 0, availableQty: 5, lowStockThreshold: 3, status: 'ACTIVE', unitPriceCents: 500000 },
    ])
    refundAdapter.seed([])

    const revenue = new RevenueReportService(agg, cache, paymentAdapter)
    const inventoryTurnover = new InventoryTurnoverService(inventoryAdapter, orderAdapter)
    const memberGrowth = new MemberGrowthService(agg, cache, memberAdapter)
    const refundRate = new RefundRateService(paymentAdapter, refundAdapter)
    const orderConversion = new OrderConversionService(orderAdapter)
    const productRanking = new ProductRankingService(orderAdapter)
    const paymentMix = new PaymentMixService(paymentAdapter)
    const hourlyHeatmap = new HourlyHeatmapService(orderAdapter)
    const channelFunnel = new ChannelFunnelService(orderAdapter)
    const inventoryAlert = new InventoryAlertService(inventoryAdapter)

    return new ReportService(
      agg, cache, exportSvc, querySvc,
      revenue, inventoryTurnover, memberGrowth, refundRate,
      orderConversion, productRanking, paymentMix, hourlyHeatmap,
      channelFunnel, inventoryAlert
    )
  }

  beforeEach(() => {
    service = buildService()
  })

  // ─── query ─────────────────────────────────────────────

  describe('query', () => {
    it('should return revenue report for valid input', async () => {
      const result = await service.query({
        tenantId: TENANT,
        type: 'revenue',
        from: '2025-06-01',
        to: '2025-06-30',
      })
      assert.ok(result)
      assert.equal(result.type, 'revenue')
      assert.equal(result.tenantId, TENANT)
      assert.ok(result.rows.length > 0)
    })

    it('should throw for unknown report type', async () => {
      await assert.rejects(
        () => service.query({
          tenantId: TENANT,
          type: 'unknown-type' as any,
          from: '2025-06-01',
          to: '2025-06-30',
        }),
        /unknown report type/
      )
    })

    it('should return cached result when available and noCache is false', async () => {
      const result1 = await service.query({ tenantId: TENANT, type: 'revenue', from: '2025-06-01', to: '2025-06-30' })
      assert.equal(result1.cached, false)

      const result2 = await service.query({ tenantId: TENANT, type: 'revenue', from: '2025-06-01', to: '2025-06-30' })
      assert.equal(result2.cached, true)
    })

    it('should skip cache when noCache=true', async () => {
      const result = await service.query({
        tenantId: TENANT,
        type: 'revenue',
        from: '2025-06-01',
        to: '2025-06-30',
        noCache: true,
      })
      assert.ok(result)
      assert.equal(result.cached, false)
    })

    it('should return inventory-alert report', async () => {
      const result = await service.query({
        tenantId: TENANT,
        type: 'inventory-alert',
        from: '2025-06-01',
        to: '2025-06-30',
      })
      assert.ok(result)
      assert.equal(result.type, 'inventory-alert')
    })

    it('should enforce tenant isolation – other tenant has no data', async () => {
      const result = await service.query({
        tenantId: OTHER_TENANT,
        type: 'revenue',
        from: '2025-06-01',
        to: '2025-06-30',
      })
      assert.equal(result.rows.length, 0)
    })

    it('should return member report', async () => {
      const result = await service.query({
        tenantId: TENANT,
        type: 'member',
        from: '2025-06-01',
        to: '2025-06-30',
      })
      assert.ok(result)
      assert.equal(result.type, 'member')
    })

    it('should return refund report with zero data when no refunds', async () => {
      const result = await service.query({
        tenantId: TENANT,
        type: 'refund',
        from: '2025-06-01',
        to: '2025-06-30',
      })
      assert.ok(result)
      assert.equal(result.type, 'refund')
    })
  })

  // ─── 报表定义 CRUD ──────────────────────────────────────

  describe('createDefinition / getDefinition', () => {
    it('should create and retrieve a report definition', () => {
      const def = service.createDefinition({
        tenantId: TENANT,
        name: '月度营收',
        type: 'revenue',
        dimensions: [{ field: 'createdAt', granularity: 'day', alias: '日期' }],
        metrics: [{ field: 'amountCents', fn: 'sum', alias: '营收' }],
        ownerId: 'admin-1',
      })
      assert.match(def.id, /^rdef-/)
      assert.equal(def.version, 1)

      const retrieved = service.getDefinition(def.id, TENANT)
      assert.ok(retrieved)
      assert.equal(retrieved!.name, '月度营收')
    })

    it('should return null when definition belongs to another tenant', () => {
      const def = service.createDefinition({
        tenantId: TENANT,
        name: '测试',
        type: 'revenue',
        dimensions: [],
        metrics: [],
        ownerId: 'admin-1',
      })
      const retrieved = service.getDefinition(def.id, OTHER_TENANT)
      assert.equal(retrieved, null)
    })

    it('should return null for non-existing id', () => {
      const retrieved = service.getDefinition('non-existent', TENANT)
      assert.equal(retrieved, null)
    })
  })

  describe('listDefinitions', () => {
    it('should list definitions for a tenant', () => {
      service.createDefinition({ tenantId: TENANT, name: '报表A', type: 'revenue', dimensions: [], metrics: [], ownerId: 'admin-1' })
      service.createDefinition({ tenantId: TENANT, name: '报表B', type: 'member', dimensions: [], metrics: [], ownerId: 'admin-1' })
      const result = service.listDefinitions(TENANT)
      assert.equal(result.total, 2)
      assert.equal(result.items.length, 2)
    })

    it('should not include other tenant definitions', () => {
      service.createDefinition({ tenantId: TENANT, name: '我的报表', type: 'revenue', dimensions: [], metrics: [], ownerId: 'admin-1' })
      const result = service.listDefinitions(OTHER_TENANT)
      assert.equal(result.total, 0)
    })
  })

  describe('updateDefinition', () => {
    it('should update definition fields and increment version', () => {
      const def = service.createDefinition({ tenantId: TENANT, name: '原名称', type: 'revenue', dimensions: [], metrics: [], ownerId: 'admin-1' })
      const updated = service.updateDefinition(def.id, TENANT, def.version, { name: '新名称' })
      assert.equal(updated.name, '新名称')
      assert.equal(updated.version, 2)
    })

    it('should throw on version mismatch', () => {
      const def = service.createDefinition({ tenantId: TENANT, name: '测试', type: 'revenue', dimensions: [], metrics: [], ownerId: 'admin-1' })
      assert.throws(() => service.updateDefinition(def.id, TENANT, 999, { name: '新名称' }), /version mismatch/)
    })

    it('should throw on tenant mismatch', () => {
      const def = service.createDefinition({ tenantId: TENANT, name: '测试', type: 'revenue', dimensions: [], metrics: [], ownerId: 'admin-1' })
      assert.throws(() => service.updateDefinition(def.id, OTHER_TENANT, def.version, { name: '新名称' }), /definition not found/)
    })
  })

  describe('deleteDefinition', () => {
    it('should delete existing definition', () => {
      const def = service.createDefinition({ tenantId: TENANT, name: '待删除', type: 'revenue', dimensions: [], metrics: [], ownerId: 'admin-1' })
      const deleted = service.deleteDefinition(def.id, TENANT)
      assert.equal(deleted, true)
      assert.equal(service.getDefinition(def.id, TENANT), null)
    })

    it('should return false for non-existing or wrong tenant', () => {
      const def = service.createDefinition({ tenantId: TENANT, name: '测试', type: 'revenue', dimensions: [], metrics: [], ownerId: 'admin-1' })
      assert.equal(service.deleteDefinition('non-existent', TENANT), false)
      assert.equal(service.deleteDefinition(def.id, OTHER_TENANT), false)
    })
  })

  // ─── 导出 ──────────────────────────────────────────────

  describe('export', () => {
    it('should export revenue report as JSON', async () => {
      const result = await service.export({
        tenantId: TENANT,
        type: 'revenue',
        format: 'json',
        from: '2025-06-01',
        to: '2025-06-30',
      })
      assert.equal(result.format, 'json')
      assert.equal(typeof result.content, 'string')
      assert.ok(result.size > 0)
    })

    it('should export revenue report as CSV', async () => {
      const result = await service.export({
        tenantId: TENANT,
        type: 'revenue',
        format: 'csv',
        from: '2025-06-01',
        to: '2025-06-30',
      })
      assert.equal(result.format, 'csv')
      assert.match(result.filename, /\.csv$/)
    })

    it('should export revenue report as HTML', async () => {
      const result = await service.export({
        tenantId: TENANT,
        type: 'revenue',
        format: 'html',
        from: '2025-06-01',
        to: '2025-06-30',
      })
      assert.equal(result.format, 'html')
      assert.ok(result.content.length > 0)
    })
  })

  // ─── 缓存管理 ──────────────────────────────────────────

  describe('invalidateCache / cacheStats', () => {
    it('should return cache stats object', () => {
      const stats = service.cacheStats()
      assert.ok(stats)
      assert.equal(typeof stats.hits, 'number')
      assert.equal(typeof stats.misses, 'number')
    })

    it('should invalidate cache entries after query', async () => {
      // First query populates cache
      await service.query({ tenantId: TENANT, type: 'revenue', from: '2025-06-01', to: '2025-06-30' })
      // Second query hits cache
      const cached = await service.query({ tenantId: TENANT, type: 'revenue', from: '2025-06-01', to: '2025-06-30' })
      assert.equal(cached.cached, true)

      // Invalidate
      const count = service.invalidateCache(TENANT)
      assert.ok(count > 0)

      // After invalidation, fresh query is not served from cache (newly generated)
      const fresh = await service.query({ tenantId: TENANT, type: 'revenue', from: '2025-06-01', to: '2025-06-30' })
      assert.equal(fresh.cached, false)
    })
  })
})
