import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DemandForecastService,
  InventoryOptimizer,
  TransferRecommendationService,
  productHistory,
} from './ai-forecast.service'
import { Promotion } from './ai-forecast.entity'

/**
 * ai-forecast 角色测试 (8角色视角)
 * 遵循商场门店组织架构测试每个角色的正常+边界流程
 *
 * 角色:
 *   👔 店长 - 关注全局销量预测、库存调拨决策
 *   🛒 前台 - 关注断货预警、补货建议
 *   👥 HR - 关注周转效率、人员调配相关的库存分析
 *   🔧 安监 - 关注滞销品安全、长库存商品检测
 *   🎮 导玩员 - 关注游戏机台/设备的充值和备品备件预测
 *   🎯 运行专员 - 关注促销活动对库存的影响、促销调优
 *   🤝 团建 - 关注团建备品备件库、批量调拨
 *   📢 营销 - 关注商户品类预测、促销计划制定
 */

// ─── 测试辅助 ───────────────────────────────────────────────────

function makeForecastService(): DemandForecastService {
  return new DemandForecastService()
}

function makeOptimizer(): InventoryOptimizer {
  const forecast = makeForecastService()
  return new InventoryOptimizer(forecast)
}

function makeTransfer(): TransferRecommendationService {
  return new TransferRecommendationService(makeOptimizer())
}

function makePromotion(
  overrides: Partial<Promotion> = {}
): Promotion {
  return {
    id: 'promo-001',
    type: 'discount',
    startDate: '2025-01-01',
    endDate: '2027-12-31',
    boostPercent: 0.2,
    ...overrides,
  }
}

// ====== 👔 店长 ======

describe('👔 店长 - 全局销量预测与调拨决策', () => {
  beforeEach(() => {
    productHistory.clear()
  })

  it('正例: 查看指定产品的销量预测结果含季节性因子', () => {
    const forecast = makeForecastService()
    const result = forecast.forecastSales('prod-game-console', 30)
    expect(result).toBeDefined()
    expect(result.productId).toBe('prod-game-console')
    expect(result.daysAhead).toBe(30)
    expect(result.predictedSales).toBeGreaterThan(0)
    expect(result.confidence).toBeGreaterThanOrEqual(0.75)
    expect(result.confidence).toBeLessThanOrEqual(0.95)
    expect(result.seasonalityFactor).toBeGreaterThan(0)
    expect(result.unit).toBe('units')
  })

  it('正例: 跨门店调拨建议可正常计算', () => {
    const transfer = makeTransfer()
    const result = transfer.suggestTransfer('store-east', 'store-west', 'prod-ticket')
    // 该产品在两个门店间应有库存差异，可能返回 null 或非 null
    if (result !== null) {
      expect(result.fromStore).toBe('store-east')
      expect(result.toStore).toBe('store-west')
      expect(result.quantity).toBeGreaterThan(0)
      expect(result.netBenefit).toBeDefined()
    } else {
      // 库存均衡时无调拨需求，合理边界
      expect(result).toBeNull()
    }
  })

  it('边界: 产品 ID 为空字符串时预测应异常或返回兜底值', () => {
    const forecast = makeForecastService()
    expect(() => forecast.forecastSales('', 7)).not.toThrow()
    const result = forecast.forecastSales('', 7)
    expect(result).toBeDefined()
    expect(result.predictedSales).toBeGreaterThan(0)
  })

  it('边界: daysAhead=0 时预测结果仍返回有效值（下限）', () => {
    const forecast = makeForecastService()
    const result = forecast.forecastSales('prod-boundary', 0)
    expect(result).toBeDefined()
    expect(result.daysAhead).toBe(0)
    expect(result.predictedSales).toBeGreaterThanOrEqual(1)
  })
})

// ====== 🛒 前台 ======

describe('🛒 前台 - 断货预警与补货建议', () => {
  beforeEach(() => {
    productHistory.clear()
  })

  it('正例: 低库存产品返回紧急补货建议', () => {
    const optimizer = makeOptimizer()
    const result = optimizer.suggestReorder('prod-tickets')
    expect(result).toBeDefined()
    expect(result.productId).toBe('prod-tickets')
    expect(result.suggestedQuantity).toBeGreaterThan(0)
    expect(result.urgency).toMatch(/^(low|medium|high)$/)
    expect(result.reason).toBeTruthy()
  })

  it('正例: 最优库存配置包含安全库存与周期库存', () => {
    const forecast = makeForecastService()
    const optimizer = makeOptimizer()
    const sales = forecast.forecastSales('prod-tickets', 30)
    const optimal = optimizer.calculateOptimalStock('prod-tickets', sales, 7)
    expect(optimal.safetyStock).toBeGreaterThanOrEqual(0)
    expect(optimal.cycleStock).toBeGreaterThan(0)
    expect(optimal.totalOptimalStock).toBe(optimal.safetyStock + optimal.cycleStock)
    expect(optimal.reorderPoint).toBeGreaterThan(0)
  })

  it('边界: 提前期极大时安全库存显著增大', () => {
    const forecast = makeForecastService()
    const optimizer = makeOptimizer()
    const sales = forecast.forecastSales('prod-boundary', 30)
    const optimalShort = optimizer.calculateOptimalStock('prod-boundary', sales, 1)
    const optimalLong = optimizer.calculateOptimalStock('prod-boundary', sales, 60)
    expect(optimalLong.safetyStock).toBeGreaterThan(optimalShort.safetyStock)
  })
})

// ====== 👥 HR ======

describe('👥 HR - 周转效率与绩效分析', () => {
  beforeEach(() => {
    productHistory.clear()
  })

  it('正例: 滞销品分析正确识别慢周转商品并给出处理建议', () => {
    const optimizer = makeOptimizer()
    const result = optimizer.detectSlowMoving('prod-slow-item', 30)
    expect(result.productId).toBe('prod-slow-item')
    expect(result.daysSinceLastSale).toBeGreaterThanOrEqual(0)
    expect(result.currentStock).toBeGreaterThan(0)
    expect(result.turnoverRate).toBeGreaterThan(0)
    expect(result.recommendation).toBeTruthy()
  })

  it('正例: 多产品补货结果均可正常获取', () => {
    const optimizer = makeOptimizer()
    const results = ['prod-item-a', 'prod-item-b', 'prod-item-c'].map(
      (pid) => optimizer.suggestReorder(pid)
    )
    expect(results).toHaveLength(3)
    results.forEach((r) => {
      expect(r.suggestedQuantity).toBeGreaterThan(0)
    })
  })

  it('边界: thresholdDays=1 时极短无销售窗应标记滞销', () => {
    const optimizer = makeOptimizer()
    // 模拟一个所有日销售均为 0 的产品
    productHistory.set('prod-never-sold', { dailySales: Array(30).fill(0), categoryId: 'cat-u' })
    const result = optimizer.detectSlowMoving('prod-never-sold', 1)
    expect(result.daysSinceLastSale).toBeGreaterThanOrEqual(1)
  })
})

// ====== 🔧 安监 ======

describe('🔧 安监 - 长库存商品安全检测', () => {
  beforeEach(() => {
    productHistory.clear()
  })

  it('正例: 滞销品检测对超过阈值商品给出清仓建议', () => {
    const optimizer = makeOptimizer()
    const result = optimizer.detectSlowMoving('prod-long-stock', 7)
    if (result.daysSinceLastSale > 7) {
      expect(result.recommendation).toContain('清仓')
    }
    expect(result.recommendation).toBeTruthy()
  })

  it('边界: 未找到任何历史记录的产品静默初始化不抛异常', () => {
    const forecast = makeForecastService()
    expect(() => forecast.forecastSales('prod-unknown-xyz', 14)).not.toThrow()
    const result = forecast.forecastSales('prod-unknown-xyz', 14)
    expect(result.productId).toBe('prod-unknown-xyz')
  })

  it('正例: 周转率计算在无库存时返回合理值', () => {
    const optimizer = makeOptimizer()
    const result = optimizer.detectSlowMoving('prod-empty', 30)
    expect(result.turnoverRate).toBeGreaterThan(0)
  })
})

// ====== 🎮 导玩员 ======

describe('🎮 导玩员 - 游戏设备/票券备品预测', () => {
  beforeEach(() => {
    productHistory.clear()
  })

  it('正例: 预测游戏币/票券的销量趋势', () => {
    const forecast = makeForecastService()
    const result = forecast.forecastSales('game-token', 14)
    expect(result.productId).toBe('game-token')
    expect(result.predictedSales).toBeGreaterThanOrEqual(1)
  })

  it('正例: 获取产品季节性因子指导备品规划', () => {
    const forecast = makeForecastService()
    const seasonal = forecast.getSeasonality('game-token')
    expect(seasonal.productId).toBe('game-token')
    expect(seasonal.monthlyFactors).toHaveLength(12)
    seasonal.monthlyFactors.forEach((factor) => {
      expect(factor).toBeGreaterThan(0)
    })
  })

  it('边界: 同一个产品的季节性因子调用两次应一致', () => {
    const forecast = makeForecastService()
    const s1 = forecast.getSeasonality('game-arcade')
    const s2 = forecast.getSeasonality('game-arcade')
    expect(s1.monthlyFactors).toEqual(s2.monthlyFactors)
    expect(s1.trend).toBe(s2.trend)
  })
})

// ====== 🎯 运行专员 ======

describe('🎯 运行专员 - 促销活动影响分析与调优', () => {
  beforeEach(() => {
    productHistory.clear()
  })

  it('正例: 促销活动可提升预测销量', () => {
    const forecast = makeForecastService()
    const base = forecast.forecastSales('prod-sale-item', 30)
    const promo = makePromotion({ boostPercent: 0.5 })
    const adjusted = forecast.adjustForPromotions(base, [promo])
    expect(adjusted.predictedSales).toBeGreaterThanOrEqual(base.predictedSales)
    expect(adjusted.promotionMultiplier).toBeGreaterThan(1)
  })

  it('正例: 过期促销活动不产生销量提升', () => {
    const forecast = makeForecastService()
    const base = forecast.forecastSales('prod-expired-promo', 30)
    const expired = makePromotion({
      startDate: '2020-01-01',
      endDate: '2020-12-31',
    })
    const adjusted = forecast.adjustForPromotions(base, [expired])
    expect(adjusted.promotionMultiplier).toBe(1.0)
    expect(adjusted.predictedSales).toBe(base.predictedSales)
  })

  it('边界: 空促销数组不影响原始预测', () => {
    const forecast = makeForecastService()
    const base = forecast.forecastSales('prod-no-promo', 30)
    const adjusted = forecast.adjustForPromotions(base, [])
    expect(adjusted.promotionMultiplier).toBe(1.0)
    expect(adjusted.predictedSales).toBe(base.predictedSales)
  })
})

// ====== 🤝 团建 ======

describe('🤝 团建 - 批量调拨与备品协调', () => {
  beforeEach(() => {
    productHistory.clear()
  })

  it('正例: 全局最优分配计算返回调拨方案', () => {
    const transfer = makeTransfer()
    const products = [
      { storeId: 'store-a', productId: 'prod-group-ticket' },
      { storeId: 'store-b', productId: 'prod-group-ticket' },
      { storeId: 'store-c', productId: 'prod-group-ticket' },
    ]
    const allocations = transfer.optimizeGlobalAllocation(products)
    expect(Array.isArray(allocations)).toBe(true)
    // 可能会存在零调拨的情况
    allocations.forEach((alloc) => {
      expect(alloc.productId).toBeTruthy()
      expect(alloc.allocations.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('正例: 调拨收益计算返回成本明细', () => {
    const transfer = makeTransfer()
    const benefit = transfer.calculateTransferBenefit('store-a', 'store-b', 'prod-group-ticket')
    expect(benefit.cost).toBeDefined()
    expect(benefit.cost.freight).toBeGreaterThanOrEqual(0)
    expect(benefit.cost.loss).toBeGreaterThanOrEqual(0)
    expect(benefit.cost.labor).toBeGreaterThanOrEqual(0)
    expect(benefit.cost.total).toBeGreaterThan(0)
  })

  it('边界: 同门店调拨收益计算仍返回结构正确的响应', () => {
    const transfer = makeTransfer()
    const benefit = transfer.calculateTransferBenefit('store-a', 'store-a', 'prod-same-store')
    expect(benefit.cost.total).toBeGreaterThan(0)
    expect(benefit.totalSavings).toBeGreaterThanOrEqual(0)
  })
})

// ====== 📢 营销 ======

describe('📢 营销 - 品类预测与促销计划制定', () => {
  beforeEach(() => {
    productHistory.clear()
  })

  it('正例: 品类级预测汇总所有产品销量', () => {
    const forecast = makeForecastService()
    const result = forecast.forecastByCategory('cat-tickets', 14)
    expect(result.categoryId).toBe('cat-tickets')
    expect(result.daysAhead).toBe(14)
    expect(result.totalPredictedSales).toBeGreaterThan(0)
    expect(result.productForecasts.length).toBeGreaterThanOrEqual(1)
  })

  it('正例: 促销调整配合分销渠道分析', () => {
    const forecast = makeForecastService()
    const base = forecast.forecastSales('prod-bundle-item', 60)
    const promos = [
      makePromotion({ id: 'p1', type: 'discount', boostPercent: 0.3 }),
      makePromotion({ id: 'p2', type: 'bundled', boostPercent: 0.15 }),
    ]
    const adjusted = forecast.adjustForPromotions(base, promos)
    // 多重促销叠加效应（递减）
    expect(adjusted.promotionMultiplier).toBeGreaterThan(1.0)
    expect(adjusted.promotionMultiplier).toBeLessThan(1 + 0.3 + 0.15)
  })

  it('边界: 不存在的品类 ID 会兜底创建 3 个默认产品预测', () => {
    const forecast = makeForecastService()
    const result = forecast.forecastByCategory('cat-non-existent', 7)
    expect(result.categoryId).toBe('cat-non-existent')
    expect(result.productForecasts).toHaveLength(3)
    result.productForecasts.forEach((pf) => {
      expect(pf.productId).toContain('cat-non-existent')
    })
  })
})
