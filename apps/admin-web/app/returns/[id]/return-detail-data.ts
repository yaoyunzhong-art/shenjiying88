export interface ReturnDetailSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'return-detail-fallback'
  id: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadReturnDetailSnapshot(id: string): Promise<ReturnDetailSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'return-detail-fallback',
    id,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadReturnDetailSnapshot -> return-detail-legacy params bridge',
    businessDataSource: 'legacy return detail page retains local mock detail registry, edit flow and status transition workflow',
    refreshPath: `loadReturnDetailSnapshot(${id})`,
    note: '当前页面仍以内联 mock 退换货详情交互为主，本轮完成 E54 壳层化、来源态透明化与结构固证。',
  }
}
