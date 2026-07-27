export interface CouponFormSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'coupon-form-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadCouponFormSnapshot(): Promise<CouponFormSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'coupon-form-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadCouponFormSnapshot -> local E54 snapshot shell',
    businessDataSource: 'legacy client logic preserved under E54 wrapper',
    refreshPath: `loadCouponFormSnapshot(${'root'})`,
    note: '当前页面仍以 legacy 表单交互为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
