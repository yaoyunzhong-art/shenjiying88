'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import type { RuleExecutionStatus, RuleExecutionsSnapshotDelivery } from './executions-data'
import { RULE_EXECUTION_STATUS_LABELS } from './executions-data'

const STATUS_FILTERS: Array<'all' | RuleExecutionStatus> = ['all', 'SUCCESS', 'FAILURE', 'RUNNING', 'TIMEOUT']
const TIME_FILTERS = ['24h', '7d', '30d', 'all'] as const

function statusClass(status: RuleExecutionStatus): string {
  return {
    SUCCESS: 'bg-emerald-100 text-emerald-700',
    FAILURE: 'bg-rose-100 text-rose-700',
    RUNNING: 'bg-blue-100 text-blue-700',
    TIMEOUT: 'bg-amber-100 text-amber-700',
  }[status]
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

export default function RuleExecutionsClient({
  snapshot,
}: {
  snapshot: RuleExecutionsSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | RuleExecutionStatus>('all')
  const [timeRange, setTimeRange] = useState<(typeof TIME_FILTERS)[number]>('24h')

  const filteredExecutions = useMemo(() => {
    const now = Date.now()
    return snapshot.executions.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (search.trim()) {
        const keyword = search.trim().toLowerCase()
        const matched = [item.id, item.ruleId, item.ruleName, item.triggeredBy, item.triggerEventType].some(
          (field) => field.toLowerCase().includes(keyword)
        )
        if (!matched) return false
      }

      if (timeRange === 'all') return true
      const diff = now - new Date(item.createdAt).getTime()
      if (timeRange === '24h') return diff <= 24 * 60 * 60 * 1000
      if (timeRange === '7d') return diff <= 7 * 24 * 60 * 60 * 1000
      return diff <= 30 * 24 * 60 * 60 * 1000
    })
  }, [search, snapshot.executions, statusFilter, timeRange])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">规则执行结果</h1>
          <p className="mt-1 text-sm text-slate-500">执行列表首屏已切换为服务端快照，客户端仅负责筛选、跳转与刷新。</p>
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

      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: '总执行', value: snapshot.stats.total },
          { label: '成功', value: snapshot.stats.success },
          { label: '失败', value: snapshot.stats.failure },
          { label: '进行中', value: snapshot.stats.running },
          { label: '超时', value: snapshot.stats.timeout },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">{card.label}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索执行 ID / 规则名 / 触发源"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {TIME_FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTimeRange(item)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  timeRange === item
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-600'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((item) => (
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
              {item === 'all' ? '全部状态' : RULE_EXECUTION_STATUS_LABELS[item]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">规则</th>
              <th className="px-4 py-3">触发源</th>
              <th className="px-4 py-3">执行摘要</th>
              <th className="px-4 py-3">耗时</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredExecutions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                  当前筛选条件下暂无匹配执行记录
                </td>
              </tr>
            ) : (
              filteredExecutions.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-4">
                    <Link href={`/rules/executions/${item.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                      {item.ruleName}
                    </Link>
                    <div className="mt-1 text-xs text-slate-500">{item.id}</div>
                    <div className="mt-1 text-xs text-slate-400">{item.ruleId}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <div>{item.triggeredBy}</div>
                    <div className="mt-1 text-xs text-slate-400">{item.triggerEventType}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-slate-800">{item.inputSummary}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.outputSummary}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{formatDuration(item.durationMs)}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(item.status)}`}>
                      {RULE_EXECUTION_STATUS_LABELS[item.status]}
                    </span>
                    {item.errorMessage ? <div className="mt-1 text-xs text-rose-500">{item.errorMessage}</div> : null}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/rules/executions/${item.id}`}
                      className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
