/**
 * sla-types.ts — SLA 监控看板类型定义
 *
 * 对标凤梨收银"30秒响应"运维承诺:
 * - SLA 达成率 (99.9%/99.5%/99% 分位)
 * - 响应时间趋势
 * - 服务可用性状态
 * - 告警记录
 * - 自动修复率
 */

/** SLA 分位类型 */
export type SLAQuantile = 'p999' | 'p995' | 'p99';

/** SLA 分位标签 */
export const SLA_QUANTILE_LABEL: Record<SLAQuantile, string> = {
  p999: '99.9%',
  p995: '99.5%',
  p99: '99.0%',
};

/** SLA 总体达成率 */
export interface SLAOverallRate {
  p999: number;
  p995: number;
  p99: number;
  averageResponseTimeMs: number;
  medianResponseTimeMs: number;
  p99ResponseTimeMs: number;
  totalRequests24h: number;
  breachedRequests24h: number;
}

/** 服务状态 */
export type ServiceStatus = 'green' | 'yellow' | 'red';

/** 服务状态标签 */
export const SERVICE_STATUS_LABEL: Record<ServiceStatus, string> = {
  green: '正常',
  yellow: '告警',
  red: '故障',
};

/** 服务状态颜色 */
export const SERVICE_STATUS_COLOR: Record<ServiceStatus, string> = {
  green: '#52c41a',
  yellow: '#faad14',
  red: '#ff4d4f',
};

/** 服务可用性数据 */
export interface ServiceAvailability {
  serviceId: string;
  serviceName: string;
  status: ServiceStatus;
  uptimePercent: number;
  lastDowntimeAt?: string;
  lastDowntimeDurationMinutes?: number;
  p99LatencyMs: number;
  avgLatencyMs: number;
}

/** 响应时间趋势数据点 */
export interface ResponseTimeTrendPoint {
  timestamp: string;
  avgMs: number;
  medianMs: number;
  p99Ms: number;
}

/** 告警级别 */
export type AlertLevel = 'critical' | 'warning' | 'info';

export const ALERT_LEVEL_LABEL: Record<AlertLevel, string> = {
  critical: '严重',
  warning: '警告',
  info: '信息',
};

export const ALERT_LEVEL_COLOR: Record<AlertLevel, string> = {
  critical: '#ff4d4f',
  warning: '#faad14',
  info: '#1677ff',
};

/** 告警状态 */
export type AlertStatus = 'firing' | 'resolved' | 'acknowledged';

export const ALERT_STATUS_LABEL: Record<AlertStatus, string> = {
  firing: '触发中',
  resolved: '已解决',
  acknowledged: '已确认',
};

export const ALERT_STATUS_COLOR: Record<AlertStatus, string> = {
  firing: '#ff4d4f',
  resolved: '#52c41a',
  acknowledged: '#1677ff',
};

/** 告警记录 */
export interface AlertRecord {
  id: string;
  occurredAt: string;
  source: string;
  level: AlertLevel;
  message: string;
  status: AlertStatus;
  resolvedAt?: string;
}

/** 自动修复统计 */
export interface AutoHealStats {
  totalIncidents: number;
  autoHealed: number;
  manualIntervention: number;
  averageHealTimeSeconds: number;
  healRatePercent: number;
}

/** SLA 看板快照 */
export interface SLADashboardSnapshot {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  overallRate: SLAOverallRate;
  responseTimeTrend: ResponseTimeTrendPoint[];
  services: ServiceAvailability[];
  alerts: AlertRecord[];
  autoHeal: AutoHealStats;
}

/** 筛选配置 */
export interface SLAFilterConfig {
  serviceId?: string;
  alertLevel?: AlertLevel;
  alertStatus?: AlertStatus;
}

/** 默认 SLA 达成率阈值 */
export const SLA_THRESHOLDS = {
  p999: 99.9,
  p995: 99.5,
  p99: 99.0,
};
