export interface CouponsPageSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'coupons-page-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadCouponsPageSnapshot(): Promise<CouponsPageSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'coupons-page-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadCouponsPageSnapshot -> local E54 snapshot shell',
    businessDataSource: 'legacy client logic preserved under E54 wrapper',
    refreshPath: `loadCouponsPageSnapshot(${'root'})`,
    note: '当前页面仍以 legacy 列表交互为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
