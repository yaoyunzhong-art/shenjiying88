import { AdminPermissionGate } from '../components/admin-permission-gate'
import IntegrationOrchestrationWorkspaceClient from './integration-orchestration-workspace-client'
import { loadIntegrationOrchestrationPageSnapshot } from './integration-orchestration-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '集成编排访问受限',
  description:
    '集成编排页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看来源目录、事件信封与幂等治理快照。',
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

export default async function IntegrationOrchestrationPage({ searchParams }: PageProps) {
  const params = await searchParams
  const snapshot = await loadIntegrationOrchestrationPageSnapshot({
    source: readQueryParam(params.source),
  })
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadIntegrationOrchestrationPageSnapshot -> loadIntegrationOrchestrationWorkspace(api) + getAdminWorkbenchConsumerSnapshot(api)'
        : 'loadIntegrationOrchestrationPageSnapshot -> loadIntegrationOrchestrationWorkspace/getAdminWorkbenchConsumerSnapshot fallback',
    businessDataSource:
      snapshot.workspaceDeliveryMode === 'api'
        ? 'integration orchestration workspace upstream API response'
        : 'local integration orchestration samples',
    refreshPath: 'IntegrationOrchestrationPage -> loadIntegrationOrchestrationPageSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费集成编排服务端快照。'
        : '当前页面存在 fallback 数据源，治理证据需结合上游可达性复核。',
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
        <IntegrationOrchestrationWorkspaceClient
          workspace={snapshot.workspace}
          foundationDependencies={snapshot.foundationDependencies}
        />
      </div>
    </AdminPermissionGate>
  )
}
