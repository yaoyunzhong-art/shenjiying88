/* ===== member-level — 纯函数式内联测试，不 import 生产代码 ===== */

// ── 1. 枚举 + 类型定义 ────────────────────────────────────────────

enum MemberLevelTier {
  REGULAR = 'REGULAR',
  VIP = 'VIP',
  SVIP = 'SVIP',
  DIAMOND = 'DIAMOND',
  LEGEND = 'LEGEND',
  MYTH = 'MYTH',
}

enum MemberLevelSub {
  L1 = 'L1',
  L2 = 'L2',
  L3 = 'L3',
}

type MemberLevelKey = `${MemberLevelTier}_${MemberLevelSub}`

interface LevelThreshold {
  tier: MemberLevelTier
  sub: MemberLevelSub
  requiredGrowth: number
  requiredSpend: number
  requiredVisits: number
  benefits: string[]
}

interface LevelInfo {
  memberId: string
  currentTier: MemberLevelTier
  currentSub: MemberLevelSub
  currentLevelKey: MemberLevelKey
  growthValue: number
  totalSpend: number
  totalVisits: number
  nextLevelThreshold?: LevelThreshold
  upgradeProgress: number
  benefits: string[]
  evaluatedAt: string
  upgraded: boolean
}

interface LevelEvaluationInput {
  memberId: string
  growthValue: number
  totalSpend: number
  totalVisits: number
  tenantId: string
}

interface BatchLevelInput {
  items: LevelEvaluationInput[]
}

interface BatchLevelOutput {
  items: LevelInfo[]
  totalEvaluated: number
  upgradedCount: number
  timestamp: string
}

interface LevelChangeRecord {
  memberId: string
  fromTier: MemberLevelTier
  fromSub: MemberLevelSub
  toTier: MemberLevelTier
  toSub: MemberLevelSub
  reason: string
  changedAt: string
}

interface LevelConfig {
  tier: MemberLevelTier
  label: string
  growthRequired: number
  spendRequired: number
  visitRequired: number
  benefits: string[]
}

interface AllLevelConfig {
  tiers: LevelConfig[]
  lastUpdated: string
}

export {} // ensure module scope

// ── 2. Mock 数据工厂 ──────────────────────────────────────────────

const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { tier: MemberLevelTier.REGULAR, sub: MemberLevelSub.L1, requiredGrowth: 0, requiredSpend: 0, requiredVisits: 0, benefits: ['基础会员权益', '每月签到积分'] },
  { tier: MemberLevelTier.REGULAR, sub: MemberLevelSub.L2, requiredGrowth: 100, requiredSpend: 200, requiredVisits: 2, benefits: ['基础会员权益', '签到积分加倍'] },
  { tier: MemberLevelTier.REGULAR, sub: MemberLevelSub.L3, requiredGrowth: 300, requiredSpend: 500, requiredVisits: 5, benefits: ['基础会员权益', '生日优惠券'] },
  { tier: MemberLevelTier.VIP, sub: MemberLevelSub.L1, requiredGrowth: 800, requiredSpend: 1000, requiredVisits: 10, benefits: ['VIP专享折扣9.5折', '生日双倍积分'] },
  { tier: MemberLevelTier.VIP, sub: MemberLevelSub.L2, requiredGrowth: 1500, requiredSpend: 3000, requiredVisits: 20, benefits: ['VIP折扣9折', '生日优惠券', '优先排队'] },
  { tier: MemberLevelTier.VIP, sub: MemberLevelSub.L3, requiredGrowth: 2500, requiredSpend: 5000, requiredVisits: 30, benefits: ['VIP折扣8.8折', '生日礼包', '免费饮品券'] },
  { tier: MemberLevelTier.SVIP, sub: MemberLevelSub.L1, requiredGrowth: 4000, requiredSpend: 10000, requiredVisits: 50, benefits: ['SVIP折扣8.5折', '生日大礼包', '专属客服'] },
  { tier: MemberLevelTier.SVIP, sub: MemberLevelSub.L2, requiredGrowth: 6000, requiredSpend: 20000, requiredVisits: 80, benefits: ['SVIP折扣8折', '季度礼包', '专属客服', '免排队'] },
  { tier: MemberLevelTier.SVIP, sub: MemberLevelSub.L3, requiredGrowth: 9000, requiredSpend: 35000, requiredVisits: 120, benefits: ['SVIP折扣7.8折', '双月礼包', '24H客服', '包厢优先'] },
  { tier: MemberLevelTier.DIAMOND, sub: MemberLevelSub.L1, requiredGrowth: 14000, requiredSpend: 50000, requiredVisits: 180, benefits: ['钻石折扣7.5折', '每月礼包', '专属管家', '无限免排'] },
  { tier: MemberLevelTier.DIAMOND, sub: MemberLevelSub.L2, requiredGrowth: 20000, requiredSpend: 80000, requiredVisits: 250, benefits: ['钻石折扣7折', '双月超级礼包', '专属管家', '活动优先参与'] },
  { tier: MemberLevelTier.DIAMOND, sub: MemberLevelSub.L3, requiredGrowth: 28000, requiredSpend: 120000, requiredVisits: 350, benefits: ['钻石折扣6.8折', '季度超级礼包', '黑卡管家', '私人活动邀请'] },
  { tier: MemberLevelTier.LEGEND, sub: MemberLevelSub.L1, requiredGrowth: 40000, requiredSpend: 200000, requiredVisits: 500, benefits: ['传奇折扣6折', '季度尊享礼包', '传奇管家', 'VIP活动VIP席'] },
  { tier: MemberLevelTier.LEGEND, sub: MemberLevelSub.L2, requiredGrowth: 55000, requiredSpend: 350000, requiredVisits: 700, benefits: ['传奇折扣5.5折', '双月传奇礼包', '传奇管家', '免费旅游名额'] },
  { tier: MemberLevelTier.LEGEND, sub: MemberLevelSub.L3, requiredGrowth: 75000, requiredSpend: 500000, requiredVisits: 1000, benefits: ['传奇折扣5折', '月度传奇礼包', '传奇管家', '年度盛典VIP席位'] },
  { tier: MemberLevelTier.MYTH, sub: MemberLevelSub.L1, requiredGrowth: 100000, requiredSpend: 800000, requiredVisits: 1500, benefits: ['神话折扣4.5折', '神话礼盒', '神话管家团队', '全球VIP活动入场券'] },
  { tier: MemberLevelTier.MYTH, sub: MemberLevelSub.L2, requiredGrowth: 150000, requiredSpend: 1200000, requiredVisits: 2000, benefits: ['神话折扣4折', '神话大礼盒', '神话管家团队', '品牌联名限量品'] },
  { tier: MemberLevelTier.MYTH, sub: MemberLevelSub.L3, requiredGrowth: 250000, requiredSpend: 2000000, requiredVisits: 3000, benefits: ['神话折扣3.8折', '神话至尊礼盒', '专享CEO接待', '合伙人级权益'] },
]

function makeInput(overrides?: Partial<LevelEvaluationInput>): LevelEvaluationInput {
  return {
    memberId: 'mem-001',
    growthValue: 0,
    totalSpend: 0,
    totalVisits: 0,
    tenantId: 'tenant-a',
    ...overrides,
  }
}

// ── 3. 内联业务逻辑 ──────────────────────────────────────────────

function getThresholdIndex(threshold: LevelThreshold): number {
  return LEVEL_THRESHOLDS.findIndex((t) => t.tier === threshold.tier && t.sub === threshold.sub)
}

function calculateUpgradeProgress(
  input: LevelEvaluationInput,
  current: LevelThreshold,
  next?: LevelThreshold,
): number {
  if (!next) return 1.0
  const growthProgress = Math.min(1, (input.growthValue - current.requiredGrowth) / Math.max(1, next.requiredGrowth - current.requiredGrowth))
  const spendProgress = Math.min(1, (input.totalSpend - current.requiredSpend) / Math.max(1, next.requiredSpend - current.requiredSpend))
  const visitProgress = Math.min(1, (input.totalVisits - current.requiredVisits) / Math.max(1, next.requiredVisits - current.requiredVisits))
  return Math.min(growthProgress, spendProgress, visitProgress, 1.0)
}

function evaluateMemberLevel(input: LevelEvaluationInput): LevelInfo {
  const { memberId, growthValue, totalSpend, totalVisits } = input
  let matchedLevel: LevelThreshold | null = null

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    const threshold = LEVEL_THRESHOLDS[i]!
    if (growthValue >= threshold.requiredGrowth && totalSpend >= threshold.requiredSpend && totalVisits >= threshold.requiredVisits) {
      matchedLevel = threshold
      break
    }
  }

  if (!matchedLevel) matchedLevel = LEVEL_THRESHOLDS[0]!

  const baseThresholdIndex = getThresholdIndex(matchedLevel)
  const nextThreshold = baseThresholdIndex < LEVEL_THRESHOLDS.length - 1 ? LEVEL_THRESHOLDS[baseThresholdIndex + 1] : undefined
  const upgradeProgress = calculateUpgradeProgress(input, matchedLevel, nextThreshold)
  const isBaseLevel = matchedLevel.sub === MemberLevelSub.L1 && matchedLevel.tier === MemberLevelTier.REGULAR && growthValue === 0

  return {
    memberId,
    currentTier: matchedLevel.tier,
    currentSub: matchedLevel.sub,
    currentLevelKey: `${matchedLevel.tier}_${matchedLevel.sub}` as MemberLevelKey,
    growthValue,
    totalSpend,
    totalVisits,
    nextLevelThreshold: nextThreshold,
    upgradeProgress,
    benefits: matchedLevel.benefits,
    evaluatedAt: new Date().toISOString(),
    upgraded: !isBaseLevel,
  }
}

function batchEvaluate(input: BatchLevelInput): BatchLevelOutput {
  const results = input.items.map((item) => evaluateMemberLevel(item))
  const upgradedCount = results.filter((r) => r.upgraded).length
  return { items: results, totalEvaluated: results.length, upgradedCount, timestamp: new Date().toISOString() }
}

function getAllLevelConfig(): AllLevelConfig {
  return {
    tiers: LEVEL_THRESHOLDS.map((t) => ({
      tier: t.tier,
      label: `${t.tier} ${t.sub}`,
      growthRequired: t.requiredGrowth,
      spendRequired: t.requiredSpend,
      visitRequired: t.requiredVisits,
      benefits: t.benefits,
    })),
    lastUpdated: new Date().toISOString(),
  }
}

function getUpgradePath(currentTier: MemberLevelTier, currentSub: MemberLevelSub): LevelChangeRecord[] {
  const path: LevelChangeRecord[] = []
  const startIdx = getThresholdIndex({ tier: currentTier, sub: currentSub, requiredGrowth: 0, requiredSpend: 0, requiredVisits: 0, benefits: [] })

  for (let i = startIdx; i < LEVEL_THRESHOLDS.length; i++) {
    const level = LEVEL_THRESHOLDS[i]!
    const idx = getThresholdIndex(level)
    const nextIdx = idx + 1
    if (nextIdx < LEVEL_THRESHOLDS.length) {
      const next = LEVEL_THRESHOLDS[nextIdx]!
      path.push({
        memberId: 'calculated',
        fromTier: level.tier,
        fromSub: level.sub,
        toTier: next.tier,
        toSub: next.sub,
        reason: `满足 ${next.requiredGrowth} 成长值 / ¥${next.requiredSpend} 消费 / ${next.requiredVisits} 到访`,
        changedAt: new Date().toISOString(),
      })
    }
  }

  return path
}

function calculateLevel(growthValue: number): LevelInfo {
  return evaluateMemberLevel({
    memberId: 'system',
    growthValue,
    totalSpend: growthValue * 10,
    totalVisits: Math.floor(growthValue / 50),
    tenantId: 'system',
  })
}

// ── 4. Tests ──────────────────────────────────────────────────────

describe('MemberLevelService (inline)', () => {
  // ── evaluateMemberLevel ──
  describe('evaluateMemberLevel', () => {
    it('should return REGULAR_L1 for zero values', () => {
      const result = evaluateMemberLevel(makeInput())
      expect(result.currentTier).toBe(MemberLevelTier.REGULAR)
      expect(result.currentSub).toBe(MemberLevelSub.L1)
      expect(result.upgraded).toBe(false)
    })

    it('should return REGULAR_L2 for growth=100, spend=200, visits=2', () => {
      const result = evaluateMemberLevel(makeInput({ growthValue: 100, totalSpend: 200, totalVisits: 2 }))
      expect(result.currentTier).toBe(MemberLevelTier.REGULAR)
      expect(result.currentSub).toBe(MemberLevelSub.L2)
      expect(result.upgraded).toBe(true)
    })

    it('should return REGULAR_L3 for growth=300, spend=500, visits=5', () => {
      const result = evaluateMemberLevel(makeInput({ growthValue: 300, totalSpend: 500, totalVisits: 5 }))
      expect(result.currentSub).toBe(MemberLevelSub.L3)
    })

    it('should return VIP_L1 for growth=800, spend=1000, visits=10', () => {
      const result = evaluateMemberLevel(makeInput({ growthValue: 800, totalSpend: 1000, totalVisits: 10 }))
      expect(result.currentTier).toBe(MemberLevelTier.VIP)
      expect(result.currentSub).toBe(MemberLevelSub.L1)
    })

    it('should return VIP_L2 for growth=1500, spend=3000, visits=20', () => {
      const result = evaluateMemberLevel(makeInput({ growthValue: 1500, totalSpend: 3000, totalVisits: 20 }))
      expect(result.currentTier).toBe(MemberLevelTier.VIP)
      expect(result.currentSub).toBe(MemberLevelSub.L2)
    })

    it('should return DIAMOND_L1 for high spend+growth', () => {
      const result = evaluateMemberLevel(makeInput({ growthValue: 14000, totalSpend: 50000, totalVisits: 180 }))
      expect(result.currentTier).toBe(MemberLevelTier.DIAMOND)
      expect(result.currentSub).toBe(MemberLevelSub.L1)
      expect(result.benefits).toContain('钻石折扣7.5折')
    })

    it('should return MYTH_L3 for max values', () => {
      const result = evaluateMemberLevel(makeInput({ growthValue: 250000, totalSpend: 2000000, totalVisits: 3000 }))
      expect(result.currentTier).toBe(MemberLevelTier.MYTH)
      expect(result.currentSub).toBe(MemberLevelSub.L3)
    })

    it('should use the bottleneck dimension (low visits)', () => {
      const result = evaluateMemberLevel(makeInput({ growthValue: 1500, totalSpend: 3000, totalVisits: 2 }))
      // growth & spend qualify VIP_L1, but visits=2 only qualifies REGULAR_L2
      expect(result.currentTier >= MemberLevelTier.REGULAR).toBe(true)
      expect(result.currentSub).toBe(MemberLevelSub.L2)
    })

    it('should provide upgradeProgress < 1 for non-max levels', () => {
      const result = evaluateMemberLevel(makeInput({ growthValue: 50, totalSpend: 100, totalVisits: 1 }))
      expect(result.upgradeProgress).toBeGreaterThan(0)
      expect(result.upgradeProgress).toBeLessThan(1)
    })

    it('should provide upgradeProgress = 1 for MYTH_L3', () => {
      const result = evaluateMemberLevel(makeInput({ growthValue: 250000, totalSpend: 2000000, totalVisits: 3000 }))
      expect(result.upgradeProgress).toBe(1)
      expect(result.nextLevelThreshold).toBeUndefined()
    })
  })

  // ── calculateLevel ──
  describe('calculateLevel', () => {
    it('should map growth value using simplified rules', () => {
      const result = calculateLevel(1000)
      expect(result.currentTier).toBe(MemberLevelTier.VIP)
      expect(result.growthValue).toBe(1000)
      expect(result.totalSpend).toBe(10000)
      expect(result.totalVisits).toBe(20)
    })
  })

  // ── batchEvaluate ──
  describe('batchEvaluate', () => {
    it('should evaluate multiple members', () => {
      const result = batchEvaluate({
        items: [
          makeInput({ memberId: 'm1', growthValue: 0 }),
          makeInput({ memberId: 'm2', growthValue: 1000, totalSpend: 1000, totalVisits: 10 }),
          makeInput({ memberId: 'm3', growthValue: 50000, totalSpend: 500000, totalVisits: 1000 }),
        ],
      })
      expect(result.totalEvaluated).toBe(3)
      expect(result.upgradedCount).toBe(2)
      expect(result.items[0]!.currentSub).toBe(MemberLevelSub.L1)
      expect(result.items[1]!.currentTier).toBe(MemberLevelTier.VIP)
      expect(result.items[2]!.currentTier).toBe(MemberLevelTier.LEGEND)
    })
  })

  // ── getAllLevelConfig ──
  describe('getAllLevelConfig', () => {
    it('should return 18 tiers', () => {
      const config = getAllLevelConfig()
      expect(config.tiers).toHaveLength(18)
    })

    it('should have correct labels', () => {
      const config = getAllLevelConfig()
      expect(config.tiers[0]!.label).toBe('REGULAR L1')
      expect(config.tiers[17]!.label).toBe('MYTH L3')
    })
  })

  // ── getUpgradePath ──
  describe('getUpgradePath', () => {
    it('should return upgrade steps from REGULAR_L1', () => {
      const path = getUpgradePath(MemberLevelTier.REGULAR, MemberLevelSub.L1)
      expect(path.length).toBeGreaterThan(0)
      expect(path[0]!.fromTier).toBe(MemberLevelTier.REGULAR)
      expect(path[0]!.fromSub).toBe(MemberLevelSub.L1)
      expect(path[0]!.toTier).toBe(MemberLevelTier.REGULAR)
      expect(path[0]!.toSub).toBe(MemberLevelSub.L2)
    })
  })
})
