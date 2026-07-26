import { AdminPermissionGate } from '../../components/admin-permission-gate'
import MemberActivitiesClient from './member-activities-client'
import { loadMemberActivitiesSnapshot } from './mock-data'

const permissionGate = {
  requiredPermission: 'member:read',
  title: '会员活动历史访问受限',
  description:
    '会员活动历史页已接入管理员本地 session，只有具备 member:read 的账号才能查看活动记录、筛选条件与统计面板。',
} as const
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MemberActivitiesPage() {
  const snapshot = await loadMemberActivitiesSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadMemberActivitiesSnapshot -> members/activities'
        : 'loadMemberActivitiesSnapshot -> MOCK_ACTIVITIES fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'member activities upstream API response'
        : 'local member activity samples',
    refreshPath: 'MemberActivitiesPage -> loadMemberActivitiesSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费会员活动服务端快照。'
        : '当前页面已回退到本地会员活动样本，不可作为闭环复签证据。',
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
        <MemberActivitiesClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
