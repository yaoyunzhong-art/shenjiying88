import { AdminPermissionGate } from '../components/admin-permission-gate'
import UsersClient from './users-client'
import { loadUsersSnapshot } from './users-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '用户管理访问受限',
  description:
    '用户管理页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看用户列表、角色分布与权限配置。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function UsersPage() {
  const snapshot = await loadUsersSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadUsersSnapshot -> identity-access/users'
        : 'loadUsersSnapshot -> MOCK_USERS fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'identity access upstream user roster'
        : 'local governance user samples',
    refreshPath: 'UsersPage -> loadUsersSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费用户治理服务端快照。'
        : '当前页面已回退到本地用户样本，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
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
        <UsersClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
