import { AdminPermissionGate } from '../components/admin-permission-gate'
import IntelligenceClient from './intelligence-client'
import { loadIntelligenceSnapshot } from './intelligence-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '情报总览访问受限',
  description:
    '情报总览页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看监控 KPI、告警入口与运营决策导航。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function IntelligencePage() {
  const snapshot = await loadIntelligenceSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadIntelligenceSnapshot -> loadMonitorSnapshot -> intelligence/monitor/summary'
        : 'loadIntelligenceSnapshot -> loadMonitorSnapshot -> defaultMonitorSummary fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'monitor summary upstream API response + local decision inventory'
        : 'fallback monitor samples + local decision inventory',
    refreshPath: 'IntelligencePage -> loadIntelligenceSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费 intelligence 服务端快照。'
        : '当前页面已回退到本地 intelligence 样本，不可作为闭环复签证据。',
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
        <IntelligenceClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
