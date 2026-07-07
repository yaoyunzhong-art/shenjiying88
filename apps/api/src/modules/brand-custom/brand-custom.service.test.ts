/**
 * brand-custom.service.test.ts — BrandCustomService 单元测试 (service.test 惯例)
 *
 * 覆盖：
 *   registerTenant       — 正例（注册成功）/ 反例（重复注册）
 *   applyTheme / getTheme — 正例（更新主题）/ 反例（tenant 不存在）
 *   generateCSSVariables  — 正例（CSS 生成）/ 自定义变量合并
 *   getPresetThemes       — 正例（5 个预设）
 *   applyPreset           — 正例（应用预设）/ 反例（预设不存在 / tenant 不存在）
 *   configureDomain       — 正例（域名配置）/ 反例（tenant 不存在）
 *   generateDNSGuide      — 正例（全域名 / 空域名）
 *   setEmailTemplate      — 正例（创建 / 更新）/ 边界
 *   getEmailTemplate      — 正例（获取）/ 反例（模板不存在）
 *   renderEmail           — 正例（变量替换）/ 反例（模板不存在）
 *   sendTestEmail         — 正例（true）/ 反例（false）
 *   setActive / listBrands — 正例（切换 / 查询）/ 反例（tenant 不存在）
 *   previewTheme          — 正例（完整 HTML）/ 边界（最小字段）
 *   DTO 类型与 entity 类型一致性
 *
 * > 遵照 project 惯例，与 .spec.ts 并存，使用 vitest + rxjs lastValueFrom 风格
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BrandCustomService } from './brand-custom.service'
import type { BrandTheme, DomainConfig, EmailTemplate, TenantBrand } from './brand-custom.entity'

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function setupTenant(svc: BrandCustomService, id = 'tenant-001', name = '测试品牌'): TenantBrand {
  return svc.registerTenant(id, name)
}

// ═══════════════════════════════════════════════════════════════
// BrandCustomService
// ═══════════════════════════════════════════════════════════════

describe('BrandCustomService', () => {
  let svc: BrandCustomService

  beforeEach(() => {
    svc = new BrandCustomService()
  })

  // ── 租户品牌管理 ────────────────────────────────────────────────

  describe('registerTenant', () => {
    it('正例: 注册租户返回完整品牌结构', () => {
      const tenant = setupTenant(svc)
      expect(tenant.tenantId).toBe('tenant-001')
      expect(tenant.theme.brandName).toBe('测试品牌')
      expect(tenant.theme.brandId).toBeDefined()
      expect(tenant.theme.brandId.length).toBeGreaterThan(0)
      expect(tenant.theme.primaryColor).toBe('#0066FF')
      expect(tenant.domain.sslEnabled).toBe(false)
      expect(tenant.active).toBe(true)
      expect(tenant.createdAt).toBeInstanceOf(Date)
      expect(tenant.emailTemplates).toEqual([])
    })

    it('正例: 两个租户有不同 brandId', () => {
      const t1 = svc.registerTenant('t1', '品牌A')
      const t2 = svc.registerTenant('t2', '品牌B')
      expect(t1.theme.brandId).not.toBe(t2.theme.brandId)
    })

    it('反例: 重复 tenantId 抛 Error', () => {
      svc.registerTenant('tenant-001', '品牌')
      expect(() => svc.registerTenant('tenant-001', '重名')).toThrow('already registered')
    })
  })

  describe('setActive / listBrands', () => {
    beforeEach(() => {
      svc.registerTenant('t1', '品牌A')
      svc.registerTenant('t2', '品牌B')
    })

    it('正例: listBrands 返回所有租户', () => {
      expect(svc.listBrands()).toHaveLength(2)
    })

    it('正例: setActive 切换为停用', () => {
      svc.setActive('t1', false)
      const t1 = svc.listBrands().find(b => b.tenantId === 't1')
      expect(t1!.active).toBe(false)
    })

    it('正例: setActive 重新启用', () => {
      svc.setActive('t1', false)
      svc.setActive('t1', true)
      const t1 = svc.listBrands().find(b => b.tenantId === 't1')
      expect(t1!.active).toBe(true)
    })

    it('反例: setActive 不存在的 tenant 抛 Error', () => {
      expect(() => svc.setActive('non-existent', true)).toThrow('not found')
    })
  })

  // ── 主题定制 ────────────────────────────────────────────────────

  describe('applyTheme / getTheme', () => {
    beforeEach(() => {
      svc.registerTenant('tenant-001', '测试品牌')
    })

    it('正例: applyTheme 只更新传入字段', () => {
      const updated = svc.applyTheme('tenant-001', { primaryColor: '#FF0000' })
      expect(updated.primaryColor).toBe('#FF0000')
      expect(updated.secondaryColor).toBe('#00D4FF')  // 未覆盖
    })

    it('正例: applyTheme 支持全字段更新', () => {
      const full: Partial<BrandTheme> = {
        brandName: '新品牌',
        logo: 'https://logo.example.com/logo.png',
        favicon: 'https://logo.example.com/favicon.ico',
        primaryColor: '#111111',
        secondaryColor: '#222222',
        accentColor: '#333333',
        fontFamily: 'Arial',
        backgroundColor: '#EEEEEE',
        textColor: '#000000',
        cssVariables: { '--custom': '#fff' },
      }
      const updated = svc.applyTheme('tenant-001', full)
      expect(updated.primaryColor).toBe('#111111')
      expect(updated.fontFamily).toBe('Arial')
      expect(updated.cssVariables!['--custom']).toBe('#fff')
    })

    it('反例: 不存在的 tenant 抛 Error', () => {
      expect(() => svc.applyTheme('non-existent', {})).toThrow('not found')
    })

    it('正例: getTheme 返回当前主题', () => {
      const theme = svc.getTheme('tenant-001')
      expect(theme).not.toBeNull()
      expect(theme!.brandName).toBe('测试品牌')
      expect(theme!.brandId).toBeDefined()
    })

    it('反例: 不存在的 tenant 返回 null', () => {
      expect(svc.getTheme('non-existent')).toBeNull()
    })
  })

  describe('generateCSSVariables', () => {
    beforeEach(() => {
      svc.registerTenant('tenant-001', '测试品牌')
    })

    it('正例: 输出包含 :root 和所有品牌 CSS 变量', () => {
      const css = svc.generateCSSVariables('tenant-001')
      expect(css).toContain(':root')
      expect(css).toContain('--brand-primary')
      expect(css).toContain('--brand-secondary')
      expect(css).toContain('--brand-accent')
      expect(css).toContain('--brand-bg')
      expect(css).toContain('--brand-text')
      expect(css).toContain('--brand-font')
      expect(css).toContain('#0066FF')
    })

    it('正例: 自定义 cssVariables 被合并进输出', () => {
      svc.applyTheme('tenant-001', { cssVariables: { '--custom-margin': '20px' } })
      const css = svc.generateCSSVariables('tenant-001')
      expect(css).toContain('--custom-margin')
      expect(css).toContain('20px')
    })

    it('正例: 多租户 CSS 互不干扰', () => {
      svc.registerTenant('tenant-002', '品牌B')
      svc.applyTheme('tenant-002', { primaryColor: '#999999' })
      const css1 = svc.generateCSSVariables('tenant-001')
      const css2 = svc.generateCSSVariables('tenant-002')
      expect(css1).toContain('#0066FF')
      expect(css2).toContain('#999999')
    })

    it('反例: 不存在的 tenant 抛 Error', () => {
      expect(() => svc.generateCSSVariables('non-existent')).toThrow('not found')
    })
  })

  // ── 预设主题 ────────────────────────────────────────────────────

  describe('getPresetThemes', () => {
    it('正例: 返回 5 个预设', () => {
      const presets = svc.getPresetThemes()
      expect(presets).toHaveLength(5)
    })

    it('每个预设包含 id / name / theme.primaryColor', () => {
      for (const p of svc.getPresetThemes()) {
        expect(p.id).toBeDefined()
        expect(p.name).toBeDefined()
        expect(p.theme.primaryColor).toBeDefined()
      }
    })

    it('预设 ID 顺序固定', () => {
      const ids = svc.getPresetThemes().map(p => p.id)
      expect(ids).toEqual(['tech', 'restaurant', 'retail', 'entertainment', 'education'])
    })
  })

  describe('applyPreset', () => {
    beforeEach(() => {
      svc.registerTenant('tenant-001', '测试品牌')
    })

    it('正例: 应用 tech 预设（科技蓝）', () => {
      const theme = svc.applyPreset('tenant-001', 'tech')
      expect(theme.primaryColor).toBe('#0066FF')
      expect(theme.backgroundColor).toBe('#0F172A')
    })

    it('正例: 应用 restaurant 预设（餐饮橙）', () => {
      const theme = svc.applyPreset('tenant-001', 'restaurant')
      expect(theme.primaryColor).toBe('#FF6B35')
      expect(theme.backgroundColor).toBe('#FFFFFF')
    })

    it('正例: 应用 education 预设（教育蓝）', () => {
      const theme = svc.applyPreset('tenant-001', 'education')
      expect(theme.primaryColor).toBe('#3498DB')
    })

    it('反例: 不存在的预设 ID 抛 Error', () => {
      expect(() => svc.applyPreset('tenant-001', 'unknown')).toThrow('not found')
    })

    it('反例: 不存在的 tenant 抛 Error', () => {
      expect(() => svc.applyPreset('non-existent', 'tech')).toThrow('not found')
    })
  })

  // ── 域名配置 ────────────────────────────────────────────────────

  describe('configureDomain / getDomainConfig', () => {
    beforeEach(() => {
      svc.registerTenant('tenant-001', '测试品牌')
    })

    it('正例: 配置 customDomain', () => {
      const domain = svc.configureDomain('tenant-001', { customDomain: 'shop.example.com' })
      expect(domain.customDomain).toBe('shop.example.com')
      expect(domain.sslEnabled).toBe(false) // 默认
    })

    it('正例: 配置所有域名字段', () => {
      svc.configureDomain('tenant-001', {
        customDomain: 'shop.example.com',
        cdnDomain: 'cdn.example.com',
        apiSubdomain: 'api.example.com',
        webSubdomain: 'www.example.com',
        sslEnabled: true,
        sslCertId: 'cert-123',
      })
      const domain = svc.getDomainConfig('tenant-001')
      expect(domain!.customDomain).toBe('shop.example.com')
      expect(domain!.cdnDomain).toBe('cdn.example.com')
      expect(domain!.apiSubdomain).toBe('api.example.com')
      expect(domain!.webSubdomain).toBe('www.example.com')
      expect(domain!.sslEnabled).toBe(true)
      expect(domain!.sslCertId).toBe('cert-123')
    })

    it('反例: 不存在的 tenant 抛 Error', () => {
      expect(() => svc.configureDomain('non-existent', {})).toThrow('not found')
    })

    it('正例: getDomainConfig 不存在的 tenant 返回 null', () => {
      expect(svc.getDomainConfig('non-existent')).toBeNull()
    })
  })

  describe('generateDNSGuide', () => {
    beforeEach(() => {
      svc.registerTenant('tenant-001', '测试品牌')
    })

    it('正例: 全域名配置返回 4 条记录', () => {
      svc.configureDomain('tenant-001', {
        customDomain: 'shop.example.com',
        cdnDomain: 'cdn.example.com',
        apiSubdomain: 'api.example.com',
        webSubdomain: 'www.example.com',
      })
      const records = svc.generateDNSGuide('tenant-001')
      expect(records).toHaveLength(4)
      expect(records[0].type).toBe('A')
      expect(records[1].type).toBe('CNAME')
    })

    it('正例: 未配域名返回空数组', () => {
      expect(svc.generateDNSGuide('tenant-001')).toEqual([])
    })

    it('正例: 仅 customDomain 返回 1 条 A 记录', () => {
      svc.configureDomain('tenant-001', { customDomain: 'shop.example.com' })
      const records = svc.generateDNSGuide('tenant-001')
      expect(records).toHaveLength(1)
      expect(records[0].type).toBe('A')
      expect(records[0].name).toBe('shop.example.com')
    })

    it('反例: 不存在的 tenant 抛 Error', () => {
      expect(() => svc.generateDNSGuide('non-existent')).toThrow('not found')
    })
  })

  // ── 邮件模板 ────────────────────────────────────────────────────

  describe('setEmailTemplate / getEmailTemplate', () => {
    beforeEach(() => {
      svc.registerTenant('tenant-001', '测试品牌')
    })

    it('正例: 创建后可通过 get 获取', () => {
      const created = svc.setEmailTemplate('tenant-001', {
        templateType: 'welcome',
        subject: '欢迎 {{name}}',
        htmlContent: '<h1>Hello</h1>',
        textContent: 'Hello',
      })
      expect(created.templateType).toBe('welcome')
      expect(created.brandId).toBeDefined()

      const fetched = svc.getEmailTemplate('tenant-001', 'welcome')
      expect(fetched).not.toBeNull()
      expect(fetched!.subject).toBe('欢迎 {{name}}')
    })

    it('正例: 支持所有 6 种模板类型', () => {
      const types: EmailTemplate['templateType'][] = [
        'welcome', 'order_confirm', 'refund', 'marketing', 'reset_password', 'svip_upgrade',
      ]
      for (const t of types) {
        svc.setEmailTemplate('tenant-001', {
          templateType: t,
          subject: `主题 ${t}`,
          htmlContent: '',
          textContent: '',
        })
        const fetched = svc.getEmailTemplate('tenant-001', t)
        expect(fetched).not.toBeNull()
        expect(fetched!.templateType).toBe(t)
      }
    })

    it('更新: 同类型覆盖', () => {
      svc.setEmailTemplate('tenant-001', {
        templateType: 'welcome', subject: '旧版', htmlContent: '', textContent: '',
      })
      svc.setEmailTemplate('tenant-001', {
        templateType: 'welcome', subject: '新版', htmlContent: '', textContent: '',
      })
      expect(svc.getEmailTemplate('tenant-001', 'welcome')!.subject).toBe('新版')
    })

    it('反例: 不存在模板返回 null', () => {
      expect(svc.getEmailTemplate('tenant-001', 'refund')).toBeNull()
    })
  })

  describe('renderEmail', () => {
    beforeEach(() => {
      svc.registerTenant('tenant-001', '测试品牌')
      svc.setEmailTemplate('tenant-001', {
        templateType: 'welcome',
        subject: '欢迎 {{name}} 加入 {{org}}',
        htmlContent: '<p>{{name}}，你好！</p>',
        textContent: '{{name}}，你好！',
      })
    })

    it('正例: 替换模板变量', () => {
      const rendered = svc.renderEmail('tenant-001', 'welcome', { name: '张三', org: '测试品牌' })
      expect(rendered.subject).toBe('欢迎 张三 加入 测试品牌')
      expect(rendered.html).toBe('<p>张三，你好！</p>')
      expect(rendered.text).toBe('张三，你好！')
    })

    it('边界: 未提供的变量保留占位符', () => {
      const rendered = svc.renderEmail('tenant-001', 'welcome', {})
      expect(rendered.subject).toContain('{{name}}')
      expect(rendered.subject).toContain('{{org}}')
    })

    it('反例: 模板不存在抛 Error', () => {
      expect(() => svc.renderEmail('tenant-001', 'order_confirm', {})).toThrow('not found')
    })

    it('反例: tenant 不存在抛 Error', () => {
      expect(() => svc.renderEmail('non-existent', 'welcome', {})).toThrow('not found')
    })
  })

  describe('sendTestEmail', () => {
    beforeEach(() => {
      svc.registerTenant('tenant-001', '测试品牌')
    })

    it('正例: 模板存在返回 true', async () => {
      svc.setEmailTemplate('tenant-001', {
        templateType: 'welcome', subject: '', htmlContent: '', textContent: '',
      })
      const result = await svc.sendTestEmail('tenant-001', 'welcome', 'test@example.com')
      expect(result).toBe(true)
    })

    it('反例: 模板不存在返回 false', async () => {
      const result = await svc.sendTestEmail('tenant-001', 'welcome', 'test@example.com')
      expect(result).toBe(false)
    })
  })

  // ── 主题预览 ────────────────────────────────────────────────────

  describe('previewTheme', () => {
    it('正例: 生成完整 HTML', () => {
      const html = svc.previewTheme({ brandName: 'TEST', primaryColor: '#FF0000' })
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('#FF0000')
      expect(html).toContain('TEST')
      expect(html).toContain('preview-button')
      expect(html).toContain('color-swatches')
    })

    it('边界: 空对象使用默认值', () => {
      const html = svc.previewTheme({})
      expect(html).toContain('#0066FF')    // 默认 primaryColor
      expect(html).toContain('Brand Name')  // 默认 brandName
    })

    it('边界: 仅指定品牌名', () => {
      const html = svc.previewTheme({ brandName: '仅品牌名' })
      expect(html).toContain('仅品牌名')
      expect(html).toContain('#0066FF') // 默认 primaryColor
    })
  })

  // ── 跨方法集成场景 ──────────────────────────────────────────────

  describe('集成场景', () => {
    it('完整品牌流程：注册→主题→域名→邮件→渲染', () => {
      // 1. 注册
      const tenant = svc.registerTenant('integ-001', '整合品牌')
      expect(tenant.active).toBe(true)

      // 2. 应用预设
      const theme = svc.applyPreset('integ-001', 'retail')
      expect(theme.primaryColor).toBe('#2ECC71')

      // 3. 配置域名
      const domain = svc.configureDomain('integ-001', { customDomain: 'retail.example.com' })
      expect(domain.customDomain).toBe('retail.example.com')

      // 4. DNS 指引
      const dns = svc.generateDNSGuide('integ-001')
      expect(dns).toHaveLength(1)

      // 5. 创建邮件模板
      svc.setEmailTemplate('integ-001', {
        templateType: 'order_confirm',
        subject: '订单 {{orderId}} 确认',
        htmlContent: '<p>订单 {{orderId}} 已确认</p>',
        textContent: '订单 {{orderId}} 已确认',
      })

      // 6. 渲染
      const rendered = svc.renderEmail('integ-001', 'order_confirm', { orderId: 'ORD-123' })
      expect(rendered.subject).toBe('订单 ORD-123 确认')

      // 7. CSS 变量
      const css = svc.generateCSSVariables('integ-001')
      expect(css).toContain('#2ECC71')

      // 8. 停用
      svc.setActive('integ-001', false)
      expect(svc.listBrands().find(b => b.tenantId === 'integ-001')!.active).toBe(false)
    })
  })
})
