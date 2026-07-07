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
