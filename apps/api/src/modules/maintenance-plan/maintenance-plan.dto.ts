import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import 'reflect-metadata'
import {
  MaintenanceType,
  MaintenanceStatus,
  Priority,
} from './maintenance-plan.entity'

// ═══════════════════════════════════════════════════════════════════════
// Maintenance Plan DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreateMaintenancePlanDto {
  @IsString()
  title!: string

  @IsEnum(MaintenanceType)
  type!: MaintenanceType

  @IsEnum(Priority)
  priority!: Priority

  @IsString()
  deviceName!: string

  @IsString()
  deviceId!: string

  @IsString()
  assignedTo!: string

  @IsDateString()
  scheduledAt!: string

  @IsString()
  description!: string

  @IsString()
  @IsOptional()
  result?: string

  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number
}

export class UpdateMaintenancePlanDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsEnum(MaintenanceType)
  @IsOptional()
  type?: MaintenanceType

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority

  @IsString()
  @IsOptional()
  deviceName?: string

  @IsString()
  @IsOptional()
  deviceId?: string

  @IsString()
  @IsOptional()
  assignedTo?: string

  @IsDateString()
  @IsOptional()
  scheduledAt?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  result?: string

  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number
}

export class UpdateMaintenanceStatusDto {
  @IsEnum(MaintenanceStatus)
  status!: MaintenanceStatus

  @IsString()
  @IsOptional()
  result?: string

  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number
}

export class MaintenanceQueryDto {
  @IsEnum(MaintenanceStatus)
  @IsOptional()
  status?: MaintenanceStatus

  @IsEnum(MaintenanceType)
  @IsOptional()
  type?: MaintenanceType

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority

  @IsString()
  @IsOptional()
  deviceName?: string

  @IsString()
  @IsOptional()
  assignedTo?: string
}
