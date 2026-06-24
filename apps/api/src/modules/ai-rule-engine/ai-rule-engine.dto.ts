import {
  IsString,
  IsNumber,
  IsEnum,
  ValidateNested,
  Min,
  Max,
  IsNotEmpty,
  IsOptional
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

/**
 * 设备指标数据
 */
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

  @IsNumber()
  @Min(0)
  uptimeHours!: number
}

/**
 * 成员等级评估输入 DTO
 */
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

/**
 * 设备异常检测输入 DTO
 */
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

/**
 * AI 规则引擎评估请求 DTO
 */
export class EvaluateRequestDto {
  @IsString()
  @IsEnum(['member-level', 'device-anomaly'])
  type!: 'member-level' | 'device-anomaly'

  @IsNotEmpty()
  data!: Record<string, unknown>
}

/**
 * 批量评估单项请求
 */
export class BatchEvaluateItemDto {
  @IsString()
  @IsEnum(['member-level', 'device-anomaly'])
  type!: 'member-level' | 'device-anomaly'

  @IsNotEmpty()
  data!: Record<string, unknown>
}

/**
 * 批量评估请求 DTO
 */
export class BatchEvaluateRequestDto {
  @ValidateNested({ each: true })
  @Type(() => BatchEvaluateItemDto)
  items!: BatchEvaluateItemDto[]
}

/**
 * 风险评分指标 DTO（所有字段可选）
 */
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

/**
 * 风险评分输入 DTO
 */
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

/**
 * 条件覆盖项 DTO
 */
export class ConditionOverrideDto {
  @IsString()
  @IsNotEmpty()
  conditionId!: string

  @IsNotEmpty()
  value!: unknown
}

/**
 * 模拟运行输入 DTO
 */
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
  verbose?: boolean
}
