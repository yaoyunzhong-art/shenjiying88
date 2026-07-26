import { AdminPermissionGate } from '../components/admin-permission-gate'
import ProcurementClient from './procurement-client'
import { loadProcurementSnapshot } from './procurement-data'

const permissionGate = {
  requiredPermission: 'procurement:read',
  title: 'procurement 访问受限',
  description: '该页面已接入管理员权限管控，仅具备 procurement:read 权限的账号可访问。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProcurementPage() {
  const snapshot = await loadProcurementSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadProcurementSnapshot -> procurement-orders'
        : 'loadProcurementSnapshot -> defaultOrders fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'procurement orders upstream API response'
        : 'local procurement order samples',
    refreshPath: 'ProcurementPage -> loadProcurementSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费 procurement 服务端快照。'
        : '当前页面已回退到本地采购样本，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
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
        <ProcurementClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
