import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { EdgeController } from './edge.controller'

describe('EdgeController metadata', () => {
  it('controller should keep edge path', () => {
    assert.equal(Reflect.getMetadata('path', EdgeController), 'edge')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [EdgeController.prototype.listNodes, 0, 'nodes'],
      [EdgeController.prototype.getNode, 0, 'nodes/:id'],
      [EdgeController.prototype.registerNode, 1, 'nodes'],
      [EdgeController.prototype.deleteNode, 3, 'nodes/:id'],
      [EdgeController.prototype.issueTicket, 1, 'tickets/issue'],
      [EdgeController.prototype.callNext, 1, 'tickets/call-next'],
      [EdgeController.prototype.completeTicket, 1, 'tickets/:id/complete'],
      [EdgeController.prototype.cancelTicket, 1, 'tickets/:id/cancel'],
      [EdgeController.prototype.getQueuePosition, 0, 'tickets/:id/position'],
      [EdgeController.prototype.syncQueue, 1, 'tickets/sync'],
      [EdgeController.prototype.syncClock, 1, 'clock/sync'],
      [EdgeController.prototype.calibrateClock, 1, 'clock/calibrate'],
      [EdgeController.prototype.checkClockTolerance, 0, 'clock/tolerance'],
      [EdgeController.prototype.loadModel, 1, 'inference/load'],
      [EdgeController.prototype.runInference, 1, 'inference/run'],
      [EdgeController.prototype.unloadModel, 1, 'inference/unload'],
      [EdgeController.prototype.cacheModel, 1, 'inference/cache'],
      [EdgeController.prototype.listCachedModels, 0, 'inference/cached'],
      [EdgeController.prototype.health, 0, 'health'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
