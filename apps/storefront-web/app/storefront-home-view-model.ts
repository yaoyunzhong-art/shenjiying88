import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';
import type { FoundationOperationsAlert, FoundationOperationsOverviewResponse } from '@m5/types';

export interface StorefrontHomeStat {
  label: string;
  value: number;
  variant: 'error' | 'warning' | 'success' | 'info';
}

export interface StorefrontHomeAlertItem {
  id: string;
  title: string;
  severity: 'error' | 'warning';
  status: string;
  time: string;
}

export interface StorefrontHomeSnapshot {
  deliveryMode: 'api' | 'fallback';
  stats: StorefrontHomeStat[];
  alerts: StorefrontHomeAlertItem[];
}

const fallbackStats: StorefrontHomeStat[] = [
  { label: 'Open Alerts', value: 12, variant: 'error' },
  { label: 'Acknowledged', value: 8, variant: 'warning' },
  { label: 'Resolved Today', value: 5, variant: 'success' },
  { label: 'Total Operations', value: 47, variant: 'info' },
];

const fallbackAlerts: StorefrontHomeAlertItem[] = [
  { id: 'approvals-pending', title: 'CPU 使用率峰值超过 90%', severity: 'error', status: 'open', time: '1 小时前' },
  { id: 'observability-degradation', title: '内存使用超过阈值 85%', severity: 'warning', status: 'acknowledged', time: '2 小时前' },
  { id: 'runtime-governance-backlog', title: '磁盘空间不足 10% 剩余', severity: 'error', status: 'open', time: '3 小时前' },
  { id: 'high-risk-audits', title: '服务响应超时 30 秒', severity: 'warning', status: 'acknowledged', time: '4 小时前' },
  { id: 'runtime-callback-stalled', title: '数据库连接被拒绝', severity: 'error', status: 'resolved', time: '5 小时前' },
];

function createStorefrontHomeClient() {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: 'demo-tenant',
    brandId: 'demo-brand',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
  });
}

function formatRelativeTime(timestamp?: string | null): string {
  if (!timestamp) {
    return '刚刚';
  }

  const targetMs = new Date(timestamp).getTime();
  if (Number.isNaN(targetMs)) {
    return '刚刚';
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - targetMs) / 60000));
  if (diffMinutes < 1) {
    return '刚刚';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} 小时前`;
  }

  return `${Math.round(diffHours / 24)} 天前`;
}

function mapAlertStatus(alert: FoundationOperationsAlert): string {
  if (alert.triageState === 'acknowledged') {
    return 'acknowledged';
  }
  if (alert.triageState === 'muted' || alert.triageState === 'expired-mute') {
    return 'muted';
  }
  return 'open';
}

function buildAlertTime(alert: FoundationOperationsAlert): string {
  const recentTime = alert.recentOperation?.createdAt;
  const ackTime = alert.acknowledgement?.updatedAt;
  return formatRelativeTime(recentTime ?? ackTime ?? null);
}

export function buildStorefrontHomeAlert(alert: FoundationOperationsAlert): StorefrontHomeAlertItem {
  return {
    id: alert.code,
    title: alert.summary,
    severity: alert.severity === 'high' ? 'error' : 'warning',
    status: mapAlertStatus(alert),
    time: buildAlertTime(alert),
  };
}

export function buildStorefrontHomeStats(
  overview: Pick<FoundationOperationsOverviewResponse, 'summary' | 'alerts'>
): StorefrontHomeStat[] {
  const acknowledgedCount = overview.alerts.filter(
    (alert) => alert.acknowledgement?.status === 'ACKED' || alert.triageState === 'acknowledged'
  ).length;
  const mutedCount = overview.alerts.filter(
    (alert) => alert.acknowledgement?.status === 'MUTED' || alert.triageState === 'muted'
  ).length;
  const resolvedToday = Math.max(0, acknowledgedCount - mutedCount);
  const totalOperations =
    overview.summary.runtimeGovernanceBacklog +
    overview.summary.approvalsPending +
    overview.summary.highRiskAudits;

  return [
    { label: 'Open Alerts', value: overview.alerts.length, variant: 'error' },
    { label: 'Acknowledged', value: acknowledgedCount, variant: 'warning' },
    { label: 'Resolved Today', value: resolvedToday, variant: 'success' },
    { label: 'Total Operations', value: totalOperations, variant: 'info' },
  ];
}

export async function loadStorefrontHomeSnapshot(): Promise<StorefrontHomeSnapshot> {
  try {
    const overview = await createStorefrontHomeClient().getFoundationOverview({
      cache: 'no-store',
    });

    return {
      deliveryMode: 'api',
      stats: buildStorefrontHomeStats(overview),
      alerts: overview.topRisks.map(buildStorefrontHomeAlert),
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      stats: fallbackStats,
      alerts: fallbackAlerts,
    };
  }
}
