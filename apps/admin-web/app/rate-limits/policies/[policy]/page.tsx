import { readRateLimitsPolicyDetailParam } from '@m5/types'
import { AdminPermissionGate } from '../../../components/admin-permission-gate'
import RateLimitsPolicyDetailClient from './rate-limits-policy-detail-client'
import { loadRateLimitsPolicyDetailPageSnapshot } from './rate-limits-policy-detail-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '限流策略详情访问受限',
  description:
    '限流策略详情页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看作用域、算法、限额与匹配账本。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ policy?: string | string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readPolicyId(value: string | string[] | undefined): string | null {
  return readRateLimitsPolicyDetailParam(value)
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export default async function RateLimitsPolicyDetailPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams])
  const policyId = readPolicyId(resolvedParams.policy)
  const snapshot = await loadRateLimitsPolicyDetailPageSnapshot(policyId ?? '', {
    tenantId: readQueryParam(resolvedSearch.tenantId),
    policyCode: readQueryParam(resolvedSearch.policyCode),
    subjectKey: readQueryParam(resolvedSearch.subjectKey),
    status: readQueryParam(resolvedSearch.status),
  })
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadRateLimitsPolicyDetailPageSnapshot -> loadRateLimitsPolicyDetail(api)'
        : 'loadRateLimitsPolicyDetailPageSnapshot -> loadRateLimitsPolicyDetail fallback',
    businessDataSource:
      snapshot.detail.deliveryMode === 'api'
        ? 'rate limits policy detail upstream API response'
        : 'local rate limits policy samples',
    refreshPath: 'RateLimitsPolicyDetailPage -> loadRateLimitsPolicyDetailPageSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费限流策略服务端快照。'
        : '当前页面存在 fallback 策略样本，不可作为实时限流配置证据。',
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
        <RateLimitsPolicyDetailClient snapshot={snapshot.detail} />
      </div>
    </AdminPermissionGate>
  )
}
