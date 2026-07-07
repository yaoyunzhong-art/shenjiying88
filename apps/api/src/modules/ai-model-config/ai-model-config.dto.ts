/**
 * AI 模型配置 - DTO (V9 需求 1)
 *
 * 用于 HTTP 入参校验 (class-validator)
 */

import {
  IsString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsBoolean,
  IsUrl,
  Min,
  Max,
  IsUUID,
  Length,
} from 'class-validator'
import { Type } from 'class-transformer'
import type {
  AiModelProvider,
  IndustryType,
  AiModelStoreConfig,
} from './ai-model-config.entity'

// ============ 门店配置 CRUD DTO ============

/** 创建门店配置 */
export class CreateAiModelStoreConfigDto {
  /** 门店 ID (V10 Day 2: 必填,用于 tenant ownership 校验) */
  @IsString()
  @Length(1, 64)
  storeId!: string

  @IsString()
  @Length(1, 100)
  configName!: string

  @IsEnum(['openai', 'anthropic', 'qwen', 'custom'])
  provider!: AiModelProvider

  @IsUrl({ require_tld: false })
  endpointUrl!: string

  @IsString()
  @Length(1, 1000)
  apiKey!: string

  @IsNumber()
  @Min(1024)
  @Max(128000)
  contextWindow!: number

  @IsNumber()
  @Min(0)
  @Max(2)
  @Type(() => Number)
  temperature!: number

  @IsNumber()
  @Min(1)
  @Max(32000)
  @Type(() => Number)
  maxTokens!: number

  @IsOptional()
  @IsObject()
  customHeaders?: Record<string, string>
}

/** 更新门店配置 */
export class UpdateAiModelStoreConfigDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  configName?: string

  @IsOptional()
  @IsUrl({ require_tld: false })
  endpointUrl?: string

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  apiKey?: string

  @IsOptional()
  @IsNumber()
  @Min(1024)
  @Max(128000)
  contextWindow?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  @Type(() => Number)
  temperature?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(32000)
  @Type(() => Number)
  maxTokens?: number

  @IsOptional()
  @IsObject()
  customHeaders?: Record<string, string>
}

// ============ 切换 DTO ============

/** 切换大模型 */
export class SwitchAiModelDto {
  @IsUUID()
  configId!: string

  @IsOptional()
  @IsString()
  @Length(1, 200)
  reason?: string
}

// ============ 回滚 DTO ============

/** 回滚到历史版本 */
export class RollbackAiModelDto {
  @IsUUID()
  historyId!: string

  @IsString()
  @Length(1, 200)
  reason!: string
}

// ============ 预设查询 DTO ============

/** 预设查询参数 */
export class QueryAiModelPresetDto {
  @IsOptional()
  @IsEnum(['openai', 'anthropic', 'qwen', 'custom'])
  provider?: AiModelProvider

  @IsOptional()
  @IsEnum(['general', 'arcade', 'family-entertainment', 'shopping-mall'])
  industry?: IndustryType

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean
}