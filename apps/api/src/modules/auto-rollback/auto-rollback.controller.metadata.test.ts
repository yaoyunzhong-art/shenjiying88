import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AutoRollbackController } from './auto-rollback.controller'

describe('AutoRollbackController metadata', () => {
  it('controller should keep auto-rollback path', () => {
    assert.equal(Reflect.getMetadata('path', AutoRollbackController), 'auto-rollback')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AutoRollbackController.prototype.trigger, 1, 'trigger'],
      [AutoRollbackController.prototype.confirm, 1, 'confirm'],
      [AutoRollbackController.prototype.cancel, 1, 'cancel'],
      [AutoRollbackController.prototype.listRecords, 0, 'records'],
      [AutoRollbackController.prototype.getRecord, 0, 'records/:id'],
      [AutoRollbackController.prototype.getSnapshot, 0, 'snapshots/:id'],
      [AutoRollbackController.prototype.configure, 1, 'configure'],
      [AutoRollbackController.prototype.getStatus, 0, 'status'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
