import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { BrandCustomController } from './brand-custom.controller'

describe('BrandCustomController metadata', () => {
  it('controller should keep brand-custom path', () => {
    assert.equal(Reflect.getMetadata('path', BrandCustomController), 'brand-custom')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [BrandCustomController.prototype.registerTenant, 1, 'tenants'],
      [BrandCustomController.prototype.listBrands, 0, 'tenants'],
      [BrandCustomController.prototype.setActive, 4, 'tenants/:tenantId/active'],
      [BrandCustomController.prototype.getTheme, 0, 'tenants/:tenantId/theme'],
      [BrandCustomController.prototype.applyTheme, 4, 'tenants/:tenantId/theme'],
      [BrandCustomController.prototype.applyPreset, 1, 'tenants/:tenantId/theme/presets/:presetId'],
      [BrandCustomController.prototype.getPresetThemes, 0, 'presets'],
      [BrandCustomController.prototype.generateCSSVariables, 0, 'tenants/:tenantId/theme/css'],
      [BrandCustomController.prototype.getDomainConfig, 0, 'tenants/:tenantId/domain'],
      [BrandCustomController.prototype.configureDomain, 4, 'tenants/:tenantId/domain'],
      [BrandCustomController.prototype.generateDNSGuide, 0, 'tenants/:tenantId/domain/dns'],
      [BrandCustomController.prototype.setEmailTemplate, 1, 'tenants/:tenantId/email-templates'],
      [BrandCustomController.prototype.getEmailTemplate, 0, 'tenants/:tenantId/email-templates/:templateType'],
      [BrandCustomController.prototype.renderEmail, 1, 'tenants/:tenantId/email-templates/:templateType/render'],
      [BrandCustomController.prototype.sendTestEmail, 1, 'tenants/:tenantId/email-templates/:templateType/test-send'],
      [BrandCustomController.prototype.previewTheme, 1, 'preview'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
