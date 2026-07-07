/**
 * brand-custom.service.spec.ts — BrandCustomService 纯函数式单元测试
 *
 * 覆盖：
 *   registerTenant      — 正例（注册）/ 反例（重复注册）
 *   applyTheme/getTheme — 正例（应用主题/获取主题）/ 反例（不存在的tenant）
 *   generateCSSVariables — 正例（完整CSS）/ 反例（不存在tenant）
 *   getPresetThemes     — 正例（返回全部预设）
 *   applyPreset         — 正例（应用科技蓝）/ 反例（不存在的预设）
 *   configureDomain     — 正例（配域名）/ 反例（不存在tenant）
 *   generateDNSGuide    — 正例（生成DNS）/ 反例（不存在tenant/部分域名）
 *   setEmailTemplate/getEmailTemplate — 正例（创建/获取）/ 更新
 *   renderEmail         — 正例（变量替换）/ 反例（模板不存在）
 *   sendTestEmail       — 正例（返回true）/ 反例（模板不存在）
 *   setActive/listBrands — 正例（激活/查询）/ 反例（不存在）
 *   previewTheme        — 正例（生成HTML）/ 边界（缺少字段）
 *
 * ≥ 18 项测试，纯内联 mock，不依赖数据库
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BrandCustomService } from './brand-custom.service'
import type { BrandTheme, DomainConfig, EmailTemplate } from './brand-custom.service'

// ═══════════════════════════════════════════════════════════════
// mock 工厂
// ═══════════════════════════════════════════════════════════════

function createRegisteredService(): BrandCustomService {
  const svc = new BrandCustomService()
  svc.registerTenant('tenant-001', '测试品牌')
  return svc
}

// ═══════════════════════════════════════════════════════════════
// BrandCustomService
// ═══════════════════════════════════════════════════════════════

describe('BrandCustomService', () => {
  let svc: BrandCustomService

  beforeEach(() => {
    svc = new BrandCustomService()
  })

  // ── registerTenant ────────────────────────────────────────────

  describe('registerTenant', () => {
    it('正例: 注册新租户，返回完整 TenantBrand', () => {
      const tenant = svc.registerTenant('tenant-001', '测试品牌')

      expect(tenant.tenantId).toBe('tenant-001')
      expect(tenant.theme.brandName).toBe('测试品牌')
      expect(tenant.theme.brandId).toBeDefined()
      expect(tenant.theme.primaryColor).toBe('#0066FF')
      expect(tenant.domain.sslEnabled).toBe(false)
      expect(tenant.active).toBe(true)
      expect(tenant.createdAt).toBeInstanceOf(Date)
      expect(tenant.emailTemplates).toEqual([])
    })

    it('反例: 重复注册抛出 Error', () => {
      svc.registerTenant('tenant-001', '测试品牌')
      expect(() => svc.registerTenant('tenant-001', '重复')).toThrow('already registered')
    })
  })

  // ── applyTheme / getTheme ─────────────────────────────────────

  describe('applyTheme / getTheme', () => {
    beforeEach(() => {
      svc.registerTenant('tenant-001', '测试品牌')
    })

    it('正例: applyTheme 更新主题字段', () => {
      const updated = svc.applyTheme('tenant-001', { primaryColor: '#FF0000' })
      expect(updated.primaryColor).toBe('#FF0000')
      // 未覆盖的字段保留原值
      expect(updated.secondaryColor).toBe('#00D4FF')
    })

    it('反例: 不存在的 tenant 抛 Error', () => {
      expect(() => svc.applyTheme('non-existent', {})).toThrow('not found')
    })

    it('正例: getTheme 返回当前主题', () => {
      const theme = svc.getTheme('tenant-001')
      expect(theme).not.toBeNull()
      expect(theme!.brandName).toBe('测试品牌')
    })

    it('反例: getTheme 不存在的 tenant 返回 null', () => {
      expect(svc.getTheme('non-existent')).toBeNull()
    })
  })

  // ── generateCSSVariables ──────────────────────────────────────

  describe('generateCSSVariables', () => {
    beforeEach(() => {
      svc.registerTenant('tenant-001', '测试品牌')
    })

    it('正例: 生成包含全部品牌色+字体的 CSS', () => {
      const css = svc.generateCSSVariables('tenant-001')
      expect(css).toContain('--brand-primary')
      expect(css).toContain('--brand-secondary')
      expect(css).toContain('--brand-accent')
      expect(css).toContain('--brand-bg')
      expect(css).toContain('--brand-text')
      expect(css).toContain('--brand-font')
      expect(css).toContain('#0066FF')
      expect(css).toContain(':root')
    })

    it('反例: 不存在的 tenant 抛 Error', () => {
      expect(() => svc.generateCSSVariables('non-existent')).toThrow('not found')
    })

    it('自定义 CSS 变量被合并', () => {
      svc.applyTheme('tenant-001', { cssVariables: { '--custom-brand': '#123456' } })
      const css = svc.generateCSSVariables('tenant-001')
      expect(css).toContain('--custom-brand')
      expect(css).toContain('#123456')
    })
  })

  // ── getPresetThemes ───────────────────────────────────────────

  describe('getPresetThemes', () => {
    it('正例: 返回 5 个预设主题', () => {
      const presets = svc.getPresetThemes()
      expect(presets).toHaveLength(5)
      expect(presets.map(p => p.id)).toEqual(['tech', 'restaurant', 'retail', 'entertainment', 'education'])
    })

    it('各预设都有 name 和 theme', () => {
      for (const preset of svc.getPresetThemes()) {
        expect(preset.name).toBeDefined()
        expect(preset.theme.primaryColor).toBeDefined()
      }
    })
  })

  // ── applyPreset ───────────────────────────────────────────────

  describe('applyPreset', () => {
    beforeEach(() => {
      svc.registerTenant('tenant-001', '测试品牌')
    })

    it('正例: 应用 "tech" 预设主题（科技蓝）', () => {
      const theme = svc.applyPreset('tenant-001', 'tech')
      expect(theme.primaryColor).toBe('#0066FF')
      expect(theme.backgroundColor).toBe('#0F172A')
    })

    it('正例: 应用 "entertainment" 预设（娱乐紫）', () => {
      const theme = svc.applyPreset('tenant-001', 'entertainment')
      expect(theme.primaryColor).toBe('#9B59B6')
    })

    it('反例: 不存在的预设 ID 抛 Error', () => {
      expect(() => svc.applyPreset('tenant-001', 'unknown-preset')).toThrow('not found')
    })

    it('反例: 不存在的 tenant 抛 Error', () => {
      expect(() => svc.applyPreset('non-existent', 'tech')).toThrow('not found')
    })
  })

  // ── configureDomain / getDomainConfig ─────────────────────────

  describe('configureDomain / getDomainConfig', () => {
    beforeEach(() => {
      svc.registerTenant('tenant-001', '测试品牌')
    })

    it('正例: 配置自定义域名', () => {
      const domain = svc.configureDomain('tenant-001', { customDomain: 'shop.brand.com' })
      expect(domain.customDomain).toBe('shop.brand.com')
    })

    it('反例: 不存在的 tenant 抛 Error', () => {
      expect(() => svc.configureDomain('non-existent', {})).toThrow('not found')
    })

    it('正例: getDomainConfig 返回当前配置', () => {
      svc.configureDomain('tenant-001', { sslEnabled: true })
      const config = svc.getDomainConfig('tenant-001')
      expect(config).not.toBeNull()
      expect(config!.sslEnabled).toBe(true)
    })
  })

  // ── generateDNSGuide ──────────────────────────────────────────

  describe('generateDNSGuide', () => {
    beforeEach(() => {
      svc.registerTenant('tenant-001', '测试品牌')
    })

    it('正例: 全域名配置生成对应的 DNS 记录', () => {
      svc.configureDomain('tenant-001', {
        customDomain: 'shop.brand.com',
        cdnDomain: 'cdn.brand.com',
        apiSubdomain: 'api.brand.com',
        webSubdomain: 'www.brand.com',
      })
      const records = svc.generateDNSGuide('tenant-001')
      expect(records).toHaveLength(4)
      expect(records[0].type).toBe('A')
      expect(records[1].type).toBe('CNAME')
    })

    it('反例: 不存在的 tenant 抛 Error', () => {
      expect(() => svc.generateDNSGuide('non-existent')).toThrow('not found')
    })

    it('未配域名返回空', () => {
      const records = svc.generateDNSGuide('tenant-001')
      expect(records).toHaveLength(0)
    })
  })

  // ── setEmailTemplate / getEmailTemplate ───────────────────────

  describe('setEmailTemplate / getEmailTemplate', () => {
    beforeEach(() => {
      svc.registerTenant('tenant-001', '测试品牌')
    })

    it('正例: 创建邮件模板后能获取', () => {
      svc.setEmailTemplate('tenant-001', {
        templateType: 'welcome',
        subject: '欢迎 {{name}}',
        htmlContent: '<h1>Welcome {{name}}</h1>',
        textContent: 'Welcome {{name}}',
      })
      const tpl = svc.getEmailTemplate('tenant-001', 'welcome')
      expect(tpl).not.toBeNull()
      expect(tpl!.subject).toBe('欢迎 {{name}}')
    })

    it('更新: 同类型模板覆盖旧模板', () => {
      svc.setEmailTemplate('tenant-001', {
        templateType: 'welcome',
        subject: '原版',
        htmlContent: '',
        textContent: '',
      })
      svc.setEmailTemplate('tenant-001', {
        templateType: 'welcome',
        subject: '新版',
        htmlContent: '',
        textContent: '',
      })
      const tpl = svc.getEmailTemplate('tenant-001', 'welcome')
      expect(tpl!.subject).toBe('新版')
    })

    it('不存在的模板类型返回 null', () => {
      const tpl = svc.getEmailTemplate('tenant-001', 'refund' as any)
      // tenant 已注册但无模板
      expect(tpl).toBeNull()
    })
  })

  // ── renderEmail ───────────────────────────────────────────────

  describe('renderEmail', () => {
    beforeEach(() => {
      svc.registerTenant('tenant-001', '测试品牌')
      svc.setEmailTemplate('tenant-001', {
        templateType: 'welcome',
        subject: '欢迎 {{name}}',
        htmlContent: '<p>{{name}}</p>',
        textContent: 'Hello {{name}}',
      })
    })

    it('正例: 替换模板变量 {{name}}', () => {
      const rendered = svc.renderEmail('tenant-001', 'welcome', { name: '张三' })
      expect(rendered.subject).toBe('欢迎 张三')
      expect(rendered.html).toBe('<p>张三</p>')
      expect(rendered.text).toBe('Hello 张三')
    })

    it('未提供变量时保留 {{placeholder}}', () => {
      const rendered = svc.renderEmail('tenant-001', 'welcome', {})
      expect(rendered.subject).toContain('{{name}}')
    })

    it('反例: 不存在的模板抛 Error', () => {
      expect(() => svc.renderEmail('tenant-001', 'order_confirm', {})).toThrow('not found')
    })
  })

  // ── sendTestEmail ─────────────────────────────────────────────

  describe('sendTestEmail', () => {
    beforeEach(() => {
      svc.registerTenant('tenant-001', '测试品牌')
    })

    it('正例: 模板存在返回 true', async () => {
      svc.setEmailTemplate('tenant-001', {
        templateType: 'welcome', subject: '', htmlContent: '', textContent: '',
      })
      const result = await svc.sendTestEmail('tenant-001', 'welcome', 'test@test.com')
      expect(result).toBe(true)
    })

    it('反例: 模板不存在返回 false', async () => {
      const result = await svc.sendTestEmail('tenant-001', 'welcome', 'test@test.com')
      expect(result).toBe(false)
    })
  })

  // ── setActive / listBrands ────────────────────────────────────

  describe('setActive / listBrands', () => {
    beforeEach(() => {
      svc.registerTenant('tenant-001', '品牌A')
      svc.registerTenant('tenant-002', '品牌B')
    })

    it('正例: setActive 切换启用状态', () => {
      svc.setActive('tenant-001', false)
      const brands = svc.listBrands()
      const tenant = brands.find(b => b.tenantId === 'tenant-001')
      expect(tenant!.active).toBe(false)
    })

    it('正例: listBrands 返回所有注册的品牌', () => {
      const brands = svc.listBrands()
      expect(brands).toHaveLength(2)
    })

    it('反例: setActive 不存在的 tenant 抛 Error', () => {
      expect(() => svc.setActive('non-existent', true)).toThrow('not found')
    })
  })

  // ── previewTheme ──────────────────────────────────────────────

  describe('previewTheme', () => {
    it('正例: 生成包含完整 HTML 结构的预览', () => {
      const html = svc.previewTheme({ brandName: '测试', primaryColor: '#FF0000' })
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('#FF0000')
      expect(html).toContain('测试')
      expect(html).toContain('preview-button')
      expect(html).toContain('color-swatches')
    })

    it('边界: 最少字段也能生成预览（使用默认值）', () => {
      const html = svc.previewTheme({})
      expect(html).toContain('#0066FF')    // 默认 primaryColor
      expect(html).toContain('Brand Name')  // 默认 brandName
    })
  })
})
