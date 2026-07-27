import { AdminPermissionGate } from '../../components/admin-permission-gate'
import RuleDetailClient from './rule-detail-client'
import { loadRuleDetailSnapshot } from './rule-detail-data'

const permissionGate = {
  requiredPermission: 'rules:id:read',
  title: 'rules 访问受限',
  description: '该页面已切换到 E54 三层模板，仅具备 rules:id:read 权限的账号可查看来源态证据与规则详情。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id?: string | string[] }>
}

function readRuleId(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }
  return value ?? null
}

export default async function RuleDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const id = readRuleId(resolvedParams.id) ?? ''
  const snapshot = await loadRuleDetailSnapshot(id)
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadRuleDetailSnapshot -> buildRuleDetail mock snapshot',
    businessDataSource: 'local rules detail samples preserved under E54 wrapper',
    refreshPath: 'RuleDetailPage -> loadRuleDetailSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前规则详情仍为 mock 壳层，已完成 data -> page -> client 拆分，并保留刷新固证。',
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
        <RuleDetailClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
