export type EquipmentStatus = 'normal' | 'maintaining' | 'scrap_pending' | 'scrapped'
export type EquipmentType = 'capsule' | 'claw' | 'cashier' | 'ac' | 'speaker' | 'lightbox' | 'turnstile'

export interface EquipmentItem {
  id: string
  name: string
  model: string
  type: EquipmentType
  store: string
  supplier: string
  purchaseDate: string
  warrantyEnd: string
  updatedAt: string
  status: EquipmentStatus
  note?: string
}

export interface EquipmentSnapshotDelivery {
  deliveryMode: 'snapshot'
  sourceLabel: 'local-equipment-snapshot'
  equipment: EquipmentItem[]
  generatedAt: string
}

export const EQUIPMENT_STATUS_MAP: Record<
  EquipmentStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  normal: { label: '正常', variant: 'success' },
  maintaining: { label: '维修中', variant: 'warning' },
  scrap_pending: { label: '待报废', variant: 'danger' },
  scrapped: { label: '已报废', variant: 'neutral' },
}

export const EQUIPMENT_TYPE_MAP: Record<EquipmentType, string> = {
  capsule: '扭蛋机',
  claw: '娃娃机',
  cashier: '收银机',
  ac: '空调',
  speaker: '音响',
  lightbox: '灯箱',
  turnstile: '闸机',
}

export const defaultEquipment: EquipmentItem[] = [
  {
    id: 'E001',
    name: '扭蛋机-A01',
    model: 'GACHA-X1',
    type: 'capsule',
    store: '旗舰店-解放路',
    supplier: '万代南梦宫',
    purchaseDate: '2024-03-15',
    warrantyEnd: '2026-09-14',
    updatedAt: '2026-07-26T01:00:00Z',
    status: 'normal',
  },
  {
    id: 'E002',
    name: '娃娃机-B03',
    model: 'CLAW-Z2',
    type: 'claw',
    store: '门店-科技路',
    supplier: '世嘉',
    purchaseDate: '2024-06-01',
    warrantyEnd: '2026-08-31',
    updatedAt: '2026-07-25T08:30:00Z',
    status: 'normal',
  },
  {
    id: 'E003',
    name: '收银机-主01',
    model: 'POS-3000',
    type: 'cashier',
    store: '旗舰店-解放路',
    supplier: '海信智能',
    purchaseDate: '2023-11-20',
    warrantyEnd: '2025-11-19',
    updatedAt: '2026-07-24T05:00:00Z',
    status: 'maintaining',
    note: '读卡器故障，待备件更换。',
  },
  {
    id: 'E004',
    name: '中央空调-01',
    model: 'AC-M5',
    type: 'ac',
    store: '旗舰店-解放路',
    supplier: '格力',
    purchaseDate: '2023-05-10',
    warrantyEnd: '2028-05-09',
    updatedAt: '2026-07-23T11:10:00Z',
    status: 'normal',
  },
  {
    id: 'E005',
    name: '音响系统-S01',
    model: 'SPK-2000',
    type: 'speaker',
    store: '门店-科技路',
    supplier: 'JBL',
    purchaseDate: '2024-01-15',
    warrantyEnd: '2026-01-14',
    updatedAt: '2026-07-22T03:45:00Z',
    status: 'scrap_pending',
    note: '功放老化，已提交报废审批。',
  },
  {
    id: 'E006',
    name: '灯箱-L02',
    model: 'LB-800',
    type: 'lightbox',
    store: '门店-中山路',
    supplier: '欧普照明',
    purchaseDate: '2024-09-01',
    warrantyEnd: '2026-08-31',
    updatedAt: '2026-07-25T02:20:00Z',
    status: 'normal',
  },
  {
    id: 'E007',
    name: '闸机-G01',
    model: 'GATE-100',
    type: 'turnstile',
    store: '旗舰店-解放路',
    supplier: '海康威视',
    purchaseDate: '2023-08-20',
    warrantyEnd: '2026-08-19',
    updatedAt: '2026-07-21T14:00:00Z',
    status: 'normal',
  },
  {
    id: 'E008',
    name: '扭蛋机-A02',
    model: 'GACHA-X2',
    type: 'capsule',
    store: '门店-中山路',
    supplier: '多美',
    purchaseDate: '2024-12-01',
    warrantyEnd: '2026-11-30',
    updatedAt: '2026-07-20T09:10:00Z',
    status: 'scrapped',
    note: '旧型号退场，已完成资产注销。',
  },
]

export interface EquipmentStats {
  total: number
  normal: number
  maintaining: number
  scrapPending: number
  scrapped: number
}

export function computeEquipmentStats(items: EquipmentItem[]): EquipmentStats {
  return {
    total: items.length,
    normal: items.filter((item) => item.status === 'normal').length,
    maintaining: items.filter((item) => item.status === 'maintaining').length,
    scrapPending: items.filter((item) => item.status === 'scrap_pending').length,
    scrapped: items.filter((item) => item.status === 'scrapped').length,
  }
}

function getLatestEquipmentTimestamp(items: EquipmentItem[]): string {
  if (items.length === 0) return '—'
  return items.reduce(
    (latest, item) => (item.updatedAt > latest ? item.updatedAt : latest),
    items[0]!.updatedAt
  )
}

export async function loadEquipmentSnapshot(): Promise<EquipmentSnapshotDelivery> {
  return {
    deliveryMode: 'snapshot',
    sourceLabel: 'local-equipment-snapshot',
    equipment: defaultEquipment,
    generatedAt: getLatestEquipmentTimestamp(defaultEquipment),
  }
}
