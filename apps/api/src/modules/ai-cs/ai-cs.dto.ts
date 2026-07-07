import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from 'class-validator'
import { Type } from 'class-transformer'
import type {
  ConversationChannel,
  HandoffReason,
  ProviderType
} from './ai-cs.entity'

// ── 发送消息 ──

export class SendMessageOptionsDto {
  @IsOptional()
  @IsBoolean()
  forceHandoff?: boolean

  @IsOptional()
  @IsString()
  @IsIn(['openai', 'deepseek', 'mock', 'fallback'])
  preferredProvider?: ProviderType

  @IsOptional()
  @IsString()
  language?: string

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>
}

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  tenantId!: string

  @IsOptional()
  @IsString()
  conversationId?: string

  @IsOptional()
  @IsString()
  memberId?: string

  @IsString()
  @IsIn(['web', 'mobile', 'wechat', 'email', 'phone'])
  channel!: ConversationChannel

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string

  @IsOptional()
  @ValidateNested()
  @Type(() => SendMessageOptionsDto)
  options?: SendMessageOptionsDto
}

// ── 转人工 ──

export class HandoffDto {
  @IsString()
  @MinLength(1)
  tenantId!: string

  @IsString()
  @MinLength(1)
  conversationId!: string

  @IsString()
  @IsIn(['low-confidence', 'user-request', 'complex-query', 'sentiment-negative'])
  reason!: HandoffReason

  @IsOptional()
  @IsString()
  agentId?: string

  @IsOptional()
  @IsString()
  @IsIn(['low', 'medium', 'high', 'urgent'])
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

// ── 知识库 ──

export class KnowledgeMetadataDto {
  @IsOptional()
  @IsString()
  source?: string

  @IsOptional()
  @IsString()
  author?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  viewCount?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  helpfulCount?: number

  @IsOptional()
  @IsString()
  lastReviewedAt?: string
}

export class AddKnowledgeDto {
  @IsString()
  @MinLength(1)
  tenantId!: string

  @IsString()
  @MinLength(1)
  category!: string

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @ValidateNested()
  @Type(() => KnowledgeMetadataDto)
  metadata?: KnowledgeMetadataDto
}

// ── 知识库搜索 ──

export class SearchKnowledgeDto {
  @IsString()
  @MinLength(1)
  tenantId!: string

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  q!: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  topK?: number
}

// ── 会话列表 ──

export class ListSessionsDto {
  @IsString()
  @MinLength(1)
  tenantId!: string

  @IsOptional()
  @IsString()
  memberId?: string
}

// ── 会话详情 ──

export class GetSessionDto {
  @IsString()
  @MinLength(1)
  tenantId!: string

  @IsString()
  @MinLength(1)
  id!: string
}
