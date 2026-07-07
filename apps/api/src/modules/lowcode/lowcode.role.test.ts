/**
 * lowcode.role.test.ts · 低代码页面管理 4 角色视角测试
 *
 * 🎯运行专员 · 👔店长 · 📢营销 · 🎮导玩员
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { LowcodePageController } from './lowcode-page.controller'
import { LowCodePageBuilder, AuditAlertService } from './lowcode-audit.service'

// ── 角色定义 ──
const ROLES = {
  Ops: '🎯运行专员',
  TenantAdmin: '👔店长',
  Marketing: '📢营销',
  Guide: '🎮导玩员',
}

// ── 辅助函数 ──
function makeController(): LowcodePageController {
  return new LowcodePageController(new LowCodePageBuilder(), new AuditAlertService())
}

// ──────────────────── 🎯 运行专员 · 页面配置 ────────────────────
describe(`${ROLES.Ops} lowcode 页面配置角色测试`, () => {
  let ctrl: LowcodePageController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('运行专员可以从模板创建低代码页面（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-dashboard', name: '运营监控面板' })
    assert.equal(page.name, '运营监控面板')
    assert.equal(page.status, 'draft')
    assert.ok(page.id)
    assert.ok(Array.isArray(page.components))
    assert.ok(page.components.length > 0)
  })

  it('运行专员可以获取页面详情（正常流程）', () => {
    const created = ctrl.createPage({ templateId: 'tpl-form', name: '数据填报' })
    const page = ctrl.getPage(created.id)
    assert.equal(page.id, created.id)
    assert.equal(page.templateId, 'tpl-form')
  })

  it('运行专员可以更新页面信息（正常流程）', () => {
    const created = ctrl.createPage({ templateId: 'tpl-blank', name: '临时页面' })
    const updated = ctrl.updatePage(created.id, { name: '运营数据看板' })
    assert.equal(updated.name, '运营数据看板')
  })

  it('运行专员可以向页面添加组件（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '运营工具' })
    const comp = ctrl.addComponent(page.id, { type: 'chart', props: { chartType: 'bar', title: '月度营收' } })
    assert.ok(comp.id)
    assert.equal(comp.type, 'chart')
    assert.equal(comp.props.chartType, 'bar')
  })

  it('运行专员可以更新组件属性（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '运营组件测试' })
    const comp = ctrl.addComponent(page.id, { type: 'chart', props: { chartType: 'line' } })
    const updated = ctrl.updateComponent(page.id, comp.id, { props: { chartType: 'bar', title: '更新标题' } })
    assert.equal(updated.type, 'chart')
  })

  it('运行专员可以删除组件（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '组件删除测试' })
    const comp = ctrl.addComponent(page.id, { type: 'text', props: { content: 'test' } })

    // 删除不应抛异常
    ctrl.removeComponent(page.id, comp.id)

    // 删除后页面组件数应减少
    const pageDetail = ctrl.getPage(page.id)
    assert.equal(pageDetail.components.length, 1) // 只有 navbar
  })

  it('运行专员可以发布页面（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-dashboard', name: '上线面板' })
    const published = ctrl.publishPage(page.id)
    assert.equal(published.status, 'published')
  })

  it('运行专员创建页面时使用不存在的模板应报错（边界）', () => {
    assert.throws(
      () => ctrl.createPage({ templateId: 'tpl-nonexistent', name: '失败页面' }),
      /Template not found/,
    )
  })

  it('运行专员获取不存在的页面应报错（边界）', () => {
    assert.throws(
      () => ctrl.getPage('page-nonexistent'),
      /Page not found/,
    )
  })
})

// ──────────────────── 👔 店长 · 门店装修 ────────────────────
describe(`${ROLES.TenantAdmin} lowcode 门店装修角色测试`, () => {
  let ctrl: LowcodePageController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('店长可以从仪表盘模板创建门店首页（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-dashboard', name: '门店首页' })
    assert.equal(page.name, '门店首页')
    assert.equal(page.templateId, 'tpl-dashboard')
  })

  it('店长可以从空白模板自定义门店装修（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '自定义首页' })
    assert.equal(page.status, 'draft')

    // 添加轮播图组件
    ctrl.addComponent(page.id, { type: 'carousel', props: { images: ['banner1.jpg', 'banner2.jpg'], autoPlay: true } })
    // 添加活动公告组件
    ctrl.addComponent(page.id, { type: 'notice-board', props: { title: '本周活动', content: '充值满赠' } })

    const detail = ctrl.getPage(page.id)
    assert.equal(detail.components.length, 3) // navbar + carousel + notice-board
  })

  it('店长可以预览门店装修效果（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-dashboard', name: '门店预览' })
    const rendered = ctrl.renderPage(page.id)
    assert.ok(rendered.html.includes('<title>门店预览</title>'))
    assert.ok(rendered.html.includes('data-component='))
  })

  it('店长可以发布门店页面（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-form', name: '客户登记页' })
    const published = ctrl.publishPage(page.id)
    assert.equal(published.status, 'published')
  })

  it('店长可以查询可用模板', () => {
    const tpl = ctrl.getTemplate('tpl-dashboard')
    assert.ok(tpl)
  })

  it('店长获取不存在的模板应报错（边界）', () => {
    assert.throws(
      () => ctrl.getTemplate('tpl-store-nonexistent'),
      /Template not found/,
    )
  })
})

// ──────────────────── 📢 营销 · 营销页面搭建 ────────────────────
describe(`${ROLES.Marketing} lowcode 营销页面搭建角色测试`, () => {
  let ctrl: LowcodePageController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('营销可以创建营销活动页面（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '618促销活动' })
    assert.equal(page.name, '618促销活动')
    assert.equal(page.status, 'draft')
  })

  it('营销可以添加营销组件（轮播、商品、按钮等）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '春节活动页' })

    // 添加营销组件
    ctrl.addComponent(page.id, { type: 'banner', props: { image: 'spring-festival.jpg', link: '/promo' } })
    ctrl.addComponent(page.id, { type: 'product-grid', props: { productIds: ['p1', 'p2', 'p3'], columns: 3 } })
    ctrl.addComponent(page.id, { type: 'cta-button', props: { text: '立即抢购', color: 'red', action: '/checkout' } })

    const detail = ctrl.getPage(page.id)
    assert.equal(detail.components.length, 4) // navbar + banner + product-grid + cta-button
    const productGrid = detail.components.find((c: any) => c.type === 'product-grid')
    assert.ok(productGrid)
    assert.deepStrictEqual((productGrid.props as any).productIds, ['p1', 'p2', 'p3'])
  })

  it('营销可以更新营销页面组件（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '促销页' })
    const cta = ctrl.addComponent(page.id, { type: 'cta-button', props: { text: '查看详情', color: 'blue' } })
    const updated = ctrl.updateComponent(page.id, cta.id, { props: { text: '立即购买', color: 'red', size: 'large' } })
    assert.equal(updated.type, 'cta-button')
  })

  it('营销可以删除营销页面中的废弃组件（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: 'A/B 测试页' })
    const oldBanner = ctrl.addComponent(page.id, { type: 'banner', props: { image: 'old-banner.jpg' } })
    ctrl.addComponent(page.id, { type: 'banner', props: { image: 'new-banner.jpg' } })

    // 删除旧 banner
    ctrl.removeComponent(page.id, oldBanner.id)

    const detail = ctrl.getPage(page.id)
    // 只剩下 navbar(1) + new-banner(1) = 2
    assert.equal(detail.components.length, 2)
  })

  it('营销可以发布营销活动页面到线上（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-dashboard', name: '国庆活动页' })
    const published = ctrl.publishPage(page.id)
    assert.equal(published.status, 'published')
  })

  it('营销更新页面时可以发布（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '双十一活动' })
    const updated = ctrl.updatePage(page.id, { name: '双十一主会场', status: 'published' })
    assert.equal(updated.name, '双十一主会场')
    assert.equal(updated.status, 'published')
  })
})

// ──────────────────── 🎮 导玩员 · 活动页面配置 ────────────────────
describe(`${ROLES.Guide} lowcode 活动页面配置角色测试`, () => {
  let ctrl: LowcodePageController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('导玩员可以创建活动积分排行页面（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-dashboard', name: '游戏排行榜' })
    assert.equal(page.name, '游戏排行榜')
    assert.ok(page.id)
  })

  it('导玩员可以添加游戏相关的组件（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '街机活动页' })
    const comp = ctrl.addComponent(page.id, { type: 'game-card', props: { gameId: 'g001', title: '抓娃娃挑战赛', difficulty: 'easy' } })
    assert.equal(comp.type, 'game-card')
    assert.equal(comp.props.gameId, 'g001')
  })

  it('导玩员可以渲染页面查看效果（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-form', name: '游戏报名表' })
    ctrl.addComponent(page.id, { type: 'game-card', props: { gameId: 'g002', title: '投篮大赛' } })

    const rendered = ctrl.renderPage(page.id)
    assert.ok(rendered.html.includes('game-card'))
  })

  it('导玩员可以删除不再需要的活动组件（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '活动页' })
    const comp = ctrl.addComponent(page.id, { type: 'game-card', props: { gameId: 'g003', title: '旧活动' } })
    ctrl.removeComponent(page.id, comp.id)

    const detail = ctrl.getPage(page.id)
    assert.equal(detail.components.length, 1) // 只有 navbar
  })

  it('导玩员给不存在的页面添加组件应报错（边界）', () => {
    assert.throws(
      () => ctrl.addComponent('page-nonexistent', { type: 'button', props: { text: '测试' } }),
      /Page not found/,
    )
  })

  it('导玩员给不存在的页面更新组件应报错（边界）', () => {
    assert.throws(
      () => ctrl.updateComponent('page-nonexistent', 'comp-nonexistent', { props: { text: 'test' } }),
      /Page not found/,
    )
  })

  it('导玩员更新不存在的组件应报错（边界）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '组件测试' })
    assert.throws(
      () => ctrl.updateComponent(page.id, 'comp-nonexistent', { props: { text: 'test' } }),
      /Component not found/,
    )
  })
})
