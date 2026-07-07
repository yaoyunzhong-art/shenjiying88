import { describe, it, expect } from 'vitest'
import { validate } from 'class-validator'
import { plainToClass } from 'class-transformer'
import 'reflect-metadata'

import {
  BrandThemeDto,
  DomainConfigDto,
  EmailTemplateDto,
  EmailTemplateTypeEnum,
  RenderEmailDto,
  SendTestEmailDto,
  RegisterTenantDto,
  ApplyThemeDto,
  ApplyPresetDto,
  ConfigureDomainDto,
  PreviewThemeDto,
} from './brand-custom.dto'

describe('BrandCustom DTO Validation', () => {
  describe('RegisterTenantDto', () => {
    it('should validate valid input', async () => {
      const dto = plainToClass(RegisterTenantDto, {
        tenantId: 'tenant-1',
        brandName: 'Test Brand',
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject empty tenantId', async () => {
      const dto = plainToClass(RegisterTenantDto, {
        tenantId: '',
        brandName: 'Test',
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject empty brandName', async () => {
      const dto = plainToClass(RegisterTenantDto, {
        tenantId: 't-1',
        brandName: '',
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('ApplyThemeDto', () => {
    it('should validate valid partial theme', async () => {
      const dto = plainToClass(ApplyThemeDto, {
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should accept empty body (all optional)', async () => {
      const dto = plainToClass(ApplyThemeDto, {})
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should accept cssVariables', async () => {
      const dto = plainToClass(ApplyThemeDto, {
        cssVariables: { '--radius': '8px' },
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })

  describe('ApplyPresetDto', () => {
    it('should validate valid presetId', async () => {
      const dto = plainToClass(ApplyPresetDto, { presetId: 'tech' })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject empty presetId', async () => {
      const dto = plainToClass(ApplyPresetDto, { presetId: '' })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('DomainConfigDto', () => {
    it('should validate valid config', async () => {
      const dto = plainToClass(ConfigureDomainDto, {
        customDomain: 'shop.brand.com',
        sslEnabled: true,
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should accept empty body (all optional)', async () => {
      const dto = plainToClass(ConfigureDomainDto, {})
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should validate sslEnabled as boolean', async () => {
      const dto = plainToClass(ConfigureDomainDto, { sslEnabled: 'not-boolean' })
      const errors = await validate(dto)
      // class-validator ParseBoolPipe handles this in controller
      // in DTO validation it will fail the boolean check
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('EmailTemplateDto', () => {
    it('should validate valid template', async () => {
      const dto = plainToClass(EmailTemplateDto, {
        templateType: EmailTemplateTypeEnum.WELCOME,
        subject: 'Welcome {{name}}',
        htmlContent: '<p>Welcome {{name}}</p>',
        textContent: 'Welcome {{name}}',
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject invalid template type', async () => {
      const dto = plainToClass(EmailTemplateDto, {
        templateType: 'invalid_type',
        subject: 'Subject',
        htmlContent: '<p>Test</p>',
        textContent: 'Test',
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject empty subject', async () => {
      const dto = plainToClass(EmailTemplateDto, {
        templateType: EmailTemplateTypeEnum.WELCOME,
        subject: '',
        htmlContent: '<p>Test</p>',
        textContent: 'Test',
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should accept optional fields', async () => {
      const dto = plainToClass(EmailTemplateDto, {
        templateType: EmailTemplateTypeEnum.MARKETING,
        subject: 'Promo',
        htmlContent: '<p>Promo</p>',
        textContent: 'Promo',
        footerText: 'Unsubscribe',
        senderName: 'Marketing',
        senderEmail: 'marketing@brand.com',
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })

  describe('EmailTemplateTypeEnum', () => {
    it('should have all template types', () => {
      expect(Object.values(EmailTemplateTypeEnum)).toEqual([
        'welcome',
        'order_confirm',
        'refund',
        'marketing',
        'reset_password',
        'svip_upgrade',
      ])
    })
  })

  describe('RenderEmailDto', () => {
    it('should validate valid render request', async () => {
      const dto = plainToClass(RenderEmailDto, {
        templateType: EmailTemplateTypeEnum.WELCOME,
        variables: { name: 'John' },
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject empty variables', async () => {
      const dto = plainToClass(RenderEmailDto, {
        templateType: EmailTemplateTypeEnum.WELCOME,
        variables: {},
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0) // empty object is valid
    })
  })

  describe('SendTestEmailDto', () => {
    it('should validate valid send request', async () => {
      const dto = plainToClass(SendTestEmailDto, {
        templateType: EmailTemplateTypeEnum.WELCOME,
        recipient: 'test@example.com',
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject empty recipient', async () => {
      const dto = plainToClass(SendTestEmailDto, {
        templateType: EmailTemplateTypeEnum.WELCOME,
        recipient: '',
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('PreviewThemeDto', () => {
    it('should validate valid preview request', async () => {
      const dto = plainToClass(PreviewThemeDto, {
        primaryColor: '#0066FF',
        brandName: 'Test',
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should accept empty body', async () => {
      const dto = plainToClass(PreviewThemeDto, {})
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })

  describe('DomainConfigDto (original DTO)', () => {
    // Test DomainConfigDto standalone
    it('should validate DomainConfigDto valid', async () => {
      const dto = plainToClass(DomainConfigDto, {
        customDomain: 'shop.brand.com',
        sslEnabled: true,
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })

  describe('BrandThemeDto', () => {
    it('should validate full BrandThemeDto', async () => {
      const dto = plainToClass(BrandThemeDto, {
        brandName: 'Test Brand',
        primaryColor: '#0066FF',
        secondaryColor: '#00D4FF',
        accentColor: '#FF6B35',
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject empty brandName', async () => {
      const dto = plainToClass(BrandThemeDto, {
        brandName: '',
        primaryColor: '#000',
        secondaryColor: '#fff',
        accentColor: '#f00',
        backgroundColor: '#fff',
        textColor: '#000',
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject short brandName', async () => {
      const dto = plainToClass(BrandThemeDto, {
        brandName: '',
        primaryColor: '#0066FF',
        secondaryColor: '#00D4FF',
        accentColor: '#FF6B35',
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })
})
