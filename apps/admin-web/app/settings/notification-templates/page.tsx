import { AdminPermissionGate } from '../../components/admin-permission-gate'
import NotificationTemplatesClient from './notification-templates-client'
import { loadNotificationTemplatesSnapshot } from './notification-templates-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '通知模板访问受限',
  description:
    '通知模板页已切换为服务端快照壳层，仅具备 foundation.governance.read 权限的账号可查看模板列表、变量规则与来源态证据。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NotificationTemplatesPage() {
  const snapshot = await loadNotificationTemplatesSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadNotificationTemplatesSnapshot -> notifications/templates'
        : 'loadNotificationTemplatesSnapshot -> defaultNotificationTemplates fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'notification templates upstream API response'
        : 'local notification template samples',
    refreshPath: 'NotificationTemplatesPage -> loadNotificationTemplatesSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费通知模板服务端快照。'
        : '当前页面已回退到本地模板样本，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ padding: 24 }}>
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
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
            Delivery {sourceEvidence.deliveryMode} · 来源标签: {sourceEvidence.sourceLabel}
          </div>
          <div>
            控制面来源: {sourceEvidence.controlPlaneSource} · 业务数据: {sourceEvidence.businessDataSource}
          </div>
          <div>
            刷新路径: {sourceEvidence.refreshPath} · generatedAt: {sourceEvidence.generatedAt}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <NotificationTemplatesClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
