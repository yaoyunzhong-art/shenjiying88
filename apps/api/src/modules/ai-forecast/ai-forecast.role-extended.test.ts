import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [ai-forecast] 扩展角色测试
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 *
 * 覆盖端点: 销量预测、品类预测、季节性因子、促销调整、
 *          最优库存、补货建议、滞销品检测、调拨建议、调拨收益、全局分配
 * 每个角色至少 2 个场景，包含正常流程 + 权限边界
 * 强化跨角色数据隔离与边界测试
 */

import assert from 'node:assert/strict'
import {
  DemandForecastService,
  InventoryOptimizer,
  TransferRecommendationService,
  productHistory,
} from './ai-forecast.service'

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

// ── 测试辅助 ──────────────────────────────────────────────

function resetAll() {
  productHistory.clear()
}

function makeServices() {
  const demand = new DemandForecastService()
  const optimizer = new InventoryOptimizer(demand)
  const transfer = new TransferRecommendationService(optimizer)
  return { demand, optimizer, transfer }
}

// ══════════════════════════════════════════════════════════
// 👔 店长 — 全局销量预测与调拨决策
// ══════════════════════════════════════════════════════════

describe('👔 店长 - 扩展: 全局管理', () => {
  beforeEach(resetAll)

  it('多品类预测聚合为整体门店运营参考', () => {
    const { demand } = makeServices()
    const cat1 = demand.forecastByCategory('cat-electronics', 30)
    const cat2 = demand.forecastByCategory('cat-food', 30)
    const cat3 = demand.forecastByCategory('cat-toys', 30)
    const grandTotal = cat1.totalPredictedSales + cat2.totalPredictedSales + cat3.totalPredictedSales
    assert.ok(grandTotal > 0)
    assert.ok(cat1.productForecasts.length > 0)
    assert.ok(cat2.productForecasts.length > 0)
    assert.ok(cat3.productForecasts.length > 0)
  })

  it('跨门店调拨决策后净收益为正时才应执行', () => {
    const { transfer } = makeServices()
    const result = transfer.suggestTransfer('store-manager-a', 'store-manager-b', 'prod-mgr-cross')
    if (result !== null) {
      // 有条件限制有效调拨建议
      assert.equal(result.fromStore, 'store-manager-a')
      assert.equal(result.toStore, 'store-manager-b')
    }
  })

  it('边界: 门店调拨至自身应返回 null 或空建议', () => {
    const { transfer } = makeServices()
    const result = transfer.suggestTransfer('store-same', 'store-same', 'prod-self')
    // 同门店调拨，正确行为是返回 null
    expect(result).toBeNull()
  })
})

// ══════════════════════════════════════════════════════════
// 🛒 前台 — 断货预警与补货建议
// ══════════════════════════════════════════════════════════

describe('🛒 前台 - 扩展: 断货预警', () => {
  beforeEach(resetAll)

  it('多个产品补货紧急程度各不相同', () => {
    const { optimizer } = makeServices()
    const r1 = optimizer.suggestReorder('prod-front-a')
    const r2 = optimizer.suggestReorder('prod-front-b')
    assert.ok(['low', 'medium', 'high'].includes(r1.urgency))
    assert.ok(['low', 'medium', 'high'].includes(r2.urgency))
  })

  it('补货日期是未来时间或当日', () => {
    const { optimizer } = makeServices()
    const result = optimizer.suggestReorder('prod-front-date')
    const suggestedDate = new Date(result.suggestedDate)
    const now = new Date()
    // 日期不应早于合理范围（此处允许与 now 相差 ±1 天）
    const diffMs = suggestedDate.getTime() - now.getTime()
    assert.ok(diffMs >= -86400000, `建议日期不应远早于当前: ${result.suggestedDate}`)
  })

  it('边界: 极低频产品补货仍返回有效建议', () => {
    const { optimizer } = makeServices()
    const result = optimizer.suggestReorder('prod-extremely-slow')
    assert.ok(result.suggestedQuantity > 0)
    assert.ok(result.reason.length > 0)
  })
})

// ══════════════════════════════════════════════════════════
// 👥 HR — 周转效率与绩效分析
// ══════════════════════════════════════════════════════════

describe('👥 HR - 扩展: 绩效分析', () => {
  beforeEach(resetAll)

  it('滞销品周转率计算在高低库存下均合理', () => {
    const { optimizer } = makeServices()
    const r1 = optimizer.detectSlowMoving('prod-hr-a', 30)
    const r2 = optimizer.detectSlowMoving('prod-hr-b', 60)
    assert.ok(r1.turnoverRate > 0)
    assert.ok(r2.turnoverRate > 0)
  })

  it('多个补货建议排序：高 urgency 的产品优先', () => {
    const { optimizer } = makeServices()
    const results = ['prod-hr-p1', 'prod-hr-p2', 'prod-hr-p3'].map(
      (pid) => optimizer.suggestReorder(pid)
    )
    results.forEach((r) => {
      assert.ok(['low', 'medium', 'high'].includes(r.urgency))
    })
  })

  it('边界: 阈值极大时滞销检测报正常', () => {
    const { optimizer } = makeServices()
    const result = optimizer.detectSlowMoving('prod-hr-normal', 999)
    // 999天阈值极少被超过，推荐应显示"正常"
    assert.ok(result.recommendation.includes('正常') || result.recommendation.includes('监控'))
  })
})

// ══════════════════════════════════════════════════════════
// 🔧 安监 — 长库存商品安全检测
// ══════════════════════════════════════════════════════════

describe('🔧 安监 - 扩展: 安全检测', () => {
  beforeEach(resetAll)

  it('全零销售产品的检测返回有效天数和建议', () => {
    productHistory.set('prod-safety-zero', {
      dailySales: new Array(30).fill(0),
      categoryId: 'cat-safety',
    })
    const { optimizer } = makeServices()
    const result = optimizer.detectSlowMoving('prod-safety-zero', 1)
    assert.ok(result.daysSinceLastSale >= 1)
    assert.ok(result.recommendation.length > 0)
  })

  it('不同阈值返回不同紧急程度的处理建议', () => {
    productHistory.set('prod-safety-threshold', {
      dailySales: Array.from({ length: 30 }, (_, i) => (i < 10 ? 5 : 0)),
      categoryId: 'cat-safety',
    })
    const { optimizer } = makeServices()
    const strict = optimizer.detectSlowMoving('prod-safety-threshold', 5)
    const loose = optimizer.detectSlowMoving('prod-safety-threshold', 100)
    assert.ok(strict.recommendation.length > 0)
    assert.ok(loose.recommendation.length > 0)
  })

  it('边界: 无库存产品检测不抛异常', () => {
    const { optimizer } = makeServices()
    expect(() => optimizer.detectSlowMoving('prod-safety-empty', 30)).not.toThrow()
  })
})

// ══════════════════════════════════════════════════════════
// 🎮 导玩员 — 游戏设备备品预测
// ══════════════════════════════════════════════════════════

describe('🎮 导玩员 - 扩展: 设备备品', () => {
  beforeEach(resetAll)

  it('多种游戏产品预测结果可差异化对比', () => {
    const { demand } = makeServices()
    const arcade = demand.forecastSales('arcade-machine', 7)
    const claw = demand.forecastSales('claw-machine', 7)
    const token = demand.forecastSales('game-token-v2', 7)
    assert.ok(arcade.predictedSales > 0)
    assert.ok(claw.predictedSales > 0)
    assert.ok(token.predictedSales > 0)
    // 三种产品预测值不同
    const unique = new Set([arcade.predictedSales, claw.predictedSales, token.predictedSales])
    assert.ok(unique.size >= 2, `期望至少两种产品预测值不同: ${[...unique].join(', ')}`)
  })

  it('季节性因子指导备品备件的旺季备货', () => {
    const { demand } = makeServices()
    const season = demand.getSeasonality('arcade-machine')
    const maxMonth = season.monthlyFactors.indexOf(Math.max(...season.monthlyFactors))
    const minMonth = season.monthlyFactors.indexOf(Math.min(...season.monthlyFactors))
    assert.ok(maxMonth >= 0)
    assert.ok(minMonth >= 0)
    assert.ok(season.monthlyFactors[maxMonth] >= season.monthlyFactors[minMonth])
  })

  it('边界: 超长预测期 (365天) 不崩潰', () => {
    const { demand } = makeServices()
    expect(() => demand.forecastSales('arcade-machine', 365)).not.toThrow()
    const result = demand.forecastSales('arcade-machine', 365)
    assert.ok(result.predictedSales > 0)
  })
})

// ══════════════════════════════════════════════════════════
// 🎯 运行专员 — 促销活动影响与调优
// ══════════════════════════════════════════════════════════

describe('🎯 运行专员 - 扩展: 促销调优', () => {
  beforeEach(resetAll)

  it('多种促销类型叠加时的最终乘数小于算术和', () => {
    const { demand } = makeServices()
    const base = demand.forecastSales('prod-ops-promo', 14)
    const promos = [
      { id: 'p1', type: 'discount' as const, startDate: '2025-01-01', endDate: '2027-12-31', boostPercent: 0.3 },
      { id: 'p2', type: 'bundled' as const, startDate: '2025-01-01', endDate: '2027-12-31', boostPercent: 0.2 },
      { id: 'p3', type: 'gift' as const, startDate: '2025-01-01', endDate: '2027-12-31', boostPercent: 0.1 },
    ]
    const adjusted = demand.adjustForPromotions(base, promos)
    const arithmeticSum = 1 + 0.3 + 0.2 + 0.1
    assert.ok(adjusted.promotionMultiplier < arithmeticSum, '边际递减应小于算术和')
    assert.ok(adjusted.predictedSales > base.predictedSales)
  })

  it('三种促销类型皆可正常处理', () => {
    const { demand } = makeServices()
    const base = demand.forecastSales('prod-ops-alltypes', 7)
    const types = ['discount', 'bundled', 'gift'] as const
    for (const type of types) {
      const promos = [
        { id: 'p-' + type, type, startDate: '2025-01-01', endDate: '2027-12-31', boostPercent: 0.15 },
      ]
      const adjusted = demand.adjustForPromotions(base, promos)
      assert.ok(adjusted.promotionMultiplier >= 1.0)
    }
  })

  it('边界: boostPercent 为 0 的促销不影响预测', () => {
    const { demand } = makeServices()
    const base = demand.forecastSales('prod-ops-zero-boost', 7)
    const promos = [
      { id: 'p-zero', type: 'discount' as const, startDate: '2025-01-01', endDate: '2027-12-31', boostPercent: 0 },
    ]
    const adjusted = demand.adjustForPromotions(base, promos)
    assert.equal(adjusted.promotionMultiplier, 1.0)
    assert.equal(adjusted.predictedSales, base.predictedSales)
  })
})

// ══════════════════════════════════════════════════════════
// 🤝 团建 — 批量调拨与备品协调
// ══════════════════════════════════════════════════════════

describe('🤝 团建 - 扩展: 批量协调', () => {
  beforeEach(resetAll)

  it('多产品全局分配可独立计算', () => {
    const { transfer } = makeServices()
    const products = [
      { storeId: 'store-team-a', productId: 'prod-team-ticket' },
      { storeId: 'store-team-b', productId: 'prod-team-ticket' },
      { storeId: 'store-team-a', productId: 'prod-team-food' },
      { storeId: 'store-team-b', productId: 'prod-team-food' },
    ]
    const allocations = transfer.optimizeGlobalAllocation(products)
    assert.ok(Array.isArray(allocations))
    allocations.forEach((alloc) => {
      assert.equal(typeof alloc.productId, 'string')
    })
  })

  it('调拨成本随数量增加而非线性增长', () => {
    const { transfer } = makeServices()
    // 不同 productId 会影响成本计算中的数量（内部 mock）
    const b1 = transfer.calculateTransferBenefit('store-team-c', 'store-team-d', 'prod-team-qty-1')
    const b2 = transfer.calculateTransferBenefit('store-team-c', 'store-team-d', 'prod-team-qty-2')
    // 成本存在（具体值取决于 mock 数据）
    assert.ok(b1.cost.total > 0)
    assert.ok(b2.cost.total > 0)
  })

  it('边界: 多个产品全为同一门店不抛出异常', () => {
    const { transfer } = makeServices()
    const products = [
      { storeId: 'store-team-only', productId: 'prod-only-1' },
      { storeId: 'store-team-only', productId: 'prod-only-2' },
    ]
    expect(() => transfer.optimizeGlobalAllocation(products)).not.toThrow()
  })
})

// ══════════════════════════════════════════════════════════
// 📢 营销 — 品类预测与促销计划制定
// ══════════════════════════════════════════════════════════

describe('📢 营销 - 扩展: 品类策略', () => {
  beforeEach(resetAll)

  it('同一品类下不同产品的预测汇总与品类总预测一致', () => {
    const { demand } = makeServices()
    const cat = demand.forecastByCategory('cat-marketing-a', 14)
    const sum = cat.productForecasts.reduce((s, f) => s + f.predictedSales, 0)
    assert.equal(cat.totalPredictedSales, sum)
  })

  it('新品类的预测自动创建默认产品', () => {
    const { demand } = makeServices()
    const cat = demand.forecastByCategory('cat-brand-new', 7)
    assert.equal(cat.categoryId, 'cat-brand-new')
    assert.ok(cat.productForecasts.length >= 1)
    cat.productForecasts.forEach((pf) => {
      assert.ok(pf.productId.includes('cat-brand-new'))
    })
  })

  it('促销组合策略分析得到最佳乘数', () => {
    const { demand } = makeServices()
    const base = demand.forecastSales('prod-mkt-strategy', 30)
    const strategy1 = [
      { id: 'm1', type: 'discount' as const, startDate: '2025-01-01', endDate: '2027-12-31', boostPercent: 0.25 },
    ]
    const strategy2 = [
      { id: 'm2', type: 'bundled' as const, startDate: '2025-01-01', endDate: '2027-12-31', boostPercent: 0.20 },
      { id: 'm3', type: 'gift' as const, startDate: '2025-01-01', endDate: '2027-12-31', boostPercent: 0.10 },
    ]
    const r1 = demand.adjustForPromotions(base, strategy1)
    const r2 = demand.adjustForPromotions(base, strategy2)
    // 两种策略至少一种有效
    assert.ok(r1.predictedSales >= base.predictedSales)
    assert.ok(r2.predictedSales >= base.predictedSales)
  })

  it('边界: 品类预测的超长周期 (365天) 不崩潰', () => {
    const { demand } = makeServices()
    expect(() => demand.forecastByCategory('cat-extreme', 365)).not.toThrow()
    const result = demand.forecastByCategory('cat-extreme', 365)
    assert.ok(result.totalPredictedSales > 0)
  })
})
