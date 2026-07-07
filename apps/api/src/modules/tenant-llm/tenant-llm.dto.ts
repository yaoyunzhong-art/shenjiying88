/**
 * Phase-35: 智能体接入模块 - DTO 定义
 *
 * 为 LLM 配置管理提供完整的请求/响应校验 DTO 类。
 */

import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  Min,
  Max,
  MaxLength,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

// ─── LLM 服务提供商 ────────────────────────────────────────────

export enum LlmProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  DEEPSEEK = 'deepseek',
  QWEN = 'qwen',
  MOONSHOT = 'moonshot',
  MINIMAX = 'minimax',
  CUSTOM = 'custom',
}

// ─── LLM 配置状态 ──────────────────────────────────────────────

export enum LlmConfigStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

// ─── 创建配置 DTO ──────────────────────────────────────────────

export class CreateLlmConfigDto {
  @ApiProperty({ description: '配置名称', example: '生产环境 DeepSeek' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string

  @ApiProperty({ description: 'LLM 提供商', enum: LlmProvider, example: LlmProvider.DEEPSEEK })
  @IsEnum(LlmProvider)
  provider!: LlmProvider

  @ApiProperty({ description: '模型名称', example: 'deepseek-chat' })
  @IsString()
  @IsNotEmpty()
  modelName!: string

  @ApiPropertyOptional({ description: '自定义 API 端点', example: 'https://api.deepseek.com/v1' })
  @IsString()
  @IsOptional()
  apiEndpoint?: string

  @ApiProperty({ description: 'API Key' })
  @IsString()
  @IsNotEmpty()
  apiKey!: string

  @ApiPropertyOptional({ description: '温度 (0-2)', default: 0.7, example: 0.7 })
  @IsNumber()
  @Min(0)
  @Max(2)
  @IsOptional()
  @Type(() => Number)
  temperature?: number

  @ApiPropertyOptional({ description: '最大 Token 数', default: 4096, example: 4096 })
  @IsNumber()
  @Min(1)
  @Max(128000)
  @IsOptional()
  @Type(() => Number)
  maxTokens?: number

  @ApiPropertyOptional({ description: 'Top-P (0-1)', example: 0.9 })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  @Type(() => Number)
  topP?: number

  @ApiPropertyOptional({ description: '配额上限', example: 100000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  quotaLimit?: number

  @ApiPropertyOptional({ description: '配额告警阈值 (0-1)', default: 0.8, example: 0.8 })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  @Type(() => Number)
  quotaAlertThreshold?: number

  @ApiPropertyOptional({ description: '站点 ID' })
  @IsString()
  @IsOptional()
  siteId?: string

  @ApiPropertyOptional({ description: '门店 ID' })
  @IsString()
  @IsOptional()
  storeId?: string
}

// ─── 更新配置 DTO ──────────────────────────────────────────────

export class UpdateLlmConfigDto {
  @ApiPropertyOptional({ description: '配置名称' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: 'LLM 提供商', enum: LlmProvider })
  @IsEnum(LlmProvider)
  @IsOptional()
  provider?: LlmProvider

  @ApiPropertyOptional({ description: '模型名称' })
  @IsString()
  @IsOptional()
  modelName?: string

  @ApiPropertyOptional({ description: '自定义 API 端点' })
  @IsString()
  @IsOptional()
  apiEndpoint?: string

  @ApiPropertyOptional({ description: 'API Key' })
  @IsString()
  @IsOptional()
  apiKey?: string

  @ApiPropertyOptional({ description: '温度 (0-2)' })
  @IsNumber()
  @Min(0)
  @Max(2)
  @IsOptional()
  @Type(() => Number)
  temperature?: number

  @ApiPropertyOptional({ description: '最大 Token 数' })
  @IsNumber()
  @Min(1)
  @Max(128000)
  @IsOptional()
  @Type(() => Number)
  maxTokens?: number

  @ApiPropertyOptional({ description: 'Top-P (0-1)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  @Type(() => Number)
  topP?: number

  @ApiPropertyOptional({ description: '配额上限' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  quotaLimit?: number

  @ApiPropertyOptional({ description: '配额告警阈值 (0-1)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  @Type(() => Number)
  quotaAlertThreshold?: number

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean
}

// ─── 接入申请 DTO ──────────────────────────────────────────────

export class ApplyLlmConfigDto {
  @ApiProperty({ description: 'LLM 配置 ID' })
  @IsString()
  @IsNotEmpty()
  configId!: string

  @ApiProperty({ description: '使用场景说明', example: '智能客服对话' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  useCase!: string

  @ApiProperty({ description: '预期日均调用量', example: 1000 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  expectedVolume!: number

  @ApiPropertyOptional({ description: '业务理由' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  businessJustification?: string
}

// ─── 审批 DTO ──────────────────────────────────────────────────

export class ApproveLlmConfigDto {
  @ApiProperty({ description: '是否审批通过' })
  @IsBoolean()
  approved!: boolean

  @ApiProperty({ description: '审批人' })
  @IsString()
  @IsNotEmpty()
  approvedBy!: string
}

// ─── LLM 查询 DTO ──────────────────────────────────────────────

export class LlmConfigQueryDto {
  @ApiPropertyOptional({ description: '站点 ID' })
  @IsString()
  @IsOptional()
  siteId?: string

  @ApiPropertyOptional({ description: '配置 ID 过滤' })
  @IsString()
  @IsOptional()
  configId?: string

  @ApiPropertyOptional({ description: '统计/日志起始时间', example: '2025-01-01T00:00:00Z' })
  @IsString()
  @IsOptional()
  periodStart?: string

  @ApiPropertyOptional({ description: '统计/日志结束时间', example: '2025-12-31T23:59:59Z' })
  @IsString()
  @IsOptional()
  periodEnd?: string
}

// ─── 调用统计响应 DTO ──────────────────────────────────────────

export class LlmStatsResponseDto {
  @ApiProperty({ description: '总调用次数' })
  totalCalls!: number

  @ApiProperty({ description: '成功调用次数' })
  successCalls!: number

  @ApiProperty({ description: '失败调用次数' })
  failedCalls!: number

  @ApiProperty({ description: '总提示 Token 数' })
  totalPromptTokens!: number

  @ApiProperty({ description: '总补全 Token 数' })
  totalCompletionTokens!: number

  @ApiProperty({ description: '总 Token 数' })
  totalTokens!: number

  @ApiProperty({ description: '总费用' })
  totalCost!: number

  @ApiProperty({ description: '货币' })
  currency!: string

  @ApiProperty({ description: '平均延迟 (ms)' })
  avgLatencyMs!: number

  @ApiProperty({ description: '起始时间' })
  periodStart!: string

  @ApiProperty({ description: '结束时间' })
  periodEnd!: string
}
