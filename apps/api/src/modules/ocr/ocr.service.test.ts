// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
const TENANT_ID = 'test-tenant-001'

// Import tenant context helper
const { runWithTenant } = require('../../common/context/tenant-context')

describe('OcrService', () => {
  const { OcrService } = require('./ocr.service')
  let service: InstanceType<typeof OcrService>

  function withTenant<T>(fn: () => T): Promise<T> {
    return runWithTenant({ tenantId: TENANT_ID, userId: 'test-user' }, fn)
  }

  beforeEach(() => {
    service = new OcrService()
  })

  describe('createOcrTask', () => {
    it('should create OCR task with default engine (paddleocr) and return completed', async () => {
      const task = await withTenant(() =>
        service.createOcrTask({ sourceAssetId: 'asset-001' })
      )

      assert.ok(task.id.startsWith('ocr-'))
      assert.equal(task.tenantId, TENANT_ID)
      assert.equal(task.sourceAssetId, 'asset-001')
      assert.equal(task.engine, 'mock-paddleocr')
      assert.equal(task.status, 'completed')
      assert.equal(task.progress, 1.0)
      assert.ok(task.summary)
      assert.ok(task.summary!.pageCount >= 1 && task.summary!.pageCount <= 3)
      assert.ok(task.summary!.totalChars > 0)
      assert.ok(task.summary!.avgConfidence > 0)
    })

    it('should create OCR task with specified engine and language', async () => {
      const task = await withTenant(() =>
        service.createOcrTask({ sourceAssetId: 'asset-002', engine: 'mock-tesseract', language: 'en-US' })
      )

      assert.equal(task.engine, 'mock-tesseract')
      assert.equal(task.language, 'en-US')
      assert.equal(task.status, 'completed')
    })

    it('should reject unsupported engine', async () => {
      await assert.rejects(
        () => withTenant(() => service.createOcrTask({ sourceAssetId: 'asset-003', engine: 'unknown-engine' as any })),
        /OCR 引擎 unknown-engine 不存在/
      )
    })

    it('should reject unsupported language for engine', async () => {
      await assert.rejects(
        () => withTenant(() => service.createOcrTask({ sourceAssetId: 'asset-004', engine: 'mock-aws-textract', language: 'zh-CN' })),
        /不支持语言 zh-CN/
      )
    })

    it('should support enableLayoutAnalysis and enableTableDetection flags', async () => {
      const task = await withTenant(() =>
        service.createOcrTask({ sourceAssetId: 'asset-005', enableLayoutAnalysis: true, enableTableDetection: true })
      )

      assert.equal(task.enableLayoutAnalysis, true)
      assert.equal(task.enableTableDetection, true)
    })

    it('should support linked entity', async () => {
      const task = await withTenant(() =>
        service.createOcrTask({
          sourceAssetId: 'asset-006',
          linkedEntity: { entityType: 'receipt', entityId: 'order-123' },
        })
      )

      assert.ok(task.linkedEntity)
      assert.equal(task.linkedEntity!.entityType, 'receipt')
      assert.equal(task.linkedEntity!.entityId, 'order-123')
    })
  })

  describe('getOcrTask', () => {
    it('should return created task by id', async () => {
      const created = await withTenant(() => service.createOcrTask({ sourceAssetId: 'get-test-001' }))
      const fetched = await withTenant(() => service.getOcrTask(created.id))

      assert.equal(fetched.id, created.id)
      assert.equal(fetched.tenantId, TENANT_ID)
      assert.ok(fetched.blockCount > 0)
    })

    it('should throw for non-existent task', async () => {
      await assert.rejects(
        () => withTenant(() => service.getOcrTask('non-existent-id')),
        /不存在/
      )
    })
  })

  describe('listOcrTasks', () => {
    it('should list tasks and filter by status', async () => {
      await withTenant(() => service.createOcrTask({ sourceAssetId: 'list-test-001' }))
      await withTenant(() => service.createOcrTask({ sourceAssetId: 'list-test-002' }))

      const all = await withTenant(() => service.listOcrTasks())
      assert.ok(all.length >= 2)

      const completed = await withTenant(() => service.listOcrTasks({ status: 'completed' }))
      assert.ok(completed.length > 0)
      completed.forEach((t: any) => assert.equal(t.status, 'completed'))
    })

    it('should filter by engine', async () => {
      const tasks = await withTenant(() => service.listOcrTasks({ engine: 'mock-paddleocr' }))
      tasks.forEach((t: any) => assert.equal(t.engine, 'mock-paddleocr'))
    })

    it('should respect limit', async () => {
      const tasks = await withTenant(() => service.listOcrTasks({ limit: 1 }))
      assert.ok(tasks.length <= 1)
    })
  })

  describe('cancelOcrTask', () => {
    it('should throw when cancelling completed task', async () => {
      const task = await withTenant(() => service.createOcrTask({ sourceAssetId: 'cancel-me' }))
      await assert.rejects(
        () => withTenant(() => service.cancelOcrTask(task.id)),
        /已是终态 completed/
      )
    })
  })

  describe('deleteOcrTask', () => {
    it('should delete task and its blocks', async () => {
      const task = await withTenant(() => service.createOcrTask({ sourceAssetId: 'delete-test' }))
      const taskId = task.id

      await withTenant(() => service.deleteOcrTask(taskId))

      await assert.rejects(() => withTenant(() => service.getOcrTask(taskId)), /不存在/)
    })
  })

  describe('listOcrBlocks', () => {
    it('should return blocks for a task', async () => {
      const task = await withTenant(() => service.createOcrTask({ sourceAssetId: 'blocks-test' }))
      const blocks = await withTenant(() => service.listOcrBlocks(task.id))

      assert.ok(blocks.length > 0)
      blocks.forEach((b: any) => {
        assert.equal(b.taskId, task.id)
        assert.ok(b.page >= 1)
        assert.ok(b.confidence > 0 && b.confidence <= 1)
      })
    })

    it('should return blocks in correct order (page asc, order asc)', async () => {
      const task = await withTenant(() => service.createOcrTask({ sourceAssetId: 'blocks-order' }))
      const blocks = await withTenant(() => service.listOcrBlocks(task.id))

      for (let i = 1; i < blocks.length; i++) {
        const prev = blocks[i - 1]
        const curr = blocks[i]
        if (prev.page === curr.page) {
          assert.ok(prev.order <= curr.order)
        } else {
          assert.ok(prev.page < curr.page)
        }
      }
    })
  })

  describe('parseDocument', () => {
    it('should parse PDF document', async () => {
      const doc = await withTenant(() =>
        service.parseDocument({ sourceAssetId: 'doc-sample-pdf', parser: 'mock-pdfplumber' })
      )

      assert.ok(doc.id.startsWith('doc-'))
      assert.equal(doc.format, 'pdf')
      assert.equal(doc.parser, 'mock-pdfplumber')
      assert.equal(doc.status, 'parsed')
      assert.ok(doc.pageCount >= 1)
      assert.ok(doc.structuredData.tables.length > 0)
    })

    it('should parse CSV document', async () => {
      const doc = await withTenant(() =>
        service.parseDocument({ sourceAssetId: 'data-csv', parser: 'mock-papaparse' })
      )

      assert.equal(doc.format, 'csv')
      assert.equal(doc.parser, 'mock-papaparse')
      assert.equal(doc.status, 'parsed')
    })

    it('should auto-guess parser based on assetId', async () => {
      const docPdf = await withTenant(() => service.parseDocument({ sourceAssetId: 'report-pdf-2026' }))
      assert.equal(docPdf.parser, 'mock-pdfplumber')

      const docCsv = await withTenant(() => service.parseDocument({ sourceAssetId: 'export-csv' }))
      assert.equal(docCsv.parser, 'mock-papaparse')
    })

    it('should reject unknown parser', async () => {
      await assert.rejects(
        () => withTenant(() => service.parseDocument({ sourceAssetId: 'bad-parser', parser: 'unknown-parser' as any })),
        /解析器 unknown-parser 不存在/
      )
    })
  })

  describe('getDocument', () => {
    it('should return parsed document by id', async () => {
      const created = await withTenant(() => service.parseDocument({ sourceAssetId: 'get-doc-001' }))
      const fetched = await withTenant(() => service.getDocument(created.id))

      assert.equal(fetched.id, created.id)
      assert.equal(fetched.tenantId, TENANT_ID)
    })

    it('should throw for non-existent document', async () => {
      await assert.rejects(() => withTenant(() => service.getDocument('non-existent-doc')), /不存在/)
    })
  })

  describe('listDocuments', () => {
    it('should list documents and filter by format', async () => {
      await withTenant(() => service.parseDocument({ sourceAssetId: 'doc-list-pdf', parser: 'mock-pdfplumber' }))
      await withTenant(() => service.parseDocument({ sourceAssetId: 'doc-list-csv', parser: 'mock-papaparse' }))

      const pdfDocs = await withTenant(() => service.listDocuments({ format: 'pdf' }))
      assert.ok(pdfDocs.length >= 1)
      pdfDocs.forEach((d: any) => assert.equal(d.format, 'pdf'))
    })

    it('should filter by parser', async () => {
      const docs = await withTenant(() => service.listDocuments({ parser: 'mock-pdfplumber' }))
      docs.forEach((d: any) => assert.equal(d.parser, 'mock-pdfplumber'))
    })
  })

  describe('deleteDocument', () => {
    it('should delete a document', async () => {
      const doc = await withTenant(() => service.parseDocument({ sourceAssetId: 'doc-delete-me' }))
      await withTenant(() => service.deleteDocument(doc.id))
      await assert.rejects(() => withTenant(() => service.getDocument(doc.id)), /不存在/)
    })
  })

  describe('listEngines', () => {
    it('should return all engine metadata', () => {
      const engines = service.listEngines()

      assert.ok(engines.length > 10)
      const tesseract = engines.find((e: any) => e.type === 'mock-tesseract')
      assert.ok(tesseract)
      assert.equal(tesseract!.category, 'ocr')
      assert.ok(tesseract!.languages!.includes('zh-CN'))
    })

    it('each engine should have required fields', () => {
      const engines = service.listEngines()

      for (const engine of engines) {
        assert.ok(typeof engine.type === 'string')
        assert.ok(['ocr', 'parser'].includes(engine.category))
        assert.ok(typeof engine.displayName === 'string')
        assert.ok(typeof engine.avgTimePerPageMs === 'number')
      }
    })
  })

  describe('getOcrStats', () => {
    it('should return stats with counts and aggregations', async () => {
      await withTenant(() => service.createOcrTask({ sourceAssetId: 'stats-test-001' }))
      await withTenant(() => service.createOcrTask({ sourceAssetId: 'stats-test-002', engine: 'mock-tesseract' }))
      await withTenant(() => service.parseDocument({ sourceAssetId: 'stats-doc-pdf', parser: 'mock-pdfplumber' }))

      const stats = await withTenant(() => service.getOcrStats())

      assert.ok(stats.totalTasks >= 2)
      assert.ok(stats.completedTasks >= 2)
      assert.ok(stats.totalDocuments >= 1)
      assert.ok(stats.totalChars > 0)
      assert.ok(stats.totalPages > 0)
      assert.ok(typeof stats.avgConfidence === 'number')
    })

    it('byEngine and byFormat should be populated after creating data', async () => {
      await withTenant(() => service.createOcrTask({ sourceAssetId: 'byengine-test-001' }))
      await withTenant(() => service.parseDocument({ sourceAssetId: 'byengine-doc-pdf', parser: 'mock-pdfplumber' }))

      const stats = await withTenant(() => service.getOcrStats())
      assert.ok(Object.keys(stats.byEngine).length > 0)
      assert.ok(Object.keys(stats.byFormat).length > 0)
    })
  })

  describe('entity utility functions', () => {
    it('generateOcrTaskId should produce unique ids', () => {
      const { generateOcrTaskId } = require('./ocr.entity')
      const id1 = generateOcrTaskId()
      const id2 = generateOcrTaskId()
      assert.ok(id1.startsWith('ocr-'))
      assert.notEqual(id1, id2)
    })

    it('parseBbox should parse valid string', () => {
      const { parseBbox } = require('./ocr.entity')
      assert.deepEqual(parseBbox('100,200,400,30'), { x: 100, y: 200, width: 400, height: 30 })
    })

    it('parseBbox should return zeros for invalid input', () => {
      const { parseBbox } = require('./ocr.entity')
      assert.deepEqual(parseBbox('invalid'), { x: 0, y: 0, width: 0, height: 0 })
    })

    it('averageConfidence should calculate correctly', () => {
      const { averageConfidence } = require('./ocr.entity')
      const blocks = [
        { id: '1', confidence: 0.9 },
        { id: '2', confidence: 0.7 },
        { id: '3', confidence: 0.8 },
      ] as any[]
      assert.equal(averageConfidence(blocks).toFixed(1), '0.8')
    })

    it('averageConfidence should return 0 for empty array', () => {
      const { averageConfidence } = require('./ocr.entity')
      assert.equal(averageConfidence([]), 0)
    })

    it('cleanText should trim and deduplicate whitespace', () => {
      const { cleanText } = require('./ocr.entity')
      assert.equal(cleanText('  hello   world  '), 'hello world')
    })

    it('extractKeywords should return top frequent words', () => {
      const { extractKeywords } = require('./ocr.entity')
      const text = 'apple banana apple cherry apple banana date'
      const keywords = extractKeywords(text, 2)
      assert.equal(keywords.length, 2)
      assert.equal(keywords[0], 'apple')
    })

    it('isStructuredFormat should return true for table-capable formats', () => {
      const { isStructuredFormat } = require('./ocr.entity')
      assert.equal(isStructuredFormat('pdf'), true)
      assert.equal(isStructuredFormat('xlsx'), true)
      assert.equal(isStructuredFormat('docx'), true)
      assert.equal(isStructuredFormat('txt'), false)
    })
  })
})
