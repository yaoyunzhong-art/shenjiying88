import { AdminPermissionGate } from '../components/admin-permission-gate'
import PointsRulesClient from './points-rules-client'
import { loadPointsRulesSnapshot } from './points-rules-data'

const permissionGate = {
  requiredPermission: 'points-rules:read',
  title: 'points-rules 访问受限',
  description: '该页面已接入管理员权限管控，仅具备 points-rules:read 权限的账号可访问。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PointsRulesPage() {
  const snapshot = await loadPointsRulesSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadPointsRulesSnapshot -> member/points-rules + member/points-summary'
        : 'loadPointsRulesSnapshot -> defaultRules/defaultSummary fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'member points upstream API responses'
        : 'local points-rules fallback samples',
    refreshPath: 'PointsRulesPage -> loadPointsRulesSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费积分规则服务端快照。'
        : '当前页面已回退到本地积分规则样本，不可作为闭环复签证据。',
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
        <PointsRulesClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
