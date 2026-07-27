'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { FulfillmentSnapshot, FulfillmentStatus } from './fulfillment-data'

const STATUS_ORDER: FulfillmentStatus[] = ['pending', 'picking', 'packed', 'shipped', 'delivered', 'issue']
const STATUS_LABELS: Record<FulfillmentStatus, string> = {
  pending: '待确认',
  picking: '拣货中',
  packed: '已打包',
  shipped: '已发货',
  delivered: '已完成',
  issue: '异常单',
}

function formatMoney(cents: number): string {
  return `¥${(cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}

export default function FulfillmentClient({
  snapshot,
}: {
  snapshot: FulfillmentSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [statusFilter, setStatusFilter] = useState<FulfillmentStatus | 'all'>('all')
  const [orders, setOrders] = useState(snapshot.orders)

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders
    return orders.filter((item) => item.status === statusFilter)
  }, [orders, statusFilter])

  const handleAdvanceStatus = (id: string) => {
    setOrders((current) =>
      current.map((item) => {
        if (item.id !== id || item.status === 'delivered' || item.status === 'issue') return item
        const nextIndex = STATUS_ORDER.indexOf(item.status) + 1
        return { ...item, status: STATUS_ORDER[nextIndex] }
      })
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">履约管理</h1>
          <p className="mt-1 text-sm text-slate-500">客户端负责状态筛选与本地流转演示。</p>
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

      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'picking', 'packed', 'shipped', 'delivered', 'issue'] as const).map((item) => (
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
            {item === 'all' ? '全部履约单' : STATUS_LABELS[item]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="履约单总数" value={orders.length.toString()} />
        <MetricCard label="配送中" value={orders.filter((item) => item.status === 'shipped').length.toString()} />
        <MetricCard label="已完成" value={orders.filter((item) => item.status === 'delivered').length.toString()} />
        <MetricCard label="异常单" value={orders.filter((item) => item.status === 'issue').length.toString()} />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">订单</th>
              <th className="px-4 py-3">会员</th>
              <th className="px-4 py-3">配送方式</th>
              <th className="px-4 py-3">金额</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-4">
                  <div className="font-medium text-slate-900">{item.id}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.createdAt}</div>
                </td>
                <td className="px-4 py-4 text-slate-600">
                  <div>{item.memberName}</div>
                  <div className="mt-1 text-xs text-slate-400">{item.address}</div>
                </td>
                <td className="px-4 py-4 text-slate-600">{item.shippingMethod}</td>
                <td className="px-4 py-4 text-slate-600">{formatMoney(item.amountCents)}</td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {STATUS_LABELS[item.status]}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => handleAdvanceStatus(item.id)}
                    disabled={item.status === 'delivered' || item.status === 'issue'}
                    className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    推进状态
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
