import { randomUUID } from 'node:crypto'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BrandTheme {
  brandId: string
  brandName: string
  logo: string          // URL
  favicon: string       // URL
  primaryColor: string  // hex
  secondaryColor: string
  accentColor: string
  fontFamily?: string
  backgroundColor: string
  textColor: string
  cssVariables?: Record<string, string>  // 自定义 CSS 变量
}

export interface DomainConfig {
  brandId: string
  customDomain?: string     // e.g. "shop.brand.com"
  cdnDomain?: string       // e.g. "cdn.brand.com"
  apiSubdomain?: string    // e.g. "api.brand.com"
  webSubdomain?: string    // e.g. "www.brand.com"
  sslEnabled: boolean
  sslCertId?: string
}

export interface EmailTemplate {
  brandId: string
  templateType: 'welcome' | 'order_confirm' | 'refund' | 'marketing' | 'reset_password' | 'svip_upgrade'
  subject: string
  htmlContent: string
  textContent: string
  footerText?: string
  senderName?: string
  senderEmail?: string
}

export interface TenantBrand {
  tenantId: string
  theme: BrandTheme
  domain: DomainConfig
  emailTemplates: EmailTemplate[]
  active: boolean
  createdAt: Date
}

// ── Preset Themes ─────────────────────────────────────────────────────────────

const PRESET_THEMES: { id: string; name: string; theme: Partial<BrandTheme> }[] = [
  {
    id: 'tech',
    name: '科技蓝',
    theme: {
      primaryColor: '#0066FF',
      secondaryColor: '#00D4FF',
      accentColor: '#FF6B35',
      backgroundColor: '#0F172A',
      textColor: '#F8FAFC',
      fontFamily: 'Inter, sans-serif',
    },
  },
  {
    id: 'restaurant',
    name: '餐饮橙',
    theme: {
      primaryColor: '#FF6B35',
      secondaryColor: '#F7C59F',
      accentColor: '#2ECC71',
      backgroundColor: '#FFFFFF',
      textColor: '#1A1A1A',
      fontFamily: 'Roboto, sans-serif',
    },
  },
  {
    id: 'retail',
    name: '零售绿',
    theme: {
      primaryColor: '#2ECC71',
      secondaryColor: '#27AE60',
      accentColor: '#0066FF',
      backgroundColor: '#F8F9FA',
      textColor: '#2C3E50',
      fontFamily: 'Open Sans, sans-serif',
    },
  },
  {
    id: 'entertainment',
    name: '娱乐紫',
    theme: {
      primaryColor: '#9B59B6',
      secondaryColor: '#E91E63',
      accentColor: '#00D4FF',
      backgroundColor: '#1A1A2E',
      textColor: '#EAEAEA',
      fontFamily: 'Poppins, sans-serif',
    },
  },
  {
    id: 'education',
    name: '教育蓝',
    theme: {
      primaryColor: '#3498DB',
      secondaryColor: '#1ABC9C',
      accentColor: '#E74C3C',
      backgroundColor: '#FFFFFF',
      textColor: '#34495E',
      fontFamily: 'Nunito, sans-serif',
    },
  },
]

// ── BrandCustomService ─────────────────────────────────────────────────────────

export class BrandCustomService {
  private readonly tenants = new Map<string, TenantBrand>()

  // ── 主题定制 ──────────────────────────────────────────────────────

  /** 应用品牌主题 */
  applyTheme(tenantId: string, theme: Partial<BrandTheme>): BrandTheme {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    const updatedTheme: BrandTheme = {
      ...tenant.theme,
      ...theme,
      brandId: tenant.theme.brandId,
    }

    tenant.theme = updatedTheme
    return updatedTheme
  }

  /** 获取品牌主题 */
  getTheme(tenantId: string): BrandTheme | null {
    const tenant = this.tenants.get(tenantId)
    return tenant ? tenant.theme : null
  }

  /** 生成 CSS 变量字符串（用于注入到页面）*/
  generateCSSVariables(tenantId: string): string {
    const theme = this.getTheme(tenantId)
    if (!theme) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    const cssVars: Record<string, string> = {
      '--brand-primary': theme.primaryColor,
      '--brand-secondary': theme.secondaryColor,
      '--brand-accent': theme.accentColor,
      '--brand-bg': theme.backgroundColor,
      '--brand-text': theme.textColor,
      '--brand-font': theme.fontFamily || 'Inter, sans-serif',
    }

    // Merge custom CSS variables
    if (theme.cssVariables) {
      Object.entries(theme.cssVariables).forEach(([key, value]) => {
        cssVars[key] = value
      })
    }

    const lines = Object.entries(cssVars).map(([key, value]) => `  ${key}: ${value};`)

    return `:root {\n${lines.join('\n')}\n}`
  }

  /** 预设主题（科技/餐饮/零售/娱乐/教育）*/
  getPresetThemes(): { id: string; name: string; theme: Partial<BrandTheme> }[] {
    return PRESET_THEMES
  }

  /** 应用预设主题 */
  applyPreset(tenantId: string, presetId: string): BrandTheme {
    const preset = PRESET_THEMES.find(p => p.id === presetId)
    if (!preset) {
      throw new Error(`Preset ${presetId} not found`)
    }

    return this.applyTheme(tenantId, preset.theme)
  }

  // ── 域名配置 ──────────────────────────────────────────────────────

  /** 配置品牌域名 */
  configureDomain(tenantId: string, config: Partial<DomainConfig>): DomainConfig {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    const updatedDomain: DomainConfig = {
      ...tenant.domain,
      ...config,
      brandId: tenant.domain.brandId,
    }

    tenant.domain = updatedDomain
    return updatedDomain
  }

  /** 获取域名配置 */
  getDomainConfig(tenantId: string): DomainConfig | null {
    const tenant = this.tenants.get(tenantId)
    return tenant ? tenant.domain : null
  }

  /** 生成 DNS 配置指引 */
  generateDNSGuide(tenantId: string): { type: 'A' | 'CNAME'; name: string; value: string; ttl: number }[] {
    const domain = this.getDomainConfig(tenantId)
    if (!domain) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    const records: { type: 'A' | 'CNAME'; name: string; value: string; ttl: number }[] = []

    if (domain.customDomain) {
      records.push({
        type: 'A',
        name: domain.customDomain,
        value: 'YOUR_SERVER_IP',
        ttl: 300,
      })
    }

    if (domain.cdnDomain) {
      records.push({
        type: 'CNAME',
        name: domain.cdnDomain,
        value: 'cdn.provider.com',
        ttl: 300,
      })
    }

    if (domain.apiSubdomain) {
      records.push({
        type: 'CNAME',
        name: domain.apiSubdomain,
        value: 'api.provider.com',
        ttl: 300,
      })
    }

    if (domain.webSubdomain) {
      records.push({
        type: 'CNAME',
        name: domain.webSubdomain,
        value: 'web.provider.com',
        ttl: 300,
      })
    }

    return records
  }

  // ── 邮件模板 ───────────────────────────────────────────────────────

  /** 创建/更新邮件模板 */
  setEmailTemplate(tenantId: string, template: Omit<EmailTemplate, 'brandId'>): EmailTemplate {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    const fullTemplate: EmailTemplate = {
      ...template,
      brandId: tenant.theme.brandId,
    }

    const existingIndex = tenant.emailTemplates.findIndex(
      t => t.templateType === template.templateType
    )

    if (existingIndex >= 0) {
      tenant.emailTemplates[existingIndex] = fullTemplate
    } else {
      tenant.emailTemplates.push(fullTemplate)
    }

    return fullTemplate
  }

  /** 获取邮件模板 */
  getEmailTemplate(tenantId: string, templateType: EmailTemplate['templateType']): EmailTemplate | null {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    return tenant.emailTemplates.find(t => t.templateType === templateType) || null
  }

  /** 渲染邮件模板（替换变量）*/
  renderEmail(
    tenantId: string,
    templateType: EmailTemplate['templateType'],
    variables: Record<string, string>
  ): { subject: string; html: string; text: string } {
    const template = this.getEmailTemplate(tenantId, templateType)
    if (!template) {
      throw new Error(`Template ${templateType} not found for tenant ${tenantId}`)
    }

    const replaceVariables = (content: string): string => {
      return content.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`)
    }

    return {
      subject: replaceVariables(template.subject),
      html: replaceVariables(template.htmlContent),
      text: replaceVariables(template.textContent),
    }
  }

  /** 发送测试邮件 */
  async sendTestEmail(
    tenantId: string,
    templateType: EmailTemplate['templateType'],
    recipient: string
  ): Promise<boolean> {
    const template = this.getEmailTemplate(tenantId, templateType)
    if (!template) {
      return false
    }

    // Mock email sending - in production this would call an email service
    // Simulating async operation
    await Promise.resolve()

    return true
  }

  // ── 租户品牌管理 ──────────────────────────────────────────────────

  /** 注册租户品牌 */
  registerTenant(tenantId: string, brandName: string): TenantBrand {
    if (this.tenants.has(tenantId)) {
      throw new Error(`Tenant ${tenantId} already registered`)
    }

    const brandId = randomUUID()

    const tenantBrand: TenantBrand = {
      tenantId,
      theme: {
        brandId,
        brandName,
        logo: '',
        favicon: '',
        primaryColor: '#0066FF',
        secondaryColor: '#00D4FF',
        accentColor: '#FF6B35',
        backgroundColor: '#FFFFFF',
        textColor: '#1A1A1A',
      },
      domain: {
        brandId,
        sslEnabled: false,
      },
      emailTemplates: [],
      active: true,
      createdAt: new Date(),
    }

    this.tenants.set(tenantId, tenantBrand)
    return tenantBrand
  }

  /** 激活/停用租户品牌 */
  setActive(tenantId: string, active: boolean): void {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`)
    }
    tenant.active = active
  }

  /** 查询所有品牌 */
  listBrands(): TenantBrand[] {
    return Array.from(this.tenants.values())
  }

  /** 预览主题效果（生成 HTML snippet）*/
  previewTheme(theme: Partial<BrandTheme>): string {
    const t = {
      primaryColor: theme.primaryColor || '#0066FF',
      secondaryColor: theme.secondaryColor || '#00D4FF',
      accentColor: theme.accentColor || '#FF6B35',
      backgroundColor: theme.backgroundColor || '#FFFFFF',
      textColor: theme.textColor || '#1A1A1A',
      fontFamily: theme.fontFamily || 'Inter, sans-serif',
      brandName: theme.brandName || 'Brand Name',
      logo: theme.logo || '',
    }

    return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${t.fontFamily};
      background-color: ${t.backgroundColor};
      color: ${t.textColor};
      padding: 40px;
    }
    .preview-card {
      background: ${t.backgroundColor};
      border: 2px solid ${t.primaryColor};
      border-radius: 12px;
      padding: 32px;
      max-width: 400px;
    }
    .preview-logo {
      width: 64px;
      height: 64px;
      background: ${t.primaryColor};
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      margin-bottom: 16px;
    }
    .preview-title {
      color: ${t.primaryColor};
      font-size: 24px;
      margin-bottom: 8px;
    }
    .preview-subtitle {
      color: ${t.secondaryColor};
      font-size: 16px;
      margin-bottom: 16px;
    }
    .preview-button {
      background: ${t.primaryColor};
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      margin-right: 8px;
    }
    .preview-button-accent {
      background: ${t.accentColor};
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
    }
    .color-swatches {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    .swatch {
      width: 32px;
      height: 32px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="preview-card">
    ${t.logo ? `<img src="${t.logo}" class="preview-logo" />` : `<div class="preview-logo">${t.brandName.charAt(0)}</div>`}
    <h1 class="preview-title">${t.brandName}</h1>
    <p class="preview-subtitle">主题预览</p>
    <button class="preview-button">主要按钮</button>
    <button class="preview-button-accent">强调按钮</button>
    <div class="color-swatches">
      <div class="swatch" style="background: ${t.primaryColor}"></div>
      <div class="swatch" style="background: ${t.secondaryColor}"></div>
      <div class="swatch" style="background: ${t.accentColor}"></div>
      <div class="swatch" style="background: ${t.backgroundColor}; border: 1px solid #ccc"></div>
      <div class="swatch" style="background: ${t.textColor}"></div>
    </div>
  </div>
</body>
</html>`
  }
}
