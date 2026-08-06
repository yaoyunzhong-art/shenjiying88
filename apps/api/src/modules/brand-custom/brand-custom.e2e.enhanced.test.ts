/**
 * brand-custom E2E 增强测试
 *
 * 扩充已有 9 个测试到 25+，覆盖：
 *   - 品牌版本管理: create, list, rollback, diff
 *   - 自定义脚本注入: set, get, update, remove, render
 *   - 自定义字体管理: register, list, remove, CSS 生成
 *   - 多语言品牌设置: set, get, list, localizedBrand
 *   - 品牌健康检查: healthCheck, completenessReport
 *   - 边界条件 / 错误路径 / 幂等性
 */

import { describe, it, expect } from 'vitest'
import { BrandCustomService } from './brand-custom.service'
import type { BrandTheme, DomainConfig, InjectScript, CustomFont, LocaleSetting } from './brand-custom.entity'

// ========== helpers ==========

function createService(): BrandCustomService {
  return new BrandCustomService()
}

function registerTestTenant(svc: BrandCustomService, tenantId = 'e2e-tenant'): void {
  svc.registerTenant(tenantId, 'E2E测试门店')
}

function extractService(svc: BrandCustomService) {
  // We use the BrandCustomService directly just like the existing e2e tests
  // use BrandCustomController which delegates to BrandCustomService
  return svc
}

// ═══════════════════════════════════════════════════════════════════════════════
// 品牌版本管理
// ═══════════════════════════════════════════════════════════════════════════════

describe('brand-custom E2E Enhanced - Version Management', () => {
  it('E2E: createVersion creates a snapshot of current theme and domain', () => {
    const svc = createService()
    registerTestTenant(svc)

    const version = svc.createVersion('e2e-tenant', '初始版本')
    expect(version.tenantId).toBe('e2e-tenant')
    expect(version.note).toBe('初始版本')
    expect(version.theme).toBeDefined()
    expect(version.theme.brandName).toBe('E2E测试门店')
    expect(version.domainConfig).toBeDefined()
    expect(version.domainConfig.sslEnabled).toBe(false)
    expect(version.id).toBeDefined()
    expect(version.createdAt).toBeInstanceOf(Date)
  })

  it('E2E: createVersion throws for unknown tenant', () => {
    const svc = createService()
    expect(() => svc.createVersion('nonexistent', 'test')).toThrow('not found')
  })

  it('E2E: listVersions returns empty array for tenant with no versions', () => {
    const svc = createService()
    registerTestTenant(svc)
    const versions = svc.listVersions('e2e-tenant')
    expect(versions).toEqual([])
  })

  it('E2E: listVersions returns all created versions in order', () => {
    const svc = createService()
    registerTestTenant(svc)

    svc.createVersion('e2e-tenant', 'v1')
    svc.createVersion('e2e-tenant', 'v2')
    svc.createVersion('e2e-tenant', 'v3')

    const versions = svc.listVersions('e2e-tenant')
    expect(versions.length).toBe(3)
    expect(versions[0].note).toBe('v1')
    expect(versions[1].note).toBe('v2')
    expect(versions[2].note).toBe('v3')
  })

  it('E2E: rollbackToVersion restores theme to version snapshot', () => {
    const svc = createService()
    registerTestTenant(svc)

    // Create v1 with default theme
    svc.createVersion('e2e-tenant', '默认主题')

    // Modify theme
    svc.applyTheme('e2e-tenant', {
      primaryColor: '#FF0000',
      backgroundColor: '#000000',
      fontFamily: 'Arial',
    })

    // Create v2
    svc.createVersion('e2e-tenant', '暗黑主题')

    // Rollback to v1
    const versions = svc.listVersions('e2e-tenant')
    const v1 = versions[0]
    const result = svc.rollbackToVersion('e2e-tenant', v1.id)
    expect(result.theme.primaryColor).toBe('#0066FF') // original default
    expect(result.theme.backgroundColor).toBe('#FFFFFF')
  })

  it('E2E: rollbackToVersion restores domain config to snapshot', () => {
    const svc = createService()
    registerTestTenant(svc)

    // v1 before domain config
    svc.createVersion('e2e-tenant', 'v1-no-domain')

    // Configure domain
    svc.configureDomain('e2e-tenant', { customDomain: 'myshop.com', sslEnabled: true })

    // v2 with domain
    svc.createVersion('e2e-tenant', 'v2-with-domain')

    // Rollback to v1
    const versions = svc.listVersions('e2e-tenant')
    const result = svc.rollbackToVersion('e2e-tenant', versions[0].id)
    expect(result.domain.customDomain).toBeUndefined()
    expect(result.domain.sslEnabled).toBe(false)
  })

  it('E2E: rollbackToVersion throws for invalid version id', () => {
    const svc = createService()
    registerTestTenant(svc)
    svc.createVersion('e2e-tenant', 'v1')
    expect(() => svc.rollbackToVersion('e2e-tenant', 'fake-id')).toThrow('not found')
  })

  it('E2E: getVersionDiff detects theme changes between versions', () => {
    const svc = createService()
    registerTestTenant(svc)

    svc.createVersion('e2e-tenant', '默认')
    svc.applyTheme('e2e-tenant', { primaryColor: '#FF6600', secondaryColor: '#00FF00' })
    svc.createVersion('e2e-tenant', '修改后')

    const [v1, v2] = svc.listVersions('e2e-tenant')
    const diff = svc.getVersionDiff('e2e-tenant', v1.id, v2.id)

    expect(diff.hasChanges).toBe(true)
    expect(diff.themeChanges.length).toBeGreaterThanOrEqual(2)
    const primaryChange = diff.themeChanges.find(c => c.field === 'primaryColor')
    expect(primaryChange).toBeDefined()
    expect(primaryChange!.before).toBe('#0066FF')
    expect(primaryChange!.after).toBe('#FF6600')
  })

  it('E2E: getVersionDiff returns no changes for identical versions', () => {
    const svc = createService()
    registerTestTenant(svc)

    svc.createVersion('e2e-tenant', 'v1')
    svc.createVersion('e2e-tenant', 'v2')

    const [v1, v2] = svc.listVersions('e2e-tenant')
    const diff = svc.getVersionDiff('e2e-tenant', v1.id, v2.id)
    expect(diff.hasChanges).toBe(false)
    expect(diff.themeChanges).toEqual([])
    expect(diff.domainChanges).toEqual([])
  })

  it('E2E: getVersionDiff throws for invalid version id', () => {
    const svc = createService()
    registerTestTenant(svc)
    expect(() => svc.getVersionDiff('e2e-tenant', 'fake1', 'fake2')).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 自定义脚本注入
// ═══════════════════════════════════════════════════════════════════════════════

describe('brand-custom E2E Enhanced - Inject Scripts', () => {
  it('E2E: setInjectScript creates script in head location', () => {
    const svc = createService()
    registerTestTenant(svc)

    const script = svc.setInjectScript('e2e-tenant', {
      location: 'head',
      name: 'analytics',
      content: 'console.log("analytics loaded")',
      enabled: true,
    })

    expect(script.location).toBe('head')
    expect(script.name).toBe('analytics')
    expect(script.enabled).toBe(true)
    expect(script.id).toBeDefined()
    expect(script.createdAt).toBeInstanceOf(Date)
  })

  it('E2E: setInjectScript defaults enabled to true', () => {
    const svc = createService()
    registerTestTenant(svc)

    const script = svc.setInjectScript('e2e-tenant', {
      location: 'body_end',
      name: 'chat-widget',
      content: '// chat widget code',
    })

    expect(script.enabled).toBe(true)
  })

  it('E2E: setInjectScript throws for unknown tenant', () => {
    const svc = createService()
    expect(() => svc.setInjectScript('nonexistent', { location: 'head', name: 'x', content: '//' })).toThrow('not found')
  })

  it('E2E: getInjectScripts returns all scripts', () => {
    const svc = createService()
    registerTestTenant(svc)

    svc.setInjectScript('e2e-tenant', { location: 'head', name: 's1', content: '// s1' })
    svc.setInjectScript('e2e-tenant', { location: 'body_start', name: 's2', content: '// s2' })
    svc.setInjectScript('e2e-tenant', { location: 'body_end', name: 's3', content: '// s3' })

    const scripts = svc.getInjectScripts('e2e-tenant')
    expect(scripts.length).toBe(3)
  })

  it('E2E: getInjectScripts returns empty array for tenant with no scripts', () => {
    const svc = createService()
    registerTestTenant(svc)
    expect(svc.getInjectScripts('e2e-tenant')).toEqual([])
  })

  it('E2E: updateInjectScript updates content and name', () => {
    const svc = createService()
    registerTestTenant(svc)

    const created = svc.setInjectScript('e2e-tenant', { location: 'head', name: 'old', content: 'old content' })
    const updated = svc.updateInjectScript('e2e-tenant', created.id, {
      name: 'new-name',
      content: 'new content',
    })

    expect(updated.name).toBe('new-name')
    expect(updated.content).toBe('new content')
    expect(updated.updatedAt).toBeInstanceOf(Date)
  })

  it('E2E: updateInjectScript toggles enabled flag', () => {
    const svc = createService()
    registerTestTenant(svc)

    const created = svc.setInjectScript('e2e-tenant', { location: 'head', name: 'toggle', content: '//', enabled: true })
    const disabled = svc.updateInjectScript('e2e-tenant', created.id, { enabled: false })
    expect(disabled.enabled).toBe(false)

    const reEnabled = svc.updateInjectScript('e2e-tenant', created.id, { enabled: true })
    expect(reEnabled.enabled).toBe(true)
  })

  it('E2E: updateInjectScript throws for non-existent script', () => {
    const svc = createService()
    registerTestTenant(svc)
    expect(() => svc.updateInjectScript('e2e-tenant', 'bad-id', { name: 'x' })).toThrow()
  })

  it('E2E: removeInjectScript removes a script', () => {
    const svc = createService()
    registerTestTenant(svc)

    const created = svc.setInjectScript('e2e-tenant', { location: 'head', name: 'remove-me', content: '//' })
    svc.removeInjectScript('e2e-tenant', created.id)

    const scripts = svc.getInjectScripts('e2e-tenant')
    expect(scripts.find(s => s.id === created.id)).toBeUndefined()
  })

  it('E2E: removeInjectScript throws for non-existent script', () => {
    const svc = createService()
    registerTestTenant(svc)
    expect(() => svc.removeInjectScript('e2e-tenant', 'bad-id')).toThrow()
  })

  it('E2E: renderInjectScripts returns script tags for head location', () => {
    const svc = createService()
    registerTestTenant(svc)

    svc.setInjectScript('e2e-tenant', { location: 'head', name: 'ga', content: '// Google Analytics\nconsole.log("ga")' })
    const html = svc.renderInjectScripts('e2e-tenant', 'head')
    expect(html).toContain('<script>')
    expect(html).toContain('Google Analytics')
    expect(html).toContain('</script>')
  })

  it('E2E: renderInjectScripts returns empty string when no scripts at location', () => {
    const svc = createService()
    registerTestTenant(svc)
    svc.setInjectScript('e2e-tenant', { location: 'head', name: 's', content: '//' })
    const html = svc.renderInjectScripts('e2e-tenant', 'body_end')
    expect(html).toBe('')
  })

  it('E2E: renderInjectScripts respects enabled flag — disabled scripts excluded', () => {
    const svc = createService()
    registerTestTenant(svc)

    svc.setInjectScript('e2e-tenant', { location: 'head', name: 'enabled', content: '// active', enabled: true })
    const disabled = svc.setInjectScript('e2e-tenant', { location: 'head', name: 'disabled', content: '// inactive', enabled: false })

    const html = svc.renderInjectScripts('e2e-tenant', 'head')
    expect(html).toContain('active')
    expect(html).not.toContain('inactive')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 自定义字体管理
// ═══════════════════════════════════════════════════════════════════════════════

describe('brand-custom E2E Enhanced - Custom Fonts', () => {
  it('E2E: registerCustomFont registers a new font', () => {
    const svc = createService()
    registerTestTenant(svc)

    const font = svc.registerCustomFont('e2e-tenant', {
      name: 'NotoSansSC',
      url: 'https://fonts.example.com/noto-sans.woff2',
      format: 'woff2',
      weight: '400',
      style: 'normal',
    })

    expect(font.name).toBe('NotoSansSC')
    expect(font.format).toBe('woff2')
    expect(font.weight).toBe('400')
    expect(font.id).toBeDefined()
    expect(font.createdAt).toBeInstanceOf(Date)
  })

  it('E2E: registerCustomFont throws for unknown tenant', () => {
    const svc = createService()
    expect(() => svc.registerCustomFont('nonexistent', { name: 'F', url: 'u', format: 'woff' })).toThrow('not found')
  })

  it('E2E: registerCustomFont prevents duplicate font registration', () => {
    const svc = createService()
    registerTestTenant(svc)

    svc.registerCustomFont('e2e-tenant', { name: 'MyFont', url: 'u1', format: 'woff2', weight: '700', style: 'normal' })
    expect(() => svc.registerCustomFont('e2e-tenant', { name: 'MyFont', url: 'u2', format: 'woff2', weight: '700', style: 'normal' })).toThrow('already registered')
  })

  it('E2E: same font name with different weight is allowed', () => {
    const svc = createService()
    registerTestTenant(svc)

    svc.registerCustomFont('e2e-tenant', { name: 'MyFont', url: 'u1', format: 'woff2', weight: '400', style: 'normal' })
    const f2 = svc.registerCustomFont('e2e-tenant', { name: 'MyFont', url: 'u2', format: 'woff2', weight: '700', style: 'normal' })
    expect(f2).toBeDefined()
  })

  it('E2E: listCustomFonts returns all registered fonts', () => {
    const svc = createService()
    registerTestTenant(svc)

    svc.registerCustomFont('e2e-tenant', { name: 'F1', url: 'u1', format: 'woff2' })
    svc.registerCustomFont('e2e-tenant', { name: 'F2', url: 'u2', format: 'ttf' })

    const fonts = svc.listCustomFonts('e2e-tenant')
    expect(fonts.length).toBe(2)
  })

  it('E2E: listCustomFonts returns empty array for no fonts', () => {
    const svc = createService()
    registerTestTenant(svc)
    expect(svc.listCustomFonts('e2e-tenant')).toEqual([])
  })

  it('E2E: removeCustomFont removes a font', () => {
    const svc = createService()
    registerTestTenant(svc)

    const font = svc.registerCustomFont('e2e-tenant', { name: 'TempFont', url: 'u', format: 'woff' })
    svc.removeCustomFont('e2e-tenant', font.id)

    expect(svc.listCustomFonts('e2e-tenant').length).toBe(0)
  })

  it('E2E: removeCustomFont throws for non-existent font', () => {
    const svc = createService()
    registerTestTenant(svc)
    expect(() => svc.removeCustomFont('e2e-tenant', 'bad-id')).toThrow()
  })

  it('E2E: generateFontCSS returns valid @font-face CSS', () => {
    const svc = createService()
    registerTestTenant(svc)

    svc.registerCustomFont('e2e-tenant', { name: 'MyFont', url: 'https://cdn.example.com/myfont.woff2', format: 'woff2', weight: '400', style: 'normal' })
    const css = svc.generateFontCSS('e2e-tenant')

    expect(css).toContain('@font-face')
    expect(css).toContain("font-family: 'MyFont'")
    expect(css).toContain("src: url('https://cdn.example.com/myfont.woff2') format('woff2')")
    expect(css).toContain('font-weight: 400')
    expect(css).toContain('font-style: normal')
    expect(css).toContain('font-display: swap')
  })

  it('E2E: generateFontCSS returns empty string when no fonts', () => {
    const svc = createService()
    registerTestTenant(svc)
    expect(svc.generateFontCSS('e2e-tenant')).toBe('')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 多语言品牌设置
// ═══════════════════════════════════════════════════════════════════════════════

describe('brand-custom E2E Enhanced - Locale Settings', () => {
  it('E2E: setLocale creates new locale setting', () => {
    const svc = createService()
    registerTestTenant(svc)

    const setting = svc.setLocale('e2e-tenant', 'en', 'My Store EN', 'English description')
    expect(setting.locale).toBe('en')
    expect(setting.brandName).toBe('My Store EN')
    expect(setting.description).toBe('English description')
  })

  it('E2E: setLocale updates existing locale', () => {
    const svc = createService()
    registerTestTenant(svc)

    svc.setLocale('e2e-tenant', 'en', 'Initial Name')
    const updated = svc.setLocale('e2e-tenant', 'en', 'Updated Name', 'Updated description')
    expect(updated.brandName).toBe('Updated Name')
    expect(updated.description).toBe('Updated description')
  })

  it('E2E: getLocale returns setting for existing locale', () => {
    const svc = createService()
    registerTestTenant(svc)

    svc.setLocale('e2e-tenant', 'ja', 'ストア', '日本語説明')
    const setting = svc.getLocale('e2e-tenant', 'ja')
    expect(setting).not.toBeNull()
    expect(setting!.brandName).toBe('ストア')
  })

  it('E2E: getLocale returns null for non-existent locale', () => {
    const svc = createService()
    registerTestTenant(svc)
    expect(svc.getLocale('e2e-tenant', 'fr')).toBeNull()
  })

  it('E2E: listLocales returns all configured locales', () => {
    const svc = createService()
    registerTestTenant(svc)

    svc.setLocale('e2e-tenant', 'en', 'Store')
    svc.setLocale('e2e-tenant', 'ja', 'ストア')
    svc.setLocale('e2e-tenant', 'ko', '스토어')

    const locales = svc.listLocales('e2e-tenant')
    expect(locales.length).toBe(3)
    expect(locales.map(l => l.locale)).toContain('en')
    expect(locales.map(l => l.locale)).toContain('ja')
    expect(locales.map(l => l.locale)).toContain('ko')
  })

  it('E2E: listLocales returns empty array for no locales', () => {
    const svc = createService()
    registerTestTenant(svc)
    expect(svc.listLocales('e2e-tenant')).toEqual([])
  })

  it('E2E: getLocalizedBrand returns locale-specific name', () => {
    const svc = createService()
    registerTestTenant(svc)

    svc.setLocale('e2e-tenant', 'zh-CN', '测试门店中文')
    const localized = svc.getLocalizedBrand('e2e-tenant', 'zh-CN')
    expect(localized.brandName).toBe('测试门店中文')
    expect(localized.theme).toBeDefined()
    expect(localized.locale).toBe('zh-CN')
  })

  it('E2E: getLocalizedBrand falls back to default brand name', () => {
    const svc = createService()
    registerTestTenant(svc)

    const localized = svc.getLocalizedBrand('e2e-tenant', 'fr')
    expect(localized.brandName).toBe('E2E测试门店') // default brand name
    expect(localized.theme).toBeDefined()
  })

  it('E2E: setLocale without brandName uses default when creating', () => {
    const svc = createService()
    registerTestTenant(svc)

    const setting = svc.setLocale('e2e-tenant', 'de')
    expect(setting.brandName).toBe('E2E测试门店')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 品牌健康检查
// ═══════════════════════════════════════════════════════════════════════════════

describe('brand-custom E2E Enhanced - Health Check', () => {
  it('E2E: healthCheck returns score for existing tenant', () => {
    const svc = createService()
    registerTestTenant(svc)

    const score = svc.healthCheck('e2e-tenant')
    expect(score.tenantId).toBe('e2e-tenant')
    expect(score.brandName).toBe('E2E测试门店')
    expect(score.completeness).toBeGreaterThanOrEqual(0)
    expect(score.completeness).toBeLessThanOrEqual(100)
    expect(score.checks.length).toBeGreaterThan(0)
  })

  it('E2E: healthCheck throws for unknown tenant', () => {
    const svc = createService()
    expect(() => svc.healthCheck('nonexistent')).toThrow('not found')
  })

  it('E2E: healthCheck detects missing logo', () => {
    const svc = createService()
    registerTestTenant(svc)

    const score = svc.healthCheck('e2e-tenant')
    const logoCheck = score.checks.find(c => c.field === 'logo')
    expect(logoCheck).toBeDefined()
    expect(logoCheck!.status).toBe('fail')
    expect(logoCheck!.message).toContain('未配置')
  })

  it('E2E: healthCheck detects missing email templates', () => {
    const svc = createService()
    registerTestTenant(svc)

    const score = svc.healthCheck('e2e-tenant')
    const emailCheck = score.checks.find(c => c.field === 'emailTemplates')
    expect(emailCheck).toBeDefined()
    expect(emailCheck!.status).toBe('fail')
  })

  it('E2E: healthCheck passes for complete brand setup', () => {
    const svc = createService()
    registerTestTenant(svc)

    // Fill in all the missing pieces
    svc.applyTheme('e2e-tenant', {
      logo: 'https://example.com/logo.png',
      favicon: 'https://example.com/favicon.ico',
      primaryColor: '#FF6600',
      fontFamily: 'Custom Font',
    })

    // @ts-expect-error - accessing private property for testing
    svc.tenants.get('e2e-tenant').domain.customDomain = 'shop.example.com'
    // @ts-expect-error - accessing private property for testing
    svc.tenants.get('e2e-tenant').domain.sslEnabled = true

    svc.setEmailTemplate('e2e-tenant', {
      templateType: 'welcome',
      subject: 'Welcome',
      htmlContent: '<h1>Welcome</h1>',
      textContent: 'Welcome',
    })
    svc.setEmailTemplate('e2e-tenant', {
      templateType: 'order_confirm',
      subject: 'Order Confirmed',
      htmlContent: '<h1>Confirmed</h1>',
      textContent: 'Confirmed',
    })

    const score = svc.healthCheck('e2e-tenant')
    const failCount = score.checks.filter(c => c.status === 'fail').length
    expect(failCount).toBe(0)
    expect(score.completeness).toBeGreaterThan(50)
  })

  it('E2E: getCompletenessReport returns report with no tenants', () => {
    const svc = createService()
    const report = svc.getCompletenessReport()
    expect(report.totalTenants).toBe(0)
    expect(report.averageCompleteness).toBe(0)
    expect(report.scores).toEqual([])
  })

  it('E2E: getCompletenessReport includes all tenants', () => {
    const svc = createService()
    registerTestTenant(svc, 'tenant-a')
    registerTestTenant(svc, 'tenant-b')

    const report = svc.getCompletenessReport()
    expect(report.totalTenants).toBe(2)
    expect(report.scores.length).toBe(2)
    expect(report.averageCompleteness).toBeGreaterThanOrEqual(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 边界条件与错误路径
// ═══════════════════════════════════════════════════════════════════════════════

describe('brand-custom E2E Enhanced - Error Paths & Edge Cases', () => {
  it('E2E: duplicate tenant registration throws', () => {
    const svc = createService()
    svc.registerTenant('dup', 'First')
    expect(() => svc.registerTenant('dup', 'Second')).toThrow('already registered')
  })

  it('E2E: applyPreset with unknown preset throws', () => {
    const svc = createService()
    registerTestTenant(svc)
    expect(() => svc.applyPreset('e2e-tenant', 'nonexistent')).toThrow('not found')
  })

  it('E2E: setActive throws for unknown tenant', () => {
    const svc = createService()
    expect(() => svc.setActive('nonexistent', false)).toThrow('not found')
  })

  it('E2E: renderEmail throws for missing template', () => {
    const svc = createService()
    registerTestTenant(svc)
    expect(() => svc.renderEmail('e2e-tenant', 'welcome', {})).toThrow('not found')
  })

  it('E2E: sendTestEmail returns false for missing template', async () => {
    const svc = createService()
    registerTestTenant(svc)
    const result = await svc.sendTestEmail('e2e-tenant', 'welcome', 'test@example.com')
    expect(result).toBe(false)
  })

  it('E2E: sendTestEmail returns true for existing template', async () => {
    const svc = createService()
    registerTestTenant(svc)
    svc.setEmailTemplate('e2e-tenant', {
      templateType: 'welcome',
      subject: 'Welcome',
      htmlContent: '<p>Welcome!</p>',
      textContent: 'Welcome!',
    })
    const result = await svc.sendTestEmail('e2e-tenant', 'welcome', 'test@example.com')
    expect(result).toBe(true)
  })

  it('E2E: configureDomain throws for unknown tenant', () => {
    const svc = createService()
    expect(() => svc.configureDomain('nonexistent', { customDomain: 'x.com' })).toThrow('not found')
  })

  it('E2E: generateDNSGuide throws for unknown tenant', () => {
    const svc = createService()
    expect(() => svc.generateDNSGuide('nonexistent')).toThrow('not found')
  })

  it('E2E: generateDNSGuide returns empty when no domain fields set', () => {
    const svc = createService()
    registerTestTenant(svc)
    const records = svc.generateDNSGuide('e2e-tenant')
    expect(records.length).toBe(0)
  })

  it('E2E: generateCSSVariables throws for unknown tenant', () => {
    const svc = createService()
    expect(() => svc.generateCSSVariables('nonexistent')).toThrow('not found')
  })

  it('E2E: getLocalizedBrand throws for unknown tenant', () => {
    const svc = createService()
    expect(() => svc.getLocalizedBrand('nonexistent', 'en')).toThrow('not found')
  })
})
