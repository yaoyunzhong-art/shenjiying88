import { ApiProperty } from '@nestjs/swagger'

export enum EmployeeRole {
  Manager = 'manager',
  Staff = 'staff',
  Trainee = 'trainee',
  Technician = 'technician',
}

export interface EmployeePerformance {
  id: string
  tenantId: string
  employeeId: string
  name: string
  role: EmployeeRole
  storeId: string
  score: number
  completedTasks: number
  customerRating: number
  attendanceRate: number
  revenueContribution: number
  month: string
  createdAt: string
}

export const EmployeeRoleLabels: Record<EmployeeRole, string> = {
  [EmployeeRole.Manager]: '店长',
  [EmployeeRole.Staff]: '店员',
  [EmployeeRole.Trainee]: '实习生',
  [EmployeeRole.Technician]: '技师',
}
