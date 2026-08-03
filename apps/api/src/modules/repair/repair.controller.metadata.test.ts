import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { RepairController } from './repair.controller'

describe('RepairController metadata', () => {
  it('controller should keep repair-requests path', () => {
    assert.equal(Reflect.getMetadata('path', RepairController), 'repair-requests')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [RepairController.prototype.submitRepair, 1, '/'],
      [RepairController.prototype.listRepairs, 0, '/'],
      [RepairController.prototype.getRepair, 0, ':requestId'],
      [RepairController.prototype.updateRepair, 4, ':requestId'],
      [RepairController.prototype.dispatchRepair, 4, ':requestId/dispatch'],
      [RepairController.prototype.startRepair, 4, ':requestId/start'],
      [RepairController.prototype.completeRepair, 4, ':requestId/complete'],
      [RepairController.prototype.cancelRepair, 4, ':requestId/cancel'],
      [RepairController.prototype.getStats, 0, 'analysis/stats'],
      [RepairController.prototype.seedMockData, 1, 'seed'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
