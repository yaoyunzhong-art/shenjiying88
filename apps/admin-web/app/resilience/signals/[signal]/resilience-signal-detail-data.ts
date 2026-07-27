import type { ResilienceQuery } from '@m5/types'
import type { ResilienceSignalDetail } from '../../../resilience-detail-view-model'
import { loadResilienceSignalDetail } from '../../../resilience-detail-view-model'

export interface ResilienceSignalDetailPageSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: string
  generatedAt: string
  query: ResilienceQuery
  detail: ResilienceSignalDetail
}

export async function loadResilienceSignalDetailPageSnapshot(
  signal: string,
  query: ResilienceQuery = {}
): Promise<ResilienceSignalDetailPageSnapshot> {
  const detail = await loadResilienceSignalDetail(signal, query, { cache: 'no-store' })

  return {
    deliveryMode: detail.deliveryMode,
    sourceLabel: `resilience-signal-detail:${detail.deliveryMode}`,
    generatedAt: detail.generatedAt,
    query: detail.query,
    detail,
  }
}
