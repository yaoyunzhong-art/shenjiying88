'use client'

import { useState, useMemo } from 'react'

interface Alert {
  storeName: string; city: string; type: string; severity: string
  description: string; detectedAt: string; recommendedAction: string
}

const TYPE_LABELS: Record<string, string> = {
  price_change: '💰 价格调整', new_activity: '🎉 新活动',
  new_promotion: '🏷️ 新优惠', rating_change: '⭐ 评分变化',
}

const TYPE_ICONS: Record<string, string> = {
  price_change: '💰', new_activity: '🎉', new_promotion: '🏷️', rating_change: '⭐',
}

const SEV_LEVELS: Record<string, string> = {
  high: '🔴 紧急', medium: '🟡 关注', low: '🟢 观察',
}

const MOCK_ALERTS: Alert[] = [
  { storeName: '竞品A', city: '上海', type: 'price_change', severity: 'high',
    description: '将周末价格从¥88调整至¥68，降幅22.7%',
    detectedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    recommendedAction: '保持差异化定位，不跟进降价，改为增值服务应对' },
  { storeName: '竞品B', city: '上海', type: 'new_activity', severity: 'medium',
    description: '推出"暑期亲子卡"月卡¥299/10次',
    detectedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    recommendedAction: '评估推出类似亲子套餐，价格对标¥269/10次' },
  { storeName: '竞品C', city: '上海', type: 'new_promotion', severity: 'low',
    description: '抖音推出¥39团购券(原价¥88)，限时3天',
    detectedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    recommendedAction: '不跟风低价团购，加强会员体系粘性' },
  { storeName: '竞品A', city: '上海', type: 'rating_change', severity: 'medium',
    description: '大众点评评分从4.2降至3.8，近期差评增多',
    detectedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    recommendedAction: '抓住机会加强自家评价管理，引导好评' },
  { storeName: '竞品D', city: '北京', type: 'price_change', severity: 'medium',
    description: '新增"早鸟价"¥49(10:00-14:00)',
    detectedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    recommendedAction: '评估是否需要引入分时段定价' },
  { storeName: '竞品E', city: '深圳', type: 'new_activity', severity: 'high',
    description: '推出"暑期电竞比赛"系列活动，首周报名免费',
    detectedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    recommendedAction: '建议尽快筹划暑期主题活动，抓住学生群体' },
]

export default function MonitorPage() {
  const [alerts] = useState(MOCK_ALERTS)
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [sevFilter, setSevFilter] = useState<string>('ALL')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const filtered = useMemo(() => {
    let items = [...alerts]
    if (typeFilter !== 'ALL') items = items.filter(a => a.type === typeFilter)
    if (sevFilter !== 'ALL') items = items.filter(a => a.severity === sevFilter)
    return items.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
  }, [alerts, typeFilter, sevFilter])

  const highCount = alerts.filter(a => a.severity === 'high').length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">👀 竞争监控</h1>
        {highCount > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium animate-pulse">{highCount}条紧急</span>}
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Object.entries({ price_change: alerts.filter(a => a.type === 'price_change').length,
          new_activity: alerts.filter(a => a.type === 'new_activity').length,
          new_promotion: alerts.filter(a => a.type === 'new_promotion').length,
          rating_change: alerts.filter(a => a.type === 'rating_change').length,
        }).map(([k, v]) => (
          <div key={k} className="bg-white rounded-lg shadow p-3 text-center">
            <p className="text-lg">{TYPE_ICONS[k]}</p>
            <p className="text-xs text-gray-500 mt-1">{TYPE_LABELS[k]}</p>
            <p className="text-lg font-bold">{v}</p>
          </div>
        ))}
      </div>

      {/* 筛选 */}
      <div className="flex gap-2 mb-4 flex-wrap">
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
        <span className="text-xs text-gray-400 self-center">共 {filtered.length} 条监控</span>
      </div>

      {/* 告警列表 */}
      <div className="space-y-3">
        {filtered.map((alert, i) => (
          <div key={i} className={`bg-white rounded-lg shadow overflow-hidden border-l-4 ${alert.severity === 'high' ? 'border-red-500' : alert.severity === 'medium' ? 'border-yellow-500' : 'border-green-500'}`}>
            <button onClick={() => setExpandedId(expandedId === i ? null : i)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{TYPE_ICONS[alert.type]}</span>
                  <span className="font-medium text-sm">{alert.storeName}</span>
                  <span className="text-xs text-gray-400">{alert.city}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${alert.severity === 'high' ? 'bg-red-100 text-red-700' : alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {SEV_LEVELS[alert.severity]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{formatTime(alert.detectedAt)}</span>
                  <span>{expandedId === i ? '▲' : '▼'}</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 mt-1">{alert.description}</p>
            </button>
            {expandedId === i && (
              <div className="px-4 pb-3 bg-gray-50">
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-blue-600 mt-0.5">💡</span>
                  <div>
                    <p className="font-medium text-sm">AI解决建议</p>
                    <p className="text-gray-600">{alert.recommendedAction}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
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
