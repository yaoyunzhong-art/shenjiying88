export type HandoverStatus = 'normal' | 'diff'

export interface HandoverRecord {
  id: string
  from: string
  to: string
  cash: number
  cashDiff: number
  devices: string
  keys: string
  time: string
  status: HandoverStatus
  note: string
}

export interface ShiftHandoverSummary {
  totalRecords: number
  totalCash: number
  normalCount: number
  diffCount: number
  totalCashDiff: number
}

export interface ShiftHandoverSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-shift-handover-mock'
  storeId: string
  handovers: HandoverRecord[]
  rules: string[]
  summary: ShiftHandoverSummary
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const HANDOVER_RECORDS: HandoverRecord[] = [
  { id: 'H01', from: '张三(早班)', to: '王五(晚班)', cash: 8360, cashDiff: 0, devices: '全部正常', keys: 'A柜+B柜', time: '2026-07-12 14:00', status: 'normal', note: '' },
  { id: 'H02', from: '李四(中班)', to: '刘七(夜班)', cash: 12580, cashDiff: -50, devices: 'VR-2停机待修', keys: 'A柜', time: '2026-07-11 22:00', status: 'diff', note: '短款50元，已报主管' },
  { id: 'H03', from: '王五(晚班)', to: '张三(早班)', cash: 6320, cashDiff: 0, devices: '全部正常', keys: 'A柜+B柜', time: '2026-07-10 06:00', status: 'normal', note: '' },
  { id: 'H04', from: '刘七(夜班)', to: '李四(中班)', cash: 9810, cashDiff: 30, devices: '台球桌灯需修', keys: 'A柜', time: '2026-07-09 06:00', status: 'diff', note: '长款30元' },
  { id: 'H05', from: '张三(早班)', to: '王五(晚班)', cash: 10500, cashDiff: 0, devices: '全部正常', keys: 'A柜+B柜', time: '2026-07-08 14:00', status: 'normal', note: '' },
  { id: 'H06', from: '赵六(早班)', to: '李四(中班)', cash: 7200, cashDiff: 0, devices: '全部正常', keys: 'A柜', time: '2026-07-07 14:00', status: 'normal', note: '' },
  { id: 'H07', from: '王五(晚班)', to: '赵六(早班)', cash: 8900, cashDiff: -20, devices: '兑币机缺零钱', keys: 'A柜+B柜', time: '2026-07-07 06:00', status: 'diff', note: '短款20元' },
  { id: 'H08', from: '李四(中班)', to: '刘七(夜班)', cash: 11000, cashDiff: 0, devices: '全部正常', keys: 'A柜', time: '2026-07-06 22:00', status: 'normal', note: '' },
]

export const HANDOVER_RULES = [
  '接班人员应在规定时间到岗。',
  '现金交接需双方当面清点。',
  '设备状态需逐项确认签字。',
  '钥匙交接需记录编号。',
  '出现差异需在备注栏记录并报主管。',
]

export function buildShiftHandoverSummary(
  handovers: HandoverRecord[]
): ShiftHandoverSummary {
  const diffCount = handovers.filter((item) => item.status === 'diff').length

  return {
    totalRecords: handovers.length,
    totalCash: handovers.reduce((sum, item) => sum + item.cash, 0),
    normalCount: handovers.length - diffCount,
    diffCount,
    totalCashDiff: handovers.reduce((sum, item) => sum + Math.abs(item.cashDiff), 0),
  }
}

export async function loadShiftHandoverSnapshot(
  storeId: string
): Promise<ShiftHandoverSnapshot> {
  const handovers = HANDOVER_RECORDS.map((item) => ({ ...item }))

  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-shift-handover-mock',
    storeId,
    handovers,
    rules: [...HANDOVER_RULES],
    summary: buildShiftHandoverSummary(handovers),
    generatedAt: '2026-07-27T16:45:00.000Z',
    controlPlaneSource: 'loadShiftHandoverSnapshot -> HANDOVER_RECORDS + buildShiftHandoverSummary',
    businessDataSource: 'local shift handover samples + derived cash diff summary',
    refreshPath: `ShiftHandoverPage -> loadShiftHandoverSnapshot(${storeId})`,
    note: '当前门店交接班页消费本地 shift handover snapshot loader，已显式暴露来源态、刷新路径与 mock 边界，不作为真实交班签收凭证。',
    error: '门店交接班控制面尚未接入真实签收流，当前展示 mock 快照。',
  }
}
