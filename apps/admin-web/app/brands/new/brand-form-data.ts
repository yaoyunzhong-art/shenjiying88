export interface BrandFormSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'brand-form-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadBrandFormSnapshot(): Promise<BrandFormSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'brand-form-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadBrandFormSnapshot -> local E54 snapshot shell',
    businessDataSource: 'legacy brand create scaffold preserved under E54 wrapper',
    refreshPath: 'loadBrandFormSnapshot(root)',
    note: '当前页面仍以 legacy 品牌创建表单为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
