export interface CouponDetailSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'coupon-detail-mock'
  id: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadCouponDetailSnapshot(id: string): Promise<CouponDetailSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'coupon-detail-mock',
    id,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadCouponDetailSnapshot -> local E54 snapshot shell',
    businessDataSource: 'legacy client logic preserved under E54 wrapper',
    refreshPath: `loadCouponDetailSnapshot(${id})`,
    note: '当前页面仍以本地优惠券详情视图为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
