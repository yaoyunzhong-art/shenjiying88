export interface StockPageSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'stock-page-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadStockPageSnapshot(): Promise<StockPageSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'stock-page-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadStockPageSnapshot -> local E54 snapshot shell',
    businessDataSource: 'inline stock mock rows',
    refreshPath: `loadStockPageSnapshot(${'root'})`,
    note: '当前页面以 E54 库存总览壳层承载 mock 统计、列表与刷新证据。',
  }
}
