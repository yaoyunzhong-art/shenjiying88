import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { StoreFrontController } from './storefront.controller'

describe('StoreFrontController metadata', () => {
  it('controller should keep api/storefront path', () => {
    assert.equal(Reflect.getMetadata('path', StoreFrontController), 'api/storefront')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [StoreFrontController.prototype.getStore, 0, 'store/:slug'],
      [StoreFrontController.prototype.getServices, 0, 'store/:slug/services'],
      [StoreFrontController.prototype.getSlots, 0, 'store/:slug/services/:id/slots'],
      [StoreFrontController.prototype.createBooking, 1, 'bookings'],
      [StoreFrontController.prototype.getBooking, 0, 'bookings/:bookingId'],
      [StoreFrontController.prototype.cancelBooking, 1, 'bookings/:bookingId/cancel'],
      [StoreFrontController.prototype.rescheduleBooking, 1, 'bookings/:bookingId/reschedule'],
      [StoreFrontController.prototype.checkIn, 1, 'bookings/:bookingId/checkin'],
      [StoreFrontController.prototype.matchCoupon, 1, 'coupons/match'],
      [StoreFrontController.prototype.getPackages, 0, 'packages'],
      [StoreFrontController.prototype.createPayment, 1, 'payments/create'],
      [StoreFrontController.prototype.joinQueue, 1, 'queue/join'],
      [StoreFrontController.prototype.getQueueStatus, 0, 'queue/status/:resourceId'],
      [StoreFrontController.prototype.createReferralCode, 1, 'referral/create-code'],
      [StoreFrontController.prototype.trackReferralScan, 1, 'referral/scan'],
      [StoreFrontController.prototype.trackReferralConversion, 1, 'referral/conversion'],
      [StoreFrontController.prototype.getReferralLeaderboard, 0, 'referral/leaderboard/:storeSlug'],
      [StoreFrontController.prototype.getReferrerDashboard, 0, 'referral/dashboard/:referrerId'],
      [StoreFrontController.prototype.createKolLink, 1, 'referral/kol-link'],
      [StoreFrontController.prototype.removeReferralRelationship, 1, 'referral/remove-relationship'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
