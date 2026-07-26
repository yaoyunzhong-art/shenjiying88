import { AdminPermissionGate } from '../components/admin-permission-gate'
import AlliancesClient from './alliances-client'
import { loadAlliancesSnapshot } from './alliances-data'

const permissionGate = {
  requiredPermission: 'alliances:read',
  title: 'alliances 访问受限',
  description: '该页面已接入管理员权限管控，仅具备 alliances:read 权限的账号可访问。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AlliancesPage() {
  const snapshot = await loadAlliancesSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadAlliancesSnapshot -> alliance/partner'
        : 'loadAlliancesSnapshot -> defaultPartners fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'alliance partner upstream response (营收/分润指标缺省时以 0 值占位)'
        : 'local alliance partner samples',
    refreshPath: 'AlliancesPage -> loadAlliancesSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费 alliance 服务端快照，经营指标缺口以占位值显式透出。'
        : '当前页面已回退到本地联盟伙伴样本，不可作为闭环复签证据。',
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
            generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
          </div>
        </div>
        <AlliancesClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
