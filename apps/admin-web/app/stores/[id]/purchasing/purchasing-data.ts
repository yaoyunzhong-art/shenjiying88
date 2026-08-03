export type PurchaseStatus = 'pending' | 'ordered' | 'partial' | 'received'

export interface PurchaseRecord {
  id: string
  supplier: string
  items: string
  total: number
  status: PurchaseStatus
  created: string
  expected: string
  receiver?: string
  category: string
}

export interface SupplierRecord {
  name: string
  cooperationCount: number
  rating: string
}

export interface PurchasingSnapshotSummary {
  totalOrders: number
  pendingOrders: number
  receivedOrders: number
  totalAmount: number
  pendingAmount: number
}

export interface PurchasingSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-purchasing-mock'
  storeId: string
  purchases: PurchaseRecord[]
  suppliers: SupplierRecord[]
  summary: PurchasingSnapshotSummary
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const PURCHASE_RECORDS: PurchaseRecord[] = [
  { id: 'PO-001', supplier: '农夫山泉', items: '纯净水×200箱', total: 2400, status: 'received', created: '2026-07-10', expected: '2026-07-12', receiver: '张三', category: '饮品' },
  { id: 'PO-002', supplier: '义乌礼品', items: '加油棒×500个', total: 1250, status: 'ordered', created: '2026-07-11', expected: '2026-07-14', category: '礼品' },
  { id: 'PO-003', supplier: '任天堂', items: 'NS游戏卡带×10张', total: 2800, status: 'pending', created: '2026-07-12', expected: '2026-07-18', category: '游戏' },
  { id: 'PO-004', supplier: '清洁之家', items: 'VR清洁套装×20套', total: 700, status: 'partial', created: '2026-07-09', expected: '2026-07-13', receiver: '李四', category: '耗材' },
  { id: 'PO-005', supplier: '联想', items: '显示器×2台', total: 3600, status: 'pending', created: '2026-07-12', expected: '2026-07-17', category: '设备' },
]

export const SUPPLIER_RECORDS: SupplierRecord[] = [
  { name: '农夫山泉', cooperationCount: 6, rating: '好评率100%' },
  { name: '义乌礼品', cooperationCount: 12, rating: '好评率92%' },
  { name: '任天堂', cooperationCount: 4, rating: '履约稳定' },
  { name: '联想', cooperationCount: 3, rating: '设备交付快' },
]

export function buildPurchasingSummary(
  purchases: PurchaseRecord[]
): PurchasingSnapshotSummary {
  return {
    totalOrders: purchases.length,
    pendingOrders: purchases.filter((item) => item.status !== 'received').length,
    receivedOrders: purchases.filter((item) => item.status === 'received').length,
    totalAmount: purchases.reduce((sum, item) => sum + item.total, 0),
    pendingAmount: purchases
      .filter((item) => item.status !== 'received')
      .reduce((sum, item) => sum + item.total, 0),
  }
}

export async function loadPurchasingSnapshot(
  storeId: string
): Promise<PurchasingSnapshot> {
  const purchases = PURCHASE_RECORDS.map((item) => ({ ...item }))
  const suppliers = SUPPLIER_RECORDS.map((item) => ({ ...item }))

  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-purchasing-mock',
    storeId,
    purchases,
    suppliers,
    summary: buildPurchasingSummary(purchases),
    generatedAt: '2026-07-27T17:30:00.000Z',
    controlPlaneSource: 'loadPurchasingSnapshot -> PURCHASE_RECORDS + SUPPLIER_RECORDS + buildPurchasingSummary',
    businessDataSource: 'local purchasing samples + derived pending/received counters',
    refreshPath: `PurchasingPage -> loadPurchasingSnapshot(${storeId})`,
    note: '当前门店采购页消费本地 purchasing snapshot loader，已显式暴露来源态与刷新路径，下单、收货与取消仍为 mock 演示。',
    error: '门店采购控制面尚未接入实时供应链上游，当前展示 mock 快照。',
  }
}
