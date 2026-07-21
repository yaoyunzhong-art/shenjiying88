import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { FaultSeverity, FaultStatus } from './equipment-fault-report.entity'

export class FaultQueryDto {
  @ApiPropertyOptional({ enum: FaultSeverity, description: '严重程度过滤' })
  @IsOptional()
  @IsEnum(FaultSeverity)
  severity?: FaultSeverity

  @ApiPropertyOptional({ enum: FaultStatus, description: '状态过滤' })
  @IsOptional()
  @IsEnum(FaultStatus)
  status?: FaultStatus

  @ApiPropertyOptional({ description: '设备类型过滤' })
  @IsOptional()
  @IsString()
  equipmentType?: string

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ description: '每页条数', default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number

  @ApiPropertyOptional({ description: '偏移量', default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  offset?: number
}

export class CreateFaultReportDto {
  @ApiProperty({ description: '设备ID' })
  @IsString()
  equipmentId!: string

  @ApiProperty({ description: '设备名称' })
  @IsString()
  equipmentName!: string

  @ApiProperty({ description: '设备类型' })
  @IsString()
  equipmentType!: string

  @ApiProperty({ description: '故障描述' })
  @IsString()
  faultDescription!: string

  @ApiProperty({ enum: FaultSeverity, description: '严重程度' })
  @IsEnum(FaultSeverity)
  severity!: FaultSeverity

  @ApiProperty({ description: '报告人' })
  @IsString()
  reporterName!: string

  @ApiProperty({ description: '故障发生时间' })
  @IsString()
  occurredAt!: string
}

export class FaultReportDto {
  @ApiProperty({ description: '故障报告ID' })
  id!: string

  @ApiProperty({ description: '租户ID' })
  tenantId!: string

  @ApiProperty({ description: '设备ID' })
  equipmentId!: string

  @ApiProperty({ description: '设备名称' })
  equipmentName!: string

  @ApiProperty({ description: '设备类型' })
  equipmentType!: string

  @ApiProperty({ description: '故障描述' })
  faultDescription!: string

  @ApiProperty({ enum: FaultSeverity, description: '严重程度' })
  severity!: FaultSeverity

  @ApiProperty({ enum: FaultStatus, description: '故障状态' })
  status!: FaultStatus

  @ApiProperty({ description: '报告人' })
  reporterName!: string

  @ApiPropertyOptional({ description: '处理人' })
  assignee?: string

  @ApiPropertyOptional({ description: '处理结果' })
  resolution?: string

  @ApiProperty({ description: '故障发生时间' })
  occurredAt!: string

  @ApiPropertyOptional({ description: '解决时间' })
  resolvedAt?: string

  @ApiProperty({ description: '创建时间' })
  createdAt!: string

  @ApiProperty({ description: '更新时间' })
  updatedAt!: string
}

export class FaultSummaryDto {
  @ApiProperty({ description: '总故障数' })
  total!: number

  @ApiProperty({ description: '待处理故障数' })
  pending!: number

  @ApiProperty({ description: '处理中故障数' })
  inProgress!: number

  @ApiProperty({ description: '已解决故障数' })
  resolved!: number

  @ApiProperty({ description: '轻微故障数' })
  minorCount!: number

  @ApiProperty({ description: '主要故障数' })
  majorCount!: number

  @ApiProperty({ description: '严重故障数' })
  criticalCount!: number

  @ApiProperty({ description: '设备类型分布', type: 'object', additionalProperties: { type: 'number' } })
  byEquipmentType!: Record<string, number>
}

export class UpdateFaultReportDto {
  @ApiPropertyOptional({ description: '处理人' })
  @IsOptional()
  @IsString()
  assignee?: string

  @ApiPropertyOptional({ enum: FaultStatus, description: '故障状态' })
  @IsOptional()
  @IsEnum(FaultStatus)
  status?: FaultStatus

  @ApiPropertyOptional({ description: '处理结果' })
  @IsOptional()
  @IsString()
  resolution?: string
}

export class FaultReportListDto {
  @ApiProperty({ type: [FaultReportDto], description: '故障列表' })
  items!: FaultReportDto[]

  @ApiProperty({ description: '总数' })
  total!: number

  @ApiProperty({ description: '当前偏移' })
  offset!: number

  @ApiProperty({ description: '每页条数' })
  limit!: number
}
