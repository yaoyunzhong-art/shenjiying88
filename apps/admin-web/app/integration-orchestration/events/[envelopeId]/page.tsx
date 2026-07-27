import { readIntegrationOrchestrationEventDetailParam } from '@m5/types'
import { AdminPermissionGate } from '../../../components/admin-permission-gate'
import IntegrationOrchestrationEventDetailClient from './integration-orchestration-event-detail-client'
import { loadIntegrationOrchestrationEventDetailPageSnapshot } from './integration-orchestration-event-detail-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '事件信封详情访问受限',
  description:
    '事件信封详情页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看 envelope 字段与关联幂等记录。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ envelopeId?: string | string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readEnvelopeId(value: string | string[] | undefined): string | null {
  return readIntegrationOrchestrationEventDetailParam(value)
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export default async function IntegrationOrchestrationEventDetailPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams])
  const envelopeId = readEnvelopeId(resolvedParams.envelopeId)
  const snapshot = await loadIntegrationOrchestrationEventDetailPageSnapshot(envelopeId ?? '', {
    source: readQueryParam(resolvedSearch.source),
  })
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadIntegrationOrchestrationEventDetailPageSnapshot -> loadIntegrationOrchestrationEventDetail(api)'
        : 'loadIntegrationOrchestrationEventDetailPageSnapshot -> loadIntegrationOrchestrationEventDetail fallback',
    businessDataSource:
      snapshot.detail.deliveryMode === 'api'
        ? 'integration event detail upstream API response'
        : 'local integration event detail samples',
    refreshPath: 'IntegrationOrchestrationEventDetailPage -> loadIntegrationOrchestrationEventDetailPageSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费事件详情服务端快照。'
        : '当前页面存在 fallback 详情样本，不可作为实时 envelope 追踪证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
          <div>
            Delivery {sourceEvidence.deliveryMode} / {sourceEvidence.sourceLabel}
          </div>
          <div>
            控制面来源: {sourceEvidence.controlPlaneSource} / 业务数据: {sourceEvidence.businessDataSource}
          </div>
          <div>
            refreshPath: {sourceEvidence.refreshPath} / generatedAt: {sourceEvidence.generatedAt}
          </div>
          <div>{sourceEvidence.note}</div>
        </div>
        <IntegrationOrchestrationEventDetailClient snapshot={snapshot.detail} />
      </div>
    </AdminPermissionGate>
  )
}
