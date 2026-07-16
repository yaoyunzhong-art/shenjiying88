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
} from './quality-inspection.entity'

// ═══════════════════════════════════════════════════════════════════════
// Defect DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreateDefectDto {
  @IsString()
  code!: string

  @IsString()
  description!: string

  @IsEnum(Severity)
  severity!: Severity
}

// ═══════════════════════════════════════════════════════════════════════
// Inspection DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreateInspectionRecordDto {
  @IsString()
  inspectNo!: string

  @IsEnum(InspectionType)
  type!: InspectionType

  @IsString()
  itemName!: string

  @IsString()
  itemBatch!: string

  @IsEnum(InspectionResult)
  @IsOptional()
  result?: InspectionResult

  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDefectDto)
  defects!: CreateDefectDto[]

  @IsString()
  inspector!: string

  @IsDateString()
  inspectedAt!: string

  @IsString()
  @IsOptional()
  notes?: string
}

export class UpdateInspectionRecordDto {
  @IsEnum(InspectionType)
  @IsOptional()
  type?: InspectionType

  @IsString()
  @IsOptional()
  itemName?: string

  @IsString()
  @IsOptional()
  itemBatch?: string

  @IsEnum(InspectionResult)
  @IsOptional()
  result?: InspectionResult

  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDefectDto)
  @IsOptional()
  defects?: CreateDefectDto[]

  @IsString()
  @IsOptional()
  inspector?: string

  @IsDateString()
  @IsOptional()
  inspectedAt?: string

  @IsString()
  @IsOptional()
  notes?: string
}

export class InspectionRecordQueryDto {
  @IsEnum(InspectionType)
  @IsOptional()
  type?: InspectionType

  @IsEnum(InspectionResult)
  @IsOptional()
  result?: InspectionResult

  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity

  @IsString()
  @IsOptional()
  inspector?: string

  @IsString()
  @IsOptional()
  search?: string
}
