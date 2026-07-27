import type { ConfigurationOperationDetailDelivery } from '../../../configuration-operation-view-model'
import { loadConfigurationOperationDetail } from '../../../configuration-operation-view-model'

export interface ConfigurationOperationDetailPageSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: string
  generatedAt: string
  detail: ConfigurationOperationDetailDelivery
}

export async function loadConfigurationOperationDetailPageSnapshot(
  operation: string
): Promise<ConfigurationOperationDetailPageSnapshot> {
  const detail = await loadConfigurationOperationDetail(operation, { cache: 'no-store' })

  return {
    deliveryMode: detail.deliveryMode,
    sourceLabel: `configuration-operation-detail:${detail.deliveryMode}`,
    generatedAt: detail.generatedAt,
    detail,
  }
}
