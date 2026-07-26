'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminDashboardSnapshotDelivery } from './dashboard-data'

type DashboardTab = 'overview' | 'trend' | 'distribution'

function formatMoney(value: number) {
  return `¥${value.toLocaleString()}`
}

export default function AdminDashboardClient({
  snapshot,
}: {
  snapshot: AdminDashboardSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')

  const totals = useMemo(() => {
    const regionTotal = snapshot.regionStats.reduce((sum, item) => sum + item.count, 0)
    const newTenantTotal = snapshot.newTenantTrend.reduce((sum, item) => sum + item.count, 0)
    return { regionTotal, newTenantTotal }
  }, [snapshot.newTenantTrend, snapshot.regionStats])

  const maxRevenue = Math.max(...snapshot.revenueTrend.map((item) => item.revenue))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">全局分析仪表盘</h1>
          <p className="mt-1 text-sm text-slate-500">总部运营看板，本轮仍为本地快照样本。</p>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">总租户数</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{snapshot.overview.totalTenants}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">总门店数</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{snapshot.overview.totalStores}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">总收入</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatMoney(snapshot.overview.totalRevenue)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">活跃用户</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{snapshot.overview.activeUsers}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'overview' as const, label: '总览' },
          { key: 'trend' as const, label: '趋势详情' },
          { key: 'distribution' as const, label: '分布' },
        ].map((tab) => {
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={active ? 'rounded-full bg-slate-900 px-4 py-2 text-sm text-white' : 'rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700'}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="grid gap-4 xl:grid-cols-[1.4fr,1fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">收入趋势</h2>
            <div className="mt-4 grid grid-cols-7 items-end gap-3">
              {snapshot.revenueTrend.map((item) => (
                <div key={item.day} className="text-center">
                  <div className="flex h-36 items-end justify-center">
                    <div
                      className="w-full rounded-t-md bg-emerald-500"
                      style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-slate-500">{item.day}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">系统告警</h2>
            <div className="mt-4 space-y-3">
              {snapshot.alerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-900">{alert.source}</span>
                    <span className="text-xs text-slate-500">{alert.severity}</span>
                  </div>
                  <div className="mt-1 text-sm text-slate-600">{alert.message}</div>
                  <div className="mt-2 text-xs text-slate-400">{alert.time} · {alert.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trend' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">近 30 日营收</h2>
            <div className="mt-4 space-y-3">
              {snapshot.revenueTrend.map((item) => (
                <div key={item.day} className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm last:border-b-0 last:pb-0">
                  <span className="text-slate-500">{item.day}</span>
                  <span className="font-medium text-slate-900">{formatMoney(item.revenue)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">新增租户</h2>
            <div className="mt-4 space-y-3">
              {snapshot.newTenantTrend.map((item) => (
                <div key={item.month} className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm last:border-b-0 last:pb-0">
                  <span className="text-slate-500">{item.month}</span>
                  <span className="font-medium text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-slate-400">累计新增租户 {totals.newTenantTotal}</div>
          </div>
        </div>
      )}

      {activeTab === 'distribution' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">区域分布</h2>
          <div className="mt-4 space-y-3">
            {snapshot.regionStats.map((item) => (
              <div key={item.region}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-700">{item.region}</span>
                  <span className="text-slate-500">{item.count} 家 · {item.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-violet-500" style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-slate-400">区域门店合计 {totals.regionTotal}</div>
        </div>
      )}
    </div>
  )
}
