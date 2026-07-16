// ── Task Scheduler Enums ──

export enum TaskType {
  OneTime = 'ONE_TIME',
  Recurring = 'RECURRING',
  Shift = 'SHIFT'
}

export enum TaskPriority {
  High = 'HIGH',
  Medium = 'MEDIUM',
  Low = 'LOW'
}

export enum TaskStatus {
  Pending = 'PENDING',
  Running = 'RUNNING',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Cancelled = 'CANCELLED'
}

// ── Task ──

export interface Task {
  id: string
  name: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  cronExpr?: string
  assignedTo: string
  startTime: string
  endTime?: string
  description: string
  tenantId: string
  createdAt: string
  updatedAt: string
}
