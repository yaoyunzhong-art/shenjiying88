"use client"

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StatusBadge, useToast } from '@m5/ui'
import type { RuleDetailSnapshotDelivery, RulePriority, RuleStatus } from './rule-detail-data'

interface RuleDetailClientProps {
  snapshot: RuleDetailSnapshotDelivery
}

const statusLabel: Record<RuleStatus, string> = {
  enabled: '已启用',
  disabled: '已停用',
  draft: '草稿',
  archived: '已归档',
}

const statusVariant: Record<RuleStatus, 'success' | 'neutral' | 'warning' | 'danger'> = {
  enabled: 'success',
  disabled: 'neutral',
  draft: 'warning',
  archived: 'danger',
}

const priorityLabel: Record<RulePriority, string> = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
}

export default function RuleDetailClient({ snapshot }: RuleDetailClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isRefreshing, startRefresh] = useTransition()
  const [detail, setDetail] = useState(snapshot.detail)

  const stats = useMemo(
    () => [
      { label: '触发次数', value: detail.triggerCount.toLocaleString('zh-CN') },
      { label: '成功率', value: `${detail.successRate}%` },
      { label: '最新版本', value: detail.version },
      { label: '最近触发', value: new Date(detail.lastTriggered).toLocaleString('zh-CN') },
    ],
    [detail]
  )

  function handleRefresh() {
    startRefresh(() => router.refresh())
    toast('规则详情快照已请求刷新')
  }

  function handleToggleStatus() {
    setDetail((current) => {
      if (current.status === 'enabled') {
        toast('规则已切换为停用状态')
        return { ...current, status: 'disabled', enabled: false, updatedAt: new Date().toISOString() }
      }
      toast('规则已切换为启用状态')
      return { ...current, status: 'enabled', enabled: true, updatedAt: new Date().toISOString() }
    })
  }

  function handleArchive() {
    setDetail((current) => ({ ...current, status: 'archived', enabled: false, updatedAt: new Date().toISOString() }))
    toast('规则已归档')
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Rule Detail</div>
            <h1 className="text-2xl font-semibold text-slate-900">{detail.name}</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">{detail.description}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <StatusBadge label={statusLabel[detail.status]} variant={statusVariant[detail.status]} dot />
              <span>分类 {detail.category}</span>
              <span>优先级 {priorityLabel[detail.priority]}</span>
              <span>创建人 {detail.createdBy}</span>
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
              onClick={handleToggleStatus}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
            >
              {detail.status === 'enabled' ? '停用规则' : '启用规则'}
            </button>
            <button
              type="button"
              onClick={handleArchive}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              归档规则
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
            <div className="mt-3 text-lg font-semibold text-slate-900">{item.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="规则配置">
            <Row label="触发条件" value={detail.condition} mono />
            <Row label="执行动作" value={detail.action} mono />
            <Row label="创建时间" value={new Date(detail.createdAt).toLocaleString('zh-CN')} />
            <Row label="更新时间" value={new Date(detail.updatedAt).toLocaleString('zh-CN')} />
          </Panel>

          <Panel title="时间线">
            <div className="space-y-4">
              {detail.timeline.map((item) => (
                <div key={`${item.time}-${item.label}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-900">{item.label}</div>
                  <div className="mt-1 text-xs text-slate-500">{new Date(item.time).toLocaleString('zh-CN')}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="防呆约束">
            <ul className="space-y-2 text-sm leading-6 text-slate-600">
              {detail.guardrails.map((item) => (
                <li key={item} className="rounded-lg bg-slate-50 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="近期信号">
            <ul className="space-y-2 text-sm leading-6 text-slate-600">
              {detail.recentSignals.map((item) => (
                <li key={item} className="rounded-lg bg-slate-50 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
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

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid gap-1 rounded-lg bg-slate-50 px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className={mono ? 'font-mono text-sm text-slate-900' : 'text-sm text-slate-700'}>{value}</div>
    </div>
  )
}
