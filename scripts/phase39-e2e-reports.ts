/**
 * Phase-39 T169 E2E: 报表模块端到端验收
 *
 * 15+ AC 验证:
 *  1. 10 个内置报表均可访问
 *  2. 报表定义 CRUD 完整
 *  3. LRU 缓存命中
 *  4. 失效缓存按 tenantId
 *  5. CSV/JSON/HTML 导出
 *  6. 多租户隔离 (反模式 v4)
 *  7. DSL 字段白名单 (反模式 v4)
 *  8. 时间维度截断 day/week/month/year
 *  9. AggregationFn 6 个
 *  10. 乐观锁更新 definition
 *  11. csv-injection 防御
 *  12. 缓存统计 hitRate
 *  13. 报表定义跨租户不可见
 *  14. 错误 type 抛错
 *  15. 反模式 v4: tenantId 不在 DSL 白名单
 *
 * 反模式 v4 命中:
 *  - time-series-aggregation-pattern
 *  - multi-tenant-data-isolation-pattern
 *  - caching-strategy-pattern
 *  - csv-injection-pattern
 *  - optimistic-lock-pattern (definition 更新)
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ReportController } from '../apps/api/src/modules/reports/report.controller'
import { ReportAggregationService } from '../apps/api/src/modules/reports/report-aggregation.service'
import { ReportCacheService } from '../apps/api/src/modules/reports/report-cache.service'
import { ReportExportService } from '../apps/api/src/modules/reports/report-export.service'
import { ReportQueryService } from '../apps/api/src/modules/reports/report-query.service'
import { OrderAdapter } from '../apps/api/src/modules/reports/datasources/order.adapter'
import { PaymentAdapter } from '../apps/api/src/modules/reports/datasources/payment.adapter'
import { RefundAdapter } from '../apps/api/src/modules/reports/datasources/refund.adapter'
import { MemberAdapter } from '../apps/api/src/modules/reports/datasources/member.adapter'
import { InventoryAdapter } from '../apps/api/src/modules/reports/datasources/inventory.adapter'
import { RevenueReportService } from '../apps/api/src/modules/reports/reports/revenue-report.service'
import { InventoryTurnoverService } from '../apps/api/src/modules/reports/reports/inventory-turnover.service'
import { MemberGrowthService } from '../apps/api/src/modules/reports/reports/member-growth.service'
import { RefundRateService } from '../apps/api/src/modules/reports/reports/refund-rate.service'
import { OrderConversionService } from '../apps/api/src/modules/reports/reports/order-conversion.service'
import { ProductRankingService } from '../apps/api/src/modules/reports/reports/product-ranking.service'
import { PaymentMixService } from '../apps/api/src/modules/reports/reports/payment-mix.service'
import { HourlyHeatmapService } from '../apps/api/src/modules/reports/reports/hourly-heatmap.service'
import { ChannelFunnelService } from '../apps/api/src/modules/reports/reports/channel-funnel.service'
import { InventoryAlertService } from '../apps/api/src/modules/reports/reports/inventory-alert.service'

function buildController(): { ctrl: ReportController; adapters: any[] } {
  const agg = new ReportAggregationService()
  const cache = new ReportCacheService()
  const exp = new ReportExportService()
  const q = new ReportQueryService()

  const oAdapter = new OrderAdapter()
  const pAdapter = new PaymentAdapter()
  const rAdapter = new RefundAdapter()
  const mAdapter = new MemberAdapter()
  const iAdapter = new InventoryAdapter()

  const revenue = new RevenueReportService(agg, cache, pAdapter)
  const invTurn = new InventoryTurnoverService(iAdapter, oAdapter)
  const memberGrowth = new MemberGrowthService(agg, cache, mAdapter)
  const refundRate = new RefundRateService(rAdapter, pAdapter)
  const orderConv = new OrderConversionService(oAdapter)
  const prodRank = new ProductRankingService(oAdapter)
  const payMix = new PaymentMixService(pAdapter)
  const heatmap = new HourlyHeatmapService(oAdapter)
  const channelFunnel = new ChannelFunnelService(oAdapter)
  const invAlert = new InventoryAlertService(iAdapter)

  return {
    ctrl: new ReportController(agg, cache, exp, q,
      revenue, invTurn, memberGrowth, refundRate, orderConv,
      prodRank, payMix, heatmap, channelFunnel, invAlert),
    adapters: [oAdapter, pAdapter, rAdapter, mAdapter, iAdapter]
  }
}

describe('T169 Phase-39 E2E: 报表模块', () => {
  // ─── AC-1: 10 个内置报表均可访问 ─────────────────────────
  it('AC-1: 10 个报表 endpoint 均可访问', async () => {
    const { ctrl, adapters } = buildController()
    const [o, p, r, m, i] = adapters
    p.seed([{ id: '1', tenantId: 'T', orderId: 'O', amountCents: 100, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01' }])
    i.seed([{ id: '1', tenantId: 'T', sku: 'A', name: 'A', category: 'c', totalQty: 10, reservedQty: 0, availableQty: 10, lowStockThreshold: 5, status: 'ACTIVE', unitPriceCents: 100 }])
    o.seed([{ id: '1', tenantId: 'T', orderId: 'O', status: 'COMPLETED', totalCents: 100, source: 'web', itemCount: 1, createdAt: '2024-06-01' }])
    m.seed([{ id: '1', tenantId: 'T', level: 'GOLD', source: 'web', status: 'ACTIVE', lifecycleStage: 'NEW', createdAt: '2024-06-01' }])
    r.seed([{ id: '1', tenantId: 'T', paymentId: 'P', orderId: 'O', amountCents: 50, reason: 'damaged', status: 'COMPLETED', createdAt: '2024-06-05' }])

    assert.ok(await ctrl.revenueReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' }))
    assert.ok(await ctrl.inventoryReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' }))
    assert.ok(await ctrl.memberReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' }))
    assert.ok(await ctrl.refundReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' }))
    assert.ok(await ctrl.orderReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' }))
    assert.ok(await ctrl.productRankingReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30', topN: '5' }))
    assert.ok(await ctrl.paymentMixReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' }))
    assert.ok(await ctrl.hourlyHeatmapReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-07' }))
    assert.ok(await ctrl.channelFunnelReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' }))
    assert.ok(await ctrl.inventoryAlertReport({ tenantId: 'T' }))
  })

  // ─── AC-2: 报表定义 CRUD 完整 ─────────────────────────────
  it('AC-2: Definition CRUD (Create / List / Get / Update / Delete)', () => {
    const { ctrl } = buildController()
    const def = ctrl.createDefinition({
      tenantId: 'T', name: '日报', type: 'revenue',
      dimensions: [{ field: 'createdAt', granularity: 'day' }],
      metrics: [{ field: 'amountCents', fn: 'sum', alias: 'rev' }],
      ownerId: 'u1'
    })
    assert.match(def.id, /^rdef-/)
    assert.equal(ctrl.listDefinitions({ tenantId: 'T' }).total, 1)
    assert.ok(ctrl.getDefinition(def.id, { tenantId: 'T' }))
    const updated = ctrl.updateDefinition(def.id, { tenantId: 'T', version: '1' }, { name: '周报' })
    assert.equal(updated.name, '周报')
    assert.equal(ctrl.deleteDefinition(def.id, { tenantId: 'T' }).deleted, true)
  })

  // ─── AC-3: LRU 缓存命中 ─────────────────────────────────
  it('AC-3: 同 fingerprint 第二次查询 cached=true', async () => {
    const { ctrl, adapters } = buildController()
    const [, p] = adapters
    p.seed([{ id: '1', tenantId: 'T', orderId: 'O', amountCents: 100, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01' }])
    const r1 = await ctrl.revenueReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' })
    const r2 = await ctrl.revenueReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' })
    assert.equal(r1.cached, false)
    assert.equal(r2.cached, true)
  })

  // ─── AC-4: 失效缓存按 tenantId ──────────────────────────
  it('AC-4: invalidateCache 按 tenantId 失效', async () => {
    const { ctrl, adapters } = buildController()
    const [, p] = adapters
    p.seed([{ id: '1', tenantId: 'T1', orderId: 'O1', amountCents: 100, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01' }])
    await ctrl.revenueReport({ tenantId: 'T1', from: '2024-06-01', to: '2024-06-30' })
    const r = ctrl.invalidateCache({ tenantId: 'T1' })
    assert.ok(r.invalidated >= 1)
  })

  // ─── AC-5: CSV/JSON/HTML 导出 ────────────────────────────
  it('AC-5: CSV/JSON/HTML 导出均返回 content', async () => {
    const { ctrl, adapters } = buildController()
    const [, p] = adapters
    p.seed([{ id: '1', tenantId: 'T', orderId: 'O', amountCents: 100, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01' }])
    const csv = await ctrl.exportReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30', type: 'revenue', format: 'csv' })
    const json = await ctrl.exportReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30', type: 'revenue', format: 'json' })
    const html = await ctrl.exportReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30', type: 'revenue', format: 'html' })
    assert.ok(csv.content.length > 0)
    assert.ok(json.content.length > 0)
    assert.match(html.content, /<table>/)
  })

  // ─── AC-6: 多租户隔离 (反模式 v4) ─────────────────────────
  it('AC-6: 不同 tenant 查询结果互不可见', async () => {
    const { ctrl, adapters } = buildController()
    const [, p] = adapters
    p.seed([
      { id: '1', tenantId: 'T1', orderId: 'O1', amountCents: 1000, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01' },
      { id: '2', tenantId: 'T2', orderId: 'O2', amountCents: 5000, currency: 'CNY', method: 'ALIPAY', status: 'SUCCESS', createdAt: '2024-06-01' }
    ])
    const r1 = await ctrl.revenueReport({ tenantId: 'T1', from: '2024-06-01', to: '2024-06-30' })
    const r2 = await ctrl.revenueReport({ tenantId: 'T2', from: '2024-06-01', to: '2024-06-30' })
    assert.equal(r1.totals?.revenue, 1000)
    assert.equal(r2.totals?.revenue, 5000)
  })

  // ─── AC-7: DSL 字段白名单 (反模式 v4) ─────────────────────
  it('AC-7: 字段白名单拒绝未授权字段', () => {
    const q = new ReportQueryService()
    assert.throws(
      () => q.parse('order', { evilField: { op: '=', value: 'x' } }),
      /not allowed/
    )
  })

  // ─── AC-8: 时间维度截断 day/week/month/year ─────────────
  it('AC-8: 4 种时间粒度截断正确', () => {
    const agg = new ReportAggregationService()
    assert.equal(agg.timeBucket('2024-06-15T10:30:00Z', 'day'), '2024-06-15')
    assert.equal(agg.timeBucket('2024-06-15T10:30:00Z', 'month'), '2024-06')
    assert.equal(agg.timeBucket('2024-06-15T10:30:00Z', 'year'), '2024')
    assert.match(agg.timeBucket('2024-06-15T10:30:00Z', 'week'), /^\d{4}-W\d{2}$/)
  })

  // ─── AC-9: AggregationFn 6 个 ──────────────────────────
  it('AC-9: 6 个 AggregationFn 全部正确', () => {
    const agg = new ReportAggregationService()
    const rows = [{ v: 10 }, { v: 20 }, { v: 30 }, { v: 20 }]
    assert.equal(agg.computeMetric(rows, 'v', 'sum'), 80)
    assert.equal(agg.computeMetric(rows, 'v', 'count'), 4)
    assert.equal(agg.computeMetric(rows, 'v', 'avg'), 20)
    assert.equal(agg.computeMetric(rows, 'v', 'min'), 10)
    assert.equal(agg.computeMetric(rows, 'v', 'max'), 30)
    assert.equal(agg.computeMetric(rows, 'v', 'distinct'), 3)
  })

  // ─── AC-10: 乐观锁更新 definition ────────────────────────
  it('AC-10: 乐观锁拒绝版本不匹配的更新', () => {
    const { ctrl } = buildController()
    const def = ctrl.createDefinition({ tenantId: 'T', name: 'A', type: 'revenue', dimensions: [], metrics: [], ownerId: 'u' })
    assert.throws(
      () => ctrl.updateDefinition(def.id, { tenantId: 'T', version: '99' }, { name: 'B' }),
      /version mismatch/
    )
  })

  // ─── AC-11: csv-injection 防御 ──────────────────────────
  it('AC-11: csv-injection 防御 (=, +, -, @ 前缀)', () => {
    const exp = new ReportExportService()
    const csv = exp.toCSV({
      type: 'revenue', tenantId: 'T',
      period: { from: '2024-01-01', to: '2024-01-02' },
      columns: [{ field: 'v', alias: 'V', type: 'metric' }],
      rows: [{ v: '=SUM(1+1)' }, { v: '+CMD' }, { v: '-2' }, { v: '@evil' }],
      generatedAt: '2024-01-01', cached: false
    })
    assert.ok(csv.includes("'=SUM"))
    assert.ok(csv.includes("'+CMD"))
    assert.ok(csv.includes("'-2"))
    assert.ok(csv.includes("'@evil"))
  })

  // ─── AC-12: 缓存统计 hitRate ────────────────────────────
  it('AC-12: cacheStats 返回 hits/misses/hitRate', async () => {
    const { ctrl, adapters } = buildController()
    const [, p] = adapters
    p.seed([{ id: '1', tenantId: 'T', orderId: 'O', amountCents: 100, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01' }])
    await ctrl.revenueReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' })  // miss
    await ctrl.revenueReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' })  // hit
    const s = ctrl.cacheStats()
    assert.ok(s.hits >= 1)
    assert.ok(s.misses >= 1)
  })

  // ─── AC-13: 报表定义跨租户不可见 ──────────────────────────
  it('AC-13: Definition 跨租户隔离', () => {
    const { ctrl } = buildController()
    const def = ctrl.createDefinition({ tenantId: 'T1', name: 'A', type: 'revenue', dimensions: [], metrics: [], ownerId: 'u' })
    assert.equal(ctrl.getDefinition(def.id, { tenantId: 'T2' }), null)
  })

  // ─── AC-14: 错误 type 抛错 ──────────────────────────────
  it('AC-14: 未知 type 抛错', async () => {
    const { ctrl } = buildController()
    await assert.rejects(
      () => ctrl.exportReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30', type: 'unknown' as any, format: 'csv' }),
      /unknown report type/
    )
  })

  // ─── AC-15: tenantId 不在 DSL 白名单 (反模式 v4) ──────────
  it('AC-15: tenantId 不在 DSL 白名单 (反模式 v4 multi-tenant)', () => {
    const q = new ReportQueryService()
    assert.throws(
      () => q.parse('order', { tenantId: { op: '=', value: 'evil' } }),
      /not allowed/
    )
  })

  // ─── AC-16: 报表缓存 maxEntries ≤ 100 ────────────────────
  it('AC-16: cache MAX_ENTRIES = 100 (反模式 v4 caching-strategy)', () => {
    const { ctrl } = buildController()
    const s = ctrl.cacheStats()
    assert.equal(s.maxEntries, 100)
  })

  // ─── AC-17: 跨租户缓存隔离 ──────────────────────────────
  it('AC-17: invalidateCache(T1) 不影响 T2 缓存', async () => {
    const { ctrl, adapters } = buildController()
    const [, p] = adapters
    p.seed([
      { id: '1', tenantId: 'T1', orderId: 'O1', amountCents: 1000, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01' },
      { id: '2', tenantId: 'T2', orderId: 'O2', amountCents: 5000, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01' }
    ])
    await ctrl.revenueReport({ tenantId: 'T1', from: '2024-06-01', to: '2024-06-30' })
    await ctrl.revenueReport({ tenantId: 'T2', from: '2024-06-01', to: '2024-06-30' })
    ctrl.invalidateCache({ tenantId: 'T1' })
    const r = await ctrl.revenueReport({ tenantId: 'T2', from: '2024-06-01', to: '2024-06-30' })
    assert.equal(r.cached, true)
  })

  // ─── AC-18: HTML 导出包含 ⚡ Cached 标识 ──────────────────
  it('AC-18: HTML 导出显示 ⚡ Cached 标识', async () => {
    const { ctrl, adapters } = buildController()
    const [, p] = adapters
    p.seed([{ id: '1', tenantId: 'T', orderId: 'O', amountCents: 100, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2024-06-01' }])
    await ctrl.revenueReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30' })
    const html = await ctrl.exportReport({ tenantId: 'T', from: '2024-06-01', to: '2024-06-30', type: 'revenue', format: 'html' })
    assert.match(html.content, /Cached/)
  })
})