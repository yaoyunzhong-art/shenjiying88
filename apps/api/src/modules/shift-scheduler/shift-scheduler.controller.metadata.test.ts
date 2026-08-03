import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { ShiftSchedulerController } from './shift-scheduler.controller'

describe('ShiftSchedulerController metadata', () => {
  it('controller should keep shift-schedules path', () => {
    assert.equal(Reflect.getMetadata('path', ShiftSchedulerController), 'shift-schedules')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [ShiftSchedulerController.prototype.createShift, 1, '/'],
      [ShiftSchedulerController.prototype.listShifts, 0, '/'],
      [ShiftSchedulerController.prototype.getShift, 0, ':shiftId'],
      [ShiftSchedulerController.prototype.updateShift, 4, ':shiftId'],
      [ShiftSchedulerController.prototype.deleteShift, 3, ':shiftId'],
      [ShiftSchedulerController.prototype.updateShiftStatus, 4, ':shiftId/status'],
      [ShiftSchedulerController.prototype.getWeeklyShifts, 0, 'analysis/weekly'],
      [ShiftSchedulerController.prototype.getEmployeeWeeklyShifts, 0, 'analysis/employee-weekly'],
      [ShiftSchedulerController.prototype.seedMockData, 1, 'seed'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
