import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  toCampaignPlanContract,
  toCampaignDispatchContract
} from './campaign.contract'
import {
  CampaignStatus,
  CampaignTrigger,
  CampaignActionKind,
  CampaignActionStatus,
  CampaignConditionType
} from './campaign.entity'

describe('campaign contract mappers', () => {
  // ── toCampaignPlanContract ──

  describe('toCampaignPlanContract()', () => {
    test('maps full CampaignPlan to CampaignPlanContract', () => {
      const plan = {
        planId: 'plan-001',
        tenantContext: { scopeType: 'TENANT', scopeCode: 'tenant-a' } as never,
        code: 'POINTS_DOUBLE',
        title: 'Double Points Weekend',
        description: 'Earn 2x points on all purchases',
        status: CampaignStatus.Active,
        triggerEvent: CampaignTrigger.PaymentSuccess,
        conditions: [
          { type: CampaignConditionType.MinOrderAmount, value: 99.9 },
          { type: CampaignConditionType.MemberLevel, value: ['SVIP', 'VIP'] }
        ],
        actions: [
          {
            kind: CampaignActionKind.AwardPoints,
            params: { pointsAmount: 200, pointsReason: 'Double Points Weekend' }
          },
          {
            kind: CampaignActionKind.IssueCoupon,
            params: { couponPlanId: 'cp-free-coffee' }
          }
        ],
        priority: 10,
        scheduledStart: '2026-06-20T00:00:00Z',
        scheduledEnd: '2026-06-22T23:59:59Z',
        createdAt: '2026-06-19T12:00:00Z',
        updatedAt: '2026-06-19T12:30:00Z'
      }

      const contract = toCampaignPlanContract(plan)

      assert.equal(contract.planId, 'plan-001')
      assert.equal(contract.code, 'POINTS_DOUBLE')
      assert.equal(contract.title, 'Double Points Weekend')
      assert.equal(contract.description, 'Earn 2x points on all purchases')
      assert.equal(contract.status, CampaignStatus.Active)
      assert.equal(contract.triggerEvent, CampaignTrigger.PaymentSuccess)
      assert.equal(contract.priority, 10)
      assert.equal(contract.scheduledStart, '2026-06-20T00:00:00Z')
      assert.equal(contract.scheduledEnd, '2026-06-22T23:59:59Z')
      assert.equal(contract.createdAt, '2026-06-19T12:00:00Z')
      assert.equal(contract.updatedAt, '2026-06-19T12:30:00Z')

      // conditions are passed through
      assert.equal(contract.conditions.length, 2)
      assert.equal(contract.conditions[0].type, CampaignConditionType.MinOrderAmount)
      assert.equal(contract.conditions[0].value, 99.9)
      assert.equal(contract.conditions[1].type, CampaignConditionType.MemberLevel)
      assert.deepEqual(contract.conditions[1].value, ['SVIP', 'VIP'])

      // actions are passed through
      assert.equal(contract.actions.length, 2)
      assert.equal(contract.actions[0].kind, CampaignActionKind.AwardPoints)
      assert.deepEqual(contract.actions[0].params, { pointsAmount: 200, pointsReason: 'Double Points Weekend' })
      assert.equal(contract.actions[1].kind, CampaignActionKind.IssueCoupon)
      assert.deepEqual(contract.actions[1].params, { couponPlanId: 'cp-free-coffee' })
    })

    test('maps plan with optional fields omitted (undefined → undefined)', () => {
      const plan = {
        planId: 'plan-minimal',
        tenantContext: { scopeType: 'PLATFORM', scopeCode: 'default' } as never,
        code: 'MINIMAL',
        title: 'Minimal Plan',
        status: CampaignStatus.Draft,
        triggerEvent: CampaignTrigger.MemberProfileSynced,
        conditions: [],
        actions: [],
        priority: 0,
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z'
      }

      const contract = toCampaignPlanContract(plan)

      assert.equal(contract.planId, 'plan-minimal')
      assert.equal(contract.description, undefined)
      assert.equal(contract.scheduledStart, undefined)
      assert.equal(contract.scheduledEnd, undefined)
    })

    test('maps DRAFT status plan correctly', () => {
      const plan = {
        planId: 'plan-draft',
        tenantContext: { scopeType: 'TENANT', scopeCode: 'tenant-b' } as never,
        code: 'DRAFT_PLAN',
        title: 'Draft Plan',
        status: CampaignStatus.Draft,
        triggerEvent: CampaignTrigger.OrderCreated,
        conditions: [],
        actions: [
          {
            kind: CampaignActionKind.RecommendTag,
            params: { tagCode: 'vip-recommend', tagMessage: 'VIP exclusive offer' }
          }
        ],
        priority: 5,
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z'
      }

      const contract = toCampaignPlanContract(plan)

      assert.equal(contract.status, CampaignStatus.Draft)
      assert.equal(contract.actions[0].kind, CampaignActionKind.RecommendTag)
    })
  })

  // ── toCampaignDispatchContract ──

  describe('toCampaignDispatchContract()', () => {
    test('maps full CampaignDispatch to CampaignDispatchContract', () => {
      const dispatch = {
        dispatchId: 'disp-001',
        planId: 'plan-001',
        actionIndex: 0,
        tenantContext: { scopeType: 'TENANT', scopeCode: 'tenant-a' } as never,
        memberId: 'member-001',
        orderId: 'order-001',
        paymentId: 'pay-001',
        triggerEvent: CampaignTrigger.PaymentSuccess,
        status: CampaignActionStatus.Dispatched,
        errorMessage: undefined,
        resultRef: 'ref-award-xyz',
        createdAt: '2026-06-20T14:30:00Z'
      }

      const contract = toCampaignDispatchContract(dispatch)

      assert.equal(contract.dispatchId, 'disp-001')
      assert.equal(contract.planId, 'plan-001')
      assert.equal(contract.actionIndex, 0)
      assert.equal(contract.memberId, 'member-001')
      assert.equal(contract.orderId, 'order-001')
      assert.equal(contract.paymentId, 'pay-001')
      assert.equal(contract.triggerEvent, CampaignTrigger.PaymentSuccess)
      assert.equal(contract.status, CampaignActionStatus.Dispatched)
      assert.equal(contract.resultRef, 'ref-award-xyz')
      assert.equal(contract.createdAt, '2026-06-20T14:30:00Z')
      assert.equal(contract.errorMessage, undefined)
    })

    test('maps Failed dispatch with errorMessage', () => {
      const dispatch = {
        dispatchId: 'disp-fail',
        planId: 'plan-001',
        actionIndex: 1,
        tenantContext: { scopeType: 'TENANT', scopeCode: 'tenant-a' } as never,
        memberId: 'member-002',
        triggerEvent: CampaignTrigger.PaymentSuccess,
        status: CampaignActionStatus.Failed,
        errorMessage: 'Coupon plan not found',
        createdAt: '2026-06-20T14:30:01Z'
      }

      const contract = toCampaignDispatchContract(dispatch)

      assert.equal(contract.dispatchId, 'disp-fail')
      assert.equal(contract.status, CampaignActionStatus.Failed)
      assert.equal(contract.errorMessage, 'Coupon plan not found')
      assert.equal(contract.orderId, undefined)
      assert.equal(contract.paymentId, undefined)
      assert.equal(contract.resultRef, undefined)
    })

    test('maps Skipped dispatch', () => {
      const dispatch = {
        dispatchId: 'disp-skip',
        planId: 'plan-001',
        actionIndex: 2,
        tenantContext: { scopeType: 'PLATFORM', scopeCode: 'default' } as never,
        triggerEvent: CampaignTrigger.MemberActivityRecurring,
        status: CampaignActionStatus.Skipped,
        createdAt: '2026-06-20T15:00:00Z'
      }

      const contract = toCampaignDispatchContract(dispatch)

      assert.equal(contract.dispatchId, 'disp-skip')
      assert.equal(contract.status, CampaignActionStatus.Skipped)
      assert.equal(contract.memberId, undefined)
      assert.equal(contract.orderId, undefined)
      assert.equal(contract.paymentId, undefined)
    })
  })

  // ── contract field integrity ──

  describe('contract field integrity', () => {
    test('CampaignPlanContract contains all required output fields', () => {
      const plan = {
        planId: 'p-001',
        tenantContext: { scopeType: 'TENANT', scopeCode: 't-001' } as never,
        code: 'C1',
        title: 'Campaign 1',
        status: CampaignStatus.Active,
        triggerEvent: CampaignTrigger.PaymentSuccess,
        conditions: [
          { type: CampaignConditionType.StoreScope, value: ['store-1', 'store-2'] }
        ],
        actions: [
          {
            kind: CampaignActionKind.IssueBlindbox,
            params: { blindboxPlanId: 'bb-x', blindboxQuantity: 3 }
          }
        ],
        priority: 1,
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z'
      }

      const contract = toCampaignPlanContract(plan)
      const keys = Object.keys(contract).sort()

      // All expected fields present
      assert.ok(keys.includes('planId'))
      assert.ok(keys.includes('tenantContext'))
      assert.ok(keys.includes('code'))
      assert.ok(keys.includes('title'))
      assert.ok(keys.includes('status'))
      assert.ok(keys.includes('triggerEvent'))
      assert.ok(keys.includes('conditions'))
      assert.ok(keys.includes('actions'))
      assert.ok(keys.includes('priority'))
      assert.ok(keys.includes('createdAt'))
      assert.ok(keys.includes('updatedAt'))

      // description, scheduledStart, scheduledEnd only present when set
      // (they are marked as optional in the interface)
    })

    test('CampaignDispatchContract contains all required output fields', () => {
      const dispatch = {
        dispatchId: 'd-001',
        planId: 'p-001',
        actionIndex: 0,
        tenantContext: { scopeType: 'TENANT', scopeCode: 't-001' } as never,
        triggerEvent: CampaignTrigger.OrderCreated,
        status: CampaignActionStatus.Pending,
        createdAt: '2026-06-01T00:00:00Z'
      }

      const contract = toCampaignDispatchContract(dispatch)
      const keys = Object.keys(contract).sort()

      assert.ok(keys.includes('dispatchId'))
      assert.ok(keys.includes('planId'))
      assert.ok(keys.includes('actionIndex'))
      assert.ok(keys.includes('tenantContext'))
      assert.ok(keys.includes('triggerEvent'))
      assert.ok(keys.includes('status'))
      assert.ok(keys.includes('createdAt'))
    })
  })
})
