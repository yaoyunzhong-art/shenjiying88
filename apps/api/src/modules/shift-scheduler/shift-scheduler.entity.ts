// ── Shift Scheduler Entities ──

export enum ShiftType {
  Morning = 'MORNING',
  Afternoon = 'AFTERNOON',
  Night = 'NIGHT',
  FullDay = 'FULL_DAY',
}

export enum ShiftStatus {
  Scheduled = 'SCHEDULED',
  CheckedIn = 'CHECKED_IN',
  CheckedOut = 'CHECKED_OUT',
  Absent = 'ABSENT',
  Swapped = 'SWAPPED',
}

export interface ShiftSchedule {
  id: string
  employeeId: string
  employeeName: string
  date: string
  shiftType: ShiftType
  startTime: string
  endTime: string
  status: ShiftStatus
  location: string
  remark?: string
  tenantId: string
  createdAt: string
}
