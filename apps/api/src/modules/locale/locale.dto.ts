import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsEnum,
  Min,
  IsISO8601,
  IsDateString
} from 'class-validator'
import 'reflect-metadata'

const TIMEZONES = [
  'Asia/Shanghai', 'Asia/Taipei', 'America/New_York',
  'Asia/Tokyo', 'Asia/Seoul', 'Asia/Bangkok',
  'Asia/Ho_Chi_Minh', 'Asia/Jakarta', 'Asia/Kuala_Lumpur', 'Asia/Singapore'
] as const

const COUNTRY_CODES = ['CN', 'TW', 'US', 'JP', 'KR', 'TH', 'VN', 'ID', 'MY', 'SG'] as const

const FORMAT_TYPES = ['short', 'medium', 'long', 'full'] as const

/**
 * 格式化日期 DTO
 */
export class FormatDateDto {
  @IsDateString()
  @IsNotEmpty()
  date!: string

  @IsString()
  @IsEnum(TIMEZONES)
  timeZone!: string

  @IsString()
  @IsEnum(FORMAT_TYPES)
  format!: string
}

/**
 * 格式化数字 DTO
 */
export class FormatNumberDto {
  @IsNumber()
  value!: number

  @IsString()
  @IsNotEmpty()
  locale!: string
}

/**
 * 格式化货币 DTO
 */
export class FormatCurrencyDto {
  @IsNumber()
  @Min(0)
  amount!: number

  @IsString()
  @IsNotEmpty()
  currency!: string

  @IsString()
  @IsNotEmpty()
  locale!: string
}

/**
 * 时区转换 DTO
 */
export class ConvertTimeDto {
  @IsDateString()
  @IsNotEmpty()
  date!: string

  @IsString()
  @IsEnum(TIMEZONES)
  fromTz!: string

  @IsString()
  @IsEnum(TIMEZONES)
  toTz!: string
}

/**
 * 判断工作日 DTO
 */
export class IsWorkdayDto {
  @IsDateString()
  @IsNotEmpty()
  date!: string

  @IsString()
  @IsEnum(TIMEZONES)
  timeZone!: string

  @IsOptional()
  @IsString()
  @IsEnum(COUNTRY_CODES)
  countryCode?: string
}

/**
 * 配置更新 DTO
 */
export class ConfigUpdateDto {
  @IsOptional()
  @IsString()
  @IsEnum(TIMEZONES)
  defaultTimeZone?: string

  @IsOptional()
  @IsString()
  @IsEnum(FORMAT_TYPES)
  dateFormat?: string

  @IsOptional()
  @IsString()
  locale?: string
}
