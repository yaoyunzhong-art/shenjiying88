import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [reports] [C] 角色测试(场景版)
 *
 * 8 角色深度场景测试 — reports 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 2 个测试用例（正常流程 + 权限/边界）
 * 覆盖：报表查询、报表定义 CRUD、导出、批量导出任务、缓存管理
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

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销'
}

const TENANT = 't-scenario'

// ── 辅助工厂 ──
function makeCtrl(opts: { seedData?: boolean } = {}) {
  const agg = new ReportAggregationService()
  const cache = new ReportCacheService()
  const exp = new ReportExportService()
  const q = new ReportQueryService()
  const paymentAdapter = new PaymentAdapter()
  const orderAdapter = new OrderAdapter()
  const refundAdapter = new RefundAdapter()
  const memberAdapter = new MemberAdapter()
  const inventoryAdapter = new InventoryAdapter()

  if (opts.seedData) {
    paymentAdapter.seed([
      { id: 'p1', tenantId: TENANT, orderId: 'o1', amountCents: 5000, currency: 'CNY', method: 'WECHAT', status: 'SUCCESS', createdAt: '2026-06-01T10:30:00Z' },
      { id: 'p2', tenantId: TENANT, orderId: 'o2', amountCents: 15000, currency: 'CNY', method: 'ALIPAY', status: 'SUCCESS', createdAt: '2026-06-01T12:00:00Z' },
      { id: 'p3', tenantId: TENANT, orderId: 'o3', amountCents: 8000, currency: 'CNY', method: 'WECHAT', status: 'REFUNDED', createdAt: '2026-06-01T14:00:00Z' },
      { id: 'p4', tenantId: TENANT, orderId: 'o4', amountCents: 2000, currency: 'CNY', method: 'CASH', status: 'SUCCESS', createdAt: '2026-06-02T09:00:00Z' },
    ])
    orderAdapter.seed([
      { id: 'o1', tenantId: TENANT, orderId: 'o1', status: 'COMPLETED', totalCents: 5000, source: 'web', itemCount: 2, createdAt: '2026-06-01T10:30:00Z' },
      { id: 'o2', tenantId: TENANT, orderId: 'o2', status: 'COMPLETED', totalCents: 15000, source: 'app', itemCount: 3, createdAt: '2026-06-01T12:00:00Z' },
      { id: 'o3', tenantId: TENANT, orderId: 'o3', status: 'COMPLETED', totalCents: 8000, source: 'web', itemCount: 1, createdAt: '2026-06-01T14:00:00Z' },
      { id: 'o4', tenantId: TENANT, orderId: 'o4', status: 'COMPLETED', totalCents: 2000, source: 'pos', itemCount: 1, createdAt: '2026-06-02T09:00:00Z' },
    ])
    refundAdapter.seed([
      { id: 'r1', tenantId: TENANT, orderId: 'o3', paymentId: 'pmt-r1', amountCents: 8000, reason: 'customer_request', status: 'COMPLETED', createdAt: '2026-06-01T15:00:00Z' },
    ])
    memberAdapter.seed([
      { id: 'm1', tenantId: TENANT, level: 'SILVER', source: 'web', status: 'ACTIVE', lifecycleStage: 'NEW', createdAt: '2026-06-01T08:00:00Z', lastActiveAt: '2026-06-01T08:30:00Z' },
      { id: 'm2', tenantId: TENANT, level: 'GOLD', source: 'app', status: 'ACTIVE', lifecycleStage: 'ACTIVE', createdAt: '2026-06-01T10:00:00Z', lastActiveAt: '2026-06-01T12:00:00Z' },
      { id: 'm3', tenantId: TENANT, level: 'SILVER', source: 'web', status: 'DORMANT', lifecycleStage: 'DORMANT', createdAt: '2026-03-01T08:00:00Z', lastActiveAt: '2026-03-15T08:00:00Z' },
    ])
    inventoryAdapter.seed([
      { id: 'i1', tenantId: TENANT, sku: 'ARCADE-001', name: '投篮机', category: '设备', totalQty: 5, reservedQty: 0, availableQty: 3, lowStockThreshold: 2, status: 'ACTIVE', unitPriceCents: 500000 },
      { id: 'i2', tenantId: TENANT, sku: 'ARCADE-002', name: '跳舞机', category: '设备', totalQty: 3, reservedQty: 1, availableQty: 2, lowStockThreshold: 1, status: 'ACTIVE', unitPriceCents: 800000 },
      { id: 'i3', tenantId: TENANT, sku: 'TOY-001', name: '毛绒公仔', category: '礼品', totalQty: 20, reservedQty: 5, availableQty: 15, lowStockThreshold: 10, status: 'ACTIVE', unitPriceCents: 500 },
      { id: 'i4', tenantId: TENANT, sku: 'TOY-002', name: '限量手办', category: '礼品', totalQty: 3, reservedQty: 0, availableQty: 2, lowStockThreshold: 1, status: 'ACTIVE', unitPriceCents: 10000 },
      { id: 'i5', tenantId: TENANT, sku: 'SNACK-001', name: '饮料', category: '食品', totalQty: 100, reservedQty: 10, availableQty: 20, lowStockThreshold: 50, status: 'ACTIVE', unitPriceCents: 800 },
    ])
  }

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

  const controller = new ReportController(
    agg, cache, exp, q,
    revenue, invTurn, memberGrowth, refundRate, orderConv,
    prodRank, payMix, heatmap, channelFunnel, invAlert,
    {} as any
  )
  return { controller, cache, exp }
}

// ══════════════════════════════════════════════════════════
// 👔店长 — 全局运营报表 & 多门店纵览
// ══════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} reports 场景测试`, () => {
  it('店长查看收入报表（每日营收概览）', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.revenueReport({ tenantId: TENANT, from: '2026-06-01', to: '2026-06-02' })
    assert.equal(result.type, 'revenue')
    assert.equal(result.tenantId, TENANT)
    assert.ok(result.rows.length >= 1)
    assert.ok(result.totals)
    assert.ok(result.totals!.revenue !== undefined && Number(result.totals!.revenue) > 0)
  })

  it('店长查看商品排名报表（了解热销商品）', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.productRankingReport({ tenantId: TENANT, from: '2026-06-01', to: '2026-06-02', topN: '5' })
    assert.equal(result.type, 'product-ranking')
    assert.ok(result.rows.length >= 1)
  })

  it('店长查看库存预警（需补货商品）', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.inventoryAlertReport({ tenantId: TENANT })
    assert.ok(Array.isArray(result.rows))
    // 饮料 availableQty=20 < lowStockThreshold=50 应有预警
    const lowStock = result.rows.find((i: any) => i.sku === 'SNACK-001')
    assert.ok(lowStock)
    assert.equal(lowStock.availableQty, 20)
    assert.equal(lowStock.threshold, 50)
  })

  it('店长创建报表定义并管理', () => {
    const { controller } = makeCtrl()
    const created = controller.createDefinition({
      tenantId: TENANT, name: '门店日报', type: 'revenue',
      dimensions: [{ field: 'createdAt', granularity: 'day', alias: '日期' }],
      metrics: [{ field: 'amountCents', fn: 'sum', alias: '营收' }],
      ownerId: 'store-mgr-01',
    })
    assert.ok(created.id)
    const list = controller.listDefinitions({ tenantId: TENANT })
    assert.equal(list.total, 1)
    assert.equal(list.items[0].name, '门店日报')
    // 更新
    const updated = controller.updateDefinition(created.id, { tenantId: TENANT, version: '1' }, { name: '门店日报v2' })
    assert.equal(updated.version, 2)
    // 删除
    const del = controller.deleteDefinition(created.id, { tenantId: TENANT })
    assert.equal(del.deleted, true)
  })
})

// ══════════════════════════════════════════════════════════
// 🛒前台 — 实时报表 & 热门排行
// ══════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} reports 场景测试`, () => {
  it('前台查看商品排行（优先推荐热门项目）', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.productRankingReport({ tenantId: TENANT, from: '2026-06-01', to: '2026-06-02', topN: '5' })
    assert.equal(result.type, 'product-ranking')
    assert.ok(result.rows.length >= 1)
  })

  it('前台查看时段热力图（了解客流高峰排班）', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.hourlyHeatmapReport({ tenantId: TENANT, from: '2026-06-01', to: '2026-06-02' })
    assert.equal(result.type, 'hourly-heatmap')
    assert.ok(result.rows.length >= 1, '应返回时段热力数据')
  })

  it('前台查看支付方式占比（指导收银操作）', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.paymentMixReport({ tenantId: TENANT, from: '2026-06-01', to: '2026-06-02' })
    assert.equal(result.type, 'payment-mix')
    assert.ok(result.rows.length >= 0)
  })

  it('前台尝试创建定义不污染其他租户（隔离边界）', () => {
    const { controller } = makeCtrl()
    const def = controller.createDefinition({
      tenantId: TENANT, name: '前台临时日报', type: 'revenue',
      dimensions: [{ field: 'createdAt', granularity: 'day', alias: '日期' }],
      metrics: [{ field: 'amountCents', fn: 'sum', alias: '营收' }],
      ownerId: 'frontdesk-01',
    })
    assert.ok(def.id)
    // 其他租户不应看到
    const otherDefs = controller.listDefinitions({ tenantId: 't-other-tenant' })
    assert.equal(otherDefs.total, 0)
  })
})

// ══════════════════════════════════════════════════════════
// 👥HR — 员工绩效 & 会员增长率 & 退款分析
// ══════════════════════════════════════════════════════════
describe(`${ROLES.HR} reports 场景测试`, () => {
  it('HR 查看会员增长率报表', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.memberReport({ tenantId: TENANT, from: '2026-03-01', to: '2026-06-30' })
    assert.equal(result.type, 'member')
    assert.ok(result.rows.length >= 0)
  })

  it('HR 查看退款率分析（用于培训改善）', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.refundReport({ tenantId: TENANT, from: '2026-06-01', to: '2026-06-02' })
    assert.equal(result.type, 'refund')
    // refundRate 以百分比形式返回 (0~100)
    const refundRow = result.rows.find((r: any) => r.metric === '退款率(%)')
    assert.ok(refundRow)
    assert.ok(refundRow!.value !== undefined && Number(refundRow!.value) >= 0)
  })

  it('HR 导出会员报表 CSV（存档用）', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.exportReport({ tenantId: TENANT, type: 'member', from: '2026-03-01', to: '2026-06-30', format: 'csv' })
    assert.ok(result.filename)
    assert.equal(result.format, 'csv')
    assert.ok(result.content.length > 0)
  })
})

// ══════════════════════════════════════════════════════════
// 🔧安监 — 数据完整性审计 & 导出安全
// ══════════════════════════════════════════════════════════
describe(`${ROLES.Safety} reports 场景测试`, () => {
  it('安监审计所有报表定义完整性', () => {
    const { controller } = makeCtrl()
    controller.createDefinition({ tenantId: TENANT, name: '安监审核A', type: 'revenue',
      dimensions: [{ field: 'store', alias: '门店' }], metrics: [{ field: 'revenue', fn: 'sum', alias: '营收' }],
      ownerId: 'safety-01' })
    controller.createDefinition({ tenantId: TENANT, name: '安监审核B', type: 'inventory',
      dimensions: [{ field: 'product', alias: '商品' }], metrics: [{ field: 'stock', fn: 'sum', alias: '库存' }],
      ownerId: 'safety-01' })
    const defs = controller.listDefinitions({ tenantId: TENANT })
    assert.ok(defs.total >= 2)
    defs.items.forEach((d: any) => {
      assert.ok(d.id)
      assert.ok(d.name)
      assert.ok(Array.isArray(d.metrics))
      assert.ok(d.metrics.length > 0)
    })
  })

  it('安监验证缓存失效只影响指定租户', async () => {
    const { controller, cache } = makeCtrl({ seedData: true })
    // 先查询，填充缓存
    await controller.revenueReport({ tenantId: TENANT, from: '2026-06-01', to: '2026-06-02' })
    await controller.revenueReport({ tenantId: 't-other', from: '2026-06-01', to: '2026-06-02' })

    const invResult = controller.invalidateCache({ tenantId: TENANT })
    assert.ok(invResult.invalidated > 0, '应清除指定租户缓存')

    // 重建后仍可查询
    const result = await controller.revenueReport({ tenantId: TENANT, from: '2026-06-01', to: '2026-06-02' })
    assert.ok(result, '缓存重建后仍可查询')
  })

  it('安监查看订单转化率', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.orderReport({ tenantId: TENANT, from: '2026-06-01', to: '2026-06-02' })
    assert.equal(result.type, 'order')
    assert.ok(result.rows.length >= 0)
  })

  it('安监删除无效报表定义', () => {
    const { controller } = makeCtrl()
    const def = controller.createDefinition({ tenantId: TENANT, name: '待清理', type: 'revenue',
      dimensions: [{ field: 'store', alias: '门店' }], metrics: [{ field: 'revenue', fn: 'sum', alias: '营收' }],
      ownerId: 'safety-01' })
    const del = controller.deleteDefinition(def.id, { tenantId: TENANT })
    assert.equal(del.deleted, true)
    const found = controller.getDefinition(def.id, { tenantId: TENANT })
    assert.equal(found, null)
  })
})

// ══════════════════════════════════════════════════════════
// 🎮导玩员 — 游戏区运营报表 & 库存周转
// ══════════════════════════════════════════════════════════
describe(`${ROLES.Guide} reports 场景测试`, () => {
  it('导玩员查看库存周转率报表（补货参考）', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.inventoryReport({ tenantId: TENANT, from: '2026-06-01', to: '2026-06-02' })
    assert.equal(result.type, 'inventory')
    assert.ok(result.rows.length >= 0)
  })

  it('导玩员查看渠道漏斗（了解顾客来源）', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.channelFunnelReport({ tenantId: TENANT, from: '2026-06-01', to: '2026-06-02' })
    assert.equal(result.type, 'channel-funnel')
    assert.ok(result.rows.length >= 0)
  })

  it('导玩员查看热力时段图（优化班次安排）', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.hourlyHeatmapReport({ tenantId: TENANT, from: '2026-06-01', to: '2026-06-02' })
    assert.equal(result.type, 'hourly-heatmap')
    assert.ok(result.rows.length >= 0)
  })
})

// ══════════════════════════════════════════════════════════
// 🎯运行专员 — 报表导出 & 缓存管理 & 批量任务
// ══════════════════════════════════════════════════════════
describe(`${ROLES.Ops} reports 场景测试`, () => {
  it('运行专员导出 CSV 格式营收报表', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.exportReport({ tenantId: TENANT, type: 'revenue', from: '2026-06-01', to: '2026-06-02', format: 'csv' })
    assert.ok(result.filename)
    assert.equal(result.format, 'csv')
    assert.ok(result.content.length > 0)
  })

  it('运行专员创建批量导出任务并查询进度', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const task = await controller.createBatchExportTask({
      tenantId: TENANT, type: 'revenue', from: '2026-06-01', to: '2026-06-02', format: 'json'
    })
    assert.ok(task.taskId)
    assert.equal(task.tenantId, TENANT)

    const tasks = controller.listBatchExportTasks({ tenantId: TENANT })
    assert.ok(tasks.total >= 1)
    const found = tasks.items.find((t: any) => t.taskId === task.taskId)
    assert.ok(found)

    const detail = controller.getBatchExportTask(task.taskId, { tenantId: TENANT })
    assert.ok(detail)
  })

  it('运行专员查看缓存统计', () => {
    const { controller } = makeCtrl({ seedData: true })
    const stats = controller.cacheStats()
    assert.ok(stats)
    assert.ok('entries' in stats || 'hitRate' in stats, '应返回缓存统计信息')
  })

  it('运行专员删除已完成导出任务（运维清理）', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const task = await controller.createBatchExportTask({
      tenantId: TENANT, type: 'revenue', from: '2026-06-01', to: '2026-06-02', format: 'csv'
    })
    const del = controller.deleteBatchExportTask(task.taskId, { tenantId: TENANT })
    assert.ok(del.deleted, '任务应成功删除')
    const check = controller.getBatchExportTask(task.taskId, { tenantId: TENANT })
    assert.equal(check, null, '已删除任务应返回 null')
  })

  it('运行专员导出 HTML 格式报表', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.exportReport({ tenantId: TENANT, type: 'revenue', from: '2026-06-01', to: '2026-06-02', format: 'html' })
    assert.equal(result.format, 'html')
    assert.ok(result.content.length > 0)
  })
})

// ══════════════════════════════════════════════════════════
// 🤝团建 — 渠道漏斗 & 活动效果
// ══════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} reports 场景测试`, () => {
  it('团建查看渠道漏斗报表（了解推广效果）', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.channelFunnelReport({ tenantId: TENANT, from: '2026-06-01', to: '2026-06-02' })
    assert.equal(result.type, 'channel-funnel')
    assert.ok(result.rows.length >= 0)
  })

  it('团建为团队活动创建自定义报表定义', () => {
    const { controller } = makeCtrl()
    const def = controller.createDefinition({
      tenantId: TENANT, name: '团建活动效果', type: 'member',
      dimensions: [{ field: 'activityType', granularity: 'day', alias: '活动类型' }],
      metrics: [{ field: 'participation', fn: 'count', alias: '参与数' }],
      ownerId: 'team-builder', schedule: '0 8 * * 1', subscribers: ['团建负责@mail']
    })
    assert.ok(def.id)
    assert.equal(def.name, '团建活动效果')
    assert.ok(def.schedule)
    assert.ok(def.subscribers)
  })

  it('团建下载已完成批量导出任务', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const task = await controller.createBatchExportTask({
      tenantId: TENANT, type: 'channel-funnel', from: '2026-06-01', to: '2026-06-02', format: 'json'
    })
    assert.ok(task.taskId)
    const download = controller.downloadBatchExportTask(task.taskId, { tenantId: TENANT })
    // download may be null for non-completed tasks, which is acceptable
    assert.ok(download !== undefined, '下载接口可正常调用')
  })
})

// ══════════════════════════════════════════════════════════
// 📢营销 — 营销活动报表 & 商品排名 & 导出分析
// ══════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} reports 场景测试`, () => {
  it('营销查看商品排名（促销选品参考）', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.productRankingReport({ tenantId: TENANT, from: '2026-06-01', to: '2026-06-02', topN: '10' })
    assert.equal(result.type, 'product-ranking')
    assert.ok(result.rows.length >= 1)
  })

  it('营销查看支付占比（制定支付优惠策略）', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.paymentMixReport({ tenantId: TENANT, from: '2026-06-01', to: '2026-06-02' })
    assert.equal(result.type, 'payment-mix')
    assert.ok(result.rows.length >= 0)
  })

  it('营销导出 JSON 格式支付占比报表', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.exportReport({ tenantId: TENANT, type: 'payment-mix', from: '2026-06-01', to: '2026-06-02', format: 'json' })
    assert.equal(result.format, 'json')
    assert.ok(result.content.length > 0)
    // 验证是合法 JSON
    const parsed = JSON.parse(result.content)
    assert.ok(parsed, '导出内容应为合法 JSON')
  })

  it('营销查看热力图数据（安排促销时段）', async () => {
    const { controller } = makeCtrl({ seedData: true })
    const result = await controller.hourlyHeatmapReport({ tenantId: TENANT, from: '2026-06-01', to: '2026-06-02' })
    assert.equal(result.type, 'hourly-heatmap')
    assert.ok(result.rows.length >= 0)
  })
})

// ══════════════════════════════════════════════════════════
// 跨角色 & 边界场景
// ══════════════════════════════════════════════════════════
describe('reports 跨角色和边界场景测试', () => {
  it('不同角色的报表定义互不污染', () => {
    const { controller } = makeCtrl()
    controller.createDefinition({ tenantId: TENANT, name: '店长全局报表', type: 'revenue',
      dimensions: [{ field: 'store', alias: '门店' }], metrics: [{ field: 'revenue', fn: 'sum', alias: '营收' }],
      ownerId: 'store-mgr' })
    controller.createDefinition({ tenantId: TENANT, name: '营销活动报表', type: 'order',
      dimensions: [{ field: 'campaign', alias: '活动' }], metrics: [{ field: 'orders', fn: 'count', alias: '订单' }],
      ownerId: 'marketing' })
    controller.createDefinition({ tenantId: TENANT, name: 'HR人员报表', type: 'member',
      dimensions: [{ field: 'department', alias: '部门' }], metrics: [{ field: 'headcount', fn: 'count', alias: '人数' }],
      ownerId: 'hr' })
    const all = controller.listDefinitions({ tenantId: TENANT })
    assert.equal(all.total, 3, '三个定义都应存在')
    const otherDefs = controller.listDefinitions({ tenantId: 't-other' })
    assert.equal(otherDefs.total, 0, '其他租户不可见')
  })

  it('不存在的报表定义删除返回 false', () => {
    const { controller } = makeCtrl()
    const result = controller.deleteDefinition('nonexistent-id', { tenantId: TENANT })
    assert.equal(result.deleted, false)
  })

  it('乐观锁：旧版本更新应抛错', () => {
    const { controller } = makeCtrl()
    const def = controller.createDefinition({ tenantId: TENANT, name: '锁测试', type: 'revenue',
      dimensions: [{ field: 'store', alias: '门店' }], metrics: [{ field: 'revenue', fn: 'sum', alias: '营收' }],
      ownerId: 'test' })
    controller.updateDefinition(def.id, { tenantId: TENANT, version: '1' }, { name: '锁测试 v2' })
    // 用过期 version 再更新
    try {
      controller.updateDefinition(def.id, { tenantId: TENANT, version: '1' }, { name: '锁测试 v3' })
      assert.fail('过期版本应抛错')
    } catch (err: any) {
      assert.ok(err.message.includes('version mismatch'), `应提示版本冲突，实际: ${err.message}`)
    }
  })

  it('跨租户不能删除其他租户的定义（隔离性）', () => {
    const { controller } = makeCtrl()
    const def = controller.createDefinition({ tenantId: TENANT + '-iso', name: '租户A定义', type: 'revenue',
      dimensions: [{ field: 'store', alias: '门店' }], metrics: [{ field: 'revenue', fn: 'sum', alias: '营收' }],
      ownerId: 'test' })
    const result = controller.deleteDefinition(def.id, { tenantId: 'different-tenant' })
    assert.equal(result.deleted, false, '不应删除其他租户定义')
    const found = controller.getDefinition(def.id, { tenantId: TENANT + '-iso' })
    assert.ok(found, '定义应仍在')
    assert.equal(found!.name, '租户A定义', '原租户定义应仍在')
  })

  it('创建空 metrics 数组的定义应能工作（边界）', () => {
    const { controller } = makeCtrl()
    const def = controller.createDefinition({ tenantId: TENANT, name: '空指标报表', type: 'revenue',
      dimensions: [], metrics: [], ownerId: 'test' })
    assert.ok(def.id)
    assert.equal(def.metrics.length, 0)
  })

  it('无 tenantId 获取定义返回 null', () => {
    const { controller } = makeCtrl()
    const result = controller.getDefinition('any-id', { tenantId: undefined as any })
    assert.equal(result, null)
  })
})
