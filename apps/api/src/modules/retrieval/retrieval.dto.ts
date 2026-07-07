/**
 * retrieval.dto.ts · RAG 检索模块请求/响应 DTO (class-validator 校验)
 *
 * 设计依据: docs/research/rag-architecture.md §3.3
 *
 * 与 retrieval.types.ts 中 interface 的区别:
 *   - types:   内部传递,跨 service 调用用 (无运行时校验)
 *   - dto:     controller 入参/出参,class-validator 校验,swagger 文档
 */

import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsNotEmpty,
  ArrayMaxSize,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

/** 合法 collection 值 (用于 IsIn 校验) */
const VALID_COLLECTIONS = ['code_chunks', 'knowledge_docs', 'rfc_history'] as const

/**
 * 检索请求 DTO
 * POST /api/retrieval/query
 */
export class RetrievalQueryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  query!: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  topK?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  threshold?: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  collections?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  phaseFilter?: string[]

  @IsOptional()
  @IsString()
  @MaxLength(500)
  pathPrefix?: string

  @IsOptional()
  @IsBoolean()
  hybrid?: boolean

  @IsOptional()
  @IsBoolean()
  rerank?: boolean
}

/**
 * 索引请求 DTO
 * POST /api/retrieval/index
 */
export class ChunkPayloadDto {
  @IsString()
  @IsNotEmpty()
  chunkId!: string

  @IsString()
  @IsNotEmpty()
  filePath!: string

  @IsString()
  @IsNotEmpty()
  language!: string

  @IsString()
  @IsNotEmpty()
  astType!: string

  @IsString()
  @IsNotEmpty()
  symbolName!: string

  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  lineRange!: [number, number]

  @IsString()
  @IsNotEmpty()
  phase!: string

  @IsString()
  @IsNotEmpty()
  pulse!: string

  @IsString()
  @IsNotEmpty()
  gitSha!: string

  @IsNumber()
  @Min(0)
  tokens!: number

  @IsBoolean()
  isPublic!: boolean

  @IsBoolean()
  isTest!: boolean

  @IsString()
  @IsNotEmpty()
  content!: string
}

export class IndexChunksRequestDto {
  @IsString()
  @IsNotEmpty()
  collection!: string

  @ValidateNested({ each: true })
  @Type(() => ChunkPayloadDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  chunks!: ChunkPayloadDto[]
}

/**
 * 健康检查响应 DTO
 */
export class RetrievalHealthDto {
  status!: 'ok' | 'degraded' | 'unavailable'
  qdrant!: 'ok' | 'degraded' | 'unavailable'
  embedder!: 'ok' | 'degraded' | 'unavailable'
  lastIndexAt: string | null = null
  uptime!: number
  version!: string
}

/**
 * RAG 上下文构建请求 DTO
 * POST /api/retrieval/rag-context
 */
export class RAGContextRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  query!: string

  @IsOptional()
  @IsString()
  phase?: string

  @IsOptional()
  @IsString()
  pulse?: string

  @IsOptional()
  @IsString()
  intent?: string
}

/**
 * 查询统计 DTO (用于监控面板)
 */
export class RetrievalStatsDto {
  totalQueries!: number
  cacheHitRate!: number
  avgLatencyMs!: number
  p95LatencyMs!: number
  p99LatencyMs!: number
  topQueries!: Array<{ query: string; count: number }>
}
