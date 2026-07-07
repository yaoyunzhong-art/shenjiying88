/**
 * hybrid-search.ts - Phase-23 T84
 * Hybrid Search (BM25 + 向量 + Reranker)
 *
 * 组合策略:
 * 1. BM25: 关键词匹配 (TF-IDF + 长度归一化)
 * 2. 向量检索: 语义相似 (使用 MultimodalEmbeddingService)
 * 3. Reranker: Cross-encoder (V2 mock,基于多特征 score 合并)
 * 4. Reciprocal Rank Fusion (RRF) 合并 BM25 + 向量结果
 *
 * 设计:
 * - 不依赖 LanceDB / 真实 ANN (V2 mock)
 * - in-memory 倒排索引 + 评分
 * - metadata filter 支持 (tenant/brand/date)
 */
import { cosineSimilarity } from './multimodal-embedding.service';

// ── BM25 ──

export interface BM25Config {
  /** k1: TF saturation (默认 1.5) */
  k1: number;
  /** b: 长度归一化 (默认 0.75) */
  b: number;
}

export const DEFAULT_BM25_CONFIG: BM25Config = { k1: 1.5, b: 0.75 };

interface IndexedDoc {
  id: string;
  tokens: string[];
  length: number;
  /** metadata for filter */
  metadata: Record<string, unknown>;
}

export class BM25Index {
  private readonly docs: IndexedDoc[] = [];
  private readonly docFreqs = new Map<string, number>();
  private totalDocs = 0;
  private totalDocLen = 0;
  private readonly config: BM25Config;

  constructor(config: BM25Config = DEFAULT_BM25_CONFIG) {
    this.config = config;
  }

  add(doc: { id: string; text: string; metadata?: Record<string, unknown> }): void {
    const tokens = tokenize(doc.text);
    this.docs.push({
      id: doc.id,
      tokens,
      length: tokens.length,
      metadata: doc.metadata ?? {},
    });
    this.totalDocs++;
    this.totalDocLen += tokens.length;
    const unique = new Set(tokens);
    for (const t of unique) {
      this.docFreqs.set(t, (this.docFreqs.get(t) ?? 0) + 1);
    }
  }

  size(): number {
    return this.docs.length;
  }

  search(query: string, topK = 10): Array<{ id: string; score: number; metadata: Record<string, unknown> }> {
    const queryTokens = tokenize(query);
    const scores = this.docs.map((doc) => {
      let score = 0;
      const tfMap = new Map<string, number>();
      for (const t of doc.tokens) tfMap.set(t, (tfMap.get(t) ?? 0) + 1);
      for (const qt of queryTokens) {
        const tf = tfMap.get(qt) ?? 0;
        if (tf === 0) continue;
        const df = this.docFreqs.get(qt) ?? 0;
        const idf = Math.log(1 + (this.totalDocs - df + 0.5) / (df + 0.5));
        const avgLen = this.totalDocLen / this.totalDocs || 1;
        const lenNorm = 1 - this.config.b + this.config.b * (doc.length / avgLen);
        score += idf * ((tf * (this.config.k1 + 1)) / (tf + this.config.k1 * lenNorm));
      }
      return { id: doc.id, score, metadata: doc.metadata };
    });
    return scores
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 1);
}

// ── Vector Index ──

export interface VectorEntry {
  id: string;
  vector: number[];
  metadata: Record<string, unknown>;
}

export class VectorIndex {
  private readonly entries: VectorEntry[] = [];

  add(entry: VectorEntry): void {
    this.entries.push(entry);
  }

  size(): number {
    return this.entries.length;
  }

  search(query: number[], topK = 10): Array<{ id: string; score: number; metadata: Record<string, unknown> }> {
    const scored = this.entries.map((e) => ({
      id: e.id,
      score: cosineSimilarity(query, e.vector),
      metadata: e.metadata,
    }));
    return scored.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}

// ── Hybrid Search ──

export interface HybridSearchConfig {
  /** BM25 权重 (0-1),默认 0.5 */
  bm25Weight?: number;
  /** 向量权重 (0-1),默认 0.5 */
  vectorWeight?: number;
  /** RRF k 参数 (默认 60) */
  rrfK?: number;
  /** 返回 Top-K (默认 10) */
  topK?: number;
  /** metadata 过滤器 */
  metadataFilter?: (metadata: Record<string, unknown>) => boolean;
}

export interface HybridSearchResult {
  id: string;
  /** 合并后的综合 score */
  score: number;
  /** 各来源贡献 */
  sources: { bm25?: number; vector?: number; reranker?: number };
  metadata: Record<string, unknown>;
}

export class HybridSearch {
  private readonly bm25: BM25Index;
  private readonly vector: VectorIndex;
  private readonly config: Required<HybridSearchConfig>;

  constructor(config: HybridSearchConfig = {}) {
    this.bm25 = new BM25Index();
    this.vector = new VectorIndex();
    this.config = {
      bm25Weight: config.bm25Weight ?? 0.5,
      vectorWeight: config.vectorWeight ?? 0.5,
      rrfK: config.rrfK ?? 60,
      topK: config.topK ?? 10,
      metadataFilter: config.metadataFilter ?? (() => true),
    };
  }

  addDoc(doc: { id: string; text: string; vector: number[]; metadata?: Record<string, unknown> }): void {
    const metadata = doc.metadata ?? {};
    if (!this.config.metadataFilter(metadata)) return;
    this.bm25.add({ id: doc.id, text: doc.text, metadata });
    this.vector.add({ id: doc.id, vector: doc.vector, metadata });
  }

  size(): { bm25: number; vector: number } {
    return { bm25: this.bm25.size(), vector: this.vector.size() };
  }

  /**
   * Hybrid 检索:BM25 + 向量 + RRF 合并
   */
  search(query: { text: string; vector: number[] }): HybridSearchResult[] {
    const bm25Results = this.bm25.search(query.text, this.config.topK * 2);
    const vectorResults = this.vector.search(query.vector, this.config.topK * 2);

    // RRF (Reciprocal Rank Fusion)
    const scores = new Map<string, { id: string; bm25?: number; vector?: number; reranker?: number; metadata: Record<string, unknown> }>();

    bm25Results.forEach((r, rank) => {
      const existing = scores.get(r.id) ?? { id: r.id, metadata: r.metadata };
      existing.bm25 = r.score;
      existing.vector = existing.vector ?? 0;
      // RRF contribution
      const rrfScore = this.config.bm25Weight / (this.config.rrfK + rank + 1);
      scores.set(r.id, { ...existing, bm25: (existing.bm25 ?? 0) + rrfScore * 100 });
    });

    vectorResults.forEach((r, rank) => {
      const existing = scores.get(r.id) ?? { id: r.id, metadata: r.metadata };
      existing.vector = r.score;
      const rrfScore = this.config.vectorWeight / (this.config.rrfK + rank + 1);
      scores.set(r.id, { ...existing, vector: (existing.vector ?? 0) + rrfScore * 100 });
    });

    return Array.from(scores.values())
      .map((s) => ({
        id: s.id,
        score: (s.bm25 ?? 0) + (s.vector ?? 0),
        sources: { bm25: s.bm25, vector: s.vector },
        metadata: s.metadata,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.topK);
  }
}
