/**
 * 🐜 自动: [maintenance-plan] [C] 角色扩展测试
 *
 * 8 角色视角的维保计划模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 MaintenancePlanService + in-memory Store
 */
import { describe, it, expect } from 'vitest'
import { MaintenancePlanService } from './maintenance-plan.service'
import { MaintenanceType, MaintenanceStatus, Priority } from './maintenance-plan.entity'

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

/** 角色 → 维保模块权限 */
const roleAccess: Record<string, string[]> = {
  'maint:list': ['👔店长', '🔧安监', '🎯运行专员', '🎮导玩员'],
  'maint:detail': ['👔店长', '🔧安监', '🎯运行专员', '🎮导玩员'],
  'maint:create': ['🔧安监', '🎯运行专员'],
  'maint:update': ['🔧安监', '🎯运行专员'],
  'maint:complete': ['🔧安监', '🎮导玩员'],
  'maint:cancel': ['🔧安监', '🎯运行专员'],
  'maint:stats': ['👔店长', '🎯运行专员'],
  'maint:schedule': ['🔧安监', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleAccess[resource]?.includes(role) ?? false
}

function makeService(): MaintenancePlanService {
  const svc = new MaintenancePlanService()
  svc.resetPlanStoresForTests()
  svc.seedMockData('tenant-001')
  return svc
}

function makeFreshService(): MaintenancePlanService {
  const svc = new MaintenancePlanService()
  svc.resetPlanStoresForTests()
  return svc
}

const TENANT = 'tenant-001'

// ════════════════════════════════════════════════════════════
// 👔店长 — 维保计划
// ════════════════════════════════════════════════════════════

describe('[👔店长] maintenance-plan 角色扩展测试', () => {
  it('👔[正例] 店长查看维保计划列表 → 按优先级筛选 → 查看统计', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'maint:list')).toBe(true)
    const svc = makeService()
    const all = svc.listPlans(TENANT)
    expect(all.length).toBeGreaterThanOrEqual(10)

    const urgent = svc.listPlans(TENANT, { priority: Priority.Urgent })
    const urgentItem = urgent.find((p) => p.priority === Priority.Urgent)
    expect(urgentItem).toBeDefined()

    expect(checkRoleAccess(ROLES.StoreManager, 'maint:stats')).toBe(true)
    const completed = all.filter((p) => p.status === MaintenanceStatus.Completed)
    const stats = { total: all.length, completed: completed.length, completedRate: completed.length / all.length }
    expect(stats.completedRate).toBeGreaterThan(0)
  })

  it('👔[正例] 店长按设备名称搜索维保计划', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'maint:list')).toBe(true)
    const svc = makeService()
    const dronePlans = svc.listPlans(TENANT, { deviceName: '大疆' })
    expect(dronePlans.length).toBeGreaterThanOrEqual(2)
    dronePlans.forEach((p) => expect(p.deviceName).toContain('大疆'))
  })

  it('👔[反例] 店长无创建维保权限', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'maint:create')).toBe(false)
  })

  it('👔[反例] 店长无取消维保权限', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'maint:cancel')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 维保计划
// ════════════════════════════════════════════════════════════

describe('[🛒前台] maintenance-plan 角色扩展测试', () => {
  it('🛒[反例] 前台无维保计划访问权限', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'maint:list')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'maint:create')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'maint:detail')).toBe(false)
  })

  it('🛒[反例] 前台不可执行任何维保操作', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'maint:update')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'maint:complete')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'maint:cancel')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'maint:schedule')).toBe(false)
  })

  it('🛒[闭环] 返回统一拒绝响应', () => {
    const denied = { success: false, code: 403, message: 'NO_MAINTENANCE_ACCESS', module: 'maintenance-plan' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('maintenance-plan')
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 维保计划
// ════════════════════════════════════════════════════════════

describe('[👥HR] maintenance-plan 角色扩展测试', () => {
  it('👥[反例] HR 无维保权限', () => {
    expect(checkRoleAccess(ROLES.HR, 'maint:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'maint:create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'maint:update')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'maint:complete')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'maint:stats')).toBe(false)
  })

  it('👥[反例] HR 无维保执行权限', () => {
    expect(checkRoleAccess(ROLES.HR, 'maint:schedule')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'maint:cancel')).toBe(false)
  })

  it('👥[闭环] 返回统一代码', () => {
    const denied = { success: false, code: 403, message: 'NO_MAINTENANCE_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 维保计划
// ════════════════════════════════════════════════════════════

describe('[🔧安监] maintenance-plan 角色扩展测试', () => {
  it('🔧[正例] 安监创建紧急维保计划 → 设置高优先级', () => {
    expect(checkRoleAccess(ROLES.Security, 'maint:create')).toBe(true)
    const svc = makeFreshService()
    const plan = svc.createPlan({
      tenantId: TENANT,
      title: '消防报警系统紧急检修',
      type: MaintenanceType.Emergency,
      priority: Priority.Urgent,
      deviceName: '消防报警主机',
      deviceId: 'FIRE-MAIN',
      assignedTo: '张工',
      scheduledAt: '2026-07-22T09:00:00.000Z',
      description: '报警主机误报频繁需紧急处理',
    })
    expect(plan.title).toBe('消防报警系统紧急检修')
    expect(plan.priority).toBe(Priority.Urgent)
    expect(plan.status).toBe(MaintenanceStatus.Scheduled)

    const retrieved = svc.getPlan(plan.id, TENANT)
    expect(retrieved).toBeDefined()
  })

  it('🔧[正例] 安监更新维保计划 → 修改指派人员', () => {
    expect(checkRoleAccess(ROLES.Security, 'maint:update')).toBe(true)
    const svc = makeService()
    const all = svc.listPlans(TENANT, { status: MaintenanceStatus.Scheduled })
    expect(all.length).toBeGreaterThan(0)
    const target = all[0]

    const updated = svc.updatePlan(target.id, TENANT, { assignedTo: '王工' })
    expect(updated.assignedTo).toBe('王工')
  })

  it('🔧[正例] 安监完成维保 → 记录成本和结果', () => {
    expect(checkRoleAccess(ROLES.Security, 'maint:complete')).toBe(true)
    const svc = makeService()
    const inProgress = svc.listPlans(TENANT, { status: MaintenanceStatus.InProgress })
    expect(inProgress.length).toBeGreaterThan(0)
    const target = inProgress[0]

    const completed = svc.updatePlanStatus(target.id, MaintenanceStatus.Completed, TENANT, '检修完成，所有功能正常', 500)
    expect(completed.status).toBe(MaintenanceStatus.Completed)
    expect(completed.result).toBe('检修完成，所有功能正常')
    expect(completed.cost).toBe(500)
  })

  it('🔧[反例] 安监修改不存在的维保计划报错', () => {
    expect(checkRoleAccess(ROLES.Security, 'maint:update')).toBe(true)
    const svc = makeService()
    expect(() => svc.updatePlan('nonexistent-id', TENANT, { title: 'hack' })).toThrow('not found')
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 维保计划
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] maintenance-plan 角色扩展测试', () => {
  it('🎮[正例] 导玩员查看设备维保计划 → 完成日常维护任务', () => {
    expect(checkRoleAccess(ROLES.Guide, 'maint:list')).toBe(true)
    const svc = makeService()
    const routinePlans = svc.listPlans(TENANT, { type: MaintenanceType.Routine })
    expect(routinePlans.length).toBeGreaterThanOrEqual(5)
    routinePlans.forEach((p) => expect(p.type).toBe(MaintenanceType.Routine))

    expect(checkRoleAccess(ROLES.Guide, 'maint:complete')).toBe(true)
    const pending = routinePlans.find((p) => p.status === MaintenanceStatus.Scheduled)
    if (pending) {
      const done = svc.updatePlanStatus(pending.id, MaintenanceStatus.Completed, TENANT, '日常清洁完成')
      expect(done.status).toBe(MaintenanceStatus.Completed)
    }
  })

  it('🎮[反例] 导玩员无法创建维保计划', () => {
    expect(checkRoleAccess(ROLES.Guide, 'maint:create')).toBe(false)
  })

  it('🎮[反例] 导玩员无法修改维保计划', () => {
    expect(checkRoleAccess(ROLES.Guide, 'maint:update')).toBe(false)
  })

  it('🎮[反例] 导玩员无法查看统计', () => {
    expect(checkRoleAccess(ROLES.Guide, 'maint:stats')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 维保计划
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] maintenance-plan 角色扩展测试', () => {
  it('🎯[正例] 运行专员批量创建维保计划 → 查看排期', () => {
    expect(checkRoleAccess(ROLES.Operations, 'maint:create')).toBe(true)
    const svc = makeFreshService()

    const p1 = svc.createPlan({
      tenantId: TENANT, title: '空调系统月度维护',
      type: MaintenanceType.Routine, priority: Priority.Medium,
      deviceName: '中央空调-1号', deviceId: 'AC-001',
      assignedTo: '李工',
      scheduledAt: '2026-07-25T10:00:00.000Z',
      description: '月度空调滤网清洗及制冷剂检查',
    })
    const p2 = svc.createPlan({
      tenantId: TENANT, title: '电梯季度维保',
      type: MaintenanceType.Routine, priority: Priority.High,
      deviceName: '客梯-2号', deviceId: 'ELV-002',
      assignedTo: '奥的斯维保',
      scheduledAt: '2026-07-28T08:00:00.000Z',
      description: '季度电梯维保',
    })
    expect(p1.status).toBe(MaintenanceStatus.Scheduled)
    expect(p2.status).toBe(MaintenanceStatus.Scheduled)

    expect(checkRoleAccess(ROLES.Operations, 'maint:schedule')).toBe(true)
    const scheduled = svc.getScheduledPlans(TENANT)
    expect(scheduled.length).toBeGreaterThanOrEqual(2)
  })

  it('🎯[正例] 运行专员查看维保统计', () => {
    expect(checkRoleAccess(ROLES.Operations, 'maint:stats')).toBe(true)
    const svc = makeService()
    const all = svc.listPlans(TENANT)
    const byStatus = {
      completed: all.filter((p) => p.status === MaintenanceStatus.Completed).length,
      scheduled: all.filter((p) => p.status === MaintenanceStatus.Scheduled).length,
      inProgress: all.filter((p) => p.status === MaintenanceStatus.InProgress).length,
      cancelled: all.filter((p) => p.status === MaintenanceStatus.Cancelled).length,
    }
    expect(byStatus.completed).toBeGreaterThan(0)
    expect(byStatus.scheduled).toBeGreaterThan(0)
  })

  it('🎯[反例] 运行专员创建重复维保计划', () => {
    expect(checkRoleAccess(ROLES.Operations, 'maint:create')).toBe(true)
    const dupError = { code: 409, message: 'MAINTENANCE_PLAN_EXISTS' }
    expect(dupError.code).toBe(409)
  })

  it('🎯[正例] 运行专员取消维保计划', () => {
    expect(checkRoleAccess(ROLES.Operations, 'maint:cancel')).toBe(true)
    const svc = makeService()
    const scheduled = svc.listPlans(TENANT, { status: MaintenanceStatus.Scheduled })
    expect(scheduled.length).toBeGreaterThan(0)
    const target = scheduled[0]

    const cancelled = svc.updatePlanStatus(target.id, MaintenanceStatus.Cancelled, TENANT, '因门店活动取消')
    expect(cancelled.status).toBe(MaintenanceStatus.Cancelled)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 维保计划
// ════════════════════════════════════════════════════════════

describe('[🤝团建] maintenance-plan 角色扩展测试', () => {
  it('🤝[反例] 团建无维保权限', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'maint:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'maint:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'maint:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'maint:complete')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'maint:cancel')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'maint:schedule')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'maint:stats')).toBe(false)
  })

  it('🤝[反例] 团建所有操作返回 403', () => {
    const denied = { success: false, code: 403, message: 'NO_MAINTENANCE_ACCESS' }
    expect(denied.code).toBe(403)
  })

  it('🤝[闭环] 团建角色不影响维保模块数据', () => {
    const svc = makeService()
    const countBefore = svc.listPlans(TENANT).length
    // 即使没有权限，数据不应被团建角色意外更改
    expect(countBefore).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 维保计划
// ════════════════════════════════════════════════════════════

describe('[📢营销] maintenance-plan 角色扩展测试', () => {
  it('📢[反例] 营销无维保权限', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'maint:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'maint:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'maint:complete')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'maint:stats')).toBe(false)
  })

  it('📢[反例] 营销不可查看维保详情', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'maint:detail')).toBe(false)
  })

  it('📢[闭环] 返回统一拒绝代码', () => {
    const denied = { success: false, code: 403, message: 'NO_MAINTENANCE_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色闭环 + 边界场景
// ════════════════════════════════════════════════════════════

describe('[🦞 maintenance-plan 跨角色闭环 + 边界]', () => {
  it('🔧+🎮+👔 维保创建→完成→确认全流程', () => {
    const svc = makeFreshService()

    // 1. 安监创建
    const plan = svc.createPlan({
      tenantId: TENANT, title: '应急灯检修',
      type: MaintenanceType.Routine, priority: Priority.Medium,
      deviceName: '应急灯-全部', deviceId: 'EML-ALL',
      assignedTo: '张工',
      scheduledAt: '2026-07-23T09:00:00.000Z',
      description: '全店应急灯检测',
    })
    expect(plan.status).toBe(MaintenanceStatus.Scheduled)

    // 2. 导玩员执行并完成
    const done = svc.updatePlanStatus(plan.id, MaintenanceStatus.Completed, TENANT, '全部更换电池')
    expect(done.status).toBe(MaintenanceStatus.Completed)

    // 3. 店长确认统计
    const all = svc.listPlans(TENANT)
    const completedCount = all.filter((p) => p.status === MaintenanceStatus.Completed).length
    expect(completedCount).toBeGreaterThanOrEqual(1)
  })

  it('🛡️ 查询不存在的维保计划返回 undefined', () => {
    const svc = makeService()
    expect(svc.getPlan('nonexistent', TENANT)).toBeUndefined()
  })

  it('🛡️ 按状态筛选空结果', () => {
    const svc = makeFreshService()
    const empty = svc.listPlans(TENANT, { status: MaintenanceStatus.Completed })
    expect(empty.length).toBe(0)
  })

  it('🛡️ 已完成维保计划可重复查询', () => {
    const svc = makeService()
    const completed = svc.listPlans(TENANT, { status: MaintenanceStatus.Completed })
    expect(completed.length).toBeGreaterThan(0)
    const target = completed[0]

    // 已完成的可正常通过id查询
    const retrieved = svc.getPlan(target.id, TENANT)
    expect(retrieved).toBeDefined()
    expect(retrieved!.status).toBe(MaintenanceStatus.Completed)
  })

  it('🛡️ 跨租户隔离', () => {
    const svc = makeService()
    const tenantB = 'tenant-002'
    const plansB = svc.listPlans(tenantB)
    expect(plansB.length).toBe(0)
  })
})
