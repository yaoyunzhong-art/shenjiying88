import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max
} from 'class-validator'
import 'reflect-metadata'
import { SvipBenefitType, SvipMemberStatus, SvipTierLevel } from './svip.entity'

/**
 * SVIP 等级 DTO
 */
export class SvipTierDto {
  @IsString()
  @IsOptional()
  id?: string

  @IsString()
  name!: string

  @IsNumber()
  @Min(1)
  @Max(5)
  level!: number

  @IsNumber()
  @Min(0)
  minSpendAmount!: number

  @IsNumber()
  @Min(0)
  minPoints!: number

  @IsArray()
  @IsString({ each: true })
  benefits!: string[]

  @IsString()
  @IsOptional()
  icon?: string

  @IsString()
  @IsOptional()
  color?: string
}

/**
 * 创建 SVIP 会员 DTO
 */
export class CreateSvipMemberDto {
  @IsString()
  memberId!: string

  @IsString()
  tierId!: string

  @IsNumber()
  @Min(0)
  totalSpend!: number

  @IsNumber()
  @Min(0)
  currentPoints!: number

  @IsISO8601()
  @IsOptional()
  joinedAt?: string

  @IsISO8601()
  expiresAt!: string

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean

  @IsString()
  @IsOptional()
  brandId?: string

  @IsString()
  @IsOptional()
  storeId?: string
}

/**
 * SVIP 权益 DTO
 */
export class SvipBenefitDto {
  @IsString()
  @IsOptional()
  id?: string

  @IsString()
  tierId!: string

  @IsEnum(SvipBenefitType)
  benefitType!: SvipBenefitType

  @IsString()
  benefitValue!: string

  @IsString()
  description!: string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

/**
 * SVIP 升降级 DTO
 */
export class SvipUpgradeDto {
  @IsString()
  memberId!: string

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  targetTierLevel?: number

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalSpend?: number

  @IsNumber()
  @Min(0)
  @IsOptional()
  currentPoints?: number

  @IsString()
  @IsOptional()
  reason?: string
}

/**
 * SVIP 权益使用 DTO
 */
export class UseSvipBenefitDto {
  @IsString()
  memberId!: string

  @IsEnum(SvipBenefitType)
  benefitType!: SvipBenefitType

  @IsString()
  @IsOptional()
  referenceOrderId?: string

  @IsString()
  @IsOptional()
  referencePaymentId?: string
}

/**
 * SVIP 会员查询 DTO
 */
export class SvipMemberQueryDto {
  @IsString()
  @IsOptional()
  memberId?: string

  @IsEnum(SvipMemberStatus)
  @IsOptional()
  status?: SvipMemberStatus

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  tierLevel?: number
}

/**
 * SVIP 等级查询 DTO
 */
export class SvipTierQueryDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  level?: number
}
