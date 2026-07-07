/**
 * Phase 100 OCR + 文档解析 Service (V11 Sprint 3 Day 33)
 *
 * 核心能力:
 * 1. OCR 任务 (Tesseract / PaddleOCR / Azure CV / GCP / Textract / Baidu)
 * 2. 文档解析 (pdfplumber / pdfminer / docx / xlsx / pptx / csv)
 * 3. OCR 文本块 (含 bbox + 置信度)
 * 4. 结构化数据提取 (表格 + 列表)
 * 5. 引擎元数据查询 + 统计
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { requireTenantContext } from '../../common/context/tenant-context'
import {
  OcrTask,
  OcrBlock,
  Document,
  ParserEngineType,
  DocumentFormat,
  generateOcrTaskId,
  generateOcrBlockId,
  generateDocumentId,
  OCR_ENGINE_INFO,
  averageConfidence,
  extractKeywords,
} from './ocr.entity'
import type {
  CreateOcrTaskDto,
  ParseDocumentDto,
  ListOcrTasksQuery,
  ListDocumentsQuery,
  OcrTaskResponse,
  OcrBlockResponse,
  DocumentResponse,
  OcrStatsResponse,
} from './ocr.dto'

@Injectable()
export class OcrService {
  /** task storage */
  private readonly tasks = new Map<string, OcrTask>()
  /** tenantId → taskIds */
  private readonly tasksByTenant = new Map<string, Set<string>>()
  /** sourceAssetId → taskIds */
  private readonly tasksByAsset = new Map<string, Set<string>>()

  /** OCR 文本块 */
  private readonly blocks = new Map<string, OcrBlock>()
  /** taskId → blockIds */
  private readonly blocksByTask = new Map<string, Set<string>>()

  /** 文档解析 */
  private readonly documents = new Map<string, Document>()
  /** tenantId → docIds */
  private readonly documentsByTenant = new Map<string, Set<string>>()
  /** sourceAssetId → docIds */
  private readonly documentsByAsset = new Map<string, Set<string>>()

  /** 引擎配额 (tenantId + engine → used) */
  private readonly quotaUsed = new Map<string, number>()

  // ============ 1. OCR 任务 ============

  async createOcrTask(dto: CreateOcrTaskDto): Promise<OcrTask> {
    const ctx = requireTenantContext()
    const engine = dto.engine ?? 'mock-paddleocr'
    const language = dto.language ?? 'auto'
    // 引擎支持校验
    const engineInfo = OCR_ENGINE_INFO.find((e) => e.type === engine && e.category === 'ocr')
    if (!engineInfo) {
      throw new BadRequestException(`OCR 引擎 ${engine} 不存在`)
    }
    if (engineInfo.languages && !engineInfo.languages.includes(language) && language !== 'auto') {
      throw new BadRequestException(`引擎 ${engine} 不支持语言 ${language}`)
    }
    // 配额检查
    const quotaKey = `${ctx.tenantId}::${engine}`
    const used = this.quotaUsed.get(quotaKey) ?? 0
    if (engineInfo.freeQuotaPerMonth !== Infinity && used >= engineInfo.freeQuotaPerMonth) {
      throw new BadRequestException(`引擎 ${engine} 配额已用完 (${engineInfo.freeQuotaPerMonth}/月)`)
    }
    // 创建任务
    const now = new Date().toISOString()
    const task: OcrTask = {
      id: generateOcrTaskId(),
      tenantId: ctx.tenantId,
      sourceAssetId: dto.sourceAssetId,
      filename: `asset-${dto.sourceAssetId}.jpg`,
      engine,
      language,
      enableLayoutAnalysis: dto.enableLayoutAnalysis ?? false,
      enableTableDetection: dto.enableTableDetection ?? false,
      status: 'processing',
      progress: 0.1,
      requestedBy: ctx.userId ?? 'system',
      linkedEntity: dto.linkedEntity,
      createdAt: now,
      updatedAt: now,
    }
    this.tasks.set(task.id, task)
    this.addTaskToIndexes(task)

    // 模拟同步处理 (生产用异步队列)
    const start = Date.now()
    const pageCount = 1 + Math.floor(Math.random() * 3) // 1-3 页
    const fakeBlocks: OcrBlock[] = []
    const sampleTexts = language === 'zh-CN'
      ? ['欢迎使用审计云平台', '营业收入 ¥1,234,567', '净利润 ¥234,567']
      : ['Welcome to Audit Cloud', 'Revenue $1,234,567', 'Net Profit $234,567']
    for (let p = 1; p <= pageCount; p++) {
      for (let i = 0; i < sampleTexts.length; i++) {
        const block: OcrBlock = {
          id: generateOcrBlockId(),
          taskId: task.id,
          tenantId: ctx.tenantId,
          page: p,
          blockType: i === 0 ? 'title' : 'text',
          text: sampleTexts[i] ?? '',
          bbox: { x: 100 + i * 20, y: 100 + i * 30, width: 400, height: 30 },
          confidence: 0.85 + Math.random() * 0.15,
          order: i,
          createdAt: new Date().toISOString(),
        }
        this.blocks.set(block.id, block)
        if (!this.blocksByTask.has(task.id)) this.blocksByTask.set(task.id, new Set())
        this.blocksByTask.get(task.id)!.add(block.id)
        fakeBlocks.push(block)
      }
    }
    const durationMs = Date.now() - start + engineInfo.avgTimePerPageMs * pageCount
    task.durationMs = durationMs
    task.status = 'completed'
    task.progress = 1.0
    task.summary = {
      pageCount,
      totalChars: fakeBlocks.reduce((s: number, b: OcrBlock) => s + b.text.length, 0),
      avgConfidence: averageConfidence(fakeBlocks),
      languageDetected: language === 'auto' ? 'zh-CN' : language,
    }
    task.updatedAt = new Date().toISOString()
    this.quotaUsed.set(quotaKey, used + pageCount)
    return task
  }

  async getOcrTask(taskId: string): Promise<OcrTaskResponse> {
    const ctx = requireTenantContext()
    const task = await this.getTaskRaw(taskId, ctx.tenantId)
    return this.toTaskResponse(task)
  }

  async listOcrTasks(query: ListOcrTasksQuery = {}): Promise<OcrTaskResponse[]> {
    const ctx = requireTenantContext()
    const all: OcrTask[] = Array.from(this.tasksByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.tasks.get(id))
      .filter((t): t is OcrTask => t != null)
    let filtered = all
    if (query.status) filtered = filtered.filter((t) => t.status === query.status)
    if (query.engine) filtered = filtered.filter((t) => t.engine === query.engine)
    if (query.language) filtered = filtered.filter((t) => t.language === query.language)
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const limit = query.limit ?? 50
    return filtered.slice(0, limit).map((t) => this.toTaskResponse(t))
  }

  async cancelOcrTask(taskId: string): Promise<OcrTask> {
    const ctx = requireTenantContext()
    const task = await this.getTaskRaw(taskId, ctx.tenantId)
    if (task.status === 'completed' || task.status === 'failed') {
      throw new BadRequestException(`任务已是终态 ${task.status}, 不可取消`)
    }
    task.status = 'cancelled'
    task.updatedAt = new Date().toISOString()
    return task
  }

  async deleteOcrTask(taskId: string): Promise<void> {
    const ctx = requireTenantContext()
    const task = await this.getTaskRaw(taskId, ctx.tenantId)
    this.tasks.delete(task.id)
    this.tasksByTenant.get(ctx.tenantId)?.delete(task.id)
    this.tasksByAsset.get(task.sourceAssetId)?.delete(task.id)
    // 清理 blocks
    const blockIds = this.blocksByTask.get(taskId) ?? new Set<string>()
    for (const bid of blockIds) {
      this.blocks.delete(bid)
    }
    this.blocksByTask.delete(taskId)
  }

  // ============ 2. OCR 文本块 ============

  async listOcrBlocks(taskId: string): Promise<OcrBlockResponse[]> {
    const ctx = requireTenantContext()
    await this.getTaskRaw(taskId, ctx.tenantId)
    const ids = this.blocksByTask.get(taskId) ?? new Set<string>()
    return Array.from(ids)
      .map((id: string) => this.blocks.get(id))
      .filter((b): b is OcrBlock => b != null)
      .sort((a, b) => a.page - b.page || a.order - b.order)
      .map((b) => ({
        id: b.id,
        taskId: b.taskId,
        page: b.page,
        blockType: b.blockType,
        text: b.text,
        bbox: b.bbox,
        confidence: b.confidence,
        order: b.order,
        createdAt: b.createdAt,
      }))
  }

  // ============ 3. 文档解析 ============

  async parseDocument(dto: ParseDocumentDto): Promise<Document> {
    const ctx = requireTenantContext()
    const parser = dto.parser ?? this.guessParser(dto.sourceAssetId)
    const parserInfo = OCR_ENGINE_INFO.find((e) => e.type === parser && e.category === 'parser')
    if (!parserInfo) {
      throw new BadRequestException(`解析器 ${parser} 不存在`)
    }
    const format = this.guessFormat(dto.sourceAssetId)
    const now = new Date().toISOString()
    const pageCount = format === 'xlsx' || format === 'csv' ? 1 : 1 + Math.floor(Math.random() * 5)
    const sampleText = format === 'pdf'
      ? `# 财务报表\n\n| 项目 | 金额 |\n|------|------|\n| 营业收入 | ¥1,234,567 |\n| 净利润 | ¥234,567 |`
      : format === 'csv'
      ? `name,age,city\n张三,28,北京\n李四,32,上海`
      : format === 'xlsx'
      ? `产品,数量,价格\nSKU-001,100,¥99.00\nSKU-002,50,¥199.00`
      : `这是一份 ${format} 文档示例内容。`
    const structuredTables: Document['structuredData']['tables'] = []
    if (format === 'pdf' || format === 'xlsx' || format === 'csv') {
      structuredTables.push({
        page: 1,
        order: 1,
        headers: format === 'pdf' ? ['项目', '金额'] : format === 'csv' ? ['name', 'age', 'city'] : ['产品', '数量', '价格'],
        rows: format === 'pdf'
          ? [['营业收入', '¥1,234,567'], ['净利润', '¥234,567']]
          : format === 'csv'
          ? [['张三', '28', '北京'], ['李四', '32', '上海']]
          : [['SKU-001', '100', '¥99.00'], ['SKU-002', '50', '¥199.00']],
      })
    }
    const start = Date.now()
    const doc: Document = {
      id: generateDocumentId(),
      tenantId: ctx.tenantId,
      sourceAssetId: dto.sourceAssetId,
      filename: `asset-${dto.sourceAssetId}.${format}`,
      format,
      parser,
      status: 'parsed',
      pageCount,
      charCount: sampleText.length,
      parseDurationMs: Date.now() - start + parserInfo.avgTimePerPageMs * pageCount,
      contentText: sampleText,
      metadata: {
        title: `文档 ${dto.sourceAssetId}`,
        keywords: extractKeywords(sampleText, 5),
        fileSize: 1024 * 1024,
      },
      structuredData: {
        tables: structuredTables,
        lists: format === 'docx' ? [{ page: 1, order: 1, items: ['项目一', '项目二', '项目三'] }] : [],
      },
      parsedBy: ctx.userId ?? 'system',
      createdAt: now,
      updatedAt: now,
    }
    this.documents.set(doc.id, doc)
    if (!this.documentsByTenant.has(ctx.tenantId)) this.documentsByTenant.set(ctx.tenantId, new Set())
    this.documentsByTenant.get(ctx.tenantId)!.add(doc.id)
    if (!this.documentsByAsset.has(dto.sourceAssetId)) this.documentsByAsset.set(dto.sourceAssetId, new Set())
    this.documentsByAsset.get(dto.sourceAssetId)!.add(doc.id)
    return doc
  }

  async getDocument(docId: string): Promise<Document> {
    const ctx = requireTenantContext()
    return await this.getDocumentRaw(docId, ctx.tenantId)
  }

  async listDocuments(query: ListDocumentsQuery = {}): Promise<DocumentResponse[]> {
    const ctx = requireTenantContext()
    const all: Document[] = Array.from(this.documentsByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.documents.get(id))
      .filter((d): d is Document => d != null)
    let filtered = all
    if (query.format) filtered = filtered.filter((d) => d.format === query.format)
    if (query.parser) filtered = filtered.filter((d) => d.parser === query.parser)
    if (query.status) filtered = filtered.filter((d) => d.status === query.status)
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const limit = query.limit ?? 50
    return filtered.slice(0, limit).map((d) => this.toDocumentResponse(d))
  }

  async deleteDocument(docId: string): Promise<void> {
    const ctx = requireTenantContext()
    const doc = await this.getDocumentRaw(docId, ctx.tenantId)
    this.documents.delete(doc.id)
    this.documentsByTenant.get(ctx.tenantId)?.delete(doc.id)
    this.documentsByAsset.get(doc.sourceAssetId)?.delete(doc.id)
  }

  // ============ 4. 引擎元数据 ============

  listEngines(): Array<{
    type: string
    category: string
    displayName: string
    languages?: string[]
    formats?: string[]
    avgTimePerPageMs: number
    freeQuotaPerMonth: number
    unitPriceCny: number
  }> {
    return OCR_ENGINE_INFO.map((e) => ({
      type: e.type,
      category: e.category,
      displayName: e.displayName,
      languages: e.languages,
      formats: e.formats,
      avgTimePerPageMs: e.avgTimePerPageMs,
      freeQuotaPerMonth: e.freeQuotaPerMonth,
      unitPriceCny: e.unitPriceCny,
    }))
  }

  // ============ 5. 统计 ============

  async getOcrStats(): Promise<OcrStatsResponse> {
    const ctx = requireTenantContext()
    const tasks: OcrTask[] = Array.from(this.tasksByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.tasks.get(id))
      .filter((t): t is OcrTask => t != null)
    const docs: Document[] = Array.from(this.documentsByTenant.get(ctx.tenantId) ?? new Set<string>())
      .map((id: string) => this.documents.get(id))
      .filter((d): d is Document => d != null)

    const completedTasks = tasks.filter((t) => t.status === 'completed').length
    const failedTasks = tasks.filter((t) => t.status === 'failed').length
    const totalChars = docs.reduce((s: number, d: Document) => s + d.charCount, 0)
    const totalPages = docs.reduce((s: number, d: Document) => s + d.pageCount, 0)
    const byEngine: Record<string, number> = {}
    for (const t of tasks) {
      byEngine[t.engine] = (byEngine[t.engine] ?? 0) + 1
    }
    const byFormat: Record<string, number> = {}
    for (const d of docs) {
      byFormat[d.format] = (byFormat[d.format] ?? 0) + 1
    }
    const allBlocks: OcrBlock[] = []
    for (const t of tasks) {
      const bids = this.blocksByTask.get(t.id) ?? new Set<string>()
      for (const bid of bids) {
        const b = this.blocks.get(bid)
        if (b) allBlocks.push(b)
      }
    }
    const avgConfidence = averageConfidence(allBlocks)
    const parsedDocs = docs.filter((d) => d.status === 'parsed')
    const avgParseTimeMs = parsedDocs.length > 0
      ? parsedDocs.reduce((s: number, d: Document) => s + (d.parseDurationMs ?? 0), 0) / parsedDocs.length
      : 0

    return {
      totalTasks: tasks.length,
      completedTasks,
      failedTasks,
      totalDocuments: docs.length,
      totalChars,
      totalPages,
      byEngine,
      byFormat,
      avgConfidence,
      avgParseTimeMs,
    }
  }

  // ============ 工具方法 ============

  countTasks(): number { return this.tasks.size }
  countDocuments(): number { return this.documents.size }
  countBlocks(): number { return this.blocks.size }

  // ============ Helpers ============

  private async getTaskRaw(taskId: string, tenantId: string): Promise<OcrTask> {
    const task = this.tasks.get(taskId)
    if (!task || task.tenantId !== tenantId) {
      throw new NotFoundException(`OCR 任务 ${taskId} 不存在`)
    }
    return task
  }

  private async getDocumentRaw(docId: string, tenantId: string): Promise<Document> {
    const doc = this.documents.get(docId)
    if (!doc || doc.tenantId !== tenantId) {
      throw new NotFoundException(`文档 ${docId} 不存在`)
    }
    return doc
  }

  private addTaskToIndexes(task: OcrTask): void {
    if (!this.tasksByTenant.has(task.tenantId)) this.tasksByTenant.set(task.tenantId, new Set())
    this.tasksByTenant.get(task.tenantId)!.add(task.id)
    if (!this.tasksByAsset.has(task.sourceAssetId)) this.tasksByAsset.set(task.sourceAssetId, new Set())
    this.tasksByAsset.get(task.sourceAssetId)!.add(task.id)
  }

  private guessParser(assetId: string): ParserEngineType {
    // 实际: 从 assetId 提取 .ext 或基于 mime
    if (assetId.endsWith('pdf') || assetId.includes('pdf')) return 'mock-pdfplumber'
    if (assetId.endsWith('docx')) return 'mock-python-docx'
    if (assetId.endsWith('xlsx')) return 'mock-openpyxl'
    if (assetId.endsWith('pptx')) return 'mock-pptx-parser'
    if (assetId.endsWith('csv')) return 'mock-papaparse'
    return 'mock-pdfplumber'
  }

  private guessFormat(assetId: string): DocumentFormat {
    if (assetId.includes('pdf')) return 'pdf'
    if (assetId.endsWith('docx')) return 'docx'
    if (assetId.endsWith('xlsx')) return 'xlsx'
    if (assetId.endsWith('pptx')) return 'pptx'
    if (assetId.endsWith('csv')) return 'csv'
    return 'txt'
  }

  private toTaskResponse(t: OcrTask): OcrTaskResponse {
    return {
      id: t.id,
      tenantId: t.tenantId,
      sourceAssetId: t.sourceAssetId,
      filename: t.filename,
      engine: t.engine,
      language: t.language,
      enableLayoutAnalysis: t.enableLayoutAnalysis,
      enableTableDetection: t.enableTableDetection,
      status: t.status,
      progress: t.progress,
      durationMs: t.durationMs,
      summary: t.summary,
      errorMessage: t.errorMessage,
      blockCount: this.blocksByTask.get(t.id)?.size ?? 0,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }
  }

  private toDocumentResponse(d: Document): DocumentResponse {
    return {
      id: d.id,
      tenantId: d.tenantId,
      sourceAssetId: d.sourceAssetId,
      filename: d.filename,
      format: d.format,
      parser: d.parser,
      status: d.status,
      pageCount: d.pageCount,
      charCount: d.charCount,
      parseDurationMs: d.parseDurationMs,
      metadata: d.metadata,
      tableCount: d.structuredData.tables.length,
      listCount: d.structuredData.lists.length,
      previewText: d.contentText.slice(0, 200),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }
  }
}