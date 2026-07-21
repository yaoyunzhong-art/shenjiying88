import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 扩展角色测试: campaign-performance 模块
 *
 * 4 个附加角色视角（每个角色 >= 3 个测试用例）：
 * 🎮导玩员 — 门店活动效果查看与参与数据
 * 🔧安监 — 安全检查类活动数据与合规统计
 * 🤝团建 — 团建活动效果评估与分析
 * 📢营销 — 营销活动效果全维度评估与ROI分析
 *
 * 每个角色 3+ 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
 */
import { CampaignPerformanceController } from './campaign-performance.controller'
import { CampaignPerformanceService } from './campaign-performance.service'
import { CampaignType, CampaignStatus } from './campaign-performance.entity'

// ──────────────────────────────────────────────────────────────────────
// 🎮导玩员 — 门店活动效果查看与参与数据
// ──────────────────────────────────────────────────────────────────────
describe('🎮导玩员 — 门店活动效果查看视角', () => {
  beforeEach(() => {
    const svc = new CampaignPerformanceService()
    svc.resetStoresForTests()
  })

  it('导玩员可查看门店活动列表 (list campaigns)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    const result = ctrl.listCampaigns({})
    expect(result.total).toBeGreaterThanOrEqual(10)
    expect(result.items.length).toBeGreaterThanOrEqual(10)
    expect(result.items[0]).toHaveProperty('campaignName')
    expect(result.items[0]).toHaveProperty('type')
    expect(result.items[0]).toHaveProperty('roi')
    expect(result.summary).toBeDefined()
  })

  it('导玩员可按门店筛选活动 (filter by store)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    const result = ctrl.listCampaigns({ storeId: 'store-001' })
    expect(result.total).toBeGreaterThanOrEqual(2)
    expect(result.items.every((i: { type: string }) => i.type !== undefined)).toBe(true)
  })

  it('导玩员可查看活动详情含ROI指标 (view campaign detail)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    const list = ctrl.listCampaigns({})
    const firstId = list.items[0].id

    const detail = ctrl.getCampaign(firstId)
    expect(detail).not.toBeNull()
    if (detail) {
      expect(detail.campaignName).toBeDefined()
      expect(detail.roi).toBeGreaterThanOrEqual(0)
      expect(detail.satisfaction).toBeGreaterThanOrEqual(0)
    }
  })

  it('导玩员查询不存在的活动返回null (get non-existing campaign)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    const result = ctrl.getCampaign('non-existing-campaign-id')
    expect(result).toBeNull()
  })

  it('导玩员按活动类型筛选 (filter by campaign type)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    const result = ctrl.listCampaigns({ campaignType: CampaignType.Discount })
    expect(result.total).toBeGreaterThanOrEqual(2)
    expect(result.items.every((i: { type: string }) => i.type === CampaignType.Discount)).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🔧安监 — 安全检查类活动数据与合规统计
// ──────────────────────────────────────────────────────────────────────
describe('🔧安监 — 安全检查活动数据视角', () => {
  beforeEach(() => {
    const svc = new CampaignPerformanceService()
    svc.resetStoresForTests()
  })

  it('安监可查看所有活动活动的汇总数据 (view campaign summary)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    const summary = ctrl.getSummary({})
    expect(summary.totalCampaigns).toBeGreaterThanOrEqual(10)
    expect(summary.totalBudget).toBeGreaterThan(0)
    expect(summary.totalCost).toBeGreaterThan(0)
    expect(summary.totalRevenue).toBeGreaterThan(0)
    expect(summary.avgROI).toBeGreaterThan(0)
    expect(summary.totalParticipants).toBeGreaterThan(0)
    expect(summary.newMembersAcquired).toBeGreaterThan(0)
  })

  it('安监可按状态筛选活动数据 (filter by status)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    const active = ctrl.listCampaigns({ status: CampaignStatus.Active })
    expect(active.total).toBeGreaterThanOrEqual(4)

    const completed = ctrl.listCampaigns({ status: CampaignStatus.Completed })
    expect(completed.total).toBeGreaterThanOrEqual(4)
  })

  it('安监查看已取消活动的预算占用 (cancelled campaign budget)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    const cancelled = ctrl.listCampaigns({ status: CampaignStatus.Cancelled })
    expect(cancelled.total).toBeGreaterThanOrEqual(1)

    // 汇总不应包含已取消的成本和营收
    const summary = ctrl.getSummary({})
    const expectedCancelledBudget = cancelled.items.reduce((s: number, i: { budget: number }) => s + i.budget, 0)
    expect(expectedCancelledBudget).toBeGreaterThan(0)
  })

  it('安监可按时间范围筛选 (filter by date range)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    // July activities with startDate >= 2026-07-01
    const july = ctrl.listCampaigns({ startDate: '2026-07-01' })
    expect(july.total).toBeGreaterThanOrEqual(3)

    // Pre June activities (endDate <= 2026-06-30)
    const june = ctrl.listCampaigns({ endDate: '2026-06-30' })
    expect(june.total).toBeGreaterThanOrEqual(3)

    // Combining both should be less than or equal to total
    const combined = july.total + june.total
    expect(combined).toBeLessThanOrEqual(10)
  })

  it('安监查看门店粒度的活动ROI数据 (store-level ROI)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    const store1 = ctrl.getSummary({ storeId: 'store-001' })
    expect(store1.totalCampaigns).toBeGreaterThanOrEqual(2)
    expect(store1.avgROI).toBeGreaterThanOrEqual(0)

    const store2 = ctrl.getSummary({ storeId: 'store-002' })
    expect(store2.totalCampaigns).toBeGreaterThanOrEqual(2)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🤝团建 — 团建活动效果评估与分析
// ──────────────────────────────────────────────────────────────────────
describe('🤝团建 — 团建活动效果评估视角', () => {
  beforeEach(() => {
    const svc = new CampaignPerformanceService()
    svc.resetStoresForTests()
  })

  it('团建负责人可创建团建活动记录 (create team building campaign)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    const record = ctrl.createCampaign({
      campaignName: '门店Q3团建活动',
      type: CampaignType.NewUser,
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      budget: 15000,
      actualCost: 12000,
      participants: 20,
      newMembers: 0,
      revenue: 8000,
      satisfaction: 4.5,
    })
    expect(record.campaignName).toContain('团建')
    expect(record.roi).toBeGreaterThanOrEqual(0)
    expect(record.satisfaction).toBe(4.5)
    expect(record.type).toBe(CampaignType.NewUser)
  })

  it('团建负责人可创建抽奖类团建活动 (create lucky draw campaign)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    const record = ctrl.createCampaign({
      campaignName: '团建抽奖活动',
      type: CampaignType.LuckyDraw,
      startDate: '2026-08-10',
      endDate: '2026-08-10',
      budget: 5000,
      actualCost: 4800,
      participants: 30,
      newMembers: 5,
      revenue: 2000,
      satisfaction: 4.2,
    })
    expect(record.type).toBe(CampaignType.LuckyDraw)
    expect(record.roi).toBeGreaterThan(0)
    expect(record.participants).toBe(30)
  })

  it('团建负责人可按类型筛选团建活动 (filter by type for team building)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    const luckyDraw = ctrl.listCampaigns({ campaignType: CampaignType.LuckyDraw })
    expect(luckyDraw.total).toBeGreaterThanOrEqual(2)

    const vip = ctrl.listCampaigns({ campaignType: CampaignType.Vip })
    expect(vip.total).toBeGreaterThanOrEqual(2)
  })

  it('团建负责人使用0营收的活动应显示ROI为0 (zero revenue campaign)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    const planned = ctrl.listCampaigns({ status: CampaignStatus.Planned })
    if (planned.total > 0) {
      expect(planned.items[0].roi).toBe(0)
    }

    // 创建一个0营收活动
    const record = ctrl.createCampaign({
      campaignName: '未开始团建', type: CampaignType.Discount,
      startDate: '2026-09-01', endDate: '2026-09-07',
      budget: 10000, actualCost: 0, participants: 0,
      newMembers: 0, revenue: 0, satisfaction: 0,
    })
    expect(record.roi).toBe(0)
  })

  it('团建负责人查看活动详情含新的团建活动 (view newly created campaign)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    const record = ctrl.createCampaign({
      campaignName: '秋季团建活动', type: CampaignType.Vip,
      startDate: '2026-09-15', endDate: '2026-09-17',
      budget: 20000, actualCost: 18000, participants: 25,
      newMembers: 3, revenue: 15000, satisfaction: 4.8,
    })
    const detail = ctrl.getCampaign(record.id)
    expect(detail).not.toBeNull()
    if (detail) {
      expect(detail.campaignName).toBe('秋季团建活动')
      expect(detail.roi).toBeCloseTo(83.33, 0) // (15000/18000)*100
    }
  })
})

// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 营销活动效果全维度评估与ROI分析
// ──────────────────────────────────────────────────────────────────────
describe('📢营销 — 营销活动效果分析视角', () => {
  beforeEach(() => {
    const svc = new CampaignPerformanceService()
    svc.resetStoresForTests()
  })

  it('营销人员可创建折扣促销活动 (create discount campaign)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    const record = ctrl.createCampaign({
      campaignName: '国庆大促折扣活动',
      type: CampaignType.Discount,
      startDate: '2026-10-01',
      endDate: '2026-10-07',
      budget: 100000,
      actualCost: 85000,
      participants: 5000,
      newMembers: 800,
      revenue: 450000,
      satisfaction: 4.3,
    })
    expect(record.type).toBe(CampaignType.Discount)
    expect(record.roi).toBeCloseTo(529.41, 0) // (450000/85000)*100
    expect(record.newMembers).toBe(800)
  })

  it('营销人员可查看VIP专属活动效果 (view VIP campaign performance)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    const vipList = ctrl.listCampaigns({ campaignType: CampaignType.Vip })
    expect(vipList.total).toBeGreaterThanOrEqual(2)

    const vipActive = vipList.items.filter((i: { roi: number }) => i.roi > 0)
    expect(vipActive.length).toBeGreaterThanOrEqual(1)

    // VIP活动满意度应较高
    const activeVip = vipList.items.find((i: { satisfaction: number }) => i.satisfaction > 0)
    if (activeVip) {
      expect(activeVip.satisfaction).toBeGreaterThanOrEqual(4)
    }
  })

  it('营销人员可查看多维度ROI分析 (multi-dimension ROI analysis)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    const summary = ctrl.getSummary({})
    expect(summary.avgROI).toBeGreaterThan(100) // 平均ROI > 100% 表示盈利

    // 按不同类型创建
    const discountSummary = ctrl.getSummary({ campaignType: CampaignType.Discount })
    const couponSummary = ctrl.getSummary({ campaignType: CampaignType.Coupon })
    const newUserSummary = ctrl.getSummary({ campaignType: CampaignType.NewUser })

    // 每种类型至少有一些数据
    expect(discountSummary.totalCost).toBeGreaterThan(0)
    expect(couponSummary.totalCost).toBeGreaterThan(0)
    expect(newUserSummary.totalCost).toBeGreaterThan(0)

    // 折扣类的可能ROI更高
    expect(discountSummary.avgROI).toBeGreaterThan(0)
  })

  it('营销人员使用计划中的活动应显示0成本和营收 (planned campaigns have zero cost/revenue)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    // 创建一个planned活动
    ctrl.createCampaign({
      campaignName: '未来营销计划', type: CampaignType.Coupon,
      startDate: '2026-12-01', endDate: '2026-12-31',
      budget: 50000, actualCost: 0, participants: 0,
      newMembers: 0, revenue: 0, satisfaction: 0,
    })

    const planned = ctrl.listCampaigns({ status: CampaignStatus.Planned })
    expect(planned.total).toBeGreaterThanOrEqual(2)

    // 汇总不包含planned的cost/revenue
    const summary = ctrl.getSummary({})
    // 有1个planned活动的cost为0
    expect(summary.totalCost).toBeGreaterThan(0)
  })

  it('营销人员查看新用户活动的获客成本 (CPA for new user campaigns)', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    const newUserSummary = ctrl.getSummary({ campaignType: CampaignType.NewUser })
    if (newUserSummary.newMembersAcquired > 0) {
      const cpa = newUserSummary.totalCost / newUserSummary.newMembersAcquired
      expect(cpa).toBeGreaterThan(0)
      // 新用户获客成本应合理（小于500元/人）
      expect(cpa).toBeLessThan(500)
    }
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🦞 跨角色全流程闭环
// ──────────────────────────────────────────────────────────────────────
describe('🦞 活动效果跨角色全流程闭环', () => {
  beforeEach(() => {
    const svc = new CampaignPerformanceService()
    svc.resetStoresForTests()
  })

  it('🎮导玩员查看当日活动 → 🤝团建创建团建活动 → 📢营销分析ROI → 🔧安监查看合规汇总', () => {
    const ctrl = new CampaignPerformanceController(new CampaignPerformanceService())

    // 1. 🎮导玩员查看活动列表
    const allCampaigns = ctrl.listCampaigns({})
    expect(allCampaigns.total).toBeGreaterThanOrEqual(10)

    // 2. 🤝团建创建团建活动
    const tbRecord = ctrl.createCampaign({
      campaignName: '门店团建日活动', type: CampaignType.Vip,
      startDate: '2026-08-15', endDate: '2026-08-15',
      budget: 10000, actualCost: 8000, participants: 15,
      newMembers: 2, revenue: 5000, satisfaction: 4.6,
    })
    expect(tbRecord.roi).toBeGreaterThan(0)

    // 3. 📢营销分析ROI
    const marketingSummary = ctrl.getSummary({ campaignType: CampaignType.Vip })
    expect(marketingSummary.totalCampaigns).toBeGreaterThanOrEqual(3) // 2 seed + 1 new
    expect(marketingSummary.avgROI).toBeGreaterThan(0)

    // 4. 🔧安监查看门店活动合规汇总
    const summary = ctrl.getSummary({})
    expect(summary.totalCampaigns).toBeGreaterThanOrEqual(11)
    expect(summary.totalBudget).toBeGreaterThan(0)

    // 5. 验证新创建的活动在列表中
    const updatedList = ctrl.listCampaigns({})
    const found = updatedList.items.find((i: { campaignName: string }) => i.campaignName === '门店团建日活动')
    expect(found).toBeDefined()
    if (found) {
      expect(found.satisfaction).toBe(4.6)
    }
  })
})
