import type {
  IntegrationEventEnvelopeContract,
  IntegrationOrchestrationWorkspaceQuery,
  IntegrationWebhookSourceContract,
} from '@m5/types'
import { loadIntegrationOrchestrationWorkspace } from '../../integration-orchestration-view-model'

export interface IntegrationOrchestrationEventsPageSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: string
  generatedAt: string
  query: IntegrationOrchestrationWorkspaceQuery
  events: IntegrationEventEnvelopeContract[]
  sources: IntegrationWebhookSourceContract[]
}

export async function loadIntegrationOrchestrationEventsPageSnapshot(
  query: IntegrationOrchestrationWorkspaceQuery = {},
): Promise<IntegrationOrchestrationEventsPageSnapshot> {
  const workspaceSnapshot = await loadIntegrationOrchestrationWorkspace(query, { cache: 'no-store' })

  return {
    deliveryMode: workspaceSnapshot.deliveryMode,
    sourceLabel: `integration-orchestration-events:${workspaceSnapshot.deliveryMode}`,
    generatedAt: workspaceSnapshot.generatedAt,
    query: workspaceSnapshot.query,
    events: workspaceSnapshot.workspace.events,
    sources: workspaceSnapshot.workspace.sources,
  }
}
