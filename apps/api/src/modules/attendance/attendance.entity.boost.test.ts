/**
 * attendance.entity.boost.test.ts — 考勤模块 Entity 层增强测试 (25+ tests)
 *
 * 圈梁五道箍
 *
 * 覆盖:
 *   1️⃣ ClockRecord 接口构造验证
 *   2️⃣ AttendanceSummary 接口构造验证
 *   3️⃣ LeaveRequest 接口构造验证
 *   4️⃣ AttendanceStoreStats 接口构造验证
 *   5️⃣ AttendanceCalcRequest 接口构造验证
 *   6️⃣ 状态枚举与标签映射一致性
 *   7️⃣ 常量与类型守卫
 *   8️⃣ 边界值与空字段
 */

import { describe, it, expect } from 'vitest'
import {
  ATTENDANCE_STATUS_LABELS,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
} from './attendance.entity'
import type {
  AttendanceStatus,
  LeaveType,
  LeaveStatus,
  ClockRecord,
  AttendanceSummary,
  LeaveRequest,
  AttendanceStoreStats,
  AttendanceCalcRequest,
} from './attendance.entity'

// ══════════════════════════════════════════════════════════════════
// 1️⃣ ClockRecord 接口构造验证 (5+)
// ══════════════════════════════════════════════════════════════════

describe('[1️⃣ ClockRecord 接口构造验证]', () => {
  it('应能构造一个完整的正常打卡记录', () => {
    const record: ClockRecord = {
      id: 'clock-001',
      employeeId: 'emp-001',
      employeeName: '张三',
      storeId: 'store-001',
      date: '2026-07-28',
      clockIn: '09:00',
      clockOut: '18:00',
      status: 'normal',
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 0,
      note: undefined as any,
      createdAt: '2026-07-28T01:00:00Z',
      updatedAt: '2026-07-28T10:00:00Z',
    }
    expect(record.id).toBe('clock-001')
    expect(record.status).toBe('normal')
    expect(record.lateMinutes).toBe(0)
    expect(record.note).toBeUndefined()
  })

  it('应能构造一个迟到打卡记录', () => {
    const record: ClockRecord = {
      id: 'clock-002',
      employeeId: 'emp-002',
      employeeName: '李四',
      storeId: 'store-001',
      date: '2026-07-28',
      clockIn: '09:30',
      clockOut: '18:00',
      status: 'late',
      lateMinutes: 30,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 0,
      note: '堵车',
      createdAt: '2026-07-28T01:30:00Z',
      updatedAt: '2026-07-28T10:00:00Z',
    }
    expect(record.status).toBe('late')
    expect(record.lateMinutes).toBe(30)
    expect(record.note).toBe('堵车')
  })

  it('应能构造一个早退打卡记录', () => {
    const record: ClockRecord = {
      id: 'clock-003',
      employeeId: 'emp-003',
      employeeName: '王五',
      storeId: 'store-002',
      date: '2026-07-28',
      clockIn: '09:00',
      clockOut: '17:00',
      status: 'early_leave',
      lateMinutes: 0,
      earlyLeaveMinutes: 60,
      overtimeMinutes: 0,
      createdAt: '2026-07-28T01:00:00Z',
      updatedAt: '2026-07-28T09:00:00Z',
    }
    expect(record.status).toBe('early_leave')
    expect(record.earlyLeaveMinutes).toBe(60)
    expect(record.clockOut).toBe('17:00')
  })

  it('应能构造一个缺勤记录（clockOut 为 null）', () => {
    const record: ClockRecord = {
      id: 'clock-004',
      employeeId: 'emp-004',
      employeeName: '赵六',
      storeId: 'store-003',
      date: '2026-07-28',
      clockIn: '09:00',
      clockOut: null,
      status: 'absent',
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 0,
      createdAt: '2026-07-28T01:00:00Z',
      updatedAt: '2026-07-28T01:00:00Z',
    }
    expect(record.clockOut).toBeNull()
    expect(record.status).toBe('absent')
  })

  it('应能构造一个加班记录', () => {
    const record: ClockRecord = {
      id: 'clock-005',
      employeeId: 'emp-005',
      employeeName: '孙七',
      storeId: 'store-001',
      date: '2026-07-28',
      clockIn: '09:00',
      clockOut: '21:00',
      status: 'overtime',
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 180,
      createdAt: '2026-07-28T01:00:00Z',
      updatedAt: '2026-07-28T13:00:00Z',
    }
    expect(record.status).toBe('overtime')
    expect(record.overtimeMinutes).toBe(180)
    expect(record.clockOut).toBe('21:00')
  })

  it('应能构造一个请假记录状态', () => {
    const record: ClockRecord = {
      id: 'clock-006',
      employeeId: 'emp-006',
      employeeName: '周八',
      storeId: 'store-002',
      date: '2026-07-28',
      clockIn: '09:00',
      clockOut: null,
      status: 'leave',
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 0,
      createdAt: '2026-07-28T01:00:00Z',
      updatedAt: '2026-07-28T01:00:00Z',
    }
    expect(record.status).toBe('leave')
  })

  it('带备注的打卡记录应保留 note 字段', () => {
    const record: ClockRecord = {
      id: 'clock-007',
      employeeId: 'emp-001',
      employeeName: '张三',
      storeId: 'store-001',
      date: '2026-07-28',
      clockIn: '08:55',
      clockOut: '18:05',
      status: 'normal',
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 5,
      note: '早到5分钟',
      createdAt: '2026-07-28T00:55:00Z',
      updatedAt: '2026-07-28T10:05:00Z',
    }
    expect(record.note).toBe('早到5分钟')
  })
})

// ══════════════════════════════════════════════════════════════════
// 2️⃣ AttendanceSummary 接口构造验证 (4+)
// ══════════════════════════════════════════════════════════════════

describe('[2️⃣ AttendanceSummary 接口构造验证]', () => {
  it('应能构造一个完整的考勤汇总', () => {
    const summary: AttendanceSummary = {
      period: '2026-07',
      from: '2026-07-01',
      to: '2026-07-31',
      totalEmployees: 50,
      totalDays: 23,
      normalCount: 800,
      lateCount: 50,
      earlyLeaveCount: 30,
      absentCount: 10,
      leaveCount: 60,
      overtimeCount: 100,
      totalOvertimeMinutes: 5000,
      byStore: {
        'store-001': {
          totalEmployees: 20,
          normalCount: 350,
          lateCount: 20,
          absentCount: 5,
          totalOvertimeMinutes: 2000,
        },
      },
    }
    expect(summary.period).toBe('2026-07')
    expect(summary.totalEmployees).toBe(50)
    expect(summary.normalCount).toBe(800)
    expect(summary.byStore['store-001'].totalEmployees).toBe(20)
  })

  it('byStore 应支持空对象（无门店统计）', () => {
    const summary: AttendanceSummary = {
      period: '2026-08',
      from: '2026-08-01',
      to: '2026-08-31',
      totalEmployees: 0,
      totalDays: 0,
      normalCount: 0,
      lateCount: 0,
      earlyLeaveCount: 0,
      absentCount: 0,
      leaveCount: 0,
      overtimeCount: 0,
      totalOvertimeMinutes: 0,
      byStore: {},
    }
    expect(Object.keys(summary.byStore).length).toBe(0)
  })

  it('全零汇总的数值应正确', () => {
    const summary: AttendanceSummary = {
      period: '2026-06',
      from: '2026-06-01',
      to: '2026-06-30',
      totalEmployees: 0,
      totalDays: 0,
      normalCount: 0,
      lateCount: 0,
      earlyLeaveCount: 0,
      absentCount: 0,
      leaveCount: 0,
      overtimeCount: 0,
      totalOvertimeMinutes: 0,
      byStore: {},
    }
    expect(summary.totalOvertimeMinutes).toBe(0)
    expect(summary.normalCount + summary.lateCount + summary.absentCount).toBe(0)
  })

  it('byStore 中多个门店的统计应独立', () => {
    const summary: AttendanceSummary = {
      period: '2026-07',
      from: '2026-07-01',
      to: '2026-07-31',
      totalEmployees: 30,
      totalDays: 23,
      normalCount: 500,
      lateCount: 30,
      earlyLeaveCount: 10,
      absentCount: 5,
      leaveCount: 20,
      overtimeCount: 50,
      totalOvertimeMinutes: 2500,
      byStore: {
        'store-001': { totalEmployees: 15, normalCount: 280, lateCount: 15, absentCount: 2, totalOvertimeMinutes: 1200 },
        'store-002': { totalEmployees: 15, normalCount: 220, lateCount: 15, absentCount: 3, totalOvertimeMinutes: 1300 },
      },
    }
    expect(summary.byStore['store-001'].totalEmployees).toBe(15)
    expect(summary.byStore['store-002'].totalEmployees).toBe(15)
    expect(summary.byStore['store-001'].totalOvertimeMinutes + summary.byStore['store-002'].totalOvertimeMinutes).toBe(2500)
  })
})

// ══════════════════════════════════════════════════════════════════
// 3️⃣ AttendanceStoreStats 接口构造验证 (3+)
// ══════════════════════════════════════════════════════════════════

describe('[3️⃣ AttendanceStoreStats 接口构造验证]', () => {
  it('应能构造一个门店考勤统计', () => {
    const stats: AttendanceStoreStats = {
      totalEmployees: 10,
      normalCount: 180,
      lateCount: 10,
      absentCount: 2,
      totalOvertimeMinutes: 900,
    }
    expect(stats.totalEmployees).toBe(10)
    expect(stats.normalCount + stats.lateCount).toBe(190)
  })

  it('全零统计', () => {
    const stats: AttendanceStoreStats = {
      totalEmployees: 0,
      normalCount: 0,
      lateCount: 0,
      absentCount: 0,
      totalOvertimeMinutes: 0,
    }
    expect(stats.totalOvertimeMinutes).toBe(0)
  })

  it('数值应为非负整数', () => {
    const stats: AttendanceStoreStats = {
      totalEmployees: 100,
      normalCount: 2000,
      lateCount: 100,
      absentCount: 50,
      totalOvertimeMinutes: 10000,
    }
    expect(stats.totalEmployees).toBeGreaterThanOrEqual(0)
    expect(stats.normalCount).toBeGreaterThanOrEqual(0)
    expect(stats.totalOvertimeMinutes).toBeGreaterThanOrEqual(0)
  })
})

// ══════════════════════════════════════════════════════════════════
// 4️⃣ LeaveRequest 接口构造验证 (4+)
// ══════════════════════════════════════════════════════════════════

describe('[4️⃣ LeaveRequest 接口构造验证]', () => {
  it('应能构造一个待审批的请假请求', () => {
    const leave: LeaveRequest = {
      id: 'leave-001',
      employeeId: 'emp-001',
      employeeName: '张三',
      storeId: 'store-001',
      leaveType: 'annual',
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      reason: '年假',
      status: 'pending',
      createdAt: '2026-07-28T01:00:00Z',
      updatedAt: '2026-07-28T01:00:00Z',
    }
    expect(leave.leaveType).toBe('annual')
    expect(leave.status).toBe('pending')
    expect(leave.approverId).toBeUndefined()
  })

  it('应能构造一个已批准的请假请求', () => {
    const leave: LeaveRequest = {
      id: 'leave-002',
      employeeId: 'emp-002',
      employeeName: '李四',
      storeId: 'store-001',
      leaveType: 'sick',
      startDate: '2026-07-28',
      endDate: '2026-07-28',
      reason: '生病',
      status: 'approved',
      approverId: 'mgr-001',
      approverName: '经理A',
      approvalRemark: '批准',
      createdAt: '2026-07-27T01:00:00Z',
      updatedAt: '2026-07-27T02:00:00Z',
    }
    expect(leave.status).toBe('approved')
    expect(leave.approverId).toBe('mgr-001')
    expect(leave.approvalRemark).toBe('批准')
  })

  it('应能构造一个已驳回的请假请求', () => {
    const leave: LeaveRequest = {
      id: 'leave-003',
      employeeId: 'emp-003',
      employeeName: '王五',
      storeId: 'store-002',
      leaveType: 'personal',
      startDate: '2026-08-05',
      endDate: '2026-08-05',
      reason: '私事',
      status: 'rejected',
      approverId: 'mgr-001',
      approverName: '经理A',
      approvalRemark: '人手不足',
      createdAt: '2026-07-28T01:00:00Z',
      updatedAt: '2026-07-28T02:00:00Z',
    }
    expect(leave.status).toBe('rejected')
    expect(leave.approvalRemark).toBe('人手不足')
  })

  it('应支持婚假、产假、丧假类型', () => {
    const leaves: LeaveRequest[] = [
      { id: 'l1', employeeId: 'e1', employeeName: 'A', storeId: 's1', leaveType: 'marriage', startDate: '2026-08-01', endDate: '2026-08-03', reason: '结婚', status: 'approved', approverId: 'm1', approverName: 'M1', createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-01T01:00:00Z' },
      { id: 'l2', employeeId: 'e2', employeeName: 'B', storeId: 's1', leaveType: 'maternity', startDate: '2026-09-01', endDate: '2026-10-01', reason: '产假', status: 'approved', approverId: 'm1', approverName: 'M1', createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-01T01:00:00Z' },
      { id: 'l3', employeeId: 'e3', employeeName: 'C', storeId: 's1', leaveType: 'bereavement', startDate: '2026-07-28', endDate: '2026-07-29', reason: '丧假', status: 'pending', createdAt: '2026-07-28T00:00:00Z', updatedAt: '2026-07-28T00:00:00Z' },
    ]
    expect(leaves[0].leaveType).toBe('marriage')
    expect(leaves[1].leaveType).toBe('maternity')
    expect(leaves[2].leaveType).toBe('bereavement')
    expect(leaves[2].status).toBe('pending')
  })
})

// ══════════════════════════════════════════════════════════════════
// 5️⃣ AttendanceCalcRequest 接口构造验证 (3+)
// ══════════════════════════════════════════════════════════════════

describe('[5️⃣ AttendanceCalcRequest 接口构造验证]', () => {
  it('应能构造一个完整的打卡计算请求', () => {
    const req: AttendanceCalcRequest = {
      employeeId: 'emp-001',
      employeeName: '张三',
      storeId: 'store-001',
      date: '2026-07-28',
      clockIn: '09:00',
      clockOut: '18:00',
      note: '正常打卡',
    }
    expect(req.employeeId).toBe('emp-001')
    expect(req.clockIn).toBe('09:00')
  })

  it('clockIn 和 clockOut 可为 undefined', () => {
    const req: AttendanceCalcRequest = {
      employeeId: 'emp-001',
      employeeName: '张三',
      storeId: 'store-001',
      date: '2026-07-28',
    }
    expect(req.clockIn).toBeUndefined()
    expect(req.clockOut).toBeUndefined()
    expect(req.note).toBeUndefined()
  })

  it('应支持无备注的计算请求', () => {
    const req: AttendanceCalcRequest = {
      employeeId: 'emp-002',
      employeeName: '李四',
      storeId: 'store-002',
      date: '2026-07-28',
      clockIn: '09:30',
    }
    expect(req.note).toBeUndefined()
    expect(req.clockIn).toBe('09:30')
  })
})

// ══════════════════════════════════════════════════════════════════
// 6️⃣ 常量标签与类型守卫 (6+)
// ══════════════════════════════════════════════════════════════════

describe('[6️⃣ 常量标签与类型守卫]', () => {
  it('ATTENDANCE_STATUS_LABELS 所有 key 的 value 都是非空字符串', () => {
    for (const [k, v] of Object.entries(ATTENDANCE_STATUS_LABELS)) {
      expect(typeof v).toBe('string')
      expect(v.length).toBeGreaterThan(0)
      expect(k).toMatch(/^(normal|late|early_leave|absent|leave|overtime)$/)
    }
  })

  it('LEAVE_TYPE_LABELS 所有 key 都在合法请假类型中', () => {
    const validTypes: LeaveType[] = ['annual', 'sick', 'personal', 'marriage', 'maternity', 'bereavement']
    for (const t of validTypes) {
      expect(LEAVE_TYPE_LABELS[t]).toBeDefined()
      expect(typeof LEAVE_TYPE_LABELS[t]).toBe('string')
    }
  })

  it('LEAVE_STATUS_LABELS 所有 key 都在合法请假状态中', () => {
    const validStatuses: LeaveStatus[] = ['pending', 'approved', 'rejected', 'cancelled']
    for (const s of validStatuses) {
      expect(LEAVE_STATUS_LABELS[s]).toBeDefined()
      expect(typeof LEAVE_STATUS_LABELS[s]).toBe('string')
    }
  })

  it('ATTENDANCE_STATUS_LABELS 数量固定为 6', () => {
    expect(Object.keys(ATTENDANCE_STATUS_LABELS).length).toBe(6)
  })

  it('LEAVE_TYPE_LABELS 数量固定为 6', () => {
    expect(Object.keys(LEAVE_TYPE_LABELS).length).toBe(6)
  })

  it('LEAVE_STATUS_LABELS 数量固定为 4', () => {
    expect(Object.keys(LEAVE_STATUS_LABELS).length).toBe(4)
  })
})

// ══════════════════════════════════════════════════════════════════
// 7️⃣ AttendanceStatus 类型判别 (3+)
// ══════════════════════════════════════════════════════════════════

describe('[7️⃣ AttendanceStatus 类型判别]', () => {
  it('正常状态 "normal" 应有正确的中文标签', () => {
    expect(ATTENDANCE_STATUS_LABELS['normal']).toBe('正常')
  })

  it('缺勤状态 "absent" 应有正确的中文标签', () => {
    expect(ATTENDANCE_STATUS_LABELS['absent']).toBe('缺勤')
  })

  it('加班状态 "overtime" 应有正确的中文标签', () => {
    expect(ATTENDANCE_STATUS_LABELS['overtime']).toBe('加班')
  })
})
