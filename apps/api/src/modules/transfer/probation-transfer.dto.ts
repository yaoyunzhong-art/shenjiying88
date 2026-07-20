import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator'
import 'reflect-metadata'
import { ProbationDuration, ProbationStatus } from './probation-transfer.entity'

// ═══════════════════════════════════════════════════════════════════════
// Probation Transfer DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreateProbationTransferDto {
  @IsString()
  employeeId!: string

  @IsString()
  employeeName!: string

  @IsString()
  department!: string

  @IsString()
  position!: string

  @IsEnum(ProbationDuration)
  probationDuration!: ProbationDuration

  @IsDateString()
  probationStart!: string

  @IsDateString()
  probationEnd!: string

  @IsString()
  evaluation!: string

  @IsString()
  approver!: string
}

export class ApproveProbationTransferDto {
  @IsEnum(ProbationStatus)
  status!: ProbationStatus

  @IsString()
  @IsOptional()
  performanceRating?: string

  @IsString()
  @IsOptional()
  approvalRemark?: string

  @IsString()
  @IsOptional()
  rejectReason?: string
}

export class ProbationQueryDto {
  @IsEnum(ProbationStatus)
  @IsOptional()
  status?: ProbationStatus

  @IsString()
  @IsOptional()
  employeeId?: string

  @IsString()
  @IsOptional()
  department?: string

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
