'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type {
  IntelligenceNavigationCard,
  IntelligenceQuickAction,
  IntelligenceSnapshotDelivery,
  KpiData,
} from './intelligence-data'

function accentBorder(accent: IntelligenceNavigationCard['accent']): string {
  const map: Record<IntelligenceNavigationCard['accent'], string> = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500',
  }

  return map[accent]
}

function quickActionButton(accent: IntelligenceQuickAction['accent']): string {
  const map: Record<IntelligenceQuickAction['accent'], string> = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    red: 'bg-red-600 hover:bg-red-700',
  }

  return map[accent]
}

function KpiCard({
  label,
  value,
  unit,
  borderColor,
  icon,
}: {
  label: string
  value: number | string
  unit?: string
  borderColor: string
  icon: string
}) {
  return (
    <div className={`bg-white rounded-lg shadow p-5 border-l-4 ${borderColor}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-3xl">{icon}</span>
        <span className="text-2xl font-bold text-gray-900 text-right">
          {value}
          {unit ? <span className="text-sm text-gray-400 ml-1">{unit}</span> : null}
        </span>
      </div>
      <p className="text-gray-500 text-sm mt-1">{label}</p>
    </div>
  )
}

function IntelligenceKpiGrid({ kpi }: { kpi: KpiData }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <KpiCard label="监控城市" value={kpi.monitoredCities} unit="城" borderColor="border-blue-500" icon="🏙️" />
      <KpiCard
        label="最新告警"
        value={kpi.totalAlerts}
        borderColor={kpi.highSeverityAlerts > 0 ? 'border-red-500' : 'border-gray-300'}
        icon={kpi.highSeverityAlerts > 0 ? '🚨' : '✅'}
      />
      <KpiCard label="高优先级" value={kpi.highSeverityAlerts} borderColor="border-red-400" icon="🔴" />
      <KpiCard label="AI建议数" value={kpi.totalSuggestions} borderColor="border-green-500" icon="💡" />
      <KpiCard label="知识卡片" value={kpi.knowledgeCards} unit="条" borderColor="border-purple-500" icon="📚" />
      <KpiCard
        label="最近扫描"
        value={kpi.lastScanTime !== '--' ? kpi.lastScanTime : '从未'}
        borderColor="border-gray-400"
        icon="🕐"
      />
    </div>
  )
}

export default function IntelligenceClient({
  snapshot,
}: {
  snapshot: IntelligenceSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">🤖 运营参谋</h1>
          <p className="text-gray-500 text-sm mt-1">基于侦察兵全国竞品数据库的AI运营决策系统</p>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      {snapshot.error ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
          {snapshot.error}
        </div>
      ) : null}

      <IntelligenceKpiGrid kpi={snapshot.kpi} />

      <div>
        <h2 className="text-lg font-bold mb-4">功能入口</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {snapshot.navigationCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={`block bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow border-l-4 relative ${accentBorder(card.accent)}`}
            >
              {card.badge ? (
                <span
                  className={`absolute -top-2 -right-2 text-white text-xs px-2 py-0.5 rounded-full ${
                    card.accent === 'red' ? 'bg-red-500' : 'bg-slate-500'
                  }`}
                >
                  {card.badge}
                </span>
              ) : null}
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
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
        <h3 className="font-bold text-blue-800 mb-3">⚡ 快速操作</h3>
        <div className="flex flex-wrap gap-3">
          {snapshot.quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`px-4 py-2 text-white rounded-lg text-sm ${quickActionButton(action.accent)}`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
