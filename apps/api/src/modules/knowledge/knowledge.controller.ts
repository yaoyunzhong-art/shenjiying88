/**
 * knowledge.controller.ts — 知识库 API
 *
 * 路由: /knowledge
 * 依赖: KnowledgeService (业务封装) + KnowledgeIndexerService (底层索引)
 */

import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common'
import { KnowledgeService } from './knowledge.service'
import type {
  IndexDocumentDto,
  QueryKnowledgeDto,
  QueryKnowledgeResponseDto,
  KnowledgeStatsDto,
  KnowledgeDocumentDto,
  KnowledgeCompletionDto,
  KnowledgeSuggestionDto,
} from './knowledge.dto'
import type { KnowledgeKind } from './knowledge.entity'
import { KnowledgeErrorCodes } from './knowledge.contract'

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  /** 索引一份文档 */
  @Post('index')
  indexDocument(@Body() dto: IndexDocumentDto): { chunks: number; documentId: string } {
    return this.knowledgeService.indexDocument(dto)
  }

  /** 语义查询 */
  @Post('query')
  query(@Body() dto: QueryKnowledgeDto): QueryKnowledgeResponseDto {
    return this.knowledgeService.query({
      query: dto.query,
      topK: dto.topK ?? 5,
      kindFilter: dto.kindFilter,
      minScore: dto.minScore,
    })
  }

  /** 获取补全建议 */
  @Post('suggest')
  suggest(@Body() dto: KnowledgeCompletionDto): KnowledgeSuggestionDto[] {
    return this.knowledgeService.getSuggestions({
      query: dto.query,
      maxSuggestions: dto.maxSuggestions,
    })
  }

  /** 获取索引统计 */
  @Get('stats')
  getStats(): KnowledgeStatsDto {
    return this.knowledgeService.getStats()
  }

  /** 列出已索引文档列表 */
  @Get('documents')
  listDocuments(): KnowledgeDocumentDto[] {
    return this.knowledgeService.listDocuments()
  }

  /** 按 kind 过滤文档列表 */
  @Get('documents/by-kind/:kind')
  listDocumentsByKind(@Param('kind') kind: string): KnowledgeDocumentDto[] | { error: string; code: string } {
    if (!this.knowledgeService.isValidKind(kind)) {
      return { error: `invalid kind: ${kind}`, code: KnowledgeErrorCodes.INVALID_KIND }
    }
    return this.knowledgeService.listByKind(kind as KnowledgeKind)
  }

  /** 获取单个文档详情 */
  @Get('documents/:id')
  getDocument(@Param('id') id: string): KnowledgeDocumentDto | { error: string; code: string } {
    const doc = this.knowledgeService.getDocument(id)
    if (!doc) {
      return { error: `document ${id} not found`, code: KnowledgeErrorCodes.DOCUMENT_NOT_FOUND }
    }
    return doc
  }

  /** 删除文档 */
  @Delete('documents/:id')
  deleteDocument(@Param('id') id: string): { ok: boolean } {
    return { ok: this.knowledgeService.deleteDocument(id) }
  }

  /** 重置索引 (测试辅助) */
  @Post('reset')
  resetIndex(): { ok: true } {
    this.knowledgeService.reset()
    return { ok: true }
  }
}

/** 测试辅助: 清空状态 */
export function resetKnowledgeControllerState(): void {
  // 测试由 KnowledgeController 使用重置后 clean service
}
