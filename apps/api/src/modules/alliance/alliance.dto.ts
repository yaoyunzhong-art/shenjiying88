import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
  IsIn,
  IsNotEmpty,
} from 'class-validator'
import { Type } from 'class-transformer'
import {
  BusinessType,
  PartnerStatus,
  Grade,
} from '../alliance/alliance.entity'
import { SettlementType } from '../alliance/alliance-settlement.service'

export class RegisterPartnerDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsEnum(['RETAIL', 'F&B', 'SERVICE', 'TECH', 'OTHER'] as const)
  businessType!: BusinessType

  @IsString()
  @IsNotEmpty()
  contact!: string

  @IsString()
  @IsNotEmpty()
  address!: string
}

export class UpdatePartnerDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsEnum(['RETAIL', 'F&B', 'SERVICE', 'TECH', 'OTHER'] as const)
  @IsOptional()
  businessType?: BusinessType

  @IsString()
  @IsOptional()
  contact?: string

  @IsString()
  @IsOptional()
  address?: string
}

export class ListPartnerQueryDto {
  @IsEnum(['RETAIL', 'F&B', 'SERVICE', 'TECH', 'OTHER'] as const)
  @IsOptional()
  businessType?: BusinessType

  @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const)
  @IsOptional()
  status?: PartnerStatus

  @IsEnum(['S', 'A', 'B', 'C'] as const)
  @IsOptional()
  grade?: Grade
}

export class AssignGradeDto {
  @IsEnum(['S', 'A', 'B', 'C'] as const)
  grade!: Grade
}

export class SettlementParticipantDto {
  @IsString()
  partnerId!: string

  @IsString()
  partnerName!: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  ratio?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  fixedAmount?: number
}

export class CreateSettlementDto {
  @IsString()
  orderId!: string

  @IsEnum(['ratio', 'fixed'] as const)
  type!: SettlementType

  @IsNumber()
  @Min(1)
  totalAmount!: number

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SettlementParticipantDto)
  participants!: SettlementParticipantDto[]
}

export class SetMetricsDto {
  @IsNumber()
  @IsOptional()
  revenue?: number

  @IsNumber()
  @IsOptional()
  orderCount?: number

  @IsNumber()
  @IsOptional()
  complaintCount?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(31)
  activeDays?: number
}

export class ScanUnlinkedOrdersDto {
  @IsString()
  @IsNotEmpty()
  storeId!: string

  @IsString()
  since!: string // ISO date string
}

export class LinkOrderDto {
  @IsString()
  @IsNotEmpty()
  partnerId!: string
}

// ── WP-17B DTOs ───────────────────────────────────────────────────────────────

export class SetTierConfigDto {
  @IsEnum(['S', 'A', 'B', 'C'] as const)
  grade!: Grade

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  revenueShareRatio?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  couponCommissionRatio?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  minSettlementThreshold?: number
}

export class IssueCouponDto {
  @IsString()
  issuerPartnerId!: string

  @IsString()
  issuerPartnerName!: string

  @IsNumber()
  @Min(1)
  denomination!: number

  @IsNumber()
  @Min(0)
  minSpend!: number

  @IsString()
  validFrom!: string

  @IsString()
  validTo!: string

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  acceptedPartnerIds!: string[]

  @IsString()
  description!: string
}

export class RedeemCouponDto {
  @IsString()
  couponId!: string

  @IsString()
  partnerId!: string

  @IsString()
  partnerName!: string

  @IsString()
  orderId!: string

  @IsString()
  memberId!: string

  @IsNumber()
  @Min(1)
  orderAmount!: number
}

export class ReceiveCallbackDto {
  @IsEnum(['order', 'member', 'activity', 'revenue', 'traffic'] as const)
  dataType!: string

  @IsString()
  payload!: string
}

export class QueryCallbackDto {
  @IsOptional()
  @IsEnum(['order', 'member', 'activity', 'revenue', 'traffic'] as const)
  dataType?: string

  @IsOptional()
  @IsString()
  from?: string

  @IsOptional()
  @IsString()
  to?: string
}

export class ReportAnomalyDto {
  @IsString()
  partnerId!: string

  @IsString()
  partnerName!: string

  @IsEnum(['frequent_small_transactions', 'unusual_time_trading', 'amount_anomaly', 'location_drift', 'rapid_successive_redemption'] as const)
  type!: string

  @IsEnum(['low', 'medium', 'high', 'critical'] as const)
  severity!: string

  @IsNumber()
  @Min(0)
  involvedAmount!: number

  @IsString()
  description!: string

  @IsOptional()
  @IsString()
  relatedId?: string
}

export class SubmitReviewDto {
  @IsString()
  anomalyId!: string

  @IsEnum(['pending', 'approved', 'rejected', 'escalated'] as const)
  decision!: string

  @IsString()
  reviewer!: string

  @IsString()
  note!: string
}
