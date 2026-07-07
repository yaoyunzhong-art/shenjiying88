/**
 * 🐜 自动: [health-dashboard] [D] contract 补全
 *
 * Health Dashboard 跨模块合约类型
 * 定义 health-dashboard 模块对外暴露的稳定合约接口，
 * 供 observability, perf-monitor, anomaly-detector 等模块消费。
 */
import type {
  TenantHealthInput,
  TenantHealthScore,
  DashboardSummary,
  AlertConfig,
} from './health-dashboard.entity'

/**
 * 租户健康输入合约（跨模块安全子集）
 */
export interface TenantHealthInputContract {
  tenantId: string
  p95Ms: number
  errorRate: number
  quotaUsagePercent: number
  championActivityScore: number
  anomalyCount30d: number
}

/**
 * 租户健康度评分合约（跨模块安全子集）
 */
export interface TenantHealthScoreContract {
  tenantId: string
  score: number
  components: {
    performance: number
    reliability: number
    quotaHealth: number
    community: number
  }
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  recommendations: string[]
  computedAt: string
}

/**
 * 仪表板汇总合约（跨模块安全子集）
 */
export interface DashboardSummaryContract {
  totalTenants: number
  byStatus: { HEALTHY: number; WARNING: number; CRITICAL: number }
  averageScore: number
  topIssues: Array<{ issue: string; count: number }>
  alerts: Array<{ tenantId: string; severity: string; message: string }>
  computedAt: string
}

/**
 * 告警检查结果合约（跨模块安全子集）
 */
export interface AlertCheckResultContract {
  tenantId: string
  severity: 'WARNING' | 'CRITICAL'
  message: string
  notifyChannels: string[]
}

/**
 * Grafana 指标导出合约
 */
export interface GrafanaMetricsContract {
  metrics: Array<{ name: string; value: number; help?: string; type?: 'gauge' | 'counter' | 'histogram' }>
  prometheusText: string
}

/**
 * 告警配置合约（跨模块安全子集）
 */
export interface AlertConfigContract {
  warningThreshold: number
  criticalThreshold: number
  notifyChannels: Array<'email' | 'feishu' | 'dingtalk'>
}

// ─── Contract 映射器 ─────────────────────────────────

/** 实体 -> 合约映射 */
export function toTenantHealthInputContract(entity: TenantHealthInput): TenantHealthInputContract {
  return {
    tenantId: entity.tenantId,
    p95Ms: entity.p95Ms,
    errorRate: entity.errorRate,
    quotaUsagePercent: entity.quotaUsagePercent,
    championActivityScore: entity.championActivityScore,
    anomalyCount30d: entity.anomalyCount30d,
  }
}

/** 实体 -> 合约映射 */
export function toTenantHealthScoreContract(entity: TenantHealthScore): TenantHealthScoreContract {
  return {
    tenantId: entity.tenantId,
    score: entity.score,
    components: { ...entity.components },
    status: entity.status,
    recommendations: [...entity.recommendations],
    computedAt: entity.computedAt,
  }
}

/** 实体 -> 合约映射 */
export function toDashboardSummaryContract(entity: DashboardSummary): DashboardSummaryContract {
  return {
    totalTenants: entity.totalTenants,
    byStatus: { ...entity.byStatus },
    averageScore: entity.averageScore,
    topIssues: entity.topIssues.map((i) => ({ ...i })),
    alerts: entity.alerts.map((a) => ({ ...a })),
    computedAt: entity.computedAt,
  }
}

/** 告警结果 -> 合约映射 */
export function toAlertCheckResultContract(
  alert: { tenantId: string; severity: string; message: string; notifyChannels: string[] },
): AlertCheckResultContract {
  return {
    tenantId: alert.tenantId,
    severity: alert.severity as 'WARNING' | 'CRITICAL',
    message: alert.message,
    notifyChannels: [...alert.notifyChannels],
  }
}

/** DashboardSummary + Grafana text -> GrafanaMetricsContract */
export function toGrafanaMetricsContract(
  summary: DashboardSummary,
  prometheusText: string,
): GrafanaMetricsContract {
  const metrics: GrafanaMetricsContract['metrics'] = [
    { name: 'tenant_health_score_avg', value: summary.averageScore, help: 'Average tenant health score', type: 'gauge' },
    { name: 'tenant_by_status_healthy', value: summary.byStatus.HEALTHY, help: 'Healthy tenants count', type: 'gauge' },
    { name: 'tenant_by_status_warning', value: summary.byStatus.WARNING, help: 'Warning tenants count', type: 'gauge' },
    { name: 'tenant_by_status_critical', value: summary.byStatus.CRITICAL, help: 'Critical tenants count', type: 'gauge' },
  ]
  return { metrics, prometheusText }
}

/** AlertConfig -> 合约映射 */
export function toAlertConfigContract(entity: AlertConfig): AlertConfigContract {
  return {
    warningThreshold: entity.warningThreshold,
    criticalThreshold: entity.criticalThreshold,
    notifyChannels: [...entity.notifyChannels],
  }
}

/** 批量映射 */
export function toTenantHealthScoreContracts(entities: TenantHealthScore[]): TenantHealthScoreContract[] {
  return entities.map(toTenantHealthScoreContract)
}
