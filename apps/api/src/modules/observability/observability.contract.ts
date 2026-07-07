/**
 * observability.contract.ts — 可观测性模块跨模块契约
 *
 * MetricsController / MetricsService 的稳定外部接口，
 * 供其他模块消费时使用，隐藏内部实现细节。
 */

import type { MetricSnapshot, AlertRule, MetricsReport } from './metrics.entity'

/** 指标列表（前端友好） */
export interface MetricsListContract {
  metrics: string[]
  count: number
}

/** 健康检查响应契约 */
export interface HealthzContract {
  status: 'ok' | 'degraded' | 'down'
  metrics: number
  uptimeSeconds: number
}

/** 指标快照契约 */
export interface MetricSnapshotContract {
  name: string
  type: string
  help: string
  labels: Record<string, string | number>
  value: number
  buckets?: Record<string, number>
  sum?: number
  count?: number
}

/** 指标报告契约 */
export interface MetricsReportContract {
  generatedAt: string
  totalMetrics: number
  snapshots: MetricSnapshotContract[]
}

/** 告警规则契约 */
export interface AlertRuleContract {
  id: string
  name: string
  metricName: string
  operator: string
  threshold: number
  duration: string
  severity: string
  enabled: boolean
  description?: string
  createdAt: string
  updatedAt: string
}

/** Prometheus 文本格式指标 */
export interface PrometheusMetricsContract {
  raw: string
  contentType: string
}

// ── Contract 转换函数 ──

export function toMetricSnapshotContract(
  snapshot: MetricSnapshot
): MetricSnapshotContract {
  return {
    name: snapshot.name,
    type: snapshot.type,
    help: snapshot.help,
    labels: snapshot.labels,
    value: snapshot.value,
    buckets: snapshot.buckets,
    sum: snapshot.sum,
    count: snapshot.count
  }
}

export function toMetricsReportContract(
  report: MetricsReport
): MetricsReportContract {
  return {
    generatedAt: report.generatedAt,
    totalMetrics: report.totalMetrics,
    snapshots: report.snapshots.map(toMetricSnapshotContract)
  }
}

export function toAlertRuleContract(
  rule: AlertRule & { id: string; enabled: boolean; createdAt: string; updatedAt: string }
): AlertRuleContract {
  return {
    id: rule.id,
    name: rule.name,
    metricName: rule.metricName,
    operator: rule.operator,
    threshold: rule.threshold,
    duration: rule.duration,
    severity: rule.severity,
    enabled: rule.enabled,
    description: rule.description,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt
  }
}

export function toHealthzContract(
  status: 'ok' | 'degraded' | 'down',
  metrics: number,
  uptimeSeconds: number
): HealthzContract {
  return { status, metrics, uptimeSeconds }
}
