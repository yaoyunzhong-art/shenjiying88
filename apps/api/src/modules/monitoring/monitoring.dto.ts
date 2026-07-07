/**
 * 监控告警 - DTO (V10 Day 9 Phase 93)
 *
 * 类验证器 DTO 定义，用于 NestJS Controller 请求体校验
 */

import 'reflect-metadata'

import {
  IsString,
  IsNumber,
  IsEnum,
  IsObject,
  IsOptional,
  IsArray,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsBoolean,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import type { AlertSeverity, AlertChannel, MetricType, AlertRule } from './monitoring.entity'

// ============ 指标 ============

export class RecordMetricDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(128)
  name!: string

  @IsNumber()
  value!: number

  @IsObject()
  labels!: Record<string, string>
}

export class RecordMetricsBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecordMetricDto)
  points!: RecordMetricDto[]
}

// ============ 告警规则 ============

export class CreateAlertRuleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(64)
  name!: string

  @IsString()
  @IsNotEmpty()
  metric!: string

  @IsString()
  @IsEnum(['gt', 'gte', 'lt', 'lte', 'eq'])
  comparator!: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'

  @IsNumber()
  @Min(0)
  threshold!: number

  @IsNumber()
  @Min(0)
  @Max(86400)
  durationSec!: number

  @IsString()
  @IsEnum(['info', 'warning', 'error', 'critical'])
  severity!: AlertSeverity

  @IsArray()
  @IsString({ each: true })
  @IsEnum(['email', 'sms', 'webhook', 'in_app', 'phone'], { each: true })
  channels!: AlertChannel[]

  @IsBoolean()
  enabled!: boolean

  @IsString()
  @IsNotEmpty()
  createdBy!: string
}

export class UpdateAlertRuleDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string

  @IsOptional()
  @IsString()
  metric?: string

  @IsOptional()
  @IsString()
  @IsEnum(['gt', 'gte', 'lt', 'lte', 'eq'])
  comparator?: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'

  @IsOptional()
  @IsNumber()
  @Min(0)
  threshold?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(86400)
  durationSec?: number

  @IsOptional()
  @IsString()
  @IsEnum(['info', 'warning', 'error', 'critical'])
  severity?: AlertSeverity

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsEnum(['email', 'sms', 'webhook', 'in_app', 'phone'], { each: true })
  channels?: AlertChannel[]

  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}

// ============ 告警操作 ============

export class SilenceAlertDto {
  @IsNumber()
  @Min(0)
  @Max(86400 * 7)
  durationSec!: number

  @IsString()
  @IsNotEmpty()
  operator!: string

  @IsOptional()
  @IsString()
  @MaxLength(256)
  reason?: string
}

// ============ 查询参数 ============

export class QueryMetricDto {
  @IsOptional()
  @IsString()
  limit?: string
}

export class ListAlertsQueryDto {
  @IsOptional()
  @IsString()
  @IsEnum(['firing', 'resolved', 'silenced'])
  status?: 'firing' | 'resolved' | 'silenced'
}
