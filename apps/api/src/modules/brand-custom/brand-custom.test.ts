import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { BrandCustomService } from './brand-custom.service'

describe('BrandCustomService', () => {
  let service: BrandCustomService

  beforeEach(() => {
    service = new BrandCustomService()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── 注册租户 + 应用主题 ─────────────────────────────────────────────────────

  describe('Tenant Registration and Theme Application', () => {
    it('should register tenant and apply theme', () => {
      // Register tenant
      const tenant = service.registerTenant('tenant-1', 'Test Brand')

      expect(tenant.tenantId).toBe('tenant-1')
      expect(tenant.theme.brandName).toBe('Test Brand')
      expect(tenant.active).toBe(true)

      // Apply theme
      const updatedTheme = service.applyTheme('tenant-1', {
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
        accentColor: '#0000FF',
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
      })

      expect(updatedTheme.primaryColor).toBe('#FF0000')
      expect(updatedTheme.secondaryColor).toBe('#00FF00')

      // Get theme and confirm
      const theme = service.getTheme('tenant-1')
      expect(theme).not.toBeNull()
      expect(theme!.primaryColor).toBe('#FF0000')
      expect(theme!.brandName).toBe('Test Brand')
    })

    it('should throw error when applying theme to non-existent tenant', () => {
      expect(() => service.applyTheme('non-existent', { primaryColor: '#FF0000' }))
        .toThrow('Tenant non-existent not found')
    })

    it('should throw error when getting theme for non-existent tenant', () => {
      expect(service.getTheme('non-existent')).toBeNull()
    })
  })

  // ── generateCSSVariables ────────────────────────────────────────────────────

  describe('generateCSSVariables', () => {
    it('should output correct CSS format', () => {
      service.registerTenant('tenant-css', 'CSS Brand')
      service.applyTheme('tenant-css', {
        primaryColor: '#0066FF',
        secondaryColor: '#00D4FF',
        accentColor: '#FF6B35',
        backgroundColor: '#0F172A',
        textColor: '#F8FAFC',
        fontFamily: 'Inter, sans-serif',
      })

      const css = service.generateCSSVariables('tenant-css')

      expect(css).toContain(':root {')
      expect(css).toContain('--brand-primary: #0066FF;')
      expect(css).toContain('--brand-secondary: #00D4FF;')
      expect(css).toContain('--brand-accent: #FF6B35;')
      expect(css).toContain('--brand-bg: #0F172A;')
      expect(css).toContain('--brand-text: #F8FAFC;')
      expect(css).toContain('--brand-font: Inter, sans-serif;')
      expect(css).toContain('}')
    })

    it('should include custom CSS variables', () => {
      service.registerTenant('tenant-custom-css', 'Custom CSS Brand')
      service.applyTheme('tenant-custom-css', {
        primaryColor: '#0066FF',
        secondaryColor: '#00D4FF',
        accentColor: '#FF6B35',
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
        cssVariables: {
          '--custom-button-radius': '8px',
          '--custom-shadow': '0 4px 6px rgba(0,0,0,0.1)',
        },
      })

      const css = service.generateCSSVariables('tenant-custom-css')

      expect(css).toContain('--custom-button-radius: 8px;')
      expect(css).toContain('--custom-shadow: 0 4px 6px rgba(0,0,0,0.1);')
    })

    it('should throw error for non-existent tenant', () => {
      expect(() => service.generateCSSVariables('non-existent'))
        .toThrow('Tenant non-existent not found')
    })
  })

  // ── 预设主题 ───────────────────────────────────────────────────────────────

  describe('Preset Themes', () => {
    it('should return 5 preset themes', () => {
      const presets = service.getPresetThemes()

      expect(presets).toHaveLength(5)
      expect(presets.map(p => p.id)).toEqual(['tech', 'restaurant', 'retail', 'entertainment', 'education'])
    })

    it('should apply tech preset correctly', () => {
      service.registerTenant('tenant-tech', 'Tech Brand')
      const theme = service.applyPreset('tenant-tech', 'tech')

      expect(theme.primaryColor).toBe('#0066FF')
      expect(theme.secondaryColor).toBe('#00D4FF')
      expect(theme.backgroundColor).toBe('#0F172A')
      expect(theme.textColor).toBe('#F8FAFC')
    })

    it('should apply restaurant preset correctly', () => {
      service.registerTenant('tenant-restaurant', 'Restaurant Brand')
      const theme = service.applyPreset('tenant-restaurant', 'restaurant')

      expect(theme.primaryColor).toBe('#FF6B35')
      expect(theme.secondaryColor).toBe('#F7C59F')
      expect(theme.backgroundColor).toBe('#FFFFFF')
      expect(theme.textColor).toBe('#1A1A1A')
    })

    it('should apply retail preset correctly', () => {
      service.registerTenant('tenant-retail', 'Retail Brand')
      const theme = service.applyPreset('tenant-retail', 'retail')

      expect(theme.primaryColor).toBe('#2ECC71')
      expect(theme.secondaryColor).toBe('#27AE60')
      expect(theme.backgroundColor).toBe('#F8F9FA')
      expect(theme.textColor).toBe('#2C3E50')
    })

    it('should apply entertainment preset correctly', () => {
      service.registerTenant('tenant-entertainment', 'Entertainment Brand')
      const theme = service.applyPreset('tenant-entertainment', 'entertainment')

      expect(theme.primaryColor).toBe('#9B59B6')
      expect(theme.secondaryColor).toBe('#E91E63')
      expect(theme.backgroundColor).toBe('#1A1A2E')
      expect(theme.textColor).toBe('#EAEAEA')
    })

    it('should apply education preset correctly', () => {
      service.registerTenant('tenant-education', 'Education Brand')
      const theme = service.applyPreset('tenant-education', 'education')

      expect(theme.primaryColor).toBe('#3498DB')
      expect(theme.secondaryColor).toBe('#1ABC9C')
      expect(theme.backgroundColor).toBe('#FFFFFF')
      expect(theme.textColor).toBe('#34495E')
    })

    it('should throw error for invalid preset', () => {
      service.registerTenant('tenant-invalid', 'Invalid Brand')
      expect(() => service.applyPreset('tenant-invalid', 'invalid-preset'))
        .toThrow('Preset invalid-preset not found')
    })
  })

  // ── 域名配置 + DNS 指引 ───────────────────────────────────────────────────

  describe('Domain Configuration and DNS Guide', () => {
    it('should configure domain and generate DNS guide with CNAME records', () => {
      service.registerTenant('tenant-domain', 'Domain Brand')
      service.configureDomain('tenant-domain', {
        customDomain: 'shop.brand.com',
        cdnDomain: 'cdn.brand.com',
        apiSubdomain: 'api.brand.com',
        webSubdomain: 'www.brand.com',
        sslEnabled: true,
      })

      // Get domain config
      const domain = service.getDomainConfig('tenant-domain')
      expect(domain).not.toBeNull()
      expect(domain!.customDomain).toBe('shop.brand.com')
      expect(domain!.sslEnabled).toBe(true)

      // Generate DNS guide
      const dnsGuide = service.generateDNSGuide('tenant-domain')

      expect(dnsGuide).toHaveLength(4)
      expect(dnsGuide.find(r => r.type === 'A' && r.name === 'shop.brand.com')).toBeDefined()
      expect(dnsGuide.find(r => r.type === 'CNAME' && r.name === 'cdn.brand.com')).toBeDefined()
      expect(dnsGuide.find(r => r.type === 'CNAME' && r.name === 'api.brand.com')).toBeDefined()
      expect(dnsGuide.find(r => r.type === 'CNAME' && r.name === 'www.brand.com')).toBeDefined()
    })

    it('should return empty DNS guide when no domains configured', () => {
      service.registerTenant('tenant-no-domain', 'No Domain Brand')
      const dnsGuide = service.generateDNSGuide('tenant-no-domain')

      expect(dnsGuide).toHaveLength(0)
    })

    it('should return null for non-existent tenant domain config', () => {
      expect(service.getDomainConfig('non-existent')).toBeNull()
    })

    it('should throw error for non-existent tenant in generateDNSGuide', () => {
      expect(() => service.generateDNSGuide('non-existent'))
        .toThrow('Tenant non-existent not found')
    })
  })

  // ── 邮件模板创建 + 渲染变量替换 ─────────────────────────────────────────────

  describe('Email Template Creation and Rendering', () => {
    beforeEach(() => {
      service.registerTenant('tenant-email', 'Email Brand')
    })

    it('should create and get email template', () => {
      const template = service.setEmailTemplate('tenant-email', {
        templateType: 'welcome',
        subject: 'Welcome {{user_name}} to {{brand_name}}!',
        htmlContent: '<h1>Welcome {{user_name}}!</h1><p>Thank you for joining {{brand_name}}.</p>',
        textContent: 'Welcome {{user_name}}! Thank you for joining {{brand_name}}.',
        footerText: 'Best regards',
        senderName: 'Brand Team',
        senderEmail: 'hello@brand.com',
      })

      expect(template.brandId).toBeDefined()
      expect(template.templateType).toBe('welcome')

      const retrieved = service.getEmailTemplate('tenant-email', 'welcome')
      expect(retrieved).not.toBeNull()
      expect(retrieved!.subject).toBe('Welcome {{user_name}} to {{brand_name}}!')
    })

    it('should render email with variable substitution', () => {
      service.setEmailTemplate('tenant-email', {
        templateType: 'order_confirm',
        subject: 'Order {{order_id}} Confirmed',
        htmlContent: '<p>Dear {{user_name}}, your order {{order_id}} for {{amount}} has been confirmed.</p>',
        textContent: 'Dear {{user_name}}, your order {{order_id}} for {{amount}} has been confirmed.',
      })

      const rendered = service.renderEmail('tenant-email', 'order_confirm', {
        user_name: 'John Doe',
        order_id: 'ORD-12345',
        amount: '$99.99',
      })

      expect(rendered.subject).toBe('Order ORD-12345 Confirmed')
      expect(rendered.html).toBe('<p>Dear John Doe, your order ORD-12345 for $99.99 has been confirmed.</p>')
      expect(rendered.text).toBe('Dear John Doe, your order ORD-12345 for $99.99 has been confirmed.')
    })

    it('should replace all variables in renderEmail', () => {
      service.setEmailTemplate('tenant-email', {
        templateType: 'welcome',
        subject: '{{brand_name}} - Welcome {{user_name}}!',
        htmlContent: '<p>{{user_name}}, welcome to {{brand_name}}! Order: {{order_id}}, Amount: {{amount}}, Date: {{date}}</p>',
        textContent: '{{user_name}}, welcome to {{brand_name}}! Order: {{order_id}}, Amount: {{amount}}, Date: {{date}}',
      })

      const rendered = service.renderEmail('tenant-email', 'welcome', {
        user_name: 'Alice',
        brand_name: 'Super Brand',
        order_id: 'ORD-999',
        amount: '$150.00',
        date: '2024-01-15',
      })

      expect(rendered.subject).toBe('Super Brand - Welcome Alice!')
      expect(rendered.html).toContain('Alice')
      expect(rendered.html).toContain('Super Brand')
      expect(rendered.html).toContain('ORD-999')
      expect(rendered.html).toContain('$150.00')
      expect(rendered.html).toContain('2024-01-15')
      expect(rendered.html).not.toContain('{{')
    })

    it('should return null for non-existent template', () => {
      expect(service.getEmailTemplate('tenant-email', 'welcome')).toBeNull()
    })

    it('should throw error when rendering non-existent template', () => {
      expect(() => service.renderEmail('tenant-email', 'welcome', {}))
        .toThrow('Template welcome not found for tenant tenant-email')
    })
  })

  // ── sendTestEmail ───────────────────────────────────────────────────────────

  describe('sendTestEmail', () => {
    it('should return boolean true when template exists', async () => {
      service.registerTenant('tenant-test-email', 'Test Email Brand')
      service.setEmailTemplate('tenant-test-email', {
        templateType: 'welcome',
        subject: 'Welcome',
        htmlContent: '<p>Welcome!</p>',
        textContent: 'Welcome!',
      })

      const result = await service.sendTestEmail('tenant-test-email', 'welcome', 'test@example.com')

      expect(result).toBe(true)
    })

    it('should return boolean false when template does not exist', async () => {
      service.registerTenant('tenant-no-template', 'No Template Brand')

      const result = await service.sendTestEmail('tenant-no-template', 'welcome', 'test@example.com')

      expect(result).toBe(false)
    })
  })

  // ── 多租户隔离 ─────────────────────────────────────────────────────────────

  describe('Multi-tenant Isolation', () => {
    it('should isolate themes between tenants', () => {
      service.registerTenant('tenant-a', 'Brand A')
      service.registerTenant('tenant-b', 'Brand B')

      service.applyTheme('tenant-a', { primaryColor: '#FF0000', brandName: 'Brand A' })
      service.applyTheme('tenant-b', { primaryColor: '#00FF00', brandName: 'Brand B' })

      const themeA = service.getTheme('tenant-a')
      const themeB = service.getTheme('tenant-b')

      expect(themeA!.primaryColor).toBe('#FF0000')
      expect(themeA!.brandName).toBe('Brand A')
      expect(themeB!.primaryColor).toBe('#00FF00')
      expect(themeB!.brandName).toBe('Brand B')
    })

    it('should isolate email templates between tenants', () => {
      service.registerTenant('tenant-x', 'Brand X')
      service.registerTenant('tenant-y', 'Brand Y')

      service.setEmailTemplate('tenant-x', {
        templateType: 'welcome',
        subject: 'Brand X Welcome',
        htmlContent: '<p>Brand X</p>',
        textContent: 'Brand X',
      })

      service.setEmailTemplate('tenant-y', {
        templateType: 'welcome',
        subject: 'Brand Y Welcome',
        htmlContent: '<p>Brand Y</p>',
        textContent: 'Brand Y',
      })

      const templateX = service.getEmailTemplate('tenant-x', 'welcome')
      const templateY = service.getEmailTemplate('tenant-y', 'welcome')

      expect(templateX!.subject).toBe('Brand X Welcome')
      expect(templateY!.subject).toBe('Brand Y Welcome')
    })

    it('should isolate domains between tenants', () => {
      service.registerTenant('tenant-p', 'Brand P')
      service.registerTenant('tenant-q', 'Brand Q')

      service.configureDomain('tenant-p', { customDomain: 'shop-p.com' })
      service.configureDomain('tenant-q', { customDomain: 'shop-q.com' })

      const domainP = service.getDomainConfig('tenant-p')
      const domainQ = service.getDomainConfig('tenant-q')

      expect(domainP!.customDomain).toBe('shop-p.com')
      expect(domainQ!.customDomain).toBe('shop-q.com')
    })
  })

  // ── listBrands ──────────────────────────────────────────────────────────────

  describe('listBrands', () => {
    it('should return all registered brands', () => {
      service.registerTenant('tenant-1', 'Brand 1')
      service.registerTenant('tenant-2', 'Brand 2')
      service.registerTenant('tenant-3', 'Brand 3')

      const brands = service.listBrands()

      expect(brands).toHaveLength(3)
      expect(brands.map(b => b.tenantId)).toContain('tenant-1')
      expect(brands.map(b => b.tenantId)).toContain('tenant-2')
      expect(brands.map(b => b.tenantId)).toContain('tenant-3')
    })

    it('should return empty array when no brands registered', () => {
      const brands = service.listBrands()
      expect(brands).toHaveLength(0)
    })
  })

  // ── setActive ───────────────────────────────────────────────────────────────

  describe('setActive', () => {
    it('should activate and deactivate tenant', () => {
      const tenant = service.registerTenant('tenant-toggle', 'Toggle Brand')
      expect(tenant.active).toBe(true)

      service.setActive('tenant-toggle', false)
      expect(service.listBrands()[0].active).toBe(false)

      service.setActive('tenant-toggle', true)
      expect(service.listBrands()[0].active).toBe(true)
    })

    it('should throw error for non-existent tenant', () => {
      expect(() => service.setActive('non-existent', false))
        .toThrow('Tenant non-existent not found')
    })
  })

  // ── previewTheme ────────────────────────────────────────────────────────────

  describe('previewTheme', () => {
    it('should output HTML snippet', () => {
      const html = service.previewTheme({
        primaryColor: '#0066FF',
        secondaryColor: '#00D4FF',
        accentColor: '#FF6B35',
        backgroundColor: '#0F172A',
        textColor: '#F8FAFC',
        fontFamily: 'Inter, sans-serif',
        brandName: 'Test Brand',
      })

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('Test Brand')
      expect(html).toContain('#0066FF')
      expect(html).toContain('Inter, sans-serif')
      expect(html).toContain('preview-card')
      expect(html).toContain('preview-button')
    })

    it('should use default values for missing theme properties', () => {
      const html = service.previewTheme({})

      expect(html).toContain('Brand Name') // default brand name
      expect(html).toContain('#0066FF') // default primary color
    })

    it('should handle logo in preview', () => {
      const html = service.previewTheme({
        logo: 'https://example.com/logo.png',
        brandName: 'Logo Brand',
      })

      expect(html).toContain('https://example.com/logo.png')
      expect(html).toContain('img')
    })
  })

  // ── Error Handling ──────────────────────────────────────────────────────────

  describe('Error Handling', () => {
    it('should throw when registering duplicate tenant', () => {
      service.registerTenant('tenant-dup', 'Duplicate Brand')
      expect(() => service.registerTenant('tenant-dup', 'Duplicate Brand 2'))
        .toThrow('Tenant tenant-dup already registered')
    })

    it('should throw when configuring domain for non-existent tenant', () => {
      expect(() => service.configureDomain('non-existent', { customDomain: 'test.com' }))
        .toThrow('Tenant non-existent not found')
    })

    it('should throw when setting email template for non-existent tenant', () => {
      expect(() => service.setEmailTemplate('non-existent', {
        templateType: 'welcome',
        subject: 'Test',
        htmlContent: '<p>Test</p>',
        textContent: 'Test',
      })).toThrow('Tenant non-existent not found')
    })
  })
})
