/**
 * ai-rag.entity.ts - RAG 知识库实体定义
 */

/** 文档集合类型 */
export enum CollectionType {
  PRODUCTS = 'products',
  FAQ = 'faq',
  SUPPORT = 'support',
  TRAINING = 'training',
  POLICIES = 'policies',
}

/** 文档分块 */
export interface DocumentChunk {
  id: string
  content: string
  metadata: Record<string, unknown>
}

/** 存储文档 */
export interface StoredDocument {
  id: string
  collection: CollectionType | string
  title?: string
  chunks: DocumentChunk[]
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

/** 检索结果 */
export interface RetrievedChunk {
  chunk: DocumentChunk
  score: number
}

/** RAG 查询结果 */
export interface RagQueryResult {
  answer: string
  sources: string[]
  retrievedChunks: number
  latencyMs: number
}

/** 对话消息 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/** 话术语气类型 */
export type ToneType = 'professional' | 'friendly' | 'urgent'

/** 异议类型 */
export type ObjectionType = 'price' | 'quality' | 'competitor' | 'timing'

/** 话术生成选项 */
export interface ScriptGenerationOptions {
  tone?: ToneType
  locale?: string
}

/** 集合统计 */
export interface CollectionStats {
  documentCount: number
  chunkCount: number
}

/** RAG 管道统计 */
export interface RagPipelineStats {
  totalQueries: number
  totalRetrievals: number
  avgLatencyMs: number
}
