import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsArray,
  IsDateString,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  Matches,
} from 'class-validator'
import 'reflect-metadata'

// ── 枚举 ─────────────────────────────────────────────────────────────────────

export enum GranularityEnum {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export enum ReportTypeEnum {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

export enum AttributionModelEnum {
  FIRST_TOUCH = 'first_touch',
  LAST_TOUCH = 'last_touch',
  LINEAR = 'linear',
  TIME_DECAY = 'time_decay',
  POSITION_BASED = 'position_based',
}

export enum ContentTypeEnum {
  IMAGE = 'image',
  VIDEO = 'video',
  ARTICLE = 'article',
  LIVE = 'live',
  AUDIO = 'audio',
}

// ── 分析查询 DTO ─────────────────────────────────────────────────────────────
// brandId 来自 @Param，不在 Query 中重复

export class AnalyticsQueryDto {
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be YYYY-MM-DD format' })
  startDate!: string

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be YYYY-MM-DD format' })
  endDate!: string

  @IsEnum(GranularityEnum)
  granularity!: GranularityEnum

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channels?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[]
}

// ── 品牌对比 DTO ─────────────────────────────────────────────────────────────

export class CompareBrandsDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(10)
  brandIds!: string[]

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be YYYY-MM-DD format' })
  startDate!: string

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be YYYY-MM-DD format' })
  endDate!: string
}

// ── 生成报告 DTO（完整版：含时间范围） ─────────────────────────────────────

export class GenerateReportFullDto {
  @IsString()
  @IsNotEmpty()
  brandId!: string

  @IsEnum(ReportTypeEnum)
  reportType!: ReportTypeEnum

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be YYYY-MM-DD format' })
  startDate!: string

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be YYYY-MM-DD format' })
  endDate!: string
}

// ── 内容分析 DTO ─────────────────────────────────────────────────────────────

export class ContentAnalysisDto {
  @IsString()
  @IsNotEmpty()
  contentId!: string

  @IsString()
  @IsNotEmpty()
  brandId!: string

  @IsOptional()
  @IsArray()
  @IsEnum(ContentTypeEnum, { each: true })
  contentTypes?: ContentTypeEnum[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[]

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateFrom must be YYYY-MM-DD format' })
  dateFrom!: string

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateTo must be YYYY-MM-DD format' })
  dateTo!: string
}

// ── 渠道归因查询 DTO ─────────────────────────────────────────────────────────

export class ChannelAttributionQueryDto {
  @IsString()
  @IsNotEmpty()
  brandId!: string

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be YYYY-MM-DD format' })
  startDate!: string

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be YYYY-MM-DD format' })
  endDate!: string

  @IsOptional()
  @IsEnum(AttributionModelEnum)
  model?: AttributionModelEnum
}

// ── 品牌查询 DTO ─────────────────────────────────────────────────────────────

export class BrandQueryDto {
  @IsString()
  @IsNotEmpty()
  brandId!: string

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be YYYY-MM-DD format' })
  startDate!: string

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be YYYY-MM-DD format' })
  endDate!: string
}

// ── 竞争品牌对比 DTO ─────────────────────────────────────────────────────────

export class CompetitorQueryDto {
  @IsString()
  @IsNotEmpty()
  brandId!: string

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  competitorIds!: string[]

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be YYYY-MM-DD format' })
  startDate!: string

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be YYYY-MM-DD format' })
  endDate!: string
}

// ── 标签查询 DTO ─────────────────────────────────────────────────────────────

// ── 标签查询 DTO ─────────────────────────────────────────────────────────────
// brandId 来自 @Param

export class TopContentQueryDto {
  @IsOptional()
  @IsEnum(ContentTypeEnum)
  contentType?: ContentTypeEnum

  @IsOptional()
  @IsString()
  platform?: string

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be YYYY-MM-DD format' })
  startDate!: string

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be YYYY-MM-DD format' })
  endDate!: string
}

// ── 品牌健康度查询 DTO ───────────────────────────────────────────────────────

export class HealthQueryDto {
  @IsString()
  @IsNotEmpty()
  brandId!: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  category?: string
}

// ── 健康度趋势查询 DTO ───────────────────────────────────────────────────────

// ── 健康度趋势查询 DTO ───────────────────────────────────────────────────────
// brandId 来自 @Param

export class HealthTrendQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: 'months must be a number' })
  months?: string // passed as query string, parsed to number
}

// ── 市场占比查询 DTO ─────────────────────────────────────────────────────────

export class MarketShareQueryDto {
  @IsString()
  @IsNotEmpty()
  brandId!: string

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD format' })
  date!: string

  @IsOptional()
  @IsString()
  category?: string
}

// ── 内容建议查询 DTO ─────────────────────────────────────────────────────────

// ── 内容建议查询 DTO ─────────────────────────────────────────────────────────
// contentId 来自 @Param，不在 Query 中重复

export class ContentSuggestionsDto {
  @IsOptional()
  @IsString()
  contentType?: string
}

// ── 控制器使用 DTO ───────────────────────────────────────────────────────────

export class GetKPIDto {
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be YYYY-MM-DD' })
  startDate!: string

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be YYYY-MM-DD' })
  endDate!: string
}

export class TrackKPIDto {
  @IsString()
  @IsNotEmpty()
  brandId!: string

  @IsString()
  @IsNotEmpty()
  tenantId!: string

  @IsOptional()
  @IsDateString()
  date?: string

  @IsNotEmpty({ message: 'metrics is required' })
  metrics!: Record<string, number>
}

export class TrackMentionDto {
  @IsString()
  @IsNotEmpty()
  brandId!: string

  @IsDateString()
  date!: string

  @IsString()
  @IsNotEmpty()
  platform!: string

  @IsNotEmpty()
  mentionCount!: number

  @IsNotEmpty()
  positiveCount!: number

  @IsNotEmpty()
  negativeCount!: number

  @IsNotEmpty()
  neutralCount!: number

  sentimentScore!: number

  @IsOptional()
  topKeywords?: { keyword: string; count: number }[]

  @IsOptional()
  topMentions?: { title: string; url: string; sentiment: string }[]
}

export class UpdateHealthDto {
  @IsOptional()
  overallScore?: number

  @IsOptional()
  dimensions?: Record<string, { score?: number; trend?: 'up' | 'down' | 'stable'; description?: string }>
}

export class TrackContentDto {
  @IsString()
  @IsNotEmpty()
  contentType!: string

  @IsString()
  @IsNotEmpty()
  title!: string

  @IsString()
  @IsNotEmpty()
  platform!: string

  @IsDateString()
  publishDate!: string

  @IsNotEmpty()
  metrics!: Record<string, number>

  @IsOptional()
  qualityScore?: number

  @IsOptional()
  suggestedImprovements?: string[]
}

export class GenerateReportDto {
  @IsString()
  @IsNotEmpty()
  reportType!: string
}

export class ROIDto {
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be YYYY-MM-DD' })
  startDate!: string

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'endDate must be YYYY-MM-DD' })
  endDate!: string
}
