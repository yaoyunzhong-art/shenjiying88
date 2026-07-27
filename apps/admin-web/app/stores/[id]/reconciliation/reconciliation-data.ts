export type ReconciliationStatus = 'match' | 'diff'

export interface ReconciliationRecord {
  id: string
  date: string
  income: number
  system: number
  diff: number
  method: string
  status: ReconciliationStatus
  operator: string
  note: string
}

export interface ReconciliationMethodSummary {
  method: string
  count: number
  totalIncome: number
  totalSystem: number
  diffTotal: number
}

export interface ReconciliationSnapshotSummary {
  totalIncome: number
  totalSystem: number
  diffTotal: number
  diffCount: number
  matchCount: number
  matchRate: number
  diffRate: number
}

export interface ReconciliationSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-reconciliation-mock'
  storeId: string
  records: ReconciliationRecord[]
  methodSummary: ReconciliationMethodSummary[]
  summary: ReconciliationSnapshotSummary
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const RECONCILIATION_RECORDS: ReconciliationRecord[] = [
  { id: 'REC-01', date: '2026-07-12', income: 12800, system: 12850, diff: -50, method: '微信', status: 'diff', operator: '张三', note: '微信通道手续费差异' },
  { id: 'REC-02', date: '2026-07-12', income: 3200, system: 3200, diff: 0, method: '支付宝', status: 'match', operator: '张三', note: '' },
  { id: 'REC-03', date: '2026-07-12', income: 1500, system: 1500, diff: 0, method: '现金', status: 'match', operator: '李四', note: '' },
  { id: 'REC-04', date: '2026-07-11', income: 14200, system: 14200, diff: 0, method: '微信', status: 'match', operator: '王五', note: '' },
  { id: 'REC-05', date: '2026-07-11', income: 4500, system: 4520, diff: -20, method: '现金', status: 'diff', operator: '张三', note: '疑似短款' },
  { id: 'REC-06', date: '2026-07-10', income: 9800, system: 9800, diff: 0, method: '微信', status: 'match', operator: '赵六', note: '' },
  { id: 'REC-07', date: '2026-07-10', income: 6200, system: 6150, diff: 50, method: '支付宝', status: 'diff', operator: '李四', note: '系统差异待核实' },
  { id: 'REC-08', date: '2026-07-09', income: 10500, system: 10500, diff: 0, method: '微信', status: 'match', operator: '张三', note: '' },
  { id: 'REC-09', date: '2026-07-08', income: 7800, system: 7800, diff: 0, method: '现金', status: 'match', operator: '王五', note: '' },
  { id: 'REC-10', date: '2026-07-07', income: 9500, system: 9300, diff: 200, method: '微信', status: 'diff', operator: '赵六', note: '大额差异待查' },
  { id: 'REC-11', date: '2026-07-06', income: 11000, system: 11000, diff: 0, method: '微信', status: 'match', operator: '张三', note: '' },
  { id: 'REC-12', date: '2026-07-05', income: 6800, system: 6850, diff: -50, method: '现金', status: 'diff', operator: '李四', note: '现金差异待核实' },
]

export function buildReconciliationSummary(
  records: ReconciliationRecord[]
): ReconciliationSnapshotSummary {
  const totalIncome = records.reduce((sum, item) => sum + item.income, 0)
  const totalSystem = records.reduce((sum, item) => sum + item.system, 0)
  const diffTotal = records.reduce((sum, item) => sum + Math.abs(item.diff), 0)
  const diffCount = records.filter((item) => item.status === 'diff').length
  const matchCount = records.length - diffCount
  const matchRate = records.length ? Number(((matchCount / records.length) * 100).toFixed(1)) : 100
  const diffRate = totalIncome ? Number(((diffTotal / totalIncome) * 100).toFixed(2)) : 0

  return {
    totalIncome,
    totalSystem,
    diffTotal,
    diffCount,
    matchCount,
    matchRate,
    diffRate,
  }
}

export function buildMethodSummary(
  records: ReconciliationRecord[]
): ReconciliationMethodSummary[] {
  const map = new Map<string, ReconciliationMethodSummary>()

  records.forEach((item) => {
    const current =
      map.get(item.method) ??
      { method: item.method, count: 0, totalIncome: 0, totalSystem: 0, diffTotal: 0 }
    current.count += 1
    current.totalIncome += item.income
    current.totalSystem += item.system
    current.diffTotal += item.diff
    map.set(item.method, current)
  })

  return Array.from(map.values())
}

export async function loadReconciliationSnapshot(
  storeId: string
): Promise<ReconciliationSnapshot> {
  const records = RECONCILIATION_RECORDS.map((item) => ({ ...item }))

  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-reconciliation-mock',
    storeId,
    records,
    methodSummary: buildMethodSummary(records),
    summary: buildReconciliationSummary(records),
    generatedAt: '2026-07-27T16:30:00.000Z',
    controlPlaneSource:
      'loadReconciliationSnapshot -> RECONCILIATION_RECORDS + buildReconciliationSummary + buildMethodSummary',
    businessDataSource: 'local reconciliation samples + derived method summary',
    refreshPath: `ReconciliationPage -> loadReconciliationSnapshot(${storeId})`,
    note: '当前门店对账页消费本地 reconciliation snapshot loader，已显式暴露来源态与刷新路径，执行对账和差异处理仍为 mock 演示。',
    error: '门店对账控制面尚未接入实时支付与账务上游，当前展示 mock 快照。',
  }
}
