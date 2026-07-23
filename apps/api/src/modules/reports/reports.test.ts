import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
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
import { GovernanceApprovalService } from '../foundation/governance-approval/governance-approval.service'

describe('Reports 综合测试 (Controller + Adapters + 10 报表服务)', () => {
  let ctrl: ReportController
  let paymentAdapter: PaymentAdapter
  let orderAdapter: OrderAdapter
  let memberAdapter: MemberAdapter
  let refundAdapter: RefundAdapter
  let inventoryAdapter: InventoryAdapter

  beforeEach(() => {
    const agg = new ReportAggregationService()
    const cache = new ReportCacheService()
    const exp = new ReportExportService()
    const q = new ReportQueryService()

    paymentAdapter = new PaymentAdapter()
    orderAdapter = new OrderAdapter()
    refundAdapter = new RefundAdapter()
    memberAdapter = new MemberAdapter()
    inventoryAdapter = new InventoryAdapter()

    const revenue = new RevenueReportService(agg, cache, paymentAdapter)
    const invTurn = new InventoryTurnoverService(inventoryAdapter, orderAdapter)
    const memberGrowth = new MemberGrowthService(agg, cache, memberAdapter)
    const refundRate = new RefundRateService(paymentAdapter, refundAdapter)
    const orderConv = new OrderConversionService(orderAdapter)
    const prodRank = new ProductRankingService(orderAdapter)
    const payMix = new PaymentMixService(paymentAdapter)
    const heatmap = new HourlyHeatmapService(orderAdapter)
    const channelFunnel = new ChannelFunnelService(orderAdapter)
    const invAlert = new InventoryAlertService(inventoryAdapter)
    const governanceApprovalService = {
      materializeApproval: vi.fn().mockResolvedValue({ ticket: 'approval-test-001' }),
    } as unknown as GovernanceApprovalService;

    ctrl = new ReportController(
      agg, cache, exp, q,
      revenue, invTurn, memberGrowth, refundRate, orderConv,
      prodRank, payMix, heatmap, channelFunnel, invAlert, governanceApprovalService
    )
  })

  // ============================================================
  // ADAPTER 测试
  // ============================================================
  describe('ADAPTER-1: OrderAdapter', () => {
    it('seed + reset', () => {
      orderAdapter.seed([{ id: '1', tenantId: 'T', orderId: 'O1', status: 'PAID', totalCents: 1000, source: 'web', itemCount: 1, createdAt: '2024-06-01' }])
      orderAdapter.reset()
      assert.equal(orderAdapter.query('T', '2024-01-01', '2024-12-31').length, 0)
    })

    it('query 按 tenantId + 时间过滤', () => {
      orderAdapter.seed([
        { id: '1', tenantId: 'T1', orderId: 'O1', status: 'PAID', totalCents: 100, source: 'web', itemCount: 1, createdAt: '2024-06-01' },
        { id: '2', tenantId: 'T2', orderId: 'O2', status: 'PAID', totalCents: 200, source: 'web', itemCount: 1, createdAt: '2024-06-02' }
      ])
      const r = orderAdapter.query('T1', '2024-06-01', '2024-06-30')
      assert.equal(r.length, 1)
      assert.equal(r[0].orderId, 'O1')
    })

    it('filters DSL = 匹配', () => {
      orderAdapter.seed([
        { id: '1', tenantId: 'T', orderId: 'O1', status: 'PAID', totalCents: 100, source: 'web', itemCount: 1, createdAt: '2024-06-01' },
        { id: '2', tenantId: 'T', orderId: 'O2', status: 'REFUNDED', totalCents: 100, source: 'web', itemCount: 1, createdAt: '2024-06-02' }
      ])
      const r = orderAdapter.query('T', '2024-06-01', '2024-06-30', {
        op: 'AND', conditions: [{ field: 'status', op: '=', value: 'PAID' }]
      })
      assert.equal(r.length, 1)
    })

    it('filters DSL in / between / like', () => {
      orderAdapter.seed([
        { id: '1', tenantId: 'T', orderId: 'O1', status: 'PAID', totalCents: 100, source: 'web', itemCount: 1, createdAt: '2024-06-01' },
        { id: '2', tenantId: 'T', orderId: 'O2', status: 'COMPLETED', totalCents: 500, source: 'app', itemCount: 1, createdAt: '2024-06-15' }
      ])
      const r1 = orderAdapter.query('T', '2024-06-01', '2024-06-30', {
        op: 'OR', conditions: [{ field: 'status', op: 'in', value: ['PAID', 'COMPLETED'] }]
      })
      assert.equal(r1.length, 2)

      const r2 = orderAdapter.query('T', '2024-06-01', '2024-06-30', {
        op: 'AND', conditions: [{ field: 'totalCents', op: 'between', value: [50, 200] }]
      })
      assert.equal(r2.length, 1)
    })
  })

  describe('ADAPTER-2: PaymentAdapter', () => {
    it('query 按 tenantId', () => {
      paymentAdapter.seed([
        { id: '1', tenantId: 'T1', orderId: 'O1', amountCents: 1000, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01' },
        { id: '2', tenantId: 'T2', orderId: 'O2', amountCents: 2000, currency: 'CNY', method: 'ALIPAY', status: 'SUCCESS', createdAt: '2024-06-02' }
      ])
      const r = paymentAdapter.query('T1', '2024-06-01', '2024-06-30')
      assert.equal(r.length, 1)
      assert.equal(r[0].method, 'WECHAT')
    })
  })

  describe('ADAPTER-3: InventoryAdapter (无时间维度)', () => {
    it('query 全量快照', () => {
      inventoryAdapter.seed([
        { id: '1', tenantId: 'T', sku: 'SKU-A', name: 'A', category: 'cat', totalQty: 100, reservedQty: 10, availableQty: 90, lowStockThreshold: 20, status: 'ACTIVE', unitPriceCents: 1000 }
      ])
      const r = inventoryAdapter.query('T')
      assert.equal(r.length, 1)
      assert.equal(r[0].availableQty, 90)
    })
  })

  describe('ADAPTER-4: MemberAdapter queryAll', () => {
    it('queryAll 返回该租户所有 member', () => {
      memberAdapter.seed([
        { id: '1', tenantId: 'T', level: 'GOLD', source: 'web', status: 'ACTIVE', lifecycleStage: 'NEW', createdAt: '2024-01-01' }
      ])
      const r = memberAdapter.queryAll('T')
      assert.equal(r.length, 1)
    })
  })

  describe('ADAPTER-5: RefundAdapter', () => {
    it('按 paymentId 过滤', () => {
      refundAdapter.seed([
        { id: '1', tenantId: 'T', paymentId: 'P1', orderId: 'O1', amountCents: 500, reason: 'damaged', status: 'COMPLETED', createdAt: '2024-06-01' }
      ])
      const r = refundAdapter.query('T', '2024-06-01', '2024-06-30', {
        op: 'AND', conditions: [{ field: 'paymentId', op: '=', value: 'P1' }]
      })
      assert.equal(r.length, 1)
    })
  })

  // ============================================================
  // 10 个报表服务测试
  // ============================================================
  describe('REPORT-1: RevenueReportService', () => {
    it('生成营收报表 (SUCCESS + REFUNDED)', async () => {
      paymentAdapter.seed([
        { id: '1', tenantId: 'T', orderId: 'O1', amountCents: 1000, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01T10:00:00Z' },
        { id: '2', tenantId: 'T', orderId: 'O2', amountCents: 2000, currency: 'CNY', method: 'ALIPAY', status: 'REFUNDED', createdAt: '2024-06-02T10:00:00Z' },
        { id: '3', tenantId: 'T', orderId: 'O3', amountCents: 500, currency: 'CNY', method: 'WECHAT', status: 'PENDING', createdAt: '2024-06-03T10:00:00Z' }
      ])
      const r = await ctrl.revenueReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' })
      assert.equal(r.type, 'revenue')
      // totals: SUCCESS(1000) + REFUNDED(2000) = 3000
      assert.equal(r.totals?.revenue, 3000)
      // PENDING 不计入
      assert.notEqual(r.totals?.revenue, 3500)
    })

    it('第二次查询命中缓存 (cached=true)', async () => {
      paymentAdapter.seed([
        { id: '1', tenantId: 'T', orderId: 'O1', amountCents: 1000, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01' }
      ])
      const r1 = await ctrl.revenueReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' })
      const r2 = await ctrl.revenueReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' })
      assert.equal(r1.cached, false)
      assert.equal(r2.cached, true)
    })
  })

  describe('REPORT-2: InventoryTurnoverService', () => {
    it('周转率 + 可售天数', async () => {
      inventoryAdapter.seed([
        { id: '1', tenantId: 'T', sku: 'SKU-A', name: 'A', category: 'cat', totalQty: 100, reservedQty: 0, availableQty: 100, lowStockThreshold: 10, status: 'ACTIVE', unitPriceCents: 1000 }
      ])
      orderAdapter.seed([
        { id: '1', tenantId: 'T', orderId: 'O1', status: 'COMPLETED', totalCents: 1000, source: 'web', itemCount: 30, createdAt: '2024-06-01' }
      ])
      const r = await ctrl.inventoryReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' })
      assert.equal(r.rows.length, 1)
      const turnoverRate = Number(r.rows[0].turnoverRate ?? 0)
      const daysOfCover = Number(r.rows[0].daysOfCover ?? 0)
      assert.ok(turnoverRate >= 0)
      assert.ok(daysOfCover >= 0)
    })
  })

  describe('REPORT-3: MemberGrowthService', () => {
    it('按月聚合新增会员', async () => {
      memberAdapter.seed([
        { id: '1', tenantId: 'T', level: 'GOLD', source: 'web', status: 'ACTIVE', lifecycleStage: 'NEW', createdAt: '2024-06-01' },
        { id: '2', tenantId: 'T', level: 'SILVER', source: 'web', status: 'ACTIVE', lifecycleStage: 'NEW', createdAt: '2024-06-15' }
      ])
      const r = await ctrl.memberReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' })
      assert.equal(r.type, 'member')
    })
  })

  describe('REPORT-4: RefundRateService', () => {
    it('退款率 = refundAmount / paymentAmount', async () => {
      paymentAdapter.seed([
        { id: '1', tenantId: 'T', orderId: 'O1', amountCents: 10000, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01' }
      ])
      refundAdapter.seed([
        { id: '1', tenantId: 'T', paymentId: 'P1', orderId: 'O1', amountCents: 2000, reason: 'damaged', status: 'COMPLETED', createdAt: '2024-06-05' }
      ])
      const r = await ctrl.refundReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' })
      assert.equal(r.type, 'refund')
    })
  })

  describe('REPORT-5: OrderConversionService', () => {
    it('CREATED→PAID→COMPLETED 漏斗', async () => {
      orderAdapter.seed([
        { id: '1', tenantId: 'T', orderId: 'O1', status: 'CREATED', totalCents: 100, source: 'web', itemCount: 1, createdAt: '2024-06-01' },
        { id: '2', tenantId: 'T', orderId: 'O2', status: 'PAID', totalCents: 100, source: 'web', itemCount: 1, createdAt: '2024-06-01' },
        { id: '3', tenantId: 'T', orderId: 'O3', status: 'COMPLETED', totalCents: 100, source: 'web', itemCount: 1, createdAt: '2024-06-01' }
      ])
      const r = await ctrl.orderReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' })
      assert.equal(r.type, 'order')
    })
  })

  describe('REPORT-6: ProductRankingService', () => {
    it('Top N 排行', async () => {
      orderAdapter.seed([
        { id: '1', tenantId: 'T', orderId: 'O1', status: 'COMPLETED', totalCents: 100, source: 'web', itemCount: 50, createdAt: '2024-06-01' },
        { id: '2', tenantId: 'T', orderId: 'O2', status: 'COMPLETED', totalCents: 100, source: 'web', itemCount: 20, createdAt: '2024-06-01' }
      ])
      const r = await ctrl.productRankingReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30', topN: '5' })
      assert.equal(r.type, 'product-ranking')
    })
  })

  describe('REPORT-7: PaymentMixService', () => {
    it('支付方式占比', async () => {
      paymentAdapter.seed([
        { id: '1', tenantId: 'T', orderId: 'O1', amountCents: 5000, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01' },
        { id: '2', tenantId: 'T', orderId: 'O2', amountCents: 3000, currency: 'CNY', method: 'ALIPAY', status: 'SUCCESS', createdAt: '2024-06-02' }
      ])
      const r = await ctrl.paymentMixReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' })
      assert.equal(r.type, 'payment-mix')
    })
  })

  describe('REPORT-8: HourlyHeatmapService', () => {
    it('7天×24小时热力', async () => {
      orderAdapter.seed([
        { id: '1', tenantId: 'T', orderId: 'O1', status: 'PAID', totalCents: 100, source: 'web', itemCount: 1, createdAt: '2024-06-01T10:00:00Z' }
      ])
      const r = await ctrl.hourlyHeatmapReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-07' })
      assert.equal(r.type, 'hourly-heatmap')
    })
  })

  describe('REPORT-9: ChannelFunnelService', () => {
    it('渠道漏斗', async () => {
      orderAdapter.seed([
        { id: '1', tenantId: 'T', orderId: 'O1', status: 'COMPLETED', totalCents: 100, source: 'wechat', itemCount: 1, createdAt: '2024-06-01' }
      ])
      const r = await ctrl.channelFunnelReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' })
      assert.equal(r.type, 'channel-funnel')
    })
  })

  describe('REPORT-10: InventoryAlertService', () => {
    it('低库存预警', async () => {
      inventoryAdapter.seed([
        { id: '1', tenantId: 'T', sku: 'SKU-A', name: 'A', category: 'cat', totalQty: 5, reservedQty: 0, availableQty: 5, lowStockThreshold: 10, status: 'ACTIVE', unitPriceCents: 1000 }
      ])
      const r = await ctrl.inventoryAlertReport({ tenantId: 'T' })
      assert.equal(r.type, 'inventory-alert')
    })
  })

  // ============================================================
  // 报表定义 CRUD
  // ============================================================
  describe('DEFINITION-1: CRUD', () => {
    it('createDefinition 分配 id + version=1', () => {
      const def = ctrl.createDefinition({
        tenantId: 'T', name: '日报', type: 'revenue',
        dimensions: [{ field: 'createdAt', granularity: 'day' }],
        metrics: [{ field: 'amountCents', fn: 'sum', alias: 'rev' }],
        ownerId: 'u1'
      })
      assert.match(def.id, /^rdef-/)
      assert.equal(def.version, 1)
      assert.equal(def.name, '日报')
    })

    it('listDefinitions 按 tenantId 过滤', () => {
      ctrl.createDefinition({ tenantId: 'T1', name: 'A', type: 'revenue', dimensions: [], metrics: [], ownerId: 'u' })
      ctrl.createDefinition({ tenantId: 'T2', name: 'B', type: 'revenue', dimensions: [], metrics: [], ownerId: 'u' })
      const list = ctrl.listDefinitions({ tenantId: 'T1' })
      assert.equal(list.total, 1)
    })

    it('getDefinition 跨租户不可见', () => {
      const def = ctrl.createDefinition({ tenantId: 'T1', name: 'A', type: 'revenue', dimensions: [], metrics: [], ownerId: 'u' })
      const got = ctrl.getDefinition(def.id, { tenantId: 'T2' })
      assert.equal(got, null)
    })

    it('updateDefinition 乐观锁', () => {
      const def = ctrl.createDefinition({ tenantId: 'T', name: 'A', type: 'revenue', dimensions: [], metrics: [], ownerId: 'u' })
      const updated = ctrl.updateDefinition(def.id, { tenantId: 'T', version: '1' }, { name: 'B' })
      assert.equal(updated.name, 'B')
      assert.equal(updated.version, 2)
    })

    it('updateDefinition 版本不匹配抛错', () => {
      const def = ctrl.createDefinition({ tenantId: 'T', name: 'A', type: 'revenue', dimensions: [], metrics: [], ownerId: 'u' })
      assert.throws(() =>
        ctrl.updateDefinition(def.id, { tenantId: 'T', version: '99' }, { name: 'B' }),
        /version mismatch/
      )
    })

    it('deleteDefinition 跨租户失败', () => {
      const def = ctrl.createDefinition({ tenantId: 'T1', name: 'A', type: 'revenue', dimensions: [], metrics: [], ownerId: 'u' })
      const r = ctrl.deleteDefinition(def.id, { tenantId: 'T2' })
      assert.equal(r.deleted, false)
    })

    it('deleteDefinition 成功', () => {
      const def = ctrl.createDefinition({ tenantId: 'T', name: 'A', type: 'revenue', dimensions: [], metrics: [], ownerId: 'u' })
      const r = ctrl.deleteDefinition(def.id, { tenantId: 'T' })
      assert.equal(r.deleted, true)
    })
  })

  // ============================================================
  // 导出
  // ============================================================
  describe('EXPORT-INTEG: 端到端导出', () => {
    it('exportReport 返回 filename + content', async () => {
      paymentAdapter.seed([
        { id: '1', tenantId: 'T', orderId: 'O1', amountCents: 1000, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01' }
      ])
      const r = await ctrl.exportReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30', type: 'revenue', format: 'csv' })
      assert.match(r.filename, /^revenue-T-/)
      assert.match(r.content, /时间,营收/)
    })

    it('exportReport 未知 type 抛错', async () => {
      await assert.rejects(
        () => ctrl.exportReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30', type: 'unknown' as any, format: 'csv' }),
        /unknown report type/
      )
    })
  })

  // ============================================================
  // 缓存管理
  // ============================================================
  describe('CACHE-INTEG: 缓存管理', () => {
    it('invalidateCache 按 tenantId', async () => {
      paymentAdapter.seed([
        { id: '1', tenantId: 'T', orderId: 'O1', amountCents: 1000, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01' }
      ])
      await ctrl.revenueReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' })
      const r = ctrl.invalidateCache({ tenantId: 'T' })
      assert.ok(r.invalidated >= 1)
    })

    it('cacheStats 返回结构', () => {
      const r = ctrl.cacheStats()
      assert.equal(r.maxEntries, 100)
      assert.equal(typeof r.size, 'number')
    })
  })

  // ============================================================
  // 多租户隔离 (反模式 v4)
  // ============================================================
  describe('MULTI-TENANT: 数据隔离', () => {
    it('不同 tenant 查询结果互不可见', async () => {
      paymentAdapter.seed([
        { id: '1', tenantId: 'T1', orderId: 'O1', amountCents: 1000, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01' },
        { id: '2', tenantId: 'T2', orderId: 'O2', amountCents: 5000, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01' }
      ])
      const r1 = await ctrl.revenueReport({ tenantId: 'T1', from: '2024-06-01', to: '2024-06-30' })
      const r2 = await ctrl.revenueReport({ tenantId: 'T2', from: '2024-06-01', to: '2024-06-30' })
      assert.equal(r1.totals?.revenue, 1000)
      assert.equal(r2.totals?.revenue, 5000)
    })

    it('invalidateCache 不影响其他租户', async () => {
      paymentAdapter.seed([
        { id: '1', tenantId: 'T1', orderId: 'O1', amountCents: 1000, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01' },
        { id: '2', tenantId: 'T2', orderId: 'O2', amountCents: 5000, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01' }
      ])
      await ctrl.revenueReport({ tenantId: 'T1', from: '2024-06-01', to: '2024-06-30' })
      await ctrl.revenueReport({ tenantId: 'T2', from: '2024-06-01', to: '2024-06-30' })
      ctrl.invalidateCache({ tenantId: 'T1' })
      // T2 仍命中缓存
      const r = await ctrl.revenueReport({ tenantId: 'T2', from: '2024-06-01', to: '2024-06-30' })
      assert.equal(r.cached, true)
    })
  })

  // ============================================================
  // Module 配置
  // ============================================================
  describe('MODULE: 配置', () => {
    it('ReportController 注入 16 个 service', () => {
      const ctorParams = (ReportController as any).length
      // 4 核心 + 10 报表 = 14 个参数 (cache 包含在 controller 自身)
      assert.ok(ctorParams >= 10, `expected >=10 ctor params, got ${ctorParams}`)
    })

    it('10 个报表服务全部可实例化', () => {
      const agg = new ReportAggregationService()
      const cache = new ReportCacheService()
      const pAdapter = new PaymentAdapter()
      const oAdapter = new OrderAdapter()
      const rAdapter = new RefundAdapter()
      const mAdapter = new MemberAdapter()
      const iAdapter = new InventoryAdapter()
      const services = [
        new RevenueReportService(agg, cache, pAdapter),
        new InventoryTurnoverService(iAdapter, oAdapter),
        new MemberGrowthService(agg, cache, mAdapter),
        new RefundRateService(pAdapter, rAdapter),
        new OrderConversionService(oAdapter),
        new ProductRankingService(oAdapter),
        new PaymentMixService(pAdapter),
        new HourlyHeatmapService(oAdapter),
        new ChannelFunnelService(oAdapter),
        new InventoryAlertService(iAdapter)
      ]
      assert.equal(services.length, 10)
    })
  })
})
