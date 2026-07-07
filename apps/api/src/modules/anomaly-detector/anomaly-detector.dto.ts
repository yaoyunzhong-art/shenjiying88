// anomaly-detector.dto.ts - Phase-19 T26
// 用途: 异常检测 DTO 定义
import { IsString, IsNumber, IsOptional, IsArray, IsEnum, Min, Max, IsBoolean, ValidateNested, IsNotEmpty } from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

export class AnomalyDetectRequestDto {
  @IsString()
  @IsNotEmpty()
  metricKey!: string

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

export class HistoryPointDto {
  @IsString()
  @IsNotEmpty()
  timestamp!: string

  @IsNumber()
  value!: number
}

export class BatchPointDto {
  @IsString()
  @IsNotEmpty()
  metricKey!: string

  @IsNumber()
  value!: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoryPointDto)
  history!: HistoryPointDto[]
}

export class AnomalyDetectBatchRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchPointDto)
  points!: BatchPointDto[]

  @IsOptional()
  @IsString()
  timestamp?: string
}

export class WhitelistEntryDto {
  @IsString()
  @IsNotEmpty()
  metricKey!: string

  @IsString()
  @IsNotEmpty()
  reason!: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  ttlMs?: number
}

export class ConfigureRequestDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhitelistEntryDto)
  whitelist?: WhitelistEntryDto[]

  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  sigmaThreshold?: number

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(0.99)
  ewmaAlpha?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  criticalThreshold?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  warningThreshold?: number
}

export class AnomalyDetectorsDto {
  threeSigma?: { zScore: number; detected: boolean }
  iqr?: { lower: number; upper: number; deviation: number; detected: boolean }
  ewma?: { expected: number; deviation: number; detected: boolean }
}

export class AnomalyResultDto {
  @IsString()
  metricKey!: string

  @IsNumber()
  value!: number

  @IsNumber()
  baseline!: number

  @IsNumber()
  deviation!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  score!: number

  @IsString()
  @IsEnum(['NORMAL', 'WARNING', 'CRITICAL'])
  severity!: 'NORMAL' | 'WARNING' | 'CRITICAL'

  @ValidateNested()
  @Type(() => AnomalyDetectorsDto)
  detectors!: AnomalyDetectorsDto

  @IsBoolean()
  whitelisted!: boolean

  @IsString()
  reason!: string

  @IsString()
  detectedAt!: string
}

export class EngineStatusDto {
  @IsString()
  engineName!: string

  @IsNumber()
  rulesCount!: number

  @IsString()
  @IsEnum(['ACTIVE', 'DEGRADED', 'STOPPED'])
  status!: 'ACTIVE' | 'DEGRADED' | 'STOPPED'

  @IsOptional()
  @IsString()
  lastEvaluationAt?: string
}
