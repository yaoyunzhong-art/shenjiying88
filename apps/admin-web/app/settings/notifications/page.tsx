import { AdminPermissionGate } from '../../components/admin-permission-gate'
import NotificationsClient from './notifications-client'
import { loadNotificationsSettingsSnapshot } from './notifications-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '通知设置访问受限',
  description:
    '通知设置页已切换为服务端快照壳层，仅具备 foundation.governance.read 权限的账号可查看通知规则、静默时段与来源态证据。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NotificationsPage() {
  const snapshot = await loadNotificationsSettingsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadNotificationsSettingsSnapshot -> local notification rules snapshot',
    businessDataSource: 'local notification governance samples',
    refreshPath: 'NotificationsPage -> loadNotificationsSettingsSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      '当前页面使用本地通知规则样本，不代表真实通知调度主链，也不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ padding: 24 }}>
        <div
          style={{
            maxWidth: 1080,
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
        <NotificationsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
