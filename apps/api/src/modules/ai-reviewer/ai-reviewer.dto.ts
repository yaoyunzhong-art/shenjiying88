import {
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  Min,
  Max,
  ValidateNested,
  IsEnum,
  ArrayMinSize,
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'
import type { ReviewSeverity } from './ai-reviewer.entity'

/**
 * 单文件审查请求
 */
export class ReviewFileDto {
  @IsString()
  @IsNotEmpty()
  path!: string

  @IsString()
  @IsNotEmpty()
  content!: string
}

/**
 * 审查请求 DTO
 */
export class ReviewRequestDto {
  @ValidateNested({ each: true })
  @Type(() => ReviewFileDto)
  @ArrayMinSize(1)
  files!: ReviewFileDto[]

  @IsOptional()
  @IsString()
  projectPath?: string

  @IsOptional()
  @IsString()
  triggeredBy?: string
}

/**
 * 注册自定义规则请求
 */
export class RegisterRuleDto {
  @IsString()
  @IsNotEmpty()
  ruleId!: string

  @IsString()
  @IsNotEmpty()
  ruleName!: string

  @IsString()
  @IsNotEmpty()
  description!: string

  @IsString()
  @IsEnum(['info', 'warn', 'error'])
  severity!: ReviewSeverity

  @IsString()
  @IsNotEmpty()
  pattern!: string

  @IsString()
  @IsNotEmpty()
  reference!: string
}

/**
 * 审查配置 DTO
 */
export class ReviewConfigDto {
  @IsString()
  @IsNotEmpty()
  id!: string

  @IsString()
  @IsNotEmpty()
  name!: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enabledRules?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ignorePatterns?: string[]

  @IsOptional()
  @IsBoolean()
  ciMode?: boolean

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxFiles?: number

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(50000)
  maxLinesPerFile?: number

  @IsString()
  @IsNotEmpty()
  tenantId!: string
}

/**
 * 审查响应
 */
export interface ReviewResponse {
  sessionId: string
  totalFiles: number
  totalFindings: number
  summary: Record<ReviewSeverity, number>
  verdict: { pass: boolean; errorCount: number; warnCount: number }
  findings: Array<{
    file: string
    line?: number
    ruleId: string
    ruleName: string
    severity: ReviewSeverity
    snippet: string
    message: string
  }>
  createdAt: string
}
