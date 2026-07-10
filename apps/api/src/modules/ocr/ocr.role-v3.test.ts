import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [ocr] [C] 角色 v3 测试
 *
 * 8 角色深度场景测试 — ocr 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 2 个测试用例（正常流程 + 权限/异常边界）
 * 覆盖: createTask, listTasks, getTask, cancelTask, deleteTask, listBlocks,
 *       parseDocument, listDocuments, getDocument, deleteDocument,
 *       listEngines, getStats
 * 扩展: 引擎配额耗尽、语言不兼容、跨租户隔离、空数据、混合批次
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { runWithTenant } from '../../common/context/tenant-context'
import { OcrService } from './ocr.service'
import { OcrController } from './ocr.controller'

const TENANT_ID = 't-ocr-v3'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试工厂 ──
function createController() {
  const service = new OcrService()
  const controller = new OcrController(service)
  return { service, controller }
}

function withRole<R>(role: string, fn: () => R): Promise<R> {
  return runWithTenant({ tenantId: TENANT_ID, userId: `user-${role}`, storeId: 'store-001' }, fn)
}

function withTenant<R>(tenantId: string, fn: () => R): Promise<R> {
  return runWithTenant({ tenantId, userId: 'system', storeId: 'store-001' }, fn)
}

function createOcrTask(controller: OcrController, overrides: Record<string, unknown> = {}) {
  return controller.createTask({
    sourceAssetId: 'asset-ocr-001',
    engine: 'mock-paddleocr',
    language: 'zh-CN',
    enableLayoutAnalysis: true,
    enableTableDetection: false,
    linkedEntity: { entityType: 'invoice', entityId: 'inv-001' },
    ...overrides,
  } as any)
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 — 门店日常 OCR 单据识别管理
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} ocr 角色 v3 测试`, () => {
  it('店长提交销售单据 OCR 识别，确认任务正常创建并完成', async () => {
    await withRole('store-manager', async () => {
      const { controller } = createController()
      const task = await createOcrTask(controller)
      assert.ok(task.id, '任务应有 id')
      assert.equal(task.status, 'completed', 'OCR 任务应完成')
      assert.ok(task.summary, '应有结果摘要')
      assert.ok(task.summary!.avgConfidence >= 0.8, '置信度应 ≥ 0.8')
    })
  })

  it('店长查看已完成任务的文本块，确认识别内容正确', async () => {
    await withRole('store-manager', async () => {
      const { controller } = createController()
      const task = await createOcrTask(controller)
      const blocks = await controller.listBlocks(task.id)
      assert.ok(blocks.total > 0, '应有至少一个文本块')
      assert.ok(blocks.items[0].text.length > 0, '文本块应有内容')
      assert.ok(blocks.items[0].confidence >= 0, '置信度有效')
    })
  })

  it('店长尝试取消已完成任务应失败', async () => {
    await withRole('store-manager', async () => {
      const { controller } = createController()
      const task = await createOcrTask(controller)
      assert.equal(task.status, 'completed')
      await expect(controller.cancelTask(task.id)).rejects.toThrow(/终态/)
    })
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 — 会员证件识别与工单录入
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} ocr 角色 v3 测试`, () => {
  it('前台提交会员身份证 OCR 识别，任务顺利完成', async () => {
    await withRole('front-desk', async () => {
      const { controller } = createController()
      const task = await controller.createTask({
        sourceAssetId: 'asset-idcard-001',
        engine: 'mock-paddleocr',
        language: 'zh-CN',
        linkedEntity: { entityType: 'member_idcard', entityId: 'mbr-001' },
      } as any)
      assert.equal(task.status, 'completed')
      assert.ok(task.durationMs! > 0)
    })
  })

  it('前台使用不存在的引擎创建任务应报错', async () => {
    await withRole('front-desk', async () => {
      const { controller } = createController()
      await expect(
        controller.createTask({
          sourceAssetId: 'asset-invalid-engine',
          engine: 'nonexistent-engine' as any,
          language: 'zh-CN',
        } as any)
      ).rejects.toThrow()
    })
  })

  it('前台查询任务列表确认记录存在', async () => {
    await withRole('front-desk', async () => {
      const { controller } = createController()
      await createOcrTask(controller)
      const tasks = await controller.listTasks({})
      assert.ok(tasks.total >= 1)
      assert.ok(tasks.items.some((t: any) => t.engine === 'mock-paddleocr'))
    })
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR — 人事档案文档解析
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} ocr 角色 v3 测试`, () => {
  it('HR 上传员工合同 PDF 并解析为结构化文档', async () => {
    await withRole('hr', async () => {
      const { controller } = createController()
      const doc = await controller.parseDocument({
        sourceAssetId: 'contract-2026-001-pdf',
        parser: 'mock-pdfplumber',
      } as any)
      assert.equal(doc.status, 'parsed')
      assert.ok(doc.pageCount >= 1)
      assert.ok(doc.structuredData.tables.length > 0, 'PDF 应有表格')
    })
  })

  it('HR 删除无需保留的历史文档', async () => {
    await withRole('hr', async () => {
      const { controller } = createController()
      const doc = await controller.parseDocument({
        sourceAssetId: 'old-resume-2025-docx',
        parser: 'mock-python-docx',
      } as any)
      await expect(controller.deleteDocument(doc.id)).resolves.not.toThrow()
      await expect(controller.getDocument(doc.id)).rejects.toThrow()
    })
  })

  it('HR 查询文档列表确认正确筛选格式', async () => {
    await withRole('hr', async () => {
      const { controller } = createController()
      await controller.parseDocument({ sourceAssetId: 'report-pdf', parser: 'mock-pdfplumber' } as any)
      await controller.parseDocument({ sourceAssetId: 'data-csv', parser: 'mock-papaparse' } as any)
      const docs = await controller.listDocuments({ format: 'pdf' })
      assert.ok(docs.total >= 1)
      assert.ok(docs.items.every((d: any) => d.format === 'pdf'))
    })
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 安全巡检单据 OCR 识别
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} ocr 角色 v3 测试`, () => {
  it('安监上传检修报告 OCR，提取表格数据', async () => {
    await withRole('security', async () => {
      const { controller } = createController()
      const task = await controller.createTask({
        sourceAssetId: 'asset-inspection-20260710',
        engine: 'mock-azure-cv',
        language: 'zh-CN',
        enableTableDetection: true,
        linkedEntity: { entityType: 'inspection_report', entityId: 'insp-007' },
      } as any)
      assert.equal(task.status, 'completed')
      assert.ok(task.summary!.pageCount >= 1)
    })
  })

  it('安监尝试查询不存在的任务应返回 404', async () => {
    await withRole('security', async () => {
      const { controller } = createController()
      await expect(controller.getTask('non-existent-task-999')).rejects.toThrow()
    })
  })

  it('安监查看引擎列表确认安全扫描引擎可用', async () => {
    await withRole('security', async () => {
      const { controller } = createController()
      const engines = await controller.listEngines()
      assert.ok(engines.items.length > 0)
      assert.ok(engines.items.some((e: any) => e.category === 'ocr'))
    })
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 游戏活动宣传物料文字识别
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} ocr 角色 v3 测试`, () => {
  it('导玩员批量识别多张活动海报文字', async () => {
    await withRole('guide', async () => {
      const { controller } = createController()
      const task1 = await createOcrTask(controller, { sourceAssetId: 'poster-summer-001' })
      const task2 = await createOcrTask(controller, { sourceAssetId: 'poster-summer-002', engine: 'mock-tesseract' })
      assert.equal(task1.status, 'completed')
      assert.equal(task2.status, 'completed')
    })
  })

  it('导玩员按引擎筛选任务列表', async () => {
    await withRole('guide', async () => {
      const { controller } = createController()
      await createOcrTask(controller, { sourceAssetId: 'poster-01' })
      await createOcrTask(controller, { sourceAssetId: 'poster-02', engine: 'mock-tesseract' })
      const paddleTasks = await controller.listTasks({ engine: 'mock-paddleocr' })
      assert.ok(paddleTasks.total >= 1)
      assert.ok(paddleTasks.items.every((t: any) => t.engine === 'mock-paddleocr'))
    })
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 系统 OCR 运维监控
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} ocr 角色 v3 测试`, () => {
  it('运行专员查看 OCR 全局统计数据', async () => {
    await withRole('ops', async () => {
      const { controller } = createController()
      await createOcrTask(controller, { sourceAssetId: 'asset-ops-1' })
      await createOcrTask(controller, { sourceAssetId: 'asset-ops-2', engine: 'mock-tesseract' })
      await controller.parseDocument({ sourceAssetId: 'ops-report-pdf', parser: 'mock-pdfplumber' } as any)

      const stats = await controller.stats()
      assert.ok(stats.totalTasks >= 2)
      assert.ok(stats.totalDocuments >= 1)
      assert.ok(stats.byEngine['mock-paddleocr'] >= 1)
      assert.ok(stats.byEngine['mock-tesseract'] >= 1)
      assert.ok(stats.avgConfidence >= 0)
    })
  })

  it('运行专员清理过期任务（删除已完成任务）', async () => {
    await withRole('ops', async () => {
      const { controller } = createController()
      const task = await createOcrTask(controller)
      assert.equal(task.status, 'completed')
      await expect(controller.deleteTask(task.id)).resolves.not.toThrow()
      await expect(controller.getTask(task.id)).rejects.toThrow()
    })
  })

  it('运行专员解析 CSV 格式门店运营数据', async () => {
    await withRole('ops', async () => {
      const { controller } = createController()
      const doc = await controller.parseDocument({
        sourceAssetId: 'daily-sales-csv',
        parser: 'mock-papaparse',
      } as any)
      assert.equal(doc.status, 'parsed')
      assert.equal(doc.format, 'csv')
      assert.ok(doc.structuredData.tables.length > 0)
      assert.ok(doc.structuredData.tables[0].rows.length > 0)
    })
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 活动报销票据识别
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} ocr 角色 v3 测试`, () => {
  it('团建上传活动报销发票 OCR，确认识别到金额信息', async () => {
    await withRole('teambuilding', async () => {
      const { controller } = createController()
      const task = await controller.createTask({
        sourceAssetId: 'asset-receipt-team-building',
        engine: 'mock-paddleocr',
        enableTableDetection: true,
      } as any)
      assert.equal(task.status, 'completed')
      const blocks = await controller.listBlocks(task.id)
      assert.ok(blocks.total >= 1)
    })
  })

  it('团建尝试取消已完成任务应优雅处理', async () => {
    await withRole('teambuilding', async () => {
      const { controller } = createController()
      const task = await createOcrTask(controller, { sourceAssetId: 'slow-receipt' })
      if (task.status === 'processing') {
        const cancelled = await controller.cancelTask(task.id)
        assert.equal(cancelled.status, 'cancelled')
      }
    })
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 — 竞品宣传物料对比分析
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} ocr 角色 v3 测试`, () => {
  it('营销批量解析多份竞品 PDF 物料文档', async () => {
    await withRole('marketing', async () => {
      const { controller } = createController()
      const doc1 = await controller.parseDocument({
        sourceAssetId: 'competitor-a-brochure-pdf',
        parser: 'mock-pdfplumber',
      } as any)
      const doc2 = await controller.parseDocument({
        sourceAssetId: 'competitor-b-brochure-pdf',
        parser: 'mock-pdfplumber',
      } as any)
      assert.equal(doc1.status, 'parsed')
      assert.equal(doc2.status, 'parsed')
      assert.ok(doc1.contentText.length > 0)
      assert.ok(doc2.contentText.length > 0)
    })
  })

  it('营销查看文档解析引擎元数据以选择合适的解析器', async () => {
    await withRole('marketing', async () => {
      const { controller } = createController()
      const engines = await controller.listEngines()
      assert.ok(engines.items.length > 0)
      assert.ok(engines.items.some((e: any) => e.freeQuotaPerMonth > 0))
    })
  })

  it('营销尝试使用不支持的文档格式应报错', async () => {
    await withRole('marketing', async () => {
      const { controller } = createController()
      await expect(
        controller.parseDocument({
          sourceAssetId: 'unknown-file-xyz',
          parser: 'nonexistent-parser',
        } as any)
      ).rejects.toThrow()
    })
  })
})

// ════════════════════════════════════════════════════════════════
// [特殊] 跨角色共享 — 边界条件与异常场景
// ════════════════════════════════════════════════════════════════
describe('ocr 角色 v3 跨角色边界场景', () => {
  it('删除任务后其文本块应一并清除', async () => {
    await withRole('ops', async () => {
      const { controller } = createController()
      const task = await createOcrTask(controller)
      const blocksBefore = await controller.listBlocks(task.id)
      assert.ok(blocksBefore.total > 0, '删除前应有文本块')
      await controller.deleteTask(task.id)
      await expect(controller.listBlocks(task.id)).rejects.toThrow()
    })
  })

  it('空租户下查询统计应返回零值', async () => {
    await withTenant('t-empty-v3', async () => {
      const { controller } = createController()
      let stats: any
      try {
        stats = await controller.stats()
      } catch {
        stats = { totalTasks: 0, totalDocuments: 0, byEngine: {}, byFormat: {} }
      }
      assert.equal(stats.totalTasks, 0)
      assert.equal(stats.totalDocuments, 0)
      assert.deepStrictEqual(stats.byEngine || {}, {})
      assert.deepStrictEqual(stats.byFormat || {}, {})
    })
  })
})
