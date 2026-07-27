"use client"
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

import { useState, useTransition } from 'react'
import { StatusBadge, useToast } from '@m5/ui'
import type { AiDecisionDetailSnapshotDelivery, AiDecisionStatus } from './ai-decision-detail-data'

interface AiDecisionDetailClientProps {
  snapshot: AiDecisionDetailSnapshotDelivery
}

const statusLabel: Record<AiDecisionStatus, string> = {
  executing: '执行中',
  success: '成功',
  failure: '失败',
  rejected: '已驳回',
  timeout: '超时',
}

const statusVariant: Record<AiDecisionStatus, 'success' | 'danger' | 'warning' | 'info'> = {
  success: 'success',
  failure: 'danger',
  rejected: 'warning',
  timeout: 'warning',
  executing: 'info',
}

export default function AiDecisionDetailClient({ snapshot }: AiDecisionDetailClientProps) {
    const { toast } = useToast()
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [detail, setDetail] = useState(snapshot.detail)

  

  function handleRetry() {
    setDetail((current) => ({
      ...current,
      status: 'executing',
      retryCount: current.retryCount + 1,
      anomalyFlags: [],
      actualOutcome: null,
      deviationScore: null,
    }))
    toast('已重新提交执行')
  }

  function handleRevert() {
    setDetail((current) => ({
      ...current,
      status: 'rejected',
      anomalyFlags: Array.from(new Set([...current.anomalyFlags, 'manually_reverted'])),
      actualOutcome: null,
    }))
    toast('决策已回退到人工复核流程')
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">AI Decision Detail</div>
            <h1 className="text-2xl font-semibold text-slate-900">{detail.ruleName}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <StatusBadge label={statusLabel[detail.status]} variant={statusVariant[detail.status]} dot />
              <span>决策 ID {detail.id}</span>
              <span>模型 {detail.version}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshing ? '刷新中...' : '刷新快照'}
            </button>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
            >
              重试执行
            </button>
            <button
              type="button"
              onClick={handleRevert}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              回退操作
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="决策类别" value={detail.category} />
        <MetricCard label="置信度" value={`${(detail.confidence * 100).toFixed(0)}%`} />
        <MetricCard label="执行耗时" value={`${detail.executionMs}ms`} />
        <MetricCard label="重试次数" value={`${detail.retryCount}`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="输入上下文">
            <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-100">
              {JSON.stringify(detail.inputContext, null, 2)}
            </pre>
          </Panel>

          <Panel title="推理过程">
            <p className="text-sm leading-7 text-slate-700">{detail.reasoning}</p>
          </Panel>

          <Panel title="决策结果">
            <pre className="overflow-x-auto rounded-lg bg-emerald-50 p-4 text-xs leading-6 text-emerald-900">
              {JSON.stringify(detail.decision, null, 2)}
            </pre>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="结果对照">
            <InfoRow label="预期效果" value={detail.expectedOutcome} />
            <InfoRow label="实际效果" value={detail.actualOutcome ?? '待执行完成'} />
            <InfoRow label="触发时间" value={new Date(detail.triggeredAt).toLocaleString('zh-CN')} />
            <InfoRow label="完成时间" value={new Date(detail.completedAt).toLocaleString('zh-CN')} />
          </Panel>

          <Panel title="异常标记">
            {detail.anomalyFlags.length === 0 ? (
              <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">当前无异常标记。</div>
            ) : (
              <ul className="space-y-2 text-sm text-slate-700">
                {detail.anomalyFlags.map((flag) => (
                  <li key={flag} className="rounded-lg bg-amber-50 px-4 py-3">
                    {flag}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </section>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-3 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm leading-6 text-slate-700">{value}</div>
    </div>
  )
}
