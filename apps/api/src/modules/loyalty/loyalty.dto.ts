import { IsArray, IsBoolean, IsEnum, IsISO8601, IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'
import { BlindboxRewardTier, CouponDiscountType, LoyaltyPlanStatus } from './loyalty.entity'

/**
 * 积分台账查询 DTO
 */
export class PointsLedgerQueryDto {
  @IsString()
  @IsOptional()
  orderId?: string

  @IsString()
  @IsOptional()
  memberId?: string
}

/**
 * 优惠券核销查询 DTO
 */
export class CouponRedemptionQueryDto {
  @IsString()
  @IsOptional()
  orderId?: string

  @IsString()
  @IsOptional()
  memberId?: string

  @IsString()
  @IsOptional()
  couponCode?: string
}

/**
 * 盲盒履约查询 DTO
 */
export class BlindboxFulfillmentQueryDto {
  @IsString()
  @IsOptional()
  orderId?: string

  @IsString()
  @IsOptional()
  memberId?: string

  @IsString()
  @IsOptional()
  blindboxPlanId?: string
}

export class BlindboxDrawAuditQueryDto {
  @IsString()
  @IsOptional()
  memberId?: string

  @IsString()
  @IsOptional()
  planId?: string

  @IsString()
  @IsOptional()
  blindboxPlanId?: string

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number
}

export class BlindboxProbabilityOverviewQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  historyOffset?: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  historyLimit?: number
}

/**
 * 结算查询 DTO
 */
export class SettlementQueryDto {
  @IsString()
  @IsOptional()
  memberId?: string
}

export class BlindboxRewardEntryDto {
  @IsString()
  sku!: string

  @IsNumber()
  @Min(0)
  weight!: number

  @IsString()
  label!: string

  @IsEnum(BlindboxRewardTier)
  @IsOptional()
  tier?: BlindboxRewardTier
}

export class BlindboxCaseGuaranteeDto {
  @IsNumber()
  @Min(1)
  caseSize!: number

  @IsEnum(BlindboxRewardTier)
  guaranteedTier!: BlindboxRewardTier

  @IsBoolean()
  @IsOptional()
  distinctRewards?: boolean
}

export class RegisterCouponPlanDto {
  @IsString()
  code!: string

  @IsString()
  title!: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(CouponDiscountType)
  discountType!: CouponDiscountType

  @IsNumber()
  @Min(0)
  discountValue!: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  minOrderAmount?: number

  @IsNumber()
  @Min(1)
  totalQuota!: number

  @IsNumber()
  @Min(1)
  perMemberLimit!: number

  @IsISO8601()
  validFrom!: string

  @IsISO8601()
  validUntil!: string
}

export class RegisterBlindboxPlanDto {
  @IsString()
  blindboxPlanId!: string

  @IsString()
  title!: string

  @IsString()
  @IsOptional()
  description?: string

  @IsNumber()
  @Min(0)
  unitPrice!: number

  @IsNumber()
  @Min(1)
  totalQuota!: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlindboxRewardEntryDto)
  rewardPool!: BlindboxRewardEntryDto[]

  @ValidateNested()
  @Type(() => BlindboxCaseGuaranteeDto)
  @IsOptional()
  caseGuarantee?: BlindboxCaseGuaranteeDto

  @IsISO8601()
  validFrom!: string

  @IsISO8601()
  validUntil!: string
}

export class ActivateCouponPlanDto {
  @IsEnum(LoyaltyPlanStatus)
  status!: LoyaltyPlanStatus
}

export class ActivateBlindboxPlanDto {
  @IsEnum(LoyaltyPlanStatus)
  status!: LoyaltyPlanStatus
}

export class IssueCouponFromPlanDto {
  @IsString()
  memberId!: string

  @IsString()
  @IsOptional()
  source?: string
}

export class IssueBlindboxFromPlanDto {
  @IsString()
  memberId!: string

  @IsNumber()
  @IsOptional()
  @Min(1)
  quantity?: number
}
