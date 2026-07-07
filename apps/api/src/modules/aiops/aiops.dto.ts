// aiops.dto.ts - 自动补全
// 用途: AIOps DTO 定义
import { IsString, IsNumber, IsOptional, IsArray, IsEnum, Min, Max, IsNotEmpty, ValidateNested, IsBoolean } from 'class-validator'
import { Type } from 'class-transformer'

export class HistoryPointDto {
  @IsString()
  @IsNotEmpty()
  timestamp!: string

  @IsNumber()
  value!: number
}

export class AnomalyDetectRequestDto {
  @IsString()
  @IsNotEmpty()
  metricName!: string

  @IsNumber()
  value!: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoryPointDto)
  history!: HistoryPointDto[]

  @IsOptional()
  @IsString()
  timestamp?: string
}

export class PredictRequestDto {
  @IsString()
  @IsNotEmpty()
  metricName!: string

  @IsNumber()
  @Min(1)
  @Max(100)
  horizon!: number

  @IsOptional()
  @IsString()
  timestamp?: string
}

export class AttackDetectRequestDto {
  @IsString()
  @IsNotEmpty()
  metricName!: string

  @IsOptional()
  @IsString()
  timestamp?: string
}

export class HealRequestDto {
  @IsString()
  @IsNotEmpty()
  targetSystem!: string

  @IsOptional()
  @IsString()
  timestamp?: string
}

export class AnomalyDetectResultDto {
  @IsString()
  metricName!: string

  @IsBoolean()
  isAnomaly!: boolean

  @IsNumber()
  @Min(0)
  @Max(1)
  anomalyScore!: number

  @IsOptional()
  @IsString()
  anomalyType?: 'spike' | 'drop' | 'trend' | 'seasonal'

  @IsString()
  @IsEnum(['NORMAL', 'WARNING', 'CRITICAL'])
  severity!: 'NORMAL' | 'WARNING' | 'CRITICAL'

  @IsNumber()
  baseline!: number

  @IsNumber()
  deviation!: number

  @IsString()
  detectedAt!: string

  @IsOptional()
  @IsString()
  details?: string
}

export class PredictResultDto {
  @IsString()
  metricName!: string

  @IsNumber()
  horizon!: number

  @IsArray()
  @IsNumber({}, { each: true })
  predictedValues!: number[]

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number

  @IsString()
  predictedAt!: string
}

export class AttackDetectResultDto {
  @IsString()
  metricName!: string

  @IsBoolean()
  isUnderAttack!: boolean

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number

  @IsOptional()
  @IsString()
  attackType?: 'ddos' | 'brute_force' | 'data_exfil'

  @IsArray()
  @IsString({ each: true })
  evidence!: string[]

  @IsString()
  detectedAt!: string
}

export class HealingActionResultDto {
  @IsString()
  id!: string

  @IsString()
  targetSystem!: string

  @IsString()
  @IsEnum(['restart', 'rollback', 'scale', 'isolate'])
  action!: 'restart' | 'rollback' | 'scale' | 'isolate'

  @IsString()
  @IsEnum(['pending', 'running', 'completed', 'failed'])
  status!: 'pending' | 'running' | 'completed' | 'failed'

  @IsString()
  triggeredAt!: string

  @IsOptional()
  @IsString()
  completedAt?: string

  @IsOptional()
  @IsString()
  result?: string
}

export class AIOpsEngineStatusDto {
  @IsString()
  engineName!: string

  @IsNumber()
  anomalyRulesCount!: number

  @IsNumber()
  attackRulesCount!: number

  @IsNumber()
  healedSystemsCount!: number

  @IsString()
  @IsEnum(['ACTIVE', 'DEGRADED', 'STOPPED'])
  status!: 'ACTIVE' | 'DEGRADED' | 'STOPPED'

  @IsOptional()
  @IsString()
  lastDetectedAt?: string
}
