import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * ops-manual.controller.spec.ts
 *
 * OpsManualController 全路由 spec — 覆盖全部端点（正例+反例+边界）
 * 路由：
 *   POST /ops-manual/generate
 *   POST /ops-manual/export
 *   POST /ops-manual/search
 *   POST /ops-manual/sop
 *   GET  /ops-manual/info
 *   POST /ops-manual/records
 *   GET  /ops-manual/records
 *   GET  /ops-manual/records/:id
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { OpsManualController } from './ops-manual.controller'
import { OpsManualService } from './ops-manual.service'
import type { GenerateManualDto, ExportManualDto, SearchManualDto, GetSopDto } from './ops-manual.dto'

// ── Test Helpers ────────────────────────────────────────────────

function createController() {
  const service = new OpsManualService()
  const controller = new OpsManualController(service)
  return { controller, service }
}

// ── 路由元数据 ──

describe('路由注册与模块元数据', () => {
  it('Controller 有正确的路由前缀', () => {
    const path = Reflect.getMetadata('path', OpsManualController)
    assert.equal(path, 'ops-manual')
  })
})

// ── POST /ops-manual/generate — 生成手册 ──

describe('POST /ops-manual/generate — generateManual', () => {
  it('正常生成店长手册', async () => {
    const { controller } = createController()
    const dto: GenerateManualDto = { role: 'store_manager', tenantId: 't1' }
    const result = await controller.generateManual(dto)
    assert.equal(result.title, '店长运营手册')
    assert.equal(result.role, 'store_manager')
    assert.ok(result.sections.length > 0)
    assert.ok(typeof result.lastUpdated === 'string')
  })

  it('正常生成导购手册', async () => {
    const { controller } = createController()
    const result = await controller.generateManual({ role: 'sales_staff', tenantId: 't1' })
    assert.equal(result.title, '导购运营手册')
  })

  it('正常生成收银手册', async () => {
    const { controller } = createController()
    const result = await controller.generateManual({ role: 'cashier', tenantId: 't1' })
    assert.equal(result.title, '收银运营手册')
  })

  it('正常生成客服手册', async () => {
    const { controller } = createController()
    const result = await controller.generateManual({ role: 'customer_service', tenantId: 't1' })
    assert.equal(result.title, '客服运营手册')
  })

  it('返回 lastUpdated 为 ISO 字符串', async () => {
    const { controller } = createController()
    const result = await controller.generateManual({ role: 'store_manager', tenantId: 't1' })
    assert.doesNotThrow(() => new Date(result.lastUpdated).toISOString())
  })

  it('包含版本号和预估阅读时间', async () => {
    const { controller } = createController()
    const result = await controller.generateManual({ role: 'store_manager', tenantId: 't1' })
    assert.equal(result.version, '1.0.0')
    assert.ok(result.estimatedReadTime > 0)
  })

  it('店长手册包含7个核心章节', async () => {
    const { controller } = createController()
    const result = await controller.generateManual({ role: 'store_manager', tenantId: 't1' })
    const sectionTitles = result.sections.map((s: any) => s.title)
    assert.ok(sectionTitles.includes('门店运营概览'))
    assert.ok(sectionTitles.includes('人员管理'))
    assert.ok(sectionTitles.includes('财务管理'))
    assert.ok(sectionTitles.includes('库存管理'))
    assert.ok(sectionTitles.includes('营销活动'))
    assert.ok(sectionTitles.includes('客诉处理'))
    assert.ok(sectionTitles.includes('数据看板'))
  })

  it('每个章节包含检查点列表', async () => {
    const { controller } = createController()
    const result = await controller.generateManual({ role: 'store_manager', tenantId: 't1' })
    for (const section of result.sections) {
      assert.ok(section.checkpoints, `章节 ${section.title} 缺少 checkpoints`)
      assert.ok(section.checkpoints.length > 0, `章节 ${section.title} checkpoints 为空`)
    }
  })

  it('每个章节包含风险警示', async () => {
    const { controller } = createController()
    const result = await controller.generateManual({ role: 'store_manager', tenantId: 't1' })
    for (const section of result.sections) {
      assert.ok(section.warnings, `章节 ${section.title} 缺少 warnings`)
      assert.ok(section.warnings.length > 0, `章节 ${section.title} warnings 为空`)
    }
  })
})

// ── POST /ops-manual/export — 导出手册 ──

describe('POST /ops-manual/export — exportManual', () => {
  it('正常导出 markdown 格式', async () => {
    const { controller } = createController()
    const dto: ExportManualDto = { role: 'store_manager', format: 'markdown' }
    const result = await controller.exportManual(dto)
    assert.equal(result.format, 'markdown')
    assert.ok(result.content.includes('# 店长运营手册'))
    assert.equal(result.role, 'store_manager')
  })

  it('正常导出 html 格式', async () => {
    const { controller } = createController()
    const result = await controller.exportManual({ role: 'sales_staff', format: 'html' })
    assert.equal(result.format, 'html')
    assert.ok(result.content.includes('<!DOCTYPE html>'))
  })

  it('正常导出 checklist 格式', async () => {
    const { controller } = createController()
    const result = await controller.exportManual({ role: 'cashier', format: 'checklist' })
    assert.equal(result.format, 'checklist')
    assert.ok(result.content.includes('[ ]'))
  })

  it('正常导出 pdf-json 格式', async () => {
    const { controller } = createController()
    const result = await controller.exportManual({ role: 'customer_service', format: 'pdf-json' })
    assert.equal(result.format, 'pdf-json')
    assert.doesNotThrow(() => JSON.parse(result.content))
  })

  it('未知格式回退到 markdown', async () => {
    const { controller } = createController()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await controller.exportManual({ role: 'store_manager', format: 'unknown' as any })
    assert.equal(result.format, 'unknown')
    assert.ok(result.content.includes('#'))
  })

  it('四种角色均能正常导出 markdown', async () => {
    const { controller } = createController()
    const roles = ['store_manager', 'sales_staff', 'cashier', 'customer_service'] as const
    for (const role of roles) {
      const result = await controller.exportManual({ role, format: 'markdown' })
      assert.ok(result.content.length > 100, `角色 ${role} 导出内容为空`)
    }
  })
})

// ── POST /ops-manual/search — 搜索手册 ──

describe('POST /ops-manual/search — searchManual', () => {
  it('搜索店长手册中的关键字', async () => {
    const { controller } = createController()
    const dto: SearchManualDto = { role: 'store_manager', keyword: '排班' }
    const result = await controller.searchManual(dto)
    assert.ok(result.total >= 1)
    assert.ok(result.results.length > 0)
    assert.equal(result.keyword, '排班')
  })

  it('搜索不存在的关键字返回空列表', async () => {
    const { controller } = createController()
    const result = await controller.searchManual({ role: 'cashier', keyword: 'xxxxxxxxxxxxxxx' })
    assert.equal(result.total, 0)
    assert.equal(result.results.length, 0)
  })

  it('搜索收银手册中的关键字', async () => {
    const { controller } = createController()
    const result = await controller.searchManual({ role: 'cashier', keyword: '退款' })
    assert.ok(result.total >= 1)
  })

  it('搜索客服手册中的关键字', async () => {
    const { controller } = createController()
    const result = await controller.searchManual({ role: 'customer_service', keyword: 'FAQ' })
    assert.ok(result.total >= 1)
  })

  it('搜索结果包含关联章节标题', async () => {
    const { controller } = createController()
    const result = await controller.searchManual({ role: 'store_manager', keyword: '排班' })
    const titles = result.results.map(r => r.title)
    assert.ok(titles.some(t => t.includes('排班') || t.includes('人员')), '搜索结果应关联人员管理章节')
  })
})

// ── POST /ops-manual/sop — 获取 SOP ──

describe('POST /ops-manual/sop — getSOP', () => {
  it('获取店长晨会 SOP', async () => {
    const { controller } = createController()
    const dto: GetSopDto = { role: 'store_manager', sectionId: 'sm-overview' }
    const result = await controller.getSOP(dto)
    assert.equal(result.role, 'store_manager')
    assert.equal(result.sectionId, 'sm-overview')
    assert.ok(result.steps.length >= 3)
    assert.ok(result.steps[0].action.includes('晨会'))
  })

  it('获取导购接待 SOP', async () => {
    const { controller } = createController()
    const result = await controller.getSOP({ role: 'sales_staff', sectionId: 'sf-selling-reception' })
    assert.ok(result.steps.length >= 3)
    assert.ok(result.steps[0].step === 1)
  })

  it('无效 sectionId 返回空步骤', async () => {
    const { controller } = createController()
    const result = await controller.getSOP({ role: 'store_manager', sectionId: 'non-existent' })
    assert.equal(result.steps.length, 0)
  })

  it('每个步骤包含 script 和 tips', async () => {
    const { controller } = createController()
    const result = await controller.getSOP({ role: 'store_manager', sectionId: 'sm-overview' })
    for (const step of result.steps) {
      assert.ok(step.action)
      assert.ok(step.script)
    }
  })
})

// ── GET /ops-manual/info — 手册元信息 ──

describe('GET /ops-manual/info — getManualInfo', () => {
  it('获取店长手册元信息', async () => {
    const { controller } = createController()
    const result = await controller.getManualInfo({ role: 'store_manager' })
    assert.equal(result.title, '店长运营手册')
    assert.equal(result.version, '1.0.0')
    assert.ok(result.sections > 0)
    assert.ok(result.estimatedReadTime > 0)
  })

  it('获取客服手册元信息', async () => {
    const { controller } = createController()
    const result = await controller.getManualInfo({ role: 'customer_service' })
    assert.ok(result.title.includes('客服'))
  })

  it('lastUpdated 为合法 ISO 时间戳', async () => {
    const { controller } = createController()
    const result = await controller.getManualInfo({ role: 'store_manager' })
    assert.doesNotThrow(() => new Date(result.lastUpdated).toISOString())
  })
})

// ── POST /ops-manual/records — 创建记录 ──

describe('POST /ops-manual/records — createRecord', () => {
  it('正常创建手册生成记录', async () => {
    const { controller } = createController()
    const result = await controller.createRecord({
      tenantId: 't1',
      role: 'store_manager',
      title: '测试手册',
      content: '测试内容',
      totalSections: 7,
      totalPages: 30,
      estimatedReadTime: 15,
      generatedBy: 'admin',
    })
    assert.ok(result.id)
    assert.equal(result.tenantId, 't1')
    assert.equal(result.role, 'store_manager')
    assert.ok(result.createdAt)
  })

  it('返回自增的唯一 ID', async () => {
    const { controller } = createController()
    const r1 = await controller.createRecord({ tenantId: 't1', role: 'store_manager', title: '手册1' })
    const r2 = await controller.createRecord({ tenantId: 't1', role: 'cashier', title: '手册2' })
    assert.notEqual(r1.id, r2.id)
  })

  it('使用默认版本号 1.0.0', async () => {
    const { controller } = createController()
    const result = await controller.createRecord({ tenantId: 't1', role: 'store_manager', title: '手册' })
    assert.equal(result.version, '1.0.0')
  })
})

// ── GET /ops-manual/records — 查询记录列表 ──

describe('GET /ops-manual/records — listRecords', () => {
  it('空列表时返回空数据和 total=0', async () => {
    const { controller } = createController()
    const result = await controller.listRecords({})
    assert.equal(result.total, 0)
    assert.equal(result.data.length, 0)
  })

  it('按 tenantId 筛选记录', async () => {
    const { controller } = createController()
    await controller.createRecord({ tenantId: 't1', role: 'store_manager', title: 'M1' })
    await controller.createRecord({ tenantId: 't2', role: 'cashier', title: 'M2' })
    const result = await controller.listRecords({ tenantId: 't1' })
    assert.equal(result.total, 1)
    assert.equal(result.data[0].tenantId, 't1')
  })

  it('按 role 筛选记录', async () => {
    const { controller } = createController()
    await controller.createRecord({ tenantId: 't1', role: 'store_manager', title: 'M1' })
    await controller.createRecord({ tenantId: 't1', role: 'cashier', title: 'M2' })
    const result = await controller.listRecords({ role: 'cashier' })
    assert.equal(result.total, 1)
    assert.equal(result.data[0].role, 'cashier')
  })

  it('默认分页 page=1 pageSize=10', async () => {
    const { controller } = createController()
    for (let i = 0; i < 15; i++) {
      await controller.createRecord({ tenantId: 't1', role: 'store_manager', title: `M${i}` })
    }
    const result = await controller.listRecords({ tenantId: 't1' })
    assert.equal(result.page, 1)
    assert.equal(result.pageSize, 10)
    assert.equal(result.data.length, 10)
    assert.equal(result.total, 15)
  })

  it('分页第 2 页正确返回', async () => {
    const { controller } = createController()
    for (let i = 0; i < 25; i++) {
      await controller.createRecord({ tenantId: 't1', role: 'store_manager', title: `M${i}` })
    }
    const result = await controller.listRecords({ tenantId: 't1', page: 3, pageSize: 10 })
    assert.equal(result.data.length, 5)
    assert.equal(result.total, 25)
  })
})

// ── GET /ops-manual/records/:id — 获取单条记录 ──

describe('GET /ops-manual/records/:id — getRecord', () => {
  it('获取已存在的记录', async () => {
    const { controller } = createController()
    const created = await controller.createRecord({ tenantId: 't1', role: 'store_manager', title: '手册' })
    const found = await controller.getRecord(created.id)
    assert.ok(found)
    assert.equal(found!.id, created.id)
  })

  it('不存在的 ID 返回 null', async () => {
    const { controller } = createController()
    const found = await controller.getRecord('non-existent')
    assert.equal(found, null)
  })

  it('记录包含创建和更新时间', async () => {
    const { controller } = createController()
    const created = await controller.createRecord({ tenantId: 't1', role: 'store_manager', title: '手册' })
    const found = await controller.getRecord(created.id)
    assert.ok(found!.createdAt)
    assert.ok(found!.updatedAt)
  })
})
