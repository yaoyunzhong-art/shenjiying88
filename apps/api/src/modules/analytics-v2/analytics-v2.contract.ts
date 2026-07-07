/**
 * analytics-v2.contract.ts - AnalyticsV2 模块跨模块契约
 *
 * 定义稳定的跨模块通信接口，供其他模块通过 cross-boundary 消费。
 * 只暴露安全的子集，隐藏实现细节。
 */

import type {
  AnalyticsEvent,
  CDCEvent,
  CohortGroup,
  FunnelResult,
  RetentionResult,
  MetricsSummary,
  EventType,
  CohortPeriod,
  MetricCard,
  TimeSeriesPoint,
} from './analytics-v2.entity'

// ── Contract Interfaces ──

/** 跨模块安全的 Analytics 事件契约 */
export interface AnalyticsEventContract {
  id: string
  tenantId: string
  eventId: string
  type: EventType
  memberId?: string
  sessionId?: string
  timestamp: string
  who: string
  what: string
  revenueCents?: number
}

/** 跨模块安全的 CDC 事件契约 */
export interface CDCEventContract {
  id: string
  tenantId: string
  tableName: string
  recordId: string
  eventType: 'CREATED' | 'UPDATED' | 'DELETED'
  timestamp: string
  eventId: string
  watermark: number
  replayed?: boolean
}

/** 跨模块安全的 CohortGroup 契约 */
export interface CohortGroupContract {
  id: string
  tenantId: string
  period: CohortPeriod
  periodKey: string
  cohortSize: number
  retention: number[]
  startDate: string
  endDate: string
}

/** 跨模块安全的 Funnel 结果契约 */
export interface FunnelResultContract {
  id: string
  tenantId: string
  name: string
  steps: Array<{ name: string; eventType: EventType }>
  windowDays: number
  stepResults: Array<{
    stepName: string
    enteredCount: number
    conversionRate: number
    dropOffRate: number
  }>
  totalConversionRate: number
  computedAt: string
}

/** 跨模块安全的 Retention 结果契约 */
export interface RetentionResultContract {
  tenantId: string
  period: CohortPeriod
  matrix: Array<{
    cohort: string
    cohortSize: number
    d0: number
    d1: number
    d7: number
    d30: number
  }>
  avgRetention: {
    d1: number
    d7: number
    d30: number
  }
}

/** 跨模块安全的 MetricsSummary 契约 */
export interface MetricsSummaryContract {
  tenantId: string
  period: string
  metrics: MetricCard[]
  series: Record<string, TimeSeriesPoint[]>
}

/** 跨模块安全的 AnalyticsV2 健康契约 */
export interface AnalyticsV2HealthContract {
  status: 'healthy' | 'degraded' | 'unhealthy'
  componentStatus: {
    events: { ok: boolean; count: number }
    cdc: { ok: boolean; watermark: number }
    cohorts: { ok: boolean; cohortCount: number }
    funnels: { ok: boolean; funnelCount: number }
  }
  latencyMs: number
  lastActivityAt: string
}

/** 跨模块安全的 AnalyticsV2 诊断契约 */
export interface AnalyticsV2DiagnosticsContract {
  events: {
    total: number
    byType: Record<string, number>
    recentCount: number
  }
  cdc: {
    total: number
    lastWatermark: number
    tables: string[]
  }
  cohorts: {
    totalGroups: number
    totalMembers: number
    avgRetention: { d1: number; d7: number; d30: number }
  }
  funnels: {
    total: number
    avgConversionRate: number
  }
}

// ── Converter Functions ──

export function toAnalyticsEventContract(event: AnalyticsEvent): AnalyticsEventContract {
  return {
    id: event.id,
    tenantId: event.tenantId,
    eventId: event.eventId,
    type: event.type,
    memberId: event.memberId,
    sessionId: event.sessionId,
    timestamp: event.timestamp,
    who: event.who,
    what: typeof event.what === 'string' ? event.what : event.what.name || event.type,
    revenueCents: event.revenueCents,
  }
}

export function toCDCEventContract(event: CDCEvent): CDCEventContract {
  return {
    id: event.id,
    tenantId: event.tenantId,
    tableName: event.tableName,
    recordId: event.recordId,
    eventType: event.eventType,
    timestamp: event.timestamp,
    eventId: event.eventId,
    watermark: event.watermark,
    replayed: event.replayed,
  }
}

export function toCohortGroupContract(group: CohortGroup): CohortGroupContract {
  return {
    id: group.id,
    tenantId: group.tenantId,
    period: group.period,
    periodKey: group.periodKey,
    cohortSize: group.cohortSize,
    retention: group.retention,
    startDate: group.startDate,
    endDate: group.endDate,
  }
}

export function toFunnelResultContract(result: FunnelResult): FunnelResultContract {
  return {
    id: result.id,
    tenantId: result.tenantId,
    name: result.name,
    steps: result.steps.map(s => ({
      name: s.name,
      eventType: s.eventType,
    })),
    windowDays: result.windowDays,
    stepResults: result.stepResults.map(sr => ({
      stepName: sr.stepName,
      enteredCount: sr.enteredCount,
      conversionRate: sr.conversionRate,
      dropOffRate: sr.dropOffRate,
    })),
    totalConversionRate: result.totalConversionRate,
    computedAt: result.computedAt,
  }
}

export function toRetentionResultContract(result: RetentionResult): RetentionResultContract {
  return {
    tenantId: result.tenantId,
    period: result.period,
    matrix: result.matrix.map(m => ({
      cohort: m.cohort,
      cohortSize: m.cohortSize,
      d0: m.d0,
      d1: m.d1,
      d7: m.d7,
      d30: m.d30,
    })),
    avgRetention: {
      d1: result.avgRetention.d1,
      d7: result.avgRetention.d7,
      d30: result.avgRetention.d30,
    },
  }
}

export function toMetricsSummaryContract(summary: MetricsSummary): MetricsSummaryContract {
  return {
    tenantId: summary.tenantId,
    period: summary.period,
    metrics: summary.metrics,
    series: summary.series,
  }
}

/** 检查事件类型是否为可消费类型 */
export function isValidEventType(type: string): type is EventType {
  return ['PAGEVIEW', 'CLICK', 'CONVERSION', 'PURCHASE', 'CUSTOM'].includes(type)
}

/** 检查收费事件 */
export function isMonetizableEvent(event: AnalyticsEventContract): boolean {
  return event.type === 'PURCHASE' || event.type === 'CONVERSION'
}

/** 检查是否近期事件（1小时内） */
export function isRecentEvent(timestamp: string): boolean {
  const ts = new Date(timestamp).getTime()
  return Date.now() - ts < 3600000
}

/** 获取事件 revenue 贡献（cents，无则0） */
export function getEventRevenue(event: AnalyticsEventContract): number {
  return event.revenueCents ?? 0
}
