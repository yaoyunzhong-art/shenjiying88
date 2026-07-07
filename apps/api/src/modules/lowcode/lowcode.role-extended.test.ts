import { describe, it, expect, beforeEach } from 'vitest'
import { LowcodePageController } from './lowcode-page.controller'
import { LowCodePageBuilder, LowcodeAuditService, AuditAlertService } from './lowcode-audit.service'

/**
 * 🐜 [lowcode] 角色扩展测试
 * 覆盖低代码页面管理与审核边界场景
 * 使用实际控制器 API（CreatePageDto: templateId + name）
 * 修复：匹配 controller 实际签名，去掉不存在的 type 字段
 */

function setup() {
  const pageBuilder = new LowCodePageBuilder()
  const auditService = new LowcodeAuditService()
  const alertService = new AuditAlertService()
  const controller = new LowcodePageController(pageBuilder, alertService)
  return { pageBuilder, auditService, alertService, controller }
}

describe('👔店长 lowcode 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('创建页面模板（正常流程）', () => {
    const page = svc.controller.createPage({
      templateId: 'tpl-dashboard',
      name: '首页',
    })
    expect(page).toBeDefined()
    expect(page.name).toBe('首页')
    expect(page.templateId).toBe('tpl-dashboard')
    expect(page.status).toBe('draft')
  })

  it('创建页面时使用模板默认名称（边界）', () => {
    const page = svc.controller.createPage({
      templateId: 'tpl-blank',
    })
    expect(page).toBeDefined()
    // tpl-blank 的默认名称为 '空白'
    expect(page.name).toBe('空白')
  })
})

describe('🔧安监 lowcode 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('审核通过页面', () => {
    const page = svc.controller.createPage({ templateId: 'tpl-dashboard', name: '待审' })
    const published = svc.controller.publishPage(page.id)
    expect(published).toBeDefined()
    expect(published.status).toBe('published')
  })

  it('审核记录查询', () => {
    svc.auditService.recordAudit({ pageId: 'p1', reviewer: '安全员', action: 'approve', comment: '合规' })
    const history = svc.auditService.getAuditHistory('p1')
    expect(history.length).toBeGreaterThanOrEqual(1)
    expect(history[0].action).toBe('approve')
  })
})

describe('🎯运行专员 lowcode 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('列出所有已创建页面（通过 getPage 验证存在）', () => {
    const p1 = svc.controller.createPage({ templateId: 'tpl-form', name: 'A' })
    const p2 = svc.controller.createPage({ templateId: 'tpl-dashboard', name: 'B' })
    // 通过 getPage 逐一验证
    const p1Got = svc.controller.getPage(p1.id)
    const p2Got = svc.controller.getPage(p2.id)
    expect(p1Got).toBeDefined()
    expect(p2Got).toBeDefined()
    expect(p1Got!.name).toBe('A')
    expect(p2Got!.name).toBe('B')
  })

  it('渲染页面返回 HTML', () => {
    const page = svc.controller.createPage({ templateId: 'tpl-dashboard', name: '仪表盘' })
    const result = svc.controller.renderPage(page.id)
    expect(result.html).toContain('<!DOCTYPE html>')
    expect(result.html).toContain('仪表盘')
  })
})

describe('🎮导玩员 lowcode 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('向页面添加组件', () => {
    const page = svc.controller.createPage({ templateId: 'tpl-blank', name: '导玩页' })
    const comp = svc.controller.addComponent(page.id, { type: 'button', props: { text: '开始游戏' } })
    expect(comp.id).toBeDefined()
    expect(comp.type).toBe('button')
    expect(comp.props.text).toBe('开始游戏')
  })

  it('更新组件属性', () => {
    const page = svc.controller.createPage({ templateId: 'tpl-blank', name: '导玩页' })
    const comp = svc.controller.addComponent(page.id, { type: 'button', props: { text: '旧文字' } })
    const updated = svc.controller.updateComponent(page.id, comp.id, { props: { text: '新文字', color: 'red' } })
    expect(updated.props.text).toBe('新文字')
    expect(updated.props.color).toBe('red')
  })
})

describe('👥HR lowcode 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('记录审计指标', () => {
    const result = svc.alertService.recordMetric('error_rate', 1.5, { env: 'prod' })
    expect(result.name).toBe('error_rate')
    expect(result.value).toBe(1.5)
  })

  it('指标未超过阈值时不触发告警', () => {
    svc.alertService.recordMetric('error_rate', 0.5, { env: 'prod' })
    const check = svc.alertService.checkThresholds('error_rate')
    expect(check.exceeded).toBe(false)
  })
})

describe('📢营销 lowcode 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('发布营销活动页面', () => {
    const page = svc.controller.createPage({ templateId: 'tpl-form', name: '活动报名' })
    const published = svc.controller.publishPage(page.id)
    expect(published.status).toBe('published')
  })

  it('更新页面名称后反映到页面', () => {
    const page = svc.controller.createPage({ templateId: 'tpl-blank', name: '旧名称' })
    svc.controller.updatePage(page.id, { name: '新活动名称' })
    const updated = svc.controller.getPage(page.id)
    expect(updated!.name).toBe('新活动名称')
  })
})

describe('🛒前台 lowcode 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('获取页面详情', () => {
    const page = svc.controller.createPage({ templateId: 'tpl-dashboard', name: '前台展示' })
    const detail = svc.controller.getPage(page.id)
    expect(detail!.id).toBe(page.id)
  })

  it('尝试获取不存在的页面应抛出', () => {
    expect(() => svc.controller.getPage('non-existent-id')).toThrow()
  })
})

describe('🤝团建 lowcode 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('删除组件后不再存在于页面', () => {
    const page = svc.controller.createPage({ templateId: 'tpl-blank', name: '团建页' })
    const comp = svc.controller.addComponent(page.id, { type: 'button', props: {} })
    svc.controller.removeComponent(page.id, comp.id)
    // 验证 navbar（默认组件）还在
    const detail = svc.controller.getPage(page.id)
    expect(detail!.components.length).toBe(1)
    expect((detail!.components[0] as any).type).toBe('navbar')
  })

  it('获取模板详情', () => {
    const tpl = svc.controller.getTemplate('tpl-dashboard')
    expect(tpl).toBeDefined()
    expect((tpl as any).name).toBe('仪表盘')
  })
})
