import type { ResilienceQuery } from '@m5/types'
import type { ResilienceRecoveryPlanDetail } from '../../../resilience-detail-view-model'
import { loadResilienceRecoveryPlanDetail } from '../../../resilience-detail-view-model'

export interface ResilienceRecoveryPlanDetailPageSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: string
  generatedAt: string
  query: ResilienceQuery
  detail: ResilienceRecoveryPlanDetail
}

export async function loadResilienceRecoveryPlanDetailPageSnapshot(
  resource: string,
  query: ResilienceQuery = {}
): Promise<ResilienceRecoveryPlanDetailPageSnapshot> {
  const detail = await loadResilienceRecoveryPlanDetail(resource, query, { cache: 'no-store' })

  return {
    deliveryMode: detail.deliveryMode,
    sourceLabel: `resilience-recovery-detail:${detail.deliveryMode}`,
    generatedAt: detail.generatedAt,
    query: detail.query,
    detail,
  }
}
