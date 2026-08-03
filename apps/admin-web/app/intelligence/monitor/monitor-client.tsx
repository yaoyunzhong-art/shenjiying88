'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import type { Alert, MonitorSnapshotDelivery, TrendPoint } from './monitor-data'

const TYPE_LABELS: Record<Alert['type'], string> = {
  price_change: '💰 价格调整',
  new_activity: '🎉 新活动',
  new_promotion: '🏷️ 新优惠',
  rating_change: '⭐ 评分变化',
  equipment_change: '🔧 设备异动',
  policy_change: '📋 政策变更',
}

const TYPE_ICONS: Record<Alert['type'], string> = {
  price_change: '💰',
  new_activity: '🎉',
  new_promotion: '🏷️',
  rating_change: '⭐',
  equipment_change: '🔧',
  policy_change: '📋',
}

const SEV_LEVELS: Record<Alert['severity'], string> = {
  high: '🔴 紧急',
  medium: '🟡 关注',
  low: '🟢 观察',
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}分钟前`
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}小时前`
  return `${Math.round(diff / 86_400_000)}天前`
}

function buildWeeklyTrend(trend: TrendPoint[]): Array<[string, Partial<Record<Alert['type'], number>>]> {
  const days = trend.reduce<Partial<Record<string, Partial<Record<Alert['type'], number>>>>>((acc, point) => {
    if (!acc[point.date]) {
      acc[point.date] = {}
    }
    const day = acc[point.date] as Partial<Record<Alert['type'], number>>
    day[point.type] = (day[point.type] ?? 0) + point.count
    return acc
  }, {})

  return Object.entries(days).sort(([a], [b]) => a.localeCompare(b)) as Array<
    [string, Partial<Record<Alert['type'], number>>]
  >
}

export default function MonitorClient({
  snapshot,
}: {
  snapshot: MonitorSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [typeFilter, setTypeFilter] = useState<'ALL' | Alert['type']>('ALL')
  const [sevFilter, setSevFilter] = useState<'ALL' | Alert['severity']>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const triggerRefresh = useCallback(() => {
    handleRefresh()
  }, [handleRefresh])

  useEffect(() => {
    if (!autoRefresh) return undefined
    const interval = window.setInterval(() => {
      triggerRefresh()
    }, 30_000)
    return () => window.clearInterval(interval)
  }, [autoRefresh, triggerRefresh])

  const filtered = useMemo(() => {
    let items = [...snapshot.alerts]
    if (typeFilter !== 'ALL') items = items.filter((alert) => alert.type === typeFilter)
    if (sevFilter !== 'ALL') items = items.filter((alert) => alert.severity === sevFilter)

    return items.sort((left, right) => {
      const dedupOrder = Number(Boolean(left.deduped)) - Number(Boolean(right.deduped))
      if (dedupOrder !== 0) return dedupOrder
      return new Date(right.detectedAt).getTime() - new Date(left.detectedAt).getTime()
    })
  }, [sevFilter, snapshot.alerts, typeFilter])

  const stats = useMemo(() => {
    const result: Record<Alert['type'], number> = {
      price_change: 0,
      new_activity: 0,
      new_promotion: 0,
      rating_change: 0,
      equipment_change: 0,
      policy_change: 0,
    }

    for (const alert of snapshot.alerts) {
      if (!alert.deduped) {
        result[alert.type] += 1
      }
    }

    return result
  }, [snapshot.alerts])

  const highCount = snapshot.alerts.filter((alert) => alert.severity === 'high' && !alert.deduped).length
  const weeklyTrend = useMemo(() => buildWeeklyTrend(snapshot.trend), [snapshot.trend])
  const freshnessText = useMemo(() => {
    const diff = Date.now() - new Date(snapshot.scanTimestamp).getTime()
    if (diff < 60_000) return '刚刚采集'
    if (diff < 3_600_000) return `${Math.round(diff / 60_000)}分钟前`
    return `${Math.round(diff / 3_600_000)}小时前`
  }, [snapshot.scanTimestamp])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">👀 竞争监控</h1>
          {highCount > 0 ? (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium animate-pulse">
              {highCount}条紧急
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-sm flex-wrap justify-end">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              freshnessText === '刚刚采集'
                ? 'bg-green-100 text-green-700'
                : freshnessText.includes('分钟')
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-500'
            }`}
          >
            🕐 数据采集于{freshnessText}
          </span>
          <span className="text-xs text-gray-400">模式: {snapshot.scanMode === 'full' ? '全量' : '增量'}</span>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(event) => setAutoRefresh(event.target.checked)}
              className="w-3.5 h-3.5"
            />
            <span className="text-xs text-gray-400">自动刷新</span>
          </label>
          <button
            type="button"
            onClick={triggerRefresh}
            disabled={isRefreshing}
            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
        </div>
      </div>

      {snapshot.error ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
          {snapshot.error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {Object.entries(stats).map(([type, count]) => (
          <div key={type} className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-lg">{TYPE_ICONS[type as Alert['type']]}</p>
            <p className="text-xs text-gray-500 mt-1">{TYPE_LABELS[type as Alert['type']]}</p>
            <p className="text-lg font-bold">{count}</p>
          </div>
        ))}
      </div>

      {weeklyTrend.length > 0 ? (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold mb-3">📊 周异动走势</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-1">日期</th>
                  {Object.keys(TYPE_ICONS).map((type) => (
                    <th key={type} className="p-1 text-center">
                      {TYPE_ICONS[type as Alert['type']]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeklyTrend.map(([date, types]) => (
                  <tr key={date} className="border-t">
                    <td className="p-1 text-gray-500">{date.slice(5)}</td>
                    {Object.keys(TYPE_ICONS).map((type) => {
                      const count = types[type as Alert['type']] ?? 0
                      return (
                        <td key={type} className="p-1 text-center">
                          <div className="flex justify-center">
                            <div
                              className="bg-blue-500 rounded-sm transition-all"
                              style={{
                                width: '16px',
                                height: `${Math.min(count * 6, 40)}px`,
                                opacity: count > 0 ? 0.7 + Math.min(count / 10, 0.3) : 0.1,
                              }}
                              title={`${TYPE_LABELS[type as Alert['type']]}: ${count}次`}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400">{count > 0 ? count : ''}</span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="flex gap-2 flex-wrap items-center">
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as 'ALL' | Alert['type'])}
          className="border rounded px-2 py-1.5 text-sm"
        >
          <option value="ALL">全部类型</option>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={sevFilter}
          onChange={(event) => setSevFilter(event.target.value as 'ALL' | Alert['severity'])}
          className="border rounded px-2 py-1.5 text-sm"
        >
          <option value="ALL">全部级别</option>
          <option value="high">紧急</option>
          <option value="medium">关注</option>
          <option value="low">观察</option>
        </select>
        <span className="text-xs text-gray-400">
          共 {filtered.length} 条监控
          {snapshot.alerts.some((alert) => alert.deduped) ? (
            <span className="ml-2 text-yellow-600">
              · {snapshot.alerts.filter((alert) => alert.deduped).length}条已去重（24h内仅展示最新一次）
            </span>
          ) : null}
        </span>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-lg shadow">
            <p className="text-3xl mb-2">📭</p>
            <p>暂无监控数据</p>
          </div>
        ) : (
          filtered.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-lg shadow overflow-hidden border-l-4 ${
                alert.severity === 'high'
                  ? 'border-red-500'
                  : alert.severity === 'medium'
                    ? 'border-yellow-500'
                    : 'border-green-500'
              } ${alert.deduped ? 'opacity-60' : ''}`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>{TYPE_ICONS[alert.type]}</span>
                    <span className="font-medium text-sm">{alert.storeName}</span>
                    <span className="text-xs text-gray-400">{alert.city}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs ${
                        alert.severity === 'high'
                          ? 'bg-red-100 text-red-700'
                          : alert.severity === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {SEV_LEVELS[alert.severity]}
                    </span>
                    {alert.deduped ? (
                      <span className="text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">⏱ 已去重</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{formatTime(alert.detectedAt)}</span>
                    <span>{expandedId === alert.id ? '▲' : '▼'}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-1">{alert.description}</p>
              </button>
              {expandedId === alert.id ? (
                <div className="px-4 pb-3 bg-gray-50">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-blue-600 mt-0.5">💡</span>
                    <div>
                      <p className="font-medium text-sm">AI解决建议</p>
                      <p className="text-gray-600">{alert.recommendedAction}</p>
                    </div>
                  </div>
                  {alert.scanMode ? (
                    <p className="text-xs text-gray-400 mt-1">扫描模式: {alert.scanMode === 'full' ? '全量' : '增量'}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
