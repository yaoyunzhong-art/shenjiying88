import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [brand-custom] [C] 角色测试
 * 
 * 8 角色视角的 brand-custom 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { BrandCustomController } from './brand-custom.controller'
import { BrandCustomService } from './brand-custom.service'
import { EmailTemplateTypeEnum } from './brand-custom.dto'

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

// ── 测试数据工厂 ──
function createController() {
  const service = new BrandCustomService()
  return new BrandCustomController(service)
}

function setupTenant(ctrl: BrandCustomController, tenantId = 't-001', brandName = '测试门店') {
  return ctrl.registerTenant({ tenantId, brandName })
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} brand-custom 角色测试`, () => {
  it('店长可为门店注册品牌并查看主题', () => {
    const ctrl = createController()
    const brand = setupTenant(ctrl, 't-store-001', '旗舰店')

    assert.equal(brand.tenantId, 't-store-001')
    assert.equal(brand.theme.brandName, '旗舰店')
    assert.ok(brand.active)

    const theme = ctrl.getTheme('t-store-001')
    assert.notEqual(theme, null)
    assert.equal(theme!.brandName, '旗舰店')
  })

  it('店长不允许重复注册同一租户', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-dupe', '已注册店')

    assert.throws(
      () => ctrl.registerTenant({ tenantId: 't-dupe', brandName: '重复店' }),
      /already registered/,
    )
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} brand-custom 角色测试`, () => {
  it('前台可查看当前品牌主题配色', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-front', '前台门店')
    ctrl.applyTheme('t-front', { primaryColor: '#FF0000', secondaryColor: '#00FF00' })

    const theme = ctrl.getTheme('t-front')
    assert.notEqual(theme, null)
    assert.equal(theme!.primaryColor, '#FF0000')
    assert.equal(theme!.secondaryColor, '#00FF00')
  })

  it('前台无权停用品牌（仅限主动能调用，尝试停用无名租户抛错）', () => {
    const ctrl = createController()
    assert.throws(
      () => ctrl.setActive('t-nonexistent', false),
      /not found/,
    )
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} brand-custom 角色测试`, () => {
  it('HR 可配置品牌基础信息（名称、logo）', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-hr', 'HR门店')
    const updated = ctrl.applyTheme('t-hr', { brandName: 'HR品牌升级', logo: 'https://logo.example.com/hr.png' })

    assert.equal(updated.brandName, 'HR品牌升级')
    assert.equal(updated.logo, 'https://logo.example.com/hr.png')
  })

  it('HR 设置品牌主题时传入空名称应保持原名称不变（非破坏性更新）', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-hr-2', 'HR原始名称')
    const updated = ctrl.applyTheme('t-hr-2', { backgroundColor: '#333333' })

    assert.equal(updated.brandName, 'HR原始名称')
    assert.equal(updated.backgroundColor, '#333333')
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} brand-custom 角色测试`, () => {
  it('安监可配置域名和 SSL', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-sec', '安监门店')
    ctrl.configureDomain('t-sec', {
      customDomain: 'secure.shop.com',
      sslEnabled: true,
    })

    const domain = ctrl.getDomainConfig('t-sec')
    assert.notEqual(domain, null)
    assert.equal(domain!.customDomain, 'secure.shop.com')
    assert.equal(domain!.sslEnabled, true)
  })

  it('安监可生成 DNS 配置记录', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-sec-dns', '安监DNS门店')
    ctrl.configureDomain('t-sec-dns', {
      customDomain: 'dns-test.shop.com',
      cdnDomain: 'cdn.dns-test.com',
      apiSubdomain: 'api.dns-test.com',
      webSubdomain: 'www.dns-test.com',
    })

    const records = ctrl.generateDNSGuide('t-sec-dns')
    assert.equal(records.length, 4)
    assert.ok(records.some(r => r.type === 'A' && r.name.includes('dns-test')))
    assert.ok(records.some(r => r.type === 'CNAME'))
    assert.equal(records[0].ttl, 300)
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} brand-custom 角色测试`, () => {
  it('导玩员可查看预设主题列表', () => {
    const ctrl = createController()
    const presets = ctrl.getPresetThemes()

    assert.ok(presets.length >= 5)
    assert.ok(presets.some(p => p.id === 'tech'))
    assert.ok(presets.some(p => p.id === 'entertainment'))
  })

  it('导玩员对不存在的租户应用主题应抛错', () => {
    const ctrl = createController()
    assert.throws(
      () => ctrl.applyPreset('t-nonexistent', 'tech'),
      /not found/,
    )
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} brand-custom 角色测试`, () => {
  it('运行专员可为门店应用预设主题', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-ops', '运行门店')
    const theme = ctrl.applyPreset('t-ops', 'entertainment')

    assert.equal(theme.primaryColor, '#9B59B6')
    assert.equal(theme.secondaryColor, '#E91E63')
    assert.equal(theme.backgroundColor, '#1A1A2E')
  })

  it('运行专员应用不存在的预设应抛错', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-ops-2', '运行门店2')
    assert.throws(
      () => ctrl.applyPreset('t-ops-2', 'nonexistent-preset'),
      /not found/,
    )
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} brand-custom 角色测试`, () => {
  it('团建可为品牌设置并获取邮件模板', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-team', '团建门店')
    ctrl.setEmailTemplate('t-team', {
      templateType: EmailTemplateTypeEnum.WELCOME,
      subject: '欢迎加入 {{name}}！',
      htmlContent: '<h1>欢迎 {{name}}</h1>',
      textContent: '欢迎 {{name}}',
      senderName: '团建团队',
      senderEmail: 'team@example.com',
    })

    const tmpl = ctrl.getEmailTemplate('t-team', 'welcome' as any)
    assert.notEqual(tmpl, null)
    assert.equal(tmpl!.subject, '欢迎加入 {{name}}！')
    assert.equal(tmpl!.senderName, '团建团队')
  })

  it('团建渲染邮件模板替换变量', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-team-render', '团建渲染门店')
    ctrl.setEmailTemplate('t-team-render', {
      templateType: EmailTemplateTypeEnum.MARKETING,
      subject: '{{name}}，促销来了！',
      htmlContent: '<p>亲爱的 {{name}}，本月优惠 {{discount}}</p>',
      textContent: '亲爱的 {{name}}，本月优惠 {{discount}}',
    })

    const rendered = ctrl.renderEmail('t-team-render', 'marketing' as any, { templateType: EmailTemplateTypeEnum.MARKETING, variables: { name: '张三', discount: '8折' } })
    assert.equal(rendered.subject, '张三，促销来了！')
    assert.ok(rendered.html.includes('8折'))
    assert.ok(rendered.text.includes('张三'))
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} brand-custom 角色测试`, () => {
  it('营销可预览主题效果生成 HTML', () => {
    const ctrl = createController()
    const preview = ctrl.previewTheme({
      brandName: '营销活动',
      primaryColor: '#FF6B35',
      backgroundColor: '#FFFFFF',
      textColor: '#1A1A1A',
    })

    assert.ok(preview.html.includes('营销活动'))
    assert.ok(preview.html.includes('#FF6B35'))
    assert.ok(preview.html.includes('主要按钮'))
  })

  it('营销发送测试邮件到指定收件人', async () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-mkt', '营销门店')
    ctrl.setEmailTemplate('t-mkt', {
      templateType: EmailTemplateTypeEnum.MARKETING,
      subject: '测试邮件',
      htmlContent: '<p>测试内容</p>',
      textContent: '测试内容',
    })

    const result = await ctrl.sendTestEmail('t-mkt', 'marketing' as any, { recipient: 'test@example.com', templateType: 'marketing' as any })
    assert.equal(result.success, true)
  })
})
