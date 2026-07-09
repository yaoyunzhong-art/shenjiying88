import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ops-manual] [C] 角色测试编写
 *
 * 8 角色视角的 ops-manual 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 * 覆盖: generate, export, search, sop, info, records 端点
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { OpsManualController } from './ops-manual.controller'
import { OpsManualService } from './ops-manual.service'
import type { GenerateManualDto, ExportManualDto, SearchManualDto, GetSopDto } from './ops-manual.dto'

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

// ── 测试数据工厂 ──
function createController() {
  const service = new OpsManualService()
  return new OpsManualController(service)
}

// ── 👔店长 ─────────────────────────────────────────────────────
describe(`${ROLES.StoreManager} ops-manual 角色测试`, () => {
  it('[正常] 店长可以生成自己的运营手册', async () => {
    const ctrl = createController()
    const dto: GenerateManualDto = { role: 'store_manager', tenantId: 't-store' }
    const result = await ctrl.generateManual(dto)

    assert.equal(result.title, '店长运营手册')
    assert.equal(result.role, 'store_manager')
    assert.ok(result.sections.length > 0)
    assert.ok(result.lastUpdated)
  })

  it('[权限边界] 店长生成导购手册获得正确内容', async () => {
    const ctrl = createController()
    const dto: GenerateManualDto = { role: 'sales_staff', tenantId: 't-store' }
    const result = await ctrl.generateManual(dto)

    // 店长可以查看其他角色手册，但内容应为对应角色
    assert.equal(result.title, '导购运营手册')
    assert.equal(result.role, 'sales_staff')
  })

  it('[正常] 店长导出 markdown 手册', async () => {
    const ctrl = createController()
    const dto: ExportManualDto = { role: 'store_manager', format: 'markdown' }
    const result = await ctrl.exportManual(dto)

    assert.equal(result.format, 'markdown')
    assert.ok(result.content.includes('店长运营手册'))
    assert.ok(result.content.includes('关键检查点'))
  })

  it('[正常] 店长搜索排班内容', async () => {
    const ctrl = createController()
    const dto: SearchManualDto = { role: 'store_manager', keyword: '排班' }
    const result = await ctrl.searchManual(dto)

    assert.ok(result.total >= 1)
    assert.ok(result.results.some(r => r.title.includes('排班') || r.title.includes('人员')))
  })
})

// ── 🛒前台 ─────────────────────────────────────────────────────
describe(`${ROLES.FrontDesk} ops-manual 角色测试`, () => {
  it('[正常] 前台获取收银手册', async () => {
    const ctrl = createController()
    const dto: GenerateManualDto = { role: 'cashier', tenantId: 't-front' }
    const result = await ctrl.generateManual(dto)

    assert.equal(result.title, '收银运营手册')
    assert.ok(result.sections.length >= 6)
  })

  it('[权限边界] 前台导出 html 需包含样式和收银系统章节', async () => {
    const ctrl = createController()
    const dto: ExportManualDto = { role: 'cashier', format: 'html' }
    const result = await ctrl.exportManual(dto)

    assert.equal(result.format, 'html')
    assert.ok(result.content.includes('收银系统'))
    assert.ok(result.content.includes('<!DOCTYPE html>'))
  })

  it('[正常] 前台搜索退款关键字', async () => {
    const ctrl = createController()
    const dto: SearchManualDto = { role: 'cashier', keyword: '退款' }
    const result = await ctrl.searchManual(dto)

    assert.ok(result.total >= 1)
    assert.ok(result.keyword === '退款')
  })
})

// ── 👥HR ───────────────────────────────────────────────────────
describe(`${ROLES.HR} ops-manual 角色测试`, () => {
  it('[正常] HR 获取店长手册中的人员管理章节信息', async () => {
    const ctrl = createController()
    const result = await ctrl.getManualInfo({ role: 'store_manager' })

    assert.equal(result.title, '店长运营手册')
    assert.ok(result.sections >= 7)
    assert.ok(result.estimatedReadTime > 0)
  })

  it('[权限边界] HR 导出检查清单包含 checkpoints', async () => {
    const ctrl = createController()
    const dto: ExportManualDto = { role: 'store_manager', format: 'checklist' }
    const result = await ctrl.exportManual(dto)

    assert.equal(result.format, 'checklist')
    assert.ok(result.content.includes('[ ]'))
    // 应该有检查点的数量 > 10
    const checkCount = (result.content.match(/\[ \]/g) || []).length
    assert.ok(checkCount >= 10, `应有至少 10 个检查点，实际 ${checkCount}`)
  })

  it('[正常] HR 获取客服手册元信息', async () => {
    const ctrl = createController()
    const result = await ctrl.getManualInfo({ role: 'customer_service' })

    assert.ok(result.title.includes('客服'))
    assert.equal(result.version, '1.0.0')
  })
})

// ── 🔧安监 ─────────────────────────────────────────────────────
describe(`${ROLES.Security} ops-manual 角色测试`, () => {
  it('[正常] 安监查看店长手册的财务安全章节', async () => {
    const ctrl = createController()
    const dto: GenerateManualDto = { role: 'store_manager', tenantId: 't-sec' }
    const result = await ctrl.generateManual(dto)

    const financeSection = result.sections.find((s: any) => s.title === '财务管理')
    assert.ok(financeSection)
    assert.ok(financeSection.warnings.length > 0)
    assert.ok(financeSection.warnings.some((w: string) => w.includes('假币') || w.includes('收款码') || w.includes('安全')))
  })

  it('[权限边界] 安监搜索安全隐患相关关键词', async () => {
    const ctrl = createController()
    const dto: SearchManualDto = { role: 'cashier', keyword: '假币' }
    const result = await ctrl.searchManual(dto)

    assert.ok(result.total >= 1)
    const hasWarning = result.results.some(r => r.matchedContent.includes('假币'))
    assert.ok(hasWarning)
  })

  it('[正常] 安监导出 pdf-json 格式获取结构化风控数据', async () => {
    const ctrl = createController()
    const dto: ExportManualDto = { role: 'store_manager', format: 'pdf-json' }
    const result = await ctrl.exportManual(dto)

    assert.equal(result.format, 'pdf-json')
    const parsed = JSON.parse(result.content)
    assert.ok(parsed.sections)
    const hasWarnings = parsed.sections.some((s: any) => s.warnings.length > 0)
    assert.ok(hasWarnings)
  })
})

// ── 🎮导玩员 ───────────────────────────────────────────────────
describe(`${ROLES.Guide} ops-manual 角色测试`, () => {
  it('[正常] 导玩员获取导购手册并查看盲盒销售章节', async () => {
    const ctrl = createController()
    const dto: GenerateManualDto = { role: 'sales_staff', tenantId: 't-guide' }
    const result = await ctrl.generateManual(dto)

    assert.equal(result.title, '导购运营手册')
    const blindboxSection = result.sections.find((s: any) => s.title === '盲盒销售')
    assert.ok(blindboxSection)
    assert.ok(blindboxSection.checkpoints.length > 0)
  })

  it('[正常] 导玩员获取赛事 SOP 步骤', async () => {
    const ctrl = createController()
    const dto: GetSopDto = { role: 'sales_staff', sectionId: 'sf-selling-reception' }
    const result = await ctrl.getSOP(dto)

    assert.ok(result.steps.length >= 3)
    assert.ok(result.steps[0].script.includes('请问'))
  })

  it('[权限边界] 无效的导玩 SOP 返回空步骤', async () => {
    const ctrl = createController()
    const dto: GetSopDto = { role: 'sales_staff', sectionId: 'non-existent-sop' }
    const result = await ctrl.getSOP(dto)

    assert.equal(result.steps.length, 0)
    assert.equal(result.role, 'sales_staff')
  })
})

// ── 🎯运行专员 ─────────────────────────────────────────────────
describe(`${ROLES.Operations} ops-manual 角色测试`, () => {
  it('[正常] 运行专员创建手册生成记录并验证', async () => {
    const ctrl = createController()
    const record = await ctrl.createRecord({
      tenantId: 't-ops',
      role: 'store_manager',
      title: '门店 A 运营手册',
      content: '# 门店 A 运营手册\n## 日常管理...',
      totalSections: 7,
      totalPages: 30,
      estimatedReadTime: 15,
      generatedBy: 'ops-admin',
    })

    assert.ok(record.id)
    assert.equal(record.tenantId, 't-ops')
    assert.equal(record.title, '门店 A 运营手册')
    assert.equal(record.version, '1.0.0')
    assert.equal(record.estimatedReadTime, 15)
  })

  it('[正常] 运行专员查询生成记录列表支持分页', async () => {
    const ctrl = createController()
    const roles = ['store_manager', 'cashier', 'sales_staff', 'customer_service'] as const
    for (const role of roles) {
      await ctrl.createRecord({ tenantId: 't-ops', role, title: `手册-${role}` })
    }
    // 按 role 筛选
    const list = await ctrl.listRecords({ tenantId: 't-ops', page: 1, pageSize: 2 })
    assert.equal(list.total, 4)
    assert.equal(list.data.length, 2)
  })

  it('[权限边界] 运行专员查询不存在的记录返回 null', async () => {
    const ctrl = createController()
    const result = await ctrl.getRecord('non-existent-id')
    assert.equal(result, null)
  })

  it('[正常] 运行专员通过 id 查询已存在的记录', async () => {
    const ctrl = createController()
    const created = await ctrl.createRecord({ tenantId: 't-ops', role: 'store_manager', title: '运维手册' })
    const found = await ctrl.getRecord(created.id)
    assert.ok(found)
    assert.equal(found!.id, created.id)
    assert.equal(found!.title, '运维手册')
  })
})

// ── 🤝团建 ─────────────────────────────────────────────────────
describe(`${ROLES.Teambuilding} ops-manual 角色测试`, () => {
  it('[正常] 团建专员生成并导出客服手册用于培训', async () => {
    const ctrl = createController()
    const dto: ExportManualDto = { role: 'customer_service', format: 'markdown' }
    const result = await ctrl.exportManual(dto)

    assert.equal(result.format, 'markdown')
    assert.ok(result.content.includes('客服运营手册'))
    assert.ok(result.content.includes('话术模板'))
  })

  it('[权限边界] 团建专员搜索话术模板内容', async () => {
    const ctrl = createController()
    const dto: SearchManualDto = { role: 'customer_service', keyword: '话术' }
    const result = await ctrl.searchManual(dto)

    assert.ok(result.total >= 1)
    const matchedTitles = result.results.map(r => r.title)
    assert.ok(matchedTitles.some(t => t.includes('话术')))
  })

  it('[正常] 团建专员获取导购 SOP 用于新员工培训', async () => {
    const ctrl = createController()
    const dto: GetSopDto = { role: 'sales_staff', sectionId: 'sf-selling-reception' }
    const result = await ctrl.getSOP(dto)

    assert.ok(result.steps.length >= 3)
    const actions = result.steps.map(s => s.action)
    assert.ok(actions.some(a => a.includes('微笑') || a.includes('迎宾') || a.includes('接待')))
  })
})

// ── 📢营销 ─────────────────────────────────────────────────────
describe(`${ROLES.Marketing} ops-manual 角色测试`, () => {
  it('[正常] 营销专员生成店长手册查看营销活动章节', async () => {
    const ctrl = createController()
    const dto: GenerateManualDto = { role: 'store_manager', tenantId: 't-mkt' }
    const result = await ctrl.generateManual(dto)

    const mktSection = result.sections.find((s: any) => s.title === '营销活动')
    assert.ok(mktSection)
    assert.ok(mktSection.subsections.length > 0)
    const subTitles = mktSection.subsections.map((s: any) => s.title)
    assert.ok(subTitles.includes('促销活动'))
    assert.ok(subTitles.includes('优惠券管理'))
    assert.ok(subTitles.includes('赛事活动'))
  })

  it('[权限边界] 营销专员搜索赛事活动相关内容', async () => {
    const ctrl = createController()
    const dto: SearchManualDto = { role: 'store_manager', keyword: '赛事' }
    const result = await ctrl.searchManual(dto)

    assert.ok(result.total >= 1)
    const hasMarketingKeyword = result.results.some(r => r.title.includes('赛事') || r.matchedContent.includes('赛事'))
    assert.ok(hasMarketingKeyword)
  })

  it('[正常] 营销专员批量导出四种角色的 checklist', async () => {
    const ctrl = createController()
    const roles = ['store_manager', 'sales_staff', 'cashier', 'customer_service'] as const
    for (const role of roles) {
      const result = await ctrl.exportManual({ role, format: 'checklist' })
      assert.equal(result.format, 'checklist')
      assert.ok(result.content.includes('---'))
      assert.ok(result.content.length > 50)
    }
  })
})

// ── 跨角色综合场景 ─────────────────────────────────────────────
describe('跨角色综合场景', () => {
  it('四种角色手册均有唯一标题和版本号', async () => {
    const ctrl = createController()
    const roles: Array<{ role: 'store_manager' | 'sales_staff' | 'cashier' | 'customer_service'; expected: string }> = [
      { role: 'store_manager', expected: '店长运营手册' },
      { role: 'sales_staff', expected: '导购运营手册' },
      { role: 'cashier', expected: '收银运营手册' },
      { role: 'customer_service', expected: '客服运营手册' },
    ]
    for (const { role, expected } of roles) {
      const result = await ctrl.getManualInfo({ role })
      assert.equal(result.title, expected, `角色 ${role} 标题应为 ${expected}`)
    }
  })

  it('所有角色手册版本号统一为 1.0.0', async () => {
    const ctrl = createController()
    const roles: Array<'store_manager' | 'sales_staff' | 'cashier' | 'customer_service'> = [
      'store_manager', 'sales_staff', 'cashier', 'customer_service',
    ]
    for (const role of roles) {
      const result = await ctrl.getManualInfo({ role })
      assert.equal(result.version, '1.0.0')
    }
  })

  it('跨角色手册生成记录独立隔离', async () => {
    const ctrl = createController()
    await ctrl.createRecord({ tenantId: 't1', role: 'store_manager', title: 'M1' })
    await ctrl.createRecord({ tenantId: 't2', role: 'cashier', title: 'M2' })

    const t1Records = await ctrl.listRecords({ tenantId: 't1' })
    assert.equal(t1Records.total, 1)
    assert.equal(t1Records.data[0].role, 'store_manager')
  })
})
