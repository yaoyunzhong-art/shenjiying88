import { AdminPermissionGate } from '../components/admin-permission-gate'
import BrandOperationsClient from './brand-operations-client'
import { loadBrandOperationsSnapshot } from './brand-operations-data'

const permissionGate = {
  requiredPermission: 'brands:read',
  title: '品牌运营访问受限',
  description: '品牌运营页已接入管理员本地 session，只有具备 brands:read 的账号才能查看品牌资产、活动与联名合作信息。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BrandOperationsPage() {
  const snapshot = await loadBrandOperationsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadBrandOperationsSnapshot -> brand-operations/assets + brand-operations/campaigns + brand-operations/collaborations'
        : 'loadBrandOperationsSnapshot -> defaultAssets/defaultCampaigns/defaultCollaborations',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'brand operations upstream API responses'
        : 'local brand operations samples',
    refreshPath: 'BrandOperationsPage -> loadBrandOperationsSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费品牌运营服务端快照。'
        : '当前页面已回退到本地品牌运营样本，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
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
        <BrandOperationsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
