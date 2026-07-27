export interface MarketingPerformanceSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'marketing-performance-mock'
  id: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadMarketingPerformanceSnapshot(id: string): Promise<MarketingPerformanceSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'marketing-performance-mock',
    id,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadMarketingPerformanceSnapshot -> local E54 snapshot shell',
    businessDataSource: 'legacy client logic preserved under E54 wrapper',
    refreshPath: `loadMarketingPerformanceSnapshot(${id})`,
    note: '当前页面仍以 legacy 营销效果分析交互为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
