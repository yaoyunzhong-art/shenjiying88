import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { BlindboxController } from './blindbox.controller'

describe('BlindboxController metadata', () => {
  it('controller should keep blindbox path', () => {
    assert.equal(Reflect.getMetadata('path', BlindboxController), 'blindbox')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [BlindboxController.prototype.createPlan, 1, 'plans'],
      [BlindboxController.prototype.draw, 1, ':planId/draw'],
      [BlindboxController.prototype.drawBatch, 1, ':planId/draw/batch'],
      [BlindboxController.prototype.getProbabilities, 0, ':planId/probabilities'],
      [BlindboxController.prototype.getPrizePool, 0, ':planId/prize-pool'],
      [BlindboxController.prototype.getHistory, 0, ':planId/history'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
