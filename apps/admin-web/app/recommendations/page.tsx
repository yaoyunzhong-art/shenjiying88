import { AdminPermissionGate } from '../components/admin-permission-gate'
import RecommendationsClient from './recommendations-client'
import { loadRecommendationsSnapshot } from './recommendations-data'

const permissionGate = {
  requiredPermission: 'recommendations:read',
  title: 'recommendations 访问受限',
  description: '该页面已接入管理员权限管控，仅具备 recommendations:read 权限的账号可访问。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RecommendationsPage() {
  const snapshot = await loadRecommendationsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource: 'loadRecommendationsSnapshot -> buildRecommendationSummary',
    businessDataSource: 'local recommendation governance samples',
    refreshPath: 'RecommendationsPage -> loadRecommendationsSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面展示的是推荐治理样本快照，不代表真实推荐主链，也不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="space-y-6 p-6">
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
        <RecommendationsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
