/**
 * 报表/看板 - Contract (V10)
 *
 * 对外暴露的安全合约视图：
 * - 剥离内部实现细节 (Map、内部缓存等)
 * - 仅暴露纯数据接口类型
 */

import type {
  ReportDefinition,
  ReportDataPoint,
  DashboardLayout,
  DashboardCard,
  ReportPeriod,
  ReportMetric,
  ReportDimension,
  ReportQueryResponse,
} from './report.entity'

// ─── 报表定义合约 ───

export interface ReportDefinitionContract {
  id: string
  name: string
  period: ReportPeriod
  metrics: ReportMetric[]
  dimensions: ReportDimension[]
  source: 'orders' | 'members' | 'inventory' | 'marketing' | 'ai_logs'
  cacheTtl: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ─── 数据点合约 ───

export interface ReportDataPointContract {
  bucket: string
  dimension: string
  metric: ReportMetric
  value: number
  yoy?: number
  qoq?: number
}

// ─── 看板合约 ───

export interface DashboardCardContract {
  id: string
  reportId: string
  display: 'line' | 'bar' | 'pie' | 'number' | 'table' | 'heatmap'
  title: string
  size: { w: number; h: number }
  position: { x: number; y: number }
  config?: Record<string, unknown>
}

export interface DashboardLayoutContract {
  id: string
  name: string
  cards: DashboardCardContract[]
  ownerId: string
  isShared: boolean
  createdAt: string
  updatedAt: string
}

// ─── 查询响应合约 ───

export interface ReportQueryResponseContract {
  reportId: string
  period: ReportPeriod
  generatedAt: string
  data: ReportDataPointContract[]
  totalPoints: number
}

// ─── 聚合结果合约 ───

export interface AggregateResultContract {
  metric: string
  dimension: string
  totals: Record<string, number>
}

// ─── Mappers ───

export function toReportDefinitionContract(
  def: ReportDefinition,
): ReportDefinitionContract {
  return {
    id: def.id,
    name: def.name,
    period: def.period,
    metrics: [...def.metrics],
    dimensions: [...def.dimensions],
    source: def.source,
    cacheTtl: def.cacheTtl,
    createdBy: def.createdBy,
    createdAt: def.createdAt,
    updatedAt: def.updatedAt,
  }
}

export function toReportDataPointContract(
  dp: ReportDataPoint,
): ReportDataPointContract {
  return {
    bucket: dp.bucket,
    dimension: dp.dimension,
    metric: dp.metric,
    value: dp.value,
    yoy: dp.yoy,
    qoq: dp.qoq,
  }
}

export function toDashboardCardContract(
  card: DashboardCard,
): DashboardCardContract {
  return {
    id: card.id,
    reportId: card.reportId,
    display: card.display,
    title: card.title,
    size: { ...card.size },
    position: { ...card.position },
    config: card.config,
  }
}

export function toDashboardLayoutContract(
  layout: DashboardLayout,
): DashboardLayoutContract {
  return {
    id: layout.id,
    name: layout.name,
    cards: layout.cards.map(toDashboardCardContract),
    ownerId: layout.ownerId,
    isShared: layout.isShared,
    createdAt: layout.createdAt,
    updatedAt: layout.updatedAt,
  }
}

export function toReportQueryResponseContract(
  resp: ReportQueryResponse,
): ReportQueryResponseContract {
  return {
    reportId: resp.reportId,
    period: resp.period,
    generatedAt: resp.generatedAt,
    data: resp.data.map(toReportDataPointContract),
    totalPoints: resp.totalPoints,
  }
}
