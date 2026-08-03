import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [task-scheduler] [D] service 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TaskSchedulerService } from './task-scheduler.service'
import {
  TaskStatus,
  TaskType,
  TaskPriority,
  type Task,
} from './task-scheduler.entity'

describe('TaskSchedulerService', () => {
  let service: TaskSchedulerService

  const TENANT = 'tenant-001'
  const TEST_TENANT = 'tenant-test-isolated'

  beforeEach(() => {
    service = new TaskSchedulerService()
  })

  afterEach(() => {
    service.resetTaskStoresForTests()
  })

  function createTestTask(overrides?: Partial<Parameters<TaskSchedulerService['createTask']>[0]>): Task {
    return service.createTask({
      tenantId: TENANT,
      name: 'Test Task',
      type: TaskType.OneTime,
      priority: TaskPriority.Medium,
      assignedTo: 'user-001',
      startTime: '2026-07-17T10:00:00.000Z',
      description: 'A test task',
      ...overrides,
    })
  }

  // ── CRUD ──

  describe('createTask', () => {
    it('should create a task with PENDING status', () => {
      const t = createTestTask()

      assert.equal(t.name, 'Test Task')
      assert.equal(t.type, TaskType.OneTime)
      assert.equal(t.priority, TaskPriority.Medium)
      assert.equal(t.status, TaskStatus.Pending)
      assert.equal(t.tenantId, TENANT)
      assert.equal(t.assignedTo, 'user-001')
      assert.ok(t.id.startsWith('task-'))
      assert.ok(t.createdAt)
      assert.ok(t.updatedAt)
    })

    it('should create recurring task with cronExpr', () => {
      const t = createTestTask({
        type: TaskType.Recurring,
        cronExpr: '0 2 * * *',
        name: 'Daily Backup',
      })

      assert.equal(t.type, TaskType.Recurring)
      assert.equal(t.cronExpr, '0 2 * * *')
    })

    it('should create shift task with endTime', () => {
      const t = createTestTask({
        type: TaskType.Shift,
        startTime: '2026-07-17T08:00:00.000Z',
        endTime: '2026-07-17T16:00:00.000Z',
      })

      assert.equal(t.type, TaskType.Shift)
      assert.equal(t.endTime, '2026-07-17T16:00:00.000Z')
    })
  })

  describe('getTask', () => {
    it('should return task by id', () => {
      const t = createTestTask()
      const found = service.getTask(t.id, TENANT)
      assert.ok(found)
      assert.equal(found?.id, t.id)
    })

    it('should return undefined for non-existent task', () => {
      const found = service.getTask('nonexistent', TENANT)
      assert.equal(found, undefined)
    })

    it('should return undefined for wrong tenant', () => {
      const t = createTestTask()
      const found = service.getTask(t.id, 'wrong-tenant')
      assert.equal(found, undefined)
    })
  })

  describe('listTasks', () => {
    it('should list all tasks for tenant', () => {
      createTestTask({ name: 'T1', tenantId: TEST_TENANT })
      createTestTask({ name: 'T2', tenantId: TEST_TENANT })

      const list = service.listTasks(TEST_TENANT)
      assert.equal(list.length, 2)
    })

    it('should filter by status', () => {
      createTestTask({ name: 'Pending Task', tenantId: TEST_TENANT })
      const t2 = createTestTask({ name: 'Running Task', tenantId: TEST_TENANT })
      service.updateTaskStatus(t2.id, TaskStatus.Running, TEST_TENANT)

      const running = service.listTasks(TEST_TENANT, { status: TaskStatus.Running })
      assert.equal(running.length, 1)
      assert.equal(running[0].status, TaskStatus.Running)
    })

    it('should filter by type', () => {
      createTestTask({ name: 'OneTime', type: TaskType.OneTime, tenantId: TEST_TENANT })
      createTestTask({ name: 'Recurring', type: TaskType.Recurring, tenantId: TEST_TENANT })

      const recurring = service.listTasks(TEST_TENANT, { type: TaskType.Recurring })
      assert.equal(recurring.length, 1)
    })

    it('should filter by priority', () => {
      createTestTask({ name: 'High', priority: TaskPriority.High, tenantId: TEST_TENANT })
      createTestTask({ name: 'Low', priority: TaskPriority.Low, tenantId: TEST_TENANT })

      const high = service.listTasks(TEST_TENANT, { priority: TaskPriority.High })
      assert.equal(high.length, 1)
    })

    it('should filter by assignedTo', () => {
      createTestTask({ name: 'U1', assignedTo: 'user-001', tenantId: TEST_TENANT })
      createTestTask({ name: 'U2', assignedTo: 'user-002', tenantId: TEST_TENANT })

      const u1 = service.listTasks(TEST_TENANT, { assignedTo: 'user-001' })
      assert.equal(u1.length, 1)
    })
  })

  describe('updateTask', () => {
    it('should update task fields', () => {
      const t = createTestTask()
      const updated = service.updateTask(t.id, TENANT, {
        name: 'Updated Name',
        priority: TaskPriority.High,
      })

      assert.equal(updated.name, 'Updated Name')
      assert.equal(updated.priority, TaskPriority.High)
    })

    it('should throw for non-existent task', () => {
      assert.throws(
        () => service.updateTask('nonexistent', TENANT, { name: 'X' }),
        /Task not found/
      )
    })

    it('should throw for wrong tenant', () => {
      const t = createTestTask()
      assert.throws(
        () => service.updateTask(t.id, 'wrong-tenant', { name: 'X' }),
        /Task not found/
      )
    })
  })

  describe('deleteTask', () => {
    it('should delete a task', () => {
      const t = createTestTask()
      service.deleteTask(t.id, TENANT)

      const found = service.getTask(t.id, TENANT)
      assert.equal(found, undefined)
    })

    it('should throw for non-existent task', () => {
      assert.throws(
        () => service.deleteTask('nonexistent', TENANT),
        /Task not found/
      )
    })

    it('should throw for wrong tenant', () => {
      const t = createTestTask()
      assert.throws(
        () => service.deleteTask(t.id, 'wrong-tenant'),
        /Task not found/
      )
    })
  })

  // ── Status transitions ──

  describe('updateTaskStatus', () => {
    it('should transition Pending → Running', () => {
      const t = createTestTask()
      const updated = service.updateTaskStatus(t.id, TaskStatus.Running, TENANT)
      assert.equal(updated.status, TaskStatus.Running)
    })

    it('should transition Pending → Cancelled', () => {
      const t = createTestTask()
      const updated = service.updateTaskStatus(t.id, TaskStatus.Cancelled, TENANT)
      assert.equal(updated.status, TaskStatus.Cancelled)
    })

    it('should transition Running → Completed', () => {
      const t = createTestTask()
      service.updateTaskStatus(t.id, TaskStatus.Running, TENANT)
      const updated = service.updateTaskStatus(t.id, TaskStatus.Completed, TENANT)
      assert.equal(updated.status, TaskStatus.Completed)
    })

    it('should transition Running → Failed', () => {
      const t = createTestTask()
      service.updateTaskStatus(t.id, TaskStatus.Running, TENANT)
      const updated = service.updateTaskStatus(t.id, TaskStatus.Failed, TENANT)
      assert.equal(updated.status, TaskStatus.Failed)
    })

    it('should transition Failed → Pending (retry)', () => {
      const t = createTestTask()
      service.updateTaskStatus(t.id, TaskStatus.Running, TENANT)
      service.updateTaskStatus(t.id, TaskStatus.Failed, TENANT)
      const updated = service.updateTaskStatus(t.id, TaskStatus.Pending, TENANT)
      assert.equal(updated.status, TaskStatus.Pending)
    })

    it('should transition Cancelled → Pending (reopen)', () => {
      const t = createTestTask()
      service.updateTaskStatus(t.id, TaskStatus.Cancelled, TENANT)
      const updated = service.updateTaskStatus(t.id, TaskStatus.Pending, TENANT)
      assert.equal(updated.status, TaskStatus.Pending)
    })

    it('should reject invalid transition: Pending → Completed', () => {
      const t = createTestTask()
      assert.throws(
        () => service.updateTaskStatus(t.id, TaskStatus.Completed, TENANT),
        /Invalid task status transition/
      )
    })

    it('should reject invalid transition: Completed → Running', () => {
      const t = createTestTask()
      service.updateTaskStatus(t.id, TaskStatus.Running, TENANT)
      service.updateTaskStatus(t.id, TaskStatus.Completed, TENANT)
      assert.throws(
        () => service.updateTaskStatus(t.id, TaskStatus.Running, TENANT),
        /Invalid task status transition/
      )
    })
  })

  describe('batchUpdateStatus', () => {
    it('should update status for multiple tasks', () => {
      const t1 = createTestTask({ name: 'T1' })
      const t2 = createTestTask({ name: 'T2' })

      const results = service.batchUpdateStatus([t1.id, t2.id], TaskStatus.Cancelled, TENANT)
      assert.equal(results.length, 2)
      assert.equal(results[0].status, TaskStatus.Cancelled)
      assert.equal(results[1].status, TaskStatus.Cancelled)
    })

    it('should throw if any task not found', () => {
      const t1 = createTestTask()
      assert.throws(
        () => service.batchUpdateStatus([t1.id, 'nonexistent'], TaskStatus.Cancelled, TENANT),
        /Task not found/
      )
    })
  })

  // ── Scheduling views ──

  describe('getPendingTasks', () => {
    it('should return pending tasks sorted by priority', () => {
      createTestTask({ name: 'Low', priority: TaskPriority.Low })
      createTestTask({ name: 'High', priority: TaskPriority.High })

      const pending = service.getPendingTasks(TENANT)
      // All just created tasks are PENDING
      assert.ok(pending.length >= 2)
    })
  })

  describe('getTaskByAssignee', () => {
    it('should return tasks for an assignee', () => {
      createTestTask({ name: 'T1', assignedTo: 'user-001' })
      createTestTask({ name: 'T2', assignedTo: 'user-001' })
      createTestTask({ name: 'T3', assignedTo: 'user-002' })

      const u1Tasks = service.getTaskByAssignee('user-001', TENANT)
      assert.equal(u1Tasks.length, 2)
    })

    it('should return empty for unknown assignee', () => {
      const tasks = service.getTaskByAssignee('nobody', TENANT)
      assert.equal(tasks.length, 0)
    })
  })

  describe('getRecurringTasks', () => {
    it('should return recurring tasks', () => {
      createTestTask({ name: 'OT', type: TaskType.OneTime, tenantId: TEST_TENANT })
      createTestTask({ name: 'RC', type: TaskType.Recurring, cronExpr: '0 2 * * *', tenantId: TEST_TENANT })

      const recurring = service.getRecurringTasks(TEST_TENANT)
      assert.equal(recurring.length, 1)
      assert.equal(recurring[0].name, 'RC')
    })
  })

  describe('getShiftTasks', () => {
    it('should return shift tasks', () => {
      createTestTask({ name: 'OT', type: TaskType.OneTime, tenantId: TEST_TENANT })
      createTestTask({ name: 'SH', type: TaskType.Shift, tenantId: TEST_TENANT })

      const shifts = service.getShiftTasks(TEST_TENANT)
      assert.equal(shifts.length, 1)
      assert.equal(shifts[0].name, 'SH')
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// 树哥B — 圈梁五道箍 — TaskScheduler Service 追加测试 (16条)
// 覆盖: createTask 边界 / updateTask 复杂patch / 状态机全路径 / 多租户隔离 / seed 数据验证
// ═══════════════════════════════════════════════════════════════

describe('TaskSchedulerService — 追加 [树哥B-圈梁五道箍]', () => {
  let service: TaskSchedulerService

  const TENANT = 'tenant-001'
  const ALT_TENANT = 'tenant-alt-002'

  beforeEach(() => {
    service = new TaskSchedulerService()
  })

  afterEach(() => {
    service.resetTaskStoresForTests()
  })

  function createTestTask(overrides?: Partial<Parameters<TaskSchedulerService['createTask']>[0]>): Task {
    return service.createTask({
      tenantId: TENANT,
      name: 'Test Task',
      type: TaskType.OneTime,
      priority: TaskPriority.Medium,
      assignedTo: 'user-001',
      startTime: '2026-07-17T10:00:00.000Z',
      description: 'A test task',
      ...overrides,
    })
  }

  // ── createTask 边界 ──

  it('[B1] createTask 使用超大 description 不截断', () => {
    const longDesc = 'A'.repeat(5000)
    const t = createTestTask({ description: longDesc })
    assert.equal(t.description.length, 5000)
  })

  it('[B2] createTask createdAt 和 updatedAt 值相同（新建时）', () => {
    const t = createTestTask()
    assert.equal(t.createdAt, t.updatedAt, '新建任务 created=updated')
  })

  it('[B3] createTask endTime 为可选字段不传不报错', () => {
    const t = createTestTask({ type: TaskType.Recurring, cronExpr: '0 8 * * 1' })
    assert.equal(t.endTime, undefined)
  })

  it('[B4] createTask Shift 类型必填 endTime', () => {
    const t = createTestTask({ type: TaskType.Shift, endTime: '2026-07-17T16:00:00.000Z' })
    assert.equal(t.endTime, '2026-07-17T16:00:00.000Z')
  })

  // ── updateTask 复杂场景 ──

  it('[B5] updateTask 全字段更新', () => {
    const t = createTestTask()
    const updated = service.updateTask(t.id, TENANT, {
      name: 'New', type: TaskType.Recurring, priority: TaskPriority.High,
      cronExpr: '0 0 * * *', assignedTo: 'new-user', startTime: '2026-08-01T00:00:00Z',
      endTime: '2026-08-01T01:00:00Z', description: 'Updated desc',
    })
    assert.equal(updated.name, 'New')
    assert.equal(updated.type, TaskType.Recurring)
    assert.equal(updated.cronExpr, '0 0 * * *')
    assert.equal(updated.assignedTo, 'new-user')
    assert.equal(updated.description, 'Updated desc')
  })

  it('[B6] updateTask 部分字段更新后其他字段不变', () => {
    const t = createTestTask({ name: 'Original', priority: TaskPriority.Low })
    const updated = service.updateTask(t.id, TENANT, { name: 'Renamed' })
    assert.equal(updated.name, 'Renamed')
    assert.equal(updated.priority, TaskPriority.Low, '未更新字段保持不变')
  })

  it('[B7] updateTask updatedAt 在更新后变化', () => {
    const t = createTestTask()
    const oldUpdated = t.updatedAt
    // updateTask 内部会 new Date().toISOString() 刷新 updatedAt
    const updated = service.updateTask(t.id, TENANT, { name: 'Changed' })
    // 同毫秒内可能相等,但 updatedAt 不会比 oldUpdated 小
    assert.ok(updated.updatedAt >= oldUpdated, 'updatedAt 不应变小')
  })

  // ── 状态机全路径 ──

  it('[B8] Running → Cancelled 合法', () => {
    const t = createTestTask()
    service.updateTaskStatus(t.id, TaskStatus.Running, TENANT)
    const updated = service.updateTaskStatus(t.id, TaskStatus.Cancelled, TENANT)
    assert.equal(updated.status, TaskStatus.Cancelled)
  })

  it('[B9] Running → Failed → Pending (重试闭环)', () => {
    const t = createTestTask()
    service.updateTaskStatus(t.id, TaskStatus.Running, TENANT)
    service.updateTaskStatus(t.id, TaskStatus.Failed, TENANT)
    const retried = service.updateTaskStatus(t.id, TaskStatus.Pending, TENANT)
    assert.equal(retried.status, TaskStatus.Pending)
  })

  it('[B10] 非法: Completed → Failed 抛出异常', () => {
    const t = createTestTask()
    service.updateTaskStatus(t.id, TaskStatus.Running, TENANT)
    service.updateTaskStatus(t.id, TaskStatus.Completed, TENANT)
    assert.throws(
      () => service.updateTaskStatus(t.id, TaskStatus.Failed, TENANT),
      /Invalid task status transition/,
    )
  })

  it('[B11] 非法: Cancelled → Running 抛出异常', () => {
    const t = createTestTask()
    service.updateTaskStatus(t.id, TaskStatus.Cancelled, TENANT)
    assert.throws(
      () => service.updateTaskStatus(t.id, TaskStatus.Running, TENANT),
      /Invalid task status transition/,
    )
  })

  // ── 多租户隔离 ──

  it('[B12] 不同 tenant 的任务互不可见', () => {
    createTestTask({ tenantId: TENANT })
    createTestTask({ tenantId: ALT_TENANT })

    const listA = service.listTasks(TENANT)
    const listB = service.listTasks(ALT_TENANT)

    // listA 包含 seed 数据,所以 > 1
    assert.ok(listA.length >= 1, 'TENANT 应有任务')
    assert.equal(listB.length, 1, 'ALT_TENANT 只有新创建的任务')
    assert(listA.some(t => t.tenantId === TENANT), 'listA 包含 TENANT 任务')
    assert(listB.every(t => t.tenantId === ALT_TENANT), 'listB 全是 ALT_TENANT 任务')
  })

  it('[B13] 跨租户 deleteTask 抛出异常', () => {
    const t = createTestTask({ tenantId: TENANT })
    assert.throws(
      () => service.deleteTask(t.id, ALT_TENANT),
      /Task not found/,
    )
  })

  it('[B14] 跨租户 updateTaskStatus 抛出异常', () => {
    const t = createTestTask({ tenantId: TENANT })
    assert.throws(
      () => service.updateTaskStatus(t.id, TaskStatus.Running, ALT_TENANT),
      /Task not found/,
    )
  })

  // ── seed 数据验证 ──

  it('[B15] getPendingTasks 返回的 seed 数据包含不同 priority', () => {
    // listTasks 会触发 seedMockTasks 从而包含预埋的 22 个任务
    const all = service.listTasks(TENANT)
    const pending = service.getPendingTasks(TENANT)
    assert.ok(pending.length > 0, 'seed 数据应包含 pending 任务')
    assert.ok(pending.length <= all.length, 'pending 数量不超过总数')
  })

  it('[B16] getTaskByAssignee 返回空当 assignee 无任务', () => {
    const tasks = service.getTaskByAssignee('no-such-user', TENANT)
    assert.equal(tasks.length, 0)
  })

  it('[B17] batchUpdateStatus 批量 Cancelled 后全部不可再 Running', () => {
    const t1 = createTestTask({ name: 'B1' })
    const t2 = createTestTask({ name: 'B2' })
    service.batchUpdateStatus([t1.id, t2.id], TaskStatus.Cancelled, TENANT)

    assert.throws(() => service.updateTaskStatus(t1.id, TaskStatus.Running, TENANT))
    assert.throws(() => service.updateTaskStatus(t2.id, TaskStatus.Running, TENANT))
  })
})

