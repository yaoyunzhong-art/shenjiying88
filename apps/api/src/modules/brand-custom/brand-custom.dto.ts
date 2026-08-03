import {
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

// ── 品牌主题 DTO ─────────────────────────────────────────────────────────────

export class BrandThemeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  brandName!: string

  @IsOptional()
  @IsString()
  logo?: string

  @IsOptional()
  @IsString()
  favicon?: string

  @IsString()
  @IsNotEmpty()
  primaryColor!: string

  @IsString()
  @IsNotEmpty()
  secondaryColor!: string

  @IsString()
  @IsNotEmpty()
  accentColor!: string

  @IsOptional()
  @IsString()
  fontFamily?: string

  @IsString()
  @IsNotEmpty()
  backgroundColor!: string

  @IsString()
  @IsNotEmpty()
  textColor!: string

  @IsOptional()
  @IsObject()
  cssVariables?: Record<string, string>
}

// ── 域名配置 DTO ─────────────────────────────────────────────────────────────

export class DomainConfigDto {
  @IsOptional()
  @IsString()
  customDomain?: string

  @IsOptional()
  @IsString()
  cdnDomain?: string

  @IsOptional()
  @IsString()
  apiSubdomain?: string

  @IsOptional()
  @IsString()
  webSubdomain?: string

  @IsOptional()
  @IsBoolean()
  sslEnabled?: boolean

  @IsOptional()
  @IsString()
  sslCertId?: string
}

// ── 邮件模板类型枚举 ─────────────────────────────────────────────────────────

export enum EmailTemplateTypeEnum {
  WELCOME = 'welcome',
  ORDER_CONFIRM = 'order_confirm',
  REFUND = 'refund',
  MARKETING = 'marketing',
  RESET_PASSWORD = 'reset_password',
  SVIP_UPGRADE = 'svip_upgrade',
}

// ── 邮件模板 DTO ─────────────────────────────────────────────────────────────

export class EmailTemplateDto {
  @IsEnum(EmailTemplateTypeEnum)
  templateType!: EmailTemplateTypeEnum

  @IsString()
  @IsNotEmpty()
  subject!: string

  @IsString()
  @IsNotEmpty()
  htmlContent!: string

  @IsString()
  @IsNotEmpty()
  textContent!: string

  @IsOptional()
  @IsString()
  footerText?: string

  @IsOptional()
  @IsString()
  senderName?: string

  @IsOptional()
  @IsString()
  senderEmail?: string
}

// ── 渲染邮件 DTO ─────────────────────────────────────────────────────────────

export class RenderEmailDto {
  @IsEnum(EmailTemplateTypeEnum)
  templateType!: EmailTemplateTypeEnum

  @IsObject()
  variables!: Record<string, string>
}

// ── 发送测试邮件 DTO ─────────────────────────────────────────────────────────

export class SendTestEmailDto {
  @IsEnum(EmailTemplateTypeEnum)
  templateType!: EmailTemplateTypeEnum

  @IsString()
  @IsNotEmpty()
  recipient!: string
}

// ── 注册租户 DTO ─────────────────────────────────────────────────────────────

export class RegisterTenantDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string

  @IsString()
  @IsNotEmpty()
  brandName!: string
}

// ── 应用主题 DTO ─────────────────────────────────────────────────────────────

export class ApplyThemeDto {
  @IsOptional()
  @IsString()
  brandName?: string

  @IsOptional()
  @IsString()
  logo?: string

  @IsOptional()
  @IsString()
  favicon?: string

  @IsOptional()
  @IsString()
  primaryColor?: string

  @IsOptional()
  @IsString()
  secondaryColor?: string

  @IsOptional()
  @IsString()
  accentColor?: string

  @IsOptional()
  @IsString()
  fontFamily?: string

  @IsOptional()
  @IsString()
  backgroundColor?: string

  @IsOptional()
  @IsString()
  textColor?: string

  @IsOptional()
  @IsObject()
  cssVariables?: Record<string, string>
}

// ── 应用预设主题 DTO ─────────────────────────────────────────────────────────

export class ApplyPresetDto {
  @IsString()
  @IsNotEmpty()
  presetId!: string
}

// ── 域名配置更新 DTO ─────────────────────────────────────────────────────────

export class ConfigureDomainDto {
  @IsOptional()
  @IsString()
  customDomain?: string

  @IsOptional()
  @IsString()
  cdnDomain?: string

  @IsOptional()
  @IsString()
  apiSubdomain?: string

  @IsOptional()
  @IsString()
  webSubdomain?: string

  @IsOptional()
  @IsBoolean()
  sslEnabled?: boolean

  @IsOptional()
  @IsString()
  sslCertId?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// 新增：品牌版本管理 DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateVersionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  note!: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// 新增：自定义脚本注入 DTO
// ═══════════════════════════════════════════════════════════════════════════════

export enum InjectScriptLocationEnum {
  HEAD = 'head',
  BODY_START = 'body_start',
  BODY_END = 'body_end',
}

export class SetInjectScriptDto {
  @IsEnum(InjectScriptLocationEnum)
  @IsNotEmpty()
  location!: InjectScriptLocationEnum

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  content!: string

  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}

export class UpdateInjectScriptDto {
  @IsOptional()
  @IsEnum(InjectScriptLocationEnum)
  location?: InjectScriptLocationEnum

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  content?: string

  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════════
// 新增：自定义字体管理 DTO
// ═══════════════════════════════════════════════════════════════════════════════

export enum FontFormatEnum {
  WOFF = 'woff',
  WOFF2 = 'woff2',
  TTF = 'ttf',
  EOT = 'eot',
}

export class RegisterFontDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string

  @IsString()
  @IsNotEmpty()
  url!: string

  @IsEnum(FontFormatEnum)
  @IsNotEmpty()
  format!: FontFormatEnum

  @IsOptional()
  @IsString()
  weight?: string

  @IsOptional()
  @IsString()
  style?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// 新增：多语言品牌设置 DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class SetLocaleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(10)
  locale!: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  brandName?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tagline?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// 新增：版本差异 DTO（响应类型）
// ═══════════════════════════════════════════════════════════════════════════════

export class VersionDiffResponse {
  version1!: { id: string; createdAt: Date }
  version2!: { id: string; createdAt: Date }
  themeChanges!: {
    field: string
    label: string
    before: string | undefined
    after: string | undefined
  }[]
  domainChanges!: {
    field: string
    label: string
    before: string | undefined
    after: string | undefined
  }[]
  hasChanges!: boolean
}

// ── 预览主题 DTO ─────────────────────────────────────────────────────────────

export class PreviewThemeDto {
  @IsOptional()
  @IsString()
  brandName?: string

  @IsOptional()
  @IsString()
  logo?: string

  @IsOptional()
  @IsString()
  primaryColor?: string

  @IsOptional()
  @IsString()
  secondaryColor?: string

  @IsOptional()
  @IsString()
  accentColor?: string

  @IsOptional()
  @IsString()
  fontFamily?: string

  @IsOptional()
  @IsString()
  backgroundColor?: string

  @IsOptional()
  @IsString()
  textColor?: string
}
