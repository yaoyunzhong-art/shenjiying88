import { AdminPermissionGate } from '../../components/admin-permission-gate'
import FinancePayoutsClient from './payouts-client'
import { loadFinancePayoutsSnapshot } from './payouts-data'

const permissionGate = {
  requiredPermission: 'finance:payouts:read',
  title: '付款管理 访问受限',
  description: '该页面已接入管理员权限管控，仅具备 finance:payouts:read 权限的账号可访问。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FinancePayoutsPage() {
  const snapshot = await loadFinancePayoutsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadFinancePayoutsSnapshot -> finance/payouts'
        : 'loadFinancePayoutsSnapshot -> defaultPayouts fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api' ? 'finance payouts upstream API response' : 'local finance payout samples',
    refreshPath: 'FinancePayoutsPage -> loadFinancePayoutsSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费提现服务端快照。'
        : '当前域暂无稳定提现上游接口，页面固定展示 fallback 样本，不可作为闭环复签证据。',
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
        <FinancePayoutsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
