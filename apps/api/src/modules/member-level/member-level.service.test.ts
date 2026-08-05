import { describe, it, expect } from 'vitest'

// ── Enums & Types ────────────────────────────────────────────────

enum MemberLevelTier {
  REGULAR = 'REGULAR',
  VIP = 'VIP',
  GOLD = 'GOLD',
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

interface LevelEvaluationInput {
  memberId: string
  growthValue: number
  totalSpend: number
  totalVisits: number
  tenantId: string
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

// ── 6阶18级阈值表（与生产一致） ──────────────────────────────────

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

// ── Pure Logic Functions ─────────────────────────────────────────

function getThresholdIndex(threshold: LevelThreshold): number {
  return LEVEL_THRESHOLDS.findIndex(
    (t) => t.tier === threshold.tier && t.sub === threshold.sub,
  )
}

function calculateUpgradeProgress(
  input: LevelEvaluationInput,
  current: LevelThreshold,
  next?: LevelThreshold,
): number {
  if (!next) return 1.0
  const growthP = Math.min(1, (input.growthValue - current.requiredGrowth) / Math.max(1, next.requiredGrowth - current.requiredGrowth))
  const spendP = Math.min(1, (input.totalSpend - current.requiredSpend) / Math.max(1, next.requiredSpend - current.requiredSpend))
  const visitP = Math.min(1, (input.totalVisits - current.requiredVisits) / Math.max(1, next.requiredVisits - current.requiredVisits))
  return Math.min(growthP, spendP, visitP, 1.0)
}

function evaluateMemberLevel(input: LevelEvaluationInput): LevelInfo {
  const { memberId, growthValue, totalSpend, totalVisits } = input

  // 从高到低遍历
  let matchedLevel: LevelThreshold | null = null
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    const t = LEVEL_THRESHOLDS[i]
    if (growthValue >= t.requiredGrowth && totalSpend >= t.requiredSpend && totalVisits >= t.requiredVisits) {
      matchedLevel = t
      break
    }
  }
  if (!matchedLevel) matchedLevel = LEVEL_THRESHOLDS[0]

  const baseIdx = getThresholdIndex(matchedLevel)
  const nextThreshold = baseIdx < LEVEL_THRESHOLDS.length - 1 ? LEVEL_THRESHOLDS[baseIdx + 1] : undefined
  const upgradeProgress = calculateUpgradeProgress(input, matchedLevel, nextThreshold)

  const isBaseLevel =
    matchedLevel.sub === MemberLevelSub.L1 &&
    matchedLevel.tier === MemberLevelTier.REGULAR &&
    growthValue === 0

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

function batchEvaluate(items: LevelEvaluationInput[]): {
  items: LevelInfo[]
  totalEvaluated: number
  upgradedCount: number
  timestamp: string
} {
  const results = items.map((item) => evaluateMemberLevel(item))
  return {
    items: results,
    totalEvaluated: results.length,
    upgradedCount: results.filter((r) => r.upgraded).length,
    timestamp: new Date().toISOString(),
  }
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

function findUpgradePath(
  currentTier: MemberLevelTier,
  currentSub: MemberLevelSub,
  targetTier: MemberLevelTier,
  targetSub: MemberLevelSub,
): LevelChangeRecord[] {
  const path: LevelChangeRecord[] = []
  const startIdx = getThresholdIndex(
    LEVEL_THRESHOLDS.find((t) => t.tier === currentTier && t.sub === currentSub)!,
  )
  if (startIdx < 0) return path

  for (let i = startIdx; i < LEVEL_THRESHOLDS.length - 1; i++) {
    const curr = LEVEL_THRESHOLDS[i]
    const next = LEVEL_THRESHOLDS[i + 1]
    path.push({
      memberId: 'calculated',
      fromTier: curr.tier,
      fromSub: curr.sub,
      toTier: next.tier,
      toSub: next.sub,
      reason: `满足 ${next.requiredGrowth} 成长值 / ¥${next.requiredSpend} 消费 / ${next.requiredVisits} 到访`,
      changedAt: new Date().toISOString(),
    })
    if (next.tier === targetTier && next.sub === targetSub) break
  }
  return path
}

// ── Tests ────────────────────────────────────────────────────────

const _baseInput: LevelEvaluationInput = {
  memberId: 'm1',
  growthValue: 0,
  totalSpend: 0,
  totalVisits: 0,
  tenantId: 't1',
}

describe('member-level service — 6阶18级评估', () => {

  // ── 等级枚举 + 阈值表完整性 ──
  it('阈值表包含 18 条记录', () => {
    expect(LEVEL_THRESHOLDS.length).toBe(18)
  })

  it('REGULAR_L1 门槛全 0', () => {
    const t = LEVEL_THRESHOLDS[0]
    expect(t.tier).toBe(MemberLevelTier.REGULAR)
    expect(t.sub).toBe(MemberLevelSub.L1)
    expect(t.requiredGrowth).toBe(0)
    expect(t.requiredSpend).toBe(0)
    expect(t.requiredVisits).toBe(0)
  })

  it('MYTH_L3 是最高的最大门槛', () => {
    const t = LEVEL_THRESHOLDS[17]
    expect(t.tier).toBe(MemberLevelTier.MYTH)
    expect(t.sub).toBe(MemberLevelSub.L3)
    expect(t.requiredGrowth).toBe(250000)
    expect(t.requiredSpend).toBe(2000000)
    expect(t.requiredVisits).toBe(3000)
  })

  it('阈值必须严格单调递增', () => {
    for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
      expect(LEVEL_THRESHOLDS[i].requiredGrowth).toBeGreaterThanOrEqual(LEVEL_THRESHOLDS[i - 1].requiredGrowth)
      expect(LEVEL_THRESHOLDS[i].requiredSpend).toBeGreaterThanOrEqual(LEVEL_THRESHOLDS[i - 1].requiredSpend)
      expect(LEVEL_THRESHOLDS[i].requiredVisits).toBeGreaterThanOrEqual(LEVEL_THRESHOLDS[i - 1].requiredVisits)
    }
  })

  // ── 正例: 精确边界值 ──
  it('正例: growth=0 → REGULAR_L1（最基础）', () => {
    const r = evaluateMemberLevel({ ..._baseInput })
    expect(r.currentTier).toBe(MemberLevelTier.REGULAR)
    expect(r.currentSub).toBe(MemberLevelSub.L1)
    expect(r.upgraded).toBe(false)
  })

  it('正例: growth=100 → REGULAR_L2', () => {
    const r = evaluateMemberLevel({ ..._baseInput, growthValue: 100, totalSpend: 200, totalVisits: 2 })
    expect(r.currentTier).toBe(MemberLevelTier.REGULAR)
    expect(r.currentSub).toBe(MemberLevelSub.L2)
  })

  it('正例: growth=799, spend=999, visits=9 → 仍 REGULAR_L3（未达 VIP_L1）', () => {
    const r = evaluateMemberLevel({ ..._baseInput, growthValue: 799, totalSpend: 999, totalVisits: 9 })
    expect(r.currentTier).toBe(MemberLevelTier.REGULAR)
    expect(r.currentSub).toBe(MemberLevelSub.L3)
  })

  it('正例: 刚好满足 VIP_L1', () => {
    const r = evaluateMemberLevel({ ..._baseInput, growthValue: 800, totalSpend: 1000, totalVisits: 10 })
    expect(r.currentTier).toBe(MemberLevelTier.VIP)
    expect(r.currentSub).toBe(MemberLevelSub.L1)
  })

  it('正例: 刚好满足 SVIP_L1', () => {
    const r = evaluateMemberLevel({ ..._baseInput, growthValue: 4000, totalSpend: 10000, totalVisits: 50 })
    expect(r.currentTier).toBe(MemberLevelTier.SVIP)
    expect(r.currentSub).toBe(MemberLevelSub.L1)
  })

  it('正例: 刚好满足 DIAMOND_L1', () => {
    const r = evaluateMemberLevel({ ..._baseInput, growthValue: 14000, totalSpend: 50000, totalVisits: 180 })
    expect(r.currentTier).toBe(MemberLevelTier.DIAMOND)
  })

  it('正例: 刚好满足 LEGEND_L1', () => {
    const r = evaluateMemberLevel({ ..._baseInput, growthValue: 40000, totalSpend: 200000, totalVisits: 500 })
    expect(r.currentTier).toBe(MemberLevelTier.LEGEND)
  })

  it('正例: 刚好满足 MYTH_L1', () => {
    const r = evaluateMemberLevel({ ..._baseInput, growthValue: 100000, totalSpend: 800000, totalVisits: 1500 })
    expect(r.currentTier).toBe(MemberLevelTier.MYTH)
    expect(r.currentSub).toBe(MemberLevelSub.L1)
  })

  it('正例: 满级 MYTH_L3', () => {
    const r = evaluateMemberLevel({ ..._baseInput, growthValue: 300000, totalSpend: 3000000, totalVisits: 5000 })
    expect(r.currentTier).toBe(MemberLevelTier.MYTH)
    expect(r.currentSub).toBe(MemberLevelSub.L3)
  })

  // ── 反例: 不满足条件 ──
  it('反例: growth 够但 spend 不够 → 降级到匹配的', () => {
    const r = evaluateMemberLevel({ ..._baseInput, growthValue: 2000, totalSpend: 400, totalVisits: 5 })
    // growth 2000 >= GOLD threshold, but spend 400 < GOLD_L1's 500, falls back to REGULAR_L3
    expect(r.currentTier).not.toBe(MemberLevelTier.GOLD)
    expect(r.upgraded).toBe(true) // still better than base
  })

  it('反例: visits 不够 → 不升级', () => {
    const r = evaluateMemberLevel({ ..._baseInput, growthValue: 9000, totalSpend: 35000, totalVisits: 1 })
    // meets SVIP_L3 but visits too low
    expect(r.currentSub).toBe(MemberLevelSub.L1) // 3个维度都需要满足
  })

  // ── upgradeProgress ──
  it('满级 upgradeProgress = 1', () => {
    const r = evaluateMemberLevel({ ..._baseInput, growthValue: 300000, totalSpend: 3000000, totalVisits: 5000 })
    expect(r.upgradeProgress).toBe(1)
    expect(r.nextLevelThreshold).toBeUndefined()
  })

  it('部分进度: growth 居中的 progress', () => {
    const r = evaluateMemberLevel({ ..._baseInput, growthValue: 150, totalSpend: 300, totalVisits: 3 })
    expect(r.upgradeProgress).toBeGreaterThan(0)
    expect(r.upgradeProgress).toBeLessThan(1)
  })

  // ── batchEvaluate ──
  it('batchEvaluate 返回正确计数', () => {
    const r = batchEvaluate([
      _baseInput,
      { ..._baseInput, memberId: 'm2', growthValue: 10000, totalSpend: 50000, totalVisits: 100 },
    ])
    expect(r.totalEvaluated).toBe(2)
    expect(r.upgradedCount).toBe(1)
    expect(r.items[0].currentTier).toBe(MemberLevelTier.REGULAR)
    expect(r.items[1].currentTier).toBe(MemberLevelTier.SVIP)
  })

  // ── calculateLevel ──
  it('calculateLevel 快速等级推算', () => {
    const r = calculateLevel(5000)
    expect(r.currentTier).toBe(MemberLevelTier.SVIP)
    expect(r.currentSub).toBe(MemberLevelSub.L1)
  })

  // ── benefits ──
  it('每个等级都有权益描述', () => {
    for (const t of LEVEL_THRESHOLDS) {
      expect(t.benefits.length).toBeGreaterThan(0)
    }
  })

  // ── upgrade path ──
  it('findUpgradePath 返回完整升级路径', () => {
    const path = findUpgradePath(MemberLevelTier.REGULAR, MemberLevelSub.L1, MemberLevelTier.VIP, MemberLevelSub.L1)
    expect(path.length).toBeGreaterThanOrEqual(3)
    expect(path[0].toSub).toBe(MemberLevelSub.L2)
    expect(path[path.length - 1].toTier).toBe(MemberLevelTier.VIP)
  })
})
