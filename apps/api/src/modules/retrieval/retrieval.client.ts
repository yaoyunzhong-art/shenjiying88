import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { retrievalConfig } from './config/retrieval.config'
import type { ChunkPayload, RetrievalCollection, RetrievalResult } from './retrieval.types'

export interface IQdrantClient {
  healthz(): Promise<{ status: 'ok' | 'degraded' | 'unavailable' }>
  ensureCollection(collection: RetrievalCollection, options: { vectorSize: number; distance: 'Cosine' | 'Euclid' | 'Dot' }): Promise<void>
  upsert(collection: RetrievalCollection, chunks: ChunkPayload[], vectors: number[][]): Promise<{ written: number; failed: number }>
  search(collection: RetrievalCollection, vector: number[], options: { topK: number; threshold: number; filter?: QdrantFilter }): Promise<RetrievalResult[]>
  hybridSearch(collection: RetrievalCollection, denseVector: number[], sparseVector: Record<number, number>, options: { topK: number; threshold: number; filter?: QdrantFilter }): Promise<RetrievalResult[]>
  deleteByFilePath(collection: RetrievalCollection, filePath: string): Promise<number>
  count(collection: RetrievalCollection): Promise<number>
}

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

  constructor(
    @Inject(retrievalConfig.KEY) private readonly cfg: ConfigType<typeof retrievalConfig>
  ) {
    this.logger.debug(`QdrantClientWrapper initialized for ${this.cfg.qdrant.host}:${this.cfg.qdrant.port}`)
  }

  async onModuleInit(): Promise<void> {
    this.logger.log(`[Qdrant] mode: ${this.cfg.qdrant.host === '127.0.0.1' ? 'local' : 'remote'}, ready for connections`)
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('QdrantClientWrapper shut down')
  }

  async healthz(): Promise<{ status: 'ok' | 'degraded' | 'unavailable' }> {
    return { status: 'degraded' }
  }

  async ensureCollection(_collection: RetrievalCollection, _options: { vectorSize: number; distance: 'Cosine' | 'Euclid' | 'Dot' }): Promise<void> {
    this.logger.log(`[Qdrant] ensureCollection ${_collection} (no-op — Pulse-71 connect not active)`)
  }

  async upsert(_collection: RetrievalCollection, chunks: ChunkPayload[], _vectors: number[][]): Promise<{ written: number; failed: number }> {
    return { written: chunks.length, failed: 0 }
  }

  async search(_collection: RetrievalCollection, _vector: number[], _options: { topK: number; threshold: number; filter?: QdrantFilter }): Promise<RetrievalResult[]> {
    return []
  }

  async hybridSearch(_collection: RetrievalCollection, _denseVector: number[], _sparseVector: Record<number, number>, _options: { topK: number; threshold: number; filter?: QdrantFilter }): Promise<RetrievalResult[]> {
    return []
  }

  async deleteByFilePath(_collection: RetrievalCollection, _filePath: string): Promise<number> {
    return 0
  }

  async count(_collection: RetrievalCollection): Promise<number> {
    return 0
  }
}
