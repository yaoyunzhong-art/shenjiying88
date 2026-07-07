/**
 * ai-rag.dto.ts - RAG 知识库请求/响应 DTO
 */

import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsArray,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { CollectionType, ToneType } from './ai-rag.entity'

// ─── 创建文档 DTO ───────────────────────────────────────────

export class CreateDocumentDto {
  @IsString()
  @IsOptional()
  id?: string

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content!: string

  @IsString()
  @IsOptional()
  title?: string

  @IsEnum(CollectionType)
  collection!: CollectionType

  @IsOptional()
  metadata?: Record<string, unknown>
}

// ─── 更新文档 DTO ───────────────────────────────────────────

export class UpdateDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content!: string

  @IsString()
  @IsOptional()
  title?: string

  @IsOptional()
  metadata?: Record<string, unknown>
}

// ─── RAG 查询 DTO ───────────────────────────────────────────

export class RagQueryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  question!: string

  @IsEnum(CollectionType)
  collection!: CollectionType

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(20)
  topK?: number
}

// ─── RAG 对话 DTO ───────────────────────────────────────────

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['user', 'assistant', 'system'])
  role!: 'user' | 'assistant' | 'system'

  @IsString()
  @IsNotEmpty()
  content!: string
}

export class ChatDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[]

  @IsString()
  @IsNotEmpty()
  collection!: CollectionType
}

// ─── 话术生成 DTO ───────────────────────────────────────────

export class GenerateProductScriptDto {
  @IsString()
  @IsNotEmpty()
  productId!: string

  @IsOptional()
  @IsEnum(['professional', 'friendly', 'urgent'])
  tone?: ToneType
}

export class GenerateObjectionScriptDto {
  @IsString()
  @IsNotEmpty()
  productId!: string

  @IsString()
  @IsNotEmpty()
  @IsEnum(['price', 'quality', 'competitor', 'timing'])
  objectionType!: string
}

export class GenerateFollowUpDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string
}

export class LocalizeScriptDto {
  @IsString()
  @IsNotEmpty()
  script!: string

  @IsString()
  @IsNotEmpty()
  locale!: string
}

// ─── 响应 DTO ───────────────────────────────────────────────

export class ApiResponseDto<T = unknown> {
  success!: boolean
  data?: T
  message?: string
}

export class DocumentListResponseDto {
  documents!: import('./ai-rag.entity').StoredDocument[]
  total!: number
}
