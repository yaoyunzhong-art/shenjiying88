import { AdminPermissionGate } from '../../components/admin-permission-gate'
import { loadTenantsSnapshot } from '../../tenants-data'
import TenantsClient from './tenants-client'

const permissionGate = {
  requiredPermission: 'tenant:read',
  title: '租户管理访问受限',
  description:
    '租户管理页已接入管理员本地 session，只有具备 tenant:read 的账号才能查看租户清单、套餐与市场治理视图。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminTenantsPage() {
  const snapshot = await loadTenantsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadTenantsSnapshot -> tenant/lifecycle/:tenantId/status + tenant/quota/:tenantId'
        : 'loadTenantsSnapshot -> MOCK_TENANTS fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'tenant registry metadata + tenant upstream lifecycle/quota responses'
        : 'local tenant samples',
    refreshPath: 'AdminTenantsPage -> loadTenantsSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费租户治理服务端快照。'
        : '当前页面已回退到本地租户样本，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="space-y-6">
        <div className="mx-auto max-w-7xl px-8 pt-8">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
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
        </div>
        <TenantsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
