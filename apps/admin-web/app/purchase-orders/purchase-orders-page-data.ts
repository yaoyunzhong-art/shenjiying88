export interface PurchaseOrdersPageSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'purchase-orders-page-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadPurchaseOrdersPageSnapshot(): Promise<PurchaseOrdersPageSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'purchase-orders-page-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadPurchaseOrdersPageSnapshot -> local E54 snapshot shell',
    businessDataSource: 'legacy client logic preserved under E54 wrapper',
    refreshPath: `loadPurchaseOrdersPageSnapshot(${'root'})`,
    note: '当前页面仍以 legacy 采购列表交互为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
