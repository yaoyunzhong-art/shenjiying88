import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

// ─── Content Type ──────────────────────────────────────────────

export enum ContentTypeEnum {
  TEXT = 'text',
  IMAGE_DESCRIPTION = 'image_description',
}

// ─── AI Content Generate ──────────────────────────────────────────────

export class AiContentGenerateDto {
  @IsString()
  @IsNotEmpty()
  eventId!: string

  @IsOptional()
  @IsEnum(['general', 'detailed', 'brief'])
  template?: 'general' | 'detailed' | 'brief'
}

// ─── Content Moderation ────────────────────────────────────────

export class ContentModerationDto {
  @IsString()
  @IsNotEmpty()
  content!: string

  @IsOptional()
  @IsEnum(ContentTypeEnum)
  type?: ContentTypeEnum
}

// ─── Video Deduplication ───────────────────────────────────────

export class VideoDeduplicationDto {
  @IsString()
  @IsNotEmpty()
  videoId!: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetVideoIds?: string[]
}

// ─── Progress Analysis ─────────────────────────────────────────

export class ProgressAnalysisDto {
  @IsString()
  @IsNotEmpty()
  memberId!: string

  @IsString()
  @IsNotEmpty()
  metric!: string

  @IsString()
  @IsNotEmpty()
  beforePeriod!: string

  @IsString()
  @IsNotEmpty()
  afterPeriod!: string
}

// ─── Batch Moderation Item ─────────────────────────────────────

export class BatchModerationItemDto {
  @IsString()
  @IsNotEmpty()
  id!: string

  @IsString()
  @IsNotEmpty()
  content!: string

  @IsEnum(ContentTypeEnum)
  type!: ContentTypeEnum
}

// ─── Batch Moderation ─────────────────────────────────────────

export class BatchModerationDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BatchModerationItemDto)
  items!: BatchModerationItemDto[]
}

// ─── Add Highlights ────────────────────────────────────────────

export class AddHighlightsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  highlights!: string[]
}

// ─── Share Report ──────────────────────────────────────────────

export class ShareReportDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  recipients!: string[]
}

// ─── Record Metric ─────────────────────────────────────────────

export class RecordMetricDto {
  @IsString()
  @IsNotEmpty()
  memberId!: string

  @IsString()
  @IsNotEmpty()
  period!: string

  @IsString()
  @IsNotEmpty()
  metric!: string

  @IsNumber()
  @Min(0)
  value!: number
}

// ─── Review Action ─────────────────────────────────────────────

export class ReviewActionDto {
  @IsEnum(['approve', 'reject'])
  action!: 'approve' | 'reject'
}
