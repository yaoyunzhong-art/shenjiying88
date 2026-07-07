import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { OpsManualController } from './ops-manual.controller'
import { OpsManualService, type Role, type ManualSection } from './ops-manual.service'
import type { GenerateManualDto, ExportManualDto, SearchManualDto, GetSopDto, CreateManualRecordDto, ManualRecordQueryDto } from './ops-manual.dto'

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销'
}

function makeController(): OpsManualController {
  return new OpsManualController(new OpsManualService())
}

// ──────────── 🔧 安监 ────────────
describe(`${ROLES.Safety} ops-manual 角色测试`, () => {
  let ctrl: OpsManualController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('安监可以生成本岗位运营手册（安全检查视角）', async () => {
    const dto: GenerateManualDto = { role: 'customer_service', tenantId: 't-safety' }
    const manual = await ctrl.generateManual(dto)
    assert.equal(manual.role, 'customer_service')
    assert.ok(manual.sections.length > 0)
    assert.ok(manual.lastUpdated)
  })

  it('安监可以搜索安全相关的手册内容', async () => {
    const dto: SearchManualDto = { role: 'store_manager', keyword: '安全' }
    const result = await ctrl.searchManual(dto)
    assert.ok(Array.isArray(result.results))
  })

  it('安监可以导出安监岗位检查清单', async () => {
    const dto: ExportManualDto = { role: 'customer_service', format: 'checklist' }
    const result = await ctrl.exportManual(dto)
    assert.equal(result.format, 'checklist')
    assert.ok(result.content.includes('[ ]'))
  })

  it('安监可以导出手册的Markdown版本', async () => {
    const dto: ExportManualDto = { role: 'store_manager', format: 'markdown' }
    const result = await ctrl.exportManual(dto)
    assert.equal(result.format, 'markdown')
    assert.ok(result.content.includes('# '))
  })

  it('安监可以查看手册元信息', async () => {
    const result = await ctrl.getManualInfo({ role: 'store_manager' })
    assert.ok(result.title)
    assert.ok(result.version)
    assert.ok(result.sections > 0)
  })
})

// ──────────── 🎯 运行专员 ────────────
describe(`${ROLES.Ops} ops-manual 角色测试`, () => {
  let ctrl: OpsManualController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('运行专员可以生成店长运营手册', async () => {
    const dto: GenerateManualDto = { role: 'store_manager', tenantId: 't-ops' }
    const manual = await ctrl.generateManual(dto)
    assert.equal(manual.role, 'store_manager')
    assert.equal(manual.title, '店长运营手册')
    assert.equal(manual.sections.length, 7)
  })

  it('运行专员可以获取SOP步骤', async () => {
    const dto: GetSopDto = { role: 'store_manager', sectionId: 'sm-overview' }
    const result = await ctrl.getSOP(dto)
    assert.ok(result.steps.length > 0)
    assert.equal(result.steps[0].action, '晨会召开')
  })

  it('运行专员可以导出HTML格式手册', async () => {
    const dto: ExportManualDto = { role: 'cashier', format: 'html' }
    const result = await ctrl.exportManual(dto)
    assert.equal(result.format, 'html')
    assert.ok(result.content.includes('<!DOCTYPE html>'))
    assert.ok(result.content.includes('<style>'))
  })

  it('运行专员可以搜索手册关键词', async () => {
    const dto: SearchManualDto = { role: 'cashier', keyword: '退款' }
    const result = await ctrl.searchManual(dto)
    assert.ok(result.total > 0)
    assert.ok(result.results.some(r => r.matchedContent.includes('退款')))
  })

  it('运行专员可以导出PDF-JSON格式', async () => {
    const dto: ExportManualDto = { role: 'sales_staff', format: 'pdf-json' }
    const result = await ctrl.exportManual(dto)
    assert.equal(result.format, 'pdf-json')
    const parsed = JSON.parse(result.content)
    assert.ok(parsed.metadata)
    assert.ok(parsed.sections)
  })
})

// ──────────── 👔 店长 ────────────
describe(`${ROLES.TenantAdmin} ops-manual 角色测试`, () => {
  let ctrl: OpsManualController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('店长可以生成本门店的运营手册', async () => {
    const dto: GenerateManualDto = { role: 'store_manager', tenantId: 't-store', generatedBy: '店长张三' }
    const manual = await ctrl.generateManual(dto)
    assert.equal(manual.role, 'store_manager')
    assert.equal(manual.sections.length, 7)
    assert.ok(manual.lastUpdated)
  })

  it('店长可以创建手册生成记录', async () => {
    const dto: CreateManualRecordDto = {
      tenantId: 't-store',
      role: 'store_manager',
      title: '门店运营手册v1',
      totalSections: 7,
      totalPages: 12,
      estimatedReadTime: 15,
      generatedBy: '店长张三'
    }
    const record = await ctrl.createRecord(dto)
    assert.equal(record.role, 'store_manager')
    assert.equal(record.title, '门店运营手册v1')
    assert.ok(record.id)
  })

  it('店长可以查询手册生成记录', async () => {
    await ctrl.createRecord({
      tenantId: 't-store',
      role: 'store_manager',
      title: '门店运营手册',
      generatedBy: '店长张三'
    })
    await ctrl.createRecord({
      tenantId: 't-store',
      role: 'sales_staff',
      title: '导购运营手册',
      generatedBy: '店长张三'
    })
    const dto: ManualRecordQueryDto = { tenantId: 't-store', role: 'store_manager' }
    const list = await ctrl.listRecords(dto)
    assert.ok(list.total >= 1)
    assert.equal(list.data[0].role, 'store_manager')
  })

  it('店长可以查看特定生成记录详情', async () => {
    const record = await ctrl.createRecord({
      tenantId: 't-store',
      role: 'store_manager',
      title: '手册v1',
      generatedBy: '店长张三'
    })
    const detail = await ctrl.getRecord(record.id)
    assert.ok(detail)
    assert.equal(detail!.id, record.id)
  })

  it('店长可以查看导购手册元信息', async () => {
    const result = await ctrl.getManualInfo({ role: 'sales_staff' })
    assert.equal(result.title, '导购运营手册')
    assert.equal(result.sections, 6)
  })
})

// ──────────── 👥 HR ────────────
describe(`${ROLES.HR} ops-manual 角色测试`, () => {
  let ctrl: OpsManualController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('HR可以生成导购手册用于培训', async () => {
    const dto: GenerateManualDto = { role: 'sales_staff', tenantId: 't-hr' }
    const manual = await ctrl.generateManual(dto)
    assert.equal(manual.role, 'sales_staff')
    assert.equal(manual.sections.length, 6)
    assert.ok(manual.sections.find((s: ManualSection) => s.title === '收入计算'))
  })

  it('HR可以生成收银手册用于新员工培训', async () => {
    const dto: GenerateManualDto = { role: 'cashier', tenantId: 't-hr' }
    const manual = await ctrl.generateManual(dto)
    assert.equal(manual.sections.length, 6)
    const titles = manual.sections.map((s: ManualSection) => s.title)
    assert.ok(titles.includes('收银系统'))
    assert.ok(titles.includes('退款处理'))
  })

  it('HR可以导出检查清单用于培训考核', async () => {
    const dto: ExportManualDto = { role: 'cashier', format: 'checklist' }
    const result = await ctrl.exportManual(dto)
    assert.equal(result.format, 'checklist')
    const checkCount = (result.content.match(/\[ \]/g) || []).length
    assert.ok(checkCount >= 6)
  })

  it('HR可以搜索客服手册内容', async () => {
    const dto: SearchManualDto = { role: 'customer_service', keyword: '积分' }
    const result = await ctrl.searchManual(dto)
    assert.ok(result.total > 0)
  })

  it('HR可以获取客服SOP话术', async () => {
    const dto: GetSopDto = { role: 'customer_service', sectionId: 'cs-script-welcome' }
    const result = await ctrl.getSOP(dto)
    assert.ok(result.steps.length > 0)
    assert.equal(result.steps[0].action, '问候客户')
  })
})

// ──────────── 跨角色边界测试 ────────────
describe('多角色 ops-manual 边界测试', () => {
  it('不存在的sectionId返回空SOP', async () => {
    const ctrl = makeController()
    const dto: GetSopDto = { role: 'store_manager', sectionId: 'nonexistent-id' }
    const result = await ctrl.getSOP(dto)
    assert.equal(result.steps.length, 0)
  })

  it('不匹配的关键词搜索返回空结果', async () => {
    const ctrl = makeController()
    const dto: SearchManualDto = { role: 'sales_staff', keyword: 'xyzabc123xyzabc123' }
    const result = await ctrl.searchManual(dto)
    assert.equal(result.total, 0)
  })

  it('所有角色手册都有必要字段', async () => {
    const ctrl = makeController()
    const svc = new OpsManualService()
    const roles: Role[] = ['store_manager', 'sales_staff', 'cashier', 'customer_service']
    for (const role of roles) {
      const manual = svc.generateManual(role)
      assert.ok(manual.role)
      assert.ok(manual.title)
      assert.ok(manual.version)
      assert.ok(manual.sections.length > 0)
      assert.ok(manual.totalPages > 0)
      assert.ok(manual.estimatedReadTime > 0)
    }
  })

  it('不存在的记录ID返回null', async () => {
    const ctrl = makeController()
    const result = await ctrl.getRecord('999999')
    assert.equal(result, null)
  })

  it('默认分页page和pageSize正确', async () => {
    const ctrl = makeController()
    const result = await ctrl.listRecords({})
    assert.equal(result.page, 1)
    assert.equal(result.pageSize, 10)
  })

  it('店长手册导出Markdown包含所有章节', async () => {
    const ctrl = makeController()
    const dto: ExportManualDto = { role: 'store_manager', format: 'markdown' }
    const result = await ctrl.exportManual(dto)
    assert.ok(result.content.includes('门店运营概览'))
    assert.ok(result.content.includes('人员管理'))
    assert.ok(result.content.includes('财务管理'))
    assert.ok(result.content.includes('库存管理'))
    assert.ok(result.content.includes('营销活动'))
    assert.ok(result.content.includes('客诉处理'))
    assert.ok(result.content.includes('数据看板'))
  })
})
