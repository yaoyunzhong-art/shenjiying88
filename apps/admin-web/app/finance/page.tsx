import { AdminPermissionGate } from '../components/admin-permission-gate'
import FinanceClient from './finance-client'
import { loadFinanceSnapshot } from './finance-data'

const permissionGate = {
  requiredPermission: 'finance:read',
  title: 'finance 访问受限',
  description: '该页面已接入管理员权限管控，仅具备 finance:read 权限的账号可访问。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FinancePage() {
  const snapshot = await loadFinanceSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadFinanceSnapshot -> api/finance/payments + api/finance/refunds'
        : 'loadFinanceSnapshot -> defaultPayments/defaultRefunds fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'finance payment and refund upstream API response'
        : 'local finance payment/refund samples',
    refreshPath: `FinancePage -> loadFinanceSnapshot(tenantId=${snapshot.tenantId})`,
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费财务支付与退款服务端快照。'
        : '当前页面已回退到本地支付与退款样本，不可作为闭环复签证据。',
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
        <FinanceClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
