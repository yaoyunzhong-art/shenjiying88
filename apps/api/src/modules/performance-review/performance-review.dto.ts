import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'
import { ReviewPeriod, ReviewStatus, type OverallRating } from './performance-review.entity'

// ═══════════════════════════════════════════════════════════════════════
// Score DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreateScoreDto {
  @IsString()
  dimension!: string

  @IsInt()
  @Min(1)
  @Max(5)
  score!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  weight!: number

  @IsString()
  comment!: string
}

export class UpdateScoreDto {
  @IsString()
  @IsOptional()
  dimension?: string

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  score?: number

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  weight?: number

  @IsString()
  @IsOptional()
  comment?: string
}

// ═══════════════════════════════════════════════════════════════════════
// Review DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreatePerformanceReviewDto {
  @IsString()
  employeeId!: string

  @IsString()
  employeeName!: string

  @IsString()
  reviewer!: string

  @IsEnum(ReviewPeriod)
  period!: ReviewPeriod

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateScoreDto)
  scores!: CreateScoreDto[]

  @IsString()
  comments!: string
}

export class UpdateScoresDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateScoreDto)
  scores!: UpdateScoreDto[]

  @IsString()
  @IsOptional()
  comments?: string
}

export class UpdateReviewStatusDto {
  @IsEnum(ReviewStatus)
  status!: ReviewStatus
}

export class ReviewQueryDto {
  @IsEnum(ReviewPeriod)
  @IsOptional()
  period?: ReviewPeriod

  @IsEnum(ReviewStatus)
  @IsOptional()
  status?: ReviewStatus

  @IsString()
  @IsOptional()
  employeeId?: string
}
