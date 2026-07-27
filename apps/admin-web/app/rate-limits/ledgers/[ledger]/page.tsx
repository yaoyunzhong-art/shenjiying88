import { readRateLimitsLedgerDetailParam } from '@m5/types'
import { AdminPermissionGate } from '../../../components/admin-permission-gate'
import RateLimitsLedgerDetailClient from './rate-limits-ledger-detail-client'
import { loadRateLimitsLedgerDetailPageSnapshot } from './rate-limits-ledger-detail-data'

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '配额账本详情访问受限',
  description:
    '配额账本详情页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看主题、限额、重置时间与使用趋势。',
} as const

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{ ledger?: string | string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readLedgerId(value: string | string[] | undefined): string | null {
  return readRateLimitsLedgerDetailParam(value)
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export default async function RateLimitsLedgerDetailPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams])
  const ledgerId = readLedgerId(resolvedParams.ledger)
  const snapshot = await loadRateLimitsLedgerDetailPageSnapshot(ledgerId ?? '', {
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
        ? 'loadRateLimitsLedgerDetailPageSnapshot -> loadRateLimitsLedgerDetail(api)'
        : 'loadRateLimitsLedgerDetailPageSnapshot -> loadRateLimitsLedgerDetail fallback',
    businessDataSource:
      snapshot.detail.deliveryMode === 'api'
        ? 'rate limits ledger detail upstream API response'
        : 'local rate limits ledger samples',
    refreshPath: 'RateLimitsLedgerDetailPage -> loadRateLimitsLedgerDetailPageSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费配额账本服务端快照。'
        : '当前页面存在 fallback 账本样本，不可作为实时配额消耗证据。',
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
        <RateLimitsLedgerDetailClient snapshot={snapshot.detail} />
      </div>
    </AdminPermissionGate>
  )
}
