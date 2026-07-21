/**
 * 考勤管理 - Service (V23)
 *
 * 核心能力:
 * - 打卡记录 CRUD
 * - 考勤统计汇总
 * - 请假申请与审批
 */

import { Injectable, BadRequestException } from '@nestjs/common'
import type {
  ClockRecord,
  AttendanceSummary,
  AttendanceStatus,
  AttendanceCalcRequest,
  LeaveRequest,
  LeaveType,
  LeaveStatus,
  AttendanceStoreStats,
} from './attendance.entity'

@Injectable()
export class AttendanceService {
  private readonly records = new Map<string, ClockRecord>()
  private readonly leaveRequests = new Map<string, LeaveRequest>()
  private nextRecordSeq = 1
  private nextLeaveSeq = 1

  constructor() {
    this.seed()
  }

  // ============ 1. 打卡记录 ============

  clockIn(input: AttendanceCalcRequest): ClockRecord {
    if (!input.employeeId || !input.employeeName || !input.storeId || !input.date) {
      throw new BadRequestException('Missing required fields: employeeId, employeeName, storeId, date')
    }

    const id = `clock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date().toISOString()
    const clockInTime = input.clockIn ?? '09:00'

    // 计算迟到分钟数（假设上班时间为 09:00）
    const [h, m] = clockInTime.split(':').map(Number)
    const lateMinutes = h > 9 || (h === 9 && m > 0) ? (h - 9) * 60 + m : 0

    let status: AttendanceStatus = lateMinutes > 0 ? 'late' : 'normal'

    const record: ClockRecord = {
      id,
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      storeId: input.storeId,
      date: input.date,
      clockIn: clockInTime,
      clockOut: null,
      status,
      lateMinutes,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 0,
      note: input.note,
      createdAt: now,
      updatedAt: now,
    }

    this.records.set(id, record)
    return record
  }

  clockOut(recordId: string, clockOutTime: string): ClockRecord {
    const record = this.records.get(recordId)
    if (!record) throw new BadRequestException(`Record ${recordId} not found`)
    if (record.clockOut) throw new BadRequestException(`Record ${recordId} already clocked out`)

    record.clockOut = clockOutTime

    // 计算早退分钟数（假设下班时间为 18:00）
    const [h, m] = clockOutTime.split(':').map(Number)
    const earlyLeave = h < 18 || (h === 18 && m < 0) ? (17 - h) * 60 + (60 - m) : 0
    record.earlyLeaveMinutes = earlyLeave > 0 ? earlyLeave : 0

    // 计算加班分钟数
    const overtime = h > 18 || (h === 18 && m > 0) ? (h - 18) * 60 + m : 0
    record.overtimeMinutes = overtime > 0 ? overtime : 0

    // 先处理早退，如果早退和加班并存（早退又加班），优先标记加班
    if (record.overtimeMinutes > 0) {
      record.status = 'overtime'
    } else if (record.earlyLeaveMinutes > 0) {
      record.status = 'early_leave'
    }

    record.updatedAt = new Date().toISOString()
    this.records.set(recordId, record)
    return record
  }

  getRecord(id: string): ClockRecord | null {
    return this.records.get(id) ?? null
  }

  listRecords(filter?: {
    employeeId?: string
    storeId?: string
    date?: string
    status?: AttendanceStatus
    from?: string
    to?: string
  }): ClockRecord[] {
    let result = Array.from(this.records.values())
    if (filter) {
      if (filter.employeeId) result = result.filter((r) => r.employeeId === filter.employeeId)
      if (filter.storeId) result = result.filter((r) => r.storeId === filter.storeId)
      if (filter.date) result = result.filter((r) => r.date === filter.date)
      if (filter.status) result = result.filter((r) => r.status === filter.status)
      if (filter.from) result = result.filter((r) => r.date >= filter.from!)
      if (filter.to) result = result.filter((r) => r.date <= filter.to!)
    }
    return result
  }

  // ============ 2. 考勤统计 ============

  getSummary(period: string, from: string, to: string, storeId?: string): AttendanceSummary {
    let filtered = Array.from(this.records.values())

    if (storeId) {
      filtered = filtered.filter((r) => r.storeId === storeId)
    }

    const normalCount = filtered.filter((r) => r.status === 'normal').length
    const lateCount = filtered.filter((r) => r.status === 'late').length
    const earlyLeaveCount = filtered.filter((r) => r.status === 'early_leave').length
    const absentCount = filtered.filter((r) => r.status === 'absent').length
    const leaveCount = filtered.filter((r) => r.status === 'leave').length
    const overtimeCount = filtered.filter((r) => r.status === 'overtime').length
    const totalOvertimeMinutes = filtered.reduce((sum, r) => sum + r.overtimeMinutes, 0)

    // 按门店汇总
    const byStore: Record<string, AttendanceStoreStats> = {}
    for (const r of filtered) {
      if (!byStore[r.storeId]) {
        byStore[r.storeId] = { totalEmployees: 0, normalCount: 0, lateCount: 0, absentCount: 0, totalOvertimeMinutes: 0 }
      }
      const s = byStore[r.storeId]
      s.totalEmployees++
      if (r.status === 'normal') s.normalCount++
      if (r.status === 'late') s.lateCount++
      if (r.status === 'absent') s.absentCount++
      s.totalOvertimeMinutes += r.overtimeMinutes
    }

    return {
      period,
      from,
      to,
      totalEmployees: new Set(filtered.map((r) => r.employeeId)).size,
      totalDays: filtered.length,
      normalCount,
      lateCount,
      earlyLeaveCount,
      absentCount,
      leaveCount,
      overtimeCount,
      totalOvertimeMinutes,
      byStore,
    }
  }

  // ============ 3. 请假申请 ============

  createLeave(input: {
    employeeId: string
    employeeName: string
    storeId: string
    leaveType: LeaveType
    startDate: string
    endDate: string
    reason: string
  }): LeaveRequest {
    if (!input.employeeId || !input.employeeName || !input.storeId || !input.reason) {
      throw new BadRequestException('Missing required fields')
    }

    const id = `leave-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date().toISOString()

    const leave: LeaveRequest = {
      id,
      ...input,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }

    this.leaveRequests.set(id, leave)
    return leave
  }

  approveLeave(id: string, approverId: string, approverName: string, action: 'approve' | 'reject', remark?: string): LeaveRequest {
    const leave = this.leaveRequests.get(id)
    if (!leave) throw new BadRequestException(`Leave ${id} not found`)
    if (leave.status !== 'pending') {
      throw new BadRequestException(`Cannot ${action} leave in status ${leave.status}`)
    }

    leave.status = action === 'approve' ? 'approved' : 'rejected'
    leave.approverId = approverId
    leave.approverName = approverName
    leave.approvalRemark = remark
    leave.updatedAt = new Date().toISOString()

    this.leaveRequests.set(id, leave)
    return leave
  }

  cancelLeave(id: string): LeaveRequest {
    const leave = this.leaveRequests.get(id)
    if (!leave) throw new BadRequestException(`Leave ${id} not found`)
    if (leave.status === 'cancelled') throw new BadRequestException('Leave already cancelled')

    leave.status = 'cancelled'
    leave.updatedAt = new Date().toISOString()

    this.leaveRequests.set(id, leave)
    return leave
  }

  getLeave(id: string): LeaveRequest | null {
    return this.leaveRequests.get(id) ?? null
  }

  listLeaves(filter?: {
    employeeId?: string
    storeId?: string
    status?: LeaveStatus
  }): LeaveRequest[] {
    let result = Array.from(this.leaveRequests.values())
    if (filter) {
      if (filter.employeeId) result = result.filter((l) => l.employeeId === filter.employeeId)
      if (filter.storeId) result = result.filter((l) => l.storeId === filter.storeId)
      if (filter.status) result = result.filter((l) => l.status === filter.status)
    }
    return result
  }

  // ============ 4. 种子数据 ============

  private seed(): void {
    const now = new Date().toISOString()

    this.records.set('rec-seed-001', {
      id: 'rec-seed-001',
      employeeId: 'emp-001',
      employeeName: '张三',
      storeId: 'store-001',
      date: '2026-07-20',
      clockIn: '08:55',
      clockOut: '18:10',
      status: 'normal',
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 10,
      createdAt: now,
      updatedAt: now,
    })

    this.records.set('rec-seed-002', {
      id: 'rec-seed-002',
      employeeId: 'emp-002',
      employeeName: '李四',
      storeId: 'store-001',
      date: '2026-07-20',
      clockIn: '09:30',
      clockOut: '18:00',
      status: 'late',
      lateMinutes: 30,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 0,
      createdAt: now,
      updatedAt: now,
    })

    this.records.set('rec-seed-003', {
      id: 'rec-seed-003',
      employeeId: 'emp-003',
      employeeName: '王五',
      storeId: 'store-002',
      date: '2026-07-20',
      clockIn: '09:00',
      clockOut: '17:30',
      status: 'early_leave',
      lateMinutes: 0,
      earlyLeaveMinutes: 30,
      overtimeMinutes: 0,
      createdAt: now,
      updatedAt: now,
    })

    this.leaveRequests.set('leave-seed-001', {
      id: 'leave-seed-001',
      employeeId: 'emp-001',
      employeeName: '张三',
      storeId: 'store-001',
      leaveType: 'annual',
      startDate: '2026-08-01',
      endDate: '2026-08-02',
      reason: '年假休息',
      status: 'approved',
      approverId: 'store-mgr-001',
      approverName: '店长王',
      approvalRemark: '同意',
      createdAt: now,
      updatedAt: now,
    })

    this.leaveRequests.set('leave-seed-002', {
      id: 'leave-seed-002',
      employeeId: 'emp-004',
      employeeName: '赵六',
      storeId: 'store-001',
      leaveType: 'sick',
      startDate: '2026-07-22',
      endDate: '2026-07-22',
      reason: '身体不适',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    })
  }
}
