import { notFound } from 'next/navigation'
import { AdminPermissionGate } from '../../../components/admin-permission-gate'
import RuleExecutionDetailClient from './execution-detail-client'
import { loadRuleExecutionDetailSnapshot } from './execution-detail-data'

const permissionGate = {
  requiredPermission: 'rules:executions:id:read',
  title: '规则执行详情访问受限',
  description:
    '规则执行详情页已切换到 server wrapper + snapshot loader，仅具备 rules:executions:id:read 权限的账号可查看来源态证据与执行细节。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RuleExecutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const snapshot = await loadRuleExecutionDetailSnapshot(id)

  if (!snapshot) {
    notFound()
  }

  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadRuleExecutionDetailSnapshot -> defaultRuleExecutionDetails snapshot',
    businessDataSource: 'local rule execution detail sample snapshot records',
    refreshPath: 'RuleExecutionDetailPage -> loadRuleExecutionDetailSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前详情页消费本地规则执行详情快照，适用于结构固证与交互演练，不作为实时复签证据。',
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
        <RuleExecutionDetailClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
