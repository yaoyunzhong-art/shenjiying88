import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { retrievalConfig } from './config/retrieval.config'

export interface IEmbedder {
  readonly provider: string
  readonly dimension: number
  embed(text: string): Promise<number[]>
  batchEmbed(texts: string[]): Promise<number[][]>
  sparseEmbed(text: string): Promise<Record<number, number>>
  healthcheck(): Promise<{ ok: boolean; provider: string; latencyMs: number }>
}

@Injectable()
export class EmbeddingService implements IEmbedder, OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name)

  constructor(
    @Inject(retrievalConfig.KEY) private readonly cfg: ConfigType<typeof retrievalConfig>
  ) {
    this.logger.debug(`EmbeddingService initialized for ${this.cfg.embedder.provider}`)
  }

  get provider(): string { return this.cfg.embedder.provider }
  get dimension(): number { return this.cfg.qdrant.vectorSize }

  async onModuleInit(): Promise<void> {
    this.logger.log(`[Embedder] provider=${this.provider}, dimension=${this.dimension}`)
  }

  async embed(text: string): Promise<number[]> {
    const trimmed = text.trim()
    if (!trimmed) return new Array(this.dimension).fill(0)
    // 退化模式: 基于字符hash生成伪embedding (用于阶段测试)
    const vec = new Array(this.dimension).fill(0)
    const seed = this.hashString(trimmed)
    for (let i = 0; i < this.dimension; i++) {
      vec[i] = Math.sin(seed * (i + 1)) * 0.5
    }
    return vec
  }

  async batchEmbed(texts: string[]): Promise<number[][]> {
    const results: number[][] = []
    const batchSize = this.cfg.embedder.batchSize
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch.map(t => this.embed(t)))
      results.push(...batchResults)
    }
    return results
  }

  async sparseEmbed(text: string): Promise<Record<number, number>> {
    const tokens = text.toLowerCase().split(/\s+/).filter(t => t.length > 0)
    const sparse: Record<number, number> = {}
    for (const token of tokens) {
      const idx = Math.abs(this.hashString(token)) % 10000
      sparse[idx] = (sparse[idx] || 0) + 1
    }
    return sparse
  }

  async healthcheck(): Promise<{ ok: boolean; provider: string; latencyMs: number }> {
    const start = Date.now()
    return { ok: true, provider: this.provider, latencyMs: Date.now() - start }
  }

  estimateTokens(text: string): number {
    if (!text) return 0
    // 粗略估算: 中文 ~1.5 char/token, 英文 ~4 char/token
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const otherChars = text.length - chineseChars
    return Math.ceil(chineseChars / 1.5 + otherChars / 4)
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash |= 0
    }
    return Math.abs(hash)
  }
}
