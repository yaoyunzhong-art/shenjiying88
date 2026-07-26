'use client'

import { useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type {
  ActivityLog,
  ServiceStatus,
  SystemMetric,
  SystemMonitorSnapshotDelivery,
} from './system-monitor-data'

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

function SystemSummaryStats({
  metrics,
  services,
}: {
  metrics: SystemMetric[]
  services: ServiceStatus[]
}) {
  const healthyCount = services.filter((s) => s.status === 'healthy').length
  const totalServices = services.length
  const normalMetricCount = metrics.filter((m) => m.status === 'normal').length

  return (
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
  )
}

function SystemMetricsGrid({ metrics }: { metrics: SystemMetric[] }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {metrics.map((metric) => (
        <div key={metric.name} className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{metric.name}</p>
            <span className={`text-xs ${metricColor(metric.status)}`}>
              {metric.status === 'normal' ? '正常' : metric.status === 'warning' ? '⚠' : '🔴'}
            </span>
          </div>
          <p className="text-2xl font-bold mt-1">
            {typeof metric.value === 'number' ? fmtNum(metric.value) : metric.value}
            <span className="text-sm text-gray-400 ml-1">{metric.unit}</span>
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs ${metric.trend === 'up' ? 'text-green-500' : metric.trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
              {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
              {metric.changePercent != null ? ` ${Math.abs(metric.changePercent).toFixed(1)}%` : ''}
            </span>
            <span className="text-xs text-gray-400">{metric.description}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function ServiceStatusPanel({ services }: { services: ServiceStatus[] }) {
  const healthyCount = services.filter((s) => s.status === 'healthy').length
  const warningCount = services.filter((s) => s.status !== 'healthy').length

  return (
    <div className="bg-white border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium text-gray-900">服务状态</h2>
        <div className="text-xs text-gray-400">
          <span className="text-green-600">● {healthyCount}正常</span>
          <span className="ml-2 text-yellow-600">● {warningCount}异常</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {services.map((service) => (
          <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                service.status === 'healthy' ? 'bg-green-500' : service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-sm font-medium">{service.name}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className={`inline-block px-2 py-0.5 rounded ${statusBadgeColor(service.status)}`}>
                {service.status === 'healthy' ? '正常' : service.status === 'degraded' ? '降级' : '离线'}
              </span>
              <span>{service.responseTimeMs}ms</span>
              <span>在线率{service.uptime}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityLogPanel({ logs }: { logs: ActivityLog[] }) {
  return (
    <div className="bg-white border rounded-lg p-5">
      <h2 className="text-base font-medium text-gray-900 mb-4">系统活动</h2>
      <div className="space-y-2">
        {logs.length === 0 ? (
          <p className="text-center py-8 text-gray-400">暂无活动日志</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="flex items-start gap-3 text-sm">
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
  )
}

export default function SystemMonitorClient({
  snapshot,
}: {
  snapshot: SystemMonitorSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const { metrics, services, logs } = snapshot

  const systemHealth = useMemo(() => {
    const normalMetricCount = metrics.filter((metric) => metric.status === 'normal').length
    const warningMetricCount = metrics.filter((metric) => metric.status === 'warning').length + services.filter((service) => service.status === 'degraded').length
    const criticalCount = metrics.filter((metric) => metric.status === 'critical').length + services.filter((service) => service.status === 'down').length
    const totalMonitoredItems = metrics.length + services.length
    return {
      normalMetricCount,
      warningMetricCount,
      criticalCount,
      totalMonitoredItems,
    }
  }, [metrics, services])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统监控</h1>
          <p className="text-sm text-gray-500 mt-1">
            服务健康 · 实时指标 · 活动日志 · 监控项 {systemHealth.totalMonitoredItems}
          </p>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      {snapshot.error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{snapshot.error}</p>
        </div>
      )}

      <SystemSummaryStats metrics={metrics} services={services} />
      <SystemMetricsGrid metrics={metrics} />
      <ServiceStatusPanel services={services} />
      <ActivityLogPanel logs={logs} />
    </div>
  )
}
