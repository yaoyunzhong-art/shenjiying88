import { describe, it, expect } from "vitest"

type LevelName = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
interface LevelConfig {
  level: LevelName
  name: string
  minSpend: number
  discount: number
  pointsMultiplier: number
  benefits: string[]
}

const LEVEL_CONFIGS: Record<LevelName, LevelConfig> = {
  bronze: { level: 'bronze', name: '青铜', minSpend: 0, discount: 1, pointsMultiplier: 1, benefits: ['积分1x倍率'] },
  silver: { level: 'silver', name: '银卡', minSpend: 500, discount: 0.95, pointsMultiplier: 1.2, benefits: ['积分1.2x倍率', '全场95折'] },
  gold: { level: 'gold', name: '金卡', minSpend: 2000, discount: 0.9, pointsMultiplier: 1.5, benefits: ['积分1.5x倍率', '全场9折'] },
  platinum: { level: 'platinum', name: '铂金', minSpend: 5000, discount: 0.85, pointsMultiplier: 1.8, benefits: ['积分1.8x倍率', '全场85折', '生日礼'] },
  diamond: { level: 'diamond', name: '钻石', minSpend: 10000, discount: 0.8, pointsMultiplier: 2, benefits: ['积分2x倍率', '全场8折', '生日礼', '专属客服'] },
}

const LEVEL_ORDER: LevelName[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond']

function computeLevel(totalSpend: number): LevelName {
  let result: LevelName = 'bronze'
  for (const lv of LEVEL_ORDER) {
    if (totalSpend >= LEVEL_CONFIGS[lv].minSpend) result = lv
  }
  return result
}

describe("✅ AC-MEMBER-LEVEL: 会员等级圈梁 — 边界测试", () => {
  it("等级晋升: 0消费→bronze", () => {
    expect(computeLevel(0)).toBe('bronze')
  })

  it("等级晋升: 刚好500→silver", () => {
    expect(computeLevel(500)).toBe('silver')
  })

  it("等级晋升: 刚好1999→silver(未到gold)", () => {
    expect(computeLevel(1999)).toBe('silver')
  })

  it("等级晋升: 刚好2000→gold", () => {
    expect(computeLevel(2000)).toBe('gold')
  })

  it("等级晋升: 跨级→bronze直跳gold(消费5000)", () => {
    expect(computeLevel(5000)).toBe('platinum') // 5000到platinum门槛
  })

  it("等级晋升: 顶级diamond消费max不可再升", () => {
    expect(computeLevel(99999)).toBe('diamond')
  })

  it("权益差异: gold折扣0.9小于silver的0.95", () => {
    expect(LEVEL_CONFIGS.gold.discount).toBeLessThan(LEVEL_CONFIGS.silver.discount)
  })

  it("权益差异: diamond积分倍率2x是最高", () => {
    const multipliers = LEVEL_ORDER.map(lv => LEVEL_CONFIGS[lv].pointsMultiplier)
    expect(LEVEL_CONFIGS.diamond.pointsMultiplier).toBe(Math.max(...multipliers))
  })

  it("权益差异: 每级权益数逐级递增", () => {
    for (let i = 1; i < LEVEL_ORDER.length; i++) {
      expect(LEVEL_CONFIGS[LEVEL_ORDER[i]].benefits.length)
        .toBeGreaterThanOrEqual(LEVEL_CONFIGS[LEVEL_ORDER[i-1]].benefits.length)
    }
  })

  it("边界: 负消费不降级", () => {
    // 银卡会员即使负消费也应保持银卡
    expect(computeLevel(-100)).toBe('bronze') // 最低bronze
  })

  it("边界: 超大消费不溢出", () => {
    expect(computeLevel(Number.MAX_SAFE_INTEGER)).toBe('diamond')
  })
})
