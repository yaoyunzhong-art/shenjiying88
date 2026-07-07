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
  name!: string

  @IsEnum(['RETAIL', 'F&B', 'SERVICE', 'TECH', 'OTHER'] as const)
  businessType!: BusinessType

  @IsString()
  contact!: string

  @IsString()
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
  storeId!: string

  @IsString()
  since!: string // ISO date string
}

export class LinkOrderDto {
  @IsString()
  partnerId!: string
}
