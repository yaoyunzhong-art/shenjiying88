/**
 * knowledge.entity.ts — 知识库实体类型
 *
 * 包含: DocumentChunk / EmbeddedChunk / QueryResult / QueryResponse / IndexerStats
 * 与 knowledge-indexer.service.ts 定义一致,此处做 entity 层导出
 */

/** 文档分块 */
export interface DocumentChunk {
  id: string
  sourcePath: string
  chunkIndex: number
  content: string
  tokenCount: number
  metadata: {
    title?: string
    section?: string
    tags?: string[]
    kind?: 'spec' | 'lesson' | 'pattern' | 'decision' | 'anti-pattern' | 'doc'
  }
  createdAt: string
}

/** 嵌入后的文档分块 */
export interface EmbeddedChunk extends DocumentChunk {
  embedding: number[]
  embeddingDim: number
}

/** 单条查询结果 */
export interface QueryResult {
  chunk: EmbeddedChunk
  score: number
  highlight?: string
}

/** 查询响应 */
export interface QueryResponse {
  query: string
  results: QueryResult[]
  totalCandidates: number
  durationMs: number
}

/** 索引统计 */
export interface IndexerStats {
  totalDocuments: number
  totalChunks: number
  averageChunkSize: number
  byKind: Record<string, number>
  indexBuildDurationMs: number
}

/** 知识文档实体 (持久化) */
export interface KnowledgeDocument {
  id: string
  sourcePath: string
  title: string
  kind: DocumentChunk['metadata']['kind']
  tags: string[]
  content: string
  chunkCount: number
  createdAt: string
  updatedAt: string
}

/** 知识分类标签 */
export type KnowledgeKind = NonNullable<DocumentChunk['metadata']['kind']>
export const KNOWLEDGE_KINDS: KnowledgeKind[] = [
  'spec',
  'lesson',
  'pattern',
  'decision',
  'anti-pattern',
  'doc',
]
