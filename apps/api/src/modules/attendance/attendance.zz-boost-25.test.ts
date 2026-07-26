/**
 * attendance.zz-boost-25.test.ts — 考勤模块增强测试套件 (25+ tests)
 *
 * 覆盖率:
 *   1️⃣ Entity 类型 + 常量标签 (5+)
 *   2️⃣ Service clockIn/clockOut/leave/summary 核心 (10+)
 *   3️⃣ 边界条件 / 异常路径 (5+)
 *   4️⃣ Controller HTTP 响应模拟 (3+)
 *   5️⃣ 多条件筛选组合场景 (2+)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AttendanceService } from './attendance.service'
import { AttendanceController } from './attendance.controller'
import { BadRequestException } from '@nestjs/common'
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
  LeaveRequest,
  AttendanceSummary,
} from './attendance.entity'

// ══════════════════════════════════════════════════════════════════
// 1️⃣ Entity 类型 + 常量标签测试 (5+)
// ══════════════════════════════════════════════════════════════════

describe('[1️⃣ Entity 常量与类型标签]', () => {

  // Test 1: ATTENDANCE_STATUS_LABELS — 覆盖全部 6 个状态
  it('ATTENDANCE_STATUS_LABELS 包含全部 6 种考勤状态的中文标签', () => {
    expect(Object.keys(ATTENDANCE_STATUS_LABELS)).toEqual([
      'normal', 'late', 'early_leave', 'absent', 'leave', 'overtime',
    ])
    expect(ATTENDANCE_STATUS_LABELS.normal).toBe('正常')
    expect(ATTENDANCE_STATUS_LABELS.late).toBe('迟到')
    expect(ATTENDANCE_STATUS_LABELS.early_leave).toBe('早退')
    expect(ATTENDANCE_STATUS_LABELS.absent).toBe('缺勤')
    expect(ATTENDANCE_STATUS_LABELS.leave).toBe('请假')
    expect(ATTENDANCE_STATUS_LABELS.overtime).toBe('加班')
  })

  // Test 2: LEAVE_TYPE_LABELS — 覆盖全部 6 种请假类型
  it('LEAVE_TYPE_LABELS 包含全部 6 种请假类型的中文标签', () => {
    expect(Object.keys(LEAVE_TYPE_LABELS)).toEqual([
      'annual', 'sick', 'personal', 'marriage', 'maternity', 'bereavement',
    ])
    expect(LEAVE_TYPE_LABELS.annual).toBe('年假')
    expect(LEAVE_TYPE_LABELS.sick).toBe('病假')
    expect(LEAVE_TYPE_LABELS.personal).toBe('事假')
    expect(LEAVE_TYPE_LABELS.marriage).toBe('婚假')
    expect(LEAVE_TYPE_LABELS.maternity).toBe('产假')
    expect(LEAVE_TYPE_LABELS.bereavement).toBe('丧假')
  })

  // Test 3: LEAVE_STATUS_LABELS — 覆盖全部 4 种请假状态
  it('LEAVE_STATUS_LABELS 包含全部 4 种请假状态的中文标签', () => {
    expect(Object.keys(LEAVE_STATUS_LABELS)).toEqual([
      'pending', 'approved', 'rejected', 'cancelled',
    ])
    expect(LEAVE_STATUS_LABELS.pending).toBe('待审批')
    expect(LEAVE_STATUS_LABELS.approved).toBe('已通过')
    expect(LEAVE_STATUS_LABELS.rejected).toBe('已驳回')
    expect(LEAVE_STATUS_LABELS.cancelled).toBe('已取消')
  })

  // Test 4: AttendanceStatus 类型判别 — 有效值集合验证
  it('所有 ATTENDANCE_STATUS_LABELS 的 key 都是合法的 AttendanceStatus', () => {
    const validStatuses: AttendanceStatus[] = ['normal', 'late', 'early_leave', 'absent', 'leave', 'overtime']
    for (const s of validStatuses) {
      // 每个合法 status 都有中文标签
      expect(ATTENDANCE_STATUS_LABELS[s]).toBeDefined()
      expect(typeof ATTENDANCE_STATUS_LABELS[s]).toBe('string')
    }
    // 确保每个覆盖到的 status 都在合法集合中
    const keys = Object.keys(ATTENDANCE_STATUS_LABELS) as AttendanceStatus[]
    for (const k of keys) {
      expect(validStatuses).toContain(k)
    }
  })

  // Test 5: 常量不可变 — Object.freeze 语义验证 (实际未 freeze，但验证无 enum 侵入)
  it('常量标签对象不应有意外属性', () => {
    const illegalKeys = ['unknown' as keyof typeof ATTENDANCE_STATUS_LABELS]
    for (const key of illegalKeys) {
      expect(ATTENDANCE_STATUS_LABELS).not.toHaveProperty(key)
    }
  })

  // Test 6: ClockRecord 接口结构推断 — 通过实例验证
  it('ClockRecord 接口字段齐全', () => {
    // 通过 service 创建完整记录来验证接口字段
    const svc = new AttendanceService()
    const rec = svc.clockIn({
      employeeId: 'emp-iface',
      employeeName: '接口测试',
      storeId: 'store-test',
      date: '2026-07-27',
      clockIn: '09:00',
      note: '结构验证',
    })
    // 必须包含的字段
    expect(rec).toHaveProperty('id')
    expect(rec).toHaveProperty('employeeId')
    expect(rec).toHaveProperty('employeeName')
    expect(rec).toHaveProperty('storeId')
    expect(rec).toHaveProperty('date')
    expect(rec).toHaveProperty('clockIn')
    expect(rec).toHaveProperty('clockOut')
    expect(rec).toHaveProperty('status')
    expect(rec).toHaveProperty('lateMinutes')
    expect(rec).toHaveProperty('earlyLeaveMinutes')
    expect(rec).toHaveProperty('overtimeMinutes')
    expect(rec).toHaveProperty('note')
    expect(rec).toHaveProperty('createdAt')
    expect(rec).toHaveProperty('updatedAt')
  })

  // Test 7: LeaveRequest 接口字段齐全
  it('LeaveRequest 接口字段齐全', () => {
    const svc = new AttendanceService()
    const leave = svc.createLeave({
      employeeId: 'emp-lr',
      employeeName: '请假接口验证',
      storeId: 'store-test',
      leaveType: 'annual',
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      reason: '测试接口结构',
    })
    expect(leave).toHaveProperty('id')
    expect(leave).toHaveProperty('employeeId')
    expect(leave).toHaveProperty('employeeName')
    expect(leave).toHaveProperty('storeId')
    expect(leave).toHaveProperty('leaveType')
    expect(leave).toHaveProperty('startDate')
    expect(leave).toHaveProperty('endDate')
    expect(leave).toHaveProperty('reason')
    expect(leave).toHaveProperty('status')
    expect(leave).toHaveProperty('createdAt')
    expect(leave).toHaveProperty('updatedAt')
  })

  // Test 8: AttendanceSummary 接口字段齐全 (from getSummary)
  it('AttendanceSummary 接口包含必填的汇总字段', () => {
    const svc = new AttendanceService()
    const summary = svc.getSummary('daily', '2026-07-20', '2026-07-20')
    expect(summary).toHaveProperty('period')
    expect(summary).toHaveProperty('from')
    expect(summary).toHaveProperty('to')
    expect(summary).toHaveProperty('totalEmployees')
    expect(summary).toHaveProperty('totalDays')
    expect(summary).toHaveProperty('normalCount')
    expect(summary).toHaveProperty('lateCount')
    expect(summary).toHaveProperty('earlyLeaveCount')
    expect(summary).toHaveProperty('absentCount')
    expect(summary).toHaveProperty('leaveCount')
    expect(summary).toHaveProperty('overtimeCount')
    expect(summary).toHaveProperty('totalOvertimeMinutes')
    expect(summary).toHaveProperty('byStore')
  })
})

// ══════════════════════════════════════════════════════════════════
// 2️⃣ Service clockIn/clockOut/leave/summary 核心 (10+)
// ══════════════════════════════════════════════════════════════════

describe('[2️⃣ Service 核心业务逻辑]', () => {
  let svc: AttendanceService

  beforeEach(() => {
    svc = new AttendanceService()
  })

  // Test 9: clockIn → 完整链条 (打卡→下班→最终状态)
  it('clockIn + clockOut 完整链条: 正常上班正常下班', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-chain',
      employeeName: '链条员工',
      storeId: 'store-chain',
      date: '2026-07-27',
      clockIn: '08:50',
    })
    expect(rec.status).toBe('normal')
    expect(rec.lateMinutes).toBe(0)

    const out = svc.clockOut(rec.id, '18:05')
    expect(out.clockOut).toBe('18:05')
    expect(out.status).toBe('overtime')
    expect(out.earlyLeaveMinutes).toBe(0)
    expect(out.overtimeMinutes).toBe(5)
  })

  // Test 10: clockIn → 迟到 + 加班 (迟到员工加班)
  it('迟到员工加班 → status=overtime, lateMinutes>0, overtimeMinutes>0', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-late-ot',
      employeeName: '迟到加班',
      storeId: 'store-001',
      date: '2026-07-27',
      clockIn: '10:30',
    })
    expect(rec.status).toBe('late')
    expect(rec.lateMinutes).toBe(90)

    const out = svc.clockOut(rec.id, '20:30')
    expect(out.status).toBe('overtime') // 加班优先于迟到
    expect(out.overtimeMinutes).toBe(150)
    expect(out.earlyLeaveMinutes).toBe(0)
  })

  // Test 11: createLeave + approveLeave + cancelLeave 完整生命周期
  it('请假完整生命周期: 创建→审批→取消', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-lifecycle',
      employeeName: '生命周期员工',
      storeId: 'store-001',
      leaveType: 'personal',
      startDate: '2026-08-05',
      endDate: '2026-08-05',
      reason: '私事',
    })
    expect(leave.status).toBe('pending')

    const approved = svc.approveLeave(leave.id, 'mgr-life', '生命周期经理', 'approve', '已批准')
    expect(approved.status).toBe('approved')

    // 已审批的请假再取消
    const cancelled = svc.cancelLeave(leave.id)
    expect(cancelled.status).toBe('cancelled')

    // 最终验证
    const final = svc.getLeave(leave.id)
    expect(final!.status).toBe('cancelled')
  })

  // Test 12: createLeave + rejectLeave 路径
  it('请假驳回路径: 创建→驳回', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-reject',
      employeeName: '驳回员工',
      storeId: 'store-002',
      leaveType: 'sick',
      startDate: '2026-07-28',
      endDate: '2026-07-28',
      reason: '病假',
    })
    const rejected = svc.approveLeave(leave.id, 'mgr-rej', '驳回经理', 'reject', '材料不全')
    expect(rejected.status).toBe('rejected')
    expect(rejected.approvalRemark).toBe('材料不全')
    expect(rejected.approverName).toBe('驳回经理')
  })

  // Test 13: getSummary — 汇总中各状态加总等于 totalDays
  it('getSummary 汇总计数一致性: 各状态之和 = totalDays', () => {
    // 清除种子数据影响: 创建一个干净服务
    const cleanSvc = new AttendanceService()
    // 创建 5 条记录，各状态分布
    cleanSvc.clockIn({ employeeId: 'e1', employeeName: 'E1', storeId: 's1', date: '2026-07-21', clockIn: '09:00' })
    cleanSvc.clockIn({ employeeId: 'e2', employeeName: 'E2', storeId: 's1', date: '2026-07-21', clockIn: '10:00' })
    cleanSvc.clockIn({ employeeId: 'e3', employeeName: 'E3', storeId: 's1', date: '2026-07-21', clockIn: '09:00' })
    cleanSvc.clockIn({ employeeId: 'e4', employeeName: 'E4', storeId: 's1', date: '2026-07-21', clockIn: '11:00' })
    cleanSvc.clockIn({ employeeId: 'e5', employeeName: 'E5', storeId: 's1', date: '2026-07-21', clockIn: '09:00' })

    const recs = cleanSvc.listRecords({ date: '2026-07-21', storeId: 's1' })
    cleanSvc.clockOut(recs.find(r => r.employeeId === 'e1')!.id, '18:00') // normal → normal
    cleanSvc.clockOut(recs.find(r => r.employeeId === 'e3')!.id, '16:00') // normal → early_leave
    cleanSvc.clockOut(recs.find(r => r.employeeId === 'e5')!.id, '20:00') // normal → overtime

    const summary = cleanSvc.getSummary('daily', '2026-07-21', '2026-07-21', 's1')
    const sumStatuses = summary.normalCount + summary.lateCount + summary.earlyLeaveCount +
                        summary.absentCount + summary.leaveCount + summary.overtimeCount
    // e1=normal, e2=late, e3=early_leave, e4=late, e5=overtime
    expect(summary.normalCount).toBe(1)   // e1
    expect(summary.lateCount).toBe(2)     // e2, e4
    expect(summary.earlyLeaveCount).toBe(1) // e3
    expect(summary.overtimeCount).toBe(1)  // e5
    expect(sumStatuses).toBe(summary.totalDays)
  })

  // Test 14: getSummary — 加班总时长精确累加
  it('getSummary totalOvertimeMinutes 精确累加', () => {
    const svc1 = new AttendanceService()
    const r1 = svc1.clockIn({ employeeId: 'ot-a', employeeName: 'OT-A', storeId: 'st-ot', date: '2026-07-22', clockIn: '09:00' })
    const r2 = svc1.clockIn({ employeeId: 'ot-b', employeeName: 'OT-B', storeId: 'st-ot', date: '2026-07-22', clockIn: '09:00' })
    const r3 = svc1.clockIn({ employeeId: 'ot-c', employeeName: 'OT-C', storeId: 'st-ot', date: '2026-07-22', clockIn: '09:00' })

    svc1.clockOut(r1.id, '19:00') // 60 min
    svc1.clockOut(r2.id, '21:30') // 210 min
    svc1.clockOut(r3.id, '18:00') // 0 min

    const summary = svc1.getSummary('daily', '2026-07-22', '2026-07-22', 'st-ot')
    expect(summary.totalOvertimeMinutes).toBe(60 + 210)
  })

  // Test 15: listRecords — 复杂查询 (storeId + status + date range)
  it('listRecords 多字段 + 日期范围联合查询', () => {
    const svc2 = new AttendanceService()
    // 种子数据有 store-001 门店的几条记录，我们在此基础上查询
    // store-001, status=late, date>=2026-07-20, date<=2026-07-20
    const result = svc2.listRecords({
      storeId: 'store-001',
      status: 'late',
      from: '2026-07-20',
      to: '2026-07-20',
    })
    expect(result.length).toBe(1)
    expect(result[0].employeeName).toBe('李四')
  })

  // Test 16: listLeaves — 复杂查询 (employeeId + storeId + status)
  it('listLeaves 三字段联合筛选 (employeeId + storeId + status)', () => {
    const svc2 = new AttendanceService()
    // 种子数据: 张三(emp-001) 有 approved 年假
    const result = svc2.listLeaves({
      employeeId: 'emp-001',
      storeId: 'store-001',
      status: 'approved',
    })
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('leave-seed-001')
  })

  // Test 17: getRecord / getLeave 返回正确类型
  it('getRecord 返回的 ClockRecord 字段类型正确', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-typecheck',
      employeeName: '类型检查',
      storeId: 's-type',
      date: '2026-07-27',
      clockIn: '09:00',
    })
    expect(typeof rec.id).toBe('string')
    expect(typeof rec.lateMinutes).toBe('number')
    expect(typeof rec.overtimeMinutes).toBe('number')
    expect(typeof rec.status).toBe('string')
    expect(typeof rec.createdAt).toBe('string')
  })

  // Test 18: 种子数据 listRecords 基础
  it('种子数据 listRecords 无过滤返回所有记录', () => {
    const svc2 = new AttendanceService()
    const all = svc2.listRecords()
    expect(all.length).toBeGreaterThanOrEqual(3)
    expect(all.some(r => r.id === 'rec-seed-001')).toBe(true)
    expect(all.some(r => r.id === 'rec-seed-002')).toBe(true)
    expect(all.some(r => r.id === 'rec-seed-003')).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════════
// 3️⃣ 边界条件 / 异常路径 (5+)
// ══════════════════════════════════════════════════════════════════

describe('[3️⃣ 边界条件与异常路径]', () => {
  let svc: AttendanceService

  beforeEach(() => {
    svc = new AttendanceService()
  })

  // Test 19: clockIn 缺少 storeId
  it('clockIn 缺少 storeId 抛 BadRequestException', () => {
    expect(() => svc.clockIn({
      employeeId: 'emp',
      employeeName: 'n',
      storeId: '',
      date: '2026-07-27',
    })).toThrow(BadRequestException)
  })

  // Test 20: clockIn 缺少 date
  it('clockIn 缺少 date 抛 BadRequestException', () => {
    expect(() => svc.clockIn({
      employeeId: 'emp',
      employeeName: 'n',
      storeId: 's',
      date: '',
    })).toThrow(BadRequestException)
  })

  // Test 21: 17:59 下班 → 早退1分钟（边界测试）
  it('clockOut 17:59 → earlyLeaveMinutes=1, status=early_leave', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-59',
      employeeName: '59分下班',
      storeId: 's',
      date: '2026-07-27',
      clockIn: '09:00',
    })
    const out = svc.clockOut(rec.id, '17:59')
    expect(out.earlyLeaveMinutes).toBe(1)
    expect(out.overtimeMinutes).toBe(0)
    expect(out.status).toBe('early_leave')
  })

  // Test 22: 18:01 下班 → 加班1分钟（边界测试）
  it('clockOut 18:01 → overtimeMinutes=1, status=overtime', () => {
    const rec = svc.clockIn({
      employeeId: 'emp-01',
      employeeName: '01分下班',
      storeId: 's',
      date: '2026-07-27',
      clockIn: '09:00',
    })
    const out = svc.clockOut(rec.id, '18:01')
    expect(out.overtimeMinutes).toBe(1)
    expect(out.earlyLeaveMinutes).toBe(0)
    expect(out.status).toBe('overtime')
  })

  // Test 23: 批准不存在的请假
  it('approveLeave 不存在的 ID 抛 BadRequestException', () => {
    expect(() => svc.approveLeave('leave-not-exist', 'mgr', '经理', 'approve'))
      .toThrow(BadRequestException)
    expect(() => svc.approveLeave('', 'mgr', '经理', 'approve'))
      .toThrow(BadRequestException)
  })

  // Test 24: 取消已取消的请假
  it('cancelLeave 双重取消抛 BadRequestException', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-dbl',
      employeeName: '双重取消',
      storeId: 's',
      leaveType: 'annual',
      startDate: '2026-08-01',
      endDate: '2026-08-01',
      reason: '测试',
    })
    svc.cancelLeave(leave.id)
    expect(() => svc.cancelLeave(leave.id)).toThrow(BadRequestException)
    expect(() => svc.cancelLeave(leave.id)).toThrow(/already cancelled/)
  })

  // Test 25: 已驳回的请假不可再次操作
  it('已驳回的请假再次审批抛 BadRequestException', () => {
    const leave = svc.createLeave({
      employeeId: 'emp-rej-again',
      employeeName: '驳回后再次审批',
      storeId: 's',
      leaveType: 'sick',
      startDate: '2026-07-28',
      endDate: '2026-07-28',
      reason: '测试',
    })
    svc.approveLeave(leave.id, 'm1', '经理', 'reject')
    expect(() => svc.approveLeave(leave.id, 'm2', '经理2', 'approve'))
      .toThrow(BadRequestException)
  })
})

// ══════════════════════════════════════════════════════════════════
// 4️⃣ Controller HTTP 响应模拟 (3+)
// ══════════════════════════════════════════════════════════════════

describe('[4️⃣ Controller HTTP 响应模拟]', () => {
  let controller: AttendanceController
  let mockService: AttendanceService

  beforeEach(() => {
    mockService = new AttendanceService()
    controller = new AttendanceController(mockService)
  })

  // Test 26: POST clock-in 返回完整 ClockRecord
  it('POST /attendance/clock-in → 返回 clockIn 结果', () => {
    const result = controller.clockIn({
      employeeId: 'emp-ctrl',
      employeeName: '控制器员工',
      storeId: 'store-c',
      date: '2026-07-27',
      clockIn: '09:00',
    })
    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('status', 'normal')
    expect(result).toHaveProperty('employeeName', '控制器员工')
    expect(result).not.toBeNull()
  })

  // Test 27: POST records → 返回列表 (有过滤)
  it('POST /attendance/records → 返回筛选列表', () => {
    const result = controller.records({ storeId: 'store-001' })
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThanOrEqual(2)
    for (const rec of result) {
      expect(rec.storeId).toBe('store-001')
    }
  })

  // Test 28: POST summary → 返回 AttendanceSummary
  it('POST /attendance/summary → 返回 summary 对象', () => {
    const result = controller.summary({
      period: 'daily',
      from: '2026-07-20',
      to: '2026-07-20',
    })
    expect(result).toHaveProperty('period', 'daily')
    expect(result).toHaveProperty('totalEmployees')
    expect(result).toHaveProperty('byStore')
    expect(typeof result.totalEmployees).toBe('number')
    expect(typeof result.totalOvertimeMinutes).toBe('number')
  })

  // Test 29: POST leave/approve → 返回已审批 LeaveRequest
  it('POST /attendance/leave/approve → 返回 approved LeaveRequest', () => {
    // 先通过 service 创建一个 pending 的请假
    const leave = mockService.createLeave({
      employeeId: 'emp-ctrl-l',
      employeeName: '控制器请假',
      storeId: 'store-c',
      leaveType: 'annual',
      startDate: '2026-08-10',
      endDate: '2026-08-12',
      reason: '控制器测试请假',
    })
    const result = controller.leaveApprove({
      id: leave.id,
      approverId: 'ctrl-mgr',
      approverName: '控制器经理',
      remark: '同意',
    })
    expect(result.status).toBe('approved')
    expect(result.approverId).toBe('ctrl-mgr')
    expect(result.approvalRemark).toBe('同意')
  })

  // Test 30: POST leave/reject → 返回 rejected LeaveRequest
  it('POST /attendance/leave/reject → 返回 rejected LeaveRequest', () => {
    const leave = mockService.createLeave({
      employeeId: 'emp-ctrl-r',
      employeeName: '控制器驳回',
      storeId: 'store-c',
      leaveType: 'sick',
      startDate: '2026-07-28',
      endDate: '2026-07-28',
      reason: '病假测试',
    })
    const result = controller.leaveReject({
      id: leave.id,
      approverId: 'ctrl-mgr',
      approverName: '控制器经理',
      remark: '驳回原因',
    })
    expect(result.status).toBe('rejected')
    expect(result.approvalRemark).toBe('驳回原因')
  })
})

// ══════════════════════════════════════════════════════════════════
// 5️⃣ 多条件筛选组合场景 (2+)
// ══════════════════════════════════════════════════════════════════

describe('[5️⃣ 多条件筛选组合场景]', () => {
  let svc: AttendanceService

  beforeEach(() => {
    svc = new AttendanceService()
  })

  // Test 31: listRecords — 三层筛选 (storeId + status + date)
  it('listRecords storeId + status + date 三层筛选', () => {
    // 创建多个不同门店/不同状态的记录
    svc.clockIn({ employeeId: 'e1', employeeName: 'E1', storeId: 's1', date: '2026-07-25', clockIn: '09:00' })
    svc.clockIn({ employeeId: 'e2', employeeName: 'E2', storeId: 's1', date: '2026-07-25', clockIn: '10:00' }) // late
    svc.clockIn({ employeeId: 'e3', employeeName: 'E3', storeId: 's2', date: '2026-07-25', clockIn: '10:00' }) // late, 不同门店
    svc.clockIn({ employeeId: 'e4', employeeName: 'E4', storeId: 's1', date: '2026-07-26', clockIn: '10:00' }) // late, 不同日期

    // 筛选: s1 + late + 2026-07-25
    const result = svc.listRecords({
      storeId: 's1',
      status: 'late',
      date: '2026-07-25',
    })
    expect(result.length).toBe(1)
    expect(result[0].employeeId).toBe('e2')
  })

  // Test 32: listRecords — 两层筛选 (from + to) + storeId
  it('listRecords date range + storeId 联合筛选', () => {
    svc.clockIn({ employeeId: 'e5', employeeName: 'E5', storeId: 's5', date: '2026-07-20', clockIn: '09:00' })
    svc.clockIn({ employeeId: 'e6', employeeName: 'E6', storeId: 's5', date: '2026-07-21', clockIn: '09:00' })
    svc.clockIn({ employeeId: 'e7', employeeName: 'E7', storeId: 's5', date: '2026-07-22', clockIn: '09:00' })
    svc.clockIn({ employeeId: 'e8', employeeName: 'E8', storeId: 's6', date: '2026-07-21', clockIn: '09:00' })

    // 只筛选 s5 门店 + 日期范围
    const result = svc.listRecords({
      storeId: 's5',
      from: '2026-07-20',
      to: '2026-07-21',
    })

    // s5 在 7月20日和21日的记录
    expect(result.length).toBe(2)
    expect(result.map(r => r.employeeId).sort()).toEqual(['e5', 'e6'])
  })

  // Test 33: listLeaves — 员工 + 状态组合
  it('listLeaves employeeId + storeId + status 三层组合排除', () => {
    const l1 = svc.createLeave({
      employeeId: 'emp-combo1', employeeName: '组合1', storeId: 's1',
      leaveType: 'annual', startDate: '2026-08-01', endDate: '2026-08-02', reason: 'r1',
    })
    svc.createLeave({
      employeeId: 'emp-combo2', employeeName: '组合2', storeId: 's1',
      leaveType: 'sick', startDate: '2026-08-03', endDate: '2026-08-03', reason: 'r2',
    })
    svc.approveLeave(l1.id, 'mgr-a', '经理甲', 'approve', 'ok')

    const result = svc.listLeaves({ employeeId: 'emp-combo1', storeId: 's1', status: 'approved' })
    expect(result.length).toBe(1)
    expect(result[0].leaveType).toBe('annual')
  })
})
