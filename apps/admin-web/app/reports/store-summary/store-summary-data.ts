export interface StoreSummaryRecord {
  id: string
  name: string
  city: string
  orders: number
  revenue: number
  members: number
  rating: number
  status: 'active' | 'inactive'
}

export interface StoreRegionSummary {
  region: string
  storeCount: number
  revenue: number
}

export interface StoreSummarySnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'reports-store-summary-mock'
  stores: StoreSummaryRecord[]
  regions: StoreRegionSummary[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

const STORE_SUMMARY_RECORDS: StoreSummaryRecord[] = [
  { id: 'store-001', name: '陆家嘴旗舰店', city: '上海', orders: 1248, revenue: 385620, members: 892, rating: 4.8, status: 'active' },
  { id: 'store-002', name: '徐汇店', city: '上海', orders: 876, revenue: 256780, members: 543, rating: 4.6, status: 'active' },
  { id: 'store-003', name: '成都 IFS 店', city: '成都', orders: 543, revenue: 168920, members: 356, rating: 4.7, status: 'active' },
  { id: 'store-004', name: '广州天河店', city: '广州', orders: 432, revenue: 129870, members: 298, rating: 4.4, status: 'active' },
  { id: 'store-005', name: '杭州湖滨店', city: '杭州', orders: 356, revenue: 108920, members: 234, rating: 4.3, status: 'inactive' },
]

const STORE_REGION_SUMMARIES: StoreRegionSummary[] = [
  { region: '华东', storeCount: 3, revenue: 751320 },
  { region: '西南', storeCount: 1, revenue: 168920 },
  { region: '华南', storeCount: 1, revenue: 129870 },
]

export async function loadStoreSummarySnapshot(): Promise<StoreSummarySnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'reports-store-summary-mock',
    stores: STORE_SUMMARY_RECORDS.map((item) => ({ ...item })),
    regions: STORE_REGION_SUMMARIES.map((item) => ({ ...item })),
    generatedAt: '2026-07-27T16:43:00.000Z',
    controlPlaneSource: 'loadStoreSummarySnapshot -> STORE_SUMMARY_RECORDS + STORE_REGION_SUMMARIES',
    businessDataSource: 'local store ranking records + derived regional summaries',
    refreshPath: 'StoreSummaryPage -> loadStoreSummarySnapshot()',
    note: '门店汇总报表当前展示本地 store summary snapshot，门店排名与区域汇总均为 mock 样本。',
    error: '门店汇总尚未接入真实经营驾驶舱接口，当前展示 mock 快照。',
  }
}
