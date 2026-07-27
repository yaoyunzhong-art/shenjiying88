export interface PurchaseOrderDetailSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'purchase-order-detail-mock'
  id: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadPurchaseOrderDetailSnapshot(id: string): Promise<PurchaseOrderDetailSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'purchase-order-detail-mock',
    id,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadPurchaseOrderDetailSnapshot -> local E54 snapshot shell',
    businessDataSource: 'legacy client logic preserved under E54 wrapper',
    refreshPath: `loadPurchaseOrderDetailSnapshot(${id})`,
    note: '当前页面仍以 legacy 采购详情交互为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
