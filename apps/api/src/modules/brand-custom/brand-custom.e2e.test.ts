import { describe, it, expect } from 'vitest'
import { BrandCustomController } from './brand-custom.controller'
import { BrandCustomService } from './brand-custom.service'
import { EmailTemplateTypeEnum } from './brand-custom.dto'

/**
 * brand-custom 端到端测试
 * Controller → Service 完整链路
 *
 * 测试覆盖:
 *   - 租户品牌管理（注册 / 列表 / 激活停用）
 *   - 主题定制（获取 / 应用 / 预设 / CSS 变量）
 *   - 域名配置（获取 / 配置 / DNS 指引）
 *   - 邮件模板（创建 / 查询 / 渲染 / 发送）
 *   - 主题预览
 */

describe('brand-custom E2E', () => {
  // ─── 全流程: 注册 → 主题 → 域名 → 邮件 ──────────────────────────

  it('E2E: 注册租户 → 应用主题 → 配置域名 → 邮件模板 完整链路', () => {
    const service = new BrandCustomService()
    const controller = new BrandCustomController(service)

    // Step 1: 注册租户
    const tenant = controller.registerTenant({ tenantId: 'e2e-tenant-001', brandName: 'E2E测试门店' })
    expect(tenant.tenantId).toBe('e2e-tenant-001')
    expect(tenant.theme.brandName).toBe('E2E测试门店')
    expect(tenant.active).toBe(true)

    // Step 2: 应用预设主题 "科技蓝"
    const presetTheme = controller.applyPreset('e2e-tenant-001', 'tech')
    expect(presetTheme.primaryColor).toBe('#0066FF')
    expect(presetTheme.backgroundColor).toBe('#0F172A')

    // Step 3: 自定义主题颜色
    const updatedTheme = controller.applyTheme('e2e-tenant-001', {
      primaryColor: '#FF0000',
      backgroundColor: '#FFFFFF',
    })
    expect(updatedTheme.primaryColor).toBe('#FF0000')
    expect(updatedTheme.backgroundColor).toBe('#FFFFFF')

    // Step 4: 配置域名
    const domainConfig = controller.configureDomain('e2e-tenant-001', {
      customDomain: 'shop.e2e-test.com',
      sslEnabled: true,
    })
    expect(domainConfig.customDomain).toBe('shop.e2e-test.com')
    expect(domainConfig.sslEnabled).toBe(true)

    // Step 5: 创建邮件模板
    const emailTemplate = controller.setEmailTemplate('e2e-tenant-001', {
      templateType: EmailTemplateTypeEnum.WELCOME,
      subject: '欢迎 {{name}} 加入!',
      htmlContent: '<h1>欢迎 {{name}}</h1>',
      textContent: '欢迎 {{name}}',
    })
    expect(emailTemplate.templateType).toBe('welcome')
    expect(emailTemplate.subject).toContain('{{name}}')

    // Step 6: 渲染邮件
    const rendered = controller.renderEmail('e2e-tenant-001', 'welcome', { templateType: EmailTemplateTypeEnum.WELCOME, variables: { name: '张三' } })
    expect(rendered.subject).toBe('欢迎 张三 加入!')
    expect(rendered.html).toContain('张三')
    expect(rendered.text).toContain('张三')
  })

  // ─── 主题 CSS 变量 ─────────────────────────────────────────────

  it('E2E: 主题 CSS 变量生成', () => {
    const service = new BrandCustomService()
    const controller = new BrandCustomController(service)
    controller.registerTenant({ tenantId: 'e2e-css', brandName: 'CSS测试' })
    controller.applyTheme('e2e-css', {
      primaryColor: '#FF6600',
      backgroundColor: '#F5F5F5',
      fontFamily: 'Noto Sans SC',
    })

    const { css } = controller.generateCSSVariables('e2e-css')
    expect(css).toContain('--brand-primary: #FF6600')
    expect(css).toContain('--brand-bg: #F5F5F5')
    expect(css).toContain('--brand-font: Noto Sans SC')
    expect(css).toContain(':root')
  })

  // ─── DNS 指引生成 ─────────────────────────────────────────────

  it('E2E: 域名 DNS 指引生成', () => {
    const service = new BrandCustomService()
    const controller = new BrandCustomController(service)
    controller.registerTenant({ tenantId: 'e2e-dns', brandName: 'DNSTest' })
    controller.configureDomain('e2e-dns', {
      customDomain: 'www.test.com',
      cdnDomain: 'cdn.test.com',
      apiSubdomain: 'api.test.com',
      webSubdomain: 'app.test.com',
    })

    const records = controller.generateDNSGuide('e2e-dns')
    expect(records.length).toBe(4)
    expect(records.some(r => r.type === 'A' && r.name === 'www.test.com')).toBe(true)
    expect(records.some(r => r.type === 'CNAME')).toBe(true)
  })

  // ─── 多种邮件模板管理 ─────────────────────────────────────────

  it('E2E: 多类型邮件模板管理', () => {
    const service = new BrandCustomService()
    const controller = new BrandCustomController(service)
    controller.registerTenant({ tenantId: 'e2e-email', brandName: 'EmailTest' })

    // 创建不同模板
    const types = [
      EmailTemplateTypeEnum.WELCOME,
      EmailTemplateTypeEnum.ORDER_CONFIRM,
      EmailTemplateTypeEnum.REFUND,
      EmailTemplateTypeEnum.MARKETING,
    ] as const

    for (const type of types) {
      controller.setEmailTemplate('e2e-email', {
        templateType: type,
        subject: `[${type}] 通知`,
        htmlContent: `<p>${type}</p>`,
        textContent: type,
      })
    }

    // 读取每个模板
    for (const type of types) {
      const tmpl = controller.getEmailTemplate('e2e-email', type)
      expect(tmpl).not.toBeNull()
      expect(tmpl!.templateType).toBe(type)
    }

    // 不存在的模板返回 null
    const notFound = controller.getEmailTemplate('e2e-email', EmailTemplateTypeEnum.SVIP_UPGRADE)
    expect(notFound).toBeNull()
  })

  // ─── 主题预览 ─────────────────────────────────────────────────

  it('E2E: 主题预览生成 HTML', () => {
    const service = new BrandCustomService()
    const controller = new BrandCustomController(service)

    const { html } = controller.previewTheme({
      brandName: '预览门店',
      primaryColor: '#FF0000',
      backgroundColor: '#FFFFFF',
    })

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('预览门店')
    expect(html).toContain('#FF0000')
    expect(html).toContain('主要按钮')
    expect(html).toContain('强调按钮')
  })

  // ─── 租户激活/停用 ────────────────────────────────────────────

  it('E2E: 租户激活停用管理', () => {
    const service = new BrandCustomService()
    const controller = new BrandCustomController(service)
    controller.registerTenant({ tenantId: 'e2e-activate', brandName: 'ActiveTest' })

    // 默认激活
    const brands = controller.listBrands()
    const tenant = brands.find(b => b.tenantId === 'e2e-activate')
    expect(tenant!.active).toBe(true)

    // 停用
    const deactivateRes = controller.setActive('e2e-activate', false)
    expect(deactivateRes.success).toBe(true)
    const brandsAfter = controller.listBrands()
    expect(brandsAfter.find(b => b.tenantId === 'e2e-activate')!.active).toBe(false)

    // 重新激活
    controller.setActive('e2e-activate', true)
    const brandsReactivated = controller.listBrands()
    expect(brandsReactivated.find(b => b.tenantId === 'e2e-activate')!.active).toBe(true)
  })

  // ─── 预设主题列表 ─────────────────────────────────────────────

  it('E2E: 预设主题列表完整', () => {
    const service = new BrandCustomService()
    const controller = new BrandCustomController(service)

    const presets = controller.getPresetThemes()
    expect(presets.length).toBe(5)
    const presetIds = presets.map(p => p.id)
    expect(presetIds).toContain('tech')
    expect(presetIds).toContain('restaurant')
    expect(presetIds).toContain('retail')
    expect(presetIds).toContain('entertainment')
    expect(presetIds).toContain('education')
  })

  // ─── 发送测试邮件 ─────────────────────────────────────────────

  it('E2E: 发送测试邮件', async () => {
    const service = new BrandCustomService()
    const controller = new BrandCustomController(service)
    controller.registerTenant({ tenantId: 'e2e-send', brandName: 'SendTest' })
    controller.setEmailTemplate('e2e-send', {
      templateType: EmailTemplateTypeEnum.WELCOME,
      subject: 'Test',
      htmlContent: '<p>Test</p>',
      textContent: 'Test',
    })

    const result = await controller.sendTestEmail('e2e-send', 'welcome', { recipient: 'test@example.com', templateType: EmailTemplateTypeEnum.WELCOME })
    expect(result.success).toBe(true)
  })

  // ─── 错误路径: 查找不存在的租户 ──────────────────────────────

  it('E2E: 不存在的租户返回合理错误', () => {
    const service = new BrandCustomService()
    const controller = new BrandCustomController(service)

    // getTheme on non-existent tenant returns null
    const theme = controller.getTheme('non-existent')
    expect(theme).toBeNull()

    // configureDomain on non-existent tenant throws
    expect(() => controller.configureDomain('non-existent', { customDomain: 'x.com' })).toThrow()
  })
})
