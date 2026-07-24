import { Inject, Injectable, Logger, Optional } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { retrievalConfig } from './config/retrieval.config'
import { CACHE_SERVICE, type CacheService } from '../../infrastructure/cache/cache.module'
import { QdrantClientWrapper } from './retrieval.client'
import { EmbeddingService } from './retrieval.embedder'
import type { RAGContext, RetrievalCollection, RetrievalQuery, RetrievalResponse, RetrievalResult } from './retrieval.types'

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name)
  private lastIndexAt: string | null = null

  constructor(
    @Inject(retrievalConfig.KEY) private readonly cfg: ConfigType<typeof retrievalConfig>,
    private readonly qdrant: QdrantClientWrapper,
    private readonly embedder: EmbeddingService,
    @Optional() @Inject(CACHE_SERVICE) private readonly cache?: CacheService
  ) {
    this.logger.debug('RetrievalService initialized')
  }

  async retrieveCode(query: RetrievalQuery): Promise<RetrievalResponse> {
    const cacheKey = this.buildCacheKey('code', query)
    const cached = this.cache ? await this.cache.get<RetrievalResponse>(cacheKey) : null
    if (cached) return { ...cached, cacheHit: true }

    const start = Date.now()
    const queryVec = await this.embedder.embed(query.query)
    const candidates = query.hybrid
      ? await this.qdrant.hybridSearch('code_chunks', queryVec, {}, { topK: query.topK ?? 10, threshold: query.threshold ?? 0.5 })
      : await this.qdrant.search('code_chunks', queryVec, { topK: query.topK ?? 10, threshold: query.threshold ?? 0.5 })

    const results = query.rerank ? await this.rerank(query.query, candidates, this.cfg.retrieval.rerankTopK) : candidates

    const response: RetrievalResponse = {
      results,
      totalHits: results.length,
      latencyMs: Date.now() - start,
      cacheHit: false,
      collections: ['code_chunks'],
    }

    if (this.cache) await this.cache.set(cacheKey, response, this.cfg.cache.ttlSeconds)
    this.logger.debug(`[retrieveCode] query="${query.query.slice(0, 40)}" → ${results.length} hits, ${response.latencyMs}ms`)
    return response
  }

  async retrieveKnowledge(query: RetrievalQuery): Promise<RetrievalResponse> {
    const cacheKey = this.buildCacheKey('knowledge', query)
    const cached = this.cache ? await this.cache.get<RetrievalResponse>(cacheKey) : null
    if (cached) return { ...cached, cacheHit: true }

    const start = Date.now()
    const queryVec = await this.embedder.embed(query.query)
    const candidates = await this.qdrant.search('knowledge_docs', queryVec, { topK: query.topK ?? 10, threshold: query.threshold ?? 0.5 })

    const response: RetrievalResponse = {
      results: candidates,
      totalHits: candidates.length,
      latencyMs: Date.now() - start,
      cacheHit: false,
      collections: ['knowledge_docs'],
    }

    if (this.cache) await this.cache.set(cacheKey, response, this.cfg.cache.ttlSeconds)
    return response
  }

  async buildRAGContext(query: string, trigger?: RAGContext['trigger']): Promise<RAGContext> {
    const start = Date.now()
    const [codeRes, knowledgeRes] = await Promise.all([
      this.retrieveCode({ query, topK: 20 }),
      this.retrieveKnowledge({ query, topK: 10 }),
    ])
    return {
      codeContext: codeRes.results.slice(0, 5),
      knowledgeContext: knowledgeRes.results.slice(0, 5),
      totalLatencyMs: Date.now() - start,
      trigger,
    }
  }

  async indexChunks(collection: RetrievalCollection, chunks: Array<{ payload: import('./retrieval.types').ChunkPayload; vector: number[] }>): Promise<{ written: number; failed: number }> {
    const vectors = chunks.map(c => c.vector)
    const payloads = chunks.map(c => c.payload)
    const result = await this.qdrant.upsert(collection, payloads, vectors)
    if (result.written > 0) this.lastIndexAt = new Date().toISOString()
    return result
  }

  private async rerank(query: string, candidates: RetrievalResult[], topK: number): Promise<RetrievalResult[]> {
    // 基础退化: 按相似度排序取topK
    return candidates
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, topK)
  }

  private buildCacheKey(scope: string, query: RetrievalQuery): string {
    const hash = this.hashString(query.query + JSON.stringify({ topK: query.topK, threshold: query.threshold }))
    return `${this.cfg.cache.keyPrefix}${scope}:${hash}`
  }

  getLastIndexAt(): string | null { return this.lastIndexAt }

  async getComponentHealth(): Promise<{ qdrant: 'ok' | 'degraded' | 'unavailable'; embedder: 'ok' | 'degraded' | 'unavailable'; lastIndexAt: string | null }> {
    const [qdrantHealth, embedderHealth] = await Promise.all([
      this.qdrant.healthz(),
      this.embedder.healthcheck(),
    ])
    return {
      qdrant: qdrantHealth.status === 'ok' ? 'ok' : qdrantHealth.status === 'degraded' ? 'degraded' : 'unavailable',
      embedder: embedderHealth.ok ? 'ok' : 'degraded',
      lastIndexAt: this.lastIndexAt,
    }
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash |= 0
    }
    return Math.abs(hash).toString()
  }
}
