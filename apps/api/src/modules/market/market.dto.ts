import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import {
  CountryCode,
  CurrencyCode,
  EmailProvider,
  LanguageCode,
  NetworkRegion,
  SocialPlatform,
  TaxMode
} from '@m5/domain'

// ── MarketLocale DTO ────────────────────────────────────────────────

export class MarketLocaleDto {
  @ApiProperty({ enum: LanguageCode, description: 'Default language for this market' })
  @IsEnum(LanguageCode)
  defaultLanguage!: LanguageCode

  @ApiProperty({ enum: LanguageCode, isArray: true, description: 'All supported languages' })
  @IsArray()
  @IsEnum(LanguageCode, { each: true })
  supportedLanguages!: LanguageCode[]
}

// ── MarketTimezone DTO ──────────────────────────────────────────────

export class MarketTimezoneDto {
  @ApiProperty({ example: 'Asia/Shanghai', description: 'IANA timezone identifier' })
  @IsString()
  timezone!: string
}

// ── MarketCurrency DTO ──────────────────────────────────────────────

export class MarketCurrencyDto {
  @ApiProperty({ enum: CurrencyCode, description: 'ISO 4217 currency code' })
  @IsEnum(CurrencyCode)
  currencyCode!: CurrencyCode

  @ApiProperty({ example: '¥', description: 'Currency symbol for display' })
  @IsString()
  symbol!: string
}

// ── MarketTax DTO ───────────────────────────────────────────────────

export class MarketTaxDto {
  @ApiProperty({ enum: TaxMode, description: 'Tax calculation mode' })
  @IsEnum(TaxMode)
  taxMode!: TaxMode

  @ApiProperty({ example: 6, description: 'Tax rate as percentage' })
  @IsNumber()
  @Min(0)
  taxRate!: number

  @ApiProperty({ example: '增值税', description: 'Human-readable tax label' })
  @IsString()
  taxLabel!: string
}

// ── MarketNetwork DTO ───────────────────────────────────────────────

export class MarketNetworkDto {
  @ApiProperty({ enum: NetworkRegion, description: 'Network deployment region' })
  @IsEnum(NetworkRegion)
  networkRegion!: NetworkRegion

  @ApiProperty({ example: 'https://cn-api.m5.local', description: 'Base URL for API endpoints' })
  @IsString()
  apiBaseUrl!: string

  @ApiProperty({ example: 'https://cn-cdn.m5.local', description: 'Base URL for CDN assets' })
  @IsString()
  cdnBaseUrl!: string

  @ApiProperty({ example: 'https://cn-hooks.m5.local', description: 'Base URL for webhook callbacks' })
  @IsString()
  callbackBaseUrl!: string
}

// ── MarketEmail DTO ─────────────────────────────────────────────────

export class MarketEmailDto {
  @ApiProperty({ enum: EmailProvider, description: 'Email delivery provider' })
  @IsEnum(EmailProvider)
  provider!: EmailProvider

  @ApiProperty({ example: 'M5 China', description: 'Sender display name' })
  @IsString()
  fromName!: string

  @ApiProperty({ example: 'hello-cn@m5.local', description: 'Sender email address' })
  @IsString()
  fromAddress!: string

  @ApiProperty({ example: 'support-cn@m5.local', description: 'Reply-to email address' })
  @IsString()
  replyTo!: string
}

// ── MarketSocial DTO ────────────────────────────────────────────────

export class MarketSocialDto {
  @ApiProperty({ enum: SocialPlatform, isArray: true, description: 'Primary social platforms' })
  @IsArray()
  @IsEnum(SocialPlatform, { each: true })
  primaryPlatforms!: SocialPlatform[]

  @ApiProperty({ enum: SocialPlatform, isArray: true, description: 'All supported social platforms' })
  @IsArray()
  @IsEnum(SocialPlatform, { each: true })
  supportPlatforms!: SocialPlatform[]
}

// ── MarketProfile DTO ───────────────────────────────────────────────

export class MarketProfileDto {
  @ApiProperty({ example: 'cn-mainland', description: 'Unique market code' })
  @IsString()
  marketCode!: string

  @ApiProperty({ example: '中国大陆', description: 'Human-readable market name' })
  @IsString()
  marketName!: string

  @ApiProperty({ enum: CountryCode, description: 'ISO 3166-1 alpha-2 country code' })
  @IsEnum(CountryCode)
  countryCode!: CountryCode

  @ApiProperty({ description: 'Locale configuration' })
  @ValidateNested()
  @Type(() => MarketLocaleDto)
  locale!: MarketLocaleDto

  @ApiProperty({ description: 'Timezone configuration' })
  @ValidateNested()
  @Type(() => MarketTimezoneDto)
  timezone!: MarketTimezoneDto

  @ApiProperty({ description: 'Currency configuration' })
  @ValidateNested()
  @Type(() => MarketCurrencyDto)
  currency!: MarketCurrencyDto

  @ApiProperty({ description: 'Tax configuration' })
  @ValidateNested()
  @Type(() => MarketTaxDto)
  tax!: MarketTaxDto

  @ApiProperty({ description: 'Network configuration' })
  @ValidateNested()
  @Type(() => MarketNetworkDto)
  network!: MarketNetworkDto

  @ApiProperty({ description: 'Email configuration' })
  @ValidateNested()
  @Type(() => MarketEmailDto)
  email!: MarketEmailDto

  @ApiProperty({ description: 'Social media configuration' })
  @ValidateNested()
  @Type(() => MarketSocialDto)
  social!: MarketSocialDto
}

// ── DTOs for API input/output ───────────────────────────────────────

export class CreateMarketProfileDto extends MarketProfileDto {}

export class UpdateMarketProfileDto {
  @ApiPropertyOptional({ example: '中国大陆', description: 'Human-readable market name' })
  @IsOptional()
  @IsString()
  marketName?: string

  @ApiPropertyOptional({ description: 'Locale configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MarketLocaleDto)
  locale?: MarketLocaleDto

  @ApiPropertyOptional({ description: 'Timezone configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MarketTimezoneDto)
  timezone?: MarketTimezoneDto

  @ApiPropertyOptional({ description: 'Currency configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MarketCurrencyDto)
  currency?: MarketCurrencyDto

  @ApiPropertyOptional({ description: 'Tax configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MarketTaxDto)
  tax?: MarketTaxDto

  @ApiPropertyOptional({ description: 'Network configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MarketNetworkDto)
  network?: MarketNetworkDto

  @ApiPropertyOptional({ description: 'Email configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MarketEmailDto)
  email?: MarketEmailDto

  @ApiPropertyOptional({ description: 'Social media configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => MarketSocialDto)
  social?: MarketSocialDto
}

/** Response DTO for the scoped market endpoint */
export class ScopedMarketResponseDto {
  @ApiProperty({ example: 'tenant', description: 'Portal scope type' })
  @IsString()
  scopeType!: string

  @ApiProperty({ example: 'tenant-demo', description: 'Portal scope code' })
  @IsString()
  scopeCode!: string

  @ApiProperty({ description: 'Market profile for the requested scope' })
  @ValidateNested()
  @Type(() => MarketProfileDto)
  marketProfile!: MarketProfileDto
}
