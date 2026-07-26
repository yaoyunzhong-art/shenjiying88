import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { TaskSchedulerController } from './task-scheduler.controller'

describe('TaskSchedulerController metadata', () => {
  it('controller should keep task-scheduler path', () => {
    assert.equal(Reflect.getMetadata('path', TaskSchedulerController), 'task-scheduler')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [TaskSchedulerController.prototype.createTask, 1, '/'],
      [TaskSchedulerController.prototype.listTasks, 0, '/'],
      [TaskSchedulerController.prototype.getTask, 0, ':taskId'],
      [TaskSchedulerController.prototype.updateTask, 4, ':taskId'],
      [TaskSchedulerController.prototype.deleteTask, 3, ':taskId'],
      [TaskSchedulerController.prototype.updateTaskStatus, 4, ':taskId/status'],
      [TaskSchedulerController.prototype.batchUpdateStatus, 1, 'batch-status'],
      [TaskSchedulerController.prototype.getPendingTasks, 0, 'views/pending'],
      [TaskSchedulerController.prototype.getRecurringTasks, 0, 'views/recurring'],
      [TaskSchedulerController.prototype.getShiftTasks, 0, 'views/shifts'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
