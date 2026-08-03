export interface PurchasingSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-purchasing-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadPurchasingSnapshot(): Promise<PurchasingSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-purchasing-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadPurchasingSnapshot -> local E54 snapshot shell',
    businessDataSource: 'legacy client logic preserved under E54 wrapper',
    refreshPath: `loadPurchasingSnapshot(${'root'})`,
    note: '当前页面仍以 legacy 采购协同交互为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
