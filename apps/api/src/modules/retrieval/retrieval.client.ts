/**
 * retrieval.client.ts · Qdrant 客户端封装 (Phase-19 脚手架)
 *
 * 设计依据:
 *   - docs/research/rag-architecture.md §3.1 (Qdrant 选型)
 *   - 使用官方 @qdrant/js-client-rest (REST 优先,gRPC 预留)
 *
 * 本脚手架仅定义接口与类骨架,Pulse-71 实现:
 *   - connect(): 建立 HTTP 连接 + 健康探测
 *   - ensureCollection(): 启动时确保 collection 存在 (vector size + distance)
 *   - upsert(): 写入 chunk (idempotent by chunkId)
 *   - search(): 稠密向量检索 (返回 topK)
 *   - hybridSearch(): dense + sparse + metadata filter
 *   - deleteByFilePath(): 增量索引删除旧 chunk
 *   - count(): 监控 vector 数
 *
 * ⚠️  依赖待添加 (Phase-71):
 *     pnpm add @qdrant/js-client-rest
 */

import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { retrievalConfig } from './config/retrieval.config'
import type { ChunkPayload, RetrievalCollection, RetrievalResult } from './retrieval.types'
import { RetrievalUnavailableError } from './retrieval.types'

/**
 * Qdrant 客户端抽象接口 (便于 mock + 多实现切换: REST / gRPC)
 *
 * ⚠️  当前脚手架阶段未真正实现,所有方法抛 NotImplementedError。
 */
export interface IQdrantClient {
  /** 健康检查 */
  healthz(): Promise<{ status: 'ok' | 'degraded' | 'unavailable' }>

  /** 确保 collection 存在,若不存在则创建 */
  ensureCollection(
    collection: RetrievalCollection,
    options: { vectorSize: number; distance: 'Cosine' | 'Euclid' | 'Dot' }
  ): Promise<void>

  /** 写入或更新 chunk (idempotent) */
  upsert(collection: RetrievalCollection, chunks: ChunkPayload[], vectors: number[][]): Promise<{ written: number; failed: number }>

  /** dense-only 检索 */
  search(collection: RetrievalCollection, vector: number[], options: {
    topK: number
    threshold: number
    filter?: QdrantFilter
  }): Promise<RetrievalResult[]>

  /** hybrid 检索 (dense + sparse + filter) */
  hybridSearch(collection: RetrievalCollection, denseVector: number[], sparseVector: Record<number, number>, options: {
    topK: number
    threshold: number
    filter?: QdrantFilter
  }): Promise<RetrievalResult[]>

  /** 按文件路径删除 (增量索引用) */
  deleteByFilePath(collection: RetrievalCollection, filePath: string): Promise<number>

  /** collection 内向量总数 (监控用) */
  count(collection: RetrievalCollection): Promise<number>
}

/** Qdrant metadata filter (phase / path) */
export interface QdrantFilter {
  must?: QdrantCondition[]
  mustNot?: QdrantCondition[]
  should?: QdrantCondition[]
}

export type QdrantCondition =
  | { key: string; match: { value: string | number | boolean } }
  | { key: string; match: { any: Array<string | number> } }
  | { key: string; match: { prefix: string } }
  | { key: string; range: { gte?: number; lte?: number } }

@Injectable()
export class QdrantClientWrapper implements IQdrantClient, OnModuleDestroy {
  private readonly logger = new Logger(QdrantClientWrapper.name)

  // TODO[Pulse-71]: private client: QdrantClient | null = null

  constructor(
    @Inject(retrievalConfig.KEY) private readonly cfg: ConfigType<typeof retrievalConfig>
  ) {
    this.logger.log(`QdrantClientWrapper initialized for ${this.cfg.qdrant.host}:${this.cfg.qdrant.port}`)
  }

  /**
   * 启动时调用: 建立连接 + 确保 collection 存在
   * 当前为 TODO,Pulse-71 实现:
   *   1. import { QdrantClient } from '@qdrant/js-client-rest'
   *   2. this.client = new QdrantClient({ host, port, apiKey })
   *   3. await this.healthz()
   *   4. await this.ensureCollection('code_chunks', { vectorSize, distance })
   *   5. await this.ensureCollection('knowledge_docs', { vectorSize, distance })
   */
  async onModuleInit(): Promise<void> {
    // TODO[Pulse-71]: 真实实现
    this.logger.warn('[QdrantClientWrapper] onModuleInit not implemented — Pulse-71 skeleton')
  }

  async onModuleDestroy(): Promise<void> {
    // TODO[Pulse-71]: this.client?.close()
    this.logger.log('QdrantClientWrapper destroyed')
  }

  async healthz(): Promise<{ status: 'ok' | 'degraded' | 'unavailable' }> {
    // TODO[Pulse-71]: ping /healthz
    throw new RetrievalUnavailableError('QdrantClientWrapper.healthz not implemented')
  }

  async ensureCollection(
    _collection: RetrievalCollection,
    _options: { vectorSize: number; distance: 'Cosine' | 'Euclid' | 'Dot' }
  ): Promise<void> {
    // TODO[Pulse-71]: PUT /collections/{name}
    throw new RetrievalUnavailableError('QdrantClientWrapper.ensureCollection not implemented')
  }

  async upsert(
    _collection: RetrievalCollection,
    chunks: ChunkPayload[],
    _vectors: number[][]
  ): Promise<{ written: number; failed: number }> {
    // TODO[Pulse-71]: PUT /collections/{name}/points (batch)
    return { written: 0, failed: chunks.length }
  }

  async search(
    _collection: RetrievalCollection,
    _vector: number[],
    _options: { topK: number; threshold: number; filter?: QdrantFilter }
  ): Promise<RetrievalResult[]> {
    // TODO[Pulse-71]: POST /collections/{name}/points/search
    return []
  }

  async hybridSearch(
    _collection: RetrievalCollection,
    _denseVector: number[],
    _sparseVector: Record<number, number>,
    _options: { topK: number; threshold: number; filter?: QdrantFilter }
  ): Promise<RetrievalResult[]> {
    // TODO[Pulse-72]: 启用 sparse vector (BM25 / SPLADE)
    return []
  }

  async deleteByFilePath(_collection: RetrievalCollection, _filePath: string): Promise<number> {
    // TODO[Pulse-72]: POST /collections/{name}/points/delete (filter match)
    return 0
  }

  async count(_collection: RetrievalCollection): Promise<number> {
    // TODO[Pulse-71]: GET /collections/{name}
    return 0
  }
}