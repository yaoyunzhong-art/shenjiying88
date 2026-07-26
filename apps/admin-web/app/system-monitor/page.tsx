import SystemMonitorClient from './system-monitor-client'
import { loadSystemMonitorSnapshot } from './system-monitor-data'
import { AdminPermissionGate } from '../components/admin-permission-gate'
const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '系统监控访问受限',
  description:
    '系统监控页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看服务健康、实时指标与活动日志。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SystemMonitorPage() {
  const snapshot = await loadSystemMonitorSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadSystemMonitorSnapshot -> system/metrics + system/services + system/activities'
        : 'loadSystemMonitorSnapshot -> defaultMetrics/defaultServices/defaultLogs',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'system monitor upstream API responses'
        : 'local fallback monitor samples',
    refreshPath: 'SystemMonitorPage -> loadSystemMonitorSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费 system-monitor 服务端快照。'
        : '当前页面已回退到本地样本，不可作为闭环复签证据。'
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
        <SystemMonitorClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
