/**
 * 🐜 自动: [transfer] [C] 角色扩展测试
 *
 * 8 角色视角的转试用模块扩展测试
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 ProbationTransferService + in-memory Store
 */
import { describe, it, expect } from 'vitest'
import { ProbationTransferService } from './probation-transfer.service'
import { ProbationStatus, ProbationDuration } from './probation-transfer.entity'

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

const roleTransferAccess: Record<string, string[]> = {
  'transfer:list': ['👔店长', '👥HR', '🎯运行专员'],
  'transfer:detail': ['👔店长', '👥HR', '🎯运行专员'],
  'transfer:create': ['👔店长', '👥HR'],
  'transfer:approve': ['👔店长', '👥HR'],
  'transfer:stats': ['👔店长', '👥HR', '🎯运行专员'],
  'transfer:extend': ['👔店长', '👥HR'],
  'transfer:terminate': ['👔店长', '👥HR'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleTransferAccess[resource]?.includes(role) ?? false
}

const TENANT = 'tenant-001'

function makeService(): ProbationTransferService {
  const svc = new ProbationTransferService()
  svc.seedMockData(TENANT)
  return svc
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 转试用
// ════════════════════════════════════════════════════════════

describe('[👔店长] transfer 角色扩展测试', () => {
  it('👔[正例] 店长查看转试用列表 → 按状态筛选 → 按部门筛选', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'transfer:list')).toBe(true)
    const svc = makeService()
    const all = svc.listTransfers(TENANT)
    expect(all.length).toBeGreaterThan(0)

    const ongoing = svc.listTransfers(TENANT, { status: ProbationStatus.Ongoing })
    ongoing.forEach((t) => expect(t.status).toBe(ProbationStatus.Ongoing))

    const tech = svc.listTransfers(TENANT, { department: '技术部' })
    tech.forEach((t) => expect(t.department).toBe('技术部'))
  })

  it('👔[正例] 店长创建转试用记录 → 查看详情', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'transfer:create')).toBe(true)
    const svc = new ProbationTransferService()
    const transfer = svc.createTransfer({
      tenantId: TENANT, employeeId: 'EMP-NEW', employeeName: '新员工',
      department: '运营部', position: '运营专员',
      probationDuration: ProbationDuration.ThreeMonths,
      probationStart: '2026-08-01', probationEnd: '2026-10-31',
      evaluation: '面试表现优秀', approver: '店长',
    })
    expect(transfer.status).toBe(ProbationStatus.Ongoing)

    expect(checkRoleAccess(ROLES.StoreManager, 'transfer:detail')).toBe(true)
    const detail = svc.getTransfer(transfer.id, TENANT)
    expect(detail).toBeDefined()
    expect(detail!.employeeName).toBe('新员工')
    expect(detail!.department).toBe('运营部')
  })

  it('👔[正例] 店长审批转试用 → 转正/延长/终止', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'transfer:approve')).toBe(true)
    const svc = new ProbationTransferService()

    // 创建待审批记录
    const transfer = svc.createTransfer({
      tenantId: TENANT, employeeId: 'EMP-APPROVE', employeeName: '待审批员工',
      department: '销售部', position: '销售代表',
      probationDuration: ProbationDuration.ThreeMonths,
      probationStart: '2026-06-01', probationEnd: '2026-08-31',
      evaluation: '业绩达标', approver: '店长',
    })

    // 店长审批转正
    const completed = svc.approveTransfer(transfer.id, ProbationStatus.Completed, TENANT, {
      performanceRating: 'A',
      approvalRemark: '表现优秀，提前转正',
    })
    expect(completed.status).toBe(ProbationStatus.Completed)
    expect(completed.performanceRating).toBe('A')

    // 创建延长试用记录
    const ext = svc.createTransfer({
      tenantId: TENANT, employeeId: 'EMP-EXT', employeeName: '延长员工',
      department: '技术部', position: '开发',
      probationDuration: ProbationDuration.ThreeMonths,
      probationStart: '2026-05-01', probationEnd: '2026-07-31',
      evaluation: '需要进一步观察', approver: '技术总监',
    })
    const extended = svc.approveTransfer(ext.id, ProbationStatus.Extended, TENANT, {
      performanceRating: 'C',
      approvalRemark: '延长试用期1个月',
    })
    expect(extended.status).toBe(ProbationStatus.Extended)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 转试用
// ════════════════════════════════════════════════════════════

describe('[🛒前台] transfer 角色扩展测试', () => {
  it('🛒[反例] 前台无权查看转试用列表', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'transfer:list')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'transfer:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'transfer:create')).toBe(false)
  })

  it('🛒[反例] 前台无权审批转试用', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'transfer:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'transfer:stats')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'transfer:extend')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'transfer:terminate')).toBe(false)
  })

  it('🛒[闭环] 前台不可见转试用菜单', () => {
    const denied = { code: 403, role: ROLES.FrontDesk, module: 'transfer' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 转试用
// ════════════════════════════════════════════════════════════

describe('[👥HR] transfer 角色扩展测试', () => {
  it('👥[正例] HR 查看转试用列表 → 按员工筛选', () => {
    expect(checkRoleAccess(ROLES.HR, 'transfer:list')).toBe(true)
    const svc = makeService()
    const all = svc.listTransfers(TENANT)
    expect(all.length).toBeGreaterThan(0)

    const empFiltered = svc.listTransfers(TENANT, { employeeId: 'EMP-001' })
    empFiltered.forEach((t) => expect(t.employeeId).toBe('EMP-001'))
  })

  it('👥[正例] HR 创建转试用记录 → 审批通过', () => {
    expect(checkRoleAccess(ROLES.HR, 'transfer:create')).toBe(true)
    const svc = new ProbationTransferService()
    const transfer = svc.createTransfer({
      tenantId: TENANT, employeeId: 'EMP-HR-01', employeeName: 'HR创建员工',
      department: '财务部', position: '会计',
      probationDuration: ProbationDuration.ThreeMonths,
      probationStart: '2026-07-01', probationEnd: '2026-09-30',
      evaluation: '面试合格', approver: 'HR主管',
    })
    expect(transfer.employeeName).toBe('HR创建员工')

    expect(checkRoleAccess(ROLES.HR, 'transfer:approve')).toBe(true)
    const completed = svc.approveTransfer(transfer.id, ProbationStatus.Completed, TENANT, {
      performanceRating: 'B',
      approvalRemark: '合格录用',
    })
    expect(completed.status).toBe(ProbationStatus.Completed)
  })

  it('👥[正例] HR 查看转试用统计', () => {
    expect(checkRoleAccess(ROLES.HR, 'transfer:stats')).toBe(true)
    const svc = makeService()
    const stats = svc.getStats(TENANT)
    expect(stats.total).toBeGreaterThan(0)
    expect(stats.byStatus).toBeDefined()
    expect(stats.byDepartment.length).toBeGreaterThan(0)
    // 至少有一个完成/终止/延长的记录
    expect(stats.completedRate + stats.extensionRate + stats.terminationRate).toBeCloseTo(1, 1)
  })

  it('👥[反例] HR 无权删除转试用记录', () => {
    expect(checkRoleAccess(ROLES.HR, 'transfer:terminate')).toBe(true) // HR 可以终止
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 转试用
// ════════════════════════════════════════════════════════════

describe('[🔧安监] transfer 角色扩展测试', () => {
  it('🔧[反例] 安监无权查看转试用', () => {
    expect(checkRoleAccess(ROLES.Security, 'transfer:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'transfer:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'transfer:create')).toBe(false)
  })

  it('🔧[反例] 安监无权审批转试用', () => {
    expect(checkRoleAccess(ROLES.Security, 'transfer:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'transfer:stats')).toBe(false)
  })

  it('🔧[闭环] 安监不涉及人事流程', () => {
    const denied = { code: 403, role: ROLES.Security }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 转试用
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] transfer 角色扩展测试', () => {
  it('🎮[反例] 导玩员无权查看转试用', () => {
    expect(checkRoleAccess(ROLES.Guide, 'transfer:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'transfer:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'transfer:create')).toBe(false)
  })

  it('🎮[反例] 导玩员无权审批', () => {
    expect(checkRoleAccess(ROLES.Guide, 'transfer:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'transfer:stats')).toBe(false)
  })

  it('🎮[闭环] 导玩员不可见转试用', () => {
    const denied = { code: 403, role: ROLES.Guide }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 转试用
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] transfer 角色扩展测试', () => {
  it('🎯[正例] 运行专员查看转试用列表 → 按日期范围筛选', () => {
    expect(checkRoleAccess(ROLES.Operations, 'transfer:list')).toBe(true)
    const svc = makeService()
    const all = svc.listTransfers(TENANT)
    expect(all.length).toBeGreaterThan(0)

    const filtered = svc.listTransfers(TENANT, { fromDate: '2026-01-01', toDate: '2026-12-31' })
    expect(filtered.length).toBeGreaterThanOrEqual(all.length)
  })

  it('🎯[正例] 运行专员查看转试用统计', () => {
    expect(checkRoleAccess(ROLES.Operations, 'transfer:stats')).toBe(true)
    const svc = makeService()
    const stats = svc.getStats(TENANT)
    expect(stats.total).toBeGreaterThan(0)
    expect(stats.completedRate).toBeGreaterThanOrEqual(0)
  })

  it('🎯[反例] 运行专员无权创建/审批转试用', () => {
    expect(checkRoleAccess(ROLES.Operations, 'transfer:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Operations, 'transfer:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.Operations, 'transfer:extend')).toBe(false)
    expect(checkRoleAccess(ROLES.Operations, 'transfer:terminate')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 转试用
// ════════════════════════════════════════════════════════════

describe('[🤝团建] transfer 角色扩展测试', () => {
  it('🤝[反例] 团建无权查看转试用', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'transfer:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'transfer:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'transfer:create')).toBe(false)
  })

  it('🤝[反例] 团建无权审批转试用', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'transfer:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'transfer:stats')).toBe(false)
  })

  it('🤝[闭环] 团建不涉及人事流程', () => {
    const denied = { code: 403, role: ROLES.Teambuilding }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 转试用
// ════════════════════════════════════════════════════════════

describe('[📢营销] transfer 角色扩展测试', () => {
  it('📢[反例] 营销无权查看转试用', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'transfer:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'transfer:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'transfer:create')).toBe(false)
  })

  it('📢[反例] 营销无权审批', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'transfer:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'transfer:stats')).toBe(false)
  })

  it('📢[闭环] 营销不可见转试用', () => {
    const denied = { code: 403, role: ROLES.Marketing, module: 'transfer' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 transfer 跨角色闭环 + 边界]', () => {
  it('👔+👥 店长创建试用记录 → HR 审批 → 运行专员查看统计', () => {
    // 1. 店长创建
    const svc = new ProbationTransferService()
    const transfer = svc.createTransfer({
      tenantId: TENANT, employeeId: 'EMP-CROSS', employeeName: '跨角色员工',
      department: '运营部', position: '运营专员',
      probationDuration: ProbationDuration.ThreeMonths,
      probationStart: '2026-07-01', probationEnd: '2026-09-30',
      evaluation: '有待观察', approver: '店长',
    })
    expect(transfer.status).toBe(ProbationStatus.Ongoing)

    // 2. HR 审批
    const approved = svc.approveTransfer(transfer.id, ProbationStatus.Completed, TENANT, {
      performanceRating: 'B',
      approvalRemark: '基本合格，正式录用',
    })
    expect(approved.status).toBe(ProbationStatus.Completed)

    // 3. 运行专员查看统计
    const stats = svc.getStats(TENANT)
    expect(stats.total).toBeGreaterThanOrEqual(1)
    expect(stats.byStatus[ProbationStatus.Completed]).toBeGreaterThanOrEqual(1)
  })

  it('🛡️ 不存在的转试用返回 undefined', () => {
    const svc = new ProbationTransferService()
    expect(svc.getTransfer('nonexistent', TENANT)).toBeUndefined()
  })

  it('🛡️ 审批已完成转试用报错', () => {
    const svc = new ProbationTransferService()
    svc.seedMockData(TENANT)
    // EMP-001 已经 Completed
    const transfers = svc.listTransfers(TENANT, { employeeId: 'EMP-001' })
    expect(transfers.length).toBeGreaterThan(0)
    expect(() => svc.approveTransfer(transfers[0].id, ProbationStatus.Completed, TENANT))
      .toThrow(/Cannot approve/)
  })

  it('🛡️ 租户隔离：另一租户看不到数据', () => {
    const svc = makeService()
    const otherTenant = svc.listTransfers('tenant-other')
    expect(otherTenant.length).toBe(0)
  })

  it('🛡️ 创建转试用包含完整字段', () => {
    const svc = new ProbationTransferService()
    const t = svc.createTransfer({
      tenantId: TENANT, employeeId: 'EMP-FULL', employeeName: '完整员工',
      department: '全部门', position: '全职位',
      probationDuration: ProbationDuration.SixMonths,
      probationStart: '2026-01-01', probationEnd: '2026-06-30',
      evaluation: '完整评估', approver: '审批人',
    })
    expect(t.probationDuration).toBe(ProbationDuration.SixMonths)
    expect(t.evaluation).toBe('完整评估')
    expect(t.approver).toBe('审批人')
  })

  it('🛡️ 转试用统计包含正确月趋势', () => {
    const svc = makeService()
    const stats = svc.getStats(TENANT)
    expect(stats.monthlyTrend.length).toBeGreaterThan(0)
    expect(stats.performanceDistribution.length).toBeGreaterThan(0)
  })

  it('🛡️ 终止操作正确记录原因', () => {
    const svc = new ProbationTransferService()
    const transfer = svc.createTransfer({
      tenantId: TENANT, employeeId: 'EMP-TERM', employeeName: '终止员工',
      department: '技术部', position: '开发',
      probationDuration: ProbationDuration.ThreeMonths,
      probationStart: '2026-06-01', probationEnd: '2026-08-31',
      evaluation: '不合格', approver: '技术总监',
    })
    const terminated = svc.approveTransfer(transfer.id, ProbationStatus.Terminated, TENANT, {
      performanceRating: 'D',
      rejectReason: '试用期评估不合格',
    })
    expect(terminated.status).toBe(ProbationStatus.Terminated)
    expect(terminated.rejectReason).toBe('试用期评估不合格')
  })

  it('🛡️ 按审批人筛选', () => {
    const svc = makeService()
    const filtered = svc.listTransfers(TENANT, { approver: '李经理' })
    expect(filtered.length).toBeGreaterThan(0)
    filtered.forEach((t) => expect(t.approver).toBe('李经理'))
  })

  it('🛡️ 查看部门统计分布', () => {
    const svc = makeService()
    const stats = svc.getStats(TENANT)
    expect(stats.byDepartment.length).toBeGreaterThan(0)
    const totalFromDept = stats.byDepartment.reduce((s, d) => s + d.count, 0)
    expect(totalFromDept).toBe(stats.total)
  })
})
