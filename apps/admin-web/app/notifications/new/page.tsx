import { AdminPermissionGate } from '../../components/admin-permission-gate'
import NotificationFormClient from './notification-form-client'
import { loadNotificationFormSnapshot } from './notification-form-data'


const permissionGate = {
  requiredPermission: 'notifications:read',
  title: '创建通知访问受限',
  description:
    '创建通知页已接入管理员本地 session，只有具备 notifications:read 的账号才能查看通知表单、目标范围与提交反馈。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewNotificationPage() {
  const snapshot = await loadNotificationFormSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: snapshot.controlPlaneSource,
    businessDataSource: snapshot.businessDataSource,
    refreshPath: snapshot.refreshPath,
    generatedAt: snapshot.generatedAt,
    note: snapshot.note,
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
        <div
          style={{
            marginBottom: 24,
            borderRadius: 16,
            border: '1px solid rgba(148, 163, 184, 0.18)',
            background: 'rgba(248, 250, 252, 0.92)',
            padding: 16,
            color: '#334155',
            fontSize: 12,
            lineHeight: 1.8,
          }}
        >
          <div>
            Delivery {sourceEvidence.deliveryMode} · 来源标签: {sourceEvidence.sourceLabel} · 控制面来源:{' '}
            {sourceEvidence.controlPlaneSource}
          </div>
          <div>
            业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
          </div>
          <div>
            generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
          </div>
        </div>
        <NotificationFormClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
