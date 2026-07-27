export interface PlatformSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'dev-tools-platform-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  docItems: string[]
}

const DOC_ITEMS = ['收银API', '会员API', '库存API', '报表API', '活动API']

export async function loadPlatformSnapshot(): Promise<PlatformSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'dev-tools-platform-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadPlatformSnapshot -> local E54 snapshot shell',
    businessDataSource: 'platform-data.ts mock api catalog',
    refreshPath: 'OpenPlatformPage -> loadPlatformSnapshot',
    note: '当前页面已按 E54 三层模板壳层化，API 文档目录、Webhook 与日志视图仍使用本地 mock 数据。',
    docItems: DOC_ITEMS,
  }
}
