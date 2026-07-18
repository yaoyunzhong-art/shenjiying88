'use client'

import { useCallback, useEffect, useState } from 'react'

// ─── 类型定义 ──────────────────────────────────────

interface PnLLineItem {
  category: string               // 'revenue' | 'cost' | 'expense' | 'profit'
  label: string
  thisMonthCents: number
  lastMonthCents: number
  budgetCents: number
  children?: PnLLineItem[]
}

interface PnLReport {
  date: string
  periodLabel: string
  items: PnLLineItem[]
  tenantId: string
  generatedAt: string
}

// ── 工具 ──

function fmtCents(cents: number): string {
  const abs = Math.abs(cents)
  const sign = cents < 0 ? '- ' : ''
  return `${sign}¥${(abs / 100).toFixed(2)}`
}

function fmtShort(cents: number): string {
  const abs = Math.abs(cents)
  const sign = cents < 0 ? '-' : ''
  if (abs >= 100000000) return `${sign}¥${(abs / 100000000).toFixed(2)}亿`
  if (abs >= 10000) return `${sign}¥${(abs / 10000).toFixed(1)}万`
  return fmtCents(cents)
}

function categoryLabel(c: string): string {
  const map: Record<string, string> = { revenue: '收入', cost: '成本', expense: '费用', profit: '利润' }
  return map[c] ?? c
}

function categoryBg(c: string): string {
  const map: Record<string, string> = { revenue: 'bg-green-50', cost: 'bg-red-50', expense: 'bg-yellow-50', profit: 'bg-blue-50' }
  return map[c] ?? 'bg-gray-50'
}

function categoryBorder(c: string): string {
  const map: Record<string, string> = { revenue: 'border-green-200', cost: 'border-red-200', expense: 'border-yellow-200', profit: 'border-blue-200' }
  return map[c] ?? 'border-gray-200'
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

function totalFor(items: PnLLineItem[], field: 'thisMonthCents' | 'lastMonthCents' | 'budgetCents'): number {
  return items.reduce((s, i) => s + i[field] + (i.children ? totalFor(i.children, field) : 0), 0)
}

// ── 默认样本数据 ──

const defaultItems: PnLLineItem[] = [
  {
    category: 'revenue', label: '营业收入',
    thisMonthCents: 456000000, lastMonthCents: 412000000, budgetCents: 500000000,
    children: [
      { category: 'revenue', label: '门票收入', thisMonthCents: 128000000, lastMonthCents: 115000000, budgetCents: 140000000 },
      { category: 'revenue', label: '游戏币收入', thisMonthCents: 185000000, lastMonthCents: 168000000, budgetCents: 200000000 },
      { category: 'revenue', label: '餐饮收入', thisMonthCents: 89000000, lastMonthCents: 82000000, budgetCents: 95000000 },
      { category: 'revenue', label: '其他收入', thisMonthCents: 54000000, lastMonthCents: 47000000, budgetCents: 65000000 },
    ],
  },
  {
    category: 'cost', label: '营业成本',
    thisMonthCents: 228000000, lastMonthCents: 206000000, budgetCents: 250000000,
    children: [
      { category: 'cost', label: '设备折旧', thisMonthCents: 45000000, lastMonthCents: 45000000, budgetCents: 45000000 },
      { category: 'cost', label: '游戏币成本', thisMonthCents: 82000000, lastMonthCents: 75000000, budgetCents: 90000000 },
      { category: 'cost', label: '原材料成本', thisMonthCents: 56000000, lastMonthCents: 50000000, budgetCents: 60000000 },
      { category: 'cost', label: '其他成本', thisMonthCents: 45000000, lastMonthCents: 36000000, budgetCents: 55000000 },
    ],
  },
  {
    category: 'expense', label: '运营费用',
    thisMonthCents: 128000000, lastMonthCents: 115000000, budgetCents: 140000000,
    children: [
      { category: 'expense', label: '人工成本', thisMonthCents: 72000000, lastMonthCents: 68000000, budgetCents: 75000000 },
      { category: 'expense', label: '场地租金', thisMonthCents: 35000000, lastMonthCents: 32000000, budgetCents: 35000000 },
      { category: 'expense', label: '水电物业', thisMonthCents: 12000000, lastMonthCents: 10000000, budgetCents: 15000000 },
      { category: 'expense', label: '营销费用', thisMonthCents: 9000000, lastMonthCents: 5000000, budgetCents: 15000000 },
    ],
  },
  {
    category: 'profit', label: '净利润',
    thisMonthCents: 100000000, lastMonthCents: 91000000, budgetCents: 110000000,
    children: [],
  },
]

const defaultReport: PnLReport = {
  date: '2026-07-18',
  periodLabel: '2026年7月 (截至7月18日)',
  items: defaultItems,
  tenantId: 't1',
  generatedAt: '2026-07-18T22:00:00Z',
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'API error')
  return json.data as T
}

// ── 行组件 ──

function PnLRow({ item, depth = 0 }: { item: PnLLineItem; depth?: number }) {
  const isTotal = depth === 0
  const isProfit = item.category === 'profit'

  return (
    <>
      <tr className={`${categoryBg(item.category)} ${isTotal ? 'font-semibold' : ''}`}>
        <td className={`px-4 py-3 text-sm ${isTotal ? 'text-gray-900' : 'text-gray-600'}`} style={{ paddingLeft: `${16 + depth * 24}px` }}>
          {item.label}
        </td>
        <td className="px-4 py-3 text-right font-mono text-sm">{fmtShort(item.thisMonthCents)}</td>
        <td className="px-4 py-3 text-right font-mono text-sm text-gray-500">{fmtShort(item.lastMonthCents)}</td>
        <td className="px-4 py-3 text-right font-mono text-sm text-gray-500">{fmtShort(item.budgetCents)}</td>
        <td className={`px-4 py-3 text-right text-sm ${isProfit ? 'font-bold' : ''} ${
          item.thisMonthCents >= item.lastMonthCents ? 'text-green-600' : 'text-red-600'
        }`}>
          {percentChange(item.thisMonthCents, item.lastMonthCents)}
        </td>
        <td className="px-4 py-3 text-right text-sm text-gray-500">
          {budgetPct(item.thisMonthCents, item.budgetCents)}
        </td>
      </tr>
      {item.children?.map(child => <PnLRow key={child.label} item={child} depth={depth + 1} />)}
    </>
  )
}

// ── 主组件 ──

export default function ProfitLossPage() {
  const [report, setReport] = useState<PnLReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<PnLReport>('/api/finance/pnl')
      setReport(data)
    } catch {
      setReport(defaultReport)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadReport() }, [loadReport])

  const totalRevenue = report ? totalFor(report.items.filter(i => i.category === 'revenue'), 'thisMonthCents') : 0
  const totalCost = report ? totalFor(report.items.filter(i => i.category === 'cost'), 'thisMonthCents') : 0
  const totalExpense = report ? totalFor(report.items.filter(i => i.category === 'expense'), 'thisMonthCents') : 0
  const netProfit = totalRevenue - totalCost - totalExpense
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        <span className="ml-3 text-gray-600">加载损益表...</span>
      </div>
    )
  }

  if (error && !report) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">加载失败</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <button onClick={loadReport} className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">重试</button>
        </div>
      </div>
    )
  }

  if (!report) return null

  // Sort items: revenue first, then cost, then expense, then profit
  const sortedItems = [...report.items].sort((a, b) => {
    const order = { revenue: 0, cost: 1, expense: 2, profit: 3 }
    return (order[a.category] ?? 9) - (order[b.category] ?? 9)
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">损益表 (P&L)</h1>
          <p className="text-sm text-gray-500 mt-1">{report.periodLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadReport} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">刷新</button>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* 关键指标 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">总收入</p>
          <p className="text-2xl font-bold mt-1 text-green-800">{fmtShort(totalRevenue)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">总成本+费用</p>
          <p className="text-2xl font-bold mt-1 text-red-800">{fmtShort(totalCost + totalExpense)}</p>
        </div>
        <div className={netProfit >= 0 ? 'bg-blue-50 border border-blue-200 rounded-lg p-4' : 'bg-red-50 border border-red-200 rounded-lg p-4'}>
          <p className="text-sm text-blue-700">净利润</p>
          <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
            {fmtShort(netProfit)}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">净利率</p>
          <p className="text-2xl font-bold mt-1">{profitMargin}%</p>
        </div>
      </div>

      {/* 损益表 */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">科目</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">本月</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">上月</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">预算</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">环比</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">预算达成</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedItems.map(item => <PnLRow key={item.label} item={item} />)}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 text-right">
        生成时间: {new Date(report.generatedAt).toLocaleString('zh-CN')}
      </p>
    </div>
  )
}
