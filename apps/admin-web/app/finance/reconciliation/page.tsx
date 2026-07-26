import { AdminPermissionGate } from '../../components/admin-permission-gate'
import ReconciliationClient from './reconciliation-client'
import { loadReconciliationSnapshot } from './reconciliation-data'

const permissionGate = {
  requiredPermission: 'finance:reconciliation:read',
  title: '财务对账访问受限',
  description: '财务对账页已接入管理员本地 session，仅具备 finance:reconciliation:read 权限的账号可访问。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ReconciliationPage() {
  const snapshot = await loadReconciliationSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadReconciliationSnapshot -> finance/reconciliation/status|summary|details|diffs'
        : 'loadReconciliationSnapshot -> defaultReconciliationStatus/defaultSummary/defaultDiffs/defaultDetails fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'finance reconciliation upstream API response'
        : 'local finance reconciliation samples',
    refreshPath: 'ReconciliationPage -> loadReconciliationSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费财务对账服务端快照。'
        : '当前页面已回退到本地对账样本，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate
      requiredPermission={permissionGate.requiredPermission}
      title={permissionGate.title}
      description={permissionGate.description}
    >
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
        <ReconciliationClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
