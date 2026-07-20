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

// ── 设备维保 (P-30 扩展) ────────────────────────────────────────────────────

export type MaintenanceOrderStatus = 'pending' | 'in_progress' | 'pending_acceptance' | 'completed'

export interface MaintenanceOrderEntity {
  id: string
  tenantId: string
  storeId?: string
  equipmentId: string
  equipmentName: string
  issueDescription: string
  status: MaintenanceOrderStatus
  reporterId: string
  reporterName: string
  assigneeId?: string
  assigneeName?: string
  startedAt?: string
  completionNote?: string
  completedAt?: string
  acceptanceNote?: string
  acceptedAt?: string
  acceptedBy?: string
  createdAt: string
  updatedAt: string
}

// ── 耗材采购 (P-30 扩展, 对接P-37审批流) ───────────────────────────────────

export type ProcurementRequestStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'ordered' | 'received'

export interface ProcurementApproval {
  approvalTicket?: string // P-37 审批工单号
  approverId: string
  approverName: string
  note: string
  approvedAt: string
}

export interface ProcurementOrderRecord {
  orderNumber: string
  vendorName: string
  orderedAt: string
  operatorId: string
  operatorName: string
}

export interface ProcurementReceiveRecord {
  receivedAt: string
  receivedBy: string
  receivedByName: string
  note?: string
}

export interface ProcurementRequestEntity {
  id: string
  tenantId: string
  storeId?: string
  requesterId: string
  requesterName: string
  department?: string
  purpose: string
  vendorName?: string
  notes?: string
  status: ProcurementRequestStatus
  approval?: ProcurementApproval
  orderRecord?: ProcurementOrderRecord
  receiveRecord?: ProcurementReceiveRecord
  createdAt: string
  updatedAt: string
}
