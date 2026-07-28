import { randomUUID } from 'node:crypto'

import type {
  BrandVersion,
  VersionDiffResult,
  ThemeDiffEntry,
  DomainDiffEntry,
  InjectScript,
  InjectScriptLocation,
  CustomFont,
  FontFormat,
  LocaleSetting,
  BrandHealthScore,
  HealthCheckItem,
  EmailTemplateType,
  CompletenessReport,
} from './brand-custom.entity'

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

  // ═════════════════════════════════════════════════════════════════════════════
  // 品牌版本管理 (Brand Version Management)
  // ═════════════════════════════════════════════════════════════════════════════

  private readonly versions = new Map<string, BrandVersion[]>()

  /**
   * 创建版本快照 — 将当前 theme + domain 保存为一个版本
   */
  createVersion(tenantId: string, note: string): BrandVersion {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    const version: BrandVersion = {
      id: randomUUID(),
      tenantId,
      theme: structuredClone(tenant.theme),
      domainConfig: structuredClone(tenant.domain),
      note,
      createdAt: new Date(),
    }

    if (!this.versions.has(tenantId)) {
      this.versions.set(tenantId, [])
    }
    this.versions.get(tenantId)!.push(version)

    return version
  }

  /** 列出租户所有版本 */
  listVersions(tenantId: string): BrandVersion[] {
    return this.versions.get(tenantId) || []
  }

  /**
   * 回滚到指定版本 — 恢复 theme + domain 为该版本的状态
   */
  rollbackToVersion(tenantId: string, versionId: string): { theme: BrandTheme; domain: DomainConfig } {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    const versions = this.versions.get(tenantId)
    if (!versions) {
      throw new Error(`No versions found for tenant ${tenantId}`)
    }

    const version = versions.find(v => v.id === versionId)
    if (!version) {
      throw new Error(`Version ${versionId} not found for tenant ${tenantId}`)
    }

    // Restore theme and domain config from the snapshot
    tenant.theme = structuredClone(version.theme)
    tenant.domain = structuredClone(version.domainConfig)

    return {
      theme: tenant.theme,
      domain: tenant.domain,
    }
  }

  /**
   * 计算两个版本之间的差异
   */
  getVersionDiff(tenantId: string, versionId1: string, versionId2: string): VersionDiffResult {
    const versions = this.versions.get(tenantId)
    if (!versions) {
      throw new Error(`No versions found for tenant ${tenantId}`)
    }

    const v1 = versions.find(v => v.id === versionId1)
    const v2 = versions.find(v => v.id === versionId2)

    if (!v1 || !v2) {
      throw new Error(`One or both versions not found for tenant ${tenantId}`)
    }

    const themeChanges: ThemeDiffEntry[] = []
    const domainChanges: DomainDiffEntry[] = []

    // Compare theme fields
    const themeFields: { key: keyof BrandTheme; label: string }[] = [
      { key: 'brandName', label: '品牌名称' },
      { key: 'logo', label: 'Logo URL' },
      { key: 'favicon', label: 'Favicon URL' },
      { key: 'primaryColor', label: '主色' },
      { key: 'secondaryColor', label: '辅色' },
      { key: 'accentColor', label: '强调色' },
      { key: 'fontFamily', label: '字体' },
      { key: 'backgroundColor', label: '背景色' },
      { key: 'textColor', label: '文字色' },
    ]

    for (const { key, label } of themeFields) {
      const a = String(v1.theme[key] ?? '')
      const b = String(v2.theme[key] ?? '')
      if (a !== b) {
        themeChanges.push({
          field: key,
          label,
          before: String(v1.theme[key] ?? undefined),
          after: String(v2.theme[key] ?? undefined),
        })
      }
    }

    // Compare CSS variables
    const cssVars1 = JSON.stringify(v1.theme.cssVariables ?? {})
    const cssVars2 = JSON.stringify(v2.theme.cssVariables ?? {})
    if (cssVars1 !== cssVars2) {
      themeChanges.push({
        field: 'cssVariables',
        label: 'CSS 变量',
        before: cssVars1,
        after: cssVars2,
      })
    }

    // Compare domain fields
    const domainFields: { key: keyof DomainConfig; label: string }[] = [
      { key: 'customDomain', label: '自定义域名' },
      { key: 'cdnDomain', label: 'CDN 域名' },
      { key: 'apiSubdomain', label: 'API 子域名' },
      { key: 'webSubdomain', label: 'Web 子域名' },
      { key: 'sslEnabled', label: 'SSL 启用' },
      { key: 'sslCertId', label: 'SSL 证书 ID' },
    ]

    for (const { key, label } of domainFields) {
      const a = String(v1.domainConfig[key] ?? '')
      const b = String(v2.domainConfig[key] ?? '')
      if (a !== b) {
        domainChanges.push({
          field: key,
          label,
          before: String(v1.domainConfig[key] ?? undefined),
          after: String(v2.domainConfig[key] ?? undefined),
        })
      }
    }

    return {
      version1: { id: v1.id, createdAt: v1.createdAt },
      version2: { id: v2.id, createdAt: v2.createdAt },
      themeChanges,
      domainChanges,
      hasChanges: themeChanges.length > 0 || domainChanges.length > 0,
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 自定义脚本注入 (Custom Script Injection)
  // ═════════════════════════════════════════════════════════════════════════════

  private readonly injectScripts = new Map<string, InjectScript[]>()

  /**
   * 设置注入脚本（头/body_start/body_end 位置）
   */
  setInjectScript(tenantId: string, data: {
    location: InjectScriptLocation
    name: string
    content: string
    enabled?: boolean
  }): InjectScript {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    const script: InjectScript = {
      id: randomUUID(),
      tenantId,
      location: data.location,
      name: data.name,
      content: data.content,
      enabled: data.enabled ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    if (!this.injectScripts.has(tenantId)) {
      this.injectScripts.set(tenantId, [])
    }
    this.injectScripts.get(tenantId)!.push(script)

    return script
  }

  /** 获取租户所有注入脚本 */
  getInjectScripts(tenantId: string): InjectScript[] {
    return this.injectScripts.get(tenantId) || []
  }

  /** 更新注入脚本 */
  updateInjectScript(
    tenantId: string,
    scriptId: string,
    data: Partial<{
      location: InjectScriptLocation
      name: string
      content: string
      enabled: boolean
    }>,
  ): InjectScript {
    const scripts = this.injectScripts.get(tenantId)
    if (!scripts) {
      throw new Error(`No scripts found for tenant ${tenantId}`)
    }

    const index = scripts.findIndex(s => s.id === scriptId)
    if (index < 0) {
      throw new Error(`Script ${scriptId} not found for tenant ${tenantId}`)
    }

    scripts[index] = {
      ...scripts[index],
      ...data,
      updatedAt: new Date(),
    }

    return scripts[index]
  }

  /** 移除注入脚本 */
  removeInjectScript(tenantId: string, scriptId: string): void {
    const scripts = this.injectScripts.get(tenantId)
    if (!scripts) {
      throw new Error(`No scripts found for tenant ${tenantId}`)
    }

    const index = scripts.findIndex(s => s.id === scriptId)
    if (index < 0) {
      throw new Error(`Script ${scriptId} not found for tenant ${tenantId}`)
    }

    scripts.splice(index, 1)
  }

  /**
   * 渲染指定位置的脚本（返回 HTML 标签字符串，可直接插入页面）
   */
  renderInjectScripts(tenantId: string, location: InjectScriptLocation): string {
    const scripts = this.injectScripts.get(tenantId) || []
    const enabled = scripts.filter(s => s.enabled && s.location === location)

    if (enabled.length === 0) {
      return ''
    }

    return enabled.map(s => {
      // Auto-detect: if content starts with <, treat as raw HTML; else wrap in <script>
      if (s.content.trim().startsWith('<')) {
        return s.content
      }
      return `<script>\n${s.content}\n</script>`
    }).join('\n')
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 自定义字体管理 (Custom Font Management)
  // ═════════════════════════════════════════════════════════════════════════════

  private readonly customFonts = new Map<string, CustomFont[]>()

  /** 注册自定义字体 */
  registerCustomFont(
    tenantId: string,
    data: {
      name: string
      url: string
      format: FontFormat
      weight?: string
      style?: string
    },
  ): CustomFont {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    // Prevent duplicate font names
    const existing = this.customFonts.get(tenantId) || []
    const dup = existing.find(f => f.name === data.name && f.weight === (data.weight || 'normal') && f.style === (data.style || 'normal'))
    if (dup) {
      throw new Error(`Font "${data.name}" (${data.weight || 'normal'}/${data.style || 'normal'}) already registered for tenant ${tenantId}`)
    }

    const font: CustomFont = {
      id: randomUUID(),
      tenantId,
      name: data.name,
      url: data.url,
      format: data.format,
      weight: data.weight,
      style: data.style,
      createdAt: new Date(),
    }

    if (!this.customFonts.has(tenantId)) {
      this.customFonts.set(tenantId, [])
    }
    this.customFonts.get(tenantId)!.push(font)

    return font
  }

  /** 列出所有自定义字体 */
  listCustomFonts(tenantId: string): CustomFont[] {
    return this.customFonts.get(tenantId) || []
  }

  /** 移除自定义字体 */
  removeCustomFont(tenantId: string, fontId: string): void {
    const fonts = this.customFonts.get(tenantId)
    if (!fonts) {
      throw new Error(`No fonts found for tenant ${tenantId}`)
    }

    const index = fonts.findIndex(f => f.id === fontId)
    if (index < 0) {
      throw new Error(`Font ${fontId} not found for tenant ${tenantId}`)
    }

    fonts.splice(index, 1)
  }

  /**
   * 生成 @font-face CSS 声明
   * 可直接在页面 <style> 标签或 CSS 文件中使用
   */
  generateFontCSS(tenantId: string): string {
    const fonts = this.customFonts.get(tenantId) || []
    if (fonts.length === 0) {
      return ''
    }

    const formatMap: Record<FontFormat, string> = {
      woff: 'woff',
      woff2: 'woff2',
      ttf: 'truetype',
      eot: 'embedded-opentype',
    }

    return fonts.map(font => {
      const lines = [`@font-face {`]
      lines.push(`  font-family: '${font.name}';`)
      lines.push(`  src: url('${font.url}') format('${formatMap[font.format]}');`)
      if (font.weight) {
        lines.push(`  font-weight: ${font.weight};`)
      }
      if (font.style) {
        lines.push(`  font-style: ${font.style};`)
      }
      lines.push(`  font-display: swap;`)
      lines.push(`}`)
      return lines.join('\n')
    }).join('\n\n')
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 多语言品牌设置 (Multi-language Brand Settings)
  // ═════════════════════════════════════════════════════════════════════════════

  private readonly localeSettings = new Map<string, LocaleSetting[]>()

  /**
   * 设置某个语言下的品牌显示文字
   * 如果该 locale 已存在，则更新；否则新建
   */
  setLocale(
    tenantId: string,
    locale: string,
    brandName?: string,
    description?: string,
    tagline?: string,
  ): LocaleSetting {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    if (!this.localeSettings.has(tenantId)) {
      this.localeSettings.set(tenantId, [])
    }

    const locales = this.localeSettings.get(tenantId)!
    const existing = locales.find(l => l.locale === locale)

    if (existing) {
      // Update existing
      if (brandName !== undefined) existing.brandName = brandName
      if (description !== undefined) existing.description = description
      if (tagline !== undefined) existing.tagline = tagline
      existing.updatedAt = new Date()
      return existing
    }

    // Create new
    const setting: LocaleSetting = {
      tenantId,
      locale,
      brandName: brandName ?? tenant.theme.brandName,
      description,
      tagline,
      updatedAt: new Date(),
    }

    locales.push(setting)
    return setting
  }

  /** 获取指定语言的品牌文字 */
  getLocale(tenantId: string, locale: string): LocaleSetting | null {
    const locales = this.localeSettings.get(tenantId)
    return locales?.find(l => l.locale === locale) || null
  }

  /** 列出所有已配置的语言 */
  listLocales(tenantId: string): LocaleSetting[] {
    return this.localeSettings.get(tenantId) || []
  }

  /**
   * 获取完整的本地化品牌配置
   * 优先返回指定 locale 的值，fallback 到租户默认品牌名
   */
  getLocalizedBrand(tenantId: string, locale: string): {
    brandName: string
    description?: string
    tagline?: string
    locale: string
    theme: BrandTheme
  } {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    const localeSetting = this.getLocale(tenantId, locale)

    return {
      brandName: localeSetting?.brandName ?? tenant.theme.brandName,
      description: localeSetting?.description,
      tagline: localeSetting?.tagline,
      locale,
      theme: tenant.theme,
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 品牌健康检查 (Brand Health Check)
  // ═════════════════════════════════════════════════════════════════════════════

  /**
   * 检查单个租户品牌完整性
   * 评分规则：每项通过 = 得分，总分 100
   */
  healthCheck(tenantId: string): BrandHealthScore {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    const checks: HealthCheckItem[] = []

    // ── Logo ──
    if (tenant.theme.logo && tenant.theme.logo.length > 0) {
      checks.push({
        field: 'logo',
        label: '品牌 Logo',
        status: 'pass',
        message: '已配置品牌 Logo',
      })
    } else {
      checks.push({
        field: 'logo',
        label: '品牌 Logo',
        status: 'fail',
        message: '品牌 Logo 未配置 — 建议上传品牌图片',
      })
    }

    // ── Favicon ──
    if (tenant.theme.favicon && tenant.theme.favicon.length > 0) {
      checks.push({
        field: 'favicon',
        label: '浏览器图标 (Favicon)',
        status: 'pass',
        message: '已配置 Favicon',
      })
    } else {
      checks.push({
        field: 'favicon',
        label: '浏览器图标 (Favicon)',
        status: 'warn',
        message: 'Favicon 未配置 — 浏览器标签页将显示默认图标',
      })
    }

    // ── Primary color ──
    if (tenant.theme.primaryColor && tenant.theme.primaryColor !== '#0066FF') {
      checks.push({
        field: 'primaryColor',
        label: '品牌主色',
        status: 'pass',
        message: '主色已自定义',
      })
    } else {
      checks.push({
        field: 'primaryColor',
        label: '品牌主色',
        status: 'warn',
        message: '主色仍为默认值 — 建议自定义以体现品牌特色',
      })
    }

    // ── Custom domain ──
    if (tenant.domain.customDomain && tenant.domain.customDomain.length > 0) {
      checks.push({
        field: 'customDomain',
        label: '自定义域名',
        status: 'pass',
        message: `已配置自定义域名: ${tenant.domain.customDomain}`,
      })
    } else {
      checks.push({
        field: 'customDomain',
        label: '自定义域名',
        status: 'warn',
        message: '未配置自定义域名 — 使用系统默认域名',
      })
    }

    // ── SSL ──
    if (tenant.domain.sslEnabled) {
      checks.push({
        field: 'ssl',
        label: 'SSL 证书',
        status: 'pass',
        message: 'SSL 已启用',
      })
    } else {
      checks.push({
        field: 'ssl',
        label: 'SSL 证书',
        status: 'warn',
        message: 'SSL 未启用 — 建议启用 HTTPS 加密',
      })
    }

    // ── Email templates ──
    const requiredTemplates: EmailTemplateType[] = ['welcome', 'order_confirm']
    const missingRequired = requiredTemplates.filter(
      t => !tenant.emailTemplates.find(et => et.templateType === t),
    )
    const hasAnyTemplate = tenant.emailTemplates.length > 0

    if (hasAnyTemplate && missingRequired.length === 0) {
      checks.push({
        field: 'emailTemplates',
        label: '邮件模板',
        status: 'pass',
        message: `已配置 ${tenant.emailTemplates.length} 个邮件模板，包含必填模板`,
      })
    } else if (hasAnyTemplate) {
      checks.push({
        field: 'emailTemplates',
        label: '邮件模板',
        status: 'warn',
        message: `已配置 ${tenant.emailTemplates.length} 个模板，但缺少: ${missingRequired.join(', ')}`,
      })
    } else {
      checks.push({
        field: 'emailTemplates',
        label: '邮件模板',
        status: 'fail',
        message: '未配置邮件模板 — 至少需要 welcome 和 order_confirm',
      })
    }

    // ── Font family ──
    if (tenant.theme.fontFamily && tenant.theme.fontFamily !== 'Inter, sans-serif') {
      checks.push({
        field: 'fontFamily',
        label: '字体设置',
        status: 'pass',
        message: `已自定义字体: ${tenant.theme.fontFamily}`,
      })
    } else {
      checks.push({
        field: 'fontFamily',
        label: '字体设置',
        status: 'warn',
        message: '字体为默认值 — 如已满意可忽略',
      })
    }

    // ── Inject scripts ──
    const scripts = this.injectScripts.get(tenantId)
    if (scripts && scripts.length > 0) {
      checks.push({
        field: 'injectScripts',
        label: '自定义脚本',
        status: 'pass',
        message: `已配置 ${scripts.filter(s => s.enabled).length} 个已启用脚本`,
      })
    } else {
      checks.push({
        field: 'injectScripts',
        label: '自定义脚本',
        status: 'pass',
        message: '未配置自定义脚本（非必需）',
      })
    }

    // ── Locale settings ──
    const locales = this.localeSettings.get(tenantId)
    if (locales && locales.length > 0) {
      checks.push({
        field: 'locales',
        label: '多语言设置',
        status: 'pass',
        message: `已配置 ${locales.length} 种语言`,
      })
    } else {
      checks.push({
        field: 'locales',
        label: '多语言设置',
        status: 'pass',
        message: '未配置多语言（非必需，默认使用品牌名称）',
      })
    }

    // ── Custom fonts ──
    const fonts = this.customFonts.get(tenantId)
    if (fonts && fonts.length > 0) {
      checks.push({
        field: 'customFonts',
        label: '自定义字体',
        status: 'pass',
        message: `已注册 ${fonts.length} 种自定义字体`,
      })
    } else {
      checks.push({
        field: 'customFonts',
        label: '自定义字体',
        status: 'pass',
        message: '未注册自定义字体（非必需）',
      })
    }

    // Calculate completeness score
    const passCount = checks.filter(c => c.status === 'pass').length
    const totalChecks = checks.length
    const completeness = totalChecks > 0 ? Math.round((passCount / totalChecks) * 100) : 100

    return {
      tenantId,
      brandName: tenant.theme.brandName,
      completeness,
      checks,
    }
  }

  /**
   * 生成全租户品牌完整性报告
   */
  getCompletenessReport(): CompletenessReport {
    const allTenants = Array.from(this.tenants.values())
    const scores = allTenants.map(t => this.healthCheck(t.tenantId))
    const totalCompleteness = scores.reduce((sum, s) => sum + s.completeness, 0)

    return {
      generatedAt: new Date(),
      totalTenants: allTenants.length,
      averageCompleteness: allTenants.length > 0
        ? Math.round(totalCompleteness / allTenants.length)
        : 0,
      scores,
    }
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
