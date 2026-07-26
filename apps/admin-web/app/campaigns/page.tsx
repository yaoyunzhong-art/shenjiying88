import { AdminPermissionGate } from '../components/admin-permission-gate'
import CampaignsClient from './campaigns-client'
import { loadCampaignsSnapshot } from './campaigns-data'

// ── 主组件 ──


const permissionGate = {
  requiredPermission: 'campaigns:read',
  title: 'campaigns 访问受限',
  description: '该页面已接入管理员权限管控，仅具备 campaigns:read 权限的账号可访问。',
} as const
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CampaignsPage() {
  const snapshot = await loadCampaignsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadCampaignsSnapshot -> brand/campaigns'
        : 'loadCampaignsSnapshot -> defaultCampaigns fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'campaigns upstream API response'
        : 'local marketing campaign samples',
    refreshPath: 'CampaignsPage -> loadCampaignsSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费营销活动服务端快照。'
        : '当前页面已回退到本地营销活动样本，不可作为闭环复签证据。',
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
        <CampaignsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
