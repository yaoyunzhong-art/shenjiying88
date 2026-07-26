import { AdminPermissionGate } from '../../../components/admin-permission-gate'
import ReconciliationRulesClient from './rules-client'
import { loadReconciliationRulesSnapshot } from './rules-data'

// ── 主组件 ──


const permissionGate = {
  requiredPermission: 'finance:reconciliation:rules:read',
  title: '对账规则 访问受限',
  description: '该页面已接入管理员权限管控，仅具备 finance:reconciliation:rules:read 权限的账号可访问。',
} as const
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ReconciliationRulesPage() {
  const snapshot = await loadReconciliationRulesSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadReconciliationRulesSnapshot -> finance/reconciliation/rules'
        : 'loadReconciliationRulesSnapshot -> defaultRules fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'reconciliation rules upstream API response'
        : 'local reconciliation rule samples',
    refreshPath: 'ReconciliationRulesPage -> loadReconciliationRulesSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费对账规则服务端快照。'
        : '当前页面已回退到本地对账规则样本，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate
      requiredPermission={permissionGate.requiredPermission}
      title={permissionGate.title}
      description={permissionGate.description}
    >
      <div className="p-6 max-w-5xl mx-auto space-y-6">
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
        <ReconciliationRulesClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
