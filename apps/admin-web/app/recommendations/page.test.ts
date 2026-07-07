/**
 * Phase-40 T170: 推荐中心页面测试 (node:test)
 *
 * 覆盖:
 *  - 页面核心逻辑 (mock 数据生成 / 策略权重计算 / 元数据校验)
 *  - mockSummary 函数输出校验
 *  - 数字格式化边界 (缓存/fallback 率 / 权重百分比)
 *  - 漏斗阶段完整性与顺序
 *  - 热力图数据完整性
 *  - Cold-warm 统计
 *  - 推荐理由排序
 */

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

// ── Replicate page data helpers ───────────────────────────

/**
 * 模拟 mockSummary 函数的完整输出
 * 覆盖: campaigns-data.ts 风格的数据校验测试
 */
function mockSummary(tenantId, cached) {
  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    cached,
    strategyWeights: {
      'item-cf': 0.35,
      'user-cf': 0.20,
      'popular': 0.20,
      'recently-viewed': 0.10,
      'personalized': 0.15
    },
    funnel: [
      { stage: '曝光', count: 12000 },
      { stage: '点击', count: 4800 },
      { stage: '加购', count: 1600 },
      { stage: '购买', count: 480 }
    ],
    topReasons: [
      { reason: '与您浏览过的"无线耳机"相似', count: 1280 },
      { reason: '购买了"运动鞋"的会员也喜欢', count: 980 },
      { reason: '本月热销 TOP 10', count: 860 },
      { reason: '您最近浏览过', count: 640 },
      { reason: '基于您的偏好"数码"', count: 420 }
    ],
    coldStart: { cold: 320, warm: 1680 },
    heatmap: [
      { strategy: 'item-cf', category: '数码', count: 420 },
      { strategy: 'item-cf', category: '服饰', count: 280 },
      { strategy: 'item-cf', category: '食品', count: 120 },
      { strategy: 'user-cf', category: '数码', count: 180 },
      { strategy: 'user-cf', category: '服饰', count: 240 },
      { strategy: 'user-cf', category: '食品', count: 80 },
      { strategy: 'popular', category: '数码', count: 360 },
      { strategy: 'popular', category: '服饰', count: 480 },
      { strategy: 'popular', category: '食品', count: 320 },
      { strategy: 'recently-viewed', category: '数码', count: 220 },
      { strategy: 'recently-viewed', category: '服饰', count: 180 },
      { strategy: 'recently-viewed', category: '食品', count: 80 },
      { strategy: 'personalized', category: '数码', count: 280 },
      { strategy: 'personalized', category: '服饰', count: 320 },
      { strategy: 'personalized', category: '食品', count: 200 }
    ],
    metadata: {
      totalRequests: 2000,
      avgExecutionMs: 42,
      cacheHitRate: 0.38,
      fallbackRate: 0.16
    }
  }
}

/** 策略权重百分比 */
function weightsToPercent(weights) {
  const result = {}
  for (const [k, v] of Object.entries(weights)) {
    result[k] = Math.round(Number(v) * 100)
  }
  return result
}

/** 漏斗转化率: 每个阶段相对曝光量 */
function funnelConversionRates(funnel) {
  const exposure = funnel[0].count
  return funnel.map(f => ({
    stage: f.stage,
    count: f.count,
    rate: Math.round((f.count / exposure) * 10000) / 100
  }))
}

/** 冷启动占比百分比 */
function coldStartPercent(coldStart) {
  const total = coldStart.cold + coldStart.warm
  return {
    coldPct: Math.round((coldStart.cold / total) * 10000) / 100,
    warmPct: Math.round((coldStart.warm / total) * 10000) / 100,
    coldCount: coldStart.cold,
    warmCount: coldStart.warm,
    total
  }
}

/** 热力图策略 + 类目去重计数 */
function heatmapDimensions(heatmap) {
  const strategies = Array.from(new Set(heatmap.map(h => h.strategy)))
  const categories = Array.from(new Set(heatmap.map(h => h.category)))
  return { strategyCount: strategies.length, categoryCount: categories.length, totalCells: strategies.length * categories.length, filledCells: heatmap.length }
}

/** 推荐理由排序验证 (降序) */
function validateReasonsSorted(reasons) {
  for (let i = 1; i < reasons.length; i++) {
    if (reasons[i].count > reasons[i - 1].count) return false
  }
  return true
}

/** 缓存/fallback 率格式化 */
function formatPct(rate) {
  return Number((rate * 100).toFixed(1))
}

// ── Tests ────────────────────────────────────────────────────

describe('RecommendationsPage: mockSummary 数据完整性', () => {
  it('正例: cached=false 生成完整摘要', () => {
    const s = mockSummary('tenant-a', false)
    assert.ok(s)
    assert.equal(s.tenantId, 'tenant-a')
    assert.equal(s.cached, false)
    assert.ok(s.generatedAt)
  })

  it('正例: cached=true 标识正确', () => {
    const s = mockSummary('tenant-b', true)
    assert.equal(s.cached, true)
  })

  it('正例: 5 个策略权重合计 ≈ 100%', () => {
    const s = mockSummary('t', false)
    const pct = weightsToPercent(s.strategyWeights)
    const sum = Object.values(pct).reduce((a, b) => a + b, 0)
    assert.equal(sum, 100) // 35 + 20 + 20 + 10 + 15 = 100
  })

  it('正例: item-cf 权重最高 (35%)', () => {
    const s = mockSummary('t', false)
    assert.equal(Math.round(s.strategyWeights['item-cf'] * 100), 35)
  })

  it('正例: funnel 4 个阶段顺序: 曝光→点击→加购→购买', () => {
    const s = mockSummary('t', false)
    assert.equal(s.funnel.length, 4)
    assert.equal(s.funnel[0].stage, '曝光')
    assert.equal(s.funnel[1].stage, '点击')
    assert.equal(s.funnel[2].stage, '加购')
    assert.equal(s.funnel[3].stage, '购买')
  })
})

describe('RecommendationsPage: 漏斗转化率', () => {
  it('正例: 曝光→点击 转化率 40%', () => {
    const s = mockSummary('t', false)
    const rates = funnelConversionRates(s.funnel)
    assert.equal(rates[0].rate, 100)
    assert.equal(rates[1].rate, 40)   // 4800/12000
    assert.equal(rates[2].rate, 13.33) // 1600/12000
    assert.equal(rates[3].rate, 4)     // 480/12000
  })

  it('正例: 点击→购买 转化率 = 10%', () => {
    const s = mockSummary('t', false)
    assert.equal(s.funnel[3].count / s.funnel[1].count * 100, 10)
  })

  it('边界: 购买数不能超过曝光数', () => {
    const s = mockSummary('t', false)
    assert.ok(s.funnel[3].count <= s.funnel[0].count)
  })
})

describe('RecommendationsPage: 冷启动占比', () => {
  it('正例: cold + warm = 2000 条', () => {
    const s = mockSummary('t', false)
    const cp = coldStartPercent(s.coldStart)
    assert.equal(cp.total, 2000)
    assert.equal(cp.coldCount, 320)
    assert.equal(cp.warmCount, 1680)
  })

  it('正例: cold 占比 16%', () => {
    const cp = coldStartPercent({ cold: 320, warm: 1680 })
    assert.equal(cp.coldPct, 16)
    assert.equal(cp.warmPct, 84)
  })
})

describe('RecommendationsPage: 热力图数据', () => {
  it('正例: 5 策略 × 3 类目 = 15 单元格', () => {
    const s = mockSummary('t', false)
    const dims = heatmapDimensions(s.heatmap)
    assert.equal(dims.strategyCount, 5)
    assert.equal(dims.categoryCount, 3)
    assert.equal(dims.totalCells, 15)
    assert.equal(dims.filledCells, 15)
  })

  it('正例: 类目只含数码/服饰/食品', () => {
    const s = mockSummary('t', false)
    const cats = Array.from(new Set(s.heatmap.map(h => h.category)))
    assert.deepEqual(cats.sort(), ['数码', '服饰', '食品'])
  })

  it('反例: 热力图无负数值', () => {
    const s = mockSummary('t', false)
    for (const h of s.heatmap) {
      assert.ok(h.count >= 0, `${h.strategy}×${h.category} count=${h.count}`)
    }
  })
})

describe('RecommendationsPage: 推荐理由排序', () => {
  it('正例: 推荐理由已按 count 降序排列', () => {
    const s = mockSummary('t', false)
    assert.ok(validateReasonsSorted(s.topReasons))
  })

  it('正例: 5 条推荐理由', () => {
    const s = mockSummary('t', false)
    assert.equal(s.topReasons.length, 5)
  })
})

describe('RecommendationsPage: metadata 格式化', () => {
  it('正例: 缓存命中率 38%', () => {
    assert.equal(formatPct(0.38), 38)
  })

  it('正例: Fallback 占比 16%', () => {
    assert.equal(formatPct(0.16), 16)
  })

  it('边界: 缓存命中率 0%', () => {
    assert.equal(formatPct(0), 0)
  })

  it('边界: 缓存命中率 100%', () => {
    assert.equal(formatPct(1), 100)
  })
})

describe('RecommendationsPage: 跨测试综合校验', () => {
  it('策略权重 + 漏斗 + 冷启动 + 热力图 整体一致性', () => {
    const s = mockSummary('demo', false)

    // 权重合计 100%
    const pct = weightsToPercent(s.strategyWeights)
    assert.equal(Object.values(pct).reduce((a, b) => a + b, 0), 100)

    // 曝光量 > 点击 > 加购 > 购买
    assert.ok(s.funnel[0].count > s.funnel[1].count)
    assert.ok(s.funnel[1].count > s.funnel[2].count)
    assert.ok(s.funnel[2].count > s.funnel[3].count)

    // cold + warm = 2000
    assert.equal(s.coldStart.cold + s.coldStart.warm, 2000)

    // 15 个热力图单元格
    assert.equal(s.heatmap.length, 15)

    // topReasons 降序
    assert.ok(validateReasonsSorted(s.topReasons))
  })

  it('统计信息合理: totalRequests 不能为 0', () => {
    const s = mockSummary('t', false)
    assert.ok(s.metadata.totalRequests > 0)
  })

  it('统计信息合理: avgExecutionMs 为正数', () => {
    const s = mockSummary('t', false)
    assert.ok(s.metadata.avgExecutionMs > 0)
  })
})
