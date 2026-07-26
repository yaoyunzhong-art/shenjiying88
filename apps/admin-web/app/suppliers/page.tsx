import { AdminPermissionGate } from '../components/admin-permission-gate'
import SuppliersClient from './suppliers-client'
import { loadSuppliersSnapshot } from './suppliers-data'

const permissionGate = {
  requiredPermission: 'suppliers:read',
  title: '供应商管理访问受限',
  description: '供应商页面已接入管理员本地 session，只有具备 suppliers:read 的账号才能查看供应商清单与合作概况。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StoreSuppliersPage() {
  const snapshot = await loadSuppliersSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadSuppliersSnapshot -> suppliers'
        : 'loadSuppliersSnapshot -> MOCK_SUPPLIERS fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api' ? 'suppliers upstream API responses' : 'local supplier samples',
    refreshPath: 'StoreSuppliersPage -> loadSuppliersSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费供应商服务端快照。'
        : '当前页面已回退到本地供应商样本，不可作为闭环复签证据。',
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
        <SuppliersClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
