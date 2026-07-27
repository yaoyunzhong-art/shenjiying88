import { readResilienceRetryPolicyDetailParam } from '@m5/types'
import { AdminPermissionGate } from '../../../components/admin-permission-gate'
import ResilienceRetryPolicyDetailClient from './resilience-retry-policy-detail-client'
import { loadResilienceRetryPolicyDetailPageSnapshot } from './resilience-retry-policy-detail-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '重试策略详情访问受限',
  description:
    '重试策略详情页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看重试上限、退避策略、恢复动作与升级目标。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ key?: string | string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export default async function ResilienceRetryPolicyDetailPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams])
  const key = readResilienceRetryPolicyDetailParam(resolvedParams.key)
  const snapshot = await loadResilienceRetryPolicyDetailPageSnapshot(key ?? '', {
    capability: readQueryParam(resolvedSearch.capability),
    status: readQueryParam(resolvedSearch.status),
    resource: readQueryParam(resolvedSearch.resource),
  })
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadResilienceRetryPolicyDetailPageSnapshot -> loadResilienceRetryPolicyDetail(api)'
        : 'loadResilienceRetryPolicyDetailPageSnapshot -> loadResilienceRetryPolicyDetail fallback',
    businessDataSource:
      snapshot.detail.deliveryMode === 'api'
        ? 'resilience operations overview.retries.policies API snapshot'
        : 'fallback resilience retry policy snapshot',
    refreshPath: 'ResilienceRetryPolicyDetailPage -> loadResilienceRetryPolicyDetailPageSnapshot',
    generatedAt: snapshot.generatedAt,
    note: snapshot.detail.notFound
      ? '当前 key 未命中 resilience 重试策略快照，详情面板展示 notFound 固证。'
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
        <ResilienceRetryPolicyDetailClient snapshot={snapshot.detail} />
      </div>
    </AdminPermissionGate>
  )
}
