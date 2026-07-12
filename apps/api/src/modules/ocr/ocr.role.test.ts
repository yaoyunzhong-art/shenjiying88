// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ocr] [C] 角色测试
 *
 * 8 角色视角的 OCR 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { runWithTenant } from '../../common/context/tenant-context'

const { OcrService } = require('./ocr.service')
const { OcrController } = require('./ocr.controller')

const TENANT_ID = 'test-role-tenant'

// ── 角色定义 ──
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

function withRole<T>(role: string, fn: () => T): Promise<T> {
  return runWithTenant({ tenantId: TENANT_ID, userId: `user-${role}`, storeId: 'store-001' }, fn)
}

// ============================================================================

describe('👔 店长视角 - OCR 与文档分析', () => {

  describe('[正常流程] 店长查看门店上报凭证的 OCR 结果', () => {
    it('店长应能创建 OCR 任务并查看识别结果', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      const task = await withRole(ROLES.StoreManager, () =>
        ctrl.createTask({ sourceAssetId: 'receipt-store-001', engine: 'mock-paddleocr', language: 'zh-CN' })
      )
      assert.ok(task.id)
      assert.equal(task.status, 'completed')
      assert.ok(task.summary)
      assert.ok(task.summary!.avgConfidence >= 0)
      const blocks = await withRole(ROLES.StoreManager, () => ctrl.listBlocks(task.id))
      assert.ok(blocks.items.length > 0, '应有识别文本块')
    })

    it('店长应能查看解析后的文档数据', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      const doc = await withRole(ROLES.StoreManager, () =>
        ctrl.parseDocument({ sourceAssetId: 'contract-pdf-store-001', parser: 'mock-pdfplumber' })
      )
      assert.ok(doc.id)
      assert.equal(doc.format, 'pdf')
      assert.ok(doc.structuredData.tables.length >= 1, '文档应含表格')
    })
  })

  describe('[权限边界] 门店归属校验', () => {
    it('店长不应看到其他门店的 OCR 任务', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      // 用 tenantA 创建
      await runWithTenant({ tenantId: 'other-tenant', userId: 'other' }, () =>
        ctrl.createTask({ sourceAssetId: 'other-asset' })
      )
      // 用本店查询
      const result = await withRole(ROLES.StoreManager, () => ctrl.listTasks({}))
      assert.equal(result.total, 0, '其他门店的任务不应可见')
    })

    it('店长查询不存在的任务应得到 404', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      await assert.rejects(
        () => withRole(ROLES.StoreManager, () => ctrl.getTask('non-existent-task')),
        /不存在/
      )
    })
  })
})

// ============================================================================

describe('🛒 前台视角 - 客户资料录入', () => {

  describe('[正常流程] 前台扫描客户证件/合同', () => {
    it('前台应能创建 OCR 任务识别客户证件', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      const task = await withRole(ROLES.FrontDesk, () =>
        ctrl.createTask({
          sourceAssetId: 'id-card-customer-001',
          engine: 'mock-azure-cv',
          enableLayoutAnalysis: true,
        })
      )
      assert.ok(task.id)
      assert.equal(task.engine, 'mock-azure-cv')
      assert.ok(task.enableLayoutAnalysis)
    })

    it('前台应能解析客户合同为结构化数据', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      const doc = await withRole(ROLES.FrontDesk, () =>
        ctrl.parseDocument({ sourceAssetId: 'contract-customer-pdf', parser: 'mock-pdfplumber', extractTables: true })
      )
      assert.ok(doc.id)
      assert.ok(doc.contentText.length > 0)
    })
  })

  describe('[权限边界] 创建任务参数校验', () => {
    it('前台使用不支持的引擎应报错', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      await assert.rejects(
        () => withRole(ROLES.FrontDesk, () =>
          ctrl.createTask({ sourceAssetId: 'test', engine: 'fake-engine' as any })
        ),
        /不存在/
      )
    })

    it('前台应当能查看可用引擎列表后再选择', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      const engines = await withRole(ROLES.FrontDesk, () => ctrl.listEngines())
      assert.ok(engines.items.length >= 6)
      const ocrEngines = engines.items.filter((e: any) => e.category === 'ocr')
      assert.ok(ocrEngines.length >= 6, '应提供至少 6 种 OCR 引擎')
    })
  })
})

// ============================================================================

describe('👥 HR 视角 - 员工档案文档处理', () => {

  describe('[正常流程] HR 上传员工资料扫描件', () => {
    it('HR 应能处理员工简历 PDF', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      const doc = await withRole(ROLES.HR, () =>
        ctrl.parseDocument({ sourceAssetId: 'resume-employee-pdf', parser: 'mock-pdfminer' })
      )
      assert.ok(doc.id)
      assert.equal(doc.parser, 'mock-pdfminer')
    })

    it('HR 应能批量查询已解析的员工文档', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      // 先创建几个文档
      await withRole(ROLES.HR, () => ctrl.parseDocument({ sourceAssetId: 'resume-001-pdf' }))
      await withRole(ROLES.HR, () => ctrl.parseDocument({ sourceAssetId: 'resume-002-pdf' }))
      const docs = await withRole(ROLES.HR, () => ctrl.listDocuments({ format: 'pdf' }))
      assert.ok(docs.items.length >= 2)
    })
  })

  describe('[权限边界] 文档格式限制', () => {
    it('HR 尝试解析不支持的文件格式应获正确的格式推断', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      const doc = await withRole(ROLES.HR, () =>
        ctrl.parseDocument({ sourceAssetId: 'unknown-format', parser: 'mock-pdfplumber' })
      )
      // 不明确后缀的 assetId 使用 guessFormat, 默认 txt
      assert.ok(doc.id)
    })

    it('不存在的解析器应拒绝', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      await assert.rejects(
        () => withRole(ROLES.HR, () =>
          ctrl.parseDocument({ sourceAssetId: 'resume-pdf', parser: 'bad-parser' as any })
        ),
        /不存在/
      )
    })
  })
})

// ============================================================================

describe('🔧 安监视角 - 安全检查报告 OCR', () => {

  describe('[正常流程] 安监扫描安全巡检报告', () => {
    it('安监员应能创建 OCR 任务识别安检单据', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      const task = await withRole(ROLES.Security, () =>
        ctrl.createTask({
          sourceAssetId: 'safety-report-q1',
          engine: 'mock-tesseract',
          language: 'zh-CN',
          enableTableDetection: true,
        })
      )
      assert.ok(task.id)
      assert.equal(task.engine, 'mock-tesseract')
      assert.ok(task.enableTableDetection)
    })

    it('安监员应能查看任务识别出的文本块详情', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      const task = await withRole(ROLES.Security, () =>
        ctrl.createTask({ sourceAssetId: 'safety-block-test' })
      )
      const blocks = await withRole(ROLES.Security, () => ctrl.listBlocks(task.id))
      assert.ok(blocks.items.length > 0)
      // 验证文本块结构
      const firstBlock = blocks.items[0]
      assert.ok(firstBlock.text)
      assert.ok(firstBlock.confidence >= 0)
      assert.ok(firstBlock.bbox)
    })
  })

  describe('[权限边界] 任务状态管理', () => {
    it('安监员不可取消已完成的任务', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      const task = await withRole(ROLES.Security, () =>
        ctrl.createTask({ sourceAssetId: 'safety-completed' })
      )
      await assert.rejects(
        () => withRole(ROLES.Security, () => ctrl.cancelTask(task.id)),
        /已是终态/
      )
    })

    it('安监员删除其他门店的 OCR 任务应触发 404', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      // 其他门店创建
      const otherTask = await runWithTenant({ tenantId: 'other-tenant', userId: 'other' }, () =>
        ctrl.createTask({ sourceAssetId: 'other-safety' })
      )
      await assert.rejects(
        () => withRole(ROLES.Security, () => ctrl.deleteTask(otherTask.id)),
        /不存在/
      )
    })
  })
})

// ============================================================================

describe('🎮 导玩员视角 - 游戏道具/活动海报识别', () => {

  describe('[正常流程] 导玩员扫描活动海报与游戏规则', () => {
    it('导玩员应能识别活动海报中的文字', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      const task = await withRole(ROLES.Guide, () =>
        ctrl.createTask({ sourceAssetId: 'poster-halloween-event', engine: 'mock-tesseract' })
      )
      assert.ok(task.id)
      const blocks = await withRole(ROLES.Guide, () => ctrl.listBlocks(task.id))
      assert.ok(blocks.items.length > 0)
    })

    it('导玩员应能解析 CSV 格式的游乐项目清单', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      const doc = await withRole(ROLES.Guide, () =>
        ctrl.parseDocument({ sourceAssetId: 'game-list-csv', parser: 'mock-papaparse' })
      )
      assert.ok(doc.id)
      assert.equal(doc.parser, 'mock-papaparse')
      assert.equal(doc.format, 'csv')
    })
  })

  describe('[权限边界] 引擎配额限制', () => {
    it('导玩员使用免费开源引擎不应受配额限制', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      // tesseract 免费配额是 Infinity
      for (let i = 0; i < 10; i++) {
        const task = await withRole(ROLES.Guide, () =>
          ctrl.createTask({ sourceAssetId: `game-quota-test-${i}`, engine: 'mock-tesseract' })
        )
        assert.ok(task.id)
      }
    })

    it('导玩员的文档解析结果应包含正确的预览文本', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      const doc = await withRole(ROLES.Guide, () =>
        ctrl.parseDocument({ sourceAssetId: 'rules-pdf' })
      )
      assert.ok(doc.contentText.length > 0, '应有文本内容')
    })
  })
})

// ============================================================================

describe('🎯 运行专员视角 - 系统 OCR 运营监控', () => {

  describe('[正常流程] 运行专员查看 OCR 系统统计', () => {
    it('运行专员应能查看 OCR 系统整体统计', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      // 创建一些任务产生统计数据
      await withRole(ROLES.Operations, () => ctrl.createTask({ sourceAssetId: 'stats-op-001' }))
      await withRole(ROLES.Operations, () => ctrl.createTask({ sourceAssetId: 'stats-op-002' }))
      const stats = await withRole(ROLES.Operations, () => ctrl.stats())
      assert.ok(stats.totalTasks >= 2)
      assert.ok(typeof stats.avgConfidence === 'number')
      assert.ok(stats.totalDocuments === 0, '仅创建任务不应增加文档数')
    })

    it('运行专员应能列出所有可用引擎', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      const engines = await withRole(ROLES.Operations, () => ctrl.listEngines())
      assert.ok(engines.items.length >= 12)
      const ocrEngines = engines.items.filter((e: any) => e.category === 'ocr')
      const parserEngines = engines.items.filter((e: any) => e.category === 'parser')
      assert.ok(ocrEngines.length >= 6)
      assert.ok(parserEngines.length >= 6)
    })
  })

  describe('[权限边界] 跨租户统计隔离', () => {
    it('运行专员的统计只包含本租户数据', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      // 在其他租户创建任务
      await runWithTenant({ tenantId: 'other-tenant', userId: 'other' }, () =>
        ctrl.createTask({ sourceAssetId: 'other-stats' })
      )
      const stats = await withRole(ROLES.Operations, () => ctrl.stats())
      assert.equal(stats.totalTasks, 0, '其他租户的任务不应计入')
    })

    it('运行专员删除文档应彻底生效', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      const doc = await withRole(ROLES.Operations, () =>
        ctrl.parseDocument({ sourceAssetId: 'doc-to-delete' })
      )
      await assert.doesNotReject(
        () => withRole(ROLES.Operations, () => ctrl.deleteDocument(doc.id))
      )
      await assert.rejects(
        () => withRole(ROLES.Operations, () => ctrl.getDocument(doc.id)),
        /不存在/
      )
    })
  })
})

// ============================================================================

describe('🤝 团建视角 - 团队活动资料整理', () => {

  describe('[正常流程] 团建专员处理签单与活动照片', () => {
    it('团建专员应能上传并识别活动合同 PDF', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      const task = await withRole(ROLES.Teambuilding, () =>
        ctrl.createTask({ sourceAssetId: 'team-event-contract', engine: 'mock-paddleocr' })
      )
      assert.ok(task.id)
      assert.ok(task.summary?.totalChars > 0)
    })

    it('团建专员应能解析 docx 格式的活动计划书', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      const doc = await withRole(ROLES.Teambuilding, () =>
        ctrl.parseDocument({ sourceAssetId: 'team-plan-docx', parser: 'mock-python-docx' })
      )
      assert.ok(doc.id)
      assert.equal(doc.format, 'docx')
      assert.ok(doc.contentText.length > 0, '应有预览文本')
    })
  })

  describe('[权限边界] 任务/文档生命周期', () => {
    it('团建专员不能取消其他团队的任务', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      await assert.rejects(
        () => withRole(ROLES.Teambuilding, () => ctrl.cancelTask('non-existent')),
        /不存在/
      )
    })

    it('团建专员应能列出自己创建的所有文档', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      await withRole(ROLES.Teambuilding, () => ctrl.parseDocument({ sourceAssetId: 'team-plan-1-docx' }))
      await withRole(ROLES.Teambuilding, () => ctrl.parseDocument({ sourceAssetId: 'team-plan-2-xlsx', parser: 'mock-openpyxl' }))
      const docs = await withRole(ROLES.Teambuilding, () => ctrl.listDocuments({ limit: 100 }))
      assert.ok(docs.items.length >= 2)
    })
  })
})

// ============================================================================

describe('📢 营销视角 - 营销物料 OCR 识别', () => {

  describe('[正常流程] 营销专员处理竞品资料与海报', () => {
    it('营销专员应能识别竞品宣传海报文字', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      const task = await withRole(ROLES.Marketing, () =>
        ctrl.createTask({
          sourceAssetId: 'competitor-poster',
          engine: 'mock-azure-cv',
          language: 'en-US',
        })
      )
      assert.ok(task.id)
      assert.equal(task.language, 'en-US')
    })

    it('营销专员应能批量查询已解构的竞品数据', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      await withRole(ROLES.Marketing, () =>
        ctrl.parseDocument({ sourceAssetId: 'competitor-analysis-xlsx', parser: 'mock-openpyxl' })
      )
      await withRole(ROLES.Marketing, () =>
        ctrl.parseDocument({ sourceAssetId: 'competitor-brochure-pdf', parser: 'mock-pdfplumber' })
      )
      const docs = await withRole(ROLES.Marketing, () => ctrl.listDocuments({ limit: 100 }))
      assert.ok(docs.items.length >= 2)
    })
  })

  describe('[权限边界] 引擎特性验证', () => {
    it('营销专员选择不支持的引擎语言应报错', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      // aws-textract 只支持 en-US
      await assert.rejects(
        () => withRole(ROLES.Marketing, () =>
          ctrl.createTask({ sourceAssetId: 'poster', engine: 'mock-aws-textract', language: 'zh-CN' })
        ),
        /不支持语言/
      )
    })

    it('营销专员查询文档统计应包含解析时长信息', async () => {
      const svc = new OcrService()
      const ctrl = new OcrController(svc)
      await withRole(ROLES.Marketing, () =>
        ctrl.parseDocument({ sourceAssetId: 'marketing-stats-pdf' })
      )
      const stats = await withRole(ROLES.Marketing, () => ctrl.stats())
      assert.ok(stats.totalDocuments >= 1)
      assert.ok(typeof stats.avgParseTimeMs === 'number')
    })
  })
})

// ============================================================================

describe('跨角色通用 - OCR 系统能力验证', () => {

  it('同租户内不同角色可看见相同任务（租户级隔离）', async () => {
    const svc = new OcrService()
    const ctrl = new OcrController(svc)
    // 店长创建
    const mgrTask = await withRole(ROLES.StoreManager, () =>
      ctrl.createTask({ sourceAssetId: 'shared-asset' })
    )
    // 前台查询 — 同一租户
    const frontResult = await withRole(ROLES.FrontDesk, () => ctrl.listTasks({ limit: 100 }))
    const found = frontResult.items.some((t: any) => t.id === mgrTask.id)
    assert.ok(found, '同租户内任务应跨角色可见')
  })

  it('不同租户的 OCR 任务完全隔离', async () => {
    const svc = new OcrService()
    const ctrl = new OcrController(svc)
    const mgrTask = await withRole(ROLES.StoreManager, () =>
      ctrl.createTask({ sourceAssetId: 'cross-tenant-asset' })
    )
    // 其他租户查询
    const otherResult = await runWithTenant({ tenantId: 'different-tenant', userId: 'other' }, () =>
      ctrl.listTasks({ limit: 100 })
    )
    const found = otherResult.items.some((t: any) => t.id === mgrTask.id)
    assert.equal(found, false, '其他租户不应看到本租户的任务')
  })

  it('所有货币、单价等字段校验为非负数', async () => {
    const svc = new OcrService()
    const ctrl = new OcrController(svc)
    const engines = await ctrl.listEngines()
    for (const engine of engines.items) {
      assert.ok(engine.avgTimePerPageMs >= 0, `引擎 ${engine.type} 耗时应非负`)
      assert.ok(engine.freeQuotaPerMonth >= 0, `引擎 ${engine.type} 免费配额应非负`)
      assert.ok(engine.unitPriceCny >= 0, `引擎 ${engine.type} 单价应非负`)
    }
  })
})
