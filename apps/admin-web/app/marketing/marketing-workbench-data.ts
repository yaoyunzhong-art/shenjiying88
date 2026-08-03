export interface MarketingWorkbenchSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'marketing-workbench-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadMarketingWorkbenchSnapshot(): Promise<MarketingWorkbenchSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'marketing-workbench-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadMarketingWorkbenchSnapshot -> local E54 snapshot shell',
    businessDataSource: 'legacy client logic preserved under E54 wrapper',
    refreshPath: `loadMarketingWorkbenchSnapshot(${'root'})`,
    note: '当前页面仍以 legacy 营销工作台交互为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
