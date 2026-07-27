import type { RateLimitWorkspaceQuery } from '@m5/types'
import type { RateLimitsLedgerDetail } from '../../../rate-limits-detail-view-model'
import { loadRateLimitsLedgerDetail } from '../../../rate-limits-detail-view-model'

export interface RateLimitsLedgerDetailPageSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: string
  generatedAt: string
  query: RateLimitWorkspaceQuery
  detail: RateLimitsLedgerDetail
}

export async function loadRateLimitsLedgerDetailPageSnapshot(
  ledgerId: string,
  query: RateLimitWorkspaceQuery = {},
): Promise<RateLimitsLedgerDetailPageSnapshot> {
  const detail = await loadRateLimitsLedgerDetail(ledgerId, query, { cache: 'no-store' })

  return {
    deliveryMode: detail.deliveryMode,
    sourceLabel: `rate-limits-ledger-detail:${detail.deliveryMode}`,
    generatedAt: detail.generatedAt,
    query: detail.query,
    detail,
  }
}
