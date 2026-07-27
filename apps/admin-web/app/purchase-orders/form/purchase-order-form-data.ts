export interface PurchaseOrderFormSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'purchase-order-form-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadPurchaseOrderFormSnapshot(): Promise<PurchaseOrderFormSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'purchase-order-form-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadPurchaseOrderFormSnapshot -> local E54 snapshot shell',
    businessDataSource: 'legacy client logic preserved under E54 wrapper',
    refreshPath: `loadPurchaseOrderFormSnapshot(${'root'})`,
    note: '当前页面仍以 legacy 采购表单交互为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
