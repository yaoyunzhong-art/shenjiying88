'use client'

import React, { useCallback, useEffect, useState } from 'react'

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

// ── 周期类型 ──

type PeriodKey = 'thisMonth' | 'lastMonth' | 'quarter' | 'year'

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: 'thisMonth', label: '本月' },
  { key: 'lastMonth', label: '上月' },
  { key: 'quarter', label: '本季度' },
  { key: 'year', label: '本年' },
]

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

// ── 多周期样本数据 ──

type PeriodDataMap = Record<PeriodKey, { items: PnLLineItem[]; periodLabel: string }>

const periodDataMap: PeriodDataMap = {
  thisMonth: {
    periodLabel: '2026年7月 (截至7月18日)',
    items: [
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
    ],
  },
  lastMonth: {
    periodLabel: '2026年6月',
    items: [
      {
        category: 'revenue', label: '营业收入',
        thisMonthCents: 412000000, lastMonthCents: 380000000, budgetCents: 450000000,
        children: [
          { category: 'revenue', label: '门票收入', thisMonthCents: 115000000, lastMonthCents: 105000000, budgetCents: 130000000 },
          { category: 'revenue', label: '游戏币收入', thisMonthCents: 168000000, lastMonthCents: 155000000, budgetCents: 180000000 },
          { category: 'revenue', label: '餐饮收入', thisMonthCents: 82000000, lastMonthCents: 75000000, budgetCents: 90000000 },
          { category: 'revenue', label: '其他收入', thisMonthCents: 47000000, lastMonthCents: 45000000, budgetCents: 50000000 },
        ],
      },
      {
        category: 'cost', label: '营业成本',
        thisMonthCents: 206000000, lastMonthCents: 190000000, budgetCents: 220000000,
        children: [
          { category: 'cost', label: '设备折旧', thisMonthCents: 45000000, lastMonthCents: 45000000, budgetCents: 45000000 },
          { category: 'cost', label: '游戏币成本', thisMonthCents: 75000000, lastMonthCents: 70000000, budgetCents: 80000000 },
          { category: 'cost', label: '原材料成本', thisMonthCents: 50000000, lastMonthCents: 45000000, budgetCents: 55000000 },
          { category: 'cost', label: '其他成本', thisMonthCents: 36000000, lastMonthCents: 30000000, budgetCents: 40000000 },
        ],
      },
      {
        category: 'expense', label: '运营费用',
        thisMonthCents: 115000000, lastMonthCents: 110000000, budgetCents: 130000000,
        children: [
          { category: 'expense', label: '人工成本', thisMonthCents: 68000000, lastMonthCents: 65000000, budgetCents: 72000000 },
          { category: 'expense', label: '场地租金', thisMonthCents: 32000000, lastMonthCents: 30000000, budgetCents: 35000000 },
          { category: 'expense', label: '水电物业', thisMonthCents: 10000000, lastMonthCents: 9000000, budgetCents: 12000000 },
          { category: 'expense', label: '营销费用', thisMonthCents: 5000000, lastMonthCents: 6000000, budgetCents: 8000000 },
        ],
      },
      {
        category: 'profit', label: '净利润',
        thisMonthCents: 91000000, lastMonthCents: 80000000, budgetCents: 100000000,
        children: [],
      },
    ],
  },
  quarter: {
    periodLabel: '2026年Q2 (4月-6月)',
    items: [
      {
        category: 'revenue', label: '营业收入',
        thisMonthCents: 1350000000, lastMonthCents: 1200000000, budgetCents: 1500000000,
        children: [
          { category: 'revenue', label: '门票收入', thisMonthCents: 380000000, lastMonthCents: 340000000, budgetCents: 420000000 },
          { category: 'revenue', label: '游戏币收入', thisMonthCents: 550000000, lastMonthCents: 500000000, budgetCents: 600000000 },
          { category: 'revenue', label: '餐饮收入', thisMonthCents: 260000000, lastMonthCents: 240000000, budgetCents: 290000000 },
          { category: 'revenue', label: '其他收入', thisMonthCents: 160000000, lastMonthCents: 120000000, budgetCents: 190000000 },
        ],
      },
      {
        category: 'cost', label: '营业成本',
        thisMonthCents: 680000000, lastMonthCents: 600000000, budgetCents: 750000000,
        children: [
          { category: 'cost', label: '设备折旧', thisMonthCents: 135000000, lastMonthCents: 135000000, budgetCents: 135000000 },
          { category: 'cost', label: '游戏币成本', thisMonthCents: 245000000, lastMonthCents: 220000000, budgetCents: 270000000 },
          { category: 'cost', label: '原材料成本', thisMonthCents: 165000000, lastMonthCents: 150000000, budgetCents: 180000000 },
          { category: 'cost', label: '其他成本', thisMonthCents: 135000000, lastMonthCents: 95000000, budgetCents: 165000000 },
        ],
      },
      {
        category: 'expense', label: '运营费用',
        thisMonthCents: 380000000, lastMonthCents: 350000000, budgetCents: 420000000,
        children: [
          { category: 'expense', label: '人工成本', thisMonthCents: 215000000, lastMonthCents: 200000000, budgetCents: 225000000 },
          { category: 'expense', label: '场地租金', thisMonthCents: 105000000, lastMonthCents: 95000000, budgetCents: 105000000 },
          { category: 'expense', label: '水电物业', thisMonthCents: 36000000, lastMonthCents: 30000000, budgetCents: 45000000 },
          { category: 'expense', label: '营销费用', thisMonthCents: 24000000, lastMonthCents: 25000000, budgetCents: 45000000 },
        ],
      },
      {
        category: 'profit', label: '净利润',
        thisMonthCents: 290000000, lastMonthCents: 250000000, budgetCents: 330000000,
        children: [],
      },
    ],
  },
  year: {
    periodLabel: '2026年累计 (1月-7月)',
    items: [
      {
        category: 'revenue', label: '营业收入',
        thisMonthCents: 2890000000, lastMonthCents: 2450000000, budgetCents: 3600000000,
        children: [
          { category: 'revenue', label: '门票收入', thisMonthCents: 820000000, lastMonthCents: 700000000, budgetCents: 1000000000 },
          { category: 'revenue', label: '游戏币收入', thisMonthCents: 1180000000, lastMonthCents: 980000000, budgetCents: 1450000000 },
          { category: 'revenue', label: '餐饮收入', thisMonthCents: 560000000, lastMonthCents: 480000000, budgetCents: 700000000 },
          { category: 'revenue', label: '其他收入', thisMonthCents: 330000000, lastMonthCents: 290000000, budgetCents: 450000000 },
        ],
      },
      {
        category: 'cost', label: '营业成本',
        thisMonthCents: 1420000000, lastMonthCents: 1200000000, budgetCents: 1800000000,
        children: [
          { category: 'cost', label: '设备折旧', thisMonthCents: 315000000, lastMonthCents: 270000000, budgetCents: 315000000 },
          { category: 'cost', label: '游戏币成本', thisMonthCents: 520000000, lastMonthCents: 450000000, budgetCents: 650000000 },
          { category: 'cost', label: '原材料成本', thisMonthCents: 350000000, lastMonthCents: 300000000, budgetCents: 430000000 },
          { category: 'cost', label: '其他成本', thisMonthCents: 235000000, lastMonthCents: 180000000, budgetCents: 405000000 },
        ],
      },
      {
        category: 'expense', label: '运营费用',
        thisMonthCents: 820000000, lastMonthCents: 700000000, budgetCents: 980000000,
        children: [
          { category: 'expense', label: '人工成本', thisMonthCents: 460000000, lastMonthCents: 410000000, budgetCents: 520000000 },
          { category: 'expense', label: '场地租金', thisMonthCents: 220000000, lastMonthCents: 190000000, budgetCents: 245000000 },
          { category: 'expense', label: '水电物业', thisMonthCents: 75000000, lastMonthCents: 58000000, budgetCents: 105000000 },
          { category: 'expense', label: '营销费用', thisMonthCents: 65000000, lastMonthCents: 42000000, budgetCents: 110000000 },
        ],
      },
      {
        category: 'profit', label: '净利润',
        thisMonthCents: 650000000, lastMonthCents: 550000000, budgetCents: 820000000,
        children: [],
      },
    ],
  },
}

function getDefaultReport(period: PeriodKey): PnLReport {
  const data = periodDataMap[period]
  return {
    date: '2026-07-18',
    periodLabel: data.periodLabel,
    items: data.items,
    tenantId: 't1',
    generatedAt: '2026-07-18T22:00:00Z',
  }
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
  const [period, setPeriod] = useState<PeriodKey>('thisMonth')

  const loadReport = useCallback(async (selectedPeriod?: PeriodKey) => {
    const p = selectedPeriod ?? period
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<PnLReport>(`/api/finance/pnl?period=${p}`)
      setReport(data)
    } catch {
      setReport(getDefaultReport(p))
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { loadReport() }, [loadReport])

  const handlePeriodChange = useCallback((p: PeriodKey) => {
    setPeriod(p)
    loadReport(p)
  }, [loadReport])

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
          <button onClick={() => loadReport()} className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">重试</button>
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
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">损益表 (P&L)</h1>
            <p className="text-sm text-gray-500 mt-1">{report.periodLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => loadReport()} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">刷新</button>
          </div>
        </div>
        {/* 月份筛选 Tab */}
        <div className="flex gap-1 mt-3" role="tablist" aria-label="周期筛选">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.key}
              role="tab"
              aria-selected={period === opt.key}
              data-period-key={opt.key}
              onClick={() => handlePeriodChange(opt.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                period === opt.key
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
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
