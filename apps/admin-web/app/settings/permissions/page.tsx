import { AdminPermissionGate } from '../../components/admin-permission-gate'
import PermissionsClient from './permissions-client'
import { loadPermissionsSnapshot } from './permissions-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '权限管理访问受限',
  description:
    '权限管理页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看角色定义、资源权限数与继承规则。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PermissionsPage() {
  const snapshot = await loadPermissionsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource:
      'PermissionsPage -> loadPermissionsSnapshot -> DEFAULT_PERMISSION_ROLES/DEFAULT_INHERITANCE_RULES',
    businessDataSource: 'local permission governance fallback samples',
    refreshPath: 'PermissionsPage -> loadPermissionsSnapshot',
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
            控制面来源: {sourceEvidence.controlPlaneSource} · 业务数据: {sourceEvidence.businessDataSource}
          </div>
          <div>
            refreshPath: {sourceEvidence.refreshPath} · generatedAt: {sourceEvidence.generatedAt}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <PermissionsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}

const shellStyle = {
  maxWidth: 1200,
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
