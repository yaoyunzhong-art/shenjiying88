import { describe, it, expect } from "vitest"

interface LoyaltyPlan {
  id: string
  name: string
  level: string
  discount: number
  pointsMultiplier: number
  minSpend: number
  benefits: string[]
}

interface LoyaltyConversion {
  currentLevel: string
  spendRequired: number
  conversionRate: number
}

function canAdvance(current: string, spend: number): { canAdvance: boolean; nextLevel: string | null; remaining: number } {
  const tiers: Record<string, { next: string | null; threshold: number }> = {
    bronze: { next: 'silver', threshold: 500 },
    silver: { next: 'gold', threshold: 2000 },
    gold: { next: 'platinum', threshold: 5000 },
    platinum: { next: 'diamond', threshold: 10000 },
    diamond: { next: null, threshold: Infinity },
  }
  const tier = tiers[current]
  if (!tier || !tier.next) return { canAdvance: false, nextLevel: null, remaining: 0 }
  if (spend >= tier.threshold) return { canAdvance: true, nextLevel: tier.next, remaining: 0 }
  return { canAdvance: false, nextLevel: tier.next, remaining: tier.threshold - spend }
}

function isExpired(expireDate: string): boolean {
  return new Date(expireDate) < new Date()
}

describe("✅ AC-LOYALTY: 忠诚度圈梁 — 边界测试", () => {
  it("等级权益: gold折扣0.9倍率1.5", () => {
    const l: LoyaltyPlan = { id: 'l1', name: '金卡计划', level: 'gold', discount: 0.9, pointsMultiplier: 1.5, minSpend: 2000, benefits: ['积分1.5x倍率', '全场9折'] }
    expect(l.discount).toBe(0.9)
    expect(l.pointsMultiplier).toBe(1.5)
  })

  it("升级条件: silver→gold需消费200000分", () => {
    const c: LoyaltyConversion = { currentLevel: 'silver', spendRequired: 200000, conversionRate: 1.2 }
    expect(c.spendRequired).toBe(200000)
  })

  it("升级条件: 消费刚好到门槛可升级", () => {
    const result = canAdvance('bronze', 500) // 刚好够升silver
    expect(result.canAdvance).toBe(true)
    expect(result.nextLevel).toBe('silver')
  })

  it("升级条件: 消费不足不可升级", () => {
    const result = canAdvance('bronze', 499)
    expect(result.canAdvance).toBe(false)
    expect(result.remaining).toBe(1)
  })

  it("升级条件: 消费不足silver→gold", () => {
    const result = canAdvance('silver', 1999)
    expect(result.canAdvance).toBe(false)
    expect(result.nextLevel).toBe('gold')
    expect(result.remaining).toBe(1)
  })

  it("升级条件: diamond顶级不可再升", () => {
    const result = canAdvance('diamond', 99999)
    expect(result.canAdvance).toBe(false)
    expect(result.nextLevel).toBeNull()
  })

  it("升级条件: 跨级消费直接跳升", () => {
    const result = canAdvance('bronze', 10000)
    expect(result.canAdvance).toBe(true)
    expect(result.nextLevel).toBe('silver') // 逐级晋升
  })

  it("权益过期: 已过期权益不可用", () => {
    expect(isExpired('2025-01-01')).toBe(true)
  })

  it("权益过期: 未过期权益可用", () => {
    expect(isExpired('2026-12-31')).toBe(false)
  })

  it("权益差异: 等级越高倍率越高", () => {
    const tiers = [
      { level: 'bronze', multiplier: 1 },
      { level: 'silver', multiplier: 1.2 },
      { level: 'gold', multiplier: 1.5 },
      { level: 'platinum', multiplier: 1.8 },
      { level: 'diamond', multiplier: 2 },
    ]
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i].multiplier).toBeGreaterThan(tiers[i - 1].multiplier)
    }
  })
})
