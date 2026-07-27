export interface MarketingDetailSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'marketing-detail-mock'
  id: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadMarketingDetailSnapshot(id: string): Promise<MarketingDetailSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'marketing-detail-mock',
    id,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadMarketingDetailSnapshot -> local E54 snapshot shell',
    businessDataSource: 'legacy client logic preserved under E54 wrapper',
    refreshPath: `loadMarketingDetailSnapshot(${id})`,
    note: '当前页面仍以 legacy 营销详情交互为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
