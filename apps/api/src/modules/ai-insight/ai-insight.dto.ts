import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  Min,
  Max,
  IsArray,
  ValidateNested
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

// ─── 洞察报告 ───

/**
 * 生成洞察报告 DTO
 */
export class GenerateReportDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['revenue', 'member', 'attendance', 'game', 'kpi'])
  type!: 'revenue' | 'member' | 'attendance' | 'game' | 'kpi'

  @IsOptional()
  @IsString()
  storeId?: string

  @IsString()
  @IsNotEmpty()
  periodStart!: string

  @IsString()
  @IsNotEmpty()
  periodEnd!: string
}

/**
 * 洞察报告查询 DTO
 */
export class InsightReportQueryDto {
  @IsOptional()
  @IsString()
  storeId?: string

  @IsOptional()
  @IsString()
  @IsEnum(['revenue', 'member', 'attendance', 'game', 'kpi'])
  type?: 'revenue' | 'member' | 'attendance' | 'game' | 'kpi'

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number
}

// ─── KPI ───

/**
 * KPI 查询 DTO
 */
export class KPIQueryDto {
  @IsOptional()
  @IsString()
  storeId?: string

  @IsOptional()
  @IsString()
  @IsEnum(['revenue', 'member', 'attendance', 'game', 'operation'])
  category?: 'revenue' | 'member' | 'attendance' | 'game' | 'operation'
}

// ─── 异常检测 ───

/**
 * 异常查询 DTO
 */
export class AnomalyQueryDto {
  @IsOptional()
  @IsString()
  storeId?: string

  @IsOptional()
  @IsString()
  metric?: string

  @IsOptional()
  @IsString()
  @IsEnum(['open', 'acknowledged', 'resolved'])
  status?: 'open' | 'acknowledged' | 'resolved'

  @IsOptional()
  @IsString()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity?: 'low' | 'medium' | 'high' | 'critical'

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number
}

/**
 * 解决异常 DTO
 */
export class ResolveAnomalyDto {
  @IsString()
  @IsNotEmpty()
  anomalyId!: string
}

// ─── 趋势预测 ───

/**
 * 生成趋势预测 DTO
 */
export class GenerateForecastDto {
  @IsString()
  @IsNotEmpty()
  metric!: string

  @IsString()
  @IsNotEmpty()
  period!: string
}

// ─── 仪表盘 ───

/**
 * 仪表盘查询 DTO
 */
export class DashboardQueryDto {
  @IsOptional()
  @IsString()
  storeId?: string
}
