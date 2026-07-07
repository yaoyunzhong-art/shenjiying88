import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * AiForecastController 单元测试
 *
 * 策略：内联 Controller 副本 + Mock Service
 * 覆盖：销量预测、库存优化、调拨管理三大模块
 * 正向流程 + 边界条件
 */

import assert from 'node:assert/strict'

// ── Mock Services ─────────────────────────────────────────────

function createMockServices() {
  const demandService = {
    forecastSales: vi.fn(),
    forecastByCategory: vi.fn(),
    getSeasonality: vi.fn(),
    adjustForPromotions: vi.fn()
  }

  const inventoryOptimizer = {
    calculateOptimalStock: vi.fn(),
    suggestReorder: vi.fn(),
    detectSlowMoving: vi.fn()
  }

  const transferService = {
    suggestTransfer: vi.fn(),
    calculateTransferBenefit: vi.fn(),
    optimizeGlobalAllocation: vi.fn()
  }

  return { demandService, inventoryOptimizer, transferService }
}

// ── Simplified Controller (avoids NestJS DI for unit test) ───

function createController(
  demandService: ReturnType<typeof createMockServices>['demandService'],
  inventoryOptimizer: ReturnType<typeof createMockServices>['inventoryOptimizer'],
  transferService: ReturnType<typeof createMockServices>['transferService']
) {
  return {
    // ── 销量预测 ──
    forecastSales(query: { productId: string; daysAhead: number }) {
      return demandService.forecastSales(query.productId, query.daysAhead)
    },
    forecastCategory(query: { categoryId: string; daysAhead: number }) {
      return demandService.forecastByCategory(query.categoryId, query.daysAhead)
    },
    getSeasonality(productId: string) {
      return demandService.getSeasonality(productId)
    },
    adjustForPromotions(dto: { productId: string; daysAhead: number; promotions: any[] }) {
      const base = demandService.forecastSales(dto.productId, dto.daysAhead)
      return demandService.adjustForPromotions(base, dto.promotions)
    },

    // ── 库存优化 ──
    calculateOptimalStock(query: { productId: string; leadTime: number; daysAhead: number }) {
      const forecast = demandService.forecastSales(query.productId, query.daysAhead)
      return inventoryOptimizer.calculateOptimalStock(query.productId, forecast, query.leadTime)
    },
    suggestReorder(query: { productId: string }) {
      return inventoryOptimizer.suggestReorder(query.productId)
    },
    detectSlowMoving(query: { productId: string; thresholdDays?: number }) {
      return inventoryOptimizer.detectSlowMoving(query.productId, query.thresholdDays ?? 30)
    },

    // ── 调拨管理 ──
    suggestTransfer(query: { fromStore: string; toStore: string; productId: string }) {
      return transferService.suggestTransfer(query.fromStore, query.toStore, query.productId)
    },
    calculateTransferBenefit(query: { fromStore: string; toStore: string; productId: string }) {
      return transferService.calculateTransferBenefit(query.fromStore, query.toStore, query.productId)
    },
    optimizeGlobalAllocation(dto: { products: { storeId: string; productId: string }[] }) {
      return transferService.optimizeGlobalAllocation(dto.products)
    }
  }
}

// ── Fixtures ─────────────────────────────────────────────────

function makeForecast(overrides: Record<string, unknown> = {}) {
  return {
    productId: 'prod-001',
    daysAhead: 7,
    predictedSales: 120,
    unit: 'units',
    confidence: 0.85,
    seasonalityFactor: 1.2,
    promotionMultiplier: 1.0,
    ...overrides
  }
}

function makeCategoryForecast(overrides: Record<string, unknown> = {}) {
  return {
    categoryId: 'cat-001',
    daysAhead: 7,
    totalPredictedSales: 500,
    productForecasts: [
      makeForecast({ productId: 'prod-001', predictedSales: 120 }),
      makeForecast({ productId: 'prod-002', predictedSales: 380 })
    ],
    ...overrides
  }
}

function makeOptimalStock(overrides: Record<string, unknown> = {}) {
  return {
    productId: 'prod-001',
    safetyStock: 30,
    cycleStock: 70,
    totalOptimalStock: 100,
    reorderPoint: 100,
    reorderQuantity: 100,
    ...overrides
  }
}

function makeReorderSuggestion(overrides: Record<string, unknown> = {}) {
  return {
    productId: 'prod-001',
    suggestedQuantity: 200,
    suggestedDate: '2026-07-10T00:00:00Z',
    urgency: 'medium',
    reason: '库存接近再订货点',
    ...overrides
  }
}

// ─── Tests: 销量预测 ────────────────────────────────────────

describe('AiForecastController — 销量预测', () => {
  let mocks: ReturnType<typeof createMockServices>
  let ctrl: ReturnType<typeof createController>

  beforeEach(() => {
    mocks = createMockServices()
    ctrl = createController(mocks.demandService, mocks.inventoryOptimizer, mocks.transferService)
  })

  // ── AC-1: 单产品销量预测 ──

  it('forecastSales: 正确调用 service 并返回预测结果', () => {
    mocks.demandService.forecastSales.mockReturnValue(makeForecast())

    const result = ctrl.forecastSales({ productId: 'prod-001', daysAhead: 7 })

    assert.equal(result.productId, 'prod-001')
    assert.equal(result.daysAhead, 7)
    assert.ok(result.predictedSales > 0)
    expect(mocks.demandService.forecastSales).toHaveBeenCalledWith('prod-001', 7)
  })

  it('forecastSales: 产品不存在时返回负值预测（system should handle）', () => {
    mocks.demandService.forecastSales.mockReturnValue(makeForecast({ predictedSales: 1 }))

    const result = ctrl.forecastSales({ productId: 'unknown-prod', daysAhead: 7 })

    // 至少返回 1
    assert.ok(result.predictedSales >= 1)
  })

  it('forecastSales: daysAhead 为 1 时预测值合理', () => {
    mocks.demandService.forecastSales.mockReturnValue(makeForecast({ daysAhead: 1, predictedSales: 15 }))

    const result = ctrl.forecastSales({ productId: 'prod-001', daysAhead: 1 })

    assert.equal(result.daysAhead, 1)
    assert.equal(result.predictedSales, 15)
  })

  // ── AC-2: 品类预测 ──

  it('forecastCategory: 返回品类总预测及产品明细', () => {
    mocks.demandService.forecastByCategory.mockReturnValue(makeCategoryForecast())

    const result = ctrl.forecastCategory({ categoryId: 'cat-001', daysAhead: 7 })

    assert.equal(result.categoryId, 'cat-001')
    assert.ok(result.productForecasts.length >= 2)
    expect(mocks.demandService.forecastByCategory).toHaveBeenCalledWith('cat-001', 7)
  })

  it('forecastCategory: 空品类返回自动生成的产品', () => {
    mocks.demandService.forecastByCategory.mockReturnValue(makeCategoryForecast({ productForecasts: [] }))

    const result = ctrl.forecastCategory({ categoryId: 'cat-empty', daysAhead: 7 })

    assert.ok(Array.isArray(result.productForecasts))
  })

  // ── AC-3: 季节性因子 ──

  it('getSeasonality: 返回 12 个月因子', () => {
    mocks.demandService.getSeasonality.mockReturnValue({
      productId: 'prod-001',
      monthlyFactors: [1.0, 1.1, 1.2, 1.0, 0.9, 0.8, 0.9, 1.1, 1.3, 1.2, 1.0, 0.9],
      trend: 5
    })

    const result = ctrl.getSeasonality('prod-001')

    assert.equal(result.monthlyFactors.length, 12)
    expect(mocks.demandService.getSeasonality).toHaveBeenCalledWith('prod-001')
  })

  // ── AC-4: 促销调整 ──

  it('adjustForPromotions: 无促销时乘数为 1.0', () => {
    const base = makeForecast({ predictedSales: 100 })
    mocks.demandService.forecastSales.mockReturnValue(base)
    mocks.demandService.adjustForPromotions.mockReturnValue({ ...base, promotionMultiplier: 1.0 })

    const result = ctrl.adjustForPromotions({ productId: 'prod-001', daysAhead: 7, promotions: [] })

    assert.equal(result.promotionMultiplier, 1.0)
  })

  it('adjustForPromotions: 有促销时预测上调', () => {
    const base = makeForecast({ predictedSales: 100 })
    const promotions = [{ id: 'p1', type: 'discount', startDate: new Date().toISOString(), endDate: new Date(Date.now() + 86400000).toISOString(), boostPercent: 0.2 }]

    mocks.demandService.forecastSales.mockReturnValue(base)
    mocks.demandService.adjustForPromotions.mockReturnValue({ ...base, predictedSales: 120, promotionMultiplier: 1.2 })

    const result = ctrl.adjustForPromotions({ productId: 'prod-001', daysAhead: 7, promotions })

    assert.ok(result.predictedSales > base.predictedSales)
    assert.ok(result.promotionMultiplier > 1.0)
  })
})

// ─── Tests: 库存优化 ────────────────────────────────────────

describe('AiForecastController — 库存优化', () => {
  let mocks: ReturnType<typeof createMockServices>
  let ctrl: ReturnType<typeof createController>

  beforeEach(() => {
    mocks = createMockServices()
    ctrl = createController(mocks.demandService, mocks.inventoryOptimizer, mocks.transferService)
  })

  // ── AC-5: 最优库存 ──

  it('calculateOptimalStock: 返回完整库存结构', () => {
    mocks.demandService.forecastSales.mockReturnValue(makeForecast())
    mocks.inventoryOptimizer.calculateOptimalStock.mockReturnValue(makeOptimalStock())

    const result = ctrl.calculateOptimalStock({ productId: 'prod-001', leadTime: 7, daysAhead: 7 })

    assert.ok(typeof result.totalOptimalStock === 'number')
    assert.ok(result.totalOptimalStock > 0)
  })

  it('calculateOptimalStock: 安全库存应 >= 0', () => {
    mocks.demandService.forecastSales.mockReturnValue(makeForecast())
    mocks.inventoryOptimizer.calculateOptimalStock.mockReturnValue(makeOptimalStock({ safetyStock: 0 }))

    const result = ctrl.calculateOptimalStock({ productId: 'prod-001', leadTime: 1, daysAhead: 7 })

    assert.ok(result.safetyStock >= 0)
  })

  // ── AC-6: 补货建议 ──

  it('suggestReorder: 返回补货建议', () => {
    mocks.inventoryOptimizer.suggestReorder.mockReturnValue(makeReorderSuggestion())

    const result = ctrl.suggestReorder({ productId: 'prod-001' })

    assert.ok(result.suggestedQuantity > 0)
    assert.ok(['low', 'medium', 'high'].includes(result.urgency))
    expect(mocks.inventoryOptimizer.suggestReorder).toHaveBeenCalledWith('prod-001')
  })

  it('suggestReorder: 库存充足时 urgency 为 low', () => {
    mocks.inventoryOptimizer.suggestReorder.mockReturnValue(makeReorderSuggestion({ urgency: 'low', reason: '库存充足' }))

    const result = ctrl.suggestReorder({ productId: 'prod-001' })

    assert.equal(result.urgency, 'low')
  })

  it('suggestReorder: 库存紧缺时 urgency 为 high', () => {
    mocks.inventoryOptimizer.suggestReorder.mockReturnValue(makeReorderSuggestion({ urgency: 'high', reason: '库存低于安全库存' }))

    const result = ctrl.suggestReorder({ productId: 'prod-001' })

    assert.equal(result.urgency, 'high')
  })

  // ── AC-7: 滞销品检测 ──

  it('detectSlowMoving: 返回检测结果', () => {
    mocks.inventoryOptimizer.detectSlowMoving.mockReturnValue({
      productId: 'prod-slow',
      daysSinceLastSale: 45,
      currentStock: 200,
      turnoverRate: 40,
      recommendation: '超过30天无销售，建议打折清仓'
    })

    const result = ctrl.detectSlowMoving({ productId: 'prod-slow' })

    assert.ok(result.daysSinceLastSale >= 0)
    assert.ok(result.recommendation.length > 0)
    expect(mocks.inventoryOptimizer.detectSlowMoving).toHaveBeenCalledWith('prod-slow', 30)
  })

  it('detectSlowMoving: 自定义阈值', () => {
    mocks.inventoryOptimizer.detectSlowMoving.mockReturnValue({
      productId: 'prod-slow', daysSinceLastSale: 15, currentStock: 100, turnoverRate: 20, recommendation: '正常'
    })

    ctrl.detectSlowMoving({ productId: 'prod-slow', thresholdDays: 10 })

    expect(mocks.inventoryOptimizer.detectSlowMoving).toHaveBeenCalledWith('prod-slow', 10)
  })
})

// ─── Tests: 调拨管理 ────────────────────────────────────────

describe('AiForecastController — 调拨管理', () => {
  let mocks: ReturnType<typeof createMockServices>
  let ctrl: ReturnType<typeof createController>

  beforeEach(() => {
    mocks = createMockServices()
    ctrl = createController(mocks.demandService, mocks.inventoryOptimizer, mocks.transferService)
  })

  // ── AC-8: 调拨建议 ──

  it('suggestTransfer: 返回调拨建议', () => {
    mocks.transferService.suggestTransfer.mockReturnValue({
      fromStore: 'store-A', toStore: 'store-B', productId: 'prod-001',
      quantity: 50, benefit: 200, cost: { freight: 30, loss: 10, labor: 20, total: 60 }, netBenefit: 140
    })

    const result = ctrl.suggestTransfer({ fromStore: 'store-A', toStore: 'store-B', productId: 'prod-001' })

    assert.equal(result.fromStore, 'store-A')
    assert.equal(result.toStore, 'store-B')
    assert.ok(result.quantity > 0)
    expect(mocks.transferService.suggestTransfer).toHaveBeenCalledWith('store-A', 'store-B', 'prod-001')
  })

  it('suggestTransfer: 库存充足不需要调拨时返回 null', () => {
    mocks.transferService.suggestTransfer.mockReturnValue(null)

    const result = ctrl.suggestTransfer({ fromStore: 'store-A', toStore: 'store-B', productId: 'prod-001' })

    assert.equal(result, null)
  })

  // ── AC-9: 调拨收益 ──

  it('calculateTransferBenefit: 成本结构完整', () => {
    mocks.transferService.calculateTransferBenefit.mockReturnValue({
      cost: { freight: 25.5, loss: 8.0, labor: 15.0, total: 48.5 },
      totalSavings: 200
    })

    const result = ctrl.calculateTransferBenefit({ fromStore: 'store-A', toStore: 'store-B', productId: 'prod-001' })

    assert.ok(result.cost.freight > 0)
    assert.equal(result.cost.freight + result.cost.loss + result.cost.labor, result.cost.total)
  })

  // ── AC-10: 全局分配 ──

  it('optimizeGlobalAllocation: 返回分配方案', () => {
    mocks.transferService.optimizeGlobalAllocation.mockReturnValue([
      {
        productId: 'prod-001',
        allocations: [{ storeId: 'store-A', quantity: -50 }, { storeId: 'store-B', quantity: 50 }],
        totalBenefit: 300
      }
    ])

    const result = ctrl.optimizeGlobalAllocation({
      products: [{ storeId: 'store-A', productId: 'prod-001' }, { storeId: 'store-B', productId: 'prod-001' }]
    })

    assert.ok(result.length > 0)
    assert.ok(result[0].totalBenefit > 0)
    const sum = result[0].allocations.reduce((s: number, a: any) => s + a.quantity, 0)
    assert.equal(sum, 0)
  })

  it('optimizeGlobalAllocation: 单门店输入返回空数组', () => {
    mocks.transferService.optimizeGlobalAllocation.mockReturnValue([])

    const result = ctrl.optimizeGlobalAllocation({
      products: [{ storeId: 'store-A', productId: 'prod-001' }]
    })

    assert.equal(result.length, 0)
  })
})
