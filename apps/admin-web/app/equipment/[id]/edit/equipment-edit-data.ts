export interface EquipmentEditSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'equipment-edit-fallback'
  id: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadEquipmentEditSnapshot(id: string): Promise<EquipmentEditSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'equipment-edit-fallback',
    id,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadEquipmentEditSnapshot -> equipment-edit-legacy params bridge',
    businessDataSource: 'legacy equipment edit page retains local mock lookup, form validation and submit workflow',
    refreshPath: `loadEquipmentEditSnapshot(${id})`,
    note: '当前页面仍以内联 mock 设备编辑流程为主，本轮完成 E54 壳层化、来源态透明化与结构固证。',
  }
}
