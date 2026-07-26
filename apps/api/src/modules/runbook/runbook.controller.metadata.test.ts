import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { RunbookController } from './runbook.controller'

describe('RunbookController metadata', () => {
  it('controller should keep runbook path', () => {
    assert.equal(Reflect.getMetadata('path', RunbookController), 'runbook')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [RunbookController.prototype.create, 1, '/'],
      [RunbookController.prototype.list, 0, '/'],
      [RunbookController.prototype.search, 0, 'search'],
      [RunbookController.prototype.get, 0, ':id'],
      [RunbookController.prototype.update, 2, ':id'],
      [RunbookController.prototype.delete, 3, ':id'],
      [RunbookController.prototype.mapAlert, 1, 'alert-mapping'],
      [RunbookController.prototype.findByAlert, 0, 'alert-mapping/:alertName'],
      [RunbookController.prototype.getCriticalSteps, 0, ':id/critical-steps'],
      [RunbookController.prototype.validate, 0, ':id/validate'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
