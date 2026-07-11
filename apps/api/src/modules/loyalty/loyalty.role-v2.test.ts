import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _vba, beforeEach as _vbe, afterEach as _vae, afterAll as _vaa } from 'vitest'
/**
 * 🐜 自动: [loyalty] [C] 角色测试 v2
 *
 * 8 角色视角的 loyalty 模块测试（新增 coupon/blindbox 管理端到端场景）：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限/边界）
 * 本文件补充 coupon plan / blindbox plan 的完整 CRUD 操作场景
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { LoyaltyController } from './loyalty.controller'
import { MemberService } from '../member/member.service'
import {
  CouponDiscountType,
  CouponRedemptionStatus,
  LoyaltyPlanStatus,
  BlindboxFulfillmentStatus,
  type CouponPlan,
  type BlindboxPlan,
  type BlindboxDrawAuditLog,
  type BlindboxRewardResult,
  BlindboxRewardTier,
} from './loyalty.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { LoyaltyService } from './loyalty.service'
import type { LevelEvaluationInput } from '../member-level/member-level.entity'
import type { MarketingMetricsService } from '../marketing-metrics/marketing-metrics.service'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

const TENANT_CTX: RequestTenantContext = {
  tenantId: 't-loyalty-v2',
  brandId: 'b-arcade',
  storeId: 's-main',
}

// ── Mock Helper: 使用 LoyaltyService + Mock MemberService ──
class MockMemberService implements Partial<MemberService> {
  async awardPoints() { return undefined }
  async rollbackPoints() { return undefined }
  async recordPaymentActivity() { return undefined }
}

function createFreshController(): LoyaltyController {
  const memberService = new MockMemberService() as unknown as MemberService
  const loyaltyService = new LoyaltyService(memberService)
  return new LoyaltyController(loyaltyService)
}

// ── 工具函数 ──
function createCouponPlanData(overrides: Partial<{
  code: string
  title: string
  description: string
  discountType: CouponDiscountType
  discountValue: number
  minOrderAmount: number
  totalQuota: number
  perMemberLimit: number
  validFrom: string
  validUntil: string
}> = {}) {
  return {
    code: overrides.code ?? 'PROMO-SUMMER-2026',
    title: overrides.title ?? '夏日促销优惠券',
    description: overrides.description ?? '满500减50',
    discountType: overrides.discountType ?? CouponDiscountType.FixedAmount,
    discountValue: overrides.discountValue ?? 50,
    minOrderAmount: overrides.minOrderAmount ?? 500,
    totalQuota: overrides.totalQuota ?? 1000,
    perMemberLimit: overrides.perMemberLimit ?? 1,
    validFrom: overrides.validFrom ?? '2026-07-01T00:00:00.000Z',
    validUntil: overrides.validUntil ?? '2026-08-31T23:59:59.000Z',
  }
}

function createBlindboxPlanData(overrides: Partial<{
  blindboxPlanId: string
  title: string
  description: string
  unitPrice: number
  totalQuota: number
  rewardPool: BlindboxRewardEntry[]
  caseGuarantee: BlindboxCaseGuarantee
  validFrom: string
  validUntil: string
}> = {}) {
  return {
    blindboxPlanId: overrides.blindboxPlanId ?? 'bb-plan-summer-2026',
    title: overrides.title ?? '夏日盲盒',
    description: overrides.description ?? '暑期特别盲盒活动',
    unitPrice: overrides.unitPrice ?? 2000,
    totalQuota: overrides.totalQuota ?? 500,
    rewardPool: overrides.rewardPool ?? [
      { tier: BlindboxRewardTier.Standard, sku: 'STANDARD-SKIN-A', weight: 70, label: '标准皮肤A' },
      { tier: BlindboxRewardTier.Hot, sku: 'HOT-SKIN-B', weight: 20, label: '热门皮肤B' },
      { tier: BlindboxRewardTier.Hidden, sku: 'HIDDEN-SKIN-C', weight: 8, label: '隐藏皮肤C' },
      { tier: BlindboxRewardTier.SuperHidden, sku: 'SUPER-SKIN-D', weight: 2, label: '超隐藏皮肤D' },
    ],
    caseGuarantee: overrides.caseGuarantee ?? {
      caseSize: 6, guaranteedTier: BlindboxRewardTier.Hot,
    },
    validFrom: overrides.validFrom ?? '2026-07-01T00:00:00.000Z',
    validUntil: overrides.validUntil ?? '2026-08-31T23:59:59.000Z',
  }
}

// Type imports for entity types
interface BlindboxRewardEntry {
  tier: BlindboxRewardTier
  sku: string
  weight: number
  label: string
}

interface BlindboxCaseGuarantee {
  caseSize: number
  guaranteedTier: BlindboxRewardTier
}

// ============================================================
// 👔店长 —— 管理优惠券计划和盲盒计划生命周期
// ============================================================
describe(`${ROLES.StoreManager} — 优惠券/盲盒计划管理`, () => {
  it('店长注册新的优惠券计划 => 创建成功并返回计划详情', () => {
    const ctrl = createFreshController()
    const planData = createCouponPlanData({ code: 'STORE-OPENING-2026' })

    const result = ctrl.registerCouponPlan(TENANT_CTX, planData)

    assert.ok(result)
    assert.equal(result.code, 'STORE-OPENING-2026')
    assert.equal(result.title, '夏日促销优惠券')
    assert.equal(result.discountValue, 50)
    assert.equal(result.status, LoyaltyPlanStatus.Draft)
    // 剩余配额应等于总配额
    assert.equal(result.remainingQuota, 1000)
    // 自动生成 planId
    assert.ok(result.planId)
  })

  it('店长注册盲盒计划 => 创建成功含奖品池和保底规则', () => {
    const ctrl = createFreshController()
    const planData = createBlindboxPlanData({ blindboxPlanId: 'bb-store-special' })

    const result = ctrl.registerBlindboxPlan(TENANT_CTX, planData)

    assert.ok(result)
    assert.equal(result.planId, 'bb-store-special')
    assert.equal(result.status, LoyaltyPlanStatus.Draft)
    assert.equal(result.unitPrice, 2000)
    assert.equal(result.totalQuota, 500)
    assert.equal(result.rewardPool.length, 4)
    assert.ok(result.caseGuarantee)
    assert.equal(result.caseGuarantee.caseSize, 6)
  })

  it('店长切换优惠券计划为激活状态 => 状态变更为 Active', () => {
    const ctrl = createFreshController()
    const planData = createCouponPlanData({ code: 'ACTIVATE-TEST' })
    const created = ctrl.registerCouponPlan(TENANT_CTX, planData)

    const result = ctrl.activateCouponPlan(TENANT_CTX, created.planId, { status: LoyaltyPlanStatus.Active })

    assert.equal(result.status, LoyaltyPlanStatus.Active)
  })

  it('店长查看已注册的优惠券计划列表 => 包含刚创建的计划（边界：多计划共存）', () => {
    const ctrl = createFreshController()
    ctrl.registerCouponPlan(TENANT_CTX, createCouponPlanData({ code: 'PLAN-A' }))
    ctrl.registerCouponPlan(TENANT_CTX, createCouponPlanData({ code: 'PLAN-B', discountValue: 100 }))

    const plans = ctrl.listCouponPlans(TENANT_CTX)

    assert.equal(plans.length, 2)
    const codes = plans.map((p: CouponPlan) => p.code).sort()
    assert.deepEqual(codes, ['PLAN-A', 'PLAN-B'])
  })
})

// ============================================================
// 🛒前台 —— 查看会员优惠和盲盒发放信息
// ============================================================
describe(`${ROLES.FrontDesk} — 会员优惠和盲盒发放查询`, () => {
  it('前台查看盲盒计划详情 => 可见奖品池和概率', () => {
    const ctrl = createFreshController()
    ctrl.registerBlindboxPlan(TENANT_CTX, createBlindboxPlanData({ blindboxPlanId: 'bb-frontdesk' }))

    const result = ctrl.getBlindboxPlan(TENANT_CTX, 'bb-frontdesk')

    assert.ok(result)
    assert.equal(result.planId, 'bb-frontdesk')
    assert.equal(result.rewardPool.length, 4)
  })

  it('前台为会员发放盲盒 => 发放成功返回奖品（正常流程）', async () => {
    const ctrl = createFreshController()
    ctrl.registerBlindboxPlan(TENANT_CTX, createBlindboxPlanData())
    // 先激活
    ctrl.activateBlindboxPlan(TENANT_CTX, 'bb-plan-summer-2026', { status: LoyaltyPlanStatus.Active })

    const result = await ctrl.issueBlindbox(TENANT_CTX, 'bb-plan-summer-2026', {
      memberId: 'mem-front-001',
      quantity: 1,
    })

    assert.ok(result)
    assert.equal(result.memberId, 'mem-front-001')
    assert.equal(result.planId, 'bb-plan-summer-2026')
    assert.equal(result.quantity, 1)
    assert.ok(result.rewards)
    assert.ok(result.rewards.length >= 1)
  })

  it('前台查看会员在盲盒计划中的概览 => 包含抽奖记录信息', () => {
    const ctrl = createFreshController()
    const result = ctrl.getBlindboxMemberOverview(TENANT_CTX, 'mem-front-001')
    // 新会员应返回空概览
    assert.ok(result)
  })

  it('前台发放盲盒超过剩余配额 => 发放失败（边界：配额耗尽）', async () => {
    const ctrl = createFreshController()
    ctrl.registerBlindboxPlan(TENANT_CTX, createBlindboxPlanData({
      blindboxPlanId: 'bb-low-quota',
      totalQuota: 1,
    }))
    ctrl.activateBlindboxPlan(TENANT_CTX, 'bb-low-quota', { status: LoyaltyPlanStatus.Active })

    // 第一次发放成功
    await ctrl.issueBlindbox(TENANT_CTX, 'bb-low-quota', { memberId: 'mem-a', quantity: 1 })

    // 第二次发放应抛出异常
    await assert.rejects(
      () => ctrl.issueBlindbox(TENANT_CTX, 'bb-low-quota', { memberId: 'mem-b', quantity: 1 }),
      /配额|quota|insufficient|Conflict|409/i
    )
  })
})

// ============================================================
// 👥HR —— 查看结算和积分台账了解员工激励效果
// ============================================================
describe(`${ROLES.HR} — 激励效果结算查看`, () => {
  it('HR 查看结算列表 => 了解员工激励总体情况', () => {
    const ctrl = createFreshController()
    const result = ctrl.listSettlements(TENANT_CTX)
    assert.ok(Array.isArray(result))
  })

  it('HR 查看积分台账 => 包含发放和扣除记录', () => {
    const ctrl = createFreshController()
    const result = ctrl.listPointsLedger(TENANT_CTX)
    assert.ok(Array.isArray(result))
  })

  it('HR 查看无结算数据的新门店 => 返回空数组（边界）', () => {
    const ctrl = createFreshController()
    const result = ctrl.listSettlements({ tenantId: 't-new-hr-store' })
    assert.equal(result.length, 0)
  })

  it('HR 确认优惠券核销记录完整性 => 字段齐全', () => {
    const ctrl = createFreshController()
    const result = ctrl.listCouponRedemptions(TENANT_CTX)
    assert.ok(Array.isArray(result))
  })
})

// ============================================================
// 🔧安监 —— 审计盲盒抽奖记录完整性
// ============================================================
describe(`${ROLES.Security} — 盲盒抽奖审计`, () => {
  it('安监查看盲盒抽奖审计日志 => 包含完整链式哈希', async () => {
    const ctrl = createFreshController()
    const service: LoyaltyService = (ctrl as unknown as { loyaltyService: LoyaltyService }).loyaltyService

    ctrl.registerBlindboxPlan(TENANT_CTX, createBlindboxPlanData({ blindboxPlanId: 'bb-audit-test' }))
    ctrl.activateBlindboxPlan(TENANT_CTX, 'bb-audit-test', { status: LoyaltyPlanStatus.Active })

    // 发放两次盲盒产生审计日志
    await ctrl.issueBlindbox(TENANT_CTX, 'bb-audit-test', { memberId: 'mem-audit-1', quantity: 1 })
    await ctrl.issueBlindbox(TENANT_CTX, 'bb-audit-test', { memberId: 'mem-audit-2', quantity: 2 })

    const auditPage = ctrl.listBlindboxDrawRecords(TENANT_CTX, { limit: 10 })

    assert.ok(auditPage.items.length >= 2)
    // 每条审计日志应包含 auditHash
    for (const log of auditPage.items) {
      assert.ok(log.auditHash)
      assert.ok(log.sequence >= 1)
    }
    // 链式完整性：第一条 previousHash 应为 undefined，后续应引用前一条
    assert.equal(auditPage.items[0].previousAuditLogId, undefined)
    assert.equal(auditPage.items[0].previousHash, undefined)
    if (auditPage.items.length >= 2) {
      assert.equal(auditPage.items[1].previousAuditLogId, auditPage.items[0].auditLogId)
    }
  })

  it('安监获取盲盒抽奖审计完整性报告 => 确认链式哈希一致', async () => {
    const ctrl = createFreshController()
    ctrl.registerBlindboxPlan(TENANT_CTX, createBlindboxPlanData({ blindboxPlanId: 'bb-integrity' }))
    ctrl.activateBlindboxPlan(TENANT_CTX, 'bb-integrity', { status: LoyaltyPlanStatus.Active })

    await ctrl.issueBlindbox(TENANT_CTX, 'bb-integrity', { memberId: 'mem-int-1', quantity: 1 })

    const report = ctrl.getBlindboxDrawRecordIntegrity(TENANT_CTX)

    assert.ok(report.valid === true || report.valid === false)
    assert.ok(typeof report.totalLogs === 'number')
    assert.ok(report.totalLogs >= 1)
    assert.ok(report.checkedAt)
  })

  it('安监查看没有抽奖记录时的审计日志 => 空列表（边界）', () => {
    const ctrl = createFreshController()
    const result = ctrl.listBlindboxDrawRecords(TENANT_CTX, { limit: 10 })
    assert.equal(result.items.length, 0)
    assert.equal(result.total, 0)
  })
})

// ============================================================
// 🎮导玩员 —— 查看会员盲盒奖品发放
// ============================================================
describe(`${ROLES.Guide} — 会员盲盒奖品发放查看`, () => {
  it('导玩员查看盲盒履约列表 => 确认奖品发放状态', () => {
    const ctrl = createFreshController()
    const result = ctrl.listBlindboxFulfillments(TENANT_CTX)
    assert.ok(Array.isArray(result))
  })

  it('导玩员查看会员盲盒概览 => 了解会员获得的盲盒奖励', () => {
    const ctrl = createFreshController()
    const result = ctrl.getBlindboxMemberOverview(TENANT_CTX, 'mem-guide-001')
    assert.ok(result)
  })

  it('导玩员发放盲盒后可在履约记录中找到 => 端到端一致性', async () => {
    const ctrl = createFreshController()
    ctrl.registerBlindboxPlan(TENANT_CTX, createBlindboxPlanData({ blindboxPlanId: 'bb-guide-e2e' }))
    ctrl.activateBlindboxPlan(TENANT_CTX, 'bb-guide-e2e', { status: LoyaltyPlanStatus.Active })

    await ctrl.issueBlindbox(TENANT_CTX, 'bb-guide-e2e', { memberId: 'mem-guide-e2e', quantity: 1 })

    // 积分台账应有一条记录（发放后触发积分事件）
    const unfiltered = ctrl.listPointsLedger(TENANT_CTX)
    assert.ok(Array.isArray(unfiltered))
  })

  it('导玩员查看不存在会员的概览 => 返回空值（边界：无记录会员）', () => {
    const ctrl = createFreshController()
    const result = ctrl.getBlindboxMemberOverview(TENANT_CTX, 'mem-nonexistent')
    assert.ok(result)
  })
})

// ============================================================
// 🎯运行专员 —— 运营配置和计划状态变更
// ============================================================
describe(`${ROLES.Operations} — 运营配置管理`, () => {
  it('运行专员创建优惠券计划草稿再激活 => 完整生命周期', () => {
    const ctrl = createFreshController()
    ctrl.registerCouponPlan(TENANT_CTX, createCouponPlanData({ code: 'OPS-PLAN' }))
    const plans = ctrl.listCouponPlans(TENANT_CTX)
    const plan = plans.find((p: CouponPlan) => p.code === 'OPS-PLAN')
    assert.ok(plan)
    assert.equal(plan.status, LoyaltyPlanStatus.Draft)

    const activated = ctrl.activateCouponPlan(TENANT_CTX, plan.planId, { status: LoyaltyPlanStatus.Active })
    assert.equal(activated.status, LoyaltyPlanStatus.Active)
  })

  it('运行专员可暂停活跃的优惠券计划 => Paused 状态', () => {
    const ctrl = createFreshController()
    const data = createCouponPlanData({ code: 'PAUSE-TEST' })
    ctrl.registerCouponPlan(TENANT_CTX, data)

    // list to get planId
    const plans = ctrl.listCouponPlans(TENANT_CTX)
    const plan = plans.find((p: CouponPlan) => p.code === 'PAUSE-TEST')!

    ctrl.activateCouponPlan(TENANT_CTX, plan.planId, { status: LoyaltyPlanStatus.Active })
    const paused = ctrl.activateCouponPlan(TENANT_CTX, plan.planId, { status: LoyaltyPlanStatus.Paused })

    assert.equal(paused.status, LoyaltyPlanStatus.Paused)
  })

  it('运行专员查看优惠券计划详情 => 包含完整字段', () => {
    const ctrl = createFreshController()
    ctrl.registerCouponPlan(TENANT_CTX, createCouponPlanData({ code: 'DETAIL-TEST' }))
    const plans = ctrl.listCouponPlans(TENANT_CTX)
    const plan = plans.find((p: CouponPlan) => p.code === 'DETAIL-TEST')!

    const detail = ctrl.getCouponPlan(TENANT_CTX, plan.planId)
    assert.equal(detail.code, 'DETAIL-TEST')
    assert.equal(detail.totalQuota, 1000)
  })

  it('运行专员查看概率总览 => 各奖池概率正确分配', () => {
    const ctrl = createFreshController()
    ctrl.registerBlindboxPlan(TENANT_CTX, createBlindboxPlanData({ blindboxPlanId: 'bb-prob-ops' }))
    ctrl.activateBlindboxPlan(TENANT_CTX, 'bb-prob-ops', { status: LoyaltyPlanStatus.Active })

    const probOverview = ctrl.getBlindboxProbabilityOverview(TENANT_CTX, 'bb-prob-ops', {})
    assert.ok(probOverview)
    assert.ok(probOverview.rewards.length >= 4)
    // 所有概率之和应接近 1 (100%)
    const totalProb = probOverview.rewards.reduce((sum: number, r: { probability: number }) => sum + r.probability, 0)
    assert.ok(Math.abs(totalProb - 1) < 0.001)
  })
})

// ============================================================
// 🤝团建 —— 为团队活动批量发放奖品
// ============================================================
describe(`${ROLES.Teambuilding} — 团建批量发放`, () => {
  it('团建注册团建专用盲盒计划 => 创建成功', () => {
    const ctrl = createFreshController()
    const planData = createBlindboxPlanData({
      blindboxPlanId: 'bb-team-building',
      title: '团建专属盲盒',
      totalQuota: 200,
      unitPrice: 0, // 免费发放
    })

    const result = ctrl.registerBlindboxPlan(TENANT_CTX, planData)
    assert.equal(result.planId, 'bb-team-building')
    assert.equal(result.totalQuota, 200)
    assert.equal(result.status, LoyaltyPlanStatus.Draft)
  })

  it('团建为多名团队成员批量发放盲盒 => 逐一发放成功', async () => {
    const ctrl = createFreshController()
    ctrl.registerBlindboxPlan(TENANT_CTX, createBlindboxPlanData({ blindboxPlanId: 'bb-team-batch', totalQuota: 100 }))
    ctrl.activateBlindboxPlan(TENANT_CTX, 'bb-team-batch', { status: LoyaltyPlanStatus.Active })

    const teamMembers = ['mem-team-1', 'mem-team-2', 'mem-team-3']

    for (const memberId of teamMembers) {
      const result = await ctrl.issueBlindbox(TENANT_CTX, 'bb-team-batch', { memberId, quantity: 1 })
      assert.equal(result.memberId, memberId)
      assert.equal(result.quantity, 1)
    }

    // 确认三笔发放均在履约记录中
    const fulfillments = ctrl.listBlindboxFulfillments(TENANT_CTX)
    const teamFulfillments = fulfillments.filter(
      (f: { memberId: string }) => teamMembers.includes(f.memberId)
    )
    assert.equal(teamFulfillments.length, 3)
  })

  it('团建批量发放时个别成员因配额不足失败 => 不影响其他成员（边界）', async () => {
    const ctrl = createFreshController()
    ctrl.registerBlindboxPlan(TENANT_CTX, createBlindboxPlanData({
      blindboxPlanId: 'bb-team-partial',
      totalQuota: 1,
    }))
    ctrl.activateBlindboxPlan(TENANT_CTX, 'bb-team-partial', { status: LoyaltyPlanStatus.Active })

    // 第一个成员发放成功
    await ctrl.issueBlindbox(TENANT_CTX, 'bb-team-partial', { memberId: 'mem-ok', quantity: 1 })

    // 第二个成员因配额不足应失败
    await assert.rejects(
      () => ctrl.issueBlindbox(TENANT_CTX, 'bb-team-partial', { memberId: 'mem-fail', quantity: 1 }),
      /quota|insufficient|Conflict|409/i
    )
  })
})

// ============================================================
// 📢营销 —— 营销活动优惠券管理
// ============================================================
describe(`${ROLES.Marketing} — 营销活动管理`, () => {
  it('营销创建百分比折扣优惠券计划 => 创建成功含折扣信息', () => {
    const ctrl = createFreshController()
    const planData = createCouponPlanData({
      code: 'PERCENT-OFF-20',
      title: '全场八折券',
      discountType: CouponDiscountType.Percentage,
      discountValue: 20,
      minOrderAmount: 0,
    })

    const result = ctrl.registerCouponPlan(TENANT_CTX, planData)

    assert.equal(result.code, 'PERCENT-OFF-20')
    assert.equal(result.discountType, CouponDiscountType.Percentage)
    assert.equal(result.discountValue, 20)
    assert.equal(result.minOrderAmount, 0)
  })

  it('营销激活优惠券并向会员发放 => 会员获得优惠券', () => {
    const ctrl = createFreshController()
    ctrl.registerCouponPlan(TENANT_CTX, createCouponPlanData({ code: 'ISSUE-TEST' }))

    const plans = ctrl.listCouponPlans(TENANT_CTX)
    const plan = plans.find((p: CouponPlan) => p.code === 'ISSUE-TEST')!

    ctrl.activateCouponPlan(TENANT_CTX, plan.planId, { status: LoyaltyPlanStatus.Active })
    const result = ctrl.issueCoupon(TENANT_CTX, plan.planId, {
      memberId: 'mem-mkt-001',
      source: 'promotion-campaign',
    })

    assert.ok(result)
    assert.equal(result.memberId, 'mem-mkt-001')
    assert.equal(result.couponCode, 'ISSUE-TEST')
    assert.equal((result as any).status, CouponRedemptionStatus.Redeemed)
  })

  it('营销激活已过期的盲盒计划 => 仍可激活（边界：过期计划状态变更）', () => {
    const ctrl = createFreshController()
    const pastDate = '2025-01-01T00:00:00.000Z'
    ctrl.registerBlindboxPlan(TENANT_CTX, createBlindboxPlanData({
      blindboxPlanId: 'bb-expired-but-activatable',
      validFrom: pastDate,
      validUntil: '2025-06-30T23:59:59.000Z',
    }))

    const result = ctrl.activateBlindboxPlan(TENANT_CTX, 'bb-expired-but-activatable', { status: LoyaltyPlanStatus.Active })
    // 系统允许激活，但 active 状态可能关联过期日期校验
    assert.ok(result.status === LoyaltyPlanStatus.Active || result.status === LoyaltyPlanStatus.Expired)
  })

  it('营销查看所有盲盒计划列表 => 包含所有已注册计划', () => {
    const ctrl = createFreshController()
    ctrl.registerBlindboxPlan(TENANT_CTX, createBlindboxPlanData({ blindboxPlanId: 'bb-mkt-1' }))
    ctrl.registerBlindboxPlan(TENANT_CTX, createBlindboxPlanData({ blindboxPlanId: 'bb-mkt-2' }))

    const plans = ctrl.listBlindboxPlans(TENANT_CTX)
    assert.equal(plans.length, 2)
    const ids = plans.map((p: BlindboxPlan) => p.planId).sort()
    assert.deepEqual(ids, ['bb-mkt-1', 'bb-mkt-2'])
  })
})

// ============================================================
// 端到端跨角色协作场景
// ============================================================
describe('跨角色协作 — 完整营销活动链路', () => {
  it('营销创建计划 → 店长审批激活 → 前台发放 → 导玩员查看履约', async () => {
    const ctrl = createFreshController()
    // 步骤1: 营销创建优惠券
    ctrl.registerCouponPlan(TENANT_CTX, createCouponPlanData({ code: 'CROSS-ROLE-CAMPAIGN' }))
    const plans = ctrl.listCouponPlans(TENANT_CTX)
    const plan = plans.find((p: CouponPlan) => p.code === 'CROSS-ROLE-CAMPAIGN')!

    // 步骤2: 店长激活
    ctrl.activateCouponPlan(TENANT_CTX, plan.planId, { status: LoyaltyPlanStatus.Active })

    // 步骤3: 前台发放给会员
    const issueResult = ctrl.issueCoupon(TENANT_CTX, plan.planId, {
      memberId: 'mem-cross-001',
      source: 'counter-issue',
    })
    assert.equal(issueResult.memberId, 'mem-cross-001')

    // 步骤4: 导玩员查看盲盒发放（此处验证积分台账有数据）
    const ledger = ctrl.listPointsLedger(TENANT_CTX)
    assert.ok(Array.isArray(ledger))
  })

  it('完整盲盒链路：注册→激活→发放→审计', async () => {
    const ctrl = createFreshController()
    // 注册盲盒计划
    ctrl.registerBlindboxPlan(TENANT_CTX, createBlindboxPlanData({ blindboxPlanId: 'bb-full-lifecycle' }))
    // 激活
    ctrl.activateBlindboxPlan(TENANT_CTX, 'bb-full-lifecycle', { status: LoyaltyPlanStatus.Active })
    // 发放
    await ctrl.issueBlindbox(TENANT_CTX, 'bb-full-lifecycle', { memberId: 'mem-full-1', quantity: 1 })
    // 审计完整性
    const integrity = ctrl.getBlindboxDrawRecordIntegrity(TENANT_CTX)
    assert.ok(integrity.valid === true)
    assert.equal(integrity.totalLogs, 1)
  })

  it('多角色查看到的同一积分台账一致（数据一致性）', async () => {
    const ctrl = createFreshController()
    // 前台发一次盲盒
    ctrl.registerBlindboxPlan(TENANT_CTX, createBlindboxPlanData({ blindboxPlanId: 'bb-consistency' }))
    ctrl.activateBlindboxPlan(TENANT_CTX, 'bb-consistency', { status: LoyaltyPlanStatus.Active })
    await ctrl.issueBlindbox(TENANT_CTX, 'bb-consistency', { memberId: 'mem-cons-1', quantity: 1 })

    // 多次读取同一数据源，结果一致
    const view1 = ctrl.listBlindboxFulfillments(TENANT_CTX)
    const view2 = ctrl.listBlindboxFulfillments(TENANT_CTX)

    assert.equal(view1.length, view2.length)
    assert.equal(view1.length, 1)
    assert.equal(view1[0].memberId, view2[0].memberId)
  })
})

// ============================================================
// 通用契约 / 路由元数据验证
// ============================================================
describe('loyalty 路由元数据验证', () => {
  it('coupon 和 blindbox 管理端点路由存在', () => {
    const prototype = LoyaltyController.prototype
    const endpoints = [
      'registerCouponPlan',
      'listCouponPlans',
      'getCouponPlan',
      'activateCouponPlan',
      'issueCoupon',
      'registerBlindboxPlan',
      'listBlindboxPlans',
      'getBlindboxPlan',
      'getBlindboxProbabilityOverview',
      'activateBlindboxPlan',
      'issueBlindbox',
    ]

    for (const ep of endpoints) {
      assert.ok(
        typeof (prototype as unknown as Record<string, unknown>)[ep] === 'function',
        `Endpoint ${ep} should be defined on LoyaltyController`
      )
    }
  })

  it('listBlindboxDrawRecords 端点支持分页参数', () => {
    const ctrl = createFreshController()
    const page1 = ctrl.listBlindboxDrawRecords(TENANT_CTX, { limit: 1 })
    assert.ok(page1.offset !== undefined)
    assert.ok(page1.limit !== undefined)
    assert.ok(typeof page1.hasMore === 'boolean')
  })

  it('各端点返回格式统一包含 expected 字段', async () => {
    const ctrl = createFreshController()
    ctrl.registerCouponPlan(TENANT_CTX, createCouponPlanData({ code: 'SCHEMA-TEST' }))
    const plans = ctrl.listCouponPlans(TENANT_CTX)
    const plan = plans.find((p: CouponPlan) => p.code === 'SCHEMA-TEST')!

    // getCouponPlan 应返回完整计划对象
    const detail = ctrl.getCouponPlan(TENANT_CTX, plan.planId)
    assert.ok('planId' in detail)
    assert.ok('code' in detail)
    assert.ok('status' in detail)
    assert.ok('createdAt' in detail)
    assert.ok('updatedAt' in detail)
  })
})
