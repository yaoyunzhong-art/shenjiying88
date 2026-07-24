import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator'
import type { ChannelConfig } from './brand-operations.channel-kpi.entity'

// ── 渠道类型枚举 ────────────────────────────────────────────────────────────

export enum ChannelTypeEnum {
  SOCIAL_MEDIA = 'social_media',
  SEARCH_ENGINE = 'search_engine',
  DISPLAY_AD = 'display_ad',
  OFFLINE_STORE = 'offline_store',
  EMAIL = 'email',
  SMS = 'sms',
  APP_PUSH = 'app_push',
  AFFILIATE = 'affiliate',
  OTHER = 'other',
}

export enum ChannelStatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAUSED = 'paused',
}

// ── 创建渠道 DTO ────────────────────────────────────────────────────────────

export class CreateBrandChannelDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name!: string

  @IsEnum(ChannelTypeEnum)
  type!: ChannelTypeEnum

  @IsOptional()
  @IsObject()
  config?: ChannelConfig

  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactName?: string

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string

  @IsOptional()
  @IsString()
  operatorId?: string

  @IsOptional()
  @IsString()
  operatorName?: string
}

// ── 更新渠道 DTO ────────────────────────────────────────────────────────────

export class UpdateBrandChannelDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsEnum(ChannelTypeEnum)
  type?: ChannelTypeEnum

  @IsOptional()
  @IsEnum(ChannelStatusEnum)
  status?: ChannelStatusEnum

  @IsOptional()
  @IsObject()
  config?: ChannelConfig

  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactName?: string

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string

  @IsOptional()
  @IsString()
  operatorId?: string

  @IsOptional()
  @IsString()
  operatorName?: string
}

// ── KPI 创建 DTO ────────────────────────────────────────────────────────────

export enum KpiCategoryEnum {
  EXPOSURE = 'exposure',
  ENGAGEMENT = 'engagement',
  CONVERSION = 'conversion',
  REVENUE = 'revenue',
  RETENTION = 'retention',
  BRAND_AWARENESS = 'brand_awareness',
}

export enum KpiPeriodEnum {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export class CreateBrandKPIDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  name!: string

  @IsEnum(KpiCategoryEnum)
  category!: KpiCategoryEnum

  @IsEnum(KpiPeriodEnum)
  period!: KpiPeriodEnum

  @IsDateString()
  periodStart!: string

  @IsDateString()
  periodEnd!: string

  @IsNumber()
  @Min(0)
  targetValue!: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualValue?: number

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string

  @IsOptional()
  @IsString()
  channelId?: string

  @IsOptional()
  @IsString()
  campaignId?: string

  @IsOptional()
  @IsString()
  createdBy?: string
}

// ── KPI 更新 DTO ────────────────────────────────────────────────────────────

export class UpdateBrandKPIDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualValue?: number

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string
}

// ── KPI 查询 DTO ────────────────────────────────────────────────────────────

export class QueryBrandKPIDto {
  @IsOptional()
  @IsEnum(KpiCategoryEnum)
  category?: KpiCategoryEnum

  @IsOptional()
  @IsEnum(KpiPeriodEnum)
  period?: KpiPeriodEnum

  @IsOptional()
  @IsDateString()
  periodStart?: string

  @IsOptional()
  @IsDateString()
  periodEnd?: string

  @IsOptional()
  @IsString()
  channelId?: string

  @IsOptional()
  @IsString()
  campaignId?: string
}
