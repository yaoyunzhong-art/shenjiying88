/**
 * attendance.service.spec.ts — 考勤 Service 单元测试
 *
 * 覆盖: clockIn/clockOut 完整流程、请假生命周期、考勤统计、
 *       边界异常输入、状态冲突、筛选/列表查询
 *
 * 充分性: 15+ tests  |  Jest describe/it 模式
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AttendanceService } from './attendance.service'
import { BadRequestException } from '@nestjs/common'
import type { LeaveType } from './attendance.entity'

// ══════════════════════════════════════════════════════════════════
// 1️⃣ 打卡记录 CRUD
// ══════════════════════════════════════════════════════════════════

describe('AttendanceService — 打卡记录', () => {
  let svc: AttendanceService

  beforeEach(() => {
    svc = new AttendanceService()
  })

  it('正常上班打卡 → status=normal, lateMinutes=0', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-a',
      employeeName: '小明',
      storeId: 'store-001',
      date: '2026-07-22',
      clockIn: '08:55',
    })
    expect(rec.status).toBe('normal')
    expect(rec.lateMinutes).toBe(0)
    expect(rec.id).toMatch(/^clock-/)
  })

  it('迟到打卡 → lateMinutes>0, status=late', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-b',
      employeeName: '迟到员工',
      storeId: 'store-001',
      date: '2026-07-22',
      clockIn: '10:15',
    })
    expect(rec.status).toBe('late')
    expect(rec.lateMinutes).toBe(75)
  })

  it('下班打卡 → clockOut 记录正确', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-c',
      employeeName: '下班员工',
      storeId: 'store-001',
      date: '2026-07-22',
      clockIn: '09:00',
    })
    const out = svc.clockOut(rec.id, '18:00')
    expect(out.clockOut).toBe('18:00')
    expect(out.earlyLeaveMinutes).toBe(0)
    expect(out.overtimeMinutes).toBe(0)
  })

  it('下班打卡早退 → status=early_leave', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-d',
      employeeName: '早退员工',
      storeId: 'store-001',
      date: '2026-07-22',
      clockIn: '09:00',
    })
    const out = svc.clockOut(rec.id, '16:00')
    expect(out.status).toBe('early_leave')
    expect(out.earlyLeaveMinutes).toBe(120)
  })

  it('下班打卡加班 → status=overtime, overtimeMinutes>0', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-e',
      employeeName: '加班员工',
      storeId: 'store-001',
      date: '2026-07-22',
      clockIn: '09:00',
    })
    const out = svc.clockOut(rec.id, '21:15')
    expect(out.status).toBe('overtime')
    expect(out.overtimeMinutes).toBe(195)
  })

  it('getRecord 返回已存在记录', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-f',
      employeeName: '查找员工',
      storeId: 'store-001',
      date: '2026-07-22',
    })
    const found = svc.getRecord(rec.id)
    expect(found).not.toBeNull()
    expect(found!.id).toBe(rec.id)
  })

  it('getRecord 返回 null 当记录不存在', () => {
    expect(svc.getRecord('nonexistent')).toBeNull()
  })

  it('listRecords 按 employeeId 筛选', () => {
    svc.clockIn({ employeeId: 'emp-x', employeeName: 'X', storeId: 's1', date: '2026-07-22' })
    svc.clockIn({ employeeId: 'emp-y', employeeName: 'Y', storeId: 's1', date: '2026-07-22' })
    svc.clockIn({ employeeId: 'emp-x', employeeName: 'X', storeId: 's2', date: '2026-07-23' })

    const result = svc.listRecords({ employeeId: 'emp-x' })
    expect(result.length).toBe(2)
    result.forEach(r => expect(r.employeeId).toBe('emp-x'))
  })

  it('listRecords 联合筛选 employeeId + date', () => {
    svc.clockIn({ employeeId: 'emp-z', employeeName: 'Z', storeId: 's1', date: '2026-07-22' })
    svc.clockIn({ employeeId: 'emp-z', employeeName: 'Z', storeId: 's1', date: '2026-07-23' })

    const result = svc.listRecords({ employeeId: 'emp-z', date: '2026-07-22' })
    expect(result.length).toBe(1)
    expect(result[0].date).toBe('2026-07-22')
  })
})

// ══════════════════════════════════════════════════════════════════
// 2️⃣ 请假申请 CRUD
// ══════════════════════════════════════════════════════════════════

describe('AttendanceService — 请假申请', () => {
  let svc: AttendanceService

  beforeEach(() => {
    svc = new AttendanceService()
  })

  it('创建请假 → status=pending, 字段完整', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-l1',
      employeeName: '请假员工',
      storeId: 'store-001',
      leaveType: 'annual',
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      reason: '年假旅行',
    })
    expect(leave.status).toBe('pending')
    expect(leave.leaveType).toBe('annual')
    expect(leave.id).toMatch(/^leave-/)
  })

  it('审批通过 → status=approved, approver 信息完整', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-l2', employeeName: '被审批员工',
      storeId: 'store-001', leaveType: 'sick',
      startDate: '2026-07-22', endDate: '2026-07-22', reason: '生病',
    })
    const approved = svc.approveLeave(leave.id, 'mgr-001', '王经理', 'approve', '同意')
    expect(approved.status).toBe('approved')
    expect(approved.approverId).toBe('mgr-001')
    expect(approved.approvalRemark).toBe('同意')
  })

  it('驳回请假 → status=rejected', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-l3', employeeName: '被拒员工',
      storeId: 'store-001', leaveType: 'personal',
      startDate: '2026-07-25', endDate: '2026-07-25', reason: '私事',
    })
    const rejected = svc.approveLeave(leave.id, 'mgr-002', '李经理', 'reject', '请补充材料')
    expect(rejected.status).toBe('rejected')
    expect(rejected.approvalRemark).toBe('请补充材料')
  })

  it('取消请假 → status=cancelled', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-l4', employeeName: '取消员工',
      storeId: 'store-001', leaveType: 'annual',
      startDate: '2026-08-10', endDate: '2026-08-11', reason: '计划变更',
    })
    const cancelled = svc.cancelLeave(leave.id)
    expect(cancelled.status).toBe('cancelled')
  })

  it('getLeave 返回 null 当请假不存在', () => {
    expect(svc.getLeave('leave-nonexistent')).toBeNull()
  })

  it('listLeaves 按状态筛选', () => {
    const svc2 = new AttendanceService() // fresh with seeds
    const pending = svc2.listLeaves({ status: 'pending' })
    expect(pending.length).toBeGreaterThanOrEqual(1)
    pending.forEach(l => expect(l.status).toBe('pending'))
  })
})

// ══════════════════════════════════════════════════════════════════
// 3️⃣ 边界/异常输入
// ══════════════════════════════════════════════════════════════════

describe('AttendanceService — 边界与异常', () => {
  let svc: AttendanceService

  beforeEach(() => {
    svc = new AttendanceService()
  })

  it('clockIn 缺少 employeeId 抛 BadRequestException', () => {
    expect(() => svc.clockIn({
      employeeId: '', employeeName: 'n', storeId: 's', date: '2026-07-22',
    })).toThrow(BadRequestException)
  })

  it('clockIn 缺少 employeeName 抛 BadRequestException', () => {
    expect(() => svc.clockIn({
      employeeId: 'emp', employeeName: '', storeId: 's', date: '2026-07-22',
    })).toThrow(BadRequestException)
  })

  it('clockOut 不存在的记录抛 BadRequestException', () => {
    expect(() => svc.clockOut('fake-id', '18:00')).toThrow(BadRequestException)
  })

  it('重复下班打卡抛 BadRequestException', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-dup', employeeName: '重复', storeId: 's', date: '2026-07-22',
    })
    svc.clockOut(rec.id, '18:00')
    expect(() => svc.clockOut(rec.id, '19:00')).toThrow(BadRequestException)
    expect(() => svc.clockOut(rec.id, '19:00')).toThrow(/already clocked out/)
  })

  it('审批不存在的请假抛 BadRequestException', () => {
    expect(() => svc.approveLeave('leave-missing', 'mgr', '经理', 'approve'))
      .toThrow(BadRequestException)
  })

  it('已审批的请假不可再次审批', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-dual-ap', employeeName: '双批', storeId: 's',
      leaveType: 'sick', startDate: '2026-07-25', endDate: '2026-07-25', reason: '病假',
    })
    svc.approveLeave(leave.id, 'm1', '经理1', 'approve')
    expect(() => svc.approveLeave(leave.id, 'm2', '经理2', 'approve'))
      .toThrow(BadRequestException)
  })

  it('已取消的请假不可重复取消', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-dup-cancel', employeeName: '取消员工', storeId: 's',
      leaveType: 'annual', startDate: '2026-08-01', endDate: '2026-08-02', reason: '取消',
    })
    svc.cancelLeave(leave.id)
    expect(() => svc.cancelLeave(leave.id)).toThrow(BadRequestException)
    expect(() => svc.cancelLeave(leave.id)).toThrow(/already cancelled/)
  })

  it('创建请假缺少 reason 抛 BadRequestException', () => {
    expect(() => svc.createLeave({
      employeeId: 'emp-nr', employeeName: '无理由', storeId: 's',
      leaveType: 'annual', startDate: '2026-08-01', endDate: '2026-08-01', reason: '',
    })).toThrow(BadRequestException)
  })

  it('未提供 clockIn 参数使用默认 09:00', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-def', employeeName: '默认', storeId: 's', date: '2026-07-22',
    })
    expect(rec.clockIn).toBe('09:00')
    expect(rec.status).toBe('normal')
  })
})

// ══════════════════════════════════════════════════════════════════
// 4️⃣ 考勤统计
// ══════════════════════════════════════════════════════════════════

describe('AttendanceService — 考勤统计', () => {
  let svc: AttendanceService

  beforeEach(() => {
    svc = new AttendanceService()
  })

  it('getSummary 统计正确', () => {
    svc.clockIn({ employeeId: 'emp-s1', employeeName: '员工1', storeId: 'st1', date: '2026-07-22', clockIn: '08:50' })
    svc.clockIn({ employeeId: 'emp-s2', employeeName: '员工2', storeId: 'st1', date: '2026-07-22', clockIn: '10:00' })

    const summary = svc.getSummary('daily', '2026-07-22', '2026-07-22')
    // seeds have 3 records, plus 2 we added
    expect(summary.totalEmployees).toBeGreaterThanOrEqual(2)
    // seeds have 1 normal + 1 late, plus our 1 normal + 1 late = 2 each
    expect(summary.normalCount).toBeGreaterThanOrEqual(1)
    expect(summary.lateCount).toBeGreaterThanOrEqual(1)
  })

  it('getSummary 按门店过滤', () => {
    svc.clockIn({ employeeId: 'emp-sa', employeeName: 'A', storeId: 'store-a', date: '2026-07-22' })
    svc.clockIn({ employeeId: 'emp-sb', employeeName: 'B', storeId: 'store-b', date: '2026-07-22' })

    const summary = svc.getSummary('daily', '2026-07-22', '2026-07-22', 'store-a')
    expect(summary.totalEmployees).toBe(1)
    expect(summary.byStore['store-a']).toBeDefined()
    expect(summary.byStore['store-b']).toBeUndefined()
  })

  it('getSummary 的 byStore 按门店汇总', () => {
    svc.clockIn({ employeeId: 'emp-m1', employeeName: '门店1-A', storeId: 'st1', date: '2026-07-22', clockIn: '08:50' })
    svc.clockIn({ employeeId: 'emp-m2', employeeName: '门店1-B', storeId: 'st1', date: '2026-07-22', clockIn: '09:30' })

    const summary = svc.getSummary('daily', '2026-07-22', '2026-07-22')
    expect(summary.byStore['st1'].totalEmployees).toBe(2)
    expect(summary.byStore['st1'].normalCount).toBe(1)
    expect(summary.byStore['st1'].lateCount).toBe(1)
  })

  it('离职工后下班 → 加班和早退不共存 (加班优先)', () => {
    const rec = svc.clockIn({ employeeId: 'emp-ot-early', employeeName: '加班早退', storeId: 'st1', date: '2026-07-22', clockIn: '09:00' })
    // 早退又加班: 18:00前打卡且超过18:00 ... 实际上不可能
    // 如果 17:30 下班 → 早退30分钟
    const out = svc.clockOut(rec.id, '17:30')
    expect(out.status).toBe('early_leave')
    expect(out.earlyLeaveMinutes).toBe(30)
    expect(out.overtimeMinutes).toBe(0)
  })

  it('中午12:00打卡 → late 180分钟', () => {
    const rec = svc.clockIn({ employeeId: 'emp-late-noon', employeeName: '中午打卡', storeId: 'st1', date: '2026-07-22', clockIn: '12:00' })
    expect(rec.status).toBe('late')
    expect(rec.lateMinutes).toBe(180)
  })
})
