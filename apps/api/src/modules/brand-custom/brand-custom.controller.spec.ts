/**
 * brand-custom controller spec
 *
 * 全面覆盖 17 个路由端点：
 *   POST/GET/PATCH tenants, GET/POST theme, GET presets, GET/POST domain,
 *   POST/GET email-templates, POST render/test-send, POST preview
 *
 * 策略：直接实例化 Controller + 真实 Service（内存）
 * 正例 + 反例 + 边界全覆盖
 */
import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { BrandCustomController } from './brand-custom.controller'
import { BrandCustomService } from './brand-custom.service'

describe('BrandCustomController', () => {
  let controller: BrandCustomController
  let service: BrandCustomService

  beforeEach(() => {
    service = new BrandCustomService()
    controller = new BrandCustomController(service)
  })

  // ════════════════════════════════════════════════════════
  // 1. POST /brand-custom/tenants — registerTenant
  // ════════════════════════════════════════════════════════
  describe('POST /brand-custom/tenants — registerTenant', () => {
    it('正例: 注册新租户成功', () => {
      const result = controller.registerTenant({
        tenantId: 'tenant-1',
        brandName: '测试品牌',
      })
      expect(result.tenantId).toBe('tenant-1')
      expect(result.theme.brandName).toBe('测试品牌')
      expect(result.theme.primaryColor).toBe('#0066FF')
      expect(result.theme.secondaryColor).toBe('#00D4FF')
      expect(result.active).toBe(true)
      expect(result.createdAt).toBeInstanceOf(Date)
    })

    it('反例: 重复注册同一租户应抛错', () => {
      controller.registerTenant({ tenantId: 'dup', brandName: 'First' })
      expect(() =>
        controller.registerTenant({ tenantId: 'dup', brandName: 'Second' })
      ).toThrow(/already registered/i)
    })

    it('边界: 空字符串 tenantId 应仍可注册（无校验）', () => {
      const result = controller.registerTenant({ tenantId: '', brandName: '空ID' })
      expect(result).toBeDefined()
      expect(result.tenantId).toBe('')
    })

    it('边界: 超长短名称', () => {
      const longName = 'A'.repeat(500)
      const result = controller.registerTenant({
        tenantId: 'long-name',
        brandName: longName,
      })
      expect(result.theme.brandName).toBe(longName)
    })
  })

  // ════════════════════════════════════════════════════════
  // 2. GET /brand-custom/tenants — listBrands
  // ════════════════════════════════════════════════════════
  describe('GET /brand-custom/tenants — listBrands', () => {
    it('正例: 无租户时返回空数组', () => {
      const brands = controller.listBrands()
      expect(brands).toEqual([])
    })

    it('正例: 注册多个后全部列出', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'A' })
      controller.registerTenant({ tenantId: 't2', brandName: 'B' })
      controller.registerTenant({ tenantId: 't3', brandName: 'C' })

      const brands = controller.listBrands()
      expect(brands).toHaveLength(3)
      expect(brands.map(b => b.tenantId)).toEqual(['t1', 't2', 't3'])
    })

    it('边界: 注册后停用再列出，active 状态正确', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Active' })
      controller.registerTenant({ tenantId: 't2', brandName: 'Inactive' })
      service.setActive('t2', false)

      const brands = controller.listBrands()
      expect(brands.find(b => b.tenantId === 't1')!.active).toBe(true)
      expect(brands.find(b => b.tenantId === 't2')!.active).toBe(false)
    })
  })

  // ════════════════════════════════════════════════════════
  // 3. PATCH /brand-custom/tenants/:tenantId/active — setActive
  // ════════════════════════════════════════════════════════
  describe('PATCH /brand-custom/tenants/:tenantId/active — setActive', () => {
    it('正例: 激活/停用品牌', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Test' })

      const deactivateResult = controller.setActive('t1', false)
      expect(deactivateResult.success).toBe(true)
      expect(service.listBrands()[0].active).toBe(false)

      const activateResult = controller.setActive('t1', true)
      expect(activateResult.success).toBe(true)
      expect(service.listBrands()[0].active).toBe(true)
    })

    it('反例: 对不存在的租户设置 active 应抛错', () => {
      expect(() => controller.setActive('nonexistent', false)).toThrow(/not found/i)
    })

    it('边界: 重复设置同一状态', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Test' })
      expect(controller.setActive('t1', false).success).toBe(true)
      expect(controller.setActive('t1', false).success).toBe(true) // 幂等
    })
  })

  // ════════════════════════════════════════════════════════
  // 4. GET /brand-custom/tenants/:tenantId/theme — getTheme
  // ════════════════════════════════════════════════════════
  describe('GET /brand-custom/tenants/:tenantId/theme — getTheme', () => {
    it('正例: 获取已注册租户主题', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌A' })
      const theme = controller.getTheme('t1')
      expect(theme).not.toBeNull()
      expect(theme!.brandName).toBe('品牌A')
      expect(theme!.primaryColor).toBe('#0066FF')
      expect(theme!.secondaryColor).toBe('#00D4FF')
      expect(theme!.accentColor).toBe('#FF6B35')
    })

    it('反例: 不存在的租户返回 null', () => {
      expect(controller.getTheme('nonexistent')).toBeNull()
    })

    it('边界: 注册后应用主题再获取，应返回更新后的值', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '原始' })
      controller.applyTheme('t1', { primaryColor: '#FF0000' })
      const theme = controller.getTheme('t1')
      expect(theme!.primaryColor).toBe('#FF0000')
      expect(theme!.brandName).toBe('原始') // 未覆盖的字段保持不变
    })
  })

  // ════════════════════════════════════════════════════════
  // 5. PATCH /brand-custom/tenants/:tenantId/theme — applyTheme
  // ════════════════════════════════════════════════════════
  describe('PATCH /brand-custom/tenants/:tenantId/theme — applyTheme', () => {
    it('正例: 部分更新主题', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      const updated = controller.applyTheme('t1', {
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
      })
      expect(updated.primaryColor).toBe('#FF0000')
      expect(updated.secondaryColor).toBe('#00FF00')
      expect(updated.accentColor).toBe('#FF6B35') // 未覆盖保留
    })

    it('反例: 对不存在的租户应用主题应抛错', () => {
      expect(() =>
        controller.applyTheme('nonexistent', { primaryColor: '#000' })
      ).toThrow(/not found/i)
    })

    it('边界: 空更新对象（不变更任何值）', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      const theme = controller.applyTheme('t1', {})
      expect(theme.primaryColor).toBe('#0066FF')
      expect(theme.brandName).toBe('品牌')
    })

    it('边界: 全量更新所有可配置字段', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '原始' })
      const updated = controller.applyTheme('t1', {
        brandName: '新品牌',
        logo: 'https://example.com/logo.png',
        favicon: 'https://example.com/favicon.ico',
        primaryColor: '#111111',
        secondaryColor: '#222222',
        accentColor: '#333333',
        fontFamily: 'Arial',
        backgroundColor: '#444444',
        textColor: '#555555',
        cssVariables: { '--custom': '#666' },
      })
      expect(updated.brandName).toBe('新品牌')
      expect(updated.logo).toBe('https://example.com/logo.png')
      expect(updated.favicon).toBe('https://example.com/favicon.ico')
      expect(updated.primaryColor).toBe('#111111')
      expect(updated.secondaryColor).toBe('#222222')
      expect(updated.accentColor).toBe('#333333')
      expect(updated.fontFamily).toBe('Arial')
      expect(updated.backgroundColor).toBe('#444444')
      expect(updated.textColor).toBe('#555555')
      expect(updated.cssVariables).toEqual({ '--custom': '#666' })
    })
  })

  // ════════════════════════════════════════════════════════
  // 6. POST /brand-custom/tenants/:tenantId/theme/presets/:presetId — applyPreset
  // ════════════════════════════════════════════════════════
  describe('POST /brand-custom/tenants/:tenantId/theme/presets/:presetId — applyPreset', () => {
    it('正例: 应用科技蓝预设主题', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      const theme = controller.applyPreset('t1', 'tech')
      expect(theme.primaryColor).toBe('#0066FF')
      expect(theme.secondaryColor).toBe('#00D4FF')
      expect(theme.backgroundColor).toBe('#0F172A')
      expect(theme.textColor).toBe('#F8FAFC')
      expect(theme.fontFamily).toBe('Inter, sans-serif')
    })

    it('正例: 应用餐饮橙预设主题', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      const theme = controller.applyPreset('t1', 'restaurant')
      expect(theme.primaryColor).toBe('#FF6B35')
      expect(theme.backgroundColor).toBe('#FFFFFF')
      expect(theme.fontFamily).toBe('Roboto, sans-serif')
    })

    it('反例: 应用不存在的预设应抛错', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      expect(() => controller.applyPreset('t1', 'nonexistent')).toThrow(
        /preset.*not found/i
      )
    })

    it('反例: 不存在的租户应用预设应抛错', () => {
      expect(() => controller.applyPreset('nonexistent', 'tech')).toThrow(
        /not found/i
      )
    })
  })

  // ════════════════════════════════════════════════════════
  // 7. GET /brand-custom/presets — getPresetThemes
  // ════════════════════════════════════════════════════════
  describe('GET /brand-custom/presets — getPresetThemes', () => {
    it('正例: 应返回 5 个预设主题', () => {
      const presets = controller.getPresetThemes()
      expect(presets).toHaveLength(5)
      const ids = presets.map(p => p.id)
      expect(ids).toContain('tech')
      expect(ids).toContain('restaurant')
      expect(ids).toContain('retail')
      expect(ids).toContain('entertainment')
      expect(ids).toContain('education')
    })

    it('正例: 每个预设主题都包含 id、name 和 theme', () => {
      const presets = controller.getPresetThemes()
      for (const preset of presets) {
        expect(preset).toHaveProperty('id')
        expect(preset).toHaveProperty('name')
        expect(preset).toHaveProperty('theme')
        expect(preset.theme).toHaveProperty('primaryColor')
      }
    })
  })

  // ════════════════════════════════════════════════════════
  // 8. GET /brand-custom/tenants/:tenantId/theme/css — generateCSSVariables
  // ════════════════════════════════════════════════════════
  describe('GET /brand-custom/tenants/:tenantId/theme/css — generateCSSVariables', () => {
    it('正例: 生成 CSS 变量字符串', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      const { css } = controller.generateCSSVariables('t1')
      expect(css).toContain(':root')
      expect(css).toContain('--brand-primary: #0066FF')
      expect(css).toContain('--brand-secondary: #00D4FF')
      expect(css).toContain('--brand-accent: #FF6B35')
      expect(css).toContain('--brand-bg: #FFFFFF')
      expect(css).toContain('--brand-text: #1A1A1A')
      expect(css).toContain('--brand-font: Inter, sans-serif')
    })

    it('正例: 自定义 CSS 变量应合并到输出中', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      controller.applyTheme('t1', {
        cssVariables: { '--custom-header': '#999', '--custom-footer': '#888' },
      })
      const { css } = controller.generateCSSVariables('t1')
      expect(css).toContain('--custom-header: #999')
      expect(css).toContain('--custom-footer: #888')
    })

    it('反例: 不存在的租户应抛错', () => {
      expect(() => controller.generateCSSVariables('nonexistent')).toThrow(
        /not found/i
      )
    })
  })

  // ════════════════════════════════════════════════════════
  // 9. GET /brand-custom/tenants/:tenantId/domain — getDomainConfig
  // ════════════════════════════════════════════════════════
  describe('GET /brand-custom/tenants/:tenantId/domain — getDomainConfig', () => {
    it('正例: 获取注册租户的默认域名配置', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      const domain = controller.getDomainConfig('t1')
      expect(domain).not.toBeNull()
      expect(domain!.sslEnabled).toBe(false)
      expect(domain!.brandId).toBeTruthy()
    })

    it('反例: 不存在的租户返回 null', () => {
      expect(controller.getDomainConfig('nonexistent')).toBeNull()
    })
  })

  // ════════════════════════════════════════════════════════
  // 10. PATCH /brand-custom/tenants/:tenantId/domain — configureDomain
  // ════════════════════════════════════════════════════════
  describe('PATCH /brand-custom/tenants/:tenantId/domain — configureDomain', () => {
    it('正例: 配置自定义域名', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      const domain = controller.configureDomain('t1', {
        customDomain: 'shop.example.com',
        sslEnabled: true,
      })
      expect(domain.customDomain).toBe('shop.example.com')
      expect(domain.sslEnabled).toBe(true)
    })

    it('正例: 配置完整域名字段', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      const domain = controller.configureDomain('t1', {
        customDomain: 'myshop.com',
        cdnDomain: 'cdn.myshop.com',
        apiSubdomain: 'api.myshop.com',
        webSubdomain: 'www.myshop.com',
        sslEnabled: true,
        sslCertId: 'cert-123',
      })
      expect(domain.customDomain).toBe('myshop.com')
      expect(domain.cdnDomain).toBe('cdn.myshop.com')
      expect(domain.apiSubdomain).toBe('api.myshop.com')
      expect(domain.webSubdomain).toBe('www.myshop.com')
      expect(domain.sslCertId).toBe('cert-123')
    })

    it('反例: 不存在的租户应抛错', () => {
      expect(() =>
        controller.configureDomain('nonexistent', { customDomain: 'x.com' })
      ).toThrow(/not found/i)
    })

    it('边界: 空配置不变更已有值', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      const domain = controller.configureDomain('t1', {})
      expect(domain.sslEnabled).toBe(false)
      expect(domain.customDomain).toBeUndefined()
    })
  })

  // ════════════════════════════════════════════════════════
  // 11. GET /brand-custom/tenants/:tenantId/domain/dns — generateDNSGuide
  // ════════════════════════════════════════════════════════
  describe('GET /brand-custom/tenants/:tenantId/domain/dns — generateDNSGuide', () => {
    it('正例: 配置字段产生对应 DNS 记录', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      controller.configureDomain('t1', {
        customDomain: 'myshop.com',
        cdnDomain: 'cdn.myshop.com',
        apiSubdomain: 'api.myshop.com',
        webSubdomain: 'www.myshop.com',
      })
      const records = controller.generateDNSGuide('t1')
      expect(records).toHaveLength(4)
      expect(records[0].type).toBe('A')
      expect(records[0].name).toBe('myshop.com')
      expect(records[1].type).toBe('CNAME')
      expect(records[1].name).toBe('cdn.myshop.com')
    })

    it('反例: 未配置域名时仍返回已配置项', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      controller.configureDomain('t1', { customDomain: 'myshop.com' })
      const records = controller.generateDNSGuide('t1')
      expect(records).toHaveLength(1)
      expect(records[0].type).toBe('A')
    })

    it('反例: 不存在的租户应抛错', () => {
      expect(() => controller.generateDNSGuide('nonexistent')).toThrow(
        /not found/i
      )
    })
  })

  // ════════════════════════════════════════════════════════
  // 12. POST /brand-custom/tenants/:tenantId/email-templates — setEmailTemplate
  // ════════════════════════════════════════════════════════
  describe('POST /brand-custom/tenants/:tenantId/email-templates — setEmailTemplate', () => {
    it('正例: 创建欢迎邮件模板', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      const tmpl = controller.setEmailTemplate('t1', {
        templateType: 'welcome',
        subject: '欢迎 {{name}}',
        htmlContent: '<p>Hi {{name}}</p>',
        textContent: 'Hi {{name}}',
      })
      expect(tmpl.templateType).toBe('welcome')
      expect(tmpl.subject).toBe('欢迎 {{name}}')
      expect(tmpl.brandId).toBeTruthy()
    })

    it('正例: 覆盖已有模板', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      controller.setEmailTemplate('t1', {
        templateType: 'welcome',
        subject: '原主题',
        htmlContent: '<p>旧</p>',
        textContent: '旧',
      })
      const updated = controller.setEmailTemplate('t1', {
        templateType: 'welcome',
        subject: '新主题',
        htmlContent: '<p>新</p>',
        textContent: '新',
      })
      expect(updated.subject).toBe('新主题')
    })

    it('反例: 不存在的租户应抛错', () => {
      expect(() =>
        controller.setEmailTemplate('nonexistent', {
          templateType: 'welcome',
          subject: 'S',
          htmlContent: 'H',
          textContent: 'T',
        })
      ).toThrow(/not found/i)
    })
  })

  // ════════════════════════════════════════════════════════
  // 13. GET /brand-custom/tenants/:tenantId/email-templates/:templateType — getEmailTemplate
  // ════════════════════════════════════════════════════════
  describe('GET /brand-custom/tenants/:tenantId/email-templates/:templateType — getEmailTemplate', () => {
    it('正例: 获取已创建的模板', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      controller.setEmailTemplate('t1', {
        templateType: 'welcome',
        subject: '欢迎',
        htmlContent: '<p>欢迎</p>',
        textContent: '欢迎',
      })
      const tmpl = controller.getEmailTemplate('t1', 'welcome')
      expect(tmpl).not.toBeNull()
      expect(tmpl!.subject).toBe('欢迎')
    })

    it('反例: 获取不存在的模板类型返回 null', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      const tmpl = controller.getEmailTemplate('t1', 'refund')
      expect(tmpl).toBeNull()
    })

    it('反例: 不存在的租户应抛错', () => {
      expect(() => controller.getEmailTemplate('nonexistent', 'welcome')).toThrow(
        /not found/i
      )
    })
  })

  // ════════════════════════════════════════════════════════
  // 14. POST /brand-custom/tenants/:tenantId/email-templates/:templateType/render — renderEmail
  // ════════════════════════════════════════════════════════
  describe('POST /brand-custom/tenants/:tenantId/email-templates/:templateType/render — renderEmail', () => {
    it('正例: 渲染模板替换变量', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      controller.setEmailTemplate('t1', {
        templateType: 'welcome',
        subject: 'Hi {{name}}',
        htmlContent: '<p>Hello {{name}}, welcome to {{store}}</p>',
        textContent: 'Hello {{name}}',
      })
      const rendered = controller.renderEmail('t1', 'welcome', {
        templateType: 'welcome',
        variables: { name: 'Alice', store: 'Store#1' },
      })
      expect(rendered.subject).toBe('Hi Alice')
      expect(rendered.html).toContain('Hello Alice')
      expect(rendered.html).toContain('Store#1')
      expect(rendered.text).toContain('Hello Alice')
    })

    it('反例: 不存在的租户应抛错', () => {
      expect(() =>
        controller.renderEmail('nonexistent', 'welcome', {
          templateType: 'welcome',
          variables: {},
        })
      ).toThrow(/not found/i)
    })

    it('边界: 变量未提供时保留占位符', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      controller.setEmailTemplate('t1', {
        templateType: 'welcome',
        subject: 'Hello {{name}}',
        htmlContent: '<p>{{missing}}</p>',
        textContent: '{{missing}}',
      })
      const rendered = controller.renderEmail('t1', 'welcome', {
        templateType: 'welcome',
        variables: {},
      })
      expect(rendered.subject).toBe('Hello {{name}}')
      expect(rendered.html).toContain('{{missing}}')
    })

    it('边界: 特殊字符在模板变量中', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      controller.setEmailTemplate('t1', {
        templateType: 'welcome',
        subject: 'Hello {{name}}',
        htmlContent: '<p>{{name}}</p>',
        textContent: '{{name}}',
      })
      const rendered = controller.renderEmail('t1', 'welcome', {
        templateType: 'welcome',
        variables: { name: '<script>alert("xss")</script>' },
      })
      expect(rendered.subject).toContain('<script>')
    })
  })

  // ════════════════════════════════════════════════════════
  // 15. POST /brand-custom/tenants/:tenantId/email-templates/:templateType/test-send — sendTestEmail
  // ════════════════════════════════════════════════════════
  describe('POST /brand-custom/tenants/:tenantId/email-templates/:templateType/test-send — sendTestEmail', () => {
    it('正例: 发送测试邮件到有效收件人', async () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      controller.setEmailTemplate('t1', {
        templateType: 'welcome',
        subject: 'Test',
        htmlContent: '<p>Test</p>',
        textContent: 'Test',
      })
      const result = await controller.sendTestEmail('t1', 'welcome', {
        templateType: 'welcome',
        recipient: 'test@example.com',
      })
      expect(result.success).toBe(true)
    })

    it('反例: 模板不存在时返回 false', async () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })
      const result = await controller.sendTestEmail('t1', 'welcome', {
        templateType: 'welcome',
        recipient: 'test@example.com',
      })
      expect(result.success).toBe(false)
    })
  })

  // ════════════════════════════════════════════════════════
  // 16. POST /brand-custom/preview — previewTheme
  // ════════════════════════════════════════════════════════
  describe('POST /brand-custom/preview — previewTheme', () => {
    it('正例: 生成完整预览 HTML', () => {
      const { html } = controller.previewTheme({
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
        accentColor: '#0000FF',
        brandName: 'Preview',
        backgroundColor: '#F0F0F0',
        textColor: '#333333',
      })
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('Preview')
      expect(html).toContain('#FF0000')
      expect(html).toContain('#00FF00')
      expect(html).toContain('#0000FF')
      expect(html).toContain('#F0F0F0')
      expect(html).toContain('#333333')
      expect(html).toContain('主要按钮')
      expect(html).toContain('强调按钮')
    })

    it('边界: 最少参数使用默认值', () => {
      const { html } = controller.previewTheme({})
      expect(html).toContain('#0066FF') // 默认主色
      expect(html).toContain('#00D4FF') // 默认辅色
      expect(html).toContain('#FF6B35') // 默认强调色
      expect(html).toContain('Brand Name')
    })

    it('边界: 仅传部分字段', () => {
      const { html } = controller.previewTheme({
        primaryColor: '#ABC',
        brandName: '简约',
      })
      expect(html).toContain('#ABC')
      expect(html).toContain('简约')
    })
  })

  // ════════════════════════════════════════════════════════
  // 17. 边缘场景 - 服务层异常传播
  // ════════════════════════════════════════════════════════
  describe('服务层异常传播 — Error propagation', () => {
    it('重复注册时错误信息包含具体租户 ID', () => {
      controller.registerTenant({ tenantId: 'dup-tenant', brandName: '原品牌' })
      expect(() =>
        controller.registerTenant({
          tenantId: 'dup-tenant',
          brandName: '重复品牌',
        })
      ).toThrow(/dup-tenant.*already registered/i)
    })

    it('设置不存在的租户 active 时抛具体错误', () => {
      expect(() =>
        controller.setActive('i-do-not-exist', false)
      ).toThrow(/i-do-not-exist.*not found/i)
    })
  })
})
