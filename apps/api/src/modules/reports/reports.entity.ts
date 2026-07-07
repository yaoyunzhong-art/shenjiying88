/**
 * Phase-39 T169: 报表模块实体定义
 *
 * 反模式 v4 命中:
 *  - multi-tenant-data-isolation-pattern: 强制 tenantId
 *  - time-series-aggregation-pattern: 时间分组 (day/week/month/year)
 *  - caching-strategy-pattern: reportCacheKey = hash(filters+dimensions+metrics)
 */

export type ReportType =
  | 'revenue'        // 营收
  | 'inventory'      // 库存
  | 'member'         // 会员
  | 'refund'         // 退款
  | 'order'          // 订单
  | 'product-ranking' // 商品排行
  | 'payment-mix'    // 支付方式占比
  | 'hourly-heatmap' // 时段热力图
  | 'channel-funnel' // 渠道漏斗
  | 'inventory-alert' // 库存预警

export type ReportPeriod = 'day' | 'week' | 'month' | 'year'
export type AggregationFn = 'sum' | 'count' | 'avg' | 'min' | 'max' | 'distinct'
export type FilterOp = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'notIn' | 'between' | 'like'

/**
 * 单维度: 用于 GROUP BY
 */
export interface ReportDimension {
  /** 字段名: createdAt / method / status / category 等 */
  field: string
  /** 时间维度: day/week/month/year (用于 createdAt 字段) */
  granularity?: ReportPeriod
  /** 显示别名 */
  alias?: string
}

/**
 * 单度量: 用于聚合计算
 */
export interface ReportMetric {
  field: string
  fn: AggregationFn
  alias: string
}

/**
 * 筛选条件 DSL
 */
export interface ReportFilter {
  field: string
  op: FilterOp
  value: any
}

/**
 * 嵌套 AND/OR 筛选
 */
export interface ReportFilterGroup {
  op: 'AND' | 'OR'
  conditions: (ReportFilter | ReportFilterGroup)[]
}

/**
 * 报表定义 (元数据, 用于订阅/分享)
 */
export interface ReportDefinition {
  id: string
  tenantId: string
  name: string
  type: ReportType
  dimensions: ReportDimension[]
  metrics: ReportMetric[]
  filters?: ReportFilterGroup
  /** 调度: cron 表达式 */
  schedule?: string
  /** 订阅者邮箱列表 */
  subscribers?: string[]
  ownerId: string
  createdAt: string
  updatedAt: string
  version: number
}

/**
 * 报表结果行
 */
export interface ReportRow {
  [key: string]: string | number | null
}

/**
 * 报表结果 (反模式 v4 result-schema)
 */
export interface ReportResult {
  /** 报表类型 */
  type: ReportType
  /** 租户 (反模式 v4 multi-tenant) */
  tenantId: string
  /** 时间范围 */
  period: { from: string; to: string }
  /** 列定义 */
  columns: { field: string; alias: string; type: 'dimension' | 'metric' }[]
  /** 数据行 */
  rows: ReportRow[]
  /** 总计行 (可选) */
  totals?: ReportRow
  /** 生成时间 */
  generatedAt: string
  /** 是否来自缓存 (反模式 v4 caching-strategy) */
  cached: boolean
}

/**
 * 创建报表定义输入
 */
export interface CreateReportDefinitionInput {
  tenantId: string
  name: string
  type: ReportType
  dimensions: ReportDimension[]
  metrics: ReportMetric[]
  filters?: ReportFilterGroup
  schedule?: string
  subscribers?: string[]
  ownerId: string
}

export interface UpdateReportDefinitionInput {
  name?: string
  dimensions?: ReportDimension[]
  metrics?: ReportMetric[]
  filters?: ReportFilterGroup
  schedule?: string
  subscribers?: string[]
}

export interface QueryReportInput {
  tenantId: string
  type: ReportType
  from: string  // ISO date
  to: string
  filters?: ReportFilterGroup
  dimensions?: ReportDimension[]
  metrics?: ReportMetric[]
  /** 跳过缓存 */
  noCache?: boolean
}

export interface ReportExportInput {
  tenantId: string
  type: ReportType
  format: 'csv' | 'json' | 'html'
  from: string
  to: string
  filters?: ReportFilterGroup
}