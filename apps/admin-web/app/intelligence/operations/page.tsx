import { AdminPermissionGate } from '../../components/admin-permission-gate'
import OperationsClient from './operations-client'
import { loadOperationsSnapshot } from './operations-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '运营参谋访问受限',
  description:
    '运营参谋页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看 AI 选择题、同城竞品证据与历史案例。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OperationsPage() {
  const snapshot = await loadOperationsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadOperationsSnapshot -> local operations advisory snapshot',
    businessDataSource: 'same-city competitor options + historical activity cases',
    refreshPath: 'OperationsPage -> loadOperationsSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面消费本地 snapshot loader，来源态已显式可见，不作为实时闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
          <div>
            Delivery {sourceEvidence.deliveryMode} · sourceLabel: {sourceEvidence.sourceLabel}
          </div>
          <div>
            控制面来源: {sourceEvidence.controlPlaneSource} · 业务数据: {sourceEvidence.businessDataSource}
          </div>
          <div>
            refreshPath: {sourceEvidence.refreshPath} · generatedAt: {sourceEvidence.generatedAt}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <OperationsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
