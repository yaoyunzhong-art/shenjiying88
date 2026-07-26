import { AdminPermissionGate } from '../../components/admin-permission-gate'
import AdminDashboardClient from './dashboard-client'
import { loadAdminDashboardSnapshot } from './dashboard-data'

const permissionGate = {
  requiredPermission: 'dashboard:read',
  title: '全局分析仪表盘访问受限',
  description:
    '全局分析仪表盘已接入管理员本地 session，只有具备 dashboard:read 的账号才能查看平台级收入、区域分布、租户增长与系统告警。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminDashboardPage() {
  const snapshot = await loadAdminDashboardSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      'loadAdminDashboardSnapshot -> defaultOverview/defaultRevenueTrend/defaultRegionStats/defaultNewTenantTrend/defaultAlerts',
    businessDataSource: 'local admin dashboard HQ samples',
    refreshPath: 'AdminDashboardPage -> loadAdminDashboardSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前全局分析仪表盘使用本地总部样本，不代表真实经营主链，也不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
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
        <AdminDashboardClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
