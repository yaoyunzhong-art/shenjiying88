import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { LoyaltyController } from './loyalty.controller'

describe('LoyaltyController metadata', () => {
  it('controller should keep loyalty path', () => {
    assert.equal(Reflect.getMetadata('path', LoyaltyController), 'loyalty')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [LoyaltyController.prototype.listPointsLedger, 0, 'points-ledger'],
      [LoyaltyController.prototype.listCouponRedemptions, 0, 'coupon-redemptions'],
      [LoyaltyController.prototype.listBlindboxFulfillments, 0, 'blindbox-fulfillments'],
      [LoyaltyController.prototype.listBlindboxDrawRecords, 0, 'blindbox-draw-records'],
      [LoyaltyController.prototype.getBlindboxDrawRecordIntegrity, 0, 'blindbox-draw-records/integrity'],
      [LoyaltyController.prototype.getBlindboxMemberOverview, 0, 'blindbox-members/:memberId/overview'],
      [LoyaltyController.prototype.listSettlements, 0, 'settlements'],
      [LoyaltyController.prototype.registerCouponPlan, 1, 'coupon-plans'],
      [LoyaltyController.prototype.listCouponPlans, 0, 'coupon-plans'],
      [LoyaltyController.prototype.getCouponPlan, 0, 'coupon-plans/:planId'],
      [LoyaltyController.prototype.activateCouponPlan, 4, 'coupon-plans/:planId/status'],
      [LoyaltyController.prototype.issueCoupon, 1, 'coupon-plans/:planId/issue'],
      [LoyaltyController.prototype.registerBlindboxPlan, 1, 'blindbox-plans'],
      [LoyaltyController.prototype.listBlindboxPlans, 0, 'blindbox-plans'],
      [LoyaltyController.prototype.getBlindboxPlan, 0, 'blindbox-plans/:planId'],
      [LoyaltyController.prototype.getBlindboxProbabilityOverview, 0, 'blindbox-plans/:planId/probability'],
      [LoyaltyController.prototype.activateBlindboxPlan, 4, 'blindbox-plans/:planId/status'],
      [LoyaltyController.prototype.issueBlindbox, 1, 'blindbox-plans/:planId/issue'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
