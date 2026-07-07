/**
 * brand-custom controller 单元测试
 * 正例 + 反例 + 边界
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

  // ── 注册租户 ──────────────────────────────────────────────────────────

  describe('POST /brand-custom/tenants (registerTenant)', () => {
    it('正例: 注册新租户成功', () => {
      const result = controller.registerTenant({
        tenantId: 'tenant-1',
        brandName: '测试品牌',
      })

      expect(result.tenantId).toBe('tenant-1')
      expect(result.theme.brandName).toBe('测试品牌')
      expect(result.active).toBe(true)
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.theme).toHaveProperty('primaryColor')
      expect(result.theme).toHaveProperty('secondaryColor')
    })

    it('反例: 重复租户 ID 应抛出错误', () => {
      controller.registerTenant({ tenantId: 'dup', brandName: 'First' })

      expect(() => {
        controller.registerTenant({ tenantId: 'dup', brandName: 'Second' })
      }).toThrow('already registered')
    })

    it('边界: 空 brandName 仍可注册（controller 未拒绝空值）', () => {
      const result = controller.registerTenant({ tenantId: 'no-name', brandName: '' })
      expect(result.tenantId).toBe('no-name')
    })
  })

  // ── 列出品牌 ──────────────────────────────────────────────────────────

  describe('GET /brand-custom/tenants (listBrands)', () => {
    it('正例: 列出所有已注册品牌', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌一' })
      controller.registerTenant({ tenantId: 't2', brandName: '品牌二' })
      controller.registerTenant({ tenantId: 't3', brandName: '品牌三' })

      const brands = controller.listBrands()
      expect(brands).toHaveLength(3)
      expect(brands.map(b => b.tenantId)).toEqual(['t1', 't2', 't3'])
    })

    it('边界: 无品牌时返回空数组', () => {
      const brands = controller.listBrands()
      expect(brands).toEqual([])
    })

    it('边界: 注册后立即删除不存在的场景—空列表仍安全', () => {
      expect(controller.listBrands()).toHaveLength(0)
    })
  })

  // ── 设置激活状态 ──────────────────────────────────────────────────────

  describe('PATCH /brand-custom/tenants/:tenantId/active (setActive)', () => {
    it('正例: 成功激活/停用租户', () => {
      controller.registerTenant({ tenantId: 't1', brandName: '品牌' })

      let result = controller.setActive('t1', false)
      expect(result.success).toBe(true)
      expect(service.listBrands()[0].active).toBe(false)

      result = controller.setActive('t1', true)
      expect(result.success).toBe(true)
      expect(service.listBrands()[0].active).toBe(true)
    })

    it('反例: 不存在的租户应抛出错误', () => {
      expect(() => {
        controller.setActive('non-existent', false)
      }).toThrow('not found')
    })
  })

  // ── 获取主题 ──────────────────────────────────────────────────────────

  describe('GET /brand-custom/tenants/:tenantId/theme (getTheme)', () => {
    it('正例: 获取已注册租户的主题', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'MyBrand' })
      const theme = controller.getTheme('t1')
      expect(theme).not.toBeNull()
      expect(theme!.brandName).toBe('MyBrand')
    })

    it('反例: 不存在的租户返回 null', () => {
      const theme = controller.getTheme('non-existent')
      expect(theme).toBeNull()
    })
  })

  // ── 应用主题 ──────────────────────────────────────────────────────────

  describe('PATCH /brand-custom/tenants/:tenantId/theme (applyTheme)', () => {
    it('正例: 部分更新主题颜色', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      const theme = controller.applyTheme('t1', {
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
      })
      expect(theme.primaryColor).toBe('#FF0000')
      expect(theme.secondaryColor).toBe('#00FF00')
      // 未更新的字段保留默认值
      expect(theme.backgroundColor).toBe('#FFFFFF')
    })

    it('正例: 更新包含自定义 CSS 变量', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      const theme = controller.applyTheme('t1', {
        cssVariables: { '--custom-header': '#333' },
      })
      expect(theme.cssVariables).toEqual({ '--custom-header': '#333' })
    })

    it('反例: 不存在的租户抛出错误', () => {
      expect(() => {
        controller.applyTheme('ghost', { primaryColor: '#000' })
      }).toThrow('not found')
    })
  })

  // ── 预设主题 ──────────────────────────────────────────────────────────

  describe('GET /brand-custom/presets (getPresetThemes)', () => {
    it('正例: 返回全部 5 个预设主题', () => {
      const presets = controller.getPresetThemes()
      expect(presets).toHaveLength(5)
      const ids = presets.map(p => p.id)
      expect(ids).toContain('tech')
      expect(ids).toContain('restaurant')
      expect(ids).toContain('retail')
      expect(ids).toContain('entertainment')
      expect(ids).toContain('education')
    })
  })

  describe('POST /brand-custom/tenants/:tenantId/theme/presets/:presetId (applyPreset)', () => {
    it('正例: 应用科技蓝预设主题', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      const theme = controller.applyPreset('t1', 'tech')
      expect(theme.primaryColor).toBe('#0066FF')
      expect(theme.backgroundColor).toBe('#0F172A')
    })

    it('反例: 不存在的预设 ID 抛出错误', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      expect(() => {
        controller.applyPreset('t1', 'nonexistent')
      }).toThrow('not found')
    })

    it('反例: 不存在的租户抛出错误', () => {
      expect(() => {
        controller.applyPreset('ghost', 'tech')
      }).toThrow('not found')
    })
  })

  // ── CSS 变量生成 ──────────────────────────────────────────────────────

  describe('GET /brand-custom/tenants/:tenantId/theme/css (generateCSSVariables)', () => {
    it('正例: 生成 CSS 变量字符串', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      const result = controller.generateCSSVariables('t1')
      expect(result.css).toContain(':root {')
      expect(result.css).toContain('--brand-primary:')
      expect(result.css).toContain('--brand-secondary:')
      expect(result.css).toContain('--brand-bg:')
    })

    it('边界: 包含自定义 CSS 变量也一并生成', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      controller.applyTheme('t1', { cssVariables: { '--custom-var': '#abc' } })
      const result = controller.generateCSSVariables('t1')
      expect(result.css).toContain('--custom-var: #abc')
    })
  })

  // ── 域名配置 ──────────────────────────────────────────────────────────

  describe('PATCH /brand-custom/tenants/:tenantId/domain (configureDomain)', () => {
    it('正例: 配置自定义域名', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      const config = controller.configureDomain('t1', {
        customDomain: 'shop.brand.com',
        sslEnabled: true,
      })
      expect(config.customDomain).toBe('shop.brand.com')
      expect(config.sslEnabled).toBe(true)
    })

    it('反例: 不存在的租户抛出错误', () => {
      expect(() => {
        controller.configureDomain('ghost', { customDomain: 'x.com' })
      }).toThrow('not found')
    })
  })

  describe('GET /brand-custom/tenants/:tenantId/domain (getDomainConfig)', () => {
    it('正例: 返回已配置的域名', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      controller.configureDomain('t1', { customDomain: 'test.com' })
      const config = controller.getDomainConfig('t1')
      expect(config).not.toBeNull()
      expect(config!.customDomain).toBe('test.com')
    })

    it('反例: 不存在的租户返回 null', () => {
      const config = controller.getDomainConfig('ghost')
      expect(config).toBeNull()
    })

    it('边界: 未配置域名时返回默认配置', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      const config = controller.getDomainConfig('t1')
      expect(config).not.toBeNull()
      expect(config!.sslEnabled).toBe(false)
      expect(config!.customDomain).toBeUndefined()
    })
  })

  describe('GET /brand-custom/tenants/:tenantId/domain/dns (generateDNSGuide)', () => {
    it('正例: 生成 DNS 记录', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      controller.configureDomain('t1', {
        customDomain: 'shop.brand.com',
        cdnDomain: 'cdn.brand.com',
        apiSubdomain: 'api.brand.com',
        webSubdomain: 'www.brand.com',
      })
      const records = controller.generateDNSGuide('t1')
      expect(records.length).toBe(4)
      expect(records.filter(r => r.type === 'A')).toHaveLength(1)
      expect(records.filter(r => r.type === 'CNAME')).toHaveLength(3)
    })

    it('边界: 只配了部分域名，DNS 记录相应减少', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      controller.configureDomain('t1', { customDomain: 'shop.brand.com' })
      const records = controller.generateDNSGuide('t1')
      expect(records).toHaveLength(1)
      expect(records[0].type).toBe('A')
    })
  })

  // ── 邮件模板 ──────────────────────────────────────────────────────────

  describe('POST/GET /brand-custom/tenants/:tenantId/email-templates', () => {
    it('正例: 创建并获取邮件模板', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      controller.setEmailTemplate('t1', {
        templateType: 'welcome' as any,
        subject: '欢迎 {{name}}',
        htmlContent: '<p>欢迎 {{name}}</p>',
        textContent: '欢迎 {{name}}',
      })
      const tmpl = controller.getEmailTemplate('t1', 'welcome')
      expect(tmpl).not.toBeNull()
      expect(tmpl!.subject).toBe('欢迎 {{name}}')
      expect(tmpl!.templateType).toBe('welcome')
    })

    it('正例: 更新已存在的模板', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      controller.setEmailTemplate('t1', {
        templateType: 'welcome' as any,
        subject: '旧标题',
        htmlContent: '<p>旧</p>',
        textContent: '旧',
      })
      controller.setEmailTemplate('t1', {
        templateType: 'welcome' as any,
        subject: '新标题',
        htmlContent: '<p>新</p>',
        textContent: '新',
      })
      const tmpl = controller.getEmailTemplate('t1', 'welcome')
      expect(tmpl!.subject).toBe('新标题')
    })

    it('反例: 获取不存在的模板类型返回 null', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      const tmpl = controller.getEmailTemplate('t1', 'order_confirm')
      expect(tmpl).toBeNull()
    })
  })

  // ── 渲染邮件 ──────────────────────────────────────────────────────────

  describe('POST /brand-custom/tenants/:tenantId/email-templates/:type/render (renderEmail)', () => {
    it('正例: 渲染模板替换变量', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      controller.setEmailTemplate('t1', {
        templateType: 'welcome' as any,
        subject: 'Welcome {{name}}',
        htmlContent: '<p>Hello {{name}}</p>',
        textContent: 'Hello {{name}}',
      })
      const rendered = controller.renderEmail('t1', 'welcome', {
        templateType: 'welcome' as any,
        variables: { name: 'John' },
      })
      expect(rendered.subject).toBe('Welcome John')
      expect(rendered.html).toContain('Hello John')
      expect(rendered.text).toBe('Hello John')
    })

    it('边界: 未提供的变量保留占位符', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      controller.setEmailTemplate('t1', {
        templateType: 'welcome' as any,
        subject: 'Hi {{name}} from {{company}}',
        htmlContent: '<p>Hi {{name}}</p>',
        textContent: 'Hi {{name}}',
      })
      const rendered = controller.renderEmail('t1', 'welcome', {
        templateType: 'welcome' as any,
        variables: { name: 'Tom' },
      })
      expect(rendered.subject).toContain('Hi Tom from {{company}}')
    })
  })

  // ── 发送测试邮件 ──────────────────────────────────────────────────────

  describe('POST /brand-custom/tenants/:tenantId/email-templates/:type/test-send (sendTestEmail)', () => {
    it('正例: 模板存在时成功发送', async () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      controller.setEmailTemplate('t1', {
        templateType: 'welcome' as any,
        subject: 'Welcome',
        htmlContent: '<p>Welcome</p>',
        textContent: 'Welcome',
      })
      const result = await controller.sendTestEmail('t1', 'welcome', {
        templateType: 'welcome' as any,
        recipient: 'test@example.com',
      })
      expect(result.success).toBe(true)
    })

    it('边界: 模板不存在时返回失败', async () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      const result = await controller.sendTestEmail('t1', 'refund', {
        templateType: 'refund' as any,
        recipient: 'test@test.com',
      })
      expect(result.success).toBe(false)
    })
  })

  // ── 预览主题 ──────────────────────────────────────────────────────────

  describe('POST /brand-custom/preview (previewTheme)', () => {
    it('正例: 生成完整的预览 HTML', () => {
      const result = controller.previewTheme({
        primaryColor: '#0066FF',
        brandName: '预览品牌',
        backgroundColor: '#F0F0F0',
      })
      expect(result.html).toContain('预览品牌')
      expect(result.html).toContain('#0066FF')
      expect(result.html).toContain('#F0F0F0')
      expect(result.html).toContain('<!DOCTYPE html>')
      expect(result.html).toContain('主要按钮')
      expect(result.html).toContain('强调按钮')
    })

    it('边界: 最少参数也生成合法 HTML', () => {
      const result = controller.previewTheme({})
      expect(result.html).toContain('<!DOCTYPE html>')
      expect(result.html).toContain('Brand Name')
      expect(result.html).toContain('#0066FF') // 默认主色
    })
  })
})
