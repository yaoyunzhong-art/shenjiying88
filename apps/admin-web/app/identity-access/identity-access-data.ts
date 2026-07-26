import type { FoundationConsumerDescriptor, IdentityAccessWorkspace, IdentityAccessWorkspaceQuery } from '@m5/types'
import { getAdminWorkbenchConsumerSnapshot } from '../bootstrap'
import { loadIdentityAccessWorkspace } from '../identity-access-view-model'

export interface IdentityAccessPageSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: string
  generatedAt: string
  query: IdentityAccessWorkspaceQuery
  workspace: IdentityAccessWorkspace
  workspaceDeliveryMode: 'api' | 'fallback'
  bootstrapDeliveryMode: 'api' | 'fallback'
  foundationDependencies: string[]
  handoffContracts: string[]
  consumerDescriptor: FoundationConsumerDescriptor
}

export async function loadIdentityAccessPageSnapshot(
  query: IdentityAccessWorkspaceQuery = {},
): Promise<IdentityAccessPageSnapshot> {
  const [workspaceSnapshot, workbenchSnapshot] = await Promise.all([
    loadIdentityAccessWorkspace(query),
    getAdminWorkbenchConsumerSnapshot(),
  ])

  const deliveryMode =
    workspaceSnapshot.deliveryMode === 'api' && workbenchSnapshot.deliveryMode === 'api'
      ? 'api'
      : 'fallback'

  return {
    deliveryMode,
    sourceLabel: `identity-access-workspace:${workspaceSnapshot.deliveryMode}|workbench:${workbenchSnapshot.deliveryMode}`,
    generatedAt: workspaceSnapshot.generatedAt,
    query: workspaceSnapshot.query,
    workspace: workspaceSnapshot.workspace,
    workspaceDeliveryMode: workspaceSnapshot.deliveryMode,
    bootstrapDeliveryMode: workbenchSnapshot.deliveryMode,
    foundationDependencies: [...workbenchSnapshot.foundationDependencies],
    handoffContracts: [...workbenchSnapshot.consumerDescriptor.handoffContracts],
    consumerDescriptor: workbenchSnapshot.consumerDescriptor,
  }
}
