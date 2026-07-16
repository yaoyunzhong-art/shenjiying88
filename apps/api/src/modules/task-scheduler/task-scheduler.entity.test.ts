import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [task-scheduler] [D] entity 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TaskType, TaskPriority, TaskStatus, type Task } from './task-scheduler.entity'

describe('TaskScheduler Entity', () => {
  describe('enums', () => {
    it('TaskType should have correct values', () => {
      assert.equal(TaskType.OneTime, 'ONE_TIME')
      assert.equal(TaskType.Recurring, 'RECURRING')
      assert.equal(TaskType.Shift, 'SHIFT')
    })

    it('TaskPriority should have correct values', () => {
      assert.equal(TaskPriority.High, 'HIGH')
      assert.equal(TaskPriority.Medium, 'MEDIUM')
      assert.equal(TaskPriority.Low, 'LOW')
    })

    it('TaskStatus should have correct values', () => {
      assert.equal(TaskStatus.Pending, 'PENDING')
      assert.equal(TaskStatus.Running, 'RUNNING')
      assert.equal(TaskStatus.Completed, 'COMPLETED')
      assert.equal(TaskStatus.Failed, 'FAILED')
      assert.equal(TaskStatus.Cancelled, 'CANCELLED')
    })
  })

  describe('Task interface shape', () => {
    it('should create a valid task object', () => {
      const task: Task = {
        id: 'task-001',
        name: 'Daily Backup',
        type: TaskType.Recurring,
        priority: TaskPriority.High,
        status: TaskStatus.Pending,
        cronExpr: '0 2 * * *',
        assignedTo: 'sys-admin',
        startTime: '2026-07-16T02:00:00.000Z',
        description: 'Daily database backup',
        tenantId: 'tenant-001',
        createdAt: '2026-07-15T10:00:00.000Z',
        updatedAt: '2026-07-16T01:00:00.000Z',
      }

      assert.equal(task.id, 'task-001')
      assert.equal(task.name, 'Daily Backup')
      assert.equal(task.type, TaskType.Recurring)
      assert.equal(task.priority, TaskPriority.High)
      assert.equal(task.status, TaskStatus.Pending)
      assert.equal(task.cronExpr, '0 2 * * *')
      assert.equal(task.assignedTo, 'sys-admin')
      assert.ok(task.startTime)
      assert.ok(task.createdAt)
      assert.ok(task.updatedAt)
    })

    it('should support optional fields', () => {
      const task: Task = {
        id: 'task-002',
        name: 'Shift A',
        type: TaskType.Shift,
        priority: TaskPriority.Low,
        status: TaskStatus.Pending,
        assignedTo: 'cashier-a',
        startTime: '2026-07-16T08:00:00.000Z',
        endTime: '2026-07-16T16:00:00.000Z',
        description: 'Morning shift',
        tenantId: 'tenant-001',
        createdAt: '2026-07-15T10:00:00.000Z',
        updatedAt: '2026-07-16T07:00:00.000Z',
      }

      assert.equal(task.type, TaskType.Shift)
      assert.equal(task.endTime, '2026-07-16T16:00:00.000Z')
      assert.equal(task.cronExpr, undefined)
    })
  })
})
