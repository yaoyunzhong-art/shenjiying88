/**
 * sla-view-model.ts — SLA 监控看板 View Model
 *
 * 功能:
 * - 模拟数据用于看板展示
 * - 响应时间趋势生成
 * - 服务状态汇总
 * - 告警过滤与统计
 * - 自动修复率计算
 */

import type {
  SLADashboardSnapshot,
  SLAOverallRate,
  ServiceAvailability,
  ResponseTimeTrendPoint,
  AlertRecord,
  AutoHealStats,
  AlertLevel,
  AlertStatus,
} from './sla-types';

// ── Mock 服务列表 ────────────────────────────────────────────────────────────

const MOCK_SERVICES: ServiceAvailability[] = [
  {
    serviceId: 'api-gateway',
    serviceName: 'API 网关',
    status: 'green',
    uptimePercent: 99.97,
    p99LatencyMs: 120,
    avgLatencyMs: 45,
  },
  {
    serviceId: 'order-svc',
    serviceName: '订单服务',
    status: 'green',
    uptimePercent: 99.95,
    p99LatencyMs: 85,
    avgLatencyMs: 32,
  },
  {
    serviceId: 'payment-svc',
    serviceName: '支付服务',
    status: 'green',
    uptimePercent: 99.99,
    p99LatencyMs: 150,
    avgLatencyMs: 60,
  },
  {
    serviceId: 'member-svc',
    serviceName: '会员服务',
    status: 'yellow',
    uptimePercent: 99.82,
    lastDowntimeAt: '2026-07-15T14:30:00.000Z',
    lastDowntimeDurationMinutes: 8,
    p99LatencyMs: 320,
    avgLatencyMs: 110,
  },
  {
    serviceId: 'device-svc',
    serviceName: '设备服务',
    status: 'green',
    uptimePercent: 99.91,
    p99LatencyMs: 95,
    avgLatencyMs: 28,
  },
  {
    serviceId: 'inventory-svc',
    serviceName: '库存服务',
    status: 'red',
    uptimePercent: 98.50,
    lastDowntimeAt: '2026-07-15T10:15:00.000Z',
    lastDowntimeDurationMinutes: 45,
    p99LatencyMs: 890,
    avgLatencyMs: 230,
  },
  {
    serviceId: 'notification-svc',
    serviceName: '通知服务',
    status: 'green',
    uptimePercent: 99.93,
    p99LatencyMs: 200,
    avgLatencyMs: 75,
  },
  {
    serviceId: 'data-sync',
    serviceName: '数据同步',
    status: 'yellow',
    uptimePercent: 99.75,
    lastDowntimeAt: '2026-07-15T08:00:00.000Z',
    lastDowntimeDurationMinutes: 15,
    p99LatencyMs: 450,
    avgLatencyMs: 180,
  },
];

// ── Mock 告警 ─────────────────────────────────────────────────────────────────

const MOCK_ALERTS: AlertRecord[] = [
  {
    id: 'alert-001',
    occurredAt: '2026-07-15T10:15:00.000Z',
    source: 'inventory-svc',
    level: 'critical',
    message: '库存服务响应超时，P99 延迟突破 800ms',
    status: 'firing',
  },
  {
    id: 'alert-002',
    occurredAt: '2026-07-15T08:00:00.000Z',
    source: 'data-sync',
    level: 'warning',
    message: '数据同步延时增加，落后实时窗口 30 秒',
    status: 'acknowledged',
  },
  {
    id: 'alert-003',
    occurredAt: '2026-07-15T06:30:00.000Z',
    source: 'member-svc',
    level: 'warning',
    message: '会员服务 P99 延迟 > 300ms，连接池水位 85%',
    status: 'firing',
  },
  {
    id: 'alert-004',
    occurredAt: '2026-07-14T22:00:00.000Z',
    source: 'api-gateway',
    level: 'info',
    message: 'API 网关流量突增至日常 3 倍',
    status: 'resolved',
    resolvedAt: '2026-07-14T22:15:00.000Z',
  },
  {
    id: 'alert-005',
    occurredAt: '2026-07-14T18:45:00.000Z',
    source: 'payment-svc',
    level: 'critical',
    message: '支付服务错误率 > 5%，触发熔断保护',
    status: 'resolved',
    resolvedAt: '2026-07-14T19:10:00.000Z',
  },
  {
    id: 'alert-006',
    occurredAt: '2026-07-14T15:00:00.000Z',
    source: 'notification-svc',
    level: 'info',
    message: '通知推送队列积压 1200 条',
    status: 'resolved',
    resolvedAt: '2026-07-14T15:30:00.000Z',
  },
  {
    id: 'alert-007',
    occurredAt: '2026-07-14T12:00:00.000Z',
    source: 'device-svc',
    level: 'warning',
    message: '设备心跳超时率 3.2%',
    status: 'acknowledged',
  },
  {
    id: 'alert-008',
    occurredAt: '2026-07-14T09:00:00.000Z',
    source: 'order-svc',
    level: 'info',
    message: '订单创建高峰，TPS 突破 500',
    status: 'resolved',
    resolvedAt: '2026-07-14T10:00:00.000Z',
  },
];

// ── 生成 24h 响应时间趋势 ──────────────────────────────────────────────────────

function generateTrendData(): ResponseTimeTrendPoint[] {
  const points: ResponseTimeTrendPoint[] = [];
  const now = Date.now();
  for (let i = 24; i >= 0; i -= 1) {
    const ts = new Date(now - i * 60 * 60 * 1000);
    const baseAvg = 50 + Math.sin(i * 0.7) * 20 + Math.random() * 10;
    const baseMedian = baseAvg * 0.85;
    const baseP99 = baseAvg * 3 + Math.random() * 50;
    points.push({
      timestamp: ts.toISOString(),
      avgMs: Math.round(baseAvg * 10) / 10,
      medianMs: Math.round(baseMedian * 10) / 10,
      p99Ms: Math.round(baseP99 * 10) / 10,
    });
  }
  return points;
}

// ── Fallback SLA 达标率 ──────────────────────────────────────────────────────

function generateFallbackOverallRate(): SLAOverallRate {
  return {
    p999: 99.92,
    p995: 99.68,
    p99: 99.35,
    averageResponseTimeMs: 62,
    medianResponseTimeMs: 35,
    p99ResponseTimeMs: 280,
    totalRequests24h: 128_560,
    breachedRequests24h: 835,
  };
}

// ── 自动修复统计 ───────────────────────────────────────────────────────────────

const FALLBACK_AUTO_HEAL: AutoHealStats = {
  totalIncidents: 42,
  autoHealed: 34,
  manualIntervention: 8,
  averageHealTimeSeconds: 73,
  healRatePercent: 80.95,
};

// ── 公开 API ──────────────────────────────────────────────────────────────────

export function loadSLADashboard(): SLADashboardSnapshot {
  return {
    deliveryMode: 'fallback',
    generatedAt: new Date().toISOString(),
    overallRate: generateFallbackOverallRate(),
    responseTimeTrend: generateTrendData(),
    services: MOCK_SERVICES,
    alerts: MOCK_ALERTS,
    autoHeal: FALLBACK_AUTO_HEAL,
  };
}

/** 获取服务状态汇总 */
export function summarizeServiceStatuses(
  services: ServiceAvailability[],
): Record<ServiceStatus, number> {
  const summary: Record<ServiceStatus, number> = { green: 0, yellow: 0, red: 0 };
  for (const svc of services) {
    summary[svc.status] += 1;
  }
  return summary;
}

/** 过滤告警列表 */
export function filterAlerts(
  alerts: AlertRecord[],
  levelFilter?: AlertLevel,
  statusFilter?: AlertStatus,
): AlertRecord[] {
  let result = alerts;
  if (levelFilter) {
    result = result.filter((a) => a.level === levelFilter);
  }
  if (statusFilter) {
    result = result.filter((a) => a.status === statusFilter);
  }
  return result;
}

/** 计算综合 SLA 达标率 */
export function computeOverallCompliance(rate: SLAOverallRate): number {
  return (rate.p999 + rate.p995 + rate.p99) / 3;
}

/** 检查是否达成凤梨对标阈值 (< 30 秒平均响应时间) */
export function isPineappleCompliant(overallRate: SLAOverallRate): boolean {
  return overallRate.averageResponseTimeMs < 30;
}

/** 获取警报中（firing + acknowledged）数量 */
export function getActiveAlertCount(alerts: AlertRecord[]): number {
  return alerts.filter((a) => a.status === 'firing' || a.status === 'acknowledged').length;
}

/** 获取严重告警数量 */
export function getCriticalAlertCount(alerts: AlertRecord[]): number {
  return alerts.filter((a) => a.level === 'critical' && a.status !== 'resolved').length;
}

/** 格式化毫秒为可读文本 */
export function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

/** 格式化百分数 */
export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}
