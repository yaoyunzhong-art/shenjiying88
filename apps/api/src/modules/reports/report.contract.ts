/**
 * 🐜 自动: [reports] [A] contract 补全
 *
 * 报表模块跨模块合约类型
 * 定义 Reports 对外暴露的稳定合约接口，
 * 供其他模块（analytics, campaign, notification, marketing-metrics 等）消费。
 */
import type {
  ReportType,
  ReportPeriod,
  ReportDimension,
  ReportMetric,
  ReportResult,
  ReportDefinition,
  ReportFilter,
  ReportFilterGroup,
} from './reports.entity'

/**
 * 报表维度合约（跨模块安全子集）
 */
export interface ReportDimensionContract {
  field: string
  granularity?: ReportPeriod
  alias?: string
}

/**
 * 报表度量合约（跨模块安全子集）
 */
export interface ReportMetricContract {
  field: string
  fn: 'sum' | 'count' | 'avg' | 'min' | 'max' | 'distinct'
  alias: string
}

/**
 * 筛选条件合约（跨模块安全子集）
 */
export interface ReportFilterContract {
  field: string
  op: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'notIn' | 'between' | 'like'
  value: unknown
}

/**
 * 筛选组合约（跨模块安全子集）
 */
export interface ReportFilterGroupContract {
  op: 'AND' | 'OR'
  conditions: (ReportFilterContract | ReportFilterGroupContract)[]
}

/**
 * 报表结果行合约
 */
export interface ReportRowContract {
  [key: string]: string | number | null
}

/**
 * 报表结果合约（跨模块安全子集）
 */
export interface ReportResultContract {
  type: ReportType
  tenantId: string
  period: { from: string; to: string }
  columns: { field: string; alias: string; type: 'dimension' | 'metric' }[]
  rows: ReportRowContract[]
  totals?: ReportRowContract
  generatedAt: string
  cached: boolean
}

/**
 * 报表定义合约（跨模块安全子集）
 */
export interface ReportDefinitionContract {
  id: string
  tenantId: string
  name: string
  type: ReportType
  dimensions: ReportDimensionContract[]
  metrics: ReportMetricContract[]
  filters?: ReportFilterGroupContract
  schedule?: string
  subscribers?: string[]
  ownerId: string
  createdAt: string
  updatedAt: string
  version: number
}

/**
 * 报表定义列表合约（跨模块安全子集）
 */
export interface ReportDefinitionListContract {
  total: number
  items: ReportDefinitionContract[]
}

/**
 * 导出结果合约（跨模块安全子集）
 */
export interface ReportExportContract {
  filename: string
  format: 'csv' | 'json' | 'html'
  size: number
  content: string
}

/**
 * 缓存失效响应合约
 */
export interface CacheInvalidateContract {
  invalidated: number
}

/**
 * 缓存统计合约
 */
export interface CacheStatsContract {
  size: number
  maxEntries: number
  hitRate: number
}

/**
 * 库存预警项合约
 */
export interface InventoryAlertItemContract {
  id: string
  sku: string
  name: string
  stock: number
  minStock: number
  shortage: number
  category: string
}

/**
 * 渠道漏斗项合约
 */
export interface ChannelFunnelStepContract {
  channel: string
  visits: number
  orders: number
  conversion: number
}

// ─── Contract 映射器 ─────────────────────────────────

/** 实体 -> 合约映射 */
export function toReportDimensionContract(entity: ReportDimension): ReportDimensionContract {
  return {
    field: entity.field,
    granularity: entity.granularity,
    alias: entity.alias,
  }
}

/** 实体 -> 合约映射 */
export function toReportMetricContract(entity: ReportMetric): ReportMetricContract {
  return {
    field: entity.field,
    fn: entity.fn,
    alias: entity.alias,
  }
}

/** 实体 -> 合约映射 */
export function toReportFilterContract(entity: ReportFilter): ReportFilterContract {
  return {
    field: entity.field,
    op: entity.op,
    value: entity.value,
  }
}

/** 实体 -> 合约映射 */
export function toReportFilterGroupContract(entity: ReportFilterGroup): ReportFilterGroupContract {
  return {
    op: entity.op,
    conditions: entity.conditions.map((c) => {
      if ('field' in c) {
        return toReportFilterContract(c as ReportFilter)
      }
      return toReportFilterGroupContract(c as ReportFilterGroup)
    }),
  }
}

/** 实体 -> 合约映射 */
export function toReportResultContract(entity: ReportResult): ReportResultContract {
  return {
    type: entity.type,
    tenantId: entity.tenantId,
    period: { ...entity.period },
    columns: entity.columns.map((c) => ({ ...c })),
    rows: entity.rows.map((r) => ({ ...r })),
    totals: entity.totals ? { ...entity.totals } : undefined,
    generatedAt: entity.generatedAt,
    cached: entity.cached,
  }
}

/** 实体 -> 合约映射 */
export function toReportDefinitionContract(entity: ReportDefinition): ReportDefinitionContract {
  return {
    id: entity.id,
    tenantId: entity.tenantId,
    name: entity.name,
    type: entity.type,
    dimensions: entity.dimensions.map(toReportDimensionContract),
    metrics: entity.metrics.map(toReportMetricContract),
    filters: entity.filters ? toReportFilterGroupContract(entity.filters) : undefined,
    schedule: entity.schedule,
    subscribers: entity.subscribers ? [...entity.subscribers] : undefined,
    ownerId: entity.ownerId,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    version: entity.version,
  }
}

/** 批量映射：dimensions */
export function toReportDimensionContracts(entities: ReportDimension[]): ReportDimensionContract[] {
  return entities.map(toReportDimensionContract)
}

/** 批量映射：metrics */
export function toReportMetricContracts(entities: ReportMetric[]): ReportMetricContract[] {
  return entities.map(toReportMetricContract)
}

/** 批量映射：results */
export function toReportResultContracts(entities: ReportResult[]): ReportResultContract[] {
  return entities.map(toReportResultContract)
}

/** 批量映射：definitions */
export function toReportDefinitionContracts(entities: ReportDefinition[]): ReportDefinitionContract[] {
  return entities.map(toReportDefinitionContract)
}
