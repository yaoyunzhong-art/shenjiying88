import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { QueueController } from './queue.controller'

describe('QueueController metadata', () => {
  it('controller should keep queue path', () => {
    assert.equal(Reflect.getMetadata('path', QueueController), 'queue')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [QueueController.prototype.joinQueue, 1, 'join'],
      [QueueController.prototype.leaveQueue, 1, ':entryId/leave'],
      [QueueController.prototype.callNext, 1, 'call-next'],
      [QueueController.prototype.startService, 1, ':entryId/start-service'],
      [QueueController.prototype.completeService, 1, ':entryId/complete'],
      [QueueController.prototype.markNoShow, 1, ':entryId/no-show'],
      [QueueController.prototype.getQueueStatus, 0, 'status/:resourceId'],
      [QueueController.prototype.getMyPosition, 0, 'position'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
