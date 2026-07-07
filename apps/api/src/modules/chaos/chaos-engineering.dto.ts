import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsObject,
} from 'class-validator'
import { Type } from 'class-transformer'
import type { FaultType } from './chaos-engineering.entity'

// ─── CreateExperiment DTO ───────────────────────────────────────

export class CreateExperimentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string

  @IsString()
  @IsNotEmpty()
  target!: string

  @IsString()
  @IsEnum(['LATENCY', 'ERROR', 'TIMEOUT', 'CPU_BURN'])
  faultType!: FaultType

  @IsString()
  @IsNotEmpty()
  faultTarget!: string

  @IsObject()
  faultParams!: Record<string, number | string>
}

// ─── UpdateExperimentDto ────────────────────────────────────────

export class UpdateExperimentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsString()
  target?: string

  @IsOptional()
  @IsString()
  @IsEnum(['LATENCY', 'ERROR', 'TIMEOUT', 'CPU_BURN'])
  faultType?: FaultType

  @IsOptional()
  @IsString()
  faultTarget?: string

  @IsOptional()
  @IsObject()
  faultParams?: Record<string, number | string>
}

// ─── RunExperimentDto ───────────────────────────────────────────

export class RunExperimentDto {
  @IsString()
  @IsNotEmpty()
  experimentId!: string
}

// ─── PauseExperimentDto ─────────────────────────────────────────

export class PauseExperimentDto {
  @IsString()
  @IsNotEmpty()
  experimentId!: string
}

// ─── CompleteExperimentDto ──────────────────────────────────────

export class HealthMetricDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  cpuUsage!: number

  @IsNumber()
  @Min(0)
  @Max(100)
  memoryUsage!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  errorRate!: number

  @IsNumber()
  @Min(0)
  latencyAvg!: number

  @IsOptional()
  healthy?: boolean
}

// ─── InjectFaultDto ─────────────────────────────────────────────

export class InjectFaultDto {
  @IsString()
  @IsNotEmpty()
  target!: string

  @IsNumber()
  @Min(0)
  paramValue!: number
}

// ─── ExperimentIdParam ──────────────────────────────────────────

export class ExperimentIdParam {
  @IsString()
  @IsNotEmpty()
  id!: string
}
