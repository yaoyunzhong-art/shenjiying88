'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useEffect, useMemo, useState, useTransition } from 'react'
import type {
  DiffDetailRecord,
  DiffRecord,
  ReconciliationSnapshotDelivery,
  SummaryResponse,
} from './reconciliation-data'

type TabView = 'overview' | 'details' | 'history'

function formatMoney(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  return `${sign}¥${(Math.abs(cents) / 100).toFixed(2)}`
}

function diffLabel(kind: string): string {
  if (kind === 'amount-mismatch') return '金额不一致'
  if (kind === 'missing-internal') return '外部无匹配'
  if (kind === 'missing-external') return '内部无匹配'
  if (kind === 'duplicate') return '重复记录'
  return kind
}

export default function ReconciliationClient({
  snapshot,
}: {
  snapshot: ReconciliationSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [tabView, setTabView] = useState<TabView>('overview')
  const [details, setDetails] = useState(snapshot.details)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [kindFilter, setKindFilter] = useState('')
  const [resolvedFilter, setResolvedFilter] = useState<'all' | 'true' | 'false'>('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [localMessage, setLocalMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(() => {
      handleRefresh()
    }, 30000)
    return () => clearInterval(timer)
  }, [autoRefresh, router, startRefresh])

  const filteredDetails = useMemo(
    () =>
      details.filter((item) => {
        if (kindFilter && item.kind !== kindFilter) return false
        if (resolvedFilter === 'true' && !item.resolved) return false
        if (resolvedFilter === 'false' && item.resolved) return false
        return true
      }),
    [details, kindFilter, resolvedFilter]
  )

  async function handleRunReconciliation() {
    try {
      await fetch('/api/finance/reconciliation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: snapshot.status.lastRunDate ?? new Date().toISOString().slice(0, 10) }),
      })
      setLocalMessage('已触发一次客户端对账演示请求，并回刷服务端快照。')
      handleRefresh()
    } catch {
      setLocalMessage('对账演示请求失败，当前仍展示已有快照结果。')
    }
  }

  async function handleResolve(diffKey: string) {
    try {
      await fetch(`/api/finance/reconciliation/${encodeURIComponent(diffKey)}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolvedBy: 'finance-manager' }),
      })
    } catch {
      // noop: keep local optimistic state below
    }

    setDetails((current) =>
      current.map((item) =>
        item.diffKey === diffKey
          ? {
              ...item,
              resolved: true,
              resolvedAt: new Date().toISOString(),
              resolvedBy: 'finance-manager',
            }
          : item
      )
    )
    setSelectedKeys((current) => {
      const next = new Set(current)
      next.delete(diffKey)
      return next
    })
    setLocalMessage(`差异 ${diffKey} 已在客户端演示流中标记为已处理。`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">财务对账</h1>
          <p className="mt-1 text-sm text-slate-500">
            状态、汇总、差异列表与差异明细已全部收回到服务端 snapshot loader 首屏。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRunReconciliation}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            手动对账
          </button>
          <button
            type="button"
            onClick={() => handleRefresh()}
            disabled={isRefreshing}
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input type="checkbox" checked={autoRefresh} onChange={() => setAutoRefresh((value) => !value)} />
            自动刷新
          </label>
        </div>
      </div>

      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          snapshot.deliveryMode === 'api'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-amber-200 bg-amber-50 text-amber-700'
        }`}
      >
        {`deliveryMode: ${snapshot.deliveryMode} · 对账首屏已切换为服务端快照`}
      </div>

      {(snapshot.error || localMessage) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {snapshot.error ?? localMessage}
        </div>
      )}

      <OverviewGrid diffs={snapshot.diffs} status={snapshot.status} summary={snapshot.summary} />

      <div className="border-b border-slate-200">
        <div className="flex gap-6 text-sm">
          {(['overview', 'details', 'history'] as TabView[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTabView(tab)}
              className={`border-b-2 pb-2 ${tabView === tab ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500'}`}
            >
              {{ overview: '对账概览', details: '差异明细', history: '运行历史' }[tab]}
            </button>
          ))}
        </div>
      </div>

      {tabView === 'overview' && (
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">差异概览</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-slate-500">
                  <th className="px-3 py-3 font-medium">交易号</th>
                  <th className="px-3 py-3 font-medium">内部金额</th>
                  <th className="px-3 py-3 font-medium">外部金额</th>
                  <th className="px-3 py-3 font-medium">差异</th>
                  <th className="px-3 py-3 font-medium">类型</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.diffs.map((item, index) => (
                  <DiffRow key={`${item.orderNo ?? 'diff'}-${index}`} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tabView === 'details' && (
        <section className="rounded-xl border bg-white p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">差异明细</h2>
            <select
              value={kindFilter}
              onChange={(event) => setKindFilter(event.target.value)}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">全部类型</option>
              <option value="amount-mismatch">金额不一致</option>
              <option value="missing-internal">外部无匹配</option>
              <option value="missing-external">内部无匹配</option>
              <option value="duplicate">重复记录</option>
            </select>
            <select
              value={resolvedFilter}
              onChange={(event) => setResolvedFilter(event.target.value as 'all' | 'true' | 'false')}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">全部状态</option>
              <option value="false">未处理</option>
              <option value="true">已处理</option>
            </select>
            <div className="ml-auto text-sm text-slate-400">当前展示 {filteredDetails.length} 条</div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-slate-500">
                  <th className="px-3 py-3 font-medium">选择</th>
                  <th className="px-3 py-3 font-medium">差异类型</th>
                  <th className="px-3 py-3 font-medium">交易号</th>
                  <th className="px-3 py-3 font-medium">差异金额</th>
                  <th className="px-3 py-3 font-medium">状态</th>
                  <th className="px-3 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredDetails.map((item) => (
                  <tr key={item.diffKey} className="border-b last:border-b-0">
                    <td className="px-3 py-3">
                      {!item.resolved && (
                        <input
                          type="checkbox"
                          checked={selectedKeys.has(item.diffKey)}
                          onChange={() =>
                            setSelectedKeys((current) => {
                              const next = new Set(current)
                              if (next.has(item.diffKey)) next.delete(item.diffKey)
                              else next.add(item.diffKey)
                              return next
                            })
                          }
                        />
                      )}
                    </td>
                    <td className="px-3 py-3">{diffLabel(item.kind)}</td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-700">{item.orderNo ?? '-'}</td>
                    <td className="px-3 py-3 font-medium">{formatMoney(item.diffCents)}</td>
                    <td className="px-3 py-3">{item.resolved ? '已处理' : '待处理'}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => handleResolve(item.diffKey)}
                        disabled={item.resolved}
                        className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        标记已处理
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tabView === 'history' && (
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">运行历史</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <HistoryCard label="总运行次数" value={String(snapshot.status.totalRuns)} />
            <HistoryCard label="上次运行" value={snapshot.status.lastRunAt ?? '从未运行'} />
            <HistoryCard label="上次对账日期" value={snapshot.status.lastRunDate ?? '-'} />
            <HistoryCard label="上次错误" value={snapshot.status.lastError ?? '无'} />
          </div>
        </section>
      )}
    </div>
  )
}

function OverviewGrid({
  status,
  summary,
  diffs,
}: {
  status: ReconciliationSnapshotDelivery['status']
  summary: SummaryResponse | null
  diffs: DiffRecord[]
}) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <HistoryCard label="运行次数" value={String(status.totalRuns)} />
      <HistoryCard label="当前差异数" value={String(diffs.length)} />
      <HistoryCard label="匹配率" value={summary ? `${summary.matchRate.toFixed(1)}%` : '—'} />
      <HistoryCard label="差异金额" value={summary ? formatMoney(summary.totalDiffCents) : '—'} />
    </div>
  )
}

function DiffRow({ item }: { item: DiffRecord }) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="px-3 py-3 font-mono text-xs text-slate-700">{item.orderNo ?? '-'}</td>
      <td className="px-3 py-3">{item.internalAmountCents != null ? formatMoney(item.internalAmountCents) : '-'}</td>
      <td className="px-3 py-3">{item.externalAmountCents != null ? formatMoney(item.externalAmountCents) : '-'}</td>
      <td className="px-3 py-3 font-medium">{formatMoney(item.diffCents)}</td>
      <td className="px-3 py-3">{diffLabel(item.kind)}</td>
    </tr>
  )
}

function HistoryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  )
}
