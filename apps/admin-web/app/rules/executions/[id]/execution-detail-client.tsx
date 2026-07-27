'use client'
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { RuleExecutionDetailSnapshotDelivery } from './execution-detail-data'
import { formatExecutionDuration } from './execution-detail-data'

export default function RuleExecutionDetailClient({
  snapshot,
}: {
  snapshot: RuleExecutionDetailSnapshotDelivery
}) {
  const router = useRouter()
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [status, setStatus] = useState(snapshot.execution.status)
  const [message, setMessage] = useState<string | null>(null)

  function handleRerun() {
    setStatus('RUNNING')
    setMessage('已重新提交本地演练执行请求，真实链路仍待规则引擎 API 接入。')
  }

  function handleCancel() {
    setStatus('TIMEOUT')
    setMessage('已切换为本地取消演练态。')
  }

  function handleDelete() {
    setMessage('当前删除仅为演练提示，页面将在短暂延时后返回列表。')
    setTimeout(() => router.push('/rules/executions'), 500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{snapshot.execution.ruleName}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {snapshot.execution.id} · {snapshot.execution.ruleVersion} · {snapshot.execution.executionNode}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleRefresh()}
            disabled={isRefreshing}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
          <button
            type="button"
            onClick={handleRerun}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            重新执行
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded border border-rose-300 px-4 py-2 text-sm text-rose-700 hover:bg-rose-50"
          >
            删除记录
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: '当前状态', value: status },
          { label: '耗时', value: formatExecutionDuration(snapshot.execution.durationMs) },
          { label: '重试次数', value: String(snapshot.execution.retryCount) },
          { label: '触发源', value: snapshot.execution.triggeredBy },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">{card.label}</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-900">输入载荷</h2>
          <p className="mt-2 text-sm text-slate-600">{snapshot.execution.inputSummary}</p>
          <pre className="mt-4 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
            {snapshot.execution.inputPayload}
          </pre>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-900">输出载荷</h2>
          <p className="mt-2 text-sm text-slate-600">{snapshot.execution.outputSummary}</p>
          <pre className="mt-4 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
            {snapshot.execution.outputPayload}
          </pre>
        </section>
      </div>

      {snapshot.execution.errorMessage ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-rose-800">错误详情</h2>
            {status === 'RUNNING' ? (
              <button
                type="button"
                onClick={handleCancel}
                className="rounded border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                取消执行
              </button>
            ) : null}
          </div>
          <p className="mt-3 text-sm text-rose-700">{snapshot.execution.errorMessage}</p>
          {snapshot.execution.errorStackTrace ? (
            <pre className="mt-4 overflow-auto rounded-lg bg-rose-950 p-4 text-xs text-rose-100">
              {snapshot.execution.errorStackTrace}
            </pre>
          ) : null}
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link
          href="/rules/executions"
          className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          返回执行列表
        </Link>
        <Link
          href={`/configuration/entries/${snapshot.execution.ruleId}`}
          className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          查看关联规则
        </Link>
      </div>
    </div>
  )
}
