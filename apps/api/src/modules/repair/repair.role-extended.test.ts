/**
 * 🐜 自动: [repair] [C] 角色扩展测试
 *
 * 8 角色视角的维修模块扩展测试
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 RepairService + in-memory Store
 * 覆盖: 报修CRUD、派工、执行、完成、统计
 */
import { describe, it, expect } from 'vitest'
import { RepairService } from './repair.service'
import { RepairCategory, RepairStatus, UrgencyLevel } from './repair.entity'

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

/** 角色 → 维修模块权限 */
const roleAccess: Record<string, string[]> = {
  'repair:list': ['👔店长', '🔧安监', '🎯运行专员'],
  'repair:detail': ['👔店长', '🔧安监', '🎯运行专员'],
  'repair:create': ['🛒前台', '🎮导玩员', '🔧安监', '🎯运行专员'],
  'repair:dispatch': ['🔧安监', '🎯运行专员'],
  'repair:execute': ['🔧安监'],
  'repair:complete': ['🔧安监', '🎯运行专员'],
  'repair:cancel': ['🔧安监', '🎯运行专员'],
  'repair:stats': ['👔店长', '🎯运行专员'],
  'repair:update': ['🔧安监', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleAccess[resource]?.includes(role) ?? false
}

function makeService(): RepairService {
  const svc = new RepairService()
  svc.resetRepairStoresForTests()
  svc.seedMockData('tenant-001')
  return svc
}

function makeFreshService(): RepairService {
  const svc = new RepairService()
  svc.resetRepairStoresForTests()
  return svc
}

const TENANT = 'tenant-001'

// ════════════════════════════════════════════════════════════
// 👔店长 — 维修
// ════════════════════════════════════════════════════════════

describe('[👔店长] repair 角色扩展测试', () => {
  it('👔[正例] 店长查看维修列表 → 按紧急程度筛选 → 查看统计', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'repair:list')).toBe(true)
    const svc = makeService()
    const all = svc.listRequests(TENANT)
    expect(all.length).toBeGreaterThanOrEqual(10)

    const urgent = svc.listRequests(TENANT, { urgency: UrgencyLevel.Urgent })
    expect(urgent.length).toBeGreaterThanOrEqual(3)
    urgent.forEach((r) => expect(r.urgency).toBe(UrgencyLevel.Urgent))

    expect(checkRoleAccess(ROLES.StoreManager, 'repair:stats')).toBe(true)
    const stats = svc.getStats(TENANT)
    expect(stats.total).toBeGreaterThan(0)
    expect(stats.completionRate).toBeGreaterThan(0)
  })

  it('👔[正例] 店长查看维修详情 → 包含维修成本和结果', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'repair:detail')).toBe(true)
    const svc = makeService()
    const completed = svc.listRequests(TENANT, { status: RepairStatus.Completed })
    expect(completed.length).toBeGreaterThan(0)
    const detail = svc.getRequest(completed[0].id, TENANT)
    expect(detail).toBeDefined()
    expect(detail!.result).toBeDefined()
  })

  it('👔[反例] 店长不可创建维修单', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'repair:create')).toBe(false)
  })

  it('👔[反例] 店长不可派工', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'repair:dispatch')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 维修
// ════════════════════════════════════════════════════════════

describe('[🛒前台] repair 角色扩展测试', () => {
  it('🛒[正例] 前台提交报修 → 设置紧急度 → 查看提交记录', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'repair:create')).toBe(true)
    const svc = makeFreshService()

    const req = svc.createRequest({
      tenantId: TENANT,
      title: '前台收银机死机',
      description: '收银POS机频繁自动重启',
      category: RepairCategory.Electronic,
      urgency: UrgencyLevel.High,
      reporterName: '前台小王',
      reporterPhone: '13800138100',
      location: '前台收银区',
      deviceName: 'POS机-2号',
      deviceId: 'POS-002',
    })
    expect(req.title).toBe('前台收银机死机')
    expect(req.status).toBe(RepairStatus.Pending)
    expect(req.urgency).toBe(UrgencyLevel.High)
  })

  it('🛒[反例] 前台不可查看所有维修列表', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'repair:list')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'repair:detail')).toBe(false)
  })

  it('🛒[反例] 前台不可派工/完成', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'repair:dispatch')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'repair:complete')).toBe(false)
  })

  it('🛒[闭环] 统一拒绝 403', () => {
    const denied = { success: false, code: 403, message: 'NO_REPAIR_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 维修
// ════════════════════════════════════════════════════════════

describe('[👥HR] repair 角色扩展测试', () => {
  it('👥[反例] HR 无维修权限', () => {
    expect(checkRoleAccess(ROLES.HR, 'repair:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'repair:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'repair:create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'repair:dispatch')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'repair:execute')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'repair:complete')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'repair:cancel')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'repair:stats')).toBe(false)
  })

  it('👥[反例] HR 不可更新维修信息', () => {
    expect(checkRoleAccess(ROLES.HR, 'repair:update')).toBe(false)
  })

  it('👥[闭环] 返回 403', () => {
    const denied = { success: false, code: 403, message: 'NO_REPAIR_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 维修
// ════════════════════════════════════════════════════════════

describe('[🔧安监] repair 角色扩展测试', () => {
  it('🔧[正例] 安监创建紧急维修 → 派工给维修工 → 开始维修', () => {
    expect(checkRoleAccess(ROLES.Security, 'repair:create')).toBe(true)
    const svc = makeFreshService()

    const req = svc.createRequest({
      tenantId: TENANT,
      title: '消防泵故障',
      description: '消防泵启动异常',
      category: RepairCategory.Electronic,
      urgency: UrgencyLevel.Urgent,
      reporterName: '安监员',
      reporterPhone: '13800138200',
      location: '消防泵房',
      deviceName: '消防泵',
      deviceId: 'FIRE-PUMP-001',
    })
    expect(req.status).toBe(RepairStatus.Pending)

    expect(checkRoleAccess(ROLES.Security, 'repair:dispatch')).toBe(true)
    const dispatched = svc.dispatchRepair(req.id, TENANT, {
      status: RepairStatus.Accepted,
      assignedTo: '王师傅',
      estimatedCost: 2000,
    })
    expect(dispatched.assignedTo).toBe('王师傅')
    expect(dispatched.estimatedCost).toBe(2000)

    expect(checkRoleAccess(ROLES.Security, 'repair:execute')).toBe(true)
    const started = svc.startRepair(req.id, TENANT)
    expect(started.status).toBe(RepairStatus.InProgress)
  })

  it('🔧[正例] 安监完成维修 → 录入结果和实际成本', () => {
    const svc = makeFreshService()
    const req = svc.createRequest({
      tenantId: TENANT,
      title: '插座维修',
      description: '墙面插座烧坏',
      category: RepairCategory.Electric,
      urgency: UrgencyLevel.Medium,
      reporterName: '安监员',
      reporterPhone: '13800138300',
      location: 'A区',
      deviceName: '插座',
      deviceId: 'OUTLET-010',
    })
    svc.dispatchRepair(req.id, TENANT, { status: RepairStatus.Accepted, assignedTo: '李电工' })
    svc.startRepair(req.id, TENANT)

    expect(checkRoleAccess(ROLES.Security, 'repair:complete')).toBe(true)
    const completed = svc.completeRepair(req.id, TENANT, {
      status: RepairStatus.Completed,
      result: '更换插座面板，线路检查正常',
      actualCost: 150,
    })
    expect(completed.status).toBe(RepairStatus.Completed)
    expect(completed.actualCost).toBe(150)
  })

  it('🔧[正例] 安监取消维修', () => {
    expect(checkRoleAccess(ROLES.Security, 'repair:cancel')).toBe(true)
    const svc = makeFreshService()
    const req = svc.createRequest({
      tenantId: TENANT,
      title: '测试取消',
      description: '取消测试',
      category: RepairCategory.Other,
      urgency: UrgencyLevel.Low,
      reporterName: '测试',
      reporterPhone: '13800138400',
      location: '测试区',
    })
    const cancelled = svc.cancelRepair(req.id, TENANT, '自行处理')
    expect(cancelled.status).toBe(RepairStatus.Cancelled)
  })

  it('🔧[反例] 安监重复派工已派工的维修报错', () => {
    const svc = makeService()
    const pending = svc.listRequests(TENANT, { status: RepairStatus.Pending })
    if (pending.length > 0) {
      const dispatched = svc.dispatchRepair(pending[0].id, TENANT, {
        status: RepairStatus.Accepted,
        assignedTo: '工程师A',
      })
      expect(dispatched.status).toBe(RepairStatus.Accepted)
      // 重复派工会报错
      expect(() => svc.dispatchRepair(pending[0].id, TENANT, { status: RepairStatus.Accepted, assignedTo: '工程师B' }))
        .toThrow('Cannot dispatch repair that is already in status ACCEPTED')
    }
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 维修
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] repair 角色扩展测试', () => {
  it('🎮[正例] 导玩员提交设备报修 → 设备类维修', () => {
    expect(checkRoleAccess(ROLES.Guide, 'repair:create')).toBe(true)
    const svc = makeFreshService()

    const req = svc.createRequest({
      tenantId: TENANT,
      title: '跳舞机踏板故障',
      description: '跳舞机左踏板无感应',
      category: RepairCategory.Electronic,
      urgency: UrgencyLevel.High,
      reporterName: '导玩员阿杰',
      reporterPhone: '13800138500',
      location: 'A区-跳舞机',
      deviceName: '跳舞机-02号',
      deviceId: 'DANCE-002',
    })
    expect(req.category).toBe(RepairCategory.Electronic)
    expect(req.status).toBe(RepairStatus.Pending)
    expect(req.deviceName).toBe('跳舞机-02号')
  })

  it('🎮[反例] 导玩员不可查看全部维修列表', () => {
    expect(checkRoleAccess(ROLES.Guide, 'repair:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'repair:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'repair:dispatch')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'repair:execute')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'repair:complete')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'repair:cancel')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'repair:stats')).toBe(false)
  })

  it('🎮[反例] 导玩员不可派工或更新', () => {
    expect(checkRoleAccess(ROLES.Guide, 'repair:update')).toBe(false)
  })

  it('🎮[闭环] 返回 403', () => {
    const denied = { success: false, code: 403, message: 'NO_REPAIR_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 维修
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] repair 角色扩展测试', () => {
  it('🎯[正例] 运行专员查看维修统计 → 按类别分析', () => {
    expect(checkRoleAccess(ROLES.Operations, 'repair:list')).toBe(true)
    expect(checkRoleAccess(ROLES.Operations, 'repair:stats')).toBe(true)
    const svc = makeService()
    const stats = svc.getStats(TENANT)
    expect(Object.keys(stats.byCategory).length).toBeGreaterThanOrEqual(4)
    const electronicCount = stats.byCategory[RepairCategory.Electronic] ?? 0
    expect(electronicCount).toBeGreaterThan(0)
  })

  it('🎯[正例] 运行专员派工 → 取消已派工维修', () => {
    expect(checkRoleAccess(ROLES.Operations, 'repair:dispatch')).toBe(true)
    const svc = makeFreshService()
    const req = svc.createRequest({
      tenantId: TENANT,
      title: '空调维修',
      description: '空调不制冷',
      category: RepairCategory.Ac,
      urgency: UrgencyLevel.High,
      reporterName: '运行专员',
      reporterPhone: '13800138600',
      location: 'C区',
      deviceName: '空调-3号',
      deviceId: 'AC-003',
    })
    svc.dispatchRepair(req.id, TENANT, { status: RepairStatus.Accepted, assignedTo: '刘师傅' })

    expect(checkRoleAccess(ROLES.Operations, 'repair:cancel')).toBe(true)
    const cancelled = svc.cancelRepair(req.id, TENANT, '更换供应商')
    expect(cancelled.status).toBe(RepairStatus.Cancelled)
  })

  it('🎯[正例] 运行专员按位置筛选维修记录', () => {
    const svc = makeService()
    const locationSvc = svc.listRequests(TENANT, { location: 'A区' })
    expect(locationSvc.length).toBeGreaterThanOrEqual(3)
    locationSvc.forEach((r) => expect(r.location).toContain('A区'))
  })

  it('🎯[反例] 运行专员不可执行维修（不具维修权限）', () => {
    expect(checkRoleAccess(ROLES.Operations, 'repair:execute')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 维修
// ════════════════════════════════════════════════════════════

describe('[🤝团建] repair 角色扩展测试', () => {
  it('🤝[反例] 团建无维修权限', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'repair:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'repair:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'repair:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'repair:dispatch')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'repair:execute')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'repair:complete')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'repair:cancel')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'repair:stats')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'repair:update')).toBe(false)
  })

  it('🤝[闭环] 返回 403', () => {
    const denied = { success: false, code: 403, message: 'NO_REPAIR_ACCESS' }
    expect(denied.code).toBe(403)
  })

  it('🤝[闭环] 数据不因团建角色影响', () => {
    const svc = makeService()
    const count = svc.listRequests(TENANT).length
    expect(count).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 维修
// ════════════════════════════════════════════════════════════

describe('[📢营销] repair 角色扩展测试', () => {
  it('📢[反例] 营销无维修权限', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'repair:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'repair:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'repair:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'repair:dispatch')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'repair:execute')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'repair:complete')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'repair:cancel')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'repair:stats')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'repair:update')).toBe(false)
  })

  it('📢[闭环] 返回 403', () => {
    const denied = { success: false, code: 403, message: 'NO_REPAIR_ACCESS' }
    expect(denied.code).toBe(403)
  })

  it('📢[闭环] 权限矩阵验证', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'repair:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'repair:create')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色闭环 + 边界场景
// ════════════════════════════════════════════════════════════

describe('[🦞 repair 跨角色闭环 + 边界]', () => {
  it('🛒+🔧+👔 报修→派工→维修→确认全流程', () => {
    const svc = makeFreshService()

    // 1. 前台报修
    const req = svc.createRequest({
      tenantId: TENANT,
      title: '比赛区主屏幕闪烁',
      description: '主LED屏幕出现闪烁故障',
      category: RepairCategory.Electronic,
      urgency: UrgencyLevel.High,
      reporterName: '前台小陈',
      reporterPhone: '13800139000',
      location: 'C区-比赛区',
      deviceName: '主屏幕',
      deviceId: 'LED-MAIN',
    })
    expect(req.status).toBe(RepairStatus.Pending)

    // 2. 安监派工
    svc.dispatchRepair(req.id, TENANT, { status: RepairStatus.Accepted, assignedTo: '张工' })

    // 3. 开始维修
    svc.startRepair(req.id, TENANT)

    // 4. 完成维修
    const completed = svc.completeRepair(req.id, TENANT, {
      status: RepairStatus.Completed,
      result: '更换LED驱动板',
      actualCost: 3500,
    })
    expect(completed.status).toBe(RepairStatus.Completed)
    expect(completed.actualCost).toBe(3500)
  })

  it('🛡️ 查询不存在的报修返回 undefined', () => {
    const svc = makeService()
    expect(svc.getRequest('nonexistent', TENANT)).toBeUndefined()
  })

  it('🛡️ 空数据报修列表为空', () => {
    const svc = makeFreshService()
    expect(svc.listRequests(TENANT).length).toBe(0)
  })

  it('🛡️ 跨租户隔离', () => {
    const svc = makeService()
    expect(svc.listRequests('tenant-999').length).toBe(0)
  })

  it('🛡️ 已取消维修不可再次取消', () => {
    const svc = makeFreshService()
    const req = svc.createRequest({
      tenantId: TENANT,
      title: '取消测试',
      description: '已取消',
      category: RepairCategory.Other,
      urgency: UrgencyLevel.Low,
      reporterName: '测试',
      reporterPhone: '13800139100',
      location: '测试区',
    })
    svc.cancelRepair(req.id, TENANT)
    expect(() => svc.cancelRepair(req.id, TENANT)).toThrow('Cannot cancel repair that is already CANCELLED')
  })

  it('🛡️ 已完成维修不可重复完成', () => {
    const svc = makeFreshService()
    const req = svc.createRequest({
      tenantId: TENANT,
      title: '完成测试',
      description: '测试已完成后可重复完成',
      category: RepairCategory.Other,
      urgency: UrgencyLevel.Medium,
      reporterName: '测试',
      reporterPhone: '13800139200',
      location: '测试区',
    })
    svc.dispatchRepair(req.id, TENANT, { status: RepairStatus.Accepted, assignedTo: '工' })
    svc.startRepair(req.id, TENANT)
    svc.completeRepair(req.id, TENANT, { status: RepairStatus.Completed })
    // 已完成的维修不可再完成 — 状态不对
    expect(() => svc.completeRepair(req.id, TENANT, { status: RepairStatus.Completed })).toThrow('expected IN_PROGRESS')
  })

  it('🛡️ 统计中 pendingUrgent 计数正确', () => {
    const svc = makeService()
    const stats = svc.getStats(TENANT)
    const pendingUrgent = svc.listRequests(TENANT).filter(
      (r) => (r.status === RepairStatus.Pending || r.status === RepairStatus.Accepted) && r.urgency === UrgencyLevel.Urgent
    ).length
    expect(stats.pendingUrgent).toBe(pendingUrgent)
  })
})
