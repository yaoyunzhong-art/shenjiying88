/**
 * retrieval.entity.ts · RAG 检索模块数据实体定义
 *
 * 定义检索相关的持久化 / 业务实体:
 *   - RetrievalIndexRecord:  索引记录 (记录每个文件/ chunk 的索引状态)
 *   - RetrievalCacheEntry:   检索缓存条目 (可持久化到 Redis / DB)
 *   - RetrievalQueryLog:     查询日志 (用于审计 + 调优)
 *
 * 这些实体在 Pulse-71 ~ Pulse-73 中配合 Qdrant + Redis 使用。
 */

import type { RetrievalCollection, AstChunkType } from './retrieval.types'

/**
 * 索引记录实体
 * 记录每个 chunk 的索引状态,用于增量索引 / 重索引判断。
 * 可存储在本地 SQLite / PostgreSQL 中。
 */
export interface RetrievalIndexRecord {
  /** 全局唯一 chunk hash */
  chunkId: string
  /** 源文件路径 (相对仓库根) */
  filePath: string
  /** 语言 */
  language: string
  /** AST 类型 */
  astType: AstChunkType
  /** 符号名 */
  symbolName: string
  /** 行号范围 [start, end] */
  lineRange: [number, number]
  /** 所属 Qdrant collection */
  collection: RetrievalCollection
  /** 索引时的 git sha */
  gitSha: string
  /** 向量维度 (用于一致性校验) */
  vectorDimension: number
  /** token 数 */
  tokens: number
  /** 索引时间 */
  indexedAt: string
  /** 是否生效 (false 表示已删除/待清理) */
  active: boolean
}

/**
 * 检索缓存条目
 * 持久化缓存 (Redis / DB),支持 TTL 失效。
 */
export interface RetrievalCacheEntry {
  /** 缓存 key (query hash + params hash) */
  cacheKey: string
  /** 查询文本 */
  query: string
  /** 命中的 chunk IDs (按序) */
  resultChunkIds: string[]
  /** 缓存命中次数 */
  hitCount: number
  /** 创建时间 */
  createdAt: string
  /** 过期时间 */
  expiresAt: string
  /** TTL 秒数 */
  ttlSeconds: number
}

/**
 * 检索查询日志
 * 用于审计、调优、评估检索质量。
 */
export interface RetrievalQueryLog {
  /** 日志唯一 ID */
  id: string
  /** 查询文本 (脱敏后) */
  query: string
  /** 使用的 collections */
  collections: RetrievalCollection[]
  /** topK 参数 */
  topK: number
  /** 是否命中缓存 */
  cacheHit: boolean
  /** 命中的 chunk IDs (按序) */
  hitChunkIds: string[]
  /** 最高 finalScore */
  maxScore: number
  /** 平均 finalScore */
  avgScore: number
  /** 实际耗时 (ms) */
  latencyMs: number
  /** 触发来源: review | draft | query */
  source: string
  /** 请求时间 */
  requestedAt: string
  /** 租户 ID */
  tenantId: string
}
