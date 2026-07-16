// campaign-performance.dto.ts — Phase3 活动效果评估 DTO
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { CampaignStatus, CampaignType } from './campaign-performance.entity'

// ═══════════════════════════════════════════════════════════════════════
// 活动查询 DTO
// ═══════════════════════════════════════════════════════════════════════

export class CampaignQueryDto {
  @ApiPropertyOptional({ description: '门店 ID' })
  @IsString()
  @IsOptional()
  storeId?: string

  @ApiPropertyOptional({ description: '开始日期 (ISO8601)' })
  @IsDateString()
  @IsOptional()
  startDate?: string

  @ApiPropertyOptional({ description: '结束日期 (ISO8601)' })
  @IsDateString()
  @IsOptional()
  endDate?: string

  @ApiPropertyOptional({ enum: CampaignType, description: '活动类型' })
  @IsEnum(CampaignType)
  @IsOptional()
  campaignType?: CampaignType

  @ApiPropertyOptional({ enum: CampaignStatus, description: '活动状态' })
  @IsEnum(CampaignStatus)
  @IsOptional()
  status?: CampaignStatus
}

// ═══════════════════════════════════════════════════════════════════════
// 活动效果 DTO
// ═══════════════════════════════════════════════════════════════════════

export class CampaignPerformanceDto {
  @ApiProperty({ description: '活动 ID' })
  @IsString()
  id!: string

  @ApiProperty({ description: '活动名称' })
  @IsString()
  campaignName!: string

  @ApiProperty({ enum: CampaignType, description: '活动类型' })
  @IsEnum(CampaignType)
  type!: CampaignType

  @ApiProperty({ description: '开始日期' })
  @IsDateString()
  startDate!: string

  @ApiProperty({ description: '结束日期' })
  @IsDateString()
  endDate!: string

  @ApiProperty({ description: '预算金额（元）' })
  @IsNumber()
  @Min(0)
  budget!: number

  @ApiProperty({ description: '实际支出（元）' })
  @IsNumber()
  @Min(0)
  actualCost!: number

  @ApiProperty({ description: '参与人数' })
  @IsNumber()
  @Min(0)
  participants!: number

  @ApiProperty({ description: '新增会员数' })
  @IsNumber()
  @Min(0)
  newMembers!: number

  @ApiProperty({ description: '营收金额（元）' })
  @IsNumber()
  @Min(0)
  revenue!: number

  @ApiProperty({ description: 'ROI（营收 / 成本 × 100%）' })
  @IsNumber()
  roi!: number

  @ApiProperty({ description: '满意度评分（1-5）' })
  @IsNumber()
  @Min(0)
  satisfaction!: number
}

// ═══════════════════════════════════════════════════════════════════════
// 活动汇总 DTO
// ═══════════════════════════════════════════════════════════════════════

export class CampaignSummaryDto {
  @ApiProperty({ description: '活动总数' })
  @IsNumber()
  totalCampaigns!: number

  @ApiProperty({ description: '总预算（元）' })
  @IsNumber()
  @Min(0)
  totalBudget!: number

  @ApiProperty({ description: '总支出（元）' })
  @IsNumber()
  @Min(0)
  totalCost!: number

  @ApiProperty({ description: '总营收（元）' })
  @IsNumber()
  @Min(0)
  totalRevenue!: number

  @ApiProperty({ description: '平均 ROI' })
  @IsNumber()
  avgROI!: number

  @ApiProperty({ description: '总参与人数' })
  @IsNumber()
  @Min(0)
  totalParticipants!: number

  @ApiProperty({ description: '新增会员数' })
  @IsNumber()
  @Min(0)
  newMembersAcquired!: number
}

// ═══════════════════════════════════════════════════════════════════════
// 活动效果列表 DTO（含分页和汇总）
// ═══════════════════════════════════════════════════════════════════════

export class CampaignPerformanceListDto {
  @ApiProperty({ type: [CampaignPerformanceDto], description: '活动效果列表' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignPerformanceDto)
  items!: CampaignPerformanceDto[]

  @ApiProperty({ description: '总数' })
  @IsNumber()
  total!: number

  @ApiProperty({ description: '汇总' })
  @ValidateNested()
  @Type(() => CampaignSummaryDto)
  summary!: CampaignSummaryDto
}

// ═══════════════════════════════════════════════════════════════════════
// 创建活动 DTO
// ═══════════════════════════════════════════════════════════════════════

export class CreateCampaignDto {
  @ApiProperty({ description: '活动名称' })
  @IsString()
  campaignName!: string

  @ApiProperty({ enum: CampaignType, description: '活动类型' })
  @IsEnum(CampaignType)
  type!: CampaignType

  @ApiProperty({ description: '开始日期' })
  @IsDateString()
  startDate!: string

  @ApiProperty({ description: '结束日期' })
  @IsDateString()
  endDate!: string

  @ApiProperty({ description: '预算金额' })
  @IsNumber()
  @Min(0)
  budget!: number

  @ApiProperty({ description: '实际支出' })
  @IsNumber()
  @Min(0)
  actualCost!: number

  @ApiProperty({ description: '参与人数' })
  @IsNumber()
  @Min(0)
  participants!: number

  @ApiProperty({ description: '新增会员数' })
  @IsNumber()
  @Min(0)
  newMembers!: number

  @ApiProperty({ description: '营收金额' })
  @IsNumber()
  @Min(0)
  revenue!: number

  @ApiPropertyOptional({ description: '满意度评分（1-5）', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  satisfaction?: number
}
