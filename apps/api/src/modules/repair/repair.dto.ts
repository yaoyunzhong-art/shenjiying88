import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsPhoneNumber,
  Min,
} from 'class-validator'
import 'reflect-metadata'
import { RepairStatus, RepairCategory, UrgencyLevel } from './repair.entity'

// ═══════════════════════════════════════════════════════════════════════
// Repair Request DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreateRepairRequestDto {
  @IsString()
  title!: string

  @IsString()
  description!: string

  @IsEnum(RepairCategory)
  category!: RepairCategory

  @IsEnum(UrgencyLevel)
  urgency!: UrgencyLevel

  @IsString()
  reporterName!: string

  @IsString()
  reporterPhone!: string

  @IsString()
  location!: string

  @IsString()
  @IsOptional()
  deviceName?: string

  @IsString()
  @IsOptional()
  deviceId?: string

  @IsString()
  @IsOptional()
  remark?: string
}

export class UpdateRepairRequestDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(RepairCategory)
  @IsOptional()
  category?: RepairCategory

  @IsEnum(UrgencyLevel)
  @IsOptional()
  urgency?: UrgencyLevel

  @IsString()
  @IsOptional()
  location?: string

  @IsString()
  @IsOptional()
  deviceName?: string

  @IsString()
  @IsOptional()
  deviceId?: string

  @IsString()
  @IsOptional()
  remark?: string
}

export class DispatchRepairDto {
  @IsEnum(RepairStatus)
  status!: RepairStatus

  @IsString()
  assignedTo!: string

  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedCost?: number
}

export class CompleteRepairDto {
  @IsEnum(RepairStatus)
  status!: RepairStatus

  @IsString()
  @IsOptional()
  result?: string

  @IsNumber()
  @Min(0)
  @IsOptional()
  actualCost?: number

  @IsString()
  @IsOptional()
  remark?: string
}

export class RepairQueryDto {
  @IsEnum(RepairStatus)
  @IsOptional()
  status?: RepairStatus

  @IsEnum(RepairCategory)
  @IsOptional()
  category?: RepairCategory

  @IsEnum(UrgencyLevel)
  @IsOptional()
  urgency?: UrgencyLevel

  @IsString()
  @IsOptional()
  reporterName?: string

  @IsString()
  @IsOptional()
  assignedTo?: string

  @IsString()
  @IsOptional()
  location?: string

  @IsString()
  @IsOptional()
  deviceName?: string
}

export class RepairStatsQueryDto {
  @IsDateString()
  @IsOptional()
  fromDate?: string

  @IsDateString()
  @IsOptional()
  toDate?: string
}
