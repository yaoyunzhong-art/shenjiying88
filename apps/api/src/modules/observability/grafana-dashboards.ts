/**
 * grafana-dashboards.ts - Phase-22 T74
 * Grafana Dashboard JSON 模板 (4 套:业务/性能/合规/移动端)
 *
 * 不使用真实 Grafana provisioning (需要 API token + 远端推送),
 * 仅生成 dashboard JSON,可通过 Grafana UI 导入。
 *
 * 4 套:
 * 1. Business: 订单 / 用户 / 转化 / 合规事件
 * 2. Performance: API latency / 错误率 / throughput / 慢请求
 * 3. Compliance: 审计日志 / 数据驻留 / GDPR 请求 / PII 检测
 * 4. Mobile: Crash-free / API 命中率 / 离线队列 / 多设备同步
 */
import type { Alert } from './alert-engine';

export interface GrafanaPanel {
  id: number;
  title: string;
  type: 'graph' | 'stat' | 'gauge' | 'table' | 'timeseries';
  targets: Array<{ expr: string; legendFormat?: string }>;
  gridPos: { x: number; y: number; w: number; h: number };
  fieldConfig?: { defaults: { unit?: string; thresholds?: { steps: Array<{ color: string; value: number }> } } };
}

export interface GrafanaDashboard {
  title: string;
  uid: string;
  schemaVersion: number;
  version: number;
  refresh: string;
  time: { from: string; to: string };
  panels: GrafanaPanel[];
  tags: string[];
  templating?: { list: Array<{ name: string; type: string; query: string }> };
}

// ── Dashboard 1: Business ──

export const BUSINESS_DASHBOARD: GrafanaDashboard = {
  title: '神机营 · 业务指标',
  uid: 'm5-business',
  schemaVersion: 38,
  version: 1,
  refresh: '30s',
  time: { from: 'now-6h', to: 'now' },
  tags: ['m5', 'business'],
  templating: { list: [{ name: 'tenant', type: 'query', query: 'tenants' }] },
  panels: [
    {
      id: 1,
      title: '订单总数 / 5m',
      type: 'stat',
      targets: [{ expr: 'sum(increase(business_orders_total[5m]))', legendFormat: 'orders' }],
      gridPos: { x: 0, y: 0, w: 6, h: 4 },
    },
    {
      id: 2,
      title: 'DAU / 1h',
      type: 'stat',
      targets: [{ expr: 'count(distinct(business_user_id[1h]))', legendFormat: 'dau' }],
      gridPos: { x: 6, y: 0, w: 6, h: 4 },
    },
    {
      id: 3,
      title: '转化率',
      type: 'gauge',
      targets: [{ expr: 'business_conversion_rate', legendFormat: 'rate' }],
      gridPos: { x: 12, y: 0, w: 6, h: 4 },
      fieldConfig: {
        defaults: {
          unit: 'percent',
          thresholds: { steps: [{ color: 'red', value: 0 }, { color: 'yellow', value: 50 }, { color: 'green', value: 80 }] },
        },
      },
    },
    {
      id: 4,
      title: '订单趋势 / 24h',
      type: 'timeseries',
      targets: [{ expr: 'sum(increase(business_orders_total[5m])) by (status)', legendFormat: '{{status}}' }],
      gridPos: { x: 0, y: 4, w: 24, h: 8 },
    },
    {
      id: 5,
      title: '合规事件 / 1h',
      type: 'timeseries',
      targets: [{ expr: 'sum(increase(compliance_events_total[5m])) by (kind)', legendFormat: '{{kind}}' }],
      gridPos: { x: 0, y: 12, w: 24, h: 8 },
    },
  ],
};

// ── Dashboard 2: Performance ──

export const PERFORMANCE_DASHBOARD: GrafanaDashboard = {
  title: '神机营 · 性能监控',
  uid: 'm5-performance',
  schemaVersion: 38,
  version: 1,
  refresh: '10s',
  time: { from: 'now-1h', to: 'now' },
  tags: ['m5', 'performance'],
  panels: [
    {
      id: 1,
      title: 'API P50 / P95 / P99 Latency',
      type: 'timeseries',
      targets: [
        { expr: 'histogram_quantile(0.5, sum by (le) (rate(http_request_duration_ms_bucket[5m])))', legendFormat: 'p50' },
        { expr: 'histogram_quantile(0.95, sum by (le) (rate(http_request_duration_ms_bucket[5m])))', legendFormat: 'p95' },
        { expr: 'histogram_quantile(0.99, sum by (le) (rate(http_request_duration_ms_bucket[5m])))', legendFormat: 'p99' },
      ],
      gridPos: { x: 0, y: 0, w: 12, h: 8 },
      fieldConfig: { defaults: { unit: 'ms' } },
    },
    {
      id: 2,
      title: 'HTTP 错误率 / 5m',
      type: 'timeseries',
      targets: [
        { expr: 'sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))', legendFormat: '5xx rate' },
        { expr: 'sum(rate(http_requests_total{status=~"4.."}[5m])) / sum(rate(http_requests_total[5m]))', legendFormat: '4xx rate' },
      ],
      gridPos: { x: 12, y: 0, w: 12, h: 8 },
      fieldConfig: { defaults: { unit: 'percent' } },
    },
    {
      id: 3,
      title: 'Throughput (RPS)',
      type: 'timeseries',
      targets: [{ expr: 'sum(rate(http_requests_total[5m])) by (method)', legendFormat: '{{method}}' }],
      gridPos: { x: 0, y: 8, w: 12, h: 8 },
    },
    {
      id: 4,
      title: 'Top 10 慢请求路由',
      type: 'table',
      targets: [{ expr: 'topk(10, histogram_quantile(0.99, sum by (path, le) (rate(http_request_duration_ms_bucket[5m]))))', legendFormat: '{{path}}' }],
      gridPos: { x: 12, y: 8, w: 12, h: 8 },
    },
    {
      id: 5,
      title: '活跃连接数',
      type: 'stat',
      targets: [{ expr: 'http_active_connections', legendFormat: 'active' }],
      gridPos: { x: 0, y: 16, w: 6, h: 4 },
    },
    {
      id: 6,
      title: '进程 uptime',
      type: 'stat',
      targets: [{ expr: 'process_uptime_seconds', legendFormat: 'uptime' }],
      gridPos: { x: 6, y: 16, w: 6, h: 4 },
    },
  ],
};

// ── Dashboard 3: Compliance ──

export const COMPLIANCE_DASHBOARD: GrafanaDashboard = {
  title: '神机营 · 合规监控',
  uid: 'm5-compliance',
  schemaVersion: 38,
  version: 1,
  refresh: '1m',
  time: { from: 'now-24h', to: 'now' },
  tags: ['m5', 'compliance'],
  panels: [
    {
      id: 1,
      title: 'GDPR 数据请求 / 24h',
      type: 'stat',
      targets: [{ expr: 'sum(increase(compliance_gdpr_request_total[24h]))', legendFormat: 'requests' }],
      gridPos: { x: 0, y: 0, w: 6, h: 4 },
    },
    {
      id: 2,
      title: 'PII 检测事件 / 1h',
      type: 'stat',
      targets: [{ expr: 'sum(increase(compliance_pii_detected_total[1h]))', legendFormat: 'events' }],
      gridPos: { x: 6, y: 0, w: 6, h: 4 },
    },
    {
      id: 3,
      title: '审计日志完整性',
      type: 'gauge',
      targets: [{ expr: 'compliance_audit_log_chain_valid', legendFormat: 'valid' }],
      gridPos: { x: 12, y: 0, w: 6, h: 4 },
    },
    {
      id: 4,
      title: '数据驻留分布',
      type: 'piechart' as any,
      targets: [{ expr: 'sum by (region) (compliance_data_residency_bytes)', legendFormat: '{{region}}' }],
      gridPos: { x: 18, y: 0, w: 6, h: 4 },
    },
    {
      id: 5,
      title: '审计事件类型分布 / 24h',
      type: 'timeseries',
      targets: [{ expr: 'sum by (action) (increase(compliance_audit_events_total[24h]))', legendFormat: '{{action}}' }],
      gridPos: { x: 0, y: 4, w: 24, h: 8 },
    },
  ],
};

// ── Dashboard 4: Mobile ──

export const MOBILE_DASHBOARD: GrafanaDashboard = {
  title: '神机营 · 移动端',
  uid: 'm5-mobile',
  schemaVersion: 38,
  version: 1,
  refresh: '30s',
  time: { from: 'now-6h', to: 'now' },
  tags: ['m5', 'mobile'],
  panels: [
    {
      id: 1,
      title: 'Crash-Free Session Rate',
      type: 'gauge',
      targets: [{ expr: 'mobile_crash_free_session_rate', legendFormat: 'crash-free' }],
      gridPos: { x: 0, y: 0, w: 6, h: 4 },
      fieldConfig: {
        defaults: {
          unit: 'percentunit',
          thresholds: { steps: [{ color: 'red', value: 0 }, { color: 'yellow', value: 0.95 }, { color: 'green', value: 0.99 }] },
        },
      },
    },
    {
      id: 2,
      title: '离线队列长度',
      type: 'stat',
      targets: [{ expr: 'mobile_offline_queue_size', legendFormat: 'pending' }],
      gridPos: { x: 6, y: 0, w: 6, h: 4 },
    },
    {
      id: 3,
      title: '多设备同步冲突数 / 1h',
      type: 'stat',
      targets: [{ expr: 'sum(increase(mobile_sync_conflicts_total[1h]))', legendFormat: 'conflicts' }],
      gridPos: { x: 12, y: 0, w: 6, h: 4 },
    },
    {
      id: 4,
      title: '推送送达率',
      type: 'gauge',
      targets: [{ expr: 'mobile_push_delivery_rate', legendFormat: 'delivery' }],
      gridPos: { x: 18, y: 0, w: 6, h: 4 },
    },
    {
      id: 5,
      title: 'API 命中率 (缓存)',
      type: 'timeseries',
      targets: [{ expr: 'mobile_api_cache_hit_rate', legendFormat: 'hit rate' }],
      gridPos: { x: 0, y: 4, w: 12, h: 8 },
    },
    {
      id: 6,
      title: 'WebSocket 重连次数',
      type: 'timeseries',
      targets: [{ expr: 'sum by (device_id) (increase(mobile_ws_reconnect_total[5m]))', legendFormat: '{{device_id}}' }],
      gridPos: { x: 12, y: 4, w: 12, h: 8 },
    },
  ],
};

export const ALL_DASHBOARDS: GrafanaDashboard[] = [
  BUSINESS_DASHBOARD,
  PERFORMANCE_DASHBOARD,
  COMPLIANCE_DASHBOARD,
  MOBILE_DASHBOARD,
];

// ── Alert Dashboard (severity panel) ──

export interface AlertPanelData {
  severity: Alert['severity'];
  count: number;
  alerts: Array<{ id: string; title: string; firedAt: string }>;
}

export function buildAlertPanelData(alerts: Alert[]): AlertPanelData[] {
  const bySeverity = new Map<Alert['severity'], Alert[]>();
  for (const a of alerts) {
    const arr = bySeverity.get(a.severity) ?? [];
    arr.push(a);
    bySeverity.set(a.severity, arr);
  }
  return ['P0', 'P1', 'P2'].map((sev) => {
    const arr = bySeverity.get(sev as Alert['severity']) ?? [];
    return {
      severity: sev as Alert['severity'],
      count: arr.length,
      alerts: arr.map((a) => ({ id: a.id, title: a.title, firedAt: a.firedAt })),
    };
  });
}
