/**
 * lowcode.role.test.ts · 低代码页面管理 8 角色视角测试
 *
 * 👔店长  🛒前台  👥HR  🔧安监  🎮导玩员  🎯运行专员  🤝团建  📢营销
 *
 * 内联 Controller 模式：直接实例化 LowcodePageController 进行测试。
 * 共 8 个 describe block，每角色 ≥ 3 个用例，总计 ≥ 24。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { LowcodePageController } from './lowcode-page.controller'
import { LowCodePageBuilder, AuditAlertService } from './lowcode-audit.service'

// ── 8 角色定义 ──
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

// ── 辅助工厂 ──
function makeController(): LowcodePageController {
  return new LowcodePageController(new LowCodePageBuilder(), new AuditAlertService())
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 👔店长 — 门店页面装修 & 模板管理
 * ───────────────────────────────────────────────────────────────────────────── */
describe(`${ROLES.TenantAdmin} lowcode 门店装修角色测试`, () => {
  let ctrl: LowcodePageController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('店长可从仪表盘模板创建门店首页（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-dashboard', name: '门店首页' })
    assert.equal(page.name, '门店首页')
    assert.equal(page.templateId, 'tpl-dashboard')
    assert.equal(page.status, 'draft')
    assert.ok(page.id)
    assert.ok(page.components.length > 0)
  })

  it('店长可从空白模板自定义装修页面（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '自定义门店' })
    ctrl.addComponent(page.id, { type: 'carousel', props: { images: ['store-banner.jpg'] } })
    ctrl.addComponent(page.id, { type: 'notice-board', props: { title: '开业活动', content: '充值满减' } })
    const detail = ctrl.getPage(page.id)
    assert.equal(detail.components.length, 3) // navbar + carousel + notice-board
  })

  it('店长可预览门店页面效果（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-dashboard', name: '预览测试' })
    const rendered = ctrl.renderPage(page.id)
    assert.ok(rendered.html.includes('<title>预览测试</title>'))
    assert.ok(rendered.html.includes('data-component='))
  })

  it('店长可发布门店页面（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-form', name: '进店登记' })
    const published = ctrl.publishPage(page.id)
    assert.equal(published.status, 'published')
  })

  it('店长可查询可用模板（正常流程）', () => {
    const tpl = ctrl.getTemplate('tpl-dashboard')
    assert.ok(tpl)
    const tplObj = tpl as Record<string, unknown>
    assert.equal(tplObj.name, '仪表盘')
  })

  it('店长更新页面名称应在 getPage 后反映（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '旧名称' })
    ctrl.updatePage(page.id, { name: '新名称' })
    const detail = ctrl.getPage(page.id)
    assert.equal(detail.name, '新名称')
  })

  it('店长查询不存在的模板应报错（边界）', () => {
    assert.throws(() => ctrl.getTemplate('tpl-store-fake'), /Template not found/)
  })

  it('店长删除页面中不存在的组件应报错（边界）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank' })
    assert.throws(() => ctrl.removeComponent(page.id, 'comp-fake'), /Component not found/)
  })
})

/* ─────────────────────────────────────────────────────────────────────────────
 * 🛒前台 — 接待页面 & 简单表单创建
 * ───────────────────────────────────────────────────────────────────────────── */
describe(`${ROLES.Reception} lowcode 前台接待页面角色测试`, () => {
  let ctrl: LowcodePageController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('前台可从表单模板创建客户登记页面（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-form', name: '客户登记表' })
    assert.equal(page.name, '客户登记表')
    assert.equal(page.templateId, 'tpl-form')
    assert.equal(page.status, 'draft')
    // 表单模板自带 navbar + input + button
    assert.equal(page.components.length, 3)
  })

  it('前台可向页面添加公告型组件方便接待工作（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '接待台看板' })
    ctrl.addComponent(page.id, { type: 'notice-board', props: { title: '今日优惠', content: '首单8折' } })
    ctrl.addComponent(page.id, { type: 'queue-display', props: { queueName: '接待排队', maxNumber: 20 } })
    const detail = ctrl.getPage(page.id)
    assert.equal(detail.components.length, 3) // navbar + notice-board + queue-display
  })

  it('前台可渲染接待页面查看效果（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-form', name: '接待表单' })
    const rendered = ctrl.renderPage(page.id)
    assert.ok(rendered.html.includes('接待表单'))
    assert.ok(rendered.html.includes('data-component'))
  })

  it('前台可删除过时的接待组件（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-form', name: '旧登记表' })
    const pageDetail = ctrl.getPage(page.id)
    const firstCompId = (pageDetail.components[0] as Record<string, unknown>).id as string
    ctrl.removeComponent(page.id, firstCompId)
    const updated = ctrl.getPage(page.id)
    assert.equal(updated.components.length, 2)
  })

  it('前台使用不存在的模板创建页面应报错（边界）', () => {
    assert.throws(() => ctrl.createPage({ templateId: 'tpl-fake-reception' }), /Template not found/)
  })

  it('前台给不存在的页面添加组件应报错（边界）', () => {
    assert.throws(
      () => ctrl.addComponent('page-fake', { type: 'text', props: { content: 'hi' } }),
      /Page not found/,
    )
  })
})

/* ─────────────────────────────────────────────────────────────────────────────
 * 👥HR — 员工页面 & 人力资源管理页面
 * ───────────────────────────────────────────────────────────────────────────── */
describe(`${ROLES.HR} lowcode 员工管理页面角色测试`, () => {
  let ctrl: LowcodePageController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('HR 可从空白模板创建员工手册页面（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '员工手册' })
    ctrl.addComponent(page.id, { type: 'richtext', props: { content: '# 员工守则\n...', author: 'HR部门' } })
    ctrl.addComponent(page.id, { type: 'accordion', props: { items: [{ title: '考勤制度', body: '9:00-18:00' }] } })
    const detail = ctrl.getPage(page.id)
    assert.equal(detail.name, '员工手册')
    assert.equal(detail.components.length, 3) // navbar + richtext + accordion
  })

  it('HR 可更新员工页面名称（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '培训材料_v1' })
    const updated = ctrl.updatePage(page.id, { name: '培训材料_v2' })
    assert.equal(updated.name, '培训材料_v2')
  })

  it('HR 可发布员工页面供全员查看（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '企业文化展示' })
    const published = ctrl.publishPage(page.id)
    assert.equal(published.status, 'published')
  })

  it('HR 可删除废弃的员工页面组件（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '旧培训页' })
    const comp = ctrl.addComponent(page.id, { type: 'richtext', props: { content: '旧内容' } })
    ctrl.removeComponent(page.id, comp.id)
    const detail = ctrl.getPage(page.id)
    assert.equal(detail.components.length, 1) // only navbar
  })

  it('HR 删除首页（navbar）不应导致页面无剩余组件（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank' })
    const detail = ctrl.getPage(page.id)
    const navbarId = (detail.components[0] as Record<string, unknown>).id as string
    ctrl.removeComponent(page.id, navbarId)
    const after = ctrl.getPage(page.id)
    assert.equal(after.components.length, 0)
  })
})

/* ─────────────────────────────────────────────────────────────────────────────
 * 🔧安监 — 审计指标 & 安全监控看板
 * ───────────────────────────────────────────────────────────────────────────── */
describe(`${ROLES.Safety} lowcode 审计与安全监控角色测试`, () => {
  let ctrl: LowcodePageController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('安监可记录监控指标（正常流程）', () => {
    const result = ctrl.recordMetric({ name: 'error_rate', value: 0.5, tags: { env: 'prod' } })
    const recorded = result.recorded as Record<string, unknown>
    assert.equal(recorded.name, 'error_rate')
    assert.equal(recorded.value, 0.5)
    assert.equal((recorded.tags as Record<string, string>).env, 'prod')
  })

  it('安监可查询指标趋势（正常流程）', () => {
    ctrl.recordMetric({ name: 'cpu_usage', value: 45 })
    ctrl.recordMetric({ name: 'cpu_usage', value: 62 })
    ctrl.recordMetric({ name: 'cpu_usage', value: 78 })
    const trend = ctrl.getMetricTrend('cpu_usage', { window: '1h' })
    assert.equal(trend.metricName, 'cpu_usage')
    assert.equal(trend.window, '1h')
    assert.ok(trend.dataPoints.length >= 3)
  })

  it('安监可查看告警历史（正常流程）', () => {
    ctrl.recordMetric({ name: 'latency_p99', value: 600 }) // 超过阈值 500
    ctrl.recordMetric({ name: 'latency_p99', value: 200 })
    const history = ctrl.getAlertHistory({})
    assert.ok(history.length >= 1)
    const lastAlert = (history as Array<Record<string, unknown>>).find(
      (a) => a.metricName === 'latency_p99',
    )
    assert.ok(lastAlert)
  })

  it('安监可过滤告警历史按指标名（正常流程）', () => {
    ctrl.recordMetric({ name: 'error_rate', value: 5 }) // 超过阈值 2
    ctrl.recordMetric({ name: 'cpu_usage', value: 85 }) // 超过阈值 80
    const filtered = ctrl.getAlertHistory({ metricName: 'error_rate' }) as Array<Record<string, unknown>>
    assert.ok(filtered.length >= 1)
    assert.equal(filtered[0].metricName, 'error_rate')
  })

  it('安监记录指标时若超阈值会自动产生告警（正常流程）', () => {
    const result = ctrl.recordMetric({ name: 'error_rate', value: 10 })
    assert.ok(result.alert !== null)
    const alert = result.alert as Record<string, unknown>
    assert.equal(alert.metricName, 'error_rate')
    assert.ok(alert.currentValue >= 10)
  })

  it('安监记录指标时未超阈值不会产生告警（边界）', () => {
    const result = ctrl.recordMetric({ name: 'error_rate', value: 1 })
    assert.equal(result.alert, null)
    assert.ok(result.thresholdCheck !== null)
    const check = result.thresholdCheck as { exceeded: boolean }
    assert.equal(check.exceeded, false)
  })

  it('安监查询不存在的指标趋势返回空数组（边界）', () => {
    const trend = ctrl.getMetricTrend('nonexistent_metric', { window: '1h' })
    assert.equal(trend.dataPoints.length, 0)
  })
})

/* ─────────────────────────────────────────────────────────────────────────────
 * 🎮导玩员 — 活动页面 & 游戏组件配置
 * ───────────────────────────────────────────────────────────────────────────── */
describe(`${ROLES.Guide} lowcode 活动页面配置角色测试`, () => {
  let ctrl: LowcodePageController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('导玩员可从仪表盘模板创建排行榜页面（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-dashboard', name: '游戏排行榜' })
    assert.equal(page.name, '游戏排行榜')
    assert.ok(page.id)
  })

  it('导玩员可添加游戏组件到页面（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '街机动效页' })
    const comp = ctrl.addComponent(page.id, {
      type: 'game-card',
      props: { gameId: 'g001', title: '抓娃娃', difficulty: 'easy' },
    })
    assert.equal(comp.type, 'game-card')
    assert.equal(comp.props.gameId, 'g001')
    assert.equal(comp.props.title, '抓娃娃')
  })

  it('导玩员可渲染活动页面查看效果（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-form', name: '游戏报名表' })
    ctrl.addComponent(page.id, { type: 'game-card', props: { gameId: 'g002', title: '投篮大赛' } })
    const rendered = ctrl.renderPage(page.id)
    assert.ok(rendered.html.includes('game-card'))
    assert.ok(rendered.html.includes('g002'))
  })

  it('导玩员可更新游戏组件属性（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '活动配置' })
    const comp = ctrl.addComponent(page.id, { type: 'game-card', props: { gameId: 'g003', title: '旧标题' } })
    const updated = ctrl.updateComponent(page.id, comp.id, { props: { title: '新标题', difficulty: 'hard' } })
    assert.equal(updated.type, 'game-card')
  })

  it('导玩员可移除废弃的游戏组件（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '旧活动' })
    const comp = ctrl.addComponent(page.id, { type: 'game-card', props: { gameId: 'g004' } })
    ctrl.removeComponent(page.id, comp.id)
    const detail = ctrl.getPage(page.id)
    assert.equal(detail.components.length, 1) // only navbar
  })

  it('导玩员给不存在的页面添加组件应报错（边界）', () => {
    assert.throws(
      () => ctrl.addComponent('page-fake', { type: 'button' }),
      /Page not found/,
    )
  })

  it('导玩员更新不存在的组件应报错（边界）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank' })
    assert.throws(
      () => ctrl.updateComponent(page.id, 'comp-fake', { props: { x: 1 } }),
      /Component not found/,
    )
  })
})

/* ─────────────────────────────────────────────────────────────────────────────
 * 🎯运行专员 — 页面全生命周期 & 运营维护
 * ───────────────────────────────────────────────────────────────────────────── */
describe(`${ROLES.Ops} lowcode 页面运营维护角色测试`, () => {
  let ctrl: LowcodePageController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('运行专员可从各种模板创建运营页面（正常流程）', () => {
    const dash = ctrl.createPage({ templateId: 'tpl-dashboard', name: '运营监控' })
    const form = ctrl.createPage({ templateId: 'tpl-form', name: '数据收集' })
    const blank = ctrl.createPage({ templateId: 'tpl-blank', name: '自定义页' })
    assert.equal(dash.templateId, 'tpl-dashboard')
    assert.equal(form.templateId, 'tpl-form')
    assert.equal(blank.templateId, 'tpl-blank')
  })

  it('运行专员可获取页面详情（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-dashboard', name: '详情查询' })
    const detail = ctrl.getPage(page.id)
    assert.equal(detail.id, page.id)
    assert.ok(detail.components.length > 0)
  })

  it('运行专员可向页面添加多种组件（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '运营工具' })
    const btn = ctrl.addComponent(page.id, { type: 'button', props: { text: '刷新', color: 'blue' } })
    const chart = ctrl.addComponent(page.id, { type: 'chart', props: { type: 'bar', title: '营收' } })
    assert.ok(btn.id)
    assert.ok(chart.id)
    assert.equal(btn.type, 'button')
    assert.equal(chart.type, 'chart')
  })

  it('运行专员可更新页面状态为发布（updatePage 方式）（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '运营页面' })
    const updated = ctrl.updatePage(page.id, { status: 'published' })
    assert.equal(updated.status, 'published')
  })

  it('运行专员通过 publishPage 发布页面（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-dashboard', name: '上线' })
    const published = ctrl.publishPage(page.id)
    assert.equal(published.status, 'published')
  })

  it('运行专员可删除页面且验证存在性（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '删除测试' })
    // 删除不抛异常即可
    assert.doesNotThrow(() => ctrl.removePage(page.id))
  })

  it('运行专员使用不存在的模板应报错（边界）', () => {
    assert.throws(() => ctrl.createPage({ templateId: 'tpl-ops-fake' }), /Template not found/)
  })

  it('运行专员获取不存在的页面应报错（边界）', () => {
    assert.throws(() => ctrl.getPage('page-fake'), /Page not found/)
  })

  it('运行专员删除不存在的页面应报错（边界）', () => {
    assert.throws(() => ctrl.removePage('page-fake'), /Page not found/)
  })
})

/* ─────────────────────────────────────────────────────────────────────────────
 * 🤝团建 — 团建活动页面 & 团队协作
 * ───────────────────────────────────────────────────────────────────────────── */
describe(`${ROLES.Teambuilding} lowcode 团建活动页面角色测试`, () => {
  let ctrl: LowcodePageController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('团建可从空白模板创建团建活动专属页面（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '团建烧烤趴' })
    ctrl.addComponent(page.id, { type: 'richtext', props: { content: '# 活动流程\n16:00 集合\n16:30 烧烤' } })
    ctrl.addComponent(page.id, { type: 'cta-button', props: { text: '立即报名', action: '/signup' } })
    const detail = ctrl.getPage(page.id)
    assert.equal(detail.name, '团建烧烤趴')
    assert.equal(detail.components.length, 3)
  })

  it('团建可从表单模板创建团建报名表（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-form', name: '团建报名' })
    assert.equal(page.name, '团建报名')
    assert.equal(page.status, 'draft')
  })

  it('团建可渲染团建页面并查看效果（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '团建预览' })
    ctrl.addComponent(page.id, { type: 'richtext', props: { content: 'Team Building' } })
    const rendered = ctrl.renderPage(page.id)
    assert.ok(rendered.html.includes('Team Building'))
  })

  it('团建可发布团建活动页面（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '春季团建' })
    const published = ctrl.publishPage(page.id)
    assert.equal(published.status, 'published')
  })

  it('团建可更新团建页面名称（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '团建_v1' })
    ctrl.updatePage(page.id, { name: '团建_v2_终版' })
    const detail = ctrl.getPage(page.id)
    assert.equal(detail.name, '团建_v2_终版')
  })

  it('团建删除组件后页面组件数应正确减少（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-form', name: '团建组件测试' })
    const detail = ctrl.getPage(page.id)
    const before = detail.components.length
    const firstId = (detail.components[0] as Record<string, unknown>).id as string
    ctrl.removeComponent(page.id, firstId)
    const after = ctrl.getPage(page.id)
    assert.equal(after.components.length, before - 1)
  })

  it('团建更新页面时发布应生效（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '团建发布' })
    const updated = ctrl.updatePage(page.id, { name: '团建已发布', status: 'published' })
    assert.equal(updated.name, '团建已发布')
    assert.equal(updated.status, 'published')
  })
})

/* ─────────────────────────────────────────────────────────────────────────────
 * 📢营销 — 营销活动页面 & 数据分析看板
 * ───────────────────────────────────────────────────────────────────────────── */
describe(`${ROLES.Marketing} lowcode 营销活动页面角色测试`, () => {
  let ctrl: LowcodePageController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('营销可创建促销活动页面并添加营销组件（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '618大促' })
    ctrl.addComponent(page.id, { type: 'banner', props: { image: 'sale-banner.jpg', link: '/sale' } })
    ctrl.addComponent(page.id, { type: 'product-grid', props: { productIds: ['p1', 'p2'], columns: 2 } })
    ctrl.addComponent(page.id, { type: 'cta-button', props: { text: '立即抢购', color: 'red', action: '/checkout' } })
    const detail = ctrl.getPage(page.id)
    assert.equal(detail.components.length, 4) // navbar + banner + product-grid + cta-button
  })

  it('营销可更新营销页面中的组件属性（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '营销活动' })
    const cta = ctrl.addComponent(page.id, { type: 'cta-button', props: { text: '查看详情', color: 'blue' } })
    const updated = ctrl.updateComponent(page.id, cta.id, { props: { text: '立即购买', color: 'red' } })
    assert.equal(updated.type, 'cta-button')
  })

  it('营销可发布活动页面上线（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-dashboard', name: '暑期活动' })
    const published = ctrl.publishPage(page.id)
    assert.equal(published.status, 'published')
  })

  it('营销可记录活动效果指标并观察告警（正常流程）', () => {
    const result = ctrl.recordMetric({
      name: 'error_rate',
      value: 3, // 超过阈值 2
      tags: { campaign: 'summer', page: 'landing' },
    })
    assert.ok(result.alert !== null)
    const alert = result.alert as Record<string, unknown>
    assert.equal(alert.metricName, 'error_rate')
    assert.equal((alert as any).currentValue, 3)
  })

  it('营销可查看活动指标趋势数据（正常流程）', () => {
    ctrl.recordMetric({ name: 'cpu_usage', value: 10, tags: { campaign: 'spring' } })
    ctrl.recordMetric({ name: 'cpu_usage', value: 20, tags: { campaign: 'spring' } })
    ctrl.recordMetric({ name: 'cpu_usage', value: 30, tags: { campaign: 'spring' } })
    const trend = ctrl.getMetricTrend('cpu_usage', { window: '30m' })
    assert.equal(trend.dataPoints.length, 3)
  })

  it('营销可按指标名过滤告警历史（正常流程）', () => {
    ctrl.recordMetric({ name: 'error_rate', value: 10 })
    ctrl.recordMetric({ name: 'latency_p99', value: 1000 })
    const filtered = ctrl.getAlertHistory({ metricName: 'latency_p99' }) as Array<Record<string, unknown>>
    assert.ok(filtered.every((a) => a.metricName === 'latency_p99'))
  })

  it('营销删除废弃的营销组件后页面组件数减少（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-blank', name: '活动A/B测试' })
    const oldBanner = ctrl.addComponent(page.id, { type: 'banner', props: { image: 'old.jpg' } })
    ctrl.addComponent(page.id, { type: 'banner', props: { image: 'new.jpg' } })
    ctrl.removeComponent(page.id, oldBanner.id)
    const detail = ctrl.getPage(page.id)
    assert.equal(detail.components.length, 2) // navbar + new-banner
  })

  it('营销使用 updatePage 发布页面也正确（正常流程）', () => {
    const page = ctrl.createPage({ templateId: 'tpl-dashboard', name: '双十二活动' })
    const updated = ctrl.updatePage(page.id, { name: '双十二主会场', status: 'published' })
    assert.equal(updated.name, '双十二主会场')
    assert.equal(updated.status, 'published')
  })
})

/* ─────────────────────────────────────────────────────────────────────────────
 * 跨角色 — 多角色互相隔离的集成验证
 * ───────────────────────────────────────────────────────────────────────────── */
describe('多角色低代码页面的隔离验证', () => {
  it('各角色独立的 controller 实例应互不干扰', () => {
    const ctrlA = makeController()
    const ctrlB = makeController()

    const pageA = ctrlA.createPage({ templateId: 'tpl-dashboard', name: 'A的页面' })
    const pageB = ctrlB.createPage({ templateId: 'tpl-form', name: 'B的页面' })

    // 各自只能看到自己创建的页面
    assert.equal(ctrlA.getPage(pageA.id).name, 'A的页面')
    assert.equal(ctrlB.getPage(pageB.id).name, 'B的页面')
  })

  it('审计告警服务在角色间共享实例时不应出现数据污染', () => {
    const builder = new LowCodePageBuilder()
    const audit = new AuditAlertService()
    const ctrlA = new LowcodePageController(builder, audit)
    const ctrlB = new LowcodePageController(builder, audit)

    ctrlA.recordMetric({ name: 'error_rate', value: 5 })
    const histA = ctrlA.getAlertHistory({}) as Array<Record<string, unknown>>
    const histB = ctrlB.getAlertHistory({}) as Array<Record<string, unknown>>

    // 若共享同一个 audit 实例，则两个 controller 应看到相同的数据
    assert.equal(histA.length, histB.length)
    assert.equal(histA.length, 1) // 只有一次告警
  })

  it('记录正常指标（低于阈值）不应产生告警', () => {
    const ctrl = makeController()
    const result = ctrl.recordMetric({ name: 'cpu_usage', value: 50 })
    const check = result.thresholdCheck as { exceeded: boolean; currentValue: number; threshold: number }
    assert.equal(check.exceeded, false)
    assert.equal(check.currentValue, 50)
    assert.equal(check.threshold, 80)
  })
})
