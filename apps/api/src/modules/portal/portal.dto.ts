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
  LanguageCode
} from '@m5/domain'

/**
 * 门户登录入口 DTO
 */
export class PortalLoginEntryDto {
  @IsString()
  @IsNotEmpty()
  label!: string

  @IsString()
  @IsNotEmpty()
  loginPath!: string

  @IsBoolean()
  ssoEnabled!: boolean
}

/**
 * 创建门户请求 DTO
 */
export class CreatePortalDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string

  @IsString()
  @IsOptional()
  brandId?: string

  @IsString()
  @IsOptional()
  storeId?: string

  @IsEnum(PortalAudience)
  audience!: PortalAudience

  @IsEnum(PortalScopeType)
  scopeType!: PortalScopeType

  @IsString()
  @IsNotEmpty()
  scopeCode!: string

  @IsString()
  @IsNotEmpty()
  marketCode!: string

  @IsEnum(PortalChannel)
  channel!: PortalChannel

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string

  @IsString()
  @IsOptional()
  primaryDomain?: string

  @IsArray()
  @IsEnum(LanguageCode, { each: true })
  supportedLanguages!: LanguageCode[]

  @IsString()
  @IsOptional()
  heroTitle?: string

  @IsString()
  @IsOptional()
  heroSubtitle?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  solutionTags?: string[]

  @IsOptional()
  loginEntry?: PortalLoginEntryDto

  @IsArray()
  @IsEnum(StorefrontSurface, { each: true })
  @IsOptional()
  supportedSurfaces?: StorefrontSurface[]

  @IsString()
  @IsOptional()
  storeName?: string
}

/**
 * 更新门户请求 DTO
 */
export class UpdatePortalDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  primaryDomain?: string

  @IsArray()
  @IsEnum(LanguageCode, { each: true })
  @IsOptional()
  supportedLanguages?: LanguageCode[]

  @IsString()
  @IsOptional()
  heroTitle?: string

  @IsString()
  @IsOptional()
  heroSubtitle?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  solutionTags?: string[]

  @IsOptional()
  loginEntry?: PortalLoginEntryDto

  @IsArray()
  @IsEnum(StorefrontSurface, { each: true })
  @IsOptional()
  supportedSurfaces?: StorefrontSurface[]

  @IsString()
  @IsOptional()
  storeName?: string
}

/**
 * 门户查询参数 DTO
 */
export class PortalQueryDto {
  @IsString()
  @IsOptional()
  tenantId?: string

  @IsString()
  @IsOptional()
  brandId?: string

  @IsString()
  @IsOptional()
  storeId?: string

  @IsEnum(PortalAudience)
  @IsOptional()
  audience?: PortalAudience

  @IsEnum(PortalScopeType)
  @IsOptional()
  scopeType?: PortalScopeType

  @IsString()
  @IsOptional()
  marketCode?: string
}
