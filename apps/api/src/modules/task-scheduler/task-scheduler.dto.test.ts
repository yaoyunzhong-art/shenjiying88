import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [task-scheduler] [D] DTO 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
  TaskQueryDto,
  BatchTaskStatusDto,
} from './task-scheduler.dto'
import { TaskType, TaskPriority, TaskStatus } from './task-scheduler.entity'

describe('TaskScheduler DTOs', () => {
  describe('CreateTaskDto', () => {
    const toDto = (raw: Record<string, unknown>): CreateTaskDto =>
      Object.assign(new CreateTaskDto(), raw)

    it('should accept all required fields', () => {
      const dto = toDto({
        name: 'Daily Backup',
        type: TaskType.Recurring,
        priority: TaskPriority.High,
        assignedTo: 'sys-admin',
        startTime: '2026-07-16T02:00:00.000Z',
        description: 'Daily database backup',
      })

      assert.equal(dto.name, 'Daily Backup')
      assert.equal(dto.type, TaskType.Recurring)
      assert.equal(dto.priority, TaskPriority.High)
      assert.equal(dto.assignedTo, 'sys-admin')
      assert.equal(dto.startTime, '2026-07-16T02:00:00.000Z')
      assert.equal(dto.description, 'Daily database backup')
    })

    it('should accept optional fields', () => {
      const dto = toDto({
        name: 'Backup',
        type: TaskType.OneTime,
        priority: TaskPriority.Medium,
        assignedTo: 'admin',
        startTime: '2026-07-16T02:00:00.000Z',
        description: 'Backup',
        cronExpr: '0 2 * * *',
        endTime: '2026-07-16T03:00:00.000Z',
      })

      assert.equal(dto.cronExpr, '0 2 * * *')
      assert.equal(dto.endTime, '2026-07-16T03:00:00.000Z')
    })

    it('should be instanceof CreateTaskDto', () => {
      const dto = toDto({
        name: 'Task',
        type: TaskType.OneTime,
        priority: TaskPriority.Low,
        assignedTo: 'user',
        startTime: '2026-07-16T00:00:00.000Z',
        description: 'Test',
      })
      assert.ok(dto instanceof CreateTaskDto)
    })
  })

  describe('UpdateTaskDto', () => {
    it('should accept partial data', () => {
      const dto = Object.assign(new UpdateTaskDto(), { name: 'New Name' })
      assert.equal(dto.name, 'New Name')
      assert.equal(dto.description, undefined)
    })

    it('should accept multiple fields', () => {
      const dto = Object.assign(new UpdateTaskDto(), {
        priority: TaskPriority.High,
        assignedTo: 'new-user',
      })
      assert.equal(dto.priority, TaskPriority.High)
      assert.equal(dto.assignedTo, 'new-user')
    })

    it('should accept empty object', () => {
      const dto = new UpdateTaskDto()
      assert.equal(dto.name, undefined)
      assert.equal(dto.type, undefined)
    })
  })

  describe('UpdateTaskStatusDto', () => {
    it('should hold status', () => {
      const dto = Object.assign(new UpdateTaskStatusDto(), { status: TaskStatus.Running })
      assert.equal(dto.status, TaskStatus.Running)
    })
  })

  describe('TaskQueryDto', () => {
    it('should hold query filters', () => {
      const dto = Object.assign(new TaskQueryDto(), {
        status: TaskStatus.Pending,
        type: TaskType.Recurring,
        priority: TaskPriority.High,
        assignedTo: 'sys-admin',
      })
      assert.equal(dto.status, TaskStatus.Pending)
      assert.equal(dto.type, TaskType.Recurring)
      assert.equal(dto.priority, TaskPriority.High)
      assert.equal(dto.assignedTo, 'sys-admin')
    })

    it('should accept empty query', () => {
      const dto = new TaskQueryDto()
      assert.equal(dto.status, undefined)
      assert.equal(dto.type, undefined)
    })
  })

  describe('BatchTaskStatusDto', () => {
    it('should hold taskIds and status', () => {
      const dto = Object.assign(new BatchTaskStatusDto(), {
        taskIds: ['task-001', 'task-002'],
        status: TaskStatus.Cancelled,
      })
      assert.deepStrictEqual(dto.taskIds, ['task-001', 'task-002'])
      assert.equal(dto.status, TaskStatus.Cancelled)
    })
  })
})
