import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { LeaveRequestController } from './leave-request.controller'

describe('LeaveRequestController metadata', () => {
  it('controller should keep leave-requests path', () => {
    assert.equal(Reflect.getMetadata('path', LeaveRequestController), 'leave-requests')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [LeaveRequestController.prototype.createLeave, 1, '/'],
      [LeaveRequestController.prototype.listLeaves, 0, '/'],
      [LeaveRequestController.prototype.getLeave, 0, ':leaveId'],
      [LeaveRequestController.prototype.approveLeave, 4, ':leaveId/approve'],
      [LeaveRequestController.prototype.cancelLeave, 4, ':leaveId/cancel'],
      [LeaveRequestController.prototype.getStats, 0, 'stats'],
      [LeaveRequestController.prototype.seedMockData, 1, 'seed'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
