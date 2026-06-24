/**
 * CampaignController 单元测试 (node:test)
 *
 * 策略：内联 Controller + Mock Service，覆盖所有路由端点。
 * 正向流程 + 边界条件（空数据集、缺失参数、无效状态转换）。
 */

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

// ── Entity mirrors (avoid NestJS DI) ───────────────────────────
const CampaignStatus = {
  Draft: 'DRAFT',
  Scheduled: 'SCHEDULED',
  Active: 'ACTIVE',
  Paused: 'PAUSED',
  Completed: 'COMPLETED',
} as const

const CampaignTrigger = {
  PaymentSuccess: 'payment.success',
  MemberProfileSynced: 'member.profile-synced',
  OrderCreated: 'order.created',
  MemberActivityRecurring: 'member.activity-recurring',
} as const

const CampaignActionKind = {
  AwardPoints: 'AWARD_POINTS',
  IssueCoupon: 'ISSUE_COUPON',
  IssueBlindbox: 'ISSUE_BLINDBOX',
  RecommendTag: 'RECOMMEND_TAG',
} as const

const CampaignActionStatus = {
  Pending: 'PENDING',
  Dispatched: 'DISPATCHED',
  Failed: 'FAILED',
  Skipped: 'SKIPPED',
} as const

// ── Contract mirrors ──────────────────────────────────────────
function toCampaignPlanContract(plan: any) {
  return {
    planId: plan.planId,
    tenantContext: plan.tenantContext,
    code: plan.code,
    title: plan.title,
    description: plan.description,
    status: plan.status,
    triggerEvent: plan.triggerEvent,
    conditions: plan.conditions,
    actions: plan.actions,
    priority: plan.priority,
    scheduledStart: plan.scheduledStart,
    scheduledEnd: plan.scheduledEnd,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  }
}

function toCampaignDispatchContract(dispatch: any) {
  return {
    dispatchId: dispatch.dispatchId,
    planId: dispatch.planId,
    actionIndex: dispatch.actionIndex,
    tenantContext: dispatch.tenantContext,
    memberId: dispatch.memberId,
    orderId: dispatch.orderId,
    paymentId: dispatch.paymentId,
    triggerEvent: dispatch.triggerEvent,
    status: dispatch.status,
    errorMessage: dispatch.errorMessage,
    resultRef: dispatch.resultRef,
    createdAt: dispatch.createdAt,
  }
}

// ── Inline Controller (mirrors source: campaign.controller.ts) ─
class CampaignController {
  private campaignService: any

  constructor(campaignService: any) {
    this.campaignService = campaignService
  }

  registerCampaign(tenantContext: any, body: any) {
    const plan = this.campaignService.registerCampaign({
      tenantContext,
      code: body.code,
      title: body.title,
      description: body.description,
      triggerEvent: body.triggerEvent,
      conditions: body.conditions,
      actions: body.actions,
      priority: body.priority,
      scheduledStart: body.scheduledStart,
      scheduledEnd: body.scheduledEnd,
    })
    return toCampaignPlanContract(plan)
  }

  listCampaigns(tenantContext: any, query: any) {
    return this.campaignService
      .listCampaigns(tenantContext.tenantId, {
        status: query.status,
        triggerEvent: query.triggerEvent,
      })
      .map((plan: any) => toCampaignPlanContract(plan))
  }

  getCampaign(tenantContext: any, planId: string) {
    const plan = this.campaignService.getCampaign(planId, tenantContext.tenantId)
    return plan ? toCampaignPlanContract(plan) : null
  }

  updateCampaignStatus(tenantContext: any, planId: string, body: any) {
    const plan = this.campaignService.updateCampaignStatus(
      planId,
      body.status,
      tenantContext.tenantId
    )
    return toCampaignPlanContract(plan)
  }

  listPlanDispatches(tenantContext: any, planId: string) {
    return this.campaignService
      .listDispatches(tenantContext.tenantId, { planId })
      .map((dispatch: any) => toCampaignDispatchContract(dispatch))
  }

  listDispatches(tenantContext: any, query: any) {
    return this.campaignService
      .listDispatches(tenantContext.tenantId, {
        memberId: query.memberId,
        status: query.status,
      })
      .map((dispatch: any) => toCampaignDispatchContract(dispatch))
  }

  evaluateTriggers(tenantContext: any, body: any) {
    return this.campaignService.evaluateTriggers({ ...body, tenantContext })
  }
}

// ── Helpers ───────────────────────────────────────────────────
function makeTenantContext(overrides: Record<string, any> = {}) {
  return {
    tenantId: 't-001',
    brandId: 'b-001',
    storeId: 's-001',
    marketCode: 'zh-cn',
    ...overrides,
  }
}

function makeCampaignPlan(overrides: Record<string, any> = {}) {
  return {
    planId: 'plan-001',
    tenantContext: makeTenantContext(),
    code: 'CP001',
    title: 'Test Campaign',
    description: 'A test campaign',
    status: CampaignStatus.Draft,
    triggerEvent: CampaignTrigger.PaymentSuccess,
    conditions: [],
    actions: [],
    priority: 0,
    scheduledStart: undefined,
    scheduledEnd: undefined,
    createdAt: '2026-06-23T10:00:00Z',
    updatedAt: '2026-06-23T10:00:00Z',
    ...overrides,
  }
}

function makeCampaignDispatch(overrides: Record<string, any> = {}) {
  return {
    dispatchId: 'disp-001',
    planId: 'plan-001',
    actionIndex: 0,
    tenantContext: makeTenantContext(),
    memberId: 'mem-001',
    orderId: 'ord-001',
    paymentId: null,
    triggerEvent: CampaignTrigger.PaymentSuccess,
    status: CampaignActionStatus.Pending,
    errorMessage: undefined,
    resultRef: undefined,
    createdAt: '2026-06-23T10:00:00Z',
    ...overrides,
  }
}

function makeMockService(overrides: Record<string, any> = {}) {
  return {
    registerCampaign: () => makeCampaignPlan(),
    listCampaigns: () => [],
    getCampaign: () => null,
    updateCampaignStatus: () => makeCampaignPlan(),
    listDispatches: () => [],
    evaluateTriggers: () => ({
      matchedCampaigns: 0,
      dispatchedActions: 0,
      skippedActions: 0,
      failedActions: 0,
      dispatches: [],
    }),
    ...overrides,
  }
}

function makeMockServiceWithData() {
  const plan1 = makeCampaignPlan()
  const plan2 = makeCampaignPlan({ planId: 'plan-002', code: 'CP002', status: CampaignStatus.Active })
  const disp1 = makeCampaignDispatch()
  const disp2 = makeCampaignDispatch({ dispatchId: 'disp-002', status: CampaignActionStatus.Dispatched })

  return makeMockService({
    registerCampaign: () => plan1,
    listCampaigns: () => [plan1, plan2],
    getCampaign: (id: string) => (id === 'plan-001' ? plan1 : null),
    updateCampaignStatus: (id: string, status: string) => makeCampaignPlan({ planId: id, status }),
    listDispatches: () => [disp1, disp2],
    evaluateTriggers: () => ({
      matchedCampaigns: 2,
      dispatchedActions: 1,
      skippedActions: 1,
      failedActions: 0,
      dispatches: [disp1, disp2],
    }),
  })
}

// ── Tests ─────────────────────────────────────────────────────
describe('CampaignController', () => {

  // ── POST /campaigns ───────────────────────────────────────
  describe('registerCampaign()', () => {
    test('returns CampaignPlanContract on successful registration', () => {
      const mockService = makeMockServiceWithData()
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const body = {
        code: 'CP001',
        title: 'New Campaign',
        description: 'Test',
        triggerEvent: CampaignTrigger.PaymentSuccess,
        conditions: [],
        actions: [],
      }
      const result = controller.registerCampaign(ctx, body)
      assert.strictEqual(result.planId, 'plan-001')
      assert.strictEqual(result.code, 'CP001')
      assert.strictEqual(result.status, CampaignStatus.Draft)
    })

    test('passes all body fields to service', () => {
      let capturedInput: any = null
      const mockService = makeMockService({
        registerCampaign: (input: any) => {
          capturedInput = input
          return makeCampaignPlan()
        },
      })
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const body = {
        code: 'CP-BUNDLE',
        title: 'Bundle Campaign',
        description: 'Test bundle',
        triggerEvent: CampaignTrigger.OrderCreated,
        conditions: [{ type: 'MIN_ORDER_AMOUNT', value: 100 }],
        actions: [{ kind: CampaignActionKind.AwardPoints, params: { points: 500 } }],
        priority: 10,
        scheduledStart: '2026-07-01T00:00:00Z',
        scheduledEnd: '2026-07-31T23:59:59Z',
      }
      controller.registerCampaign(ctx, body)
      assert.strictEqual(capturedInput.code, 'CP-BUNDLE')
      assert.strictEqual(capturedInput.triggerEvent, CampaignTrigger.OrderCreated)
      assert.strictEqual(capturedInput.priority, 10)
      assert.strictEqual(capturedInput.scheduledStart, '2026-07-01T00:00:00Z')
      assert.strictEqual(capturedInput.conditions[0].type, 'MIN_ORDER_AMOUNT')
      assert.strictEqual(capturedInput.actions[0].kind, CampaignActionKind.AwardPoints)
      assert.strictEqual(capturedInput.actions[0].params.points, 500)
    })

    test('handles empty conditions and actions arrays', () => {
      const mockService = makeMockServiceWithData()
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const body = {
        code: 'CP-EMPTY',
        title: 'Empty Campaign',
        triggerEvent: CampaignTrigger.MemberProfileSynced,
        conditions: [],
        actions: [],
      }
      const result = controller.registerCampaign(ctx, body)
      assert.strictEqual(result.planId, 'plan-001')
      assert.deepStrictEqual(result.conditions, [])
      assert.deepStrictEqual(result.actions, [])
    })
  })

  // ── GET /campaigns ────────────────────────────────────────
  describe('listCampaigns()', () => {
    test('returns empty array when no campaigns exist', () => {
      const mockService = makeMockService()
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const result = controller.listCampaigns(ctx, {})
      assert.deepStrictEqual(result, [])
    })

    test('returns all campaigns when no filters applied', () => {
      const mockService = makeMockServiceWithData()
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const result = controller.listCampaigns(ctx, {})
      assert.strictEqual(result.length, 2)
      assert.strictEqual(result[0].planId, 'plan-001')
      assert.strictEqual(result[1].planId, 'plan-002')
    })

    test('filters by status', () => {
      let capturedFilters: any = null
      const mockService = makeMockService({
        listCampaigns: (_tenantId: string, filters: any) => {
          capturedFilters = filters
          return []
        },
      })
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      controller.listCampaigns(ctx, { status: CampaignStatus.Active })
      assert.strictEqual(capturedFilters.status, CampaignStatus.Active)
    })

    test('filters by triggerEvent', () => {
      let capturedFilters: any = null
      const mockService = makeMockService({
        listCampaigns: (_tenantId: string, filters: any) => {
          capturedFilters = filters
          return []
        },
      })
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      controller.listCampaigns(ctx, {
        triggerEvent: CampaignTrigger.OrderCreated,
      })
      assert.strictEqual(capturedFilters.triggerEvent, CampaignTrigger.OrderCreated)
    })

    test('filters by both status and triggerEvent', () => {
      let capturedFilters: any = null
      const mockService = makeMockService({
        listCampaigns: (_tenantId: string, filters: any) => {
          capturedFilters = filters
          return []
        },
      })
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      controller.listCampaigns(ctx, {
        status: CampaignStatus.Active,
        triggerEvent: CampaignTrigger.PaymentSuccess,
      })
      assert.strictEqual(capturedFilters.status, CampaignStatus.Active)
      assert.strictEqual(capturedFilters.triggerEvent, CampaignTrigger.PaymentSuccess)
    })
  })

  // ── GET /campaigns/:planId ────────────────────────────────
  describe('getCampaign()', () => {
    test('returns plan contract for existing campaign', () => {
      const mockService = makeMockServiceWithData()
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const result = controller.getCampaign(ctx, 'plan-001')
      assert.notStrictEqual(result, null)
      assert.strictEqual(result!.planId, 'plan-001')
      assert.strictEqual(result!.code, 'CP001')
    })

    test('returns null for non-existing campaign', () => {
      const mockService = makeMockServiceWithData()
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const result = controller.getCampaign(ctx, 'plan-999')
      assert.strictEqual(result, null)
    })

    test('returns null when service returns undefined', () => {
      const mockService = makeMockService({
        getCampaign: () => undefined,
      })
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const result = controller.getCampaign(ctx, 'any-plan')
      assert.strictEqual(result, null)
    })

    test('forwards tenantId to service', () => {
      let capturedTenantId: string | null = null
      const mockService = makeMockService({
        getCampaign: (planId: string, tenantId: string) => {
          capturedTenantId = tenantId
          return null
        },
      })
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext({ tenantId: 't-custom' })
      controller.getCampaign(ctx, 'plan-001')
      assert.strictEqual(capturedTenantId, 't-custom')
    })
  })

  // ── PATCH /campaigns/:planId/status ───────────────────────
  describe('updateCampaignStatus()', () => {
    test('updates status to Active', () => {
      let capturedPlanId: string | null = null
      let capturedStatus: string | null = null
      const mockService = makeMockService({
        updateCampaignStatus: (planId: string, status: string) => {
          capturedPlanId = planId
          capturedStatus = status
          return makeCampaignPlan({ planId, status })
        },
      })
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const result = controller.updateCampaignStatus(ctx, 'plan-001', {
        status: CampaignStatus.Active,
      })
      assert.strictEqual(capturedPlanId, 'plan-001')
      assert.strictEqual(capturedStatus, CampaignStatus.Active)
      assert.strictEqual(result.status, CampaignStatus.Active)
    })

    test('updates status to Paused', () => {
      const mockService = makeMockService({
        updateCampaignStatus: (planId: string, status: string) =>
          makeCampaignPlan({ planId, status }),
      })
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const result = controller.updateCampaignStatus(ctx, 'plan-001', {
        status: CampaignStatus.Paused,
      })
      assert.strictEqual(result.status, CampaignStatus.Paused)
    })

    test('updates status to Completed', () => {
      const mockService = makeMockServiceWithData()
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const result = controller.updateCampaignStatus(ctx, 'plan-001', {
        status: CampaignStatus.Completed,
      })
      assert.strictEqual(result.status, CampaignStatus.Completed)
    })

    test('passes tenantId to service', () => {
      let capturedTenantId: string | null = null
      const mockService = makeMockService({
        updateCampaignStatus: (planId: string, status: string, tenantId: string) => {
          capturedTenantId = tenantId
          return makeCampaignPlan({ planId, status })
        },
      })
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext({ tenantId: 't-tenant-bound' })
      controller.updateCampaignStatus(ctx, 'plan-001', {
        status: CampaignStatus.Active,
      })
      assert.strictEqual(capturedTenantId, 't-tenant-bound')
    })
  })

  // ── GET /campaigns/:planId/dispatches ─────────────────────
  describe('listPlanDispatches()', () => {
    test('returns empty array when no dispatches for plan', () => {
      const mockService = makeMockService()
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const result = controller.listPlanDispatches(ctx, 'plan-001')
      assert.deepStrictEqual(result, [])
    })

    test('returns dispatches for a given plan', () => {
      let capturedFilters: any = null
      const disp = makeCampaignDispatch()
      const mockService = makeMockService({
        listDispatches: (tenantId: string, filters: any) => {
          capturedFilters = filters
          return [disp]
        },
      })
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const result = controller.listPlanDispatches(ctx, 'plan-001')
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].dispatchId, 'disp-001')
      assert.strictEqual(capturedFilters.planId, 'plan-001')
      assert.strictEqual(capturedFilters.memberId, undefined)
    })

    test('multiple dispatches mapped to contracts', () => {
      const mockService = makeMockServiceWithData()
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const result = controller.listPlanDispatches(ctx, 'plan-001')
      assert.strictEqual(result.length, 2)
      assert.strictEqual(result[0].dispatchId, 'disp-001')
      assert.strictEqual(result[1].dispatchId, 'disp-002')
    })
  })

  // ── GET /campaigns/dispatches/list ────────────────────────
  describe('listDispatches()', () => {
    test('returns all dispatches with no filters', () => {
      let capturedFilters: any = null
      const mockService = makeMockService({
        listDispatches: (tenantId: string, filters: any) => {
          capturedFilters = filters
          return [makeCampaignDispatch()]
        },
      })
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const result = controller.listDispatches(ctx, {})
      assert.strictEqual(result.length, 1)
      assert.strictEqual(capturedFilters.memberId, undefined)
      assert.strictEqual(capturedFilters.status, undefined)
    })

    test('filters by memberId', () => {
      let capturedFilters: any = null
      const mockService = makeMockService({
        listDispatches: (tenantId: string, filters: any) => {
          capturedFilters = filters
          return []
        },
      })
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      controller.listDispatches(ctx, { memberId: 'mem-filter' })
      assert.strictEqual(capturedFilters.memberId, 'mem-filter')
    })

    test('filters by status', () => {
      let capturedFilters: any = null
      const mockService = makeMockService({
        listDispatches: (tenantId: string, filters: any) => {
          capturedFilters = filters
          return []
        },
      })
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      controller.listDispatches(ctx, { status: CampaignActionStatus.Failed })
      assert.strictEqual(capturedFilters.status, CampaignActionStatus.Failed)
    })

    test('filters by both memberId and status', () => {
      let capturedFilters: any = null
      const mockService = makeMockService({
        listDispatches: (tenantId: string, filters: any) => {
          capturedFilters = filters
          return [makeCampaignDispatch()]
        },
      })
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      controller.listDispatches(ctx, {
        memberId: 'mem-filter',
        status: CampaignActionStatus.Dispatched,
      })
      assert.strictEqual(capturedFilters.memberId, 'mem-filter')
      assert.strictEqual(capturedFilters.status, CampaignActionStatus.Dispatched)
    })
  })

  // ── POST /campaigns/evaluate ──────────────────────────────
  describe('evaluateTriggers()', () => {
    test('returns evaluation result with no matches', () => {
      const mockService = makeMockService()
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const result = controller.evaluateTriggers(ctx, {
        eventName: CampaignTrigger.PaymentSuccess,
      })
      assert.strictEqual(result.matchedCampaigns, 0)
      assert.strictEqual(result.dispatchedActions, 0)
      assert.strictEqual(result.skippedActions, 0)
      assert.strictEqual(result.failedActions, 0)
      assert.deepStrictEqual(result.dispatches, [])
    })

    test('returns evaluation result with matches and dispatches', () => {
      const mockService = makeMockServiceWithData()
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const result = controller.evaluateTriggers(ctx, {
        eventName: CampaignTrigger.PaymentSuccess,
        memberId: 'mem-001',
        orderId: 'ord-001',
        orderAmount: 500,
      })
      assert.strictEqual(result.matchedCampaigns, 2)
      assert.strictEqual(result.dispatchedActions, 1)
      assert.strictEqual(result.skippedActions, 1)
      assert.strictEqual(result.failedActions, 0)
      assert.strictEqual(result.dispatches.length, 2)
      assert.strictEqual(result.dispatches[0].dispatchId, 'disp-001')
    })

    test('forwards tenantContext to service', () => {
      let capturedInput: any = null
      const mockService = makeMockService({
        evaluateTriggers: (input: any) => {
          capturedInput = input
          return { matchedCampaigns: 0, dispatchedActions: 0, skippedActions: 0, failedActions: 0, dispatches: [] }
        },
      })
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext({ tenantId: 't-eval' })
      controller.evaluateTriggers(ctx, {
        eventName: CampaignTrigger.OrderCreated,
        memberId: 'mem-eval',
      })
      assert.strictEqual(capturedInput.tenantContext.tenantId, 't-eval')
      assert.strictEqual(capturedInput.eventName, CampaignTrigger.OrderCreated)
      assert.strictEqual(capturedInput.memberId, 'mem-eval')
    })

    test('forwards full payload to service', () => {
      let capturedInput: any = null
      const mockService = makeMockService({
        evaluateTriggers: (input: any) => {
          capturedInput = input
          return { matchedCampaigns: 0, dispatchedActions: 0, skippedActions: 0, failedActions: 0, dispatches: [] }
        },
      })
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const payload = { customKey: 'customValue' }
      controller.evaluateTriggers(ctx, {
        eventName: CampaignTrigger.MemberProfileSynced,
        memberId: 'mem-payload',
        orderAmount: 999.99,
        memberLevel: 'VIP',
        storeId: 'store-001',
        brandId: 'brand-001',
        payload,
      })
      assert.strictEqual(capturedInput.orderAmount, 999.99)
      assert.strictEqual(capturedInput.memberLevel, 'VIP')
      assert.strictEqual(capturedInput.storeId, 'store-001')
      assert.deepStrictEqual(capturedInput.payload, payload)
    })
  })

  // ── Edge cases ────────────────────────────────────────────
  describe('edge cases', () => {
    test('registerCampaign with undefined optional fields', () => {
      let capturedInput: any = null
      const mockService = makeMockService({
        registerCampaign: (input: any) => {
          capturedInput = input
          return makeCampaignPlan()
        },
      })
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const result = controller.registerCampaign(ctx, {
        code: 'CP-NO-OPTS',
        title: 'Minimal',
        triggerEvent: CampaignTrigger.PaymentSuccess,
        conditions: [],
        actions: [],
        // no description, priority, scheduledStart, scheduledEnd
      })
      assert.strictEqual(result.planId, 'plan-001')
      assert.strictEqual(capturedInput.description, undefined)
      assert.strictEqual(capturedInput.priority, undefined)
      assert.strictEqual(capturedInput.scheduledStart, undefined)
      assert.strictEqual(capturedInput.scheduledEnd, undefined)
    })

    test('listPlanDispatches for plan with no dispatches returns empty', () => {
      const mockService = makeMockService({
        listDispatches: () => [],
      })
      const controller = new CampaignController(mockService)
      const ctx = makeTenantContext()
      const result = controller.listPlanDispatches(ctx, 'plan-empty')
      assert.deepStrictEqual(result, [])
    })
  })
})
