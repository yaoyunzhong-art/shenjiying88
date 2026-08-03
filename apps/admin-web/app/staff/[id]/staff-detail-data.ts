export interface StaffDetailSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'staff-detail-fallback'
  id: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadStaffDetailSnapshot(id: string): Promise<StaffDetailSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'staff-detail-fallback',
    id,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadStaffDetailSnapshot -> staff-detail-legacy params bridge',
    businessDataSource: 'legacy staff detail page retains local mock detail lookup, edit flow and status transition workflow',
    refreshPath: `loadStaffDetailSnapshot(${id})`,
    note: '当前页面仍以内联 mock 员工详情交互为主，本轮完成 E54 壳层化、来源态透明化与结构固证。',
  }
}
