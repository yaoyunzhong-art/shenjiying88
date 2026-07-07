/**
 * retrieval.types.ts · RAG 检索服务类型定义 (Phase-19 脚手架)
 *
 * 设计依据: docs/research/rag-architecture.md §3.3 / §3.4
 *
 * 本文件定义所有检索相关 DTO / 接口 / 类型别名。
 * 当前仅 skeleton 状态,Pulse-71 ~ Pulse-73 实现完整功能。
 *
 * 关键术语:
 *   - Query:    检索请求入参
 *   - Result:   单个检索命中项
 *   - RAGContext: 一次完整检索的封装 (含 code + knowledge)
 *   - ChunkPayload: 写入 Qdrant 的元数据 (file_path / line_range / phase ...)
 *   - Collection: Qdrant 中的向量集合名 (code_chunks / knowledge_docs)
 */

import type { RequestTenantContext } from '../tenant/tenant.types'

// ─── Collection 命名约定 ────────────────────────────────────────────────
//
// 与 rag-architecture.md §2 保持一致:
//   - code_chunks:    代码 chunk (~100K)
//   - knowledge_docs: 知识库 chunk (~300)
//   - rfc_history:    RFC 历史 (Phase-22 启用)
//
// 多租户隔离预留 (Phase-21): `tenant_{id}_code_chunks` 按需动态创建。

export type RetrievalCollection = 'code_chunks' | 'knowledge_docs' | 'rfc_history'

/** AST 抽取的 chunk 类型 (用于索引器分类) */
export type AstChunkType = 'file' | 'class' | 'method' | 'decorator_block' | 'interface_field_cluster' | 'markdown_section'

/** Chunk 写入 Qdrant 时携带的元数据 (idempotent by chunk_id hash) */
export interface ChunkPayload {
  /** 全局唯一 chunk id (hash(file_path + symbol_name + line_range)) */
  chunkId: string
  /** 源文件相对仓库根路径 */
  filePath: string
  /** 语言 (typescript / markdown / json ...) */
  language: string
  /** AST 类型 */
  astType: AstChunkType
  /** 符号名 (类名 / 方法名 / 文件名) */
  symbolName: string
  /** 行号范围 [start, end] (1-indexed, 含 end) */
  lineRange: [number, number]
  /** 所属 phase (如 phase-19) */
  phase: string
  /** 所属 pulse (如 pulse-68) */
  pulse: string
  /** git sha (增量索引用) */
  gitSha: string
  /** token 数 (近似) */
  tokens: number
  /** 是否对外公开 (export / public class) */
  isPublic: boolean
  /** 是否测试文件 */
  isTest: boolean
  /** chunk 文本内容 */
  content: string
}

/** 单条检索命中 (来自 Qdrant search response) */
export interface RetrievalResult {
  /** Qdrant point id */
  id: string
  /** 命中的 chunk payload (元数据 + content) */
  payload: ChunkPayload
  /** dense cosine 分数 (0~1) */
  score: number
  /** BM25 分数 (hybrid 模式下,可选) */
  sparseScore?: number
  /** metadata filter 命中加权 */
  metadataBoost?: number
  /** 综合分数 = α·dense + β·sparse + γ·metadata */
  finalScore: number
}

/** 检索请求入参 (REST /api/retrieval/query) */
export interface RetrievalQuery {
  /** 查询文本 (必填) */
  query: string
  /** 返回 top-K 条数 (默认 10) */
  topK?: number
  /** 相似度阈值 (0~1,低于此分数丢弃) */
  threshold?: number
  /** 限定 collection (默认 ['code_chunks']) */
  collections?: RetrievalCollection[]
  /** 按 phase 过滤 (如 ['phase-19', 'phase-16']) */
  phaseFilter?: string[]
  /** 按 path 前缀过滤 (如 'apps/api/src/modules/lyt') */
  pathPrefix?: string
  /** 是否启用 hybrid search (默认 true) */
  hybrid?: boolean
  /** 是否启用 rerank (Cohere / BGE) */
  rerank?: boolean
  /** 租户上下文 (Phase-21 多租户隔离用) */
  tenantContext?: RequestTenantContext
}

/** 检索响应 */
export interface RetrievalResponse {
  /** 命中条目 (按 finalScore 降序) */
  results: RetrievalResult[]
  /** 命中总数 */
  totalHits: number
  /** 实际查询耗时 (ms) */
  latencyMs: number
  /** 缓存命中 (true 表示从 Redis 返回) */
  cacheHit: boolean
  /** 使用的 collection */
  collections: RetrievalCollection[]
}

/**
 * RAG 完整上下文 (供 LLM prompt 拼装)
 *
 * 由 `RetrievalService.buildRAGContext` 返回,使用方:
 *   - ai-review.service.ts (代码评审 prompt)
 *   - rfc-drafter.service.ts (RFC 起草 prompt)
 *   - ai-lesson-applicator.service.ts (教训套用 prompt)
 */
export interface RAGContext {
  /** 代码片段 (默认 top 5) */
  codeContext: RetrievalResult[]
  /** 知识库片段 (默认 top 5) */
  knowledgeContext: RetrievalResult[]
  /** 整体耗时 (ms) */
  totalLatencyMs: number
  /** 触发的 pulse / phase 上下文 */
  trigger?: {
    phase: string
    pulse: string
    intent: 'review' | 'draft' | 'apply-lesson' | 'query'
  }
}

/** 索引器统计 (供 scripts/index-codebase.py 报告) */
export interface IndexerStats {
  /** 扫描文件数 */
  filesScanned: number
  /** 生成 chunk 数 */
  chunksGenerated: number
  /** 成功写入 Qdrant 数 */
  chunksWritten: number
  /** 失败数 */
  chunksFailed: number
  /** 总耗时 (ms) */
  totalLatencyMs: number
  /** 按 ast_type 分类统计 */
  byAstType: Record<AstChunkType, number>
  /** 按 phase 分类统计 */
  byPhase: Record<string, number>
  /** 是否 dry-run 模式 */
  dryRun: boolean
}

/** LLM Provider 枚举 (来自 llm-model-comparison.md) */
export type LlmProvider = 'claude' | 'openai' | 'deepseek' | 'local-bge'

/** Embedding Provider 枚举 (Phase-25 启用 local-bge) */
export type EmbeddingProvider = 'text-embedding-3-large' | 'text-embedding-3-small' | 'bge-large-zh-v1.5'

/**
 * retrieval 模块对外抛出的运行时异常类型
 * (便于 controller 转换为 HTTP code)
 */
export class RetrievalUnavailableError extends Error {
  constructor(public readonly reason: string) {
    super(`RAG retrieval unavailable: ${reason}`)
    this.name = 'RetrievalUnavailableError'
  }
}

export class EmbeddingQuotaExceededError extends Error {
  constructor(public readonly provider: EmbeddingProvider) {
    super(`Embedding quota exceeded for ${provider}`)
    this.name = 'EmbeddingQuotaExceededError'
  }
}