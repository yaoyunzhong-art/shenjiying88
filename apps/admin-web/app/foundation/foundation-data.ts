import type { FoundationWorkspaceQuery } from '@m5/types'
import { loadFoundationWorkspace, type FoundationWorkspaceSnapshot } from '../foundation-view-model'

export type FoundationPageSnapshot = FoundationWorkspaceSnapshot & {
  sourceLabel: 'foundation-workspace-api' | 'foundation-workspace-fallback'
  note: string
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export function normalizeFoundationQuery(
  params: Record<string, string | string[] | undefined> = {},
): FoundationWorkspaceQuery {
  return {
    moduleKey: readQueryParam(params.moduleKey),
    consumer: readQueryParam(params.consumer),
  }
}

export async function loadFoundationPageSnapshot(
  query: FoundationWorkspaceQuery = {},
  init: RequestInit = {},
): Promise<FoundationPageSnapshot> {
  const workspaceSnapshot = await loadFoundationWorkspace(query, init)

  return {
    ...workspaceSnapshot,
    sourceLabel:
      workspaceSnapshot.deliveryMode === 'api'
        ? 'foundation-workspace-api'
        : 'foundation-workspace-fallback',
    note:
      workspaceSnapshot.deliveryMode === 'api'
        ? '当前页面读取 foundation bootstrap / overview / module detail 服务端快照。'
        : '当前页面存在 fallback 样本，仅可作为来源态与结构演练证据。',
  }
}
