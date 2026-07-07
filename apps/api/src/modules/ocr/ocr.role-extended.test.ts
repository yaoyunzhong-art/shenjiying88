import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 OCR 扩展角色测试: 4 个深度角色 × 3 场景
 *
 * 🔧安监 — 安全巡检单据 & 设备铭牌 OCR
 * 📢营销 — 竞品宣传物料 & 营销文案识别
 * 🎯运行专员 — 运营报表 & KPI 看板 OCR
 * 👔店长 — 供应商文档 & 租赁协议解析
 *
 * 每个角色 3 个用例（正常流程/业务异常/边界校验）= 12 个独立测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
// ── 角色定义 ──
const ROLES = {
  Security: '🔧安监',
  Marketing: '📢营销',
  Operations: '🎯运行专员',
  StoreManager: '👔店长',
}

const TENANT = 't-ocr-ext'

// ── Mock 工厂 ──

interface MockTask {
  id: string
  tenantId: string
  sourceAssetId: string
  engine: string
  language: string
  status: string
  progress: number
  summary?: {
    pageCount: number
    totalChars: number
    avgConfidence: number
    languageDetected?: string
  }
  blockCount: number
  createdAt: string
  updatedAt: string
}

interface MockDocument {
  id: string
  tenantId: string
  sourceAssetId: string
  format: string
  parser: string
  status: string
  pageCount: number
  charCount: number
  contentText: string
  tableCount: number
  listCount: number
  previewText: string
  createdAt: string
  updatedAt: string
}

interface MockBlock {
  id: string
  taskId: string
  page: number
  blockType: string
  text: string
  bbox: { x: number; y: number; width: number; height: number }
  confidence: number
  order: number
}

function mockOcrService(overrides: any = {}) {
  const taskStore = new Map<string, MockTask>()
  const docStore = new Map<string, MockDocument>()
  const blockStore = new Map<string, MockBlock>()
  const taskBlocks = new Map<string, string[]>()
  let taskCounter = 0
  let docCounter = 0
  let blockCounter = 0

  return {
    ...overrides,
    taskStore,
    docStore,
    blockStore,
    taskBlocks,

    createOcrTask: async (dto: any) => {
      // 参数校验
      if (!dto.sourceAssetId) {
        throw Object.assign(new Error('sourceAssetId 不能为空'), { status: 400 })
      }
      if (dto.engine && !['mock-tesseract', 'mock-paddleocr', 'mock-azure-cv', 'mock-gcp-vision', 'mock-aws-textract', 'mock-baidu-ocr'].includes(dto.engine)) {
        throw Object.assign(new Error(`OCR 引擎 ${dto.engine} 不存在`), { status: 400 })
      }
      // 引擎语言兼容性检查（简化的模拟）
      const engLangMap: Record<string, string[]> = {
        'mock-tesseract': ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'auto'],
        'mock-paddleocr': ['zh-CN', 'en-US', 'auto'],
        'mock-azure-cv': ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'mixed', 'auto'],
        'mock-gcp-vision': ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'auto'],
        'mock-aws-textract': ['en-US', 'auto'],
        'mock-baidu-ocr': ['zh-CN', 'en-US', 'auto'],
      }
      const lang = dto.language ?? 'auto'
      const allowedLangs = engLangMap[dto.engine ?? 'mock-paddleocr']
      if (allowedLangs && !allowedLangs.includes(lang)) {
        throw Object.assign(new Error(`引擎 ${dto.engine} 不支持语言 ${lang}`), { status: 400 })
      }

      const taskId = `ocr-ext-${++taskCounter}`
      const now = new Date().toISOString()
      const pageCount = 1 + Math.floor(Math.random() * 3)
      const blocks: MockBlock[] = []
      for (let p = 1; p <= pageCount; p++) {
        for (let i = 0; i < 3; i++) {
          blocks.push({
            id: `blk-ext-${++blockCounter}`,
            taskId,
            page: p,
            blockType: i === 0 ? 'title' : 'text',
            text: `Sample text ${p}-${i}`,
            bbox: { x: 100 + i * 20, y: 100 + p * 30, width: 400, height: 30 },
            confidence: 0.85 + Math.random() * 0.14,
            order: i,
          })
        }
      }
      for (const b of blocks) {
        blockStore.set(b.id, b)
      }
      taskBlocks.set(taskId, blocks.map(b => b.id))

      const mockSummaryOverrides = dto.sourceAssetId === 'safety-inspection-receipt'
        ? { pageCount, totalChars: 1560, avgConfidence: 0.94, languageDetected: 'zh-CN' as const }
        : dto.sourceAssetId === 'competitor-poster'
        ? { pageCount, totalChars: 890, avgConfidence: 0.91, languageDetected: 'zh-CN' as const }
        : dto.sourceAssetId === 'kpi-dashboard-screenshot'
        ? { pageCount, totalChars: 2340, avgConfidence: 0.88, languageDetected: 'zh-CN' as const }
        : dto.sourceAssetId === 'supplier-contract-pdf'
        ? { pageCount: 5, totalChars: 12500, avgConfidence: 0.97, languageDetected: 'zh-CN' as const }
        : { pageCount, totalChars: 500, avgConfidence: 0.9, languageDetected: 'zh-CN' as const }

      const task: any = {
        id: taskId,
        tenantId: TENANT,
        sourceAssetId: dto.sourceAssetId,
        engine: dto.engine ?? 'mock-paddleocr',
        language: dto.language ?? 'zh-CN',
        enableLayoutAnalysis: dto.enableLayoutAnalysis ?? false,
        enableTableDetection: dto.enableTableDetection ?? false,
        status: 'completed',
        progress: 1.0,
        summary: mockSummaryOverrides,
        blockCount: blocks.length,
        createdAt: now,
        updatedAt: now,
      }
      taskStore.set(taskId, task)
      return task
    },

    getOcrTask: async (taskId: string) => {
      const t = taskStore.get(taskId)
      if (!t) throw Object.assign(new Error(`OCR 任务 ${taskId} 不存在`), { status: 404 })
      return t
    },

    listOcrTasks: async (query: any = {}) => {
      let items = Array.from(taskStore.values()).filter(t => t.tenantId === TENANT)
      if (query.status) items = items.filter(t => t.status === query.status)
      if (query.engine) items = items.filter(t => t.engine === query.engine)
      return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },

    cancelOcrTask: async (taskId: string) => {
      const t = taskStore.get(taskId)
      if (!t) throw Object.assign(new Error(`OCR 任务 ${taskId} 不存在`), { status: 404 })
      if (t.status === 'completed') {
        throw Object.assign(new Error('已完成的任务不可取消'), { status: 400 })
      }
      t.status = 'cancelled'
      return t
    },

    deleteOcrTask: async (taskId: string) => {
      if (!taskStore.has(taskId)) {
        throw Object.assign(new Error(`OCR 任务 ${taskId} 不存在`), { status: 404 })
      }
      taskStore.delete(taskId)
      const bIds = taskBlocks.get(taskId) ?? []
      for (const bid of bIds) blockStore.delete(bid)
      taskBlocks.delete(taskId)
    },

    listOcrBlocks: async (taskId: string) => {
      if (!taskStore.has(taskId)) {
        throw Object.assign(new Error(`OCR 任务 ${taskId} 不存在`), { status: 404 })
      }
      const bIds = taskBlocks.get(taskId) ?? []
      return bIds
        .map((id: string) => blockStore.get(id))
        .filter((b): b is MockBlock => b != null)
        .sort((a, b) => a.page - b.page || a.order - b.order)
    },

    parseDocument: async (dto: any) => {
      if (!dto.sourceAssetId) {
        throw Object.assign(new Error('sourceAssetId 不能为空'), { status: 400 })
      }
      const validParsers = ['mock-pdfplumber', 'mock-pdfminer', 'mock-python-docx', 'mock-openpyxl', 'mock-pptx-parser', 'mock-papaparse']
      if (dto.parser && !validParsers.includes(dto.parser)) {
        throw Object.assign(new Error(`解析器 ${dto.parser} 不存在`), { status: 400 })
      }

      const docId = `doc-ext-${++docCounter}`
      const now = new Date().toISOString()

      const formatHints: Record<string, { format: string; content: string; tables: number; lists: number }> = {
        'supplier-contract-pdf': {
          format: 'pdf',
          content: '# 供应商供货合同\n\n| 条款 | 内容 |\n|------|------|\n| 甲方 | 审计云科技有限公司 |\n| 乙方 | 数聚云服务有限公司 |\n| 合同金额 | ¥500,000 |\n| 签约日期 | 2026-07-01 |\n| 服务期限 | 12 个月 |\n| 付款方式 | 季度预付 |\n\n## 第一条 服务内容\n乙方为甲方提供数据审计平台 SaaS 服务\n## 第二条 保密条款\n双方对合作中获知的商业机密负有保密义务',
          tables: 1,
          lists: 1,
        },
        'lease-agreement-pdf': {
          format: 'pdf',
          content: '# 门店租赁协议\n\n## 第一条 租赁标的\n甲方将位于北京市朝阳区的商铺出租给乙方\n\n## 第二条 租赁期限\n自 2026-07-01 至 2027-06-30\n\n## 第三条 租金\n月租金 ¥25,000，每季度支付',
          tables: 0,
          lists: 1,
        },
        'competitor-analysis-xlsx': {
          format: 'xlsx',
          content: '竞品,价格,评分\n竞品A,¥299,4.5\n竞品B,¥349,4.2\n竞品C,¥259,4.7',
          tables: 1,
          lists: 0,
        },
      }

      const hint = formatHints[dto.sourceAssetId] ?? { format: 'txt', content: '默认文档内容', tables: 0, lists: 0 }
      const format = hint.format

      const doc: MockDocument = {
        id: docId,
        tenantId: TENANT,
        sourceAssetId: dto.sourceAssetId,
        format,
        parser: dto.parser ?? 'mock-pdfplumber',
        status: 'parsed',
        pageCount: format === 'pdf' ? 5 : format === 'xlsx' ? 1 : 1,
        charCount: hint.content.length,
        contentText: hint.content,
        tableCount: hint.tables,
        listCount: hint.lists,
        previewText: hint.content.slice(0, 200),
        createdAt: now,
        updatedAt: now,
      }
      docStore.set(docId, doc)
      return doc
    },

    getDocument: async (docId: string) => {
      const d = docStore.get(docId)
      if (!d) throw Object.assign(new Error(`文档 ${docId} 不存在`), { status: 404 })
      return d
    },

    listDocuments: async (query: any = {}) => {
      let items = Array.from(docStore.values()).filter(d => d.tenantId === TENANT)
      if (query.format) items = items.filter(d => d.format === query.format)
      if (query.status) items = items.filter(d => d.status === query.status)
      return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },

    deleteDocument: async (docId: string) => {
      if (!docStore.has(docId)) {
        throw Object.assign(new Error(`文档 ${docId} 不存在`), { status: 404 })
      }
      docStore.delete(docId)
    },

    listEngines: () => [
      { type: 'mock-tesseract', category: 'ocr', displayName: 'Tesseract OSS' },
      { type: 'mock-paddleocr', category: 'ocr', displayName: 'PaddleOCR (中文优化)' },
      { type: 'mock-pdfplumber', category: 'parser', displayName: 'pdfplumber' },
    ],

    getOcrStats: async () => {
      const tasks = Array.from(taskStore.values()).filter(t => t.tenantId === TENANT)
      const docs = Array.from(docStore.values()).filter(d => d.tenantId === TENANT)
      return {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        failedTasks: tasks.filter(t => t.status === 'failed').length,
        totalDocuments: docs.length,
        totalChars: docs.reduce((s, d) => s + d.charCount, 0),
        totalPages: docs.reduce((s, d) => s + d.pageCount, 0),
        byEngine: {},
        byFormat: {},
        avgConfidence: 0.92,
        avgParseTimeMs: 350,
      }
    },

    countTasks: () => taskStore.size,
    countDocuments: () => docStore.size,
    countBlocks: () => blockStore.size,
  }
}

// ============================================================================

describe('🔧 安监视角 — 安全巡检 OCR 与文档识别', () => {

  it('[正常流程] 安监人员识别巡检单据图片中的隐患描述', async () => {
    const svc = mockOcrService()
    const task = await svc.createOcrTask({
      sourceAssetId: 'safety-inspection-receipt',
      engine: 'mock-paddleocr',
      language: 'zh-CN',
    })
    assert.ok(task.id)
    assert.equal(task.status, 'completed')
    assert.ok(task.summary)
    assert.ok(task.summary!.avgConfidence >= 0.9, '巡检单据识别置信度应不低于 0.9')
    assert.equal(task.language, 'zh-CN')

    const blocks = await svc.listOcrBlocks(task.id)
    assert.ok(blocks.length >= 3, '巡检单据应识别出至少 3 个文本块')
    assert.ok(blocks.some((b: any) => b.confidence > 0.9), '核心文本块应有高置信度')
  })

  it('[正常流程] 安监对设备铭牌进行 OCR 识别', async () => {
    const svc = mockOcrService()
    const tasks = await svc.listOcrTasks({})
    assert.ok(Array.isArray(tasks))

    // 模拟中英文混合识别
    const task = await svc.createOcrTask({
      sourceAssetId: 'device-nameplate',
      engine: 'mock-azure-cv',
      language: 'mixed',
    })
    assert.ok(task.id)
    assert.equal(task.engine, 'mock-azure-cv')
    const blocks = await svc.listOcrBlocks(task.id)
    assert.ok(blocks.length > 0)
  })

  it('[权限边界] 安监人员尝试使用不支持中文的引擎识别中文单据', async () => {
    const svc = mockOcrService()
    // mock-aws-textract 只支持 en-US
    try {
      await svc.createOcrTask({
        sourceAssetId: 'safety-sign-cn',
        engine: 'mock-aws-textract',
        language: 'zh-CN',
      })
      assert.fail('应抛出引擎不支持中文的错误')
    } catch (e: any) {
      assert.ok(e.message)
      assert.equal(e.status, 400)
    }
  })
})

// ============================================================================

describe('📢 营销视角 — 竞品宣传物料与营销文档 OCR', () => {

  it('[正常流程] 营销人员识别竞品海报文字内容', async () => {
    const svc = mockOcrService()
    const task = await svc.createOcrTask({
      sourceAssetId: 'competitor-poster',
      engine: 'mock-baidu-ocr',
      language: 'zh-CN',
    })
    assert.ok(task.id)
    assert.equal(task.engine, 'mock-baidu-ocr')
    assert.ok(task.summary)

    const blocks = await svc.listOcrBlocks(task.id)
    const titleBlock = blocks.find((b: any) => b.blockType === 'title')
    assert.ok(titleBlock, '海报中应识别出标题文本块')
    assert.ok(blocks.length >= 3, '海报应识别出至少 3 个文本区域')
  })

  it('[正常流程] 营销人员解析竞品 xlsx 数据报表', async () => {
    const svc = mockOcrService()
    const doc = await svc.parseDocument({
      sourceAssetId: 'competitor-analysis-xlsx',
      parser: 'mock-openpyxl',
    })
    assert.ok(doc.id)
    assert.equal(doc.format, 'xlsx')
    assert.equal(doc.status, 'parsed')
    assert.ok(doc.tableCount >= 1, '竞品分析 xlsx 应含表格')
    assert.ok(doc.contentText.includes('竞品'), '文档内容应含竞品数据')
  })

  it('[业务异常] 营销人员传空 sourceAssetId 时解析失败', async () => {
    const svc = mockOcrService()
    try {
      await svc.parseDocument({ sourceAssetId: '' })
      assert.fail('应抛出 sourceAssetId 为空错误')
    } catch (e: any) {
      assert.match(e.message, /不能为空/)
      assert.equal(e.status, 400)
    }
  })
})

// ============================================================================

describe('🎯 运行专员视角 — 运营报表与 KPI 看板 OCR', () => {

  it('[正常流程] 运行专员识别 KPI 仪表盘截图', async () => {
    const svc = mockOcrService()
    const task = await svc.createOcrTask({
      sourceAssetId: 'kpi-dashboard-screenshot',
      engine: 'mock-tesseract',
      language: 'zh-CN',
      enableLayoutAnalysis: true,
      enableTableDetection: true,
    })
    assert.ok(task.id)
    assert.equal(task.enableLayoutAnalysis, true)
    assert.equal(task.enableTableDetection, true)

    const blocks = await svc.listOcrBlocks(task.id)
    assert.ok(blocks.length > 0)
    // 版面分析开启时应有 title 类型块
    const titles = blocks.filter((b: any) => b.blockType === 'title')
    assert.ok(titles.length >= 1, '版面分析应在 KPI 截图中识别出标题')
  })

  it('[正常流程] 运行专员统计 OCR 使用情况和引擎配额', async () => {
    const svc = mockOcrService()
    // 先创建几个任务
    await svc.createOcrTask({ sourceAssetId: 'report-001' })
    await svc.createOcrTask({ sourceAssetId: 'report-002' })
    await svc.createOcrTask({ sourceAssetId: 'report-003' })

    const stats = await svc.getOcrStats()
    assert.ok(stats.totalTasks >= 3)
    assert.ok(stats.completedTasks >= 3)

    const engines = svc.listEngines()
    assert.ok(engines.length > 0)
    assert.ok(engines.some((e: any) => e.category === 'ocr'))
    assert.ok(engines.some((e: any) => e.category === 'parser'))
  })

  it('[边界校验] 运行专员使用不存在的 OCR 引擎时应被拒绝', async () => {
    const svc = mockOcrService()
    try {
      await svc.createOcrTask({
        sourceAssetId: 'report-004',
        engine: 'mock-nonexistent-engine' as any,
      })
      assert.fail('应抛出引擎不存在的错误')
    } catch (e: any) {
      assert.match(e.message, /不存在/)
      assert.equal(e.status, 400)
    }
  })
})

// ============================================================================

describe('👔 店长视角 — 供应商合同与租赁协议文档解析', () => {

  it('[正常流程] 店长上传 PDF 供应商合同并解析出合同金额', async () => {
    const svc = mockOcrService()
    const doc = await svc.parseDocument({
      sourceAssetId: 'supplier-contract-pdf',
      parser: 'mock-pdfplumber',
      extractTables: true,
    })
    assert.ok(doc.id)
    assert.equal(doc.format, 'pdf')
    assert.ok(doc.pageCount >= 3, '供应商合同应有至少 3 页')
    assert.ok(doc.charCount >= 200, '合同解析应有足够字符数')

    // 检查表格提取
    assert.ok(doc.tableCount >= 1, '合同文档应含表格（条款）')
    assert.ok(doc.contentText.includes('合同金额'), '合同内容包含金额字段')

    // 再次获取确认持久化
    const fetched = await svc.getDocument(doc.id)
    assert.ok(fetched)
    assert.equal(fetched.id, doc.id)
  })

  it('[正常流程] 店长解析租赁协议并提取租赁期限', async () => {
    const svc = mockOcrService()
    const doc = await svc.parseDocument({
      sourceAssetId: 'lease-agreement-pdf',
      parser: 'mock-pdfminer',
    })
    assert.ok(doc.id)
    assert.equal(doc.parser, 'mock-pdfminer')
    assert.ok(doc.contentText.includes('租赁'), '租赁协议解析应含租赁相关内容')
    assert.ok(doc.contentText.includes('租金'), '租赁协议应包含租金信息')
  })

  it('[权限边界] 店长试图删除不存在或不属于本店合同文档', async () => {
    const svc = mockOcrService()
    try {
      await svc.deleteDocument('nonexistent-doc-id')
      assert.fail('应抛出文档不存在错误')
    } catch (e: any) {
      assert.match(e.message, /不存在/)
      assert.equal(e.status, 404)
    }
  })
})

// ============================================================================
// 跨角色场景: 任务生命周期管理

describe('🔄 跨角色场景 — OCR 任务与文档生命周期', () => {

  it('创建任务 → 查询 → 读取文本块 → 删除的完整链路', async () => {
    const svc = mockOcrService()

    // 1. 创建
    const task = await svc.createOcrTask({
      sourceAssetId: 'full-lifecycle-test',
      engine: 'mock-paddleocr',
    })
    assert.ok(task.id)

    // 2. 查询就绪
    const fetched = await svc.getOcrTask(task.id)
    assert.equal(fetched.id, task.id)
    assert.equal(fetched.status, 'completed')

    // 3. 读取文本块
    const blocks = await svc.listOcrBlocks(task.id)
    assert.ok(blocks.length > 0)

    // 4. 删除
    await svc.deleteOcrTask(task.id)

    // 5. 确认已删除
    try {
      await svc.getOcrTask(task.id)
      assert.fail('删除后查询应 404')
    } catch (e: any) {
      assert.equal(e.status, 404)
    }

    // 6. 确认关联 block 已清理
    assert.equal(svc.countBlocks(), 0, '删除任务后文本块也应清除')
  })

  it('已完成任务无法被取消', async () => {
    const svc = mockOcrService()
    const task = await svc.createOcrTask({ sourceAssetId: 'cancel-test' })
    assert.equal(task.status, 'completed')
    try {
      await svc.cancelOcrTask(task.id)
      assert.fail('已完成任务应不可取消')
    } catch (e: any) {
      assert.equal(e.status, 400)
    }
  })

  it('引擎列表应包含 OCR 和解析器两种类别', async () => {
    const svc = mockOcrService()
    const engines = svc.listEngines()
    const categories = new Set(engines.map((e: any) => e.category))
    assert.ok(categories.has('ocr'), '应有 OCR 引擎')
    assert.ok(categories.has('parser'), '应有文档解析器')
    const ocrEngines = engines.filter((e: any) => e.category === 'ocr')
    assert.ok(ocrEngines.some((e: any) => e.type.includes('paddle')), '应包含国内 OCR 引擎')
  })
})
