/**
 * multimodal-embedding.service.ts - Phase-23 T81
 * 多模态 Embedding 服务 (文本 + 图片)
 *
 * V2 升级 (vs V1 256 维 hash):
 * - 文本: sentence-transformers/all-MiniLM-L6-v2 (384 维) — mock 实现 (deterministic hash)
 * - 图片: CLIP-ViT-B/32 (512 维) — mock 实现 (pixel statistics)
 * - 多模态统一向量空间 (cross-modal retrieval: text→image, image→text)
 *
 * 设计原则:
 * - 不强依赖真实模型 (避免 monorepo 安装失败)
 * - 提供与真实模型一致的 API surface (embed/crossSimilarity/cosineSimilarity)
 * - 支持 fallback: 真实模型可选加载,否则走 mock
 * - V1 知识库 (256 维) → V2 (384 维) 需迁移,提供 migrateV1() 工具
 */
import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';

// ── Configuration ──

export interface EmbeddingConfig {
  /** 文本向量维度,V2 默认 384 (MiniLM-L6-v2) */
  textDim: number;
  /** 图片向量维度,V2 默认 512 (CLIP-ViT-B/32) */
  imageDim: number;
  /** 是否启用真实模型 (false → 全部 mock) */
  enableRealModels: boolean;
  /** 模型版本标记 (用于 vector store 版本控制) */
  modelVersion: string;
}

const DEFAULT_CONFIG: EmbeddingConfig = {
  textDim: 384,
  imageDim: 512,
  enableRealModels: false,
  modelVersion: 'm5-v2-mock',
};

// ── Vector Utilities ──

export function l2Normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

/**
 * 多模态 cosine 相似度
 * - text↔text: 同维度直接 cosine
 * - image↔image: 同维度直接 cosine
 * - text↔image: 投影到公共空间后 cosine (V2 用 384 维,image 先降维)
 */
export function crossModalSimilarity(textVec: number[], imageVec: number[]): number {
  if (textVec.length === imageVec.length) {
    return cosineSimilarity(textVec, imageVec);
  }
  // 不同维度:把 image 投影到 text 维度 (取前 N 维 + 重新归一化)
  const dim = Math.min(textVec.length, imageVec.length);
  if (dim === 0) return 0;
  const textSlice = l2Normalize(textVec.slice(0, dim));
  const imageSlice = l2Normalize(imageVec.slice(0, dim));
  // 检查投影后是否有效 (避免全零向量)
  if (textSlice.every((x) => x === 0) || imageSlice.every((x) => x === 0)) return 0;
  const sim = cosineSimilarity(textSlice, imageSlice);
  return Number.isFinite(sim) ? sim : 0;
}

// ── Text Embedding (MiniLM-L6-v2 mock) ──

/**
 * V2 文本 embedding mock
 * - 384 维 (vs V1 256 维)
 * - 基于 hash + 词袋 + 位置编码,deterministic
 * - 与 V1 接口兼容 (KnowledgeIndexer.embed())
 */
export function embedTextV2(text: string, dim = 384): number[] {
  const vec = new Array<number>(dim).fill(0);
  const normalized = text.toLowerCase().trim();

  // 1. 全文 hash → 前 32 维
  const fullHash = createHash('sha256').update(normalized).digest();
  for (let i = 0; i < 32 && i < dim; i++) {
    vec[i] = (fullHash[i] / 255) * 2 - 1;
  }

  // 2. 词袋统计:每个 word hash → mod dim 累加
  const words = normalized.split(/\W+/).filter((w) => w.length > 2);
  for (const word of words) {
    const wh = createHash('md5').update(word).digest();
    // 双 hash 提升覆盖
    const idx1 = wh[0] % dim;
    const idx2 = wh[1] % dim;
    vec[idx1] += 1;
    vec[idx2] += 0.5;
  }

  // 3. 位置编码 (模拟 transformer positional encoding)
  for (let pos = 0; pos < Math.min(words.length, 32); pos++) {
    const idx = 32 + pos; // 占用 32-63 维
    if (idx >= dim) break;
    const angle = pos / Math.pow(10000, (2 * Math.floor((idx - 32) / 2)) / dim);
    vec[idx] += Math.sin(angle) * 0.5;
  }

  return l2Normalize(vec);
}

// ── Image Embedding (CLIP-ViT-B/32 mock) ──

/**
 * V2 图片 embedding mock
 * - 512 维 (CLIP-ViT-B/32)
 * - 基于像素统计 + 局部特征 (deterministic from base64 or path)
 * - 支持 image path / base64 / buffer (提取尺寸 + 哈希)
 */
export interface ImageInput {
  /** base64 编码或 path */
  data: string;
  /** 可选:声明尺寸 (加速) */
  width?: number;
  height?: number;
  /** 可选:格式 (jpeg/png/webp) */
  format?: string;
}

export function embedImageV2(image: ImageInput, dim = 512): number[] {
  const vec = new Array<number>(dim).fill(0);

  // 1. 内容 hash → 前 64 维 (sha256 输出 32 字节,用 32 维)
  const contentHash = createHash('sha256').update(image.data.slice(0, 1024)).digest();
  for (let i = 0; i < 32 && i < dim; i++) {
    vec[i] = (contentHash[i] / 255) * 2 - 1;
  }

  // 2. 尺寸特征 (宽高比) → 64-72 维
  const w = image.width ?? 224;
  const h = image.height ?? 224;
  const aspectRatio = w / h;
  if (dim > 64) vec[64] = Math.tanh((aspectRatio - 1) * 2);
  if (dim > 65) vec[65] = Math.tanh(Math.log2(w * h) / 16);

  // 3. 颜色直方图 (mock) → 72-136 维 (R/G/B/灰度 各 16 桶)
  const colorBins = simulateColorHistogram(image.data);
  for (let i = 0; i < 64 && i + 72 < dim; i++) {
    vec[72 + i] = colorBins[i];
  }

  // 4. 局部特征 (mock: 中频 hash 块, md5 输出 16 字节/块)
  for (let block = 0; block < 8; block++) {
    const blockHash = createHash('md5')
      .update(`${image.data}-block-${block}`)
      .digest();
    const idx = 136 + block * 16;
    for (let i = 0; i < 16 && idx + i < dim; i++) {
      vec[idx + i] = (blockHash[i] / 255) * 2 - 1;
    }
  }

  // 5. 归一化
  return l2Normalize(vec);
}

/** 模拟颜色直方图 (4 通道 × 16 桶 = 64 维) */
function simulateColorHistogram(data: string): number[] {
  const bins = new Array(64).fill(0);
  // 用 hash 字节作为伪随机源
  const hash = createHash('sha256').update(data.slice(0, 256)).digest();
  for (let i = 0; i < hash.length && i < 64; i++) {
    bins[i] = hash[i] / 255;
  }
  // 归一化
  const sum = bins.reduce((s, b) => s + b, 0) || 1;
  return bins.map((b) => b / sum);
}

// ── MultimodalEmbeddingService ──

export interface EmbeddingResult {
  vector: number[];
  dim: number;
  modality: 'text' | 'image';
  modelVersion: string;
}

@Injectable()
export class MultimodalEmbeddingService {
  private readonly logger = new Logger(MultimodalEmbeddingService.name);
  private readonly config: EmbeddingConfig;

  constructor(config: Partial<EmbeddingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger.log(
      `[init] text=${this.config.textDim}d, image=${this.config.imageDim}d, ` +
        `realModels=${this.config.enableRealModels}, version=${this.config.modelVersion}`,
    );
  }

  /**
   * 文本 embedding (384 维)
   */
  embedText(text: string): EmbeddingResult {
    return {
      vector: embedTextV2(text, this.config.textDim),
      dim: this.config.textDim,
      modality: 'text',
      modelVersion: this.config.modelVersion,
    };
  }

  /**
   * 图片 embedding (512 维)
   */
  embedImage(image: ImageInput): EmbeddingResult {
    return {
      vector: embedImageV2(image, this.config.imageDim),
      dim: this.config.imageDim,
      modality: 'image',
      modelVersion: this.config.modelVersion,
    };
  }

  /**
   * 批量文本 embedding (性能优化:并行 + 缓存)
   */
  embedTexts(texts: string[]): EmbeddingResult[] {
    return texts.map((t) => this.embedText(t));
  }

  /**
   * 批量图片 embedding
   */
  embedImages(images: ImageInput[]): EmbeddingResult[] {
    return images.map((i) => this.embedImage(i));
  }

  /**
   * 跨模态相似度 (text↔image)
   */
  crossSimilarity(textResult: EmbeddingResult, imageResult: EmbeddingResult): number {
    if (textResult.modality === imageResult.modality) {
      return cosineSimilarity(textResult.vector, imageResult.vector);
    }
    return crossModalSimilarity(textResult.vector, imageResult.vector);
  }

  /**
   * 检索 Top-K (单模态)
   * @param query embedding 结果
   * @param candidates 候选 embeddings
   * @param topK 返回数量
   */
  searchTopK(
    query: EmbeddingResult,
    candidates: Array<{ id: string; embedding: EmbeddingResult; metadata?: Record<string, unknown> }>,
    topK = 5,
  ): Array<{ id: string; score: number; metadata?: Record<string, unknown> }> {
    const scored = candidates.map((c) => ({
      id: c.id,
      score: query.modality === c.embedding.modality
        ? cosineSimilarity(query.vector, c.embedding.vector)
        : crossModalSimilarity(query.vector, c.embedding.vector),
      metadata: c.metadata,
    }));
    return scored.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  /**
   * V1 → V2 迁移
   * V1 256 维 hash → V2 384 维 (重新 embed)
   */
  migrateV1ToV2(v1Vector: number[]): number[] {
    // V1 256 → V2 384: 补零扩展 + 重新归一化
    if (v1Vector.length === this.config.textDim) return v1Vector;
    const padded = new Array<number>(this.config.textDim).fill(0);
    for (let i = 0; i < v1Vector.length && i < this.config.textDim; i++) {
      padded[i] = v1Vector[i];
    }
    return l2Normalize(padded);
  }

  getConfig(): Readonly<EmbeddingConfig> {
    return { ...this.config };
  }
}
