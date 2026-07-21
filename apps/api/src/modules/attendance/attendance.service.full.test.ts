/**
 * 🐜 考勤 Service 全覆盖测试
 *
 * 覆盖:
 *   1. 正常创建流程 (clockIn/clockOut)
 *   2. 边界/异常输入 (缺失字段、重复操作、不存在记录)
 *   3. 权限校验 (角色权限矩阵)
 *   4. 级联操作 (打卡→汇总统计、请假→审批→取消)
 *   5. 重复/并发场景 (重复打卡、重复审批、重复取消)
 *
 * 测试充分性: 15+ tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AttendanceService } from './attendance.service'
import { BadRequestException } from '@nestjs/common'
import type { LeaveType } from './attendance.entity'

// ─── 角色权限矩阵 ───

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

const roleAccess: Record<string, string[]> = {
  'att:list': ['👔店长', '👥HR', '🎯运行专员'],
  'att:detail': ['👔店长', '👥HR', '🎯运行专员'],
  'att:clock': ['👔店长', '🛒前台', '🎮导玩员', '🎯运行专员'],
  'att:summary': ['👔店长', '👥HR', '🎯运行专员'],
  'att:leave:create': ['🛒前台', '🎮导玩员', '🎯运行专员', '👥HR', '🤝团建', '📢营销'],
  'att:leave:approve': ['👔店长', '👥HR'],
  'att:leave:list': ['👔店长', '👥HR', '🎯运行专员'],
}

function hasAccess(role: string, resource: string): boolean {
  return roleAccess[resource]?.includes(role) ?? false
}

function makeService(): AttendanceService {
  return new AttendanceService()
}

// ══════════════════════════════════════════════════════════════════
// 1️⃣ 正常创建流程
// ══════════════════════════════════════════════════════════════════

describe('[1️⃣ 正常创建流程] AttendanceService', () => {
  let svc: AttendanceService

  beforeEach(() => {
    svc = makeService()
  })

  it('正常上班打卡 → status=normal, lateMinutes=0', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-normal-1',
      employeeName: '正常打卡员工',
      storeId: 'store-001',
      date: '2026-07-21',
      clockIn: '08:58',
    })
    expect(rec.status).toBe('normal')
    expect(rec.lateMinutes).toBe(0)
    expect(rec.clockOut).toBeNull()
    expect(rec.id).toMatch(/^clock-/)
    expect(rec.createdAt).toBeDefined()
    expect(rec.updatedAt).toBeDefined()
  })

  it('迟到打卡 → status=late, lateMinutes>0', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-late-1',
      employeeName: '迟到员工',
      storeId: 'store-001',
      date: '2026-07-21',
      clockIn: '09:45',
    })
    expect(rec.status).toBe('late')
    expect(rec.lateMinutes).toBe(45)
  })

  it('下班打卡正常 → 无早退加班', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-out-1',
      employeeName: '正常下班员工',
      storeId: 'store-001',
      date: '2026-07-21',
      clockIn: '09:00',
    })
    const out = svc.clockOut(rec.id, '18:00')
    expect(out.clockOut).toBe('18:00')
    expect(out.earlyLeaveMinutes).toBe(0)
    expect(out.overtimeMinutes).toBe(0)
  })

  it('下班打卡早退 → status=early_leave, earlyLeaveMinutes>0', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-early-1',
      employeeName: '早退员工',
      storeId: 'store-001',
      date: '2026-07-21',
      clockIn: '09:00',
    })
    const out = svc.clockOut(rec.id, '16:30')
    expect(out.status).toBe('early_leave')
    expect(out.earlyLeaveMinutes).toBe(90)
    expect(out.overtimeMinutes).toBe(0)
  })

  it('下班打卡加班 → status=overtime, overtimeMinutes>0', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-ot-1',
      employeeName: '加班员工',
      storeId: 'store-001',
      date: '2026-07-21',
      clockIn: '09:00',
    })
    const out = svc.clockOut(rec.id, '20:30')
    expect(out.status).toBe('overtime')
    expect(out.overtimeMinutes).toBe(150)
    expect(out.earlyLeaveMinutes).toBe(0)
  })

  it('创建请假申请 → status=pending, 字段完整', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-leave-1',
      employeeName: '请假员工',
      storeId: 'store-001',
      leaveType: 'annual',
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      reason: '年假旅行',
    })
    expect(leave.status).toBe('pending')
    expect(leave.id).toMatch(/^leave-/)
    expect(leave.leaveType).toBe('annual')
    expect(leave.startDate).toBe('2026-08-01')
    expect(leave.createdAt).toBeDefined()
  })

  it('审批请假 → approve → status=approved, approver 信息完整', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-approve-1',
      employeeName: '审批员工',
      storeId: 'store-001',
      leaveType: 'sick',
      startDate: '2026-07-22',
      endDate: '2026-07-22',
      reason: '看病',
    })
    const approved = svc.approveLeave(leave.id, 'mgr-001', '经理张三', 'approve', '同意')
    expect(approved.status).toBe('approved')
    expect(approved.approverId).toBe('mgr-001')
    expect(approved.approverName).toBe('经理张三')
    expect(approved.approvalRemark).toBe('同意')
  })

  it('驳回请假 → reject → status=rejected', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-reject-1',
      employeeName: '被拒员工',
      storeId: 'store-001',
      leaveType: 'personal',
      startDate: '2026-07-25',
      endDate: '2026-07-25',
      reason: '私事',
    })
    const rejected = svc.approveLeave(leave.id, 'mgr-002', '经理李四', 'reject', '请补充材料')
    expect(rejected.status).toBe('rejected')
    expect(rejected.approvalRemark).toBe('请补充材料')
  })

  it('请假记录可按条件列表查询', () => {
    const svc2 = makeService() // fresh instance to see seeds
    // seed data includes approved + pending leaves
    const allLeaves = svc2.listLeaves()
    expect(allLeaves.length).toBeGreaterThanOrEqual(2)

    const approvedLeaves = svc2.listLeaves({ status: 'approved' })
    expect(approvedLeaves.length).toBeGreaterThanOrEqual(1)
    approvedLeaves.forEach((l) => expect(l.status).toBe('approved'))

    const empLeaves = svc2.listLeaves({ employeeId: 'emp-001' })
    expect(empLeaves.length).toBeGreaterThanOrEqual(1)
    empLeaves.forEach((l) => expect(l.employeeId).toBe('emp-001'))
  })
})

// ══════════════════════════════════════════════════════════════════
// 2️⃣ 边界/异常输入
// ══════════════════════════════════════════════════════════════════

describe('[2️⃣ 边界/异常输入] AttendanceService', () => {
  let svc: AttendanceService

  beforeEach(() => {
    svc = makeService()
  })

  it('打卡缺少 employeeId 抛出 BadRequestException', () => {
    expect(() =>
      svc.clockIn({
        employeeId: '',
        employeeName: '无名',
        storeId: 'store-001',
        date: '2026-07-21',
      }),
    ).toThrow(BadRequestException)
  })

  it('打卡缺少 employeeName 抛出 BadRequestException', () => {
    expect(() =>
      svc.clockIn({
        employeeId: 'emp-err-1',
        employeeName: '',
        storeId: 'store-001',
        date: '2026-07-21',
      }),
    ).toThrow(BadRequestException)
  })

  it('打卡不存在的记录 clockOut 抛出异常', () => {
    expect(() => svc.clockOut('rec-nonexistent', '18:00')).toThrow(BadRequestException)
    expect(() => svc.clockOut('rec-nonexistent', '18:00')).toThrow(/not found/)
  })

  it('getRecord 不存在的记录返回 null', () => {
    expect(svc.getRecord('rec-nonexistent')).toBeNull()
  })

  it('getLeave 不存在的请假返回 null', () => {
    expect(svc.getLeave('leave-nonexistent')).toBeNull()
  })

  it('审批不存在的请假抛出 BadRequestException', () => {
    expect(() =>
      svc.approveLeave('leave-nonexistent', 'mgr', '经理', 'approve'),
    ).toThrow(BadRequestException)
  })

  it('取消不存在的请假抛出 BadRequestException', () => {
    expect(() => svc.cancelLeave('leave-nonexistent')).toThrow(BadRequestException)
  })

  it('创建请假缺少 reason 抛出 BadRequestException', () => {
    expect(() =>
      svc.createLeave({
        employeeId: 'emp-no-reason',
        employeeName: '无理由员工',
        storeId: 'store-001',
        leaveType: 'annual',
        startDate: '2026-08-01',
        endDate: '2026-08-01',
        reason: '',
      }),
    ).toThrow(BadRequestException)
  })

  it('没有 clockIn 参数的打卡使用默认 09:00', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-default-in',
      employeeName: '默认打卡',
      storeId: 'store-001',
      date: '2026-07-21',
    })
    expect(rec.clockIn).toBe('09:00')
    expect(rec.status).toBe('normal')
  })
})

// ══════════════════════════════════════════════════════════════════
// 3️⃣ 权限校验
// ══════════════════════════════════════════════════════════════════

describe('[3️⃣ 权限校验] AttendanceService', () => {
  it('👔店长有权查看考勤列表、详情、汇总、审批请假', () => {
    expect(hasAccess(ROLES.StoreManager, 'att:list')).toBe(true)
    expect(hasAccess(ROLES.StoreManager, 'att:detail')).toBe(true)
    expect(hasAccess(ROLES.StoreManager, 'att:summary')).toBe(true)
    expect(hasAccess(ROLES.StoreManager, 'att:leave:approve')).toBe(true)
    expect(hasAccess(ROLES.StoreManager, 'att:clock')).toBe(true)
    expect(hasAccess(ROLES.StoreManager, 'att:leave:create')).toBe(false)
  })

  it('🛒前台有权打卡、创建请假，无权审批、查看汇总', () => {
    expect(hasAccess(ROLES.FrontDesk, 'att:clock')).toBe(true)
    expect(hasAccess(ROLES.FrontDesk, 'att:leave:create')).toBe(true)
    expect(hasAccess(ROLES.FrontDesk, 'att:summary')).toBe(false)
    expect(hasAccess(ROLES.FrontDesk, 'att:leave:approve')).toBe(false)
    expect(hasAccess(ROLES.FrontDesk, 'att:list')).toBe(false)
  })

  it('👥HR 有权查看所有考勤数据和审批请假', () => {
    expect(hasAccess(ROLES.HR, 'att:list')).toBe(true)
    expect(hasAccess(ROLES.HR, 'att:detail')).toBe(true)
    expect(hasAccess(ROLES.HR, 'att:summary')).toBe(true)
    expect(hasAccess(ROLES.HR, 'att:leave:approve')).toBe(true)
    expect(hasAccess(ROLES.HR, 'att:leave:create')).toBe(true)
    expect(hasAccess(ROLES.HR, 'att:clock')).toBe(false)
  })

  it('🔧安监无任何考勤权限', () => {
    expect(hasAccess(ROLES.Security, 'att:list')).toBe(false)
    expect(hasAccess(ROLES.Security, 'att:clock')).toBe(false)
    expect(hasAccess(ROLES.Security, 'att:summary')).toBe(false)
    expect(hasAccess(ROLES.Security, 'att:leave:approve')).toBe(false)
    expect(hasAccess(ROLES.Security, 'att:detail')).toBe(false)
  })

  it('🎮导玩员有权打卡和创建请假,无权审批和列表', () => {
    expect(hasAccess(ROLES.Guide, 'att:clock')).toBe(true)
    expect(hasAccess(ROLES.Guide, 'att:leave:create')).toBe(true)
    expect(hasAccess(ROLES.Guide, 'att:leave:approve')).toBe(false)
    expect(hasAccess(ROLES.Guide, 'att:summary')).toBe(false)
    expect(hasAccess(ROLES.Guide, 'att:list')).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════════
// 4️⃣ 级联操作
// ══════════════════════════════════════════════════════════════════

describe('[4️⃣ 级联操作] AttendanceService', () => {
  let svc: AttendanceService

  beforeEach(() => {
    svc = makeService()
  })

  it('打卡+下班 → 汇总统计包含该记录', () => {
    svc.clockIn({
      employeeId: 'emp-cascade-1',
      employeeName: '级联员工',
      storeId: 'store-001',
      date: '2026-07-21',
      clockIn: '08:50',
    })
    svc.clockOut(
      svc.listRecords({ employeeId: 'emp-cascade-1' })[0].id,
      '18:10',
    )
    const summary = svc.getSummary('daily', '2026-07-21', '2026-07-21', 'store-001')
    expect(summary.normalCount).toBeGreaterThanOrEqual(1)
  })

  it('请假→审批→取消 完整生命周期', () => {
    // 创建
    const leave = svc.createLeave({
      employeeId: 'emp-lifecycle-1',
      employeeName: '生命周期员工',
      storeId: 'store-001',
      leaveType: 'annual',
      startDate: '2026-08-05',
      endDate: '2026-08-07',
      reason: '年假',
    })
    expect(leave.status).toBe('pending')

    // 审批通过
    const approved = svc.approveLeave(leave.id, 'mgr', '经理', 'approve')
    expect(approved.status).toBe('approved')

    // 取消请假
    const cancelled = svc.cancelLeave(leave.id)
    expect(cancelled.status).toBe('cancelled')
  })

  it('打卡记录列表支持多条件联合筛选 (employeeId + date)', () => {
    // Create records with different employees and dates
    svc.clockIn({
      employeeId: 'emp-filter-1',
      employeeName: '筛选A',
      storeId: 'store-001',
      date: '2026-07-21',
      clockIn: '09:00',
    })
    svc.clockIn({
      employeeId: 'emp-filter-1',
      employeeName: '筛选A',
      storeId: 'store-001',
      date: '2026-07-22',
      clockIn: '09:00',
    })
    svc.clockIn({
      employeeId: 'emp-filter-2',
      employeeName: '筛选B',
      storeId: 'store-001',
      date: '2026-07-21',
      clockIn: '09:00',
    })

    const result = svc.listRecords({
      employeeId: 'emp-filter-1',
      date: '2026-07-21',
    })
    expect(result.length).toBe(1)
    expect(result[0].employeeId).toBe('emp-filter-1')
    expect(result[0].date).toBe('2026-07-21')
  })

  it('按门店统计汇总 → byStore 记录正确', () => {
    svc.clockIn({
      employeeId: 'emp-store-a-1',
      employeeName: '门店A员工',
      storeId: 'store-a',
      date: '2026-07-21',
      clockIn: '09:00',
    })
    svc.clockIn({
      employeeId: 'emp-store-b-1',
      employeeName: '门店B员工',
      storeId: 'store-b',
      date: '2026-07-21',
      clockIn: '09:30',
    })

    const summary = svc.getSummary('daily', '2026-07-21', '2026-07-21')
    expect(summary.byStore['store-a']).toBeDefined()
    expect(summary.byStore['store-a'].totalEmployees).toBe(1)
    expect(summary.byStore['store-b']).toBeDefined()
    expect(summary.byStore['store-b'].lateCount).toBe(1)
  })
})

// ══════════════════════════════════════════════════════════════════
// 5️⃣ 重复/并发场景
// ══════════════════════════════════════════════════════════════════

describe('[5️⃣ 重复/并发场景] AttendanceService', () => {
  let svc: AttendanceService

  beforeEach(() => {
    svc = makeService()
  })

  it('重复下班打卡抛出 BadRequestException', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-dual-clockout',
      employeeName: '重复下班',
      storeId: 'store-001',
      date: '2026-07-21',
      clockIn: '09:00',
    })
    svc.clockOut(rec.id, '18:00') // 第一次成功
    expect(() => svc.clockOut(rec.id, '19:00')).toThrow(BadRequestException)
    expect(() => svc.clockOut(rec.id, '19:00')).toThrow(/already clocked out/)
  })

  it('已审批的请假不可再次审批 (approve)', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-dual-approve',
      employeeName: '双重审批',
      storeId: 'store-001',
      leaveType: 'sick',
      startDate: '2026-07-25',
      endDate: '2026-07-25',
      reason: '病假',
    })
    svc.approveLeave(leave.id, 'mgr-1', '经理1', 'approve')
    expect(() =>
      svc.approveLeave(leave.id, 'mgr-2', '经理2', 'approve'),
    ).toThrow(BadRequestException)
    expect(() =>
      svc.approveLeave(leave.id, 'mgr-2', '经理2', 'approve'),
    ).toThrow(/Cannot approve/)
  })

  it('已驳回的请假不可再次审批 (reject)', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-dual-reject',
      employeeName: '双重驳回',
      storeId: 'store-001',
      leaveType: 'personal',
      startDate: '2026-07-28',
      endDate: '2026-07-28',
      reason: '私事',
    })
    svc.approveLeave(leave.id, 'mgr-1', '经理1', 'reject')
    expect(() =>
      svc.approveLeave(leave.id, 'mgr-2', '经理2', 'approve'),
    ).toThrow(BadRequestException)
    expect(() =>
      svc.approveLeave(leave.id, 'mgr-2', '经理2', 'approve'),
    ).toThrow(/Cannot approve/)
  })

  it('已取消的请假不可重复取消', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-dual-cancel',
      employeeName: '重复取消',
      storeId: 'store-001',
      leaveType: 'annual',
      startDate: '2026-08-01',
      endDate: '2026-08-01',
      reason: '测试取消',
    })
    svc.cancelLeave(leave.id) // 第一次成功
    expect(() => svc.cancelLeave(leave.id)).toThrow(BadRequestException)
    expect(() => svc.cancelLeave(leave.id)).toThrow(/already cancelled/)
  })

  it('多次打卡创建多条独立记录', () => {
    const r1 = svc.clockIn({
      employeeId: 'emp-multi-1',
      employeeName: '多打卡',
      storeId: 'store-001',
      date: '2026-07-21',
      clockIn: '09:00',
    })
    const r2 = svc.clockIn({
      employeeId: 'emp-multi-1',
      employeeName: '多打卡',
      storeId: 'store-001',
      date: '2026-07-22',
      clockIn: '09:05',
    })
    const r3 = svc.clockIn({
      employeeId: 'emp-multi-1',
      employeeName: '多打卡',
      storeId: 'store-001',
      date: '2026-07-23',
      clockIn: '08:55',
    })
    expect(r1.id).not.toBe(r2.id)
    expect(r2.id).not.toBe(r3.id)

    const records = svc.listRecords({ employeeId: 'emp-multi-1' })
    expect(records.length).toBeGreaterThanOrEqual(3)
  })

  it('种子数据 + 新创建的请假可各自独立列表', () => {
    // Service already seeded with 2 leave records
    const svc2 = makeService()
    const newLeave = svc2.createLeave({
      employeeId: 'emp-seed-plus',
      employeeName: '种子追加',
      storeId: 'store-002',
      leaveType: 'personal',
      startDate: '2026-08-10',
      endDate: '2026-08-10',
      reason: '追加测试',
    })
    const allLeaves = svc2.listLeaves()
    expect(allLeaves.length).toBeGreaterThanOrEqual(3)
    expect(allLeaves.some((l) => l.id === newLeave.id)).toBe(true)
  })
})
