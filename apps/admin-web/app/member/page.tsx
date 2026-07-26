import { AdminPermissionGate } from '../components/admin-permission-gate'
import MemberClient from './member-client'
import { loadMemberSnapshot } from './member-data'

const permissionGate = {
  requiredPermission: 'member:read',
  title: '会员入口访问受限',
  description: '会员入口页已接入管理员本地 session，只有具备 member:read 的账号才能查看会员列表与运营概况。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MemberPage() {
  const snapshot = await loadMemberSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadMemberSnapshot -> loadAdminMemberList -> members/persistent'
        : 'loadMemberSnapshot -> FALLBACK_MEMBERS',
    businessDataSource:
      snapshot.deliveryMode === 'api' ? 'members persistent upstream API responses' : 'local member samples',
    refreshPath: 'MemberPage -> loadMemberSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费会员服务端快照。'
        : '当前页面已回退到本地会员样本，不可作为闭环复签证据。',
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
        <MemberClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
