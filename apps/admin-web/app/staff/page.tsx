import { AdminPermissionGate } from '../components/admin-permission-gate'
import StaffClient from './staff-client'
import { loadStaffSnapshot } from './staff-data'

const permissionGate = {
  requiredPermission: 'staff:read',
  title: '员工管理访问受限',
  description: '员工管理页已接入管理员本地 session，只有具备 staff:read 的账号才能查看员工名册与岗位状态。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StaffPage() {
  const snapshot = await loadStaffSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadStaffSnapshot -> hr/employees'
        : 'loadStaffSnapshot -> MOCK_STAFF fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api' ? 'hr employees upstream API responses' : 'local staff roster samples',
    refreshPath: 'StaffPage -> loadStaffSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费员工服务端快照。'
        : '当前页面已回退到本地员工样本，不可作为闭环复签证据。',
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
        <StaffClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
