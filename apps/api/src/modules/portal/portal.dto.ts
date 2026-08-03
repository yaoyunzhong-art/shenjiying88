import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  MinLength,
  MaxLength,
  IsNotEmpty
} from 'class-validator'
import {
  PortalAudience,
  PortalScopeType,
  PortalChannel,
  StorefrontSurface,
  LanguageCode,
  type PortalDomainSource,
} from '@m5/domain'

const PORTAL_DOMAIN_SOURCE_VALUES = ['custom', 'default'] as const

/**
 * 门户登录入口 DTO
 */
export class PortalLoginEntryDto {
  @ApiProperty({ description: '登录入口文案', example: '进入租户后台' })
  @IsString()
  @IsNotEmpty()
  label!: string

  @ApiProperty({ description: '登录路径', example: '/cn-mainland/tenant-001/login' })
  @IsString()
  @IsNotEmpty()
  loginPath!: string

  @ApiProperty({ description: '是否启用 SSO', example: true })
  @IsBoolean()
  ssoEnabled!: boolean
}

/**
 * 创建门户请求 DTO
 */
export class CreatePortalDto {
  @ApiProperty({ example: 'tenant-001' })
  @IsString()
  @IsNotEmpty()
  tenantId!: string

  @ApiPropertyOptional({ example: 'brand-001' })
  @IsString()
  @IsOptional()
  brandId?: string

  @ApiPropertyOptional({ example: 'store-001' })
  @IsString()
  @IsOptional()
  storeId?: string

  @ApiProperty({ enum: PortalAudience, example: PortalAudience.ToB })
  @IsEnum(PortalAudience)
  audience!: PortalAudience

  @ApiProperty({ enum: PortalScopeType, example: PortalScopeType.Tenant })
  @IsEnum(PortalScopeType)
  scopeType!: PortalScopeType

  @ApiProperty({ example: 'tenant-001' })
  @IsString()
  @IsNotEmpty()
  scopeCode!: string

  @ApiProperty({ example: 'cn-mainland' })
  @IsString()
  @IsNotEmpty()
  marketCode!: string

  @ApiProperty({ enum: PortalChannel, example: PortalChannel.Web })
  @IsEnum(PortalChannel)
  channel!: PortalChannel

  @ApiProperty({ example: 'tenant-001 ToB 官网', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string

  @ApiPropertyOptional({ example: 'tenant-001.cn-mainland.b2b.local' })
  @IsString()
  @IsOptional()
  primaryDomain?: string

  @ApiProperty({ enum: LanguageCode, isArray: true, example: [LanguageCode.ZhCn] })
  @IsArray()
  @IsEnum(LanguageCode, { each: true })
  supportedLanguages!: LanguageCode[]

  @ApiPropertyOptional({ example: 'tenant-001 企业级经营门户' })
  @IsString()
  @IsOptional()
  heroTitle?: string

  @ApiPropertyOptional({ example: '统一 SaaS 官网入口' })
  @IsString()
  @IsOptional()
  heroSubtitle?: string

  @ApiPropertyOptional({ type: () => [String], example: ['多租户', '国际化配置'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  solutionTags?: string[]

  @ApiPropertyOptional({ type: () => PortalLoginEntryDto })
  @IsOptional()
  loginEntry?: PortalLoginEntryDto

  @ApiPropertyOptional({
    enum: StorefrontSurface,
    isArray: true,
    example: [StorefrontSurface.OfficialSite, StorefrontSurface.H5],
  })
  @IsArray()
  @IsEnum(StorefrontSurface, { each: true })
  @IsOptional()
  supportedSurfaces?: StorefrontSurface[]

  @ApiPropertyOptional({ example: 'store-001 门店' })
  @IsString()
  @IsOptional()
  storeName?: string
}

/**
 * 更新门户请求 DTO
 */
export class UpdatePortalDto {
  @ApiPropertyOptional({ example: '更新后的门户名称', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ example: 'tenant-001.cn-mainland.b2b.local' })
  @IsString()
  @IsOptional()
  primaryDomain?: string

  @ApiPropertyOptional({ enum: LanguageCode, isArray: true })
  @IsArray()
  @IsEnum(LanguageCode, { each: true })
  @IsOptional()
  supportedLanguages?: LanguageCode[]

  @ApiPropertyOptional({ example: '更新后的门户标题' })
  @IsString()
  @IsOptional()
  heroTitle?: string

  @ApiPropertyOptional({ example: '更新后的副标题' })
  @IsString()
  @IsOptional()
  heroSubtitle?: string

  @ApiPropertyOptional({ type: () => [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  solutionTags?: string[]

  @ApiPropertyOptional({ type: () => PortalLoginEntryDto })
  @IsOptional()
  loginEntry?: PortalLoginEntryDto

  @ApiPropertyOptional({ enum: StorefrontSurface, isArray: true })
  @IsArray()
  @IsEnum(StorefrontSurface, { each: true })
  @IsOptional()
  supportedSurfaces?: StorefrontSurface[]

  @ApiPropertyOptional({ example: '更新后的门店名称' })
  @IsString()
  @IsOptional()
  storeName?: string
}

/**
 * 门户查询参数 DTO
 */
export class PortalQueryDto {
  @ApiPropertyOptional({ example: 'tenant-001' })
  @IsString()
  @IsOptional()
  tenantId?: string

  @ApiPropertyOptional({ example: 'brand-001' })
  @IsString()
  @IsOptional()
  brandId?: string

  @ApiPropertyOptional({ example: 'store-001' })
  @IsString()
  @IsOptional()
  storeId?: string

  @ApiPropertyOptional({ enum: PortalAudience, example: PortalAudience.ToB })
  @IsEnum(PortalAudience)
  @IsOptional()
  audience?: PortalAudience

  @ApiPropertyOptional({ enum: PortalScopeType, example: PortalScopeType.Brand })
  @IsEnum(PortalScopeType)
  @IsOptional()
  scopeType?: PortalScopeType

  @ApiPropertyOptional({ example: 'cn-mainland' })
  @IsString()
  @IsOptional()
  marketCode?: string
}

export class PortalDto extends CreatePortalDto {
  @ApiProperty({
    description: '主域名来源，custom 表示来自自定义主域名，default 表示平台默认域名回退',
    enum: PORTAL_DOMAIN_SOURCE_VALUES,
    example: 'custom',
  })
  domainSource!: PortalDomainSource
}

export class MarketProfileLocaleDto {
  @ApiProperty({ example: 'zh-CN' })
  defaultLanguage!: string

  @ApiProperty({ type: () => [String], example: ['zh-CN', 'en-US'] })
  supportedLanguages!: string[]
}

export class MarketProfileTimezoneDto {
  @ApiProperty({ example: 'Asia/Shanghai' })
  timezone!: string
}

export class MarketProfileCurrencyDto {
  @ApiProperty({ example: 'CNY' })
  currencyCode!: string

  @ApiProperty({ example: '¥' })
  symbol!: string
}

export class MarketProfileTaxDto {
  @ApiProperty({ example: 'INCLUDED' })
  taxMode!: string

  @ApiProperty({ example: 13 })
  taxRate!: number

  @ApiProperty({ example: '增值税' })
  taxLabel!: string
}

export class MarketProfileNetworkDto {
  @ApiProperty({ example: 'CHINA_MAINLAND' })
  networkRegion!: string

  @ApiProperty({ example: 'https://cn-api.m5.local' })
  apiBaseUrl!: string

  @ApiProperty({ example: 'https://cn-cdn.m5.local' })
  cdnBaseUrl!: string

  @ApiProperty({ example: 'https://cn-hooks.m5.local' })
  callbackBaseUrl!: string
}

export class MarketProfileEmailDto {
  @ApiProperty({ example: 'SMTP' })
  provider!: string

  @ApiProperty({ example: 'M5 CN' })
  fromName!: string

  @ApiProperty({ example: 'hello@cn.local' })
  fromAddress!: string

  @ApiProperty({ example: 'support@cn.local' })
  replyTo!: string
}

export class MarketProfileSocialDto {
  @ApiProperty({ type: () => [String], example: ['WECHAT'] })
  primaryPlatforms!: string[]

  @ApiProperty({ type: () => [String], example: [] })
  supportPlatforms!: string[]
}

export class MarketProfileDto {
  @ApiProperty({ example: 'cn-mainland' })
  marketCode!: string

  @ApiProperty({ example: '中国大陆' })
  marketName!: string

  @ApiProperty({ example: 'CN' })
  countryCode!: string

  @ApiProperty({ type: () => MarketProfileLocaleDto })
  locale!: MarketProfileLocaleDto

  @ApiProperty({ type: () => MarketProfileTimezoneDto })
  timezone!: MarketProfileTimezoneDto

  @ApiProperty({ type: () => MarketProfileCurrencyDto })
  currency!: MarketProfileCurrencyDto

  @ApiProperty({ type: () => MarketProfileTaxDto })
  tax!: MarketProfileTaxDto

  @ApiProperty({ type: () => MarketProfileNetworkDto })
  network!: MarketProfileNetworkDto

  @ApiProperty({ type: () => MarketProfileEmailDto })
  email!: MarketProfileEmailDto

  @ApiProperty({ type: () => MarketProfileSocialDto })
  social!: MarketProfileSocialDto
}

export class RegionalOverrideLocaleDto {
  @ApiPropertyOptional({ example: 'zh-CN' })
  defaultLanguage?: string

  @ApiPropertyOptional({ type: () => [String], example: ['zh-CN', 'en-US'] })
  supportedLanguages?: string[]
}

export class RegionalOverrideTimezoneDto {
  @ApiPropertyOptional({ example: 'Asia/Shanghai' })
  timezone?: string
}

export class RegionalOverrideCurrencyDto {
  @ApiPropertyOptional({ example: 'CNY' })
  currencyCode?: string

  @ApiPropertyOptional({ example: '¥' })
  symbol?: string
}

export class RegionalOverrideTaxDto {
  @ApiPropertyOptional({ example: 'INCLUDED' })
  taxMode?: string

  @ApiPropertyOptional({ example: 13 })
  taxRate?: number

  @ApiPropertyOptional({ example: '增值税' })
  taxLabel?: string
}

export class RegionalOverrideNetworkDto {
  @ApiPropertyOptional({ example: 'CHINA_MAINLAND' })
  networkRegion?: string

  @ApiPropertyOptional({ example: 'https://cn-api.m5.local' })
  apiBaseUrl?: string

  @ApiPropertyOptional({ example: 'https://cn-cdn.m5.local' })
  cdnBaseUrl?: string

  @ApiPropertyOptional({ example: 'https://cn-hooks.m5.local' })
  callbackBaseUrl?: string
}

export class RegionalOverrideEmailDto {
  @ApiPropertyOptional({ example: 'SMTP' })
  provider?: string

  @ApiPropertyOptional({ example: 'tenant-demo HQ' })
  fromName?: string

  @ApiPropertyOptional({ example: 'hello@cn.local' })
  fromAddress?: string

  @ApiPropertyOptional({ example: 'support@cn.local' })
  replyTo?: string
}

export class RegionalOverrideSocialDto {
  @ApiPropertyOptional({ type: () => [String], example: ['WECHAT'] })
  primaryPlatforms?: string[]

  @ApiPropertyOptional({ type: () => [String], example: ['WECHAT', 'WEIBO'] })
  supportPlatforms?: string[]
}

export class RegionalOverrideDto {
  @ApiProperty({ example: 'TENANT' })
  scopeType!: string

  @ApiProperty({ example: 'tenant-001' })
  scopeCode!: string

  @ApiPropertyOptional({ example: 'TENANT_DEFAULT' })
  inheritanceMode?: string

  @ApiProperty({ example: 'cn-mainland' })
  marketCode!: string

  @ApiPropertyOptional({ type: () => RegionalOverrideLocaleDto })
  locale?: RegionalOverrideLocaleDto

  @ApiPropertyOptional({ type: () => RegionalOverrideTimezoneDto })
  timezone?: RegionalOverrideTimezoneDto

  @ApiPropertyOptional({ type: () => RegionalOverrideCurrencyDto })
  currency?: RegionalOverrideCurrencyDto

  @ApiPropertyOptional({ type: () => RegionalOverrideTaxDto })
  tax?: RegionalOverrideTaxDto

  @ApiPropertyOptional({ type: () => RegionalOverrideNetworkDto })
  network?: RegionalOverrideNetworkDto

  @ApiPropertyOptional({ type: () => RegionalOverrideEmailDto })
  email?: RegionalOverrideEmailDto

  @ApiPropertyOptional({ type: () => RegionalOverrideSocialDto })
  social?: RegionalOverrideSocialDto
}

export class PortalBootstrapResponseDto {
  @ApiProperty({ type: () => PortalDto })
  tenantPortal!: PortalDto

  @ApiProperty({ type: () => PortalDto })
  brandPortal!: PortalDto

  @ApiProperty({ type: () => PortalDto })
  storePortal!: PortalDto

  @ApiProperty({ type: () => MarketProfileDto })
  marketProfile!: MarketProfileDto

  @ApiProperty({ type: () => [RegionalOverrideDto] })
  regionalOverrides!: RegionalOverrideDto[]

  @ApiProperty({ type: () => [String], example: ['identity-access'] })
  foundationDependencies!: string[]

  @ApiProperty({ type: () => [String], example: ['portal-page:v1'] })
  foundationContracts!: string[]
}

export class PortalDomainGovernanceScopeSummaryDto {
  @ApiProperty({ example: 'BRAND' })
  scopeType!: string

  @ApiProperty({ example: 'tenant-001' })
  tenantId!: string

  @ApiPropertyOptional({ example: 'brand-001' })
  brandId?: string

  @ApiPropertyOptional({ example: 'store-001' })
  storeId?: string

  @ApiProperty({ example: 2 })
  activeDomainCount!: number

  @ApiProperty({ example: true })
  missingPrimary!: boolean

  @ApiPropertyOptional({ example: 'brand-primary.example.io', nullable: true })
  currentPrimaryDomain?: string | null

  @ApiPropertyOptional({ example: 'brand-recommend.example.io', nullable: true })
  recommendedDomain?: string | null

  @ApiPropertyOptional({ example: '优先推荐 active_ssl，且最近一次校验/更新时间更新' })
  recommendationReason?: string
}

export class PortalDomainGovernanceSummaryDto {
  @ApiProperty({ example: 2 })
  totalMissingPrimaryScopes!: number

  @ApiProperty({ example: 3 })
  totalActiveWithoutPrimaryDomains!: number

  @ApiProperty({ example: 2 })
  recommendedReadyScopes!: number

  @ApiProperty({ example: 0 })
  tenantMissingPrimaryScopes!: number

  @ApiProperty({ example: 1 })
  brandMissingPrimaryScopes!: number

  @ApiProperty({ example: 1 })
  storeMissingPrimaryScopes!: number

  @ApiProperty({ example: true })
  requiresAttention!: boolean

  @ApiProperty({ example: '2026-07-18T22:30:00.000Z' })
  lastEvaluatedAt!: string

  @ApiProperty({ type: () => [PortalDomainGovernanceScopeSummaryDto] })
  currentScopes!: PortalDomainGovernanceScopeSummaryDto[]
}
