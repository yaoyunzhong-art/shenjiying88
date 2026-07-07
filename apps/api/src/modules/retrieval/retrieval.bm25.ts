/**
 * retrieval.bm25.ts · BM25 稀疏向量计算 (Phase-19 RAG 增强)
 *
 * 设计依据:
 *   - docs/research/rag-architecture.md §3.3 (Hybrid Search: dense + sparse)
 *   - knowledge/decision-records/DR-005-rag-architecture.md
 *
 * 经典 BM25 公式:
 *   score(q, d) = Σ IDF(qi) · (f(qi,d)·(k1+1)) / (f(qi,d) + k1·(1-b+b·|d|/avgdl))
 *
 * 参数:
 *   - k1 = 1.5  (词频饱和度,常用取值 1.2 ~ 2.0)
 *   - b  = 0.75 (文档长度归一化,常用取值 0.75)
 *
 * 中英文混合支持:
 *   - 英文: 按 /\b\w+\b/ 拆分,小写化,去标点
 *   - 中文: 按字符拆分 (Unicode 范围 \u4e00-\u9fa5)
 *   - 数字: 保留
 *
 * 稀疏向量输出: Record<tokenId, score>
 *   tokenId 由 vocabulary.get(token) 生成,与索引器保持一致
 *
 * ⚠️  当前实现:
 *   - 内存版 (适合 < 100K docs)
 *   - 分布式版 (Phase-22 切换 Qdrant BM25 内置)
 *
 * @module retrieval/bm25
 */

import type { ChunkPayload } from './retrieval.types'

// ─── BM25 参数 ──────────────────────────────────────────────────────────

export interface BM25Params {
  /** 词频饱和度 (常用 1.2 ~ 2.0) */
  k1: number
  /** 文档长度归一化 (0 = 不归一化, 1 = 完全归一化) */
  b: number
  /** IDF 最小值,防止负数 (常用 -100 ~ 0) */
  minIdf: number
}

export const DEFAULT_BM25_PARAMS: BM25Params = {
  k1: 1.5,
  b: 0.75,
  minIdf: -100,
}

// ─── 分词器 ────────────────────────────────────────────────────────────

/**
 * 中英文混合分词
 *
 * - 连续英文字母 / 数字视为一个 token
 * - 单个中文字符视为一个 token (unigram)
 * - 全小写化
 *
 * 示例:
 *   tokenize("Hello, 神机营 SaaS!") → ["hello", "神", "机", "营", "saas"]
 *   tokenize("跨门店优惠券") → ["跨", "门", "店", "优", "惠", "券"]
 */
export function tokenize(text: string): string[] {
  if (!text) return []

  const tokens: string[] = []

  // 1. 提取英文 / 数字 / 中文 unicode
  const regex = /[a-zA-Z0-9]+|[\u4e00-\u9fa5]/g
  const matches = text.toLowerCase().match(regex)

  if (!matches) return []

  for (const m of matches) {
    // 中文 unigram (每个字符一个 token) — 例外保留单字符
    if (/^[\u4e00-\u9fa5]$/.test(m)) {
      tokens.push(m)
      continue
    }

    // 英文 / 数字单词: 长度 ≥2 保留 (单字符噪声多)
    if (m.length >= 2) {
      tokens.push(m)
    }
  }

  return tokens
}

// ─── BM25 索引 ──────────────────────────────────────────────────────────

/**
 * 内存版 BM25 索引
 *
 * 用于 retrieval.bm25 内部计算 query 稀疏向量,
 * 以及离线评估脚本 (scripts/eval-bm25.py 等价 TS 版本)。
 *
 * 生产环境使用 Qdrant 内置 BM25 (Phase-22)。
 */
export class BM25Index {
  private readonly params: BM25Params
  private readonly docs: ChunkPayload[]
  private readonly docTokens: string[][]
  private readonly docLengths: number[]
  private readonly avgDocLength: number
  private readonly df: Map<string, number> = new Map() // document frequency
  private readonly idf: Map<string, number> = new Map()
  private readonly vocabulary: Map<string, number> = new Map()

  constructor(docs: ChunkPayload[], params: Partial<BM25Params> = {}) {
    this.params = { ...DEFAULT_BM25_PARAMS, ...params }
    this.docs = docs
    this.docTokens = docs.map((d) => tokenize(d.content))
    this.docLengths = this.docTokens.map((t) => t.length)
    this.avgDocLength =
      this.docLengths.reduce((s, l) => s + l, 0) / Math.max(this.docLengths.length, 1)

    this.buildStats()
  }

  /** 构建 df / idf / vocabulary */
  private buildStats(): void {
    // 1. vocabulary + df
    for (const tokens of this.docTokens) {
      const seen = new Set<string>()
      for (const t of tokens) {
        if (!this.vocabulary.has(t)) {
          this.vocabulary.set(t, this.vocabulary.size)
        }
        if (!seen.has(t)) {
          seen.add(t)
          this.df.set(t, (this.df.get(t) ?? 0) + 1)
        }
      }
    }

    // 2. IDF: log((N - n + 0.5) / (n + 0.5) + 1)
    const N = this.docs.length
    for (const [term, n] of this.df) {
      const idf = Math.log((N - n + 0.5) / (n + 0.5) + 1)
      this.idf.set(term, Math.max(idf, this.params.minIdf))
    }
  }

  /** vocabulary size */
  get vocabularySize(): number {
    return this.vocabulary.size
  }

  /** 文档总数 */
  get docCount(): number {
    return this.docs.length
  }

  /** IDF map (供调试) */
  get idfMap(): ReadonlyMap<string, number> {
    return this.idf
  }

  /** 计算单文档 BM25 分数 */
  private scoreDoc(queryTokens: string[], docIdx: number): number {
    const tokens = this.docTokens[docIdx]
    const docLen = this.docLengths[docIdx]
    if (tokens.length === 0) return 0

    // term frequency
    const tf: Map<string, number> = new Map()
    for (const t of tokens) {
      tf.set(t, (tf.get(t) ?? 0) + 1)
    }

    let score = 0
    for (const qt of queryTokens) {
      const f = tf.get(qt) ?? 0
      if (f === 0) continue

      const idf = this.idf.get(qt) ?? 0
      if (idf <= 0) continue

      const norm = 1 - this.params.b + this.params.b * (docLen / this.avgDocLength)
      const termScore = idf * ((f * (this.params.k1 + 1)) / (f + this.params.k1 * norm))
      score += termScore
    }

    return score
  }

  /**
   * 检索:返回 top-K 文档 (按 BM25 分数降序)
   */
  search(query: string, topK: number = 10): Array<{ chunk: ChunkPayload; score: number; index: number }> {
    const queryTokens = tokenize(query)
    if (queryTokens.length === 0) return []

    const scored = this.docs
      .map((chunk, idx) => ({ chunk, score: this.scoreDoc(queryTokens, idx), index: idx }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    return scored
  }

  /**
   * 生成查询稀疏向量 (供 Qdrant hybridSearch)
   *
   * 输出: Record<tokenId, bm25TermScore>
   *   - tokenId: vocabulary.get(token)
   *   - bm25TermScore: IDF · (tf·(k1+1))/(tf+k1·norm)
   *     注: 不归一化到 query 长度,Qdrant 内部会 normalize
   */
  querySparseVector(query: string): Record<number, number> {
    const queryTokens = tokenize(query)
    const tf: Map<string, number> = new Map()
    for (const t of queryTokens) {
      tf.set(t, (tf.get(t) ?? 0) + 1)
    }

    const sparse: Record<number, number> = {}
    // 使用平均文档长度近似 norm (因为查询没有 doc length)
    const avgNorm = 1 - this.params.b + this.params.b * 1 // = 1

    for (const [term, f] of tf) {
      const idf = this.idf.get(term) ?? 0
      if (idf <= 0) continue

      const tokenId = this.vocabulary.get(term)
      if (tokenId === undefined) continue

      const termScore = idf * ((f * (this.params.k1 + 1)) / (f + this.params.k1 * avgNorm))
      if (termScore > 0) {
        sparse[tokenId] = termScore
      }
    }

    return sparse
  }
}

// ─── Hybrid 融合 ────────────────────────────────────────────────────────

/**
 * Hybrid 融合 (dense + sparse + metadata)
 *
 * finalScore = α·denseNorm + β·sparseNorm + γ·metadataBoost
 *
 * 默认 α=0.7, β=0.3, γ=0.1 (Phase-19 调参起点)
 */
export interface HybridWeights {
  dense: number
  sparse: number
  metadata: number
}

export const DEFAULT_HYBRID_WEIGHTS: HybridWeights = {
  dense: 0.7,
  sparse: 0.3,
  metadata: 0.1,
}

/**
 * 归一化 dense 分数到 [0, 1] (按 min-max)
 */
export function normalizeDenseScores(scores: number[]): number[] {
  if (scores.length === 0) return []
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  if (max === min) return scores.map(() => 1)
  return scores.map((s) => (s - min) / (max - min))
}

/**
 * 归一化 BM25 分数到 [0, 1] (按 min-max)
 */
export function normalizeSparseScores(scores: number[]): number[] {
  return normalizeDenseScores(scores)
}

/**
 * 计算 hybrid finalScore
 */
export function hybridScore(
  dense: number,
  sparse: number | undefined,
  metadata: number | undefined,
  weights: HybridWeights = DEFAULT_HYBRID_WEIGHTS
): number {
  const d = dense ?? 0
  const s = sparse ?? 0
  const m = metadata ?? 0
  return weights.dense * d + weights.sparse * s + weights.metadata * m
}

// ─── 单元测试辅助 ──────────────────────────────────────────────────────

/**
 * 计算 A/B 评估指标 (Hit Rate @ K, MRR @ K)
 *
 * 用于:
 *   - scripts/eval-reranker.py 集成
 *   - retrieval.service.spec.ts 单元测试
 */
export interface EvalGroundTruth {
  query: string
  relevantDocIds: string[]
}

export interface ABMetrics {
  hitRateAtK: number
  mrrAtK: number
  totalQueries: number
}

export function evaluateAB(
  results: Array<{ query: string; topDocIds: string[] }>,
  groundTruth: EvalGroundTruth[],
  k: number = 5
): ABMetrics {
  const gtMap = new Map(groundTruth.map((g) => [g.query, g.relevantDocIds]))

  let hits = 0
  let mrrSum = 0
  let matched = 0

  for (const r of results) {
    const relevant = gtMap.get(r.query)
    if (!relevant || relevant.length === 0) continue

    matched++
    const topK = r.topDocIds.slice(0, k)
    let firstHitRank = -1

    for (let i = 0; i < topK.length; i++) {
      if (relevant.includes(topK[i])) {
        hits++
        if (firstHitRank === -1) firstHitRank = i + 1
        break
      }
    }

    if (firstHitRank > 0) {
      mrrSum += 1 / firstHitRank
    }
  }

  return {
    hitRateAtK: matched > 0 ? hits / matched : 0,
    mrrAtK: matched > 0 ? mrrSum / matched : 0,
    totalQueries: matched,
  }
}
