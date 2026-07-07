// knowledge-indexer.service.ts - Phase-18 T23
// 用途: RAG 知识库索引器 - 文档分块 + 向量化 + 语义查询
// 关联: phase-18-experience-ai/spec.md §5
import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';

export interface DocumentChunk {
  id: string;
  sourcePath: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  metadata: {
    title?: string;
    section?: string;
    tags?: string[];
    kind?: 'spec' | 'lesson' | 'pattern' | 'decision' | 'anti-pattern' | 'doc';
  };
  createdAt: string;
}

export interface EmbeddedChunk extends DocumentChunk {
  embedding: number[];
  /** embedding 维度,V1 固定 256,V2 接 sentence-transformers/all-MiniLM-L6-v2 (384) */
  embeddingDim: number;
}

export interface QueryResult {
  chunk: EmbeddedChunk;
  score: number;
  highlight?: string;
}

export interface QueryResponse {
  query: string;
  results: QueryResult[];
  totalCandidates: number;
  durationMs: number;
}

export interface IndexerStats {
  totalDocuments: number;
  totalChunks: number;
  averageChunkSize: number;
  byKind: Record<string, number>;
  indexBuildDurationMs: number;
}

/**
 * 文档分块策略 (V1):
 * - 按 markdown 标题 (#/##) 切分主 section
 * - 每个 section 内按段落 (空行) 再切分
 * - 合并短段落 (< 50 tokens) 到前一个 chunk
 * - 单 chunk 上限 512 tokens (粗略按 word count * 1.3 估算)
 *
 * V2 升级:
 * - chunk size 512 tokens + 50 overlap (滑动窗口)
 * - sentence-transformers/all-MiniLM-L6-v2 embedding
 * - LanceDB / SQLite-vec 持久化
 */
@Injectable()
export class KnowledgeIndexerService {
  private readonly logger = new Logger(KnowledgeIndexerService.name);
  /** chunk token 上限 */
  private readonly MAX_TOKENS_PER_CHUNK = 512;
  /** embedding 维度 (V1 固定 256 维) */
  private readonly EMBEDDING_DIM = 256;

  /** 索引存储 */
  private readonly chunks = new Map<string, EmbeddedChunk>();

  // ── Document parsing & chunking ──

  /**
   * 解析 markdown 文档,按标题和段落切分成 chunks
   */
  /**
   * 解析 markdown 文档,按 ## 标题切分成 chunks
   *
   * V1 策略:
   * - 整个文档按 ## section 切分
   * - 每个 section 独立成 chunk (即使短)
   * - 如果单 section > 512 tokens,按段落再切
   * - 文档级介绍 (# 标题 + 无标题 intro) 也作为独立 chunk
   */
  chunkDocument(input: {
    sourcePath: string;
    content: string;
    kind: DocumentChunk['metadata']['kind'];
    tags?: string[];
  }): DocumentChunk[] {
    // 安全处理 content 为 undefined / null 的情况
    const content = input.content ?? '';
    // 优先按真实换行切;若内容用 \n\n 字面字符,先替换为真实换行
    const normalized = content.includes('\n')
      ? content
      : content.replace(/\\n/g, '\n');
    const lines = normalized.split('\n');
    const chunks: DocumentChunk[] = [];
    let currentTitle = '';
    let currentSectionName = '';
    let buffer: string[] = [];
    let chunkIndex = 0;

    const flushSection = (sectionName: string) => {
      const text = buffer.join('\n').trim();
      if (text.length === 0) return;
      const tokens = this.estimateTokens(text);
      if (tokens <= this.MAX_TOKENS_PER_CHUNK) {
        chunks.push({
          id: this.generateChunkId(input.sourcePath, chunkIndex),
          sourcePath: input.sourcePath,
          chunkIndex,
          content: text,
          tokenCount: tokens,
          metadata: {
            title: currentTitle,
            section: sectionName,
            tags: input.tags,
            kind: input.kind,
          },
          createdAt: new Date().toISOString(),
        });
        chunkIndex++;
      } else {
        // 超长 section 按段落切分
        const paragraphs = text.split(/\n\s*\n/);
        let subBuffer = '';
        for (const p of paragraphs) {
          const candidateTokens = this.estimateTokens(subBuffer + '\n\n' + p);
          if (candidateTokens > this.MAX_TOKENS_PER_CHUNK && subBuffer.length > 0) {
            chunks.push({
              id: this.generateChunkId(input.sourcePath, chunkIndex),
              sourcePath: input.sourcePath,
              chunkIndex,
              content: subBuffer.trim(),
              tokenCount: this.estimateTokens(subBuffer),
              metadata: {
                title: currentTitle,
                section: sectionName,
                tags: input.tags,
                kind: input.kind,
              },
              createdAt: new Date().toISOString(),
            });
            chunkIndex++;
            subBuffer = p;
          } else {
            subBuffer += (subBuffer ? '\n\n' : '') + p;
          }
        }
        if (subBuffer.length > 0) {
          chunks.push({
            id: this.generateChunkId(input.sourcePath, chunkIndex),
            sourcePath: input.sourcePath,
            chunkIndex,
            content: subBuffer.trim(),
            tokenCount: this.estimateTokens(subBuffer),
            metadata: {
              title: currentTitle,
              section: sectionName,
              tags: input.tags,
              kind: input.kind,
            },
            createdAt: new Date().toISOString(),
          });
          chunkIndex++;
        }
      }
      buffer = [];
    };

    for (const line of lines) {
      const h1 = line.match(/^#\s+(.+)$/);
      const h2 = line.match(/^##\s+(.+)$/);
      const emptyLine = line.trim() === '';
      if (h1) {
        // # 标题:作为文档 title,触发上一个 section flush
        flushSection(currentSectionName);
        currentTitle = h1[1].trim();
      } else if (h2) {
        // ## 标题:flush 前一个 section
        flushSection(currentSectionName);
        currentSectionName = h2[1].trim();
      } else if (emptyLine) {
        // 空行:flush 当前 buffer (按段落切分)
        flushSection(currentSectionName);
      } else {
        buffer.push(line);
      }
    }
    flushSection(currentSectionName);

    return chunks;
  }

  // ── Embedding (V1: hash-based deterministic mock) ──

  /**
   * V1 mock embedding:基于内容 SHA-256 + 词袋统计生成 256 维向量
   * V2 替换为 sentence-transformers/all-MiniLM-L6-v2 (384 维)
   */
  embed(text: string): number[] {
    const safeText = text ?? '';
    const hash = createHash('sha256').update(safeText).digest();
    const vec = new Array<number>(this.EMBEDDING_DIM).fill(0);
    // 前 32 维:hash 字节映射到 [-1, 1]
    for (let i = 0; i < 32; i++) {
      vec[i] = (hash[i] / 255) * 2 - 1;
    }
    // 词袋统计:对每个 word hash 取 mod,累加
    const words = safeText.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
    for (const word of words) {
      const wh = createHash('md5').update(word).digest();
      const idx = wh[0] % this.EMBEDDING_DIM;
      vec[idx] += 1;
    }
    // L2 归一化
    const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
    return vec.map((x) => x / norm);
  }

  // ── Indexing ──

  /**
   * 索引文档:chunks + embedding
   */
  indexDocument(input: {
    sourcePath: string;
    content: string;
    kind: DocumentChunk['metadata']['kind'];
    tags?: string[];
  }): EmbeddedChunk[] {
    const start = Date.now();
    const chunks = this.chunkDocument(input);
    const embedded: EmbeddedChunk[] = [];
    for (const chunk of chunks) {
      const ec: EmbeddedChunk = {
        ...chunk,
        embedding: this.embed(chunk.content),
        embeddingDim: this.EMBEDDING_DIM,
      };
      this.chunks.set(ec.id, ec);
      embedded.push(ec);
    }
    this.logger.log(
      `[index] ${input.sourcePath}: ${chunks.length} chunks, ${Date.now() - start}ms`,
    );
    return embedded;
  }

  // ── Query (semantic search) ──

  /**
   * 语义查询:cosine similarity 排序
   */
  query(input: { query: string; topK?: number; kindFilter?: string; minScore?: number }): QueryResponse {
    const start = Date.now();
    const queryVec = this.embed(input.query);
    const topK = input.topK ?? 5;
    const minScore = input.minScore ?? 0;

    let candidates = Array.from(this.chunks.values());
    if (input.kindFilter) {
      candidates = candidates.filter((c) => c.metadata.kind === input.kindFilter);
    }

    const scored = candidates
      .map((c) => ({
        chunk: c,
        score: this.cosineSimilarity(queryVec, c.embedding),
      }))
      .filter((x) => x.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return {
      query: input.query,
      results: scored,
      totalCandidates: candidates.length,
      durationMs: Date.now() - start,
    };
  }

  // ── List / Stats ──

  /** 列出所有已索引的 chunks */
  listDocuments(): EmbeddedChunk[] {
    return Array.from(this.chunks.values());
  }

  getStats(): IndexerStats {
    const all = Array.from(this.chunks.values());
    const byKind: Record<string, number> = {};
    let totalSize = 0;
    for (const c of all) {
      const k = c.metadata.kind ?? 'unknown';
      byKind[k] = (byKind[k] ?? 0) + 1;
      totalSize += c.tokenCount;
    }
    return {
      totalDocuments: new Set(all.map((c) => c.sourcePath)).size,
      totalChunks: all.length,
      averageChunkSize: all.length > 0 ? Math.round(totalSize / all.length) : 0,
      byKind,
      indexBuildDurationMs: 0,
    };
  }

  // ── Internals ──

  private estimateTokens(text: string): number {
    // 简化估算:英文按 word count,中文按字符数 / 1.5
    const cjkChars = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
    const words = text.split(/\s+/).filter((w) => /[a-zA-Z0-9]/.test(w)).length;
    return Math.ceil(cjkChars / 1.5) + words;
  }

  private generateChunkId(sourcePath: string, index: number): string {
    const hash = createHash('md5').update(`${sourcePath}:${index}`).digest('hex').slice(0, 8);
    return `chunk-${hash}`;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
  }

  resetForTests(): void {
    this.chunks.clear();
  }
}
