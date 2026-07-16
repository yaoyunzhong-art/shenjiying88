import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator'
import 'reflect-metadata'
import { ShiftType, ShiftStatus } from './shift-scheduler.entity'

// ═══════════════════════════════════════════════════════════════════════
// Shift Schedule DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreateShiftScheduleDto {
  @IsString()
  employeeId!: string

  @IsString()
  employeeName!: string

  @IsDateString()
  date!: string

  @IsEnum(ShiftType)
  shiftType!: ShiftType

  @IsString()
  startTime!: string

  @IsString()
  endTime!: string

  @IsString()
  location!: string

  @IsString()
  @IsOptional()
  remark?: string
}

export class UpdateShiftScheduleDto {
  @IsEnum(ShiftType)
  @IsOptional()
  shiftType?: ShiftType

  @IsString()
  @IsOptional()
  startTime?: string

  @IsString()
  @IsOptional()
  endTime?: string

  @IsString()
  @IsOptional()
  location?: string

  @IsString()
  @IsOptional()
  remark?: string
}

export class UpdateShiftStatusDto {
  @IsEnum(ShiftStatus)
  status!: ShiftStatus
}

export class ShiftQueryDto {
  @IsEnum(ShiftType)
  @IsOptional()
  shiftType?: ShiftType

  @IsEnum(ShiftStatus)
  @IsOptional()
  status?: ShiftStatus

  @IsString()
  @IsOptional()
  employeeId?: string

  @IsString()
  @IsOptional()
  date?: string

  @IsString()
  @IsOptional()
  location?: string
}
