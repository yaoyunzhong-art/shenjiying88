/**
 * knowledge.service.ts — 知识库业务逻辑层
 *
 * 职责:
 * - 文档 CRUD 管理 + 元数据存储
 * - 检索 + 补全建议
 * - 上层的缓存/去重/权限校验入口
 *
 * 依赖: KnowledgeIndexerService (索引/语义搜索)
 */

import { Injectable, Logger } from '@nestjs/common'
import { KnowledgeIndexerService } from './knowledge-indexer.service'
import type {
  KnowledgeDocument,
  KnowledgeKind,
  DocumentChunk,
} from './knowledge.entity'
import { KNOWLEDGE_KINDS } from './knowledge.entity'
import type {
  IndexDocumentDto,
  QueryKnowledgeResponseDto,
  KnowledgeStatsDto,
  KnowledgeDocumentDto,
  KnowledgeSuggestionDto,
} from './knowledge.dto'

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name)

  /** 文档存储 (id → 元数据) */
  private readonly documents = new Map<string, KnowledgeDocument>()

  constructor(private readonly indexer: KnowledgeIndexerService) {}

  // ── 文档索引 ──

  /** 索引一份文档并保存元数据 */
  indexDocument(input: IndexDocumentDto): { chunks: number; documentId: string } {
    const embedded = this.indexer.indexDocument({
      sourcePath: input.sourcePath,
      content: input.content,
      kind: (input.kind ?? 'doc') as DocumentChunk['metadata']['kind'],
      tags: input.tags,
    })

    const documentId = `doc-${embedded[0]?.id ?? crypto.randomUUID().slice(0, 8)}`

    // 合并同路径文档 (幂等更新)
    const existing = Array.from(this.documents.values()).find(
      (d) => d.sourcePath === input.sourcePath,
    )
    if (existing) {
      this.documents.set(existing.id, {
        ...existing,
        content: input.content,
        chunkCount: embedded.length,
        updatedAt: new Date().toISOString(),
      })
      return { chunks: embedded.length, documentId: existing.id }
    }

    const doc: KnowledgeDocument = {
      id: documentId,
      sourcePath: input.sourcePath,
      title: this.extractTitle(input.content, input.sourcePath),
      kind: (input.kind ?? 'doc') as KnowledgeKind,
      tags: input.tags ?? [],
      content: input.content,
      chunkCount: embedded.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.documents.set(documentId, doc)
    this.logger.log(`[index] ${input.sourcePath} → ${embedded.length} chunks (${documentId})`)
    return { chunks: embedded.length, documentId }
  }

  // ── 语义查询 ──

  /** 执行语义查询 */
  query(input: {
    query: string
    topK?: number
    kindFilter?: string
    minScore?: number
  }): QueryKnowledgeResponseDto {
    const raw = this.indexer.query(input)
    return {
      query: raw.query,
      results: raw.results.map((r) => ({
        id: r.chunk.id,
        sourcePath: r.chunk.sourcePath,
        content: r.chunk.content,
        score: r.score,
        kind: r.chunk.metadata.kind,
        section: r.chunk.metadata.section,
      })),
      totalCandidates: raw.totalCandidates,
      durationMs: raw.durationMs,
    }
  }

  // ── 补全建议 ──

  /**
   * 基于已索引的知识生成补全建议
   * 策略: 查询后取 topK 结果,提取标题/摘要
   */
  getSuggestions(input: {
    query: string
    maxSuggestions?: number
  }): KnowledgeSuggestionDto[] {
    const k = input.maxSuggestions ?? 3
    const raw = this.indexer.query({ query: input.query, topK: k })
    return raw.results.map((r) => ({
      sourcePath: r.chunk.sourcePath,
      title: r.chunk.metadata.title ?? r.chunk.sourcePath,
      snippet: r.chunk.content.slice(0, 120),
      score: r.score,
    }))
  }

  // ── 文档查询 ──

  /** 列出所有已索引文档 */
  listDocuments(): KnowledgeDocumentDto[] {
    return Array.from(this.documents.values()).map((d) => ({
      id: d.id,
      sourcePath: d.sourcePath,
      title: d.title,
      kind: d.kind as KnowledgeKind,
      tags: d.tags,
      chunkCount: d.chunkCount,
      createdAt: d.createdAt,
    }))
  }

  /** 获取单个文档详情 */
  getDocument(id: string): KnowledgeDocumentDto | null {
    const doc = this.documents.get(id)
    if (!doc) return null
    return {
      id: doc.id,
      sourcePath: doc.sourcePath,
      title: doc.title,
      kind: doc.kind as KnowledgeKind,
      tags: doc.tags,
      chunkCount: doc.chunkCount,
      createdAt: doc.createdAt,
    }
  }

  /** 按 sourcePath 查找文档 */
  findBySourcePath(sourcePath: string): KnowledgeDocumentDto | null {
    const doc = Array.from(this.documents.values()).find(
      (d) => d.sourcePath === sourcePath,
    )
    if (!doc) return null
    return {
      id: doc.id,
      sourcePath: doc.sourcePath,
      title: doc.title,
      kind: doc.kind as KnowledgeKind,
      tags: doc.tags,
      chunkCount: doc.chunkCount,
      createdAt: doc.createdAt,
    }
  }

  /** 按 kind 过滤文档 */
  listByKind(kind: KnowledgeKind): KnowledgeDocumentDto[] {
    return this.listDocuments().filter((d) => d.kind === kind)
  }

  // ── 统计 ──

  /** 获取索引统计 */
  getStats(): KnowledgeStatsDto {
    return this.indexer.getStats()
  }

  // ── 删除/重置 ──

  /** 删除文档 (包含索引) */
  deleteDocument(id: string): boolean {
    if (!this.documents.has(id)) return false
    this.documents.delete(id)
    // 注意: IndexerService 没有逐文档删除 API (V1 全量)
    // V2 接入持久化后可精确删除
    return true
  }

  /** 重置所有数据 (测试辅助) */
  reset(): void {
    this.documents.clear()
    this.indexer.resetForTests()
  }

  /** 校验 kind 合法性 */
  isValidKind(kind: string): kind is KnowledgeKind {
    return (KNOWLEDGE_KINDS as readonly string[]).includes(kind)
  }

  // ── 内部 ──

  private extractTitle(content: string, sourcePath: string): string {
    // 取首个 # 标题,否则回退到 sourcePath
    const match = content.match(/^#\s+(.+)$/m)
    return match?.[1]?.trim() ?? sourcePath
  }
}
