import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import 'reflect-metadata'
import { LeaveType, LeaveStatus } from './leave-request.entity'

// ═══════════════════════════════════════════════════════════════════════
// Leave Request DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreateLeaveRequestDto {
  @IsString()
  employeeId!: string

  @IsString()
  employeeName!: string

  @IsEnum(LeaveType)
  type!: LeaveType

  @IsDateString()
  startDate!: string

  @IsDateString()
  endDate!: string

  @IsInt()
  @Min(1)
  days!: number

  @IsString()
  reason!: string

  @IsString()
  approver!: string

  @IsString()
  @IsOptional()
  remark?: string
}

export class ApproveLeaveDto {
  @IsEnum(LeaveStatus)
  status!: LeaveStatus

  @IsString()
  @IsOptional()
  remark?: string
}

export class LeaveQueryDto {
  @IsEnum(LeaveType)
  @IsOptional()
  type?: LeaveType

  @IsEnum(LeaveStatus)
  @IsOptional()
  status?: LeaveStatus

  @IsString()
  @IsOptional()
  employeeId?: string

  @IsString()
  @IsOptional()
  approver?: string

  @IsDateString()
  @IsOptional()
  fromDate?: string

  @IsDateString()
  @IsOptional()
  toDate?: string
}
