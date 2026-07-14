export type InspectionTaskStatus = 'scheduled' | 'reminded' | 'completed'

export type InspectionResultStatus = 'normal' | 'warning' | 'fault'

export type CleanScheduleStatus = 'scheduled' | 'assigned' | 'checked_in'

export type RepairOrderStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'verified'

export type MaterialRequestStatus = 'pending_approval' | 'approved' | 'outbound'

export interface InspectionTaskResult {
  status: InspectionResultStatus
  note: string
  inspectorId: string
  inspectorName: string
  recordedAt: string
}

export interface InspectionTaskEntity {
  id: string
  tenantId: string
  storeId?: string
  equipmentId: string
  equipmentName: string
  assigneeId: string
  assigneeName: string
  scheduledAt: string
  status: InspectionTaskStatus
  reminderSentAt?: string
  completedAt?: string
  result?: InspectionTaskResult
  createdAt: string
  updatedAt: string
}

export interface CleanScheduleCheckIn {
  cleanerId: string
  cleanerName: string
  checkedInAt: string
  note?: string
}

export interface CleanScheduleEntity {
  id: string
  tenantId: string
  storeId?: string
  assigneeId: string
  assigneeName: string
  shiftName: string
  shiftTime: string
  scheduledDate: string
  areaCode?: string
  areaName?: string
  status: CleanScheduleStatus
  assignedAt?: string
  checkIn?: CleanScheduleCheckIn
  createdAt: string
  updatedAt: string
}

export interface RepairVerification {
  verifierId: string
  verifierName: string
  note: string
  verifiedAt: string
}

export interface RepairOrderEntity {
  id: string
  tenantId: string
  storeId?: string
  inspectionTaskId?: string
  equipmentId: string
  equipmentName: string
  issueDescription: string
  reporterId: string
  reporterName: string
  assigneeId?: string
  assigneeName?: string
  status: RepairOrderStatus
  assignedAt?: string
  startedAt?: string
  completedAt?: string
  completionNote?: string
  verification?: RepairVerification
  createdAt: string
  updatedAt: string
}

export interface MaterialRequestItem {
  itemId: string
  itemName: string
  category: string
  unit: string
  quantity: number
}

export interface MaterialRequestApproval {
  approverId: string
  approverName: string
  note: string
  approvedAt: string
}

export interface MaterialOutboundRecord {
  operatorId: string
  operatorName: string
  warehouseCode?: string
  note?: string
  outboundAt: string
}

export interface MaterialRequestEntity {
  id: string
  tenantId: string
  storeId?: string
  requesterId: string
  requesterName: string
  department?: string
  purpose: string
  status: MaterialRequestStatus
  items: MaterialRequestItem[]
  totalQuantity: number
  approval?: MaterialRequestApproval
  outbound?: MaterialOutboundRecord
  createdAt: string
  updatedAt: string
}
