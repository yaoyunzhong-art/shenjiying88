import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  CampaignActionKind,
  CampaignConditionType,
  CampaignStatus,
  CampaignTrigger
} from './campaign.entity'
import { CampaignService } from './campaign.service'

const tenantContext = {
  tenantId: 'tenant-001',
  brandId: 'brand-001',
  storeId: 'store-001'
}

describe('CampaignService', () => {
  test('registerCampaign creates a Draft plan with default priority', () => {
    const service = new CampaignService()
    service.resetCampaignStoresForTests()
    const plan = service.registerCampaign({
      tenantContext,
      code: 'CAMP-001',
      title: 'Welcome bonus',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [{ kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 100 } }]
    })
    assert.equal(plan.status, CampaignStatus.Draft)
    assert.equal(plan.priority, 100)
    assert.equal(plan.tenantContext.tenantId, 'tenant-001')
    assert.equal(plan.actions[0]?.kind, CampaignActionKind.AwardPoints)
  })

  test('registerCampaign rejects empty actions', () => {
    const service = new CampaignService()
    service.resetCampaignStoresForTests()
    assert.throws(
      () =>
        service.registerCampaign({
          tenantContext,
          code: 'CAMP-002',
          title: 'empty',
          triggerEvent: CampaignTrigger.PaymentSuccess,
          conditions: [],
          actions: []
        }),
      /at least one action/
    )
  })

  test('registerCampaign validates action params per kind', () => {
    const service = new CampaignService()
    service.resetCampaignStoresForTests()
    assert.throws(
      () =>
        service.registerCampaign({
          tenantContext,
          code: 'CAMP-003',
          title: 'bad points',
          triggerEvent: CampaignTrigger.PaymentSuccess,
          conditions: [],
          actions: [{ kind: CampaignActionKind.AwardPoints, params: {} }]
        }),
      /positive pointsAmount/
    )
    assert.throws(
      () =>
        service.registerCampaign({
          tenantContext,
          code: 'CAMP-004',
          title: 'bad coupon',
          triggerEvent: CampaignTrigger.PaymentSuccess,
          conditions: [],
          actions: [{ kind: CampaignActionKind.IssueCoupon, params: {} }]
        }),
      /couponPlanId/
    )
    assert.throws(
      () =>
        service.registerCampaign({
          tenantContext,
          code: 'CAMP-005',
          title: 'bad blindbox',
          triggerEvent: CampaignTrigger.PaymentSuccess,
          conditions: [],
          actions: [{ kind: CampaignActionKind.IssueBlindbox, params: {} }]
        }),
      /blindboxPlanId/
    )
    assert.throws(
      () =>
        service.registerCampaign({
          tenantContext,
          code: 'CAMP-006',
          title: 'bad tag',
          triggerEvent: CampaignTrigger.PaymentSuccess,
          conditions: [],
          actions: [{ kind: CampaignActionKind.RecommendTag, params: {} }]
        }),
      /tagCode/
    )
  })

  test('updateCampaignStatus enforces valid transitions', () => {
    const service = new CampaignService()
    service.resetCampaignStoresForTests()
    const plan = service.registerCampaign({
      tenantContext,
      code: 'CAMP-007',
      title: 'transition',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [{ kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 10 } }]
    })
    const activated = service.updateCampaignStatus(plan.planId, CampaignStatus.Active, tenantContext.tenantId)
    assert.equal(activated.status, CampaignStatus.Active)
    const paused = service.updateCampaignStatus(plan.planId, CampaignStatus.Paused, tenantContext.tenantId)
    assert.equal(paused.status, CampaignStatus.Paused)
    const completed = service.updateCampaignStatus(plan.planId, CampaignStatus.Completed, tenantContext.tenantId)
    assert.equal(completed.status, CampaignStatus.Completed)
    // Cannot transition out of Completed
    assert.throws(
      () => service.updateCampaignStatus(plan.planId, CampaignStatus.Active, tenantContext.tenantId),
      /Invalid campaign status transition/
    )
  })

  test('updateCampaignStatus rejects plans from other tenants', () => {
    const service = new CampaignService()
    service.resetCampaignStoresForTests()
    const plan = service.registerCampaign({
      tenantContext,
      code: 'CAMP-008',
      title: 'isolated',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [{ kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 10 } }]
    })
    assert.throws(
      () => service.updateCampaignStatus(plan.planId, CampaignStatus.Active, 'other-tenant'),
      /Campaign plan not found/
    )
  })

  test('listCampaigns filters by tenant, status, triggerEvent and sorts by priority', () => {
    const service = new CampaignService()
    service.resetCampaignStoresForTests()
    const high = service.registerCampaign({
      tenantContext,
      code: 'HIGH',
      title: 'high',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [{ kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 1 } }],
      priority: 10
    })
    service.registerCampaign({
      tenantContext,
      code: 'LOW',
      title: 'low',
      triggerEvent: CampaignTrigger.MemberProfileSynced,
      conditions: [],
      actions: [{ kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 1 } }],
      priority: 200
    })
    service.updateCampaignStatus(high.planId, CampaignStatus.Active, tenantContext.tenantId)

    const activePaymentCampaigns = service.listCampaigns(tenantContext.tenantId, {
      status: CampaignStatus.Active,
      triggerEvent: CampaignTrigger.PaymentSuccess
    })
    assert.equal(activePaymentCampaigns.length, 1)
    assert.equal(activePaymentCampaigns[0]?.code, 'HIGH')

    const allCampaigns = service.listCampaigns(tenantContext.tenantId)
    assert.equal(allCampaigns.length, 2)
    assert.equal(allCampaigns[0]?.priority, 10)
    assert.equal(allCampaigns[1]?.priority, 200)
  })

  test('evaluateTriggers only matches Active campaigns with the matching trigger event', () => {
    const service = new CampaignService()
    service.resetCampaignStoresForTests()
    const draftPlan = service.registerCampaign({
      tenantContext,
      code: 'DRAFT',
      title: 'draft',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [{ kind: CampaignActionKind.RecommendTag, params: { tagCode: 'welcome' } }]
    })
    const otherEventPlan = service.registerCampaign({
      tenantContext,
      code: 'OTHER',
      title: 'other',
      triggerEvent: CampaignTrigger.MemberProfileSynced,
      conditions: [],
      actions: [{ kind: CampaignActionKind.RecommendTag, params: { tagCode: 'welcome' } }]
    })
    service.updateCampaignStatus(draftPlan.planId, CampaignStatus.Active, tenantContext.tenantId)
    service.updateCampaignStatus(otherEventPlan.planId, CampaignStatus.Active, tenantContext.tenantId)

    const result = service.evaluateTriggers({
      eventName: CampaignTrigger.PaymentSuccess,
      tenantContext,
      memberId: 'm-1',
      orderId: 'o-1'
    })
    assert.equal(result.matchedCampaigns, 1)
    // RecommendTag dispatches without needing MemberService / LoyaltyService
    assert.equal(result.dispatchedActions, 1)
    assert.equal(result.skippedActions, 0)
  })

  test('evaluateTriggers respects MinOrderAmount condition', () => {
    const service = new CampaignService()
    service.resetCampaignStoresForTests()
    const plan = service.registerCampaign({
      tenantContext,
      code: 'MIN-AMT',
      title: 'min amount',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 100 }],
      actions: [{ kind: CampaignActionKind.RecommendTag, params: { tagCode: 'premium' } }]
    })
    service.updateCampaignStatus(plan.planId, CampaignStatus.Active, tenantContext.tenantId)

    const below = service.evaluateTriggers({
      eventName: CampaignTrigger.PaymentSuccess,
      tenantContext,
      memberId: 'm-1',
      orderAmount: 80
    })
    assert.equal(below.matchedCampaigns, 0)

    const above = service.evaluateTriggers({
      eventName: CampaignTrigger.PaymentSuccess,
      tenantContext,
      memberId: 'm-2',
      orderAmount: 150
    })
    assert.equal(above.matchedCampaigns, 1)
    assert.equal(above.dispatchedActions, 1)
  })

  test('evaluateTriggers respects MemberLevel, StoreScope, BrandScope conditions', () => {
    const service = new CampaignService()
    service.resetCampaignStoresForTests()
    const plan = service.registerCampaign({
      tenantContext,
      code: 'SCOPED',
      title: 'scoped',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [
        { type: CampaignConditionType.MemberLevel, value: ['gold', 'platinum'] },
        { type: CampaignConditionType.StoreScope, value: ['store-001', 'store-002'] },
        { type: CampaignConditionType.BrandScope, value: 'brand-001' }
      ],
      actions: [{ kind: CampaignActionKind.RecommendTag, params: { tagCode: 'vip-loyalty' } }]
    })
    service.updateCampaignStatus(plan.planId, CampaignStatus.Active, tenantContext.tenantId)

    const rejectLevel = service.evaluateTriggers({
      eventName: CampaignTrigger.PaymentSuccess,
      tenantContext,
      memberId: 'm-1',
      memberLevel: 'silver'
    })
    assert.equal(rejectLevel.matchedCampaigns, 0)

    const rejectStore = service.evaluateTriggers({
      eventName: CampaignTrigger.PaymentSuccess,
      tenantContext,
      memberId: 'm-1',
      memberLevel: 'gold',
      storeId: 'store-other'
    })
    assert.equal(rejectStore.matchedCampaigns, 0)

    const rejectBrand = service.evaluateTriggers({
      eventName: CampaignTrigger.PaymentSuccess,
      tenantContext: { ...tenantContext, brandId: 'brand-OTHER' },
      memberId: 'm-1',
      memberLevel: 'gold',
      storeId: 'store-001'
    })
    assert.equal(rejectBrand.matchedCampaigns, 0)

    const accept = service.evaluateTriggers({
      eventName: CampaignTrigger.PaymentSuccess,
      tenantContext,
      memberId: 'm-1',
      memberLevel: 'gold',
      storeId: 'store-001'
    })
    assert.equal(accept.matchedCampaigns, 1)
  })

  test('evaluateTriggers enforces idempotency by (planId, actionIndex, memberId, orderId)', () => {
    const service = new CampaignService()
    service.resetCampaignStoresForTests()
    const plan = service.registerCampaign({
      tenantContext,
      code: 'IDEMPOTENT',
      title: 'idempotent',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [{ kind: CampaignActionKind.RecommendTag, params: { tagCode: 'cashback' } }]
    })
    service.updateCampaignStatus(plan.planId, CampaignStatus.Active, tenantContext.tenantId)

    const first = service.evaluateTriggers({
      eventName: CampaignTrigger.PaymentSuccess,
      tenantContext,
      memberId: 'm-1',
      orderId: 'o-1'
    })
    assert.equal(first.dispatchedActions, 1)
    assert.equal(first.skippedActions, 0)

    const second = service.evaluateTriggers({
      eventName: CampaignTrigger.PaymentSuccess,
      tenantContext,
      memberId: 'm-1',
      orderId: 'o-1'
    })
    assert.equal(second.dispatchedActions, 0)
    assert.equal(second.skippedActions, 1)
  })

  test('evaluateTriggers dispatches AwardPoints through MemberService when configured', () => {
    const service = new CampaignService(undefined, undefined)
    service.resetCampaignStoresForTests()
    const awardPointsCalls: Array<{ memberId: string; amount: number; tenantId: string }> = []
    const memberService = {
      awardPoints: async (memberId: string, amount: number, ctx: { tenantId: string }) => {
        awardPointsCalls.push({ memberId, amount, tenantId: ctx.tenantId })
      }
    } as any
    const loyaltyService = {} as any
    const svc = new CampaignService(memberService, loyaltyService)
    svc.resetCampaignStoresForTests()
    const plan = svc.registerCampaign({
      tenantContext,
      code: 'AWARD',
      title: 'award',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [{ kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 200, pointsReason: 'campaign:CAMP' } }]
    })
    svc.updateCampaignStatus(plan.planId, CampaignStatus.Active, tenantContext.tenantId)

    const result = svc.evaluateTriggers({
      eventName: CampaignTrigger.PaymentSuccess,
      tenantContext,
      memberId: 'm-1',
      orderId: 'o-1'
    })
    assert.equal(result.dispatchedActions, 1)
    assert.equal(awardPointsCalls.length, 1)
    assert.equal(awardPointsCalls[0]?.memberId, 'm-1')
    assert.equal(awardPointsCalls[0]?.amount, 200)
    assert.equal(awardPointsCalls[0]?.tenantId, 'tenant-001')
  })

  test('evaluateTriggers dispatches IssueCoupon through LoyaltyService when configured', () => {
    const svc = new CampaignService(undefined, undefined)
    svc.resetCampaignStoresForTests()
    const redemption = {
      redemptionId: 'coupon-r-1',
      tenantContext,
      orderId: 'pending-m-1',
      paymentId: 'pending-m-1',
      memberId: 'm-1',
      couponCode: 'WELCOME',
      status: 'REDEEMED',
      createdAt: new Date().toISOString()
    }
    const loyaltyService = {
      issueCouponFromPlan: () => redemption
    } as any
    const memberService = {} as any
    const s = new CampaignService(memberService, loyaltyService)
    s.resetCampaignStoresForTests()
    const plan = s.registerCampaign({
      tenantContext,
      code: 'ISSUE',
      title: 'issue coupon',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [{ kind: CampaignActionKind.IssueCoupon, params: { couponPlanId: 'cp-1' } }]
    })
    s.updateCampaignStatus(plan.planId, CampaignStatus.Active, tenantContext.tenantId)
    const result = s.evaluateTriggers({
      eventName: CampaignTrigger.PaymentSuccess,
      tenantContext,
      memberId: 'm-1',
      orderId: 'o-1'
    })
    assert.equal(result.dispatchedActions, 1)
    assert.equal(
      s.listDispatches(tenantContext.tenantId, { planId: plan.planId })[0]?.resultRef,
      'coupon-r-1'
    )
  })

  test('evaluateTriggers marks IssueBlindbox dispatch failed when LoyaltyService throws', () => {
    const svc = new CampaignService(undefined, undefined)
    svc.resetCampaignStoresForTests()
    const loyaltyService = {
      issueBlindboxFromPlan: () => {
        throw new Error('quota exhausted')
      }
    } as any
    const s = new CampaignService(undefined, loyaltyService)
    s.resetCampaignStoresForTests()
    const plan = s.registerCampaign({
      tenantContext,
      code: 'BLIND',
      title: 'blindbox',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [{ kind: CampaignActionKind.IssueBlindbox, params: { blindboxPlanId: 'bp-1' } }]
    })
    s.updateCampaignStatus(plan.planId, CampaignStatus.Active, tenantContext.tenantId)
    const result = s.evaluateTriggers({
      eventName: CampaignTrigger.PaymentSuccess,
      tenantContext,
      memberId: 'm-1',
      orderId: 'o-1'
    })
    assert.equal(result.failedActions, 1)
    assert.equal(result.dispatchedActions, 0)
    const dispatch = s.listDispatches(tenantContext.tenantId)[0]
    assert.equal(dispatch?.status, 'FAILED')
    assert.equal(dispatch?.errorMessage, 'quota exhausted')
  })

  test('evaluateTriggers skips RecommendTag with no resultRef but records dispatch', () => {
    const service = new CampaignService()
    service.resetCampaignStoresForTests()
    const plan = service.registerCampaign({
      tenantContext,
      code: 'TAG',
      title: 'recommend',
      triggerEvent: CampaignTrigger.MemberProfileSynced,
      conditions: [],
      actions: [{ kind: CampaignActionKind.RecommendTag, params: { tagCode: 'new-vip' } }]
    })
    service.updateCampaignStatus(plan.planId, CampaignStatus.Active, tenantContext.tenantId)
    const result = service.evaluateTriggers({
      eventName: CampaignTrigger.MemberProfileSynced,
      tenantContext,
      memberId: 'm-1'
    })
    assert.equal(result.dispatchedActions, 1)
    const dispatch = service.listDispatches(tenantContext.tenantId)[0]
    assert.equal(dispatch?.resultRef, 'tag:new-vip')
  })

  test('evaluateTriggers skips AwardPoints when memberId is missing', () => {
    const memberService = {
      awardPoints: async () => undefined
    } as any
    const svc = new CampaignService(memberService, undefined)
    svc.resetCampaignStoresForTests()
    const plan = svc.registerCampaign({
      tenantContext,
      code: 'NO-MEMBER',
      title: 'no member',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [{ kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 50 } }]
    })
    svc.updateCampaignStatus(plan.planId, CampaignStatus.Active, tenantContext.tenantId)
    const result = svc.evaluateTriggers({
      eventName: CampaignTrigger.PaymentSuccess,
      tenantContext
    })
    assert.equal(result.skippedActions, 1)
    assert.equal(result.dispatchedActions, 0)
    const dispatch = svc.listDispatches(tenantContext.tenantId)[0]
    assert.equal(dispatch?.status, 'SKIPPED')
  })

  test('listDispatches filters by memberId and planId', () => {
    const service = new CampaignService()
    service.resetCampaignStoresForTests()
    const p1 = service.registerCampaign({
      tenantContext,
      code: 'P1',
      title: 'p1',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [{ kind: CampaignActionKind.RecommendTag, params: { tagCode: 't1' } }]
    })
    const p2 = service.registerCampaign({
      tenantContext,
      code: 'P2',
      title: 'p2',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [{ kind: CampaignActionKind.RecommendTag, params: { tagCode: 't2' } }]
    })
    service.updateCampaignStatus(p1.planId, CampaignStatus.Active, tenantContext.tenantId)
    service.updateCampaignStatus(p2.planId, CampaignStatus.Active, tenantContext.tenantId)

    service.evaluateTriggers({
      eventName: CampaignTrigger.PaymentSuccess,
      tenantContext,
      memberId: 'm-1',
      orderId: 'o-1'
    })
    service.evaluateTriggers({
      eventName: CampaignTrigger.PaymentSuccess,
      tenantContext,
      memberId: 'm-2',
      orderId: 'o-2'
    })

    const m1 = service.listDispatches(tenantContext.tenantId, { memberId: 'm-1' })
    assert.equal(m1.length, 2)
    assert.ok(m1.some((d) => d.planId === p1.planId))
    assert.ok(m1.some((d) => d.planId === p2.planId))

    const byPlan1 = service.listDispatches(tenantContext.tenantId, { planId: p1.planId })
    assert.equal(byPlan1.length, 2)

    const dispatched = service.listDispatches(tenantContext.tenantId, {
      planId: p1.planId,
      status: 'DISPATCHED' as any
    })
    assert.equal(dispatched.length, 2)
  })

  test('scheduledStart in the future suppresses trigger evaluation', () => {
    const service = new CampaignService()
    service.resetCampaignStoresForTests()
    const plan = service.registerCampaign({
      tenantContext,
      code: 'FUTURE',
      title: 'future',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [{ kind: CampaignActionKind.RecommendTag, params: { tagCode: 'prelaunch' } }],
      scheduledStart: new Date(Date.now() + 1000 * 60 * 60).toISOString()
    })
    service.updateCampaignStatus(plan.planId, CampaignStatus.Active, tenantContext.tenantId)
    const result = service.evaluateTriggers({
      eventName: CampaignTrigger.PaymentSuccess,
      tenantContext,
      memberId: 'm-1'
    })
    assert.equal(result.matchedCampaigns, 0)
  })

  test('scheduledEnd in the past suppresses trigger evaluation', () => {
    const service = new CampaignService()
    service.resetCampaignStoresForTests()
    const plan = service.registerCampaign({
      tenantContext,
      code: 'PAST',
      title: 'past',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [{ kind: CampaignActionKind.RecommendTag, params: { tagCode: 'legacy' } }],
      scheduledEnd: new Date(Date.now() - 1000 * 60 * 60).toISOString()
    })
    service.updateCampaignStatus(plan.planId, CampaignStatus.Active, tenantContext.tenantId)
    const result = service.evaluateTriggers({
      eventName: CampaignTrigger.PaymentSuccess,
      tenantContext,
      memberId: 'm-1'
    })
    assert.equal(result.matchedCampaigns, 0)
  })

  test('cross-tenant isolation: plan in tenant A is invisible to tenant B', () => {
    const service = new CampaignService()
    service.resetCampaignStoresForTests()
    service.registerCampaign({
      tenantContext: { tenantId: 'tenant-A' },
      code: 'A',
      title: 'A',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [{ kind: CampaignActionKind.RecommendTag, params: { tagCode: 'a' } }]
    })
    const aCampaigns = service.listCampaigns('tenant-A')
    const bCampaigns = service.listCampaigns('tenant-B')
    assert.equal(aCampaigns.length, 1)
    assert.equal(bCampaigns.length, 0)
  })
})
