/**
 * retrieval.config.ts · RAG 检索模块配置 (Phase-19 脚手架)
 *
 * 配置项分组:
 *   1. qdrant       — 向量数据库连接
 *   2. embedder     — Embedding 模型
 *   3. chunking     — Chunk 切分策略
 *   4. retrieval    — 检索参数 (topK / threshold)
 *   5. llm          — 主力 LLM (用于 review / draft)
 *   6. cache        — Redis 缓存策略
 *
 * 所有密钥/API key 仅从环境变量读取,严禁硬编码。
 *
 * 设计依据:
 *   - docs/research/rag-architecture.md §3 / §6
 *   - docs/research/llm-model-comparison.md (LLM/Embedding 选型)
 */

import { registerAs } from '@nestjs/config'

export interface QdrantConfig {
  /** Qdrant REST 端口 */
  host: string
  port: number
  /** gRPC 端口 (预留) */
  grpcPort: number
  /** API key (生产从 env 注入; 本地空字符串) */
  apiKey: string | undefined
  /** 默认 collection */
  defaultCollection: string
  /** HNSW 索引参数 */
  hnswConfig: {
    m: number
    efConstruct: number
    efSearch: number
  }
  /** 向量维度 (text-embedding-3-large = 3072) */
  vectorSize: number
  /** 距离度量 */
  distance: 'Cosine' | 'Euclid' | 'Dot'
}

export interface EmbedderConfig {
  /** Embedding 模型名 (OpenAI / 本地) */
  provider: 'text-embedding-3-large' | 'text-embedding-3-small' | 'bge-large-zh-v1.5'
  /** OpenAI / 自托管 API key */
  apiKey: string | undefined
  /** OpenAI 兼容 base URL (本地模型可改 http://localhost:11434/v1) */
  baseUrl: string
  /** 批大小 (一次 embed 多少 chunk) */
  batchSize: number
  /** 单请求最大 token (OpenAI 8191 for 3-large) */
  maxInputTokens: number
  /** 请求超时 (ms) */
  timeoutMs: number
  /** 最大重试次数 */
  maxRetries: number
}

export interface ChunkingConfig {
  /** 代码 chunk 目标大小 (token) */
  codeChunkSize: number
  /** Overlap token (与下一个 chunk 共享) */
  codeChunkOverlap: number
  /** Markdown chunk 目标大小 */
  mdChunkSize: number
  /** Markdown overlap */
  mdChunkOverlap: number
  /** 超出 maxSize 是否硬切 */
  hardSplit: boolean
}

export interface RetrievalConfig {
  /** 默认 topK (检索返回条数) */
  defaultTopK: number
  /** 最大 topK (防止资源耗尽) */
  maxTopK: number
  /** 默认相似度阈值 (cosine) */
  defaultThreshold: number
  /** 是否启用 hybrid search */
  hybridEnabled: boolean
  /** dense 权重 */
  denseWeight: number
  /** sparse (BM25) 权重 */
  sparseWeight: number
  /** metadata boost 权重 */
  metadataWeight: number
  /** Rerank 模型 (可选) */
  rerankEnabled: boolean
  rerankModel: 'cohere-rerank-3' | 'bge-reranker-v2' | 'none'
  rerankApiKey: string | undefined
  rerankTopK: number
}

export interface LlmConfig {
  /** 主力 LLM provider */
  provider: 'claude' | 'openai'
  /** 模型名 (claude-sonnet-4-6 / gpt-5) */
  model: string
  /** API key */
  apiKey: string | undefined
  /** 最大 output token */
  maxOutputTokens: number
  /** Temperature (code review 推荐 0.2) */
  temperature: number
  /** Prompt cache 是否启用 (claude 节省 90%) */
  promptCacheEnabled: boolean
}

export interface RagCacheConfig {
  /** Redis cache TTL (秒) */
  ttlSeconds: number
  /** key prefix */
  keyPrefix: string
  /** 是否启用 */
  enabled: boolean
}

export interface RetrievalModuleConfig {
  qdrant: QdrantConfig
  embedder: EmbedderConfig
  chunking: ChunkingConfig
  retrieval: RetrievalConfig
  llm: LlmConfig
  cache: RagCacheConfig
}

/**
 * 默认配置 (开发环境)
 *
 * ⚠️  生产部署必须通过 env 覆盖 apiKey / host 等敏感字段。
 */
function buildDefaultConfig(): RetrievalModuleConfig {
  return {
    qdrant: {
      host: process.env.QDRANT_HOST?.trim() || '127.0.0.1',
      port: parseInt(process.env.QDRANT_PORT ?? '6333', 10),
      grpcPort: parseInt(process.env.QDRANT_GRPC_PORT ?? '6334', 10),
      apiKey: process.env.QDRANT_API_KEY?.trim() || undefined,
      defaultCollection: process.env.QDRANT_DEFAULT_COLLECTION?.trim() || 'shenjiying_code_chunks',
      hnswConfig: {
        m: 16,
        efConstruct: 100,
        efSearch: 64,
      },
      vectorSize: 3072, // text-embedding-3-large
      distance: 'Cosine',
    },
    embedder: {
      provider: (process.env.EMBEDDING_PROVIDER as EmbedderConfig['provider']) || 'text-embedding-3-large',
      apiKey: process.env.OPENAI_API_KEY?.trim() || undefined,
      baseUrl: process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1',
      batchSize: 32,
      maxInputTokens: 8191,
      timeoutMs: 30000,
      maxRetries: 2,
    },
    chunking: {
      codeChunkSize: 800,
      codeChunkOverlap: 200,
      mdChunkSize: 800,
      mdChunkOverlap: 200,
      hardSplit: false,
    },
    retrieval: {
      defaultTopK: 10,
      maxTopK: 50,
      defaultThreshold: 0.65,
      hybridEnabled: true,
      denseWeight: 0.65,
      sparseWeight: 0.30,
      metadataWeight: 0.05,
      rerankEnabled: false,
      rerankModel: 'none',
      rerankApiKey: process.env.COHERE_API_KEY?.trim() || undefined,
      rerankTopK: 5,
    },
    llm: {
      provider: (process.env.RAG_LLM_PROVIDER as LlmConfig['provider']) || 'claude',
      model: process.env.RAG_LLM_MODEL?.trim() || 'claude-sonnet-4-6',
      apiKey: process.env.ANTHROPIC_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || undefined,
      maxOutputTokens: 4096,
      temperature: 0.2,
      promptCacheEnabled: true,
    },
    cache: {
      ttlSeconds: 3600,
      keyPrefix: 'rag:',
      enabled: process.env.RAG_CACHE_ENABLED !== 'false',
    },
  }
}

/** NestJS Config registration token */
export const RETRIEVAL_CONFIG_KEY = 'retrieval'

/**
 * 通过 ConfigModule.forFeature 注册后,在 service 中通过 `@Inject(retrievalConfig.KEY)` 注入。
 *
 * 使用示例:
 * ```typescript
 * constructor(@Inject(retrievalConfig.KEY) private cfg: RetrievalModuleConfig) {}
 * ```
 */
export const retrievalConfig = registerAs(RETRIEVAL_CONFIG_KEY, () => buildDefaultConfig())

/** 导出 buildDefaultConfig 便于测试覆盖 (mock env) */
export const __test__ = { buildDefaultConfig }