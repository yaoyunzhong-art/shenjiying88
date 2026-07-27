export interface NotificationFormSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'notification-form-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadNotificationFormSnapshot(): Promise<NotificationFormSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'notification-form-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadNotificationFormSnapshot -> local E54 snapshot shell',
    businessDataSource: 'legacy notification create logic preserved under E54 wrapper',
    refreshPath: `loadNotificationFormSnapshot(${'root'})`,
    note: '当前页面仍以 legacy 通知创建表单为主，本轮完成 E54 壳层化与来源态透明化。',
  }
}
