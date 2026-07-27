export interface FinanceSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-finance-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadFinanceSnapshot(): Promise<FinanceSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-finance-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadFinanceSnapshot -> local E54 snapshot shell',
    businessDataSource: 'legacy client logic preserved under E54 wrapper',
    refreshPath: `loadFinanceSnapshot(${'root'})`,
    note: '当前页面仍以 legacy 财务交互为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
