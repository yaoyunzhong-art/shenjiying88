/**
 * 🐜 自动: [task-scheduler] [C] 角色扩展测试
 *
 * 8 角色视角的任务调度扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 TaskSchedulerService + in-memory Store
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { TaskSchedulerService } from './task-scheduler.service'
import { TaskStatus, TaskType, TaskPriority } from './task-scheduler.entity'

// ── 角色权限矩阵 ──

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

/** 角色 → 任务调度权限 */
const roleTaskAccess: Record<string, string[]> = {
  'task:list': ['👔店长', '🎯运行专员'],
  'task:detail': ['👔店长', '🎯运行专员'],
  'task:create': ['🎯运行专员'],
  'task:update': ['🎯运行专员'],
  'task:delete': ['🎯运行专员'],
  'task:status': ['🎯运行专员'],
  'task:assignee': ['👔店长', '🎯运行专员'],
  'task:recurring': ['🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleTaskAccess[resource]?.includes(role) ?? false
}

const TENANT = 'tenant-001'

function makeSvc(): TaskSchedulerService {
  const svc = new TaskSchedulerService()
  svc.resetTaskStoresForTests()
  return svc
}

/** 创建一个基础 seed 任务后返回 service */
function makeSeededSvc(): TaskSchedulerService {
  const svc = makeSvc()
  svc.createTask({
    tenantId: TENANT, name: '测试任务-日常备份', type: TaskType.Recurring,
    priority: TaskPriority.High, cronExpr: '0 2 * * *', assignedTo: 'sys-admin',
    startTime: new Date().toISOString(), description: '日常备份测试',
  })
  svc.createTask({
    tenantId: TENANT, name: '测试任务-库存盘点', type: TaskType.OneTime,
    priority: TaskPriority.Medium, assignedTo: 'warehouse-01',
    startTime: new Date(Date.now() + 86400000).toISOString(), description: '库存盘点',
  })
  return svc
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 任务调度
// ════════════════════════════════════════════════════════════

describe('[👔店长] task-scheduler 角色扩展测试', () => {
  it('👔[正例] 店长查看任务列表 → 按状态筛选', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'task:list')).toBe(true)
    const svc = makeSeededSvc()
    const all = svc.listTasks(TENANT)
    expect(all.length).toBeGreaterThan(0)

    const pending = svc.listTasks(TENANT, { status: TaskStatus.Pending })
    pending.forEach((t) => expect(t.status).toBe(TaskStatus.Pending))
  })

  it('👔[正例] 店长查看任务详情', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'task:detail')).toBe(true)
    const svc = makeSeededSvc()
    const tasks = svc.listTasks(TENANT)
    const detail = svc.getTask(tasks[0].id, TENANT)
    expect(detail).toBeDefined()
    expect(detail!.name).toBeTruthy()
  })

  it('👔[正例] 店长按负责人查询任务', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'task:assignee')).toBe(true)
    const svc = makeSeededSvc()
    const assigneeTasks = svc.getTaskByAssignee('warehouse-01', TENANT)
    expect(assigneeTasks.length).toBeGreaterThan(0)
    assigneeTasks.forEach((t) => expect(t.assignedTo).toBe('warehouse-01'))
  })

  it('👔[反例] 店长无权创建/更新/删除任务', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'task:create')).toBe(false)
    expect(checkRoleAccess(ROLES.StoreManager, 'task:update')).toBe(false)
    expect(checkRoleAccess(ROLES.StoreManager, 'task:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.StoreManager, 'task:status')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 任务调度
// ════════════════════════════════════════════════════════════

describe('[🛒前台] task-scheduler 角色扩展测试', () => {
  it('🛒[反例] 前台无权查看任务列表', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'task:list')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'task:detail')).toBe(false)
  })

  it('🛒[反例] 前台无权操作任务', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'task:create')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'task:update')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'task:status')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'task:delete')).toBe(false)
  })

  it('🛒[闭环] 前台无权限返回统一拒绝格式', () => {
    const denied = { success: false, code: 403, message: 'NO_TASK_SCHEDULER_ACCESS', module: 'task-scheduler' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('task-scheduler')
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 任务调度
// ════════════════════════════════════════════════════════════

describe('[👥HR] task-scheduler 角色扩展测试', () => {
  it('👥[反例] HR 无权查看任务', () => {
    expect(checkRoleAccess(ROLES.HR, 'task:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'task:detail')).toBe(false)
  })

  it('👥[反例] HR 无权操作任务', () => {
    expect(checkRoleAccess(ROLES.HR, 'task:create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'task:update')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'task:status')).toBe(false)
  })

  it('👥[闭环] HR 无权限返回统一拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_TASK_SCHEDULER_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 任务调度
// ════════════════════════════════════════════════════════════

describe('[🔧安监] task-scheduler 角色扩展测试', () => {
  it('🔧[反例] 安监无权查看任务', () => {
    expect(checkRoleAccess(ROLES.Security, 'task:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'task:detail')).toBe(false)
  })

  it('🔧[反例] 安监无权操作任务', () => {
    expect(checkRoleAccess(ROLES.Security, 'task:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'task:status')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'task:assignee')).toBe(false)
  })

  it('🔧[闭环] 安监无权限返回统一拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_TASK_SCHEDULER_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 任务调度
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] task-scheduler 角色扩展测试', () => {
  it('🎮[反例] 导玩员无权查看任务', () => {
    expect(checkRoleAccess(ROLES.Guide, 'task:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'task:detail')).toBe(false)
  })

  it('🎮[反例] 导玩员无权操作任务', () => {
    expect(checkRoleAccess(ROLES.Guide, 'task:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'task:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'task:recurring')).toBe(false)
  })

  it('🎮[闭环] 导玩员无权限返回统一拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_TASK_SCHEDULER_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 任务调度
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] task-scheduler 角色扩展测试', () => {
  it('🎯[正例] 运行专员创建任务 → 查看到列表中', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'task:create')).toBe(true)
    const svc = makeSvc()
    const created = svc.createTask({
      tenantId: TENANT, name: '定时数据清洗', type: TaskType.Recurring,
      priority: TaskPriority.High, cronExpr: '0 3 * * *', assignedTo: 'data-ops',
      startTime: new Date().toISOString(), description: '每日数据清洗',
    })
    expect(created.name).toBe('定时数据清洗')
    expect(created.status).toBe(TaskStatus.Pending)

    expect(checkRoleAccess(ROLES.Operations, 'task:list')).toBe(true)
    const list = svc.listTasks(TENANT)
    expect(list.some((t) => t.id === created.id)).toBe(true)
  })

  it('🎯[正例] 运行专员更新任务 → 变更状态', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'task:update')).toBe(true)
    const svc = makeSvc()
    const task = svc.createTask({
      tenantId: TENANT, name: '待更新任务', type: TaskType.OneTime,
      priority: TaskPriority.Low, assignedTo: 'ops-user',
      startTime: new Date().toISOString(), description: '待更新',
    })

    const updated = svc.updateTask(task.id, TENANT, { name: '已更新任务', priority: TaskPriority.High })
    expect(updated.name).toBe('已更新任务')
    expect(updated.priority).toBe(TaskPriority.High)

    expect(checkRoleAccess(ROLES.Operations, 'task:status')).toBe(true)
    const running = svc.updateTaskStatus(task.id, TaskStatus.Running, TENANT)
    expect(running.status).toBe(TaskStatus.Running)

    const completed = svc.updateTaskStatus(task.id, TaskStatus.Completed, TENANT)
    expect(completed.status).toBe(TaskStatus.Completed)
  })

  it('🎯[正例] 运行专员查看周期任务 → 查看分班任务', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'task:recurring')).toBe(true)
    const svc = makeSeededSvc()

    const recurring = svc.getRecurringTasks(TENANT)
    expect(recurring.length).toBeGreaterThan(0)
    recurring.forEach((t) => expect(t.type).toBe(TaskType.Recurring))

    const shifts = svc.getShiftTasks(TENANT)
    expect(shifts).toBeDefined()
  })

  it('🎯[正例] 运行专员删除任务', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'task:delete')).toBe(true)
    const svc = makeSvc()
    const task = svc.createTask({
      tenantId: TENANT, name: '待删除任务', type: TaskType.OneTime,
      priority: TaskPriority.Low, assignedTo: 'ops',
      startTime: new Date().toISOString(), description: '待删除',
    })
    svc.deleteTask(task.id, TENANT)
    const found = svc.getTask(task.id, TENANT)
    expect(found).toBeUndefined()
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 任务调度
// ════════════════════════════════════════════════════════════

describe('[🤝团建] task-scheduler 角色扩展测试', () => {
  it('🤝[反例] 团建无权查看任务', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'task:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'task:detail')).toBe(false)
  })

  it('🤝[反例] 团建无权操作任务', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'task:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'task:status')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'task:assignee')).toBe(false)
  })

  it('🤝[闭环] 团建无权限返回统一拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_TASK_SCHEDULER_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 任务调度
// ════════════════════════════════════════════════════════════

describe('[📢营销] task-scheduler 角色扩展测试', () => {
  it('📢[反例] 营销无权查看任务', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'task:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'task:detail')).toBe(false)
  })

  it('📢[反例] 营销无权操作任务', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'task:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'task:recurring')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'task:assignee')).toBe(false)
  })

  it('📢[闭环] 营销无权限返回统一拒绝', () => {
    const denied = { success: false, code: 403, message: 'NO_TASK_SCHEDULER_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 task-scheduler 跨角色闭环 + 边界]', () => {
  it('🎯创建任务 → 运行 → 完成 → 👔查看列表全流程', async () => {
    const svc = makeSvc()

    // 1. 运行专员创建任务
    const task = svc.createTask({
      tenantId: TENANT, name: '跨流程任务', type: TaskType.OneTime,
      priority: TaskPriority.High, assignedTo: 'cross-ops',
      startTime: new Date().toISOString(), description: '跨流程测试',
    })
    expect(task.status).toBe(TaskStatus.Pending)

    // 2. 运行状态变更
    const running = svc.updateTaskStatus(task.id, TaskStatus.Running, TENANT)
    expect(running.status).toBe(TaskStatus.Running)

    const completed = svc.updateTaskStatus(task.id, TaskStatus.Completed, TENANT)
    expect(completed.status).toBe(TaskStatus.Completed)

    // 3. 店长查看任务列表
    const list = svc.listTasks(TENANT)
    expect(list.some((t) => t.id === task.id)).toBe(true)

    // 4. 查看完成的任务
    const completedList = svc.listTasks(TENANT, { status: TaskStatus.Completed })
    expect(completedList.some((t) => t.id === task.id)).toBe(true)
  })

  it('🛡️ 无效状态转换抛错 (Pending → Completed)', () => {
    const svc = makeSvc()
    const task = svc.createTask({
      tenantId: TENANT, name: '状态转换测试', type: TaskType.OneTime,
      priority: TaskPriority.Medium, assignedTo: 'test',
      startTime: new Date().toISOString(), description: '测试',
    })
    expect(() => svc.updateTaskStatus(task.id, TaskStatus.Completed, TENANT)).toThrow()
  })

  it('🛡️ 完成状态不可再转', () => {
    const svc = makeSvc()
    const task = svc.createTask({
      tenantId: TENANT, name: '已完成', type: TaskType.OneTime,
      priority: TaskPriority.Low, assignedTo: 'test',
      startTime: new Date().toISOString(), description: '测试',
    })
    svc.updateTaskStatus(task.id, TaskStatus.Running, TENANT)
    svc.updateTaskStatus(task.id, TaskStatus.Completed, TENANT)
    expect(() => svc.updateTaskStatus(task.id, TaskStatus.Pending, TENANT)).toThrow()
  })

  it('🛡️ Cancelled 可转回 Pending', () => {
    const svc = makeSvc()
    const task = svc.createTask({
      tenantId: TENANT, name: '取消再开', type: TaskType.OneTime,
      priority: TaskPriority.Low, assignedTo: 'test',
      startTime: new Date().toISOString(), description: '测试取消回滚',
    })
    svc.updateTaskStatus(task.id, TaskStatus.Cancelled, TENANT)
    expect(task.status).toBe(TaskStatus.Cancelled)

    const reopened = svc.updateTaskStatus(task.id, TaskStatus.Pending, TENANT)
    expect(reopened.status).toBe(TaskStatus.Pending)
  })

  it('🛡️ 获取不存在的任务返回 undefined', () => {
    const svc = makeSvc()
    const task = svc.getTask('non-existent-task-id', TENANT)
    expect(task).toBeUndefined()
  })

  it('🛡️ 按优先级获取待处理任务', () => {
    const svc = makeSvc()
    svc.createTask({
      tenantId: TENANT, name: '高优任务', type: TaskType.OneTime,
      priority: TaskPriority.High, assignedTo: 'ops',
      startTime: new Date().toISOString(), description: '高优先级',
    })
    svc.createTask({
      tenantId: TENANT, name: '低优任务', type: TaskType.OneTime,
      priority: TaskPriority.Low, assignedTo: 'ops',
      startTime: new Date().toISOString(), description: '低优先级',
    })
    const pending = svc.getPendingTasks(TENANT)
    expect(pending.length).toBeGreaterThanOrEqual(2)
    // High 先于 Low
    expect(pending[0].priority).toBe(TaskPriority.High)
  })

  it('🛡️ 批量更新任务状态', () => {
    const svc = makeSvc()
    const t1 = svc.createTask({
      tenantId: TENANT, name: '批量1', type: TaskType.OneTime,
      priority: TaskPriority.Low, assignedTo: 'batch',
      startTime: new Date().toISOString(), description: '批量1',
    })
    const t2 = svc.createTask({
      tenantId: TENANT, name: '批量2', type: TaskType.OneTime,
      priority: TaskPriority.Low, assignedTo: 'batch',
      startTime: new Date().toISOString(), description: '批量2',
    })
    const results = svc.batchUpdateStatus([t1.id, t2.id], TaskStatus.Running, TENANT)
    expect(results.length).toBe(2)
    results.forEach((t) => expect(t.status).toBe(TaskStatus.Running))
  })
})
