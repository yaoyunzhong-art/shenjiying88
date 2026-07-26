import { AdminPermissionGate } from '../components/admin-permission-gate'
import ApprovalsClient from './approvals-client'
import { loadApprovalsSnapshot } from './approvals-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '治理审批中心访问受限',
  description:
    '治理审批中心已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看审批待办、统计摘要与审批动作。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ApprovalsPage() {
  const snapshot = await loadApprovalsSnapshot()
  const latestUpdatedAt =
    snapshot.approvals.length > 0
      ? snapshot.approvals.reduce(
          (latest, item) => (item.updatedAt > latest ? item.updatedAt : latest),
          snapshot.approvals[0]!.updatedAt
        )
      : '—'
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource: 'loadApprovalsSnapshot -> DEFAULT_APPROVALS',
    businessDataSource: 'local approvals snapshot',
    refreshPath: 'ApprovalsPage -> loadApprovalsSnapshot',
    writePath: 'submitApprovalComment/approveApproval/rejectApproval -> local state mutation only',
    generatedAt: snapshot.generatedAt,
    latestUpdatedAt,
    note: '当前审批列表使用本地 mock 样本与假写链路，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="space-y-6">
        <div className="mx-auto max-w-7xl px-8 pt-8">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
            <div>
              Delivery {sourceEvidence.deliveryMode} · 控制面来源: {sourceEvidence.controlPlaneSource}
            </div>
            <div>
              业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
            </div>
            <div>
              写入路径: {sourceEvidence.writePath} · generatedAt: {sourceEvidence.generatedAt}
            </div>
            <div>
              latestUpdatedAt: {sourceEvidence.latestUpdatedAt} · {sourceEvidence.note}
            </div>
          </div>
        </div>
        <ApprovalsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
