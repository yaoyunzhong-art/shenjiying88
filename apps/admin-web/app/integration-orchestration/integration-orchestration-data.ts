import type {
  FoundationConsumerDescriptor,
  IntegrationOrchestrationWorkspace,
  IntegrationOrchestrationWorkspaceQuery,
} from '@m5/types'
import { getAdminWorkbenchConsumerSnapshot } from '../bootstrap'
import { loadIntegrationOrchestrationWorkspace } from '../integration-orchestration-view-model'

export interface IntegrationOrchestrationPageSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: string
  generatedAt: string
  query: IntegrationOrchestrationWorkspaceQuery
  workspace: IntegrationOrchestrationWorkspace
  workspaceDeliveryMode: 'api' | 'fallback'
  bootstrapDeliveryMode: 'api' | 'fallback'
  foundationDependencies: string[]
  consumerDescriptor: FoundationConsumerDescriptor
}

export async function loadIntegrationOrchestrationPageSnapshot(
  query: IntegrationOrchestrationWorkspaceQuery = {},
): Promise<IntegrationOrchestrationPageSnapshot> {
  const [workspaceSnapshot, workbenchSnapshot] = await Promise.all([
    loadIntegrationOrchestrationWorkspace(query, { cache: 'no-store' }),
    getAdminWorkbenchConsumerSnapshot(),
  ])

  const deliveryMode =
    workspaceSnapshot.deliveryMode === 'api' && workbenchSnapshot.deliveryMode === 'api'
      ? 'api'
      : 'fallback'

  return {
    deliveryMode,
    sourceLabel: `integration-orchestration-workspace:${workspaceSnapshot.deliveryMode}|workbench:${workbenchSnapshot.deliveryMode}`,
    generatedAt: workspaceSnapshot.generatedAt,
    query: workspaceSnapshot.query,
    workspace: workspaceSnapshot.workspace,
    workspaceDeliveryMode: workspaceSnapshot.deliveryMode,
    bootstrapDeliveryMode: workbenchSnapshot.deliveryMode,
    foundationDependencies: [...workbenchSnapshot.foundationDependencies],
    consumerDescriptor: workbenchSnapshot.consumerDescriptor,
  }
}
