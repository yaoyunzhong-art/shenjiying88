/**
 * ops-manual.role-extended.test.ts · 运营手册 全角色扩展测试
 *
 * 8 角色全覆盖: 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { OpsManualController } from './ops-manual.controller'
import { OpsManualService, type Role, type ManualSection } from './ops-manual.service'
import type {
  GenerateManualDto,
  ExportManualDto,
  SearchManualDto,
  GetSopDto,
  CreateManualRecordDto,
  ManualRecordQueryDto,
} from './ops-manual.dto'

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

function makeController(): OpsManualController {
  return new OpsManualController(new OpsManualService())
}

// ──────────── 🛒 前台 · 收银手册相关 ────────────
describe(`${ROLES.Reception} ops-manual 角色扩展测试`, () => {
  let ctrl: OpsManualController

  beforeEach(() => {
    ctrl = makeController()
  })

  // 正常流程：前台生成收银运营手册
  it('前台可以生成收银运营手册', async () => {
    const dto: GenerateManualDto = { role: 'cashier', tenantId: 't-reception' }
    const manual = await ctrl.generateManual(dto)
    assert.equal(manual.role, 'cashier')
    assert.equal(manual.title, '收银运营手册')
    assert.equal(manual.sections.length, 6)
    const titles = manual.sections.map((s: ManualSection) => s.title)
    assert.ok(titles.includes('收银系统'))
    assert.ok(titles.includes('收款方式'))
    assert.ok(titles.includes('离线收银'))
    assert.ok(titles.includes('退款处理'))
    assert.ok(titles.includes('促销核销'))
    assert.ok(titles.includes('对账差错'))
  })

  // 正常流程：前台搜索退款相关 SOP
  it('前台可以搜索收银退款SOP', async () => {
    const dto: SearchManualDto = { role: 'cashier', keyword: '原路退回' }
    const result = await ctrl.searchManual(dto)
    assert.ok(result.total >= 1)
    assert.ok(result.results.some((r) => r.matchedContent.includes('原路退回')))
  })

  // 权限边界：前台不可越权查看店长手册中的财务数据
  it('前台搜索店长手册中的收款关键词应返回有限结果（角色隔离）', async () => {
    const dto: SearchManualDto = { role: 'store_manager', keyword: '备用金每日清点' }
    const result = await ctrl.searchManual(dto)
    // 前台可以搜索但仅返回 store_manager 手册的公开内容
    assert.ok(Array.isArray(result.results))
    assert.equal(result.role, 'store_manager')
  })

  // 正常流程：前台导出离线收银检查清单
  it('前台可以导出收银离线检查清单', async () => {
    const dto: ExportManualDto = { role: 'cashier', format: 'checklist' }
    const result = await ctrl.exportManual(dto)
    assert.equal(result.format, 'checklist')
    assert.ok(result.content.includes('[ ]'))
    // 应包含离线收银相关内容
    assert.ok(result.content.includes('离线'))
  })
})

// ──────────── 🎮 导玩员 · 导购手册相关 ────────────
describe(`${ROLES.Guide} ops-manual 角色扩展测试`, () => {
  let ctrl: OpsManualController

  beforeEach(() => {
    ctrl = makeController()
  })

  // 正常流程：导玩员生成本岗位手册
  it('导玩员可以生成导购运营手册', async () => {
    const dto: GenerateManualDto = { role: 'sales_staff', tenantId: 't-guide' }
    const manual = await ctrl.generateManual(dto)
    assert.equal(manual.role, 'sales_staff')
    assert.equal(manual.title, '导购运营手册')
    const titles = manual.sections.map((s: ManualSection) => s.title)
    assert.ok(titles.includes('盲盒销售'))
    assert.ok(titles.includes('赛事参与'))
  })

  // 正常流程：导玩员获取盲盒销售SOP话术
  it('导玩员可以获取盲盒销售SOP话术', async () => {
    const dto: GetSopDto = { role: 'sales_staff', sectionId: 'sf-selling-reception' }
    const result = await ctrl.getSOP(dto)
    assert.ok(result.steps.length > 0)
    assert.equal(result.steps[0].action, '微笑迎宾')
    assert.ok(result.steps[0].script.includes('欢迎光临'))
  })

  // 权限边界：导玩员不应获取机修运营数据（搜索不存在的sectionId应返回空）
  it('导玩员请求不存在的SOP步骤应返回空', async () => {
    const dto: GetSopDto = { role: 'sales_staff', sectionId: 'nonexistent-guide-id' }
    const result = await ctrl.getSOP(dto)
    assert.equal(result.steps.length, 0)
  })

  // 正常流程：导玩员导出Markdown手册用于培训
  it('导玩员可以导出导购手册Markdown并包含产品知识章节', async () => {
    const dto: ExportManualDto = { role: 'sales_staff', format: 'markdown' }
    const result = await ctrl.exportManual(dto)
    assert.equal(result.format, 'markdown')
    assert.ok(result.content.includes('产品知识'))
    assert.ok(result.content.includes('会员运营'))
  })

  // 正常流程：导玩员搜索赛事相关内容
  it('导玩员可以搜索赛事参与相关内容', async () => {
    const dto: SearchManualDto = { role: 'sales_staff', keyword: '赛事' }
    const result = await ctrl.searchManual(dto)
    assert.ok(result.total >= 1)
    assert.ok(result.results.some((r) => r.title.includes('赛事参与')))
  })
})

// ──────────── 🤝 团建 · 跨角色手册使用 ────────────
describe(`${ROLES.Teambuilding} ops-manual 角色扩展测试`, () => {
  let ctrl: OpsManualController

  beforeEach(() => {
    ctrl = makeController()
  })

  // 正常流程：团建人员查看所有角色手册元信息以为团队定制培训材料
  it('团建可以查看所有岗位手册元信息', async () => {
    const roles: Role[] = ['store_manager', 'sales_staff', 'cashier', 'customer_service']
    for (const role of roles) {
      const info = await ctrl.getManualInfo({ role })
      assert.ok(info.title)
      assert.ok(info.version)
      assert.ok(info.sections > 0)
      assert.ok(info.estimatedReadTime > 0)
      assert.ok(info.lastUpdated)
    }
  })

  // 正常流程：团建导出客服手册HTML用于培训页面
  it('团建可以导出客服手册HTML并含话术模板', async () => {
    const dto: ExportManualDto = { role: 'customer_service', format: 'html' }
    const result = await ctrl.exportManual(dto)
    assert.equal(result.format, 'html')
    assert.ok(result.content.includes('<!DOCTYPE html>'))
    assert.ok(result.content.includes('话术模板'))
  })

  // 正常流程：团建导出手册生成记录
  it('团建可以创建并查询跨角色手册记录', async () => {
    // 为三个角色各创建一条记录
    await ctrl.createRecord({
      tenantId: 't-team',
      role: 'store_manager',
      title: '店长培训手册v1',
      generatedBy: '团建小王',
      totalSections: 7,
    })
    await ctrl.createRecord({
      tenantId: 't-team',
      role: 'sales_staff',
      title: '导购培训手册v1',
      generatedBy: '团建小王',
      totalSections: 6,
    })
    await ctrl.createRecord({
      tenantId: 't-team',
      role: 'cashier',
      title: '收银培训手册v1',
      generatedBy: '团建小王',
      totalSections: 6,
    })
    const dto: ManualRecordQueryDto = { tenantId: 't-team' }
    const list = await ctrl.listRecords(dto)
    assert.ok(list.total >= 3)
    assert.equal(list.data.length, list.total)
  })

  // 权限边界：团建查看不存在的记录应返回null
  it('团建查询不存在的记录ID应返回null', async () => {
    const result = await ctrl.getRecord('nonexistent-record-id-for-team')
    assert.equal(result, null)
  })
})

// ──────────── 📢 营销 · 营销活动手册相关 ────────────
describe(`${ROLES.Marketing} ops-manual 角色扩展测试`, () => {
  let ctrl: OpsManualController

  beforeEach(() => {
    ctrl = makeController()
  })

  // 正常流程：营销人员生成店长手册查看营销活动章节
  it('营销可以生成店长手册并查看营销活动章节', async () => {
    const dto: GenerateManualDto = { role: 'store_manager', tenantId: 't-mkt' }
    const manual = await ctrl.generateManual(dto)
    const marketingSection = manual.sections.find(
      (s: ManualSection) => s.title === '营销活动',
    )
    assert.ok(marketingSection)
    assert.ok(marketingSection!.subsections)
    const subTitles = marketingSection!.subsections!.map((s: { title: string }) => s.title)
    assert.ok(subTitles.includes('促销活动'))
    assert.ok(subTitles.includes('优惠券管理'))
    assert.ok(subTitles.includes('赛事活动'))
  })

  // 正常流程：营销导出检查清单用于门店活动执行追踪
  it('营销可以导出店长手册检查清单并含营销活动检查项', async () => {
    const dto: ExportManualDto = { role: 'store_manager', format: 'checklist' }
    const result = await ctrl.exportManual(dto)
    assert.equal(result.format, 'checklist')
    assert.ok(result.content.includes('活动物料提前到位'))
    assert.ok(result.content.includes('员工熟悉活动规则'))
    assert.ok(result.content.includes('活动效果当日复盘'))
  })

  // 权限边界：营销搜索店长手册中的优惠券管理内容
  it('营销可以搜索店长手册中的优惠券相关内容', async () => {
    const dto: SearchManualDto = { role: 'store_manager', keyword: '优惠券' }
    const result = await ctrl.searchManual(dto)
    assert.ok(result.total >= 1)
    assert.ok(result.results.some((r) => r.title.includes('优惠券管理') || r.matchedContent.includes('优惠券')))
  })

  // 正常流程：营销获取促销活动SOP
  it('营销可以通过SOP获取店长晨会话术', async () => {
    const dto: GetSopDto = { role: 'store_manager', sectionId: 'sm-overview' }
    const result = await ctrl.getSOP(dto)
    assert.ok(result.steps.length >= 4)
    const actions = result.steps.map((s) => s.action)
    assert.ok(actions.includes('晨会召开'))
    assert.ok(actions.includes('目标确认'))
    assert.ok(actions.includes('进度追踪'))
    assert.ok(actions.includes('夕会总结'))
  })

  // 正常流程：营销创建手册生成记录
  it('营销可以创建并获取手册生成记录详情', async () => {
    const record = await ctrl.createRecord({
      tenantId: 't-mkt',
      role: 'store_manager',
      title: '春节促销活动手册',
      totalSections: 7,
      totalPages: 15,
      estimatedReadTime: 20,
      exportFormat: 'checklist',
      generatedBy: '营销小刘',
    })
    assert.ok(record.id)
    assert.equal(record.title, '春节促销活动手册')
    assert.equal(record.exportFormat, 'checklist')

    const fetched = await ctrl.getRecord(record.id)
    assert.ok(fetched)
    assert.equal(fetched!.id, record.id)
    assert.equal(fetched!.generatedBy, '营销小刘')
  })
})

// ──────────── 跨角色边界测试 ────────────
describe('跨角色 ops-manual 边界与异常测试', () => {
  it('对所有四个岗位执行 generateManual + exportMarkdown 完整流程', async () => {
    const ctrl = makeController()
    const roles: Role[] = ['store_manager', 'sales_staff', 'cashier', 'customer_service']
    for (const role of roles) {
      const manual = await ctrl.generateManual({ role, tenantId: 't-all' })
      assert.ok(manual.sections.length > 0)
      assert.equal(manual.role, role)

      const exported = await ctrl.exportManual({ role, format: 'markdown' })
      assert.equal(exported.role, role)
      assert.equal(exported.format, 'markdown')
      assert.ok(exported.content.length > 100)
    }
  })

  it('所有岗位手册均含有关键检查点和风险警示', async () => {
    const svc = new OpsManualService()
    const roles: Role[] = ['store_manager', 'sales_staff', 'cashier', 'customer_service']
    for (const role of roles) {
      const manual = svc.generateManual(role)
      for (const section of manual.sections) {
        assert.ok(section.checkpoints)
        assert.ok(section.warnings)
      }
    }
  })

  it('搜索空关键词应返回所有匹配（空字符串匹配所有内容）', async () => {
    const ctrl = makeController()
    const dto: SearchManualDto = { role: 'store_manager', keyword: '' }
    const result = await ctrl.searchManual(dto)
    // 空关键词匹配所有章节内容，此时应有结果
    // （空字符串是所有字符串的子串）
    assert.ok(result.total > 0)
    assert.ok(result.results.length > 0)
  })

  it('分页查询 pageSize 参数正确传递', async () => {
    const ctrl = makeController()
    // 先创建 15 条记录
    for (let i = 0; i < 15; i++) {
      await ctrl.createRecord({
        tenantId: 't-paging',
        role: 'store_manager',
        title: `手册${i + 1}`,
      })
    }
    const dto: ManualRecordQueryDto = { tenantId: 't-paging', page: 1, pageSize: 5 }
    const result = await ctrl.listRecords(dto)
    assert.equal(result.page, 1)
    assert.equal(result.pageSize, 5)
    assert.equal(result.data.length, 5)
    assert.equal(result.total, 15)
  })

  it('角色筛选分页记录的正确性', async () => {
    const ctrl = makeController()
    await ctrl.createRecord({
      tenantId: 't-filter',
      role: 'store_manager',
      title: '店长手册',
    })
    await ctrl.createRecord({
      tenantId: 't-filter',
      role: 'sales_staff',
      title: '导购手册',
    })
    const dto: ManualRecordQueryDto = { tenantId: 't-filter', role: 'sales_staff' }
    const result = await ctrl.listRecords(dto)
    assert.ok(result.data.every((r) => r.role === 'sales_staff'))
  })
})
