'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import type { ShopAnalyticsSnapshot } from './analytics-data'

function formatMoney(cents: number): string {
  return `¥${(cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 0 })}`
}

export default function AnalyticsClient({
  snapshot,
}: {
  snapshot: ShopAnalyticsSnapshot
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [range, setRange] = useState<'7d' | '14d'>('7d')

  const visibleTrends = useMemo(() => {
    return range === '7d' ? snapshot.trends.slice(-7) : snapshot.trends
  }, [range, snapshot.trends])

  const visibleRevenue = useMemo(() => {
    return visibleTrends.reduce((total, item) => total + item.revenueCents, 0)
  }, [visibleTrends])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">店铺数据分析</h1>
          <p className="mt-1 text-sm text-slate-500">
            首屏由服务端快照提供，客户端负责时间范围切换与经营排行榜渲染。
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleRefresh()}
          disabled={isRefreshing}
          className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="累计营收" value={formatMoney(snapshot.summary.revenueCents)} />
        <MetricCard label="累计订单" value={snapshot.summary.orders.toString()} />
        <MetricCard label="累计访客" value={snapshot.summary.visitors.toString()} />
        <MetricCard label="客单价" value={formatMoney(snapshot.summary.avgOrderValueCents)} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">销售趋势</h2>
            <p className="text-sm text-slate-500">当前区间营收 {formatMoney(visibleRevenue)}</p>
          </div>
          <div className="flex gap-2">
            {(['7d', '14d'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRange(item)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  range === item
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-600'
                }`}
              >
                {item === '7d' ? '近 7 天' : '近 14 天'}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {visibleTrends.map((item) => (
            <div key={item.date} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500">{item.date}</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">{formatMoney(item.revenueCents)}</div>
              <div className="mt-1 text-xs text-slate-500">
                订单 {item.orders} · 访客 {item.visitors}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">商品排行</h2>
          <div className="mt-4 space-y-3">
            {snapshot.topProducts.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    #{index + 1} {item.name}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">订单 {item.orders}</div>
                </div>
                <div className="text-sm font-semibold text-slate-900">{formatMoney(item.revenueCents)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">渠道贡献</h2>
          <div className="mt-4 space-y-3">
            {snapshot.channels.map((item) => (
              <div key={item.name} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between text-sm font-medium text-slate-900">
                  <span>{item.name}</span>
                  <span>{item.conversionRate.toFixed(2)}%</span>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  访客 {item.visitors} · 成交 {item.orders}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  )
}
