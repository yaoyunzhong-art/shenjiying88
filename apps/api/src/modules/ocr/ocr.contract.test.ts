import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ocr] [D] contract 测试补全
 *
 * OCR 模块 API 契约测试 (Service 层直接验证)
 *
 * 验证 DTO 输入/输出的契约合规性:
 * - CreateOcrTaskDto → OcrTask
 * - ParseDocumentDto → Document
 * - OcrTaskResponse 字段完整性
 * - DocumentResponse 字段完整性
 * - OcrStatsResponse 字段完整性
 * - Entity 接口字段完整性
 */

import assert from 'node:assert/strict'
import { OcrService } from './ocr.service'
import { runWithTenant } from '../../common/context/tenant-context'
import {
  generateOcrTaskId,
  generateDocumentId,
  generateOcrBlockId,
  averageConfidence,
  extractKeywords,
  parseBbox,
  cleanText,
  isStructuredFormat,
  OCR_ENGINE_INFO,
} from './ocr.entity'

const TENANT = {
  tenantId: 'tenant-contract-ocr',
  storeId: 'store-001',
  userId: 'admin-contract',
  role: 'tenant_admin' as const,
}

function makeService() {
  return new OcrService()
}

// ═══════════════════════════════════════════════════════════
// 实体层契约测试
// ═══════════════════════════════════════════════════════════
describe('OCR Entity 契约', () => {
  it('generateOcrTaskId 格式正确', () => {
    const id = generateOcrTaskId()
    assert.ok(id.startsWith('ocr-'))
    assert.ok(id.length > 10)
  })

  it('generateDocumentId 格式正确', () => {
    const id = generateDocumentId()
    assert.ok(id.startsWith('doc-'))
    assert.ok(id.length > 10)
  })

  it('generateOcrBlockId 格式正确', () => {
    const id = generateOcrBlockId()
    assert.ok(id.startsWith('blk-'))
    assert.ok(id.length > 10)
  })

  it('parseBbox 正确解析', () => {
    const result = parseBbox('100,200,300,400')
    assert.deepEqual(result, { x: 100, y: 200, width: 300, height: 400 })
  })

  it('parseBbox 非法输入返回0', () => {
    const result = parseBbox('invalid')
    assert.deepEqual(result, { x: 0, y: 0, width: 0, height: 0 })
  })

  it('averageConfidence 计算正确', () => {
    const blocks = [
      { id: 'b1', taskId: 't1', tenantId: 't', page: 1, blockType: 'text' as const, text: 'hello', bbox: { x: 0, y: 0, width: 10, height: 10 }, confidence: 0.9, order: 1, createdAt: '' },
      { id: 'b2', taskId: 't1', tenantId: 't', page: 1, blockType: 'text' as const, text: 'world', bbox: { x: 0, y: 0, width: 10, height: 10 }, confidence: 0.7, order: 2, createdAt: '' },
    ]
    assert.equal(averageConfidence(blocks), 0.8)
  })

  it('averageConfidence 空数组返回0', () => {
    assert.equal(averageConfidence([]), 0)
  })

  it('cleanText 去除多余空白', () => {
    assert.equal(cleanText('  Hello   World  '), 'Hello World')
  })

  it('extractKeywords 提取关键词', () => {
    const text = '营业收入 净利润 营业收入 成本 利润 营业收入 费用 支出'
    const kw = extractKeywords(text, 3)
    assert.ok(kw.length <= 3)
    assert.equal(kw[0], '营业收入')
  })

  it('isStructuredFormat 判断正确', () => {
    assert.equal(isStructuredFormat('pdf'), true)
    assert.equal(isStructuredFormat('csv'), true)
    assert.equal(isStructuredFormat('txt'), false)
    assert.equal(isStructuredFormat('md'), false)
  })

  it('OCR_ENGINE_INFO 至少有 10 个条目', () => {
    assert.ok(OCR_ENGINE_INFO.length >= 10)
    const allTypes = OCR_ENGINE_INFO.map((e) => e.type)
    assert.ok(allTypes.includes('mock-paddleocr'))
    assert.ok(allTypes.includes('mock-pdfplumber'))
    const ocrs = OCR_ENGINE_INFO.filter((e) => e.category === 'ocr')
    const parsers = OCR_ENGINE_INFO.filter((e) => e.category === 'parser')
    assert.ok(ocrs.length >= 5)
    assert.ok(parsers.length >= 5)
  })
})

// ═══════════════════════════════════════════════════════════
// OCR 任务 Service 契约测试
// ═══════════════════════════════════════════════════════════
describe('OCR Service 契约 — 任务', () => {
  it('createOcrTask 返回 OcrTask 字段完整性', async () => {
    const service = makeService()
    const task = await runWithTenant(TENANT, () =>
      service.createOcrTask({
        sourceAssetId: 'asset-pdf-001',
        engine: 'mock-paddleocr',
        language: 'zh-CN',
        enableLayoutAnalysis: true,
        enableTableDetection: false,
      }),
    )
    // OcrTask 字段断言
    assert.ok(task.id)
    assert.ok(task.id.startsWith('ocr-'))
    assert.equal(task.tenantId, TENANT.tenantId)
    assert.equal(task.sourceAssetId, 'asset-pdf-001')
    assert.equal(task.engine, 'mock-paddleocr')
    assert.equal(task.language, 'zh-CN')
    assert.equal(task.enableLayoutAnalysis, true)
    assert.equal(task.enableTableDetection, false)
    assert.equal(task.status, 'completed')
    assert.equal(task.progress, 1.0)
    assert.ok(task.createdAt)
    assert.ok(task.updatedAt)
    assert.ok(task.summary)
    assert.ok(task.summary!.pageCount >= 1)
    assert.ok(task.summary!.totalChars > 0)
    assert.ok(task.summary!.avgConfidence > 0)
    assert.equal(task.requestedBy, TENANT.userId)
  })

  it('getOcrTask 返回 OcrTaskResponse 字段完整性', async () => {
    const service = makeService()
    const task = await runWithTenant(TENANT, () =>
      service.createOcrTask({
        sourceAssetId: 'asset-pdf-response',
        engine: 'mock-tesseract',
      }),
    )
    const response = await runWithTenant(TENANT, () =>
      service.getOcrTask(task.id),
    )
    // OcrTaskResponse 字段断言
    assert.ok(response.id)
    assert.equal(response.tenantId, TENANT.tenantId)
    assert.equal(response.sourceAssetId, 'asset-pdf-response')
    assert.equal(response.engine, 'mock-tesseract')
    assert.equal(response.status, 'completed')
    assert.ok(response.blockCount >= 0)
    assert.ok(response.createdAt)
    assert.ok(response.updatedAt)
  })

  it('listOcrTasks 分页正确', async () => {
    const service = makeService()
    await runWithTenant(TENANT, () =>
      service.createOcrTask({ sourceAssetId: 'asset-list-1', engine: 'mock-tesseract' }),
    )
    await runWithTenant(TENANT, () =>
      service.createOcrTask({ sourceAssetId: 'asset-list-2', engine: 'mock-paddleocr' }),
    )

    // 全部列出
    const all = await runWithTenant(TENANT, () =>
      service.listOcrTasks({ limit: 50 }),
    )
    assert.equal(all.length, 2)

    // 按引擎过滤
    const filtered = await runWithTenant(TENANT, () =>
      service.listOcrTasks({ engine: 'mock-tesseract' }),
    )
    assert.equal(filtered.length, 1)
    assert.equal(filtered[0].engine, 'mock-tesseract')
  })

  it('cancelOcrTask — 已完成任务不可取消', async () => {
    const service = makeService()
    const task = await runWithTenant(TENANT, () =>
      service.createOcrTask({ sourceAssetId: 'asset-cancel', engine: 'mock-tesseract' }),
    )
    await assert.rejects(
      runWithTenant(TENANT, () => service.cancelOcrTask(task.id)),
      { status: 400 },
    )
  })

  it('deleteOcrTask — 删除后再查询 404', async () => {
    const service = makeService()
    const task = await runWithTenant(TENANT, () =>
      service.createOcrTask({ sourceAssetId: 'asset-delete-me', engine: 'mock-tesseract' }),
    )
    await runWithTenant(TENANT, () => service.deleteOcrTask(task.id))
    await assert.rejects(
      runWithTenant(TENANT, () => service.getOcrTask(task.id)),
      { status: 404 },
    )
  })

  it('listOcrBlocks 字段完整性', async () => {
    const service = makeService()
    const task = await runWithTenant(TENANT, () =>
      service.createOcrTask({ sourceAssetId: 'asset-blocks', engine: 'mock-paddleocr' }),
    )
    const blocks = await runWithTenant(TENANT, () =>
      service.listOcrBlocks(task.id),
    )
    assert.ok(blocks.length > 0)
    for (const b of blocks) {
      assert.ok(b.id)
      assert.ok(b.id.startsWith('blk-'))
      assert.equal(b.taskId, task.id)
      assert.ok(b.page >= 1)
      assert.ok(b.blockType)
      assert.ok(b.text)
      assert.ok(b.bbox)
      assert.ok(b.bbox.x >= 0)
      assert.ok(b.bbox.y >= 0)
      assert.ok(b.confidence > 0)
      assert.ok(b.confidence <= 1)
      assert.ok(b.createdAt)
    }
  })
})

// ═══════════════════════════════════════════════════════════
// 文档解析 Service 契约测试
// ═══════════════════════════════════════════════════════════
describe('OCR Service 契约 — 文档解析', () => {
  it('parseDocument 返回 Document 字段完整性', async () => {
    const service = makeService()
    const doc = await runWithTenant(TENANT, () =>
      service.parseDocument({
        sourceAssetId: 'asset-pdf-financial',
        parser: 'mock-pdfplumber',
        extractTables: true,
      }),
    )
    assert.ok(doc.id.startsWith('doc-'))
    assert.equal(doc.tenantId, TENANT.tenantId)
    assert.equal(doc.sourceAssetId, 'asset-pdf-financial')
    assert.equal(doc.status, 'parsed')
    assert.ok(doc.pageCount >= 1)
    assert.ok(doc.charCount > 0)
    assert.ok(doc.parseDurationMs! > 0)
    assert.ok(doc.contentText)
    assert.ok(doc.metadata.title)
    assert.ok(doc.metadata.keywords!.length > 0)
    assert.ok(doc.structuredData.tables.length >= 0)
    assert.ok(Array.isArray(doc.structuredData.lists))
    assert.equal(doc.parsedBy, TENANT.userId)
    assert.ok(doc.createdAt)
    assert.ok(doc.updatedAt)
  })

  it('parseDocument — CSV 解析含表格行', async () => {
    const service = makeService()
    const doc = await runWithTenant(TENANT, () =>
      service.parseDocument({
        sourceAssetId: 'asset-csv-sales',
        parser: 'mock-papaparse',
      }),
    )
    assert.ok(doc.contentText.includes('CSV') || doc.contentText.includes('csv') || doc.contentText.includes('name'))
  })

  it('getDocument 字段完整', async () => {
    const service = makeService()
    const doc = await runWithTenant(TENANT, () =>
      service.parseDocument({
        sourceAssetId: 'asset-pdf-contract',
        parser: 'mock-pdfplumber',
      }),
    )
    const fetched = await runWithTenant(TENANT, () =>
      service.getDocument(doc.id),
    )
    assert.equal(fetched.id, doc.id)
    assert.equal(fetched.format, doc.format)
    assert.equal(fetched.status, 'parsed')
  })

  it('getDocument 不存在 → 404', async () => {
    const service = makeService()
    await assert.rejects(
      runWithTenant(TENANT, () => service.getDocument('doc-ghost-999')),
      { status: 404 },
    )
  })

  it('listDocuments 过滤正确', async () => {
    const service = makeService()
    await runWithTenant(TENANT, () =>
      service.parseDocument({ sourceAssetId: 'asset-pdf-a', parser: 'mock-pdfplumber' }),
    )
    await runWithTenant(TENANT, () =>
      service.parseDocument({ sourceAssetId: 'asset-xlsx-b', parser: 'mock-openpyxl' }),
    )

    const all = await runWithTenant(TENANT, () =>
      service.listDocuments({ limit: 50 }),
    )
    assert.equal(all.length, 2)

    const onlyPdf = await runWithTenant(TENANT, () =>
      service.listDocuments({ format: 'pdf' }),
    )
    assert.equal(onlyPdf.length, 1)
    assert.equal(onlyPdf[0].format, 'pdf')
  })

  it('listDocuments — 按错误格式过滤返回空', async () => {
    const service = makeService()
    const result = await runWithTenant(TENANT, () =>
      service.listDocuments({ format: 'pptx' }),
    )
    assert.equal(result.length, 0)
  })

  it('deleteDocument 删除后不可查', async () => {
    const service = makeService()
    const doc = await runWithTenant(TENANT, () =>
      service.parseDocument({ sourceAssetId: 'asset-pdf-delete', parser: 'mock-pdfplumber' }),
    )
    await runWithTenant(TENANT, () =>
      service.deleteDocument(doc.id),
    )
    await assert.rejects(
      runWithTenant(TENANT, () => service.getDocument(doc.id)),
      { status: 404 },
    )
  })
})

// ═══════════════════════════════════════════════════════════
// 引擎与统计契约测试
// ═══════════════════════════════════════════════════════════
describe('OCR Service 契约 — 引擎与统计', () => {
  it('listEngines 返回完整引擎元数据', () => {
    const service = makeService()
    const engines = service.listEngines()
    assert.ok(engines.length >= 10)
    for (const e of engines) {
      assert.ok(e.type)
      assert.ok(e.displayName)
      assert.ok(['ocr', 'parser'].includes(e.category))
      assert.ok(e.avgTimePerPageMs > 0)
      assert.ok(e.freeQuotaPerMonth > 0)
      assert.ok(e.unitPriceCny >= 0)
    }
    // 确认包含关键引擎
    const types = engines.map((e) => e.type)
    assert.ok(types.includes('mock-paddleocr'))
    assert.ok(types.includes('mock-azure-cv'))
    assert.ok(types.includes('mock-pdfplumber'))
    assert.ok(types.includes('mock-openpyxl'))
  })

  it('getOcrStats 字段完整性 — 有数据', async () => {
    const service = makeService()
    // 创建数据
    await runWithTenant(TENANT, () =>
      service.createOcrTask({ sourceAssetId: 'asset-stats-1', engine: 'mock-paddleocr' }),
    )
    await runWithTenant(TENANT, () =>
      service.createOcrTask({ sourceAssetId: 'asset-stats-2', engine: 'mock-tesseract' }),
    )
    await runWithTenant(TENANT, () =>
      service.parseDocument({ sourceAssetId: 'asset-stats-pdf', parser: 'mock-pdfplumber' }),
    )
    await runWithTenant(TENANT, () =>
      service.parseDocument({ sourceAssetId: 'asset-stats-xlsx', parser: 'mock-openpyxl' }),
    )

    const stats = await runWithTenant(TENANT, () =>
      service.getOcrStats(),
    )
    assert.equal(stats.totalTasks, 2)
    assert.equal(stats.completedTasks, 2)
    assert.equal(stats.totalDocuments, 2)
    assert.ok(stats.totalChars > 0)
    assert.ok(stats.totalPages > 0)
    assert.ok(stats.avgConfidence > 0)
    assert.ok(stats.avgParseTimeMs > 0)
    assert.ok(Object.keys(stats.byEngine).length >= 2)
    assert.ok(Object.keys(stats.byFormat).length >= 2)
  })

  it('getOcrStats 字段完整性 — 空数据', async () => {
    const service = makeService()
    const stats = await runWithTenant(TENANT, () =>
      service.getOcrStats(),
    )
    assert.equal(stats.totalTasks, 0)
    assert.equal(stats.completedTasks, 0)
    assert.equal(stats.failedTasks, 0)
    assert.equal(stats.totalDocuments, 0)
    assert.equal(stats.totalChars, 0)
    assert.equal(stats.totalPages, 0)
    assert.equal(stats.avgConfidence, 0)
    assert.equal(stats.avgParseTimeMs, 0)
    assert.deepEqual(stats.byEngine, {})
    assert.deepEqual(stats.byFormat, {})
  })
})

// ═══════════════════════════════════════════════════════════
// 配额与边界契约测试
// ═══════════════════════════════════════════════════════════
describe('OCR Service 契约 — 配额与边界', () => {
  it('不支持的引擎类型返回 400', async () => {
    const service = makeService()
    await assert.rejects(
      runWithTenant(TENANT, () =>
        service.createOcrTask({
          sourceAssetId: 'asset-test',
          engine: 'mock-fake-engine' as any,
        }),
      ),
      { status: 400, message: /引擎.*不存在/ },
    )
  })

  it('不支持的语言返回 400', async () => {
    const service = makeService()
    // mock-aws-textract 只支持 en-US
    await assert.rejects(
      runWithTenant(TENANT, () =>
        service.createOcrTask({
          sourceAssetId: 'asset-test',
          engine: 'mock-aws-textract',
          language: 'zh-CN',
        }),
      ),
      { status: 400, message: /不支持语言/ },
    )
  })

  it('不存在的解析器返回 400', async () => {
    const service = makeService()
    await assert.rejects(
      runWithTenant(TENANT, () =>
        service.parseDocument({
          sourceAssetId: 'asset-test.pdf',
          parser: 'mock-nonexistent-parser' as any,
        }),
      ),
      { status: 400, message: /解析器.*不存在/ },
    )
  })

  it('countTasks/countDocuments/countBlocks 计数正确', async () => {
    const service = makeService()
    assert.equal(service.countTasks(), 0)
    assert.equal(service.countDocuments(), 0)
    assert.equal(service.countBlocks(), 0)

    await runWithTenant(TENANT, () =>
      service.createOcrTask({ sourceAssetId: 'asset-count', engine: 'mock-tesseract' }),
    )

    assert.ok(service.countTasks() >= 1)
    assert.ok(service.countBlocks() >= 1)
  })
})
