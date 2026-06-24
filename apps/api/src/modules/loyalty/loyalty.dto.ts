import { IsArray, IsEnum, IsISO8601, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'
import { CouponDiscountType, LoyaltyPlanStatus } from './loyalty.entity'

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
