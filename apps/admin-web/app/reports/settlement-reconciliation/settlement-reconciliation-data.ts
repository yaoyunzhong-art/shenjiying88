export interface SettlementReconciliationRecord {
  id: string
  store: string
  period: string
  totalRevenue: number
  platformFee: number
  commission: number
  refundDeduction: number
  netSettlement: number
  status: 'settled' | 'pending' | 'disputed'
}

export interface SettlementReconciliationSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'reports-settlement-reconciliation-mock'
  records: SettlementReconciliationRecord[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

const SETTLEMENT_RECONCILIATION_RECORDS: SettlementReconciliationRecord[] = [
  { id: 'STL-2026-07-001', store: '陆家嘴旗舰店', period: '2026-07-01 ~ 2026-07-15', totalRevenue: 198600, platformFee: 5960, commission: 9930, refundDeduction: 3200, netSettlement: 179510, status: 'settled' },
  { id: 'STL-2026-07-002', store: '静安寺店', period: '2026-07-01 ~ 2026-07-15', totalRevenue: 132400, platformFee: 3970, commission: 6620, refundDeduction: 1850, netSettlement: 119960, status: 'settled' },
  { id: 'STL-2026-07-003', store: '成都 IFS 店', period: '2026-07-16 ~ 2026-07-27', totalRevenue: 108300, platformFee: 3250, commission: 5415, refundDeduction: 1200, netSettlement: 98435, status: 'pending' },
  { id: 'STL-2026-07-004', store: '广州天河店', period: '2026-07-16 ~ 2026-07-27', totalRevenue: 95600, platformFee: 2870, commission: 4780, refundDeduction: 850, netSettlement: 87100, status: 'pending' },
  { id: 'STL-2026-07-005', store: '杭州湖滨店', period: '2026-07-16 ~ 2026-07-27', totalRevenue: 68700, platformFee: 2060, commission: 3435, refundDeduction: 950, netSettlement: 62255, status: 'disputed' },
]

export async function loadSettlementReconciliationSnapshot(): Promise<SettlementReconciliationSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'reports-settlement-reconciliation-mock',
    records: SETTLEMENT_RECONCILIATION_RECORDS.map((item) => ({ ...item })),
    generatedAt: '2026-07-27T16:44:00.000Z',
    controlPlaneSource: 'loadSettlementReconciliationSnapshot -> SETTLEMENT_RECONCILIATION_RECORDS',
    businessDataSource: 'local settlement reconciliation records + derived fee totals',
    refreshPath: 'SettlementReconciliationPage -> loadSettlementReconciliationSnapshot()',
    note: '结算对账报表当前消费本地 settlement reconciliation snapshot，金额与状态均为 mock 样本。',
    error: '结算对账尚未接入真实结算中台读模型，当前展示 mock 快照。',
  }
}
