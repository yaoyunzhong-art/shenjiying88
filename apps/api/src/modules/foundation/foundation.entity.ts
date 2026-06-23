import type {
  FoundationAlertCode,
  FoundationAlertSeverity,
  FoundationAlertAcknowledgementStatus,
  FoundationAlertAcknowledgement,
  FoundationAlertTimelineEntry,
  FoundationAlertCatalogItem,
  FoundationOperationsAlert,
  FoundationOperationsAlertTriageState,
  FoundationModuleKey,
  FoundationCapabilityDescriptor,
  FoundationGovernanceBaseline
} from '@m5/types'

/**
 * Foundation 运营告警摘要（Service 层内部结构）
 */
export interface FoundationOperationsAlertSummary {
  generatedAt: string
  summary: Record<string, number>
  alerts: FoundationOperationsAlert[]
  topRisks: FoundationOperationsAlert[]
  topFailures: Array<{ module: string; label: string; count: number }>
  moduleHealth: Record<string, { module: string; score: number; status: 'healthy' | 'warning' | 'critical'; indicators: Record<string, number> }>
  modules: Record<string, unknown>
}

/**
 * Foundation 告警编目响应
 */
export interface FoundationAlertCatalogResponse {
  generatedAt: string
  alerts: FoundationAlertCatalogItem[]
}

/**
 * Foundation 告警 Drilldown 响应
 */
export interface FoundationAlertDrilldownResponse {
  generatedAt: string
  code: FoundationAlertCode
  catalog: FoundationAlertCatalogItem
  alert: FoundationOperationsAlert | null
  acknowledgement: FoundationAlertAcknowledgement | null
  history: FoundationAlertTimelineEntry[]
  detail: Record<string, unknown>
  visibleInOverview: boolean
  availableActions: Array<'DRILLDOWN' | 'ACK' | 'MUTE' | 'UNMUTE'>
}

/**
 * Foundation 告警突变响应（ACK / MUTE / UNMUTE）
 */
export interface FoundationAlertMutationResponse {
  generatedAt: string
  code: FoundationAlertCode
  catalog: FoundationAlertCatalogItem
  acknowledgement: FoundationAlertAcknowledgement | Record<string, never>
  visibleInOverview: boolean
  availableActions: Array<'DRILLDOWN' | 'ACK' | 'MUTE' | 'UNMUTE'>
  history: FoundationAlertTimelineEntry[]
}

/**
 * Foundation 模块详情响应
 */
export interface FoundationModuleDetailResponse {
  generatedAt: string
  moduleKey: string
  health: {
    module: string
    score: number
    status: 'healthy' | 'warning' | 'critical'
    indicators: Record<string, number>
  }
  detail: Record<string, unknown>
  availableModuleKeys?: readonly string[]
}

/**
 * Foundation Bootstrap 响应
 */
export interface FoundationBootstrapResponse {
  tenantContext: unknown
  generatedAt: string
  docs: string[]
  guardrails: string[]
  frontendBootstrap: unknown
  modules: unknown[]
  consumers: unknown[]
  governanceBaselines: unknown[]
}

/**
 * Foundation 消费者依赖响应
 */
export interface FoundationConsumerDependencyResponse {
  consumer?: string
  availableConsumers?: string[]
  [key: string]: unknown
}

/**
 * Alert mutation request body
 */
export interface AlertAcknowledgeBody {
  note?: string
}

export interface AlertMuteBody {
  mutedUntil?: string
  note?: string
}

export interface AlertUnmuteBody {
  note?: string
}

// Re-export commonly used types from @m5/types for convenience
export type {
  FoundationAlertCode,
  FoundationAlertSeverity,
  FoundationAlertAcknowledgementStatus,
  FoundationAlertAcknowledgement,
  FoundationAlertTimelineEntry,
  FoundationAlertCatalogItem,
  FoundationOperationsAlert,
  FoundationOperationsAlertTriageState,
  FoundationModuleKey,
  FoundationCapabilityDescriptor,
  FoundationGovernanceBaseline
}
