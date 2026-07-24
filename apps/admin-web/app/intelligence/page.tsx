'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AdminPermissionGate } from '../components/admin-permission-gate'

interface KpiData {
  monitoredCities: number
  totalAlerts: number
  highSeverityAlerts: number
  totalSuggestions: number
  knowledgeCards: number
  lastScanTime: string
}

const DEFAULT_KPI: KpiData = {
  monitoredCities: 12,
  totalAlerts: 0,
  highSeverityAlerts: 0,
  totalSuggestions: 63,
  knowledgeCards: 248,
  lastScanTime: '--',
}

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '情报总览访问受限',
  description:
    '情报总览页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看监控 KPI、告警入口与运营决策导航。',
} as const

export default function IntelligencePage() {
  const [kpi, setKpi] = useState<KpiData>(DEFAULT_KPI)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchKpi = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/intelligence/monitor/summary')
      if (!res.ok) throw new Error('API不可用')
      const data = await res.json()
      if (data.alerts) {
        setKpi(prev => ({
          ...prev,
          totalAlerts: data.alerts.length,
          highSeverityAlerts: data.alerts.filter((a: any) => a.severity === 'high').length,
          lastScanTime: data.scanTimestamp
            ? new Date(data.scanTimestamp).toLocaleString('zh-CN')
            : '--',
        }))
      }
    } catch {
      setError('监控API暂不可用，展示默认数据')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchKpi() }, [fetchKpi])

  /** KPI卡片组件 */
  function KpiCard({ label, value, unit, color, icon }: {
    label: string; value: number | string; unit?: string; color: string; icon: string
  }) {
    return (
      <div className={`bg-white rounded-lg shadow p-5 border-l-4 ${color}`}>
        <div className="flex items-center justify-between">
          <span className="text-3xl">{icon}</span>
          <span className="text-2xl font-bold">
            {value}{unit && <span className="text-sm text-gray-400 ml-1">{unit}</span>}
          </span>
        </div>
        <p className="text-gray-500 text-sm mt-1">{label}</p>
      </div>
    )
  }

  return (
    <AdminPermissionGate {...permissionGate}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">🤖 运营参谋</h1>
            <p className="text-gray-500 text-sm mt-1">基于侦察兵全国竞品数据库的AI运营决策系统</p>
          </div>
          <button
            onClick={fetchKpi}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50"
          >
            {loading ? '刷新中…' : '🔄 刷新'}
          </button>
        </div>

        {/* 提示 */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-700">
            {error}
          </div>
        )}

        {/* KPI 卡片区 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <KpiCard label="监控城市" value={kpi.monitoredCities} unit="城" color="border-blue-500" icon="🏙️" />
          <KpiCard
            label="最新告警" value={kpi.totalAlerts}
            color={kpi.highSeverityAlerts > 0 ? 'border-red-500' : 'border-gray-300'}
            icon={kpi.highSeverityAlerts > 0 ? '🚨' : '✅'}
          />
          <KpiCard label="高优先级" value={kpi.highSeverityAlerts} color="border-red-400" icon="🔴" />
          <KpiCard label="AI建议数" value={kpi.totalSuggestions} color="border-green-500" icon="💡" />
          <KpiCard label="知识卡片" value={kpi.knowledgeCards} unit="条" color="border-purple-500" icon="📚" />
          <KpiCard label="最近扫描" value={kpi.lastScanTime !== '--' ? kpi.lastScanTime : '从未'} color="border-gray-400" icon="🕐" />
        </div>

        {/* 入口卡片列 */}
        <h2 className="text-lg font-bold mb-4">功能入口</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              href: '/intelligence/feasibility',
              icon: '📊',
              title: '开业可行性报告',
              desc: '竞品数据+商圈分析+设备配置建议',
              color: 'border-blue-500',
              badge: '推荐',
            },
            {
              href: '/intelligence/operations',
              icon: '💡',
              title: '运营参谋 (AI选择题)',
              desc: '定价策略·活动方案·设备更新·促销应对',
              color: 'border-green-500',
              badge: null,
            },
            {
              href: '/intelligence/monitor',
              icon: '👀',
              title: '竞争监控',
              desc: '价格调整·新活动·优惠变化·评分异动',
              color: 'border-red-500',
              badge: kpi.highSeverityAlerts > 0 ? `${kpi.highSeverityAlerts}条新告警` : null,
            },
            {
              href: '/intelligence/feasibility?tab=finance',
              icon: '💰',
              title: '财务全景表',
              desc: '首期投入+月成本+营收预估+回收期',
              color: 'border-yellow-500',
              badge: null,
            },
          ].map(card => (
            <Link
              key={card.href}
              href={card.href}
              className="block bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow border-l-4 relative"
              style={{ borderLeftColor: card.color.replace('border-', '').replace('-500', '') === 'blue' ? '#3b82f6' : card.color.includes('red') ? '#ef4444' : card.color.includes('green') ? '#22c55e' : '#eab308' }}
            >
              {card.badge && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {card.badge}
                </span>
              )}
              <div className="flex items-start gap-3">
                <span className="text-2xl">{card.icon}</span>
                <div>
                  <h3 className="font-bold text-base">{card.title}</h3>
                  <p className="text-gray-500 text-xs mt-1">{card.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 快速操作区 */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
          <h3 className="font-bold text-blue-800 mb-3">⚡ 快速操作</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/intelligence/feasibility" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              评估新店
            </Link>
            <Link href="/intelligence/operations" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
              获取AI建议
            </Link>
            <Link href="/intelligence/monitor" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
              查看监控
            </Link>
          </div>
        </div>
      </div>
    </AdminPermissionGate>
  )
}
