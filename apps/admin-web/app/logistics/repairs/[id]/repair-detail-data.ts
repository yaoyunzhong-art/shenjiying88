import { REPAIR_RECORDS, REPAIR_STATUS_LABEL, type RepairStatus } from '../repairs-data'

export interface RepairDetailSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'local-repair-detail-snapshot'
  id: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  detail: {
    id: string
    storeName: string
    equipmentName: string
    equipmentId: string
    issueDescription: string
    status: RepairStatus
    assigneeName: string | null
    reporterName: string
    reporterPhone: string
    createdAt: string
    completedAt: string | null
    note: string
  }
  nextStatuses: RepairStatus[]
}

const STATUS_FLOW: Record<RepairStatus, RepairStatus[]> = {
  pending: ['assigned'],
  assigned: ['in_progress'],
  in_progress: ['completed'],
  completed: ['pending_verify'],
  pending_verify: ['verified'],
  verified: [],
}

export function getRepairActionLabel(status: RepairStatus): string {
  if (status === 'assigned') return '指派维修'
  if (status === 'in_progress') return '开始维修'
  if (status === 'completed') return '完成维修'
  if (status === 'pending_verify') return '发起验收'
  return '确认验收'
}

export async function loadRepairDetailSnapshot(id: string): Promise<RepairDetailSnapshot> {
  const baseRecord = REPAIR_RECORDS.find((item) => item.id === id) ?? REPAIR_RECORDS[0]
  const detail = {
    id,
    storeName: baseRecord.storeName,
    equipmentName: baseRecord.equipmentName,
    equipmentId: `EQ-${id.replace('RO-', '').padStart(3, '0')}`,
    issueDescription: baseRecord.issueDescription,
    status: baseRecord.status,
    assigneeName: baseRecord.assigneeName,
    reporterName: baseRecord.reporterName,
    reporterPhone: '13800000001',
    createdAt: baseRecord.createdAt,
    completedAt: baseRecord.status === 'verified' ? '2026-07-20T18:00:00Z' : null,
    note: `${REPAIR_STATUS_LABEL[baseRecord.status]}阶段样本，用于验证详情壳层结构和状态流转按钮。`,
  }

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'local-repair-detail-snapshot',
    id,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadRepairDetailSnapshot -> local repair detail snapshot',
    businessDataSource: 'local repair records bridged from repairs snapshot',
    refreshPath: `RepairDetailPage -> loadRepairDetailSnapshot(${id})`,
    note: '当前页面使用本地维修工单详情样本，不代表真实维修闭环主链，也不可作为闭环复签证据。',
    detail,
    nextStatuses: STATUS_FLOW[detail.status],
  }
}
