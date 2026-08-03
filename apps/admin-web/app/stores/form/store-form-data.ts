export interface StoreFormSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-form-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadStoreFormSnapshot(): Promise<StoreFormSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-form-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadStoreFormSnapshot -> local E54 snapshot shell',
    businessDataSource: 'legacy client logic preserved under E54 wrapper',
    refreshPath: `loadStoreFormSnapshot(${'root'})`,
    note: '当前页面仍以 legacy 门店编辑表单为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
