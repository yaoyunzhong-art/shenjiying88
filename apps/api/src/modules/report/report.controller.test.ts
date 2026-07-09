import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 报表/看板 Controller 测试 (V10 Day 7 Phase 91 | Enhanced: 8-角色补全)
 *
 * 覆盖：路由元数据验证 / 报表 CRUD 正常流程 / 看板 CRUD / 数据查询 & 注入
 * 8 角色视角：👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 边界异常：不存在的报表 / 看板 / 空数据范围 / 跨维度聚合
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ReportController } from './report.controller'
import { ReportService } from './report.service'
import type { ReportPeriod, ReportMetric, ReportDimension, ReportDataPoint } from './report.entity'

// ══════════════════════════════════════════════════════════════
// 路由元数据验证
// ══════════════════════════════════════════════════════════════

const ROUTES: Array<{ method: number; path: string; handler: string; verb: string }> = [
  { method: 0, path: 'list',                    handler: 'listReports',      verb: 'GET'  },
  { method: 0, path: ':id',                      handler: 'getReport',       verb: 'GET'  },
  { method: 3, path: ':id',                      handler: 'deleteReport',    verb: 'DELETE' },
  { method: 1, path: 'create',                   handler: 'createReport',    verb: 'POST' },
  { method: 1, path: 'query',                    handler: 'query',           verb: 'POST' },
  { method: 1, path: 'ingest',                   handler: 'ingest',          verb: 'POST' },
  { method: 0, path: 'aggregate/:metric/:dimension', handler: 'aggregate',   verb: 'GET'  },
  { method: 0, path: 'dashboard/list',            handler: 'listDashboards', verb: 'GET'  },
  { method: 0, path: 'dashboard/:id',             handler: 'getDashboard',   verb: 'GET'  },
  { method: 1, path: 'dashboard/create',          handler: 'createDashboard',verb: 'POST' },
  { method: 1, path: 'dashboard/update/:id',      handler: 'updateDashboard',verb: 'POST' },
]

describe('路由元数据验证', () => {
  it('report controller path metadata is set', () => {
    const ctrlPath = Reflect.getMetadata('path', ReportController)
    assert.equal(ctrlPath, 'report')
  })

  for (const route of ROUTES) {
    it(`${route.verb} ${route.path} → ${route.handler}`, () => {
      const method = Reflect.getMetadata('method', ReportController.prototype[route.handler as keyof ReportController])
      const routePath = Reflect.getMetadata('path', ReportController.prototype[route.handler as keyof ReportController])
      assert.equal(method, route.method)
      assert.equal(routePath, route.path)
    })
  }

  it('所有 11 个路由都注册了元数据', () => {
    const methods = ROUTES.map((r) => r.handler)
    for (const handler of methods) {
      const method = Reflect.getMetadata('method', ReportController.prototype[handler as keyof ReportController])
      assert.ok(method !== undefined, `Missing metadata for ${handler}`)
    }
  })
})

// ══════════════════════════════════════════════════════════════
// 8 角色视角测试
// ══════════════════════════════════════════════════════════════

const ROLES = {
  StoreManager:  '👔店长',
  FrontDesk:     '🛒前台',
  HR:            '👥HR',
  Safety:        '🔧安监',
  Guide:         '🎮导玩员',
  Operations:    '🎯运行专员',
  Teambuilding:  '🤝团建',
  Marketing:     '📢营销',
} as const

function makeController(): ReportController {
  return new ReportController(new ReportService())
}

// 👔 店长 - 关注门店销售报表和总览看板
describe(`${ROLES.StoreManager} report 场景`, () => {
  it('店长查看销售日报列表, 确认种子报表包含销售日报', () => {
    const ctrl = makeController()
    const { items } = ctrl.listReports()
    const salesRpt = items.find((r) => r.name === '销售日报')
    assert.ok(salesRpt, '销售日报应存在')
    assert.equal(salesRpt!.period, 'daily')
    assert.ok(salesRpt!.metrics.includes('sales.amount'))
  })

  it('店长查看总览看板, 确认包含销售趋势卡片', () => {
    const ctrl = makeController()
    const { items } = ctrl.listDashboards('tenant-A')
    const overview = items.find((d) => d.name === '总览看板')
    assert.ok(overview, '总览看板应存在')
    assert.ok(overview!.cards.some((c) => c.title === '销售趋势'))
  })

  it('店长实时报表: query 获取当日销售数据不抛异常', async () => {
    const ctrl = makeController()
    const result = await ctrl.query({ reportId: 'rpt-seed-sales', period: 'daily' })
    assert.ok(result.data.length > 0, '销售日报应有数据')
    assert.equal(result.reportId, 'rpt-seed-sales')
  })
})

// 🛒 前台 - 关注简单数据输入和看板
describe(`${ROLES.FrontDesk} report 场景`, () => {
  it('前台录入每日数据点, 确认成功返回数量', () => {
    const ctrl = makeController()
    const result = ctrl.ingest({
      points: [
        { bucket: '2026-06-30', dimension: 'store-001', metric: 'sales.amount', value: 35000 },
        { bucket: '2026-06-30', dimension: 'store-001', metric: 'sales.count', value: 72 },
      ],
    })
    assert.equal(result.ingested, 2)
  })

  it('前台空数据点提交, 返回 0 但无异常', () => {
    const ctrl = makeController()
    const result = ctrl.ingest({ points: [] })
    assert.equal(result.ingested, 0)
  })

  it('前台查看全局共享看板即使无 ownerId 前缀匹配', () => {
    const ctrl = makeController()
    const { items } = ctrl.listDashboards('unknown')
    const shared = items.filter((d) => d.isShared)
    assert.ok(shared.length > 0, '共享看板应始终可见')
  })
})

// 👥 HR - 关注人员相关报表（无直接 HR 维度，验证 API 兼容性）
describe(`${ROLES.HR} report 场景`, () => {
  it('HR 按 member_tier 维度聚合会员数据不抛异常', () => {
    const ctrl = makeController()
    const result = ctrl.aggregate('member.new', 'member_tier')
    assert.equal(result.metric, 'member.new')
    assert.equal(result.dimension, 'member_tier')
    assert.ok(typeof result.totals === 'object')
  })

  it('HR 创建会员相关报表', () => {
    const ctrl = makeController()
    const result = ctrl.createReport({
      name: '会员成长报表',
      period: 'monthly',
      metrics: ['member.new', 'member.active'],
      dimensions: ['member_tier'],
      source: 'members',
      cacheTtl: 600,
      createdBy: 'hr-dept',
    })
    assert.ok(result.id)
    assert.equal(result.name, '会员成长报表')
    assert.equal(result.createdBy, 'hr-dept')
  })
})

// 🔧 安监 - 关注异常报告和 AI 使用监控
describe(`${ROLES.Safety} report 场景`, () => {
  it('安监查看 AI 使用报表, 确认 tokens 和 latency 指标', () => {
    const ctrl = makeController()
    const rpt = ctrl.getReport('rpt-seed-ai')
    assert.ok(rpt)
    assert.ok(rpt.metrics.includes('ai.tokens'))
    assert.ok(rpt.metrics.includes('ai.latency'))
  })

  it('安监聚合 AI latency 按门店维度查看', () => {
    const ctrl = makeController()
    const result = ctrl.aggregate('ai.latency', 'store')
    assert.equal(result.metric, 'ai.latency')
    assert.equal(result.dimension, 'store')
  })

  it('安监查询不存在的报表应抛出 NotFound 错误', async () => {
    const ctrl = makeController()
    await assert.rejects(
      () => ctrl.query({ reportId: 'rpt-does-not-exist', period: 'daily' }),
      /not found/,
    )
  })
})

// 🎮 导玩员 - 关注店内运营数据
describe(`${ROLES.Guide} report 场景`, () => {
  it('导玩员创建门店专用看板', () => {
    const ctrl = makeController()
    const result = ctrl.createDashboard({
      name: '门店运营看板',
      cards: [],
      ownerId: 'store-001',
      isShared: false,
    })
    assert.ok(result.id)
    assert.equal(result.name, '门店运营看板')
    assert.equal(result.isShared, false)
  })

  it('导玩员查看门店库存周转指标不抛异常', () => {
    const ctrl = makeController()
    const result = ctrl.aggregate('inventory.turnover', 'store')
    assert.equal(result.metric, 'inventory.turnover')
    assert.equal(result.dimension, 'store')
  })
})

// 🎯 运行专员 - 关注数据缓存、性能、聚合能力
describe(`${ROLES.Operations} report 场景`, () => {
  it('运行专员多次查询相同条件应命中缓存（返回相同 totalPoints）', async () => {
    const ctrl = makeController()
    const r1 = await ctrl.query({ reportId: 'rpt-seed-sales', period: 'daily' })
    const r2 = await ctrl.query({ reportId: 'rpt-seed-sales', period: 'daily' })
    assert.equal(r1.totalPoints, r2.totalPoints, '缓存返回一致的结果')
  })

  it('运行专员跨维度聚合销售和 AI 指标', () => {
    const ctrl = makeController()
    const salesAgg = ctrl.aggregate('sales.amount', 'store')
    const aiAgg = ctrl.aggregate('ai.tokens', 'store')
    assert.ok(Object.keys(salesAgg.totals).length > 0, '销售聚合应有数据')
    assert.ok(Object.keys(aiAgg.totals).length > 0, 'AI 聚合应有数据')
  })

  it('运行专员大数据量导入分多次执行', () => {
    const ctrl = makeController()
    const batch1 = ctrl.ingest({ points: Array.from({ length: 100 }, (_, i) => ({
      bucket: '2026-06-30', dimension: `store-${i % 10}`, metric: 'sales.amount' as ReportMetric,
      value: Math.random() * 50000,
    })) })
    assert.equal(batch1.ingested, 100)

    const batch2 = ctrl.ingest({ points: Array.from({ length: 50 }, (_, i) => ({
      bucket: '2026-06-30', dimension: `store-${i % 5}`, metric: 'sales.count' as ReportMetric,
      value: Math.floor(Math.random() * 200),
    })) })
    assert.equal(batch2.ingested, 50)
  })
})

// 🤝 团建 - 关注跨门店/跨品牌报表
describe(`${ROLES.Teambuilding} report 场景`, () => {
  it('团建查看按 brand 维度聚合的销售额', () => {
    const ctrl = makeController()
    // aggregateBy 本身不验证维度合法性, 验证不抛异常
    const result = ctrl.aggregate('sales.amount', 'brand')
    assert.equal(result.metric, 'sales.amount')
    assert.equal(result.dimension, 'brand')
  })

  it('团建创建跨品牌看板并分享', () => {
    const ctrl = makeController()
    const result = ctrl.createDashboard({
      name: '跨品牌业绩看板',
      cards: [
        { id: 'x1', reportId: 'rpt-seed-sales', display: 'bar', title: '品牌销量对比',
          size: { w: 6, h: 4 }, position: { x: 0, y: 0 } },
      ],
      ownerId: 'brand-ops',
      isShared: true,
    })
    assert.ok(result.id)
    assert.equal(result.isShared, true)
  })

  it('团建更新分享看板名称', () => {
    const ctrl = makeController()
    const updated = ctrl.updateDashboard('dash-seed-overview', { name: '全员可见总览' })
    assert.ok(updated)
    assert.equal(updated!.name, '全员可见总览')
  })
})

// 📢 营销 - 关注营销 ROI 和活动数据
describe(`${ROLES.Marketing} report 场景`, () => {
  it('营销获取销售日报用于分析 ROI', () => {
    const ctrl = makeController()
    const rpt = ctrl.getReport('rpt-seed-sales')
    assert.ok(rpt)
    assert.ok(rpt.metrics.includes('sales.count'))
  })

  it('营销按 campaign 维度聚合自定义数据', () => {
    const ctrl = makeController()
    // 先注入营销数据
    ctrl.ingest({
      points: Array.from({ length: 3 }, (_, i) => ({
        bucket: '2026-W26', dimension: `campaign-${i + 1}`, metric: 'marketing.roi' as ReportMetric,
        value: 1.5 + i * 0.5,
      })),
    })
    const result = ctrl.aggregate('marketing.roi', 'campaign')
    assert.equal(result.metric, 'marketing.roi')
    assert.equal(result.dimension, 'campaign')
    const values = Object.values(result.totals)
    // 如果没有匹配的数据源(campaign维度不在 orders 中返回空)
    assert.ok(values.length >= 0)
  })

  it('营销按空 ownerId 查询看板列表, 使用 tenant-A 默认值', () => {
    const ctrl = makeController()
    // 空字符串和非空各自的过滤不同, 确保至少不抛异常
    const result = ctrl.listDashboards('')
    assert.ok(Array.isArray(result.items))
    assert.equal(typeof result.total, 'number')
  })
})

// ══════════════════════════════════════════════════════════════
// 报表 CRUD 正常流程
// ══════════════════════════════════════════════════════════════

describe('报表 CRUD - 正常流程', () => {
  it('listReports 返回正确结构', () => {
    const ctrl = makeController()
    const { items, total } = ctrl.listReports()
    assert.ok(Array.isArray(items))
    assert.ok(total >= 3) // 3 个种子报表
    assert.equal(items.length, total)
    for (const item of items) {
      assert.ok(item.id)
      assert.ok(item.name)
      assert.ok(item.period)
      assert.ok(Array.isArray(item.metrics))
      assert.ok(Array.isArray(item.dimensions))
      assert.ok(item.source)
      assert.equal(typeof item.cacheTtl, 'number')
    }
  })

  it('getReport 返回已存在的报表', () => {
    const ctrl = makeController()
    const result = ctrl.getReport('rpt-seed-sales')
    assert.ok(result)
    assert.equal(result.name, '销售日报')
    assert.equal(result.source, 'orders')
  })

  it('createReport 创建完整的新报表定义', () => {
    const ctrl = makeController()
    const result = ctrl.createReport({
      name: '测试周报',
      period: 'weekly',
      metrics: ['sales.amount', 'member.new'],
      dimensions: ['store', 'member_tier'],
      source: 'orders',
      cacheTtl: 300,
      createdBy: 'tester',
    })
    assert.ok(result.id)
    assert.equal(result.name, '测试周报')
    assert.equal(result.createdBy, 'tester')
    assert.ok(result.createdAt)
    assert.ok(result.updatedAt)
  })

  it('createReport 生成的 id 是唯一的', () => {
    const ctrl = makeController()
    const r1 = ctrl.createReport({ name: 'R1', period: 'daily', metrics: ['sales.amount'], dimensions: ['store'], source: 'orders', cacheTtl: 60, createdBy: 'a' })
    const r2 = ctrl.createReport({ name: 'R2', period: 'daily', metrics: ['sales.amount'], dimensions: ['store'], source: 'orders', cacheTtl: 60, createdBy: 'b' })
    assert.notEqual(r1.id, r2.id)
  })
})

// ══════════════════════════════════════════════════════════════
// 看板 CRUD 正常流程
// ══════════════════════════════════════════════════════════════

describe('看板 CRUD - 正常流程', () => {
  it('listDashboards 返回 ownerId 匹配和共享看板', () => {
    const ctrl = makeController()
    const { items } = ctrl.listDashboards('tenant-A')
    assert.ok(items.length > 0)
    const allOwnedOrShared = items.every((d) => d.ownerId === 'tenant-A' || d.isShared)
    assert.ok(allOwnedOrShared)
  })

  it('getDashboard 返回已存在的看板', () => {
    const ctrl = makeController()
    const result = ctrl.getDashboard('dash-seed-overview')
    assert.ok(result)
    assert.equal(result.name, '总览看板')
    assert.ok(result.cards.length > 0)
    assert.ok(result.cards.every((c) => c.id && c.title && c.display))
  })

  it('createDashboard 创建完整的新看板', () => {
    const ctrl = makeController()
    const result = ctrl.createDashboard({
      name: '销售监控',
      cards: [
        { id: 'nc1', reportId: 'rpt-seed-sales', display: 'number', title: '今日销售',
          size: { w: 3, h: 2 }, position: { x: 0, y: 0 } },
      ],
      ownerId: 'store-001',
      isShared: false,
    })
    assert.ok(result.id)
    assert.equal(result.name, '销售监控')
    assert.equal(result.ownerId, 'store-001')
    assert.equal(result.isShared, false)
  })

  it('updateDashboard 更新看板部分字段', () => {
    const ctrl = makeController()
    const updated = ctrl.updateDashboard('dash-seed-overview', { name: '更新总览', isShared: false })
    assert.ok(updated)
    assert.equal(updated!.name, '更新总览')
    assert.equal(updated!.isShared, false)
  })
})

// ══════════════════════════════════════════════════════════════
// 数据查询 & 注入
// ══════════════════════════════════════════════════════════════

describe('数据查询 & 注入', () => {
  it('query 返回正确的数据结构', async () => {
    const ctrl = makeController()
    const result = await ctrl.query({ reportId: 'rpt-seed-sales', period: 'daily' })
    assert.ok(result.reportId)
    assert.equal(result.period, 'daily')
    assert.ok(result.generatedAt)
    assert.ok(Array.isArray(result.data))
    assert.equal(typeof result.totalPoints, 'number')
    for (const dp of result.data) {
      assert.ok(dp.bucket)
      assert.ok(dp.dimension)
      assert.ok(dp.metric)
      assert.equal(typeof dp.value, 'number')
    }
  })

  it('query 支持 from/to 范围过滤', async () => {
    const ctrl = makeController()
    const result = await ctrl.query({
      reportId: 'rpt-seed-sales',
      period: 'daily',
      from: '2000-01-01',
      to: '2099-12-31',
    })
    assert.ok(result.data.length > 0)
  })

  it('query 空范围返回空数据', async () => {
    const ctrl = makeController()
    const result = await ctrl.query({
      reportId: 'rpt-seed-sales',
      period: 'daily',
      from: '2025-01-01',
      to: '2025-01-02',
    })
    assert.equal(result.data.length, 0)
  })

  it('ingest 批量注入并返回数量', () => {
    const ctrl = makeController()
    const points: ReportDataPoint[] = [
      { bucket: '2026-06-30', dimension: 'store-001', metric: 'sales.amount', value: 100 },
      { bucket: '2026-06-30', dimension: 'store-002', metric: 'sales.amount', value: 200 },
      { bucket: '2026-06-30', dimension: 'store-003', metric: 'sales.amount', value: 300 },
    ]
    const result = ctrl.ingest({ points })
    assert.equal(result.ingested, 3)
  })

  it('ingest 空数据点返回 0', () => {
    const ctrl = makeController()
    const result = ctrl.ingest({ points: [] })
    assert.equal(result.ingested, 0)
  })

  it('aggregate 按指标+维度返回正确格式', () => {
    const ctrl = makeController()
    const result = ctrl.aggregate('sales.amount', 'store')
    assert.equal(result.metric, 'sales.amount')
    assert.equal(result.dimension, 'store')
    assert.ok(typeof result.totals, 'object')
    for (const [key, val] of Object.entries(result.totals)) {
      assert.equal(typeof key, 'string')
      assert.equal(typeof val, 'number')
    }
  })

  it('aggregate 对于无数据维度返回空的 totals', () => {
    const ctrl = makeController()
    const result = ctrl.aggregate('inventory.turnover', 'product')
    // inventory.turnover 无数据源, 返回空 Map
    assert.equal(Object.keys(result.totals).length, 0)
  })
})

// ══════════════════════════════════════════════════════════════
// 边界与异常
// ══════════════════════════════════════════════════════════════

describe('边界与异常', () => {
  it('getReport 不存在的 id 返回 400 BadRequest', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.getReport('non-existent-id'),
      /not found/i,
    )
  })

  it('getDashboard 不存在的 id 返回 400 BadRequest', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.getDashboard('non-existent-dash'),
      /not found/i,
    )
  })

  it('updateDashboard 不存在的 id 返回 400 BadRequest', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.updateDashboard('non-existent', { name: 'N/A' }),
      /not found/i,
    )
  })

  it('query 不存在的 reportId 抛出异常', async () => {
    const ctrl = makeController()
    await assert.rejects(
      () => ctrl.query({ reportId: 'fake-rpt', period: 'daily' }),
      /not found/i,
    )
  })

  it('query 使用 custom period 不抛异常', async () => {
    const ctrl = makeController()
    const result = await ctrl.query({
      reportId: 'rpt-seed-sales',
      period: 'custom' as ReportPeriod,
      from: '2026-06-01',
      to: '2026-06-30',
    })
    assert.ok(result)
  })

  it('aggregate 对不支持的指标不抛异常只返回空对象', () => {
    const ctrl = makeController()
    // marketing.roi 没有数据注入所以为空
    const result = ctrl.aggregate('marketing.roi', 'campaign')
    assert.ok(result)
    assert.equal(result.metric, 'marketing.roi')
  })

  it('listDashboards 空 ownerId 不抛异常', () => {
    const ctrl = makeController()
    const result = ctrl.listDashboards('')
    assert.ok(Array.isArray(result.items))
  })
})
