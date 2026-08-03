// ── Repair Item/Equipment Repair Request Entities ──

export enum RepairStatus {
  Pending = 'PENDING',
  Accepted = 'ACCEPTED',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
}

export enum RepairCategory {
  Electronic = 'ELECTRONIC',
  Mechanical = 'MECHANICAL',
  Furniture = 'FURNITURE',
  Plumbing = 'PLUMBING',
  Electric = 'ELECTRIC',
  Ac = 'AC',
  Other = 'OTHER',
}

export enum UrgencyLevel {
  Low = 'LOW',
  Medium = 'MEDIUM',
  High = 'HIGH',
  Urgent = 'URGENT',
}

export interface RepairRequest {
  id: string
  requestNo: string
  title: string
  description: string
  category: RepairCategory
  urgency: UrgencyLevel
  status: RepairStatus
  reporterName: string
  reporterPhone: string
  location: string
  deviceName?: string
  deviceId?: string
  assignedTo?: string
  estimatedCost?: number
  actualCost?: number
  completedAt?: string
  result?: string
  remark?: string
  tenantId: string
  createdAt: string
  updatedAt: string
}
