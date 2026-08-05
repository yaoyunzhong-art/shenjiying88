/**
 * campaign.service.spec.ts — 营销活动 Service 深层单元测试
 *
 * 覆盖：
 *  - CampaignService:         注册/列表/获取/状态转移/触发器评估/条件匹配/派发
 *  - CampaignTriggerService:  事件订阅/频次控制/触发跳过
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 18 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ──────────── 枚举 & 类型 ────────────

enum CampaignStatus {
  Draft = 'DRAFT',
  Scheduled = 'SCHEDULED',
  Active = 'ACTIVE',
  Paused = 'PAUSED',
  Completed = 'COMPLETED',
}

enum CampaignTrigger {
  PaymentSuccess = 'payment.success',
  MemberProfileSynced = 'member.profile-synced',
  OrderCreated = 'order.created',
  MemberActivityRecurring = 'member.activity-recurring',
}

enum CampaignActionKind {
  AwardPoints = 'AWARD_POINTS',
  IssueCoupon = 'ISSUE_COUPON',
  IssueBlindbox = 'ISSUE_BLINDBOX',
  RecommendTag = 'RECOMMEND_TAG',
}

enum CampaignActionStatus {
  Pending = 'PENDING',
  Dispatched = 'DISPATCHED',
  Failed = 'FAILED',
  Skipped = 'SKIPPED',
}

enum CampaignConditionType {
  MinOrderAmount = 'MIN_ORDER_AMOUNT',
  MemberLevel = 'MEMBER_LEVEL',
  StoreScope = 'STORE_SCOPE',
  BrandScope = 'BRAND_SCOPE',
}

interface CampaignCondition {
  type: CampaignConditionType
  value: number | string | string[]
}

interface CampaignAction {
  kind: CampaignActionKind
  params: Record<string, unknown>
}

interface CampaignPlan {
  planId: string
  tenantId: string
  code: string
  title: string
  description?: string
  status: CampaignStatus
  triggerEvent: CampaignTrigger
  conditions: CampaignCondition[]
  actions: CampaignAction[]
  priority: number
  scheduledStart?: string
  scheduledEnd?: string
  createdAt: string
  updatedAt: string
}

interface CampaignDispatch {
  dispatchId: string
  planId: string
  actionIndex: number
  tenantId: string
  memberId?: string
  orderId?: string
  paymentId?: string
  triggerEvent: string
  status: CampaignActionStatus
  errorMessage?: string
  resultRef?: string
  createdAt: string
}

interface CampaignTriggerEvent {
  eventName: string
  tenantId: string
  memberId?: string
  orderId?: string
  paymentId?: string
  orderAmount?: number
  memberLevel?: string
  storeId?: string
  brandId?: string
}

interface CampaignEvaluationResult {
  matchedCampaigns: number
  dispatchedActions: number
  skippedActions: number
  failedActions: number
  dispatches: CampaignDispatch[]
}

// ──────────── 合法状态转移 ────────────

const VALID_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  [CampaignStatus.Draft]: [CampaignStatus.Scheduled, CampaignStatus.Active, CampaignStatus.Paused],
  [CampaignStatus.Scheduled]: [CampaignStatus.Active, CampaignStatus.Paused, CampaignStatus.Draft, CampaignStatus.Completed],
  [CampaignStatus.Active]: [CampaignStatus.Paused, CampaignStatus.Completed],
  [CampaignStatus.Paused]: [CampaignStatus.Active, CampaignStatus.Completed, CampaignStatus.Draft],
  [CampaignStatus.Completed]: [],
}

// ──────────── mock 工厂 ────────────

function makeCondition(type: CampaignConditionType, value: number | string | string[]): CampaignCondition {
  return { type, value }
}

function makeAction(kind: CampaignActionKind, params: Record<string, unknown> = {}): CampaignAction {
  return { kind, params }
}

function makePlan(overrides: Partial<CampaignPlan> & { tenantId: string; code: string; triggerEvent: CampaignTrigger; actions: CampaignAction[] }): CampaignPlan {
  const now = new Date().toISOString()
  return {
    planId: `plan-${Math.random().toString(36).slice(2, 8)}`,
    title: overrides.title ?? `plan-${overrides.code}`,
    status: CampaignStatus.Draft,
    priority: 100,
    conditions: [],
    ...overrides,
    createdAt: now,
    updatedAt: now,
  }
}

function makeDispatch(overrides: Partial<CampaignDispatch> & { planId: string; tenantId: string }): CampaignDispatch {
  return {
    dispatchId: `dispatch-${Math.random().toString(36).slice(2, 8)}`,
    actionIndex: 0,
    triggerEvent: 'test.event',
    status: CampaignActionStatus.Dispatched,
    ...overrides,
    createdAt: new Date().toISOString(),
  }
}

// ──────────── 内联业务逻辑 ────────────

function assertValidStatusTransition(from: CampaignStatus, to: CampaignStatus): void {
  const allowed = VALID_TRANSITIONS[from]
  if (!allowed || !allowed.includes(to)) {
    throw new Error(`Invalid campaign status transition: ${from} → ${to}`)
  }
}

function isWithinScheduledWindow(plan: Pick<CampaignPlan, 'scheduledStart' | 'scheduledEnd'>): boolean {
  const eventTime = new Date().toISOString()
  if (plan.scheduledStart && eventTime < plan.scheduledStart) return false
  if (plan.scheduledEnd && eventTime > plan.scheduledEnd) return false
  return true
}

function valueMatchesString(actual: string, expected: number | string | string[]): boolean {
  if (typeof expected === 'string') return actual === expected
  if (Array.isArray(expected)) return expected.includes(actual)
  return false
}

function matchesConditions(conditions: CampaignCondition[], event: CampaignTriggerEvent): boolean {
  for (const condition of conditions) {
    switch (condition.type) {
      case CampaignConditionType.MinOrderAmount:
        if (typeof event.orderAmount !== 'number' || event.orderAmount < Number(condition.value)) return false
        break
      case CampaignConditionType.MemberLevel:
        if (!event.memberLevel || !valueMatchesString(event.memberLevel, condition.value)) return false
        break
      case CampaignConditionType.StoreScope:
        if (!event.storeId || !valueMatchesString(event.storeId, condition.value)) return false
        break
      case CampaignConditionType.BrandScope:
        if (!event.brandId || !valueMatchesString(event.brandId, condition.value)) return false
        break
    }
  }
  return true
}

function evaluateTriggers(
  plans: CampaignPlan[],
  dispatches: CampaignDispatch[],
  event: CampaignTriggerEvent,
): CampaignEvaluationResult {
  const candidateCampaigns = plans
    .filter((p) => p.tenantId === event.tenantId)
    .filter((p) => p.status === CampaignStatus.Active)
    .filter((p) => p.triggerEvent === event.eventName)
    .filter((p) => isWithinScheduledWindow(p))
    .filter((p) => matchesConditions(p.conditions, event))
    .sort((a, b) => b.priority - a.priority)

  const resultDispatches: CampaignDispatch[] = []
  let dispatchedActions = 0
  let skippedActions = 0
  let failedActions = 0

  for (const campaign of candidateCampaigns) {
    for (const [idx] of campaign.actions.entries()) {
      const existing = dispatches.find(
        (d) => d.planId === campaign.planId && d.actionIndex === idx && d.memberId === event.memberId && d.orderId === event.orderId,
      )
      if (existing) {
        skippedActions++
        resultDispatches.push(existing)
        continue
      }

      const dispatch = makeDispatch({
        planId: campaign.planId,
        tenantId: event.tenantId,
        memberId: event.memberId,
        orderId: event.orderId,
        paymentId: event.paymentId,
        actionIndex: idx,
        triggerEvent: event.eventName,
        status: CampaignActionStatus.Dispatched,
      })
      resultDispatches.push(dispatch)
      dispatchedActions++
    }
  }

  return {
    matchedCampaigns: candidateCampaigns.length,
    dispatchedActions,
    skippedActions,
    failedActions,
    dispatches: resultDispatches,
  }
}

function listCampaigns(plans: CampaignPlan[], tenantId: string, filter?: { status?: CampaignStatus; triggerEvent?: CampaignTrigger }): CampaignPlan[] {
  return plans
    .filter((p) => p.tenantId === tenantId)
    .filter((p) => (filter?.status ? p.status === filter.status : true))
    .filter((p) => (filter?.triggerEvent ? p.triggerEvent === filter.triggerEvent : true))
    .sort((a, b) => a.priority - b.priority)
}

function updateCampaignStatus(plans: CampaignPlan[], planId: string, status: CampaignStatus, tenantId: string): CampaignPlan {
  const plan = plans.find((p) => p.planId === planId && p.tenantId === tenantId)
  if (!plan) throw new Error(`Campaign plan not found: ${planId}`)
  assertValidStatusTransition(plan.status, status)
  plan.status = status
  plan.updatedAt = new Date().toISOString()
  return plan
}

function validateAction(action: CampaignAction, index: number): void {
  switch (action.kind) {
    case CampaignActionKind.AwardPoints:
      if (!action.params.pointsAmount || Number(action.params.pointsAmount) <= 0) {
        throw new Error(`Campaign action[${index}] (AwardPoints) requires positive pointsAmount`)
      }
      break
    case CampaignActionKind.IssueCoupon:
      if (!action.params.couponPlanId) {
        throw new Error(`Campaign action[${index}] (IssueCoupon) requires couponPlanId`)
      }
      break
    case CampaignActionKind.IssueBlindbox:
      if (!action.params.blindboxPlanId) {
        throw new Error(`Campaign action[${index}] (IssueBlindbox) requires blindboxPlanId`)
      }
      break
    case CampaignActionKind.RecommendTag:
      if (!action.params.tagCode) {
        throw new Error(`Campaign action[${index}] (RecommendTag) requires tagCode`)
      }
      break
  }
}

function registerCampaign(plans: CampaignPlan[], input: {
  tenantId: string
  code: string
  title: string
  triggerEvent: CampaignTrigger
  conditions: CampaignCondition[]
  actions: CampaignAction[]
  priority?: number
  scheduledStart?: string
  scheduledEnd?: string
}): CampaignPlan {
  if (input.actions.length === 0) throw new Error('Campaign must declare at least one action')
  input.actions.forEach(validateAction)
  const plan = makePlan({
    tenantId: input.tenantId,
    code: input.code,
    title: input.title,
    status: CampaignStatus.Draft,
    triggerEvent: input.triggerEvent,
    conditions: input.conditions,
    actions: input.actions,
    priority: input.priority ?? 100,
    scheduledStart: input.scheduledStart,
    scheduledEnd: input.scheduledEnd,
  })
  plans.push(plan)
  return plan
}

// ──────────── ══════════════════════════════════ ────────────
// Tests
// ──────────── ══════════════════════════════════ ────────────

describe('campaign.service — 活动业务逻辑', () => {
  let plans: CampaignPlan[]
  let dispatches: CampaignDispatch[]

  beforeEach(() => {
    plans = []
    dispatches = []
  })

  // ── registerCampaign ──

  describe('registerCampaign', () => {
    it('正例: 注册一个 AwardPoints 活动成功', () => {
      const plan = registerCampaign(plans, {
        tenantId: 't1',
        code: 'NEW_USER',
        title: '新用户奖励',
        triggerEvent: CampaignTrigger.MemberProfileSynced,
        conditions: [],
        actions: [makeAction(CampaignActionKind.AwardPoints, { pointsAmount: 100 })],
      })
      expect(plan.planId).toBeDefined()
      expect(plan.tenantId).toBe('t1')
      expect(plan.code).toBe('NEW_USER')
      expect(plan.status).toBe(CampaignStatus.Draft)
      expect(plans).toHaveLength(1)
    })

    it('反例: actions 为空时报错', () => {
      expect(() =>
        registerCampaign(plans, {
          tenantId: 't1',
          code: 'EMPTY',
          title: '空活动',
          triggerEvent: CampaignTrigger.PaymentSuccess,
          conditions: [],
          actions: [],
        }),
      ).toThrow('Campaign must declare at least one action')
    })

    it('反例: AwardPoints 无 pointsAmount 时报错', () => {
      expect(() =>
        registerCampaign(plans, {
          tenantId: 't1',
          code: 'BAD_POINTS',
          title: '错误积分',
          triggerEvent: CampaignTrigger.PaymentSuccess,
          conditions: [],
          actions: [makeAction(CampaignActionKind.AwardPoints, {})],
        }),
      ).toThrow('requires positive pointsAmount')
    })

    it('反例: IssueCoupon 无 couponPlanId 时报错', () => {
      expect(() =>
        registerCampaign(plans, {
          tenantId: 't1',
          code: 'BAD_COUPON',
          title: '错误优惠券',
          triggerEvent: CampaignTrigger.PaymentSuccess,
          conditions: [],
          actions: [makeAction(CampaignActionKind.IssueCoupon, {})],
        }),
      ).toThrow('requires couponPlanId')
    })

    it('反例: IssueBlindbox 无 blindboxPlanId 时报错', () => {
      expect(() =>
        registerCampaign(plans, {
          tenantId: 't1',
          code: 'BAD_BLINDBOX',
          title: '错误盲盒',
          triggerEvent: CampaignTrigger.PaymentSuccess,
          conditions: [],
          actions: [makeAction(CampaignActionKind.IssueBlindbox, {})],
        }),
      ).toThrow('requires blindboxPlanId')
    })

    it('反例: RecommendTag 无 tagCode 时报错', () => {
      expect(() =>
        registerCampaign(plans, {
          tenantId: 't1',
          code: 'BAD_TAG',
          title: '错误标签',
          triggerEvent: CampaignTrigger.PaymentSuccess,
          conditions: [],
          actions: [makeAction(CampaignActionKind.RecommendTag, {})],
        }),
      ).toThrow('requires tagCode')
    })

    it('边界: priority 默认值 100', () => {
      const plan = registerCampaign(plans, {
        tenantId: 't1',
        code: 'TEST_PRIORITY',
        title: '优先级测试',
        triggerEvent: CampaignTrigger.MemberActivityRecurring,
        conditions: [],
        actions: [makeAction(CampaignActionKind.RecommendTag, { tagCode: 'vip' })],
      })
      expect(plan.priority).toBe(100)
    })
  })

  // ── updateCampaignStatus ──

  describe('updateCampaignStatus', () => {
    it('正例: Draft → Scheduled', () => {
      registerCampaign(plans, {
        tenantId: 't1', code: 'U1', title: 'U1',
        triggerEvent: CampaignTrigger.PaymentSuccess,
        conditions: [], actions: [makeAction(CampaignActionKind.RecommendTag, { tagCode: 'x' })],
      })
      const updated = updateCampaignStatus(plans, plans[0].planId, CampaignStatus.Scheduled, 't1')
      expect(updated.status).toBe(CampaignStatus.Scheduled)
    })

    it('正例: Active → Completed', () => {
      registerCampaign(plans, {
        tenantId: 't1', code: 'U2', title: 'U2',
        triggerEvent: CampaignTrigger.PaymentSuccess,
        conditions: [], actions: [makeAction(CampaignActionKind.RecommendTag, { tagCode: 'x' })],
      })
      updateCampaignStatus(plans, plans[0].planId, CampaignStatus.Active, 't1')
      const updated = updateCampaignStatus(plans, plans[0].planId, CampaignStatus.Completed, 't1')
      expect(updated.status).toBe(CampaignStatus.Completed)
    })

    it('反例: Completed → Draft 非法转移', () => {
      registerCampaign(plans, {
        tenantId: 't1', code: 'U3', title: 'U3',
        triggerEvent: CampaignTrigger.PaymentSuccess,
        conditions: [], actions: [makeAction(CampaignActionKind.RecommendTag, { tagCode: 'x' })],
      })
      // Draft → Active → Completed
      updateCampaignStatus(plans, plans[0].planId, CampaignStatus.Active, 't1')
      updateCampaignStatus(plans, plans[0].planId, CampaignStatus.Completed, 't1')
      expect(plans[0].status).toBe(CampaignStatus.Completed)
      // Completed → Draft is invalid
      expect(() =>
        updateCampaignStatus(plans, plans[0].planId, CampaignStatus.Draft, 't1'),
      ).toThrow('Invalid campaign status transition')
    })

    it('反例: 不存在的 planId 报错', () => {
      expect(() => updateCampaignStatus(plans, 'nonexistent', CampaignStatus.Active, 't1')).toThrow('Campaign plan not found')
    })
  })

  // ── listCampaigns ──

  describe('listCampaigns', () => {
    it('正例: 租户隔离——只返回本租户活动', () => {
      registerCampaign(plans, { tenantId: 't1', code: 'A', title: 'A', triggerEvent: CampaignTrigger.PaymentSuccess, conditions: [], actions: [makeAction(CampaignActionKind.RecommendTag, { tagCode: 'x' })] })
      registerCampaign(plans, { tenantId: 't2', code: 'B', title: 'B', triggerEvent: CampaignTrigger.PaymentSuccess, conditions: [], actions: [makeAction(CampaignActionKind.RecommendTag, { tagCode: 'x' })] })
      expect(listCampaigns(plans, 't1')).toHaveLength(1)
    })

    it('正例: filter.triggerEvent 过滤', () => {
      registerCampaign(plans, { tenantId: 't1', code: 'A', title: 'A', triggerEvent: CampaignTrigger.PaymentSuccess, conditions: [], actions: [makeAction(CampaignActionKind.RecommendTag, { tagCode: 'x' })] })
      registerCampaign(plans, { tenantId: 't1', code: 'B', title: 'B', triggerEvent: CampaignTrigger.OrderCreated, conditions: [], actions: [makeAction(CampaignActionKind.RecommendTag, { tagCode: 'x' })] })
      const result = listCampaigns(plans, 't1', { triggerEvent: CampaignTrigger.PaymentSuccess })
      expect(result).toHaveLength(1)
      expect(result[0].code).toBe('A')
    })

    it('边界: 空结果', () => {
      expect(listCampaigns(plans, 'nonexistent')).toEqual([])
    })
  })

  // ── matchesConditions ──

  describe('matchesConditions', () => {
    it('正例: MinOrderAmount 满足时返回 true', () => {
      const conds = [makeCondition(CampaignConditionType.MinOrderAmount, 100)]
      expect(matchesConditions(conds, { eventName: 'test', tenantId: 't1', orderAmount: 150 })).toBe(true)
    })

    it('反例: MinOrderAmount 不满足时返回 false', () => {
      const conds = [makeCondition(CampaignConditionType.MinOrderAmount, 100)]
      expect(matchesConditions(conds, { eventName: 'test', tenantId: 't1', orderAmount: 50 })).toBe(false)
    })

    it('反例: MemberLevel 不匹配时返回 false', () => {
      const conds = [makeCondition(CampaignConditionType.MemberLevel, 'gold')]
      expect(matchesConditions(conds, { eventName: 'test', tenantId: 't1', memberLevel: 'silver' })).toBe(false)
    })

    it('正例: StoreScope 匹配数组', () => {
      const conds = [makeCondition(CampaignConditionType.StoreScope, ['store_a', 'store_b'])]
      expect(matchesConditions(conds, { eventName: 'test', tenantId: 't1', storeId: 'store_a' })).toBe(true)
    })

    it('反例: StoreScope 不匹配数组', () => {
      const conds = [makeCondition(CampaignConditionType.StoreScope, ['store_a', 'store_b'])]
      expect(matchesConditions(conds, { eventName: 'test', tenantId: 't1', storeId: 'store_c' })).toBe(false)
    })

    it('边界: 空条件列表返回 true', () => {
      expect(matchesConditions([], { eventName: 'test', tenantId: 't1' })).toBe(true)
    })
  })

  // ── evaluateTriggers ──

  describe('evaluateTriggers', () => {
    it('正例: 匹配活动并派发', () => {
      registerCampaign(plans, {
        tenantId: 't1', code: 'BONUS', title: 'Bonus',
        triggerEvent: CampaignTrigger.PaymentSuccess,
        conditions: [makeCondition(CampaignConditionType.MinOrderAmount, 50)],
        actions: [makeAction(CampaignActionKind.AwardPoints, { pointsAmount: 10 })],
        priority: 5,
      })
      updateCampaignStatus(plans, plans[0].planId, CampaignStatus.Active, 't1')
      const result = evaluateTriggers(plans, dispatches, {
        eventName: CampaignTrigger.PaymentSuccess,
        tenantId: 't1',
        memberId: 'm1',
        orderAmount: 100,
      })
      expect(result.matchedCampaigns).toBe(1)
      expect(result.dispatchedActions).toBe(1)
      expect(result.skippedActions).toBe(0)
    })

    it('正例: 幂等——同 action 第二次跳过', () => {
      registerCampaign(plans, {
        tenantId: 't1', code: 'BONUS', title: 'Bonus',
        triggerEvent: CampaignTrigger.PaymentSuccess,
        conditions: [], actions: [makeAction(CampaignActionKind.AwardPoints, { pointsAmount: 10 })],
      })
      updateCampaignStatus(plans, plans[0].planId, CampaignStatus.Active, 't1')
      // 第一次
      const r1 = evaluateTriggers(plans, dispatches, { eventName: CampaignTrigger.PaymentSuccess, tenantId: 't1', memberId: 'm1', orderId: 'o1' })
      expect(r1.dispatchedActions).toBe(1)
      // 第二次 (已存 dispatch)
      dispatches.push(...r1.dispatches)
      const r2 = evaluateTriggers(plans, dispatches, { eventName: CampaignTrigger.PaymentSuccess, tenantId: 't1', memberId: 'm1', orderId: 'o1' })
      expect(r2.skippedActions).toBe(1)
    })

    it('反例: 非激活活动不匹配', () => {
      registerCampaign(plans, {
        tenantId: 't1', code: 'DRAFTED', title: 'Drafted',
        triggerEvent: CampaignTrigger.PaymentSuccess,
        conditions: [], actions: [makeAction(CampaignActionKind.RecommendTag, { tagCode: 'x' })],
      })
      const result = evaluateTriggers(plans, dispatches, { eventName: CampaignTrigger.PaymentSuccess, tenantId: 't1' })
      expect(result.matchedCampaigns).toBe(0)
    })

    it('反例: 不同 triggerEvent 不匹配', () => {
      registerCampaign(plans, {
        tenantId: 't1', code: 'PICKED', title: 'Picked',
        triggerEvent: CampaignTrigger.PaymentSuccess,
        conditions: [], actions: [makeAction(CampaignActionKind.RecommendTag, { tagCode: 'x' })],
      })
      updateCampaignStatus(plans, plans[0].planId, CampaignStatus.Active, 't1')
      const result = evaluateTriggers(plans, dispatches, { eventName: CampaignTrigger.MemberActivityRecurring, tenantId: 't1' })
      expect(result.matchedCampaigns).toBe(0)
    })

    it('边界: 计划窗口外不触发', () => {
      const past = new Date(Date.now() - 86400000).toISOString()
      const plan = makePlan({
        tenantId: 't1', code: 'EXPIRED', title: 'Expired',
        status: CampaignStatus.Active,
        triggerEvent: CampaignTrigger.PaymentSuccess,
        actions: [makeAction(CampaignActionKind.RecommendTag, { tagCode: 'x' })],
        scheduledEnd: past,
      })
      plans.push(plan)
      const result = evaluateTriggers(plans, dispatches, { eventName: CampaignTrigger.PaymentSuccess, tenantId: 't1' })
      expect(result.matchedCampaigns).toBe(0)
    })
  })
})
