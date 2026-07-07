/**
 * audit.dto.ts - 审计日志 DTO 定义
 * 用途: 审计日志的请求和响应数据结构
 */

import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsObject,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import type { AuditEventType, ActorType, RiskLevel } from './audit.entity'

/**
 * 创建审计日志 DTO
 */
export class CreateAuditLogDto {
  @ApiProperty({ description: '事件类型', example: 'auth.login' })
  @IsString()
  @MaxLength(50)
  eventType!: AuditEventType

  @ApiProperty({ description: '操作者 ID', example: 'user_001' })
  @IsString()
  @MaxLength(100)
  actorId!: string

  @ApiProperty({ description: '操作者类型', enum: ['user', 'admin', 'system', 'api_key'] })
  @IsEnum(['user', 'admin', 'system', 'api_key'])
  actorType!: ActorType

  @ApiPropertyOptional({ description: '租户 ID', example: 'tenant_abc' })
  @IsString()
  @IsOptional()
  tenantId?: string

  @ApiPropertyOptional({ description: '资源类型', example: 'order' })
  @IsString()
  @IsOptional()
  resourceType?: string

  @ApiPropertyOptional({ description: '资源 ID', example: 'order_123' })
  @IsString()
  @IsOptional()
  resourceId?: string

  @ApiPropertyOptional({ description: '额外元数据' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>

  @ApiPropertyOptional({ description: 'IP 地址', example: '192.168.1.1' })
  @IsString()
  @IsOptional()
  ipAddress?: string

  @ApiPropertyOptional({ description: 'User Agent' })
  @IsString()
  @IsOptional()
  userAgent?: string

  @ApiPropertyOptional({ description: '风险等级', enum: ['low', 'medium', 'high', 'critical'], default: 'low' })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  @IsOptional()
  riskLevel?: RiskLevel

  @ApiPropertyOptional({ description: 'Trace ID', example: 'trace_abc' })
  @IsString()
  @IsOptional()
  traceId?: string

  @ApiPropertyOptional({ description: 'Parent Span ID', example: 'span_def' })
  @IsString()
  @IsOptional()
  parentSpanId?: string

  @ApiPropertyOptional({ description: '分账 ID', example: 'settlement_001' })
  @IsString()
  @IsOptional()
  settlementId?: string

  @ApiPropertyOptional({ description: '分账金额（分）', example: 10000 })
  @IsInt()
  @Min(0)
  @IsOptional()
  settlementAmount?: number

  @ApiPropertyOptional({ description: '涉及的 PII 字段' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  piiFields?: string[]

  @ApiPropertyOptional({ description: '同意版本号', example: 'v2.1' })
  @IsString()
  @IsOptional()
  consentVersion?: string
}

/**
 * 审计日志查询 DTO
 */
export class AuditLogQueryDto {
  @ApiPropertyOptional({ description: '操作者 ID' })
  @IsString()
  @IsOptional()
  actorId?: string

  @ApiPropertyOptional({ description: '租户 ID' })
  @IsString()
  @IsOptional()
  tenantId?: string

  @ApiPropertyOptional({ description: '事件类型' })
  @IsString()
  @IsOptional()
  eventType?: string

  @ApiPropertyOptional({ description: '风险等级' })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  @IsOptional()
  riskLevel?: RiskLevel

  @ApiPropertyOptional({ description: '开始时间 (ISO8601)' })
  @IsDateString()
  @IsOptional()
  from?: string

  @ApiPropertyOptional({ description: '结束时间 (ISO8601)' })
  @IsDateString()
  @IsOptional()
  to?: string

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number

  @ApiPropertyOptional({ description: '分页游标' })
  @IsString()
  @IsOptional()
  cursor?: string
}

/**
 * 审计日志响应 DTO
 */
export class AuditLogResponseDto {
  @ApiProperty({ description: '日志 ID' })
  id!: string

  @ApiProperty({ description: '事件类型' })
  eventType!: string

  @ApiProperty({ description: '操作者 ID' })
  actorId!: string

  @ApiProperty({ description: '操作者类型' })
  actorType!: string

  @ApiPropertyOptional({ description: '租户 ID' })
  tenantId?: string

  @ApiPropertyOptional({ description: '资源类型' })
  resourceType?: string

  @ApiPropertyOptional({ description: '资源 ID' })
  resourceId?: string

  @ApiPropertyOptional({ description: '元数据' })
  metadata?: Record<string, unknown>

  @ApiPropertyOptional({ description: 'IP 地址' })
  ipAddress?: string

  @ApiProperty({ description: '风险等级' })
  riskLevel!: string

  @ApiProperty({ description: '时间戳' })
  timestamp!: Date

  @ApiPropertyOptional({ description: 'Trace ID' })
  traceId?: string

  @ApiPropertyOptional({ description: '分账 ID' })
  settlementId?: string

  @ApiPropertyOptional({ description: '分账金额' })
  settlementAmount?: number
}

/**
 * 审计日志分页响应 DTO
 */
export class AuditLogPaginatedResponseDto {
  @ApiProperty({ description: '日志列表', type: [AuditLogResponseDto] })
  items!: AuditLogResponseDto[]

  @ApiPropertyOptional({ description: '下一页游标' })
  nextCursor?: string

  @ApiProperty({ description: '总数' })
  total!: number
}

/**
 * 分账事件日志 DTO
 */
export class SettlementAuditLogDto {
  @ApiProperty({ description: '分账 ID', example: 'settlement_001' })
  @IsString()
  settlementId!: string

  @ApiProperty({ description: '分账金额（分）', example: 10000 })
  @IsInt()
  @Min(0)
  amount!: number

  @ApiProperty({ description: '事件类型', enum: ['created', 'approved', 'paid', 'rejected'] })
  @IsEnum(['created', 'approved', 'paid', 'rejected'])
  eventType!: 'created' | 'approved' | 'paid' | 'rejected'

  @ApiPropertyOptional({ description: '额外元数据' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>
}

/**
 * 审计报告导出 DTO
 */
export class AuditReportExportDto {
  @ApiProperty({ description: '开始时间 (ISO8601)' })
  @IsDateString()
  from!: string

  @ApiProperty({ description: '结束时间 (ISO8601)' })
  @IsDateString()
  to!: string

  @ApiProperty({ description: '导出格式', enum: ['json', 'csv'], default: 'json' })
  @IsEnum(['json', 'csv'])
  @IsOptional()
  format?: 'json' | 'csv'
}

/**
 * 异常检测结果 DTO
 */
export class AnomalyDetectionResultDto {
  @ApiProperty({ description: '异常模式描述' })
  pattern!: string

  @ApiProperty({ description: '风险等级' })
  riskLevel!: string

  @ApiProperty({ description: '命中次数' })
  count!: number
}

/**
 * 合规报告 DTO
 */
export class ComplianceReportDto {
  @ApiProperty({ description: '数据处理活动' })
  processingActivities!: unknown[]

  @ApiProperty({ description: '同意记录' })
  consentRecords!: unknown[]

  @ApiProperty({ description: '数据主体请求' })
  dsrRequests!: unknown[]

  @ApiProperty({ description: '数据泄露事件' })
  dataBreaches!: unknown[]
}

/**
 * 风险评分 DTO
 */
export class RiskScoreResponseDto {
  @ApiProperty({ description: '操作者 ID' })
  actorId!: string

  @ApiProperty({ description: '风险评分 (0-100)' })
  score!: number

  @ApiProperty({ description: '风险等级' })
  riskLevel!: string
}
