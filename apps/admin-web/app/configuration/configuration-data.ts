import type { ConfigurationOverviewQuery } from '@m5/types'
import {
  loadConfigurationGovernanceSnapshot,
  type ConfigurationSnapshotDelivery,
} from '../configuration-view-model'

export type ConfigurationPageSnapshot = ConfigurationSnapshotDelivery & {
  sourceLabel:
    | 'configuration-governance-api'
    | 'configuration-governance-fallback'
  note: string
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export function normalizeConfigurationQuery(
  params: Record<string, string | string[] | undefined> = {},
): ConfigurationOverviewQuery {
  return {
    tenantId: readQueryParam(params.tenantId),
    brandId: readQueryParam(params.brandId),
    storeId: readQueryParam(params.storeId),
    marketCode: readQueryParam(params.marketCode),
  }
}

export async function loadConfigurationPageSnapshot(
  query: ConfigurationOverviewQuery = {},
): Promise<ConfigurationPageSnapshot> {
  const snapshot = await loadConfigurationGovernanceSnapshot(query, {
    cache: 'no-store',
  })

  return {
    ...snapshot,
    sourceLabel:
      snapshot.deliveryMode === 'api'
        ? 'configuration-governance-api'
        : 'configuration-governance-fallback',
    note:
      snapshot.deliveryMode === 'api'
        ? '当前工作台读取 configuration-governance 服务端快照，可用于来源态比对与治理分析。'
        : '当前工作台落在 configuration-governance fallback 样本，仅可作为结构固证与交互演练证据。',
  }
}
