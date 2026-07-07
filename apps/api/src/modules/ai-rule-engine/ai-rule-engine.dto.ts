import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  ValidateNested,
  IsArray,
  ArrayMinSize
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

// ─── Device Metrics ────────────────────────────────────────────

export class DeviceMetricsDto {
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
  @Max(100)
  diskUsage!: number

  @IsNumber()
  @Min(0)
  networkLatencyMs!: number

  @IsNumber()
  @Min(0)
  errorRate!: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  uptimeHours?: number
}

// ─── Member Level Input ────────────────────────────────────────

export class MemberLevelInputDto {
  @IsString()
  @IsNotEmpty()
  memberId!: string

  @IsNumber()
  @Min(0)
  totalPoints!: number

  @IsNumber()
  @Min(0)
  totalSpend!: number

  @IsNumber()
  @Min(0)
  visitCount!: number

  @IsString()
  @IsNotEmpty()
  tenantId!: string
}

// ─── Device Anomaly Input ──────────────────────────────────────

export class DeviceAnomalyInputDto {
  @IsString()
  @IsNotEmpty()
  deviceId!: string

  @IsString()
  @IsNotEmpty()
  storeId!: string

  @ValidateNested()
  @Type(() => DeviceMetricsDto)
  metrics!: DeviceMetricsDto

  @IsString()
  @IsNotEmpty()
  tenantId!: string
}

// ─── Evaluate Request ──────────────────────────────────────────

export class EvaluateRequestDto {
  @IsString()
  @IsEnum(['member-level', 'device-anomaly'])
  type!: 'member-level' | 'device-anomaly'

  @IsNotEmpty()
  data!: Record<string, unknown>
}

// ─── Batch Evaluate ────────────────────────────────────────────

export class BatchEvaluateItemDto {
  @IsString()
  @IsEnum(['member-level', 'device-anomaly'])
  type!: 'member-level' | 'device-anomaly'

  @IsNotEmpty()
  data!: Record<string, unknown>
}

export class BatchEvaluateRequestDto {
  @ValidateNested({ each: true })
  @Type(() => BatchEvaluateItemDto)
  @IsArray()
  @ArrayMinSize(1)
  items!: BatchEvaluateItemDto[]
}

// ─── Risk Score ────────────────────────────────────────────────

export class RiskMetricsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundCount?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  abnormalPaymentCount?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  deviceAnomalyCount?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  complaintCount?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  voidRefundAmount?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  activeDays?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  recentTransactionAmount?: number
}

export class RiskScoreInputDto {
  @IsString()
  @IsNotEmpty()
  subjectId!: string

  @IsString()
  @IsEnum(['member', 'device', 'store'])
  subjectType!: 'member' | 'device' | 'store'

  @ValidateNested()
  @Type(() => RiskMetricsDto)
  metrics!: RiskMetricsDto

  @IsString()
  @IsNotEmpty()
  tenantId!: string
}

// ─── Condition Override ────────────────────────────────────────

export class ConditionOverrideDto {
  @IsString()
  @IsNotEmpty()
  conditionId!: string

  @IsNotEmpty()
  value!: unknown
}

// ─── Simulator Run Input ───────────────────────────────────────

export class SimulatorRunInputDto {
  @IsString()
  @IsNotEmpty()
  simulatorId!: string

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ConditionOverrideDto)
  conditionOverrides?: ConditionOverrideDto[]

  @IsString()
  @IsEnum(['member-level', 'device-anomaly', 'risk-score'])
  dataType!: 'member-level' | 'device-anomaly' | 'risk-score'

  @IsNotEmpty()
  data!: Record<string, unknown>

  @IsOptional()
  @IsBoolean()
  verbose?: boolean
}

// ─── Condition Override Config (for engine config update) ──────

export class ConditionOverrideConfigDto {
  @IsString()
  @IsNotEmpty()
  conditionId!: string

  @IsOptional()
  @IsString()
  field?: string

  @IsOptional()
  value?: unknown

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weight?: number

  @IsOptional()
  @IsString()
  operator?: string
}

// ─── Engine Config Update ──────────────────────────────────────

export class EngineConfigUpdateDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  @IsOptional()
  @IsString()
  @IsEnum(['ALL', 'ANY'])
  matchStrategy?: 'ALL' | 'ANY'

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ConditionOverrideConfigDto)
  conditionOverrides?: ConditionOverrideConfigDto[]
}
