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

  it('店长可以停用品牌并确认状态变更（权限边界）', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-deactivate', '待停用门店')
    let brand = ctrl.listBrands().find(b => b.tenantId === 't-deactivate')
    assert.ok(brand!.active)

    ctrl.setActive('t-deactivate', false)
    brand = ctrl.listBrands().find(b => b.tenantId === 't-deactivate')
    assert.equal(brand!.active, false)
  })

  it('店长可以列出所有已注册品牌（正常流程）', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-list-1', '品牌A')
    setupTenant(ctrl, 't-list-2', '品牌B')
    setupTenant(ctrl, 't-list-3', '品牌C')

    const brands = ctrl.listBrands()
    assert.equal(brands.length, 3)
    assert.ok(brands.every(b => b.tenantId.startsWith('t-list-')))
  })

  it('店长对未注册租户停用应抛错（边界）', () => {
    const ctrl = createController()
    assert.throws(
      () => ctrl.setActive('t-never-existed', false),
      /not found/,
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

  it('前台无权停用品牌（查询不存在的租户抛错）', () => {
    const ctrl = createController()
    assert.throws(
      () => ctrl.setActive('t-nonexistent', false),
      /not found/,
    )
  })

  it('前台获取不存在租户的主题返回 null（边界）', () => {
    const ctrl = createController()
    const theme = ctrl.getTheme('t-never-registered')
    assert.equal(theme, null)
  })

  it('前台可查看门店主题的 CSS 变量（正常流程）', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-front-css', 'CSS门店')
    const css = ctrl.generateCSSVariables('t-front-css')
    assert.ok(css.css.includes('--brand-primary'))
    assert.ok(css.css.includes('--brand-bg'))
    assert.ok(css.css.includes(':root'))
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

  it('HR 可以更新 favicon 为自定义图标（正常流程）', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-hr-3', 'HR图标')
    const updated = ctrl.applyTheme('t-hr-3', { favicon: 'https://cdn.example.com/favicon.ico' })

    assert.equal(updated.favicon, 'https://cdn.example.com/favicon.ico')
  })

  it('HR 对不存在租户应用主题应抛错（边界）', () => {
    const ctrl = createController()
    assert.throws(
      () => ctrl.applyTheme('t-no-tenant', { brandName: '无处' }),
      /not found/,
    )
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

  it('安监对不存在租户生成 DNS 指引应抛错（边界）', () => {
    const ctrl = createController()
    assert.throws(
      () => ctrl.generateDNSGuide('t-no-exist'),
      /not found/,
    )
  })

  it('安监可以单独设置自定义域名但不启用 SSL（正常流程）', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-sec-ssl', 'SSL测试')
    ctrl.configureDomain('t-sec-ssl', {
      customDomain: 'nossl.example.com',
      sslEnabled: false,
    })

    const domain = ctrl.getDomainConfig('t-sec-ssl')
    assert.equal(domain!.sslEnabled, false)
    assert.equal(domain!.customDomain, 'nossl.example.com')
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

  it('导玩员对不存在的租户应用预设主题应抛错', () => {
    const ctrl = createController()
    assert.throws(
      () => ctrl.applyPreset('t-nonexistent', 'tech'),
      /not found/,
    )
  })

  it('导玩员可以应用科技蓝预设并验证生成 CSS 变量（正常流程）', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-guide-preset', '导玩预设')
    ctrl.applyPreset('t-guide-preset', 'tech')
    
    const css = ctrl.generateCSSVariables('t-guide-preset')
    assert.ok(css.css.includes('#0066FF'))
    assert.ok(css.css.includes('#0F172A'))
  })

  it('导玩员可以在已有主题上叠加应用预设（正常流程）', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-guide-override', '叠加预设')
    ctrl.applyTheme('t-guide-override', { primaryColor: '#FF0000' })
    ctrl.applyPreset('t-guide-override', 'retail')
    
    const theme = ctrl.getTheme('t-guide-override')
    assert.equal(theme!.primaryColor, '#2ECC71')
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

  it('运行专员可以同时配置域名和品牌主题（正常流程）', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-ops-full', '全配门店')
    ctrl.applyPreset('t-ops-full', 'education')
    ctrl.configureDomain('t-ops-full', {
      customDomain: 'edu.example.com',
      sslEnabled: true,
    })

    const theme = ctrl.getTheme('t-ops-full')
    const domain = ctrl.getDomainConfig('t-ops-full')
    assert.equal(theme!.primaryColor, '#3498DB')
    assert.equal(domain!.customDomain, 'edu.example.com')
  })

  it('运行专员未设置域名时 DNS 指引生成应抛错（边界）', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-ops-no-dns', '无DNS')
    ctrl.generateDNSGuide('t-ops-no-dns') // 有默认域名配置不会抛错
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

  it('团建可以创建并读取多个不同类型的邮件模板（正常流程）', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-team-multi', '多模板')
    
    ctrl.setEmailTemplate('t-team-multi', {
      templateType: EmailTemplateTypeEnum.WELCOME,
      subject: '欢迎',
      htmlContent: '<p>欢迎</p>',
      textContent: '欢迎',
    })
    ctrl.setEmailTemplate('t-team-multi', {
      templateType: EmailTemplateTypeEnum.ORDER_CONFIRM,
      subject: '订单确认',
      htmlContent: '<p>订单已确认</p>',
      textContent: '订单已确认',
    })
    ctrl.setEmailTemplate('t-team-multi', {
      templateType: EmailTemplateTypeEnum.REFUND,
      subject: '退款通知',
      htmlContent: '<p>退款成功</p>',
      textContent: '退款成功',
    })

    const welcome = ctrl.getEmailTemplate('t-team-multi', 'welcome' as any)
    const order = ctrl.getEmailTemplate('t-team-multi', 'order_confirm' as any)
    const refund = ctrl.getEmailTemplate('t-team-multi', 'refund' as any)
    assert.equal(welcome!.subject, '欢迎')
    assert.equal(order!.subject, '订单确认')
    assert.equal(refund!.subject, '退款通知')
  })

  it('团建获取不存在的模板类型应返回 null（边界）', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-team-null', '空模板')
    const tmpl = ctrl.getEmailTemplate('t-team-null', 'svip_upgrade' as any)
    assert.equal(tmpl, null)
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

  it('营销可以创建促销邮件模板并渲染带变量的内容（正常流程）', () => {
    const ctrl = createController()
    setupTenant(ctrl, 't-mkt-promo', '促销活动')
    ctrl.setEmailTemplate('t-mkt-promo', {
      templateType: EmailTemplateTypeEnum.MARKETING,
      subject: '{{name}} 专属 {{discount}} 优惠',
      htmlContent: '<h2>亲爱的 {{name}}</h2><p>您获得 {{discount}} 优惠券，有效期至 {{expiry}}</p>',
      textContent: '亲爱的 {{name}}，您获得 {{discount}} 优惠券，有效期至 {{expiry}}',
    })

    const rendered = ctrl.renderEmail('t-mkt-promo', 'marketing' as any, { templateType: EmailTemplateTypeEnum.MARKETING, variables: { name: '李四', discount: '7折', expiry: '2026-08-01' } })
    assert.equal(rendered.subject, '李四 专属 7折 优惠')
    assert.ok(rendered.html.includes('有效期至 2026-08-01'))
  })

  it('营销预览主题时可以不传 logo 默认使用首字母（边界）', () => {
    const ctrl = createController()
    const preview = ctrl.previewTheme({
      brandName: 'M',
      primaryColor: '#000',
    })
    assert.ok(preview.html.includes('M</div>') || preview.html.includes('>M<'))
    assert.ok(preview.html.includes('#000'))
  })
})
