import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { VenueController } from './venue.controller'

describe('VenueController metadata', () => {
  it('controller should keep venue path', () => {
    assert.equal(Reflect.getMetadata('path', VenueController), 'venue')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [VenueController.prototype.create, 1, '/'],
      [VenueController.prototype.findAll, 0, '/'],
      [VenueController.prototype.getById, 0, ':id'],
      [VenueController.prototype.update, 2, ':id'],
      [VenueController.prototype.delete, 3, ':id'],
      [VenueController.prototype.createBooking, 1, 'booking'],
      [VenueController.prototype.findAllBookings, 0, 'booking/list'],
      [VenueController.prototype.getBookingById, 0, 'booking/:id'],
      [VenueController.prototype.confirmBooking, 1, 'booking/:id/confirm'],
      [VenueController.prototype.startBooking, 1, 'booking/:id/start'],
      [VenueController.prototype.completeBooking, 1, 'booking/:id/complete'],
      [VenueController.prototype.cancelBooking, 1, 'booking/:id/cancel'],
      [VenueController.prototype.getAvailability, 0, 'booking/:venueId/availability'],
      [VenueController.prototype.releaseVenue, 1, ':id/release'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
