import { AdminPermissionGate } from '../../components/admin-permission-gate'
import RuleExecutionsClient from './executions-client'
import { loadRuleExecutionsSnapshot } from './executions-data'

const permissionGate = {
  requiredPermission: 'rules:executions:read',
  title: '规则执行结果访问受限',
  description:
    '规则执行结果页已切换到 server wrapper + snapshot loader，仅具备 rules:executions:read 权限的账号可查看执行来源态证据。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RuleExecutionsPage() {
  const snapshot = await loadRuleExecutionsSnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadRuleExecutionsSnapshot -> defaultRuleExecutions snapshot',
    businessDataSource: 'local rule execution sample snapshot records',
    refreshPath: 'RuleExecutionsPage -> loadRuleExecutionsSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前页面消费本地规则执行快照样本，适用于结构固证与交互演示，不作为实时复签证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
          <div>
            Delivery {sourceEvidence.deliveryMode} · 来源标签: {sourceEvidence.sourceLabel}
          </div>
          <div>
            控制面来源: {sourceEvidence.controlPlaneSource} · 业务数据: {sourceEvidence.businessDataSource}
          </div>
          <div>
            刷新路径: {sourceEvidence.refreshPath} · generatedAt: {sourceEvidence.generatedAt}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <RuleExecutionsClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
