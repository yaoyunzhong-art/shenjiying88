import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  Min,
  Max,
  IsNotEmpty,
  ValidateNested,
  IsBoolean,
} from 'class-validator'
import { Type } from 'class-transformer'
import { CanaryStrategy, CanaryStatus } from './canary.entity'
import 'reflect-metadata'

/**
 * 灰度实验创建 DTO
 */
export class CreateExperimentDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsString()
  description!: string

  @IsString()
  @IsNotEmpty()
  flagKey!: string

  @IsString()
  @IsEnum(['percentage', 'tenant', 'store', 'tag'] as CanaryStrategy[])
  strategy!: CanaryStrategy

  @ValidateNested()
  @Type(() => StrategyConfigDto)
  strategyConfig!: StrategyConfigDto

  @IsNumber()
  @Min(0)
  @Max(100)
  initialPercentage!: number

  @IsNumber()
  @Min(0)
  @Max(100)
  targetPercentage!: number

  @IsOptional()
  @ValidateNested()
  @Type(() => AutoPromoteRuleDto)
  autoPromote?: AutoPromoteRuleDto

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  healthThreshold?: number

  @IsString()
  @IsNotEmpty()
  createdBy!: string
}

/**
 * 策略配置 DTO
 */
export class StrategyConfigDto {
  @IsString()
  @IsEnum(['percentage', 'tenant', 'store', 'tag'])
  type!: CanaryStrategy

  @IsOptional()
  @IsBoolean()
  includeAll?: boolean

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tenantIds?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  storeIds?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsBoolean()
  matchAll?: boolean
}

/**
 * 自动晋级规则 DTO
 */
export class AutoPromoteRuleDto {
  @IsNumber()
  @Min(1)
  checkIntervalMin!: number

  @IsArray()
  @IsString({ each: true })
  healthMetrics!: ('error_rate' | 'latency_p95' | 'latency_avg')[]

  @IsArray()
  @IsNumber({}, { each: true })
  promoteSteps!: number[]

  @IsNumber()
  @Min(0)
  @Max(1)
  healthThreshold!: number

  @IsNumber()
  @Min(1)
  maxPromotions!: number
}

/**
 * 灰度评估 DTO
 */
export class EvaluateDto {
  @IsString()
  @IsNotEmpty()
  flagKey!: string

  @IsString()
  @IsNotEmpty()
  tenantId!: string

  @IsOptional()
  @IsString()
  storeId?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}

/**
 * 操作请求 DTO (activate / pause / promote / rollback)
 */
export class OperatorActionDto {
  @IsString()
  @IsNotEmpty()
  operator!: string

  @IsOptional()
  @IsString()
  reason?: string
}

/**
 * 晋级操作 DTO
 */
export class PromoteActionDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage!: number

  @IsString()
  @IsNotEmpty()
  operator!: string
}

/**
 * 健康记录上报 DTO
 */
export class RecordHealthDto {
  @IsNumber()
  @Min(0)
  @Max(1)
  errorRate!: number

  @IsNumber()
  @Min(0)
  latencyP95!: number

  @IsNumber()
  @Min(0)
  latencyAvg!: number

  @IsNumber()
  @Min(0)
  totalRequests!: number
}
