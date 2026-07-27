import type { ResilienceQuery } from '@m5/types'
import type { ResilienceRetryPolicyDetail } from '../../../resilience-detail-view-model'
import { loadResilienceRetryPolicyDetail } from '../../../resilience-detail-view-model'

export interface ResilienceRetryPolicyDetailPageSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: string
  generatedAt: string
  query: ResilienceQuery
  detail: ResilienceRetryPolicyDetail
}

export async function loadResilienceRetryPolicyDetailPageSnapshot(
  key: string,
  query: ResilienceQuery = {}
): Promise<ResilienceRetryPolicyDetailPageSnapshot> {
  const detail = await loadResilienceRetryPolicyDetail(key, query, { cache: 'no-store' })

  return {
    deliveryMode: detail.deliveryMode,
    sourceLabel: `resilience-retry-detail:${detail.deliveryMode}`,
    generatedAt: detail.generatedAt,
    query: detail.query,
    detail,
  }
}
