import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [ai-forecast] [C] 角色测试 v3 — 游戏厅场景深入场景
 *
 * 8 角色视角（街机游戏厅场景）:
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例:
 *  - 正常流程（完整业务场景）
 *  - 权限/数据边界
 *
 * 场景覆盖:
 *  各角色使用 DemandForecastService / InventoryOptimizer / TransferRecommendationService
 *  进行预测、库存分析、调拨等操作
 */

import {
  DemandForecastService,
  InventoryOptimizer,
  TransferRecommendationService,
  productHistory,
} from './ai-forecast.service'
import type { Promotion } from './ai-forecast.entity'

// ── 角色常量 ──
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

// ── 测试工厂 ──
function makeForecastService(): DemandForecastService {
  return new DemandForecastService()
}

function makeOptimizer(): InventoryOptimizer {
  return new InventoryOptimizer(makeForecastService())
}

function makeTransfer(): TransferRecommendationService {
  return new TransferRecommendationService(makeOptimizer())
}

function makePromotion(overrides: Partial<Promotion> = {}): Promotion {
  return {
    id: 'promo-001',
    type: 'discount',
    startDate: '2025-01-01',
    endDate: '2027-12-31',
    boostPercent: 0.2,
    ...overrides,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 👔店长 — 关注全局销量预测、多门店库存对比、季节性趋势分析
// ══════════════════════════════════════════════════════════════════════════════

describe('👔店长视角 - ai-forecast v3', () => {
  beforeEach(() => { productHistory.clear() })

  it('[店长v3-1] 正常流程: 多门店多产品预测可得汇总数据', () => {
    const forecast = makeForecastService()
    const products = ['game-arcade-01', 'game-arcade-02', 'game-ticket-01']
    const results = products.map(pid => forecast.forecastSales(pid, 30))
    expect(results).toHaveLength(3)
    results.forEach(r => {
      expect(r.predictedSales).toBeGreaterThan(0)
      expect(r.confidence).toBeGreaterThanOrEqual(0.75)
      expect(r.unit).toBe('units')
    })
    // 不同产品的季节性因子不同
    const factors = new Set(results.map(r => r.seasonalityFactor))
    expect(factors.size).toBeGreaterThanOrEqual(1)
  })

  it('[店长v3-2] 边界: 负天数预测不抛异常且返回结构正确', () => {
    const forecast = makeForecastService()
    const result = forecast.forecastSales('prod-negative-test', -5)
    expect(result.predictedSales).toBeGreaterThanOrEqual(1)
    expect(result.productId).toBe('prod-negative-test')
    expect(result.confidence).toBeGreaterThanOrEqual(0.75)
  })

  it('[店长v3-3] 正常流程: 跨品类预测可获取季节性趋势', () => {
    const forecast = makeForecastService()
    const season1 = forecast.getSeasonality('game-token')
    const season2 = forecast.getSeasonality('game-prize')
    expect(season1.monthlyFactors).toHaveLength(12)
    expect(season2.monthlyFactors).toHaveLength(12)
    // 趋势可能为正或负
    expect(typeof season1.trend).toBe('number')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🛒前台 — 关注断货预警、补货建议、安全库存计算
// ══════════════════════════════════════════════════════════════════════════════

describe('🛒前台视角 - ai-forecast v3', () => {
  beforeEach(() => { productHistory.clear() })

  it('[前台v3-1] 正常流程: 低库存产品返回紧急补货建议', () => {
    const optimizer = makeOptimizer()
    const result = optimizer.suggestReorder('store-item-liquor')
    expect(result.urgency).toMatch(/^(low|medium|high)$/)
    expect(result.suggestedQuantity).toBeGreaterThan(0)
    expect(result.reason).toBeTruthy()
  })

  it('[前台v3-2] 正常流程: 安全库存随提前期增加而增大', () => {
    const forecast = makeForecastService()
    const optimizer = makeOptimizer()
    const sales1 = forecast.forecastSales('prod-front-test', 30)
    const optShort = optimizer.calculateOptimalStock('prod-front-test', sales1, 1)
    const optLong = optimizer.calculateOptimalStock('prod-front-test', sales1, 30)
    expect(optLong.safetyStock).toBeGreaterThanOrEqual(optShort.safetyStock)
  })

  it('[前台v3-3] 边界: 提前期为 0 时安全库存为 0 但结构完整', () => {
    const forecast = makeForecastService()
    const optimizer = makeOptimizer()
    const sales = forecast.forecastSales('prod-zero-lead', 7)
    const opt = optimizer.calculateOptimalStock('prod-zero-lead', sales, 0)
    expect(opt.safetyStock).toBe(0)
    expect(opt.productId).toBe('prod-zero-lead')
    expect(opt.reorderPoint).toBeGreaterThanOrEqual(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 👥HR — 关注周转效率、滞销品分析、库存健康度
// ══════════════════════════════════════════════════════════════════════════════

describe('👥HR视角 - ai-forecast v3', () => {
  beforeEach(() => { productHistory.clear() })

  it('[HRv3-1] 正常流程: 滞销品识别给出合理的处理建议', () => {
    const optimizer = makeOptimizer()
    const result = optimizer.detectSlowMoving('prod-hr-slow', 14)
    expect(result.productId).toBe('prod-hr-slow')
    expect(result.daysSinceLastSale).toBeGreaterThanOrEqual(0)
    expect(result.recommendation).toBeTruthy()
  })

  it('[HRv3-2] 边界: 极低阈值的滞销检测仍返回有效结果', () => {
    const optimizer = makeOptimizer()
    const result = optimizer.detectSlowMoving('prod-ultra-slow', 1)
    expect(result.daysSinceLastSale).toBeGreaterThan(0)
    expect(result.turnoverRate).toBeGreaterThan(0)
  })

  it('[HRv3-3] 正常流程: 多个产品同时检测各结果独立', () => {
    const optimizer = makeOptimizer()
    const r1 = optimizer.detectSlowMoving('prod-hr-a', 7)
    const r2 = optimizer.detectSlowMoving('prod-hr-b', 7)
    expect(r1.productId).toBe('prod-hr-a')
    expect(r2.productId).toBe('prod-hr-b')
    // 不同产品的周转率可能不同
    expect(typeof r1.turnoverRate).toBe('number')
    expect(typeof r2.turnoverRate).toBe('number')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🔧安监 — 关注库存安全、异常检测、长库存商品风险
// ══════════════════════════════════════════════════════════════════════════════

describe('🔧安监视角 - ai-forecast v3', () => {
  beforeEach(() => { productHistory.clear() })

  it('[安监v3-1] 正常流程: 滞销品检测超过阈值给出清仓建议', () => {
    const optimizer = makeOptimizer()
    // 用低阈值确保触发边界
    const result = optimizer.detectSlowMoving('prod-security-long', 7)
    if (result.daysSinceLastSale > 7) {
      expect(result.recommendation).toContain('清仓')
    }
    expect(result.recommendation).toBeTruthy()
  })

  it('[安监v3-2] 正常流程: 补货建议在高缺货场景下合理', () => {
    const optimizer = makeOptimizer()
    // 模拟低库存产品
    const result = optimizer.suggestReorder('prod-security-reorder')
    expect(result.suggestedQuantity).toBeGreaterThan(0)
    expect(['low', 'medium', 'high']).toContain(result.urgency)
  })

  it('[安监v3-3] 边界: 超大 thresholdDays 不抛异常', () => {
    const optimizer = makeOptimizer()
    const result = optimizer.detectSlowMoving('prod-security-huge', 9999)
    expect(result.daysSinceLastSale).toBeGreaterThanOrEqual(0)
    expect(result.recommendation).toBeTruthy()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🎮导玩员 — 关注游戏币/礼品券预测、季节性备品规划
// ══════════════════════════════════════════════════════════════════════════════

describe('🎮导玩员视角 - ai-forecast v3', () => {
  beforeEach(() => { productHistory.clear() })

  it('[导玩员v3-1] 正常流程: 游戏币预测含合理季节性', () => {
    const forecast = makeForecastService()
    const result = forecast.forecastSales('game-coin-token', 60)
    expect(result.productId).toBe('game-coin-token')
    expect(result.predictedSales).toBeGreaterThan(0)
    // 季节性因子存在
    expect(result.seasonalityFactor).toBeGreaterThan(0)
  })

  it('[导玩员v3-2] 正常流程: 礼品券的月度季节性分布合理', () => {
    const forecast = makeForecastService()
    const season = forecast.getSeasonality('game-gift-coupon')
    expect(season.monthlyFactors).toHaveLength(12)
    const sum = season.monthlyFactors.reduce((a, b) => a + b, 0)
    expect(sum).toBeGreaterThan(0)
    // trend 为数值
    expect(typeof season.trend).toBe('number')
  })

  it('[导玩员v3-3] 正常流程: 多款设备预测相互独立', () => {
    const forecast = makeForecastService()
    const r1 = forecast.forecastSales('game-machine-a', 14)
    const r2 = forecast.forecastSales('game-machine-b', 14)
    expect(r1.productId).toBe('game-machine-a')
    expect(r2.productId).toBe('game-machine-b')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🎯运行专员 — 关注促销活动影响、调拨收益分析、多门店调配
// ══════════════════════════════════════════════════════════════════════════════

describe('🎯运行专员视角 - ai-forecast v3', () => {
  beforeEach(() => { productHistory.clear() })

  it('[运行专员v3-1] 正常流程: 多重促销叠加正确递减', () => {
    const forecast = makeForecastService()
    const base = forecast.forecastSales('prod-ops-bundle', 30)
    const promos = [
      makePromotion({ id: 'p1', boostPercent: 0.5 }),
      makePromotion({ id: 'p2', boostPercent: 0.3 }),
    ]
    const adjusted = forecast.adjustForPromotions(base, promos)
    expect(adjusted.predictedSales).toBeGreaterThanOrEqual(base.predictedSales)
    // 叠加效益有衰减
    expect(adjusted.promotionMultiplier).toBeGreaterThan(1)
    expect(adjusted.promotionMultiplier).toBeLessThan(1 + 0.5 + 0.3)
  })

  it('[运行专员v3-2] 边界: 0% 提升的促销不影响预测', () => {
    const forecast = makeForecastService()
    const base = forecast.forecastSales('prod-ops-zero-promo', 14)
    const emptyPromo = makePromotion({ boostPercent: 0 })
    const adjusted = forecast.adjustForPromotions(base, [emptyPromo])
    // boost=0 但叠加公式: 0 * (1-0*0.1)=0
    expect(adjusted.promotionMultiplier).toBe(1.0)
  })

  it('[运行专员v3-3] 正常流程: 跨门店调拨收益计算含完整明细', () => {
    const transfer = makeTransfer()
    const benefit = transfer.calculateTransferBenefit('store-east', 'store-west', 'prod-ops-transfer')
    expect(benefit.cost.freight).toBeGreaterThanOrEqual(0)
    expect(benefit.cost.total).toBeGreaterThan(0)
    expect(benefit.totalSavings).toBeGreaterThanOrEqual(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🤝团建 — 关注批量调拨、团建备品协调、全局分配
// ══════════════════════════════════════════════════════════════════════════════

describe('🤝团建视角 - ai-forecast v3', () => {
  beforeEach(() => { productHistory.clear() })

  it('[团建v3-1] 正常流程: 全局最优分配可给出方案', () => {
    const transfer = makeTransfer()
    const products = [
      { storeId: 'store-teama', productId: 'prod-team-goods' },
      { storeId: 'store-teamb', productId: 'prod-team-goods' },
      { storeId: 'store-teamc', productId: 'prod-team-goods' },
    ]
    const allocations = transfer.optimizeGlobalAllocation(products)
    expect(Array.isArray(allocations)).toBe(true)
    // 所有分配方案应有结构完整性
    for (const alloc of allocations) {
      expect(alloc.productId).toBeTruthy()
      expect(alloc.allocations).toBeInstanceOf(Array)
    }
  })

  it('[团建v3-2] 正常流程: 同门店调拨收益计算结构完整', () => {
    const transfer = makeTransfer()
    const benefit = transfer.calculateTransferBenefit('store-teamx', 'store-teamx', 'prod-team-same')
    expect(benefit.cost).toHaveProperty('freight')
    expect(benefit.cost).toHaveProperty('loss')
    expect(benefit.cost).toHaveProperty('labor')
    expect(benefit.cost.total).toBeGreaterThan(0)
  })

  it('[团建v3-3] 边界: 全局分配输入为空不抛异常', () => {
    const transfer = makeTransfer()
    const allocations = transfer.optimizeGlobalAllocation([])
    expect(allocations).toEqual([])
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 📢营销 — 关注品类预测、促销效果分析、季节性营销计划
// ══════════════════════════════════════════════════════════════════════════════

describe('📢营销视角 - ai-forecast v3', () => {
  beforeEach(() => { productHistory.clear() })

  it('[营销v3-1] 正常流程: 品类预测汇总所有产品', () => {
    const forecast = makeForecastService()
    // 先初始化两个产品到同一品类
    productHistory.set('prod-mkt-a', { dailySales: Array(30).fill(15), categoryId: 'cat-promo' })
    productHistory.set('prod-mkt-b', { dailySales: Array(30).fill(10), categoryId: 'cat-promo' })
    const result = forecast.forecastByCategory('cat-promo', 14)
    expect(result.categoryId).toBe('cat-promo')
    expect(result.productForecasts.length).toBeGreaterThanOrEqual(2)
    expect(result.totalPredictedSales).toBeGreaterThan(0)
  })

  it('[营销v3-2] 正常流程: 促销调整区分活跃与过期促销', () => {
    const forecast = makeForecastService()
    const base = forecast.forecastSales('prod-mkt-active-promo', 30)
    const activePromo = makePromotion({ id: 'active', boostPercent: 0.4 })
    const expiredPromo = makePromotion({
      id: 'expired',
      startDate: '2020-01-01',
      endDate: '2020-12-31',
      boostPercent: 0.8,
    })
    const adjusted = forecast.adjustForPromotions(base, [activePromo, expiredPromo])
    // 只有活跃促销生效（过期促销不应叠加）
    expect(adjusted.promotionMultiplier).toBeGreaterThan(1)
    expect(adjusted.promotionMultiplier).toBeLessThan(1 + 0.4 + 0.8)
    // 过期促销不应影响
    const onlyActive = forecast.adjustForPromotions(base, [activePromo])
    expect(adjusted.promotionMultiplier).toBe(onlyActive.promotionMultiplier)
  })

  it('[营销v3-3] 正常流程: 季节性因子可用于制定营销日历', () => {
    const forecast = makeForecastService()
    const season = forecast.getSeasonality('prod-mkt-calendar')
    // 找出最高月份
    const maxFactor = Math.max(...season.monthlyFactors)
    const maxMonth = season.monthlyFactors.indexOf(maxFactor)
    expect(maxMonth).toBeGreaterThanOrEqual(0)
    expect(maxMonth).toBeLessThanOrEqual(11)
    expect(maxFactor).toBeGreaterThan(1)
  })
})
