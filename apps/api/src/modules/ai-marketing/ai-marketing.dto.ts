import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsNumber,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

// ─── Campaign Type & Channel Enums ─────────────────────────────

export enum CampaignTypeEnum {
  BRAND = 'brand',
  PERFORMANCE = 'performance',
  SOCIAL = 'social',
  EMAIL = 'email',
  PROMOTION = 'promotion',
  KOL = 'kOL',
}

export enum ChannelEnum {
  WECHAT = 'wechat',
  WEIBO = 'weibo',
  DOUYIN = 'douyin',
  XIAOHONGSHU = 'xiaohongshu',
  BILIBILI = 'bilibili',
  OFFLINE = 'offline',
  EMAIL = 'email',
  SMS = 'sms',
}

// ─── ROI Analysis ──────────────────────────────────────────────

export class ROIAnalysisDto {
  @IsString()
  @IsNotEmpty()
  campaignId!: string
}

export class CompareROIDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  campaignIds!: string[]
}

export class ProjectROIDto {
  @IsEnum(CampaignTypeEnum)
  type!: CampaignTypeEnum

  @IsNumber()
  @Min(0)
  budget!: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedCPM?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedCTR?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedConversionRate?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  averageOrderValue?: number
}

// ─── Copywriting ───────────────────────────────────────────────

export class CopyGenerationDto {
  @IsString()
  @IsNotEmpty()
  product!: string

  @IsEnum(['awareness', 'conversion', 'retention', 're-engagement'])
  goal!: 'awareness' | 'conversion' | 'retention' | 're-engagement'

  @IsString()
  @IsNotEmpty()
  audience!: string

  @IsOptional()
  @IsEnum(['formal', 'casual', 'humorous', 'inspirational'])
  tone?: 'formal' | 'casual' | 'humorous' | 'inspirational'

  @IsOptional()
  @IsEnum(['short', 'medium', 'long'])
  length?: 'short' | 'medium' | 'long'

  @IsOptional()
  @IsString()
  cta?: string
}

export class HeadlineOptimizeDto {
  @IsString()
  @IsNotEmpty()
  headline!: string
}

export class LocalizeCopyDto {
  @IsString()
  @IsNotEmpty()
  headline!: string

  @IsString()
  @IsNotEmpty()
  body!: string

  @IsString()
  @IsNotEmpty()
  cta!: string

  @IsArray()
  @IsString({ each: true })
  taglines!: string[]

  @IsEnum(['zh-CN', 'zh-TW', 'en-US', 'ja-JP'])
  locale!: 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP'
}

export class ABTestDto {
  @ValidateNested()
  @Type(() => CopyGenerationDto)
  brief!: CopyGenerationDto

  @IsNumber()
  @Min(2)
  @Max(10)
  count!: number
}

// ─── Campaign Planning ─────────────────────────────────────────

export class SuggestCampaignDto {
  @IsEnum(['awareness', 'conversion', 'retention', 'brand'])
  goal!: 'awareness' | 'conversion' | 'retention' | 'brand'

  @IsNumber()
  @Min(0)
  budget!: number

  @IsString()
  @IsNotEmpty()
  audience!: string
}

export class BudgetAllocationDto {
  @IsEnum(CampaignTypeEnum)
  campaignType!: CampaignTypeEnum

  @IsNumber()
  @Min(0)
  totalBudget!: number
}

export class ReachEstimateDto {
  @IsNumber()
  @Min(0)
  audience!: number

  @IsEnum(ChannelEnum)
  channel!: ChannelEnum
}

export class PlanTimelineDto {
  @IsEnum(['awareness', 'conversion', 'retention', 'brand'])
  goal!: 'awareness' | 'conversion' | 'retention' | 'brand'
}

// ─── Marketing Analysis ────────────────────────────────────────

export class MarketingAnalysisDto {
  @IsString()
  @IsNotEmpty()
  campaignId!: string

  @IsOptional()
  @IsBoolean()
  includeROI?: boolean

  @IsOptional()
  @IsBoolean()
  includeTimeline?: boolean

  @IsOptional()
  @IsBoolean()
  includeReach?: boolean
}

// ─── Batch Copy Generation ─────────────────────────────────────

class BatchCopyItemDto {
  @IsString()
  @IsNotEmpty()
  product!: string

  @IsString()
  @IsNotEmpty()
  goal!: string

  @IsString()
  @IsNotEmpty()
  audience!: string

  @IsOptional()
  @IsString()
  tone?: string

  @IsOptional()
  @IsString()
  length?: string
}

export class BatchCopyGenerationDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BatchCopyItemDto)
  items!: BatchCopyItemDto[]
}

// ═══ Analytics DTOs ═══

export class AttributionAnalysisDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  campaignIds?: string[]
}

export class FunnelAnalysisDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  campaignIds?: string[]
}

export class BudgetSimulationDto {
  @IsNumber()
  @Min(0)
  totalBudget!: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  types?: string[]
}

export class CohortAnalysisDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  @Type(() => Number)
  count?: number
}

export class CompetitiveAnalysisDto {
  @IsOptional()
  @IsString()
  market?: string
}

// ═══ Optimizer DTOs ═══

export class CreativePerformanceDto {
  @IsArray()
  @IsString({ each: true })
  creativeIds!: string[]
}

export class BidOptimizeDto {
  @IsString()
  @IsNotEmpty()
  campaignId!: string

  @IsNumber()
  @Min(0.01)
  currentBid!: number

  @IsNumber()
  @Min(0)
  dailyBudget!: number

  @IsNumber()
  @Min(0)
  targetCPA!: number
}

export class BudgetPacingDto {
  @IsNumber()
  @Min(0)
  totalBudget!: number

  @IsString()
  @IsNotEmpty()
  startDate!: string

  @IsString()
  @IsNotEmpty()
  endDate!: string

  @IsNumber()
  @Min(0)
  spentToDate!: number

  @IsNumber()
  @Min(0)
  elapsedDays!: number
}

export class CPADto {
  @IsNumber()
  @Min(0)
  currentCPA!: number

  @IsNumber()
  @Min(0)
  targetCPA!: number

  @IsNumber()
  @Min(0)
  @Max(100)
  conversionRate!: number

  @IsNumber()
  @Min(0)
  averageOrderValue!: number
}
