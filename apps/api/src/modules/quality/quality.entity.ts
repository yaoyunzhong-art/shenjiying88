// ── Quality Module Entities ──
//
// Re-exports from quality-inspection + new enterprise-quality entities:
//   PatrolTask  — 巡查任务 (scheduled safety/quality patrols)
//   RectificationRecord  — 整改记录 (corrective actions from failed inspections)

import {
  InspectionType,
  InspectionResult,
  Severity,
  type Defect,
  type InspectionRecord,
} from '../quality-inspection/quality-inspection.entity'

export { InspectionType, InspectionResult, Severity }
export type { Defect, InspectionRecord }

// ═══════════════════════════════════════════════════════════════════════
// PatrolTask  — 巡查任务
// ═══════════════════════════════════════════════════════════════════════

export enum PatrolTaskStatus {
  Pending = 'PENDING',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
}

export enum PatrolTaskPriority {
  Low = 'LOW',
  Medium = 'MEDIUM',
  High = 'HIGH',
  Urgent = 'URGENT',
}

export enum PatrolArea {
  Kitchen = 'KITCHEN',
  Warehouse = 'WAREHOUSE',
  DiningHall = 'DINING_HALL',
  EquipmentRoom = 'EQUIPMENT_ROOM',
  Restroom = 'RESTROOM',
  Entrance = 'ENTRANCE',
  Exterior = 'EXTERIOR',
  Other = 'OTHER',
}

export interface PatrolTaskCheckItem {
  id: string
  name: string
  standard: string
  result?: 'PASS' | 'FAIL' | 'N_A'
  remark?: string
  checkedAt?: string
}

export interface PatrolTask {
  id: string
  patrolNo: string
  title: string
  description: string
  area: PatrolArea
  priority: PatrolTaskPriority
  status: PatrolTaskStatus
  checkItems: PatrolTaskCheckItem[]
  assignedTo: string
  scheduledAt: string
  completedAt?: string
  notes?: string
  tenantId: string
  createdAt: string
  updatedAt: string
}

// ═══════════════════════════════════════════════════════════════════════
// RectificationRecord  — 整改记录
// ═══════════════════════════════════════════════════════════════════════

export enum RectificationStatus {
  Open = 'OPEN',
  InProgress = 'IN_PROGRESS',
  Resolved = 'RESOLVED',
  Verified = 'VERIFIED',
  Closed = 'CLOSED',
}

export interface RectificationAction {
  id: string
  description: string
  assignee: string
  deadline: string
  completedAt?: string
  status: 'PENDING' | 'COMPLETED'
  remark?: string
}

export interface RectificationRecord {
  id: string
  rectificationNo: string
  sourceInspectionId: string
  sourceInspectNo: string
  title: string
  description: string
  status: RectificationStatus
  severity: Severity
  responsiblePerson: string
  actions: RectificationAction[]
  deadline: string
  resolvedAt?: string
  verifiedBy?: string
  verifiedAt?: string
  notes?: string
  tenantId: string
  createdAt: string
  updatedAt: string
}
