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
