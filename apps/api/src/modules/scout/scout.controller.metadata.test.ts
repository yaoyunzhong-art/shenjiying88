import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { ScoutController } from './scout.controller'

describe('ScoutController metadata', () => {
  it('controller should keep scout path', () => {
    assert.equal(Reflect.getMetadata('path', ScoutController), 'scout')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [ScoutController.prototype.cities, 0, 'cities'],
      [ScoutController.prototype.venues, 0, 'venues'],
      [ScoutController.prototype.searchVenues, 0, 'venues/search'],
      [ScoutController.prototype.prices, 0, 'venues/:id/prices'],
      [ScoutController.prototype.devices, 0, 'venues/:id/devices'],
      [ScoutController.prototype.membership, 0, 'venues/:id/membership'],
      [ScoutController.prototype.reviews, 0, 'venues/:id/reviews'],
      [ScoutController.prototype.activities, 0, 'venues/:id/activities'],
      [ScoutController.prototype.compare, 1, 'compare'],
      [ScoutController.prototype.compareSummary, 1, 'compare/summary'],
      [ScoutController.prototype.snapshot, 1, 'snapshot'],
      [ScoutController.prototype.regionStats, 0, 'stats/region'],
      [ScoutController.prototype.progress, 0, 'stats/progress'],
      [ScoutController.prototype.recentUpdated, 0, 'recent-updated'],
      [ScoutController.prototype.logs, 0, 'logs'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
