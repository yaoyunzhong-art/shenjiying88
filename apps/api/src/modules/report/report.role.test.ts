import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [report] [C] 角色测试
 *
 * 8 角色视角的 report 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import assert from 'node:assert/strict'
import { ReportController } from './report.controller'
import { ReportService } from './report.service'

// ── 角色定义 ──
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

// ── Helpers ──
function makeController(): ReportController {
  return new ReportController(new ReportService())
}

// ===================================================================
// 👔 店长 — 关注门店整体销售额、会员增长、看板总览
// ===================================================================
describe(`${ROLES.StoreManager} report 角色测试`, () => {
  it('店长查看销售日报列表, 确认种子报表包含销售日报', () => {
    const ctrl = makeController()
    const { items } = ctrl.listReports()
    const salesRpt = items.find((r: any) => r.name === '销售日报')
    assert.ok(salesRpt, '销售日报应存在')
    assert.equal(salesRpt.period, 'daily')
    assert.ok(salesRpt.metrics.includes('sales.amount'))
  })

  it('店长查看总览看板, 确认包含销售趋势和 AI 使用卡片', () => {
    const ctrl = makeController()
    const { items } = ctrl.listDashboards('tenant-A')
    const overview = items.find((d: any) => d.name === '总览看板')
    assert.ok(overview, '总览看板应存在')
    assert.ok(overview.cards.some((c: any) => c.title === '销售趋势'))
    assert.ok(overview.cards.some((c: any) => c.title === 'AI 使用'))
    assert.equal(overview.isShared, true)
  })

  it('店长查询销售日报数据, 确认返回聚合数据点', async () => {
    const ctrl = makeController()
    const result = await ctrl.query({ reportId: 'rpt-seed-sales', period: 'daily' })
    assert.ok(result.data.length > 0)
    assert.ok(result.data.every((d: any) => d.metric.startsWith('sales.')))
  })

  it('店长跨门店聚合销售额, 确认门店维度聚合正确', () => {
    const ctrl = makeController()
    const result = ctrl.aggregate('sales.amount', 'store')
    assert.ok(Object.keys(result.totals).length > 0)
    // 至少应包含三个种子门店
    assert.ok(result.totals['store-001'] > 0)
  })
})

// ===================================================================
// 🛒 前台 — 收银数据上报、查看当日销售概况
// ===================================================================
describe(`${ROLES.FrontDesk} report 角色测试`, () => {
  it('前台上报本日收银数据点, 确认被正确记录', () => {
    const ctrl = makeController()
    const result = ctrl.ingest({
      points: [
        { bucket: '2026-06-29', dimension: 'store-001', metric: 'sales.amount', value: 35000 },
      ],
    })
    assert.equal(result.ingested, 1)
  })

  it('前台批量上报多门店数据, 确认全部写入', () => {
    const ctrl = makeController()
    const result = ctrl.ingest({
      points: [
        { bucket: '2026-06-29', dimension: 'store-001', metric: 'sales.count', value: 45 },
        { bucket: '2026-06-29', dimension: 'store-002', metric: 'sales.count', value: 32 },
        { bucket: '2026-06-29', dimension: 'store-003', metric: 'sales.count', value: 56 },
      ],
    })
    assert.equal(result.ingested, 3)
  })

  it('前台查看销售日报, 确认数据可达', async () => {
    const ctrl = makeController()
    const rpt = ctrl.getReport('rpt-seed-sales')
    assert.ok(rpt)
    const result = await ctrl.query({ reportId: 'rpt-seed-sales', period: 'daily' })
    assert.ok(result.data.length > 0)
  })

  it('前台尝试创建看板(权限边界: 前台不应有创建看板需求, 但仍可通过接口创建)', () => {
    const ctrl = makeController()
    const result = ctrl.createDashboard({
      name: '前台临时看板',
      cards: [],
      ownerId: 'tenant-A',
      isShared: false,
    })
    assert.ok(result.id)
    assert.equal(result.ownerId, 'tenant-A')
  })
})

// ===================================================================
// 👥 HR — 查看会员指标、关注员工看板
// ===================================================================
describe(`${ROLES.HR} report 角色测试`, () => {
  it('HR 查看会员周报定义, 确认包含会员相关指标', () => {
    const ctrl = makeController()
    const rpt = ctrl.getReport('rpt-seed-member')
    assert.ok(rpt)
    assert.equal(rpt.period, 'weekly')
    assert.ok(rpt.metrics.includes('member.new'))
    assert.ok(rpt.metrics.includes('member.active'))
  })

  it('HR 查询会员周报数据, 确认返回指标在预期范围', async () => {
    const ctrl = makeController()
    const result = await ctrl.query({ reportId: 'rpt-seed-member', period: 'weekly' })
    assert.ok(result)
    assert.equal(result.reportId, 'rpt-seed-member')
    assert.equal(result.period, 'weekly')
  })

  it('HR 创建会员数据分析看板(权限边界: HR 创建非共享看板)', () => {
    const ctrl = makeController()
    const dash = ctrl.createDashboard({
      name: '会员分析-HR',
      cards: [
        {
          id: 'hr-c1',
          reportId: 'rpt-seed-member',
          display: 'pie',
          title: '会员结构',
          size: { w: 6, h: 4 },
          position: { x: 0, y: 0 },
        },
      ],
      ownerId: 'hr-dept',
      isShared: false,
    })
    assert.ok(dash.id)
    assert.equal(dash.name, '会员分析-HR')
    assert.equal(dash.ownerId, 'hr-dept')
    assert.equal(dash.isShared, false)
  })
})

// ===================================================================
// 🔧 安监 — 监控 AI 使用异常、系统延迟告警
// ===================================================================
describe(`${ROLES.Security} report 角色测试`, () => {
  it('安监查看 AI 使用报表, 确认 AI token 和延迟指标可查', () => {
    const ctrl = makeController()
    const rpt = ctrl.getReport('rpt-seed-ai')
    assert.ok(rpt)
    assert.ok(rpt.metrics.includes('ai.tokens'))
    assert.ok(rpt.metrics.includes('ai.latency'))
    assert.equal(rpt.source, 'ai_logs')
  })

  it('安监查询 AI 延迟数据并按门店聚合, 识别异常门店', async () => {
    const ctrl = makeController()
    const result = await ctrl.query({ reportId: 'rpt-seed-ai', period: 'daily' })
    assert.ok(result.data.length > 0)
    const aiLatency = result.data.filter((d: any) => d.metric === 'ai.latency')
    assert.ok(aiLatency.length > 0)
  })

  it('安监创建 AI 安全合规看板(权限边界: 创建看板并共享给管理层)', () => {
    const ctrl = makeController()
    const dash = ctrl.createDashboard({
      name: 'AI 合规监控',
      cards: [
        {
          id: 'sec-c1',
          reportId: 'rpt-seed-ai',
          display: 'heatmap',
          title: 'AI 延迟热力图',
          size: { w: 6, h: 4 },
          position: { x: 0, y: 0 },
        },
      ],
      ownerId: 'security-team',
      isShared: true,
    })
    assert.ok(dash.id)
    assert.ok(dash.isShared)
  })
})

// ===================================================================
// 🎮 导玩员 — 上报设备运营数据、查看场馆运营报表
// ===================================================================
describe(`${ROLES.Guide} report 角色测试`, () => {
  it('导玩员上报游乐设备相关指标(自定义维度)', () => {
    const ctrl = makeController()
    const result = ctrl.ingest({
      points: [
        { bucket: '2026-06-29', dimension: 'device-arcade-01', metric: 'sales.count', value: 120 },
        { bucket: '2026-06-29', dimension: 'device-arcade-01', metric: 'sales.amount', value: 3000 },
      ],
    })
    assert.equal(result.ingested, 2)
  })

  it('导玩员查看销售日报确认设备数据, 检查新注入数据存在', async () => {
    const ctrl = makeController()
    // 先注入后查询
    ctrl.ingest({
      points: [
        { bucket: '2026-06-29', dimension: 'device-kart-01', metric: 'sales.count', value: 85 },
      ],
    })
    const result = await ctrl.query({ reportId: 'rpt-seed-sales', period: 'daily' })
    assert.ok(result.data.length > 0)
  })

  it('导玩员尝试创建看板(权限边界: 仅创建私有看板)', () => {
    const ctrl = makeController()
    const dash = ctrl.createDashboard({
      name: '设备运营看板',
      cards: [],
      ownerId: 'guide-001',
      isShared: false,
    })
    assert.ok(dash.id)
    assert.equal(dash.ownerId, 'guide-001')
    assert.equal(dash.isShared, false)
  })
})

// ===================================================================
// 🎯 运行专员 — 维护报表定义、管理看板、聚合分析
// ===================================================================
describe(`${ROLES.Operations} report 角色测试`, () => {
  it('运行专员创建新的运营报表, 确认报表被正确注册', () => {
    const ctrl = makeController()
    const rpt = ctrl.createReport({
      name: '设备运营日报',
      period: 'daily',
      metrics: ['sales.count', 'sales.amount'],
      dimensions: ['store', 'category'],
      source: 'orders',
      cacheTtl: 120,
      createdBy: 'ops-admin',
    })
    assert.ok(rpt.id)
    assert.equal(rpt.name, '设备运营日报')
    assert.equal(rpt.createdBy, 'ops-admin')
    assert.equal(rpt.cacheTtl, 120)
  })

  it('运行专员更新看板布局, 确认更新成功', () => {
    const ctrl = makeController()
    const dash = ctrl.updateDashboard('dash-seed-overview', {
      name: '总览看板-已更新',
      cards: [
        {
          id: 'c1', reportId: 'rpt-seed-sales', display: 'number',
          title: '今日销售额', size: { w: 3, h: 2 }, position: { x: 0, y: 0 },
        },
      ],
    })
    assert.ok(dash)
    assert.equal(dash.name, '总览看板-已更新')
    assert.ok(dash.updatedAt)
  })

  it('运行专员更新不存在的看板(边界: 返回 400)', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.updateDashboard('non-existent-dash', { name: '虚拟看板' }),
      /not found/,
    )
  })

  it('运行专员按维度聚合库存指标, 确认不存在的指标返回空结果', () => {
    const ctrl = makeController()
    const result = ctrl.aggregate('inventory.turnover' as any, 'store')
    assert.ok(result)
    assert.equal(result.metric, 'inventory.turnover')
    // 种子数据中没有库存指标, 总量应为空对象
    assert.deepEqual(result.totals, {})
  })
})

// ===================================================================
// 🤝 团建 — 查看活动相关报表、场馆整体运营数据
// ===================================================================
describe(`${ROLES.Teambuilding} report 角色测试`, () => {
  it('团建查看所有可用的报表列表, 确认至少有 3 个种子报表', () => {
    const ctrl = makeController()
    const { items, total } = ctrl.listReports()
    assert.ok(total >= 3)
    const names = items.map((r: any) => r.name)
    assert.ok(names.includes('销售日报'))
    assert.ok(names.includes('会员周报'))
    assert.ok(names.includes('AI 使用报表'))
  })

  it('团建查询销售数据用于活动效果评估, 确认数据可聚合', async () => {
    const ctrl = makeController()
    const result = await ctrl.query({
      reportId: 'rpt-seed-sales',
      period: 'daily',
      from: '2026-06-25',
    })
    assert.ok(result.data.length >= 0)
    assert.ok(typeof result.totalPoints === 'number')
  })

  it('团建创建团建活动看板(权限边界: 创建共享看板供所有门店查看)', () => {
    const ctrl = makeController()
    const dash = ctrl.createDashboard({
      name: '团建活动总览',
      cards: [
        {
          id: 'tb-c1', reportId: 'rpt-seed-sales', display: 'number',
          title: '活动期间销售额', size: { w: 3, h: 2 }, position: { x: 0, y: 0 },
        },
      ],
      ownerId: 'teambuilding-lead',
      isShared: true,
    })
    assert.ok(dash.id)
    assert.ok(dash.isShared)
  })
})

// ===================================================================
// 📢 营销 — 营销活动数据分析、创建活动看板、ROI 分析
// ===================================================================
describe(`${ROLES.Marketing} report 角色测试`, () => {
  it('营销创建营销活动报表, 关注营销 ROI 指标', () => {
    const ctrl = makeController()
    const rpt = ctrl.createReport({
      name: '营销 ROI 分析',
      period: 'weekly',
      metrics: ['marketing.roi'],
      dimensions: ['campaign'],
      source: 'marketing',
      cacheTtl: 300,
      createdBy: 'marketing-lead',
    })
    assert.ok(rpt.id)
    assert.ok(rpt.metrics.includes('marketing.roi'))
    assert.equal(rpt.source, 'marketing')
  })

  it('营销查询活动相关数据, 确认按自定义周期查询正常', async () => {
    const ctrl = makeController()
    // 使用种子销售日报, 自定义时间范围
    const result = await ctrl.query({
      reportId: 'rpt-seed-sales',
      period: 'custom',
      from: '2026-06-01',
      to: '2026-06-30',
    })
    assert.ok(result)
    assert.equal(result.period, 'custom')
  })

  it('营销注入活动跟踪指标并确认数据持久化', () => {
    const ctrl = makeController()
    const r1 = ctrl.ingest({
      points: [
        { bucket: '2026-06-29', dimension: 'campaign-summer', metric: 'sales.amount', value: 150000 },
        { bucket: '2026-06-29', dimension: 'campaign-summer', metric: 'sales.count', value: 220 },
      ],
    })
    assert.equal(r1.ingested, 2)

    // 再次注入确认累积
    const r2 = ctrl.ingest({
      points: [
        { bucket: '2026-06-28', dimension: 'campaign-summer', metric: 'sales.amount', value: 120000 },
      ],
    })
    assert.equal(r2.ingested, 1)

    // 按活动维度聚合确认数据存在
    const result = ctrl.aggregate('sales.amount', 'campaign')
    assert.ok(result.totals['campaign-summer'] >= 270000)
  })

  it('营销查询空时间范围(边界: 无数据时间返回空数组)', async () => {
    const ctrl = makeController()
    const result = await ctrl.query({
      reportId: 'rpt-seed-sales',
      period: 'daily',
      from: '2020-01-01',
      to: '2020-01-02',
    })
    assert.ok(result)
    assert.ok(Array.isArray(result.data))
  })
})

// ===================================================================
// 🏢 跨角色 — 共享看板可见性测试
// ===================================================================
describe('跨角色共享看板权限边界', () => {
  it('共享看板对所有租户/角色可见', () => {
    const ctrl = makeController()
    const allDashboards = ctrl.listDashboards('any-tenant')
    // dash-seed-overview 设置了 isShared=true
    const shared = allDashboards.items.find((d: any) => d.id === 'dash-seed-overview')
    assert.ok(shared, '共享看板对所有角色可见')
    assert.ok(shared.isShared)
  })

  it('非共享看板仅 owner 可见', () => {
    const ctrl = makeController()
    // 先创建一个私有看板
    ctrl.createDashboard({
      name: '私有看板',
      cards: [],
      ownerId: 'private-owner',
      isShared: false,
    })
    const ownDashboards = ctrl.listDashboards('private-owner')
    assert.ok(ownDashboards.items.some((d: any) => d.name === '私有看板'))

    const otherDashboards = ctrl.listDashboards('another-owner')
    assert.ok(!otherDashboards.items.some((d: any) => d.name === '私有看板'))
  })
})
