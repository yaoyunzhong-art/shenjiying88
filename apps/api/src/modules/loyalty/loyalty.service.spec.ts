import { describe, it, expect } from 'vitest'

// ── Enums & Types ────────────────────────────────────────────────

enum LoyaltySettlementStatus {
  Succeeded = 'SUCCEEDED',
  Failed = 'FAILED',
}

enum CouponRedemptionStatus {
  Redeemed = 'REDEEMED',
  Released = 'RELEASED',
}

enum BlindboxFulfillmentStatus {
  Fulfilled = 'FULFILLED',
  Skipped = 'SKIPPED',
  Revoked = 'REVOKED',
}

enum BlindboxRewardTier {
  Standard = 'STANDARD',
  Hot = 'HOT',
  Hidden = 'HIDDEN',
  SuperHidden = 'SUPER_HIDDEN',
}

enum CouponDiscountType {
  FixedAmount = 'FIXED_AMOUNT',
  Percentage = 'PERCENTAGE',
}

enum LoyaltyPlanStatus {
  Draft = 'DRAFT',
  Active = 'ACTIVE',
  Paused = 'PAUSED',
  Expired = 'EXPIRED',
}

interface TenantContext {
  tenantId: string
  brandId?: string
  storeId?: string
  marketCode?: string
}

interface PointsLedgerEntry {
  entryId: string
  tenantId: string
  memberId: string
  orderId: string
  points: number
  reason: string
  createdAt: string
}

interface CouponPlan {
  planId: string
  tenantId: string
  code: string
  title: string
  discountType: CouponDiscountType
  discountValue: number
  totalQuota: number
  remainingQuota: number
  perMemberLimit: number
  status: LoyaltyPlanStatus
  validFrom: string
  validUntil: string
  createdAt: string
  updatedAt: string
}

interface CouponRedemption {
  redemptionId: string
  tenantId: string
  orderId: string
  memberId: string
  couponCode: string
  status: CouponRedemptionStatus
  createdAt: string
}

interface BlindboxRewardEntry {
  sku: string
  weight: number
  label: string
  tier: BlindboxRewardTier
}

interface BlindboxPlan {
  planId: string
  tenantId: string
  blindboxPlanId: string
  title: string
  unitPrice: number
  totalQuota: number
  remainingQuota: number
  rewardPool: BlindboxRewardEntry[]
  status: LoyaltyPlanStatus
  validFrom: string
  validUntil: string
  createdAt: string
  updatedAt: string
}

interface LoyaltyOrderSettlement {
  settlementId: string
  tenantId: string
  orderId: string
  memberId: string
  status: LoyaltySettlementStatus
  awardedPoints: number
  couponCode?: string
  blindboxPlanId?: string
  createdAt: string
  updatedAt: string
}

interface SettlementInput {
  tenantId: string
  memberId: string
  orderId: string
  amount: number
  couponCode?: string
  blindboxPlanId?: string
  blindboxQuantity?: number
}

// ── In-memory Stores ─────────────────────────────────────────────

const pointsStore = new Map<string, PointsLedgerEntry>()
const couponRedemptionStore = new Map<string, CouponRedemption>()
const couponPlanStore = new Map<string, CouponPlan>()
const settlementStore = new Map<string, LoyaltyOrderSettlement>()

function resetStores(): void {
  pointsStore.clear()
  couponRedemptionStore.clear()
  couponPlanStore.clear()
  settlementStore.clear()
}

// ── Pure Logic Functions ─────────────────────────────────────────

function uuid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function nowISO(): string {
  return new Date().toISOString()
}

function settlePaidOrder(input: SettlementInput): LoyaltyOrderSettlement {
  const existing = settlementStore.get(input.orderId)
  if (existing?.status === LoyaltySettlementStatus.Succeeded) return existing

  const now = nowISO()
  const awardedPoints = Math.max(1, Math.floor(input.amount))

  // points ledger
  const entry: PointsLedgerEntry = {
    entryId: `points-${uuid()}`,
    tenantId: input.tenantId,
    memberId: input.memberId,
    orderId: input.orderId,
    points: awardedPoints,
    reason: 'cashier.payment-succeeded',
    createdAt: now,
  }
  pointsStore.set(entry.entryId, entry)

  // coupon redemption
  if (input.couponCode) {
    const redemption: CouponRedemption = {
      redemptionId: `coupon-${uuid()}`,
      tenantId: input.tenantId,
      orderId: input.orderId,
      memberId: input.memberId,
      couponCode: input.couponCode,
      status: CouponRedemptionStatus.Redeemed,
      createdAt: now,
    }
    couponRedemptionStore.set(redemption.redemptionId, redemption)
  }

  const settlement: LoyaltyOrderSettlement = {
    settlementId: existing?.settlementId ?? `settlement-${uuid()}`,
    tenantId: input.tenantId,
    orderId: input.orderId,
    memberId: input.memberId,
    status: LoyaltySettlementStatus.Succeeded,
    awardedPoints,
    couponCode: input.couponCode,
    blindboxPlanId: input.blindboxPlanId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  settlementStore.set(input.orderId, settlement)
  return settlement
}

function settleFailedOrder(input: SettlementInput): LoyaltyOrderSettlement {
  const now = nowISO()
  if (input.couponCode) {
    const redemption: CouponRedemption = {
      redemptionId: `coupon-${uuid()}`,
      tenantId: input.tenantId,
      orderId: input.orderId,
      memberId: input.memberId,
      couponCode: input.couponCode,
      status: CouponRedemptionStatus.Released,
      createdAt: now,
    }
    couponRedemptionStore.set(redemption.redemptionId, redemption)
  }

  const settlement: LoyaltyOrderSettlement = {
    settlementId: `settlement-${uuid()}`,
    tenantId: input.tenantId,
    orderId: input.orderId,
    memberId: input.memberId,
    status: LoyaltySettlementStatus.Failed,
    awardedPoints: 0,
    couponCode: input.couponCode,
    blindboxPlanId: input.blindboxPlanId,
    createdAt: now,
    updatedAt: now,
  }
  settlementStore.set(input.orderId, settlement)
  return settlement
}

function applyRefund(
  orderId: string,
  tenantId: string,
  refundAmount: number,
): { reversedPoints: number; releasedCoupon: boolean } {
  if (refundAmount <= 0) return { reversedPoints: 0, releasedCoupon: false }

  const settlement = settlementStore.get(orderId)
  if (!settlement || settlement.status !== LoyaltySettlementStatus.Succeeded) {
    return { reversedPoints: 0, releasedCoupon: false }
  }

  const alreadyReversed = Array.from(pointsStore.values())
    .filter((e) => e.orderId === orderId && e.points < 0)
    .reduce((sum, e) => sum + Math.abs(e.points), 0)
  const available = Math.max(0, settlement.awardedPoints - alreadyReversed)
  const rollbackPoints = Math.min(available, Math.max(0, Math.floor(refundAmount)))

  if (rollbackPoints > 0) {
    const entry: PointsLedgerEntry = {
      entryId: `points-${uuid()}`,
      tenantId,
      memberId: settlement.memberId,
      orderId,
      points: -rollbackPoints,
      reason: 'transaction.refund-completed',
      createdAt: nowISO(),
    }
    pointsStore.set(entry.entryId, entry)
  }

  const alreadyReleased = Array.from(couponRedemptionStore.values()).some(
    (r) => r.tenantId === tenantId && r.orderId === orderId && r.status === CouponRedemptionStatus.Released,
  )
  let releasedCoupon = false
  if (settlement.couponCode && !alreadyReleased) {
    const redemption: CouponRedemption = {
      redemptionId: `coupon-${uuid()}`,
      tenantId,
      orderId,
      memberId: settlement.memberId,
      couponCode: settlement.couponCode,
      status: CouponRedemptionStatus.Released,
      createdAt: nowISO(),
    }
    couponRedemptionStore.set(redemption.redemptionId, redemption)
    releasedCoupon = true
  }

  return { reversedPoints: rollbackPoints, releasedCoupon }
}

// ── Coupon Plan ──────────────────────────────────────────────────

function registerCouponPlan(input: {
  tenantId: string
  code: string
  title: string
  discountType: CouponDiscountType
  discountValue: number
  totalQuota: number
  perMemberLimit: number
}): CouponPlan {
  if (input.discountValue <= 0) throw new Error('Coupon discountValue must be positive')
  if (input.totalQuota <= 0) throw new Error('Coupon totalQuota must be positive')
  if (input.perMemberLimit <= 0) throw new Error('Coupon perMemberLimit must be positive')
  if (input.discountType === CouponDiscountType.Percentage && input.discountValue > 100) {
    throw new Error('Percentage discount cannot exceed 100')
  }
  const plan: CouponPlan = {
    planId: `coupon-plan-${uuid()}`,
    tenantId: input.tenantId,
    code: input.code,
    title: input.title,
    discountType: input.discountType,
    discountValue: input.discountValue,
    totalQuota: input.totalQuota,
    remainingQuota: input.totalQuota,
    perMemberLimit: input.perMemberLimit,
    status: LoyaltyPlanStatus.Draft,
    validFrom: nowISO(),
    validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  }
  couponPlanStore.set(plan.planId, plan)
  return plan
}

function activateCouponPlan(planId: string, tenantId: string): CouponPlan {
  const plan = couponPlanStore.get(planId)
  if (!plan || plan.tenantId !== tenantId) throw new Error(`Coupon plan not found: ${planId}`)
  plan.status = LoyaltyPlanStatus.Active
  plan.updatedAt = nowISO()
  return plan
}

function issueCouponFromPlan(
  planId: string,
  tenantId: string,
  memberId: string,
): CouponRedemption {
  const plan = couponPlanStore.get(planId)
  if (!plan || plan.tenantId !== tenantId) throw new Error(`Coupon plan not found: ${planId}`)
  if (plan.status !== LoyaltyPlanStatus.Active) throw new Error(`Coupon plan is not active: ${planId}`)
  if (plan.remainingQuota <= 0) throw new Error(`Coupon plan quota exhausted: ${planId}`)

  const memberRedemptionCount = Array.from(couponRedemptionStore.values()).filter(
    (r) => r.tenantId === tenantId && r.memberId === memberId && r.couponCode === plan.code,
  ).length
  if (memberRedemptionCount >= plan.perMemberLimit) {
    throw new Error(`Member has reached per-member limit: ${planId}`)
  }

  plan.remainingQuota -= 1
  const redemption: CouponRedemption = {
    redemptionId: `coupon-${uuid()}`,
    tenantId,
    orderId: `pending-${memberId}-${plan.code}`,
    memberId,
    couponCode: plan.code,
    status: CouponRedemptionStatus.Redeemed,
    createdAt: nowISO(),
  }
  couponRedemptionStore.set(redemption.redemptionId, redemption)
  return redemption
}

function listSettlements(tenantId: string): LoyaltyOrderSettlement[] {
  return Array.from(settlementStore.values()).filter((s) => s.tenantId === tenantId)
}

function getLoyaltySummary(tenantId: string): {
  settlementCount: number
  settlementSuccessCount: number
  couponRedemptionCount: number
  pointsIn: number
  pointsOut: number
} {
  const settlements = listSettlements(tenantId)
  const coupons = Array.from(couponRedemptionStore.values()).filter((r) => r.tenantId === tenantId)
  const points = Array.from(pointsStore.values()).filter((p) => p.tenantId === tenantId)
  return {
    settlementCount: settlements.length,
    settlementSuccessCount: settlements.filter((s) => s.status === LoyaltySettlementStatus.Succeeded).length,
    couponRedemptionCount: coupons.length,
    pointsIn: points.filter((p) => p.points > 0).reduce((sum, p) => sum + p.points, 0),
    pointsOut: points.filter((p) => p.points < 0).reduce((sum, p) => sum + Math.abs(p.points), 0),
  }
}

// ── Blindbox: probability disclosure ─────────────────────────────

const BLINDBOX_OFFICIAL_TIER_ORDER: BlindboxRewardTier[] = [
  BlindboxRewardTier.Standard,
  BlindboxRewardTier.Hot,
  BlindboxRewardTier.Hidden,
  BlindboxRewardTier.SuperHidden,
]

const BLINDBOX_OFFICIAL_TIER_PROBABILITY: Record<BlindboxRewardTier, number> = {
  [BlindboxRewardTier.Standard]: 70,
  [BlindboxRewardTier.Hot]: 20,
  [BlindboxRewardTier.Hidden]: 8,
  [BlindboxRewardTier.SuperHidden]: 2,
}

function buildProbabilityDisclosure(rewardPool: BlindboxRewardEntry[]): Array<{ tier: BlindboxRewardTier; weight: number; probabilityPct: number }> {
  const grouped = rewardPool.reduce(
    (acc, reward) => {
      const existing = acc.get(reward.tier) ?? { tier: reward.tier, weight: 0, probabilityPct: 0 }
      existing.weight += reward.weight
      acc.set(reward.tier, existing)
      return acc
    },
    new Map<BlindboxRewardTier, { tier: BlindboxRewardTier; weight: number; probabilityPct: number }>(),
  )
  const totalWeight = rewardPool.reduce((sum, r) => sum + r.weight, 0)
  return Array.from(grouped.values())
    .map((entry) => ({
      ...entry,
      probabilityPct: totalWeight <= 0 ? 0 : Number(((entry.weight / totalWeight) * 100).toFixed(2)),
    }))
    .sort((a, b) => BLINDBOX_OFFICIAL_TIER_ORDER.indexOf(a.tier) - BLINDBOX_OFFICIAL_TIER_ORDER.indexOf(b.tier))
}

function validateOfficialTierDistribution(rewardPool: BlindboxRewardEntry[]): void {
  const tiers = new Set(rewardPool.map((r) => r.tier))
  const isOfficial = BLINDBOX_OFFICIAL_TIER_ORDER.every((t) => tiers.has(t))
  if (!isOfficial) return

  const disclosure = buildProbabilityDisclosure(rewardPool)
  for (const entry of disclosure) {
    const expected = BLINDBOX_OFFICIAL_TIER_PROBABILITY[entry.tier]
    if (Math.abs(entry.probabilityPct - expected) > 0.01) {
      throw new Error(
        `Blindbox official four-tier probability mismatch for ${entry.tier}: expected ${expected}%, got ${entry.probabilityPct}%`,
      )
    }
  }
}

function pickRewardFromPool(rewardPool: BlindboxRewardEntry[]): { sku: string; label: string; tier: BlindboxRewardTier } {
  const totalWeight = rewardPool.reduce((sum, r) => sum + r.weight, 0)
  let roll = Math.random() * totalWeight
  for (const reward of rewardPool) {
    roll -= reward.weight
    if (roll <= 0) {
      return { sku: reward.sku, label: reward.label, tier: reward.tier }
    }
  }
  const fallback = rewardPool[rewardPool.length - 1]!
  return { sku: fallback.sku, label: fallback.label, tier: fallback.tier }
}

// ── Tests ────────────────────────────────────────────────────────

describe('loyalty service', () => {
  beforeEach(() => {
    resetStores()
  })

  // ── Order Settlement ──
  it('settlePaidOrder 成功后返回包含积分的 settlement', () => {
    const r = settlePaidOrder({ tenantId: 't1', memberId: 'm1', orderId: 'o1', amount: 500 })
    expect(r.status).toBe(LoyaltySettlementStatus.Succeeded)
    expect(r.awardedPoints).toBe(500)
    expect(r.orderId).toBe('o1')
  })

  it('settlePaidOrder 金额<1 时至少给 1 积分', () => {
    const r = settlePaidOrder({ tenantId: 't1', memberId: 'm1', orderId: 'o2', amount: 0 })
    expect(r.awardedPoints).toBe(1)
  })

  it('settlePaidOrder 重复调用返回相同 settlement', () => {
    const r1 = settlePaidOrder({ tenantId: 't1', memberId: 'm1', orderId: 'o3', amount: 100 })
    const r2 = settlePaidOrder({ tenantId: 't1', memberId: 'm1', orderId: 'o3', amount: 200 })
    expect(r2.awardedPoints).toBe(100)
  })

  it('settlePaidOrder 带 coupon 记录 redemption', () => {
    settlePaidOrder({ tenantId: 't1', memberId: 'm1', orderId: 'o4', amount: 100, couponCode: 'WELCOME' })
    const redemptions = Array.from(couponRedemptionStore.values()).filter((r) => r.orderId === 'o4')
    expect(redemptions.length).toBe(1)
    expect(redemptions[0].couponCode).toBe('WELCOME')
    expect(redemptions[0].status).toBe(CouponRedemptionStatus.Redeemed)
  })

  it('settleFailedOrder 释放 coupon', () => {
    settleFailedOrder({ tenantId: 't1', memberId: 'm1', orderId: 'o5', amount: 100, couponCode: 'WELCOME' })
    const rs = Array.from(couponRedemptionStore.values()).filter((r) => r.orderId === 'o5')
    expect(rs.length).toBe(1)
    expect(rs[0].status).toBe(CouponRedemptionStatus.Released)
  })

  it('settleFailedOrder 积分 = 0', () => {
    const r = settleFailedOrder({ tenantId: 't1', memberId: 'm1', orderId: 'o6', amount: 500 })
    expect(r.awardedPoints).toBe(0)
    expect(r.status).toBe(LoyaltySettlementStatus.Failed)
  })

  // ── Refund ──
  it('退款退回积分不超过已授予', () => {
    settlePaidOrder({ tenantId: 't1', memberId: 'm1', orderId: 'r1', amount: 100 })
    const result = applyRefund('r1', 't1', 50)
    expect(result.reversedPoints).toBe(50)
  })

  it('refundAmount <= 0 时直接返回空', () => {
    const result = applyRefund('r2', 't1', 0)
    expect(result.reversedPoints).toBe(0)
    expect(result.releasedCoupon).toBe(false)
  })

  it('退款时释放 coupon', () => {
    settlePaidOrder({ tenantId: 't1', memberId: 'm1', orderId: 'r3', amount: 100, couponCode: 'PROMO' })
    const result = applyRefund('r3', 't1', 100)
    expect(result.releasedCoupon).toBe(true)
  })

  it('退款不重复释放 coupon', () => {
    settlePaidOrder({ tenantId: 't1', memberId: 'm1', orderId: 'r4', amount: 100, couponCode: 'DEAL' })
    applyRefund('r4', 't1', 50)
    const result2 = applyRefund('r4', 't1', 50)
    expect(result2.releasedCoupon).toBe(false)
  })

  // ── Coupon Plan ──
  it('registerCouponPlan 创建 Draft 状态', () => {
    const p = registerCouponPlan({ tenantId: 't1', code: 'WELCOME', title: '欢迎券', discountType: CouponDiscountType.FixedAmount, discountValue: 10, totalQuota: 100, perMemberLimit: 1 })
    expect(p.status).toBe(LoyaltyPlanStatus.Draft)
    expect(p.totalQuota).toBe(100)
    expect(p.remainingQuota).toBe(100)
  })

  it('Percentage 超过 100 抛错', () => {
    expect(() =>
      registerCouponPlan({ tenantId: 't1', code: 'BAD', title: '无效', discountType: CouponDiscountType.Percentage, discountValue: 200, totalQuota: 10, perMemberLimit: 1 }),
    ).toThrow(/exceed 100/)
  })

  it('discountValue <= 0 抛错', () => {
    expect(() =>
      registerCouponPlan({ tenantId: 't1', code: 'ZERO', title: '零', discountType: CouponDiscountType.FixedAmount, discountValue: 0, totalQuota: 10, perMemberLimit: 1 }),
    ).toThrow(/must be positive/)
  })

  it('activateCouponPlan 后可以发券', () => {
    const p = registerCouponPlan({ tenantId: 't1', code: 'ACTIVE-OK', title: '有效券', discountType: CouponDiscountType.FixedAmount, discountValue: 10, totalQuota: 10, perMemberLimit: 1 })
    activateCouponPlan(p.planId, 't1')
    const r = issueCouponFromPlan(p.planId, 't1', 'm1')
    expect(r.status).toBe(CouponRedemptionStatus.Redeemed)
  })

  it('Draft 状态的券计划发券失败', () => {
    const p = registerCouponPlan({ tenantId: 't1', code: 'DRAFT', title: '草稿', discountType: CouponDiscountType.FixedAmount, discountValue: 10, totalQuota: 10, perMemberLimit: 1 })
    expect(() => issueCouponFromPlan(p.planId, 't1', 'm1')).toThrow(/not active/)
  })

  it('quota 用完后发券失败', () => {
    const p = registerCouponPlan({ tenantId: 't1', code: 'LIMIT', title: '限量', discountType: CouponDiscountType.FixedAmount, discountValue: 10, totalQuota: 1, perMemberLimit: 1 })
    activateCouponPlan(p.planId, 't1')
    issueCouponFromPlan(p.planId, 't1', 'm1')
    expect(() => issueCouponFromPlan(p.planId, 't1', 'm2')).toThrow(/quota exhausted/)
  })

  it('perMemberLimit 防止同一会员多次领取', () => {
    const p = registerCouponPlan({ tenantId: 't1', code: 'PER', title: '每人1张', discountType: CouponDiscountType.FixedAmount, discountValue: 10, totalQuota: 10, perMemberLimit: 1 })
    activateCouponPlan(p.planId, 't1')
    issueCouponFromPlan(p.planId, 't1', 'm1')
    expect(() => issueCouponFromPlan(p.planId, 't1', 'm1')).toThrow(/reached per-member/)
  })

  // ── Loyalty Summary ──
  it('getLoyaltySummary 汇报各维度统计', () => {
    settlePaidOrder({ tenantId: 't1', memberId: 'm1', orderId: 's1', amount: 200 })
    settlePaidOrder({ tenantId: 't1', memberId: 'm1', orderId: 's2', amount: 300 })
    settleFailedOrder({ tenantId: 't1', memberId: 'm1', orderId: 's3', amount: 100 })
    const summary = getLoyaltySummary('t1')
    expect(summary.settlementCount).toBe(3)
    expect(summary.settlementSuccessCount).toBe(2)
    expect(summary.pointsIn).toBe(500) // 200 + 300
  })

  // ── Blindbox Probability ──
  it('buildProbabilityDisclosure 按官方 tier 顺序排序', () => {
    const pool: BlindboxRewardEntry[] = [
      { sku: 'a', weight: 10, label: 'Common', tier: BlindboxRewardTier.Standard },
      { sku: 'b', weight: 5, label: 'Rare', tier: BlindboxRewardTier.Hidden },
      { sku: 'c', weight: 3, label: 'Hot', tier: BlindboxRewardTier.Hot },
    ]
    const d = buildProbabilityDisclosure(pool)
    expect(d[0].tier).toBe(BlindboxRewardTier.Standard)
    expect(d[1].tier).toBe(BlindboxRewardTier.Hot)
    expect(d[2].tier).toBe(BlindboxRewardTier.Hidden)
  })

  it('官方四 tier 校验：总和必须匹配 70/20/8/2', () => {
    const pool: BlindboxRewardEntry[] = [
      { sku: 's1', weight: 70, label: 'S', tier: BlindboxRewardTier.Standard },
      { sku: 'h1', weight: 20, label: 'H', tier: BlindboxRewardTier.Hot },
      { sku: 'hd1', weight: 8, label: 'HD', tier: BlindboxRewardTier.Hidden },
      { sku: 'sh1', weight: 2, label: 'SH', tier: BlindboxRewardTier.SuperHidden },
    ]
    expect(() => validateOfficialTierDistribution(pool)).not.toThrow()
  })

  it('官方四 tier 概率不匹配时抛错', () => {
    const pool: BlindboxRewardEntry[] = [
      { sku: 's1', weight: 80, label: 'S', tier: BlindboxRewardTier.Standard },
      { sku: 'h1', weight: 10, label: 'H', tier: BlindboxRewardTier.Hot },
      { sku: 'hd1', weight: 8, label: 'HD', tier: BlindboxRewardTier.Hidden },
      { sku: 'sh1', weight: 2, label: 'SH', tier: BlindboxRewardTier.SuperHidden },
    ]
    expect(() => validateOfficialTierDistribution(pool)).toThrow(/probability mismatch/)
  })

  it('非四 tier 池不作官方概率校验', () => {
    const pool: BlindboxRewardEntry[] = [
      { sku: 'x', weight: 50, label: 'X', tier: BlindboxRewardTier.Standard },
      { sku: 'y', weight: 50, label: 'Y', tier: BlindboxRewardTier.Hot },
    ]
    expect(() => validateOfficialTierDistribution(pool)).not.toThrow()
  })

  it('pickRewardFromPool 每次返回池中奖品', () => {
    const pool: BlindboxRewardEntry[] = [
      { sku: 'a', weight: 1, label: 'A', tier: BlindboxRewardTier.Standard },
      { sku: 'b', weight: 1, label: 'B', tier: BlindboxRewardTier.Standard },
    ]
    for (let i = 0; i < 100; i++) {
      const pick = pickRewardFromPool(pool)
      expect(pick.sku).toMatch(/^[ab]$/)
    }
  })

  it('单奖品池 100% 返回该奖品', () => {
    const pool: BlindboxRewardEntry[] = [
      { sku: 'only', weight: 1, label: 'Only', tier: BlindboxRewardTier.Standard },
    ]
    for (let i = 0; i < 20; i++) {
      expect(pickRewardFromPool(pool).sku).toBe('only')
    }
  })
})
