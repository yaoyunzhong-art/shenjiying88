/**
 * task-scheduler.service.spec.ts — 任务调度模块 Service 单元测试
 *
 * 覆盖: CRUD / 状态流转 / 查询辅助 / 批量操作 / 非法状态转换
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TaskSchedulerService } from './task-scheduler.service'
import { TaskStatus, TaskType, TaskPriority } from './task-scheduler.entity'

describe('TaskSchedulerService — CRUD', () => {
  let svc: TaskSchedulerService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new TaskSchedulerService()
    svc.resetTaskStoresForTests()
  })

  it('createTask 创建成功', () => {
    const task = svc.createTask({
      tenantId,
      name: '测试任务',
      type: TaskType.OneTime,
      priority: TaskPriority.High,
      assignedTo: 'developer-01',
      startTime: '2026-08-01T10:00:00.000Z',
      description: '这是一个测试任务',
    })
    expect(task.id).toMatch(/^task-/)
    expect(task.name).toBe('测试任务')
    expect(task.status).toBe(TaskStatus.Pending)
    expect(task.type).toBe(TaskType.OneTime)
  })

  it('createTask 支持周期性任务', () => {
    const task = svc.createTask({
      tenantId, name: '每日任务', type: TaskType.Recurring,
      priority: TaskPriority.Medium, cronExpr: '0 2 * * *',
      assignedTo: 'sys', startTime: '2026-08-01T02:00:00.000Z',
      description: '每日备份',
    })
    expect(task.cronExpr).toBe('0 2 * * *')
    expect(task.type).toBe(TaskType.Recurring)
  })

  it('getTask 返回正确的任务', () => {
    const created = svc.createTask({
      tenantId, name: '查询任务', type: TaskType.OneTime,
      priority: TaskPriority.Low, assignedTo: 'a',
      startTime: '2026-08-01T10:00:00.000Z', description: '查询测试',
    })
    const found = svc.getTask(created.id, tenantId)
    expect(found).toBeDefined()
    expect(found!.name).toBe('查询任务')
  })

  it('getTask 返回 undefined 当任务不存在', () => {
    expect(svc.getTask('fake-id', tenantId)).toBeUndefined()
  })

  it('updateTask 更新任务字段', () => {
    const task = svc.createTask({
      tenantId, name: '旧名', type: TaskType.OneTime,
      priority: TaskPriority.Medium, assignedTo: 'a',
      startTime: '2026-08-01T10:00:00.000Z', description: '旧描述',
    })
    const updated = svc.updateTask(task.id, tenantId, {
      name: '新名称',
      priority: TaskPriority.High,
      description: '新描述',
      assignedTo: 'b',
    })
    expect(updated.name).toBe('新名称')
    expect(updated.priority).toBe(TaskPriority.High)
    expect(updated.assignedTo).toBe('b')
  })

  it('deleteTask 删除成功', () => {
    const task = svc.createTask({
      tenantId, name: '删除测试', type: TaskType.OneTime,
      priority: TaskPriority.Low, assignedTo: 'a',
      startTime: '2026-08-01T10:00:00.000Z', description: '删除',
    })
    svc.deleteTask(task.id, tenantId)
    expect(svc.getTask(task.id, tenantId)).toBeUndefined()
  })

  it('deleteTask 不存在的任务抛 Error', () => {
    expect(() => svc.deleteTask('fake', tenantId)).toThrow(/not found/)
  })
})

describe('TaskSchedulerService — 状态流转', () => {
  let svc: TaskSchedulerService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new TaskSchedulerService()
    svc.resetTaskStoresForTests()
  })

  it('Pending → Running 成功', () => {
    const task = svc.createTask({
      tenantId, name: '开始执行', type: TaskType.OneTime,
      priority: TaskPriority.High, assignedTo: 'a',
      startTime: '2026-08-01T10:00:00.000Z', description: '',
    })
    const updated = svc.updateTaskStatus(task.id, TaskStatus.Running, tenantId)
    expect(updated.status).toBe(TaskStatus.Running)
  })

  it('Running → Completed 成功', () => {
    const task = svc.createTask({
      tenantId, name: '完成任务', type: TaskType.OneTime,
      priority: TaskPriority.High, assignedTo: 'a',
      startTime: '2026-08-01T10:00:00.000Z', description: '',
    })
    svc.updateTaskStatus(task.id, TaskStatus.Running, tenantId)
    const completed = svc.updateTaskStatus(task.id, TaskStatus.Completed, tenantId)
    expect(completed.status).toBe(TaskStatus.Completed)
  })

  it('Running → Failed 成功', () => {
    const task = svc.createTask({
      tenantId, name: '失败任务', type: TaskType.OneTime,
      priority: TaskPriority.High, assignedTo: 'a',
      startTime: '2026-08-01T10:00:00.000Z', description: '',
    })
    svc.updateTaskStatus(task.id, TaskStatus.Running, tenantId)
    const failed = svc.updateTaskStatus(task.id, TaskStatus.Failed, tenantId)
    expect(failed.status).toBe(TaskStatus.Failed)
  })

  it('Pending → Cancelled 成功', () => {
    const task = svc.createTask({
      tenantId, name: '取消任务', type: TaskType.OneTime,
      priority: TaskPriority.Medium, assignedTo: 'a',
      startTime: '2026-08-01T10:00:00.000Z', description: '',
    })
    const cancelled = svc.updateTaskStatus(task.id, TaskStatus.Cancelled, tenantId)
    expect(cancelled.status).toBe(TaskStatus.Cancelled)
  })

  it('无效状态转换抛 Error', () => {
    const task = svc.createTask({
      tenantId, name: '无效转换', type: TaskType.OneTime,
      priority: TaskPriority.Medium, assignedTo: 'a',
      startTime: '2026-08-01T10:00:00.000Z', description: '',
    })
    expect(() => svc.updateTaskStatus(task.id, TaskStatus.Completed, tenantId)).toThrow(/Invalid/)
  })

  it('batchUpdateStatus 批量更新', () => {
    const t1 = svc.createTask({
      tenantId, name: '批量1', type: TaskType.OneTime,
      priority: TaskPriority.Low, assignedTo: 'a',
      startTime: '2026-08-01T10:00:00.000Z', description: '',
    })
    const t2 = svc.createTask({
      tenantId, name: '批量2', type: TaskType.OneTime,
      priority: TaskPriority.Low, assignedTo: 'a',
      startTime: '2026-08-01T10:00:00.000Z', description: '',
    })
    const results = svc.batchUpdateStatus([t1.id, t2.id], TaskStatus.Cancelled, tenantId)
    expect(results).toHaveLength(2)
    results.forEach((r) => expect(r.status).toBe(TaskStatus.Cancelled))
  })
})

describe('TaskSchedulerService — 查询辅助', () => {
  let svc: TaskSchedulerService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new TaskSchedulerService()
    svc.resetTaskStoresForTests()
  })

  it('listTasks 支持按类型筛选', () => {
    const items = svc.listTasks(tenantId, { type: TaskType.Recurring })
    items.forEach((t) => expect(t.type).toBe(TaskType.Recurring))
  })

  it('listTasks 支持按优先级筛选', () => {
    const items = svc.listTasks(tenantId, { priority: TaskPriority.High })
    items.forEach((t) => expect(t.priority).toBe(TaskPriority.High))
  })

  it('listTasks 支持按指派人筛选', () => {
    const items = svc.listTasks(tenantId, { assignedTo: 'sys-admin' })
    items.forEach((t) => expect(t.assignedTo).toBe('sys-admin'))
  })

  it('listTasks 支持按状态筛选', () => {
    const items = svc.listTasks(tenantId, { status: TaskStatus.Pending })
    items.forEach((t) => expect(t.status).toBe(TaskStatus.Pending))
  })

  it('getPendingTasks 返回待处理任务', () => {
    const pending = svc.getPendingTasks(tenantId)
    pending.forEach((t) => expect(t.status).toBe(TaskStatus.Pending))
  })

  it('getTaskByAssignee 按指派人查询', () => {
    const items = svc.getTaskByAssignee('warehouse-01', tenantId)
    items.forEach((t) => expect(t.assignedTo).toBe('warehouse-01'))
  })

  it('getRecurringTasks 返回周期性任务', () => {
    const items = svc.getRecurringTasks(tenantId)
    items.forEach((t) => expect(t.type).toBe(TaskType.Recurring))
  })

  it('getShiftTasks 返回轮班任务', () => {
    const items = svc.getShiftTasks(tenantId)
    items.forEach((t) => expect(t.type).toBe(TaskType.Shift))
  })
})
