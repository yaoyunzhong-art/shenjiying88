import type { RateLimitWorkspaceQuery } from '@m5/types'
import type { RateLimitsPolicyDetail } from '../../../rate-limits-detail-view-model'
import { loadRateLimitsPolicyDetail } from '../../../rate-limits-detail-view-model'

export interface RateLimitsPolicyDetailPageSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: string
  generatedAt: string
  query: RateLimitWorkspaceQuery
  detail: RateLimitsPolicyDetail
}

export async function loadRateLimitsPolicyDetailPageSnapshot(
  policyId: string,
  query: RateLimitWorkspaceQuery = {},
): Promise<RateLimitsPolicyDetailPageSnapshot> {
  const detail = await loadRateLimitsPolicyDetail(policyId, query, { cache: 'no-store' })

  return {
    deliveryMode: detail.deliveryMode,
    sourceLabel: `rate-limits-policy-detail:${detail.deliveryMode}`,
    generatedAt: detail.generatedAt,
    query: detail.query,
    detail,
  }
}
