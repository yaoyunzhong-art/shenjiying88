import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { SatisfactionCategory } from './customer-satisfaction.entity'

export class SatisfactionQueryDto {
  @ApiPropertyOptional({ description: '门店ID' })
  @IsOptional()
  @IsString()
  storeId?: string

  @ApiPropertyOptional({ enum: SatisfactionCategory, description: '类别过滤' })
  @IsOptional()
  @IsEnum(SatisfactionCategory)
  category?: SatisfactionCategory

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDateString()
  endDate?: string

  @ApiPropertyOptional({ description: '最低评分' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  minScore?: number
}

export class CreateSatisfactionDto {
  @ApiProperty({ description: '门店ID' })
  @IsString()
  storeId!: string

  @ApiProperty({ description: '客户姓名' })
  @IsString()
  customerName!: string

  @ApiProperty({ description: '评分 (1-5)' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  score!: number

  @ApiProperty({ enum: SatisfactionCategory, description: '类别' })
  @IsEnum(SatisfactionCategory)
  category!: SatisfactionCategory

  @ApiProperty({ description: '评价内容' })
  @IsString()
  comment!: string

  @ApiProperty({ description: '到访日期' })
  @IsDateString()
  visitDate!: string
}

export class SatisfactionDto {
  @ApiProperty({ description: '记录ID' })
  id!: string

  @ApiProperty({ description: '租户ID' })
  tenantId!: string

  @ApiProperty({ description: '门店ID' })
  storeId!: string

  @ApiProperty({ description: '客户姓名' })
  customerName!: string

  @ApiProperty({ description: '评分 (1-5)' })
  score!: number

  @ApiProperty({ enum: SatisfactionCategory, description: '类别' })
  category!: SatisfactionCategory

  @ApiProperty({ description: '评价内容' })
  comment!: string

  @ApiProperty({ description: '到访日期' })
  visitDate!: string

  @ApiProperty({ description: '创建时间' })
  createdAt!: string
}

export class SatisfactionSummaryDto {
  @ApiProperty({ description: '总反馈数' })
  totalResponses!: number

  @ApiProperty({ description: '平均评分' })
  avgScore!: number

  @ApiProperty({ description: '最佳类别' })
  bestCategory!: string

  @ApiProperty({ description: '最差类别' })
  worstCategory!: string

  @ApiProperty({ description: '评分分布', type: 'object', additionalProperties: { type: 'number' } })
  scoreDistribution!: Record<string, number>

  @ApiProperty({ description: '反馈率' })
  responseRate!: number
}

export class SatisfactionListDto {
  @ApiProperty({ type: [SatisfactionDto], description: '满意度列表' })
  items!: SatisfactionDto[]

  @ApiProperty({ description: '总数' })
  total!: number
}
