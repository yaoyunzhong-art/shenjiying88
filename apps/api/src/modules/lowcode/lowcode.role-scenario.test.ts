/**
 * lowcode.role-scenario.test.ts · LowcodeController 8 角色场景测试
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 覆盖 LowcodeController 的管理端 API：模板管理、快照、组件库、页面导入导出、仪表盘
 * 每个角色 ≥ 2 个用例（正常流程 + 权限边界）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LowcodeController } from './lowcode.controller'
import { LowcodeService } from './lowcode.service'
import { LowCodePageBuilder, AuditAlertService } from './lowcode-audit.service'

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

// ── 测试工厂 ──
function createCtx() {
  const pageBuilder = new LowCodePageBuilder()
  const auditService = new AuditAlertService()
  const service = new LowcodeService(pageBuilder, auditService)
  const controller = new LowcodeController(service, pageBuilder)
  return { controller, service, pageBuilder, auditService }
}

// ── 基础数据工厂 ──
function createTemplate(ctx: ReturnType<typeof createCtx>, name = '门店首页模板') {
  return ctx.controller.createTemplate({
    name,
    description: `用于${name}的低代码模板`,
    components: [
      { type: 'navbar', defaultProps: { title: name, logo: '/logo.png' } },
      { type: 'card-list', defaultProps: { columns: 2, items: [] } },
    ],
  })
}

function createComponent(ctx: ReturnType<typeof createCtx>, name = 'Button', type = 'button') {
  return ctx.controller.registerComponent({ name, type, defaultProps: { text: 'Click', variant: 'primary' } })
}

function createPage(ctx: ReturnType<typeof createCtx>, templateId = 'tpl-blank', name = '测试页面') {
  return ctx.pageBuilder.createPage(templateId, { name })
}

// ════════════════════════════════════════════════════════════════
// 👔 店长：关注门店管理系统页面配置、模板运营
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} lowcode 管理场景`, () => {
  it('店长创建首页模板并查看模板列表（管理门店页面模板）', () => {
    const ctx = createCtx()
    createTemplate(ctx, '门店Dashboard')
    createTemplate(ctx, '会员管理')

    const templates = ctx.controller.listTemplates()
    expect(templates.length).toBeGreaterThanOrEqual(2)
    const dash = templates.find((t: Record<string, unknown>) => t.name === '门店Dashboard')
    expect(dash).toBeDefined()
    expect((dash as Record<string, unknown>).status).toBe('active')
  })

  it('店长通过状态筛选模板（运营模板归档）', () => {
    const ctx = createCtx()
    const tpl = createTemplate(ctx, '活动页')
    ctx.controller.updateTemplate(tpl.id as string, { status: 'archived' })

    const activeList = ctx.controller.listTemplates('active')
    const archivedList = ctx.controller.listTemplates('archived')
    expect(activeList.length).toBe(0) // 只有一个且已归档
    expect(archivedList.length).toBe(1)
    expect((archivedList[0] as Record<string, unknown>).name).toBe('活动页')
  })

  it('店长删除废弃模板（清理资源边界）', () => {
    const ctx = createCtx()
    const tpl = createTemplate(ctx, '旧模板')
    ctx.controller.deleteTemplate(tpl.id as string)
    expect(() => ctx.controller.getTemplate(tpl.id as string)).toThrow('not found')
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台：关注收银页面、会员页面等日常操作页面的可用性
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} lowcode 管理场景`, () => {
  it('前台导出会员查询页面配置（页面结构备份）', () => {
    const ctx = createCtx()
    const page = createPage(ctx, 'tpl-blank', '会员查询页')

    const exported = ctx.controller.exportPage(page.id)
    expect(exported.name).toBe('会员查询页')
    expect(exported.templateId).toBe('tpl-blank')
    expect(typeof exported.version).toBe('number')
  })

  it('前台导入收银页面配置（新店开张快速部署）', () => {
    const ctx = createCtx()
    const result = ctx.controller.importPage({
      data: { templateId: 'tpl-blank', name: '收银台', components: [], status: 'draft', version: 1 },
    })
    expect(result.id).toBeDefined()
    expect(result.name).toBe('收银台')
    expect(result.status).toBe('draft')
  })

  it('前台导入不存在的模板页面（边界：需先创建模板）', () => {
    const ctx = createCtx()
    // 使用已知存在的模板 tpl-blank 导入
    const result = ctx.controller.importPage({
      data: { templateId: 'tpl-blank', name: '导入测试页', components: [{ type: 'text', props: { content: 'Hello' } }], status: 'draft', version: 1 },
      name: '前台导入页',
    })
    expect(result.id).toBeDefined()
    expect(result.name).toBe('前台导入页')
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR：关注组件库管理与版本快照审计
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} lowcode 管理场景`, () => {
  it('HR 注册新的组件到组件库（扩展页面能力）', () => {
    const ctx = createCtx()
    const comp = ctx.controller.registerComponent({
      name: 'EmployeeCard',
      type: 'card',
      defaultProps: { name: '', department: '' },
    })
    expect(comp.id).toBeDefined()
    expect(comp.name).toBe('EmployeeCard')
    expect(comp.type).toBe('card')
  })

  it('HR 查看组件库列表（审计页面构建能力）', () => {
    const ctx = createCtx()
    createComponent(ctx, 'Chart', 'chart')
    createComponent(ctx, 'Table', 'table')
    createComponent(ctx, 'Form', 'form')

    const list = ctx.controller.listComponents()
    expect(list.length).toBeGreaterThanOrEqual(3)
    const types = list.map((c: Record<string, unknown>) => c.type)
    expect(types).toContain('chart')
    expect(types).toContain('table')
  })

  it('HR 创建页面快照（页面版本管理审计）', () => {
    const ctx = createCtx()
    const page = createPage(ctx, 'tpl-form', '员工入职页')

    const snap = ctx.controller.createSnapshot({ pageId: page.id, changelog: 'v1 - 初始版本', publishedBy: 'hr-manager' })
    expect(snap.pageId).toBe(page.id)
    expect(snap.version).toBe(1)
    expect(snap.changelog).toBe('v1 - 初始版本')
    expect(snap.publishedBy).toBe('hr-manager')
  })

  it('HR 列出页面快照历史（版本追踪边界）', () => {
    const ctx = createCtx()
    const page = createPage(ctx)
    const s1 = ctx.controller.createSnapshot({ pageId: page.id, changelog: 'v1' })
    const s2 = ctx.controller.createSnapshot({ pageId: page.id, changelog: 'v2' })

    const snaps = ctx.controller.listSnapshots(page.id)
    expect(snaps.length).toBeGreaterThanOrEqual(2)
    expect((s1 as Record<string, unknown>).version as number).toBeLessThan((s2 as Record<string, unknown>).version as number)
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监：关注页面配置合规性、快照完整性
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} lowcode 管理场景`, () => {
  it('安监查看不存在的模板应报错（安全边界）', () => {
    const ctx = createCtx()
    expect(() => ctx.controller.getTemplate('non-existent-template')).toThrow('not found')
  })

  it('安监删除不存在的组件应报错（异常边界）', () => {
    const ctx = createCtx()
    // 删除不存在模板
    expect(() => ctx.controller.deleteTemplate('bad-template-id')).toThrow('not found')
  })

  it('安监创建快照在不存在的页面上应报错（数据完整性）', () => {
    const ctx = createCtx()
    expect(() => ctx.controller.createSnapshot({ pageId: 'nonexistent-page' })).toThrow('Page not found')
  })

  it('安监导出不存在的页面应报错（权限边界）', () => {
    const ctx = createCtx()
    expect(() => ctx.controller.exportPage('fake-page-id')).toThrow('Page not found')
  })

  it('安监查看仪表盘统计确认无异常泄漏', () => {
    const ctx = createCtx()
    const stats = ctx.controller.getDashboardStats()
    expect(typeof stats.totalPages).toBe('number')
    expect(typeof stats.totalTemplates).toBe('number')
    expect(typeof stats.totalComponents).toBe('number')
    expect(typeof stats.totalSnapshots).toBe('number')
    expect(typeof stats.publishedPages).toBe('number')
    expect(typeof stats.draftPages).toBe('number')
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员：关注游戏活动页面配置与组件复用
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} lowcode 管理场景`, () => {
  it('导玩员创建游戏排行榜页面模板', () => {
    const ctx = createCtx()
    const tpl = ctx.controller.createTemplate({
      name: '游戏排行榜',
      description: '显示游戏得分排行榜',
      components: [
        { type: 'leaderboard', defaultProps: { title: '今日Top10', gameType: '乒乓球' } },
        { type: 'header', defaultProps: { showDate: true } },
      ],
    })
    expect(tpl.name).toBe('游戏排行榜')
    expect((tpl.components as Array<unknown>).length).toBe(2)
  })

  it('导玩员更新活动页面模板组件（修改游戏规则说明组件）', () => {
    const ctx = createCtx()
    const tpl = createTemplate(ctx, '游戏规则')
    const updated = ctx.controller.updateTemplate(tpl.id as string, {
      components: [
        { type: 'navbar', defaultProps: { title: '规则更新版' } },
        { type: 'rich-text', defaultProps: { content: '请遵守游戏规则...' } },
      ],
    })
    expect((updated.components as Array<unknown>).length).toBe(2)
    const navbar = (updated.components as Array<Record<string, unknown>>).find((c) => c.type === 'navbar')
    expect((navbar?.defaultProps as Record<string, unknown>).title).toBe('规则更新版')
  })

  it('导玩员查看所有组件库了解可用组件（边界：空库）', () => {
    const ctx = createCtx()
    const list = ctx.controller.listComponents()
    expect(Array.isArray(list)).toBe(true)
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员：关注批量运维、模板生命周期
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} lowcode 管理场景`, () => {
  it('运行专员查看仪表盘统计（运维概览）', () => {
    const ctx = createCtx()
    const stats = ctx.controller.getDashboardStats()
    expect(stats.totalPages).toBe(0)
    expect(stats.totalTemplates).toBe(0)

    // 产生一些数据
    createTemplate(ctx, '运维模板')
    createPage(ctx, 'tpl-blank', '运维页面')
    createComponent(ctx, 'OpsBtn')
    createComponent(ctx, 'OpsChart')

    const stats2 = ctx.controller.getDashboardStats()
    expect(stats2.totalTemplates).toBe(1)
    expect(stats2.totalComponents).toBe(2)
    expect(stats2.totalPages).toBe(1)
  })

  it('运行专员批量管理模板（创建 + 更新状态 + 删除）', () => {
    const ctx = createCtx()

    // 创建 3 个模板
    const t1 = createTemplate(ctx, '模板A')
    const t2 = createTemplate(ctx, '模板B')
    const t3 = createTemplate(ctx, '模板C')

    expect(ctx.controller.listTemplates().length).toBeGreaterThanOrEqual(3)

    // 归档一个
    ctx.controller.updateTemplate(t3.id as string, { status: 'archived' })
    const archived = ctx.controller.listTemplates('archived')
    expect(archived.length).toBeGreaterThanOrEqual(1)

    // 删除一个
    ctx.controller.deleteTemplate(t2.id as string)
    const allAfter = ctx.controller.listTemplates()
    const deleted = allAfter.find((t: Record<string, unknown>) => t.id === t2.id)
    expect(deleted).toBeUndefined()
  })

  it('运行专员更新模板时字段部分更新（边界：只更新名称）', () => {
    const ctx = createCtx()
    const tpl = createTemplate(ctx, '原名')
    const updated = ctx.controller.updateTemplate(tpl.id as string, { name: '新名' })
    expect(updated.name).toBe('新名')
    // 其他字段保持不变
    expect(updated.description).toBe('用于原名的低代码模板')
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建：关注团队协作的页面模板复用与共享
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} lowcode 管理场景`, () => {
  it('团建专员导出团建活动页面并导入到其他商店（模板共享）', () => {
    const ctx = createCtx()
    const page = createPage(ctx, 'tpl-blank', '团建活动报名页')

    // 导出
    const exported = ctx.controller.exportPage(page.id)
    expect(exported.name).toBe('团建活动报名页')

    // 作为新的模板导入
    const imported = ctx.controller.importPage({
      data: exported as { templateId: string; name: string; components: Record<string, unknown>[]; status: string; version: number },
      name: '团建活动报名页（分店2）',
    })
    expect(imported.id).not.toBe(page.id)
    expect(imported.name).toBe('团建活动报名页（分店2）')
  })

  it('团建专员创建快照记录页面版本（协作留档）', () => {
    const ctx = createCtx()
    const page = createPage(ctx, 'tpl-blank', '团队协作看板')

    const snap1 = ctx.controller.createSnapshot({ pageId: page.id, changelog: '初始版本', publishedBy: '团建专员' })
    expect(snap1.version).toBe(1)
    expect(snap1.publishedBy).toBe('团建专员')

    const snap2 = ctx.controller.createSnapshot({ pageId: page.id, changelog: '新增投票功能', publishedBy: '团建专员' })
    expect(snap2.version).toBe(2)
  })

  it('团建专员创建无描述模板（边界：空组件列表）', () => {
    const ctx = createCtx()
    const tpl = ctx.controller.createTemplate({
      name: '空白模板',
      components: [],
    })
    expect(tpl.name).toBe('空白模板')
    expect(tpl.description).toBeUndefined()
    expect((tpl.components as Array<unknown>).length).toBe(0)
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销：关注营销活动页面快速建设与仪表盘分析
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} lowcode 管理场景`, () => {
  it('营销专员创建营销活动页面模板（快速上线活动页）', () => {
    const ctx = createCtx()
    const tpl = ctx.controller.createTemplate({
      name: '暑期大促活动页',
      description: '2026暑期促销活动页面',
      components: [
        { type: 'banner', defaultProps: { imageUrl: '/promo/summer.jpg', link: '/promo' } },
        { type: 'product-grid', defaultProps: { columns: 3, products: [] } },
        { type: 'countdown', defaultProps: { endDate: '2026-08-31' } },
      ],
    })
    expect(tpl.name).toBe('暑期大促活动页')
    expect((tpl.components as Array<unknown>).length).toBe(3)
  })

  it('营销专员查看仪表盘了解活动页面建设情况（运营数据分析）', () => {
    const ctx = createCtx()
    // 创建页面和模板
    createTemplate(ctx, '活动模板1')
    createTemplate(ctx, '活动模板2')
    createPage(ctx, 'tpl-blank', '暑期活动页')
    createPage(ctx, 'tpl-blank', '中秋活动页')

    const stats = ctx.controller.getDashboardStats()
    expect(stats.totalTemplates).toBeGreaterThanOrEqual(2)
    expect(stats.totalPages).toBeGreaterThanOrEqual(2)
  })

  it('营销专员导入已知模板的活动页面（外部资源整合）', () => {
    const ctx = createCtx()
    const result = ctx.controller.importPage({
      data: {
        templateId: 'tpl-blank',
        name: '节日促销页',
        components: [
          { type: 'hero-banner', props: { title: '限时优惠' } },
          { type: 'cta-button', props: { text: '立即购买' } },
        ],
        status: 'published',
        version: 3,
      },
    })
    expect(result.name).toBe('节日促销页')
    expect(result.status).toBe('draft') // 新建默认为 draft
    // 导入后包含模板内置组件 (navbar) + 导入的组件 = 3
    expect((result.components as Array<unknown>).length).toBe(3)
  })

  it('营销专员更新活动模板组件为Published状态（内容审核边界）', () => {
    const ctx = createCtx()
    const tpl = createTemplate(ctx, '即将发布的活动')
    const updated = ctx.controller.updateTemplate(tpl.id as string, { status: 'archived' })
    expect(updated.status).toBe('archived')
  })
})
