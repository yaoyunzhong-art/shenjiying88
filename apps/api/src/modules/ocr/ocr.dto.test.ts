import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ocr] [A] dto.test 补全
 *
 * 覆盖 OCR DTO 全量类型合同与边界：
 * - CreateOcrTaskDto, ParseDocumentDto
 * - ListOcrTasksQuery, ListDocumentsQuery
 * - OcrTaskResponse, OcrBlockResponse, DocumentResponse
 * - OcrStatsResponse
 */

import assert from 'node:assert/strict'
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

// ── CreateOcrTaskDto ─────────────────────────────────────────────
describe('ocr.dto: CreateOcrTaskDto', () => {
  it('creates valid DTO with required fields only', () => {
    const dto: CreateOcrTaskDto = {
      sourceAssetId: 'asset-001',
    }

    assert.equal(dto.sourceAssetId, 'asset-001')
    assert.equal(dto.engine, undefined)
    assert.equal(dto.language, undefined)
    assert.equal(dto.linkedEntity, undefined)
    assert.equal(dto.enableLayoutAnalysis, undefined)
    assert.equal(dto.enableTableDetection, undefined)
  })

  it('creates DTO with all optional fields', () => {
    const dto: CreateOcrTaskDto = {
      sourceAssetId: 'asset-002',
      engine: 'mock-azure-cv',
      language: 'en-US',
      enableLayoutAnalysis: true,
      enableTableDetection: true,
      linkedEntity: {
        entityType: 'receipt',
        entityId: 'receipt-001',
      },
    }

    assert.equal(dto.engine, 'mock-azure-cv')
    assert.equal(dto.language, 'en-US')
    assert.equal(dto.enableTableDetection, true)
    assert.equal(dto.linkedEntity!.entityType, 'receipt')
  })

  it('supports all engine types', () => {
    const engines: CreateOcrTaskDto['engine'][] = [
      'mock-tesseract', 'mock-paddleocr', 'mock-azure-cv',
      'mock-gcp-vision', 'mock-aws-textract', 'mock-baidu-ocr',
    ]
    for (const e of engines) {
      const dto: CreateOcrTaskDto = { sourceAssetId: 'a1', engine: e }
      assert.ok(dto.engine === e)
    }
  })

  it('supports all language options', () => {
    const languages: CreateOcrTaskDto['language'][] = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'auto', 'mixed']
    for (const lang of languages) {
      const dto: CreateOcrTaskDto = { sourceAssetId: 'a1', language: lang }
      assert.equal(dto.language, lang)
    }
  })

  it('supports all linked entity types', () => {
    const types: NonNullable<CreateOcrTaskDto['linkedEntity']>['entityType'][] = [
      'product', 'order', 'member', 'report', 'receipt', 'contract', 'other',
    ]
    for (const et of types) {
      const dto: CreateOcrTaskDto = {
        sourceAssetId: 'a1',
        linkedEntity: { entityType: et, entityId: 'id-1' },
      }
      assert.equal(dto.linkedEntity!.entityType, et)
    }
  })

  it('linkedEntity can be undefined', () => {
    const dto: CreateOcrTaskDto = { sourceAssetId: 'a1' }
    assert.equal(dto.linkedEntity, undefined)
  })
})

// ── ParseDocumentDto ─────────────────────────────────────────────
describe('ocr.dto: ParseDocumentDto', () => {
  it('creates DTO with required fields only', () => {
    const dto: ParseDocumentDto = {
      sourceAssetId: 'asset-001',
    }
    assert.equal(dto.sourceAssetId, 'asset-001')
    assert.equal(dto.parser, undefined)
    assert.equal(dto.extractTables, undefined)
    assert.equal(dto.extractImages, undefined)
  })

  it('creates DTO with all optional fields', () => {
    const dto: ParseDocumentDto = {
      sourceAssetId: 'asset-002',
      parser: 'mock-pdfplumber',
      extractTables: true,
      extractImages: false,
    }
    assert.equal(dto.parser, 'mock-pdfplumber')
    assert.equal(dto.extractTables, true)
    assert.equal(dto.extractImages, false)
  })

  it('supports all parser engine types', () => {
    const parsers: ParseDocumentDto['parser'][] = [
      'mock-pdfplumber', 'mock-pdfminer', 'mock-python-docx',
      'mock-openpyxl', 'mock-pptx-parser', 'mock-papaparse',
    ]
    for (const p of parsers) {
      const dto: ParseDocumentDto = { sourceAssetId: 'a1', parser: p }
      assert.equal(dto.parser, p)
    }
  })
})

// ── ListOcrTasksQuery ────────────────────────────────────────────
describe('ocr.dto: ListOcrTasksQuery', () => {
  it('creates empty query (all optional)', () => {
    const query: ListOcrTasksQuery = {}
    assert.equal(query.status, undefined)
    assert.equal(query.engine, undefined)
    assert.equal(query.language, undefined)
    assert.equal(query.limit, undefined)
  })

  it('creates query with all filters', () => {
    const query: ListOcrTasksQuery = {
      status: 'completed',
      engine: 'mock-tesseract',
      language: 'zh-CN',
      limit: 20,
    }
    assert.equal(query.status, 'completed')
    assert.equal(query.engine, 'mock-tesseract')
    assert.equal(query.limit, 20)
  })

  it('status supports all OcrStatus values', () => {
    const statuses: ListOcrTasksQuery['status'][] = ['pending', 'processing', 'completed', 'failed', 'cancelled']
    for (const s of statuses) {
      const q: ListOcrTasksQuery = { status: s }
      assert.equal(q.status, s)
    }
  })

  it('limit defaults to 50 in service, accepts 0', () => {
    const q: ListOcrTasksQuery = { limit: 0 }
    assert.equal(q.limit, 0)
  })
})

// ── ListDocumentsQuery ───────────────────────────────────────────
describe('ocr.dto: ListDocumentsQuery', () => {
  it('creates empty query', () => {
    const query: ListDocumentsQuery = {}
    assert.equal(query.format, undefined)
    assert.equal(query.parser, undefined)
    assert.equal(query.status, undefined)
    assert.equal(query.limit, undefined)
  })

  it('creates query with all filters', () => {
    const query: ListDocumentsQuery = {
      format: 'pdf',
      parser: 'mock-pdfplumber',
      status: 'parsed',
      limit: 10,
    }
    assert.equal(query.format, 'pdf')
    assert.equal(query.parser, 'mock-pdfplumber')
    assert.equal(query.status, 'parsed')
  })

  it('status supports all DocumentStatus values', () => {
    const statuses: ListDocumentsQuery['status'][] = ['pending', 'parsing', 'parsed', 'failed']
    for (const s of statuses) {
      const q: ListDocumentsQuery = { status: s }
      assert.equal(q.status, s)
    }
  })

  it('supports all document formats', () => {
    const formats: ListDocumentsQuery['format'][] = ['pdf', 'docx', 'xlsx', 'pptx', 'csv', 'txt', 'rtf', 'md']
    for (const f of formats) {
      const q: ListDocumentsQuery = { format: f }
      assert.equal(q.format, f)
    }
  })
})

// ── OcrTaskResponse ──────────────────────────────────────────────
describe('ocr.dto: OcrTaskResponse', () => {
  it('creates response with all fields for completed task', () => {
    const resp: OcrTaskResponse = {
      id: 'ocr-task-001',
      tenantId: 'tenant-1',
      sourceAssetId: 'asset-001',
      filename: 'invoice.pdf',
      engine: 'mock-tesseract',
      language: 'zh-CN',
      enableLayoutAnalysis: true,
      enableTableDetection: true,
      status: 'completed',
      progress: 1,
      durationMs: 1200,
      summary: {
        pageCount: 3,
        totalChars: 4500,
        avgConfidence: 0.95,
        languageDetected: 'zh-CN',
      },
      errorMessage: undefined,
      blockCount: 15,
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:01:00.000Z',
    }

    assert.equal(resp.blockCount, 15)
    assert.equal(resp.summary!.avgConfidence, 0.95)
    assert.equal(resp.errorMessage, undefined)
  })

  it('creates response for failed task with errorMessage', () => {
    const resp: OcrTaskResponse = {
      id: 'ocr-task-fail',
      tenantId: 'tenant-1',
      sourceAssetId: 'asset-999',
      filename: 'broken.pdf',
      engine: 'mock-tesseract',
      language: 'en-US',
      enableLayoutAnalysis: false,
      enableTableDetection: false,
      status: 'failed',
      progress: 0.3,
      durationMs: 500,
      blockCount: 0,
      errorMessage: 'Image processing failed',
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:00:00.000Z',
    }

    assert.equal(resp.status, 'failed')
    assert.ok(resp.errorMessage!.length > 0)
    assert.equal(resp.blockCount, 0)
  })

  it('response for pending task without summary/duration', () => {
    const resp: OcrTaskResponse = {
      id: 'ocr-task-pending',
      tenantId: 'tenant-1',
      sourceAssetId: 'asset-003',
      filename: 'scan.png',
      engine: 'mock-paddleocr',
      language: 'auto',
      enableLayoutAnalysis: false,
      enableTableDetection: false,
      status: 'pending',
      progress: 0,
      blockCount: 0,
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:00:00.000Z',
    }

    assert.equal(resp.summary, undefined)
    assert.equal(resp.durationMs, undefined)
    assert.equal(resp.progress, 0)
  })
})

// ── OcrBlockResponse ─────────────────────────────────────────────
describe('ocr.dto: OcrBlockResponse', () => {
  it('creates valid block response', () => {
    const resp: OcrBlockResponse = {
      id: 'blk-001',
      taskId: 'ocr-task-001',
      page: 1,
      blockType: 'text',
      text: 'Revenue $1,234,567',
      bbox: { x: 100, y: 100, width: 400, height: 30 },
      confidence: 0.97,
      order: 0,
      createdAt: '2026-06-29T00:00:00.000Z',
    }

    assert.equal(resp.id, 'blk-001')
    assert.equal(resp.page, 1)
    assert.equal(resp.blockType, 'text')
    assert.equal(resp.confidence, 0.97)
    assert.equal(resp.order, 0)
  })

  it('block type supports all variants', () => {
    const types: OcrBlockResponse['blockType'][] = [
      'text', 'title', 'table', 'figure', 'header', 'footer', 'list_item',
    ]
    for (const bt of types) {
      const resp: OcrBlockResponse = {
        id: `blk-${bt}`,
        taskId: 't1',
        page: 1,
        blockType: bt,
        text: 'content',
        bbox: { x: 0, y: 0, width: 100, height: 20 },
        confidence: 0.9,
        order: 0,
        createdAt: '',
      }
      assert.equal(resp.blockType, bt)
    }
  })
})

// ── DocumentResponse ─────────────────────────────────────────────
describe('ocr.dto: DocumentResponse', () => {
  it('creates valid document response with all fields', () => {
    const resp: DocumentResponse = {
      id: 'doc-001',
      tenantId: 'tenant-1',
      sourceAssetId: 'asset-001',
      filename: 'report.pdf',
      format: 'pdf',
      parser: 'mock-pdfplumber',
      status: 'parsed',
      pageCount: 5,
      charCount: 12000,
      parseDurationMs: 1500,
      metadata: { title: 'Report' },
      tableCount: 3,
      listCount: 1,
      previewText: '# Financial Report...',
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:01:00.000Z',
    }

    assert.equal(resp.format, 'pdf')
    assert.equal(resp.tableCount, 3)
    assert.equal(resp.listCount, 1)
    assert.equal(resp.previewText.slice(0, 5), '# Fin')
  })

  it('document response supports all formats', () => {
    const formats: DocumentResponse['format'][] = ['pdf', 'docx', 'xlsx', 'pptx', 'csv', 'txt', 'rtf', 'md']
    for (const f of formats) {
      const resp: DocumentResponse = {
        id: `doc-${f}`,
        tenantId: 't1',
        sourceAssetId: 'a1',
        filename: `file.${f}`,
        format: f,
        parser: 'mock-pdfplumber',
        status: 'parsed',
        pageCount: 1,
        charCount: 100,
        metadata: {},
        tableCount: 0,
        listCount: 0,
        previewText: 'content',
        createdAt: '',
        updatedAt: '',
      }
      assert.equal(resp.format, f)
    }
  })

  it('document response with zero counts', () => {
    const resp: DocumentResponse = {
      id: 'doc-txt',
      tenantId: 't1',
      sourceAssetId: 'a1',
      filename: 'note.txt',
      format: 'txt',
      parser: 'mock-pdfplumber',
      status: 'parsed',
      pageCount: 1,
      charCount: 50,
      metadata: {},
      tableCount: 0,
      listCount: 0,
      previewText: 'hello world',
      createdAt: '',
      updatedAt: '',
    }
    assert.equal(resp.tableCount, 0)
    assert.equal(resp.listCount, 0)
  })
})

// ── OcrStatsResponse ─────────────────────────────────────────────
describe('ocr.dto: OcrStatsResponse', () => {
  it('creates valid stats response', () => {
    const stats: OcrStatsResponse = {
      totalTasks: 100,
      completedTasks: 70,
      failedTasks: 10,
      totalDocuments: 50,
      totalChars: 500000,
      totalPages: 200,
      byEngine: {
        'mock-tesseract': 50,
        'mock-paddleocr': 30,
        'mock-azure-cv': 20,
      },
      byFormat: {
        'pdf': 30,
        'csv': 10,
        'docx': 10,
      },
      avgConfidence: 0.89,
      avgParseTimeMs: 350,
    }

    assert.equal(stats.totalTasks, 100)
    assert.equal(stats.completedTasks + stats.failedTasks, 80)
    assert.equal(stats.totalChars, 500000)
    assert.equal(stats.avgConfidence, 0.89)
    assert.equal(stats.byEngine['mock-tesseract'], 50)
    assert.equal(stats.byFormat['pdf'], 30)
  })

  it('stats with zero values', () => {
    const stats: OcrStatsResponse = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      totalDocuments: 0,
      totalChars: 0,
      totalPages: 0,
      byEngine: {},
      byFormat: {},
      avgConfidence: 0,
      avgParseTimeMs: 0,
    }

    assert.equal(stats.totalTasks, 0)
    assert.deepEqual(stats.byEngine, {})
    assert.equal(stats.avgConfidence, 0)
  })

  it('byEngine keys are engine type strings', () => {
    const stats: OcrStatsResponse = {
      totalTasks: 60,
      completedTasks: 50,
      failedTasks: 5,
      totalDocuments: 30,
      totalChars: 300000,
      totalPages: 120,
      byEngine: { 'mock-tesseract': 30, 'mock-paddleocr': 20, 'mock-azure-cv': 10 },
      byFormat: { 'pdf': 20, 'csv': 10 },
      avgConfidence: 0.85,
      avgParseTimeMs: 400,
    }

    const engineKeys = Object.keys(stats.byEngine)
    assert.ok(engineKeys.every(k => k.startsWith('mock-')))
  })

  it('totalTasks >= completedTasks + failedTasks', () => {
    const stats: OcrStatsResponse = {
      totalTasks: 100,
      completedTasks: 60,
      failedTasks: 15,
      totalDocuments: 50,
      totalChars: 0,
      totalPages: 0,
      byEngine: {},
      byFormat: {},
      avgConfidence: 0,
      avgParseTimeMs: 0,
    }
    assert.ok(stats.totalTasks >= stats.completedTasks + stats.failedTasks)
  })
})
