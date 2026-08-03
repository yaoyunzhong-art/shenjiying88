export interface StockTransferPageSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'stock-transfer-page-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadStockTransferPageSnapshot(): Promise<StockTransferPageSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'stock-transfer-page-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadStockTransferPageSnapshot -> local E54 snapshot shell',
    businessDataSource: 'stock-transfer-data.ts shared mock transfers',
    refreshPath: `loadStockTransferPageSnapshot(${'root'})`,
    note: '当前页面先以 E54 壳层承载调拨审核统计、筛选和共享 mock 列表，后续可继续接入真实调拨 API。',
  }
}
