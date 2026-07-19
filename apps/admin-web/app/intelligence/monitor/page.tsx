'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'

interface Alert {
  id: string
  storeName: string; city: string; type: string; severity: string
  description: string; detectedAt: string; recommendedAction: string
  deduped?: boolean; scanMode?: string
}

interface TrendPoint {
  date: string; type: string; count: number
}

interface MonitorSummary {
  alerts: Alert[]
  trend: TrendPoint[]
  scanTimestamp: string
  scanMode: string
  freshnessMinutes: number
}

const TYPE_LABELS: Record<string, string> = {
  price_change: '💰 价格调整', new_activity: '🎉 新活动',
  new_promotion: '🏷️ 新优惠', rating_change: '⭐ 评分变化',
  equipment_change: '🔧 设备异动', policy_change: '📋 政策变更',
}

const TYPE_ICONS: Record<string, string> = {
  price_change: '💰', new_activity: '🎉', new_promotion: '🏷️',
  rating_change: '⭐', equipment_change: '🔧', policy_change: '📋',
}

const SEV_LEVELS: Record<string, string> = {
  high: '🔴 紧急', medium: '🟡 关注', low: '🟢 观察',
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001/api/v1'

export default function MonitorPage() {
  const [summary, setSummary] = useState<MonitorSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [sevFilter, setSevFilter] = useState<string>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // 采集监控数据
  const fetchMonitorData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/intelligence/monitor/summary`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: MonitorSummary = await res.json()
      setSummary(data)
    } catch (err) {
      console.error('[monitor] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMonitorData()
  }, [fetchMonitorData])

  // 自动刷新（每30秒）
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchMonitorData, 30_000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchMonitorData])

  const alerts = useMemo(() => summary?.alerts ?? [], [summary])
  const trend = useMemo(() => summary?.trend ?? [], [summary])

  const filtered = useMemo(() => {
    let items = [...alerts]
    if (typeFilter !== 'ALL') items = items.filter(a => a.type === typeFilter)
    if (sevFilter !== 'ALL') items = items.filter(a => a.severity === sevFilter)
    // 已去重的排在最后
    return items.sort((a, b) => {
      const dedupOrder = (a.deduped ? 1 : 0) - (b.deduped ? 1 : 0)
      if (dedupOrder !== 0) return dedupOrder
      return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
    })
  }, [alerts, typeFilter, sevFilter])

  // 统计
  const stats = useMemo(() => {
    const allTypes = ['price_change', 'new_activity', 'new_promotion', 'rating_change', 'equipment_change', 'policy_change']
    const result: Record<string, number> = {}
    for (const t of allTypes) result[t] = alerts.filter(a => a.type === t && !a.deduped).length
    return result
  }, [alerts])

  const highCount = alerts.filter(a => a.severity === 'high' && !a.deduped).length

  // 新鲜度
  const freshnessText = useMemo(() => {
    if (!summary?.scanTimestamp) return '暂无数据'
    const diff = Date.now() - new Date(summary.scanTimestamp).getTime()
    if (diff < 60000) return '刚刚采集'
    if (diff < 3600000) return `${Math.round(diff / 60000)}分钟前`
    return `${Math.round(diff / 3600000)}小时前`
  }, [summary?.scanTimestamp])

  // 走势图数据按天聚合
  const weeklyTrend = useMemo(() => {
    const days = trend.reduce<Record<string, Record<string, number>>>((acc, tp) => {
      if (!acc[tp.date]) acc[tp.date] = {}
      acc[tp.date][tp.type] = (acc[tp.date][tp.type] ?? 0) + tp.count
      return acc
    }, {})
    return Object.entries(days).sort(([a], [b]) => a.localeCompare(b))
  }, [trend])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">👀 竞争监控</h1>
          {highCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium animate-pulse">
              {highCount}条紧急
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {/* 数据新鲜度指示器 */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            freshnessText === '刚刚采集'
              ? 'bg-green-100 text-green-700'
              : freshnessText.includes('分钟')
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-500'
          }`}>
            🕐 数据采集于{freshnessText}
          </span>
          <span className="text-xs text-gray-400">
            模式: {summary?.scanMode === 'full' ? '全量' : '增量'}
          </span>
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="w-3.5 h-3.5" />
            <span className="text-xs text-gray-400">自动刷新</span>
          </label>
          <button
            onClick={fetchMonitorData}
            disabled={loading}
            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '刷新中...' : '刷新'}
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        {Object.entries(stats).map(([k, v]) => (
          <div key={k} className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-lg">{TYPE_ICONS[k]}</p>
            <p className="text-xs text-gray-500 mt-1">{TYPE_LABELS[k]}</p>
            <p className="text-lg font-bold">{v}</p>
          </div>
        ))}
      </div>

      {/* 周异动走势图 */}
      {weeklyTrend.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-sm font-semibold mb-3">📊 周异动走势</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-1">日期</th>
                  {Object.keys(TYPE_ICONS).map(type => (
                    <th key={type} className="p-1 text-center">{TYPE_ICONS[type]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeklyTrend.map(([date, types]) => (
                  <tr key={date} className="border-t">
                    <td className="p-1 text-gray-500">{date.slice(5)}</td>
                    {Object.keys(TYPE_ICONS).map(type => {
                      const count = types[type] ?? 0
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
                              title={`${TYPE_LABELS[type]}: ${count}次`}
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
      )}

      {/* 筛选 */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border rounded px-2 py-1.5 text-sm">
          <option value="ALL">全部类型</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={sevFilter} onChange={e => setSevFilter(e.target.value)}
          className="border rounded px-2 py-1.5 text-sm">
          <option value="ALL">全部级别</option>
          <option value="high">紧急</option>
          <option value="medium">关注</option>
          <option value="low">观察</option>
        </select>
        <span className="text-xs text-gray-400 self-center">
          共 {filtered.length} 条监控
          {alerts.some(a => a.deduped) && (
            <span className="ml-2 text-yellow-600">
              · {alerts.filter(a => a.deduped).length}条已去重（24h内仅展示最新一次）
            </span>
          )}
        </span>
      </div>

      {/* 告警列表 */}
      <div className="space-y-3">
        {filtered.map((alert, i) => (
          <div key={alert.id ?? i} className={`bg-white rounded-lg shadow overflow-hidden border-l-4 ${alert.severity === 'high' ? 'border-red-500' : alert.severity === 'medium' ? 'border-yellow-500' : 'border-green-500'} ${alert.deduped ? 'opacity-60' : ''}`}>
            <button onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{TYPE_ICONS[alert.type]}</span>
                  <span className="font-medium text-sm">{alert.storeName}</span>
                  <span className="text-xs text-gray-400">{alert.city}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${alert.severity === 'high' ? 'bg-red-100 text-red-700' : alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {SEV_LEVELS[alert.severity]}
                  </span>
                  {alert.deduped && (
                    <span className="text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                      ⏱ 已去重
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{formatTime(alert.detectedAt)}</span>
                  <span>{expandedId === alert.id ? '▲' : '▼'}</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 mt-1">{alert.description}</p>
            </button>
            {expandedId === alert.id && (
              <div className="px-4 pb-3 bg-gray-50">
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-blue-600 mt-0.5">💡</span>
                  <div>
                    <p className="font-medium text-sm">AI解决建议</p>
                    <p className="text-gray-600">{alert.recommendedAction}</p>
                  </div>
                </div>
                {alert.scanMode && (
                  <p className="text-xs text-gray-400 mt-1">
                    扫描模式: {alert.scanMode === 'full' ? '全量' : '增量'}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">📭</p>
          <p>暂无监控数据</p>
        </div>
      )}
    </div>
  )
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = Date.now()
  const diff = now - d.getTime()
  if (diff < 3600000) return `${Math.round(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.round(diff / 3600000)}小时前`
  return `${Math.round(diff / 86400000)}天前`
}
