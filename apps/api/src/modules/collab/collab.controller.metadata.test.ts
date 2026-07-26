import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { CollabController } from './collab.controller'

describe('CollabController metadata', () => {
  it('controller should keep collab-projects path', () => {
    assert.equal(Reflect.getMetadata('path', CollabController), 'collab-projects')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [CollabController.prototype.create, 1, '/'],
      [CollabController.prototype.findAll, 0, '/'],
      [CollabController.prototype.countByStatus, 0, 'count-by-status'],
      [CollabController.prototype.findById, 0, ':projectId'],
      [CollabController.prototype.update, 4, ':projectId'],
      [CollabController.prototype.updateStatus, 4, ':projectId/status'],
      [CollabController.prototype.delete, 3, ':projectId'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
