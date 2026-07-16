import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  TaskStatus,
  TaskType,
  TaskPriority,
  type Task,
} from './task-scheduler.entity'

// ── In-memory store ──

const taskStore = new Map<string, Task>()

// ── Mock data seeded on first use ──

let seeded = false

function seedMockTasks(): void {
  if (seeded) return
  seeded = true

  const tenant = 'tenant-001'
  const now = new Date()

  const mockTasks: Array<{
    name: string; type: TaskType; priority: TaskPriority; status: TaskStatus; cronExpr?: string
    assignedTo: string; startTime: Date; endTime?: Date; description: string
  }> = [
    { name: '每日数据备份', type: TaskType.Recurring, priority: TaskPriority.High, status: TaskStatus.Pending, cronExpr: '0 2 * * *', assignedTo: 'sys-admin', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 2, 0), description: '每日凌晨2点执行数据库全量备份' },
    { name: '周报生成', type: TaskType.Recurring, priority: TaskPriority.Medium, status: TaskStatus.Pending, cronExpr: '0 8 * * 1', assignedTo: 'manager-01', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + (1 - now.getDay()), 8, 0), description: '每周一早上8点生成上周运营周报' },
    { name: '库存盘点', type: TaskType.OneTime, priority: TaskPriority.High, status: TaskStatus.Pending, assignedTo: 'warehouse-01', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0), description: '月度库存盘点 - 核对所有库位实物与系统数据' },
    { name: '月度对账', type: TaskType.Recurring, priority: TaskPriority.High, status: TaskStatus.Completed, cronExpr: '0 9 1 * *', assignedTo: 'finance-01', startTime: new Date(now.getFullYear(), now.getMonth(), 1, 9, 0), description: '每月1号财务对账' },
    { name: '供应商评估', type: TaskType.OneTime, priority: TaskPriority.Medium, status: TaskStatus.Running, assignedTo: 'procurement-01', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0), description: '完成Q3供应商绩效评估报告' },
    { name: '设备巡检', type: TaskType.Recurring, priority: TaskPriority.Medium, status: TaskStatus.Pending, cronExpr: '0 14 * * 3', assignedTo: 'maintenance-01', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + (3 - now.getDay()), 14, 0), description: '每周三下午设备例行巡检' },
    { name: 'A班收银交接', type: TaskType.Shift, priority: TaskPriority.Low, status: TaskStatus.Pending, assignedTo: 'cashier-a', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0), endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0), description: '早班收银交接班' },
    { name: 'B班收银交接', type: TaskType.Shift, priority: TaskPriority.Low, status: TaskStatus.Running, assignedTo: 'cashier-b', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0), endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 24, 0), description: '晚班收银交接班' },
    { name: '系统更新部署', type: TaskType.OneTime, priority: TaskPriority.High, status: TaskStatus.Failed, assignedTo: 'devops-01', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 3, 0), description: 'v2.3.0 系统版本更新部署 - 失败需回滚' },
    { name: '订单数据清洗', type: TaskType.OneTime, priority: TaskPriority.Medium, status: TaskStatus.Cancelled, assignedTo: 'data-01', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 11, 0), description: '清理上月异常订单数据 - 因需求变更取消' },
    { name: '员工培训安排', type: TaskType.OneTime, priority: TaskPriority.Low, status: TaskStatus.Pending, assignedTo: 'hr-01', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 9, 0), description: '新员工入职培训课程安排' },
    { name: '促销活动上架', type: TaskType.OneTime, priority: TaskPriority.High, status: TaskStatus.Pending, assignedTo: 'marketing-01', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0), description: '双十一预热促销活动配置上架' },
    { name: '数据库索引优化', type: TaskType.OneTime, priority: TaskPriority.Medium, status: TaskStatus.Pending, assignedTo: 'dba-01', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 22, 0), description: '分析慢查询并优化数据库索引' },
    { name: '每日销售报表', type: TaskType.Recurring, priority: TaskPriority.Medium, status: TaskStatus.Pending, cronExpr: '0 7 * * *', assignedTo: 'manager-01', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0), description: '每日7点推送前日销售数据报表' },
    { name: '冷库温度检测', type: TaskType.Recurring, priority: TaskPriority.High, status: TaskStatus.Running, cronExpr: '*/30 * * * *', assignedTo: 'sensor-svc', startTime: new Date(), description: '每30分钟检测冷库温度并记录' },
    { name: '客户回访', type: TaskType.Shift, priority: TaskPriority.Low, status: TaskStatus.Pending, assignedTo: 'cs-01', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0), endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0), description: '上午客户满意度回访' },
    { name: '质检抽检', type: TaskType.Shift, priority: TaskPriority.High, status: TaskStatus.Pending, assignedTo: 'qc-01', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0), endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0), description: '下午来料质检抽检' },
    { name: '财务报表导出', type: TaskType.OneTime, priority: TaskPriority.Medium, status: TaskStatus.Completed, assignedTo: 'finance-02', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 17, 0), description: '导出Q2财务报表' },
    { name: '服务器日志清理', type: TaskType.Recurring, priority: TaskPriority.Low, status: TaskStatus.Pending, cronExpr: '0 3 1 * *', assignedTo: 'devops-02', startTime: new Date(now.getFullYear(), now.getMonth(), 1, 3, 0), description: '每月1号凌晨清理30天前的服务器日志' },
    { name: '配送路线规划', type: TaskType.OneTime, priority: TaskPriority.Medium, status: TaskStatus.Pending, assignedTo: 'logistics-01', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 8, 0), description: '规划下月配送路线优化方案' },
    { name: 'API密钥轮换', type: TaskType.Recurring, priority: TaskPriority.High, status: TaskStatus.Pending, cronExpr: '0 2 15 * *', assignedTo: 'security-01', startTime: new Date(now.getFullYear(), now.getMonth(), 15, 2, 0), description: '每月15号凌晨轮换第三方API密钥' },
    { name: '门店盘点复核', type: TaskType.OneTime, priority: TaskPriority.High, status: TaskStatus.Completed, assignedTo: 'auditor-01', startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 10, 0), description: '复核门店季度盘点结果' },
  ]

  for (const m of mockTasks) {
    const task: Task = {
      id: `task-${randomUUID()}`,
      name: m.name,
      type: m.type,
      priority: m.priority,
      status: m.status,
      cronExpr: m.cronExpr,
      assignedTo: m.assignedTo,
      startTime: m.startTime.toISOString(),
      endTime: m.endTime?.toISOString(),
      description: m.description,
      tenantId: tenant,
      createdAt: new Date(now.getTime() - Math.random() * 7 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    }
    taskStore.set(task.id, task)
  }
}

@Injectable()
export class TaskSchedulerService {
  // ═══════════════════════════════════════════════════════════════════
  // Task CRUD
  // ═══════════════════════════════════════════════════════════════════

  createTask(input: {
    tenantId: string
    name: string
    type: TaskType
    priority: TaskPriority
    cronExpr?: string
    assignedTo: string
    startTime: string
    endTime?: string
    description: string
  }): Task {
    const now = new Date().toISOString()
    const task: Task = {
      id: `task-${randomUUID()}`,
      tenantId: input.tenantId,
      name: input.name,
      type: input.type,
      priority: input.priority,
      status: TaskStatus.Pending,
      cronExpr: input.cronExpr,
      assignedTo: input.assignedTo,
      startTime: input.startTime,
      endTime: input.endTime,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    }
    taskStore.set(task.id, task)
    return task
  }

  updateTask(
    taskId: string,
    tenantId: string,
    input: {
      name?: string
      type?: TaskType
      priority?: TaskPriority
      cronExpr?: string
      assignedTo?: string
      startTime?: string
      endTime?: string
      description?: string
    }
  ): Task {
    const task = this.requireTask(taskId, tenantId)

    if (input.name !== undefined) task.name = input.name
    if (input.type !== undefined) task.type = input.type
    if (input.priority !== undefined) task.priority = input.priority
    if (input.cronExpr !== undefined) task.cronExpr = input.cronExpr
    if (input.assignedTo !== undefined) task.assignedTo = input.assignedTo
    if (input.startTime !== undefined) task.startTime = input.startTime
    if (input.endTime !== undefined) task.endTime = input.endTime
    if (input.description !== undefined) task.description = input.description

    task.updatedAt = new Date().toISOString()
    taskStore.set(taskId, task)
    return task
  }

  getTask(taskId: string, tenantId: string): Task | undefined {
    const task = taskStore.get(taskId)
    if (!task || task.tenantId !== tenantId) return undefined
    return task
  }

  listTasks(
    tenantId: string,
    filter?: {
      status?: TaskStatus
      type?: TaskType
      priority?: TaskPriority
      assignedTo?: string
    }
  ): Task[] {
    seedMockTasks()
    return Array.from(taskStore.values())
      .filter((t) => t.tenantId === tenantId)
      .filter((t) => (filter?.status ? t.status === filter.status : true))
      .filter((t) => (filter?.type ? t.type === filter.type : true))
      .filter((t) => (filter?.priority ? t.priority === filter.priority : true))
      .filter((t) => (filter?.assignedTo ? t.assignedTo === filter.assignedTo : true))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  deleteTask(taskId: string, tenantId: string): void {
    const task = this.requireTask(taskId, tenantId)
    taskStore.delete(task.id)
  }

  // ═══════════════════════════════════════════════════════════════════
  // Status management
  // ═══════════════════════════════════════════════════════════════════

  updateTaskStatus(taskId: string, status: TaskStatus, tenantId: string): Task {
    const task = this.requireTask(taskId, tenantId)
    this.assertValidStatusTransition(task.status, status)
    task.status = status
    task.updatedAt = new Date().toISOString()
    taskStore.set(taskId, task)
    return task
  }

  batchUpdateStatus(
    taskIds: string[],
    status: TaskStatus,
    tenantId: string
  ): Task[] {
    return taskIds.map((id) => this.updateTaskStatus(id, status, tenantId))
  }

  // ═══════════════════════════════════════════════════════════════════
  // Scheduling logic
  // ═══════════════════════════════════════════════════════════════════

  getPendingTasks(tenantId: string): Task[] {
    seedMockTasks()
    return Array.from(taskStore.values())
      .filter((t) => t.tenantId === tenantId && t.status === TaskStatus.Pending)
      .sort((a, b) => a.priority.localeCompare(b.priority) || a.startTime.localeCompare(b.startTime))
  }

  getTaskByAssignee(assignedTo: string, tenantId: string): Task[] {
    seedMockTasks()
    return Array.from(taskStore.values())
      .filter((t) => t.tenantId === tenantId && t.assignedTo === assignedTo)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  getRecurringTasks(tenantId: string): Task[] {
    seedMockTasks()
    return Array.from(taskStore.values())
      .filter((t) => t.tenantId === tenantId && t.type === TaskType.Recurring)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  getShiftTasks(tenantId: string): Task[] {
    seedMockTasks()
    return Array.from(taskStore.values())
      .filter((t) => t.tenantId === tenantId && t.type === TaskType.Shift)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  // ═══════════════════════════════════════════════════════════════════
  // Internals
  // ═══════════════════════════════════════════════════════════════════

  private requireTask(taskId: string, tenantId: string): Task {
    const task = taskStore.get(taskId)
    if (!task || task.tenantId !== tenantId) {
      throw new Error(`Task not found: ${taskId}`)
    }
    return task
  }

  private assertValidStatusTransition(from: TaskStatus, to: TaskStatus): void {
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.Pending]: [TaskStatus.Running, TaskStatus.Cancelled],
      [TaskStatus.Running]: [TaskStatus.Completed, TaskStatus.Failed, TaskStatus.Cancelled],
      [TaskStatus.Completed]: [],
      [TaskStatus.Failed]: [TaskStatus.Pending, TaskStatus.Cancelled],
      [TaskStatus.Cancelled]: [TaskStatus.Pending],
    }
    if (!validTransitions[from].includes(to)) {
      throw new Error(`Invalid task status transition: ${from} → ${to}`)
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test helpers
  // ═══════════════════════════════════════════════════════════════════

  resetTaskStoresForTests(): void {
    taskStore.clear()
    seeded = false
  }
}
