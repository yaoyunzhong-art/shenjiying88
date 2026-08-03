export interface NotificationDetailSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'notification-detail-fallback'
  id: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadNotificationDetailSnapshot(id: string): Promise<NotificationDetailSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'notification-detail-fallback',
    id,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadNotificationDetailSnapshot -> notification-detail-legacy params bridge',
    businessDataSource: 'legacy notification detail shell retains local mock detail registry and edit flow',
    refreshPath: `loadNotificationDetailSnapshot(${id})`,
    note: '当前页面仍以 legacy 通知详情交互为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
