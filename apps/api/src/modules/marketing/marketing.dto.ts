import 'reflect-metadata'
import { IsArray, IsEnum, IsISO8601, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * Marketing 模块 DTO
 * Phase-42 T172: 智能营销 — RFM + A/B + Coupon + Attribution + ROI + Channel
 */

// ─── RFM ──────────────────────────────────────────────

export class ComputeRFMDto {
  @IsString()
  tenantId!: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[]
}

export class RFMStatsQueryDto {
  @IsString()
  tenantId!: string
}

// ─── A/B ──────────────────────────────────────────────

class VariantDto {
  @IsString()
  id!: string

  @IsString()
  name!: string

  @IsString()
  content!: string

  @IsEnum(['COUPON', 'POINTS', 'DISCOUNT'])
  rewardType!: 'COUPON' | 'POINTS' | 'DISCOUNT'

  @IsNumber()
  rewardValue!: number
}

export class CreateExperimentDto {
  @IsString()
  tenantId!: string

  @IsString()
  campaignId!: string

  @IsString()
  name!: string

  @ValidateNested()
  @Type(() => VariantDto)
  variantA!: VariantDto

  @ValidateNested()
  @Type(() => VariantDto)
  variantB!: VariantDto

  @IsNumber()
  trafficSplit!: number

  @IsNumber()
  @Min(1)
  minSampleSize!: number

  @IsEnum(['DRAFT', 'RUNNING', 'PAUSED', 'ENDED'])
  status!: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'ENDED'

  @IsISO8601()
  startAt!: string

  @IsOptional()
  @IsISO8601()
  endAt?: string
}

export class RecordEventDto {
  @IsString()
  experimentId!: string

  @IsString()
  memberId!: string

  @IsEnum(['impression', 'click', 'conversion'])
  event!: 'impression' | 'click' | 'conversion'

  @IsOptional()
  @IsNumber()
  @Min(0)
  revenueCents?: number
}

export class ABResultQueryDto {
  @IsString()
  experimentId!: string
}

export class ListExperimentsQueryDto {
  @IsString()
  tenantId!: string
}

// ─── Coupon ──────────────────────────────────────────

export class IssueCouponDto {
  @IsString()
  tenantId!: string

  @IsString()
  memberId!: string

  @IsString()
  campaignId!: string

  @IsEnum(['VIP_DISCOUNT', 'LOYAL_REWARD', 'WELCOME_OFFER', 'REACTIVATION', 'GENERIC'])
  couponSegment!: 'VIP_DISCOUNT' | 'LOYAL_REWARD' | 'WELCOME_OFFER' | 'REACTIVATION' | 'GENERIC'

  @IsOptional()
  @IsNumber()
  @Min(0)
  rewardAmount?: number

  @IsOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercent?: number

  @IsNumber()
  @Min(1)
  expiryDays!: number
}

export class AutoIssueCouponDto {
  @IsString()
  tenantId!: string

  @IsString()
  memberId!: string

  @IsString()
  campaignId!: string
}

export class RedeemCouponDto {
  @IsString()
  tenantId!: string

  @IsString()
  recordId!: string
}

export class FreqCapQueryDto {
  @IsString()
  tenantId!: string

  @IsString()
  memberId!: string

  @IsOptional()
  @IsString()
  windowDays?: string

  @IsOptional()
  @IsString()
  maxPerWindow?: string
}

// ─── Attribution ─────────────────────────────────────

export class AttributeDto {
  @IsString()
  memberId!: string

  @IsString()
  conversionId!: string

  @IsNumber()
  @Min(0)
  revenueCents!: number

  @IsOptional()
  @IsEnum(['last', 'multi'])
  mode?: 'last' | 'multi'
}

export class RecordTouchPointDto {
  @IsString()
  id!: string

  @IsString()
  memberId!: string

  @IsOptional()
  @IsString()
  campaignId?: string

  @IsEnum(['IN_APP', 'WECHAT', 'SMS', 'DIRECT', 'ORGANIC'])
  channel!: 'IN_APP' | 'WECHAT' | 'SMS' | 'DIRECT' | 'ORGANIC'

  @IsEnum(['IMPRESSION', 'CLICK', 'CONVERSION'])
  event!: 'IMPRESSION' | 'CLICK' | 'CONVERSION'

  @IsISO8601()
  timestamp!: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  revenueCents?: number
}

// ─── ROI ──────────────────────────────────────────────

export class CalculateROIDto {
  @IsString()
  campaignId!: string

  @IsString()
  campaignName!: string

  @IsNumber()
  @Min(0)
  sent!: number

  @IsNumber()
  @Min(0)
  clicked!: number

  @IsNumber()
  @Min(0)
  converted!: number

  @IsNumber()
  @Min(0)
  revenueCents!: number

  @IsNumber()
  @Min(0)
  costCents!: number

  @IsNumber()
  @Min(1)
  periodDays!: number
}

// ─── Channel ──────────────────────────────────────────

export class RouteChannelQueryDto {
  @IsString()
  tenantId!: string

  @IsString()
  memberId!: string
}
