import type { IntegrationOrchestrationWorkspaceQuery } from '@m5/types'
import type { IntegrationOrchestrationEventDetail } from '../../../integration-orchestration-detail-view-model'
import { loadIntegrationOrchestrationEventDetail } from '../../../integration-orchestration-detail-view-model'

export interface IntegrationOrchestrationEventDetailPageSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: string
  generatedAt: string
  query: IntegrationOrchestrationWorkspaceQuery
  detail: IntegrationOrchestrationEventDetail
}

export async function loadIntegrationOrchestrationEventDetailPageSnapshot(
  envelopeId: string,
  query: IntegrationOrchestrationWorkspaceQuery = {},
): Promise<IntegrationOrchestrationEventDetailPageSnapshot> {
  const detail = await loadIntegrationOrchestrationEventDetail(envelopeId, query, { cache: 'no-store' })

  return {
    deliveryMode: detail.deliveryMode,
    sourceLabel: `integration-orchestration-event-detail:${detail.deliveryMode}`,
    generatedAt: detail.generatedAt,
    query: detail.query,
    detail,
  }
}
