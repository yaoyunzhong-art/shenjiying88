import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  LeaveType,
  LeaveStatus,
  type LeaveRequest,
} from './leave-request.entity'

// ── In-memory store ──

const leaveStore = new Map<string, LeaveRequest>()

@Injectable()
export class LeaveRequestService {
  // ═══════════════════════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════════════════════

  createLeave(input: {
    tenantId: string
    employeeId: string
    employeeName: string
    type: LeaveType
    startDate: string
    endDate: string
    days: number
    reason: string
    approver: string
    remark?: string
  }): LeaveRequest {
    const now = new Date().toISOString()
    const leave: LeaveRequest = {
      id: `leave-${randomUUID()}`,
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      type: input.type,
      status: LeaveStatus.Pending,
      startDate: input.startDate,
      endDate: input.endDate,
      days: input.days,
      reason: input.reason,
      approver: input.approver,
      remark: input.remark,
      tenantId: input.tenantId,
      createdAt: now,
    }
    leaveStore.set(leave.id, leave)
    return leave
  }

  getLeave(leaveId: string, tenantId: string): LeaveRequest | undefined {
    const l = leaveStore.get(leaveId)
    if (!l || l.tenantId !== tenantId) return undefined
    return l
  }

  listLeaves(
    tenantId: string,
    filters?: {
      type?: LeaveType
      status?: LeaveStatus
      employeeId?: string
      approver?: string
      fromDate?: string
      toDate?: string
    },
  ): LeaveRequest[] {
    const all = Array.from(leaveStore.values())
    return all.filter((l) => {
      if (l.tenantId !== tenantId) return false
      if (filters?.type && l.type !== filters.type) return false
      if (filters?.status && l.status !== filters.status) return false
      if (filters?.employeeId && l.employeeId !== filters.employeeId) return false
      if (filters?.approver && l.approver !== filters.approver) return false
      if (filters?.fromDate && l.startDate < filters.fromDate) return false
      if (filters?.toDate && l.endDate > filters.toDate) return false
      return true
    })
  }

  // ═══════════════════════════════════════════════════════════════════
  // Approval Flow
  // ═══════════════════════════════════════════════════════════════════

  approveLeave(
    leaveId: string,
    status: LeaveStatus,
    tenantId: string,
    remark?: string,
  ): LeaveRequest {
    const leave = this.getLeave(leaveId, tenantId)
    if (!leave) {
      throw new Error(`Leave request not found: ${leaveId}`)
    }
    if (leave.status !== LeaveStatus.Pending) {
      throw new Error(`Cannot ${status} a leave that is already ${leave.status}`)
    }
    const now = new Date().toISOString()
    const updated: LeaveRequest = {
      ...leave,
      status,
      approvedAt: status === LeaveStatus.Approved || status === LeaveStatus.Rejected
        ? now
        : leave.approvedAt,
      remark: remark !== undefined ? remark : leave.remark,
    }
    leaveStore.set(leaveId, updated)
    return updated
  }

  cancelLeave(leaveId: string, tenantId: string): LeaveRequest {
    const leave = this.getLeave(leaveId, tenantId)
    if (!leave) {
      throw new Error(`Leave request not found: ${leaveId}`)
    }
    if (leave.status !== LeaveStatus.Pending) {
      throw new Error('Cannot cancel a leave that is not pending')
    }
    const updated: LeaveRequest = {
      ...leave,
      status: LeaveStatus.Cancelled,
    }
    leaveStore.set(leaveId, updated)
    return updated
  }

  // ═══════════════════════════════════════════════════════════════════
  // Mock Data
  // ═══════════════════════════════════════════════════════════════════

  seedMockData(tenantId: string): void {
    const mockLeaves: Array<{
      employeeId: string
      employeeName: string
      type: LeaveType
      status: LeaveStatus
      startDate: string
      endDate: string
      days: number
      reason: string
      approver: string
      remark?: string
    }> = [
      {
        employeeId: 'EMP-001', employeeName: '张三',
        type: LeaveType.Annual, status: LeaveStatus.Approved,
        startDate: '2026-07-20', endDate: '2026-07-24', days: 5,
        reason: '年假旅行，计划去云南',
        approver: '李经理',
        remark: '已批准，注意工作交接',
      },
      {
        employeeId: 'EMP-002', employeeName: '李四',
        type: LeaveType.Sick, status: LeaveStatus.Approved,
        startDate: '2026-07-15', endDate: '2026-07-16', days: 2,
        reason: '感冒发烧，需要休息',
        approver: '李经理',
      },
      {
        employeeId: 'EMP-003', employeeName: '王五',
        type: LeaveType.Personal, status: LeaveStatus.Pending,
        startDate: '2026-07-25', endDate: '2026-07-25', days: 1,
        reason: '家里有事需要处理',
        approver: '李经理',
      },
      {
        employeeId: 'EMP-004', employeeName: '赵六',
        type: LeaveType.Annual, status: LeaveStatus.Rejected,
        startDate: '2026-07-10', endDate: '2026-07-14', days: 5,
        reason: '年假',
        approver: '李经理',
        remark: '驳回原因：该时段人手不足，建议改期',
      },
      {
        employeeId: 'EMP-001', employeeName: '张三',
        type: LeaveType.Sick, status: LeaveStatus.Cancelled,
        startDate: '2026-07-05', endDate: '2026-07-06', days: 2,
        reason: '身体不适',
        approver: '李经理',
        remark: '已取消，改为居家办公',
      },
      {
        employeeId: 'EMP-005', employeeName: '孙七',
        type: LeaveType.Maternity, status: LeaveStatus.Approved,
        startDate: '2026-08-01', endDate: '2026-10-31', days: 92,
        reason: '产假',
        approver: '人事部',
      },
      {
        employeeId: 'EMP-006', employeeName: '周八',
        type: LeaveType.Marriage, status: LeaveStatus.Approved,
        startDate: '2026-09-01', endDate: '2026-09-07', days: 7,
        reason: '结婚',
        approver: '人事部',
        remark: '恭喜！',
      },
      {
        employeeId: 'EMP-007', employeeName: '吴九',
        type: LeaveType.Bereavement, status: LeaveStatus.Approved,
        startDate: '2026-07-12', endDate: '2026-07-14', days: 3,
        reason: '家人去世，需要返乡处理丧事',
        approver: '李经理',
      },
      {
        employeeId: 'EMP-002', employeeName: '李四',
        type: LeaveType.Personal, status: LeaveStatus.Approved,
        startDate: '2026-08-05', endDate: '2026-08-05', days: 1,
        reason: '办理房产过户',
        approver: '李经理',
      },
      {
        employeeId: 'EMP-003', employeeName: '王五',
        type: LeaveType.Annual, status: LeaveStatus.Approved,
        startDate: '2026-08-10', endDate: '2026-08-14', days: 5,
        reason: '年假休息',
        approver: '李经理',
      },
      {
        employeeId: 'EMP-008', employeeName: '郑十',
        type: LeaveType.Sick, status: LeaveStatus.Pending,
        startDate: '2026-07-18', endDate: '2026-07-18', days: 1,
        reason: '急性肠胃炎',
        approver: '李经理',
      },
      {
        employeeId: 'EMP-009', employeeName: '陈一',
        type: LeaveType.Other, status: LeaveStatus.Pending,
        startDate: '2026-07-28', endDate: '2026-07-28', days: 1,
        reason: '参加朋友婚礼',
        approver: '李经理',
      },
      {
        employeeId: 'EMP-001', employeeName: '张三',
        type: LeaveType.Annual, status: LeaveStatus.Approved,
        startDate: '2026-09-01', endDate: '2026-09-05', days: 5,
        reason: '国庆调休提前休假',
        approver: '人事部',
      },
      {
        employeeId: 'EMP-004', employeeName: '赵六',
        type: LeaveType.Sick, status: LeaveStatus.Pending,
        startDate: '2026-07-22', endDate: '2026-07-23', days: 2,
        reason: '牙痛需要治疗',
        approver: '李经理',
      },
      {
        employeeId: 'EMP-005', employeeName: '孙七',
        type: LeaveType.Personal, status: LeaveStatus.Approved,
        startDate: '2026-07-08', endDate: '2026-07-08', days: 1,
        reason: '产检',
        approver: '人事部',
      },
      {
        employeeId: 'EMP-010', employeeName: '黄二',
        type: LeaveType.Annual, status: LeaveStatus.Rejected,
        startDate: '2026-07-19', endDate: '2026-07-21', days: 3,
        reason: '想请假休息几天',
        approver: '李经理',
        remark: '驳回原因：近期待办事项较多，请下周再申请',
      },
      {
        employeeId: 'EMP-006', employeeName: '周八',
        type: LeaveType.Personal, status: LeaveStatus.Cancelled,
        startDate: '2026-07-06', endDate: '2026-07-06', days: 1,
        reason: '个人事务',
        approver: '李经理',
        remark: '客户临时来访，取消请假',
      },
      {
        employeeId: 'EMP-007', employeeName: '吴九',
        type: LeaveType.Annual, status: LeaveStatus.Pending,
        startDate: '2026-08-17', endDate: '2026-08-21', days: 5,
        reason: '暑期带孩子出去玩',
        approver: '李经理',
      },
      {
        employeeId: 'EMP-011', employeeName: '林三',
        type: LeaveType.Sick, status: LeaveStatus.Approved,
        startDate: '2026-07-13', endDate: '2026-07-14', days: 2,
        reason: '眼睛发炎，就医治疗',
        approver: '人事部',
      },
      {
        employeeId: 'EMP-012', employeeName: '何四',
        type: LeaveType.Other, status: LeaveStatus.Pending,
        startDate: '2026-07-26', endDate: '2026-07-26', days: 1,
        reason: '献血后休息',
        approver: '李经理',
      },
      {
        employeeId: 'EMP-002', employeeName: '李四',
        type: LeaveType.Annual, status: LeaveStatus.Approved,
        startDate: '2026-10-01', endDate: '2026-10-07', days: 7,
        reason: '国庆长假带家人出游',
        approver: '人事部',
      },
    ]

    for (const m of mockLeaves) {
      this.createLeave({
        tenantId,
        ...m,
      })
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test Helpers
  // ═══════════════════════════════════════════════════════════════════

  resetLeaveStoresForTests(): void {
    leaveStore.clear()
  }
}
