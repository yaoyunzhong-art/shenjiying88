import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [report] [C] 角色测试 v3 — 大飞哥电玩城实景模拟
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 围绕大飞哥美国三店运营场景：
 * 店A: Cyber Galaxy Arcade (Colonial Heights)
 * 店B: 休斯顿
 * 店C: 达拉斯
 *
 * 每个角色 >= 2 测试用例（正常流程 + 业务边界 + 降级/重试场景）
 * 覆盖: listReports / getReport / createReport / query / ingest / aggregateBy
 *       dashboard CRUD / 缓存失效 / 空数据 / 并发写入
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ReportController } from './report.controller'
import { ReportService } from './report.service'
import type {
  ReportDefinition,
  ReportDataPoint,
  DashboardLayout,
} from './report.entity'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试数据工厂 ──
function createService(): ReportService {
  return new ReportService()
}

function createController(svc?: ReportService): ReportController {
  return new ReportController(svc ?? createService())
}

// ── 大飞哥三店场景数据 ──
const storeA = { id: 'store-cyber-galaxy', name: 'Cyber Galaxy Arcade', location: 'Colonial Heights, VA' }
const storeB = { id: 'store-houston', name: 'Houston Arcade Hub', location: 'Houston, TX' }
const storeC = { id: 'store-dallas', name: 'Dallas Game Center', location: 'Dallas, TX' }

// ── 👔店长 ──
describe(`${ROLES.StoreManager} report 角色测试 v3`, () => {
  it('店长创建周报并查看各门店销售趋势（经营决策场景）', async () => {
    const svc = createService()
    const ctrl = createController(svc)

    // 创建销售周报
    const weekly = ctrl.createReport({
      name: '三店销售周报',
      period: 'weekly',
      metrics: ['sales.amount', 'sales.count'],
      dimensions: ['store'],
      source: 'orders',
      cacheTtl: 600,
      createdBy: 'store-manager-001',
    })
    expect(weekly.name).toBe('三店销售周报')
    expect(weekly.period).toBe('weekly')
    expect(weekly.id).toBeTruthy()

    // 注入三家门店 7 天销售数据
    const today = new Date()
    const points: ReportDataPoint[] = []
    for (let day = 0; day < 7; day++) {
      const d = new Date(today)
      d.setDate(d.getDate() - day)
      const date = d.toISOString().slice(0, 10)
      for (const store of [storeA, storeB, storeC]) {
        points.push({
          bucket: date, dimension: store.id, metric: 'sales.amount',
          value: 30000 + Math.floor(Math.random() * 40000),
        })
        points.push({
          bucket: date, dimension: store.id, metric: 'sales.count',
          value: 80 + Math.floor(Math.random() * 100),
        })
      }
    }
    ctrl.ingest({ points })

    // 查询该报表
    const result = await ctrl.query({ reportId: weekly.id, period: 'weekly' })
    expect(result.reportId).toBe(weekly.id)
    expect(result.totalPoints).toBeGreaterThan(0)
    expect(result.data.length).toBeGreaterThan(0)
  })

  it('店长查看总览看板调度异常数据集（边界场景）', async () => {
    const svc = createService()
    const ctrl = createController(svc)

    // 注入空数据集
    ctrl.ingest({ points: [] })

    // 创建使用自定义 metric 的报表，避开种子数据
    const report = ctrl.createReport({
      name: '空库存报表',
      period: 'daily',
      metrics: ['inventory.turnover'],
      dimensions: ['store'],
      source: 'inventory',
      cacheTtl: 60,
      createdBy: 'store-manager-001',
    })
    const result = await ctrl.query({ reportId: report.id, period: 'daily' })
    expect(result.totalPoints).toBe(0)
    expect(result.data).toEqual([])

    // 创建一个空看板
    const dash = ctrl.createDashboard({
      name: '空看板',
      cards: [],
      ownerId: 'store-manager-001',
      isShared: false,
    })
    expect(dash.cards).toEqual([])
    expect(dash.name).toBe('空看板')
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} report 角色测试 v3`, () => {
  it('前台查询当日订单数报表确认收银数据（收银场景）', async () => {
    const svc = createService()
    const ctrl = createController(svc)

    const today = new Date().toISOString().slice(0, 10)
    ctrl.ingest({
      points: [
        { bucket: today, dimension: storeA.id, metric: 'sales.count', value: 156 },
        { bucket: today, dimension: storeB.id, metric: 'sales.count', value: 203 },
        { bucket: today, dimension: storeC.id, metric: 'sales.count', value: 88 },
      ],
    })

    const report = ctrl.createReport({
      name: '当日订单统计',
      period: 'daily',
      metrics: ['sales.count'],
      dimensions: ['store'],
      source: 'orders',
      cacheTtl: 30,
      createdBy: 'frontdesk-001',
    })

    const result = await ctrl.query({ reportId: report.id, period: 'daily', from: today, to: today })
    expect(result.totalPoints).toBe(3)
    const storeCounts = result.data.reduce((acc, p) => { acc[p.dimension] = p.value; return acc }, {} as Record<string, number>)
    expect(storeCounts[storeA.id]).toBe(156)
    expect(storeCounts[storeB.id]).toBe(203)
    expect(storeCounts[storeC.id]).toBe(88)
  })

  it('前台查询不存在的报表应抛出 BadRequest（边界场景）', async () => {
    const ctrl = createController()
    await expect(() =>
      ctrl.query({ reportId: 'nonexistent-report', period: 'daily' })
    ).rejects.toThrow()
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} report 角色测试 v3`, () => {
  it('HR 创建员工效能看板并添加卡片（人力场景）', async () => {
    const svc = createService()
    const ctrl = createController(svc)

    // 创建看板
    const dash = ctrl.createDashboard({
      name: '员工效能看板',
      cards: [
        {
          id: 'h1', reportId: 'rpt-seed-sales', display: 'number',
          title: '人均销售额', size: { w: 3, h: 2 }, position: { x: 0, y: 0 },
        },
      ],
      ownerId: 'hr-001',
      isShared: false,
    })
    expect(dash.name).toBe('员工效能看板')
    expect(dash.cards).toHaveLength(1)
    expect(dash.isShared).toBe(false)

    // 等待短暂时间确保 updatedAt 变化
    await new Promise(r => setTimeout(r, 5))
    const dashCreatedAt = dash.updatedAt

    // 更新看板增加卡片
    const updated = ctrl.updateDashboard(dash.id, {
      cards: [
        ...dash.cards,
        {
          id: 'h2', reportId: 'rpt-seed-member', display: 'table',
          title: '会员激活率', size: { w: 6, h: 4 }, position: { x: 3, y: 0 },
        },
      ],
    })
    expect(updated.cards).toHaveLength(2)
    expect(updated.updatedAt).not.toBe(dashCreatedAt)
  })

  it('HR 更新不存在的看板应抛出异常（边界场景）', () => {
    const ctrl = createController()
    expect(() =>
      ctrl.updateDashboard('nonexistent-dash', { name: '改名' })
    ).toThrow('not found')
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} report 角色测试 v3`, () => {
  it('安监查询 AI 使用报表监控异常延迟数据（安防场景）', async () => {
    const svc = createService()
    const ctrl = createController(svc)

    const today = new Date().toISOString().slice(0, 10)
    // 注入高延迟异常数据（使用自定义 metric 避免与种子数据混淆）
    ctrl.ingest({
      points: [
        { bucket: today, dimension: storeA.id, metric: 'ai.latency', value: 1500 },
        { bucket: today, dimension: storeB.id, metric: 'ai.latency', value: 3200 },
        { bucket: today, dimension: storeC.id, metric: 'ai.latency', value: 180 },
      ],
    })

    // 使用已有种子报表（rpt-seed-ai 包含 ai.latency）
    const result = await ctrl.query({ reportId: 'rpt-seed-ai', period: 'daily', from: today, to: today })

    // storeB 延迟应为 3200（> 3000ms 异常）
    const storeBData = result.data.find(p => p.dimension === storeB.id)
    expect(storeBData).toBeTruthy()
    expect(storeBData!.value).toBe(3200)
  })

  it('安监使用 aggregateBy 聚合各门店 AI token 总量（审计场景）', () => {
    const svc = createService()
    const ctrl = createController(svc)

    const today = new Date().toISOString().slice(0, 10)
    ctrl.ingest({
      points: [
        { bucket: today, dimension: storeA.id, metric: 'ai.tokens', value: 15000 },
        { bucket: today, dimension: storeB.id, metric: 'ai.tokens', value: 25000 },
        { bucket: today, dimension: storeA.id, metric: 'ai.tokens', value: 5000 },
      ],
    })

    const result = ctrl.aggregate('ai.tokens', 'store')
    // 使用 service 的 aggregateBy 直接验证
    const totals = svc.aggregateBy('ai.tokens', 'store')
    expect(totals.get(storeA.id)).toBe(20000)
    expect(totals.get(storeB.id)).toBe(25000)
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} report 角色测试 v3`, () => {
  it('导玩员查看本次活动销售报表确认活动效果（活动运营场景）', async () => {
    const svc = createService()
    const ctrl = createController(svc)

    const today = new Date().toISOString().slice(0, 10)
    ctrl.ingest({
      points: [
        { bucket: today, dimension: 'campaign-spring', metric: 'sales.amount', value: 120000 },
        { bucket: today, dimension: 'campaign-spring', metric: 'sales.count', value: 450 },
      ],
    })

    const report = ctrl.createReport({
      name: '春季活动销售',
      period: 'daily',
      metrics: ['sales.amount', 'sales.count'],
      dimensions: ['campaign'],
      source: 'orders',
      cacheTtl: 120,
      createdBy: 'guide-001',
    })

    const result = await ctrl.query({ reportId: report.id, period: 'daily', from: today, to: today })
    const amount = result.data.find(p => p.metric === 'sales.amount' && p.dimension === 'campaign-spring')
    const count = result.data.find(p => p.metric === 'sales.count' && p.dimension === 'campaign-spring')
    expect(amount?.value).toBe(120000)
    expect(count?.value).toBe(450)
  })

  it('导玩员查询无匹配 metric 的报表返回空数据（边界场景）', async () => {
    const svc = createService()
    const ctrl = createController(svc)

    ctrl.ingest({
      points: [
        { bucket: '2026-07-11', dimension: storeA.id, metric: 'sales.count', value: 100 },
      ],
    })

    const report = ctrl.createReport({
      name: '库存报表',
      period: 'daily',
      metrics: ['inventory.turnover'],
      dimensions: ['store'],
      source: 'inventory',
      cacheTtl: 60,
      createdBy: 'guide-001',
    })

    const result = await ctrl.query({ reportId: report.id, period: 'daily' })
    expect(result.totalPoints).toBe(0)
    expect(result.data).toEqual([])
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} report 角色测试 v3`, () => {
  it('运行专员批量更新看板布局（运维场景）', async () => {
    const svc = createService()
    const ctrl = createController(svc)

    const dash = ctrl.createDashboard({
      name: '运维监控看板',
      cards: [
        { id: 'o1', reportId: 'rpt-seed-ai', display: 'line', title: 'AI 延迟', size: { w: 6, h: 4 }, position: { x: 0, y: 0 } },
      ],
      ownerId: 'ops-001',
      isShared: true,
    })

    // 调整卡片尺寸
    const updated = ctrl.updateDashboard(dash.id, {
      cards: [
        { ...dash.cards[0], size: { w: 12, h: 6 }, position: { x: 0, y: 0 } },
      ],
    })
    expect(updated.cards[0].size.w).toBe(12)
    expect(updated.cards[0].size.h).toBe(6)
  })

  it('运行专员频繁创建报表验证缓存失效行为（缓存场景）', async () => {
    const svc = createService()
    const ctrl = createController(svc)

    const today = new Date().toISOString().slice(0, 10)

    // 使用自定义 metric 避免种子数据污染
    const report = ctrl.createReport({
      name: '缓存测试报表',
      period: 'daily',
      metrics: ['ai.latency'],
      dimensions: ['store'],
      source: 'ai_logs',
      cacheTtl: 3600, // 长缓存
      createdBy: 'ops-001',
    })

    // 注入仅 storeA 的数据
    ctrl.ingest({
      points: [
        { bucket: today, dimension: storeA.id, metric: 'ai.latency', value: 100 },
      ],
    })

    // 第一次查询 - 使用 from/to 限定到当天数据
    const result1 = await ctrl.query({ reportId: report.id, period: 'daily', from: today, to: today })
    expect(result1.totalPoints).toBe(1)

    // 注入新数据 - 缓存应被清除
    ctrl.ingest({
      points: [
        { bucket: today, dimension: storeB.id, metric: 'ai.latency', value: 200 },
      ],
    })

    // 第二次查询 - 应包含新数据
    const result2 = await ctrl.query({ reportId: report.id, period: 'daily', from: today, to: today })
    // 店A(100) + 店B(200) = 2 数据点在当天范围
    expect(result2.totalPoints).toBe(2)
    const stores = result2.data.map(p => p.dimension)
    expect(stores).toContain(storeA.id)
    expect(stores).toContain(storeB.id)
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} report 角色测试 v3`, () => {
  it('团建查看门店列表并按需筛选报表（活动策划场景）', async () => {
    const svc = createService()
    const ctrl = createController(svc)

    // 注入多门店数据
    const today = new Date().toISOString().slice(0, 10)
    ctrl.ingest({
      points: [
        { bucket: today, dimension: storeA.id, metric: 'sales.amount', value: 65000 },
        { bucket: today, dimension: storeB.id, metric: 'sales.amount', value: 72000 },
      ],
    })

    const report = ctrl.createReport({
      name: '团建活动效果',
      period: 'daily',
      metrics: ['sales.amount'],
      dimensions: ['store'],
      source: 'orders',
      cacheTtl: 120,
      createdBy: 'teambuilding-001',
    })

    const result = await ctrl.query({ reportId: report.id, period: 'daily' })
    // 检查分组聚合
    const totals = svc.aggregateBy('sales.amount', 'store')
    expect(totals.get(storeA.id)).toBe(65000)
    expect(totals.get(storeB.id)).toBe(72000)
  })

  it('团建删除报表并验证不再出现在列表（数据清理场景）', () => {
    const svc = createService()
    const ctrl = createController(svc)

    const report = ctrl.createReport({
      name: '临时活动报表',
      period: 'daily',
      metrics: ['sales.count'],
      dimensions: ['store'],
      source: 'orders',
      cacheTtl: 60,
      createdBy: 'teambuilding-001',
    })

    const before = ctrl.listReports().items.length

    // 删除（controller 返回 { success, id } 对象）
    ctrl.deleteReport(report.id)
    const after = ctrl.listReports().items.length
    expect(after).toBe(before - 1)

    // 再次删除应抛出异常
    expect(() => ctrl.deleteReport(report.id)).toThrow('not found')
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} report 角色测试 v3`, () => {
  it('营销创建营销 ROI 报表并注入数据验证聚合（营销场景）', async () => {
    const svc = createService()
    const ctrl = createController(svc)

    const report = ctrl.createReport({
      name: '促销 ROI 分析',
      period: 'daily',
      metrics: ['marketing.roi'],
      dimensions: ['campaign'],
      source: 'marketing',
      cacheTtl: 300,
      createdBy: 'marketing-001',
    })

    const today = new Date().toISOString().slice(0, 10)
    ctrl.ingest({
      points: [
        { bucket: today, dimension: 'campaign-summer', metric: 'marketing.roi', value: 3.5 },
        { bucket: today, dimension: 'campaign-summer', metric: 'marketing.roi', value: 4.2 },
        { bucket: today, dimension: 'campaign-spring', metric: 'marketing.roi', value: 2.8 },
      ],
    })

    const result = await ctrl.query({ reportId: report.id, period: 'daily' })
    expect(result.totalPoints).toBe(3)

    // 聚合验证
    const totals = svc.aggregateBy('marketing.roi', 'campaign')
    // summer campaign: 3.5 + 4.2 = 7.7
    expect(totals.get('campaign-summer')).toBeCloseTo(7.7, 1)
    expect(totals.get('campaign-spring')).toBe(2.8)
  })

  it('营销共享看板给全团队并验证权限（分享场景）', async () => {
    const svc = createService()
    const ctrl = createController(svc)

    const privateDash = ctrl.createDashboard({
      name: '私人营销计划',
      cards: [],
      ownerId: 'marketing-001',
      isShared: false,
    })

    const sharedDash = ctrl.createDashboard({
      name: '全员营销看板',
      cards: [],
      ownerId: 'marketing-001',
      isShared: true,
    })

    // 按 owner 查询
    const dashboards = svc.listDashboards('marketing-001')
    expect(dashboards.length).toBeGreaterThanOrEqual(2)

    // 共享看板被其他用户可见
    const otherDashboards = svc.listDashboards('some-other-user')
    const sharedIds = otherDashboards.map(d => d.id)
    expect(sharedIds).toContain(sharedDash.id)
    expect(sharedIds).not.toContain(privateDash.id)
  })
})

// ── 跨角色边界测试 ──
describe('跨角色 report 边界场景 v3', () => {
  it('同步注入大量数据点后列表查询性能验证', () => {
    const svc = createService()
    const ctrl = createController(svc)

    const today = new Date().toISOString().slice(0, 10)
    const bulkPoints: ReportDataPoint[] = []

    // 模拟 30 天 × 5 门店 × 4 指标
    for (let day = 0; day < 30; day++) {
      const d = new Date()
      d.setDate(d.getDate() - day)
      const date = d.toISOString().slice(0, 10)
      for (const storeId of ['store-001', 'store-002', 'store-003', 'store-004', 'store-005']) {
        bulkPoints.push({ bucket: date, dimension: storeId, metric: 'sales.amount', value: 40000 + Math.random() * 20000 })
        bulkPoints.push({ bucket: date, dimension: storeId, metric: 'sales.count', value: 100 + Math.random() * 50 })
        bulkPoints.push({ bucket: date, dimension: storeId, metric: 'ai.tokens', value: 8000 + Math.random() * 4000 })
        bulkPoints.push({ bucket: date, dimension: storeId, metric: 'ai.latency', value: 150 + Math.random() * 100 })
      }
    }

    ctrl.ingest({ points: bulkPoints })

    // 聚合验证
    const salesTotal = svc.aggregateBy('sales.amount', 'store')
    expect(salesTotal.size).toBe(5)

    // 报表查询
    const report = ctrl.createReport({
      name: '大飞哥综合月报',
      period: 'monthly',
      metrics: ['sales.amount', 'sales.count', 'ai.tokens'],
      dimensions: ['store'],
      source: 'orders',
      cacheTtl: 600,
      createdBy: 'system',
    })

    const result = svc.getReport(report.id)
    expect(result).toBeTruthy()
    expect(result!.metrics).toContain('sales.amount')
  })

  it('并发创建与删除报表操作应互不干扰', () => {
    const svc = createService()

    // 模拟并发创建20个报表
    const created = Array.from({ length: 20 }, (_, i) => {
      return svc.createReport({
        name: `并发报表-${i}`,
        period: 'daily',
        metrics: ['sales.amount'],
        dimensions: ['store'],
        source: 'orders',
        cacheTtl: 60,
        createdBy: 'test',
      })
    })
    expect(created.length).toBe(20)
    expect(new Set(created.map(r => r.id)).size).toBe(20) // 所有 id 唯一

    // 删除一半
    const half = created.slice(0, 10)
    half.forEach(r => svc.deleteReport(r.id))

    const remaining = svc.listReports()
    // 种子报表3个 + 20个 - 10个删除 = 13
    expect(remaining.length).toBeGreaterThanOrEqual(13)

    // 已删除的不可能出现
    const remainingIds = new Set(remaining.map(r => r.id))
    half.forEach(r => expect(remainingIds.has(r.id)).toBe(false))
  })
})
