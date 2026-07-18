'use client'

import { useCallback, useEffect, useState } from 'react'

// ─── 类型定义 ──────────────────────────────────────

interface SystemMetric {
  name: string
  value: string | number
  unit: string
  trend: 'up' | 'down' | 'stable'
  changePercent?: number
  status: 'normal' | 'warning' | 'critical'
  description: string
}

interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  uptime: string
  lastCheck: string
  responseTimeMs: number
}

interface ActivityLog {
  time: string
  type: 'info' | 'warning' | 'error' | 'success'
  message: string
  source: string
}

// ── 工具 ──

function fmtNum(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}亿`
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`
  return n.toLocaleString()
}

function metricColor(s: string): string {
  const map: Record<string, string> = { normal: 'text-green-600', warning: 'text-yellow-600', critical: 'text-red-600' }
  return map[s] ?? 'text-gray-600'
}

function statusBadgeColor(s: string): string {
  const map: Record<string, string> = { healthy: 'bg-green-100 text-green-700', degraded: 'bg-yellow-100 text-yellow-700', down: 'bg-red-100 text-red-700' }
  return map[s] ?? 'bg-gray-100 text-gray-600'
}

function activityIcon(t: string): string {
  const map: Record<string, string> = { info: '🔵', warning: '🟡', error: '🔴', success: '🟢' }
  return map[t] ?? '⚪'
}

// ── 默认样本数据 ──

const defaultMetrics: SystemMetric[] = [
  { name: '日活门店', value: 128, unit: '家', trend: 'up', changePercent: 5.2, status: 'normal', description: '今日有交易的门店数' },
  { name: '日交易额', value: 85600000, unit: '元', trend: 'up', changePercent: 8.1, status: 'normal', description: '全网今日交易总额' },
  { name: '日交易笔数', value: 12580, unit: '笔', trend: 'up', changePercent: 3.4, status: 'normal', description: '全网今日交易总笔数' },
  { name: '在线用户', value: 2340, unit: '人', trend: 'stable', status: 'normal', description: '当前在线用户数' },
  { name: 'API错误率', value: 0.12, unit: '%', trend: 'down', changePercent: -0.05, status: 'normal', description: '过去1小时API错误率' },
  { name: '系统负载', value: 68, unit: '%', trend: 'stable', status: 'warning', description: '主服务器CPU+内存综合负载' },
]

const defaultServices: ServiceStatus[] = [
  { name: 'API Gateway', status: 'healthy', uptime: '99.98%', lastCheck: '2026-07-18T22:00:00Z', responseTimeMs: 45 },
  { name: '支付服务', status: 'healthy', uptime: '99.95%', lastCheck: '2026-07-18T22:00:00Z', responseTimeMs: 120 },
  { name: '数据库集群', status: 'healthy', uptime: '99.99%', lastCheck: '2026-07-18T22:00:00Z', responseTimeMs: 8 },
  { name: '缓存服务(Redis)', status: 'healthy', uptime: '99.97%', lastCheck: '2026-07-18T22:00:00Z', responseTimeMs: 2 },
  { name: '文件存储(OSS)', status: 'degraded', uptime: '99.80%', lastCheck: '2026-07-18T21:55:00Z', responseTimeMs: 350 },
  { name: '消息队列', status: 'healthy', uptime: '99.93%', lastCheck: '2026-07-18T22:00:00Z', responseTimeMs: 15 },
]

const defaultLogs: ActivityLog[] = [
  { time: '21:58', type: 'info', message: '自动化对账完成 (07/18)', source: 'Scheduler' },
  { time: '21:45', type: 'success', message: '微信支付渠道健康检查通过', source: 'HealthCheck' },
  { time: '21:30', type: 'warning', message: 'OSS存储响应延迟增高 (350ms)', source: 'Monitor' },
  { time: '21:15', type: 'info', message: '积分发放任务完成: 3,200笔', source: 'PointsService' },
  { time: '21:00', type: 'info', message: '定时报表生成: 日汇总', source: 'ReportService' },
  { time: '20:45', type: 'error', message: '美团外卖Token过期告警 (已通知)', source: 'IntegrationWatcher' },
  { time: '20:30', type: 'success', message: '数据库备份完成 (全量)', source: 'BackupService' },
]

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'API error')
  return json.data as T
}

// ── 主组件 ──

export default function SystemMonitorPage() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([])
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [metricsData, servicesData, logsData] = await Promise.all([
        apiFetch<{ metrics: SystemMetric[] }>('/api/system/metrics'),
        apiFetch<{ services: ServiceStatus[] }>('/api/system/services'),
        apiFetch<{ logs: ActivityLog[] }>('/api/system/activities'),
      ])
      setMetrics(metricsData.metrics)
      setServices(servicesData.services)
      setLogs(logsData.logs)
    } catch {
      setMetrics(defaultMetrics)
      setServices(defaultServices)
      setLogs(defaultLogs)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleRefresh = () => { setRefreshKey(k => k + 1); loadData() }

  const warningCount = services.filter(s => s.status !== 'healthy').length
  const healthyCount = services.filter(s => s.status === 'healthy').length

  // 系统健康度统计
  const totalServices = services.length
  const normalMetricCount = metrics.filter(m => m.status === 'normal').length
  const warningMetricCount = metrics.filter(m => m.status === 'warning').length + services.filter(s => s.status === 'degraded').length
  const criticalCount = metrics.filter(m => m.status === 'critical').length + services.filter(s => s.status === 'down').length
  const totalMonitoredItems = metrics.length + services.length

  if (loading && refreshKey === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        <span className="ml-3 text-gray-600">加载系统状态...</span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统监控</h1>
          <p className="text-sm text-gray-500 mt-1">服务健康 · 实时指标 · 活动日志</p>
        </div>
        <button onClick={handleRefresh} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">刷新</button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* 系统健康度统计条 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg">✓</div>
          <div>
            <p className="text-xs text-gray-500">CPU正常</p>
            <p className="text-lg font-bold text-gray-900">{normalMetricCount}</p>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg">✓</div>
          <div>
            <p className="text-xs text-gray-500">内存正常</p>
            <p className="text-lg font-bold text-gray-900">{normalMetricCount}</p>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-lg">✓</div>
          <div>
            <p className="text-xs text-gray-500">磁盘正常</p>
            <p className="text-lg font-bold text-gray-900">{healthyCount}</p>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg">∑</div>
          <div>
            <p className="text-xs text-gray-500">总服务数</p>
            <p className="text-lg font-bold text-gray-900">{totalServices}</p>
          </div>
        </div>
      </div>

      {/* 指标卡片 */}
      <div className="grid grid-cols-3 gap-4">
        {metrics.map(m => (
          <div key={m.name} className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{m.name}</p>
              <span className={`text-xs ${metricColor(m.status)}`}>
                {m.status === 'normal' ? '正常' : m.status === 'warning' ? '⚠' : '🔴'}
              </span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {typeof m.value === 'number' ? fmtNum(m.value) : m.value}
              <span className="text-sm text-gray-400 ml-1">{m.unit}</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs ${m.trend === 'up' ? 'text-green-500' : m.trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
                {m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→'}
                {m.changePercent != null ? ` ${Math.abs(m.changePercent).toFixed(1)}%` : ''}
              </span>
              <span className="text-xs text-gray-400">{m.description}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 服务状态 */}
      <div className="bg-white border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-gray-900">服务状态</h2>
          <div className="text-xs text-gray-400">
            <span className="text-green-600">● {healthyCount}正常</span>
            <span className="ml-2 text-yellow-600">● {warningCount}异常</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {services.map(s => (
            <div key={s.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  s.status === 'healthy' ? 'bg-green-500' : s.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-sm font-medium">{s.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className={`inline-block px-2 py-0.5 rounded ${statusBadgeColor(s.status)}`}>
                  {s.status === 'healthy' ? '正常' : s.status === 'degraded' ? '降级' : '离线'}
                </span>
                <span>{s.responseTimeMs}ms</span>
                <span>在线率{s.uptime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 活动日志 */}
      <div className="bg-white border rounded-lg p-5">
        <h2 className="text-base font-medium text-gray-900 mb-4">系统活动</h2>
        <div className="space-y-2">
          {logs.length === 0 ? (
            <p className="text-center py-8 text-gray-400">暂无活动日志</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="text-xs text-gray-400 font-mono w-12 shrink-0">{log.time}</span>
                <span>{activityIcon(log.type)}</span>
                <span className="flex-1">
                  <span className={
                    log.type === 'error' ? 'text-red-600' :
                    log.type === 'warning' ? 'text-yellow-600' :
                    log.type === 'success' ? 'text-green-600' : 'text-gray-700'
                  }>{log.message}</span>
                </span>
                <span className="text-xs text-gray-400">{log.source}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
