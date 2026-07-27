import type { AgentConfig } from '@m5/types'

import { loadAgentConfigs } from '../agent-view-model'

export interface AgentStudioSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'agent-studio-api' | 'agent-studio-fallback'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  configs: AgentConfig[]
  error?: string
}

export async function loadAgentStudioSnapshot(): Promise<AgentStudioSnapshot> {
  const snapshot = await loadAgentConfigs({ cache: 'no-store' })

  return {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel:
      snapshot.deliveryMode === 'api'
        ? 'agent-studio-api'
        : 'agent-studio-fallback',
    generatedAt: new Date().toISOString(),
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadAgentStudioSnapshot -> loadAgentConfigs(no-store)'
        : 'loadAgentStudioSnapshot -> loadAgentConfigs fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'agent config upstream API snapshot'
        : 'FALLBACK_AGENT_CONFIGS local samples',
    refreshPath: 'AgentStudioPage -> loadAgentStudioSnapshot',
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面首屏已接入 Agent Config 服务端快照，写操作仍由客户端工作台承接。'
        : '当前页面首屏展示 fallback Agent Config 样本，写操作链路可能因为上游不可达而失败。',
    configs: snapshot.configs,
    error: snapshot.error,
  }
}
