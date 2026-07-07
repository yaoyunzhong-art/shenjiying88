import {
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsOptional,
  ValidateNested,
  Min,
  Max,
  IsNotEmpty,
  IsIn,
  ArrayMinSize
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

/**
 * Phase-39 T169: 报表模块 DTO
 *
 * 配合 class-validator 做运行时校验
 */

// ─── 筛选条件 DSL ──────────────────────────────────────

export type FilterOp = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'notIn' | 'between' | 'like'
export type ReportType =
  | 'revenue' | 'inventory' | 'member' | 'refund' | 'order'
  | 'product-ranking' | 'payment-mix' | 'hourly-heatmap'
  | 'channel-funnel' | 'inventory-alert'
export type ReportPeriod = 'day' | 'week' | 'month' | 'year'
export type AggregationFn = 'sum' | 'count' | 'avg' | 'min' | 'max' | 'distinct'
export type ExportFormat = 'csv' | 'json' | 'html'

export class ReportFilterDto {
  @IsString()
  @IsNotEmpty()
  field!: string

  @IsString()
  @IsIn(['=', '!=', '>', '>=', '<', '<=', 'in', 'notIn', 'between', 'like'])
  op!: string

  value!: any
}

export class ReportFilterGroupDto {
  @IsString()
  @IsIn(['AND', 'OR'])
  op!: 'AND' | 'OR'

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  conditions!: (ReportFilterDto | ReportFilterGroupDto)[]
}

export class ReportDimensionDto {
  @IsString()
  @IsNotEmpty()
  field!: string

  @IsOptional()
  @IsString()
  @IsIn(['day', 'week', 'month', 'year'])
  granularity?: ReportPeriod

  @IsOptional()
  @IsString()
  alias?: string
}

export class ReportMetricDto {
  @IsString()
  @IsNotEmpty()
  field!: string

  @IsString()
  @IsIn(['sum', 'count', 'avg', 'min', 'max', 'distinct'])
  fn!: AggregationFn

  @IsString()
  @IsNotEmpty()
  alias!: string
}

// ─── 查询参数 ──────────────────────────────────────────

export class QueryReportDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string

  @IsString()
  @IsIn([
    'revenue', 'inventory', 'member', 'refund', 'order',
    'product-ranking', 'payment-mix', 'hourly-heatmap',
    'channel-funnel', 'inventory-alert'
  ])
  type!: ReportType

  @IsString()
  @IsNotEmpty()
  from!: string

  @IsString()
  @IsNotEmpty()
  to!: string

  @IsOptional()
  @ValidateNested()
  @Type(() => ReportFilterGroupDto)
  filters?: ReportFilterGroupDto

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportDimensionDto)
  dimensions?: ReportDimensionDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportMetricDto)
  metrics?: ReportMetricDto[]

  @IsOptional()
  @IsString()
  noCache?: string
}

// ─── 报表定义 CRUD ──────────────────────────────────────

export class CreateReportDefinitionDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string

  @IsString()
  @IsNotEmpty()
  name!: string

  @IsString()
  @IsIn([
    'revenue', 'inventory', 'member', 'refund', 'order',
    'product-ranking', 'payment-mix', 'hourly-heatmap',
    'channel-funnel', 'inventory-alert'
  ])
  type!: ReportType

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportDimensionDto)
  dimensions!: ReportDimensionDto[]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportMetricDto)
  metrics!: ReportMetricDto[]

  @IsOptional()
  @ValidateNested()
  @Type(() => ReportFilterGroupDto)
  filters?: ReportFilterGroupDto

  @IsOptional()
  @IsString()
  schedule?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subscribers?: string[]

  @IsString()
  @IsNotEmpty()
  ownerId!: string
}

export class UpdateReportDefinitionDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportDimensionDto)
  dimensions?: ReportDimensionDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportMetricDto)
  metrics?: ReportMetricDto[]

  @IsOptional()
  @ValidateNested()
  @Type(() => ReportFilterGroupDto)
  filters?: ReportFilterGroupDto

  @IsOptional()
  @IsString()
  schedule?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subscribers?: string[]
}

// ─── 导出 ──────────────────────────────────────────────

export class ExportReportDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string

  @IsString()
  @IsIn([
    'revenue', 'inventory', 'member', 'refund', 'order',
    'product-ranking', 'payment-mix', 'hourly-heatmap',
    'channel-funnel', 'inventory-alert'
  ])
  type!: ReportType

  @IsString()
  @IsIn(['csv', 'json', 'html'])
  format!: ExportFormat

  @IsString()
  @IsNotEmpty()
  from!: string

  @IsString()
  @IsNotEmpty()
  to!: string

  @IsOptional()
  @ValidateNested()
  @Type(() => ReportFilterGroupDto)
  filters?: ReportFilterGroupDto
}

// ─── 缓存管理 ──────────────────────────────────────────

export class InvalidateCacheDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string

  @IsOptional()
  @IsString()
  @IsIn([
    'revenue', 'inventory', 'member', 'refund', 'order',
    'product-ranking', 'payment-mix', 'hourly-heatmap',
    'channel-funnel', 'inventory-alert'
  ])
  type?: ReportType
}
