'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useCallback, useMemo, useState, useTransition } from 'react'

import type { SitemapSnapshotDelivery } from './sitemap-data'

const FREQ_COLORS: Record<string, string> = {
  daily: 'bg-green-100 text-green-800',
  weekly: 'bg-blue-100 text-blue-800',
  monthly: 'bg-slate-100 text-slate-700',
}

export default function SitemapClient({
  snapshot,
}: {
  snapshot: SitemapSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [freqFilter, setFreqFilter] = useState<'ALL' | 'daily' | 'weekly' | 'monthly'>('ALL')

  const filtered = useMemo(() => {
    if (freqFilter === 'ALL') return snapshot.rows
    return snapshot.rows.filter((row) => row.changefreq === freqFilter)
  }, [freqFilter, snapshot.rows])

  const refreshSnapshot = useCallback(() => { handleRefresh() }, [handleRefresh])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Sitemap 管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            tenant {snapshot.tenantId} / 共 {snapshot.totalRows} 条站点路径快照 / generatedAt{' '}
            {snapshot.generatedAt}
          </p>
        </div>
        <button
          type="button"
          onClick={refreshSnapshot}
          disabled={isRefreshing}
          className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">全部条目</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{snapshot.totalRows}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">每日更新</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{snapshot.dailyCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">每周更新</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{snapshot.weeklyCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">每月更新</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{snapshot.monthlyCount}</div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap gap-2">
          {['ALL', 'daily', 'weekly', 'monthly'].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFreqFilter(value as 'ALL' | 'daily' | 'weekly' | 'monthly')}
              className={`rounded px-3 py-1 text-sm ${
                freqFilter === value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {value === 'ALL' ? '全部' : value === 'daily' ? '每日' : value === 'weekly' ? '每周' : '每月'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">路径</th>
              <th className="px-3 py-2 text-left">更新频率</th>
              <th className="px-3 py-2 text-left">优先级</th>
              <th className="px-3 py-2 text-left">最后修改</th>
              <th className="px-3 py-2 text-left">归档分组</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-slate-200 hover:bg-slate-50">
                <td className="px-3 py-2 font-mono text-xs">{row.path}</td>
                <td className="px-3 py-2">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs ${FREQ_COLORS[row.changefreq]}`}>
                    {row.changefreq}
                  </span>
                </td>
                <td className="px-3 py-2">{row.priority.toFixed(1)}</td>
                <td className="px-3 py-2 text-xs">{row.lastmod}</td>
                <td className="px-3 py-2">{row.bucket}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
