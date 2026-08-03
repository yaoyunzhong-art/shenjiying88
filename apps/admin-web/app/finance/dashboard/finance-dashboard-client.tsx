'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { DashboardData, FinanceDashboardSnapshotDelivery } from './finance-dashboard-data'

function formatMoney(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export default function FinanceDashboardClient({
  snapshot,
}: {
  snapshot: FinanceDashboardSnapshotDelivery
}) {
  const router = useRouter()
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [mutationNote, setMutationNote] = useState<string | null>(null)
  const dashboard = snapshot.dashboard

  const channelRows = useMemo(
    () => [
      ['微信支付', dashboard.channels.wechatCents],
      ['支付宝', dashboard.channels.alipayCents],
      ['会员卡', dashboard.channels.memberCardCents],
      ['现金', dashboard.channels.cashCents],
    ] as const,
    [dashboard.channels]
  )

  async function handleRunReconciliation() {
    try {
      await fetch('/api/finance/reconciliation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dashboard.revenue.date }),
      })
      setMutationNote('已触发一次客户端对账演示请求，并回刷服务端快照。')
      handleRefresh()
    } catch {
      setMutationNote('对账演示请求失败，当前仍展示已缓存的快照结果。')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">财务健康仪表盘</h1>
          <p className="mt-1 text-sm text-slate-500">
            营收、渠道分布和对账健康度均由服务端 snapshot loader 首屏下发。
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRunReconciliation}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            发起对账
          </button>
          <button
            type="button"
            onClick={() => router.push('/finance/reconciliation')}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            查看对账详情
          </button>
          <button
            type="button"
            onClick={() => handleRefresh()}
            disabled={isRefreshing}
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
        </div>
      </div>

      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          snapshot.deliveryMode === 'api'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-amber-200 bg-amber-50 text-amber-700'
        }`}
      >
        {`deliveryMode: ${snapshot.deliveryMode} · 营收与对账状态已切换到服务端快照首屏`}
      </div>

      {(snapshot.error || mutationNote) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {snapshot.error ?? mutationNote}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="今日营收" value={formatMoney(dashboard.revenue.totalRevenueCents)} />
        <MetricCard label="今日退款" value={formatMoney(dashboard.revenue.totalRefundCents)} />
        <MetricCard label="净收入" value={formatMoney(dashboard.revenue.netIncomeCents)} />
        <MetricCard label="交易笔数" value={String(dashboard.revenue.transactionCount)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">支付渠道拆分</h2>
          <div className="mt-4 space-y-3">
            {channelRows.map(([label, amount]) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{label}</span>
                <span className="font-medium text-slate-900">{formatMoney(amount)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">今日对账状态</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div>最近运行: {dashboard.reconciliation.lastRunAt ?? '未运行'}</div>
            <div>累计运行: {dashboard.reconciliation.totalRuns} 次</div>
            <div>
              匹配率:{' '}
              {dashboard.reconciliation.lastReportSummary
                ? `${dashboard.reconciliation.lastReportSummary.matchRate.toFixed(1)}%`
                : '暂无数据'}
            </div>
            <div>
              差异金额:{' '}
              {dashboard.reconciliation.lastReportSummary
                ? formatMoney(dashboard.reconciliation.lastReportSummary.totalDiffCents)
                : '—'}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">7 日趋势</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-7">
          {dashboard.trend.map((point) => (
            <div key={point.date} className="rounded-lg border border-slate-200 p-3 text-sm">
              <div className="text-slate-400">{point.date.slice(5)}</div>
              <div className="mt-2 font-medium text-slate-900">{formatMoney(point.revenueCents)}</div>
              <div className="mt-1 text-xs text-slate-500">退款 {formatMoney(point.refundCents)}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">利润概况</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm">
            <MetricRow label="门店利润" value={formatMoney(dashboard.profit.storeProfit)} />
            <MetricRow label="门店利润率" value={formatPercent(dashboard.profit.storeMargin)} />
            <MetricRow label="品牌营收" value={formatMoney(dashboard.profit.brandRevenue)} />
            <MetricRow label="品牌利润" value={formatMoney(dashboard.profit.brandProfit)} />
          </div>
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">费用分析</h2>
          {dashboard.costAnalysis ? (
            <div className="mt-4 space-y-3 text-sm">
              <div className="font-medium text-slate-900">
                总成本 {formatMoney(dashboard.costAnalysis.totalCostCents)}
              </div>
              {dashboard.costAnalysis.categories.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <span className="text-slate-600">{item.category}</span>
                  <span className="text-slate-900">{item.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 text-sm text-slate-400">暂无成本分析结果</div>
          )}
        </section>
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 font-medium text-slate-900">{value}</div>
    </div>
  )
}
