// alerts-data.ts · 告警监控Mock数据
// Phase-FP T-FP-024 · 2026-07-02

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertStatus = 'firing' | 'acknowledged' | 'resolved' | 'silenced';
export type AlertCategory = 'infrastructure' | 'application' | 'business' | 'security';

export interface Alert {
  id: string;
  alertName: string;
  alertCode: string;
  severity: AlertSeverity;
  status: AlertStatus;
  category: AlertCategory;
  source: string;
  metric: string;
  currentValue: number;
  threshold: number;
  unit: string;
  message: string;
  suggestion?: string;
  tenantId?: string;
  tenantName?: string;
  storeId?: string;
  storeName?: string;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  duration?: number; // 持续时间(秒)
}

export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  critical: '致命',
  high: '高危',
  medium: '中危',
  low: '低危',
  info: '信息',
};

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  info: '#64748b',
};

export const SEVERITY_BG: Record<AlertSeverity, string> = {
  critical: 'rgba(239, 68, 68, 0.15)',
  high: 'rgba(249, 115, 22, 0.15)',
  medium: 'rgba(234, 179, 8, 0.15)',
  low: 'rgba(34, 197, 94, 0.15)',
  info: 'rgba(100, 116, 139, 0.15)',
};

export const STATUS_LABELS: Record<AlertStatus, string> = {
  firing: '触发中',
  acknowledged: '已确认',
  resolved: '已解决',
  silenced: '已静默',
};

export const STATUS_VARIANTS: Record<AlertStatus, 'error' | 'warning' | 'success' | 'neutral'> = {
  firing: 'error',
  acknowledged: 'warning',
  resolved: 'success',
  silenced: 'neutral',
};

export const CATEGORY_LABELS: Record<AlertCategory, string> = {
  infrastructure: '基础设施',
  application: '应用服务',
  business: '业务指标',
  security: '安全告警',
};

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`;
  return `${Math.floor(seconds / 86400)}天${Math.floor((seconds % 86400) / 3600)}小时`;
}

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'alert-001',
    alertName: 'CPU使用率过高',
    alertCode: 'CPU_HIGH_001',
    severity: 'high',
    status: 'firing',
    category: 'infrastructure',
    source: '服务器-SZ-APP-01',
    metric: 'cpu_usage',
    currentValue: 92,
    threshold: 80,
    unit: '%',
    message: 'CPU使用率持续高于80%，当前92%，请及时处理',
    suggestion: '建议检查是否有异常进程占用CPU，可考虑扩容或优化应用',
    tenantId: 't-001',
    tenantName: '深圳华强科技集团',
    storeId: 's01',
    storeName: '深圳南山旗舰店',
    createdAt: '2026-07-02T08:30:00Z',
    updatedAt: '2026-07-02T08:30:00Z',
    duration: 3600,
  },
  {
    id: 'alert-002',
    alertName: '内存使用率告警',
    alertCode: 'MEM_HIGH_001',
    severity: 'medium',
    status: 'acknowledged',
    category: 'infrastructure',
    source: '服务器-SZ-APP-02',
    metric: 'memory_usage',
    currentValue: 85,
    threshold: 80,
    unit: '%',
    message: '内存使用率达到85%，接近阈值80%',
    tenantId: 't-001',
    tenantName: '深圳华强科技集团',
    createdAt: '2026-07-02T07:15:00Z',
    updatedAt: '2026-07-02T07:20:00Z',
    acknowledgedAt: '2026-07-02T07:20:00Z',
    acknowledgedBy: '张运维',
    duration: 7200,
  },
  {
    id: 'alert-003',
    alertName: '订单失败率异常',
    alertCode: 'ORDER_FAIL_RATE_001',
    severity: 'critical',
    status: 'firing',
    category: 'business',
    source: '订单服务',
    metric: 'order_failure_rate',
    currentValue: 15.5,
    threshold: 5,
    unit: '%',
    message: '订单失败率突然飙升至15.5%，远超正常水平5%',
    suggestion: '建议立即检查支付通道和订单处理服务',
    tenantId: 't-002',
    tenantName: '广州天河商业集团',
    createdAt: '2026-07-02T06:45:00Z',
    updatedAt: '2026-07-02T06:45:00Z',
    duration: 1800,
  },
  {
    id: 'alert-004',
    alertName: '磁盘空间不足',
    alertCode: 'DISK_FULL_001',
    severity: 'high',
    status: 'resolved',
    category: 'infrastructure',
    source: '数据库服务器-SH-DB-01',
    metric: 'disk_usage',
    currentValue: 95,
    threshold: 90,
    unit: '%',
    message: '磁盘使用率达到95%，已触发扩容告警',
    tenantId: 't-003',
    tenantName: '上海浦东实业集团',
    createdAt: '2026-07-01T22:00:00Z',
    updatedAt: '2026-07-02T01:30:00Z',
    acknowledgedAt: '2026-07-01T22:15:00Z',
    acknowledgedBy: '王DBA',
    resolvedAt: '2026-07-02T01:30:00Z',
    duration: 115800,
  },
  {
    id: 'alert-005',
    alertName: '接口响应超时',
    alertCode: 'API_TIMEOUT_001',
    severity: 'medium',
    status: 'firing',
    category: 'application',
    source: 'API网关',
    metric: 'api_latency_p99',
    currentValue: 5800,
    threshold: 3000,
    unit: 'ms',
    message: 'API响应时间P99达到5800ms，超过3000ms阈值',
    tenantId: 't-001',
    tenantName: '深圳华强科技集团',
    createdAt: '2026-07-02T05:20:00Z',
    updatedAt: '2026-07-02T05:20:00Z',
    duration: 5400,
  },
  {
    id: 'alert-006',
    alertName: '登录失败次数过多',
    alertCode: 'LOGIN_FAIL_001',
    severity: 'high',
    status: 'acknowledged',
    category: 'security',
    source: '身份认证服务',
    metric: 'login_failure_count',
    currentValue: 156,
    threshold: 100,
    unit: '次/小时',
    message: '登录失败次数达到156次/小时，可能存在暴力破解行为',
    suggestion: '建议检查是否有异常IP尝试登录，考虑临时封禁该IP',
    tenantId: 't-004',
    tenantName: '北京朝阳贸易公司',
    createdAt: '2026-07-02T04:00:00Z',
    updatedAt: '2026-07-02T04:30:00Z',
    acknowledgedAt: '2026-07-02T04:30:00Z',
    acknowledgedBy: '刘安全',
    duration: 10800,
  },
  {
    id: 'alert-007',
    alertName: '数据库连接池告警',
    alertCode: 'DB_POOL_001',
    severity: 'medium',
    status: 'resolved',
    category: 'application',
    source: 'MySQL-主库',
    metric: 'db_connection_usage',
    currentValue: 90,
    threshold: 80,
    unit: '%',
    message: '数据库连接池使用率达到90%',
    tenantId: 't-003',
    tenantName: '上海浦东实业集团',
    createdAt: '2026-07-01T18:00:00Z',
    updatedAt: '2026-07-01T20:00:00Z',
    resolvedAt: '2026-07-01T20:00:00Z',
    duration: 7200,
  },
  {
    id: 'alert-008',
    alertName: '短信发送量异常',
    alertCode: 'SMS_THRESHOLD_001',
    severity: 'low',
    status: 'firing',
    category: 'business',
    source: '短信服务',
    metric: 'sms_send_count',
    currentValue: 9800,
    threshold: 10000,
    unit: '条/日',
    message: '今日短信发送量已达9800条，接近日限额10000条',
    tenantId: 't-005',
    tenantName: '成都春熙路商业集团',
    createdAt: '2026-07-02T09:00:00Z',
    updatedAt: '2026-07-02T09:00:00Z',
    duration: 0,
  },
  {
    id: 'alert-009',
    alertName: 'SSL证书即将过期',
    alertCode: 'SSL_EXPIRE_001',
    severity: 'low',
    status: 'silenced',
    category: 'security',
    source: 'API网关-公网',
    metric: 'ssl_days_until_expiry',
    currentValue: 7,
    threshold: 14,
    unit: '天',
    message: 'SSL证书将在7天后过期，请及时更新',
    tenantId: 't-001',
    tenantName: '深圳华强科技集团',
    createdAt: '2026-06-25T00:00:00Z',
    updatedAt: '2026-06-28T00:00:00Z',
    duration: 604800,
  },
  {
    id: 'alert-010',
    alertName: '网络延迟异常',
    alertCode: 'NET_LATENCY_001',
    severity: 'info',
    status: 'resolved',
    category: 'infrastructure',
    source: '负载均衡器',
    metric: 'network_latency',
    currentValue: 250,
    threshold: 200,
    unit: 'ms',
    message: '网络延迟达到250ms，略高于正常水平',
    tenantId: 't-002',
    tenantName: '广州天河商业集团',
    createdAt: '2026-07-01T14:00:00Z',
    updatedAt: '2026-07-01T14:30:00Z',
    resolvedAt: '2026-07-01T14:30:00Z',
    duration: 1800,
  },
];
