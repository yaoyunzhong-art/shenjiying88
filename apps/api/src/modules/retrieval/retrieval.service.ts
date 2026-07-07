/**
 * retrieval.service.ts · RAG 检索服务主入口 (Phase-19 脚手架)
 *
 * 设计依据:
 *   - docs/research/rag-architecture.md §5 (检索服务设计)
 *   - docs/research/intelligence-engine.md §4.1 (AI Code Reviewer)
 *
 * 本脚手架仅定义类骨架与接口签名,具体实现待 Pulse-71 ~ Pulse-73。
 *
 * 核心流程 (完整版):
 *   1. 缓存查询 (Redis) → 命中即返回
 *   2. Query embedding → queryVec
 *   3. Hybrid search (Qdrant) → topK=20 candidates
 *   4. Rerank (可选,Cohere / BGE) → topK=5 final
 *   5. 缓存 1 小时
 *   6. 返回 RetrievalResponse
 *
 * ⚠️  鉴权 (任务 4):
 *   - 仅 main agent 内部调用 (通过 guard `RetrievalInternalGuard` 限制)
 *   - 不对外暴露 (Controller 加 @RequireRoles('INTERNAL_AGENT'))
 */

import { Inject, Injectable, Logger, Optional } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { retrievalConfig } from './config/retrieval.config'
import { CACHE_SERVICE, type CacheService } from '../../infrastructure/cache/cache.module'
import { QdrantClientWrapper } from './retrieval.client'
import { EmbeddingService } from './retrieval.embedder'
import type {
  RAGContext,
  RetrievalCollection,
  RetrievalQuery,
  RetrievalResponse,
  RetrievalResult,
} from './retrieval.types'

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name)

  /** 最近一次成功索引时间戳 (用于 health endpoint) */
  private lastIndexAt: string | null = null

  constructor(
    @Inject(retrievalConfig.KEY) private readonly cfg: ConfigType<typeof retrievalConfig>,
    private readonly qdrant: QdrantClientWrapper,
    private readonly embedder: EmbeddingService,
    @Optional() @Inject(CACHE_SERVICE) private readonly cache?: CacheService
  ) {
    this.logger.log('RetrievalService initialized (Phase-19 skeleton)')
  }

  /**
   * 主入口: 代码片段检索
   * 供 ai-review.service.ts / rfc-drafter.service.ts 调用
   */
  async retrieveCode(query: RetrievalQuery): Promise<RetrievalResponse> {
    // TODO[Pulse-71]: 完整流程
    //   1. const cacheKey = this.buildCacheKey('code', query)
    //   2. const cached = await this.cache?.get<RetrievalResponse>(cacheKey)
    //   3. if (cached) return { ...cached, cacheHit: true }
    //   4. const queryVec = await this.embedder.embed(query.query)
    //   5. const candidates = query.hybrid
    //       ? await this.qdrant.hybridSearch('code_chunks', queryVec, sparseVec, { ... })
    //       : await this.qdrant.search('code_chunks', queryVec, { ... })
    //   6. const reranked = query.rerank
    //       ? await this.rerank(query.query, candidates, this.cfg.retrieval.rerankTopK)
    //       : candidates.slice(0, this.cfg.retrieval.rerankTopK)
    //   7. const response: RetrievalResponse = { ... }
    //   8. await this.cache?.set(cacheKey, response, this.cfg.cache.ttlSeconds)
    //   9. return response

    this.logger.warn('[RetrievalService.retrieveCode] not implemented — Pulse-71 skeleton')
    return {
      results: [],
      totalHits: 0,
      latencyMs: 0,
      cacheHit: false,
      collections: ['code_chunks'],
    }
  }

  /**
   * 知识库检索 (lessons-learned / patterns / decision-records)
   * 供 ai-review / lesson-applicator 调用
   */
  async retrieveKnowledge(query: RetrievalQuery): Promise<RetrievalResponse> {
    // TODO[Pulse-71]: 类似 retrieveCode 但 collection = 'knowledge_docs'
    return {
      results: [],
      totalHits: 0,
      latencyMs: 0,
      cacheHit: false,
      collections: ['knowledge_docs'],
    }
  }

  /**
   * 一次调用返回 code + knowledge 两套上下文
   * 供 ai-review.service.ts 拼装 prompt
   */
  async buildRAGContext(query: string, trigger?: RAGContext['trigger']): Promise<RAGContext> {
    // TODO[Pulse-71]:
    //   const [codeRes, knowledgeRes] = await Promise.all([
    //     this.retrieveCode({ query, topK: 20 }),
    //     this.retrieveKnowledge({ query, topK: 10 }),
    //   ])
    //   return {
    //     codeContext: codeRes.results.slice(0, 5),
    //     knowledgeContext: knowledgeRes.results.slice(0, 5),
    //     totalLatencyMs: codeRes.latencyMs + knowledgeRes.latencyMs,
    //     trigger,
    //   }

    return {
      codeContext: [],
      knowledgeContext: [],
      totalLatencyMs: 0,
      trigger,
    }
  }

  /**
   * 索引单个文件 (供 scripts/index-codebase.py 通过 HTTP 调用,或 BullMQ worker 调用)
   *
   * 入参为已切好的 chunk + 已 embed 的向量,直接 upsert。
   */
  async indexChunks(
    collection: RetrievalCollection,
    chunks: Array<{ payload: import('./retrieval.types').ChunkPayload; vector: number[] }>
  ): Promise<{ written: number; failed: number }> {
    // TODO[Pulse-72]:
    //   const vectors = chunks.map(c => c.vector)
    //   const payloads = chunks.map(c => c.payload)
    //   const result = await this.qdrant.upsert(collection, payloads, vectors)
    //   if (result.written > 0) this.lastIndexAt = new Date().toISOString()
    //   return result
    return { written: 0, failed: chunks.length }
  }

  /** Rerank (Cohere / BGE-reranker-v2),可选 */
  private async rerank(
    _query: string,
    candidates: RetrievalResult[],
    _topK: number
  ): Promise<RetrievalResult[]> {
    // TODO[Pulse-73]: 实现 rerank
    return candidates
  }

  /** 缓存 key 构造 (含 query + options hash) */
  private buildCacheKey(scope: string, query: RetrievalQuery): string {
    // TODO[Pulse-71]: hash(query.query + JSON.stringify({ topK, threshold, collections, ... }))
    return `${this.cfg.cache.keyPrefix}${scope}:${query.query}`
  }

  /** 暴露给 health controller */
  getLastIndexAt(): string | null {
    return this.lastIndexAt
  }

  /** 暴露给 health controller: 快速检查 qdrant / embedder 状态 */
  async getComponentHealth(): Promise<{
    qdrant: 'ok' | 'degraded' | 'unavailable'
    embedder: 'ok' | 'degraded' | 'unavailable'
    lastIndexAt: string | null
  }> {
    // TODO[Pulse-71]: 调用 qdrant.healthz() + embedder.healthcheck()
    return {
      qdrant: 'unavailable',
      embedder: 'unavailable',
      lastIndexAt: this.lastIndexAt,
    }
  }
}