import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [task-scheduler] [D] controller 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TaskSchedulerController } from './task-scheduler.controller'
import { TaskSchedulerService } from './task-scheduler.service'
import {
  TaskType,
  TaskPriority,
  TaskStatus,
} from './task-scheduler.entity'

describe('TaskSchedulerController', () => {
  let controller: InstanceType<typeof TaskSchedulerController>
  let service: InstanceType<typeof TaskSchedulerService>

  const TENANT = { tenantId: 'tenant-001', brandId: 'brand-1', storeId: 'store-001' }

  beforeEach(() => {
    service = new TaskSchedulerService()
    controller = new TaskSchedulerController(service)
  })

  afterEach(() => {
    service.resetTaskStoresForTests()
  })

  // ── Route metadata ──

  describe('route metadata', () => {
    it('controller path should be task-scheduler', () => {
      const path = Reflect.getMetadata('path', TaskSchedulerController)
      assert.equal(path, 'task-scheduler')
    })

    it('createTask should be POST /', () => {
      const method = Reflect.getMetadata('method', TaskSchedulerController.prototype.createTask)
      const path = Reflect.getMetadata('path', TaskSchedulerController.prototype.createTask)
      assert.equal(method, 1) // POST
      assert.equal(path, '/')
    })

    it('listTasks should be GET /', () => {
      const method = Reflect.getMetadata('method', TaskSchedulerController.prototype.listTasks)
      const path = Reflect.getMetadata('path', TaskSchedulerController.prototype.listTasks)
      assert.equal(method, 0) // GET
      assert.equal(path, '/')
    })

    it('getTask should be GET /:taskId', () => {
      const method = Reflect.getMetadata('method', TaskSchedulerController.prototype.getTask)
      const path = Reflect.getMetadata('path', TaskSchedulerController.prototype.getTask)
      assert.equal(method, 0)
      assert.equal(path, ':taskId')
    })

    it('updateTask should be PATCH /:taskId', () => {
      const method = Reflect.getMetadata('method', TaskSchedulerController.prototype.updateTask)
      const path = Reflect.getMetadata('path', TaskSchedulerController.prototype.updateTask)
      assert.equal(method, 4) // PATCH
      assert.equal(path, ':taskId')
    })

    it('deleteTask should be DELETE /:taskId', () => {
      const method = Reflect.getMetadata('method', TaskSchedulerController.prototype.deleteTask)
      const path = Reflect.getMetadata('path', TaskSchedulerController.prototype.deleteTask)
      assert.equal(method, 5) // DELETE
      assert.equal(path, ':taskId')
    })

    it('updateTaskStatus should be PATCH /:taskId/status', () => {
      const method = Reflect.getMetadata('method', TaskSchedulerController.prototype.updateTaskStatus)
      const path = Reflect.getMetadata('path', TaskSchedulerController.prototype.updateTaskStatus)
      assert.equal(method, 4)
      assert.equal(path, ':taskId/status')
    })

    it('batchUpdateStatus should be POST /batch-status', () => {
      const method = Reflect.getMetadata('method', TaskSchedulerController.prototype.batchUpdateStatus)
      const path = Reflect.getMetadata('path', TaskSchedulerController.prototype.batchUpdateStatus)
      assert.equal(method, 1)
      assert.equal(path, 'batch-status')
    })

    it('getPendingTasks should be GET /views/pending', () => {
      const method = Reflect.getMetadata('method', TaskSchedulerController.prototype.getPendingTasks)
      const path = Reflect.getMetadata('path', TaskSchedulerController.prototype.getPendingTasks)
      assert.equal(method, 0)
      assert.equal(path, 'views/pending')
    })

    it('getRecurringTasks should be GET /views/recurring', () => {
      const method = Reflect.getMetadata('method', TaskSchedulerController.prototype.getRecurringTasks)
      const path = Reflect.getMetadata('path', TaskSchedulerController.prototype.getRecurringTasks)
      assert.equal(method, 0)
      assert.equal(path, 'views/recurring')
    })

    it('getShiftTasks should be GET /views/shifts', () => {
      const method = Reflect.getMetadata('method', TaskSchedulerController.prototype.getShiftTasks)
      const path = Reflect.getMetadata('path', TaskSchedulerController.prototype.getShiftTasks)
      assert.equal(method, 0)
      assert.equal(path, 'views/shifts')
    })
  })

  // ── CRUD via controller ──

  describe('POST /task-scheduler', () => {
    it('should create a task', () => {
      const result = controller.createTask(TENANT, {
        name: 'Daily Backup',
        type: TaskType.Recurring,
        priority: TaskPriority.High,
        assignedTo: 'sys-admin',
        startTime: '2026-07-17T02:00:00.000Z',
        description: 'Daily database backup',
      })

      assert.equal(result.name, 'Daily Backup')
      assert.equal(result.status, TaskStatus.Pending)
      assert.ok(result.id.startsWith('task-'))
    })
  })

  describe('GET /task-scheduler', () => {
    it('should list tasks', () => {
      controller.createTask(TENANT, {
        name: 'T1',
        type: TaskType.OneTime,
        priority: TaskPriority.Medium,
        assignedTo: 'user-001',
        startTime: '2026-07-17T10:00:00.000Z',
        description: 'Task 1',
      })

      const list = controller.listTasks(TENANT, {})
      assert.equal(list.length, 1)
      assert.equal(list[0].name, 'T1')
    })

    it('should filter by status', () => {
      const t = controller.createTask(TENANT, {
        name: 'Run',
        type: TaskType.OneTime,
        priority: TaskPriority.Medium,
        assignedTo: 'user-001',
        startTime: '2026-07-17T10:00:00.000Z',
        description: 'Running task',
      })
      controller.updateTaskStatus(TENANT, t.id, { status: TaskStatus.Running })

      const list = controller.listTasks(TENANT, { status: TaskStatus.Running })
      assert.equal(list.length, 1)
    })
  })

  describe('GET /task-scheduler/:taskId', () => {
    it('should get task', () => {
      const created = controller.createTask(TENANT, {
        name: 'Get Me',
        type: TaskType.OneTime,
        priority: TaskPriority.Low,
        assignedTo: 'user-001',
        startTime: '2026-07-17T10:00:00.000Z',
        description: 'Get this task',
      })

      const found = controller.getTask(TENANT, created.id)
      assert.ok(found)
      assert.equal(found.name, 'Get Me')
    })
  })

  describe('PATCH /task-scheduler/:taskId', () => {
    it('should update task', () => {
      const created = controller.createTask(TENANT, {
        name: 'Old',
        type: TaskType.OneTime,
        priority: TaskPriority.Low,
        assignedTo: 'user-001',
        startTime: '2026-07-17T10:00:00.000Z',
        description: 'Old task',
      })

      const updated = controller.updateTask(TENANT, created.id, { name: 'New' })
      assert.equal(updated.name, 'New')
    })
  })

  describe('DELETE /task-scheduler/:taskId', () => {
    it('should delete task', () => {
      const created = controller.createTask(TENANT, {
        name: 'Del',
        type: TaskType.OneTime,
        priority: TaskPriority.Low,
        assignedTo: 'user-001',
        startTime: '2026-07-17T10:00:00.000Z',
        description: 'Delete me',
      })

      const result = controller.deleteTask(TENANT, created.id)
      assert.deepStrictEqual(result, { success: true })
    })
  })

  // ── Status management via controller ──

  describe('PATCH /task-scheduler/:taskId/status', () => {
    it('should update status', () => {
      const created = controller.createTask(TENANT, {
        name: 'Status Test',
        type: TaskType.OneTime,
        priority: TaskPriority.Medium,
        assignedTo: 'user-001',
        startTime: '2026-07-17T10:00:00.000Z',
        description: 'Status',
      })

      const updated = controller.updateTaskStatus(TENANT, created.id, {
        status: TaskStatus.Running,
      })
      assert.equal(updated.status, TaskStatus.Running)
    })
  })

  describe('POST /task-scheduler/batch-status', () => {
    it('should batch update status', () => {
      const t1 = controller.createTask(TENANT, {
        name: 'T1', type: TaskType.OneTime, priority: TaskPriority.Low,
        assignedTo: 'u', startTime: '2026-07-17T10:00:00.000Z', description: 'T1',
      })
      const t2 = controller.createTask(TENANT, {
        name: 'T2', type: TaskType.OneTime, priority: TaskPriority.Low,
        assignedTo: 'u', startTime: '2026-07-17T10:00:00.000Z', description: 'T2',
      })

      const results = controller.batchUpdateStatus(TENANT, {
        taskIds: [t1.id, t2.id],
        status: TaskStatus.Cancelled,
      })
      assert.equal(results.length, 2)
      assert.equal(results[0].status, TaskStatus.Cancelled)
      assert.equal(results[1].status, TaskStatus.Cancelled)
    })
  })

  // ── Error handling ──

  describe('error propagation from service', () => {
    it('should propagate task not found', () => {
      assert.throws(
        () => controller.getTask(TENANT, 'nonexistent'),
        /Task not found: nonexistent/
      )
    })

    it('should propagate invalid status transition', () => {
      const t = controller.createTask(TENANT, {
        name: 'Err',
        type: TaskType.OneTime,
        priority: TaskPriority.Medium,
        assignedTo: 'u',
        startTime: '2026-07-17T10:00:00.000Z',
        description: 'Error test',
      })

      assert.throws(
        () => controller.updateTaskStatus(TENANT, t.id, { status: TaskStatus.Completed }),
        /Invalid task status transition/
      )
    })
  })
})
