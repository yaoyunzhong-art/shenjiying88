import { readResilienceRecoveryPlanDetailParam } from '@m5/types'
import { AdminPermissionGate } from '../../../components/admin-permission-gate'
import ResilienceRecoveryPlanDetailClient from './resilience-recovery-plan-detail-client'
import { loadResilienceRecoveryPlanDetailPageSnapshot } from './resilience-recovery-plan-detail-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '恢复计划详情访问受限',
  description:
    '恢复计划详情页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看 RTO、RPO、依赖关系、演练窗口与 Runbook。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ resource?: string | string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export default async function ResilienceRecoveryPlanDetailPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams])
  const resource = readResilienceRecoveryPlanDetailParam(resolvedParams.resource)
  const snapshot = await loadResilienceRecoveryPlanDetailPageSnapshot(resource ?? '', {
    capability: readQueryParam(resolvedSearch.capability),
    status: readQueryParam(resolvedSearch.status),
    resource: readQueryParam(resolvedSearch.resource),
  })
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadResilienceRecoveryPlanDetailPageSnapshot -> loadResilienceRecoveryPlanDetail(api)'
        : 'loadResilienceRecoveryPlanDetailPageSnapshot -> loadResilienceRecoveryPlanDetail fallback',
    businessDataSource:
      snapshot.detail.deliveryMode === 'api'
        ? 'resilience operations overview.recovery.plans API snapshot'
        : 'fallback resilience recovery snapshot',
    refreshPath: 'ResilienceRecoveryPlanDetailPage -> loadResilienceRecoveryPlanDetailPageSnapshot',
    generatedAt: snapshot.generatedAt,
    note: snapshot.detail.notFound
      ? '当前资源未命中 resilience 恢复计划快照，详情面板展示 notFound 固证。'
      : '当前详情页已切换为服务端快照首屏，客户端交互仅负责渲染与刷新。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
          <div>
            Delivery {sourceEvidence.deliveryMode} · 来源标签: {sourceEvidence.sourceLabel}
          </div>
          <div>
            控制面来源: {sourceEvidence.controlPlaneSource} · 业务数据: {sourceEvidence.businessDataSource}
          </div>
          <div>
            refreshPath: {sourceEvidence.refreshPath} · generatedAt: {sourceEvidence.generatedAt}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <ResilienceRecoveryPlanDetailClient snapshot={snapshot.detail} />
      </div>
    </AdminPermissionGate>
  )
}
