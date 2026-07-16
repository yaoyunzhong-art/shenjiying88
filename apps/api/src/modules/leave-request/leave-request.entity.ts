// ── Leave Request Entities ──

export enum LeaveType {
  Annual = 'ANNUAL',
  Sick = 'SICK',
  Personal = 'PERSONAL',
  Maternity = 'MATERNITY',
  Marriage = 'MARRIAGE',
  Bereavement = 'BEREAVEMENT',
  Other = 'OTHER',
}

export enum LeaveStatus {
  Pending = 'PENDING',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
  Cancelled = 'CANCELLED',
}

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  type: LeaveType
  status: LeaveStatus
  startDate: string
  endDate: string
  days: number
  reason: string
  approver: string
  approvedAt?: string
  remark?: string
  tenantId: string
  createdAt: string
}
