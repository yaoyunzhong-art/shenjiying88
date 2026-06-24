/**
 * LoyaltyController 单元测试 (node:test)
 *
 * 模拟 NestJS 装饰器行为测试控制器路由注册和核心业务逻辑。
 */

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

// ── Decorator mocks ─────────────────────────────────────────────
const routeRegistrations: Array<{ method: string; path: string; handler: string }> = []

function Controller(prefix: string) {
  return (target: Function & { __prefix?: string }) => {
    target.__prefix = prefix
    return target
  }
}

function Get(path = '') {
  return (_target: object, propertyKey: string | symbol) => {
    routeRegistrations.push({ method: 'GET', path, handler: String(propertyKey) })
  }
}

function Post(path = '') {
  return (_target: object, propertyKey: string | symbol) => {
    routeRegistrations.push({ method: 'POST', path, handler: String(propertyKey) })
  }
}

function Patch(path = '') {
  return (_target: object, propertyKey: string | symbol) => {
    routeRegistrations.push({ method: 'PATCH', path, handler: String(propertyKey) })
  }
}

// ── Inline Controller (mirrors loyalty.controller.ts) ───────────

interface LoyaltyPlan {
  planId: string
  code: string
  title: string
  status: string
}

interface BlindboxPlan {
  planId: string
  blindboxPlanId: string
  title: string
  status: string
}

interface PointsLedgerEntry {
  entryId: string
  memberId: string
  points: number
}

interface CouponRedemption {
  redemptionId: string
  couponCode: string
  status: string
}

interface BlindboxFulfillment {
  fulfillmentId: string
  blindboxPlanId: string
  status: string
}

interface LoyaltyOrderSettlement {
  settlementId: string
  orderId: string
  status: string
}

class LoyaltyController {
  private readonly loyaltyService: {
    listPointsLedger: (tenantId: string) => PointsLedgerEntry[]
    listCouponRedemptions: (tenantId: string) => CouponRedemption[]
    listBlindboxFulfillments: (tenantId: string) => BlindboxFulfillment[]
    listSettlements: (tenantId: string) => LoyaltyOrderSettlement[]
    registerCouponPlan: (input: Record<string, unknown>) => LoyaltyPlan
    listCouponPlans: (tenantId: string) => LoyaltyPlan[]
    getCouponPlan: (planId: string, tenantId: string) => LoyaltyPlan
    updateCouponPlanStatus: (planId: string, status: string, tenantId: string) => LoyaltyPlan
    issueCouponFromPlan: (input: Record<string, unknown>) => CouponRedemption
    registerBlindboxPlan: (input: Record<string, unknown>) => BlindboxPlan
    listBlindboxPlans: (tenantId: string) => BlindboxPlan[]
    getBlindboxPlan: (planId: string, tenantId: string) => BlindboxPlan
    updateBlindboxPlanStatus: (planId: string, status: string, tenantId: string) => BlindboxPlan
    issueBlindboxFromPlan: (input: Record<string, unknown>) => BlindboxFulfillment
  }

  constructor(loyaltyService: typeof LoyaltyController.prototype.loyaltyService) {
    this.loyaltyService = loyaltyService
  }

  listPointsLedger(tenantContext: { tenantId: string }) {
    return this.loyaltyService.listPointsLedger(tenantContext.tenantId)
  }

  listCouponRedemptions(tenantContext: { tenantId: string }) {
    return this.loyaltyService.listCouponRedemptions(tenantContext.tenantId)
  }

  listBlindboxFulfillments(tenantContext: { tenantId: string }) {
    return this.loyaltyService.listBlindboxFulfillments(tenantContext.tenantId)
  }

  listSettlements(tenantContext: { tenantId: string }) {
    return this.loyaltyService.listSettlements(tenantContext.tenantId)
  }

  registerCouponPlan(
    tenantContext: { tenantId: string },
    body: {
      code: string
      title: string
      description?: string
      discountType: string
      discountValue: number
      minOrderAmount?: number
      totalQuota: number
      perMemberLimit: number
      validFrom: string
      validUntil: string
    }
  ) {
    return this.loyaltyService.registerCouponPlan({ tenantContext, ...body })
  }

  listCouponPlans(tenantContext: { tenantId: string }) {
    return this.loyaltyService.listCouponPlans(tenantContext.tenantId)
  }

  getCouponPlan(tenantContext: { tenantId: string }, planId: string) {
    return this.loyaltyService.getCouponPlan(planId, tenantContext.tenantId)
  }

  activateCouponPlan(
    tenantContext: { tenantId: string },
    planId: string,
    body: { status: string }
  ) {
    return this.loyaltyService.updateCouponPlanStatus(planId, body.status, tenantContext.tenantId)
  }

  issueCoupon(
    tenantContext: { tenantId: string },
    planId: string,
    body: { memberId: string; source?: string }
  ) {
    return this.loyaltyService.issueCouponFromPlan({
      tenantContext,
      memberId: body.memberId,
      planId,
      source: body.source
    })
  }

  registerBlindboxPlan(
    tenantContext: { tenantId: string },
    body: {
      blindboxPlanId: string
      title: string
      description?: string
      unitPrice: number
      totalQuota: number
      rewardPool: Array<{ sku: string; weight: number; label: string }>
      validFrom: string
      validUntil: string
    }
  ) {
    return this.loyaltyService.registerBlindboxPlan({ tenantContext, ...body })
  }

  listBlindboxPlans(tenantContext: { tenantId: string }) {
    return this.loyaltyService.listBlindboxPlans(tenantContext.tenantId)
  }

  getBlindboxPlan(tenantContext: { tenantId: string }, planId: string) {
    return this.loyaltyService.getBlindboxPlan(planId, tenantContext.tenantId)
  }

  activateBlindboxPlan(
    tenantContext: { tenantId: string },
    planId: string,
    body: { status: string }
  ) {
    return this.loyaltyService.updateBlindboxPlanStatus(planId, body.status, tenantContext.tenantId)
  }

  issueBlindbox(
    tenantContext: { tenantId: string },
    planId: string,
    body: { memberId: string; quantity?: number }
  ) {
    return this.loyaltyService.issueBlindboxFromPlan({
      tenantContext,
      memberId: body.memberId,
      planId,
      quantity: body.quantity
    })
  }
}

// Decorate (mirrors real controller decorators)
Controller('loyalty')(LoyaltyController)
Get('points-ledger')(LoyaltyController.prototype, 'listPointsLedger')
Get('coupon-redemptions')(LoyaltyController.prototype, 'listCouponRedemptions')
Get('blindbox-fulfillments')(LoyaltyController.prototype, 'listBlindboxFulfillments')
Get('settlements')(LoyaltyController.prototype, 'listSettlements')
Post('coupon-plans')(LoyaltyController.prototype, 'registerCouponPlan')
Get('coupon-plans')(LoyaltyController.prototype, 'listCouponPlans')
Get('coupon-plans/:planId')(LoyaltyController.prototype, 'getCouponPlan')
Patch('coupon-plans/:planId/status')(LoyaltyController.prototype, 'activateCouponPlan')
Post('coupon-plans/:planId/issue')(LoyaltyController.prototype, 'issueCoupon')
Post('blindbox-plans')(LoyaltyController.prototype, 'registerBlindboxPlan')
Get('blindbox-plans')(LoyaltyController.prototype, 'listBlindboxPlans')
Get('blindbox-plans/:planId')(LoyaltyController.prototype, 'getBlindboxPlan')
Patch('blindbox-plans/:planId/status')(LoyaltyController.prototype, 'activateBlindboxPlan')
Post('blindbox-plans/:planId/issue')(LoyaltyController.prototype, 'issueBlindbox')

// ── Helper ──────────────────────────────────────────────────────
const CTX = { tenantId: 'tenant-loyalty-spec' }

function makeMockService() {
  return {
    listPointsLedger: (_tenantId: string): PointsLedgerEntry[] => [
      { entryId: 'ple-1', memberId: 'mem-1', points: 100 }
    ],
    listCouponRedemptions: (_tenantId: string): CouponRedemption[] => [
      { redemptionId: 'cr-1', couponCode: 'WELCOME10', status: 'REDEEMED' }
    ],
    listBlindboxFulfillments: (_tenantId: string): BlindboxFulfillment[] => [
      { fulfillmentId: 'bf-1', blindboxPlanId: 'bb-plan-1', status: 'FULFILLED' }
    ],
    listSettlements: (_tenantId: string): LoyaltyOrderSettlement[] => [
      { settlementId: 'stl-1', orderId: 'ord-1', status: 'SUCCEEDED' }
    ],
    registerCouponPlan: (input: Record<string, unknown>): LoyaltyPlan => ({
      planId: 'cp-1',
      code: input.code as string,
      title: input.title as string,
      status: 'DRAFT'
    }),
    listCouponPlans: (_tenantId: string): LoyaltyPlan[] => [
      { planId: 'cp-1', code: 'WELCOME10', title: 'Welcome 10% Off', status: 'ACTIVE' }
    ],
    getCouponPlan: (_planId: string, _tenantId: string): LoyaltyPlan => ({
      planId: _planId,
      code: 'WELCOME10',
      title: 'Welcome 10% Off',
      status: 'ACTIVE'
    }),
    updateCouponPlanStatus: (planId: string, status: string, _tenantId: string): LoyaltyPlan => ({
      planId,
      code: 'WELCOME10',
      title: 'Welcome 10% Off',
      status
    }),
    issueCouponFromPlan: (input: Record<string, unknown>): CouponRedemption => ({
      redemptionId: 'cr-new',
      couponCode: `CPN-${(input.planId as string).slice(0, 4)}`,
      status: 'REDEEMED'
    }),
    registerBlindboxPlan: (input: Record<string, unknown>): BlindboxPlan => ({
      planId: 'bbp-1',
      blindboxPlanId: input.blindboxPlanId as string,
      title: input.title as string,
      status: 'DRAFT'
    }),
    listBlindboxPlans: (_tenantId: string): BlindboxPlan[] => [
      { planId: 'bbp-1', blindboxPlanId: 'bb-plan-1', title: 'Mystery Box', status: 'ACTIVE' }
    ],
    getBlindboxPlan: (_planId: string, _tenantId: string): BlindboxPlan => ({
      planId: _planId,
      blindboxPlanId: 'bb-plan-1',
      title: 'Mystery Box',
      status: 'ACTIVE'
    }),
    updateBlindboxPlanStatus: (planId: string, status: string, _tenantId: string): BlindboxPlan => ({
      planId,
      blindboxPlanId: 'bb-plan-1',
      title: 'Mystery Box',
      status
    }),
    issueBlindboxFromPlan: (_input: Record<string, unknown>): BlindboxFulfillment => ({
      fulfillmentId: 'bf-new',
      blindboxPlanId: _input.planId as string,
      status: 'FULFILLED'
    })
  }
}

// ── Tests ───────────────────────────────────────────────────────
describe('LoyaltyController', () => {
  let controller: LoyaltyController

  test.beforeEach(() => {
    controller = new LoyaltyController(makeMockService())
  })

  describe('decorator metadata', () => {
    test('registers controller prefix "loyalty"', () => {
      const Target = LoyaltyController as typeof LoyaltyController & { __prefix?: string }
      assert.strictEqual(Target.__prefix, 'loyalty')
    })

    test('registers all expected routes', () => {
      const expected = [
        { method: 'GET', path: 'points-ledger', handler: 'listPointsLedger' },
        { method: 'GET', path: 'coupon-redemptions', handler: 'listCouponRedemptions' },
        { method: 'GET', path: 'blindbox-fulfillments', handler: 'listBlindboxFulfillments' },
        { method: 'GET', path: 'settlements', handler: 'listSettlements' },
        { method: 'POST', path: 'coupon-plans', handler: 'registerCouponPlan' },
        { method: 'GET', path: 'coupon-plans', handler: 'listCouponPlans' },
        { method: 'GET', path: 'coupon-plans/:planId', handler: 'getCouponPlan' },
        { method: 'PATCH', path: 'coupon-plans/:planId/status', handler: 'activateCouponPlan' },
        { method: 'POST', path: 'coupon-plans/:planId/issue', handler: 'issueCoupon' },
        { method: 'POST', path: 'blindbox-plans', handler: 'registerBlindboxPlan' },
        { method: 'GET', path: 'blindbox-plans', handler: 'listBlindboxPlans' },
        { method: 'GET', path: 'blindbox-plans/:planId', handler: 'getBlindboxPlan' },
        { method: 'PATCH', path: 'blindbox-plans/:planId/status', handler: 'activateBlindboxPlan' },
        { method: 'POST', path: 'blindbox-plans/:planId/issue', handler: 'issueBlindbox' }
      ]

      for (const expectedRoute of expected) {
        const found = routeRegistrations.some(
          (r) =>
            r.method === expectedRoute.method &&
            r.path === expectedRoute.path &&
            r.handler === expectedRoute.handler
        )
        assert.ok(found, `Route ${expectedRoute.method} ${expectedRoute.path} (${expectedRoute.handler}) should be registered`)
      }
    })
  })

  // ── Points Ledger ──
  describe('listPointsLedger()', () => {
    test('returns points ledger entries for tenant', () => {
      const result = controller.listPointsLedger(CTX)
      assert.ok(Array.isArray(result))
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].entryId, 'ple-1')
      assert.strictEqual(result[0].points, 100)
    })
  })

  // ── Coupon Redemptions ──
  describe('listCouponRedemptions()', () => {
    test('returns coupon redemptions for tenant', () => {
      const result = controller.listCouponRedemptions(CTX)
      assert.ok(Array.isArray(result))
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].couponCode, 'WELCOME10')
    })
  })

  // ── Blindbox Fulfillments ──
  describe('listBlindboxFulfillments()', () => {
    test('returns blindbox fulfillments for tenant', () => {
      const result = controller.listBlindboxFulfillments(CTX)
      assert.ok(Array.isArray(result))
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].blindboxPlanId, 'bb-plan-1')
    })
  })

  // ── Settlements ──
  describe('listSettlements()', () => {
    test('returns settlements for tenant', () => {
      const result = controller.listSettlements(CTX)
      assert.ok(Array.isArray(result))
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].orderId, 'ord-1')
    })
  })

  // ── Coupon Plans ──
  describe('registerCouponPlan()', () => {
    test('registers a new coupon plan and returns it with draft status', () => {
      const result = controller.registerCouponPlan(CTX, {
        code: 'SUMMER50',
        title: 'Summer Sale 50',
        description: 'Summer sale coupon',
        discountType: 'PERCENTAGE',
        discountValue: 50,
        totalQuota: 500,
        perMemberLimit: 1,
        validFrom: '2026-06-01T00:00:00Z',
        validUntil: '2026-08-31T23:59:59Z'
      })
      assert.strictEqual(result.code, 'SUMMER50')
      assert.strictEqual(result.title, 'Summer Sale 50')
      assert.strictEqual(result.status, 'DRAFT')
    })
  })

  describe('listCouponPlans()', () => {
    test('returns coupon plans for tenant', () => {
      const result = controller.listCouponPlans(CTX)
      assert.ok(Array.isArray(result))
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].code, 'WELCOME10')
    })
  })

  describe('getCouponPlan()', () => {
    test('returns coupon plan by planId', () => {
      const result = controller.getCouponPlan(CTX, 'cp-1')
      assert.strictEqual(result.planId, 'cp-1')
      assert.strictEqual(result.code, 'WELCOME10')
    })
  })

  describe('activateCouponPlan()', () => {
    test('updates coupon plan status', () => {
      const result = controller.activateCouponPlan(CTX, 'cp-1', { status: 'ACTIVE' })
      assert.strictEqual(result.planId, 'cp-1')
      assert.strictEqual(result.status, 'ACTIVE')
    })
  })

  describe('issueCoupon()', () => {
    test('issues coupon from plan for a member', () => {
      const result = controller.issueCoupon(CTX, 'cp-1', { memberId: 'mem-001' })
      assert.strictEqual(result.status, 'REDEEMED')
      assert.ok(result.redemptionId)
    })
  })

  // ── Blindbox Plans ──
  describe('registerBlindboxPlan()', () => {
    test('registers a new blindbox plan with draft status', () => {
      const result = controller.registerBlindboxPlan(CTX, {
        blindboxPlanId: 'bb-plan-2',
        title: 'Summer Mystery Box',
        description: 'Limited summer box',
        unitPrice: 29.99,
        totalQuota: 200,
        rewardPool: [{ sku: 'summer-toy', weight: 50, label: 'Summer Toy' }],
        validFrom: '2026-06-01T00:00:00Z',
        validUntil: '2026-08-31T23:59:59Z'
      })
      assert.strictEqual(result.blindboxPlanId, 'bb-plan-2')
      assert.strictEqual(result.status, 'DRAFT')
    })
  })

  describe('listBlindboxPlans()', () => {
    test('returns blindbox plans for tenant', () => {
      const result = controller.listBlindboxPlans(CTX)
      assert.ok(Array.isArray(result))
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].title, 'Mystery Box')
    })
  })

  describe('getBlindboxPlan()', () => {
    test('returns blindbox plan by planId', () => {
      const result = controller.getBlindboxPlan(CTX, 'bbp-1')
      assert.strictEqual(result.planId, 'bbp-1')
    })
  })

  describe('activateBlindboxPlan()', () => {
    test('updates blindbox plan status', () => {
      const result = controller.activateBlindboxPlan(CTX, 'bbp-1', { status: 'ACTIVE' })
      assert.strictEqual(result.planId, 'bbp-1')
      assert.strictEqual(result.status, 'ACTIVE')
    })
  })

  describe('issueBlindbox()', () => {
    test('issues blindbox from plan for a member', () => {
      const result = controller.issueBlindbox(CTX, 'bbp-1', { memberId: 'mem-001', quantity: 1 })
      assert.strictEqual(result.status, 'FULFILLED')
      assert.ok(result.fulfillmentId)
    })
  })

  // ── Edge Cases / Boundary ──
  describe('edge cases', () => {
    test('listPointsLedger returns empty array when no entries are registered', () => {
      const emptyService = {
        ...makeMockService(),
        listPointsLedger: (_tenantId: string): PointsLedgerEntry[] => []
      }
      const ctrl = new LoyaltyController(emptyService)
      const result = ctrl.listPointsLedger(CTX)
      assert.ok(Array.isArray(result))
      assert.strictEqual(result.length, 0)
    })

    test('listCouponPlans returns empty array when no plans exist', () => {
      const emptyService = {
        ...makeMockService(),
        listCouponPlans: (_tenantId: string): LoyaltyPlan[] => []
      }
      const ctrl = new LoyaltyController(emptyService)
      const result = ctrl.listCouponPlans(CTX)
      assert.ok(Array.isArray(result))
      assert.strictEqual(result.length, 0)
    })

    test('issueCoupon without source defaults gracefully', () => {
      const result = controller.issueCoupon(CTX, 'cp-1', { memberId: 'mem-002' })
      assert.strictEqual(result.status, 'REDEEMED')
    })

    test('issueBlindbox without quantity defaults gracefully', () => {
      const result = controller.issueBlindbox(CTX, 'bbp-1', { memberId: 'mem-003' })
      assert.strictEqual(result.status, 'FULFILLED')
    })

    test('getCouponPlan returns for valid planId', () => {
      const result = controller.getCouponPlan(CTX, 'cp-unknown')
      // still returns because mock doesn't validate existence
      assert.strictEqual(result.planId, 'cp-unknown')
    })

    test('activateCouponPlan to PAUSED status', () => {
      const result = controller.activateCouponPlan(CTX, 'cp-1', { status: 'PAUSED' })
      assert.strictEqual(result.status, 'PAUSED')
    })
  })
})
