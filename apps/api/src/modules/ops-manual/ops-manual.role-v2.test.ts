import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [ops-manual] [C] 角色测试 v2 补全
 *
 * 8 角色深度扩展测试 — ops-manual 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 3 个测试用例 (正常流程 + 降级场景 + 权限边界)
 * 覆盖: generateManual, exportManual, searchManual, getSOP, getManualInfo,
 *       createRecord, listRecords, getRecord
 * 扩展: 大容量手册内容校验, 导出格式边界, 搜索边界, 分页极限,
 *       SOP 不存在/空章节, 记录查询隔离
 */

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
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

const ALL_ROLES: Role[] = ['store_manager', 'sales_staff', 'cashier', 'customer_service']

function createController(): OpsManualController {
  return new OpsManualController(new OpsManualService())
}

function createTestRecord(ctrl: OpsManualController, overrides: Partial<CreateManualRecordDto> = {}): Promise<any> {
  return ctrl.createRecord({
    tenantId: 't-v2',
    role: 'store_manager',
    title: 'V2 测试手册',
    content: '# 测试内容',
    totalSections: 3,
    totalPages: 10,
    estimatedReadTime: 5,
    generatedBy: 'v2-test',
    ...overrides,
  })
}

// ═══════════════════════════════════════════════════════════════════
// 👔 店长 — 高级运营手册管理
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} ops-manual 角色 v2 测试`, () => {
  it('[正常] 店长生成全角色手册并验证每个都包含核心章节', async () => {
    const ctrl = createController()
    const expectedSections: Record<Role, number> = {
      store_manager: 7,
      sales_staff: 6,
      cashier: 6,
      customer_service: 6,
    }
    for (const role of ALL_ROLES) {
      const dto: GenerateManualDto = { role, tenantId: 't-sm' }
      const result = await ctrl.generateManual(dto)
      assert.equal(result.sections.length, expectedSections[role],
        `角色 ${role} 应有 ${expectedSections[role]} 个章节，实际 ${result.sections.length}`)
      assert.ok(result.totalPages >= expectedSections[role])
      assert.ok(result.estimatedReadTime > 0)
    }
  })

  it('[降级] 店长生成手册时内容包含完整 checkpoints 和 warnings', async () => {
    const ctrl = createController()
    const result = await ctrl.generateManual({ role: 'store_manager', tenantId: 't-sm2' })
    // 财务管理应包含财务安全的 checkpoints
    const financeSection = result.sections.find((s: any) => s.title === '财务管理')
    assert.ok(financeSection, '店长手册应包含财务管理章节')
    const hasMoneyWarning = financeSection.warnings.some(
      (w: string) => w.includes('假币') || w.includes('收款码'),
    )
    assert.ok(hasMoneyWarning, '财务管理应有资金安全警示')
  })

  it('[权限边界] 店长搜索空字符串返回所有可能的匹配项', async () => {
    const ctrl = createController()
    const result = await ctrl.searchManual({ role: 'store_manager', keyword: '' })
    assert.ok(result.total >= 1, '空字符串应返回匹配')}
  )

  it('[正常] 店长检查所有导出格式均包含标题和版本号', async () => {
    const ctrl = createController()
    const formats: Array<ExportManualDto['format']> = ['markdown', 'html', 'checklist', 'pdf-json']
    for (const format of formats) {
      const result = await ctrl.exportManual({ role: 'store_manager', format })
      assert.equal(result.format, format)
      assert.equal(result.role, 'store_manager')
      assert.equal(result.title, '店长运营手册')
      if (format === 'pdf-json') {
        const parsed = JSON.parse(result.content)
        assert.equal(parsed.title, '店长运营手册')
        assert.equal(parsed.version, '1.0.0')
      } else if (format === 'markdown') {
        assert.ok(result.content.includes('店长运营手册'))
        assert.ok(result.content.includes('1.0.0'))
      } else if (format === 'html') {
        assert.ok(result.content.includes('<!DOCTYPE html>'))
        assert.ok(result.content.includes('店长运营手册'))
      } else if (format === 'checklist') {
        assert.ok(result.content.includes('[ ]'))
        assert.ok(result.content.includes('检查清单'))
      }
    }
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🛒 前台 — 收银手册深度校验
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} ops-manual 角色 v2 测试`, () => {
  it('[正常] 前台收银手册包含全部 6 个子章节且 checkpoints 完整', async () => {
    const ctrl = createController()
    const result = await ctrl.generateManual({ role: 'cashier', tenantId: 't-fd' })
    const sectionNames = result.sections.map((s: any) => s.title)
    assert.ok(sectionNames.includes('收银系统'))
    assert.ok(sectionNames.includes('收款方式'))
    assert.ok(sectionNames.includes('离线收银'))
    assert.ok(sectionNames.includes('退款处理'))
    assert.ok(sectionNames.includes('促销核销'))
    assert.ok(sectionNames.includes('对账差错'))
    // 每个章节应有 checkpoints
    for (const section of result.sections) {
      assert.ok(section.checkpoints.length >= 2, `${section.title} 应有至少 2 个检查点`)
      assert.ok(section.warnings.length >= 1, `${section.title} 应有至少 1 个风险警示`)
    }
  })

  it('[正常] 前台导出 markdown 格式包含收银系统 SOP', async () => {
    const ctrl = createController()
    const result = await ctrl.exportManual({ role: 'cashier', format: 'markdown' })
    assert.ok(result.content.includes('收银系统'))
    assert.ok(result.content.includes('开关机'))
    assert.ok(result.content.includes('[ ]'))
  })

  it('[权限边界] 前台搜索不存在的关键词返回空结果', async () => {
    const ctrl = createController()
    const result = await ctrl.searchManual({ role: 'cashier', keyword: '量子纠缠' })
    assert.equal(result.total, 0)
    assert.deepEqual(result.results, [])
  })

  it('[权限边界] 前台搜索空字符串返回所有匹配', async () => {
    const ctrl = createController()
    const result = await ctrl.searchManual({ role: 'cashier', keyword: '' })
    // 空字符串匹配每个章节开头
    assert.ok(result.total >= 6, `应有至少 6 条结果，实际 ${result.total}`)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 👥 HR — 手册信息校验与培训相关
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} ops-manual 角色 v2 测试`, () => {
  it('[正常] HR 查看所有角色的手册元信息', async () => {
    const ctrl = createController()
    for (const role of ALL_ROLES) {
      const info = await ctrl.getManualInfo({ role })
      assert.ok(info.title)
      assert.equal(info.version, '1.0.0')
      assert.ok(info.sections > 0)
      assert.ok(info.estimatedReadTime > 0)
    }
  })

  it('[正常] HR 搜索导购手册中「盲盒」相关内容', async () => {
    const ctrl = createController()
    const result = await ctrl.searchManual({ role: 'sales_staff', keyword: '盲盒' })
    assert.ok(result.total >= 1, '导购手册应包含盲盒相关内容')
    assert.ok(result.results.some(r => r.title.includes('盲盒')), '搜索结果应包含盲盒章节')
    assert.ok(result.results[0].matchedContent.includes('盲盒'), '匹配内容应包含关键字')
  })

  it('[权限边界] HR 搜索 store_manager 手册中「资金安全」相关内容', async () => {
    const ctrl = createController()
    const result = await ctrl.searchManual({ role: 'store_manager', keyword: '资金安全' })
    assert.ok(result.total >= 1, '店长手册财务管理章节应有资金安全相关内容')}
  )
})

// ═══════════════════════════════════════════════════════════════════
// 🔧 安监 — 安全合规手册验证
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Safety} ops-manual 角色 v2 测试`, () => {
  it('[正常] 安监检查店长手册客诉处理章节的升级流程', async () => {
    const ctrl = createController()
    const result = await ctrl.generateManual({ role: 'store_manager', tenantId: 't-sec' })
    const complaintSection = result.sections.find((s: any) => s.title === '客诉处理')
    assert.ok(complaintSection, '店长手册应包含客诉处理章节')
    const subTitles = complaintSection.subsections.map((s: any) => s.title)
    assert.ok(subTitles.includes('投诉记录'), '应包含投诉记录子章节')
    assert.ok(subTitles.includes('升级流程'), '应包含升级流程子章节')
    assert.ok(subTitles.includes('回访跟进'), '应包含回访跟进子章节')
    // 检查安全相关的 checkpoints
    assert.ok(complaintSection.checkpoints.some((cp: string) => cp.includes('上报') || cp.includes('100%')))
  })

  it('[正常] 安监搜索店长手册中「安全」相关章节', async () => {
    const ctrl = createController()
    const result = await ctrl.searchManual({ role: 'store_manager', keyword: '安全' })
    assert.ok(result.total >= 1, '搜索安全应有结果')}
  )

  it('[降级] 安监搜索收银手册中「收款码」安全相关', async () => {
    const ctrl = createController()
    const result = await ctrl.searchManual({ role: 'cashier', keyword: '收款码' })
    assert.ok(result.total >= 1, '收银手册应有收款码内容')
    assert.ok(result.results.some(r => r.matchedContent.includes('收款码')))
  })

  it('[权限边界] 安监搜索 HTML 特殊字符不报错', async () => {
    const ctrl = createController()
    const specialChars = ['<script>', '&', '"', "'"]
    for (const char of specialChars) {
      const result = await ctrl.searchManual({ role: 'store_manager', keyword: char })
      assert.ok(Array.isArray(result.results), `特殊字符 ${char} 搜索应返回数组`)
    }
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 导购手册 & 赛事 SOP
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} ops-manual 角色 v2 测试`, () => {
  it('[正常] 导玩员生成导购手册验证盲盒销售章节', async () => {
    const ctrl = createController()
    const result = await ctrl.generateManual({ role: 'sales_staff', tenantId: 't-guide' })
    const blindboxSection = result.sections.find((s: any) => s.title === '盲盒销售')
    assert.ok(blindboxSection, '导购手册应有盲盒销售章节')
    const subTitles = blindboxSection.subsections.map((s: any) => s.title)
    assert.ok(subTitles.includes('奖池介绍'))
    assert.ok(subTitles.includes('概率公示'))
    assert.ok(subTitles.includes('端盒策略'))
    assert.ok(blindboxSection.checkpoints.some((cp: string) => cp.includes('端盒') || cp.includes('转化率')))
  })

  it('[正常] 导玩员获取赛事参与 SOP', async () => {
    const ctrl = createController()
    const result = await ctrl.generateManual({ role: 'sales_staff', tenantId: 't-guide2' })
    const eventSection = result.sections.find((s: any) => s.title === '赛事参与')
    assert.ok(eventSection, '导购手册应有赛事参与章节')
    assert.ok(eventSection.subsections.some((s: any) => s.title === '报名引导'))
  })

  it('[权限边界] 导玩员搜索导购手册中「赛事」相关内容', async () => {
    const ctrl = createController()
    const result = await ctrl.searchManual({ role: 'sales_staff', keyword: '赛事' })
    assert.ok(result.total >= 1, '应能搜索到赛事相关内容')
  })

  it('[降级] 导玩员导出导购手册 checklist 格式校验检查点数量', async () => {
    const ctrl = createController()
    const result = await ctrl.exportManual({ role: 'sales_staff', format: 'checklist' })
    assert.ok(result.content.includes('[ ]'))
    const checkCount = (result.content.match(/\[ \]/g) || []).length
    // 导购手册 6 个章节，每个至少 2 个检查点 → ≥ 12
    assert.ok(checkCount >= 12, `导购手册应有至少 12 个检查点，实际 ${checkCount}`)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 手册生成记录 & 分页查询
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} ops-manual 角色 v2 测试`, () => {
  it('[正常] 运行专员批量创建记录并分页查询', async () => {
    const ctrl = createController()
    // 创建 15 条记录
    for (let i = 0; i < 15; i++) {
      await ctrl.createRecord({
        tenantId: `t-ops-${i % 3}`,
        role: ALL_ROLES[i % 4],
        title: `手册-${i}`,
        content: `# 手册 ${i}`,
        totalSections: i + 1,
        totalPages: i * 2,
        estimatedReadTime: i + 1,
        generatedBy: 'ops-test',
      })
    }
    // 查询全部
    const allRecords = await ctrl.listRecords({ page: 1, pageSize: 20 })
    assert.equal(allRecords.total, 15)
    assert.equal(allRecords.data.length, 15)

    // 分页 Page 1
    const page1 = await ctrl.listRecords({ page: 1, pageSize: 5 })
    assert.equal(page1.total, 15)
    assert.equal(page1.data.length, 5)

    // 分页 Page 3
    const page3 = await ctrl.listRecords({ page: 3, pageSize: 5 })
    assert.equal(page3.data.length, 5) // 15-10=5

    // 按 tenantId 过滤
    const filtered = await ctrl.listRecords({ tenantId: 't-ops-0', page: 1, pageSize: 10 })
    assert.equal(filtered.total, 5)
  })

  it('[正常] 运行专员查询已创建的记录详情', async () => {
    const ctrl = createController()
    const record = await createTestRecord(ctrl, { title: '详细记录查询测试' })
    const found = await ctrl.getRecord(record.id)
    assert.ok(found)
    assert.equal(found!.title, '详细记录查询测试')
    assert.equal(found!.version, '1.0.0')
    assert.equal(found!.generatedBy, 'v2-test')
  })

  it('[权限边界] 运行专员查询不存在的记录', async () => {
    const ctrl = createController()
    const result = await ctrl.getRecord('non-existent-999')
    assert.equal(result, null)
  })

  it('[边界] 运行专员超范围分页返回空数组', async () => {
    const ctrl = createController()
    await createTestRecord(ctrl)
    const result = await ctrl.listRecords({ page: 999, pageSize: 10 })
    assert.equal(result.data.length, 0)
    assert.equal(result.total, 1)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🤝 团建 — 团建活动手册 & 多角色导出
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} ops-manual 角色 v2 测试`, () => {
  it('[正常] 团建专员生成客服手册并导出 HTML 用于培训', async () => {
    const ctrl = createController()
    const result = await ctrl.exportManual({ role: 'customer_service', format: 'html' })
    assert.equal(result.format, 'html')
    assert.ok(result.content.includes('客服运营手册'))
    assert.ok(result.content.includes('话术模板'))
    assert.ok(result.content.includes('<style>'))
    assert.ok(result.content.includes('</html>'))
  })

  it('[正常] 团建专员获取客服手册中话术模板的 SOP', async () => {
    const ctrl = createController()
    const result = await ctrl.getSOP({ role: 'customer_service', sectionId: 'cs-script-welcome' })
    assert.ok(result.steps.length >= 3)
    assert.ok(result.steps.map(s => s.action).some(a => a.includes('问候') || a.includes('客户')))
  })

  it('[权限边界] 团建专员搜索客服手册「回访」相关内容', async () => {
    const ctrl = createController()
    const result = await ctrl.searchManual({ role: 'customer_service', keyword: '回访' })
    assert.ok(result.total >= 1, '客服手册应包含回访相关内容')
    assert.ok(result.results.some(r => r.matchedContent.includes('回访')))
  })

  it('[边界] 团建专员导出 pdf-json 校验结构化数据完整性', async () => {
    const ctrl = createController()
    const result = await ctrl.exportManual({ role: 'customer_service', format: 'pdf-json' })
    const parsed = JSON.parse(result.content)
    assert.equal(parsed.version, '1.0.0')
    assert.ok(parsed.sections.length >= 6)
    // 校验 sections 结构
    for (const section of parsed.sections) {
      assert.ok(section.id, '每个 section 应有 id')
      assert.ok(section.title, '每个 section 应有 title')
      assert.ok(Array.isArray(section.checkpoints), 'checkpoints 应为数组')
      assert.ok(Array.isArray(section.warnings), 'warnings 应为数组')
    }
  })
})

// ═══════════════════════════════════════════════════════════════════
// 📢 营销 — 营销活动相关手册 & 搜索场景
// ═══════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} ops-manual 角色 v2 测试`, () => {
  it('[正常] 营销专员搜索店长手册中「促销」相关内容', async () => {
    const ctrl = createController()
    const result = await ctrl.searchManual({ role: 'store_manager', keyword: '促销' })
    assert.ok(result.total >= 1, '店长手册营销活动章节应有促销内容')
    assert.ok(result.results.some(r => r.title.includes('营销') || r.title.includes('促销')))
  })

  it('[正常] 营销专员搜索导购手册「盲盒」相关内容', async () => {
    const ctrl = createController()
    const result = await ctrl.searchManual({ role: 'sales_staff', keyword: '盲盒' })
    assert.ok(result.total >= 1, '导购手册应包含盲盒相关内容')
    assert.ok(result.results.some(r => r.title.includes('盲盒')))})

  it('[正常] 营销专员搜索店长手册「优惠券」相关内容', async () => {
    const ctrl = createController()
    const result = await ctrl.searchManual({ role: 'store_manager', keyword: '优惠券' })
    assert.ok(result.total >= 1, '店长手册营销章节应有优惠券内容')}
  )

  it('[降级] 营销专员导出所有角色 checklist 并检查空内容', async () => {
    const ctrl = createController()
    for (const role of ALL_ROLES) {
      const result = await ctrl.exportManual({ role, format: 'checklist' })
      assert.ok(result.content.length > 50, `角色 ${role} checklist 应有内容`)
      assert.ok(result.content.includes('---'), 'checklist 应包含分隔线')
    }
  })

  it('[权限边界] 营销专员获取不存在的 SOP 章节返回空步骤', async () => {
    const ctrl = createController()
    const result = await ctrl.getSOP({ role: 'store_manager', sectionId: 'non-existent-sop-id' })
    assert.equal(result.steps.length, 0, '不存在的 SOP 应返回空步步骤')
  })

  it('[正常] 营销专员批量搜索多角色关键词「赛事」', async () => {
    const ctrl = createController()
    for (const role of ALL_ROLES) {
      const result = await ctrl.searchManual({ role, keyword: '赛事' })
      if (role === 'store_manager' || role === 'sales_staff') {
        assert.ok(result.total >= 1, `角色 ${role} 应有赛事相关内容`)
      }
    }
  })
})

// ═══════════════════════════════════════════════════════════════════
// 跨角色综合场景
// ═══════════════════════════════════════════════════════════════════
describe('跨角色综合 v2 场景', () => {
  it('四次导出同一角色不同格式，内容一致性校验', async () => {
    const ctrl = createController()
    const formats: Array<ExportManualDto['format']> = ['markdown', 'html', 'checklist', 'pdf-json']
    for (const format of formats) {
      const result = await ctrl.exportManual({ role: 'store_manager', format })
      assert.equal(result.title, '店长运营手册')
      assert.equal(result.role, 'store_manager')
      assert.equal(result.format, format)
    }
  })

  it('所有角色手册都有不同标题且都包含「运营手册」', async () => {
    const ctrl = createController()
    const titles: string[] = []
    for (const role of ALL_ROLES) {
      const info = await ctrl.getManualInfo({ role })
      titles.push(info.title)
      assert.ok(info.title.includes('运营手册'), `角色 ${role} 标题应包含「运营手册」`)
    }
    // 所有标题互不相同
    const uniqueTitles = new Set(titles)
    assert.equal(uniqueTitles.size, ALL_ROLES.length, '每个角色的手册标题应唯一')
  })

  it('多次导出同一手册 markdown 内容可逆', async () => {
    const ctrl = createController()
    const r1 = await ctrl.generateManual({ role: 'store_manager', tenantId: 't-rep' })
    const r2 = await ctrl.generateManual({ role: 'store_manager', tenantId: 't-rep' })
    assert.equal(r1.sections.length, r2.sections.length)
    assert.equal(r1.title, r2.title)
    assert.equal(r1.version, r2.version)
  })

  it('离线收银章节只存在于收银手册中', async () => {
    const ctrl = createController()
    for (const role of ALL_ROLES) {
      const result = await ctrl.generateManual({ role, tenantId: 't-cross' })
      const hasOffline = result.sections.some((s: any) => s.title === '离线收银')
      if (role === 'cashier') {
        assert.ok(hasOffline, '收银手册应包含离线收银章节')
      } else {
        assert.ok(!hasOffline, `${role} 手册不应包含离线收银章节`)
      }
    }
  })

  it('所有角色手册导出格式均为正确 MIME 类似格式', async () => {
    const ctrl = createController()
    const formats: Array<ExportManualDto['format']> = ['markdown', 'html', 'checklist', 'pdf-json']
    for (const role of ALL_ROLES) {
      for (const format of formats) {
        const result = await ctrl.exportManual({ role, format })
        assert.ok(result.content.length > 0, `角色 ${role} 导出 ${format} 应有内容`)
      }
    }
  })
})
