import { AdminPermissionGate } from '../../components/admin-permission-gate'
import ProfitLossClient from './profit-loss-client'
import { loadProfitLossSnapshot } from './profit-loss-data'

const permissionGate = {
  requiredPermission: 'finance:profit-loss:read',
  title: '损益报表 访问受限',
  description: '该页面已接入管理员权限管控，仅具备 finance:profit-loss:read 权限的账号可访问。',
} as const

type ProfitLossPageProps = {
  searchParams?: Promise<{ period?: string | string[] }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProfitLossPage({ searchParams }: ProfitLossPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const requestedPeriod = Array.isArray(resolvedSearchParams?.period)
    ? resolvedSearchParams?.period[0]
    : resolvedSearchParams?.period
  const snapshot = await loadProfitLossSnapshot(requestedPeriod)
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadProfitLossSnapshot -> finance/pnl'
        : 'loadProfitLossSnapshot -> defaultProfitLossReport fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'finance pnl upstream API response'
        : 'local profit-loss samples',
    refreshPath: `ProfitLossPage -> loadProfitLossSnapshot(period=${snapshot.selectedPeriod})`,
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? `当前页面直接消费损益表服务端快照，周期: ${snapshot.report.periodLabel}。`
        : `当前页面已回退到本地损益样本，周期: ${snapshot.report.periodLabel}，不可作为闭环复签证据。`,
  } as const

  return (
    <AdminPermissionGate
      requiredPermission={permissionGate.requiredPermission}
      title={permissionGate.title}
      description={permissionGate.description}
    >
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
        <ProfitLossClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
