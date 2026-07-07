import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Loyalty Simulator Test
 *
 * 模拟忠诚度系统的场景覆盖：
 * - 积分台账录入与查询
 * - 优惠券方案管理（注册、激活、停用、过期）
 * - 盲盒方案管理（注册、激活、发放）
 * - 优惠券核销与释放
 * - 盲盒履约（发放、跳过、撤销）
 * - 订单结算积分发放
 * - 多租户数据隔离
 * - 方案配额耗尽
 * - 会员限领
 *
 * 8 角色视角覆盖：
 *  👔店长 - 查看全店积分与优惠券使用情况
 *  🛒前台 - 收银时发放优惠券/盲盒
 *  👥HR - 检查积分制度合规性
 *  🔧安监 - 审计优惠券/盲盒发放记录
 *  🎮导玩员 - 为会员激活盲盒游玩
 *  🎯运行专员 - 监控方案配额余量
 *  🤝团建 - 批量发放团建优惠券
 *  📢营销 - 创建和管理营销活动方案
 */

import assert from 'node:assert/strict'

// ─── Type mirrors (from loyalty.entity.ts) ───

enum SimCouponDiscountType {
  FixedAmount = 'FIXED_AMOUNT',
  Percentage = 'PERCENTAGE'
}

enum SimCouponRedemptionStatus {
  Redeemed = 'REDEEMED',
  Released = 'RELEASED'
}

enum SimBlindboxFulfillmentStatus {
  Fulfilled = 'FULFILLED',
  Skipped = 'SKIPPED',
  Revoked = 'REVOKED'
}

enum SimLoyaltyPlanStatus {
  Draft = 'DRAFT',
  Active = 'ACTIVE',
  Paused = 'PAUSED',
  Expired = 'EXPIRED'
}

enum SimLoyaltySettlementStatus {
  Succeeded = 'SUCCEEDED',
  Failed = 'FAILED'
}

interface SimTenantContext {
  tenantId: string
  brandId?: string
  storeId?: string
  marketCode?: string
}

interface SimCouponPlan {
  planId: string
  tenantId: string
  code: string
  title: string
  description?: string
  discountType: SimCouponDiscountType
  discountValue: number
  minOrderAmount?: number
  totalQuota: number
  remainingQuota: number
  perMemberLimit: number
  validFrom: string
  validUntil: string
  status: SimLoyaltyPlanStatus
  createdAt: string
  updatedAt: string
}

interface SimBlindboxPlan {
  planId: string
  tenantId: string
  blindboxPlanId: string
  title: string
  description?: string
  unitPrice: number
  totalQuota: number
  remainingQuota: number
  rewardPool: Array<{ sku: string; weight: number; label: string }>
  validFrom: string
  validUntil: string
  status: SimLoyaltyPlanStatus
  createdAt: string
  updatedAt: string
}

interface SimPointsLedgerEntry {
  entryId: string
  tenantId: string
  memberId: string
  orderId: string
  points: number
  reason: string
  createdAt: string
}

interface SimCouponRedemption {
  redemptionId: string
  tenantId: string
  memberId: string
  orderId: string
  couponCode: string
  planId: string
  status: SimCouponRedemptionStatus
  createdAt: string
}

interface SimBlindboxFulfillment {
  fulfillmentId: string
  tenantId: string
  memberId: string
  orderId: string
  blindboxPlanId: string
  quantity: number
  rewardSku: string
  status: SimBlindboxFulfillmentStatus
  reason?: string
  relatedFulfillmentId?: string
  createdAt: string
}

interface SimLoyaltySettlement {
  settlementId: string
  tenantId: string
  memberId: string
  orderId: string
  status: SimLoyaltySettlementStatus
  awardedPoints: number
  couponCode?: string
  blindboxPlanId?: string
  createdAt: string
  updatedAt: string
}

// ─── Simulator store (in-memory) ───

class SimLoyaltySimulator {
  private couponPlans = new Map<string, SimCouponPlan>()
  private blindboxPlans = new Map<string, SimBlindboxPlan>()
  private pointsLedger = new Map<string, SimPointsLedgerEntry>()
  private couponRedemptions = new Map<string, SimCouponRedemption>()
  private blindboxFulfillments = new Map<string, SimBlindboxFulfillment>()
  private settlements = new Map<string, SimLoyaltySettlement>()
  private memberIssueCount = new Map<string, number>() // key: tenantId:planId:memberId
  private nextSeq = 1

  private id(prefix: string): string {
    return `${prefix}-${this.nextSeq++}`
  }
  private iso(): string {
    return new Date().toISOString()
  }
  private tenantKey(tenantId: string, ...rest: string[]): string {
    return [tenantId, ...rest].join(':')
  }

  // ── Coupon Plan CRUD ──

  registerCouponPlan(tenantId: string, input: {
    code: string; title: string; description?: string
    discountType: SimCouponDiscountType; discountValue: number
    minOrderAmount?: number; totalQuota: number; perMemberLimit: number
    validFrom: string; validUntil: string
  }): SimCouponPlan {
    const now = this.iso()
    const plan: SimCouponPlan = {
      planId: this.id('cp'),
      tenantId,
      code: input.code,
      title: input.title,
      description: input.description,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrderAmount: input.minOrderAmount,
      totalQuota: input.totalQuota,
      remainingQuota: input.totalQuota,
      perMemberLimit: input.perMemberLimit,
      validFrom: input.validFrom,
      validUntil: input.validUntil,
      status: SimLoyaltyPlanStatus.Draft,
      createdAt: now,
      updatedAt: now
    }
    this.couponPlans.set(plan.planId, plan)
    return { ...plan }
  }

  listCouponPlans(tenantId: string): SimCouponPlan[] {
    return Array.from(this.couponPlans.values())
      .filter((p) => p.tenantId === tenantId)
      .map((p) => ({ ...p }))
  }

  getCouponPlan(planId: string, tenantId: string): SimCouponPlan | undefined {
    const plan = this.couponPlans.get(planId)
    if (!plan || plan.tenantId !== tenantId) return undefined
    return { ...plan }
  }

  updateCouponPlanStatus(planId: string, status: SimLoyaltyPlanStatus, tenantId: string): SimCouponPlan {
    const plan = this.couponPlans.get(planId)
    if (!plan || plan.tenantId !== tenantId) throw new Error(`Coupon plan ${planId} not found`)
    plan.status = status
    plan.updatedAt = this.iso()
    return { ...plan }
  }

  // ── Blindbox Plan CRUD ──

  registerBlindboxPlan(tenantId: string, input: {
    blindboxPlanId: string; title: string; description?: string
    unitPrice: number; totalQuota: number; rewardPool: Array<{ sku: string; weight: number; label: string }>
    validFrom: string; validUntil: string
  }): SimBlindboxPlan {
    const now = this.iso()
    const plan: SimBlindboxPlan = {
      planId: this.id('bbp'),
      tenantId,
      blindboxPlanId: input.blindboxPlanId,
      title: input.title,
      description: input.description,
      unitPrice: input.unitPrice,
      totalQuota: input.totalQuota,
      remainingQuota: input.totalQuota,
      rewardPool: [...input.rewardPool],
      validFrom: input.validFrom,
      validUntil: input.validUntil,
      status: SimLoyaltyPlanStatus.Draft,
      createdAt: now,
      updatedAt: now
    }
    this.blindboxPlans.set(plan.planId, plan)
    return { ...plan }
  }

  listBlindboxPlans(tenantId: string): SimBlindboxPlan[] {
    return Array.from(this.blindboxPlans.values())
      .filter((p) => p.tenantId === tenantId)
      .map((p) => ({ ...p }))
  }

  getBlindboxPlan(planId: string, tenantId: string): SimBlindboxPlan | undefined {
    const plan = this.blindboxPlans.get(planId)
    if (!plan || plan.tenantId !== tenantId) return undefined
    return { ...plan }
  }

  updateBlindboxPlanStatus(planId: string, status: SimLoyaltyPlanStatus, tenantId: string): SimBlindboxPlan {
    const plan = this.blindboxPlans.get(planId)
    if (!plan || plan.tenantId !== tenantId) throw new Error(`Blindbox plan ${planId} not found`)
    plan.status = status
    plan.updatedAt = this.iso()
    return { ...plan }
  }

  // ── Coupon Issuance ──

  issueCouponFromPlan(tenantId: string, memberId: string, planId: string): SimCouponRedemption {
    const plan = this.couponPlans.get(planId)
    if (!plan || plan.tenantId !== tenantId) throw new Error(`Coupon plan ${planId} not found`)
    if (plan.status !== SimLoyaltyPlanStatus.Active) throw new Error(`Coupon plan ${planId} is not active (status: ${plan.status})`)
    if (plan.remainingQuota <= 0) throw new Error(`Coupon plan ${planId} has no remaining quota`)
    if (new Date(plan.validUntil) < new Date()) throw new Error(`Coupon plan ${planId} has expired`)
    if (new Date(plan.validFrom) > new Date()) throw new Error(`Coupon plan ${planId} is not yet valid`)

    // Check per-member limit
    const issueKey = this.tenantKey(tenantId, planId, memberId)
    const currentIssues = this.memberIssueCount.get(issueKey) ?? 0
    if (currentIssues >= plan.perMemberLimit) {
      throw new Error(`Member ${memberId} has reached per-member limit of ${plan.perMemberLimit} for plan ${planId}`)
    }

    plan.remainingQuota -= 1
    plan.updatedAt = this.iso()
    this.memberIssueCount.set(issueKey, currentIssues + 1)

    const redemption: SimCouponRedemption = {
      redemptionId: this.id('cr'),
      tenantId,
      memberId,
      orderId: '',
      couponCode: `${plan.code}-${this.nextSeq}`,
      planId,
      status: SimCouponRedemptionStatus.Redeemed,
      createdAt: this.iso()
    }
    this.couponRedemptions.set(redemption.redemptionId, redemption)
    return { ...redemption }
  }

  listCouponRedemptions(tenantId: string): SimCouponRedemption[] {
    return Array.from(this.couponRedemptions.values())
      .filter((r) => r.tenantId === tenantId)
      .map((r) => ({ ...r }))
  }

  // ── Blindbox Issuance ──

  issueBlindboxFromPlan(tenantId: string, memberId: string, planId: string, quantity = 1): SimBlindboxFulfillment {
    const plan = this.blindboxPlans.get(planId)
    if (!plan || plan.tenantId !== tenantId) throw new Error(`Blindbox plan ${planId} not found`)
    if (plan.status !== SimLoyaltyPlanStatus.Active) throw new Error(`Blindbox plan ${planId} is not active (status: ${plan.status})`)
    if (plan.remainingQuota < quantity) throw new Error(`Blindbox plan ${planId} has insufficient quota`)
    if (new Date(plan.validUntil) < new Date()) throw new Error(`Blindbox plan ${planId} has expired`)

    // Pick reward based on weights
    const totalWeight = plan.rewardPool.reduce((s, r) => s + r.weight, 0)
    let pick = Math.random() * totalWeight
    let pickedSku = plan.rewardPool[0].sku
    for (const reward of plan.rewardPool) {
      pick -= reward.weight
      if (pick <= 0) {
        pickedSku = reward.sku
        break
      }
    }

    plan.remainingQuota -= quantity
    plan.updatedAt = this.iso()

    const fulfillment: SimBlindboxFulfillment = {
      fulfillmentId: this.id('bf'),
      tenantId,
      memberId,
      orderId: '',
      blindboxPlanId: plan.blindboxPlanId,
      quantity,
      rewardSku: pickedSku,
      status: SimBlindboxFulfillmentStatus.Fulfilled,
      createdAt: this.iso()
    }
    this.blindboxFulfillments.set(fulfillment.fulfillmentId, fulfillment)
    return { ...fulfillment }
  }

  listBlindboxFulfillments(tenantId: string): SimBlindboxFulfillment[] {
    return Array.from(this.blindboxFulfillments.values())
      .filter((f) => f.tenantId === tenantId)
      .map((f) => ({ ...f }))
  }

  // ── Settlements ──

  addSettlement(input: {
    tenantId: string; memberId: string; orderId: string
    awardedPoints: number; couponCode?: string; blindboxPlanId?: string
  }): SimLoyaltySettlement {
    const now = this.iso()
    const settlement: SimLoyaltySettlement = {
      settlementId: this.id('stl'),
      tenantId: input.tenantId,
      memberId: input.memberId,
      orderId: input.orderId,
      status: SimLoyaltySettlementStatus.Succeeded,
      awardedPoints: input.awardedPoints,
      couponCode: input.couponCode,
      blindboxPlanId: input.blindboxPlanId,
      createdAt: now,
      updatedAt: now
    }
    this.settlements.set(settlement.settlementId, settlement)

    // Add points ledger entry
    const entry: SimPointsLedgerEntry = {
      entryId: this.id('ple'),
      tenantId: input.tenantId,
      memberId: input.memberId,
      orderId: input.orderId,
      points: input.awardedPoints,
      reason: `订单 ${input.orderId} 结算积分`,
      createdAt: now
    }
    this.pointsLedger.set(entry.entryId, entry)

    return { ...settlement }
  }

  listSettlements(tenantId: string): SimLoyaltySettlement[] {
    return Array.from(this.settlements.values())
      .filter((s) => s.tenantId === tenantId)
      .map((s) => ({ ...s }))
  }

  listPointsLedger(tenantId: string): SimPointsLedgerEntry[] {
    return Array.from(this.pointsLedger.values())
      .filter((e) => e.tenantId === tenantId)
      .map((e) => ({ ...e }))
  }

  // ── Coupon Release / Blindbox Revoke ──

  releaseCouponRedemption(redemptionId: string, tenantId: string): SimCouponRedemption {
    const redemption = this.couponRedemptions.get(redemptionId)
    if (!redemption || redemption.tenantId !== tenantId) throw new Error(`Redemption ${redemptionId} not found`)
    if (redemption.status !== SimCouponRedemptionStatus.Redeemed) {
      throw new Error(`Redemption ${redemptionId} cannot be released (status: ${redemption.status})`)
    }
    redemption.status = SimCouponRedemptionStatus.Released

    // Return quota to plan
    const plan = this.couponPlans.get(redemption.planId)
    if (plan && plan.tenantId === tenantId) {
      plan.remainingQuota += 1
      plan.updatedAt = this.iso()
    }

    return { ...redemption }
  }

  revokeBlindboxFulfillment(fulfillmentId: string, tenantId: string): SimBlindboxFulfillment {
    const fulfillment = this.blindboxFulfillments.get(fulfillmentId)
    if (!fulfillment || fulfillment.tenantId !== tenantId) throw new Error(`Fulfillment ${fulfillmentId} not found`)
    if (fulfillment.status !== SimBlindboxFulfillmentStatus.Fulfilled) {
      throw new Error(`Fulfillment ${fulfillmentId} cannot be revoked (status: ${fulfillment.status})`)
    }
    fulfillment.status = SimBlindboxFulfillmentStatus.Revoked
    return { ...fulfillment }
  }
}

// ─── Helpers ──────────────────────────────────────────────

function makeSimulator(): SimLoyaltySimulator {
  return new SimLoyaltySimulator()
}

const TENANT_A = 'tenant-loyalty-a'
const TENANT_B = 'tenant-loyalty-b'

// ─── 8 角色场景 ───

describe('👔店长 忠诚度模拟 - 查看全店积分与优惠券使用情况', () => {
  const sim = makeSimulator()

  it('店长查看积分台账可看到所有积分记录', () => {
    // Create a settlement which adds a points ledger entry
    sim.addSettlement({ tenantId: TENANT_A, memberId: 'mem-001', orderId: 'ord-001', awardedPoints: 50 })
    const ledger = sim.listPointsLedger(TENANT_A)
    assert.ok(Array.isArray(ledger))
    assert.strictEqual(ledger.length, 1)
    assert.strictEqual(ledger[0].points, 50)
  })

  it('店长查看优惠券方案列表可看到已注册的方案', () => {
    sim.registerCouponPlan(TENANT_A, {
      code: 'STORE-FULL-100', title: '门店全场满减',
      discountType: SimCouponDiscountType.FixedAmount, discountValue: 100,
      totalQuota: 50, perMemberLimit: 1,
      validFrom: '2026-01-01T00:00:00Z', validUntil: '2026-12-31T23:59:59Z'
    })
    const plans = sim.listCouponPlans(TENANT_A)
    assert.ok(plans.some((p) => p.code === 'STORE-FULL-100'))
  })
})

describe('🛒前台 忠诚度模拟 - 收银时发放优惠券/盲盒', () => {
  const sim = makeSimulator()

  it('前台可为会员发放已激活的优惠券', () => {
    const plan = sim.registerCouponPlan(TENANT_A, {
      code: 'FRONT-DISCOUNT-20', title: '前台优惠20元',
      discountType: SimCouponDiscountType.FixedAmount, discountValue: 20,
      totalQuota: 100, perMemberLimit: 2,
      validFrom: '2026-01-01T00:00:00Z', validUntil: '2026-12-31T23:59:59Z'
    })
    sim.updateCouponPlanStatus(plan.planId, SimLoyaltyPlanStatus.Active, TENANT_A)
    const redemption = sim.issueCouponFromPlan(TENANT_A, 'mem-reception', plan.planId)
    assert.strictEqual(redemption.status, SimCouponRedemptionStatus.Redeemed)
    assert.ok(redemption.redemptionId)
  })

  it('前台发放盲盒时若方案未激活应失败', () => {
    const plan = sim.registerBlindboxPlan(TENANT_A, {
      blindboxPlanId: 'bb-front-inactive', title: '未激活盲盒',
      unitPrice: 10, totalQuota: 50,
      rewardPool: [{ sku: 'toy-001', weight: 100, label: '小玩具' }],
      validFrom: '2026-01-01T00:00:00Z', validUntil: '2026-12-31T23:59:59Z'
    })
    // Plan is DRAFT, not ACTIVE - should fail
    assert.throws(
      () => sim.issueBlindboxFromPlan(TENANT_A, 'mem-reception', plan.planId),
      /not active/i
    )
  })
})

describe('👥HR 忠诚度模拟 - 检查积分制度合规性', () => {
  const sim = makeSimulator()
  sim.addSettlement({ tenantId: TENANT_A, memberId: 'mem-hr-001', orderId: 'ord-hr-001', awardedPoints: 200 })
  sim.addSettlement({ tenantId: TENANT_A, memberId: 'mem-hr-002', orderId: 'ord-hr-002', awardedPoints: 500 })

  it('HR 可查看所有积分记录确保合规', () => {
    const ledger = sim.listPointsLedger(TENANT_A)
    assert.strictEqual(ledger.length, 2)
    const points = ledger.reduce((s, e) => s + e.points, 0)
    assert.strictEqual(points, 700)
  })

  it('HR 可查看结算记录验证积分授予一致性', () => {
    const settlements = sim.listSettlements(TENANT_A)
    assert.strictEqual(settlements.length, 2)
    assert.ok(settlements.every((s) => s.status === SimLoyaltySettlementStatus.Succeeded))
  })
})

describe('🔧安监 忠诚度模拟 - 审计优惠券/盲盒发放记录', () => {
  const sim = makeSimulator()

  it('安监可查看全部优惠券核销记录', () => {
    const plan = sim.registerCouponPlan(TENANT_A, {
      code: 'AUDIT-COUPON', title: '审计用优惠券',
      discountType: SimCouponDiscountType.Percentage, discountValue: 10,
      totalQuota: 5, perMemberLimit: 1,
      validFrom: '2026-01-01T00:00:00Z', validUntil: '2026-12-31T23:59:59Z'
    })
    sim.updateCouponPlanStatus(plan.planId, SimLoyaltyPlanStatus.Active, TENANT_A)
    const redemption = sim.issueCouponFromPlan(TENANT_A, 'mem-safety', plan.planId)
    assert.strictEqual(redemption.status, SimCouponRedemptionStatus.Redeemed)

    const redemptions = sim.listCouponRedemptions(TENANT_A)
    assert.ok(redemptions.length > 0)
    assert.ok(redemptions.every((r) => r.tenantId === TENANT_A))
  })

  it('安监可审计多租户间的发放隔离 - 无跨租户泄露', () => {
    const redemptionsA = sim.listCouponRedemptions(TENANT_B)
    assert.strictEqual(redemptionsA.length, 0)
  })
})

describe('🎮导玩员 忠诚度模拟 - 为会员激活盲盒游玩', () => {
  const sim = makeSimulator()

  it('导玩员可为会员发放已激活的盲盒', () => {
    const plan = sim.registerBlindboxPlan(TENANT_A, {
      blindboxPlanId: 'bb-guide-active', title: '导玩员专属盲盒',
      unitPrice: 20, totalQuota: 100,
      rewardPool: [
        { sku: 'prize-rare', weight: 10, label: '稀有奖品' },
        { sku: 'prize-common', weight: 90, label: '普通奖品' }
      ],
      validFrom: '2026-01-01T00:00:00Z', validUntil: '2026-12-31T23:59:59Z'
    })
    sim.updateBlindboxPlanStatus(plan.planId, SimLoyaltyPlanStatus.Active, TENANT_A)
    const fulfillment = sim.issueBlindboxFromPlan(TENANT_A, 'mem-guide', plan.planId, 1)
    assert.strictEqual(fulfillment.status, SimBlindboxFulfillmentStatus.Fulfilled)
    assert.ok(fulfillment.rewardSku)
  })

  it('导玩员发放盲盒后方案剩余配额减少', () => {
    const plan = sim.registerBlindboxPlan(TENANT_A, {
      blindboxPlanId: 'bb-guide-quota', title: '配额测试盲盒',
      unitPrice: 15, totalQuota: 3,
      rewardPool: [{ sku: 'test-item', weight: 100, label: '测试奖品' }],
      validFrom: '2026-01-01T00:00:00Z', validUntil: '2026-12-31T23:59:59Z'
    })
    sim.updateBlindboxPlanStatus(plan.planId, SimLoyaltyPlanStatus.Active, TENANT_A)
    sim.issueBlindboxFromPlan(TENANT_A, 'mem-guide', plan.planId, 1)
    const updated = sim.getBlindboxPlan(plan.planId, TENANT_A)
    assert.ok(updated)
    assert.strictEqual(updated.remainingQuota, 2)
  })
})

describe('🎯运行专员 忠诚度模拟 - 监控方案配额余量', () => {
  const sim = makeSimulator()

  it('运行专员可查看优惠券方案剩余配额', () => {
    const plan = sim.registerCouponPlan(TENANT_A, {
      code: 'OPS-MONITOR', title: '运维监控方案',
      discountType: SimCouponDiscountType.FixedAmount, discountValue: 5,
      totalQuota: 10, perMemberLimit: 1,
      validFrom: '2026-01-01T00:00:00Z', validUntil: '2026-12-31T23:59:59Z'
    })
    sim.updateCouponPlanStatus(plan.planId, SimLoyaltyPlanStatus.Active, TENANT_A)

    let fetched = sim.getCouponPlan(plan.planId, TENANT_A)!
    assert.strictEqual(fetched.totalQuota, 10)
    assert.strictEqual(fetched.remainingQuota, 10)

    // Issue 3 coupons to different members
    for (const mId of ['mem-ops-1', 'mem-ops-2', 'mem-ops-3']) {
      sim.issueCouponFromPlan(TENANT_A, mId, plan.planId)
    }

    fetched = sim.getCouponPlan(plan.planId, TENANT_A)!
    assert.strictEqual(fetched.remainingQuota, 7)
  })

  it('运行专员可查看盲盒方案到期时间', () => {
    const plan = sim.registerBlindboxPlan(TENANT_A, {
      blindboxPlanId: 'bb-ops-expiry', title: '到期检查盲盒',
      unitPrice: 25, totalQuota: 200,
      rewardPool: [{ sku: 'ops-reward', weight: 100, label: '运维奖励' }],
      validFrom: '2026-01-01T00:00:00Z', validUntil: '2026-12-31T23:59:59Z'
    })
    assert.strictEqual(plan.validFrom, '2026-01-01T00:00:00Z')
    assert.strictEqual(plan.validUntil, '2026-12-31T23:59:59Z')
  })
})

describe('🤝团建 忠诚度模拟 - 批量发放团建优惠券', () => {
  const sim = makeSimulator()

  it('团建可为多人发放同一优惠券方案下的券', () => {
    const plan = sim.registerCouponPlan(TENANT_A, {
      code: 'TEAM-BUILDING', title: '团建专属优惠',
      discountType: SimCouponDiscountType.Percentage, discountValue: 15,
      totalQuota: 100, perMemberLimit: 1,
      validFrom: '2026-01-01T00:00:00Z', validUntil: '2026-12-31T23:59:59Z'
    })
    sim.updateCouponPlanStatus(plan.planId, SimLoyaltyPlanStatus.Active, TENANT_A)

    const teamMemberIds = ['mem-teambuild-1', 'mem-teambuild-2', 'mem-teambuild-3']
    for (const mId of teamMemberIds) {
      const redemption = sim.issueCouponFromPlan(TENANT_A, mId, plan.planId)
      assert.strictEqual(redemption.status, SimCouponRedemptionStatus.Redeemed)
    }

    const redemptions = sim.listCouponRedemptions(TENANT_A)
    const teamRedeemed = redemptions.filter((r) => r.couponCode.startsWith('TEAM'))
    assert.strictEqual(teamRedeemed.length, 3)
  })

  it('团建发放超出会员限领次数应拒绝', () => {
    const plan = sim.registerCouponPlan(TENANT_A, {
      code: 'TEAM-LIMITED', title: '限领一次团建券',
      discountType: SimCouponDiscountType.FixedAmount, discountValue: 30,
      totalQuota: 100, perMemberLimit: 1,
      validFrom: '2026-01-01T00:00:00Z', validUntil: '2026-12-31T23:59:59Z'
    })
    sim.updateCouponPlanStatus(plan.planId, SimLoyaltyPlanStatus.Active, TENANT_A)

    // First issue OK
    sim.issueCouponFromPlan(TENANT_A, 'mem-teambuild-limited', plan.planId)

    // Second issue for same member should fail
    assert.throws(
      () => sim.issueCouponFromPlan(TENANT_A, 'mem-teambuild-limited', plan.planId),
      /limit/i
    )
  })
})

describe('📢营销 忠诚度模拟 - 创建和管理营销活动方案', () => {
  const sim = makeSimulator()

  it('营销可创建百分比优惠券方案', () => {
    const plan = sim.registerCouponPlan(TENANT_A, {
      code: 'MARKET-20PCT', title: '营销全场八折',
      discountType: SimCouponDiscountType.Percentage, discountValue: 20,
      totalQuota: 1000, perMemberLimit: 3,
      validFrom: '2026-06-01T00:00:00Z', validUntil: '2026-06-30T23:59:59Z'
    })
    assert.strictEqual(plan.discountType, SimCouponDiscountType.Percentage)
    assert.strictEqual(plan.discountValue, 20)
  })

  it('营销可激活、暂停、再激活方案', () => {
    const plan = sim.registerCouponPlan(TENANT_A, {
      code: 'MARKET-FLASH', title: '营销闪购方案',
      discountType: SimCouponDiscountType.FixedAmount, discountValue: 50,
      totalQuota: 500, perMemberLimit: 1,
      validFrom: '2026-06-01T00:00:00Z', validUntil: '2026-06-30T23:59:59Z'
    })
    assert.strictEqual(plan.status, SimLoyaltyPlanStatus.Draft)

    // Activate
    const activated = sim.updateCouponPlanStatus(plan.planId, SimLoyaltyPlanStatus.Active, TENANT_A)
    assert.strictEqual(activated.status, SimLoyaltyPlanStatus.Active)

    // Pause
    const paused = sim.updateCouponPlanStatus(plan.planId, SimLoyaltyPlanStatus.Paused, TENANT_A)
    assert.strictEqual(paused.status, SimLoyaltyPlanStatus.Paused)

    // Reactivate
    const reactivated = sim.updateCouponPlanStatus(plan.planId, SimLoyaltyPlanStatus.Active, TENANT_A)
    assert.strictEqual(reactivated.status, SimLoyaltyPlanStatus.Active)
  })

  it('营销可创建带有奖励池的盲盒方案', () => {
    const plan = sim.registerBlindboxPlan(TENANT_A, {
      blindboxPlanId: 'bb-market-pool', title: '营销盲盒活动',
      unitPrice: 39.99, totalQuota: 300,
      rewardPool: [
        { sku: 'prize-gold', weight: 5, label: '金奖' },
        { sku: 'prize-silver', weight: 15, label: '银奖' },
        { sku: 'prize-bronze', weight: 80, label: '铜奖' }
      ],
      validFrom: '2026-07-01T00:00:00Z', validUntil: '2026-07-31T23:59:59Z'
    })
    assert.strictEqual(plan.rewardPool.length, 3)
    const totalWeight = plan.rewardPool.reduce((sum, r) => sum + r.weight, 0)
    assert.strictEqual(totalWeight, 100)
  })

  it('营销可释放已核销的优惠券', () => {
    const plan = sim.registerCouponPlan(TENANT_A, {
      code: 'MARKET-RELEASE', title: '释放测试方案',
      discountType: SimCouponDiscountType.FixedAmount, discountValue: 10,
      totalQuota: 5, perMemberLimit: 2,
      validFrom: '2026-01-01T00:00:00Z', validUntil: '2026-12-31T23:59:59Z'
    })
    sim.updateCouponPlanStatus(plan.planId, SimLoyaltyPlanStatus.Active, TENANT_A)
    const redemption = sim.issueCouponFromPlan(TENANT_A, 'mem-release', plan.planId)
    assert.strictEqual(redemption.status, SimCouponRedemptionStatus.Redeemed)

    // Release it
    const released = sim.releaseCouponRedemption(redemption.redemptionId, TENANT_A)
    assert.strictEqual(released.status, SimCouponRedemptionStatus.Released)

    // Quota should be returned
    const updated = sim.getCouponPlan(plan.planId, TENANT_A)!
    assert.strictEqual(updated.remainingQuota, 5) // returned to full
  })
})
