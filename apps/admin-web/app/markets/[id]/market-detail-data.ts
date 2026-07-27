export interface MarketDetailSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'market-detail-fallback'
  id: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadMarketDetailSnapshot(id: string): Promise<MarketDetailSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'market-detail-fallback',
    id,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadMarketDetailSnapshot -> market-detail-legacy params bridge',
    businessDataSource: 'legacy market detail page retains local mock lookup, edit form and detail action workflow',
    refreshPath: `loadMarketDetailSnapshot(${id})`,
    note: '当前页面仍以内联 mock 市场详情交互为主，本轮完成 E54 壳层化、来源态透明化与结构固证。',
  }
}
