import { AdminPermissionGate } from '../../components/admin-permission-gate'
import FinanceDetailClient from './finance-detail-client'
import { loadFinanceDetailSnapshot } from './finance-detail-data'

const permissionGate = {
  requiredPermission: 'finance:id:read',
  title: '支付详情访问受限',
  description:
    '支付详情页已接入管理员本地 session，只有具备 finance:id:read 的账号才能查看支付档案、状态流转与退款列表。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FinanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const snapshot = await loadFinanceDetailSnapshot(id)
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadFinanceDetailSnapshot -> loadFinanceSnapshot -> api/finance/payments + api/finance/refunds'
        : 'loadFinanceDetailSnapshot -> defaultPayments/defaultRefunds fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'selected payment + filtered refund records'
        : 'local finance detail samples',
    refreshPath: 'FinanceDetailPage -> loadFinanceDetailSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费 finance detail 服务端快照。'
        : '当前页面已回退到本地支付详情样本，不可作为闭环复签证据。',
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
            generatedAt: {sourceEvidence.generatedAt} · 来源标签: {snapshot.sourceLabel}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <FinanceDetailClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
