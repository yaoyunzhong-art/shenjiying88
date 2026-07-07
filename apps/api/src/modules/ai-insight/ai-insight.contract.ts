/**
 * 🐜 自动: [ai-insight] [A] contract 补全
 *
 * AI 洞察：跨模块合约类型
 * 定义 ai-insight 模块对外暴露的稳定合约接口，
 * 供其他模块（ai-recommend, ai-rule-engine, observability 等）消费。
 */
import type {
  InsightReport,
  KPI,
  Anomaly,
  Trend,
  DashboardSummary,
  TrendItem,
  AnomalyItem,
  ForecastPoint,
  SummaryPeriod,
} from './ai-insight.entity'

/**
 * 洞察报告合约（跨模块消费安全子集）
 */
export interface InsightReportContract {
  id: string
  tenantId: string
  brandId?: string
  storeId?: string
  type: InsightReport['type']
  title: string
  summary: string
  data: {
    metrics: Record<string, number>
    trends: TrendItem[]
    anomalies: AnomalyItem[]
  }
  periodStart: string
  periodEnd: string
  generatedAt: string
  createdAt: string
}

/**
 * KPI 合约（跨模块消费安全子集）
 */
export interface KPIContract {
  id: string
  tenantId: string
  storeId?: string
  name: string
  category: KPI['category']
  value: number
  target: number
  unit: string
  trend: KPI['trend']
  period: string
  updatedAt: string
}

/**
 * 异常合约（跨模块消费安全子集）
 */
export interface AnomalyContract {
  id: string
  tenantId: string
  storeId?: string
  metric: string
  value: number
  expectedValue: number
  deviationPercent: number
  severity: Anomaly['severity']
  detectedAt: string
  resolvedAt?: string
  status: Anomaly['status']
}

/**
 * 趋势预测合约（跨模块消费安全子集）
 */
export interface TrendContract {
  id: string
  tenantId: string
  storeId?: string
  metric: string
  forecast: ForecastPoint[]
  confidence: number
  generatedAt: string
}

/**
 * 仪表盘合约（跨模块消费安全子集）
 */
export interface DashboardSummaryContract {
  tenantId: string
  storeId?: string
  today: SummaryPeriodContract
  thisWeek: SummaryPeriodContract
  thisMonth: SummaryPeriodContract
  activeAnomalies: number
  reportCount: number
  generatedAt: string
}

/**
 * 摘要周期合约（跨模块消费安全子集）
 */
export interface SummaryPeriodContract {
  label: string
  start: string
  end: string
  revenue: number
  members: number
  attendance: number
  games: number
  kpis: KPIContract[]
  yoyPercent: number
}

// ─── Contract 映射器 ─────────────────────────────────

/** 实体 -> 合约映射 */
export function toInsightReportContract(entity: InsightReport): InsightReportContract {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    brandId: entity.brandId,
    storeId: entity.storeId,
    type: entity.type,
    title: entity.title,
    summary: entity.summary,
    data: {
      metrics: { ...entity.data.metrics },
      trends: entity.data.trends.map((t) => ({ ...t })),
      anomalies: entity.data.anomalies.map((a) => ({ ...a })),
    },
    periodStart: entity.periodStart,
    periodEnd: entity.periodEnd,
    generatedAt: entity.generatedAt,
    createdAt: entity.createdAt,
  }
}

/** 实体 -> 合约映射 */
export function toKPIContract(entity: KPI): KPIContract {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    storeId: entity.storeId,
    name: entity.name,
    category: entity.category,
    value: entity.value,
    target: entity.target,
    unit: entity.unit,
    trend: entity.trend,
    period: entity.period,
    updatedAt: entity.updatedAt,
  }
}

/** 实体 -> 合约映射 */
export function toAnomalyContract(entity: Anomaly): AnomalyContract {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    storeId: entity.storeId,
    metric: entity.metric,
    value: entity.value,
    expectedValue: entity.expectedValue,
    deviationPercent: entity.deviationPercent,
    severity: entity.severity,
    detectedAt: entity.detectedAt,
    resolvedAt: entity.resolvedAt,
    status: entity.status,
  }
}

/** 实体 -> 合约映射 */
export function toTrendContract(entity: Trend): TrendContract {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    storeId: entity.storeId,
    metric: entity.metric,
    forecast: entity.forecast.map((f) => ({ ...f })),
    confidence: entity.confidence,
    generatedAt: entity.generatedAt,
  }
}

/** 实体 -> 合约映射 */
export function toDashboardSummaryContract(entity: DashboardSummary): DashboardSummaryContract {
  return {
    tenantId: entity.tenantId,
    storeId: entity.storeId,
    today: toSummaryPeriodContract(entity.today),
    thisWeek: toSummaryPeriodContract(entity.thisWeek),
    thisMonth: toSummaryPeriodContract(entity.thisMonth),
    activeAnomalies: entity.activeAnomalies,
    reportCount: entity.reportCount,
    generatedAt: entity.generatedAt,
  }
}

/** 摘要周期 -> 合约映射 */
function toSummaryPeriodContract(entity: SummaryPeriod): SummaryPeriodContract {
  return {
    label: entity.label,
    start: entity.start,
    end: entity.end,
    revenue: entity.revenue,
    members: entity.members,
    attendance: entity.attendance,
    games: entity.games,
    kpis: entity.kpis.map(toKPIContract),
    yoyPercent: entity.yoyPercent,
  }
}

/** 批量映射 */
export function toInsightReportContracts(entities: InsightReport[]): InsightReportContract[] {
  return entities.map(toInsightReportContract)
}

/** 批量映射 */
export function toKPIContracts(entities: KPI[]): KPIContract[] {
  return entities.map(toKPIContract)
}

/** 批量映射 */
export function toAnomalyContracts(entities: Anomaly[]): AnomalyContract[] {
  return entities.map(toAnomalyContract)
}

/** 批量映射 */
export function toTrendContracts(entities: Trend[]): TrendContract[] {
  return entities.map(toTrendContract)
}
