import type { IntegrationOrchestrationWorkspaceQuery } from '@m5/types'
import type { IntegrationOrchestrationIdempotencyDetail } from '../../../integration-orchestration-detail-view-model'
import { loadIntegrationOrchestrationIdempotencyDetail } from '../../../integration-orchestration-detail-view-model'

export interface IntegrationOrchestrationIdempotencyDetailPageSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: string
  generatedAt: string
  query: IntegrationOrchestrationWorkspaceQuery
  detail: IntegrationOrchestrationIdempotencyDetail
}

export async function loadIntegrationOrchestrationIdempotencyDetailPageSnapshot(
  key: string,
  query: IntegrationOrchestrationWorkspaceQuery = {},
): Promise<IntegrationOrchestrationIdempotencyDetailPageSnapshot> {
  const detail = await loadIntegrationOrchestrationIdempotencyDetail(key, query, { cache: 'no-store' })

  return {
    deliveryMode: detail.deliveryMode,
    sourceLabel: `integration-orchestration-idempotency-detail:${detail.deliveryMode}`,
    generatedAt: detail.generatedAt,
    query: detail.query,
    detail,
  }
}
