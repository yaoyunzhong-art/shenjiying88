import { AdminPermissionGate } from '../../components/admin-permission-gate'
import AdminSettingsClient from './admin-settings-client'
import { loadAdminSettingsSnapshot } from './admin-settings-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '全局设置访问受限',
  description:
    '全局设置页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看系统信息、短信邮件服务、支付通道与安全策略。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminSettingsPage() {
  const snapshot = await loadAdminSettingsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource:
      'AdminSettingsPage -> loadAdminSettingsSnapshot -> DEFAULT_SYSTEM_INFO/DEFAULT_SMS_PROVIDERS/DEFAULT_MAIL_PROVIDERS',
    businessDataSource:
      'local admin settings fallback samples for system info, providers, payment channels and security policies',
    refreshPath: 'AdminSettingsPage -> loadAdminSettingsSnapshot',
    generatedAt: snapshot.generatedAt,
    note: snapshot.error ?? '当前页面显示 fallback 样本，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={shellStyle}>
        <div style={evidenceStyle}>
          <div>
            Delivery {sourceEvidence.deliveryMode} · sourceLabel: {sourceEvidence.sourceLabel}
          </div>
          <div>
            控制面来源: {sourceEvidence.controlPlaneSource} · 业务数据:{' '}
            {sourceEvidence.businessDataSource}
          </div>
          <div>
            refreshPath: {sourceEvidence.refreshPath} · generatedAt: {sourceEvidence.generatedAt}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <AdminSettingsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}

const shellStyle = {
  maxWidth: 1280,
  margin: '0 auto',
  padding: 24,
}

const evidenceStyle = {
  marginBottom: 24,
  borderRadius: 14,
  border: '1px solid rgba(148, 163, 184, 0.22)',
  background: 'rgba(248, 250, 252, 0.96)',
  padding: 16,
  color: '#334155',
  fontSize: 12,
  lineHeight: 1.8,
}
