import { AdminPermissionGate } from '../components/admin-permission-gate'
import AnalyticsV2Client from './analytics-v2-client'
import { loadAnalyticsV2Snapshot } from './analytics-v2-data'

const permissionGate = {
  requiredPermission: 'dashboard:read',
  title: '数据分析工作台访问受限',
  description:
    '数据分析工作台已接入管理员本地 session，只有具备 dashboard:read 的账号才能查看 Cohort、漏斗、留存健康度与实时事件流。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AnalyticsV2Page() {
  const snapshot = await loadAnalyticsV2Snapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource: 'loadAnalyticsV2Snapshot -> local analytics v2 snapshot',
    businessDataSource: 'local analytics governance samples',
    refreshPath: 'AnalyticsV2Page -> loadAnalyticsV2Snapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面使用本地分析样本快照，不代表真实分析主链，也不可作为闭环复签证据。',
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
        <AnalyticsV2Client snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
