/**
 * brand-custom controller spec test
 * Tests controller routes with service integration
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
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

  describe('registerTenant', () => {
    it('should register a new tenant', () => {
      const result = controller.registerTenant({
        tenantId: 'tenant-1',
        brandName: 'My Brand',
      })

      expect(result.tenantId).toBe('tenant-1')
      expect(result.theme.brandName).toBe('My Brand')
      expect(result.active).toBe(true)
    })
  })

  // ── 列出品牌 ──────────────────────────────────────────────────────────

  describe('listBrands', () => {
    it('should list all registered brands', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand A' })
      controller.registerTenant({ tenantId: 't2', brandName: 'Brand B' })

      const brands = controller.listBrands()

      expect(brands).toHaveLength(2)
      expect(brands.map(b => b.tenantId)).toEqual(['t1', 't2'])
    })

    it('should return empty array when no brands', () => {
      const brands = controller.listBrands()
      expect(brands).toHaveLength(0)
    })
  })

  // ── 设置激活状态 ──────────────────────────────────────────────────────

  describe('setActive', () => {
    it('should activate and deactivate tenant', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })

      const result = controller.setActive('t1', false)
      expect(result.success).toBe(true)

      const tenant = service.listBrands()[0]
      expect(tenant.active).toBe(false)
    })
  })

  // ── 获取主题 ──────────────────────────────────────────────────────────

  describe('getTheme', () => {
    it('should return theme for existing tenant', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'My Brand' })

      const theme = controller.getTheme('t1')

      expect(theme).not.toBeNull()
      expect(theme!.brandName).toBe('My Brand')
    })

    it('should return null for non-existent tenant', () => {
      const theme = controller.getTheme('non-existent')
      expect(theme).toBeNull()
    })
  })

  // ── 应用主题 ──────────────────────────────────────────────────────────

  describe('applyTheme', () => {
    it('should apply a partial theme update', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })

      const theme = controller.applyTheme('t1', {
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
      })

      expect(theme.primaryColor).toBe('#FF0000')
      expect(theme.secondaryColor).toBe('#00FF00')
    })
  })

  // ── 预设主题 ──────────────────────────────────────────────────────────

  describe('getPresetThemes', () => {
    it('should return all preset themes', () => {
      const presets = controller.getPresetThemes()
      expect(presets).toHaveLength(5)
    })
  })

  describe('applyPreset', () => {
    it('should apply tech preset', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })

      const theme = controller.applyPreset('t1', 'tech')

      expect(theme.primaryColor).toBe('#0066FF')
      expect(theme.backgroundColor).toBe('#0F172A')
    })
  })

  // ── CSS 变量生成 ──────────────────────────────────────────────────────

  describe('generateCSSVariables', () => {
    it('should generate CSS variables string', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })

      const result = controller.generateCSSVariables('t1')

      expect(result.css).toContain(':root {')
      expect(result.css).toContain('--brand-primary:')
    })
  })

  // ── 域名配置 ──────────────────────────────────────────────────────────

  describe('configureDomain', () => {
    it('should configure domain and verify', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })

      const config = controller.configureDomain('t1', {
        customDomain: 'shop.brand.com',
        sslEnabled: true,
      })

      expect(config.customDomain).toBe('shop.brand.com')
      expect(config.sslEnabled).toBe(true)
    })
  })

  describe('getDomainConfig', () => {
    it('should return existing domain config', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      controller.configureDomain('t1', { customDomain: 'test.com' })

      const config = controller.getDomainConfig('t1')

      expect(config).not.toBeNull()
      expect(config!.customDomain).toBe('test.com')
    })

    it('should return null for non-existent tenant', () => {
      const config = controller.getDomainConfig('non-existent')
      expect(config).toBeNull()
    })
  })

  describe('generateDNSGuide', () => {
    it('should generate DNS records for configured domain', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })
      controller.configureDomain('t1', {
        customDomain: 'shop.brand.com',
        cdnDomain: 'cdn.brand.com',
      })

      const records = controller.generateDNSGuide('t1')

      expect(records.length).toBeGreaterThan(0)
      expect(records.some(r => r.type === 'A')).toBe(true)
      expect(records.some(r => r.type === 'CNAME')).toBe(true)
    })
  })

  // ── 邮件模板 ──────────────────────────────────────────────────────────

  describe('setEmailTemplate', () => {
    it('should set and retrieve email template', () => {
      controller.registerTenant({ tenantId: 't1', brandName: 'Brand' })

      controller.setEmailTemplate('t1', {
        templateType: 'welcome' as any,
        subject: 'Welcome {{name}}',
        htmlContent: '<p>Welcome {{name}}</p>',
        textContent: 'Welcome {{name}}',
      })

      const tmpl = controller.getEmailTemplate('t1', 'welcome')

      expect(tmpl).not.toBeNull()
      expect(tmpl!.subject).toBe('Welcome {{name}}')
    })
  })

  describe('renderEmail', () => {
    it('should render with variable substitution', () => {
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
      expect(rendered.html).toContain('John')
    })
  })

  describe('sendTestEmail', () => {
    it('should return success when template exists', async () => {
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
  })

  // ── 预览主题 ──────────────────────────────────────────────────────────

  describe('previewTheme', () => {
    it('should generate preview HTML', () => {
      const result = controller.previewTheme({
        primaryColor: '#0066FF',
        brandName: 'Preview Brand',
      })

      expect(result.html).toContain('Preview Brand')
      expect(result.html).toContain('#0066FF')
      expect(result.html).toContain('<!DOCTYPE html>')
    })
  })
})
