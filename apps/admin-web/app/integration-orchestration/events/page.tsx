import { AdminPermissionGate } from '../../components/admin-permission-gate'
import IntegrationOrchestrationEventsClient from './integration-orchestration-events-client'
import { loadIntegrationOrchestrationEventsPageSnapshot } from './integration-orchestration-events-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '事件信封列表访问受限',
  description:
    '事件信封列表页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看来源筛选、投递状态与幂等关联。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export default async function IntegrationOrchestrationEventsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const snapshot = await loadIntegrationOrchestrationEventsPageSnapshot({
    source: readQueryParam(params.source),
  })
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadIntegrationOrchestrationEventsPageSnapshot -> loadIntegrationOrchestrationWorkspace(api)'
        : 'loadIntegrationOrchestrationEventsPageSnapshot -> loadIntegrationOrchestrationWorkspace fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'integration event envelopes upstream API response'
        : 'local integration event envelope samples',
    refreshPath: 'IntegrationOrchestrationEventsPage -> loadIntegrationOrchestrationEventsPageSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费事件信封服务端快照。'
        : '当前页面已回退到本地事件样本，不可作为实时投递证据。',
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
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
        <IntegrationOrchestrationEventsClient events={snapshot.events} sources={snapshot.sources} />
      </div>
    </AdminPermissionGate>
  )
}
