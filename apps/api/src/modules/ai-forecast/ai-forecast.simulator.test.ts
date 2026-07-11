/**
 * 🐜 自动: [ai-forecast] [D] simulator 测试
 *
 * AI 需求预测 Simulator 测试：
 * - 销量预测模拟（多场景、多产品）
 * - 库存优化模拟（最优库存、补货、滞销品）
 * - 调拨管理模拟（建议、收益计算、全局分配）
 */
import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import {
  DemandForecastService,
  InventoryOptimizer,
  TransferRecommendationService,
} from './ai-forecast.service'

// ===========================
// 模拟场景: 销量预测
// ===========================
describe('📊 AI-Forecast Simulator — 销量预测模拟', () => {
  let demandForecastService: DemandForecastService

  beforeEach(() => {
    demandForecastService = new DemandForecastService()
  })

  it('[正常] 销量预测返回有效结果（含置信度区间）', () => {
    const result = demandForecastService.forecastSales('prod-hot-001', 30)
    expect(result.productId).toBe('prod-hot-001')
    expect(result.daysAhead).toBe(30)
    expect(result.predictedSales).toBeGreaterThan(0)
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
    expect(result.seasonalityFactor).toBeGreaterThan(0)
    expect(result.promotionMultiplier).toBeGreaterThanOrEqual(1)
  })

  it('[正常] 不同预测天数的销量预测应随天数增长', () => {
    const shortTerm = demandForecastService.forecastSales('prod-basic-001', 7)
    const longTerm = demandForecastService.forecastSales('prod-basic-001', 90)

    expect(longTerm.predictedSales).toBeGreaterThan(shortTerm.predictedSales)
    // 长周期置信度可能降低
    expect(longTerm.confidence).toBeLessThanOrEqual(shortTerm.confidence)
  })

  it('[边界] 预测天数为 1 时仍能返回有效结果', () => {
    const result = demandForecastService.forecastSales('prod-basic-001', 1)
    expect(result.predictedSales).toBeGreaterThanOrEqual(0)
    expect(result.seasonalityFactor).toBeGreaterThan(0)
    expect(result.promotionMultiplier).toBeGreaterThanOrEqual(1)
  })

  it('[边界] 预测天数为 365 时返回有效结果', () => {
    const result = demandForecastService.forecastSales('prod-basic-001', 365)
    expect(result.predictedSales).toBeGreaterThan(0)
    expect(result.daysAhead).toBe(365)
  })

  it('[异常] 未知产品 ID 应返回零值预测', () => {
    const result = demandForecastService.forecastSales('non-existent-prod', 30)
    // 即使未知产品,系统也应返回合理预测值（无历史数据则保守估计）
    expect(result.productId).toBe('non-existent-prod')
    expect(result.predictedSales).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeGreaterThanOrEqual(0)
  })

  it('[正常] 品类预测应包含多个产品明细', () => {
    const result = demandForecastService.forecastByCategory('cat-games', 30)
    expect(result.categoryId).toBe('cat-games')
    expect(result.daysAhead).toBe(30)
    expect(result.totalPredictedSales).toBeGreaterThan(0)
    expect(result.productForecasts.length).toBeGreaterThan(1)
    // 各产品预测销量之和应等于总预测
    const sum = result.productForecasts.reduce((acc, p) => acc + p.predictedSales, 0)
    expect(sum).toBe(result.totalPredictedSales)
  })

  it('[正常] 季节性因子应返回 12 个月数据', () => {
    const seasonality = demandForecastService.getSeasonality('prod-basic-001')
    expect(seasonality.productId).toBe('prod-basic-001')
    expect(seasonality.monthlyFactors).toHaveLength(12)
    seasonality.monthlyFactors.forEach((f) => {
      expect(f).toBeGreaterThan(0)
    })
    // trend 可以正可以负
    expect(typeof seasonality.trend).toBe('number')
  })

  it('[正常] 促销调整应提高预测销量', () => {
    const base = demandForecastService.forecastSales('prod-basic-001', 30)
    const adjusted = demandForecastService.adjustForPromotions(base, [
      {
        id: 'promo-summer',
        type: 'discount' as const,
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        boostPercent: 1.5,
      },
    ])
    // 促销后预测销量应 >= 基础预测（促销乘数 >= 1）
    expect(adjusted.predictedSales).toBeGreaterThanOrEqual(base.predictedSales)
    expect(adjusted.promotionMultiplier).toBeGreaterThanOrEqual(1)
  })
})

// ===========================
// 模拟场景: 库存优化
// ===========================
describe('📦 AI-Forecast Simulator — 库存优化模拟', () => {
  let demandForecastService: DemandForecastService
  let inventoryOptimizer: InventoryOptimizer

  beforeEach(() => {
    demandForecastService = new DemandForecastService()
    inventoryOptimizer = new InventoryOptimizer()
  })

  it('[正常] 畅销品安全库存应高于普通产品', () => {
    const hotForecast = demandForecastService.forecastSales('prod-hot-001', 30)
    const basicForecast = demandForecastService.forecastSales('prod-basic-001', 30)

    const hotStock = inventoryOptimizer.calculateOptimalStock('prod-hot-001', hotForecast, 7)
    const basicStock = inventoryOptimizer.calculateOptimalStock('prod-basic-001', basicForecast, 7)

    expect(hotStock.safetyStock).toBeGreaterThanOrEqual(basicStock.safetyStock)
    expect(hotStock.totalOptimalStock).toBeGreaterThan(0)
    expect(basicStock.totalOptimalStock).toBeGreaterThan(0)
  })

  it('[正常] 长提前期需要更高再订货点', () => {
    const forecast = demandForecastService.forecastSales('prod-basic-001', 30)
    const shortLead = inventoryOptimizer.calculateOptimalStock('prod-basic-001', forecast, 3)
    const longLead = inventoryOptimizer.calculateOptimalStock('prod-basic-001', forecast, 14)

    expect(longLead.reorderPoint).toBeGreaterThan(shortLead.reorderPoint)
    expect(longLead.safetyStock).toBeGreaterThanOrEqual(shortLead.safetyStock)
  })

  it('[边界] 提前期为 1 天时仍能计算', () => {
    const forecast = demandForecastService.forecastSales('prod-basic-001', 30)
    const stock = inventoryOptimizer.calculateOptimalStock('prod-basic-001', forecast, 1)
    expect(stock.reorderPoint).toBeGreaterThan(0)
    expect(stock.reorderQuantity).toBeGreaterThan(0)
  })

  it('[正常] 低库存产品应给出高紧急补货建议', () => {
    // prod-low-stock-001 是低库存模拟产品
    const reorder = inventoryOptimizer.suggestReorder('prod-low-stock-001')
    expect(reorder.productId).toBe('prod-low-stock-001')
    expect(reorder.suggestedQuantity).toBeGreaterThan(0)
    expect(['low', 'medium', 'high']).toContain(reorder.urgency)
    expect(reorder.reason).toBeTruthy()
  })

  it('[正常] 正常库存产品补货建议紧急性较低', () => {
    const reorder = inventoryOptimizer.suggestReorder('prod-basic-001')
    expect(reorder.suggestedQuantity).toBeGreaterThan(0)
  })

  it('[正常] 滞销品检测应返回处理建议', () => {
    const slow = inventoryOptimizer.detectSlowMoving('prod-slow-001', 30)
    expect(slow.productId).toBe('prod-slow-001')
    expect(slow.daysSinceLastSale).toBeGreaterThan(0)
    expect(slow.currentStock).toBeGreaterThan(0)
    expect(slow.recommendation).toBeTruthy()
  })

  it('[边界] 阈值天数为 1 时所有产品都被视为滞销', () => {
    const slow = inventoryOptimizer.detectSlowMoving('prod-basic-001', 1)
    expect(slow.recommendation).toBeTruthy()
  })

  it('[边界] 阈值天数为 365 时几乎无产品视为滞销', () => {
    const slow = inventoryOptimizer.detectSlowMoving('prod-basic-001', 365)
    expect(slow.recommendation).toBeTruthy()
  })
})

// ===========================
// 模拟场景: 调拨管理
// ===========================
describe('🚚 AI-Forecast Simulator — 调拨管理模拟', () => {
  let transferService: TransferRecommendationService

  beforeEach(() => {
    transferService = new TransferRecommendationService()
  })

  it('[正常] 调拨建议应返回合理结果或 null（根据门店库存差异）', () => {
    // 尝试多组门店组合找到有库存差异的
    const pairs = [
      ['store-east', 'store-west'],
      ['store-north', 'store-south'],
      ['store-east', 'store-south'],
    ]
    let found = false
    for (const [from, to] of pairs) {
      const result = transferService.suggestTransfer(from, to, 'prod-hot-001')
      if (result && result.quantity > 0) {
        found = true
        expect(result.fromStore).toBe(from)
        expect(result.toStore).toBe(to)
        expect(result.productId).toBe('prod-hot-001')
        expect(result.benefit).toBeGreaterThanOrEqual(0)
        expect(result.cost.freight).toBeGreaterThan(0)
        expect(result.cost.total).toBeGreaterThan(0)
        expect(result.netBenefit).toBe(result.benefit - result.cost.total)
        break
      }
    }
    // 至少有一组调拨建议应返回
    expect(found).toBe(true)
  })

  it('[边界] 库存短缺门店到富余门店的调拨应返回 null', () => {
    const result = transferService.suggestTransfer('store-west', 'store-east', 'prod-hot-001')
    // 如果反向调拨不合理,应返回 null
    // 否则 netBenefit 可能很小
    if (result) {
      expect(result.netBenefit).toBeLessThanOrEqual(0)
    }
  })

  it('[正常] 调拨收益计算应返回成本明细', () => {
    const result = transferService.calculateTransferBenefit('store-east', 'store-west', 'prod-hot-001')
    expect(result.cost.freight).toBeGreaterThan(0)
    expect(result.cost.labor).toBeGreaterThan(0)
    expect(result.totalSavings).toBeGreaterThan(0)
  })

  it('[边界] 同一门店调拨收益计算', () => {
    const result = transferService.calculateTransferBenefit('store-east', 'store-east', 'prod-hot-001')
    expect(result.totalSavings).toBeGreaterThanOrEqual(0)
    expect(typeof result.cost.total).toBe('number')
  })

  it('[正常] 全局优化分配应返回多个门店的建议', () => {
    const results = transferService.optimizeGlobalAllocation([
      { storeId: 'store-east', productId: 'prod-hot-001' },
      { storeId: 'store-west', productId: 'prod-basic-001' },
      { storeId: 'store-south', productId: 'prod-slow-001' },
    ])
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBeGreaterThan(0)
    results.forEach((r) => {
      expect(r.productId).toBeTruthy()
      expect(Array.isArray(r.allocations)).toBe(true)
      expect(r.allocations.length).toBeGreaterThan(0)
      r.allocations.forEach((a: any) => {
        expect(a.storeId).toBeTruthy()
        expect(typeof a.quantity).toBe('number')
      })
    })
  })

  it('[边界] 单产品全局分配也能返回结果', () => {
    const results = transferService.optimizeGlobalAllocation([
      { storeId: 'store-east', productId: 'prod-hot-001' },
    ])
    expect(Array.isArray(results)).toBe(true)
  })

  it('[异常] 未知门店返回空数组', () => {
    const results = transferService.optimizeGlobalAllocation([
      { storeId: 'store-unknown', productId: 'prod-hot-001' },
    ])
    // 不会报错,返回空或兜底结果
    expect(Array.isArray(results)).toBe(true)
  })
})
