import { readIntegrationOrchestrationIdempotencyDetailParam } from '@m5/types'
import { AdminPermissionGate } from '../../../components/admin-permission-gate'
import IntegrationOrchestrationIdempotencyDetailClient from './integration-orchestration-idempotency-detail-client'
import { loadIntegrationOrchestrationIdempotencyDetailPageSnapshot } from './integration-orchestration-idempotency-detail-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '幂等记录访问受限',
  description:
    '幂等记录详情页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看幂等键、Payload 校验和、处理状态与关联信封。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ key?: string | string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readIdempotencyKey(value: string | string[] | undefined): string | null {
  return readIntegrationOrchestrationIdempotencyDetailParam(value)
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export default async function IntegrationOrchestrationIdempotencyDetailPage({
  params,
  searchParams,
}: PageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams])
  const key = readIdempotencyKey(resolvedParams.key)
  const snapshot = await loadIntegrationOrchestrationIdempotencyDetailPageSnapshot(key ?? '', {
    source: readQueryParam(resolvedSearch.source),
  })
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadIntegrationOrchestrationIdempotencyDetailPageSnapshot -> loadIntegrationOrchestrationIdempotencyDetail(api)'
        : 'loadIntegrationOrchestrationIdempotencyDetailPageSnapshot -> loadIntegrationOrchestrationIdempotencyDetail fallback',
    businessDataSource:
      snapshot.detail.deliveryMode === 'api'
        ? 'integration idempotency detail upstream API response'
        : 'local integration idempotency detail samples',
    refreshPath:
      'IntegrationOrchestrationIdempotencyDetailPage -> loadIntegrationOrchestrationIdempotencyDetailPageSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费幂等详情服务端快照。'
        : '当前页面存在 fallback 详情样本，不可作为实时幂等闭环证据。',
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
        <IntegrationOrchestrationIdempotencyDetailClient snapshot={snapshot.detail} />
      </div>
    </AdminPermissionGate>
  )
}
