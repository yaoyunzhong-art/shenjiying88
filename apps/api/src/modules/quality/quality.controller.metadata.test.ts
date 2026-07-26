import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { QualityController } from './quality.controller'

describe('QualityController metadata', () => {
  it('controller should keep quality path', () => {
    assert.equal(Reflect.getMetadata('path', QualityController), 'quality')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [QualityController.prototype.createInspection, 1, 'inspections'],
      [QualityController.prototype.listInspections, 0, 'inspections'],
      [QualityController.prototype.getInspection, 0, 'inspections/:inspectId'],
      [QualityController.prototype.updateInspection, 4, 'inspections/:inspectId'],
      [QualityController.prototype.deleteInspection, 3, 'inspections/:inspectId'],
      [QualityController.prototype.getFailedInspections, 0, 'inspections/views/failed'],
      [QualityController.prototype.getPassRate, 0, 'inspections/views/pass-rate'],
      [QualityController.prototype.createPatrolTask, 1, 'patrol-tasks'],
      [QualityController.prototype.listPatrolTasks, 0, 'patrol-tasks'],
      [QualityController.prototype.getPatrolTask, 0, 'patrol-tasks/:patrolId'],
      [QualityController.prototype.updatePatrolTask, 4, 'patrol-tasks/:patrolId'],
      [QualityController.prototype.deletePatrolTask, 3, 'patrol-tasks/:patrolId'],
      [QualityController.prototype.getPendingPatrolTasks, 0, 'patrol-tasks/views/pending'],
      [QualityController.prototype.getOverduePatrolTasks, 0, 'patrol-tasks/views/overdue'],
      [QualityController.prototype.getPatrolTasksByArea, 0, 'patrol-tasks/area/:area'],
      [QualityController.prototype.createRectification, 1, 'rectifications'],
      [QualityController.prototype.listRectifications, 0, 'rectifications'],
      [QualityController.prototype.getRectification, 0, 'rectifications/:rectId'],
      [QualityController.prototype.updateRectification, 4, 'rectifications/:rectId'],
      [QualityController.prototype.deleteRectification, 3, 'rectifications/:rectId'],
      [QualityController.prototype.getOpenRectifications, 0, 'rectifications/views/open'],
      [QualityController.prototype.getOverdueRectifications, 0, 'rectifications/views/overdue'],
      [QualityController.prototype.getRectificationStats, 0, 'rectifications/views/stats'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
