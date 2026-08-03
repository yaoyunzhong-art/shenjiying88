/**
 * 品牌定制模块 - 实体/类型定义
 */

// ── 品牌主题 ─────────────────────────────────────────────────────────────────

export interface BrandTheme {
  brandId: string
  brandName: string
  logo: string
  favicon: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily?: string
  backgroundColor: string
  textColor: string
  cssVariables?: Record<string, string>
}

// ── 域名配置 ─────────────────────────────────────────────────────────────────

export interface DomainConfig {
  brandId: string
  customDomain?: string
  cdnDomain?: string
  apiSubdomain?: string
  webSubdomain?: string
  sslEnabled: boolean
  sslCertId?: string
}

// ── 邮件模板 ─────────────────────────────────────────────────────────────────

export type EmailTemplateType =
  | 'welcome'
  | 'order_confirm'
  | 'refund'
  | 'marketing'
  | 'reset_password'
  | 'svip_upgrade'

export interface EmailTemplate {
  brandId: string
  templateType: EmailTemplateType
  subject: string
  htmlContent: string
  textContent: string
  footerText?: string
  senderName?: string
  senderEmail?: string
}

// ── DNS 记录 ─────────────────────────────────────────────────────────────────

export interface DNSRecord {
  type: 'A' | 'CNAME'
  name: string
  value: string
  ttl: number
}

// ── 预设主题 ─────────────────────────────────────────────────────────────────

export interface PresetTheme {
  id: string
  name: string
  theme: Partial<BrandTheme>
}

// ── 租户品牌 ─────────────────────────────────────────────────────────────────

export interface TenantBrand {
  tenantId: string
  theme: BrandTheme
  domain: DomainConfig
  emailTemplates: EmailTemplate[]
  active: boolean
  createdAt: Date
}

// ── 渲染邮件结果 ────────────────────────────────────────────────────────────

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

// ── 预览主题结果 ────────────────────────────────────────────────────────────

export interface PreviewThemeResult {
  html: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// 新增：品牌版本管理
// ═══════════════════════════════════════════════════════════════════════════════

export interface BrandVersion {
  id: string
  tenantId: string
  theme: BrandTheme
  domainConfig: DomainConfig
  note: string
  createdAt: Date
}

export interface VersionDiffResult {
  version1: { id: string; createdAt: Date }
  version2: { id: string; createdAt: Date }
  themeChanges: ThemeDiffEntry[]
  domainChanges: DomainDiffEntry[]
  hasChanges: boolean
}

export interface ThemeDiffEntry {
  field: string
  label: string
  before: string | undefined
  after: string | undefined
}

export interface DomainDiffEntry {
  field: string
  label: string
  before: string | undefined
  after: string | undefined
}

// ═══════════════════════════════════════════════════════════════════════════════
// 新增：自定义脚本注入
// ═══════════════════════════════════════════════════════════════════════════════

export type InjectScriptLocation = 'head' | 'body_start' | 'body_end'

export interface InjectScript {
  id: string
  tenantId: string
  location: InjectScriptLocation
  name: string
  content: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

// ═══════════════════════════════════════════════════════════════════════════════
// 新增：自定义字体管理
// ═══════════════════════════════════════════════════════════════════════════════

export type FontFormat = 'woff' | 'woff2' | 'ttf' | 'eot'

export interface CustomFont {
  id: string
  tenantId: string
  name: string
  url: string
  format: FontFormat
  weight?: string
  style?: string
  createdAt: Date
}

// ═══════════════════════════════════════════════════════════════════════════════
// 新增：多语言品牌设置
// ═══════════════════════════════════════════════════════════════════════════════

export interface LocaleSetting {
  tenantId: string
  locale: string
  brandName: string
  description?: string
  tagline?: string
  updatedAt: Date
}

// ═══════════════════════════════════════════════════════════════════════════════
// 新增：品牌健康检查
// ═══════════════════════════════════════════════════════════════════════════════

export type HealthCheckStatus = 'pass' | 'fail' | 'warn'

export interface HealthCheckItem {
  field: string
  label: string
  status: HealthCheckStatus
  message: string
}

export interface BrandHealthScore {
  tenantId: string
  brandName: string
  completeness: number
  checks: HealthCheckItem[]
}

export interface CompletenessReport {
  generatedAt: Date
  totalTenants: number
  averageCompleteness: number
  scores: BrandHealthScore[]
}
