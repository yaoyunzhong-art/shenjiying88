import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'
import {
  InspectionType,
  InspectionResult,
  Severity,
  PatrolTaskStatus,
  PatrolTaskPriority,
  PatrolArea,
  RectificationStatus,
} from './quality.entity'

// ═══════════════════════════════════════════════════════════════════════
// Quality Inspection DTOs (re-export from quality-inspection)
// ═══════════════════════════════════════════════════════════════════════

export {
  CreateDefectDto,
  CreateInspectionRecordDto,
  UpdateInspectionRecordDto,
  InspectionRecordQueryDto,
} from '../quality-inspection/quality-inspection.dto'

// ═══════════════════════════════════════════════════════════════════════
// PatrolTask DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreatePatrolTaskDto {
  @IsString()
  patrolNo!: string

  @IsString()
  title!: string

  @IsString()
  description!: string

  @IsEnum(PatrolArea)
  area!: PatrolArea

  @IsEnum(PatrolTaskPriority)
  priority!: PatrolTaskPriority

  @IsArray()
  checkItems!: Array<{
    name: string
    standard: string
  }>

  @IsString()
  assignedTo!: string

  @IsDateString()
  scheduledAt!: string

  @IsString()
  @IsOptional()
  notes?: string
}

export class UpdatePatrolTaskDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(PatrolArea)
  @IsOptional()
  area?: PatrolArea

  @IsEnum(PatrolTaskPriority)
  @IsOptional()
  priority?: PatrolTaskPriority

  @IsEnum(PatrolTaskStatus)
  @IsOptional()
  status?: PatrolTaskStatus

  @IsArray()
  @IsOptional()
  checkItems?: Array<{
    name: string
    standard: string
    result?: 'PASS' | 'FAIL' | 'N_A'
    remark?: string
  }>

  @IsString()
  @IsOptional()
  assignedTo?: string

  @IsDateString()
  @IsOptional()
  scheduledAt?: string

  @IsString()
  @IsOptional()
  notes?: string
}

export class PatrolTaskQueryDto {
  @IsEnum(PatrolTaskStatus)
  @IsOptional()
  status?: PatrolTaskStatus

  @IsEnum(PatrolArea)
  @IsOptional()
  area?: PatrolArea

  @IsEnum(PatrolTaskPriority)
  @IsOptional()
  priority?: PatrolTaskPriority

  @IsString()
  @IsOptional()
  assignedTo?: string

  @IsString()
  @IsOptional()
  search?: string
}

// ═══════════════════════════════════════════════════════════════════════
// RectificationRecord DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreateRectificationRecordDto {
  @IsString()
  rectificationNo!: string

  @IsString()
  sourceInspectionId!: string

  @IsString()
  sourceInspectNo!: string

  @IsString()
  title!: string

  @IsString()
  description!: string

  @IsEnum(Severity)
  severity!: Severity

  @IsString()
  responsiblePerson!: string

  @IsArray()
  actions!: Array<{
    description: string
    assignee: string
    deadline: string
  }>

  @IsDateString()
  deadline!: string

  @IsString()
  @IsOptional()
  notes?: string
}

export class UpdateRectificationRecordDto {
  @IsString()
  @IsOptional()
  status?: RectificationStatus

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  responsiblePerson?: string

  @IsDateString()
  @IsOptional()
  deadline?: string

  @IsString()
  @IsOptional()
  notes?: string
}

export class RectificationQueryDto {
  @IsEnum(RectificationStatus)
  @IsOptional()
  status?: RectificationStatus

  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity

  @IsString()
  @IsOptional()
  responsiblePerson?: string

  @IsString()
  @IsOptional()
  search?: string
}
