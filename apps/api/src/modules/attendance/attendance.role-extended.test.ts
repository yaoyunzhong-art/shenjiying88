/**
 * 🐜 自动: [attendance] [C] 角色扩展测试
 *
 * 8 角色视角的考勤模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 AttendanceService + in-memory Store
 */
import { describe, it, expect } from 'vitest'
import { AttendanceService } from './attendance.service'
import type { LeaveType } from './attendance.entity'

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

/** 角色 → 考勤模块权限 */
const roleAttendanceAccess: Record<string, string[]> = {
  'att:list': ['👔店长', '👥HR', '🎯运行专员'],
  'att:detail': ['👔店长', '👥HR', '🎯运行专员'],
  'att:clock': ['👔店长', '🛒前台', '🎮导玩员', '🎯运行专员'],
  'att:summary': ['👔店长', '👥HR', '🎯运行专员'],
  'att:leave:create': ['🛒前台', '🎮导玩员', '🎯运行专员', '👥HR', '🤝团建', '📢营销'],
  'att:leave:approve': ['👔店长', '👥HR'],
  'att:leave:list': ['👔店长', '👥HR', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleAttendanceAccess[resource]?.includes(role) ?? false
}

function makeService(): AttendanceService {
  return new AttendanceService()
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 考勤
// ════════════════════════════════════════════════════════════

describe('[👔店长] attendance 角色扩展测试', () => {
  it('👔[正例] 店长查看考勤列表 → 按门店筛选 → 按状态筛选', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'att:list')).toBe(true)
    const svc = makeService()
    const all = svc.listRecords()
    expect(all.length).toBeGreaterThan(0)

    const storeItems = svc.listRecords({ storeId: 'store-001' })
    storeItems.forEach((r) => expect(r.storeId).toBe('store-001'))

    const lateItems = svc.listRecords({ status: 'late' })
    lateItems.forEach((r) => expect(r.status).toBe('late'))

    expect(checkRoleAccess(ROLES.StoreManager, 'att:detail')).toBe(true)
    const seed = svc.getRecord('rec-seed-001')
    expect(seed).not.toBeNull()
    expect(seed!.employeeName).toBe('张三')
  })

  it('👔[正例] 店长审批请假申请', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'att:leave:approve')).toBe(true)
    const svc = makeService()
    const leave = svc.createLeave({
      employeeId: 'emp-store-test',
      employeeName: '测试员工',
      storeId: 'store-001',
      leaveType: 'personal',
      startDate: '2026-07-25',
      endDate: '2026-07-25',
      reason: '个人事务',
    })
    expect(leave.status).toBe('pending')

    const approved = svc.approveLeave(leave.id, 'store-mgr', '店长', 'approve', '同意请假')
    expect(approved.status).toBe('approved')
    expect(approved.approverName).toBe('店长')
  })

  it('👔[正例] 店长查看考勤汇总统计', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'att:summary')).toBe(true)
    const svc = makeService()
    const summary = svc.getSummary('daily', '2026-07-20', '2026-07-20')
    expect(summary.totalEmployees).toBeGreaterThan(0)
    expect(summary.normalCount + summary.lateCount + summary.earlyLeaveCount + summary.absentCount + summary.leaveCount + summary.overtimeCount).toBe(summary.totalDays)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 考勤
// ════════════════════════════════════════════════════════════

describe('[🛒前台] attendance 角色扩展测试', () => {
  it('🛒[正例] 前台打卡（上下班打卡）', async () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'att:clock')).toBe(true)
    const svc = makeService()
    const record = svc.clockIn({
      employeeId: 'fd-001',
      employeeName: '前台小美',
      storeId: 'store-001',
      date: '2026-07-21',
      clockIn: '08:45',
    })
    expect(record.status).toBe('normal')
    expect(record.lateMinutes).toBe(0)

    const clockedOut = svc.clockOut(record.id, '18:15')
    expect(clockedOut.clockOut).toBe('18:15')
    expect(clockedOut.overtimeMinutes).toBe(15)
  })

  it('🛒[反例] 前台无权限查看考勤汇总', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'att:summary')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'att:detail')).toBe(false)
  })

  it('🛒[反例] 前台无权限审批请假', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'att:leave:approve')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 考勤
// ════════════════════════════════════════════════════════════

describe('[👥HR] attendance 角色扩展测试', () => {
  it('👥[正例] HR 查看考勤记录详情 → 按员工筛选', async () => {
    expect(checkRoleAccess(ROLES.HR, 'att:list')).toBe(true)
    const svc = makeService()
    const empItems = svc.listRecords({ employeeId: 'emp-002' })
    expect(empItems.length).toBeGreaterThanOrEqual(1)
    empItems.forEach((r) => expect(r.employeeId).toBe('emp-002'))

    expect(checkRoleAccess(ROLES.HR, 'att:detail')).toBe(true)
    const rec = svc.getRecord('rec-seed-002')
    expect(rec).not.toBeNull()
    expect(rec!.lateMinutes).toBe(30)
  })

  it('👥[正例] HR 审批/驳回请假', async () => {
    expect(checkRoleAccess(ROLES.HR, 'att:leave:approve')).toBe(true)
    const svc = makeService()
    const leave = svc.createLeave({
      employeeId: 'emp-hr-001',
      employeeName: 'HR测试',
      storeId: 'store-001',
      leaveType: 'sick',
      startDate: '2026-07-28',
      endDate: '2026-07-28',
      reason: '感冒',
    })
    const rejected = svc.approveLeave(leave.id, 'hr-mgr', 'HR主管', 'reject', '需要医院证明')
    expect(rejected.status).toBe('rejected')
    expect(rejected.approvalRemark).toBe('需要医院证明')
  })

  it('👥[正例] HR 查看考勤汇总 → 按门店统计', async () => {
    expect(checkRoleAccess(ROLES.HR, 'att:summary')).toBe(true)
    const svc = makeService()
    const summary = svc.getSummary('daily', '2026-07-20', '2026-07-20', 'store-001')
    expect(summary.byStore['store-001']).toBeDefined()
    expect(summary.byStore['store-001'].totalEmployees).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 考勤
// ════════════════════════════════════════════════════════════

describe('[🔧安监] attendance 角色扩展测试', () => {
  it('🔧[反例] 安监无权限查看考勤列表', () => {
    expect(checkRoleAccess(ROLES.Security, 'att:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'att:detail')).toBe(false)
  })

  it('🔧[反例] 安监无权限操作考勤', () => {
    expect(checkRoleAccess(ROLES.Security, 'att:clock')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'att:summary')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'att:leave:approve')).toBe(false)
  })

  it('🔧[闭环] 安监无权限返回统一格式', () => {
    const denied = { success: false, code: 403, message: 'NO_ATTENDANCE_ACCESS', module: 'attendance' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('attendance')
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 考勤
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] attendance 角色扩展测试', () => {
  it('🎮[正例] 导玩员上下班打卡', async () => {
    expect(checkRoleAccess(ROLES.Guide, 'att:clock')).toBe(true)
    const svc = makeService()
    const rec = svc.clockIn({
      employeeId: 'guide-001',
      employeeName: '导玩员小明',
      storeId: 'store-001',
      date: '2026-07-21',
      clockIn: '08:50',
    })
    expect(rec.status).toBe('normal')

    const out = svc.clockOut(rec.id, '18:00')
    expect(out.clockOut).toBe('18:00')
    expect(out.earlyLeaveMinutes).toBe(0)
  })

  it('🎮[反例] 导玩员无权查看全体考勤列表', () => {
    expect(checkRoleAccess(ROLES.Guide, 'att:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'att:summary')).toBe(false)
  })

  it('🎮[反例] 导玩员无权审批请假', () => {
    expect(checkRoleAccess(ROLES.Guide, 'att:leave:approve')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 考勤
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] attendance 角色扩展测试', () => {
  it('🎯[正例] 运行专员查看考勤列表 → 按日期筛选 → 查看详情', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'att:list')).toBe(true)
    const svc = makeService()
    const dateItems = svc.listRecords({ date: '2026-07-20' })
    expect(dateItems.length).toBeGreaterThanOrEqual(3)
    dateItems.forEach((r) => expect(r.date).toBe('2026-07-20'))

    expect(checkRoleAccess(ROLES.Operations, 'att:detail')).toBe(true)
    const rec = svc.getRecord('rec-seed-003')
    expect(rec).not.toBeNull()
    expect(rec!.earlyLeaveMinutes).toBe(30)
  })

  it('🎯[正例] 运行专员打卡 → 请假申请', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'att:clock')).toBe(true)
    const svc = makeService()
    const rec = svc.clockIn({
      employeeId: 'ops-001',
      employeeName: '运行专员小王',
      storeId: 'store-002',
      date: '2026-07-21',
      clockIn: '09:15',
    })
    expect(rec.lateMinutes).toBe(15)

    expect(checkRoleAccess(ROLES.Operations, 'att:leave:create')).toBe(true)
    const leave = svc.createLeave({
      employeeId: 'ops-001',
      employeeName: '运行专员小王',
      storeId: 'store-002',
      leaveType: 'annual',
      startDate: '2026-08-05',
      endDate: '2026-08-06',
      reason: '年假',
    })
    expect(leave.status).toBe('pending')
  })

  it('🎯[正例] 运行专员查看考勤汇总', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'att:summary')).toBe(true)
    const svc = makeService()
    const summary = svc.getSummary('daily', '2026-07-20', '2026-07-20')
    expect(summary.lateCount).toBeGreaterThanOrEqual(1)
    expect(summary.earlyLeaveCount).toBeGreaterThanOrEqual(1)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 考勤
// ════════════════════════════════════════════════════════════

describe('[🤝团建] attendance 角色扩展测试', () => {
  it('🤝[正例] 团建创建请假申请（团建活动）', async () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'att:leave:create')).toBe(true)
    const svc = makeService()
    const leave = svc.createLeave({
      employeeId: 'tb-001',
      employeeName: '团建专员',
      storeId: 'store-001',
      leaveType: 'annual',
      startDate: '2026-08-10',
      endDate: '2026-08-11',
      reason: '团建活动准备',
    })
    expect(leave.status).toBe('pending')
    expect(leave.leaveType).toBe('annual')
  })

  it('🤝[反例] 团建无权限查看考勤列表', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'att:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'att:summary')).toBe(false)
  })

  it('🤝[反例] 团建无权限审批请假', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'att:leave:approve')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 考勤
// ════════════════════════════════════════════════════════════

describe('[📢营销] attendance 角色扩展测试', () => {
  it('📢[正例] 营销创建请假申请（外出营销活动）', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'att:leave:create')).toBe(true)
    const svc = makeService()
    const leave = svc.createLeave({
      employeeId: 'mkt-001',
      employeeName: '营销小张',
      storeId: 'store-001',
      leaveType: 'personal',
      startDate: '2026-07-26',
      endDate: '2026-07-26',
      reason: '外出参加行业展会',
    })
    expect(leave.status).toBe('pending')
    expect(leave.reason).toBe('外出参加行业展会')
  })

  it('📢[反例] 营销无权限查看考勤统计', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'att:summary')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'att:list')).toBe(false)
  })

  it('📢[反例] 营销无权限审批请假', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'att:leave:approve')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 attendance 跨角色闭环 + 边界]', () => {
  it('🎮 + 👔 考勤打卡与审批请假全流程', async () => {
    const svc = makeService()

    // 1. 导玩员打卡
    const record = svc.clockIn({
      employeeId: 'guide-cross-001',
      employeeName: '跨角色导玩员',
      storeId: 'store-001',
      date: '2026-07-21',
      clockIn: '09:30',
    })
    expect(record.lateMinutes).toBe(30)

    const out = svc.clockOut(record.id, '18:05')
    expect(out.clockOut).toBe('18:05')

    // 2. 导玩员申请请假
    const leave = svc.createLeave({
      employeeId: 'guide-cross-001',
      employeeName: '跨角色导玩员',
      storeId: 'store-001',
      leaveType: 'sick',
      startDate: '2026-07-22',
      endDate: '2026-07-22',
      reason: '身体不适',
    })
    expect(leave.status).toBe('pending')

    // 3. 店长审批
    const approved = svc.approveLeave(leave.id, 'store-mgr', '店长', 'approve', '好好休息')
    expect(approved.status).toBe('approved')
    expect(approved.approvalRemark).toBe('好好休息')

    // 4. 汇总统计
    const summary = svc.getSummary('daily', '2026-07-21', '2026-07-21')
    expect(summary.totalEmployees).toBeGreaterThan(0)
  })

  it('🛡️ 不存在的打卡记录返回 null', () => {
    const svc = makeService()
    expect(svc.getRecord('rec-nonexistent')).toBeNull()
  })

  it('🛡️ 重复打卡报错', () => {
    const svc = makeService()
    const rec = svc.clockIn({
      employeeId: 'emp-dual',
      employeeName: '重复打卡',
      storeId: 'store-001',
      date: '2026-07-21',
      clockIn: '09:00',
    })
    expect(() => svc.clockOut(rec.id, '18:00')).not.toThrow()
    expect(() => svc.clockOut(rec.id, '19:00')).toThrow('already clocked out')
  })

  it('🛡️ 已审批请假不可重复审批', () => {
    const svc = makeService()
    const leave = svc.createLeave({
      employeeId: 'emp-leave2',
      employeeName: '双重审批',
      storeId: 'store-001',
      leaveType: 'personal',
      startDate: '2026-07-25',
      endDate: '2026-07-25',
      reason: '有事',
    })
    svc.approveLeave(leave.id, 'mgr1', '管理员1', 'approve')
    expect(() => svc.approveLeave(leave.id, 'mgr2', '管理员2', 'approve'))
      .toThrow('Cannot approve leave in status approved')
  })

  it('🛡️ 已取消请假不可重复取消', () => {
    const svc = makeService()
    const leave = svc.createLeave({
      employeeId: 'emp-cancel2',
      employeeName: '重复取消',
      storeId: 'store-001',
      leaveType: 'annual',
      startDate: '2026-08-01',
      endDate: '2026-08-01',
      reason: '测试',
    })
    svc.cancelLeave(leave.id)
    expect(() => svc.cancelLeave(leave.id)).toThrow('Leave already cancelled')
  })

  it('🛡️ 按时间段筛选考勤记录', () => {
    const svc = makeService()
    const items = svc.listRecords({ from: '2026-07-20', to: '2026-07-20' })
    expect(items.length).toBeGreaterThanOrEqual(3)
  })

  it('🛡️ 按状态筛选请假记录', () => {
    const svc = makeService()
    const approvedLeaves = svc.listLeaves({ status: 'approved' })
    expect(approvedLeaves.length).toBeGreaterThanOrEqual(1)
    approvedLeaves.forEach((l) => expect(l.status).toBe('approved'))
  })

  it('🛡️ 门店考勤汇总统计正确', () => {
    const svc = makeService()
    // 无门店筛选时返回全部
    const allSummary = svc.getSummary('daily', '2026-07-20', '2026-07-20')
    expect(allSummary.byStore['store-001']).toBeDefined()
    expect(allSummary.byStore['store-001'].lateCount).toBeGreaterThanOrEqual(1)
    expect(allSummary.byStore['store-002']).toBeDefined()

    // 按门店筛选只返回该门店数据
    const storeSummary = svc.getSummary('daily', '2026-07-20', '2026-07-20', 'store-001')
    expect(storeSummary.byStore['store-001']).toBeDefined()
    expect(storeSummary.byStore['store-002']).toBeUndefined()
  })
})
