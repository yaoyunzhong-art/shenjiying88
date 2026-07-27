import { readResilienceSignalDetailParam } from '@m5/types'
import { AdminPermissionGate } from '../../../components/admin-permission-gate'
import ResilienceSignalDetailClient from './resilience-signal-detail-client'
import { loadResilienceSignalDetailPageSnapshot } from './resilience-signal-detail-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '可观测信号详情访问受限',
  description:
    '可观测信号详情页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看覆盖率、采集滞后、负责人和告警路由。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ signal?: string | string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export default async function ResilienceSignalDetailPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams])
  const signal = readResilienceSignalDetailParam(resolvedParams.signal)
  const snapshot = await loadResilienceSignalDetailPageSnapshot(signal ?? '', {
    capability: readQueryParam(resolvedSearch.capability),
    status: readQueryParam(resolvedSearch.status),
    resource: readQueryParam(resolvedSearch.resource),
  })
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadResilienceSignalDetailPageSnapshot -> loadResilienceSignalDetail(api)'
        : 'loadResilienceSignalDetailPageSnapshot -> loadResilienceSignalDetail fallback',
    businessDataSource:
      snapshot.detail.deliveryMode === 'api'
        ? 'resilience operations overview.observability.signals API snapshot'
        : 'fallback resilience signal snapshot',
    refreshPath: 'ResilienceSignalDetailPage -> loadResilienceSignalDetailPageSnapshot',
    generatedAt: snapshot.generatedAt,
    note: snapshot.detail.notFound
      ? '当前 signal 未命中 resilience 信号快照，详情面板展示 notFound 固证。'
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
        <ResilienceSignalDetailClient snapshot={snapshot.detail} />
      </div>
    </AdminPermissionGate>
  )
}
