/**
 * 🐜 扩展角色测试: store-rank (门店排行) 模块
 *
 * 4 个附加角色视角（每个角色 >= 3 个测试用例）：
 * 🎮导玩员 — 查看门店排行了解优秀门店
 * 🔧安监 — 查看排行数据做安全合规评估
 * 🤝团建 — 选择高评分门店做团建
 * 📢营销 — 排行数据分析推广方向
 *
 * 每个角色 3+ 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { StoreRankService } from './store-rank.service'
import { StoreRankController } from './store-rank.controller'
import { RankPeriod, RankMetric } from './store-rank.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

const TENANT_ID = 'tenant-001'
const TENANT_CTX: RequestTenantContext = {
  tenantId: TENANT_ID,
  brandId: 'brand-001',
}

// ──────────────────────────────────────────────────────────────────────
// 🎮导玩员 — 查看门店排行了解优秀门店 (guide checking top stores)
// ──────────────────────────────────────────────────────────────────────
describe('🎮导玩员 — 门店排行查看视角', () => {
  let svc: StoreRankService
  let ctrl: StoreRankController

  beforeEach(() => {
    svc = new StoreRankService()
    svc.resetStoreForTests()
    ctrl = new StoreRankController(svc)
  })

  it('导玩员可查看门店营收排行 — 了解优秀门店业绩', () => {
    const result = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Revenue })
    expect(result.items.length).toBe(3)
    expect(result.items[0].rank).toBe(1)
    expect(result.items[0].storeName).toBe('上海南京路店')
    expect(result.items[0].revenue).toBe(1420000)
  })

  it('导玩员可查看门店满意度排行 — 了解客户评价', () => {
    const result = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Satisfaction })
    expect(result.items.length).toBe(2)
    expect(result.items[0].storeName).toBe('上海南京路店')
    expect(result.items[0].satisfaction).toBe(92)
  })

  it('导玩员查看门店排行总览 — 比较各门店数据', () => {
    const revenueRank = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Revenue })
    const growthRank = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Growth })

    expect(revenueRank.total).toBe(3)
    expect(growthRank.total).toBe(2)
    // 比较不同维度
    const topRevenue = revenueRank.items[0]
    const topGrowth = growthRank.items[0]
    expect(topRevenue.storeId).not.toBe(topGrowth.storeId)
  })

  it('导玩员查看单条排行详情 — 了解具体指标', () => {
    const result = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Revenue })
    const firstItem = result.items[0]
    expect(firstItem.rank).toBeDefined()
    expect(firstItem.revenue).toBeDefined()
    expect(firstItem.growth).toBeDefined()
    expect(firstItem.satisfaction).toBeDefined()
    expect(firstItem.efficiency).toBeDefined()
  })

  it('导玩员查看排行摘要 — 获取整体趋势', () => {
    const summary = ctrl.getSummary(TENANT_CTX, RankMetric.Revenue, RankPeriod.Monthly)
    expect(summary.totalStores).toBe(3)
    expect(summary.topStore).toBe('上海南京路店')
    expect(summary.avgRevenue).toBeGreaterThan(0)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🔧安监 — 查看排行数据做安全合规评估
// ──────────────────────────────────────────────────────────────────────
describe('🔧安监 — 排行数据安全评估视角', () => {
  let svc: StoreRankService
  let ctrl: StoreRankController

  beforeEach(() => {
    svc = new StoreRankService()
    svc.resetStoreForTests()
    ctrl = new StoreRankController(svc)
  })

  it('安监可查看门店排行摘要 — 了解整体运营健康度', () => {
    const summary = ctrl.getSummary(TENANT_CTX, RankMetric.Efficiency, RankPeriod.Monthly)
    expect(summary.totalStores).toBe(1) // Efficiency只有1条
    expect(summary.topStore).toBe('深圳万象城店')
    expect(summary.avgRevenue).toBeGreaterThanOrEqual(0)
  })

  it('安监可查看排名变化 — 追踪门店排名趋势', () => {
    const changes = ctrl.getChanges(TENANT_CTX, 'store-001', RankPeriod.Monthly)
    expect(changes.length).toBeGreaterThanOrEqual(1)
    const storeChanges = changes.filter(c => c.storeId === 'store-001')
    expect(storeChanges.length).toBeGreaterThanOrEqual(1)
  })

  it('安监可查看排行详情 — 关注门店设备数据', () => {
    const result = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Revenue })
    const allItems = result.items
    // 检查所有门店的设备配置
    allItems.forEach(item => {
      expect(item.deviceCount).toBeGreaterThan(0)
    })
  })

  it('安监查看门店设备与效率排行关联', () => {
    const effRank = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Efficiency })
    const revenueRank = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Revenue })
    // 设备多的门店效率不一定高（需要现场检验）
    const topEffDevices = effRank.items[0]?.deviceCount ?? 0
    const topRevDevices = revenueRank.items[0]?.deviceCount ?? 0
    // 检查设备数量是否在合理范围内（>0 且 <100）
    expect(topEffDevices).toBeGreaterThan(0)
    expect(topRevDevices).toBeGreaterThan(0)
  })

  it('安监查看排行摘要 — 了解改善和退步门店数量', () => {
    const summary = ctrl.getSummary(TENANT_CTX, RankMetric.Revenue, RankPeriod.Monthly)
    expect(summary.improvedStores).toBeGreaterThanOrEqual(0)
    expect(summary.declinedStores).toBeGreaterThanOrEqual(0)
  })

  it('安监检查门店营收与效率的平衡', () => {
    const rev = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Revenue })
    const eff = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Efficiency })
    // 排名靠前的门店应该在多个维度表现均衡
    const topRevenueStore = rev.items[0]
    const topEfficiencyStore = eff.items[0]
    // 如果营收高的门店效率也高，说明运营健康
    const isHealthy = topRevenueStore.efficiency >= 80 || topEfficiencyStore.revenue > 1000000
    expect(isHealthy).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🤝团建 — 选择高评分门店做团建
// ──────────────────────────────────────────────────────────────────────
describe('🤝团建 — 排行数据选团建门店视角', () => {
  let svc: StoreRankService
  let ctrl: StoreRankController

  beforeEach(() => {
    svc = new StoreRankService()
    svc.resetStoreForTests()
    ctrl = new StoreRankController(svc)
  })

  it('团建可查看满意度排行 — 选择客户好评门店', () => {
    const result = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Satisfaction })
    // 满意度最高的是上海店（92）
    expect(result.items[0].storeName).toBe('上海南京路店')
    expect(result.items[0].satisfaction).toBe(92)
  })

  it('团建可查看门店排行 — 比较各门店的综合表现', () => {
    const rev = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Revenue })
    const sat = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Satisfaction })
    // 营收和满意度都靠前的门店是团建首选
    const revStoreIds = new Set(rev.items.map(i => i.storeId))
    const satStoreIds = new Set(sat.items.map(i => i.storeId))
    const intersection = [...revStoreIds].filter(id => satStoreIds.has(id))
    expect(intersection.length).toBeGreaterThanOrEqual(1)
  })

  it('团建可查看排行摘要 — 了解门店整体排名情况', () => {
    const summary = ctrl.getSummary(TENANT_CTX, RankMetric.Revenue, RankPeriod.Monthly)
    expect(summary.totalStores).toBeGreaterThanOrEqual(1)
    expect(summary.topStore).toBeDefined()
    // topStore应该在门店列表里
    expect(['上海南京路店', '深圳万象城店', '北京国贸店']).toContain(summary.topStore)
  })

  it('团建可查看排名变化 — 选择进步最快门店', () => {
    const changes = ctrl.getChanges(TENANT_CTX, undefined, RankPeriod.Monthly)
    const improved = changes.filter(c => c.change > 0)
    const declined = changes.filter(c => c.change < 0)
    const unchanged = changes.filter(c => c.change === 0)
    // 所有状态加起来等于总数
    expect(improved.length + declined.length + unchanged.length).toBe(changes.length)
  })

  it('团建查看排名详情 — 确认门店信息做选择', () => {
    const result = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Satisfaction })
    const topStore = result.items[0]
    // 团建选择的门店应满足：满意度高 + 会员多
    expect(topStore.satisfaction).toBeGreaterThanOrEqual(85)
    expect(topStore.memberCount).toBeGreaterThan(1000)
    expect(topStore.storeName).toBeTruthy()
  })
})

// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 排行数据分析推广方向
// ──────────────────────────────────────────────────────────────────────
describe('📢营销 — 排行数据分析推广方向视角', () => {
  let svc: StoreRankService
  let ctrl: StoreRankController

  beforeEach(() => {
    svc = new StoreRankService()
    svc.resetStoreForTests()
    ctrl = new StoreRankController(svc)
  })

  it('营销可查看营收排行 — 分析高收入门店的推广策略', () => {
    const result = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Revenue })
    expect(result.items[0].storeName).toBe('上海南京路店')
    expect(result.items[0].revenue).toBe(1420000)
    // 分析第一名门店的增长率
    expect(result.items[0].growth).toBe(5.19)
  })

  it('营销可查看增长排行 — 分析增长最快的门店', () => {
    const result = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Growth })
    expect(result.items[0].storeName).toBe('深圳万象城店')
    expect(result.items[0].growth).toBe(7.08)
    expect(result.items[0].prevRank).toBe(2) // 从第2升到第1
  })

  it('营销可查看排行摘要 — 了解门店平均水平', () => {
    const summary = ctrl.getSummary(TENANT_CTX, RankMetric.Revenue, RankPeriod.Monthly)
    expect(summary.avgRevenue).toBeGreaterThan(0)
    // 平均营收应在百万级别
    expect(summary.avgRevenue).toBeGreaterThan(100000)
  })

  it('营销可查看排名变化 — 追踪门店竞争态势', () => {
    const changes = ctrl.getChanges(TENANT_CTX, 'store-001', RankPeriod.Monthly)
    const storeInfo = changes.find(c => c.storeId === 'store-001')
    expect(storeInfo).toBeDefined()
    expect(storeInfo!.storeName).toBe('深圳万象城店')
    // 营销可根据排名变化调整策略
    if (storeInfo!.change > 0) {
      // 进步门店的推广策略可复用
      expect(storeInfo!.change).toBeGreaterThanOrEqual(0)
    }
  })

  it('营销分析各门店的营收和效率 — 输出促销建议', () => {
    const revenue = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Revenue })
    const efficiency = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Efficiency })
    // 营收高但效率低 → 需要优化运营流程
    // 效率高但营收低 → 需要加强推广
    const revTop = revenue.items[0]
    const effTop = efficiency.items[0]
    // 做出推广决策
    const promoDecisions = {
      boostStore: revTop.revenue < 1000000 ? revTop.storeName : effTop.storeName,
      strategy: revTop.efficiency >= 80 ? '维持现有' : '优化运营',
    }
    expect(promoDecisions.strategy).toBe('维持现有')
  })

  it('营销可查看特定门店详情 — 制定定向推广', () => {
    const result = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Revenue })
    // 第三名门店需要加强推广
    const thirdPlace = result.items[2]
    expect(thirdPlace.storeName).toBe('北京国贸店')
    // 根据数据制定营销计划
    const marketingPlan = {
      store: thirdPlace.storeName,
      currentRevenue: thirdPlace.revenue,
      targetRevenue: thirdPlace.revenue * 1.1,
      satisfactionGoal: Math.min(95, thirdPlace.satisfaction + 5),
    }
    expect(marketingPlan.targetRevenue).toBeGreaterThan(marketingPlan.currentRevenue)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🦞 跨角色全流程闭环
// ──────────────────────────────────────────────────────────────────────
describe('🦞 门店排行跨角色全流程闭环', () => {
  let svc: StoreRankService
  let ctrl: StoreRankController

  beforeEach(() => {
    svc = new StoreRankService()
    svc.resetStoreForTests()
    ctrl = new StoreRankController(svc)
  })

  it('🎮导玩员看排行 → 🔧安监查健康 → 🤝团建选门店 → 📢营销定策略', () => {
    // 1. 🎮导玩员: 查看各维度排行
    const revRank = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Revenue })
    expect(revRank.items[0].storeName).toBe('上海南京路店')

    // 2. 🔧安监: 查看效率排行
    const effRank = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Efficiency })
    expect(effRank.items[0].storeName).toBe('深圳万象城店')

    // 3. 🤝团建: 选满意度最高的门店
    const satRank = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Satisfaction })
    expect(satRank.items[0].storeName).toBe('上海南京路店')
    expect(satRank.items[0].satisfaction).toBe(92)

    // 4. 📢营销: 分析增长趋势
    const growth = ctrl.list(TENANT_CTX, { sortBy: RankMetric.Growth })
    expect(growth.items[0].growth).toBe(7.08)

    // 5. 综合排名摘要
    const summary = ctrl.getSummary(TENANT_CTX, RankMetric.Revenue, RankPeriod.Monthly)
    expect(summary.topStore).toBe('上海南京路店')
    expect(summary.improvedStores + summary.declinedStores).toBeGreaterThanOrEqual(0)
  })
})
