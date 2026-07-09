import { describe, it, expect, beforeEach } from 'vitest'
/**
 * campaign.simulator.test.ts — Campaign 模拟器测试
 *
 * 模拟营销活动系统的完整场景覆盖：
 * - 活动计划创建与状态流转 (Draft → Scheduled → Active → Paused → Completed)
 * - 条件匹配 (金额/等级/门店/品牌)
 * - 动作分发 (积分/优惠券/盲盒/推荐标签)
 * - 幂等防重 & 库存边界
 * - 多条件组合评估
 *
 * 8 角色视角覆盖：
 *  👔店长 - 活动整体运营 & 效果审计
 *  🛒前台 - 现场推荐活动 & 顾客匹配
 *  👥HR - 员工专属活动福利
 *  🔧安监 - 活动合规 & 条件验证
 *  🎮导玩员 - 游戏内活动触发
 *  🎯运行专员 - 活动运行监控 & 异常处理
 *  🤝团建 - 团队集体活动触发
 *  📢营销 - 活动策划 & 效果分析
 */
import assert from 'node:assert/strict'
import { CampaignService } from './campaign.service'
import type { CampaignTriggerEvent } from './campaign.service'
import {
  CampaignActionKind,
  CampaignActionStatus,
  CampaignConditionType,
  CampaignStatus,
  CampaignTrigger,
  type CampaignAction,
  type CampaignCondition,
} from './campaign.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ═══════════════════════════════════════════════════════════════
// Simulator Helpers
// ═══════════════════════════════════════════════════════════════

function makeTenantContext(tenantId = 't-campaign', brandId = 'b-campaign'): RequestTenantContext {
  return { tenantId, brandId }
}

function makeEvent(overrides: Partial<CampaignTriggerEvent> = {}): CampaignTriggerEvent {
  return {
    eventName: CampaignTrigger.PaymentSuccess,
    tenantContext: makeTenantContext(),
    memberId: 'm-sim-user',
    orderAmount: 200,
    ...overrides
  }
}

/** 创建带有 mock memberService 的 CampaignService */
function createService(): CampaignService {
  const mockMemberService = {
    getPersistentProfile: async () => null,
    getProfile: () => undefined,
    awardPoints: (_memberId: string, _amount: number, _ctx: RequestTenantContext) => {},
    getMemberCount: () => 0,
  }
  const svc = new CampaignService(mockMemberService as any)
  svc.resetCampaignStoresForTests()
  return svc
}

/** 创建不带依赖注入的 service（测试 Skipped 场景） */
function createServiceNoDeps(): CampaignService {
  const svc = new CampaignService()
  svc.resetCampaignStoresForTests()
  return svc
}

function registerTestCampaign(
  svc: CampaignService,
  overrides: Partial<{
    code: string
    title: string
    triggerEvent: CampaignTrigger
    conditions: CampaignCondition[]
    actions: CampaignAction[]
    priority: number
  }> = {}
) {
  return svc.registerCampaign({
    tenantContext: makeTenantContext(),
    code: overrides.code ?? 'test-campaign-001',
    title: overrides.title ?? '测试活动',
    triggerEvent: overrides.triggerEvent ?? CampaignTrigger.PaymentSuccess,
    conditions: overrides.conditions ?? [],
    actions: overrides.actions ?? [
      { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 100, pointsReason: 'test-bonus' } }
    ],
    priority: overrides.priority ?? 100
  })
}

function registerAndActivate(
  svc: CampaignService,
  overrides: Parameters<typeof registerTestCampaign>[1] = {}
) {
  const plan = registerTestCampaign(svc, overrides)
  svc.updateCampaignStatus(plan.planId, CampaignStatus.Active, plan.tenantContext.tenantId)
  return plan
}

// ═══════════════════════════════════════════════════════════════
// 👔店长 — 活动整体运营与效果审计
// ═══════════════════════════════════════════════════════════════
describe('👔店长 Campaign 模拟器测试', () => {
  it('店长可创建活动方案并发布（完整生命周期）', () => {
    const svc = createService()
    const tenantCtx = makeTenantContext()
    const plan = svc.registerCampaign({
      tenantContext: tenantCtx,
      code: 'SUMMER-2026',
      title: '2026夏季大促',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [
        { type: CampaignConditionType.MinOrderAmount, value: 100 }
      ],
      actions: [
        { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 200, pointsReason: 'summer-bonus' } }
      ],
      priority: 50
    })
    assert.equal(plan.code, 'SUMMER-2026')
    assert.equal(plan.status, CampaignStatus.Draft)
    assert.equal(plan.actions.length, 1)

    // 发布 → Active
    const activated = svc.updateCampaignStatus(plan.planId, CampaignStatus.Active, tenantCtx.tenantId)
    assert.equal(activated.status, CampaignStatus.Active)

    // 暂停
    const paused = svc.updateCampaignStatus(plan.planId, CampaignStatus.Paused, tenantCtx.tenantId)
    assert.equal(paused.status, CampaignStatus.Paused)

    // 完成
    const completed = svc.updateCampaignStatus(plan.planId, CampaignStatus.Completed, tenantCtx.tenantId)
    assert.equal(completed.status, CampaignStatus.Completed)
  })

  it('店长可查看活动分发记录做审计（全量查询）', () => {
    const svc = createService()
    const tenantCtx = makeTenantContext()
    registerAndActivate(svc, {
      code: 'AUDIT-CAMP',
      conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 1 }]
    })

    // 触发多次
    for (let i = 0; i < 3; i++) {
      svc.evaluateTriggers(makeEvent({
        tenantContext: tenantCtx,
        memberId: `m-audit-${i}`,
        orderAmount: 10
      }))
    }

    const dispatches = svc.listDispatches(tenantCtx.tenantId)
    assert.ok(dispatches.length >= 3)
    // 按时间降序排列
    for (let i = 1; i < dispatches.length; i++) {
      assert.ok(dispatches[i - 1].createdAt >= dispatches[i].createdAt)
    }
  })

  it('店长可通过活动视图查看已触发活动数量（运营指标）', () => {
    const svc = createService()
    const tenantCtx = makeTenantContext()
    registerAndActivate(svc, { code: 'CAMP-A', priority: 10 })
    registerAndActivate(svc, { code: 'CAMP-B', priority: 20 })

    const result = svc.evaluateTriggers(makeEvent({
      tenantContext: tenantCtx,
      eventName: CampaignTrigger.PaymentSuccess
    }))

    assert.equal(result.matchedCampaigns, 2)
    assert.equal(result.dispatchedActions, 2)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🛒前台 — 现场推荐活动与顾客匹配
// ═══════════════════════════════════════════════════════════════
describe('🛒前台 Campaign 模拟器测试', () => {
  it('前台可为顾客触发现场消费活动（下单触发积分奖励）', () => {
    const svc = createService()
    registerAndActivate(svc, {
      code: 'ONSITE-BONUS',
      conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 50 }],
      actions: [
        { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 50, pointsReason: 'onsite-bonus' } }
      ]
    })

    const result = svc.evaluateTriggers(makeEvent({
      memberId: 'm-onsite-001',
      orderAmount: 100
    }))

    assert.equal(result.matchedCampaigns, 1)
    assert.equal(result.dispatchedActions, 1)
    assert.equal(result.dispatches[0].status, CampaignActionStatus.Dispatched)
  })

  it('前台触发金额不足的活动应被跳过（条件不匹配）', () => {
    const svc = createService()
    registerAndActivate(svc, {
      code: 'MIN-100',
      conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 100 }],
      actions: [
        { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 50, pointsReason: 'big-spender' } }
      ]
    })

    const result = svc.evaluateTriggers(makeEvent({
      memberId: 'm-low-001',
      orderAmount: 30 // 低于 100 门槛
    }))

    assert.equal(result.matchedCampaigns, 0)
    assert.equal(result.dispatchedActions, 0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 👥HR — 员工专属活动福利
// ═══════════════════════════════════════════════════════════════
describe('👥HR Campaign 模拟器测试', () => {
  it('HR 可为员工发布专属活动并触发（会员等级匹配）', () => {
    const svc = createService()
    registerAndActivate(svc, {
      code: 'EMP-BONUS',
      conditions: [{ type: CampaignConditionType.MemberLevel, value: 'employee' }],
      actions: [
        { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 500, pointsReason: 'employee-welfare' } }
      ]
    })

    const result = svc.evaluateTriggers(makeEvent({
      memberId: 'm-employee-001',
      memberLevel: 'employee',
      orderAmount: 0
    }))

    assert.equal(result.matchedCampaigns, 1)
    assert.equal(result.dispatches[0].status, CampaignActionStatus.Dispatched)
  })

  it('HR 活动不应匹配普通会员（等级隔离）', () => {
    const svc = createService()
    registerAndActivate(svc, {
      code: 'EMP-ONLY',
      conditions: [{ type: CampaignConditionType.MemberLevel, value: 'employee' }],
      actions: [
        { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 100, pointsReason: 'emp-only' } }
      ]
    })

    const result = svc.evaluateTriggers(makeEvent({
      memberId: 'm-regular-001',
      memberLevel: 'gold',
      orderAmount: 1000
    }))

    assert.equal(result.matchedCampaigns, 0)
    assert.equal(result.dispatchedActions, 0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🔧安监 — 活动合规与条件验证
// ═══════════════════════════════════════════════════════════════
describe('🔧安监 Campaign 模拟器测试', () => {
  it('安监可验证活动动作参数合规（积分必须为正数）', () => {
    const svc = createService()

    // 负积分应被拒绝
    assert.throws(() => {
      svc.registerCampaign({
        tenantContext: makeTenantContext(),
        code: 'BAD-POINTS',
        title: '非法活动',
        triggerEvent: CampaignTrigger.PaymentSuccess,
        conditions: [],
        actions: [
          { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: -100, pointsReason: 'negative' } }
        ]
      })
    }, /positive pointsAmount/)
  })

  it('安监可验证活动条件边界（多条件组合匹配）', () => {
    const svc = createService()
    registerAndActivate(svc, {
      code: 'MULTI-COND',
      conditions: [
        { type: CampaignConditionType.MinOrderAmount, value: 200 },
        { type: CampaignConditionType.MemberLevel, value: 'vip' },
        { type: CampaignConditionType.StoreScope, value: 'store-sh' }
      ],
      actions: [
        { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 300, pointsReason: 'vip-bonus' } }
      ]
    })

    // 所有条件满足
    const passResult = svc.evaluateTriggers(makeEvent({
      memberId: 'm-vip-sh',
      memberLevel: 'vip',
      orderAmount: 300,
      storeId: 'store-sh'
    }))
    assert.equal(passResult.matchedCampaigns, 1)

    // 等级不匹配
    const failLevel = svc.evaluateTriggers(makeEvent({
      memberId: 'm-normal-sh',
      memberLevel: 'regular',
      orderAmount: 300,
      storeId: 'store-sh'
    }))
    assert.equal(failLevel.matchedCampaigns, 0)

    // 金额不匹配
    const failAmount = svc.evaluateTriggers(makeEvent({
      memberId: 'm-vip-sh',
      memberLevel: 'vip',
      orderAmount: 50,
      storeId: 'store-sh'
    }))
    assert.equal(failAmount.matchedCampaigns, 0)

    // 门店不匹配
    const failStore = svc.evaluateTriggers(makeEvent({
      memberId: 'm-vip-bj',
      memberLevel: 'vip',
      orderAmount: 300,
      storeId: 'store-bj'
    }))
    assert.equal(failStore.matchedCampaigns, 0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎮导玩员 — 游戏内活动触发
// ═══════════════════════════════════════════════════════════════
describe('🎮导玩员 Campaign 模拟器测试', () => {
  it('导玩员可为会员资料同步触发放盲盒活动', () => {
    const svc = createService()
    registerAndActivate(svc, {
      code: 'PROFILE-SYNC-BOX',
      triggerEvent: CampaignTrigger.MemberProfileSynced,
      conditions: [],
      actions: [
        {
          kind: CampaignActionKind.IssueBlindbox,
          params: { blindboxPlanId: 'game-reward-box', blindboxQuantity: 1 }
        }
      ]
    })

    const result = svc.evaluateTriggers(makeEvent({
      eventName: CampaignTrigger.MemberProfileSynced,
      memberId: 'm-gamer-001'
    }))

    assert.equal(result.matchedCampaigns, 1)
  })

  it('导玩员可触发游戏成就积分奖励（特定事件）', () => {
    const svc = createService()
    registerAndActivate(svc, {
      code: 'ACTIVITY-REWARD',
      triggerEvent: CampaignTrigger.MemberActivityRecurring,
      actions: [
        { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 200, pointsReason: 'activity-reward' } }
      ]
    })

    const result = svc.evaluateTriggers(makeEvent({
      eventName: CampaignTrigger.MemberActivityRecurring,
      memberId: 'm-activity-001'
    }))

    assert.equal(result.matchedCampaigns, 1)
    assert.equal(result.dispatchedActions, 1)
  })

  it('导玩员触发错误事件不应匹配（事件类型隔离）', () => {
    const svc = createService()
    registerAndActivate(svc, {
      code: 'ORDER-ONLY',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      actions: [
        { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 100, pointsReason: 'order-bonus' } }
      ]
    })

    const result = svc.evaluateTriggers(makeEvent({
      eventName: CampaignTrigger.MemberActivityRecurring, // 错误事件
      memberId: 'm-wrong-001'
    }))

    assert.equal(result.matchedCampaigns, 0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎯运行专员 — 活动运行监控与异常处理
// ═══════════════════════════════════════════════════════════════
describe('🎯运行专员 Campaign 模拟器测试', () => {
  it('运行专员可查看按状态/活动ID过滤的分发记录', () => {
    const svc = createService()
    const tenantCtx = makeTenantContext()

    const planA = registerAndActivate(svc, { code: 'MONITOR-A', priority: 10 })
    registerAndActivate(svc, { code: 'MONITOR-B', priority: 20 })

    // 触发
    svc.evaluateTriggers(makeEvent({ tenantContext: tenantCtx }))

    // 按 planId 过滤
    const aDispatches = svc.listDispatches(tenantCtx.tenantId, { planId: planA.planId })
    assert.ok(aDispatches.length > 0)
    aDispatches.forEach(d => assert.equal(d.planId, planA.planId))

    // 按状态过滤
    const dispatched = svc.listDispatches(tenantCtx.tenantId, { status: CampaignActionStatus.Dispatched })
    assert.ok(dispatched.length > 0)
    dispatched.forEach(d => assert.equal(d.status, CampaignActionStatus.Dispatched))
  })

  it('运行专员可监控活动执行跳过（缺少依赖服务）', () => {
    const svc = createServiceNoDeps()

    registerAndActivate(svc, {
      code: 'NO-DEPS',
      actions: [
        { kind: CampaignActionKind.IssueCoupon, params: { couponPlanId: 'coupon-plan-01' } }
      ]
    })

    const result = svc.evaluateTriggers(makeEvent({
      memberId: 'm-nodeps-001'
    }))

    // 由于缺少 LoyaltyService，分发应被跳过
    assert.equal(result.matchedCampaigns, 1)
    assert.equal(result.dispatches.length, 1)
    const dispatch = result.dispatches[0]
    expect([CampaignActionStatus.Skipped, CampaignActionStatus.Failed]).toContain(dispatch.status)
  })

  it('运行专员可监控活动幂等防重（同订单号不重复触发）', () => {
    const svc = createService()
    registerAndActivate(svc, {
      code: 'IDEMPOTENT',
      conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 1 }],
      actions: [
        { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 100, pointsReason: 'idempotent-bonus' } }
      ]
    })

    // 同一 orderId + memberId 触发多次
    const result1 = svc.evaluateTriggers(makeEvent({
      orderId: 'order-dup-001',
      memberId: 'm-dup-001',
      orderAmount: 100
    }))

    const result2 = svc.evaluateTriggers(makeEvent({
      orderId: 'order-dup-001',
      memberId: 'm-dup-001',
      orderAmount: 100
    }))

    assert.equal(result1.dispatchedActions, 1)
    // 第二次应被跳过（幂等）
    assert.equal(result2.skippedActions, 1)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🤝团建 — 团队集体活动触发
// ═══════════════════════════════════════════════════════════════
describe('🤝团建 Campaign 模拟器测试', () => {
  it('团建可为团队成员批量触发活动', () => {
    const svc = createService()
    registerAndActivate(svc, {
      code: 'TEAM-BUILDING',
      conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 1 }],
      actions: [
        { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 300, pointsReason: 'team-bonus' } }
      ]
    })

    const teamMembers = ['m-team-a', 'm-team-b', 'm-team-c']
    for (const member of teamMembers) {
      const result = svc.evaluateTriggers(makeEvent({
        memberId: member,
        orderAmount: 600
      }))
      assert.equal(result.matchedCampaigns, 1)
      assert.equal(result.dispatchedActions, 1)
    }
  })

  it('团建活动可发放盲盒给团队成员（盲盒奖励分发）', () => {
    const svc = createService()
    registerAndActivate(svc, {
      code: 'TEAM-BOX',
      conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 1 }],
      actions: [
        {
          kind: CampaignActionKind.IssueBlindbox,
          params: { blindboxPlanId: 'team-event-box', blindboxQuantity: 3 }
        }
      ]
    })

    const result = svc.evaluateTriggers(makeEvent({
      memberId: 'm-team-lead',
      orderAmount: 1000,
      orderId: 'order-team-001'
    }))

    assert.equal(result.matchedCampaigns, 1)
    assert.ok(result.dispatches.length >= 1)
  })
})

// ═══════════════════════════════════════════════════════════════
// 📢营销 — 活动策划与效果分析
// ═══════════════════════════════════════════════════════════════
describe('📢营销 Campaign 模拟器测试', () => {
  it('营销可创建带推荐标签的活动（配合推荐系统）', () => {
    const svc = createService()
    registerAndActivate(svc, {
      code: 'RECOMMEND-CAMP',
      conditions: [{ type: CampaignConditionType.BrandScope, value: 'b-campaign' }],
      actions: [
        {
          kind: CampaignActionKind.RecommendTag,
          params: { tagCode: 'summer-promo' }
        }
      ]
    })

    const result = svc.evaluateTriggers(makeEvent({
      memberId: 'm-reco-001',
      orderAmount: 100
    }))

    assert.equal(result.matchedCampaigns, 1)
    assert.equal(result.dispatches[0].status, CampaignActionStatus.Dispatched)
  })

  it('营销可创建带时间窗口的活动（定时计划）', () => {
    const svc = createService()
    const pastDate = new Date(Date.now() - 86400000).toISOString() // 昨天
    const futureDate = new Date(Date.now() + 86400000).toISOString() // 明天

    const plan = svc.registerCampaign({
      tenantContext: makeTenantContext(),
      code: 'TIMED-CAMP',
      title: '定时活动',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [
        { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 100, pointsReason: 'timed-bonus' } }
      ],
      scheduledStart: pastDate,
      scheduledEnd: futureDate,
      priority: 10
    })
    svc.updateCampaignStatus(plan.planId, CampaignStatus.Active, plan.tenantContext.tenantId)

    // 在时间窗口内应匹配
    const result = svc.evaluateTriggers(makeEvent({ memberId: 'm-timed-001' }))
    assert.equal(result.matchedCampaigns, 1)

    // 已过期的活动
    const expiredPlan = svc.registerCampaign({
      tenantContext: makeTenantContext(),
      code: 'EXPIRED-CAMP',
      title: '已过期活动',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [
        { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 100, pointsReason: 'expired' } }
      ],
      scheduledEnd: pastDate, // 已过期
      priority: 5
    })
    svc.updateCampaignStatus(expiredPlan.planId, CampaignStatus.Active, expiredPlan.tenantContext.tenantId)

    const expiredResult = svc.evaluateTriggers(makeEvent({ memberId: 'm-expired-001' }))
    // expiredPlan 因超时被过滤，只有 TIMED-CAMP 匹配
    assert.equal(expiredResult.matchedCampaigns, 1)
  })

  it('营销可按优先级执行活动（高优先级先触发）', () => {
    const svc = createService()
    const tenantCtx = makeTenantContext()

    // 注册两个相同事件的活动，不同优先级
    registerAndActivate(svc, {
      code: 'LOW-PRIO',
      conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 1 }],
      actions: [
        { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 10, pointsReason: 'low-prio' } }
      ],
      priority: 300
    })
    registerAndActivate(svc, {
      code: 'HIGH-PRIO',
      conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 1 }],
      actions: [
        { kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 100, pointsReason: 'high-prio' } }
      ],
      priority: 10
    })

    const result = svc.evaluateTriggers(makeEvent({
      tenantContext: tenantCtx,
      memberId: 'm-prio-001',
      orderAmount: 50
    }))

    assert.equal(result.matchedCampaigns, 2)
    assert.equal(result.dispatchedActions, 2)

    // 分发记录
    const dispatches = svc.listDispatches(tenantCtx.tenantId)
    assert.ok(dispatches.length >= 2)
  })
})

// ═══════════════════════════════════════════════════════════════
// 多租户隔离边界
// ═══════════════════════════════════════════════════════════════
describe('多租户隔离边界模拟', () => {
  it('不同租户的活动完全隔离', () => {
    const svc = createService()

    const tenantA = makeTenantContext('t-a')
    const tenantB = makeTenantContext('t-b')

    svc.registerCampaign({
      tenantContext: tenantA,
      code: 'TENANT-A-ONLY',
      title: '租户A活动',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [{ kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 100, pointsReason: 'tenant-a' } }]
    })

    svc.registerCampaign({
      tenantContext: tenantB,
      code: 'TENANT-B-ONLY',
      title: '租户B活动',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [{ kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 200, pointsReason: 'tenant-b' } }]
    })

    const campaignsA = svc.listCampaigns('t-a')
    assert.equal(campaignsA.length, 1)
    assert.equal(campaignsA[0].code, 'TENANT-A-ONLY')

    const campaignsB = svc.listCampaigns('t-b')
    assert.equal(campaignsB.length, 1)
    assert.equal(campaignsB[0].code, 'TENANT-B-ONLY')
  })

  it('跨租户活动状态更新被拒绝', () => {
    const svc = createService()
    const plan = svc.registerCampaign({
      tenantContext: makeTenantContext('t-alpha'),
      code: 'TENANT-ALPHA',
      title: 'Alpha活动',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [{ kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 50, pointsReason: 'alpha' } }]
    })

    assert.throws(() => {
      svc.updateCampaignStatus(plan.planId, CampaignStatus.Active, 't-beta')
    }, /Campaign plan not found/)
  })
})
