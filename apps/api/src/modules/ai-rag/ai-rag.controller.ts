/**
 * ai-rag.controller.ts - RAG 知识库 REST API 控制器
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Logger,
  HttpCode,
  HttpStatus,
UseGuards,
} from '@nestjs/common'
import { Observable, from, of } from 'rxjs'
import { map, catchError } from 'rxjs/operators'
import {
  KnowledgeBaseManager,
  RAGPipeline,
  SalesScriptGenerator,
} from './ai-rag.service'
import type {
  StoredDocument,
  RagQueryResult,
  RetrievedChunk,
  ChatMessage,
  ToneType,
  ObjectionType,
  CollectionStats,
  CollectionType,
} from './ai-rag.entity'
import type {
  ApiResponseDto,
} from './ai-rag.dto'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('ai-rag')
@UseGuards(TenantGuard)
export class AiRagController {
  private readonly logger = new Logger(AiRagController.name)

  constructor(
    private readonly kb: KnowledgeBaseManager,
    private readonly rag: RAGPipeline,
    private readonly scriptGen: SalesScriptGenerator,
  ) {}

  // ─── 文档 CRUD ─────────────────────────────────────────────

  @Post('documents')
  @HttpCode(HttpStatus.CREATED)
  createDocument(
    @Body() body: { collection: string; content: string; id?: string; title?: string; metadata?: Record<string, unknown> },
  ): Observable<ApiResponseDto<StoredDocument>> {
    try {
      const doc = this.kb.addDocument(body.collection, {
        id: body.id,
        content: body.content,
        metadata: { title: body.title, ...body.metadata },
      })
      return of({ success: true, data: doc })
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建文档失败'
      return of({ success: false, message })
    }
  }

  @Get('documents/:collection')
  listDocuments(
    @Param('collection') collection: string,
  ): Observable<ApiResponseDto<StoredDocument[]>> {
    try {
      const docs = this.kb.listDocuments(collection)
      return of({ success: true, data: docs })
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取文档列表失败'
      return of({ success: false, message })
    }
  }

  @Get('documents/:collection/:docId')
  getDocument(
    @Param('collection') collection: string,
    @Param('docId') docId: string,
  ): Observable<ApiResponseDto<StoredDocument>> {
    const doc = this.kb.getDocument(collection, docId)
    if (!doc) {
      return of({ success: false, message: '文档不存在' })
    }
    return of({ success: true, data: doc })
  }

  @Put('documents/:collection/:docId')
  updateDocument(
    @Param('collection') collection: string,
    @Param('docId') docId: string,
    @Body() body: { content: string; title?: string; metadata?: Record<string, unknown> },
  ): Observable<ApiResponseDto<StoredDocument>> {
    try {
      const updated = this.kb.updateDocument(collection, docId, body.content, {
        title: body.title,
        ...body.metadata,
      })
      if (!updated) {
        return of({ success: false, message: '文档不存在' })
      }
      return of({ success: true, data: updated })
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新文档失败'
      return of({ success: false, message })
    }
  }

  @Delete('documents/:collection/:docId')
  @HttpCode(HttpStatus.OK)
  deleteDocument(
    @Param('collection') collection: string,
    @Param('docId') docId: string,
  ): Observable<ApiResponseDto<void>> {
    const deleted = this.kb.deleteDocument(collection, docId)
    if (!deleted) {
      return of({ success: false, message: '文档不存在' })
    }
    return of({ success: true })
  }

  @Get('documents/:collection/stats')
  getCollectionStats(
    @Param('collection') collection: string,
  ): Observable<ApiResponseDto<CollectionStats>> {
    const stats = this.kb.getCollectionStats(collection)
    return of({ success: true, data: stats })
  }

  // ─── RAG 查询 ──────────────────────────────────────────────

  @Post('query')
  async query(
    @Body() body: { question: string; collection: string; topK?: number },
  ): Promise<ApiResponseDto<RagQueryResult>> {
    try {
      const start = Date.now()
      const result = await this.rag.query(body.question, body.collection)
      const retrievedChunks = this.rag.retrieve(body.question, body.collection, body.topK ?? 5).length

      return {
        success: true,
        data: {
          answer: result.answer,
          sources: result.sources,
          retrievedChunks,
          latencyMs: Date.now() - start,
        },
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'RAG 查询失败'
      return { success: false, message }
    }
  }

  @Post('chat')
  async chat(
    @Body() body: { messages: ChatMessage[]; collection: string },
  ): Promise<ApiResponseDto<{ reply: string; sources: string[] }>> {
    try {
      const result = await this.rag.chat(body.messages, body.collection)
      return { success: true, data: result }
    } catch (error) {
      const message = error instanceof Error ? error.message : '对话失败'
      return { success: false, message }
    }
  }

  @Post('retrieve')
  retrieve(
    @Body() body: { question: string; collection: string; topK?: number },
  ): Observable<ApiResponseDto<RetrievedChunk[]>> {
    try {
      const results = this.rag.retrieve(body.question, body.collection, body.topK ?? 5)
      return of({ success: true, data: results })
    } catch (error) {
      const message = error instanceof Error ? error.message : '检索失败'
      return of({ success: false, message })
    }
  }

  @Get('stats/:collection')
  getRagStats(
    @Param('collection') collection: string,
  ): Observable<ApiResponseDto<{ documents: number; chunks: number }>> {
    const stats = this.rag.getStats(collection)
    return of({ success: true, data: stats })
  }

  // ─── 话术生成 ──────────────────────────────────────────────

  @Post('scripts/product')
  generateProductScript(
    @Body() body: { productId: string; tone?: ToneType },
  ): Observable<ApiResponseDto<string>> {
    try {
      const script = this.scriptGen.generateProductScript(body.productId, body.tone ?? 'professional')
      return of({ success: true, data: script })
    } catch (error) {
      const message = error instanceof Error ? error.message : '话术生成失败'
      return of({ success: false, message })
    }
  }

  @Post('scripts/objection')
  generateObjectionScript(
    @Body() body: { productId: string; objectionType: ObjectionType },
  ): Observable<ApiResponseDto<string>> {
    try {
      const script = this.scriptGen.generateObjectionScript(body.productId, body.objectionType)
      return of({ success: true, data: script })
    } catch (error) {
      const message = error instanceof Error ? error.message : '异议话术生成失败'
      return of({ success: false, message })
    }
  }

  @Post('scripts/follow-up')
  generateFollowUp(
    @Body() body: { customerId: string },
  ): Observable<ApiResponseDto<string>> {
    try {
      const script = this.scriptGen.generateFollowUpScript(body.customerId)
      return of({ success: true, data: script })
    } catch (error) {
      const message = error instanceof Error ? error.message : '跟进话术生成失败'
      return of({ success: false, message })
    }
  }

  @Post('scripts/localize')
  localizeScript(
    @Body() body: { script: string; locale: string },
  ): Observable<ApiResponseDto<string>> {
    try {
      const localized = this.scriptGen.localizeScript(body.script, body.locale)
      return of({ success: true, data: localized })
    } catch (error) {
      const message = error instanceof Error ? error.message : '本地化失败'
      return of({ success: false, message })
    }
  }
}
