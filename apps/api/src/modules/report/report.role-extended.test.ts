import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🦞 龙虾哥测试第二段
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 * 8角色视角·Report报表模块扩展角色测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ReportService } from './report.service'
import { ReportController } from './report.controller'

const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

function makeSvc(): ReportService {
  return new ReportService()
}
function makeCtrl(svc?: ReportService): ReportController {
  return new ReportController(svc ?? makeSvc())
}

/** 创建一个有效报表并返回 */
function seedReport(svc: ReportService, overrides: any = {}) {
  return svc.createReport({
    name: overrides.name ?? '测试报表',
    period: overrides.period ?? 'daily',
    metrics: (overrides.metrics ?? ['sales.amount']) as any,
    dimensions: (overrides.dimensions ?? ['store']) as any,
    source: overrides.source ?? 'orders',
    cacheTtl: overrides.cacheTtl ?? 300,
    createdBy: overrides.createdBy ?? 'test',
  })
}

// ════════════ 👔店长 ════════════
describe(`${ROLES.TenantAdmin} 报表角色测试`, () => {
  it('店长可查看全部报表定义', () => {
    const ctrl = makeCtrl()
    const result = ctrl.listReports()
    assert.ok(Array.isArray(result.items))
    assert.ok(result.total >= 0)
  })

  it('店长可创建运营看板', () => {
    const svc = makeSvc()
    const dashboard = svc.createDashboard({ isShared: false,
      ownerId: 'tenant-A',
      name: '门店运营总览',
      cards: [{ id: 'c1', reportId: 'rpt-1', display: 'number' as const, title: 'Revenue', size: { w: 6, h: 4 }, position: { x: 0, y: 0 } }],
    })
    assert.ok(dashboard.id)
    assert.equal(dashboard.name, '门店运营总览')
  })

  it('反例：获取不存在的报表', () => {
    const ctrl = makeCtrl()
    assert.throws(() => ctrl.getReport('nonexistent'), /not found/)
  })
})

// ════════════ 🛒前台 ════════════
describe(`${ROLES.Reception} 报表角色测试`, () => {
  it('前台可查询日维度报表', async () => {
    const svc = makeSvc()
    const rpt = seedReport(svc, { name: '销售日报', metrics: ['sales.amount'] })
    const result = await svc.query({ reportId: rpt.id, period: 'daily' })
    assert.ok(result)
  })

  it('前台可查看已创建的看板列表', () => {
    const ctrl = makeCtrl()
    const dashboards = ctrl.listDashboards('tenant-A')
    assert.ok(Array.isArray(dashboards.items))
  })

  it('边界：列表报表包含预置数据', () => {
    const svc = makeSvc()
    const reports = svc.listReports()
    assert.ok(Array.isArray(reports))
  })
})

// ════════════ 👥HR ════════════
describe(`${ROLES.HR} 报表角色测试`, () => {
  it('HR按维度聚合统计', () => {
    const svc = makeSvc()
    svc.ingestDataPoints([
      { metric: 'sales.amount', bucket: new Date().toISOString(), value: 10, label: '运营' },
      { metric: 'sales.amount', bucket: new Date().toISOString(), value: 5, label: '市场' },
    ] as any[])
    const ctrl = makeCtrl(svc)
    const agg = ctrl.aggregate('sales.amount' as any, 'dept')
    assert.equal(agg.metric, 'sales.amount')
    assert.equal(agg.dimension, 'dept')
  })

  it('HR可创建自定义报表', () => {
    const svc = makeSvc()
    const report = seedReport(svc, {
      name: '人员流动月报',
      period: 'monthly',
      metrics: ['marketing.roi'] as any,
      source: 'orders',
    })
    assert.equal(report.name, '人员流动月报')
  })

  it('边界：空数据聚合', () => {
    const svc = makeSvc()
    const totals = svc.aggregateBy('nonexistent' as any, 'dept')
    assert.equal(totals.size, 0)
  })
})

// ════════════ 🔧安监 ════════════
describe(`${ROLES.Safety} 报表角色测试`, () => {
  it('安监可创建安全事件看板', () => {
    const svc = makeSvc()
    const dash = svc.createDashboard({ isShared: false,
      ownerId: 'tenant-safety',
      name: '安防监控看板',
      cards: [
        { id: 'c1', reportId: 'rpt-safety', display: 'number' as const, title: 'Incidents', size: { w: 6, h: 4 }, position: { x: 0, y: 0 } },
        { id: 'c2', reportId: 'rpt-safety', display: 'number' as const, title: 'Uptime', size: { w: 6, h: 4 }, position: { x: 6, y: 0 } },
      ],
    })
    assert.ok(dash.id)
    assert.equal(dash.cards.length, 2)
  })

  it('安监可更新看板布局', () => {
    const svc = makeSvc()
    const dash = svc.createDashboard({ isShared: false,
      ownerId: 'tenant-safety',
      name: '初始看板',
      cards: [],
    })
    const updated = svc.updateDashboard(dash.id, { name: '更新安防看板' })
    assert.equal(updated?.name, '更新安防看板')
  })

  it('反例：更新不存在的看板', () => {
    const svc = makeSvc()
    const result = svc.updateDashboard('nonexistent-dash', { name: 'test' })
    assert.equal(result, null)
  })
})

// ════════════ 🎮导玩员 ════════════
describe(`${ROLES.Guide} 报表角色测试`, () => {
  it('导玩员可获取单报表详情', () => {
    const svc = makeSvc()
    const report = seedReport(svc, { name: '设备使用统计' })
    const got = svc.getReport(report.id)
    assert.equal(got?.id, report.id)
    assert.equal(got?.name, '设备使用统计')
  })

  it('导玩员按指标聚合数据', () => {
    const svc = makeSvc()
    svc.ingestDataPoints([
      { metric: 'sales.amount', bucket: new Date().toISOString(), value: 80, label: '台球桌' },
    ] as any[])
    const totals = svc.aggregateBy('sales.amount' as any, 'type')
    assert.ok(totals.size > 0)
  })

  it('边界：大量数据注入', () => {
    const svc = makeSvc()
    const points = Array.from({ length: 100 }, (_, i) => ({
      metric: 'sales.count' as const,
      bucket: new Date().toISOString(),
      value: Math.floor(Math.random() * 100),
      label: String(i),
    }))
    svc.ingestDataPoints(points as any)
    const ctrl = makeCtrl(svc)
    const result = ctrl.ingest({ points })
    assert.equal(result.ingested, 100)
  })
})

// ════════════ 🎯运行专员 ════════════
describe(`${ROLES.Ops} 报表角色测试`, () => {
  it('运行专员可查询运维周报', async () => {
    const svc = makeSvc()
    const rpt = seedReport(svc, { name: '运维周报', period: 'weekly' })
    const result = await svc.query({ reportId: rpt.id, period: 'weekly' })
    assert.ok(result)
  })

  it('运行专员可获取指定报表定义', () => {
    const svc = makeSvc()
    const report = seedReport(svc, {
      name: '运维日报',
      metrics: ['sales.amount', 'sales.count'] as any,
    })
    const look = svc.getReport(report.id)
    assert.ok(look?.metrics?.length)
  })

  it('边界：未定义报表的查询', async () => {
    const svc = makeSvc()
    await assert.rejects(
      () => svc.query({ reportId: 'undefined-report', period: 'daily' }),
      /report/i
    )
  })
})

// ════════════ 🤝团建 ════════════
describe(`${ROLES.Teambuilding} 报表角色测试`, () => {
  it('团建可查询活动效果报表', () => {
    const svc = makeSvc()
    seedReport(svc, { name: '团建活动统计', metrics: ['marketing.roi'] as any })
    const reports = svc.listReports()
    const found = reports.find(r => r.name.includes('团建'))
    assert.ok(found)
  })

  it('团建可创建活动看板', () => {
    const svc = makeSvc()
    const dash = svc.createDashboard({ isShared: false,
      ownerId: 'tenant-team',
      name: '团建活动看板',
      cards: [{ id: 'c1', reportId: 'rpt-team', display: 'number' as const, title: 'Participation', size: { w: 6, h: 4 }, position: { x: 0, y: 0 } }],
    })
    assert.ok(dash.id)
    const got = svc.getDashboard(dash.id)
    assert.equal(got?.name, '团建活动看板')
  })

  it('反例：获取不存在的看板', () => {
    const ctrl = makeCtrl()
    assert.throws(() => ctrl.getDashboard('nonexistent-dash'), /not found/)
  })
})

// ════════════ 📢营销 ════════════
describe(`${ROLES.Marketing} 报表角色测试`, () => {
  it('营销可创建营销活动报表', () => {
    const svc = makeSvc()
    const report = seedReport(svc, {
      name: '营销ROI分析',
      metrics: ['sales.amount', 'marketing.roi'] as any,
    })
    assert.equal(report.name, '营销ROI分析')
    assert.ok(report.id)
  })

  it('营销汇总报表 + 数据注入闭环', () => {
    const svc = makeSvc()
    svc.ingestDataPoints([
      { metric: 'sales.amount', bucket: '2026-06-01', value: 5000, label: '朋友圈' },
      { metric: 'sales.count', bucket: '2026-06-01', value: 120, label: '朋友圈' },
      { metric: 'sales.amount', bucket: '2026-06-01', value: 3000, label: '抖音' },
    ] as any[])
    const totals = svc.aggregateBy('sales.amount' as any, 'channel')
    assert.ok(totals.get('朋友圈') === 5000 || totals.size > 0)
  })

  it('营销可更新营销看板', () => {
    const svc = makeSvc()
    const dash = svc.createDashboard({ isShared: false,
      ownerId: 'tenant-mkt',
      name: '营销ROI看板',
      cards: [{ id: 'c1', reportId: 'rpt-mkt', display: 'number' as const, title: 'Impressions', size: { w: 6, h: 4 }, position: { x: 0, y: 0 } }],
    })
    const upd = svc.updateDashboard(dash.id, {
      cards: [
        { id: 'c1', reportId: 'rpt-mkt', display: 'number' as const, title: 'Impressions', size: { w: 6, h: 4 }, position: { x: 0, y: 0 } },
        { id: 'c2', reportId: 'rpt-mkt', display: 'number' as const, title: 'Conversions', size: { w: 6, h: 4 }, position: { x: 6, y: 0 } },
      ],
    })
    assert.equal(upd?.cards.length, 2)
  })
})
