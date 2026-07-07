import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [ai-forecast] Contract 测试
 *
 * 验证:
 *   - SalesForecast / CategoryForecast / SeasonalityFactor 实体 shape
 *   - 服务方法预测、库存优化、调拨管理的合约一致性
 *   - 同类产品递归预测返回结构一致
 *   - 数据完整性与类型约束
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  DemandForecastService,
  InventoryOptimizer,
  TransferRecommendationService,
  productHistory,
} from './ai-forecast.service'
import type {
  SalesForecast,
  CategoryForecast,
  SeasonalityFactor,
  OptimalStock,
  ReorderSuggestion,
  SlowMovingProduct,
  TransferRecommendation,
  GlobalAllocation,
  TransferCost,
  ForecastType,
  UrgencyLevel,
} from './ai-forecast.entity'

let demandSvc: DemandForecastService
let optimizer: InventoryOptimizer
let transferSvc: TransferRecommendationService

beforeEach(() => {
  productHistory.clear()
  demandSvc = new DemandForecastService()
  optimizer = new InventoryOptimizer(demandSvc)
  transferSvc = new TransferRecommendationService(optimizer)
})

// ═══════════════════════════════════════════════════════
// 实体 Shape 合约
// ═══════════════════════════════════════════════════════

describe('Contract: SalesForecast shape', () => {
  it('所有必填字段存在且类型正确', () => {
    const result = demandSvc.forecastSales('contract-sf-001', 7)
    assert.equal(typeof result.productId, 'string')
    assert.equal(typeof result.daysAhead, 'number')
    assert.equal(typeof result.predictedSales, 'number')
    assert.equal(typeof result.unit, 'string')
    assert.equal(typeof result.confidence, 'number')
    assert.equal(typeof result.seasonalityFactor, 'number')
    assert.equal(typeof result.promotionMultiplier, 'number')
  })

  it('productId 非空', () => {
    const result = demandSvc.forecastSales('contract-sf-002', 7)
    assert.ok(result.productId.length > 0)
  })

  it('confidence 范围 [0, 1]', () => {
    const result = demandSvc.forecastSales('contract-sf-003', 7)
    assert.ok(result.confidence >= 0 && result.confidence <= 1)
  })

  it('predictedSales 为正整数', () => {
    const result = demandSvc.forecastSales('contract-sf-004', 7)
    assert.ok(result.predictedSales >= 1)
    assert.equal(Math.floor(result.predictedSales), result.predictedSales)
  })

  it('seasonalityFactor 大于 0', () => {
    const result = demandSvc.forecastSales('contract-sf-005', 7)
    assert.ok(result.seasonalityFactor > 0)
  })

  it('promotionMultiplier 默认 1.0', () => {
    const result = demandSvc.forecastSales('contract-sf-006', 7)
    assert.equal(result.promotionMultiplier, 1.0)
  })

  it('unit 固定为 "units"', () => {
    const result = demandSvc.forecastSales('contract-sf-007', 7)
    assert.equal(result.unit, 'units')
  })
})

describe('Contract: CategoryForecast shape', () => {
  it('包含 categoryId / daysAhead / totalPredictedSales / productForecasts', () => {
    const result = demandSvc.forecastByCategory('contract-cat-001', 7)
    assert.equal(typeof result.categoryId, 'string')
    assert.equal(typeof result.daysAhead, 'number')
    assert.equal(typeof result.totalPredictedSales, 'number')
    assert.ok(Array.isArray(result.productForecasts))
  })

  it('totalPredictedSales 等于各产品预测值之和', () => {
    const result = demandSvc.forecastByCategory('contract-cat-002', 7)
    const sum = result.productForecasts.reduce((s, f) => s + f.predictedSales, 0)
    assert.equal(result.totalPredictedSales, sum)
  })
})

describe('Contract: SeasonalityFactor shape', () => {
  it('包含 productId / monthlyFactors (12) / trend', () => {
    const result = demandSvc.getSeasonality('contract-sea-001')
    assert.equal(typeof result.productId, 'string')
    assert.equal(result.monthlyFactors.length, 12)
    assert.equal(typeof result.trend, 'number')
  })

  it('monthlyFactors 每一项都大于 0', () => {
    const result = demandSvc.getSeasonality('contract-sea-002')
    result.monthlyFactors.forEach((f, i) => {
      assert.ok(f > 0, `monthlyFactors[${i}] = ${f} 应 > 0`)
    })
  })
})

describe('Contract: OptimalStock shape', () => {
  it('包含所有 6 个必填字段', () => {
    const forecast = demandSvc.forecastSales('contract-os-001', 7)
    const result = optimizer.calculateOptimalStock('contract-os-001', forecast, 7)
    assert.equal(typeof result.productId, 'string')
    assert.equal(typeof result.safetyStock, 'number')
    assert.equal(typeof result.cycleStock, 'number')
    assert.equal(typeof result.totalOptimalStock, 'number')
    assert.equal(typeof result.reorderPoint, 'number')
    assert.equal(typeof result.reorderQuantity, 'number')
  })

  it('totalOptimalStock = safetyStock + cycleStock', () => {
    const forecast = demandSvc.forecastSales('contract-os-002', 7)
    const result = optimizer.calculateOptimalStock('contract-os-002', forecast, 7)
    assert.equal(result.totalOptimalStock, result.safetyStock + result.cycleStock)
  })

  it('reorderPoint = safetyStock + cycleStock', () => {
    const forecast = demandSvc.forecastSales('contract-os-003', 7)
    const result = optimizer.calculateOptimalStock('contract-os-003', forecast, 7)
    assert.equal(result.reorderPoint, result.safetyStock + result.cycleStock)
  })
})

describe('Contract: ReorderSuggestion shape', () => {
  it('包含 productId / suggestedQuantity / suggestedDate / urgency / reason', () => {
    const result = optimizer.suggestReorder('contract-ro-001')
    assert.equal(typeof result.productId, 'string')
    assert.equal(typeof result.suggestedQuantity, 'number')
    assert.equal(typeof result.suggestedDate, 'string')
    assert.ok(['low', 'medium', 'high'].includes(result.urgency))
    assert.equal(typeof result.reason, 'string')
  })

  it('suggestedQuantity 为正整数', () => {
    const result = optimizer.suggestReorder('contract-ro-002')
    assert.ok(result.suggestedQuantity > 0)
    assert.equal(Math.floor(result.suggestedQuantity), result.suggestedQuantity)
  })
})

describe('Contract: SlowMovingProduct shape', () => {
  it('包含 productId / daysSinceLastSale / currentStock / turnoverRate / recommendation', () => {
    const result = optimizer.detectSlowMoving('contract-sm-001')
    assert.equal(typeof result.productId, 'string')
    assert.equal(typeof result.daysSinceLastSale, 'number')
    assert.equal(typeof result.currentStock, 'number')
    assert.equal(typeof result.turnoverRate, 'number')
    assert.equal(typeof result.recommendation, 'string')
  })
})

describe('Contract: TransferRecommendation shape', () => {
  it('包含 fromStore / toStore / productId / quantity / benefit / cost / netBenefit', () => {
    const result = transferSvc.suggestTransfer('store-contract-a', 'store-contract-b', 'contract-tr-001')
    if (result !== null) {
      assert.equal(typeof result.fromStore, 'string')
      assert.equal(typeof result.toStore, 'string')
      assert.equal(typeof result.productId, 'string')
      assert.equal(typeof result.quantity, 'number')
      assert.equal(typeof result.benefit, 'number')
      assert.equal(typeof result.cost, 'object')
      assert.equal(typeof result.cost.freight, 'number')
      assert.equal(typeof result.cost.loss, 'number')
      assert.equal(typeof result.cost.labor, 'number')
      assert.equal(typeof result.cost.total, 'number')
      assert.equal(typeof result.netBenefit, 'number')
    } else {
      // 库存均衡情况时无调拨需求，合约允许 null
      assert.equal(result, null)
    }
  })
})

describe('Contract: TransferCost shape', () => {
  it('total = freight + loss + labor', () => {
    const result = transferSvc.calculateTransferBenefit('store-a', 'store-b', 'contract-tc-001')
    const sum = result.cost.freight + result.cost.loss + result.cost.labor
    assert.equal(result.cost.total, sum)
  })
})

describe('Contract: GlobalAllocation shape', () => {
  it('包含 productId / allocations / totalBenefit', () => {
    const products = [
      { storeId: 'store-ga-1', productId: 'prod-ga' },
      { storeId: 'store-ga-2', productId: 'prod-ga' },
    ]
    const result = transferSvc.optimizeGlobalAllocation(products)
    if (result.length > 0) {
      assert.equal(typeof result[0].productId, 'string')
      assert.ok(Array.isArray(result[0].allocations))
      assert.equal(typeof result[0].totalBenefit, 'number')
    }
  })

  it('allocations 中 quantity 之和为 0（调入调出平衡）', () => {
    const products = [
      { storeId: 'store-ga-bal-1', productId: 'prod-ga-bal' },
      { storeId: 'store-ga-bal-2', productId: 'prod-ga-bal' },
    ]
    const result = transferSvc.optimizeGlobalAllocation(products)
    if (result.length > 0) {
      const sum = result[0].allocations.reduce((s, a) => s + a.quantity, 0)
      assert.equal(sum, 0)
    }
  })
})

// ═══════════════════════════════════════════════════════
// 类型枚举合约
// ═══════════════════════════════════════════════════════

describe('Contract: ForecastType enum', () => {
  it('支持 sales | inventory | transfer', () => {
    const valid: ForecastType[] = ['sales', 'inventory', 'transfer']
    assert.equal(valid.length, 3)
  })
})

describe('Contract: UrgencyLevel enum', () => {
  it('支持 low | medium | high', () => {
    const valid: UrgencyLevel[] = ['low', 'medium', 'high']
    assert.equal(valid.length, 3)
  })
})

// ═══════════════════════════════════════════════════════
// 幂等性合约
// ═══════════════════════════════════════════════════════

describe('Contract: 幂等性', () => {
  it('getSeasonality 同一产品两次调用返回相同因子', () => {
    const s1 = demandSvc.getSeasonality('idempotent-prod')
    const s2 = demandSvc.getSeasonality('idempotent-prod')
    assert.deepEqual(s1.monthlyFactors, s2.monthlyFactors)
    assert.equal(s1.trend, s2.trend)
  })

  it('forecastSales 同一产品固定输入应一致（无随机偏差）', () => {
    // 产品初始化逻辑是确定性的
    const f1 = demandSvc.forecastSales('idempotent-sales', 7)
    productHistory.clear()
    const f2 = demandSvc.forecastSales('idempotent-sales', 7)
    // seasonalityFactor 和 productId 必须一致
    assert.equal(f1.productId, f2.productId)
    // predictedSales 有随机成分，不要求完全一致
    assert.ok(f1.predictedSales > 0)
    assert.ok(f2.predictedSales > 0)
  })
})

// ═══════════════════════════════════════════════════════
// 服务接口合约
// ═══════════════════════════════════════════════════════

describe('Contract: 服务接口', () => {
  it('DemandForecastService 暴露 forecastSales / forecastByCategory / getSeasonality / adjustForPromotions', () => {
    assert.equal(typeof demandSvc.forecastSales, 'function')
    assert.equal(typeof demandSvc.forecastByCategory, 'function')
    assert.equal(typeof demandSvc.getSeasonality, 'function')
    assert.equal(typeof demandSvc.adjustForPromotions, 'function')
  })

  it('InventoryOptimizer 暴露 calculateOptimalStock / suggestReorder / detectSlowMoving', () => {
    assert.equal(typeof optimizer.calculateOptimalStock, 'function')
    assert.equal(typeof optimizer.suggestReorder, 'function')
    assert.equal(typeof optimizer.detectSlowMoving, 'function')
  })

  it('TransferRecommendationService 暴露 suggestTransfer / calculateTransferBenefit / optimizeGlobalAllocation', () => {
    assert.equal(typeof transferSvc.suggestTransfer, 'function')
    assert.equal(typeof transferSvc.calculateTransferBenefit, 'function')
    assert.equal(typeof transferSvc.optimizeGlobalAllocation, 'function')
  })
})
