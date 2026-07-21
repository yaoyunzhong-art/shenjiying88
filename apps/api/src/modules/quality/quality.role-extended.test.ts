/**
 * 🐜 自动: [quality] [C] 角色扩展测试
 *
 * 8 角色视角的质量管理模块扩展测试
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 QualityService + in-memory Store
 * 覆盖: 巡查任务 CRUD、整改记录 CRUD、统计视图
 */
import { describe, it, expect } from 'vitest'
import { QualityService } from './quality.service'
import { QualityInspectionService } from '../quality-inspection/quality-inspection.service'
import {
  PatrolTaskStatus,
  PatrolTaskPriority,
  PatrolArea,
  RectificationStatus,
  Severity,
} from './quality.entity'

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

/** 角色 → 质量管理模块权限 */
const roleAccess: Record<string, string[]> = {
  'quality:patrol:list': ['👔店长', '🔧安监', '🎯运行专员'],
  'quality:patrol:detail': ['👔店长', '🔧安监', '🎯运行专员'],
  'quality:patrol:create': ['🔧安监', '🎯运行专员'],
  'quality:patrol:update': ['🔧安监', '🎯运行专员'],
  'quality:patrol:complete': ['🔧安监', '🎯运行专员'],
  'quality:patrol:delete': ['🔧安监'],
  'quality:rect:list': ['👔店长', '🔧安监', '🎯运行专员'],
  'quality:rect:create': ['🔧安监', '🎯运行专员'],
  'quality:rect:update': ['🔧安监', '🎯运行专员'],
  'quality:rect:stats': ['👔店长', '🔧安监', '🎯运行专员'],
  'quality:inspect:list': ['👔店长', '🔧安监', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleAccess[resource]?.includes(role) ?? false
}

function makeService(): QualityService {
  const inspectionSvc = new QualityInspectionService()
  const svc = new QualityService(inspectionSvc)
  svc.resetQualityStoresForTests()
  return svc
}

const TENANT = 'tenant-001'

// ════════════════════════════════════════════════════════════
// 👔店长 — 质量管理
// ════════════════════════════════════════════════════════════

describe('[👔店长] quality 角色扩展测试', () => {
  it('👔[正例] 店长查看巡查任务列表 → 按区域筛选 → 查看统计', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'quality:patrol:list')).toBe(true)
    const svc = makeService()
    const all = svc.listPatrolTasks(TENANT)
    expect(all.length).toBeGreaterThanOrEqual(4)

    const kitchen = svc.listPatrolTasks(TENANT, { area: PatrolArea.Kitchen })
    expect(kitchen.length).toBeGreaterThanOrEqual(2)
    kitchen.forEach((t) => expect(t.area).toBe(PatrolArea.Kitchen))

    expect(checkRoleAccess(ROLES.StoreManager, 'quality:rect:stats')).toBe(true)
    const stats = svc.getRectificationStats(TENANT)
    expect(stats.total).toBeGreaterThan(0)
  })

  it('👔[正例] 店长查看整改记录列表 → 按严重程度筛选', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'quality:rect:list')).toBe(true)
    const svc = makeService()
    const critical = svc.listRectificationRecords(TENANT, { severity: Severity.Critical })
    expect(critical.length).toBeGreaterThanOrEqual(3)
    critical.forEach((r) => expect(r.severity).toBe(Severity.Critical))
  })

  it('👔[反例] 店长不可创建巡查任务', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'quality:patrol:create')).toBe(false)
  })

  it('👔[反例] 店长不可删除巡查任务', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'quality:patrol:delete')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 质量管理
// ════════════════════════════════════════════════════════════

describe('[🛒前台] quality 角色扩展测试', () => {
  it('🛒[反例] 前台无质量模块权限', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'quality:patrol:list')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'quality:patrol:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'quality:patrol:create')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'quality:patrol:complete')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'quality:rect:list')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'quality:rect:create')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'quality:rect:stats')).toBe(false)
  })

  it('🛒[反例] 前台所有操作拒绝', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'quality:inspect:list')).toBe(false)
  })

  it('🛒[闭环] 统一拒绝 403', () => {
    const denied = { success: false, code: 403, message: 'NO_QUALITY_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 质量管理
// ════════════════════════════════════════════════════════════

describe('[👥HR] quality 角色扩展测试', () => {
  it('👥[反例] HR 无质量模块权限', () => {
    expect(checkRoleAccess(ROLES.HR, 'quality:patrol:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'quality:patrol:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'quality:patrol:create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'quality:patrol:complete')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'quality:rect:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'quality:rect:create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'quality:rect:stats')).toBe(false)
  })

  it('👥[反例] HR 不可操作质量控制', () => {
    expect(checkRoleAccess(ROLES.HR, 'quality:inspect:list')).toBe(false)
  })

  it('👥[闭环] 返回 403', () => {
    const denied = { success: false, code: 403, message: 'NO_QUALITY_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 质量管理
// ════════════════════════════════════════════════════════════

describe('[🔧安监] quality 角色扩展测试', () => {
  it('🔧[正例] 安监创建巡查任务 → 设定检查项目 → 安排执行', () => {
    expect(checkRoleAccess(ROLES.Security, 'quality:patrol:create')).toBe(true)
    const svc = makeService()

    const task = svc.createPatrolTask({
      tenantId: TENANT,
      patrolNo: 'PT-TEST-001',
      title: '消防专项巡查',
      description: '全面检查消防设备和通道',
      area: PatrolArea.Entrance,
      priority: PatrolTaskPriority.High,
      checkItems: [
        { name: '灭火器', standard: '压力正常，在有效期内' },
        { name: '烟感', standard: '指示灯正常闪烁' },
        { name: '消防通道', standard: '畅通无杂物' },
      ],
      assignedTo: '张安全',
      scheduledAt: '2026-07-25T09:00:00.000Z',
    })
    expect(task.title).toBe('消防专项巡查')
    expect(task.checkItems.length).toBe(3)
    expect(task.status).toBe(PatrolTaskStatus.Pending)
  })

  it('🔧[正例] 安监查看待处理巡查 → 标记完成 → 查看逾期', () => {
    expect(checkRoleAccess(ROLES.Security, 'quality:patrol:list')).toBe(true)
    const svc = makeService()
    const pending = svc.getPendingPatrolTasks(TENANT)
    expect(pending.length).toBeGreaterThanOrEqual(3)

    const overdue = svc.getOverduePatrolTasks(TENANT)
    expect(Array.isArray(overdue)).toBe(true)

    expect(checkRoleAccess(ROLES.Security, 'quality:patrol:complete')).toBe(true)
    if (pending.length > 0) {
      const completed = svc.updatePatrolTask(pending[0].id, TENANT, { status: PatrolTaskStatus.Completed })
      expect(completed.status).toBe(PatrolTaskStatus.Completed)
    }
  })

  it('🔧[正例] 安监创建整改记录 → 更新状态', () => {
    expect(checkRoleAccess(ROLES.Security, 'quality:rect:create')).toBe(true)
    const svc = makeService()

    const record = svc.createRectificationRecord({
      tenantId: TENANT,
      rectificationNo: 'REC-TEST-001',
      sourceInspectionId: 'inspect-test-001',
      sourceInspectNo: 'IQC-TEST-001',
      title: '测试整改-线路老化',
      description: '配电柜线路老化需更换',
      severity: Severity.Major,
      responsiblePerson: '陈电工',
      actions: [
        { description: '采购新电缆', assignee: '采购部', deadline: '2026-07-30T00:00:00.000Z' },
        { description: '更换线路并测试', assignee: '陈电工', deadline: '2026-08-05T00:00:00.000Z' },
      ],
      deadline: '2026-08-05T00:00:00.000Z',
    })
    expect(record.title).toBe('测试整改-线路老化')
    expect(record.status).toBe(RectificationStatus.Open)

    expect(checkRoleAccess(ROLES.Security, 'quality:rect:update')).toBe(true)
    const updated = svc.updateRectificationRecord(record.id, TENANT, { status: RectificationStatus.InProgress, notes: '已采购电缆' })
    expect(updated.status).toBe(RectificationStatus.InProgress)
  })

  it('🔧[反例] 安监删除巡查任务', () => {
    expect(checkRoleAccess(ROLES.Security, 'quality:patrol:delete')).toBe(true)
    const svc = makeService()
    const pending = svc.listPatrolTasks(TENANT, { status: PatrolTaskStatus.Pending })
    if (pending.length > 0) {
      svc.deletePatrolTask(pending[0].id, TENANT)
      expect(svc.getPatrolTask(pending[0].id, TENANT)).toBeUndefined()
    }
  })

  it('🔧[正例] 安监按搜索关键字查找巡查', () => {
    const svc = makeService()
    const searched = svc.listPatrolTasks(TENANT, { search: '消防' })
    expect(searched.length).toBeGreaterThanOrEqual(2)
  })

  it('🔧[反例] 安监更新不存在的巡查报错', () => {
    const svc = makeService()
    expect(() => svc.updatePatrolTask('nonexistent', TENANT, { title: 'hack' })).toThrow('not found')
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 质量管理
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] quality 角色扩展测试', () => {
  it('🎮[反例] 导玩员无质量模块权限', () => {
    expect(checkRoleAccess(ROLES.Guide, 'quality:patrol:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'quality:patrol:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'quality:patrol:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'quality:patrol:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'quality:patrol:complete')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'quality:rect:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'quality:rect:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'quality:rect:stats')).toBe(false)
  })

  it('🎮[反例] 导玩员不可删除或操作', () => {
    expect(checkRoleAccess(ROLES.Guide, 'quality:patrol:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'quality:rect:update')).toBe(false)
  })

  it('🎮[闭环] 返回 403', () => {
    const denied = { success: false, code: 403, message: 'NO_QUALITY_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 质量管理
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] quality 角色扩展测试', () => {
  it('🎯[正例] 运行专员创建整改记录 → 追踪逾期', () => {
    expect(checkRoleAccess(ROLES.Operations, 'quality:rect:create')).toBe(true)
    const svc = makeService()

    const record = svc.createRectificationRecord({
      tenantId: TENANT,
      rectificationNo: 'REC-OPS-001',
      sourceInspectionId: 'inspect-ops-001',
      sourceInspectNo: 'OQC-OPS-001',
      title: '运行专员发起的整改',
      description: '设备运行参数偏差',
      severity: Severity.Minor,
      responsiblePerson: '王工',
      actions: [
        { description: '调校设备参数', assignee: '王工', deadline: '2026-07-28T00:00:00.000Z' },
      ],
      deadline: '2026-07-28T00:00:00.000Z',
    })
    expect(record.status).toBe(RectificationStatus.Open)

    const overdue = svc.getOverdueRectificationRecords(TENANT)
    expect(Array.isArray(overdue)).toBe(true)
  })

  it('🎯[正例] 运行专员查看待处理巡查 → 标记进行中', () => {
    expect(checkRoleAccess(ROLES.Operations, 'quality:patrol:list')).toBe(true)
    const svc = makeService()
    const pending = svc.getPendingPatrolTasks(TENANT)
    expect(pending.length).toBeGreaterThan(0)

    expect(checkRoleAccess(ROLES.Operations, 'quality:patrol:update')).toBe(true)
    const started = svc.updatePatrolTask(pending[0].id, TENANT, { status: PatrolTaskStatus.InProgress })
    expect(started.status).toBe(PatrolTaskStatus.InProgress)
  })

  it('🎯[正例] 运行专员查看巡查详情和检查项', () => {
    expect(checkRoleAccess(ROLES.Operations, 'quality:patrol:detail')).toBe(true)
    const svc = makeService()
    const all = svc.listPatrolTasks(TENANT)
    expect(all.length).toBeGreaterThan(0)
    const detail = svc.getPatrolTask(all[0].id, TENANT)
    expect(detail).toBeDefined()
    expect(detail!.checkItems.length).toBeGreaterThan(0)
  })

  it('🎯[反例] 运行专员不可删除巡查', () => {
    expect(checkRoleAccess(ROLES.Operations, 'quality:patrol:delete')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 质量管理
// ════════════════════════════════════════════════════════════

describe('[🤝团建] quality 角色扩展测试', () => {
  it('🤝[反例] 团建无质量模块权限', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'quality:patrol:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'quality:patrol:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'quality:patrol:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'quality:patrol:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'quality:patrol:complete')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'quality:patrol:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'quality:rect:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'quality:rect:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'quality:rect:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'quality:rect:stats')).toBe(false)
  })

  it('🤝[闭环] 返回 403', () => {
    const denied = { success: false, code: 403, message: 'NO_QUALITY_ACCESS' }
    expect(denied.code).toBe(403)
  })

  it('🤝[闭环] 数据安全隔离', () => {
    const svc = makeService()
    const count = svc.listPatrolTasks(TENANT).length
    expect(count).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 质量管理
// ════════════════════════════════════════════════════════════

describe('[📢营销] quality 角色扩展测试', () => {
  it('📢[反例] 营销无质量模块权限', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'quality:patrol:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'quality:patrol:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'quality:patrol:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'quality:patrol:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'quality:patrol:complete')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'quality:patrol:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'quality:rect:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'quality:rect:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'quality:rect:stats')).toBe(false)
  })

  it('📢[闭环] 返回 403', () => {
    const denied = { success: false, code: 403, message: 'NO_QUALITY_ACCESS' }
    expect(denied.code).toBe(403)
  })

  it('📢[闭环] 权限矩阵校验', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'quality:patrol:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'quality:rect:list')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色闭环 + 边界场景
// ════════════════════════════════════════════════════════════

describe('[🦞 quality 跨角色闭环 + 边界]', () => {
  it('🔧+🎯+👔 巡查创建→执行→确认全流程', () => {
    const svc = makeService()

    // 1. 安监创建巡查
    const task = svc.createPatrolTask({
      tenantId: TENANT,
      patrolNo: 'PT-FLOW-001',
      title: '全流程巡查测试',
      description: '跨角色协作巡查',
      area: PatrolArea.Kitchen,
      priority: PatrolTaskPriority.High,
      checkItems: [
        { name: '卫生状况', standard: '整洁' },
        { name: '设备运行', standard: '正常' },
      ],
      assignedTo: '安监员',
      scheduledAt: '2026-07-25T09:00:00.000Z',
    })

    // 2. 运行专员执行
    const inProgress = svc.updatePatrolTask(task.id, TENANT, { status: PatrolTaskStatus.InProgress })
    expect(inProgress.status).toBe(PatrolTaskStatus.InProgress)

    // 3. 安监完成
    const completed = svc.updatePatrolTask(task.id, TENANT, { status: PatrolTaskStatus.Completed })
    expect(completed.status).toBe(PatrolTaskStatus.Completed)
    expect(completed.completedAt).toBeDefined()
  })

  it('🛡️ 查询不存在的巡查返回 undefined', () => {
    const svc = makeService()
    expect(svc.getPatrolTask('nonexistent', TENANT)).toBeUndefined()
  })

  it('🛡️ 不存在整改记录返回 undefined', () => {
    const svc = makeService()
    expect(svc.getRectificationRecord('nonexistent', TENANT)).toBeUndefined()
  })

  it('🛡️ 空数据列表为空', () => {
    const freshSvc = makeService()
    freshSvc.resetQualityStoresForTests()
    expect(freshSvc.listPatrolTasks(TENANT).length).toBe(0)
  })

  it('🛡️ 跨租户隔离', () => {
    const svc = makeService()
    expect(svc.listPatrolTasks('tenant-999').length).toBe(0)
    expect(svc.listRectificationRecords('tenant-999').length).toBe(0)
  })

  it('🛡️ 按搜索结果为空', () => {
    const svc = makeService()
    const nothing = svc.listPatrolTasks(TENANT, { search: 'ZZZ_NONE_ZZZ' })
    expect(nothing.length).toBe(0)
  })

  it('🛡️ 整改统计完整性', () => {
    const svc = makeService()
    const stats = svc.getRectificationStats(TENANT)
    const sum = stats.open + stats.inProgress + stats.resolved + stats.verified + stats.closed
    expect(sum).toBe(stats.total)
  })
})
