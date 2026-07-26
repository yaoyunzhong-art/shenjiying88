import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { OpsManualController } from './ops-manual.controller'

describe('OpsManualController metadata', () => {
  it('controller should keep ops-manual path', () => {
    assert.equal(Reflect.getMetadata('path', OpsManualController), 'ops-manual')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [OpsManualController.prototype.generateManual, 1, 'generate'],
      [OpsManualController.prototype.exportManual, 1, 'export'],
      [OpsManualController.prototype.searchManual, 1, 'search'],
      [OpsManualController.prototype.getSOP, 1, 'sop'],
      [OpsManualController.prototype.getManualInfo, 0, 'info'],
      [OpsManualController.prototype.createRecord, 1, 'records'],
      [OpsManualController.prototype.listRecords, 0, 'records'],
      [OpsManualController.prototype.getRecord, 0, 'records/:id'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
