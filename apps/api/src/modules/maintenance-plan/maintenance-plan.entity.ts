// ── Maintenance Plan Entities ──

export enum MaintenanceType {
  Routine = 'ROUTINE',
  Emergency = 'EMERGENCY',
  Overhaul = 'OVERHAUL',
  Upgrade = 'UPGRADE',
}

export enum MaintenanceStatus {
  Scheduled = 'SCHEDULED',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
}

export enum Priority {
  Urgent = 'URGENT',
  High = 'HIGH',
  Medium = 'MEDIUM',
  Low = 'LOW',
}

export interface MaintenancePlan {
  id: string
  planNo: string
  title: string
  type: MaintenanceType
  status: MaintenanceStatus
  priority: Priority
  deviceName: string
  deviceId: string
  assignedTo: string
  scheduledAt: string
  completedAt?: string
  description: string
  result?: string
  cost?: number
  tenantId: string
  createdAt: string
}
