import { AdminPermissionGate } from '../../components/admin-permission-gate'
import BudgetClient from './budget-client'
import { loadBudgetSnapshot } from './budget-data'

const permissionGate = {
  requiredPermission: 'finance:budget:read',
  title: '预算管理 访问受限',
  description: '该页面已接入管理员权限管控，仅具备 finance:budget:read 权限的账号可访问。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BudgetPage() {
  const snapshot = await loadBudgetSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadBudgetSnapshot -> finance/budget'
        : 'loadBudgetSnapshot -> defaultBudgets/defaultApprovals fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api' ? 'finance budget upstream API response' : 'local finance budget samples',
    refreshPath: 'BudgetPage -> loadBudgetSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费预算服务端快照。'
        : '当前域暂无稳定预算上游接口，页面固定展示 fallback 样本，不可作为闭环复签证据。',
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
        <BudgetClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
