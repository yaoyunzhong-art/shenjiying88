import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { DeviceType } from './device-usage-report.entity'

export class DeviceUsageQueryDto {
  @ApiPropertyOptional({ description: '门店ID' })
  @IsOptional()
  @IsString()
  storeId?: string

  @ApiPropertyOptional({ enum: DeviceType, description: '设备类型过滤' })
  @IsOptional()
  @IsEnum(DeviceType)
  deviceType?: DeviceType

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDateString()
  endDate?: string
}

export class CreateDeviceUsageDto {
  @ApiProperty({ description: '设备ID' })
  @IsString()
  deviceId!: string

  @ApiProperty({ description: '设备名称' })
  @IsString()
  deviceName!: string

  @ApiProperty({ enum: DeviceType, description: '设备类型' })
  @IsEnum(DeviceType)
  deviceType!: DeviceType

  @ApiProperty({ description: '门店ID' })
  @IsString()
  storeId!: string

  @ApiProperty({ description: '使用率（百分比）' })
  @IsNumber()
  @Type(() => Number)
  usageRate!: number

  @ApiProperty({ description: '闲置率（百分比）' })
  @IsNumber()
  @Type(() => Number)
  idleRate!: number

  @ApiProperty({ description: '维护率（百分比）' })
  @IsNumber()
  @Type(() => Number)
  maintenanceRate!: number

  @ApiProperty({ description: '高峰时段' })
  @IsString()
  peakHours!: string

  @ApiProperty({ description: '平均使用时长（分钟）' })
  @IsNumber()
  @Type(() => Number)
  avgSessionMinutes!: number

  @ApiProperty({ description: '日收入' })
  @IsNumber()
  @Type(() => Number)
  dailyRevenue!: number

  @ApiProperty({ description: '日期' })
  @IsDateString()
  date!: string
}

export class DeviceUsageDto {
  @ApiProperty({ description: '记录ID' })
  id!: string

  @ApiProperty({ description: '租户ID' })
  tenantId!: string

  @ApiProperty({ description: '设备ID' })
  deviceId!: string

  @ApiProperty({ description: '设备名称' })
  deviceName!: string

  @ApiProperty({ enum: DeviceType, description: '设备类型' })
  deviceType!: DeviceType

  @ApiProperty({ description: '门店ID' })
  storeId!: string

  @ApiProperty({ description: '使用率（百分比）' })
  usageRate!: number

  @ApiProperty({ description: '闲置率（百分比）' })
  idleRate!: number

  @ApiProperty({ description: '维护率（百分比）' })
  maintenanceRate!: number

  @ApiProperty({ description: '高峰时段' })
  peakHours!: string

  @ApiProperty({ description: '平均使用时长（分钟）' })
  avgSessionMinutes!: number

  @ApiProperty({ description: '日收入' })
  dailyRevenue!: number

  @ApiProperty({ description: '日期' })
  date!: string

  @ApiProperty({ description: '创建时间' })
  createdAt!: string
}

export class DeviceUsageSummaryDto {
  @ApiProperty({ description: '设备总数' })
  totalDevices!: number

  @ApiProperty({ description: '平均使用率' })
  avgUsageRate!: number

  @ApiProperty({ description: '平均闲置率' })
  avgIdleRate!: number

  @ApiProperty({ description: '使用率最高设备类型' })
  peakDeviceType!: string

  @ApiProperty({ description: '使用率最低设备' })
  lowestUsageDevice!: string

  @ApiProperty({ description: '日总收入' })
  totalDailyRevenue!: number
}

export class DeviceUsageListDto {
  @ApiProperty({ type: [DeviceUsageDto], description: '设备使用数据列表' })
  items!: DeviceUsageDto[]

  @ApiProperty({ description: '总数' })
  total!: number
}
