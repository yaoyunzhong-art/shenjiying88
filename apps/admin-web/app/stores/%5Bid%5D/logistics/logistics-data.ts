export interface LogisticsSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-logistics-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadLogisticsSnapshot(): Promise<LogisticsSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-logistics-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadLogisticsSnapshot -> local E54 snapshot shell',
    businessDataSource: 'legacy client logic preserved under E54 wrapper',
    refreshPath: `loadLogisticsSnapshot(${'root'})`,
    note: '当前页面仍以 legacy 后勤交互为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
