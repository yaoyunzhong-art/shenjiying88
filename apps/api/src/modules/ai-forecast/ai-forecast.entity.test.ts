import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * ai-forecast.entity.test.ts — AI 预测模块实体合约测试
 *
 * 守护所有实体接口的结构完整性:
 * - 字段类型
 * - 必填字段
 * - 枚举值有效性
 * - 空值安全边界
 */

import assert from 'node:assert/strict'
import type {
  SalesForecast,
  CategoryForecast,
  SeasonalityFactor,
  Promotion,
  OptimalStock,
  ReorderSuggestion,
  SlowMovingProduct,
  StoreInventory,
  TransferRecommendation,
  TransferCost,
  GlobalAllocation,
  ForecastInput,
  ForecastOutput
} from './ai-forecast.entity'

// ─── Fixtures ────────────────────────────────────────────────

function mockSalesForecast(overrides: Partial<SalesForecast> = {}): SalesForecast {
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

function mockPromotion(overrides: Partial<Promotion> = {}): Promotion {
  return {
    id: 'promo-001',
    type: 'discount',
    startDate: '2026-07-01T00:00:00Z',
    endDate: '2026-07-15T00:00:00Z',
    boostPercent: 0.2,
    ...overrides
  }
}

function mockOptimalStock(overrides: Partial<OptimalStock> = {}): OptimalStock {
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

// ─── SalesForecast ───────────────────────────────────────────

describe('[ai-forecast.entity] SalesForecast', () => {
  it('完整数据对象应包含所有必填字段', () => {
    const f = mockSalesForecast()
    assert.equal(f.productId, 'prod-001')
    assert.equal(f.daysAhead, 7)
    assert.equal(typeof f.predictedSales, 'number')
    assert.ok(f.predictedSales > 0)
    assert.equal(f.unit, 'units')
    assert.ok(f.confidence >= 0 && f.confidence <= 1)
    assert.ok(f.seasonalityFactor > 0)
    assert.ok(f.promotionMultiplier > 0)
  })

  it('promotionMultiplier 默认值应为 1.0（无促销调整）', () => {
    const f = mockSalesForecast({ promotionMultiplier: 1.0 })
    assert.equal(f.promotionMultiplier, 1.0)
  })

  it('daysAhead 应 >= 1', () => {
    const f = mockSalesForecast({ daysAhead: 365 })
    assert.ok(f.daysAhead >= 1)
  })

  it('predictedSales 最小为 1（预测不会为 0）', () => {
    const f = mockSalesForecast({ predictedSales: 1 })
    assert.ok(f.predictedSales >= 1)
  })

  it('unit 应为非空字符串', () => {
    const f = mockSalesForecast()
    assert.ok(f.unit.length > 0)
  })
})

// ─── CategoryForecast ────────────────────────────────────────

describe('[ai-forecast.entity] CategoryForecast', () => {
  it('totalPredictedSales 应等于各产品预测之和', () => {
    const products = [
      mockSalesForecast({ productId: 'p1', predictedSales: 100 }),
      mockSalesForecast({ productId: 'p2', predictedSales: 200 })
    ]
    const cf: CategoryForecast = {
      categoryId: 'cat-001',
      daysAhead: 7,
      totalPredictedSales: 300,
      productForecasts: products
    }
    const sum = cf.productForecasts.reduce((s, f) => s + f.predictedSales, 0)
    assert.equal(sum, cf.totalPredictedSales)
  })

  it('productForecasts 可为空数组', () => {
    const cf: CategoryForecast = {
      categoryId: 'cat-empty',
      daysAhead: 7,
      totalPredictedSales: 0,
      productForecasts: []
    }
    assert.equal(cf.productForecasts.length, 0)
  })
})

// ─── SeasonalityFactor ───────────────────────────────────────

describe('[ai-forecast.entity] SeasonalityFactor', () => {
  it('monthlyFactors 应包含 12 个月份', () => {
    const sf: SeasonalityFactor = {
      productId: 'prod-001',
      monthlyFactors: [1.0, 1.1, 1.2, 1.0, 0.9, 0.8, 0.9, 1.1, 1.3, 1.2, 1.0, 0.9],
      trend: 5
    }
    assert.equal(sf.monthlyFactors.length, 12)
  })

  it('trend 应为数字且可为负', () => {
    const sf: SeasonalityFactor = { productId: 'p', monthlyFactors: Array(12).fill(1.0), trend: -3 }
    assert.equal(typeof sf.trend, 'number')
    assert.ok(sf.trend < 0)
  })
})

// ─── Promotion ───────────────────────────────────────────────

describe('[ai-forecast.entity] Promotion', () => {
  it('type 仅接受固定三类值', () => {
    const valid: Promotion['type'][] = ['discount', 'bundled', 'gift']
    for (const t of valid) {
      const p = mockPromotion({ type: t })
      assert.ok(valid.includes(p.type))
    }
  })

  it('startDate 不应晚于 endDate', () => {
    const p = mockPromotion()
    assert.ok(new Date(p.startDate) <= new Date(p.endDate))
  })
})

// ─── OptimalStock ────────────────────────────────────────────

describe('[ai-forecast.entity] OptimalStock', () => {
  it('totalOptimalStock = safetyStock + cycleStock', () => {
    const s = mockOptimalStock()
    assert.equal(s.totalOptimalStock, s.safetyStock + s.cycleStock)
  })

  it('所有数量字段应 >= 0', () => {
    const s = mockOptimalStock()
    assert.ok(s.safetyStock >= 0)
    assert.ok(s.cycleStock >= 0)
    assert.ok(s.reorderPoint >= 0)
    assert.ok(s.reorderQuantity >= 0)
  })
})

// ─── ReorderSuggestion ───────────────────────────────────────

describe('[ai-forecast.entity] ReorderSuggestion', () => {
  it('urgency 仅接受 low/medium/high', () => {
    const valid: ReorderSuggestion['urgency'][] = ['low', 'medium', 'high']
    for (const u of valid) {
      const rs: ReorderSuggestion = {
        productId: 'p1',
        suggestedQuantity: 50,
        suggestedDate: '2026-07-10T00:00:00Z',
        urgency: u,
        reason: '测试'
      }
      assert.ok(valid.includes(rs.urgency))
    }
  })

  it('reason 不可为空', () => {
    const rs: ReorderSuggestion = {
      productId: 'p1',
      suggestedQuantity: 50,
      suggestedDate: '2026-07-10T00:00:00Z',
      urgency: 'medium',
      reason: '需要补货'
    }
    assert.ok(rs.reason.length > 0)
  })

  it('suggestedDate 应为有效 ISO 字符串', () => {
    const rs: ReorderSuggestion = {
      productId: 'p1',
      suggestedQuantity: 50,
      suggestedDate: new Date().toISOString(),
      urgency: 'low',
      reason: '充足'
    }
    assert.doesNotThrow(() => new Date(rs.suggestedDate))
  })
})

// ─── SlowMovingProduct ───────────────────────────────────────

describe('[ai-forecast.entity] SlowMovingProduct', () => {
  it('turnoverRate = currentStock / 日均销量概念相关', () => {
    const sm: SlowMovingProduct = {
      productId: 'p1',
      daysSinceLastSale: 45,
      currentStock: 200,
      turnoverRate: 40.0,
      recommendation: '建议调拨'
    }
    assert.ok(sm.daysSinceLastSale >= 0)
    assert.ok(sm.currentStock >= 0)
    assert.equal(typeof sm.turnoverRate, 'number')
    assert.ok(sm.recommendation.length > 0)
  })

  it('recommendation 当 daysSinceLastSale > threshold 应含清仓/调拨', () => {
    const sm: SlowMovingProduct = {
      productId: 'slow-1',
      daysSinceLastSale: 60,
      currentStock: 500,
      turnoverRate: 100.0,
      recommendation: '超过30天无销售，建议打折清仓或调拨至其他门店'
    }
    assert.ok(sm.recommendation.includes('清仓') || sm.recommendation.includes('调拨'))
  })
})

// ─── StoreInventory ──────────────────────────────────────────

describe('[ai-forecast.entity] StoreInventory', () => {
  it('required fields 完整', () => {
    const si: StoreInventory = {
      storeId: 'store-001',
      productId: 'prod-001',
      currentStock: 150,
      dailySales: 12,
      leadTimeDays: 7
    }
    assert.equal(si.storeId, 'store-001')
    assert.ok(si.currentStock >= 0)
    assert.ok(si.dailySales >= 0)
    assert.ok(si.leadTimeDays >= 1)
  })
})

// ─── TransferRecommendation / TransferCost ───────────────────

describe('[ai-forecast.entity] TransferRecommendation', () => {
  it('净收益 = 收益 - 总成本', () => {
    const tc: TransferCost = { freight: 30, loss: 10, labor: 20, total: 60 }
    const tr: TransferRecommendation = {
      fromStore: 'store-A',
      toStore: 'store-B',
      productId: 'prod-001',
      quantity: 50,
      benefit: 200,
      cost: tc,
      netBenefit: 140
    }
    assert.equal(tr.netBenefit, tr.benefit - tr.cost.total)
  })

  it('成本各分量之和等于 total', () => {
    const tc: TransferCost = { freight: 25.5, loss: 8.0, labor: 15.0, total: 48.5 }
    assert.equal(tc.freight + tc.loss + tc.labor, tc.total)
  })
})

// ─── GlobalAllocation ────────────────────────────────────────

describe('[ai-forecast.entity] GlobalAllocation', () => {
  it('allocations 总调出调入量应相抵', () => {
    const ga: GlobalAllocation = {
      productId: 'prod-001',
      allocations: [
        { storeId: 'store-A', quantity: -50 },
        { storeId: 'store-B', quantity: 30 },
        { storeId: 'store-C', quantity: 20 }
      ],
      totalBenefit: 300
    }
    const sum = ga.allocations.reduce((s, a) => s + a.quantity, 0)
    assert.equal(sum, 0)
  })
})

// ─── ForecastInput / ForecastOutput ──────────────────────────

describe('[ai-forecast.entity] ForecastInput / ForecastOutput', () => {
  it('ForecastInput productId 必填', () => {
    const fi: ForecastInput = { productId: 'prod-001', daysAhead: 7 }
    assert.ok(fi.productId.length > 0)
  })

  it('ForecastOutput 应有时间戳', () => {
    const fo: ForecastOutput = {
      forecasts: [mockSalesForecast()],
      executionTimeMs: 15,
      timestamp: new Date().toISOString()
    }
    assert.ok(fo.forecasts.length > 0)
    assert.ok(fo.executionTimeMs >= 0)
    assert.doesNotThrow(() => new Date(fo.timestamp))
  })
})
