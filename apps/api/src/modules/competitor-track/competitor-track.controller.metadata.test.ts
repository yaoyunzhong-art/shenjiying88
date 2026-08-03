import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { CompetitorTrackController } from './competitor-track.controller'

describe('CompetitorTrackController metadata', () => {
  it('controller should keep competitor-track path', () => {
    assert.equal(Reflect.getMetadata('path', CompetitorTrackController), 'competitor-track')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [CompetitorTrackController.prototype.findAll, 0, '/'],
      [CompetitorTrackController.prototype.getSummary, 0, 'summary'],
      [CompetitorTrackController.prototype.getComparison, 0, 'comparison'],
      [CompetitorTrackController.prototype.findById, 0, ':id'],
      [CompetitorTrackController.prototype.create, 1, '/'],
      [CompetitorTrackController.prototype.update, 4, ':id'],
      [CompetitorTrackController.prototype.delete, 3, ':id'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
