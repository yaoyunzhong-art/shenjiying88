import { AdminPermissionGate } from '../../../../components/admin-permission-gate'
import DiscrepancyDetailClient from './discrepancy-detail-client'
import { loadDiscrepancyDetailSnapshot } from './discrepancy-detail-data'

interface PageProps {
  params: Promise<{ id: string }>
}

const permissionGate = {
  requiredPermission: 'finance:reconciliation:discrepancies:id:read',
  title: 'finance reconciliation discrepancies 访问受限',
  description:
    '该页面已接入管理员权限管控，仅具备 finance:reconciliation:discrepancies:id:read 权限的账号可访问。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DiscrepancyDetailPage({ params }: PageProps) {
  const { id } = await params
  const snapshot = await loadDiscrepancyDetailSnapshot(id)
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadDiscrepancyDetailSnapshot -> finance/reconciliation/[id]'
        : 'loadDiscrepancyDetailSnapshot -> defaultDetail fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'finance reconciliation discrepancy detail API response'
        : 'local discrepancy detail sample',
    refreshPath: `DiscrepancyDetailPage -> loadDiscrepancyDetailSnapshot(${id})`,
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '差异详情首屏直接消费服务端对账快照。'
        : '当前页面已回退到本地差异样本，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="space-y-6">
        <div className="mx-auto max-w-5xl px-6 pt-6">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
            <div>
              Delivery {sourceEvidence.deliveryMode} · 控制面来源:{' '}
              {sourceEvidence.controlPlaneSource}
            </div>
            <div>
              业务数据: {sourceEvidence.businessDataSource} · 刷新路径:{' '}
              {sourceEvidence.refreshPath}
            </div>
            <div>
              generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
            </div>
          </div>
        </div>
        <DiscrepancyDetailClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
