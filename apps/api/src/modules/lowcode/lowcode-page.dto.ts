import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  IsEnum,
  IsNumber,
  MaxLength,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ComponentDto {
  @ApiProperty({ description: '组件类型', example: 'button' })
  @IsString()
  type!: string

  @ApiPropertyOptional({ description: '组件属性', example: { text: 'Click me' } })
  @IsObject()
  @IsOptional()
  props?: Record<string, unknown>
}

export class CreatePageDto {
  @ApiProperty({ description: '模板ID', example: 'tpl-dashboard' })
  @IsString()
  @MaxLength(100)
  templateId!: string

  @ApiPropertyOptional({ description: '页面名称', example: '我的仪表盘' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string
}

export class UpdatePageDto {
  @ApiPropertyOptional({ description: '页面名称' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: '页面状态', enum: ['draft', 'published'] })
  @IsEnum(['draft', 'published'])
  @IsOptional()
  status?: 'draft' | 'published'
}

export class AddComponentDto {
  @ApiProperty({ description: '组件类型', example: 'button' })
  @IsString()
  type!: string

  @ApiPropertyOptional({ description: '组件属性' })
  @IsObject()
  @IsOptional()
  props?: Record<string, unknown>
}

export class UpdateComponentDto {
  @ApiProperty({ description: '组件属性（合并更新）' })
  @IsObject()
  props!: Record<string, unknown>
}

export class RecordMetricDto {
  @ApiProperty({ description: '指标名称', example: 'error_rate' })
  @IsString()
  name!: string

  @ApiProperty({ description: '指标值', example: 3.5 })
  @IsNumber()
  value!: number

  @ApiPropertyOptional({ description: '标签' })
  @IsObject()
  @IsOptional()
  tags?: Record<string, string>
}

export class SetThresholdDto {
  @ApiProperty({ description: '告警阈值', example: 2 })
  @IsNumber()
  threshold!: number
}

export class AlertQueryDto {
  @ApiPropertyOptional({ description: '指标名称过滤' })
  @IsString()
  @IsOptional()
  metricName?: string

  @ApiPropertyOptional({ description: '开始时间 (ISO)' })
  @IsString()
  @IsOptional()
  startDate?: string

  @ApiPropertyOptional({ description: '结束时间 (ISO)' })
  @IsString()
  @IsOptional()
  endDate?: string
}

export class MetricTrendQueryDto {
  @ApiPropertyOptional({ description: '时间窗口，如 1h, 30m, 1d', example: '1h' })
  @IsString()
  @IsOptional()
  window?: string = '1h'
}

export class PageResponseDto {
  @ApiProperty({ description: '页面ID' })
  id!: string

  @ApiProperty({ description: '模板ID' })
  templateId!: string

  @ApiProperty({ description: '页面名称' })
  name!: string

  @ApiProperty({ description: '组件列表' })
  components!: Record<string, unknown>[]

  @ApiProperty({ description: '状态' })
  status!: string

  @ApiProperty({ description: '创建时间' })
  createdAt!: Date

  @ApiProperty({ description: '更新时间' })
  updatedAt!: Date
}

export class ComponentResponseDto {
  @ApiProperty({ description: '组件ID' })
  id!: string

  @ApiProperty({ description: '组件类型' })
  type!: string

  @ApiProperty({ description: '组件属性' })
  props!: Record<string, unknown>
}
