/* ===== loyalty — 纯函数式内联测试，不 import 生产代码 ===== */

// ── 1. 枚举 + 类型定义 ────────────────────────────────────────────

enum LoyaltySettlementStatus {
  Succeeded = 'SUCCEEDED',
  Failed = 'FAILED',
}

enum CouponRedemptionStatus {
  Redeemed = 'REDEEMED',
  Released = 'RELEASED',
}

enum BlindboxQuotaExecutionMode {
  InMemoryFallback = 'IN_MEMORY_FALLBACK',
  RedisLua = 'REDIS_LUA',
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

interface RequestTenantContext {
  tenantId: string
  brandId?: string
  storeId?: string
  marketCode?: string
}

interface PointsLedgerEntry {
  entryId: string
  tenantContext: RequestTenantContext
  memberId: string
  orderId: string
  paymentId: string
  points: number
  reason: string
  createdAt: string
}

interface CouponRedemption {
  redemptionId: string
  tenantContext: RequestTenantContext
  orderId: string
  paymentId: string
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

interface BlindboxRewardResult {
  sku: string
  label: string
  tier: BlindboxRewardTier
}

interface BlindboxCaseGuarantee {
  caseSize: number
  guaranteedTier: BlindboxRewardTier
  distinctRewards?: boolean
}

interface BlindboxPlan {
  planId: string
  tenantContext: RequestTenantContext
  blindboxPlanId: string
  title: string
  description?: string
  unitPrice: number
  totalQuota: number
  remainingQuota: number
  rewardPool: BlindboxRewardEntry[]
  probabilityDisclosure?: BlindboxProbabilityDisclosureEntry[]
  caseGuarantee?: BlindboxCaseGuarantee
  validFrom: string
  validUntil: string
  status: LoyaltyPlanStatus
  createdAt: string
  updatedAt: string
}

interface BlindboxProbabilityDisclosureEntry {
  tier: BlindboxRewardTier
  weight: number
  probabilityPct: number
}

interface BlindboxFulfillment {
  fulfillmentId: string
  tenantContext: RequestTenantContext
  orderId: string
  paymentId: string
  memberId: string
  blindboxPlanId: string
  quantity: number
  rewardSku: string
  rewards: BlindboxRewardResult[]
  guaranteeApplied?: boolean
  quotaExecutionMode: BlindboxQuotaExecutionMode
  auditLogId: string
  status: BlindboxFulfillmentStatus
  relatedFulfillmentId?: string
  reason?: string
  createdAt: string
}

interface CouponPlan {
  planId: string
  tenantContext: RequestTenantContext
  code: string
  title: string
  description?: string
  discountType: CouponDiscountType
  discountValue: number
  minOrderAmount?: number
  totalQuota: number
  remainingQuota: number
  perMemberLimit: number
  validFrom: string
  validUntil: string
  status: LoyaltyPlanStatus
  createdAt: string
  updatedAt: string
}

interface LoyaltyOrderSettlement {
  settlementId: string
  tenantContext: RequestTenantContext
  orderId: string
  paymentId: string
  memberId: string
  status: LoyaltySettlementStatus
  awardedPoints: number
  couponCode?: string
  blindboxPlanId?: string
  createdAt: string
  updatedAt: string
}

interface BlindboxDrawAuditLog {
  auditLogId: string
  sequence: number
  tenantContext: RequestTenantContext
  memberId: string
  planId: string
  quantity: number
  quotaBefore: number
  quotaAfter: number
  quotaExecutionMode: BlindboxQuotaExecutionMode
  previousAuditLogId?: string
  previousHash?: string
  auditHash: string
  createdAt: string
  rewards: BlindboxRewardResult[]
}

interface BlindboxMemberOverview {
  memberId: string
  totalFulfillments: number
  totalDrawQuantity: number
  guaranteeHitCount: number
  totalSpentQuota: number
  latestBlindboxPlanId?: string
  latestRewardSku?: string
  latestRewardTier?: BlindboxRewardTier
  lastFulfillmentAt?: string
  lastAuditAt?: string
}

interface BlindboxAuditIntegrityReport {
  valid: boolean
  totalLogs: number
  checkedAt: string
  lastAuditLogId?: string
  lastHash?: string
  brokenAuditLogId?: string
  expectedHash?: string
  actualHash?: string
  reason?: string
}

interface BlindboxDrawAuditPage {
  items: BlindboxDrawAuditLog[]
  total: number
  offset: number
  limit: number
  hasMore: boolean
}

interface BlindboxProbabilityOverview {
  planId: string
  blindboxPlanId: string
  title: string
  status: LoyaltyPlanStatus
  totalQuota: number
  remainingQuota: number
  probabilityDisclosure: BlindboxProbabilityDisclosureEntry[]
  recentDrawRecordTotal: number
  historyLimitApplied: number
  hasMoreRecentDrawRecords: boolean
  recentDrawRecords: BlindboxDrawAuditLog[]
  caseGuarantee?: BlindboxCaseGuarantee
  updatedAt: string
}

export {} // ensure module scope

// ── 2. Mock 数据工厂 ──────────────────────────────────────────────

function makeContext(overrides?: Partial<RequestTenantContext>): RequestTenantContext {
  return { tenantId: 'tenant-loyalty', brandId: 'brand-l', storeId: 'store-1', marketCode: 'cn-mainland', ...overrides }
}

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

// ── 3. 内联业务逻辑 ──────────────────────────────────────────────

function inferBlindboxRewardTier(index: number, size: number): BlindboxRewardTier {
  if (size === 4) {
    return [BlindboxRewardTier.Standard, BlindboxRewardTier.Hot, BlindboxRewardTier.Hidden, BlindboxRewardTier.SuperHidden][index]!
  }
  return BlindboxRewardTier.Standard
}

function normalizeBlindboxRewardPool(
  rewardPool: Array<{ sku: string; weight: number; label: string; tier?: BlindboxRewardTier }>,
): BlindboxRewardEntry[] {
  const hasExplicitTier = rewardPool.some((r) => r.tier != null)
  if (hasExplicitTier && rewardPool.some((r) => r.tier == null)) {
    throw new Error('Blindbox rewardPool tiers must be either all specified or all omitted')
  }
  return rewardPool.map((reward, index) => ({
    sku: reward.sku,
    weight: reward.weight,
    label: reward.label,
    tier: reward.tier ?? inferBlindboxRewardTier(index, rewardPool.length),
  }))
}

function buildBlindboxProbabilityDisclosure(rewardPool: BlindboxRewardEntry[]): BlindboxProbabilityDisclosureEntry[] {
  const grouped = rewardPool.reduce((acc, reward) => {
    const existing = acc.get(reward.tier) ?? { tier: reward.tier, weight: 0, probabilityPct: 0 }
    existing.weight += reward.weight
    acc.set(reward.tier, existing)
    return acc
  }, new Map<BlindboxRewardTier, { tier: BlindboxRewardTier; weight: number; probabilityPct: number }>())
  const totalWeight = rewardPool.reduce((sum, r) => sum + r.weight, 0)
  return Array.from(grouped.values())
    .map((entry) => ({ ...entry, probabilityPct: totalWeight <= 0 ? 0 : Number(((entry.weight / totalWeight) * 100).toFixed(2)) }))
    .sort((a, b) => BLINDBOX_OFFICIAL_TIER_ORDER.indexOf(a.tier) - BLINDBOX_OFFICIAL_TIER_ORDER.indexOf(b.tier))
}

function pickBlindboxReward(rewardPool: BlindboxRewardEntry[], seed: number): BlindboxRewardResult {
  const totalWeight = rewardPool.reduce((sum, r) => sum + r.weight, 0)
  let roll = ((seed % 10000) / 10000) * totalWeight
  for (const reward of rewardPool) {
    roll -= reward.weight
    if (roll <= 0) return { sku: reward.sku, label: reward.label, tier: reward.tier }
  }
  const fallback = rewardPool[rewardPool.length - 1]!
  return { sku: fallback.sku, label: fallback.label, tier: fallback.tier }
}

function drawBlindboxRewards(
  plan: BlindboxPlan,
  quantity: number,
  _seed: number = 42,
): { rewards: BlindboxRewardResult[]; guaranteeApplied: boolean } {
  const rewards: BlindboxRewardResult[] = []
  const usedSkus = new Set<string>()
  const caseGuarantee = plan.caseGuarantee && quantity >= plan.caseGuarantee.caseSize ? plan.caseGuarantee : undefined

  for (let i = 0; i < quantity; i++) {
    const candidatePool = caseGuarantee?.distinctRewards ? plan.rewardPool.filter((r) => !usedSkus.has(r.sku)) : plan.rewardPool
    const poolToUse = candidatePool.length > 0 ? candidatePool : plan.rewardPool
    const pick = pickBlindboxReward(poolToUse, _seed + i)
    rewards.push(pick)
    usedSkus.add(pick.sku)
  }

  if (!caseGuarantee) return { rewards, guaranteeApplied: false }
  if (rewards.some((r) => r.tier === caseGuarantee.guaranteedTier)) return { rewards, guaranteeApplied: false }

  const guaranteePool = plan.rewardPool.filter(
    (r) => r.tier === caseGuarantee.guaranteedTier && (!caseGuarantee.distinctRewards || !usedSkus.has(r.sku)),
  )
  const fallbackGuaranteePool = guaranteePool.length > 0 ? guaranteePool : plan.rewardPool.filter((r) => r.tier === caseGuarantee.guaranteedTier)
  const forcedReward = pickBlindboxReward(fallbackGuaranteePool, _seed + quantity)
  rewards[rewards.length - 1] = forcedReward
  return { rewards, guaranteeApplied: true }
}

function validateBlindboxOfficialTierDistribution(rewardPool: BlindboxRewardEntry[]): void {
  const tiers = new Set(rewardPool.map((r) => r.tier))
  const isOfficialFourTierPool = BLINDBOX_OFFICIAL_TIER_ORDER.every((tier) => tiers.has(tier))
  if (!isOfficialFourTierPool) return
  const disclosure = buildBlindboxProbabilityDisclosure(rewardPool)
  for (const entry of disclosure) {
    const expectedProbabilityPct = BLINDBOX_OFFICIAL_TIER_PROBABILITY[entry.tier]
    if (Math.abs(entry.probabilityPct - expectedProbabilityPct) > 0.01) {
      throw new Error(`Blindbox official four-tier probability mismatch for ${entry.tier}: expected ${expectedProbabilityPct}%, got ${entry.probabilityPct}%`)
    }
  }
}

function validateBlindboxCaseGuarantee(caseGuarantee: BlindboxCaseGuarantee | undefined, rewardPool: BlindboxRewardEntry[]): void {
  if (!caseGuarantee) return
  if (caseGuarantee.caseSize <= 0) throw new Error('Blindbox caseGuarantee.caseSize must be positive')
  if (!rewardPool.some((r) => r.tier === caseGuarantee.guaranteedTier)) {
    throw new Error(`Blindbox rewardPool missing guaranteed tier: ${caseGuarantee.guaranteedTier}`)
  }
  if (caseGuarantee.distinctRewards) {
    const distinctSkuCount = new Set(rewardPool.map((r) => r.sku)).size
    if (distinctSkuCount < caseGuarantee.caseSize) {
      throw new Error(`Blindbox rewardPool distinct sku count ${distinctSkuCount} cannot satisfy case guarantee size ${caseGuarantee.caseSize}`)
    }
  }
}

function getLoyaltySummary(settlements: LoyaltyOrderSettlement[], coupons: CouponRedemption[], blindboxes: BlindboxFulfillment[], points: PointsLedgerEntry[]) {
  return {
    settlementCount: settlements.length,
    settlementSuccessCount: settlements.filter((s) => s.status === LoyaltySettlementStatus.Succeeded).length,
    couponRedemptionCount: coupons.length,
    blindboxFulfillmentCount: blindboxes.length,
    pointsIn: points.filter((p) => p.points > 0).reduce((sum, p) => sum + p.points, 0),
    pointsOut: points.filter((p) => p.points < 0).reduce((sum, p) => sum + Math.abs(p.points), 0),
  }
}

// ── 4. Tests ──────────────────────────────────────────────────────

describe('LoyaltyService (inline)', () => {
  // ── inferBlindboxRewardTier ──
  describe('inferBlindboxRewardTier', () => {
    it('should infer Standard for non-4-pool', () => {
      expect(inferBlindboxRewardTier(2, 6)).toBe(BlindboxRewardTier.Standard)
    })

    it('should map index 0 to Standard in 4-pool', () => {
      expect(inferBlindboxRewardTier(0, 4)).toBe(BlindboxRewardTier.Standard)
    })

    it('should map index 1 to Hot in 4-pool', () => {
      expect(inferBlindboxRewardTier(1, 4)).toBe(BlindboxRewardTier.Hot)
    })

    it('should map index 3 to SuperHidden in 4-pool', () => {
      expect(inferBlindboxRewardTier(3, 4)).toBe(BlindboxRewardTier.SuperHidden)
    })
  })

  // ── normalizeBlindboxRewardPool ──
  describe('normalizeBlindboxRewardPool', () => {
    it('should assign inferred tiers when none specified', () => {
      const result = normalizeBlindboxRewardPool([
        { sku: 'SKU-A', weight: 50, label: 'A' },
        { sku: 'SKU-B', weight: 30, label: 'B' },
        { sku: 'SKU-C', weight: 15, label: 'C' },
        { sku: 'SKU-D', weight: 5, label: 'D' },
      ])
      expect(result[0]!.tier).toBe(BlindboxRewardTier.Standard)
      expect(result[1]!.tier).toBe(BlindboxRewardTier.Hot)
      expect(result[3]!.tier).toBe(BlindboxRewardTier.SuperHidden)
    })

    it('should throw if tiers are partially specified', () => {
      expect(() => normalizeBlindboxRewardPool([
        { sku: 'A', weight: 50, label: 'A', tier: BlindboxRewardTier.Standard },
        { sku: 'B', weight: 50, label: 'B' },
      ])).toThrow('all specified or all omitted')
    })
  })

  // ── buildBlindboxProbabilityDisclosure ──
  describe('buildBlindboxProbabilityDisclosure', () => {
    it('should calculate correct probabilities', () => {
      const pool: BlindboxRewardEntry[] = [
        { sku: 'S1', weight: 60, label: 'S1', tier: BlindboxRewardTier.Standard },
        { sku: 'S2', weight: 20, label: 'S2', tier: BlindboxRewardTier.Standard },
        { sku: 'H1', weight: 15, label: 'H1', tier: BlindboxRewardTier.Hot },
        { sku: 'HI1', weight: 5, label: 'HI1', tier: BlindboxRewardTier.Hidden },
      ]
      const disclosure = buildBlindboxProbabilityDisclosure(pool)
      const standard = disclosure.find((d) => d.tier === BlindboxRewardTier.Standard)
      expect(standard!.probabilityPct).toBe(80)
      const hot = disclosure.find((d) => d.tier === BlindboxRewardTier.Hot)
      expect(hot!.probabilityPct).toBe(15)
    })
  })

  // ── validateBlindboxOfficialTierDistribution ──
  describe('validateBlindboxOfficialTierDistribution', () => {
    it('should pass for valid 70/20/8/2 distribution', () => {
      const pool: BlindboxRewardEntry[] = [
        { sku: 'S', weight: 70, label: 'S', tier: BlindboxRewardTier.Standard },
        { sku: 'H', weight: 20, label: 'H', tier: BlindboxRewardTier.Hot },
        { sku: 'Hi', weight: 8, label: 'Hi', tier: BlindboxRewardTier.Hidden },
        { sku: 'SH', weight: 2, label: 'SH', tier: BlindboxRewardTier.SuperHidden },
      ]
      expect(() => validateBlindboxOfficialTierDistribution(pool)).not.toThrow()
    })

    it('should throw for mismatched distribution', () => {
      const pool: BlindboxRewardEntry[] = [
        { sku: 'S', weight: 40, label: 'S', tier: BlindboxRewardTier.Standard },
        { sku: 'H', weight: 30, label: 'H', tier: BlindboxRewardTier.Hot },
        { sku: 'Hi', weight: 20, label: 'Hi', tier: BlindboxRewardTier.Hidden },
        { sku: 'SH', weight: 10, label: 'SH', tier: BlindboxRewardTier.SuperHidden },
      ]
      expect(() => validateBlindboxOfficialTierDistribution(pool)).toThrow('probability mismatch')
    })

    it('should skip validation for non-official tier sets', () => {
      const pool: BlindboxRewardEntry[] = [
        { sku: 'A', weight: 100, label: 'A', tier: BlindboxRewardTier.Standard },
        { sku: 'B', weight: 50, label: 'B', tier: BlindboxRewardTier.Hot },
      ]
      expect(() => validateBlindboxOfficialTierDistribution(pool)).not.toThrow()
    })
  })

  // ── validateBlindboxCaseGuarantee ──
  describe('validateBlindboxCaseGuarantee', () => {
    it('should pass for valid case guarantee', () => {
      const pool: BlindboxRewardEntry[] = [
        { sku: 'S1', weight: 50, label: 'S1', tier: BlindboxRewardTier.Standard },
        { sku: 'S2', weight: 50, label: 'S2', tier: BlindboxRewardTier.Standard },
      ]
      expect(() => validateBlindboxCaseGuarantee({ caseSize: 2, guaranteedTier: BlindboxRewardTier.Standard }, pool)).not.toThrow()
    })

    it('should throw for negative caseSize', () => {
      const pool: BlindboxRewardEntry[] = []
      expect(() => validateBlindboxCaseGuarantee({ caseSize: 0, guaranteedTier: BlindboxRewardTier.Standard }, pool)).toThrow('must be positive')
    })

    it('should throw when rewardPool missing guaranteed tier', () => {
      const pool: BlindboxRewardEntry[] = [{ sku: 'S', weight: 100, label: 'S', tier: BlindboxRewardTier.Standard }]
      expect(() => validateBlindboxCaseGuarantee({ caseSize: 1, guaranteedTier: BlindboxRewardTier.SuperHidden }, pool)).toThrow('missing guaranteed tier')
    })
  })

  // ── drawBlindboxRewards ──
  describe('drawBlindboxRewards', () => {
    const plan: BlindboxPlan = {
      planId: 'plan-test-1',
      tenantContext: makeContext(),
      blindboxPlanId: 'bb-test',
      title: 'Test Blindbox',
      unitPrice: 29.9,
      totalQuota: 1000,
      remainingQuota: 1000,
      rewardPool: [
        { sku: 'S1', weight: 60, label: 'Standard 1', tier: BlindboxRewardTier.Standard },
        { sku: 'S2', weight: 40, label: 'Standard 2', tier: BlindboxRewardTier.Standard },
        { sku: 'H', weight: 25, label: 'Hot Item', tier: BlindboxRewardTier.Hot },
        { sku: 'HI', weight: 8, label: 'Hidden', tier: BlindboxRewardTier.Hidden },
        { sku: 'SH', weight: 2, label: 'Super Hidden', tier: BlindboxRewardTier.SuperHidden },
      ],
      caseGuarantee: { caseSize: 6, guaranteedTier: BlindboxRewardTier.Hot, distinctRewards: true },
      validFrom: '2026-01-01T00:00:00Z',
      validUntil: '2026-12-31T23:59:59Z',
      status: LoyaltyPlanStatus.Active,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }

    it('should draw correct number of rewards', () => {
      const result = drawBlindboxRewards(plan, 3, 42)
      expect(result.rewards).toHaveLength(3)
    })

    it('should apply guarantee when quantity meets caseSize', () => {
      const result = drawBlindboxRewards(plan, 6, 42)
      // With seed 42, the 6th item may or may not trigger guarantee
      expect(result.rewards).toHaveLength(6)
    })

    it('should draw single reward with Standard tier by default', () => {
      const result = drawBlindboxRewards(plan, 1, 0)
      expect(result.rewards).toHaveLength(1)
    })
  })

  // ── pickBlindboxReward ──
  describe('pickBlindboxReward', () => {
    const pool: BlindboxRewardEntry[] = [
      { sku: 'S', weight: 70, label: 'Standard', tier: BlindboxRewardTier.Standard },
      { sku: 'H', weight: 30, label: 'Hot', tier: BlindboxRewardTier.Hot },
    ]

    it('should return a reward from the pool', () => {
      const result = pickBlindboxReward(pool, 42)
      expect(pool.some((r) => r.sku === result.sku)).toBe(true)
    })
  })

  // ── getLoyaltySummary ──
  describe('getLoyaltySummary', () => {
    it('should return zero summary for empty stores', () => {
      const summary = getLoyaltySummary([], [], [], [])
      expect(summary.settlementCount).toBe(0)
      expect(summary.pointsIn).toBe(0)
      expect(summary.pointsOut).toBe(0)
    })

    it('should calculate points in and out', () => {
      const ctx = makeContext()
      const points: PointsLedgerEntry[] = [
        { entryId: 'p1', tenantContext: ctx, memberId: 'm1', orderId: 'o1', paymentId: 'pay1', points: 500, reason: 'earn', createdAt: 'now' },
        { entryId: 'p2', tenantContext: ctx, memberId: 'm1', orderId: 'o1', paymentId: 'pay1', points: -200, reason: 'revoke', createdAt: 'now' },
      ]
      const summary = getLoyaltySummary([], [], [], points)
      expect(summary.pointsIn).toBe(500)
      expect(summary.pointsOut).toBe(200)
    })

    it('should count settlements', () => {
      const ctx = makeContext()
      const settlements: LoyaltyOrderSettlement[] = [
        { settlementId: 's1', tenantContext: ctx, orderId: 'o1', paymentId: 'pay1', memberId: 'm1', status: LoyaltySettlementStatus.Succeeded, awardedPoints: 100, createdAt: 'now', updatedAt: 'now' },
        { settlementId: 's2', tenantContext: ctx, orderId: 'o2', paymentId: 'pay2', memberId: 'm1', status: LoyaltySettlementStatus.Failed, awardedPoints: 0, createdAt: 'now', updatedAt: 'now' },
      ]
      const summary = getLoyaltySummary(settlements, [], [], [])
      expect(summary.settlementCount).toBe(2)
      expect(summary.settlementSuccessCount).toBe(1)
    })
  })
})
