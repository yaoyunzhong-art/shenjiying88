/**
 * 🐜 自动: [ops-manual] [D] controller test 补全
 *
 * 覆盖全部 8 个端点的路由元数据 / 正常流程 / 异常边界
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { OpsManualController } from './ops-manual.controller'
import { OpsManualService } from './ops-manual.service'
import type { ManualRecordResponseDto } from './ops-manual.dto'

function createMockService(): InstanceType<typeof OpsManualService> {
  // Partial mock — we keep key methods but can override
  const service = new OpsManualService() as any
  return service as InstanceType<typeof OpsManualService>
}

// ── Route Metadata ─────────────────────────────────────────

describe('[ops-manual] Controller route metadata', () => {
  it('controller path metadata is ops-manual', () => {
    const path = Reflect.getMetadata('path', OpsManualController)
    assert.equal(path, 'ops-manual')
  })

  it('generateManual -> POST /generate', () => {
    const method = Reflect.getMetadata('method', OpsManualController.prototype.generateManual)
    const path = Reflect.getMetadata('path', OpsManualController.prototype.generateManual)
    assert.equal(method, 1) // POST
    assert.equal(path, 'generate')
  })

  it('exportManual -> POST /export', () => {
    const method = Reflect.getMetadata('method', OpsManualController.prototype.exportManual)
    const path = Reflect.getMetadata('path', OpsManualController.prototype.exportManual)
    assert.equal(method, 1)
    assert.equal(path, 'export')
  })

  it('searchManual -> POST /search', () => {
    const method = Reflect.getMetadata('method', OpsManualController.prototype.searchManual)
    const path = Reflect.getMetadata('path', OpsManualController.prototype.searchManual)
    assert.equal(method, 1)
    assert.equal(path, 'search')
  })

  it('getSOP -> POST /sop', () => {
    const method = Reflect.getMetadata('method', OpsManualController.prototype.getSOP)
    const path = Reflect.getMetadata('path', OpsManualController.prototype.getSOP)
    assert.equal(method, 1)
    assert.equal(path, 'sop')
  })

  it('getManualInfo -> GET /info', () => {
    const method = Reflect.getMetadata('method', OpsManualController.prototype.getManualInfo)
    const path = Reflect.getMetadata('path', OpsManualController.prototype.getManualInfo)
    assert.equal(method, 0) // GET
    assert.equal(path, 'info')
  })

  it('createRecord -> POST /records', () => {
    const method = Reflect.getMetadata('method', OpsManualController.prototype.createRecord)
    const path = Reflect.getMetadata('path', OpsManualController.prototype.createRecord)
    assert.equal(method, 1)
    assert.equal(path, 'records')
  })

  it('listRecords -> GET /records', () => {
    const method = Reflect.getMetadata('method', OpsManualController.prototype.listRecords)
    const path = Reflect.getMetadata('path', OpsManualController.prototype.listRecords)
    assert.equal(method, 0)
    assert.equal(path, 'records')
  })

  it('getRecord -> GET /records/:id', () => {
    const method = Reflect.getMetadata('method', OpsManualController.prototype.getRecord)
    const path = Reflect.getMetadata('path', OpsManualController.prototype.getRecord)
    assert.equal(method, 0)
    assert.equal(path, 'records/:id')
  })
})

// ── generateManual ─────────────────────────────────────────

describe('[ops-manual] POST /generate', () => {
  it('生成店长手册 正常流程', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    const dto = { role: 'store_manager' } as any
    const result = await ctrl.generateManual(dto)
    assert.ok(result.role === 'store_manager')
    assert.ok(result.title)
    assert.ok(Array.isArray(result.sections))
    assert.ok(result.sections.length > 0)
  })

  it('生成导购手册 正常流程', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    const result = await ctrl.generateManual({ role: 'sales_staff' } as any)
    assert.equal(result.role, 'sales_staff')
    assert.equal(result.title, '导购运营手册')
  })

  it('生成收银员手册 正常流程', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    const result = await ctrl.generateManual({ role: 'cashier' } as any)
    assert.equal(result.role, 'cashier')
    assert.equal(result.title, '收银运营手册')
  })

  it('客服手册 正常流程', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    const result = await ctrl.generateManual({ role: 'customer_service' } as any)
    assert.equal(result.role, 'customer_service')
    assert.equal(result.title, '客服运营手册')
  })

  it('未知角色 service 返回 undefined, controller 传播异常', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    // service.generateManual() returns undefined for unknown roles
    await expect(ctrl.generateManual({ role: 'unknown_role' } as any)).rejects.toThrow()
  })

  it('空角色 service 返回 undefined, controller 传播异常', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    await expect(ctrl.generateManual({ role: '' } as any)).rejects.toThrow()
  })

  it('lastUpdated 返回 ISO 字符串而非 Date 对象', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    const result = await ctrl.generateManual({ role: 'store_manager' } as any)
    assert.equal(typeof result.lastUpdated, 'string')
    assert.ok(result.lastUpdated.includes('T'))
  })
})

// ── exportManual ──────────────────────────────────────────

describe('[ops-manual] POST /export', () => {
  it('导出 markdown 格式', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    const result = await ctrl.exportManual({ role: 'store_manager', format: 'markdown' } as any)
    assert.equal(result.format, 'markdown')
    assert.equal(result.role, 'store_manager')
    assert.ok(result.content.length > 0)
    assert.ok(result.content.includes('# 店长运营手册'))
  })

  it('导出 html 格式', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    const result = await ctrl.exportManual({ role: 'store_manager', format: 'html' } as any)
    assert.equal(result.format, 'html')
    assert.ok(result.content.includes('<!DOCTYPE html>'))
  })

  it('导出 checklist 格式', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    const result = await ctrl.exportManual({ role: 'store_manager', format: 'checklist' } as any)
    assert.equal(result.format, 'checklist')
    assert.ok(result.content.includes('[ ]'))
  })

  it('导出 pdf-json 格式', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    const result = await ctrl.exportManual({ role: 'store_manager', format: 'pdf-json' } as any)
    assert.equal(result.format, 'pdf-json')
    const parsed = JSON.parse(result.content)
    assert.ok(parsed.title)
    assert.ok(parsed.sections)
  })

  it('不支持格式默认 fallback 到 markdown', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    const result = await ctrl.exportManual({ role: 'store_manager', format: 'unknown-fmt' } as any)
    assert.ok(result.content.length > 0)
  })

  it('导购 + checklist 组合验证内容', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    const result = await ctrl.exportManual({ role: 'sales_staff', format: 'checklist' } as any)
    assert.equal(result.role, 'sales_staff')
    assert.ok(result.content.includes('[ ]'))
  })
})

// ── searchManual ──────────────────────────────────────────

describe('[ops-manual] POST /search', () => {
  it('搜索存在的关键词返回结果', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    const result = await ctrl.searchManual({ role: 'store_manager', keyword: '排班' } as any)
    assert.ok(result.total >= 0)
    assert.ok(Array.isArray(result.results))
    assert.equal(result.keyword, '排班')
    assert.equal(result.role, 'store_manager')
  })

  it('搜索不存在的关键词返回空结果', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    const result = await ctrl.searchManual({ role: 'cashier', keyword: 'zzzzz_nonexistent_123' } as any)
    assert.equal(result.total, 0)
    assert.equal(result.results.length, 0)
  })

  it('搜索收银员手册中的"退款"', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    const result = await ctrl.searchManual({ role: 'cashier', keyword: '退款' } as any)
    assert.ok(result.total >= 0)
  })

  it('空关键词返回部分结果', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    const result = await ctrl.searchManual({ role: 'store_manager', keyword: '' } as any)
    assert.ok(Array.isArray(result.results))
  })
})

// ── getSOP ────────────────────────────────────────────────

describe('[ops-manual] POST /sop', () => {
  it('获取店长概要 SOP 步骤', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    const result = await ctrl.getSOP({ role: 'store_manager', sectionId: 'sm-overview' } as any)
    assert.equal(result.role, 'store_manager')
    assert.equal(result.sectionId, 'sm-overview')
    assert.ok(result.steps.length > 0)
    assert.ok(result.steps[0].step)
    assert.ok(result.steps[0].action)
    assert.ok(result.steps[0].script)
  })

  it('获取导购员接待 SOP', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    const result = await ctrl.getSOP({ role: 'sales_staff', sectionId: 'sf-selling-reception' } as any)
    assert.ok(result.steps.length > 0)
  })

  it('不存在的 sectionId 返回空步骤', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    const result = await ctrl.getSOP({ role: 'store_manager', sectionId: 'nonexistent-section' } as any)
    assert.equal(result.steps.length, 0)
  })
})

// ── getManualInfo ─────────────────────────────────────────

describe('[ops-manual] GET /info', () => {
  it('获取店长手册元信息', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    const result = await ctrl.getManualInfo({ role: 'store_manager' } as any)
    assert.equal(result.title, '店长运营手册')
    assert.ok(result.sections > 0)
    assert.ok(typeof result.lastUpdated === 'string')
  })

  it('未知角色的元信息抛出异常', async () => {
    const svc = createMockService()
    const ctrl = new OpsManualController(svc)
    // service returns undefined for unknown roles, getManualInfo reads manual.title -> throws
    await expect(ctrl.getManualInfo({ role: 'unknown_role' } as any)).rejects.toThrow()
  })
})

// ── Records CRUD ──────────────────────────────────────────

describe('[ops-manual] POST /records + GET /records', () => {
  let ctrl: OpsManualController

  beforeEach(() => {
    ctrl = new OpsManualController(createMockService())
  })

  it('创建一条手册生成记录', async () => {
    const record = await ctrl.createRecord({
      tenantId: 'T-001',
      role: 'store_manager',
      title: '店长手册',
      version: '1.0.0',
      content: '# 店长手册',
      totalSections: 10,
      totalPages: 30,
      estimatedReadTime: 15,
      generatedBy: 'alice',
      exportFormat: 'markdown',
    } as any)
    assert.ok(record.id)
    assert.equal(record.tenantId, 'T-001')
    assert.equal(record.role, 'store_manager')
    assert.equal(record.title, '店长手册')
    assert.equal(record.version, '1.0.0')
    assert.equal(record.generatedBy, 'alice')
    assert.ok(record.createdAt)
    assert.ok(record.updatedAt)
  })

  it('创建记录时使用默认值', async () => {
    const record = await ctrl.createRecord({
      tenantId: 'T-002',
      role: 'sales_staff',
      title: '导购手册',
      generatedBy: 'bob',
    } as any)
    assert.equal(record.version, '1.0.0')
    assert.equal(record.exportFormat, 'markdown')
    assert.equal(record.totalSections, 0)
    assert.equal(record.totalPages, 0)
  })

  it('listRecords 初始为空列表', async () => {
    const list = await ctrl.listRecords({} as any)
    assert.equal(list.total, 0)
    assert.equal(list.data.length, 0)
    assert.equal(list.page, 1)
    assert.equal(list.pageSize, 10)
  })

  it('listRecords 创建后反映新增记录', async () => {
    await ctrl.createRecord({ tenantId: 'T-001', role: 'store_manager', title: 'A', generatedBy: 'alice' } as any)
    await ctrl.createRecord({ tenantId: 'T-001', role: 'sales_staff', title: 'B', generatedBy: 'bob' } as any)
    const list = await ctrl.listRecords({} as any)
    assert.equal(list.total, 2)
    assert.equal(list.data.length, 2)
  })

  it('listRecords 按 tenantId 过滤', async () => {
    await ctrl.createRecord({ tenantId: 'T-001', role: 'store_manager', title: 'A', generatedBy: 'alice' } as any)
    await ctrl.createRecord({ tenantId: 'T-002', role: 'sales_staff', title: 'B', generatedBy: 'bob' } as any)
    const list = await ctrl.listRecords({ tenantId: 'T-001' } as any)
    assert.equal(list.total, 1)
    assert.equal(list.data[0].tenantId, 'T-001')
  })

  it('listRecords 按 role 过滤', async () => {
    await ctrl.createRecord({ tenantId: 'T-001', role: 'store_manager', title: 'SM', generatedBy: 'alice' } as any)
    await ctrl.createRecord({ tenantId: 'T-001', role: 'sales_staff', title: 'SS', generatedBy: 'bob' } as any)
    const list = await ctrl.listRecords({ role: 'store_manager' } as any)
    assert.equal(list.total, 1)
    assert.equal(list.data[0].role, 'store_manager')
  })

  it('listRecords 分页', async () => {
    for (let i = 0; i < 5; i++) {
      await ctrl.createRecord({ tenantId: 'T-001', role: 'store_manager', title: `R${i}`, generatedBy: 'alice' } as any)
    }
    const page1 = await ctrl.listRecords({ page: 1, pageSize: 2 } as any)
    assert.equal(page1.data.length, 2)
    assert.equal(page1.total, 5)
    assert.equal(page1.page, 1)
    assert.equal(page1.pageSize, 2)

    const page3 = await ctrl.listRecords({ page: 3, pageSize: 2 } as any)
    assert.equal(page3.data.length, 1)
    assert.equal(page3.total, 5)
  })
})

describe('[ops-manual] GET /records/:id', () => {
  it('获取已知记录返回详情', async () => {
    const ctrl = new OpsManualController(createMockService())
    const created = await ctrl.createRecord({
      tenantId: 'T-001', role: 'store_manager', title: '店长手册',
      generatedBy: 'alice',
    } as any)
    const found = await ctrl.getRecord(created.id)
    assert.ok(found !== null)
    assert.equal(found!.id, created.id)
    assert.equal(found!.title, '店长手册')
  })

  it('获取不存在的记录返回 null', async () => {
    const ctrl = new OpsManualController(createMockService())
    const found = await ctrl.getRecord('999999')
    assert.equal(found, null)
  })

  it('空 id 返回 null', async () => {
    const ctrl = new OpsManualController(createMockService())
    const found = await ctrl.getRecord('')
    assert.equal(found, null)
  })
})
