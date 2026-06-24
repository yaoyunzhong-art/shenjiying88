/**
 * metrics.entity.ts — 可观测性领域类型定义
 *
 * 为 MetricsController / MetricsService 提供类型化契约：
 *   - MetricDefinition: 指标定义元数据
 *   - MetricsReport:   Prometheus 渲染结构包装
 *   - AlertRule:        告警规则定义
 */

// ── Metric Type 枚举 ──
export const METRIC_TYPE = {
  COUNTER: 'counter',
  GAUGE: 'gauge',
  HISTOGRAM: 'histogram'
} as const

export type MetricType = (typeof METRIC_TYPE)[keyof typeof METRIC_TYPE]

// ── 单一指标快照 ──
export interface MetricSnapshot {
  name: string
  type: MetricType
  help: string
  labels: Record<string, string | number>
  value: number
  /** Histogram 特有: 桶分布 (le -> count) */
  buckets?: Record<string, number>
  /** Histogram 特有: 和 */
  sum?: number
  /** Histogram 特有: 观测总数 */
  count?: number
}

// ── 指标报告 (渲染前结构化中间态) ──
export interface MetricsReport {
  generatedAt: string
  totalMetrics: number
  snapshots: MetricSnapshot[]
}

// ── 告警规则 ──
export interface AlertRule {
  name: string
  metricName: string
  operator: '>' | '<' | '>=' | '<=' | '=='
  threshold: number
  duration: string
  severity: 'info' | 'warning' | 'critical'
  description?: string
}
