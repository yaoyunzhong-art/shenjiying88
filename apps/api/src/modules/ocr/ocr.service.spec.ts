/**
 * 🐜 自动: [ocr] [A] service.spec — ≥18项正反例+边界
 *
 * 纯函数式内联，不 import 生产代码。
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ─── 内联类型 ──────────────────────────────────────────────────────────────────

type OcrStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
type OcrEngine = 'mock-paddleocr' | 'mock-tesseract' | 'mock-azure' | 'mock-gcp' | 'mock-textract' | 'mock-baidu'
type ParserEngine = 'mock-pdfplumber' | 'mock-python-docx' | 'mock-openpyxl' | 'mock-pptx-parser' | 'mock-papaparse'
type DocFormat = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'csv' | 'txt'

interface OcrTask {
  id: string; tenantId: string; sourceAssetId: string; filename: string
  engine: OcrEngine; language: string; status: OcrStatus; progress: number
  durationMs?: number; linkedEntity?: string; requestedBy: string
  enableLayoutAnalysis: boolean; enableTableDetection: boolean
  summary?: { pageCount: number; totalChars: number; avgConfidence: number; languageDetected: string }
  createdAt: string; updatedAt: string
}

interface OcrBlock {
  id: string; taskId: string; tenantId: string; page: number
  blockType: string; text: string
  bbox: { x: number; y: number; width: number; height: number }
  confidence: number; order: number; createdAt: string
}

interface Document {
  id: string; tenantId: string; sourceAssetId: string; filename: string; format: DocFormat
  parser: ParserEngine; status: string; pageCount: number; charCount: number
  parseDurationMs: number; contentText: string
  metadata: { title: string; keywords: string[]; fileSize: number }
  structuredData: { tables: Array<{ page: number; order: number; headers: string[]; rows: string[][] }>; lists: Array<{ page: number; order: number; items: string[] }> }
  createdAt: string; updatedAt: string
}

interface OcrStats {
  totalTasks: number; completedTasks: number; failedTasks: number
  totalDocuments: number; totalChars: number; totalPages: number
  byEngine: Record<string, number>; byFormat: Record<string, number>
  avgConfidence: number; avgParseTimeMs: number
}

// ─── 引擎元数据 ────────────────────────────────────────────────────────────────

const OCR_ENGINE_INFO = [
  { type: 'mock-paddleocr', category: 'ocr', displayName: 'Mock PaddleOCR', languages: ['zh-CN', 'en', 'auto'], avgTimePerPageMs: 200, freeQuotaPerMonth: 10000, unitPriceCny: 0.01 },
  { type: 'mock-tesseract', category: 'ocr', displayName: 'Mock Tesseract', languages: ['en', 'auto'], avgTimePerPageMs: 300, freeQuotaPerMonth: 10000, unitPriceCny: 0.01 },
  { type: 'mock-pdfplumber', category: 'parser', displayName: 'Mock PDFPlumber', formats: ['pdf'], avgTimePerPageMs: 150, freeQuotaPerMonth: 5000, unitPriceCny: 0.02 },
  { type: 'mock-python-docx', category: 'parser', displayName: 'Mock python-docx', formats: ['docx'], avgTimePerPageMs: 100, freeQuotaPerMonth: 5000, unitPriceCny: 0.02 },
  { type: 'mock-openpyxl', category: 'parser', displayName: 'Mock openpyxl', formats: ['xlsx'], avgTimePerPageMs: 120, freeQuotaPerMonth: 3000, unitPriceCny: 0.03 },
  { type: 'mock-papaparse', category: 'parser', displayName: 'Mock PapaParse', formats: ['csv'], avgTimePerPageMs: 50, freeQuotaPerMonth: 10000, unitPriceCny: 0.01 },
]

// ─── 内联 OCR Service ─────────────────────────────────────────────────────────

class InlineOcrService {
  private tasks = new Map<string, OcrTask>()
  private blocks = new Map<string, OcrBlock>()
  private taskBlocks = new Map<string, Set<string>>()
  private documents = new Map<string, Document>()
  private quotas = new Map<string, number>()
  private blockIdCounter = 0

  private nextId(pfx: string): string { return `${pfx}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
  private nextBlockId(): string { this.blockIdCounter++; return `blk-${this.blockIdCounter}` }

  createOcrTask(sourceAssetId: string, engine?: OcrEngine, language = 'auto', tenantId = 't-001', userId = 'system', enableLayout = false, enableTable = false): OcrTask {
    const eng = engine ?? 'mock-paddleocr'
    const info = OCR_ENGINE_INFO.find(e => e.type === eng && e.category === 'ocr')
    if (!info) throw new Error(`OCR 引擎 ${eng} 不存在`)
    if (info.languages && !info.languages.includes(language) && language !== 'auto') throw new Error(`引擎 ${eng} 不支持语言 ${language}`)

    const quotaKey = `${tenantId}::${eng}`
    const used = this.quotas.get(quotaKey) ?? 0
    if (info.freeQuotaPerMonth !== Infinity && used >= info.freeQuotaPerMonth) throw new Error(`引擎 ${eng} 配额已用完`)

    const now = new Date().toISOString()
    const task: OcrTask = {
      id: this.nextId('ocr'), tenantId, sourceAssetId, filename: `asset-${sourceAssetId}.jpg`,
      engine: eng, language, status: 'processing', progress: 0.1, enableLayoutAnalysis: enableLayout, enableTableDetection: enableTable,
      linkedEntity: undefined, requestedBy: userId, createdAt: now, updatedAt: now,
    }
    this.tasks.set(task.id, task)

    // 模拟 blocks
    const pageCount = 1 + Math.floor(Math.random() * 2)
    const sampleTexts = language === 'zh-CN' ? ['欢迎使用', '营业收入 ¥1,234,567'] : ['Welcome', 'Revenue $1,234,567']
    const blocks: OcrBlock[] = []
    for (let p = 1; p <= pageCount; p++) {
      for (let i = 0; i < sampleTexts.length; i++) {
        const block: OcrBlock = {
          id: this.nextBlockId(), taskId: task.id, tenantId, page: p,
          blockType: i === 0 ? 'title' : 'text', text: sampleTexts[i] ?? '',
          bbox: { x: 100 + i * 20, y: 100 + i * 30, width: 400, height: 30 },
          confidence: 0.85 + Math.random() * 0.15, order: i, createdAt: now,
        }
        this.blocks.set(block.id, block)
        if (!this.taskBlocks.has(task.id)) this.taskBlocks.set(task.id, new Set())
        this.taskBlocks.get(task.id)!.add(block.id)
        blocks.push(block)
      }
    }

    task.durationMs = info.avgTimePerPageMs * pageCount
    task.status = 'completed'
    task.progress = 1.0
    task.summary = {
      pageCount, totalChars: blocks.reduce((s, b) => s + b.text.length, 0),
      avgConfidence: blocks.reduce((s, b) => s + b.confidence, 0) / blocks.length,
      languageDetected: language === 'auto' ? 'zh-CN' : language,
    }
    task.updatedAt = new Date().toISOString()
    this.quotas.set(quotaKey, used + pageCount)
    return task
  }

  getTask(taskId: string): OcrTask | undefined { return this.tasks.get(taskId) }

  listTasks(status?: string, engine?: string): OcrTask[] {
    let result = Array.from(this.tasks.values())
    if (status) result = result.filter(t => t.status === status)
    if (engine) result = result.filter(t => t.engine === engine)
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  cancelTask(taskId: string): OcrTask {
    const task = this.tasks.get(taskId)
    if (!task) throw new Error(`OCR 任务 ${taskId} 不存在`)
    if (task.status === 'completed' || task.status === 'failed') throw new Error(`任务已是终态 ${task.status}, 不可取消`)
    task.status = 'cancelled'
    task.updatedAt = new Date().toISOString()
    return task
  }

  deleteTask(taskId: string): void {
    const task = this.tasks.get(taskId)
    if (!task) throw new Error(`OCR 任务 ${taskId} 不存在`)
    this.tasks.delete(taskId)
    const ids = this.taskBlocks.get(taskId)
    if (ids) { for (const bid of ids) this.blocks.delete(bid); this.taskBlocks.delete(taskId) }
  }

  listBlocks(taskId: string): OcrBlock[] {
    const ids = this.taskBlocks.get(taskId)
    if (!ids) return []
    return Array.from(ids).map(id => this.blocks.get(id)).filter(Boolean).sort((a, b) => a!.page - b!.page || a!.order - b!.order) as OcrBlock[]
  }

  parseDocument(sourceAssetId: string, format: DocFormat = 'pdf', parser?: ParserEngine, tenantId = 't-001', userId = 'system'): Document {
    const pars = parser ?? 'mock-pdfplumber'
    const info = OCR_ENGINE_INFO.find(e => e.type === pars && e.category === 'parser')
    if (!info) throw new Error(`解析器 ${pars} 不存在`)

    const now = new Date().toISOString()
    const sampleText = format === 'pdf'
      ? '# 财务\n\n| 项目 | 金额 |\n|-----|------|\n| 营业收入 | ¥1,234,567 |\n| 净利润 | ¥234,567 |'
      : format === 'csv' ? 'name,age\n张三,28\n李四,32' : `文件示例 ${format}`
    const pageCount = format === 'xlsx' || format === 'csv' ? 1 : 1 + Math.floor(Math.random() * 2)
    const tables: Document['structuredData']['tables'] = []
    if (format === 'pdf' || format === 'csv') {
      tables.push({
        page: 1, order: 1,
        headers: format === 'pdf' ? ['项目', '金额'] : ['name', 'age'],
        rows: format === 'pdf' ? [['营业收入', '¥1,234,567'], ['净利润', '¥234,567']] : [['张三', '28'], ['李四', '32']],
      })
    }
    const doc: Document = {
      id: this.nextId('doc'), tenantId, sourceAssetId, filename: `asset-${sourceAssetId}.${format}`,
      format, parser: pars, status: 'parsed', pageCount, charCount: sampleText.length,
      parseDurationMs: info.avgTimePerPageMs * pageCount, contentText: sampleText,
      metadata: { title: `文档 ${sourceAssetId}`, keywords: sampleText.slice(0, 20).split(' '), fileSize: 1024 * 1024 },
      structuredData: { tables, lists: [] },
      createdAt: now, updatedAt: now,
    }
    this.documents.set(doc.id, doc)
    return doc
  }

  getDocument(docId: string): Document | undefined { return this.documents.get(docId) }

  listDocuments(format?: string): Document[] {
    let result = Array.from(this.documents.values())
    if (format) result = result.filter(d => d.format === format)
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  deleteDocument(docId: string): void {
    if (!this.documents.has(docId)) throw new Error(`文档 ${docId} 不存在`)
    this.documents.delete(docId)
  }

  listEngines(): Array<{ type: string; category: string; displayName: string }> {
    return OCR_ENGINE_INFO.map(e => ({ type: e.type, category: e.category, displayName: e.displayName }))
  }

  getStats(): OcrStats {
    const tasks = Array.from(this.tasks.values())
    const docs = Array.from(this.documents.values())
    const completed = tasks.filter(t => t.status === 'completed').length
    const failed = tasks.filter(t => t.status === 'failed').length
    const byEngine: Record<string, number> = {}
    const byFormat: Record<string, number> = {}
    for (const t of tasks) byEngine[t.engine] = (byEngine[t.engine] ?? 0) + 1
    for (const d of docs) byFormat[d.format] = (byFormat[d.format] ?? 0) + 1
    const allBlocks: OcrBlock[] = []
    for (const t of tasks) { const ids = this.taskBlocks.get(t.id); if (ids) for (const bid of ids) { const b = this.blocks.get(bid); if (b) allBlocks.push(b) } }
    const avgConf = allBlocks.length > 0 ? allBlocks.reduce((s, b) => s + b.confidence, 0) / allBlocks.length : 0
    const parsed = docs.filter(d => d.status === 'parsed')
    const avgParse = parsed.length > 0 ? parsed.reduce((s, d) => s + d.parseDurationMs, 0) / parsed.length : 0
    return {
      totalTasks: tasks.length, completedTasks: completed, failedTasks: failed,
      totalDocuments: docs.length, totalChars: docs.reduce((s, d) => s + d.charCount, 0),
      totalPages: docs.reduce((s, d) => s + d.pageCount, 0),
      byEngine, byFormat, avgConfidence: avgConf, avgParseTimeMs: avgParse,
    }
  }

  reset(): void {
    this.tasks.clear(); this.blocks.clear(); this.taskBlocks.clear()
    this.documents.clear(); this.quotas.clear(); this.blockIdCounter = 0
  }

  countTasks(): number { return this.tasks.size }
  countDocuments(): number { return this.documents.size }
  countBlocks(): number { return this.blocks.size }
}

// ─── 测试: OcrService ────────────────────────────────────────────────────────

describe('OcrService [inline]', () => {
  let svc: InlineOcrService

  beforeEach(() => { svc = new InlineOcrService() })

  // ── 1. createOcrTask ──
  it('createOcrTask 返回 completed 任务', () => {
    const task = svc.createOcrTask('asset-001')
    expect(task.status).toBe('completed')
    expect(task.engine).toBe('mock-paddleocr')
    expect(task.summary).toBeDefined()
    expect(task.summary!.pageCount).toBeGreaterThanOrEqual(1)
  })

  it('createOcrTask 指定引擎参数', () => {
    const task = svc.createOcrTask('asset-002', 'mock-tesseract', 'en')
    expect(task.engine).toBe('mock-tesseract')
    expect(task.language).toBe('en')
  })

  it('createOcrTask 不存在的引擎抛错', () => {
    expect(() => svc.createOcrTask('x', 'mock-nonexistent' as any)).toThrow(/不存在/)
  })

  it('createOcrTask 不支持语言抛错', () => {
    expect(() => svc.createOcrTask('x', 'mock-tesseract', 'zh-CN')).toThrow(/不支持/)
  })

  it('createOcrTask 布局/表格检测参数', () => {
    const task = svc.createOcrTask('asset-lt', undefined, 'auto', 't-001', 'system', true, true)
    expect(task.enableLayoutAnalysis).toBe(true)
    expect(task.enableTableDetection).toBe(true)
  })

  // ── 2. getTask / listTasks ──
  it('getTask 返回已存在任务', () => {
    const task = svc.createOcrTask('a-gt')
    expect(svc.getTask(task.id)).toBeDefined()
  })

  it('getTask 不存在返回 undefined', () => {
    expect(svc.getTask('nonexistent')).toBeUndefined()
  })

  it('listTasks 按状态过滤', () => {
    svc.createOcrTask('a-l1')
    const result = svc.listTasks('completed')
    expect(result.every(t => t.status === 'completed')).toBe(true)
  })

  it('listTasks 按引擎过滤', () => {
    svc.createOcrTask('a-le', 'mock-tesseract')
    const result = svc.listTasks(undefined, 'mock-tesseract')
    expect(result.every(t => t.engine === 'mock-tesseract')).toBe(true)
  })

  // ── 3. cancelTask / deleteTask ──
  it('cancelTask 终态抛错', () => {
    const task = svc.createOcrTask('a-c1')
    expect(() => svc.cancelTask(task.id)).toThrow(/终态/)
  })

  it('cancelTask 不存在抛错', () => {
    expect(() => svc.cancelTask('nonexistent')).toThrow(/不存在/)
  })

  it('deleteTask 删除成功', () => {
    const task = svc.createOcrTask('a-del')
    svc.deleteTask(task.id)
    expect(svc.countTasks()).toBe(0)
  })

  // ── 4. listBlocks ──
  it('listBlocks 返回关联块', () => {
    const task = svc.createOcrTask('a-blk')
    const blocks = svc.listBlocks(task.id)
    expect(blocks.length).toBeGreaterThan(0)
    expect(blocks[0]).toHaveProperty('blockType')
    expect(blocks[0]).toHaveProperty('confidence')
  })

  it('listBlocks 空任务返回 []', () => {
    expect(svc.listBlocks('nonexistent')).toEqual([])
  })

  // ── 5. parseDocument ──
  it('parseDocument 解析 PDF', () => {
    const doc = svc.parseDocument('report.pdf', 'pdf')
    expect(doc.format).toBe('pdf')
    expect(doc.status).toBe('parsed')
    expect(doc.structuredData.tables.length).toBeGreaterThan(0)
  })

  it('parseDocument 解析 CSV', () => {
    const doc = svc.parseDocument('data.csv', 'csv', 'mock-papaparse')
    expect(doc.format).toBe('csv')
    expect(doc.parser).toBe('mock-papaparse')
  })

  it('parseDocument 不存在的解析器抛错', () => {
    expect(() => svc.parseDocument('x.pdf', 'pdf', 'mock-nonexistent' as any)).toThrow(/不存在/)
  })

  // ── 6. getDocument / listDocuments ──
  it('getDocument 返回已存在文档', () => {
    const doc = svc.parseDocument('r.pdf', 'pdf')
    expect(svc.getDocument(doc.id)).toBeDefined()
  })

  it('getDocument 不存在返回 undefined', () => {
    expect(svc.getDocument('nonexistent')).toBeUndefined()
  })

  it('listDocuments 按格式过滤', () => {
    svc.parseDocument('r1.pdf', 'pdf'); svc.parseDocument('r2.csv', 'csv')
    const pdfs = svc.listDocuments('pdf')
    expect(pdfs.every(d => d.format === 'pdf')).toBe(true)
  })

  // ── 7. deleteDocument ──
  it('deleteDocument 删除文档', () => {
    const doc = svc.parseDocument('d.pdf', 'pdf')
    svc.deleteDocument(doc.id)
    expect(svc.countDocuments()).toBe(0)
  })

  it('deleteDocument 不存在抛错', () => {
    expect(() => svc.deleteDocument('nonexistent')).toThrow(/不存在/)
  })

  // ── 8. listEngines ──
  it('listEngines 返回所有引擎', () => {
    const engines = svc.listEngines()
    expect(engines.length).toBeGreaterThanOrEqual(6)
    expect(engines.find(e => e.type === 'mock-paddleocr')!.category).toBe('ocr')
  })

  // ── 9. getStats ──
  it('getStats 统计正确', () => {
    svc.createOcrTask('s1'); svc.createOcrTask('s2')
    svc.parseDocument('s3.pdf', 'pdf')
    const stats = svc.getStats()
    expect(stats.totalTasks).toBe(2)
    expect(stats.completedTasks).toBe(2)
    expect(stats.totalDocuments).toBe(1)
    expect(stats.byEngine['mock-paddleocr']).toBe(2)
  })

  it('getStats 空返回零值', () => {
    const stats = svc.getStats()
    expect(stats.totalTasks).toBe(0)
    expect(stats.avgConfidence).toBe(0)
    expect(stats.avgParseTimeMs).toBe(0)
  })

  // ── 10. reset ──
  it('reset 清除所有状态', () => {
    svc.createOcrTask('r1'); svc.parseDocument('r2.pdf', 'pdf')
    svc.reset()
    expect(svc.countTasks()).toBe(0)
    expect(svc.countDocuments()).toBe(0)
    expect(svc.countBlocks()).toBe(0)
  })
})
