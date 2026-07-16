import { ApiProperty } from '@nestjs/swagger'

export enum FaultSeverity {
  Minor = 'minor',
  Major = 'major',
  Critical = 'critical',
}

export enum FaultStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Resolved = 'resolved',
}

export interface EquipmentFaultReport {
  id: string
  tenantId: string
  equipmentId: string
  equipmentName: string
  equipmentType: string
  faultDescription: string
  severity: FaultSeverity
  status: FaultStatus
  reporterName: string
  assignee?: string
  resolution?: string
  occurredAt: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

export const FaultSeverityLabels: Record<FaultSeverity, string> = {
  [FaultSeverity.Minor]: '轻微',
  [FaultSeverity.Major]: '主要',
  [FaultSeverity.Critical]: '严重',
}

export const FaultStatusLabels: Record<FaultStatus, string> = {
  [FaultStatus.Pending]: '待处理',
  [FaultStatus.InProgress]: '处理中',
  [FaultStatus.Resolved]: '已解决',
}
