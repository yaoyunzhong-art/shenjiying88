export interface BrandDetailSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'brand-detail-fallback'
  id: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadBrandDetailSnapshot(id: string): Promise<BrandDetailSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'brand-detail-fallback',
    id,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadBrandDetailSnapshot -> brand-detail-legacy params bridge',
    businessDataSource: 'legacy brand detail shell retains local mock record registry and edit flow',
    refreshPath: `loadBrandDetailSnapshot(${id})`,
    note: '当前页面仍以 legacy 品牌详情交互为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
