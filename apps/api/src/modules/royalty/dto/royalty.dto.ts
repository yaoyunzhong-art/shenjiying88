import {
  IsArray,
  IsDefined,
  IsNumber,
  IsOptional,
  IsEnum,
  IsISO8601,
  IsString,
  IsBoolean,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'
import { RoyaltyType, RoyaltyStatus } from '../royalty.entity'

/**
 * 创建分润规则 DTO
 */
export class CreateRoyaltyRuleDto {
  @IsString()
  @MinLength(1)
  brandId!: string

  @IsString()
  @IsOptional()
  collabProjectId?: string

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name!: string

  @IsEnum(RoyaltyType)
  royaltyType!: RoyaltyType

  @IsNumber()
  @Min(0)
  @Max(100)
  rate!: number

  @IsNumber()
  @Min(0)
  fixedAmount!: number

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  tierConfig?: string

  @IsISO8601()
  effectiveDate!: string

  @IsString()
  @IsOptional()
  @IsISO8601()
  expirationDate?: string

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string
}

/**
 * 更新分润规则 DTO
 */
export class UpdateRoyaltyRuleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  @IsOptional()
  name?: string

  @IsEnum(RoyaltyType)
  @IsOptional()
  royaltyType?: RoyaltyType

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  rate?: number

  @IsNumber()
  @Min(0)
  @IsOptional()
  fixedAmount?: number

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  tierConfig?: string

  @IsEnum(RoyaltyStatus)
  @IsOptional()
  status?: RoyaltyStatus

  @IsISO8601()
  @IsOptional()
  effectiveDate?: string

  @IsString()
  @IsOptional()
  @IsISO8601()
  expirationDate?: string

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string
}

/**
 * 分润规则过滤 DTO
 */
export class RoyaltyRuleFilterDto {
  @IsString()
  @IsOptional()
  brandId?: string

  @IsEnum(RoyaltyType)
  @IsOptional()
  royaltyType?: RoyaltyType

  @IsEnum(RoyaltyStatus)
  @IsOptional()
  status?: RoyaltyStatus

  @IsString()
  @IsOptional()
  collabProjectId?: string
}

/**
 * 分润计算请求 DTO
 */
export class CalculateRoyaltyDto {
  @IsString()
  @MinLength(1)
  brandId!: string

  @IsString()
  @MinLength(1)
  orderId!: string

  @IsNumber()
  @Min(0)
  orderAmount!: number

  @IsString()
  @IsOptional()
  ruleId?: string

  @IsString()
  @IsOptional()
  collabProjectId?: string

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string
}

/**
 * 分润结算回流的查询过滤 DTO
 */
export class RoyaltyCalculationFilterDto {
  @IsString()
  @IsOptional()
  brandId?: string

  @IsString()
  @IsOptional()
  ruleId?: string

  @IsBoolean()
  @IsOptional()
  settled?: boolean

  @IsISO8601()
  @IsOptional()
  startDate?: string

  @IsISO8601()
  @IsOptional()
  endDate?: string
}

/**
 * 分润回流请求 DTO
 */
export class SettleRoyaltyDto {
  @IsArray()
  @IsString({ each: true })
  calculationIds!: string[]
}
