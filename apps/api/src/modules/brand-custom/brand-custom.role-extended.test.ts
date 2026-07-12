import { describe, it, expect, beforeEach } from 'vitest'
import { BrandCustomService } from './brand-custom.service'

/**
 * 🐜 自动: [brand-custom] [C] 角色测试补全 (扩展 v2)
 *
 * 8 角色视角扩展测试 —— 每个角色新增:
 * - 多租户隔离验证
 * - 邮件全模板类型覆盖 (RESET_PASSWORD, SVIP_UPGRADE, REFUND)
 * - DNS 多子域名场景
 * - CSS 变量自定义
 * - 品牌激活/停用级联
 * - 强调色/accentColor 单独修改
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */

function setup() {
  const svc = new BrandCustomService()
  return svc
}

// ──────────────────────────────────────────────
// 1. 👔 店长 (store_admin · 门店级)
// ──────────────────────────────────────────────

describe('👔店长 brand-custom 扩展测试', () => {
  let svc: BrandCustomService
  beforeEach(() => { svc = setup() })

  it('注册多个门店品牌后列表正确', () => {
    svc.registerTenant('store-001', '旗舰店')
    svc.registerTenant('store-002', '分店A')
    svc.registerTenant('store-003', '分店B')
    const brands = svc.listBrands()
    expect(brands).toHaveLength(3)
    expect(brands.map(b => b.tenantId)).toEqual(['store-001', 'store-002', 'store-003'])
  })

  it('停用品牌后该门店不再对外展示活动状态', () => {
    svc.registerTenant('store-offline', '停业装修门店')
    expect(svc.getTheme('store-offline')?.brandName).toBe('停业装修门店')
    svc.setActive('store-offline', false)
    const brand = svc.listBrands().find(b => b.tenantId === 'store-offline')
    expect(brand!.active).toBe(false)
  })

  it('无法重复注册同名租户', () => {
    svc.registerTenant('dup-tenant', '第一个品牌')
    expect(() => svc.registerTenant('dup-tenant', '重复品牌')).toThrow(/already registered/)
  })

  it('查询不存在的租户主题返回 null', () => {
    expect(svc.getTheme('no-such')).toBeNull()
  })

  it('停用不存在的租户抛出异常', () => {
    expect(() => svc.setActive('ghost-tenant', false)).toThrow(/not found/)
  })
})

// ──────────────────────────────────────────────
// 2. 🛒 前台 (store_admin · 门店实操)
// ──────────────────────────────────────────────

describe('🛒前台 brand-custom 扩展测试', () => {
  let svc: BrandCustomService
  beforeEach(() => { svc = setup(); svc.registerTenant('t-front', '前台品牌') })

  it('应用预设主题科技蓝后所有颜色正确', () => {
    const theme = svc.applyPreset('t-front', 'tech')
    expect(theme.primaryColor).toBe('#0066FF')
    expect(theme.secondaryColor).toBe('#00D4FF')
    expect(theme.accentColor).toBe('#FF6B35')
    expect(theme.backgroundColor).toBe('#0F172A')
    expect(theme.textColor).toBe('#F8FAFC')
  })

  it('应用不存在的预设主题抛出异常', () => {
    expect(() => svc.applyPreset('t-front', 'no-preset')).toThrow(/not found/)
  })

  it('应用餐饮橙预设主题', () => {
    const theme = svc.applyPreset('t-front', 'restaurant')
    expect(theme.primaryColor).toBe('#FF6B35')
    expect(theme.backgroundColor).toBe('#FFFFFF')
  })

  it('应用娱乐紫预设主题', () => {
    const theme = svc.applyPreset('t-front', 'entertainment')
    expect(theme.primaryColor).toBe('#9B59B6')
    expect(theme.secondaryColor).toBe('#E91E63')
  })

  it('生成 CSS 变量包含全部默认变量', () => {
    const css = svc.generateCSSVariables('t-front')
    expect(css).toContain('--brand-primary')
    expect(css).toContain('--brand-secondary')
    expect(css).toContain('--brand-accent')
    expect(css).toContain('--brand-bg')
    expect(css).toContain('--brand-text')
    expect(css).toContain('--brand-font')
  })

  it('不存在的租户生成 CSS 抛出异常', () => {
    expect(() => svc.generateCSSVariables('no-such')).toThrow(/not found/)
  })
})

// ──────────────────────────────────────────────
// 3. 👥 HR (tenant_admin)
// ──────────────────────────────────────────────

describe('👥HR brand-custom 扩展测试', () => {
  let svc: BrandCustomService
  beforeEach(() => { svc = setup(); svc.registerTenant('t-hr', 'HR品牌') })

  it('单独修改主色后主题中其他颜色不变', () => {
    const before = svc.getTheme('t-hr')
    svc.applyTheme('t-hr', { primaryColor: '#FF0000' })
    const after = svc.getTheme('t-hr')
    expect(after!.primaryColor).toBe('#FF0000')
    expect(after!.secondaryColor).toBe(before!.secondaryColor)
    expect(after!.backgroundColor).toBe(before!.backgroundColor)
  })

  it('单独修改强调色 accentColor', () => {
    svc.applyTheme('t-hr', { accentColor: '#E74C3C' })
    const theme = svc.getTheme('t-hr')
    expect(theme!.accentColor).toBe('#E74C3C')
  })

  it('修改品牌名称后列表展示新名称', () => {
    svc.applyTheme('t-hr', { brandName: 'HR品牌升级版' })
    const theme = svc.getTheme('t-hr')
    expect(theme!.brandName).toBe('HR品牌升级版')
  })

  it('修改 logo URL', () => {
    svc.applyTheme('t-hr', { logo: 'https://cdn.example.com/hr-logo.png' })
    const theme = svc.getTheme('t-hr')
    expect(theme!.logo).toBe('https://cdn.example.com/hr-logo.png')
  })
})

// ──────────────────────────────────────────────
// 4. 🔧 安监 (brand_admin / 域名安全)
// ──────────────────────────────────────────────

describe('🔧安监 brand-custom 扩展测试', () => {
  let svc: BrandCustomService
  beforeEach(() => { svc = setup(); svc.registerTenant('t-sec', '安全品牌') })

  it('配置完整域名包含全部子域名', () => {
    svc.configureDomain('t-sec', {
      customDomain: 'shop.example.com',
      cdnDomain: 'cdn.example.com',
      apiSubdomain: 'api.example.com',
      webSubdomain: 'www.example.com',
      sslEnabled: true,
    })
    const domain = svc.getDomainConfig('t-sec')
    expect(domain!.customDomain).toBe('shop.example.com')
    expect(domain!.cdnDomain).toBe('cdn.example.com')
    expect(domain!.apiSubdomain).toBe('api.example.com')
    expect(domain!.webSubdomain).toBe('www.example.com')
    expect(domain!.sslEnabled).toBe(true)
  })

  it('切换到非 SSL 模式', () => {
    svc.configureDomain('t-sec', { sslEnabled: true })
    expect(svc.getDomainConfig('t-sec')!.sslEnabled).toBe(true)
    svc.configureDomain('t-sec', { sslEnabled: false })
    expect(svc.getDomainConfig('t-sec')!.sslEnabled).toBe(false)
  })

  it('配置域名后 DNS 记录包含所有类型', () => {
    svc.configureDomain('t-sec', {
      customDomain: 'shop.example.com',
      cdnDomain: 'cdn.example.com',
      apiSubdomain: 'api.example.com',
      webSubdomain: 'www.example.com',
    })
    const records = svc.generateDNSGuide('t-sec')
    expect(records).toHaveLength(4)
    const aRecord = records.find(r => r.type === 'A')
    const cnameRecords = records.filter(r => r.type === 'CNAME')
    expect(aRecord).toBeDefined()
    expect(cnameRecords).toHaveLength(3)
    expect(records.every(r => r.ttl === 300)).toBe(true)
  })

  it('激活/停用已注册租户', () => {
    svc.setActive('t-sec', false)
    const brand = svc.listBrands().find(b => b.tenantId === 't-sec')
    expect(brand!.active).toBe(false)
    svc.setActive('t-sec', true)
    expect(svc.listBrands().find(b => b.tenantId === 't-sec')!.active).toBe(true)
  })

  it('不存在的租户配置域名抛出异常', () => {
    expect(() => svc.configureDomain('ghost', { customDomain: 'fake.com' })).toThrow(/not found/)
  })
})

// ──────────────────────────────────────────────
// 5. 🎮 导玩员 (store_admin · 门店实操)
// ──────────────────────────────────────────────

describe('🎮导玩员 brand-custom 扩展测试', () => {
  let svc: BrandCustomService
  beforeEach(() => { svc = setup(); svc.registerTenant('t-guide', '导玩品牌') })

  it('获取预设主题列表包含全部 5 个主题', () => {
    const presets = svc.getPresetThemes()
    expect(presets).toHaveLength(5)
    const presetIds = presets.map(p => p.id)
    expect(presetIds).toContain('tech')
    expect(presetIds).toContain('restaurant')
    expect(presetIds).toContain('retail')
    expect(presetIds).toContain('entertainment')
    expect(presetIds).toContain('education')
  })

  it('应用教育蓝预设主题', () => {
    svc.applyPreset('t-guide', 'education')
    const theme = svc.getTheme('t-guide')
    expect(theme!.primaryColor).toBe('#3498DB')
    expect(theme!.fontFamily).toBe('Nunito, sans-serif')
  })

  it('多次应用不同预设主题可以切换', () => {
    svc.applyPreset('t-guide', 'tech')
    expect(svc.getTheme('t-guide')!.primaryColor).toBe('#0066FF')
    svc.applyPreset('t-guide', 'retail')
    expect(svc.getTheme('t-guide')!.primaryColor).toBe('#2ECC71')
    expect(svc.getTheme('t-guide')!.backgroundColor).toBe('#F8F9FA')
  })

  it('缺失字体时 CSS 变量使用 Inter 默认值', () => {
    svc.applyTheme('t-guide', { backgroundColor: '#111111' })
    const css = svc.generateCSSVariables('t-guide')
    expect(css).toContain('Inter, sans-serif')
  })
})

// ──────────────────────────────────────────────
// 6. 🎯 运行专员 (operator · 运维)
// ──────────────────────────────────────────────

describe('🎯运行专员 brand-custom 扩展测试', () => {
  let svc: BrandCustomService
  beforeEach(() => { svc = setup(); svc.registerTenant('t-ops', '运营品牌') })

  it('仅配置自定义域名的 DNS', () => {
    svc.configureDomain('t-ops', { customDomain: 'minimal.shop.com' })
    const dns = svc.generateDNSGuide('t-ops')
    expect(dns).toHaveLength(1)
    expect(dns[0].type).toBe('A')
    expect(dns[0].name).toBe('minimal.shop.com')
  })

  it('SSL 默认关闭', () => {
    const domain = svc.getDomainConfig('t-ops')
    expect(domain!.sslEnabled).toBe(false)
    expect(domain!.customDomain).toBeUndefined()
  })

  it('自定义 CSS 变量可以注入', () => {
    svc.applyTheme('t-ops', {
      cssVariables: {
        '--brand-radius': '16px',
        '--brand-shadow': '0 4px 12px rgba(0,0,0,0.1)',
      },
    })
    const css = svc.generateCSSVariables('t-ops')
    expect(css).toContain('--brand-radius: 16px')
    expect(css).toContain('--brand-shadow')
  })

  it('不存在的租户获取域名返回 null', () => {
    expect(svc.getDomainConfig('no-such')).toBeNull()
  })
})

// ──────────────────────────────────────────────
// 7. 🤝 团建 (brand_admin · 邮件 + 活动)
// ──────────────────────────────────────────────

describe('🤝团建 brand-custom 扩展测试', () => {
  let svc: BrandCustomService
  beforeEach(() => { svc = setup(); svc.registerTenant('t-team', '团建品牌') })

  it('设置并获取所有 6 种邮件模板', () => {
    const types = ['welcome', 'order_confirm', 'refund', 'marketing', 'reset_password', 'svip_upgrade'] as const
    for (const type of types) {
      svc.setEmailTemplate('t-team', {
        templateType: type as any,
        subject: `${type} 主题`,
        htmlContent: `<p>${type} 内容</p>`,
        textContent: `${type} 纯文本`,
      })
    }
    for (const type of types) {
      const tmpl = svc.getEmailTemplate('t-team', type as any)
      expect(tmpl).not.toBeNull()
      expect(tmpl!.subject).toBe(`${type} 主题`)
    }
  })

  it('重置密码邮件模板变量替换', () => {
    svc.setEmailTemplate('t-team', {
      templateType: 'reset_password' as any,
      subject: '重置密码 - {{username}}',
      htmlContent: '<p>您好 {{username}}，请点击 <a href="{{link}}">这里</a> 重置密码</p>',
      textContent: '您好 {{username}}，重置链接: {{link}}',
    })
    const rendered = svc.renderEmail('t-team', 'reset_password' as any, {
      username: '张三',
      link: 'https://example.com/reset?token=abc123',
    })
    expect(rendered.subject).toBe('重置密码 - 张三')
    expect(rendered.html).toContain('https://example.com/reset?token=abc123')
    expect(rendered.text).toContain('张三')
  })

  it('SVIP 升级模板渲染', () => {
    svc.setEmailTemplate('t-team', {
      templateType: 'svip_upgrade' as any,
      subject: '{{name}}，恭喜升级 SVIP！',
      htmlContent: '<h1>恭喜 {{name}} 升级为 SVIP</h1><p>新等级: {{level}}</p>',
      textContent: '恭喜 {{name}} 升级，等级: {{level}}',
    })
    const rendered = svc.renderEmail('t-team', 'svip_upgrade' as any, {
      name: '李四',
      level: 'SVIP-铂金',
    })
    expect(rendered.subject).toBe('李四，恭喜升级 SVIP！')
    expect(rendered.html).toContain('SVIP-铂金')
  })

  it('退款模板渲染', () => {
    svc.setEmailTemplate('t-team', {
      templateType: 'refund' as any,
      subject: '退款通知 - 订单 {{orderId}}',
      htmlContent: '<p>订单 {{orderId}} 退款 {{amount}} 元已处理</p>',
      textContent: '订单 {{orderId}} 退款 {{amount}} 元',
    })
    const rendered = svc.renderEmail('t-team', 'refund' as any, {
      orderId: 'ORD-888',
      amount: '299',
    })
    expect(rendered.subject).toBe('退款通知 - 订单 ORD-888')
    expect(rendered.html).toContain('299')
  })

  it('不存在的模板类型返回 null', () => {
    expect(svc.getEmailTemplate('t-team', 'marketing' as any)).toBeNull()
  })

  it('渲染不存在的模板抛出异常', () => {
    expect(() => svc.renderEmail('t-team', 'marketing' as any, {})).toThrow(/not found/)
  })
})

// ──────────────────────────────────────────────
// 8. 📢 营销 (tenant_admin · 营销活动)
// ──────────────────────────────────────────────

describe('📢营销 brand-custom 扩展测试', () => {
  let svc: BrandCustomService
  beforeEach(async () => { svc = setup(); svc.registerTenant('t-mkt', '营销品牌') })

  it('预览主题 HTML 包含品牌名称和主色', () => {
    const html = svc.previewTheme({
      primaryColor: '#FF0000',
      brandName: '大促销',
      accentColor: '#FFD700',
    })
    expect(html).toContain('#FF0000')
    expect(html).toContain('大促销')
    expect(html).toContain('#FFD700')
    expect(html).toContain('主要按钮')
    expect(html).toContain('强调按钮')
  })

  it('预览主题包含色板', () => {
    const html = svc.previewTheme({ primaryColor: '#0066FF', secondaryColor: '#00D4FF' })
    expect(html).toContain('color-swatches')
    expect(html).toContain('#0066FF')
    expect(html).toContain('#00D4FF')
  })

  it('发送测试邮件到已有模板返回 true', async () => {
    svc.setEmailTemplate('t-mkt', {
      templateType: 'marketing' as any,
      subject: '大促来了',
      htmlContent: '<p>限时优惠</p>',
      textContent: '限时优惠',
      senderName: '营销团队',
      senderEmail: 'marketing@example.com',
    })
    const result = await svc.sendTestEmail('t-mkt', 'marketing' as any, 'test@example.com')
    expect(result).toBe(true)
  })

  it('发送到不存在的模板返回 false', async () => {
    const result = await svc.sendTestEmail('t-mkt', 'welcome' as any, 'test@example.com')
    expect(result).toBe(false)
  })

  it('Marketing 活动模板使用自定义发件人', () => {
    svc.setEmailTemplate('t-mkt', {
      templateType: 'marketing' as any,
      subject: '春季促销',
      htmlContent: '<p>促销内容</p>',
      textContent: '促销内容',
      senderName: '营销部',
      senderEmail: 'promo@example.com',
    })
    const tmpl = svc.getEmailTemplate('t-mkt', 'marketing' as any)
    expect(tmpl!.senderName).toBe('营销部')
    expect(tmpl!.senderEmail).toBe('promo@example.com')
  })
})

// ──────────────────────────────────────────────
// 9. 🔒 跨租户隔离 (Tenant Isolation)
// ──────────────────────────────────────────────

describe('🔒跨租户隔离 brand-custom 扩展测试', () => {
  let svc: BrandCustomService
  beforeEach(() => {
    svc = setup()
    svc.registerTenant('tenant-a', 'A门店')
    svc.registerTenant('tenant-b', 'B门店')
  })

  it('租户 A 修改主题不影响租户 B', () => {
    svc.applyTheme('tenant-a', { primaryColor: '#FF0000' })
    const themeA = svc.getTheme('tenant-a')
    const themeB = svc.getTheme('tenant-b')
    expect(themeA!.primaryColor).toBe('#FF0000')
    expect(themeB!.primaryColor).toBe('#0066FF') // 默认值不变
  })

  it('租户 A 配置域名不影响租户 B', () => {
    svc.configureDomain('tenant-a', { customDomain: 'a.shop.com', sslEnabled: true })
    const domainA = svc.getDomainConfig('tenant-a')!
    const domainB = svc.getDomainConfig('tenant-b')!
    expect(domainA.customDomain).toBe('a.shop.com')
    expect(domainA.sslEnabled).toBe(true)
    expect(domainB.customDomain).toBeUndefined()
    expect(domainB.sslEnabled).toBe(false)
  })

  it('租户 A 设置邮件模板不影响租户 B', () => {
    svc.setEmailTemplate('tenant-a', {
      templateType: 'welcome' as any,
      subject: '欢迎来 A 店',
      htmlContent: '<p>欢迎</p>',
      textContent: '欢迎',
    })
    expect(svc.getEmailTemplate('tenant-a', 'welcome' as any)).not.toBeNull()
    expect(svc.getEmailTemplate('tenant-b', 'welcome' as any)).toBeNull()
  })

  it('列表仅返回当前注册的全部租户（无重复/泄露）', () => {
    const brands = svc.listBrands()
    expect(brands).toHaveLength(2)
    expect(brands.map(b => b.tenantId).sort()).toEqual(['tenant-a', 'tenant-b'])
  })
})
