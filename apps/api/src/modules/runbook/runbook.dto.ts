// runbook.dto.ts - 运维手册数据传输对象
import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator'
import { Type } from 'class-transformer'
import type { RunbookCategory, Severity, RunbookStatus } from './runbook.entity'

export class RunbookStepDto {
  @IsInt()
  @Min(1)
  stepNumber!: number

  @IsString()
  title!: string

  @IsString()
  description!: string

  @IsString()
  @IsOptional()
  command?: string

  @IsString()
  @IsOptional()
  expectedOutput?: string

  @IsString()
  @IsOptional()
  verificationCommand?: string

  @IsString()
  @IsOptional()
  rollbackCommand?: string

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(1440)
  estimatedMinutes?: number

  @IsString()
  @IsOptional()
  warningMessage?: string
}

export class CreateRunbookDto {
  @IsString()
  title!: string

  @IsEnum(['deployment', 'scaling', '故障排查', '灾难恢复', '安全事件', '监控告警'])
  category!: RunbookCategory

  @IsEnum(['critical', 'high', 'medium', 'low'])
  severity!: Severity

  @IsArray()
  @IsString({ each: true })
  applicableVersions!: string[]

  @IsArray()
  @IsString({ each: true })
  prerequisites!: string[]

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => RunbookStepDto)
  steps!: RunbookStepDto[]

  @IsInt()
  @Min(1)
  estimatedTotalMinutes!: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedAlerts?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedRunbooks?: string[]

  @IsEnum(['draft', 'active', 'archived'])
  status!: RunbookStatus

  @IsArray()
  @IsString({ each: true })
  tags!: string[]
}

export class UpdateRunbookDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsEnum(['deployment', 'scaling', '故障排查', '灾难恢复', '安全事件', '监控告警'])
  category?: RunbookCategory

  @IsOptional()
  @IsEnum(['critical', 'high', 'medium', 'low'])
  severity?: Severity

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableVersions?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RunbookStepDto)
  steps?: RunbookStepDto[]

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedTotalMinutes?: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedAlerts?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedRunbooks?: string[]

  @IsOptional()
  @IsEnum(['draft', 'active', 'archived'])
  status?: RunbookStatus

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}

export class ListRunbookQueryDto {
  @IsOptional()
  @IsEnum(['deployment', 'scaling', '故障排查', '灾难恢复', '安全事件', '监控告警'])
  category?: RunbookCategory

  @IsOptional()
  @IsEnum(['critical', 'high', 'medium', 'low'])
  severity?: Severity

  @IsOptional()
  @IsEnum(['draft', 'active', 'archived'])
  status?: RunbookStatus

  @IsOptional()
  @IsString()
  tag?: string
}

export class MapAlertDto {
  @IsString()
  alertName!: string

  @IsString()
  runbookId!: string

  @IsArray()
  @IsString({ each: true })
  possibleCauses!: string[]

  @IsEnum(['critical', 'high', 'medium', 'low'])
  severity!: Severity

  @IsOptional()
  @IsString()
  autoAction?: string
}

export class ValidateRunbookResponseDto {
  valid!: boolean
  errors!: string[]
  warnings!: string[]
}
