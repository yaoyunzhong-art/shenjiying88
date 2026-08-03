'use client'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import type {
  DevToolCategory,
  DevToolEntry,
  DevToolsSnapshotDelivery,
} from './dev-tools-data'

function buildCategoryCounts(entries: DevToolEntry[]) {
  return {
    total: entries.length,
    brand: entries.filter((entry) => entry.category === 'brand').length,
    deploy: entries.filter((entry) => entry.category === 'deploy').length,
    platform: entries.filter((entry) => entry.category === 'platform').length,
  }
}

function filterEntries(entries: DevToolEntry[], query: string, category: DevToolCategory | 'all') {
  const normalized = query.trim().toLowerCase()
  return entries.filter((entry) => {
    if (category !== 'all' && entry.category !== category) {
      return false
    }
    if (!normalized) {
      return true
    }
    return (
      entry.label.toLowerCase().includes(normalized) ||
      entry.description.toLowerCase().includes(normalized) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(normalized))
    )
  })
}

export default function DevToolsClient({
  snapshot,
}: {
  snapshot: DevToolsSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<DevToolCategory | 'all'>('all')

  const counts = useMemo(() => buildCategoryCounts(snapshot.entries), [snapshot.entries])
  const filteredEntries = useMemo(
    () => filterEntries(snapshot.entries, searchQuery, categoryFilter),
    [snapshot.entries, searchQuery, categoryFilter],
  )

  const categories = [
    { key: 'all' as const, label: '全部', count: counts.total },
    { key: 'brand' as const, label: '品牌运营', count: counts.brand },
    { key: 'deploy' as const, label: '部署管理', count: counts.deploy },
    { key: 'platform' as const, label: '开放平台', count: counts.platform },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">开发工具</h1>
          <p className="mt-1 text-sm text-slate-500">品牌运营、部署管理、开放平台的统一快照入口。</p>
        </div>
        <button
          type="button"
          onClick={() => handleRefresh()}
          disabled={isRefreshing}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="text-xs text-blue-700">工具总数</div>
          <div className="mt-2 text-2xl font-semibold text-blue-900">{counts.total}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs text-emerald-700">品牌运营</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-900">{counts.brand}</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs text-amber-700">部署管理</div>
          <div className="mt-2 text-2xl font-semibold text-amber-900">{counts.deploy}</div>
        </div>
        <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-50 p-4">
          <div className="text-xs text-fuchsia-700">开放平台</div>
          <div className="mt-2 text-2xl font-semibold text-fuchsia-900">{counts.platform}</div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="搜索工具名称、描述、标签..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm md:max-w-md"
          />
          <div className="text-sm text-slate-500">
            {filteredEntries.length} / {snapshot.entries.length} 个工具
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => {
            const active = categoryFilter === category.key
            return (
              <button
                key={category.key}
                type="button"
                onClick={() => setCategoryFilter(category.key)}
                className={active ? 'rounded-full bg-slate-900 px-4 py-2 text-sm text-white' : 'rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700'}
              >
                {category.label} {category.count}
              </button>
            )
          })}
        </div>

        {filteredEntries.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            没有匹配的开发工具。
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {filteredEntries.map((entry) => (
              <a
                key={entry.id}
                href={entry.href}
                className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
                  {entry.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900">{entry.label}</div>
                  <div className="mt-1 text-sm text-slate-600">{entry.description}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-white px-2 py-1 text-xs text-slate-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
          <h2 className="text-base font-semibold text-slate-900">最近动态</h2>
          <div className="mt-4 space-y-3">
            {snapshot.recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 text-sm last:border-b-0 last:pb-0">
                <div>
                  <div className="font-medium text-slate-900">{activity.action}</div>
                  <div className="text-slate-500">{activity.target}</div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>{activity.timestamp}</div>
                  <div>{activity.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">环境概览</h2>
            <div className="mt-4 space-y-3">
              {snapshot.environments.map((environment) => (
                <div key={environment.name} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <div className="font-medium text-slate-900">{environment.name}</div>
                  <div className="mt-1 text-slate-500">{environment.status} · {environment.version}</div>
                  <div className="text-xs text-slate-400">updatedAt: {environment.updatedAt}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">系统状态</h2>
            <div className="mt-4 space-y-2">
              {snapshot.services.map((service) => (
                <div key={service.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-700">{service.name}</span>
                  <span className="text-slate-500">{service.status} · {service.latency}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
