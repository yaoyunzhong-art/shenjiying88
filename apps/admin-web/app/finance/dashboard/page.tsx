/**
 * V18 财务健康仪表盘
 *
 * 功能:
 *   1. 今日营收总览卡片 — 营收/退款/净收入/交易数
 *   2. 支付渠道拆分 — 微信/支付宝/会员卡/现金 各渠道金额+占比
 *   3. 7日趋势图 — 简单柱状布局模拟
 *   4. 今日对账状态卡 — 引用 /reconciliation 数据
 *   5. 快速操作栏 — 发起对账/查看对账详情/导出报表
 *   6. 状态管理 — loading/empty/error
 *
 * 路由: /finance/dashboard
 */

'use client'

import React from 'react'
import { useCallback, useEffect, useState } from 'react'

// ─── 类型定义 ─────────────────────────────────────────────

interface RevenueSummary {
  totalRevenueCents: number
  totalRefundCents: number
  netIncomeCents: number
  transactionCount: number
  date: string
}

interface ChannelBreakdown {
  wechatCents: number
  alipayCents: number
  memberCardCents: number
  cashCents: number
  totalCents: number
}

interface DailyTrendPoint {
  date: string
  revenueCents: number
  refundCents: number
  netCents: number
}

interface ReconciliationStatus {
  inProgress: boolean
  lastRunAt: string | null
  lastRunDate: string | null
  totalRuns: number
  lastError: string | null
  lastReportSummary: {
    date: string
    matchedCount: number
    exactMatchCount: number
    totalDiffCents: number
    matchRate: number
  } | null
}

interface CostAnalysisData {
  totalCostCents: number
  categories: Array<{
    category: string
    amountCents: number
    count: number
    percentage: number
  }>
  monthOverMonthChange: number
  yearOverYearChange: number
}

interface DashboardData {
  revenue: RevenueSummary
  channels: ChannelBreakdown
  trend: DailyTrendPoint[]
  reconciliation: ReconciliationStatus
  costAnalysis: CostAnalysisData | null
  profit: {
    storeProfit: number
    storeMargin: number
    brandProfit: number
    brandRevenue: number
    brandCost: number
  }
}

// ─── 工具函数 ─────────────────────────────────────────────

function fmtCents(cents: number): string {
  const abs = Math.abs(cents)
  const sign = cents < 0 ? '-' : ''
  return `${sign}¥${(abs / 100).toFixed(2)}`
}

function fmtPercent(part: number, total: number): string {
  if (total === 0) return '0%'
  return `${((part / total) * 100).toFixed(1)}%`
}

function channelLabel(channel: keyof ChannelBreakdown): string {
  const map: Record<string, string> = {
    wechatCents: '微信支付',
    alipayCents: '支付宝',
    memberCardCents: '会员卡',
    cashCents: '现金',
  }
  return map[channel] ?? channel
}

function channelColor(channel: keyof ChannelBreakdown): string {
  const map: Record<string, string> = {
    wechatCents: 'bg-green-500',
    alipayCents: 'bg-blue-500',
    memberCardCents: 'bg-purple-500',
    cashCents: 'bg-orange-500',
  }
  return map[channel] ?? 'bg-gray-400'
}

function channelBarColor(channel: keyof ChannelBreakdown): string {
  const map: Record<string, string> = {
    wechatCents: 'bg-green-400',
    alipayCents: 'bg-blue-400',
    memberCardCents: 'bg-purple-400',
    cashCents: 'bg-orange-400',
  }
  return map[channel] ?? 'bg-gray-400'
}

// ─── API 工具 ─────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'API error')
  return json.data as T
}

// ─── 子组件: 营收卡片 ──────────────────────────────────

function RevenueCard({
  label, amountCents, sublabel, color,
}: {
  label: string
  amountCents: number
  sublabel?: string
  color?: string
}) {
  const isNegative = amountCents < 0
  const textColor = color ?? (isNegative ? 'text-red-600' : 'text-gray-900')
  return (
    <div className="bg-white border rounded-lg p-4" data-testid="revenue-card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${textColor}`} data-testid="revenue-amount">
        {fmtCents(amountCents)}
      </p>
      {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
    </div>
  )
}

// ─── 子组件: 趋势柱状图 ──────────────────────────────────

function TrendChart({ data }: { data: DailyTrendPoint[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenueCents), 1)
  return (
    <div className="bg-white border rounded-lg p-4" data-testid="trend-chart">
      <h3 className="text-sm font-medium text-gray-700 mb-3">7日营收趋势</h3>
      <div className="flex items-end gap-2 h-32" data-testid="trend-bars">
        {data.map((point) => {
          const heightPct = (point.revenueCents / maxRevenue) * 100
          return (
            <div key={point.date} className="flex-1 flex flex-col items-center justify-end h-full">
              <div className="w-full flex flex-col items-center gap-0.5">
                <div
                  className="w-full bg-blue-400 rounded-t"
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                  data-testid="trend-bar"
                />
                {point.refundCents > 0 && (
                  <div
                    className="w-full bg-red-300 rounded-t"
                    style={{ height: `${Math.max((point.refundCents / maxRevenue) * 100, 1)}%` }}
                    data-testid="trend-refund-bar"
                  />
                )}
              </div>
              <span className="text-xs text-gray-400 mt-1 truncate w-full text-center">
                {point.date.slice(5)}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 bg-blue-400 rounded" /> 营收</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 bg-red-300 rounded" /> 退款</span>
      </div>
    </div>
  )
}

// ─── 子组件: 渠道拆分 ──────────────────────────────────

function ChannelBreakdownView({ channels }: { channels: ChannelBreakdown }) {
  const entries = (Object.keys(channels) as Array<keyof ChannelBreakdown>)
    .filter((k) => k !== 'totalCents')

  return (
    <div className="bg-white border rounded-lg p-4" data-testid="channel-breakdown">
      <h3 className="text-sm font-medium text-gray-700 mb-3">支付渠道拆分</h3>
      <div className="flex h-3 rounded-full overflow-hidden mb-4">
        {entries.map((key) => {
          const pct = channels.totalCents > 0 ? (channels[key] / channels.totalCents) * 100 : 0
          if (pct === 0) return null
          return (
            <div
              key={key}
              className={channelColor(key)}
              style={{ width: `${pct}%` }}
              data-testid="channel-bar"
            />
          )
        })}
      </div>
      <div className="space-y-2">
        {entries.map((key) => {
          const pct = channels.totalCents > 0 ? (channels[key] / channels.totalCents) * 100 : 0
          return (
            <div key={key} className="flex items-center justify-between text-sm" data-testid="channel-row">
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${channelColor(key)}`} />
                <span className="text-gray-600">{channelLabel(key)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">{fmtCents(channels[key])}</span>
                <span className="text-gray-400 w-12 text-right">{fmtPercent(channels[key], channels.totalCents)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── 子组件: 对账状态卡 ────────────────────────────────

function ReconciliationStatusCard({ status }: { status: ReconciliationStatus }) {
  const summary = status.lastReportSummary
  const isGood = summary != null && summary.matchRate >= 90 && summary.totalDiffCents === 0

  return (
    <div className="bg-white border rounded-lg p-4" data-testid="reconciliation-status">
      <h3 className="text-sm font-medium text-gray-700 mb-3">今日对账状态</h3>
      {status.inProgress ? (
        <div className="flex items-center gap-2 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          <span className="text-sm">对账进行中...</span>
        </div>
      ) : summary ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">匹配率</span>
            <span className={`font-medium ${isGood ? 'text-green-600' : 'text-yellow-600'}`}>
              {summary.matchRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">匹配数</span>
            <span className="font-medium">{summary.matchedCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">差异金额</span>
            <span className={`font-medium ${summary.totalDiffCents !== 0 ? 'text-red-600' : 'text-green-600'}`}>
              {fmtCents(summary.totalDiffCents)}
            </span>
          </div>
          {status.lastError && (
            <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
              <p className="text-xs text-red-700">{status.lastError}</p>
            </div>
          )}
          <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
            isGood ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isGood ? '✅ 账目健康' : '⚠️ 需关注'}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-400 text-center py-4">
          <p>暂无对账数据</p>
          <p className="text-xs mt-1">请先发起一次对账</p>
        </div>
      )}
    </div>
  )
}

// ─── 子组件: 费用分析面板 ────────────────────────────────

function CostAnalysisPanel({ data }: { data: CostAnalysisData | null }) {
  if (!data) return null
  return (
    <div className="bg-white border rounded-lg p-4" data-testid="cost-analysis-panel">
      <h3 className="text-sm font-medium text-gray-700 mb-3">费用分析</h3>
      <div className="text-2xl font-bold text-gray-900 mb-3">{fmtCents(data.totalCostCents)}</div>
      <div className="flex items-center gap-3 mb-4 text-xs">
        <span className={`px-2 py-0.5 rounded ${data.monthOverMonthChange > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          环比 {data.monthOverMonthChange > 0 ? '+' : ''}{data.monthOverMonthChange.toFixed(1)}%
        </span>
        <span className={`px-2 py-0.5 rounded ${data.yearOverYearChange > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          同比 {data.yearOverYearChange > 0 ? '+' : ''}{data.yearOverYearChange.toFixed(1)}%
        </span>
      </div>
      <div className="space-y-2">
        {data.categories.map((cat) => (
          <div key={cat.category} className="flex items-center justify-between text-sm" data-testid="cost-category-row">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">{cat.category}</span>
              <span className="text-xs text-gray-400">{cat.count} 笔</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium">{fmtCents(cat.amountCents)}</span>
              <span className="text-gray-400 w-12 text-right">{cat.percentage.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t">
        <div className="flex h-2 rounded-full overflow-hidden">
          {data.categories.map((cat) => (
            <div
              key={cat.category}
              className={`${cat.category === '采购成本' ? 'bg-blue-400' : cat.category === '人力成本' ? 'bg-purple-400' : 'bg-orange-400'}`}
              style={{ width: `${cat.percentage}%` }}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
          {data.categories.map((cat) => (
            <span key={cat.category} className="flex items-center gap-1">
              <span className={`inline-block w-2 h-2 rounded ${cat.category === '采购成本' ? 'bg-blue-400' : cat.category === '人力成本' ? 'bg-purple-400' : 'bg-orange-400'}`} />
              {cat.category}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── 子组件: 利润概览面板 ────────────────────────────────

function ProfitOverviewPanel({ data }: { data: { storeProfit: number; storeMargin: number; brandProfit: number; brandRevenue: number; brandCost: number } }) {
  const marginArrow = data.storeMargin > 0 ? '↑' : '↓'
  const marginColor = data.storeMargin > 0.1 ? 'text-green-600' : data.storeMargin > 0 ? 'text-yellow-600' : 'text-red-600'
  return (
    <div className="bg-white border rounded-lg p-4" data-testid="profit-overview">
      <h3 className="text-sm font-medium text-gray-700 mb-3">利润概况</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500">门店利润</p>
          <p className="text-lg font-bold mt-0.5">{fmtCents(data.storeProfit)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">门店利润率</p>
          <p className={`text-lg font-bold mt-0.5 ${marginColor}`}>{marginArrow} {(data.storeMargin * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">品牌营收</p>
          <p className="text-lg font-bold mt-0.5">{fmtCents(data.brandRevenue)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">品牌利润</p>
          <p className="text-lg font-bold mt-0.5">{fmtCents(data.brandProfit)}</p>
        </div>
      </div>
    </div>
  )
}

// ─── 主组件 ─────────────────────────────────────────────

export default function FinanceDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFetch<DashboardData>('/api/finance/dashboard')
      setData(result)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── 操作按钮 ──

  const handleRunReconciliation = useCallback(async () => {
    try {
      await apiFetch('/api/finance/reconciliation/run', {
        method: 'POST',
        body: JSON.stringify({ date: new Date().toISOString().slice(0, 10) }),
      })
      await loadData()
    } catch (err) {
      setError((err as Error).message)
    }
  }, [loadData])

  // ── 加载态 ──

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-state">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        <span className="ml-3 text-gray-600">加载财务仪表盘...</span>
      </div>
    )
  }

  // ── 错误态 ──

  if (error && !data) {
    return (
      <div className="p-6" data-testid="error-state">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">加载失败</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  // ── 空态 ──

  if (!data) {
    return (
      <div className="p-6" data-testid="empty-state">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-lg">暂无财务数据</p>
          <p className="text-gray-400 text-sm mt-1">请先完成一笔交易后再查看仪表盘</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            刷新
          </button>
        </div>
      </div>
    )
  }

  const { revenue, channels, trend, reconciliation, costAnalysis, profit } = data

  // ── 渠道列表（排除 totalCents） ──
  const channelKeys = (Object.keys(channels) as Array<keyof ChannelBreakdown>)
    .filter((k) => k !== 'totalCents')

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="dashboard-page">
      {/* 标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">财务健康仪表盘</h1>
        <p className="text-sm text-gray-500 mt-1">
          {revenue.date} · 实时数据
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* 1. 今日营收总览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="revenue-overview">
        <RevenueCard label="今日营收" amountCents={revenue.totalRevenueCents} sublabel="含所有支付渠道" />
        <RevenueCard label="今日退款" amountCents={revenue.totalRefundCents} color="text-red-600" sublabel="已退金额" />
        <RevenueCard label="净收入" amountCents={revenue.netIncomeCents} sublabel={`${revenue.transactionCount} 笔交易`} />
        <div className="bg-white border rounded-lg p-4" data-testid="revenue-card">
          <p className="text-sm text-gray-500">交易笔数</p>
          <p className="text-2xl font-bold mt-1 text-gray-900" data-testid="revenue-amount">
            {revenue.transactionCount}
          </p>
          <p className="text-xs text-gray-400 mt-1">今日完成</p>
        </div>
      </div>

      {/* 2. 渠道拆分 + 趋势图 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChannelBreakdownView channels={channels} />
        <TrendChart data={trend} />
      </div>

      {/* 3. 对账状态 + 快速操作 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ReconciliationStatusCard status={reconciliation} />
        </div>
        <div className="bg-white border rounded-lg p-4" data-testid="quick-actions">
          <h3 className="text-sm font-medium text-gray-700 mb-3">快速操作</h3>
          <div className="space-y-2">
            <button
              onClick={handleRunReconciliation}
              disabled={reconciliation.inProgress}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              data-testid="btn-run-reconciliation"
            >
              {reconciliation.inProgress ? '对账进行中...' : '发起对账'}
            </button>
            <button
              onClick={() => { window.location.href = '/finance/reconciliation' }}
              className="w-full px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              data-testid="btn-view-reconciliation"
            >
              查看对账详情
            </button>
            <button
              onClick={() => {
                const csv = [
                  ['日期', '营收(元)', '退款(元)', '净收入(元)', '微信', '支付宝', '会员卡', '现金'],
                  [
                    revenue.date,
                    (revenue.totalRevenueCents / 100).toFixed(2),
                    (revenue.totalRefundCents / 100).toFixed(2),
                    (revenue.netIncomeCents / 100).toFixed(2),
                    (channels.wechatCents / 100).toFixed(2),
                    (channels.alipayCents / 100).toFixed(2),
                    (channels.memberCardCents / 100).toFixed(2),
                    (channels.cashCents / 100).toFixed(2),
                  ],
                ].map((r) => r.join(',')).join('\n')
                const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `dashboard-${revenue.date}.csv`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              data-testid="btn-export"
            >
              导出报表
            </button>
          </div>
        </div>
      </div>

      {/* 4. 渠道各占比明细 */}
      <div className="bg-white border rounded-lg p-4" data-testid="channel-detail-table">
        <h3 className="text-sm font-medium text-gray-700 mb-3">渠道明细</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-3 font-medium text-gray-600">渠道</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">金额</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">占比</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">进度</th>
            </tr>
          </thead>
          <tbody>
            {channelKeys.map((key) => {
              const pct = channels.totalCents > 0 ? (channels[key] / channels.totalCents) * 100 : 0
              return (
                <tr key={key} className="border-b hover:bg-gray-50" data-testid="channel-detail-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${channelColor(key)}`} />
                      <span className="text-gray-700">{channelLabel(key)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{fmtCents(channels[key])}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{fmtPercent(channels[key], channels.totalCents)}</td>
                  <td className="px-4 py-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${channelBarColor(key)}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 5. 利润概况 + 费用分析面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfitOverviewPanel data={profit} />
        <CostAnalysisPanel data={costAnalysis} />
      </div>
    </div>
  )
}
