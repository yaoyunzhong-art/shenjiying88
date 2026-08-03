export interface EquipmentDetailSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'equipment-detail-fallback'
  id: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadEquipmentDetailSnapshot(id: string): Promise<EquipmentDetailSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'equipment-detail-fallback',
    id,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadEquipmentDetailSnapshot -> equipment-detail-legacy params bridge',
    businessDataSource: 'legacy equipment detail page retains local mock registry, form editing and status transition workflow',
    refreshPath: `loadEquipmentDetailSnapshot(${id})`,
    note: '当前页面仍以内联 mock 设备详情交互为主，本轮完成 E54 壳层化、来源态透明化与结构固证。',
  }
}
