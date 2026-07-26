import { AdminPermissionGate } from '../components/admin-permission-gate'
import MaintenanceClient from './maintenance-client'
import { loadMaintenanceSnapshot } from './maintenance-data'

const permissionGate = {
  requiredPermission: 'maintenance:read',
  title: 'maintenance 访问受限',
  description: '该页面已接入管理员权限管控，仅具备 maintenance:read 权限的账号可访问。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MaintenancePage() {
  const snapshot = await loadMaintenanceSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadMaintenanceSnapshot -> logistics-management/maintenance-tasks'
        : 'loadMaintenanceSnapshot -> defaultTasks fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'maintenance task upstream API responses'
        : 'local maintenance task samples',
    refreshPath: 'MaintenancePage -> loadMaintenanceSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费后勤维护服务端快照。'
        : '当前页面已回退到本地维护样本，不可作为闭环复签证据。',
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
        <MaintenanceClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
