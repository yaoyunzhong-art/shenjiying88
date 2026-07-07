// perf-monitor.dto.ts - Phase-19 T27 auto
// 用途: 性能监控 DTO 定义
import { IsString, IsNumber, IsOptional, IsArray, Min, Max, IsBoolean } from 'class-validator'
import 'reflect-metadata'

/**
 * 注册采样请求 DTO
 */
export class RecordSampleDto {
  @IsString()
  route!: string

  @IsNumber()
  @Min(0)
  durationMs!: number

  @IsNumber()
  @Min(100)
  @Max(599)
  statusCode!: number

  @IsOptional()
  @IsString()
  timestamp?: string

  @IsOptional()
  @IsString()
  tenantId?: string
}

/**
 * 注册 SLA 配置请求 DTO
 */
export class RegisterSlaDto {
  @IsString()
  route!: string

  @IsNumber()
  @Min(1)
  targetP95Ms!: number

  @IsNumber()
  @Min(1)
  warnThresholdP95Ms!: number
}

/**
 * 路由性能统计查询 DTO
 */
export class RouteStatsQueryDto {
  @IsString()
  route!: string
}

/**
 * 性能统计响应 DTO
 */
export class PerfStatsDto {
  route!: string
  p50!: number
  p95!: number
  p99!: number
  max!: number
  count!: number
  errorRate!: number
}

/**
 * 性能总览响应 DTO
 */
export class PerfSummaryDto {
  totalSamples!: number
  routes!: number
  slowQueries!: number
  slaViolations!: number
}

/**
 * SLA 违规响应 DTO
 */
export class SlaViolationDto {
  route!: string
  violations!: number
  stats!: PerfStatsDto
}

/**
 * 慢查询列表查询 DTO
 */
export class SlowQueriesQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number
}

/**
 * 重置请求 DTO
 */
export class ResetDto {
  @IsOptional()
  @IsBoolean()
  confirm?: boolean
}
