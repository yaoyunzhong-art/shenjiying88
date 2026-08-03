export type RepairStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'pending_verify'
  | 'verified'

export interface RepairRecord {
  id: string
  storeId: string
  storeName: string
  equipmentName: string
  issueDescription: string
  status: RepairStatus
  assigneeName: string | null
  reporterName: string
  createdAt: string
}

export interface RepairsSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'local-repairs-snapshot'
  records: RepairRecord[]
  generatedAt: string
}

export const REPAIR_STATUS_LABEL: Record<RepairStatus, string> = {
  pending: '待指派',
  assigned: '已指派',
  in_progress: '维修中',
  completed: '已完成',
  pending_verify: '待验收',
  verified: '已验收',
}

export const REPAIR_RECORDS: RepairRecord[] = [
  { id: 'RO-001', storeId: 'S-001', storeName: '旗舰店', equipmentName: '射击枪 A-01', issueDescription: '扳机卡顿，需检修', status: 'in_progress', assigneeName: '李师傅', reporterName: '张店长', createdAt: '2026-07-19T09:00:00Z' },
  { id: 'RO-002', storeId: 'S-002', storeName: '体验店 B', equipmentName: 'VR 头盔 H-03', issueDescription: '画面模糊，需更换镜片', status: 'pending', assigneeName: null, reporterName: '王员工', createdAt: '2026-07-19T10:30:00Z' },
  { id: 'RO-003', storeId: 'S-001', storeName: '旗舰店', equipmentName: '篮球机 B-02', issueDescription: '投币器故障', status: 'completed', assigneeName: '赵师傅', reporterName: '张店长', createdAt: '2026-07-18T14:00:00Z' },
  { id: 'RO-004', storeId: 'S-003', storeName: '社区店 C', equipmentName: '空调系统', issueDescription: '制冷效果差', status: 'pending_verify', assigneeName: '钱师傅', reporterName: '刘店长', createdAt: '2026-07-18T08:00:00Z' },
  { id: 'RO-005', storeId: 'S-002', storeName: '体验店 B', equipmentName: '收银终端 POS-01', issueDescription: '扫码枪不识别', status: 'verified', assigneeName: '孙师傅', reporterName: '王员工', createdAt: '2026-07-17T16:00:00Z' },
]

export function filterRepairRecords(
  records: RepairRecord[],
  activeStatus: RepairStatus | 'all',
) {
  return records.filter((record) => {
    if (activeStatus === 'all') return true
    return record.status === activeStatus
  })
}

export function summarizeRepairRecords(records: RepairRecord[]) {
  return {
    total: records.length,
    pending: records.filter((item) => item.status === 'pending').length,
    inProgress: records.filter((item) => item.status === 'in_progress').length,
    completed: records.filter((item) => item.status === 'completed').length,
    pendingVerify: records.filter((item) => item.status === 'pending_verify').length,
  }
}

export async function loadRepairsSnapshot(): Promise<RepairsSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'local-repairs-snapshot',
    records: REPAIR_RECORDS,
    generatedAt: new Date().toISOString(),
  }
}
