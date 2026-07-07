import { describe, it, expect } from 'vitest'
import type {
  BrandTheme,
  DomainConfig,
  EmailTemplate,
  DNSRecord,
  TenantBrand,
  RenderedEmail,
  PresetTheme,
  EmailTemplateType,
} from './brand-custom.entity'

describe('BrandCustom Entity Types', () => {
  describe('BrandTheme', () => {
    it('should allow creating a minimal BrandTheme', () => {
      const theme: BrandTheme = {
        brandId: 'b-1',
        brandName: 'Test Brand',
        logo: 'https://example.com/logo.png',
        favicon: 'https://example.com/favicon.ico',
        primaryColor: '#0066FF',
        secondaryColor: '#00D4FF',
        accentColor: '#FF6B35',
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
      }
      expect(theme.brandId).toBe('b-1')
      expect(theme.brandName).toBe('Test Brand')
      expect(theme.fontFamily).toBeUndefined()
      expect(theme.cssVariables).toBeUndefined()
    })

    it('should allow creating a BrandTheme with all optional fields', () => {
      const theme: BrandTheme = {
        brandId: 'b-2',
        brandName: 'Full Brand',
        logo: 'https://example.com/logo.png',
        favicon: 'https://example.com/favicon.ico',
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
        accentColor: '#0000FF',
        fontFamily: 'Inter, sans-serif',
        backgroundColor: '#0F172A',
        textColor: '#F8FAFC',
        cssVariables: { '--custom-radius': '8px' },
      }
      expect(theme.fontFamily).toBe('Inter, sans-serif')
      expect(theme.cssVariables).toEqual({ '--custom-radius': '8px' })
    })
  })

  describe('DomainConfig', () => {
    it('should create a basic DomainConfig', () => {
      const config: DomainConfig = {
        brandId: 'b-1',
        sslEnabled: false,
      }
      expect(config.customDomain).toBeUndefined()
      expect(config.sslEnabled).toBe(false)
    })

    it('should create a full DomainConfig', () => {
      const config: DomainConfig = {
        brandId: 'b-2',
        customDomain: 'shop.brand.com',
        cdnDomain: 'cdn.brand.com',
        apiSubdomain: 'api.brand.com',
        webSubdomain: 'www.brand.com',
        sslEnabled: true,
        sslCertId: 'cert-123',
      }
      expect(config.customDomain).toBe('shop.brand.com')
      expect(config.sslCertId).toBe('cert-123')
    })
  })

  describe('EmailTemplate', () => {
    it('should create an EmailTemplate', () => {
      const tmpl: EmailTemplate = {
        brandId: 'b-1',
        templateType: 'welcome',
        subject: 'Welcome!',
        htmlContent: '<p>Welcome</p>',
        textContent: 'Welcome',
        senderName: 'Support Team',
        senderEmail: 'support@brand.com',
      }
      expect(tmpl.templateType).toBe('welcome')
      expect(tmpl.senderName).toBe('Support Team')
      expect(tmpl.footerText).toBeUndefined()
    })
  })

  describe('DNSRecord', () => {
    it('should create A record', () => {
      const record: DNSRecord = {
        type: 'A',
        name: 'shop.brand.com',
        value: '1.2.3.4',
        ttl: 300,
      }
      expect(record.type).toBe('A')
    })

    it('should create CNAME record', () => {
      const record: DNSRecord = {
        type: 'CNAME',
        name: 'cdn.brand.com',
        value: 'cdn.provider.com',
        ttl: 600,
      }
      expect(record.type).toBe('CNAME')
    })
  })

  describe('TenantBrand', () => {
    it('should create a full TenantBrand', () => {
      const now = new Date()
      const tenant: TenantBrand = {
        tenantId: 'tenant-1',
        theme: {
          brandId: 'b-1',
          brandName: 'Test',
          logo: '',
          favicon: '',
          primaryColor: '#000',
          secondaryColor: '#fff',
          accentColor: '#f00',
          backgroundColor: '#fff',
          textColor: '#000',
        },
        domain: {
          brandId: 'b-1',
          sslEnabled: false,
        },
        emailTemplates: [],
        active: true,
        createdAt: now,
      }
      expect(tenant.active).toBe(true)
      expect(tenant.emailTemplates).toHaveLength(0)
      expect(tenant.createdAt).toBe(now)
    })
  })

  describe('RenderedEmail', () => {
    it('should create a RenderedEmail', () => {
      const rendered: RenderedEmail = {
        subject: 'Welcome User!',
        html: '<p>Welcome User!</p>',
        text: 'Welcome User!',
      }
      expect(rendered.subject).toBe('Welcome User!')
      expect(rendered.html).toContain('User')
    })
  })

  describe('PresetTheme', () => {
    it('should create a PresetTheme', () => {
      const preset: PresetTheme = {
        id: 'tech',
        name: '科技蓝',
        theme: {
          primaryColor: '#0066FF',
          backgroundColor: '#0F172A',
        },
      }
      expect(preset.id).toBe('tech')
      expect(preset.theme.primaryColor).toBe('#0066FF')
    })
  })

  describe('EmailTemplateType', () => {
    it('should support all template types', () => {
      const types: EmailTemplateType[] = [
        'welcome',
        'order_confirm',
        'refund',
        'marketing',
        'reset_password',
        'svip_upgrade',
      ]
      expect(types).toHaveLength(6)
    })
  })
})
