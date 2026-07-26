import { AdminPermissionGate } from '../../components/admin-permission-gate'
import MonitorClient from './monitor-client'
import { loadMonitorSnapshot } from './monitor-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '情报监控访问受限',
  description:
    '情报监控页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看告警汇总、趋势、刷新状态与监控明细。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MonitorPage() {
  const snapshot = await loadMonitorSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadMonitorSnapshot -> intelligence/monitor/summary'
        : 'loadMonitorSnapshot -> defaultMonitorSummary fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'monitor summary upstream API response'
        : 'local monitor alert samples',
    refreshPath: 'MonitorPage -> loadMonitorSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费 intelligence monitor 服务端快照。'
        : '当前页面已回退到本地监控样本，不可作为闭环复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
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
        <MonitorClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
