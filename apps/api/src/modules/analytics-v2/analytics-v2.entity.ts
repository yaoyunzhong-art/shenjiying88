/**
 * Phase-43 T173: 数据分析实体 (Event + CDC + Cohort + Funnel + Retention)
 *
 * DR-43 决策链:
 *  - A: 事件 ClickHouse 列存 + JSON properties + 5W1H
 *  - B: CDC watermark + 重放幂等 + 软删除
 *  - C: Cohort 按周 + 月 + 12 期回看
 *  - D: Funnel 步骤配置 + 7d 窗口
 *  - E: Retention = 第 N 日活跃 / cohort 总数
 *  - F: 多租户隔离
 */

export type TenantId = string

// ─── 事件模型 ────────────────────────────────────────

export type EventType = 'PAGEVIEW' | 'CLICK' | 'CONVERSION' | 'PURCHASE' | 'CUSTOM'

export interface AnalyticsEvent {
  id: string
  tenantId: TenantId
  eventId: string                  // 业务幂等键
  type: EventType
  memberId?: string
  sessionId?: string
  timestamp: string
  // 5W1H
  who: string                      // memberId or anonymous
  when: string                     // ISO timestamp
  where: EventContext              // url/source/channel
  what: EventAction                // event name
  why?: string                     // 触发原因
  how?: string                     // 设备/平台
  // properties
  properties: Record<string, any>
  revenueCents?: number
}

export interface EventContext {
  url?: string
  referrer?: string
  channel?: string
  page?: string
  component?: string
}

export interface EventAction {
  name: string
  category?: string
  target?: string
}

// ─── CDC 增量同步 ────────────────────────────────────────

export type CDCEventType = 'CREATED' | 'UPDATED' | 'DELETED'

export interface CDCEvent {
  id: string
  tenantId: TenantId
  tableName: string
  recordId: string
  eventType: CDCEventType
  timestamp: string
  // 业务幂等
  eventId: string
  watermark: number                // 毫秒级
  before?: Record<string, any>     // 旧值 (UPDATED/DELETED)
  after?: Record<string, any>      // 新值 (CREATED/UPDATED)
  // 重放元数据
  replayed?: boolean
  appliedAt?: string
}

// ─── Cohort 同期群 ────────────────────────────────────────

export type CohortPeriod = 'WEEKLY' | 'MONTHLY'

export interface CohortGroup {
  id: string
  tenantId: TenantId
  period: CohortPeriod
  periodKey: string                // 2025-W23 / 2025-06
  cohortSize: number               // cohort 总人数
  // 留存曲线
  retention: number[]              // [D0, D1, D7, D30, ...]
  startDate: string
  endDate: string
}

export interface CohortMatrix {
  tenantId: TenantId
  period: CohortPeriod
  cohorts: CohortGroup[]
  // 矩阵: rows = cohorts, cols = days
  matrix: Array<{ cohort: string; size: number; retention: number[] }>
}

// ─── Funnel 漏斗 ────────────────────────────────────────

export interface FunnelStep {
  name: string
  eventType: EventType
  filter?: Record<string, any>
}

export interface FunnelResult {
  id: string
  tenantId: TenantId
  name: string
  steps: FunnelStep[]
  windowDays: number
  // 结果
  stepResults: Array<{
    stepName: string
    enteredCount: number
    conversionRate: number          // 相对上一步
    dropOffRate: number
  }>
  totalConversionRate: number
  computedAt: string
}

// ─── Retention 留存 ────────────────────────────────────────

export interface RetentionResult {
  tenantId: TenantId
  period: CohortPeriod
  // 留存矩阵
  matrix: Array<{
    cohort: string                 // 2025-06-01 / 2025-W23
    cohortSize: number
    d0: number
    d1: number
    d7: number
    d30: number
    d60?: number
    d90?: number
  }>
  // 平均留存
  avgRetention: {
    d1: number
    d7: number
    d30: number
  }
}

// ─── 指标聚合 ────────────────────────────────────────

export interface MetricCard {
  name: string
  value: number
  unit: string
  change?: number                  // 相对变化 (%)
  trend?: 'UP' | 'DOWN' | 'STABLE'
}

export interface TimeSeriesPoint {
  timestamp: string
  value: number
}

export interface MetricsSummary {
  tenantId: TenantId
  period: string
  metrics: MetricCard[]
  series: Record<string, TimeSeriesPoint[]>
}