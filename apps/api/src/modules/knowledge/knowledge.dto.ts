/**
 * knowledge.dto.ts — 知识库 DTO
 */

import type { KnowledgeKind, DocumentChunk } from './knowledge.entity'

/** 索引文档请求 */
export interface IndexDocumentDto {
  sourcePath: string
  content: string
  kind: DocumentChunk['metadata']['kind']
  tags?: string[]
}

/** 查询请求 */
export interface QueryKnowledgeDto {
  query: string
  topK?: number
  kindFilter?: string
  minScore?: number
}

/** 查询响应 DTO */
export interface QueryKnowledgeResponseDto {
  query: string
  results: {
    id: string
    sourcePath: string
    content: string
    score: number
    kind?: string
    section?: string
  }[]
  totalCandidates: number
  durationMs: number
}

/** 统计响应 DTO */
export interface KnowledgeStatsDto {
  totalDocuments: number
  totalChunks: number
  averageChunkSize: number
  byKind: Record<string, number>
}

/** 知识文档 DTO */
export interface KnowledgeDocumentDto {
  id: string
  sourcePath: string
  title: string
  kind: KnowledgeKind
  tags: string[]
  chunkCount: number
  createdAt: string
}

/** 补全建议请求 */
export interface KnowledgeCompletionDto {
  query: string
  maxSuggestions?: number
}

/** 补全建议条目 */
export interface KnowledgeSuggestionDto {
  sourcePath: string
  title: string
  snippet: string
  score: number
}
