// time-series.dto.ts - Phase-19 T27
// 用途: 时序指标 DTO 定义 (Record/Query/Batch/Status)
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsIn,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

export type WindowSize = '1h' | '6h' | '24h' | '7d' | '30d'

export class RecordMetricDto {
  @IsString()
  @IsNotEmpty()
  metricName!: string

  @IsOptional()
  @IsString()
  tenantId?: string

  @IsNumber()
  value!: number

  @IsOptional()
  @IsString()
  timestamp?: string
}

export class QueryMetricDto {
  @IsString()
  @IsNotEmpty()
  metricName!: string

  @IsOptional()
  @IsString()
  tenantId?: string

  @IsString()
  @IsEnum(['1h', '6h', '24h', '7d', '30d'])
  window!: WindowSize
}

export class SampleItemDto {
  @IsString()
  @IsNotEmpty()
  route!: string

  @IsOptional()
  @IsString()
  tenantId?: string

  @IsNumber()
  @Min(0)
  durationMs!: number

  @IsOptional()
  @IsNumber()
  statusCode?: number

  @IsOptional()
  @IsString()
  timestamp?: string
}

export class RecordBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SampleItemDto)
  samples!: SampleItemDto[]
}

export class SeasonalityQueryDto {
  @IsString()
  @IsNotEmpty()
  metricName!: string

  @IsOptional()
  @IsString()
  tenantId?: string
}

export class TimeSeriesPointDto {
  @IsString()
  timestamp!: string

  @IsNumber()
  value!: number
}

export class AggregateDto {
  @IsNumber()
  min!: number

  @IsNumber()
  max!: number

  @IsNumber()
  avg!: number

  @IsNumber()
  p50!: number

  @IsNumber()
  p95!: number

  @IsNumber()
  p99!: number

  @IsNumber()
  count!: number
}

export class TimeSeriesMetricDto {
  @IsString()
  metricKey!: string

  @IsOptional()
  @IsString()
  tenantId?: string

  @IsString()
  window!: WindowSize

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSeriesPointDto)
  points!: TimeSeriesPointDto[]

  @ValidateNested()
  @Type(() => AggregateDto)
  aggregate!: AggregateDto

  @IsNumber()
  @Min(0)
  seasonality!: number
}

export class SeasonalityPatternDto {
  @IsArray()
  @IsNumber()
  weekly!: number[]

  @IsArray()
  @IsNumber()
  monthly!: number[]

  @IsArray()
  @IsNumber()
  daily!: number[]
}

export class CollectorStatusDto {
  @IsString()
  collectorName!: string

  @IsNumber()
  buffersCount!: number

  @IsNumber()
  totalPoints!: number

  @IsString()
  status!: 'ACTIVE' | 'DEGRADED' | 'STOPPED'

  @IsNumber()
  uptimeMs!: number
}

export class ListMetricKeysResponseDto {
  @IsArray()
  @IsString({ each: true })
  keys!: string[]
}

export class RegisterAlertRuleDto {
  @IsString()
  @IsNotEmpty()
  metricName!: string

  @IsOptional()
  @IsString()
  tenantId?: string

  @IsString()
  @IsIn(['gt', 'lt', 'gte', 'lte'])
  operator!: 'gt' | 'lt' | 'gte' | 'lte'

  @IsNumber()
  threshold!: number

  @IsString()
  @IsEnum(['1h', '6h', '24h', '7d', '30d'])
  window!: WindowSize

  @IsOptional()
  @IsString()
  description?: string
}

export class CompareWindowsDto {
  @IsString()
  @IsNotEmpty()
  metricName!: string

  @IsOptional()
  @IsString()
  tenantId?: string
}
