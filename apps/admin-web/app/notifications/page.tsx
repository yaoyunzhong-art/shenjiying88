import { AdminPermissionGate } from '../components/admin-permission-gate'
import NotificationsClient from './notifications-client'
import { loadNotificationsSnapshot } from './notifications-data'

const permissionGate = {
  requiredPermission: 'notifications:read',
  title: '通知管理访问受限',
  description:
    '通知管理页已接入管理员本地 session，只有具备 notifications:read 的账号才能查看通知列表、状态筛选与发送统计。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NotificationsPage() {
  const snapshot = await loadNotificationsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadNotificationsSnapshot -> notifications'
        : 'loadNotificationsSnapshot -> defaultNotifications fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'notifications upstream API response'
        : 'local notification audit samples',
    refreshPath: 'NotificationsPage -> loadNotificationsSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费通知服务端快照。'
        : '当前页面已回退到本地通知样本，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: 32 }}>
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(148,163,184,0.08)',
            fontSize: 12,
            color: '#cbd5e1',
            lineHeight: 1.7,
          }}
        >
          <div>
            Delivery {sourceEvidence.deliveryMode} · 控制面来源: {sourceEvidence.controlPlaneSource}
          </div>
          <div>
            业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
          </div>
          <div>
            generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
          </div>
        </div>
        <NotificationsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
