'use client'

import { useCallback, useMemo, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { PnLLineItem, PeriodKey, ProfitLossSnapshotDelivery } from './profit-loss-data'

const PERIOD_OPTIONS: Array<{ key: PeriodKey; label: string }> = [
  { key: 'thisMonth', label: '本月' },
  { key: 'lastMonth', label: '上月' },
  { key: 'quarter', label: '本季度' },
  { key: 'year', label: '本年' },
]

function fmtCents(cents: number): string {
  const abs = Math.abs(cents)
  const sign = cents < 0 ? '-' : ''
  return `${sign}¥${(abs / 100).toFixed(2)}`
}

function fmtShort(cents: number): string {
  const abs = Math.abs(cents)
  const sign = cents < 0 ? '-' : ''
  if (abs >= 100000000) return `${sign}¥${(abs / 100000000).toFixed(2)}亿`
  if (abs >= 10000) return `${sign}¥${(abs / 10000).toFixed(1)}万`
  return fmtCents(cents)
}

function categoryBg(category: string): string {
  const map: Record<string, string> = {
    revenue: 'bg-green-50',
    cost: 'bg-red-50',
    expense: 'bg-yellow-50',
    profit: 'bg-blue-50',
  }
  return map[category] ?? 'bg-gray-50'
}

function percentChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+∞' : '0'
  const pct = ((current - previous) / Math.abs(previous)) * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

function budgetPct(actual: number, budget: number): string {
  if (budget === 0) return '-'
  return `${((actual / budget) * 100).toFixed(1)}%`
}

function totalFor(
  items: PnLLineItem[],
  field: 'thisMonthCents' | 'lastMonthCents' | 'budgetCents'
): number {
  return items.reduce(
    (sum, item) => sum + item[field] + (item.children ? totalFor(item.children, field) : 0),
    0
  )
}

function PnLRow({ item, depth = 0 }: { item: PnLLineItem; depth?: number }) {
  const isTotal = depth === 0
  const isProfit = item.category === 'profit'

  return (
    <>
      <tr className={`${categoryBg(item.category)} ${isTotal ? 'font-semibold' : ''}`}>
        <td
          className={`px-4 py-3 text-sm ${isTotal ? 'text-gray-900' : 'text-gray-600'}`}
          style={{ paddingLeft: `${16 + depth * 24}px` }}
        >
          {item.label}
        </td>
        <td className="px-4 py-3 text-right font-mono text-sm">{fmtShort(item.thisMonthCents)}</td>
        <td className="px-4 py-3 text-right font-mono text-sm text-gray-500">
          {fmtShort(item.lastMonthCents)}
        </td>
        <td className="px-4 py-3 text-right font-mono text-sm text-gray-500">{fmtShort(item.budgetCents)}</td>
        <td
          className={`px-4 py-3 text-right text-sm ${
            isProfit ? 'font-bold' : ''
          } ${item.thisMonthCents >= item.lastMonthCents ? 'text-green-600' : 'text-red-600'}`}
        >
          {percentChange(item.thisMonthCents, item.lastMonthCents)}
        </td>
        <td className="px-4 py-3 text-right text-sm text-gray-500">
          {budgetPct(item.thisMonthCents, item.budgetCents)}
        </td>
      </tr>
      {item.children?.map((child) => (
        <PnLRow key={`${item.label}-${child.label}`} item={child} depth={depth + 1} />
      ))}
    </>
  )
}

export default function ProfitLossClient({
  snapshot,
}: {
  snapshot: ProfitLossSnapshotDelivery
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isRefreshing, startRefresh] = useTransition()
  const report = snapshot.report

  const handlePeriodChange = useCallback(
    (period: PeriodKey) => {
      startRefresh(() => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('period', period)
        router.replace(`${pathname}?${params.toString()}`)
      })
    },
    [pathname, router, searchParams, startRefresh]
  )

  const sortedItems = useMemo(() => {
    const order: Record<string, number> = { revenue: 0, cost: 1, expense: 2, profit: 3 }
    return [...report.items].sort((left, right) => (order[left.category] ?? 9) - (order[right.category] ?? 9))
  }, [report.items])

  const totalRevenue = useMemo(
    () => totalFor(report.items.filter((item) => item.category === 'revenue'), 'thisMonthCents'),
    [report.items]
  )
  const totalCost = useMemo(
    () => totalFor(report.items.filter((item) => item.category === 'cost'), 'thisMonthCents'),
    [report.items]
  )
  const totalExpense = useMemo(
    () => totalFor(report.items.filter((item) => item.category === 'expense'), 'thisMonthCents'),
    [report.items]
  )
  const netProfit = totalRevenue - totalCost - totalExpense
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0'
  const dataSourceLabel = snapshot.deliveryMode === 'api' ? '真实 API' : 'fallback'

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">损益表 (P&amp;L)</h1>
            <p className="mt-1 text-sm text-gray-500">
              {report.periodLabel} · 当前数据源：{dataSourceLabel}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => startRefresh(() => router.refresh())}
              disabled={isRefreshing}
              className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshing ? '刷新中...' : '刷新'}
            </button>
          </div>
        </div>
        <div className="mt-3 flex gap-1" role="tablist" aria-label="周期筛选">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={snapshot.selectedPeriod === option.key}
              data-period-key={option.key}
              disabled={isRefreshing}
              onClick={() => handlePeriodChange(option.key)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                snapshot.selectedPeriod === option.key
                  ? 'bg-blue-600 font-medium text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          snapshot.deliveryMode === 'api'
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-yellow-200 bg-yellow-50 text-yellow-700'
        }`}
      >
        {`deliveryMode: ${snapshot.deliveryMode} · dataSourceLabel: ${dataSourceLabel}`}
        {snapshot.error ? ' · 该页面当前不可作为闭环复签证据' : ''}
      </div>

      {snapshot.error && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-sm text-yellow-800">{snapshot.error}</p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">总收入</p>
          <p className="mt-1 text-2xl font-bold text-green-800">{fmtShort(totalRevenue)}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">总成本+费用</p>
          <p className="mt-1 text-2xl font-bold text-red-800">{fmtShort(totalCost + totalExpense)}</p>
        </div>
        <div
          className={
            netProfit >= 0
              ? 'rounded-lg border border-blue-200 bg-blue-50 p-4'
              : 'rounded-lg border border-red-200 bg-red-50 p-4'
          }
        >
          <p className="text-sm text-blue-700">净利润</p>
          <p className={`mt-1 text-2xl font-bold ${netProfit >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
            {fmtShort(netProfit)}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">净利率</p>
          <p className="mt-1 text-2xl font-bold">{profitMargin}%</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                科目
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                本月
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                上月
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                预算
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                环比
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                预算达成
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedItems.map((item) => (
              <PnLRow key={item.label} item={item} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-right text-xs text-gray-400">
        生成时间: {new Date(report.generatedAt).toLocaleString('zh-CN')}
      </p>
    </div>
  )
}
