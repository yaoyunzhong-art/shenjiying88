export interface StoreNewSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-new-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadStoreNewSnapshot(): Promise<StoreNewSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-new-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadStoreNewSnapshot -> local E54 snapshot shell',
    businessDataSource: 'legacy client logic preserved under E54 wrapper',
    refreshPath: `loadStoreNewSnapshot(${'root'})`,
    note: '当前页面仍以 legacy 门店新建表单为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
