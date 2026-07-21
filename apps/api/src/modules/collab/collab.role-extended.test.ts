import { describe, it, expect, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 扩展角色测试: collab 模块
 *
 * 4 个附加角色视角（每个角色 >= 3 个测试用例）：
 * 🎮导玩员 — 前台门店联名活动查看与参与统计
 * 🔧安监 — 联名项目安全检查与合规审核
 * 🤝团建 — 团建与品牌联名活动策划管理
 * 📢营销 — 品牌营销联名项目全流程管理
 *
 * 每个角色 3+ 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
 */
import { CollabService } from './collab.service'
import { CollabStatus } from './collab.entity'

const TENANT_ID = 't-store-arcade'
const TENANT_CONTEXT = { tenantId: TENANT_ID, brandId: 'b-arcade', storeId: 's-arcade', marketCode: 'zh-cn' }

function makeTenantCtx(overrides: Partial<typeof TENANT_CONTEXT> = {}) {
  return { ...TENANT_CONTEXT, ...overrides }
}

describe('🎮导玩员 — 门店联名活动查看与参与统计视角', () => {
  beforeEach(() => {
    CollabService._resetStoreForTest()
  })

  it('导玩员可查看门店联名活动列表 (list collab projects)', () => {
    const svc = new CollabService()

    // 先创建几条活动
    svc.create({
      tenantContext: makeTenantCtx({ storeId: 's-arcade' }),
      name: '门店联名扭蛋活动',
      brandId: 'brand-gacha',
      brandName: '扭蛋品牌',
      startDate: '2026-07-01',
      endDate: '2026-08-31',
      revenueShareRate: 30,
      budget: 50000,
      description: '与扭蛋品牌联名活动',
    })
    svc.create({
      tenantContext: makeTenantCtx({ storeId: 's-arcade' }),
      name: '门店饮料联名',
      brandId: 'brand-drink',
      brandName: '饮料品牌',
      startDate: '2026-07-15',
      endDate: '2026-09-15',
      revenueShareRate: 20,
      budget: 30000,
      description: '夏季饮品联名',
    })

    const projects = svc.findAll(TENANT_ID)
    expect(projects.length).toBe(2)
    expect(projects[0].name).toContain('联名')
    expect(projects.some(p => p.brandId === 'brand-gacha')).toBe(true)
  })

  it('导玩员可按状态筛选联名活动 (filter by status)', () => {
    const svc = new CollabService()

    svc.create({
      tenantContext: makeTenantCtx(),
      name: '已激活联名', brandId: 'b1', startDate: '2026-07-01', endDate: '2026-08-01',
      revenueShareRate: 30, budget: 10000,
    })
    svc.create({
      tenantContext: makeTenantCtx(),
      name: '已取消联名', brandId: 'b2', startDate: '2026-06-01', endDate: '2026-07-01',
      revenueShareRate: 25, budget: 8000,
    })

    // 更新第二个为已取消
    const projects = svc.findAll(TENANT_ID)
    svc.update(projects[1].projectId, TENANT_ID, { status: CollabStatus.Cancelled })

    const draftList = svc.findAll(TENANT_ID, { status: CollabStatus.Draft })
    expect(draftList.length).toBe(1)

    const cancelledList = svc.findAll(TENANT_ID, { status: CollabStatus.Cancelled })
    expect(cancelledList.length).toBe(1)
  })

  it('导玩员查看联名活动详情含预算信息 (view project detail)', () => {
    const svc = new CollabService()

    const project = svc.create({
      tenantContext: makeTenantCtx(),
      name: '暑期联名促销', brandId: 'brand-summer',
      brandName: '夏日品牌', startDate: '2026-08-01', endDate: '2026-09-01',
      revenueShareRate: 35, budget: 80000,
      description: '暑假档期联名促销活动',
    })

    const detail = svc.findById(project.projectId, TENANT_ID)
    expect(detail).toBeDefined()
    expect(detail!.budget).toBe(80000)
    expect(detail!.revenueShareRate).toBe(35)
    expect(detail!.brandName).toBe('夏日品牌')
    expect(detail!.status).toBe(CollabStatus.Draft)
  })

  it('导玩员查询不存在的联名项目返回undefined (get non-existing project)', () => {
    const svc = new CollabService()

    const result = svc.findById('non-existent-project', TENANT_ID)
    expect(result).toBeUndefined()
  })

  it('导玩员可查看联名项目按状态的统计 (count by status)', () => {
    const svc = new CollabService()

    svc.create({
      tenantContext: makeTenantCtx(), name: '联名A', brandId: 'b1',
      startDate: '2026-07-01', endDate: '2026-08-01', revenueShareRate: 20, budget: 10000,
    })
    svc.create({
      tenantContext: makeTenantCtx(), name: '联名B', brandId: 'b2',
      startDate: '2026-07-01', endDate: '2026-08-01', revenueShareRate: 25, budget: 15000,
    })

    // 更新一个为 Cancelled
    const projects = svc.findAll(TENANT_ID)
    svc.update(projects[0].projectId, TENANT_ID, { status: CollabStatus.Cancelled })

    const counts = svc.countByStatus(TENANT_ID)
    expect(counts[CollabStatus.Draft]).toBe(1)
    expect(counts[CollabStatus.Cancelled]).toBe(1)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🔧安监 — 联名项目安全检查与合规审核
// ──────────────────────────────────────────────────────────────────────
describe('🔧安监 — 联名项目安全合规视角', () => {
  beforeEach(() => {
    CollabService._resetStoreForTest()
  })

  it('安监可查看所有联名项目的安全合规状态 (view all compliance status)', () => {
    const svc = new CollabService()

    svc.create({
      tenantContext: makeTenantCtx(), name: '设备联名', brandId: 'b-equip',
      startDate: '2026-07-01', endDate: '2026-10-01', revenueShareRate: 15, budget: 200000,
      description: '设备供应商联名项目',
    })
    svc.create({
      tenantContext: makeTenantCtx(), name: '安防联名', brandId: 'b-security',
      startDate: '2026-08-01', endDate: '2026-12-31', revenueShareRate: 10, budget: 50000,
      description: '安防设备联名',
    })

    const all = svc.findAll(TENANT_ID)
    expect(all.length).toBe(2)
    // 按创建时间降序排列
    expect(all[0].createdAt >= all[1].createdAt).toBe(true)
  })

  it('安监可按品牌名过滤联名项目 (filter by brand)', () => {
    const svc = new CollabService()

    svc.create({
      tenantContext: makeTenantCtx(), name: '安防监控联名', brandId: 'brand-cctv',
      startDate: '2026-07-01', endDate: '2026-09-01', revenueShareRate: 20, budget: 60000,
    })
    svc.create({
      tenantContext: makeTenantCtx(), name: '消防设备联名', brandId: 'brand-fire',
      startDate: '2026-08-01', endDate: '2026-11-01', revenueShareRate: 18, budget: 45000,
    })

    const filtered = svc.findAll(TENANT_ID, { brandId: 'brand-cctv' })
    expect(filtered.length).toBe(1)
    expect(filtered[0].brandId).toBe('brand-cctv')
  })

  it('安监可暂停联名项目进行安全审核 (pause project for safety review)', () => {
    const svc = new CollabService()

    const project = svc.create({
      tenantContext: makeTenantCtx(), name: '设备联名安全审核', brandId: 'b-safety',
      startDate: '2026-07-01', endDate: '2026-09-01', revenueShareRate: 25, budget: 100000,
    })

    // Draft → Negotiating → Active
    svc.update(project.projectId, TENANT_ID, { status: CollabStatus.Negotiating })
    svc.update(project.projectId, TENANT_ID, { status: CollabStatus.Active })
    // Pause for safety review
    const paused = svc.update(project.projectId, TENANT_ID, { status: CollabStatus.Paused })
    expect(paused.status).toBe(CollabStatus.Paused)
  })

  it('安监可取消不合规的联名项目 (cancel non-compliant project)', () => {
    const svc = new CollabService()

    const project = svc.create({
      tenantContext: makeTenantCtx(), name: '不合规联名', brandId: 'b-noncomp',
      startDate: '2026-07-01', endDate: '2026-08-01', revenueShareRate: 40, budget: 20000,
    })

    // Draft → Cancelled
    const cancelled = svc.update(project.projectId, TENANT_ID, { status: CollabStatus.Cancelled })
    expect(cancelled.status).toBe(CollabStatus.Cancelled)
  })

  it('安监尝试不合法的状态转换应抛错 (invalid status transition)', () => {
    const svc = new CollabService()

    const project = svc.create({
      tenantContext: makeTenantCtx(), name: '状态测试', brandId: 'b-test',
      startDate: '2026-07-01', endDate: '2026-08-01', revenueShareRate: 20, budget: 10000,
    })

    // Draft → Active is invalid (must go through Negotiating)
    expect(() => {
      svc.update(project.projectId, TENANT_ID, { status: CollabStatus.Active })
    }).toThrow('Invalid collab status transition')
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🤝团建 — 团建与品牌联名活动策划管理
// ──────────────────────────────────────────────────────────────────────
describe('🤝团建 — 团建品牌联名活动视角', () => {
  beforeEach(() => {
    CollabService._resetStoreForTest()
  })

  it('团建负责人可创建团建兼联名活动 (create team building collab)', () => {
    const svc = new CollabService()

    const project = svc.create({
      tenantContext: makeTenantCtx(),
      name: '团建联名—户外拓展合作',
      brandId: 'brand-outdoor',
      brandName: '户外运动品牌',
      startDate: '2026-08-15',
      endDate: '2026-08-20',
      revenueShareRate: 50,
      budget: 35000,
      description: '门店团建+品牌联名户外拓展活动',
    })
    expect(project.name).toContain('团建')
    expect(project.status).toBe(CollabStatus.Draft)
    expect(project.brandName).toBe('户外运动品牌')
    expect(project.revenueShareRate).toBe(50)
  })

  it('团建负责人可推进联名活动到谈判阶段 (negotiate collab project)', () => {
    const svc = new CollabService()

    const project = svc.create({
      tenantContext: makeTenantCtx(), name: '团建露营联名', brandId: 'brand-camp',
      startDate: '2026-09-01', endDate: '2026-09-07', revenueShareRate: 45, budget: 50000,
    })

    // Draft → Negotiating
    const negotiated = svc.update(project.projectId, TENANT_ID, { status: CollabStatus.Negotiating })
    expect(negotiated.status).toBe(CollabStatus.Negotiating)

    // Update name during negotiation
    const renamed = svc.update(project.projectId, TENANT_ID, { name: '团建露营联名—更新版' })
    expect(renamed.name).toBe('团建露营联名—更新版')
    expect(renamed.status).toBe(CollabStatus.Negotiating)
  })

  it('团建负责人可部分更新联名项目字段 (partial update project)', () => {
    const svc = new CollabService()

    const project = svc.create({
      tenantContext: makeTenantCtx(), name: '团建美食联名', brandId: 'brand-food',
      startDate: '2026-08-01', endDate: '2026-08-10', revenueShareRate: 30, budget: 20000,
      description: '初始描述',
    })

    // 部分更新：只改预算和描述
    const updated = svc.update(project.projectId, TENANT_ID, {
      budget: 30000,
      description: '更新后的团建美食活动描述',
    })
    expect(updated.budget).toBe(30000)
    expect(updated.description).toBe('更新后的团建美食活动描述')
    expect(updated.name).toBe('团建美食联名') // 未变
    expect(updated.startDate).toBe('2026-08-01') // 未变
  })

  it('团建负责人用不合理的分润比例创建项目应抛错 (invalid revenue share rate)', () => {
    const svc = new CollabService()

    expect(() => {
      svc.create({
        tenantContext: makeTenantCtx(), name: '无效分润', brandId: 'b-invalid',
        startDate: '2026-07-01', endDate: '2026-08-01', revenueShareRate: 150, budget: 10000,
      })
    }).toThrow('Revenue share rate must be between 0 and 100')

    expect(() => {
      svc.create({
        tenantContext: makeTenantCtx(), name: '负分润', brandId: 'b-neg',
        startDate: '2026-07-01', endDate: '2026-08-01', revenueShareRate: -10, budget: 10000,
      })
    }).toThrow('Revenue share rate must be between 0 and 100')
  })

  it('团建负责人用负预算创建项目应抛错 (negative budget)', () => {
    const svc = new CollabService()

    expect(() => {
      svc.create({
        tenantContext: makeTenantCtx(), name: '负预算', brandId: 'b-neg',
        startDate: '2026-07-01', endDate: '2026-08-01', revenueShareRate: 20, budget: -5000,
      })
    }).toThrow('Budget must be non-negative')
  })
})

// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 品牌营销联名项目全流程管理
// ──────────────────────────────────────────────────────────────────────
describe('📢营销 — 品牌营销联名项目全流程视角', () => {
  beforeEach(() => {
    CollabService._resetStoreForTest()
  })

  it('营销人员可创建品牌营销联名项目 (create marketing collab)', () => {
    const svc = new CollabService()

    const project = svc.create({
      tenantContext: makeTenantCtx(),
      name: '七夕品牌联名推广',
      brandId: 'brand-valentine',
      brandName: '情人节品牌',
      startDate: '2026-08-01',
      endDate: '2026-08-15',
      revenueShareRate: 40,
      budget: 120000,
      description: '七夕节品牌联名推广活动',
    })
    expect(project.name).toContain('联名')
    expect(project.budget).toBe(120000)
    expect(project.status).toBe(CollabStatus.Draft)
    expect(project.tenantContext.storeId).toBe('s-arcade')
  })

  it('营销人员推进联名项目完整生命周期 (full lifecycle management)', () => {
    const svc = new CollabService()

    const project = svc.create({
      tenantContext: makeTenantCtx(),
      name: '国庆品牌联名', brandId: 'brand-national',
      startDate: '2026-09-25', endDate: '2026-10-10',
      revenueShareRate: 35, budget: 200000,
    })

    // Draft → Negotiating
    svc.update(project.projectId, TENANT_ID, { status: CollabStatus.Negotiating })
    expect(svc.findById(project.projectId, TENANT_ID)!.status).toBe(CollabStatus.Negotiating)

    // Negotiating → Active
    svc.update(project.projectId, TENANT_ID, { status: CollabStatus.Active })
    expect(svc.findById(project.projectId, TENANT_ID)!.status).toBe(CollabStatus.Active)

    // Active → Completed
    svc.update(project.projectId, TENANT_ID, { status: CollabStatus.Completed })
    expect(svc.findById(project.projectId, TENANT_ID)!.status).toBe(CollabStatus.Completed)
  })

  it('营销人员可按名称模糊搜索联名项目 (search by name)', () => {
    const svc = new CollabService()

    svc.create({
      tenantContext: makeTenantCtx(), name: '暑期品牌联名', brandId: 'b-summer',
      startDate: '2026-07-01', endDate: '2026-09-01', revenueShareRate: 30, budget: 80000,
    })
    svc.create({
      tenantContext: makeTenantCtx(), name: '冬季品牌联名', brandId: 'b-winter',
      startDate: '2026-12-01', endDate: '2027-02-01', revenueShareRate: 25, budget: 60000,
    })
    svc.create({
      tenantContext: makeTenantCtx(), name: '春季品牌合作', brandId: 'b-spring',
      startDate: '2026-03-01', endDate: '2026-05-01', revenueShareRate: 20, budget: 40000,
    })

    const result = svc.findAll(TENANT_ID, { name: '联名' })
    expect(result.length).toBe(2)
    expect(result.every(p => p.name.includes('联名'))).toBe(true)
  })

  it('营销人员删除已完成的联名项目 (delete completed project)', () => {
    const svc = new CollabService()

    const project = svc.create({
      tenantContext: makeTenantCtx(), name: '已完成营销联名', brandId: 'b-done',
      startDate: '2026-06-01', endDate: '2026-07-01', revenueShareRate: 20, budget: 50000,
    })
    // Draft → Negotiating → Active → Completed
    svc.update(project.projectId, TENANT_ID, { status: CollabStatus.Negotiating })
    svc.update(project.projectId, TENANT_ID, { status: CollabStatus.Active })
    svc.update(project.projectId, TENANT_ID, { status: CollabStatus.Completed })

    // 删除
    svc.delete(project.projectId, TENANT_ID)
    const afterDelete = svc.findById(project.projectId, TENANT_ID)
    expect(afterDelete).toBeUndefined()
  })

  it('营销人员删除不存在的项目应抛错 (delete non-existing)', () => {
    const svc = new CollabService()

    expect(() => {
      svc.delete('nonexistent', TENANT_ID)
    }).toThrow('Collab project not found')
  })

  it('营销人员创建结束日期早于开始日期的项目应抛错 (invalid date range)', () => {
    const svc = new CollabService()

    expect(() => {
      svc.create({
        tenantContext: makeTenantCtx(), name: '无效日期', brandId: 'b-date',
        startDate: '2026-08-01', endDate: '2026-07-01', revenueShareRate: 20, budget: 10000,
      })
    }).toThrow('End date must be after start date')
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🦞 跨角色全流程闭环
// ──────────────────────────────────────────────────────────────────────
describe('🦞 联名项目跨角色全流程闭环', () => {
  beforeEach(() => {
    CollabService._resetStoreForTest()
  })

  it('🎮导玩员查看活动 → 🤝团建创建联名 → 📢营销推进上线 → 🔧安监合规审核', () => {
    const svc = new CollabService()

    // 1. 🎮导玩员查看现有活动（空列表）
    const initialProjects = svc.findAll(TENANT_ID)
    expect(initialProjects.length).toBe(0)

    // 2. 🤝团建创建联名项目
    const tbProject = svc.create({
      tenantContext: makeTenantCtx(),
      name: '团建+品牌联名活动', brandId: 'brand-tb',
      brandName: '团建品牌', startDate: '2026-08-01',
      endDate: '2026-08-07', revenueShareRate: 40, budget: 30000,
      description: '团建与品牌联名',
    })
    expect(tbProject.status).toBe(CollabStatus.Draft)

    // 3. 📢营销推进到谈判 → 激活
    svc.update(tbProject.projectId, TENANT_ID, { status: CollabStatus.Negotiating })
    svc.update(tbProject.projectId, TENANT_ID, { status: CollabStatus.Active })
    const activeProject = svc.findById(tbProject.projectId, TENANT_ID)
    expect(activeProject!.status).toBe(CollabStatus.Active)

    // 4. 🔧安监查看并确认合规（不暂停）
    const allProjects = svc.findAll(TENANT_ID)
    expect(allProjects.length).toBe(1)
    expect(allProjects[0].status).toBe(CollabStatus.Active)

    // 5. 各角色统计
    const counts = svc.countByStatus(TENANT_ID)
    expect(counts[CollabStatus.Active]).toBe(1)
    expect(counts[CollabStatus.Draft]).toBe(0)
  })
})
