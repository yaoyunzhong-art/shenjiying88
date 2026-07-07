/**
 * 报表/看板 - DTO (V10 Day 7 Phase 91)
 *
 * 请求/响应 DTO 定义
 */

import 'reflect-metadata'

// ============ 创建报表请求 ============

export class CreateReportDto {
  name!: string
  period!: 'daily' | 'weekly' | 'monthly' | 'custom'
  metrics!: string[]
  dimensions!: string[]
  source!: 'orders' | 'members' | 'inventory' | 'marketing' | 'ai_logs'
  cacheTtl!: number
  createdBy!: string
}

// ============ 查询报表请求 ============

export class QueryReportDto {
  reportId!: string
  period!: 'daily' | 'weekly' | 'monthly' | 'custom'
  from?: string
  to?: string
  dimensions?: string[]
  metrics?: string[]
}

// ============ 数据注入请求 ============

export class IngestDataPointDto {
  bucket!: string
  dimension!: string
  metric!: string
  value!: number
  /** 同比 */
  yoy?: number
  /** 环比 */
  qoq?: number
}

export class IngestDataPointsDto {
  points!: IngestDataPointDto[]
}

// ============ 看板 DTO ============

export class DashboardCardDto {
  id!: string
  reportId!: string
  display!: 'line' | 'bar' | 'pie' | 'number' | 'table' | 'heatmap'
  title!: string
  size!: { w: number; h: number }
  position!: { x: number; y: number }
  config?: Record<string, unknown>
}

export class CreateDashboardDto {
  name!: string
  cards!: DashboardCardDto[]
  ownerId!: string
  isShared!: boolean
}

export class UpdateDashboardDto {
  name?: string
  cards?: DashboardCardDto[]
  ownerId?: string
  isShared?: boolean
}

// ============ 聚合查询 ============

export class AggregateQueryDto {
  metric!: string
  dimension!: string
}

// ============ 报表响应 ============

export class ReportListResponseDto {
  items!: any[]
  total!: number
}

export class ReportDetailResponseDto {
  id!: string
  name!: string
  period!: string
  metrics!: string[]
  dimensions!: string[]
  source!: string
  cacheTtl!: number
  createdBy!: string
  createdAt!: string
  updatedAt!: string
}

export class DashboardListResponseDto {
  items!: any[]
  total!: number
}
