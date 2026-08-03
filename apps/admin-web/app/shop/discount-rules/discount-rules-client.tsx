'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import type { DiscountRuleStatus, DiscountRulesSnapshot } from './discount-rules-data'

const STATUS_LABELS: Record<DiscountRuleStatus, string> = {
  active: '生效中',
  scheduled: '待生效',
  inactive: '已停用',
  expired: '已过期',
}

export default function DiscountRulesClient({
  snapshot,
}: {
  snapshot: DiscountRulesSnapshot
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<DiscountRuleStatus | 'all'>('all')

  const filteredRules = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return snapshot.rules.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (!keyword) return true
      return [item.name, item.scope, item.benefitLabel].some((field) =>
        field.toLowerCase().includes(keyword)
      )
    })
  }, [search, snapshot.rules, statusFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">折扣规则</h1>
          <p className="mt-1 text-sm text-slate-500">客户端负责筛选、搜索与使用进度渲染。</p>
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
        <MetricCard label="规则总数" value={snapshot.rules.length.toString()} />
        <MetricCard
          label="生效中"
          value={snapshot.rules.filter((item) => item.status === 'active').length.toString()}
        />
        <MetricCard
          label="累计触达"
          value={snapshot.rules.reduce((total, item) => total + item.usageCount, 0).toString()}
        />
        <MetricCard label="来源模式" value={snapshot.deliveryMode} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索规则名称 / 范围 / 优惠说明"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'scheduled', 'inactive', 'expired'] as const).map((item) => (
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
              <th className="px-4 py-3">规则</th>
              <th className="px-4 py-3">适用范围</th>
              <th className="px-4 py-3">优惠说明</th>
              <th className="px-4 py-3">使用进度</th>
              <th className="px-4 py-3">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRules.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-4">
                  <div className="font-medium text-slate-900">{item.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.id}</div>
                </td>
                <td className="px-4 py-4 text-slate-600">{item.scope}</td>
                <td className="px-4 py-4 text-slate-600">{item.benefitLabel}</td>
                <td className="px-4 py-4 text-slate-600">
                  {item.usageCount} / {item.quota}
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {STATUS_LABELS[item.status]}
                  </span>
                  <div className="mt-1 text-xs text-slate-400">
                    {item.startsAt} - {item.endsAt}
                  </div>
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
