/**
 * ai-review.dto.ts · AI Code Review DTO (Phase-19)
 *
 * 包含请求/响应的 DTO 类,附加 class-validator 装饰器。
 */

import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNotEmpty,
  Min,
  Max,
  ValidateNested,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

// ─── 枚举值 ────────────────────────────────────────────────────────────

const CODE_LANGUAGES = [
  'typescript', 'javascript', 'python', 'go', 'rust', 'java', 'kotlin',
  'swift', 'ruby', 'php', 'csharp', 'cpp', 'c', 'sql', 'yaml', 'json',
  'markdown', 'dockerfile', 'shell',
] as const

const REPO_TYPES = ['github', 'gitlab', 'bitbucket', 'local'] as const
const REVIEW_CATEGORIES = [
  'security', 'performance', 'correctness', 'maintainability',
  'style', 'test', 'documentation', 'best_practice', 'dependency', 'architecture',
] as const
const REVIEW_SEVERITIES = ['critical', 'major', 'minor', 'suggestion'] as const
const FILE_STATUSES = ['added', 'modified', 'deleted', 'renamed'] as const

// ─── 子 DTO ────────────────────────────────────────────────────────────

/**
 * 评审文件 DTO
 */
export class ReviewFileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  filePath!: string

  @IsString()
  @IsEnum(CODE_LANGUAGES)
  language!: string

  @IsString()
  @IsNotEmpty()
  diff!: string

  @IsNumber()
  @Min(0)
  @Max(99999)
  additions!: number

  @IsNumber()
  @Min(0)
  @Max(99999)
  deletions!: number

  @IsString()
  @IsEnum(FILE_STATUSES)
  status!: 'added' | 'modified' | 'deleted' | 'renamed'
}

// ─── 请求 DTO ──────────────────────────────────────────────────────────

/**
 * 提交 PR 评审请求 DTO
 */
export class SubmitReviewDto {
  @IsString()
  @IsEnum(REPO_TYPES)
  repositoryType!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  repository!: string

  @IsNumber()
  @Min(1)
  @Max(999999)
  @Type(() => Number)
  pullRequestId!: number

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  title!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  description!: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewFileDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  files!: ReviewFileDto[]

  @IsString()
  @IsNotEmpty()
  author!: string

  @IsOptional()
  @IsBoolean()
  force?: boolean

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsEnum(REVIEW_CATEGORIES, { each: true })
  @ArrayMaxSize(10)
  categories?: string[]
}

/**
 * 查询评审结果 DTO
 */
export class GetReviewResultDto {
  @IsString()
  @IsNotEmpty()
  reviewId!: string
}

/**
 * 触发条件 DTO
 */
export class TriggerOnDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  labels?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  branches?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  filePatterns?: string[]
}

// ─── 配置 DTO ──────────────────────────────────────────────────────────

/**
 * 创建/更新评审配置 DTO
 */
export class CreateReviewConfigDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string

  @IsString()
  @IsNotEmpty()
  repository!: string

  @IsBoolean()
  enabled!: boolean

  @IsOptional()
  @ValidateNested()
  @Type(() => TriggerOnDto)
  triggerOn?: TriggerOnDto

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  ignorePatterns?: string[]

  @IsOptional()
  @IsString()
  @IsEnum(REVIEW_SEVERITIES)
  minSeverity?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsEnum(REVIEW_CATEGORIES, { each: true })
  @ArrayMaxSize(10)
  categories?: string[]
}

// ─── 查询 DTO ──────────────────────────────────────────────────────────

/**
 * 评审历史查询 DTO
 */
export class ReviewHistoryQueryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  repository?: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(999999)
  @Type(() => Number)
  pullRequestId?: number

  @IsOptional()
  @IsString()
  @IsEnum(['pending', 'in_progress', 'completed', 'failed'])
  status?: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number
}

/**
 * 评审摘要查询 DTO
 */
export class ReviewSummaryQueryDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string

  @IsOptional()
  @IsString()
  repository?: string

  @IsString()
  @IsNotEmpty()
  periodStart!: string

  @IsString()
  @IsNotEmpty()
  periodEnd!: string
}

/**
 * 健康检查响应 DTO
 */
export class HealthCheckResponseDto {
  ok!: boolean
  defaultProvider!: string
  budgetUtilization!: number
  cacheEnabled!: boolean
}

/**
 * 评审响应 DTO
 */
export class ReviewResponseDto {
  id!: string
  overallScore!: number
  issues!: Array<{
    id: string
    category: string
    severity: string
    message: string
    filePath: string
    lineStart?: number
    lineEnd?: number
    suggestion?: string
  }>
  strengths!: string[]
  summary!: string
  needsApproverReview!: boolean
  latencyMs!: number
  cacheHit!: boolean
  status!: string
  completedAt!: string
}
