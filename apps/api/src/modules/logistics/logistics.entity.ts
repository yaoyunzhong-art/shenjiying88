export type InspectionTaskStatus = 'scheduled' | 'reminded' | 'completed'

export type InspectionResultStatus = 'normal' | 'warning' | 'fault'

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
