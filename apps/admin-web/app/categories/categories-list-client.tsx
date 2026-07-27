'use client'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { computeCategoryStats, type CategoryItem } from '../categories-data'
import type { CategoriesListSnapshot } from './categories-list-data'
import { useRouter } from 'next/navigation'

export default function CategoriesListClient({
  snapshot,
}: {
  snapshot: CategoriesListSnapshot
}) {
  const router = useRouter()
  const { isRefreshing, handleRefresh } = useSnapshotRefresh()
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<'all' | 'root' | 'leaf'>('all')

  const stats = useMemo(() => computeCategoryStats(snapshot.items), [snapshot.items])

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return snapshot.items.filter((item) => {
      if (scope === 'root' && item.parentName) return false
      if (scope === 'leaf' && !item.parentName) return false
      if (!keyword) return true
      return [item.name, item.code, item.parentName ?? ''].some((field) =>
        field.toLowerCase().includes(keyword)
      )
    })
  }, [scope, search, snapshot.items])

  const openDetail = (item: CategoryItem) => router.push(`/categories/${item.id}`)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">分类管理</h1>
          <p className="mt-1 text-sm text-slate-500">客户端负责搜索、层级筛选与跳转。</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleRefresh()}
            disabled={isRefreshing}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
          <Link href="/categories/new" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
            新建分类
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="分类总数" value={stats.total.toString()} />
        <MetricCard label="一级分类" value={stats.rootCount.toString()} />
        <MetricCard label="启用中" value={stats.active.toString()} />
        <MetricCard label="关联商品" value={stats.totalProducts.toString()} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索分类名称 / 编码 / 上级分类"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {(['all', 'root', 'leaf'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setScope(item)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  scope === item
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-600'
                }`}
              >
                {item === 'all' ? '全部分类' : item === 'root' ? '一级分类' : '子分类'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">名称</th>
              <th className="px-4 py-3">编码</th>
              <th className="px-4 py-3">上级分类</th>
              <th className="px-4 py-3">商品数</th>
              <th className="px-4 py-3">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map((item) => (
              <tr key={item.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openDetail(item)}>
                <td className="px-4 py-4 font-medium text-slate-900">{item.name}</td>
                <td className="px-4 py-4 text-slate-600">{item.code}</td>
                <td className="px-4 py-4 text-slate-600">{item.parentName ?? '—'}</td>
                <td className="px-4 py-4 text-slate-600">{item.productCount}</td>
                <td className="px-4 py-4 text-slate-600">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
