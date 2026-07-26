import { AdminPermissionGate } from '../../components/admin-permission-gate'
import FeasibilityClient from './feasibility-client'
import { loadFeasibilitySnapshot } from './feasibility-data'

const permissionGate = {
  requiredPermission: 'intelligence:feasibility:read',
  title: '情报可行性分析访问受限',
  description: '该页面已接入管理员权限管控，仅具备 intelligence:feasibility:read 权限的账号可访问。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface FeasibilityPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function FeasibilityPage({ searchParams }: FeasibilityPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const snapshot = await loadFeasibilitySnapshot(resolvedSearchParams)
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadFeasibilitySnapshot -> intelligence/feasibility + intelligence/finance-panorama'
        : 'loadFeasibilitySnapshot -> buildFallbackFeasibilityReport + buildFallbackFinancePanorama',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'feasibility & finance upstream API responses + local budget comparison derivation'
        : 'local feasibility samples + local budget comparison derivation',
    refreshPath: 'FeasibilityPage -> loadFeasibilitySnapshot',
    generatedAt: snapshot.generatedAt,
    query: `city=${snapshot.request.city} · district=${snapshot.request.district} · budget=${snapshot.request.budget} · area=${snapshot.request.area} · tier=${snapshot.request.tier}`,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费 intelligence feasibility 服务端快照。'
        : '当前页面已回退到本地可行性样本，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
          <div>
            Delivery {sourceEvidence.deliveryMode} · 控制面来源: {sourceEvidence.controlPlaneSource}
          </div>
          <div>
            业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
          </div>
          <div>query: {sourceEvidence.query}</div>
          <div>
            generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
          </div>
        </div>
        <FeasibilityClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
