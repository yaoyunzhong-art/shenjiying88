export interface PlatformSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-platform-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadPlatformSnapshot(): Promise<PlatformSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-platform-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadPlatformSnapshot -> local E54 snapshot shell',
    businessDataSource: 'legacy client logic preserved under E54 wrapper',
    refreshPath: `loadPlatformSnapshot(${'root'})`,
    note: '当前页面仍以 legacy 平台配置交互为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
