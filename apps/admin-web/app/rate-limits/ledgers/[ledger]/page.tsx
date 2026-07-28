import { readRateLimitsLedgerDetailParam, type QuotaLedgerStatus } from '@m5/types'
import RateLimitsLedgerDetailClient from './rate-limits-ledger-detail-client'
import { loadRateLimitsLedgerDetailPageSnapshot } from './rate-limits-ledger-detail-data'

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
  const status = readQueryParam(resolvedSearch.status) as QuotaLedgerStatus | 'ALL' | undefined
  const snapshot = await loadRateLimitsLedgerDetailPageSnapshot(ledgerId ?? '', {
    tenantId: readQueryParam(resolvedSearch.tenantId),
    policyCode: readQueryParam(resolvedSearch.policyCode),
    subjectKey: readQueryParam(resolvedSearch.subjectKey),
    status,
  })
  return <RateLimitsLedgerDetailClient snapshot={snapshot.detail} />
}
