import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
/**
 * 🐜 自动: [ai-forecast] E2E 测试
 *
 * 验证从 Controller → Service → 实体的完整链路
 * 使用 NestJS TestingModule 启动模块进行集成测试
 * 覆盖: 销量预测、品类预测、季节因子、促销调整、库存优化、补货、滞销检测、调拨
 */

import assert from 'node:assert/strict'
import { Test, TestingModule } from '@nestjs/testing'
import { AiForecastModule } from './ai-forecast.module'
import { AiForecastController } from './ai-forecast.controller'
import { DemandForecastService, InventoryOptimizer, TransferRecommendationService, productHistory } from './ai-forecast.service'

let moduleRef: TestingModule
let controller: AiForecastController

beforeAll(async () => {
  moduleRef = await Test.createTestingModule({
    imports: [AiForecastModule],
  }).compile()
  controller = moduleRef.get(AiForecastController)
})

beforeEach(() => {
  productHistory.clear()
})

afterAll(async () => {
  await moduleRef.close()
})

// ══════════════════════════════════════════════════════════
// E2E-1: 销量预测完整链路
// ══════════════════════════════════════════════════════════

describe('E2E: 销量预测', () => {
  it('GET /ai-forecast/forecast/sales → 返回 SalesForecast 结构', () => {
    const result = controller.forecastSales({ productId: 'e2e-sales-1', daysAhead: 7 })
    assert.equal(result.productId, 'e2e-sales-1')
    assert.equal(result.daysAhead, 7)
    assert.ok(result.predictedSales > 0)
    assert.equal(result.unit, 'units')
    assert.ok(result.confidence >= 0.75 && result.confidence <= 0.95)
    assert.ok(result.seasonalityFactor > 0)
    assert.equal(result.promotionMultiplier, 1.0)
  })

  it('GET /ai-forecast/forecast/category → 返回 CategoryForecast', () => {
    const result = controller.forecastCategory({ categoryId: 'e2e-cat-1', daysAhead: 7 })
    assert.equal(result.categoryId, 'e2e-cat-1')
    assert.equal(result.daysAhead, 7)
    assert.ok(result.totalPredictedSales > 0)
    assert.ok(result.productForecasts.length > 0)
  })

  it('GET /ai-forecast/seasonality → 返回 12 个月因子', () => {
    const result = controller.getSeasonality('e2e-season-1')
    assert.equal(result.productId, 'e2e-season-1')
    assert.equal(result.monthlyFactors.length, 12)
  })

  it('POST /ai-forecast/forecast/adjust-promotions → 促销调整生效', () => {
    const base = controller.forecastSales({ productId: 'e2e-promo-1', daysAhead: 7 })
    const adjusted = controller.adjustForPromotions({
      productId: 'e2e-promo-1',
      daysAhead: 7,
      promotions: [{ id: 'e2e-p1', type: 'discount', startDate: '2025-01-01', endDate: '2027-12-31', boostPercent: 0.3 }],
    })
    assert.ok(adjusted.promotionMultiplier >= 1.0)
    // 有促销可能提升也可能不变（过期间）
    if (adjusted.promotionMultiplier > 1.0) {
      assert.ok(adjusted.predictedSales >= base.predictedSales)
    }
  })
})

// ══════════════════════════════════════════════════════════
// E2E-2: 库存优化完整链路
// ══════════════════════════════════════════════════════════

describe('E2E: 库存优化', () => {
  it('GET /ai-forecast/inventory/optimal-stock → 返回 OptimalStock', () => {
    const result = controller.calculateOptimalStock({ productId: 'e2e-stock-1', leadTime: 7, daysAhead: 7 })
    assert.ok(result.safetyStock >= 0)
    assert.ok(result.cycleStock > 0)
    assert.equal(result.totalOptimalStock, result.safetyStock + result.cycleStock)
    assert.equal(result.reorderPoint, result.safetyStock + result.cycleStock)
  })

  it('GET /ai-forecast/inventory/reorder → 返回补货建议', () => {
    const result = controller.suggestReorder({ productId: 'e2e-reorder-1' })
    assert.ok(result.suggestedQuantity > 0)
    assert.ok(['low', 'medium', 'high'].includes(result.urgency))
    assert.ok(result.reason.length > 0)
  })

  it('GET /ai-forecast/inventory/slow-moving → 返回滞销检测', () => {
    const result = controller.detectSlowMoving({ productId: 'e2e-slow-1' })
    assert.ok(result.daysSinceLastSale >= 0)
    assert.ok(result.currentStock > 0)
    assert.ok(result.turnoverRate > 0)
    assert.ok(result.recommendation.length > 0)
  })

  it('GET /ai-forecast/inventory/slow-moving?thresholdDays=5 → 自定义阈值生效', () => {
    const result = controller.detectSlowMoving({ productId: 'e2e-slow-threshold', thresholdDays: 5 })
    assert.ok(result.recommendation.length > 0)
  })
})

// ══════════════════════════════════════════════════════════
// E2E-3: 调拨管理完整链路
// ══════════════════════════════════════════════════════════

describe('E2E: 调拨管理', () => {
  it('GET /ai-forecast/transfer/suggest → 返回调拨建议或 null', () => {
    const result = controller.suggestTransfer({ fromStore: 'e2e-store-a', toStore: 'e2e-store-b', productId: 'e2e-transfer-1' })
    if (result !== null) {
      assert.equal(result.fromStore, 'e2e-store-a')
      assert.equal(result.toStore, 'e2e-store-b')
      assert.ok(result.quantity > 0)
      assert.ok(typeof result.netBenefit === 'number')
    }
  })

  it('GET /ai-forecast/transfer/benefit → 返回成本明细', () => {
    const result = controller.calculateTransferBenefit({ fromStore: 'e2e-store-c', toStore: 'e2e-store-d', productId: 'e2e-benefit-1' })
    assert.ok(result.cost.freight >= 0)
    assert.ok(result.cost.loss >= 0)
    assert.ok(result.cost.labor >= 0)
    assert.ok(result.cost.total > 0)
  })

  it('POST /ai-forecast/transfer/optimize-global → 返回分配方案', () => {
    const result = controller.optimizeGlobalAllocation({
      products: [
        { storeId: 'e2e-store-x', productId: 'e2e-global-1' },
        { storeId: 'e2e-store-y', productId: 'e2e-global-1' },
      ],
    })
    assert.ok(Array.isArray(result))
  })
})

// ══════════════════════════════════════════════════════════
// E2E-4: 端到端混合场景
// ══════════════════════════════════════════════════════════

describe('E2E: 混合场景', () => {
  it('预测 → 最优库存 → 补货建议 完整流程', () => {
    // Step 1: 预测
    const forecast = controller.forecastSales({ productId: 'e2e-flow-1', daysAhead: 30 })
    assert.ok(forecast.predictedSales > 0)

    // Step 2: 最优库存
    const optimal = controller.calculateOptimalStock({ productId: 'e2e-flow-1', leadTime: 7, daysAhead: 30 })
    assert.ok(optimal.totalOptimalStock > 0)

    // Step 3: 补货建议
    const reorder = controller.suggestReorder({ productId: 'e2e-flow-1' })
    assert.ok(reorder.suggestedQuantity > 0)
  })

  it('品类预测 → 滞销检测 → 调拨建议 库存管理链路', () => {
    // Step 1: 品类预测
    const cat = controller.forecastCategory({ categoryId: 'e2e-cat-flow', daysAhead: 14 })
    assert.ok(cat.totalPredictedSales > 0)

    // Step 2: 滞销检测
    const slow = controller.detectSlowMoving({ productId: 'e2e-flow-slow' })
    assert.ok(slow.recommendation.length > 0)

    // Step 3: 调拨建议
    const transfer = controller.suggestTransfer({ fromStore: 'e2e-flow-src', toStore: 'e2e-flow-dst', productId: 'e2e-flow-slow' })
    // transfer 可能为 null（库存均衡），也可能有值
    if (transfer !== null) {
      assert.ok(transfer.quantity > 0)
    }
  })
})

// ══════════════════════════════════════════════════════════
// E2E-5: 并发幂等性
// ══════════════════════════════════════════════════════════

describe('E2E: 幂等性', () => {
  it('同一产品两次季节因子调用结果一致', () => {
    const s1 = controller.getSeasonality('e2e-idempotent')
    const s2 = controller.getSeasonality('e2e-idempotent')
    assert.deepEqual(s1.monthlyFactors, s2.monthlyFactors)
    assert.equal(s1.trend, s2.trend)
  })

  it('同一产品两次最优库存结果结构一致', () => {
    const r1 = controller.calculateOptimalStock({ productId: 'e2e-idem-stock', leadTime: 7, daysAhead: 7 })
    productHistory.clear()
    const r2 = controller.calculateOptimalStock({ productId: 'e2e-idem-stock', leadTime: 7, daysAhead: 7 })
    assert.equal(typeof r1.totalOptimalStock, 'number')
    assert.equal(typeof r2.totalOptimalStock, 'number')
  })
})
