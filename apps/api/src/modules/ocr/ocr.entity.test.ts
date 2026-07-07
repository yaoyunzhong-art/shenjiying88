import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ocr] [A] entity.test 补全
 *
 * 覆盖 OcrEntity 全量类型合同：
 * - OcrTask, OcrBlock, Document 接口结构
 * - 工具函数 (generateId, parseBbox, averageConfidence, cleanText, extractKeywords, isStructuredFormat)
 * - 枚举类型 (OcrLanguage, DocumentFormat, OcrEngineType, ParserEngineType)
 * - 引擎元数据 (EngineInfo, OCR_ENGINE_INFO)
 * - 边界测试 (空数据、异常格式、特殊字符)
 */

import assert from 'node:assert/strict'
import {
  OcrTask, OcrBlock, Document, EngineInfo,
  OcrLanguage, DocumentFormat, OcrEngineType, ParserEngineType, OcrStatus, DocumentStatus,
  generateOcrTaskId, generateOcrBlockId, generateDocumentId,
  parseBbox, averageConfidence, cleanText, extractKeywords, isStructuredFormat,
  OCR_ENGINE_INFO,
} from './ocr.entity'

// ── OcrTask type contract ────────────────────────────────────────
describe('ocr.entity: OcrTask', () => {
  it('creates valid OcrTask with all required fields', () => {
    const task: OcrTask = {
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
      requestedBy: 'test-user',
      linkedEntity: { entityType: 'product', entityId: 'prod-001' },
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:01:00.000Z',
    }

    assert.equal(task.id, 'ocr-task-001')
    assert.equal(task.tenantId, 'tenant-1')
    assert.equal(task.engine, 'mock-tesseract')
    assert.equal(task.status, 'completed')
    assert.equal(task.summary!.avgConfidence, 0.95)
    assert.equal(task.linkedEntity!.entityType, 'product')
  })

  it('creates OcrTask without optional linkedEntity and summary', () => {
    const task: OcrTask = {
      id: 'ocr-task-002',
      tenantId: 'tenant-1',
      sourceAssetId: 'asset-002',
      filename: 'photo.jpg',
      engine: 'mock-paddleocr',
      language: 'auto',
      enableLayoutAnalysis: false,
      enableTableDetection: false,
      status: 'pending',
      progress: 0,
      requestedBy: 'system',
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:00:00.000Z',
    }

    assert.equal(task.summary, undefined)
    assert.equal(task.linkedEntity, undefined)
    assert.equal(task.durationMs, undefined)
    assert.equal(task.errorMessage, undefined)
  })

  it('all OcrStatus values are valid', () => {
    const statuses: OcrStatus[] = ['pending', 'processing', 'completed', 'failed', 'cancelled']
    for (const s of statuses) {
      const task: OcrTask = {
        id: `task-${s}`,
        tenantId: 't1',
        sourceAssetId: 'a1',
        filename: 'f.pdf',
        engine: 'mock-tesseract',
        language: 'en-US',
        enableLayoutAnalysis: false,
        enableTableDetection: false,
        status: s,
        progress: s === 'completed' ? 1 : 0,
        requestedBy: 'user',
        createdAt: '2026-06-29T00:00:00.000Z',
        updatedAt: '2026-06-29T00:00:00.000Z',
      }
      assert.ok(['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(task.status))
    }
  })

  it('all OcrLanguage values are valid', () => {
    const languages: OcrLanguage[] = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'auto', 'mixed']
    for (const lang of languages) {
      const task: OcrTask = {
        id: 'task-lang',
        tenantId: 't1',
        sourceAssetId: 'a1',
        filename: 'f.pdf',
        engine: 'mock-tesseract',
        language: lang,
        enableLayoutAnalysis: false,
        enableTableDetection: false,
        status: 'pending',
        progress: 0,
        requestedBy: 'user',
        createdAt: '2026-06-29T00:00:00.000Z',
        updatedAt: '2026-06-29T00:00:00.000Z',
      }
      assert.ok(languages.includes(task.language))
    }
  })

  it('progress is between 0 and 1', () => {
    const boundaries = [0, 0.5, 1.0]
    for (const p of boundaries) {
      const task: OcrTask = {
        id: 'task-progress',
        tenantId: 't1',
        sourceAssetId: 'a1',
        filename: 'f.pdf',
        engine: 'mock-tesseract',
        language: 'zh-CN',
        enableLayoutAnalysis: false,
        enableTableDetection: false,
        status: p === 1 ? 'completed' : 'processing',
        progress: p,
        requestedBy: 'user',
        createdAt: '2026-06-29T00:00:00.000Z',
        updatedAt: '2026-06-29T00:00:00.000Z',
      }
      assert.ok(task.progress >= 0 && task.progress <= 1)
    }
  })

  it('OcrTask with failed status may have errorMessage', () => {
    const task: OcrTask = {
      id: 'ocr-task-fail',
      tenantId: 't1',
      sourceAssetId: 'a1',
      filename: 'broken.pdf',
      engine: 'mock-tesseract',
      language: 'zh-CN',
      enableLayoutAnalysis: false,
      enableTableDetection: false,
      status: 'failed',
      progress: 0.3,
      errorMessage: 'Engine timeout: image too large',
      requestedBy: 'user',
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:00:01.000Z',
    }
    assert.equal(task.status, 'failed')
    assert.ok(task.errorMessage!.length > 0)
  })

  it('linkedEntity supports all entity types', () => {
    const types: Array<'product' | 'order' | 'member' | 'report' | 'receipt' | 'contract' | 'other'> = [
      'product', 'order', 'member', 'report', 'receipt', 'contract', 'other',
    ]
    for (const et of types) {
      const task: OcrTask = {
        id: 'task-linked',
        tenantId: 't1',
        sourceAssetId: 'a1',
        filename: 'f.pdf',
        engine: 'mock-tesseract',
        language: 'en-US',
        enableLayoutAnalysis: false,
        enableTableDetection: false,
        status: 'pending',
        progress: 0,
        requestedBy: 'user',
        linkedEntity: { entityType: et, entityId: `id-${et}` },
        createdAt: '2026-06-29T00:00:00.000Z',
        updatedAt: '2026-06-29T00:00:00.000Z',
      }
      assert.equal(task.linkedEntity!.entityType, et)
    }
  })
})

// ── OcrBlock type contract ───────────────────────────────────────
describe('ocr.entity: OcrBlock', () => {
  it('creates valid OcrBlock with all fields', () => {
    const block: OcrBlock = {
      id: 'blk-001',
      taskId: 'ocr-task-001',
      tenantId: 'tenant-1',
      page: 1,
      blockType: 'text',
      text: 'Revenue $1,234,567',
      bbox: { x: 100, y: 100, width: 400, height: 30 },
      confidence: 0.97,
      order: 0,
      createdAt: '2026-06-29T00:00:00.000Z',
    }

    assert.equal(block.id, 'blk-001')
    assert.equal(block.page, 1)
    assert.equal(block.blockType, 'text')
    assert.equal(block.text, 'Revenue $1,234,567')
    assert.equal(block.bbox.x, 100)
    assert.equal(block.bbox.y, 100)
    assert.equal(block.bbox.width, 400)
    assert.equal(block.bbox.height, 30)
    assert.equal(block.confidence, 0.97)
  })

  it('all blockType values are valid', () => {
    const types: OcrBlock['blockType'][] = ['text', 'title', 'table', 'figure', 'header', 'footer', 'list_item']
    for (const bt of types) {
      const block: OcrBlock = {
        id: 'blk-type',
        taskId: 't1',
        tenantId: 't1',
        page: 1,
        blockType: bt,
        text: 'test',
        bbox: { x: 0, y: 0, width: 100, height: 20 },
        confidence: 0.9,
        order: 0,
        createdAt: '2026-06-29T00:00:00.000Z',
      }
      assert.ok(types.includes(block.blockType))
    }
  })

  it('confidence is between 0 and 1', () => {
    const boundaries = [0, 0.5, 1.0]
    for (const c of boundaries) {
      const block: OcrBlock = {
        id: 'blk-conf',
        taskId: 't1',
        tenantId: 't1',
        page: 1,
        blockType: 'text',
        text: 'test',
        bbox: { x: 0, y: 0, width: 100, height: 20 },
        confidence: c,
        order: 0,
        createdAt: '2026-06-29T00:00:00.000Z',
      }
      assert.ok(block.confidence >= 0 && block.confidence <= 1)
    }
  })

  it('bbox can have zero dimensions', () => {
    const block: OcrBlock = {
      id: 'blk-zero',
      taskId: 't1',
      tenantId: 't1',
      page: 1,
      blockType: 'header',
      text: '',
      bbox: { x: 0, y: 0, width: 0, height: 0 },
      confidence: 0.5,
      order: 99,
      createdAt: '2026-06-29T00:00:00.000Z',
    }
    assert.equal(block.bbox.width, 0)
    assert.equal(block.bbox.height, 0)
  })

  it('order is a non-negative integer', () => {
    const block: OcrBlock = {
      id: 'blk-order',
      taskId: 't1',
      tenantId: 't1',
      page: 1,
      blockType: 'text',
      text: 'ordered',
      bbox: { x: 0, y: 0, width: 100, height: 20 },
      confidence: 0.9,
      order: 5,
      createdAt: '2026-06-29T00:00:00.000Z',
    }
    assert.equal(typeof block.order, 'number')
    assert.equal(block.order, 5)
  })
})

// ── Document type contract ───────────────────────────────────────
describe('ocr.entity: Document', () => {
  it('creates valid Document with all fields', () => {
    const doc: Document = {
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
      contentText: '# Financial Report\n\nRevenue increased 15%.',
      metadata: {
        title: 'Financial Report',
        author: 'finance-team',
        subject: 'Q2 2026',
        keywords: ['revenue', 'profit', 'finance'],
        createdAt: '2026-06-28T00:00:00.000Z',
        modifiedAt: '2026-06-29T00:00:00.000Z',
        pageSize: { width: 595, height: 842 },
        fileSize: 2048576,
      },
      structuredData: {
        tables: [
          {
            page: 1,
            order: 1,
            headers: ['项目', '金额'],
            rows: [['营业收入', '¥1,234,567'], ['净利润', '¥234,567']],
          },
        ],
        lists: [
          { page: 1, order: 2, items: ['Item 1', 'Item 2'] },
        ],
      },
      parsedBy: 'test-user',
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:01:00.000Z',
    }

    assert.equal(doc.id, 'doc-001')
    assert.equal(doc.format, 'pdf')
    assert.equal(doc.status, 'parsed')
    assert.equal(doc.structuredData.tables.length, 1)
    assert.equal(doc.structuredData.lists.length, 1)
    assert.ok(doc.parseDurationMs! > 0)
  })

  it('all DocumentFormat values are valid', () => {
    const formats: DocumentFormat[] = ['pdf', 'docx', 'xlsx', 'pptx', 'csv', 'txt', 'rtf', 'md']
    for (const f of formats) {
      const doc: Document = {
        id: 'doc-fmt',
        tenantId: 't1',
        sourceAssetId: 'a1',
        filename: `file.${f}`,
        format: f,
        parser: 'mock-pdfplumber',
        status: 'parsed',
        pageCount: 1,
        charCount: 100,
        contentText: '',
        metadata: {},
        structuredData: { tables: [], lists: [] },
        parsedBy: 'user',
        createdAt: '2026-06-29T00:00:00.000Z',
        updatedAt: '2026-06-29T00:00:00.000Z',
      }
      assert.ok(formats.includes(doc.format))
    }
  })

  it('all DocumentStatus values are valid', () => {
    const statuses: DocumentStatus[] = ['pending', 'parsing', 'parsed', 'failed']
    for (const s of statuses) {
      const doc: Document = {
        id: 'doc-st',
        tenantId: 't1',
        sourceAssetId: 'a1',
        filename: 'f.pdf',
        format: 'pdf',
        parser: 'mock-pdfplumber',
        status: s,
        pageCount: 0,
        charCount: 0,
        contentText: '',
        metadata: {},
        structuredData: { tables: [], lists: [] },
        parsedBy: 'user',
        createdAt: '2026-06-29T00:00:00.000Z',
        updatedAt: '2026-06-29T00:00:00.000Z',
      }
      assert.ok(statuses.includes(doc.status))
    }
  })

  it('Document with failed status may have errorMessage', () => {
    const doc: Document = {
      id: 'doc-fail',
      tenantId: 't1',
      sourceAssetId: 'a1',
      filename: 'corrupt.pdf',
      format: 'pdf',
      parser: 'mock-pdfplumber',
      status: 'failed',
      pageCount: 0,
      charCount: 0,
      contentText: '',
      metadata: {},
      structuredData: { tables: [], lists: [] },
      errorMessage: 'Failed to parse: invalid PDF structure',
      parsedBy: 'user',
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:00:00.000Z',
    }
    assert.equal(doc.status, 'failed')
    assert.ok(doc.errorMessage!.includes('PDF'))
  })

  it('Document metadata is optional-friendly and can be empty', () => {
    const doc: Document = {
      id: 'doc-min',
      tenantId: 't1',
      sourceAssetId: 'a1',
      filename: 'min.txt',
      format: 'txt',
      parser: 'mock-pdfplumber',
      status: 'parsed',
      pageCount: 1,
      charCount: 50,
      contentText: 'minimal content',
      metadata: {},
      structuredData: { tables: [], lists: [] },
      parsedBy: 'user',
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:00:00.000Z',
    }
    assert.deepEqual(doc.metadata, {})
  })

  it('Document structuredData can be empty', () => {
    const doc: Document = {
      id: 'doc-empty-sd',
      tenantId: 't1',
      sourceAssetId: 'a1',
      filename: 'simple.txt',
      format: 'txt',
      parser: 'mock-pdfplumber',
      status: 'parsed',
      pageCount: 1,
      charCount: 10,
      contentText: 'hello',
      metadata: {},
      structuredData: { tables: [], lists: [] },
      parsedBy: 'user',
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:00:00.000Z',
    }
    assert.equal(doc.structuredData.tables.length, 0)
    assert.equal(doc.structuredData.lists.length, 0)
  })
})

// ── generateOcrTaskId ────────────────────────────────────────────
describe('ocr.entity: generateOcrTaskId', () => {
  it('generates id starting with "ocr-"', () => {
    const id = generateOcrTaskId()
    assert.ok(id.startsWith('ocr-'))
  })

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateOcrTaskId()))
    assert.equal(ids.size, 100)
  })
})

// ── generateOcrBlockId ────────────────────────────────────────────
describe('ocr.entity: generateOcrBlockId', () => {
  it('generates id starting with "blk-"', () => {
    const id = generateOcrBlockId()
    assert.ok(id.startsWith('blk-'))
  })

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateOcrBlockId()))
    assert.equal(ids.size, 100)
  })
})

// ── generateDocumentId ────────────────────────────────────────────
describe('ocr.entity: generateDocumentId', () => {
  it('generates id starting with "doc-"', () => {
    const id = generateDocumentId()
    assert.ok(id.startsWith('doc-'))
  })

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateDocumentId()))
    assert.equal(ids.size, 100)
  })
})

// ── parseBbox ────────────────────────────────────────────────────
describe('ocr.entity: parseBbox', () => {
  it('parses valid 4-part string', () => {
    const result = parseBbox('100,200,400,30')
    assert.deepEqual(result, { x: 100, y: 200, width: 400, height: 30 })
  })

  it('parses string with extra whitespace', () => {
    const result = parseBbox(' 100 , 200 , 400 , 30 ')
    assert.deepEqual(result, { x: 100, y: 200, width: 400, height: 30 })
  })

  it('returns zeros for invalid string (too few parts)', () => {
    const result = parseBbox('100,200')
    assert.deepEqual(result, { x: 0, y: 0, width: 0, height: 0 })
  })

  it('returns zeros for empty string', () => {
    const result = parseBbox('')
    assert.deepEqual(result, { x: 0, y: 0, width: 0, height: 0 })
  })

  it('returns zeros for non-numeric parts', () => {
    const result = parseBbox('abc,def,ghi,jkl')
    assert.deepEqual(result, { x: 0, y: 0, width: 0, height: 0 })
  })

  it('returns zeros for too many parts (ignores extras)', () => {
    const result = parseBbox('100,200,400,30,500')
    assert.deepEqual(result, { x: 0, y: 0, width: 0, height: 0 })
  })

  it('handles negative coordinates', () => {
    const result = parseBbox('-50,-100,400,30')
    assert.deepEqual(result, { x: -50, y: -100, width: 400, height: 30 })
  })
})

// ── averageConfidence ────────────────────────────────────────────
describe('ocr.entity: averageConfidence', () => {
  it('calculates average of multiple blocks', () => {
    const blocks: OcrBlock[] = [
      { id: 'b1', taskId: 't1', tenantId: 't1', page: 1, blockType: 'text', text: 'a', bbox: { x: 0, y: 0, width: 10, height: 10 }, confidence: 0.9, order: 0, createdAt: '' },
      { id: 'b2', taskId: 't1', tenantId: 't1', page: 1, blockType: 'text', text: 'b', bbox: { x: 0, y: 0, width: 10, height: 10 }, confidence: 0.7, order: 1, createdAt: '' },
      { id: 'b3', taskId: 't1', tenantId: 't1', page: 1, blockType: 'text', text: 'c', bbox: { x: 0, y: 0, width: 10, height: 10 }, confidence: 0.8, order: 2, createdAt: '' },
    ]
    assert.equal(averageConfidence(blocks), 0.8)
  })

  it('returns 0 for empty array', () => {
    assert.equal(averageConfidence([]), 0)
  })

  it('handles single block', () => {
    const blocks: OcrBlock[] = [
      { id: 'b1', taskId: 't1', tenantId: 't1', page: 1, blockType: 'text', text: 'x', bbox: { x: 0, y: 0, width: 10, height: 10 }, confidence: 0.95, order: 0, createdAt: '' },
    ]
    assert.equal(averageConfidence(blocks), 0.95)
  })
})

// ── cleanText ────────────────────────────────────────────────────
describe('ocr.entity: cleanText', () => {
  it('replaces multiple spaces with single space', () => {
    assert.equal(cleanText('hello    world'), 'hello world')
  })

  it('replaces newlines with spaces', () => {
    assert.equal(cleanText('hello\nworld\nfoo'), 'hello world foo')
  })

  it('trims leading and trailing whitespace', () => {
    assert.equal(cleanText('  hello world  '), 'hello world')
  })

  it('handles empty string', () => {
    assert.equal(cleanText(''), '')
  })

  it('handles string with only whitespace', () => {
    assert.equal(cleanText('   \n  \t  '), '')
  })
})

// ── extractKeywords ──────────────────────────────────────────────
describe('ocr.entity: extractKeywords', () => {
  it('extracts top keywords by frequency', () => {
    const text = 'apple banana apple cherry apple banana date'
    const keywords = extractKeywords(text, 3)
    assert.deepEqual(keywords, ['apple', 'banana', 'cherry'])
  })

  it('returns maxCount keywords', () => {
    const text = 'a a a b b b c c c d d d'
    const keywords = extractKeywords(text, 2)
    assert.equal(keywords.length, 2)
  })

  it('handles Chinese text with CJK characters', () => {
    const text = '财务报告 收入 利润 财务 成本 收入'
    const keywords = extractKeywords(text, 3)
    assert.ok(keywords.length <= 3)
    assert.ok(keywords.includes('收入'))
  })

  it('filters out single-character words', () => {
    const text = 'a is b of c in d on'
    const keywords = extractKeywords(text, 5)
    assert.equal(keywords.length, 0)
  })

  it('returns empty for empty text', () => {
    assert.deepEqual(extractKeywords(''), [])
  })
})

// ── isStructuredFormat ────────────────────────────────────────────
describe('ocr.entity: isStructuredFormat', () => {
  it('returns true for PDF', () => { assert.ok(isStructuredFormat('pdf')) })
  it('returns true for XLSX', () => { assert.ok(isStructuredFormat('xlsx')) })
  it('returns true for DOCX', () => { assert.ok(isStructuredFormat('docx')) })
  it('returns true for PPTX', () => { assert.ok(isStructuredFormat('pptx')) })
  it('returns true for CSV', () => { assert.ok(isStructuredFormat('csv')) })
  it('returns false for TXT', () => { assert.ok(!isStructuredFormat('txt')) })
  it('returns false for RTF', () => { assert.ok(!isStructuredFormat('rtf')) })
  it('returns false for MD', () => { assert.ok(!isStructuredFormat('md')) })
})

// ── EngineInfo type contract ─────────────────────────────────────
describe('ocr.entity: EngineInfo', () => {
  it('creates valid OCR engine info', () => {
    const info: EngineInfo = {
      type: 'mock-tesseract',
      category: 'ocr',
      displayName: 'Tesseract OSS',
      languages: ['zh-CN', 'en-US'],
      avgTimePerPageMs: 800,
      freeQuotaPerMonth: Infinity,
      unitPriceCny: 0,
    }
    assert.equal(info.category, 'ocr')
    assert.equal(info.type, 'mock-tesseract')
    assert.equal(info.freeQuotaPerMonth, Infinity)
  })

  it('creates valid Parser engine info', () => {
    const info: EngineInfo = {
      type: 'mock-pdfplumber',
      category: 'parser',
      displayName: 'pdfplumber',
      formats: ['pdf'],
      avgTimePerPageMs: 200,
      freeQuotaPerMonth: Infinity,
      unitPriceCny: 0,
    }
    assert.equal(info.category, 'parser')
    assert.ok(info.formats!.includes('pdf'))
  })

  it('unitPriceCny can be positive for commercial engines', () => {
    const info: EngineInfo = {
      type: 'mock-azure-cv',
      category: 'ocr',
      displayName: 'Azure Computer Vision',
      languages: ['zh-CN', 'en-US'],
      avgTimePerPageMs: 500,
      freeQuotaPerMonth: 5000,
      unitPriceCny: 0.01,
    }
    assert.ok(info.unitPriceCny > 0)
    assert.ok(info.freeQuotaPerMonth < Infinity)
  })

  it('parser engines do not have languages field', () => {
    const parser = OCR_ENGINE_INFO.find(e => e.type === 'mock-pdfplumber')!
    assert.equal(parser.languages, undefined)
  })

  it('ocr engines do not have formats field', () => {
    const ocr = OCR_ENGINE_INFO.find(e => e.type === 'mock-tesseract')!
    assert.equal(ocr.formats, undefined)
  })
})

// ── OCR_ENGINE_INFO ──────────────────────────────────────────────
describe('ocr.entity: OCR_ENGINE_INFO', () => {
  it('contains 12 engine entries', () => {
    assert.equal(OCR_ENGINE_INFO.length, 12)
  })

  it('contains 6 OCR engines and 6 parser engines', () => {
    const ocrCount = OCR_ENGINE_INFO.filter(e => e.category === 'ocr').length
    const parserCount = OCR_ENGINE_INFO.filter(e => e.category === 'parser').length
    assert.equal(ocrCount, 6)
    assert.equal(parserCount, 6)
  })

  it('each engine has valid type and displayName', () => {
    for (const engine of OCR_ENGINE_INFO) {
      assert.ok(typeof engine.type === 'string' && engine.type.length > 0)
      assert.ok(typeof engine.displayName === 'string' && engine.displayName.length > 0)
    }
  })

  it('each engine has avgTimePerPageMs > 0', () => {
    for (const engine of OCR_ENGINE_INFO) {
      assert.ok(engine.avgTimePerPageMs > 0, `${engine.type} should have positive avgTimePerPageMs`)
    }
  })

  it('each engine has unitPriceCny >= 0', () => {
    for (const engine of OCR_ENGINE_INFO) {
      assert.ok(engine.unitPriceCny >= 0, `${engine.type} unitPriceCny should be >= 0`)
    }
  })

  it('freeQuotaPerMonth is either Infinity or a positive number', () => {
    for (const engine of OCR_ENGINE_INFO) {
      if (engine.freeQuotaPerMonth === Infinity) continue
      assert.ok(engine.freeQuotaPerMonth > 0, `${engine.type} freeQuotaPerMonth should be > 0`)
    }
  })

  it('OCR engines have languages array', () => {
    const ocrEngines = OCR_ENGINE_INFO.filter(e => e.category === 'ocr')
    for (const e of ocrEngines) {
      assert.ok(Array.isArray(e.languages), `${e.type} should have languages`)
      assert.ok(e.languages!.length > 0)
    }
  })

  it('Parser engines have formats array', () => {
    const parserEngines = OCR_ENGINE_INFO.filter(e => e.category === 'parser')
    for (const e of parserEngines) {
      assert.ok(Array.isArray(e.formats), `${e.type} should have formats`)
      assert.ok(e.formats!.length > 0)
    }
  })
})
