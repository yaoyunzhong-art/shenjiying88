'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ShopInventorySnapshot, ShopInventoryStatus } from './shop-inventory-data'

const STATUS_LABELS: Record<ShopInventoryStatus, string> = {
  healthy: '库存健康',
  low: '低库存',
  out: '已缺货',
}

export default function ShopInventoryClient({
  snapshot,
}: {
  snapshot: ShopInventorySnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ShopInventoryStatus | 'all'>('all')
  const [items, setItems] = useState(snapshot.items)

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (!keyword) return true
      return [item.sku, item.name, item.category].some((field) => field.toLowerCase().includes(keyword))
    })
  }, [items, search, statusFilter])

  const handleRestock = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              availableQty: item.availableQty + 20,
              status: item.availableQty + 20 <= item.threshold ? 'low' : 'healthy',
            }
          : item
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">店铺库存</h1>
          <p className="mt-1 text-sm text-slate-500">客户端负责搜索、状态筛选与补货演示。</p>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新快照'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="SKU 总数" value={items.length.toString()} />
        <MetricCard label="低库存" value={items.filter((item) => item.status === 'low').length.toString()} />
        <MetricCard label="已缺货" value={items.filter((item) => item.status === 'out').length.toString()} />
        <MetricCard label="来源模式" value={snapshot.deliveryMode} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索 SKU / 商品 / 分类"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {(['all', 'healthy', 'low', 'out'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatusFilter(item)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  statusFilter === item
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-600'
                }`}
              >
                {item === 'all' ? '全部状态' : STATUS_LABELS[item]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">商品</th>
              <th className="px-4 py-3">分类</th>
              <th className="px-4 py-3">可用库存</th>
              <th className="px-4 py-3">阈值</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-4">
                  <div className="font-medium text-slate-900">{item.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.sku}</div>
                </td>
                <td className="px-4 py-4 text-slate-600">{item.category}</td>
                <td className="px-4 py-4 text-slate-600">{item.availableQty}</td>
                <td className="px-4 py-4 text-slate-600">{item.threshold}</td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {STATUS_LABELS[item.status]}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => handleRestock(item.id)}
                    className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-600"
                  >
                    补货 +20
                  </button>
                </td>
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
