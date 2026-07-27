'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import type { ApprovalRequest, BudgetItem, BudgetSnapshotDelivery, BudgetStatus } from './budget-data'

function formatMoney(cents: number, currency = 'CNY'): string {
  const amount = (cents / 100).toFixed(2)
  return currency === 'CNY' ? `¥${amount}` : `${currency} ${amount}`
}

function usagePercent(item: BudgetItem): number {
  if (item.totalCents <= 0) return 0
  return Math.min(Math.round((item.usedCents / item.totalCents) * 100), 100)
}

export default function BudgetClient({
  snapshot,
}: {
  snapshot: BudgetSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [tab, setTab] = useState<'budgets' | 'approvals'>('budgets')
  const [budgets, setBudgets] = useState(snapshot.budgets)
  const [approvals, setApprovals] = useState(snapshot.approvals)
  const [statusFilter, setStatusFilter] = useState<'all' | BudgetStatus>('all')
  const [localMessage, setLocalMessage] = useState<string | null>(null)

  const filteredBudgets = useMemo(
    () => budgets.filter((item) => (statusFilter === 'all' ? true : item.status === statusFilter)),
    [budgets, statusFilter]
  )

  const summary = useMemo(
    () => ({
      totalBudget: budgets.reduce((sum, item) => sum + item.totalCents, 0),
      totalUsed: budgets.reduce((sum, item) => sum + item.usedCents, 0),
      activeCount: budgets.filter((item) => item.status === 'ACTIVE').length,
      pendingApprovalCount: approvals.filter((item) => item.status === 'PENDING').length,
    }),
    [approvals, budgets]
  )

  function updateApproval(approvalId: string, status: ApprovalRequest['status']) {
    setApprovals((current) =>
      current.map((item) =>
        item.id === approvalId
          ? {
              ...item,
              status,
              version: item.version + 1,
            }
          : item
      )
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">预算管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            预算编制、审批流和执行监控已切换为服务端快照首屏，当前仍以 fallback 样本承载。
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleRefresh()}
          disabled={isRefreshing}
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        {`deliveryMode: ${snapshot.deliveryMode} · 预算首屏当前来自服务端 fallback 快照`}
      </div>

      {(snapshot.error || localMessage) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {snapshot.error ?? localMessage}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">总预算</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatMoney(summary.totalBudget)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">已使用</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatMoney(summary.totalUsed)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">执行中</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-600">{summary.activeCount}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">待审批</div>
          <div className="mt-2 text-2xl font-semibold text-amber-600">{summary.pendingApprovalCount}</div>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <div className="flex gap-6 text-sm">
          <button
            type="button"
            onClick={() => setTab('budgets')}
            className={`border-b-2 pb-2 ${tab === 'budgets' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500'}`}
          >
            预算列表
          </button>
          <button
            type="button"
            onClick={() => setTab('approvals')}
            className={`border-b-2 pb-2 ${tab === 'approvals' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500'}`}
          >
            审批请求
          </button>
        </div>
      </div>

      {tab === 'budgets' && (
        <section className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">预算列表</h2>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | BudgetStatus)}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">全部状态</option>
              <option value="DRAFT">草稿</option>
              <option value="PENDING">待审批</option>
              <option value="APPROVED">已批准</option>
              <option value="REJECTED">已驳回</option>
              <option value="ACTIVE">执行中</option>
              <option value="CLOSED">已关闭</option>
            </select>
            <div className="ml-auto text-sm text-slate-400">当前展示 {filteredBudgets.length} 项</div>
          </div>

          <div className="mt-4 space-y-4">
            {filteredBudgets.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-base font-semibold text-slate-900">{item.name}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      {item.category} · {item.period} · 状态 {item.status}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBudgets((current) =>
                        current.map((entry) =>
                          entry.id === item.id && entry.status === 'PENDING'
                            ? {
                                ...entry,
                                status: 'ACTIVE',
                                version: entry.version + 1,
                              }
                            : entry
                        )
                      )
                      setLocalMessage(`预算 ${item.name} 已在客户端演示流中更新为执行中。`)
                    }}
                    disabled={item.status !== 'PENDING'}
                    className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    启动执行
                  </button>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div>
                    <div className="text-xs text-slate-400">总额</div>
                    <div className="mt-1 text-sm font-medium">{formatMoney(item.totalCents, item.currency)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">已用</div>
                    <div className="mt-1 text-sm font-medium">{formatMoney(item.usedCents, item.currency)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">剩余</div>
                    <div className="mt-1 text-sm font-medium">{formatMoney(item.remainingCents, item.currency)}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                    <span>预算消耗</span>
                    <span>{usagePercent(item)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-slate-900"
                      style={{ width: `${usagePercent(item)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'approvals' && (
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">审批请求</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-slate-500">
                  <th className="px-3 py-3 font-medium">预算</th>
                  <th className="px-3 py-3 font-medium">申请人</th>
                  <th className="px-3 py-3 font-medium">申请金额</th>
                  <th className="px-3 py-3 font-medium">状态</th>
                  <th className="px-3 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((approval) => (
                  <tr key={approval.id} className="border-b last:border-b-0">
                    <td className="px-3 py-3">{approval.budgetName}</td>
                    <td className="px-3 py-3 text-slate-500">{approval.requester}</td>
                    <td className="px-3 py-3 font-medium">{formatMoney(approval.amountCents)}</td>
                    <td className="px-3 py-3">{approval.status}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            updateApproval(approval.id, 'APPROVED')
                            setLocalMessage(`审批请求 ${approval.id} 已在客户端演示流中标记为批准。`)
                          }}
                          disabled={approval.status !== 'PENDING'}
                          className="rounded bg-emerald-50 px-3 py-1 text-xs text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          批准
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateApproval(approval.id, 'REJECTED')
                            setLocalMessage(`审批请求 ${approval.id} 已在客户端演示流中标记为驳回。`)
                          }}
                          disabled={approval.status !== 'PENDING'}
                          className="rounded bg-rose-50 px-3 py-1 text-xs text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          驳回
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
