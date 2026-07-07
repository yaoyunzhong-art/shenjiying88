import { describe, it, expect, beforeEach } from 'vitest'
import { BrandCustomService } from './brand-custom.service'

/**
 * 🐜 [brand-custom] 角色扩展测试
 * 覆盖品牌定制、主题、域名、邮件模板的边界场景
 */

function setup() {
  const svc = new BrandCustomService()
  return svc
}

describe('👔店长 brand-custom 扩展测试', () => {
  let svc: BrandCustomService
  beforeEach(() => { svc = setup() })

  it('注册租户品牌并查看主题', () => {
    svc.registerTenant('tenant-1', '游乐中心')
    const theme = svc.getTheme('tenant-1')
    expect(theme).not.toBeNull()
    expect(theme!.brandName).toBe('游乐中心')
    expect(theme!.primaryColor).toBe('#0066FF')
  })

  it('查询不存在的租户主题返回 null', () => {
    expect(svc.getTheme('no-such')).toBeNull()
  })

  it('列出所有注册品牌', () => {
    svc.registerTenant('t1', '品牌A')
    svc.registerTenant('t2', '品牌B')
    const list = svc.listBrands()
    expect(list).toHaveLength(2)
  })
})

describe('🛒前台 brand-custom 扩展测试', () => {
  let svc: BrandCustomService
  beforeEach(() => { svc = setup(); svc.registerTenant('t-front', '前台品牌') })

  it('应用预设主题科技蓝', () => {
    const theme = svc.applyPreset('t-front', 'tech')
    expect(theme.primaryColor).toBe('#0066FF')
    expect(theme.backgroundColor).toBe('#0F172A')
  })

  it('应用不存在的预设主题抛异常', () => {
    expect(() => svc.applyPreset('t-front', 'no-preset')).toThrow('Preset')
  })

  it('生成 CSS 变量字符串', () => {
    const css = svc.generateCSSVariables('t-front')
    expect(css).toContain('--brand-primary')
    expect(css).toContain('#0066FF')
  })

  it('不存在的租户生成 CSS 抛异常', () => {
    expect(() => svc.generateCSSVariables('no-such')).toThrow('Tenant')
  })
})

describe('👥HR brand-custom 扩展测试', () => {
  let svc: BrandCustomService
  beforeEach(() => { svc = setup(); svc.registerTenant('t-hr', 'HR品牌') })

  it('修改主题颜色并验证', () => {
    svc.applyTheme('t-hr', { primaryColor: '#FF0000' })
    const theme = svc.getTheme('t-hr')
    expect(theme!.primaryColor).toBe('#FF0000')
  })
})

describe('🔧安监 brand-custom 扩展测试', () => {
  let svc: BrandCustomService
  beforeEach(() => { svc = setup(); svc.registerTenant('t-sec', '安全品牌') })

  it('激活/停用租户品牌', () => {
    svc.setActive('t-sec', false)
    expect(() => svc.setActive('no-such', true)).toThrow('Tenant')
  })

  it('配置域名并生成 DNS 记录', () => {
    svc.configureDomain('t-sec', { customDomain: 'shop.example.com' })
    const dns = svc.generateDNSGuide('t-sec')
    expect(dns.length).toBeGreaterThanOrEqual(1)
    expect(dns[0].name).toBe('shop.example.com')
  })

  it('不存在的租户生成 DNS 抛异常', () => {
    expect(() => svc.generateDNSGuide('no-such')).toThrow('Tenant')
  })
})

describe('🎮导玩员 brand-custom 扩展测试', () => {
  let svc: BrandCustomService
  beforeEach(() => { svc = setup(); svc.registerTenant('t-guide', '导玩品牌') })

  it('获取预设主题列表', () => {
    const presets = svc.getPresetThemes()
    expect(presets.length).toBeGreaterThanOrEqual(5)
    expect(presets.map(p => p.id)).toContain('tech')
    expect(presets.map(p => p.id)).toContain('restaurant')
  })
})

describe('🎯运行专员 brand-custom 扩展测试', () => {
  let svc: BrandCustomService
  beforeEach(() => { svc = setup(); svc.registerTenant('t-ops', '运营品牌') })

  it('获取域名配置', () => {
    const domain = svc.getDomainConfig('t-ops')
    expect(domain).not.toBeNull()
    expect(domain!.sslEnabled).toBe(false)
  })

  it('不存在的租户域名配置返回 null', () => {
    expect(svc.getDomainConfig('no-such')).toBeNull()
  })
})

describe('🤝团建 brand-custom 扩展测试', () => {
  let svc: BrandCustomService
  beforeEach(() => { svc = setup(); svc.registerTenant('t-team', '团建品牌') })

  it('设置并获取邮件模板', () => {
    svc.setEmailTemplate('t-team', { templateType: 'welcome', subject: '欢迎 {{name}}', htmlContent: '<h1>欢迎</h1>', textContent: '欢迎' })
    const tmpl = svc.getEmailTemplate('t-team', 'welcome')
    expect(tmpl).not.toBeNull()
    expect(tmpl!.subject).toBe('欢迎 {{name}}')
  })

  it('渲染邮件模板替换变量', () => {
    svc.setEmailTemplate('t-team', { templateType: 'order_confirm', subject: '订单 {{orderId}}', htmlContent: '订单 {{orderId}} 已确认', textContent: '订单 {{orderId}}' })
    const rendered = svc.renderEmail('t-team', 'order_confirm', { orderId: 'ORD-123' })
    expect(rendered.subject).toBe('订单 ORD-123')
    expect(rendered.html).toContain('ORD-123')
  })

  it('获取不存在的模板返回 null', () => {
    const tmpl = svc.getEmailTemplate('t-team', 'marketing')
    expect(tmpl).toBeNull()
  })

  it('渲染不存在的模板抛异常', () => {
    expect(() => svc.renderEmail('t-team', 'marketing', {})).toThrow('Template')
  })
})

describe('📢营销 brand-custom 扩展测试', () => {
  let svc: BrandCustomService
  beforeEach(() => { svc = setup(); svc.registerTenant('t-mkt', '营销品牌') })

  it('预览主题生成 HTML', () => {
    const html = svc.previewTheme({ primaryColor: '#FF0000', brandName: '测试' })
    expect(html).toContain('#FF0000')
    expect(html).toContain('测试')
  })

  it('发送测试邮件返回 true', async () => {
    svc.setEmailTemplate('t-mkt', { templateType: 'marketing', subject: 'Test', htmlContent: '<p>Test</p>', textContent: 'Test' })
    const result = await svc.sendTestEmail('t-mkt', 'marketing', 'test@example.com')
    expect(result).toBe(true)
  })

  it('发送不存在的模板测试邮件返回 false', async () => {
    const result = await svc.sendTestEmail('t-mkt', 'welcome', 'test@example.com')
    expect(result).toBe(false)
  })
})
