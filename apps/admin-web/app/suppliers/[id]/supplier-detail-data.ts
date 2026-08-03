export interface SupplierDetailSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'supplier-detail-fallback'
  id: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadSupplierDetailSnapshot(id: string): Promise<SupplierDetailSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'supplier-detail-fallback',
    id,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadSupplierDetailSnapshot -> supplier-detail-legacy params bridge',
    businessDataSource: 'legacy supplier detail module with local sample lookup',
    refreshPath: `loadSupplierDetailSnapshot(${id})`,
    note: '当前页面仍以 legacy 供应商详情交互为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
