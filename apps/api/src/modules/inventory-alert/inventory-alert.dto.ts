import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { AlertLevel, AlertStatus } from './inventory-alert.entity'

export class AlertQueryDto {
  @ApiPropertyOptional({ enum: AlertLevel, description: '预警级别过滤' })
  @IsOptional()
  @IsEnum(AlertLevel)
  alertLevel?: AlertLevel

  @ApiPropertyOptional({ enum: AlertStatus, description: '预警状态过滤' })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus

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

export class CreateInventoryAlertDto {
  @ApiProperty({ description: '产品ID' })
  @IsString()
  productId!: string

  @ApiProperty({ description: '预警级别', enum: AlertLevel })
  @IsEnum(AlertLevel)
  alertLevel!: AlertLevel

  @ApiProperty({ description: '预警消息' })
  @IsString()
  message!: string
}

export class InventoryAlertDto {
  @ApiProperty({ description: '预警ID' })
  id!: string

  @ApiProperty({ description: '租户ID' })
  tenantId!: string

  @ApiProperty({ description: '产品ID' })
  productId!: string

  @ApiProperty({ description: '产品名称' })
  productName!: string

  @ApiProperty({ description: 'SKU' })
  sku!: string

  @ApiProperty({ description: '当前库存' })
  currentStock!: number

  @ApiProperty({ description: '最低库存阈值' })
  minStock!: number

  @ApiProperty({ description: '最高库存阈值' })
  maxStock!: number

  @ApiProperty({ enum: AlertLevel, description: '预警级别' })
  alertLevel!: AlertLevel

  @ApiProperty({ description: '预警消息' })
  message!: string

  @ApiProperty({ enum: AlertStatus, description: '预警状态' })
  status!: AlertStatus

  @ApiProperty({ description: '创建时间' })
  createdAt!: string

  @ApiProperty({ description: '更新时间' })
  updatedAt!: string
}

export class AlertSummaryDto {
  @ApiProperty({ description: '总预警数' })
  total!: number

  @ApiProperty({ description: '待处理预警数' })
  pending!: number

  @ApiProperty({ description: '库存偏低预警数' })
  lowCount!: number

  @ApiProperty({ description: '库存严重不足预警数' })
  criticalCount!: number

  @ApiProperty({ description: '库存积压预警数' })
  overstockCount!: number

  @ApiProperty({ description: '已解决预警数' })
  resolvedCount!: number

  @ApiProperty({ description: '已忽略预警数' })
  ignoredCount!: number
}

export class InventoryAlertListDto {
  @ApiProperty({ type: [InventoryAlertDto], description: '预警列表' })
  items!: InventoryAlertDto[]

  @ApiProperty({ description: '总数' })
  total!: number

  @ApiProperty({ description: '当前偏移' })
  offset!: number

  @ApiProperty({ description: '每页条数' })
  limit!: number
}
