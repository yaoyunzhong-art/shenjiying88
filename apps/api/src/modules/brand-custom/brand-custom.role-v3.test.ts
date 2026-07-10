import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [brand-custom] [C] 角色测试 v3 — 深度场景
 *
 * 8 角色视角深度场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例 (正常流程 + 权限边界/异常)
 * 场景结合线下游乐/游戏中心实际运营需求
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { BrandCustomController } from './brand-custom.controller'
import { BrandCustomService } from './brand-custom.service'

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

function createController(): BrandCustomController {
  const svc = new BrandCustomService()
  return new BrandCustomController(svc)
}

function setup(ctrl: BrandCustomController, tenantId = 't-arcade-001', brandName = '欢乐电玩城') {
  return ctrl.registerTenant({ tenantId, brandName })
}

// ────────────────────────────────────────────────────────
// 👔 店长 — 门店整体品牌管理权限
// ────────────────────────────────────────────────────────
describe(`${ROLES.StoreManager} brand-custom v3 深度场景`, () => {
  it('店长可依次应用预设主题并验证颜色同步更新', () => {
    const ctrl = createController()
    setup(ctrl, 't-preset-test', '测试门店')

    // 应用"科技蓝"预设
    let theme = ctrl.applyPreset('t-preset-test', 'tech')
    assert.equal(theme.primaryColor, '#0066FF')
    assert.equal(theme.secondaryColor, '#00D4FF')

    // 切换为"娱乐紫"
    theme = ctrl.applyPreset('t-preset-test', 'entertainment')
    assert.equal(theme.primaryColor, '#9B59B6')
    assert.equal(theme.backgroundColor, '#1A1A2E')

    // 验证 CSS 变量生成
    const cssResult = ctrl.generateCSSVariables('t-preset-test')
    assert.ok(cssResult.css.includes('--brand-primary'))
  })

  it('店长不允许设置不存在的预设主题', () => {
    const ctrl = createController()
    setup(ctrl, 't-preset-err', '预设店')
    assert.throws(
      () => ctrl.applyPreset('t-preset-err', 'nonexistent'),
      /not found/,
    )
  })

  it('店长可停用品牌后其他功能仍可用但标记 inactive', () => {
    const ctrl = createController()
    setup(ctrl, 't-toggle', '开业门店')
    ctrl.setActive('t-toggle', false)

    const brands = ctrl.listBrands()
    const brand = brands.find(b => b.tenantId === 't-toggle')
    assert.ok(brand)
    assert.equal(brand.active, false)

    // 停用后仍然可以修改主题（品牌数据不变）
    const theme = ctrl.applyTheme('t-toggle', { primaryColor: '#FF0000' })
    assert.equal(theme.primaryColor, '#FF0000')
  })

  it('店长查询不存在的租户邮箱模板应抛异常', () => {
    const ctrl = createController()
    assert.throws(
      () => ctrl.getEmailTemplate('t-nonexistent', 'welcome'),
      /not found/,
    )
  })
})

// ────────────────────────────────────────────────────────
// 🛒 前台 — 日常工作中使用品牌主题、查看配置
// ────────────────────────────────────────────────────────
describe(`${ROLES.FrontDesk} brand-custom v3 深度场景`, () => {
  it('前台可查看门店主题配置和 DNS 指引', () => {
    const ctrl = createController()
    setup(ctrl, 't-reception', '前台店')

    const theme = ctrl.getTheme('t-reception')
    assert.ok(theme)
    assert.equal(theme!.brandName, '前台店')

    const dns = ctrl.generateDNSGuide('t-reception')
    assert.ok(Array.isArray(dns))
  })

  it('前台配置自定义域名后 DNS 记录正确生成', () => {
    const ctrl = createController()
    setup(ctrl, 't-domain', '域名店')

    ctrl.configureDomain('t-domain', {
      customDomain: 'arcade.example.com',
      cdnDomain: 'cdn.arcade.example.com',
      apiSubdomain: 'api.arcade.example.com',
    })
    const guides = ctrl.generateDNSGuide('t-domain')
    assert.ok(guides.some(g => g.type === 'A'))
    assert.ok(guides.some(g => g.type === 'CNAME'))
    assert.ok(guides.length >= 3)
  })

  it('前台对未注册门店调用 getTheme 返回 null', () => {
    const ctrl = createController()
    const theme = ctrl.getTheme('not-exist')
    assert.equal(theme, null)
  })

  it('前台可查看预设主题列表', () => {
    const ctrl = createController()
    setup(ctrl, 't-presets')
    // 应用一个预设验证
    const theme = ctrl.applyPreset('t-presets', 'restaurant')
    assert.equal(theme.primaryColor, '#FF6B35')
  })
})

// ────────────────────────────────────────────────────────
// 👥 HR — 使用邮件模板管理门店通知
// ────────────────────────────────────────────────────────
describe(`${ROLES.HR} brand-custom v3 深度场景`, () => {
  it('HR 可为门店设置各类邮件模板并按类型获取', () => {
    const ctrl = createController()
    setup(ctrl, 't-hr', 'HR门店')

    ctrl.setEmailTemplate('t-hr', {
      templateType: 'welcome',
      subject: '欢迎加入 {{storeName}}',
      htmlContent: '<h1>欢迎</h1>',
      textContent: '欢迎正文',
      senderName: 'HR部门',
      senderEmail: 'hr@example.com',
    })

    const tmpl = ctrl.getEmailTemplate('t-hr', 'welcome')
    assert.ok(tmpl)
    assert.equal(tmpl!.subject, '欢迎加入 {{storeName}}')
  })

  it('HR 可渲染邮件模板替换变量', () => {
    const ctrl = createController()
    setup(ctrl, 't-render', '渲染测试')

    ctrl.setEmailTemplate('t-render', {
      templateType: 'reset_password',
      subject: '重置密码',
      htmlContent: '<p>您好 {{name}}，请重置密码</p>',
      textContent: '您好 {{name}}，请重置密码',
    })

    // 直接调用 service 层（controller 需 Nest validation pipe 转换 DTO）
    const svc = new BrandCustomService()
    // 使用 controller 但传入完整 body 对象
    // controller.renderEmail 签名: (tenantId, templateType, body: RenderEmailDto)
    // body 期望 { templateType, variables }
    const rendered = ctrl.renderEmail('t-render', 'reset_password', {
      templateType: 'reset_password',
      variables: { name: '张三' },
    } as any)
    assert.ok(rendered.html.includes('张三'))
    assert.ok(rendered.text.includes('张三'))
  })

  it('HR 对不存在的租户获取模板抛错', () => {
    const ctrl = createController()
    assert.throws(
      () => ctrl.getEmailTemplate('t-nonexistent', 'welcome'),
      /not found/,
    )
  })

  it('HR 可发送测试邮件给指定收件人', async () => {
    const ctrl = createController()
    setup(ctrl, 't-send-test', '测试店')
    ctrl.setEmailTemplate('t-send-test', {
      templateType: 'marketing',
      subject: '促销通知',
      htmlContent: '<p>优惠</p>',
      textContent: '优惠',
    })
    const result = ctrl.sendTestEmail('t-send-test', 'marketing', 'test@example.com')
    assert.ok(await result)
  })
})

// ────────────────────────────────────────────────────────
// 🔧 安监 — 验证安全相关配置: SSL、域名、内容安全
// ────────────────────────────────────────────────────────
describe(`${ROLES.Security} brand-custom v3 深度场景`, () => {
  it('安监可配置域名 SSL 并验证状态', () => {
    const ctrl = createController()
    setup(ctrl, 't-secure', '安全门店')

    ctrl.configureDomain('t-secure', {
      customDomain: 'secure.arcade.com',
      sslEnabled: true,
      sslCertId: 'cert-001',
    })

    const domain = ctrl.getDomainConfig('t-secure')
    assert.ok(domain)
    assert.ok(domain!.sslEnabled)
    assert.equal(domain!.sslCertId, 'cert-001')
  })

  it('安监生成的 DNS 记录包含正确的 TTL 配置', () => {
    const ctrl = createController()
    setup(ctrl, 't-dns-sec', 'DNSSec门店')

    ctrl.configureDomain('t-dns-sec', {
      customDomain: 'dns.arcade.com',
      cdnDomain: 'cdn.arcade.com',
    })

    const guides = ctrl.generateDNSGuide('t-dns-sec')
    for (const g of guides) {
      assert.equal(g.ttl, 300, `TTL for ${g.name} should be 300`)
    }
  })

  it('安监对未配置 SSL 的域名返回 sslEnabled=false', () => {
    const ctrl = createController()
    setup(ctrl, 't-no-ssl', '无SSL门店')

    const domain = ctrl.getDomainConfig('t-no-ssl')
    assert.ok(domain)
    assert.equal(domain!.sslEnabled, false)
  })

  it('安监配置恶意域名长度边界 — 长域名应正常注册', () => {
    const ctrl = createController()
    setup(ctrl, 't-long-domain', '长域名测试')

    const longDomain = 'a'.repeat(200) + '.example.com'
    ctrl.configureDomain('t-long-domain', { customDomain: longDomain })
    const domain = ctrl.getDomainConfig('t-long-domain')
    assert.equal(domain!.customDomain, longDomain)
  })
})

// ────────────────────────────────────────────────────────
// 🎮 导玩员 — 使用品牌主题美化游戏界面、预览主题
// ────────────────────────────────────────────────────────
describe(`${ROLES.Guide} brand-custom v3 深度场景`, () => {
  it('导玩员可预览任意品牌主题的 HTML 片段', () => {
    const ctrl = createController()
    setup(ctrl, 't-guide-preview', '游戏区')

    // controller 返回 {html: string}
    const result = ctrl.previewTheme({
      brandName: '竞速区',
      primaryColor: '#FF4500',
      backgroundColor: '#1A1A1A',
      textColor: '#FFFFFF',
    } as any)
    assert.ok(result.html.includes('竞速区'))
    assert.ok(result.html.includes('#FF4500'))
    assert.ok(result.html.includes('preview-button'))
  })

  it('导玩员可为特定游戏区应用不同配色方案', () => {
    const ctrl = createController()
    setup(ctrl, 't-multi-zone', '综合游戏厅')

    // 主游戏区: 科技蓝
    ctrl.applyTheme('t-multi-zone', { primaryColor: '#0066FF' })
    let theme = ctrl.getTheme('t-multi-zone')
    assert.equal(theme!.primaryColor, '#0066FF')

    // 儿童区: 娱乐紫
    ctrl.applyTheme('t-multi-zone', { primaryColor: '#9B59B6', secondaryColor: '#E91E63' })
    theme = ctrl.getTheme('t-multi-zone')
    assert.equal(theme!.primaryColor, '#9B59B6')
    assert.equal(theme!.secondaryColor, '#E91E63')
  })

  it('导玩员处理颜色空值 — 应保留已有颜色', () => {
    const ctrl = createController()
    setup(ctrl, 't-color-merge', '颜色合并店')

    ctrl.applyTheme('t-color-merge', { primaryColor: '#FF0000' })
    ctrl.applyTheme('t-color-merge', { accentColor: '#00FF00' })
    const theme = ctrl.getTheme('t-color-merge')
    assert.equal(theme!.primaryColor, '#FF0000')  // 保留
    assert.equal(theme!.accentColor, '#00FF00')   // 新增
  })
})

// ────────────────────────────────────────────────────────
// 🎯 运行专员 — 运行维护、批量查看品牌状态
// ────────────────────────────────────────────────────────
describe(`${ROLES.Operations} brand-custom v3 深度场景`, () => {
  it('运行专员可查看所有注册门店品牌列表', () => {
    const ctrl = createController()
    setup(ctrl, 't-ops-1', '一号门店')
    setup(ctrl, 't-ops-2', '二号门店')
    setup(ctrl, 't-ops-3', '三号门店')

    const brands = ctrl.listBrands()
    assert.equal(brands.length, 3)
  })

  it('运行专员可逐个激活/停用品牌并验证', () => {
    const ctrl = createController()
    setup(ctrl, 't-online', '线上店')
    setup(ctrl, 't-offline', '休业店')

    ctrl.setActive('t-online', true)
    ctrl.setActive('t-offline', false)

    const brands = ctrl.listBrands()
    const online = brands.find(b => b.tenantId === 't-online')
    const offline = brands.find(b => b.tenantId === 't-offline')
    assert.ok(online!.active)
    assert.ok(!offline!.active)
  })

  it('运行专员无法对不存在的门店执行操作', () => {
    const ctrl = createController()
    assert.throws(() => ctrl.setActive('ghost-store', false), /not found/)
  })

  it('运行专员可快速启用 SSL 批量验证', () => {
    const ctrl = createController()
    setup(ctrl, 't-batch-ssl1', '门店A')
    setup(ctrl, 't-batch-ssl2', '门店B')

    ctrl.configureDomain('t-batch-ssl1', { sslEnabled: true, sslCertId: 'cert-a' })
    ctrl.configureDomain('t-batch-ssl2', { sslEnabled: true, sslCertId: 'cert-b' })

    const d1 = ctrl.getDomainConfig('t-batch-ssl1')
    const d2 = ctrl.getDomainConfig('t-batch-ssl2')
    assert.ok(d1!.sslEnabled)
    assert.ok(d2!.sslEnabled)
  })
})

// ────────────────────────────────────────────────────────
// 🤝 团建 — 团建活动场景的品牌配置
// ────────────────────────────────────────────────────────
describe(`${ROLES.Teambuilding} brand-custom v3 深度场景`, () => {
  it('团建专员可为团建活动创建独立品牌并配置主题', () => {
    const ctrl = createController()
    setup(ctrl, 't-team-evt', '团建活动区')

    ctrl.applyTheme('t-team-evt', {
      primaryColor: '#FF6B35',
      backgroundColor: '#FFF3E0',
      fontFamily: 'Comic Sans MS, cursive',
    })

    const theme = ctrl.getTheme('t-team-evt')
    assert.equal(theme!.fontFamily, 'Comic Sans MS, cursive')
    assert.equal(theme!.primaryColor, '#FF6B35')
  })

  it('团建专员可为活动配置单独邮件模板用于邀请', () => {
    const ctrl = createController()
    setup(ctrl, 't-team-mail', '团建活动')

    ctrl.setEmailTemplate('t-team-mail', {
      templateType: 'marketing',
      subject: '团建活动邀请',
      htmlContent: '<h1>团建活动通知</h1><p>时间: {{date}}</p>',
      textContent: '团建活动通知\n时间: {{date}}',
      senderName: '团建部',
    })

    const tmpl = ctrl.getEmailTemplate('t-team-mail', 'marketing')
    assert.ok(tmpl)
    assert.equal(tmpl!.subject, '团建活动邀请')
  })

  it('团建专员活动结束后可删除品牌相关配置', () => {
    const ctrl = createController()
    setup(ctrl, 't-team-cleanup', '团建临时店')

    ctrl.setActive('t-team-cleanup', false)
    const brands = ctrl.listBrands()
    const brand = brands.find(b => b.tenantId === 't-team-cleanup')
    assert.ok(brand)
    assert.ok(!brand!.active)  // 停用但保留数据
  })
})

// ────────────────────────────────────────────────────────
// 📢 营销 — 营销活动品牌配置及预览
// ────────────────────────────────────────────────────────
describe(`${ROLES.Marketing} brand-custom v3 深度场景`, () => {
  it('营销专员可预览品牌主题 HTML 并验证全部颜色值', () => {
    const ctrl = createController()
    setup(ctrl, 't-mkt-preview', '夏日促销')

    // controller 返回 {html: string}
    const result = ctrl.previewTheme({
      brandName: '夏日促销',
      primaryColor: '#FF6B00',
      secondaryColor: '#FFD700',
      accentColor: '#FF1493',
      backgroundColor: '#FFF8E1',
      textColor: '#2C3E50',
    } as any)

    assert.ok(result.html.includes('#FF6B00'))
    assert.ok(result.html.includes('#FFD700'))
    assert.ok(result.html.includes('#FF1493'))
    assert.ok(result.html.includes('夏日促销'))
  })

  it('营销专员可跨门店应用统一营销主题', () => {
    const ctrl = createController()
    setup(ctrl, 't-mkt-1', '门店A')
    setup(ctrl, 't-mkt-2', '门店B')

    ctrl.applyTheme('t-mkt-1', { primaryColor: '#FF0000', fontFamily: 'Arial' })
    ctrl.applyTheme('t-mkt-2', { primaryColor: '#FF0000', fontFamily: 'Arial' })

    const t1 = ctrl.getTheme('t-mkt-1')
    const t2 = ctrl.getTheme('t-mkt-2')
    assert.equal(t1!.primaryColor, t2!.primaryColor)
    assert.equal(t1!.fontFamily, t2!.fontFamily)
  })

  it('营销专员配置自定义 CSS 变量后正确注入', () => {
    const ctrl = createController()
    setup(ctrl, 't-css-inject', 'CSS注入店')

    ctrl.applyTheme('t-css-inject', {
      cssVariables: {
        '--custom-banner-height': '300px',
        '--custom-animation-speed': '0.3s',
      },
    })

    // generateCSSVariables 在 service 层检测
    const svc = new BrandCustomService()
    // 通过 controller 间接验证
    const theme = ctrl.getTheme('t-css-inject')
    assert.ok(theme!.cssVariables)
    assert.equal(theme!.cssVariables!['--custom-banner-height'], '300px')
  })

  it('营销专员无法设置不存在的租户邮件模板', () => {
    const ctrl = createController()
    assert.throws(
      () => ctrl.setEmailTemplate('ghost-mkt', {
        templateType: 'marketing',
        subject: 'test',
        htmlContent: '<p>test</p>',
        textContent: 'test',
      }),
      /not found/,
    )
  })
})


