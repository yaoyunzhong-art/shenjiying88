import { AdminPermissionGate } from '../../components/admin-permission-gate'
import MemberConfigClient from './member-config-client'
import { loadMemberConfigSnapshot } from './member-config-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '会员配置中心访问受限',
  description:
    '会员配置中心已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看积分规则、等级阈值与生命周期配置。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MemberConfigPage() {
  const snapshot = await loadMemberConfigSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource: 'loadMemberConfigSnapshot -> DEFAULT_MEMBER_CONFIG',
    businessDataSource: 'local member governance samples',
    refreshPath: 'MemberConfigPage -> loadMemberConfigSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '首屏配置由服务端样本快照提供，保存链路仍沿用客户端配置接口，不可作为闭环复签证据。',
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
        <MemberConfigClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
