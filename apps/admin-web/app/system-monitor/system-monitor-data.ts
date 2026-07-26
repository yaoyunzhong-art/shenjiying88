const DEFAULT_API_ORIGIN = 'http://localhost:3001'

export interface SystemMetric {
  name: string
  value: string | number
  unit: string
  trend: 'up' | 'down' | 'stable'
  changePercent?: number
  status: 'normal' | 'warning' | 'critical'
  description: string
}

export interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  uptime: string
  lastCheck: string
  responseTimeMs: number
}

export interface ActivityLog {
  time: string
  type: 'info' | 'warning' | 'error' | 'success'
  message: string
  source: string
}

export interface SystemMonitorSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  metrics: SystemMetric[]
  services: ServiceStatus[]
  logs: ActivityLog[]
  generatedAt: string
  error?: string
}

export const defaultMetrics: SystemMetric[] = [
  { name: '日活门店', value: 128, unit: '家', trend: 'up', changePercent: 5.2, status: 'normal', description: '今日有交易的门店数' },
  { name: '日交易额', value: 85600000, unit: '元', trend: 'up', changePercent: 8.1, status: 'normal', description: '全网今日交易总额' },
  { name: '日交易笔数', value: 12580, unit: '笔', trend: 'up', changePercent: 3.4, status: 'normal', description: '全网今日交易总笔数' },
  { name: '在线用户', value: 2340, unit: '人', trend: 'stable', status: 'normal', description: '当前在线用户数' },
  { name: 'API错误率', value: 0.12, unit: '%', trend: 'down', changePercent: -0.05, status: 'normal', description: '过去1小时API错误率' },
  { name: '系统负载', value: 68, unit: '%', trend: 'stable', status: 'warning', description: '主服务器CPU+内存综合负载' },
]

export const defaultServices: ServiceStatus[] = [
  { name: 'API Gateway', status: 'healthy', uptime: '99.98%', lastCheck: '2026-07-18T22:00:00Z', responseTimeMs: 45 },
  { name: '支付服务', status: 'healthy', uptime: '99.95%', lastCheck: '2026-07-18T22:00:00Z', responseTimeMs: 120 },
  { name: '数据库集群', status: 'healthy', uptime: '99.99%', lastCheck: '2026-07-18T22:00:00Z', responseTimeMs: 8 },
  { name: '缓存服务(Redis)', status: 'healthy', uptime: '99.97%', lastCheck: '2026-07-18T22:00:00Z', responseTimeMs: 2 },
  { name: '文件存储(OSS)', status: 'degraded', uptime: '99.80%', lastCheck: '2026-07-18T21:55:00Z', responseTimeMs: 350 },
  { name: '消息队列', status: 'healthy', uptime: '99.93%', lastCheck: '2026-07-18T22:00:00Z', responseTimeMs: 15 },
]

export const defaultLogs: ActivityLog[] = [
  { time: '21:58', type: 'info', message: '自动化对账完成 (07/18)', source: 'Scheduler' },
  { time: '21:45', type: 'success', message: '微信支付渠道健康检查通过', source: 'HealthCheck' },
  { time: '21:30', type: 'warning', message: 'OSS存储响应延迟增高 (350ms)', source: 'Monitor' },
  { time: '21:15', type: 'info', message: '积分发放任务完成: 3,200笔', source: 'PointsService' },
  { time: '21:00', type: 'info', message: '定时报表生成: 日汇总', source: 'ReportService' },
  { time: '20:45', type: 'error', message: '美团外卖Token过期告警 (已通知)', source: 'IntegrationWatcher' },
  { time: '20:30', type: 'success', message: '数据库备份完成 (全量)', source: 'BackupService' },
]

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveSystemMonitorApiBaseUrl(): string {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) {
    return `${DEFAULT_API_ORIGIN}/api/v1/`
  }
  if (normalized.endsWith('/api/v1') || normalized.endsWith('/api/v1/')) {
    return ensureTrailingSlash(normalized)
  }
  if (normalized.endsWith('/api') || normalized.endsWith('/api/')) {
    return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/v1`)
  }
  return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/api/v1`)
}

function unwrapApiPayload<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    const wrapped = payload as { success?: boolean; data?: T; message?: string }
    if (!wrapped.success) {
      throw new Error(wrapped.message ?? 'API error')
    }
    return wrapped.data as T
  }
  return payload as T
}

async function fetchSystemMonitorPart<T>(path: string): Promise<T> {
  const upstreamUrl = new URL(path, resolveSystemMonitorApiBaseUrl()).toString()
  const response = await fetch(upstreamUrl, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`system monitor upstream failed: ${response.status}`)
  }
  const payload = await response.json()
  return unwrapApiPayload<T>(payload)
}

export async function loadSystemMonitorSnapshot(): Promise<SystemMonitorSnapshotDelivery> {
  try {
    const [metricsData, servicesData, logsData] = await Promise.all([
      fetchSystemMonitorPart<{ metrics: SystemMetric[] }>('system/metrics'),
      fetchSystemMonitorPart<{ services: ServiceStatus[] }>('system/services'),
      fetchSystemMonitorPart<{ logs: ActivityLog[] }>('system/activities'),
    ])

    return {
      deliveryMode: 'api',
      metrics: metricsData.metrics,
      services: servicesData.services,
      logs: logsData.logs,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      metrics: defaultMetrics,
      services: defaultServices,
      logs: defaultLogs,
      generatedAt: new Date().toISOString(),
      error: '实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
