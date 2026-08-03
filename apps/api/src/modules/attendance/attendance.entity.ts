/**
 * 考勤管理 - Entity (V23)
 *
 * 类型定义:
 * - 打卡记录/考勤统计/考勤状态/请假类型
 */

/** 打卡记录 */
export interface ClockRecord {
  id: string
  employeeId: string
  employeeName: string
  storeId: string
  date: string
  clockIn: string
  clockOut: string | null
  status: AttendanceStatus
  lateMinutes: number
  earlyLeaveMinutes: number
  overtimeMinutes: number
  note?: string
  createdAt: string
  updatedAt: string
}

/** 考勤状态 */
export type AttendanceStatus =
  | 'normal'      // 正常
  | 'late'        // 迟到
  | 'early_leave' // 早退
  | 'absent'      // 缺勤
  | 'leave'       // 请假
  | 'overtime'    // 加班

/** 考勤汇总 */
export interface AttendanceSummary {
  period: string
  from: string
  to: string
  totalEmployees: number
  totalDays: number
  normalCount: number
  lateCount: number
  earlyLeaveCount: number
  absentCount: number
  leaveCount: number
  overtimeCount: number
  totalOvertimeMinutes: number
  byStore: Record<string, AttendanceStoreStats>
}

/** 门店考勤统计 */
export interface AttendanceStoreStats {
  totalEmployees: number
  normalCount: number
  lateCount: number
  absentCount: number
  totalOvertimeMinutes: number
}

/** 请假记录 */
export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  storeId: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  reason: string
  status: LeaveStatus
  approverId?: string
  approverName?: string
  approvalRemark?: string
  createdAt: string
  updatedAt: string
}

export type LeaveType = 'annual' | 'sick' | 'personal' | 'marriage' | 'maternity' | 'bereavement'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

/** 考勤计算请求 */
export interface AttendanceCalcRequest {
  employeeId: string
  employeeName: string
  storeId: string
  date: string
  clockIn?: string
  clockOut?: string
  note?: string
}

// ─── 标签与常量 ───

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  normal: '正常',
  late: '迟到',
  early_leave: '早退',
  absent: '缺勤',
  leave: '请假',
  overtime: '加班',
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: '年假',
  sick: '病假',
  personal: '事假',
  marriage: '婚假',
  maternity: '产假',
  bereavement: '丧假',
}

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  cancelled: '已取消',
}
