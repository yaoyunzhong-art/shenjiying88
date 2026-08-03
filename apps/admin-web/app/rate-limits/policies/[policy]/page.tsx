import { readRateLimitsPolicyDetailParam, type QuotaLedgerStatus } from '@m5/types'
import RateLimitsPolicyDetailClient from './rate-limits-policy-detail-client'
import { loadRateLimitsPolicyDetailPageSnapshot } from './rate-limits-policy-detail-data'

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
  const status = readQueryParam(resolvedSearch.status) as QuotaLedgerStatus | 'ALL' | undefined
  const snapshot = await loadRateLimitsPolicyDetailPageSnapshot(policyId ?? '', {
    tenantId: readQueryParam(resolvedSearch.tenantId),
    policyCode: readQueryParam(resolvedSearch.policyCode),
    subjectKey: readQueryParam(resolvedSearch.subjectKey),
    status,
  })
  return <RateLimitsPolicyDetailClient snapshot={snapshot.detail} />
}
