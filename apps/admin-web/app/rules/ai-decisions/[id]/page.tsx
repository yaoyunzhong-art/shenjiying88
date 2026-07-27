import { AdminPermissionGate } from '../../../components/admin-permission-gate'
import AiDecisionDetailClient from './ai-decision-detail-client'
import { loadAiDecisionDetailSnapshot } from './ai-decision-detail-data'

const permissionGate = {
  requiredPermission: 'rules:ai-decisions:id:read',
  title: 'rules ai-decisions 访问受限',
  description:
    '该页面已切换到 E54 三层模板，仅具备 rules:ai-decisions:id:read 权限的账号可访问来源态证据与详情快照。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ id?: string | string[] }>
}

function readDecisionId(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }
  return value ?? null
}

export default async function AiDecisionDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const id = readDecisionId(resolvedParams.id) ?? ''
  const snapshot = await loadAiDecisionDetailSnapshot(id)
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: 'loadAiDecisionDetailSnapshot -> buildAiDecisionDetail mock snapshot',
    businessDataSource: 'local ai decision detail samples preserved under E54 wrapper',
    refreshPath: 'AiDecisionDetailPage -> loadAiDecisionDetailSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前 AI 决策详情仍为 mock 壳层，已完成 data -> page -> client 拆分，并提供刷新固证。',
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
        <AiDecisionDetailClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
