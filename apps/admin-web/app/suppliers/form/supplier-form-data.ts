export interface SupplierFormSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'supplier-form-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadSupplierFormSnapshot(): Promise<SupplierFormSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'supplier-form-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadSupplierFormSnapshot -> local E54 snapshot shell',
    businessDataSource: 'legacy client logic preserved under E54 wrapper',
    refreshPath: `loadSupplierFormSnapshot(${'root'})`,
    note: '当前页面仍以 legacy 供应商创建表单为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
