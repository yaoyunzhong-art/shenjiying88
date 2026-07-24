/**
 * retrieval.embedder.ts · Embedding 模型封装 (Phase-19 脚手架)
 *
 * 设计依据:
 *   - docs/research/rag-architecture.md §3.2 (text-embedding-3-large 主选)
 *   - docs/research/llm-model-comparison.md (3072 维 / 中文友好)
 *
 * 本脚手架仅定义接口与类骨架,Pulse-71 实现:
 *   - embed(text): 单条文本 embedding (3072 维 float[])
 *   - batchEmbed(texts): 批量 embed (default batch=32)
 *   - sparseEmbed(text): BM25 / SPLADE 向量 (hybrid search 用)
 *   - healthcheck(): API 可达性 + quota 查询
 *
 * ⚠️  依赖待添加 (Phase-71):
 *     pnpm add openai           # OpenAI 兼容 SDK
 *     pnpm add @xenova/transformers  # 本地 BGE fallback (Phase-25)
 */

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { retrievalConfig } from './config/retrieval.config'
import { EmbeddingQuotaExceededError } from './retrieval.types'

/**
 * Embedder 抽象接口 (便于 OpenAI / 本地 BGE 多实现)
 */
export interface IEmbedder {
  /** 模型名 */
  readonly provider: string
  /** 向量维度 */
  readonly dimension: number

  /** 单条 embedding */
  embed(text: string): Promise<number[]>

  /** 批量 embedding (按 batchSize 切批,失败重试) */
  batchEmbed(texts: string[]): Promise<number[][]>

  /** sparse 向量 (BM25 / SPLADE),用于 hybrid search */
  sparseEmbed(text: string): Promise<Record<number, number>>

  /** 健康检查 */
  healthcheck(): Promise<{ ok: boolean; provider: string; latencyMs: number }>
}

@Injectable()
export class EmbeddingService implements IEmbedder, OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name)

  // TODO[Pulse-71]: private openai: OpenAI | null = null

  constructor(
    @Inject(retrievalConfig.KEY) private readonly cfg: ConfigType<typeof retrievalConfig>
  ) {
    this.logger.debug(`EmbeddingService initialized for ${this.cfg.embedder.provider}`)
  }

  get provider(): string {
    return this.cfg.embedder.provider
  }

  get dimension(): number {
    return this.cfg.qdrant.vectorSize
  }

  async onModuleInit(): Promise<void> {
    // TODO[Pulse-71]:
    //   this.openai = new OpenAI({
    //     apiKey: this.cfg.embedder.apiKey,
    //     baseURL: this.cfg.embedder.baseUrl,
    //     timeout: this.cfg.embedder.timeoutMs,
    //   })
    this.logger.log('onModuleInit skipped — Pulse-71 skeleton')
  }

  async embed(_text: string): Promise<number[]> {
    // TODO[Pulse-71]:
    //   const res = await this.openai.embeddings.create({
    //     model: this.cfg.embedder.provider,
    //     input: text,
    //     encoding_format: 'float',
    //   })
    //   return res.data[0].embedding
    throw new Error('EmbeddingService.embed not implemented')
  }

  async batchEmbed(_texts: string[]): Promise<number[][]> {
    // TODO[Pulse-71]: 分批 + 并发 (Promise.all + chunk)
    //   const batches = chunk(texts, this.cfg.embedder.batchSize)
    //   return (await Promise.all(batches.map(b => this.embedBatch(b)))).flat()
    throw new Error('EmbeddingService.batchEmbed not implemented')
  }

  async sparseEmbed(_text: string): Promise<Record<number, number>> {
    // TODO[Pulse-72]: BM25 tokenizer 或 SPLADE 模型
    return {}
  }

  async healthcheck(): Promise<{ ok: boolean; provider: string; latencyMs: number }> {
    const start = Date.now()
    try {
      // TODO[Pulse-71]: try this.embed('ping') catch quota
      return {
        ok: false,
        provider: this.provider,
        latencyMs: Date.now() - start,
      }
    } catch (err) {
      if (err instanceof EmbeddingQuotaExceededError) {
        return { ok: false, provider: this.provider, latencyMs: Date.now() - start }
      }
      return { ok: false, provider: this.provider, latencyMs: Date.now() - start }
    }
  }

  /**
   * 估算文本 token 数 (使用 OpenAI tiktoken 近似)
   * ⚠️  Pulse-71 引入 gpt-tokenizer / tiktoken 依赖
   */
  estimateTokens(_text: string): number {
    // TODO[Pulse-71]: 使用 tokenizer 真实计算
    // 粗略估算: 1 token ≈ 4 chars (英文) / 1.5 chars (中文)
    return 0
  }
}
