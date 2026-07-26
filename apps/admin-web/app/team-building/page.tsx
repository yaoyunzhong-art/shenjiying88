import { AdminPermissionGate } from '../components/admin-permission-gate'
import TeamBuildingClient from './team-building-client'
import { loadTeamBuildingSnapshot } from './team-building-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '团建活动访问受限',
  description:
    '团建活动管理页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看活动统计、预算与组织信息。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TeamBuildingPage() {
  const snapshot = await loadTeamBuildingSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource: 'loadTeamBuildingSnapshot -> defaultActivities',
    businessDataSource: 'local team-building activity samples',
    refreshPath: 'TeamBuildingPage -> loadTeamBuildingSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面首屏活动列表来自本地团建样本；新建活动仍为客户端 fake write，不可作为闭环复签证据。',
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
        <TeamBuildingClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
